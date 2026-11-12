import express from 'express';
import cors from 'cors';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { 
  analyzeCloudTrailEvent, 
  summarizeErrorTrends, 
  getUsageMetrics, 
  resetUsageMetrics,
  testAIConnection
} from './aiService.js';
import { getModelCatalogList, getModelMetadata } from './aiPricing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Admin credentials (can be customized via environment variables)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Active session tokens
const activeSessions = new Map();

app.use(compression());
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Persistent configuration
const CONFIG_FILE = path.resolve(__dirname, 'config.json');

function readSavedConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('[Config] Failed to read config.json:', err.message);
  }
  return {};
}

function saveConfig(updates) {
  try {
    const current = readSavedConfig();
    const merged = { ...current, ...updates };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf-8');
    return merged;
  } catch (err) {
    console.error('[Config] Failed to write config.json:', err.message);
    return null;
  }
}

// Initial default local path resolution
function findDefaultLocalPath() {
  const possiblePaths = [
    process.env.LOGS_DIR,
    path.resolve(__dirname, '..', 'AWSLogs'),
    path.resolve(__dirname, 'AWSLogs')
  ].filter(Boolean);

  for (const p of possiblePaths) {
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      return p;
    }
  }
  return path.resolve(__dirname, '..', 'AWSLogs');
}

// Global Sources and in-memory store
// sourceRecordsMap: sourceId -> Array of CloudTrail event records
const sourceRecordsMap = new Map();
let sourcesList = []; // Array of source metadata objects
let recordsStore = []; // Unified combined records from all sources
let recordsIndex = new Map(); // eventID -> record
let statsCache = null;

// Background S3 fetch state for real-time in-app loader and notifications
let activeFetchState = {
  isFetching: false,
  sourceId: null,
  sourceName: '',
  sourceType: '',
  progress: {
    current: 0,
    total: 0,
    percent: 0,
    message: ''
  },
  lastNotification: null,
  error: null
};

// Check for strictly supported log file extensions (.json or .json.gz)
function isSupportedLogFile(filename) {
  if (!filename) return false;
  const lower = filename.toLowerCase();
  return lower.endsWith('.json.gz') || lower.endsWith('.json');
}

// System/build directories to skip during deep recursive local scans
const SKIP_SCAN_DIRS = new Set([
  'node_modules', '.git', '$Recycle.Bin', 'System Volume Information',
  'Windows', 'Program Files', 'Program Files (x86)', 'ProgramData', 'AppData',
  'Recovery', 'proc', 'sys', 'dev'
]);

function scanLocalLogFiles(dir, depth = 0, maxDepth = 8) {
  let results = [];
  if (!dir || !fs.existsSync(dir) || depth > maxDepth) return results;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (SKIP_SCAN_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(scanLocalLogFiles(fullPath, depth + 1, maxDepth));
      } else if (isSupportedLogFile(entry.name)) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    // skip folders without permission
  }
  return results;
}

// Parse raw JSON into normalized CloudTrail records
function parseCloudTrailRecords(json, fileKey, sourceId, sourceType, sourceLocation, sourceName) {
  const loaded = [];
  if (!json) return loaded;

  let rawList = [];
  if (Array.isArray(json.Records)) {
    rawList = json.Records;
  } else if (Array.isArray(json)) {
    rawList = json.filter(r => r && typeof r === 'object' && (r.eventName || r.eventSource || r.eventTime || r.userIdentity));
  } else if (typeof json === 'object' && (json.eventName || json.eventSource || json.eventTime || json.userIdentity)) {
    rawList = [json];
  }

  for (let i = 0; i < rawList.length; i++) {
    const r = rawList[i];
    if (!r || typeof r !== 'object') continue;
    if (!r.eventName && !r.eventSource && !r.userIdentity && !r.eventTime) continue;

    const id = r.eventID || `${path.basename(fileKey)}_${i}_${r.eventTime || Date.now()}`;
    r._id = id;

    // Origin tracking
    r._sourceId = sourceId;
    r._sourceType = sourceType; // 'local' | 'cloud'
    r._sourceLocation = sourceLocation;
    r._sourceName = sourceName;

    // Normalize user name / principal for display
    const u = r.userIdentity || {};
    let principalName = 'Unknown';
    if (u.userName) {
      principalName = u.userName;
    } else if (u.arn) {
      const parts = u.arn.split('/');
      principalName = parts[parts.length - 1] || u.arn;
    } else if (u.type === 'Root') {
      principalName = 'Root Account';
    } else if (u.type === 'AWSService') {
      principalName = u.invokedBy || 'AWS Service';
    } else if (u.principalId) {
      principalName = u.principalId;
    }
    r._principalName = principalName;
    r._principalType = u.type || 'Unknown';
    r._hasError = Boolean(r.errorCode || r.errorMessage);

    // Normalize service name
    let serviceShort = (r.eventSource || '').replace('.amazonaws.com', '');
    r._serviceShort = serviceShort;

    loaded.push(r);
  }

  return loaded;
}

// Ingest a local filesystem directory source
function loadLocalSource(source) {
  const startTime = Date.now();
  const targetDir = source.path ? path.resolve(source.path) : null;

  if (!targetDir || !fs.existsSync(targetDir)) {
    source.status = 'error';
    source.errorMessage = `Directory does not exist: "${targetDir || 'None specified'}"`;
    source.fileCount = 0;
    source.recordCount = 0;
    source.lastFetchTime = new Date().toISOString();
    sourceRecordsMap.set(source.id, []);
    rebuildUnifiedStore();
    return false;
  }

  let stat;
  try {
    stat = fs.statSync(targetDir);
  } catch (err) {
    source.status = 'error';
    source.errorMessage = `Cannot access path: ${err.message}`;
    source.fileCount = 0;
    source.recordCount = 0;
    source.lastFetchTime = new Date().toISOString();
    sourceRecordsMap.set(source.id, []);
    rebuildUnifiedStore();
    return false;
  }

  if (!stat.isDirectory()) {
    source.status = 'error';
    source.errorMessage = `Specified path is a file, not a directory: "${targetDir}"`;
    source.fileCount = 0;
    source.recordCount = 0;
    source.lastFetchTime = new Date().toISOString();
    sourceRecordsMap.set(source.id, []);
    rebuildUnifiedStore();
    return false;
  }

  const files = scanLocalLogFiles(targetDir);
  if (files.length === 0) {
    source.status = 'empty';
    source.errorMessage = `Directory contains no supported CloudTrail log files (.json or .json.gz) in: "${targetDir}"`;
    source.fileCount = 0;
    source.recordCount = 0;
    source.lastFetchTime = new Date().toISOString();
    sourceRecordsMap.set(source.id, []);
    rebuildUnifiedStore();
    return true;
  }

  const records = [];
  for (const file of files) {
    try {
      const buffer = fs.readFileSync(file);
      let jsonString;

      if (file.toLowerCase().endsWith('.json.gz')) {
        const decompressed = zlib.gunzipSync(buffer);
        jsonString = decompressed.toString('utf-8');
      } else if (file.toLowerCase().endsWith('.json')) {
        jsonString = buffer.toString('utf-8');
      } else {
        continue;
      }

      const json = JSON.parse(jsonString);
      const parsed = parseCloudTrailRecords(
        json,
        file,
        source.id,
        'local',
        targetDir,
        source.name || path.basename(targetDir) || 'Local Files'
      );
      records.push(...parsed);
    } catch (err) {
      // continue parsing remaining files
    }
  }

  source.fileCount = files.length;
  source.recordCount = records.length;
  source.lastFetchTime = new Date().toISOString();

  if (records.length === 0) {
    source.status = 'empty';
    source.errorMessage = `Found ${files.length} .json / .json.gz files, but none contained valid CloudTrail event records.`;
  } else {
    source.status = 'loaded';
    source.errorMessage = null;
  }

  sourceRecordsMap.set(source.id, records);
  rebuildUnifiedStore();
  const elapsed = Date.now() - startTime;
  console.log(`[Local Source: ${source.name}] Loaded ${records.length} events from ${files.length} files in ${elapsed}ms`);
  return true;
}

// Ingest an AWS S3 bucket source asynchronously
async function loadS3Source(source) {
  const startTime = Date.now();
  const bucket = (source.bucket || '').trim();
  const prefix = (source.prefix || '').trim();
  const region = (source.region || 'us-east-1').trim();

  activeFetchState = {
    isFetching: true,
    sourceId: source.id,
    sourceName: source.name || `s3://${bucket}/${prefix}`,
    sourceType: 'cloud',
    progress: {
      current: 0,
      total: 0,
      percent: 0,
      message: `Connecting to AWS S3 bucket "${bucket}" in ${region}...`
    },
    lastNotification: {
      type: 'info',
      message: `Fetching CloudTrail logs from s3://${bucket}/${prefix}... Please wait.`,
      timestamp: new Date().toISOString()
    },
    error: null
  };

  source.status = 'fetching';
  source.lastFetchTime = new Date().toISOString();

  const s3Config = { region };
  if (source.accessKeyId && source.secretAccessKey) {
    s3Config.credentials = {
      accessKeyId: source.accessKeyId.trim(),
      secretAccessKey: source.secretAccessKey.trim()
    };
    if (source.sessionToken) {
      s3Config.credentials.sessionToken = source.sessionToken.trim();
    }
  }

  const s3 = new S3Client(s3Config);

  try {
    // 1. List objects matching CloudTrail extensions
    activeFetchState.progress.message = `Listing CloudTrail archives in s3://${bucket}/${prefix}...`;
    let isTruncated = true;
    let continuationToken = undefined;
    const logKeys = [];
    const MAX_KEYS = 1000; // safety ceiling

    while (isTruncated && logKeys.length < MAX_KEYS) {
      const listCmd = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix || undefined,
        ContinuationToken: continuationToken,
        MaxKeys: 300
      });

      const listRes = await s3.send(listCmd);
      const contents = listRes.Contents || [];

      for (const item of contents) {
        if (isSupportedLogFile(item.Key)) {
          logKeys.push(item.Key);
        }
      }

      isTruncated = listRes.IsTruncated && logKeys.length < MAX_KEYS;
      continuationToken = listRes.NextContinuationToken;
    }

    source.fileCount = logKeys.length;

    if (logKeys.length === 0) {
      source.status = 'empty';
      source.errorMessage = `Connected to s3://${bucket}, but found no .json or .json.gz files under prefix "${prefix || '/'}"`;
      source.recordCount = 0;
      sourceRecordsMap.set(source.id, []);
      rebuildUnifiedStore();

      activeFetchState.isFetching = false;
      activeFetchState.lastNotification = {
        type: 'warning',
        message: `No CloudTrail log files found in s3://${bucket}/${prefix || ''}`,
        timestamp: new Date().toISOString()
      };
      return;
    }

    activeFetchState.progress.total = logKeys.length;
    activeFetchState.progress.message = `Found ${logKeys.length} CloudTrail archives. Downloading & decompressing...`;

    // 2. Download and parse objects in parallel batches
    const BATCH_SIZE = 15;
    const records = [];

    for (let i = 0; i < logKeys.length; i += BATCH_SIZE) {
      const batch = logKeys.slice(i, i + BATCH_SIZE);
      activeFetchState.progress.current = i;
      activeFetchState.progress.percent = Math.round((i / logKeys.length) * 100);
      activeFetchState.progress.message = `Downloaded ${i} of ${logKeys.length} S3 archives (${activeFetchState.progress.percent}%)...`;

      const batchResults = await Promise.all(
        batch.map(async (key) => {
          try {
            const getCmd = new GetObjectCommand({ Bucket: bucket, Key: key });
            const getRes = await s3.send(getCmd);
            const chunks = [];
            for await (const chunk of getRes.Body) {
              chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            let jsonString;

            if (key.toLowerCase().endsWith('.json.gz')) {
              jsonString = zlib.gunzipSync(buffer).toString('utf-8');
            } else if (key.toLowerCase().endsWith('.json')) {
              jsonString = buffer.toString('utf-8');
            } else {
              return [];
            }

            const json = JSON.parse(jsonString);
            return parseCloudTrailRecords(
              json,
              key,
              source.id,
              'cloud',
              `s3://${bucket}/${key}`,
              source.name || `S3: ${bucket}`
            );
          } catch (itemErr) {
            console.warn(`[S3 Item Error] Key: ${key}:`, itemErr.message);
            return [];
          }
        })
      );

      for (const recList of batchResults) {
        records.push(...recList);
      }
    }

    source.recordCount = records.length;
    source.status = records.length > 0 ? 'loaded' : 'empty';
    source.errorMessage = records.length === 0 ? 'Downloaded archives contained no valid CloudTrail records.' : null;
    sourceRecordsMap.set(source.id, records);
    rebuildUnifiedStore();

    const elapsed = Date.now() - startTime;
    activeFetchState.isFetching = false;
    activeFetchState.progress.current = logKeys.length;
    activeFetchState.progress.percent = 100;
    activeFetchState.progress.message = `Completed! Ingested ${records.length} events from ${logKeys.length} S3 archives.`;
    activeFetchState.lastNotification = {
      type: 'success',
      message: `Successfully fetched and ingested ${records.length.toLocaleString()} events from s3://${bucket}/${prefix || ''} in ${Math.round(elapsed / 1000)}s!`,
      timestamp: new Date().toISOString()
    };
    console.log(`[S3 Source: ${source.name}] Ingested ${records.length} events from ${logKeys.length} files in ${elapsed}ms`);
  } catch (err) {
    console.error(`[S3 Error] Failed to fetch from s3://${bucket}:`, err.message);
    source.status = 'error';
    source.errorMessage = `S3 Fetch Failed: ${err.message}`;
    source.recordCount = 0;
    sourceRecordsMap.set(source.id, []);
    rebuildUnifiedStore();

    activeFetchState.isFetching = false;
    activeFetchState.error = err.message;
    activeFetchState.lastNotification = {
      type: 'error',
      message: `Failed to fetch from s3://${bucket}: ${err.message}`,
      timestamp: new Date().toISOString()
    };
  }
}

// Rebuild unified in-memory records and index from all sources
function rebuildUnifiedStore() {
  const combined = [];
  for (const [sourceId, recs] of sourceRecordsMap.entries()) {
    const srcMeta = sourcesList.find(s => s.id === sourceId);
    if (!srcMeta || srcMeta.enabled !== false) {
      combined.push(...recs);
    }
  }

  // Sort descending by eventTime
  combined.sort((a, b) => {
    const timeA = a.eventTime ? new Date(a.eventTime).getTime() : 0;
    const timeB = b.eventTime ? new Date(b.eventTime).getTime() : 0;
    return timeB - timeA;
  });

  recordsStore = combined;
  const index = new Map();
  for (const r of recordsStore) {
    index.set(r._id, r);
  }
  recordsIndex = index;

  computeStats();
  saveConfig({ sources: sourcesList });
}

function computeStats() {
  const total = recordsStore.length;
  let errorCount = 0;
  let readCount = 0;
  let writeCount = 0;
  let rootCount = 0;
  let localCount = 0;
  let cloudCount = 0;

  const serviceCounts = {};
  const regionCounts = {};
  const userCounts = {};
  const eventNameCounts = {};
  const errorCodeCounts = {};
  const timelineCounts = {};
  const hourlyCounts = {};
  const accountCounts = {};

  let minTime = null;
  let maxTime = null;

  for (const r of recordsStore) {
    if (r._sourceType === 'local') localCount++;
    if (r._sourceType === 'cloud') cloudCount++;

    if (r._hasError) errorCount++;
    if (r.readOnly === true) readCount++;
    else if (r.readOnly === false) writeCount++;

    if (r.userIdentity?.type === 'Root' || (r._principalName && r._principalName.includes('root'))) {
      rootCount++;
    }

    const acc = r.recipientAccountId || r.userIdentity?.accountId;
    if (acc) {
      accountCounts[acc] = (accountCounts[acc] || 0) + 1;
    }

    const service = r._serviceShort || 'unknown';
    serviceCounts[service] = (serviceCounts[service] || 0) + 1;

    const region = r.awsRegion || 'unknown';
    regionCounts[region] = (regionCounts[region] || 0) + 1;

    const user = r._principalName || 'unknown';
    userCounts[user] = (userCounts[user] || 0) + 1;

    const eventName = r.eventName || 'unknown';
    eventNameCounts[eventName] = (eventNameCounts[eventName] || 0) + 1;

    if (r.errorCode) {
      errorCodeCounts[r.errorCode] = (errorCodeCounts[r.errorCode] || 0) + 1;
    }

    if (r.eventTime) {
      if (!minTime || r.eventTime < minTime) minTime = r.eventTime;
      if (!maxTime || r.eventTime > maxTime) maxTime = r.eventTime;

      const dateKey = r.eventTime.slice(0, 10);
      timelineCounts[dateKey] = (timelineCounts[dateKey] || 0) + 1;

      const hourKey = r.eventTime.slice(0, 13) + ':00Z';
      hourlyCounts[hourKey] = (hourlyCounts[hourKey] || 0) + 1;
    }
  }

  const topServices = Object.entries(serviceCounts)
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count);

  const topRegions = Object.entries(regionCounts)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);

  const topUsers = Object.entries(userCounts)
    .map(([user, count]) => ({ user, count }))
    .sort((a, b) => b.count - a.count);

  const topEventNames = Object.entries(eventNameCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const topErrorCodes = Object.entries(errorCodeCounts)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count);

  const timeline = Object.entries(timelineCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const hourlyTimeline = Object.entries(hourlyCounts)
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => a.time.localeCompare(b.time));

  const topAccounts = Object.entries(accountCounts).sort((a, b) => b[1] - a[1]);
  const primaryAccountId = topAccounts[0] ? topAccounts[0][0] : null;
  const primaryRegion = topRegions[0] ? topRegions[0].region : null;

  statsCache = {
    total,
    localCount,
    cloudCount,
    errorCount,
    errorRate: total > 0 ? Number(((errorCount / total) * 100).toFixed(2)) : 0,
    readCount,
    writeCount,
    otherCount: total - readCount - writeCount,
    uniqueServicesCount: Object.keys(serviceCounts).length,
    uniqueRegionsCount: Object.keys(regionCounts).length,
    uniqueUsersCount: Object.keys(userCounts).length,
    primaryAccountId,
    primaryRegion,
    rootCount,
    minTime,
    maxTime,
    topServices,
    topRegions,
    topUsers,
    topEventNames,
    topErrorCodes,
    timeline,
    hourlyTimeline,
    sourcesSummary: sourcesList.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      location: s.location || s.path || `s3://${s.bucket}/${s.prefix || ''}`,
      status: s.status,
      recordCount: s.recordCount || 0,
      fileCount: s.fileCount || 0
    }))
  };
}

// Initial bootstrap of sources from config.json
function initializeSources() {
  const saved = readSavedConfig();
  if (Array.isArray(saved.sources) && saved.sources.length > 0) {
    sourcesList = saved.sources;
  } else {
    // Migration: initialize with the default local AWSLogs directory
    const defaultLocal = (saved.logsDir && fs.existsSync(saved.logsDir))
      ? saved.logsDir
      : findDefaultLocalPath();

    sourcesList = [
      {
        id: 'source-local-default',
        type: 'local',
        name: 'Local: AWSLogs',
        location: defaultLocal,
        path: defaultLocal,
        enabled: true,
        status: 'initializing',
        fileCount: 0,
        recordCount: 0,
        lastFetchTime: null
      }
    ];
  }

  // Load each initial source
  for (const src of sourcesList) {
    if (src.type === 'local') {
      loadLocalSource(src);
    }
  }
}

initializeSources();

// --- AUTH MIDDLEWARE & ENDPOINTS ---

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
  }

  const session = activeSessions.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }

  req.user = session;
  next();
}

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = crypto.randomBytes(32).toString('hex');
    const sessionData = {
      username: ADMIN_USERNAME,
      role: 'Administrator',
      signedInAt: new Date().toISOString()
    };
    activeSessions.set(token, sessionData);

    return res.json({
      success: true,
      message: 'Admin signed in successfully',
      token,
      user: sessionData
    });
  }

  return res.status(401).json({
    error: 'Invalid admin credentials. Please verify your username and password.'
  });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    activeSessions.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// --- MULTI-LOCATION SOURCES MANAGEMENT ENDPOINTS ---

// Get all active sources & status
app.get('/api/sources', authMiddleware, (req, res) => {
  res.json({
    sources: sourcesList,
    totalRecords: recordsStore.length,
    activeFetchState
  });
});

// Real-time polling endpoint for in-app S3 fetch notifications and progress loader
app.get('/api/sources/fetch-status', authMiddleware, (req, res) => {
  res.json(activeFetchState);
});

// Add or update a local folder source
app.post('/api/sources/local', authMiddleware, (req, res) => {
  const { path: newPath, name } = req.body || {};

  if (!newPath || typeof newPath !== 'string' || !newPath.trim()) {
    return res.json({
      success: false,
      error: 'Please provide a valid directory path.'
    });
  }

  const trimmed = newPath.trim();
  const resolved = path.resolve(trimmed);

  // Guard against root drive C:\ or /
  if (/^[a-zA-Z]:\\?$/.test(resolved) || resolved === '/' || resolved === '\\') {
    return res.json({
      success: false,
      error: `Scanning root drive "${resolved}" directly is disallowed. Please select a specific folder.`
    });
  }

  if (!fs.existsSync(resolved)) {
    return res.json({
      success: false,
      error: `Directory does not exist: "${resolved}". Please verify the folder path.`
    });
  }

  let stat;
  try {
    stat = fs.statSync(resolved);
  } catch (err) {
    return res.json({
      success: false,
      error: `Cannot access path "${resolved}": ${err.message}`
    });
  }

  if (!stat.isDirectory()) {
    return res.json({
      success: false,
      error: `The specified path is a file, not a directory: "${resolved}"`
    });
  }

  // Create new source object
  const sourceId = `source-local-${Date.now()}`;
  const sourceName = name?.trim() || `Local: ${path.basename(resolved) || 'AWSLogs'}`;

  const newSource = {
    id: sourceId,
    type: 'local',
    name: sourceName,
    location: resolved,
    path: resolved,
    enabled: true,
    status: 'loading',
    fileCount: 0,
    recordCount: 0,
    lastFetchTime: new Date().toISOString()
  };

  sourcesList.push(newSource);
  loadLocalSource(newSource);

  if (newSource.status === 'empty' || newSource.recordCount === 0) {
    return res.json({
      success: false,
      warning: newSource.errorMessage || 'No supported CloudTrail log files (.json or .json.gz) found.',
      source: newSource,
      stats: statsCache
    });
  }

  return res.json({
    success: true,
    message: `Successfully loaded ${newSource.recordCount} events from ${newSource.fileCount} archives in "${resolved}"`,
    source: newSource,
    stats: statsCache
  });
});

// Add an AWS S3 bucket source and start ingestion
app.post('/api/sources/s3', authMiddleware, (req, res) => {
  const {
    s3Uri,
    bucket: rawBucket,
    prefix: rawPrefix,
    region = 'us-east-1',
    accessKeyId,
    secretAccessKey,
    sessionToken,
    name
  } = req.body || {};

  let bucket = rawBucket ? rawBucket.trim() : '';
  let prefix = rawPrefix ? rawPrefix.trim() : '';

  // Parse s3:// URI if provided
  if (s3Uri && typeof s3Uri === 'string' && s3Uri.trim().startsWith('s3://')) {
    const cleaned = s3Uri.trim().replace(/^s3:\/\//, '');
    const parts = cleaned.split('/');
    bucket = parts[0];
    prefix = parts.slice(1).join('/');
  }

  if (!bucket) {
    return res.json({
      success: false,
      error: 'Please provide a valid S3 Bucket Name or s3:// URI (e.g. s3://my-bucket/AWSLogs).'
    });
  }

  // Normalize prefix
  if (prefix && prefix.startsWith('/')) {
    prefix = prefix.slice(1);
  }

  const sourceId = `source-s3-${Date.now()}`;
  const displayName = name?.trim() || `S3: ${bucket}${prefix ? '/' + prefix : ''}`;

  const newSource = {
    id: sourceId,
    type: 'cloud',
    name: displayName,
    location: `s3://${bucket}/${prefix}`,
    bucket,
    prefix,
    region: region.trim(),
    accessKeyId: accessKeyId ? accessKeyId.trim() : undefined,
    secretAccessKey: secretAccessKey ? secretAccessKey.trim() : undefined,
    sessionToken: sessionToken ? sessionToken.trim() : undefined,
    enabled: true,
    status: 'fetching',
    fileCount: 0,
    recordCount: 0,
    lastFetchTime: new Date().toISOString()
  };

  sourcesList.push(newSource);
  saveConfig({ sources: sourcesList });

  // Trigger S3 fetch in background so client gets instant response with progress state
  loadS3Source(newSource);

  return res.json({
    success: true,
    message: `Started fetching CloudTrail archives from s3://${bucket}/${prefix}. Please wait while data is downloaded.`,
    source: newSource,
    activeFetchState
  });
});

// Refresh a source (re-scan local or re-fetch S3)
app.post('/api/sources/:id/refresh', authMiddleware, (req, res) => {
  const { id } = req.params;
  const source = sourcesList.find(s => s.id === id);

  if (!source) {
    return res.status(404).json({ error: 'Source not found' });
  }

  if (source.type === 'local') {
    loadLocalSource(source);
    return res.json({
      success: true,
      message: `Refreshed local source "${source.name}". Loaded ${source.recordCount} events.`,
      source,
      stats: statsCache
    });
  } else if (source.type === 'cloud') {
    loadS3Source(source);
    return res.json({
      success: true,
      message: `Started refreshing S3 bucket source "${source.name}".`,
      source,
      activeFetchState
    });
  }

  res.json({ success: true });
});

// Delete a source
app.delete('/api/sources/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const index = sourcesList.findIndex(s => s.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Source not found' });
  }

  const removed = sourcesList.splice(index, 1)[0];
  sourceRecordsMap.delete(id);
  rebuildUnifiedStore();

  res.json({
    success: true,
    message: `Removed source "${removed.name}".`,
    sources: sourcesList,
    stats: statsCache
  });
});

// Legacy single-path endpoint for backwards compatibility
app.get('/api/logs/path', authMiddleware, (req, res) => {
  const primaryLocal = sourcesList.find(s => s.type === 'local') || sourcesList[0];
  res.json({
    configuredPath: primaryLocal?.location || '',
    resolvedPath: primaryLocal?.path ? path.resolve(primaryLocal.path) : null,
    exists: primaryLocal?.path ? fs.existsSync(primaryLocal.path) : false,
    status: primaryLocal?.status || 'empty',
    errorMessage: primaryLocal?.errorMessage || null,
    fileCount: primaryLocal?.fileCount || 0,
    recordCount: primaryLocal?.recordCount || 0,
    lastScanTime: primaryLocal?.lastFetchTime
  });
});

app.post('/api/logs/path', authMiddleware, (req, res) => {
  const { path: newPath } = req.body || {};
  if (!newPath || typeof newPath !== 'string' || !newPath.trim()) {
    return res.json({ success: false, error: 'Please provide a valid directory path.' });
  }

  const resolved = path.resolve(newPath.trim());
  let localSrc = sourcesList.find(s => s.type === 'local');

  if (!localSrc) {
    localSrc = {
      id: `source-local-${Date.now()}`,
      type: 'local',
      name: `Local: ${path.basename(resolved)}`,
      enabled: true
    };
    sourcesList.push(localSrc);
  }

  localSrc.path = resolved;
  localSrc.location = resolved;
  localSrc.name = `Local: ${path.basename(resolved)}`;

  loadLocalSource(localSrc);

  if (localSrc.status === 'empty' || localSrc.recordCount === 0) {
    return res.json({
      success: false,
      warning: localSrc.errorMessage,
      status: localSrc,
      stats: statsCache
    });
  }

  return res.json({
    success: true,
    message: `Loaded ${localSrc.recordCount} events from ${localSrc.fileCount} archives in "${resolved}"`,
    status: localSrc,
    stats: statsCache
  });
});

// Global Rescan / Refresh all enabled sources
app.post('/api/rescan', authMiddleware, async (req, res) => {
  for (const src of sourcesList) {
    if (src.enabled !== false) {
      if (src.type === 'local') {
        loadLocalSource(src);
      } else if (src.type === 'cloud') {
        loadS3Source(src);
      }
    }
  }

  res.json({
    success: true,
    message: `Rescanned all sources. Unified events in memory: ${recordsStore.length}.`,
    stats: statsCache,
    sources: sourcesList
  });
});

// --- DATA ENDPOINTS (Protected) ---

// High-level statistics
app.get('/api/stats', authMiddleware, (req, res) => {
  if (!statsCache) {
    computeStats();
  }
  res.json({
    ...statsCache,
    activeFetchState,
    sources: sourcesList
  });
});

// Filter options (services, regions, users, sources)
app.get('/api/filter-options', authMiddleware, (req, res) => {
  if (!statsCache) {
    computeStats();
  }
  res.json({
    services: (statsCache?.topServices || []).map(s => s.service),
    regions: (statsCache?.topRegions || []).map(r => r.region),
    users: (statsCache?.topUsers || []).map(u => u.user),
    sources: sourcesList.map(s => ({ id: s.id, name: s.name, type: s.type }))
  });
});

// Query events with pagination, sorting, search, and filters (including source filter!)
app.get('/api/events', authMiddleware, (req, res) => {
  const {
    page = 1,
    limit = 25,
    search = '',
    service = '',
    region = '',
    user = '',
    status = 'all',
    readOnly = 'all',
    sourceType = 'all', // 'all', 'local', 'cloud', or specific sourceId
    startDate = '',
    endDate = '',
    sortField = 'eventTime',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(200, Math.max(1, parseInt(limit, 10) || 25));
  const searchLower = (search || '').trim().toLowerCase();

  let filtered = recordsStore;

  // Source Type / Segregation Filter
  if (sourceType && sourceType !== 'all') {
    if (sourceType === 'local') {
      filtered = filtered.filter(r => r._sourceType === 'local');
    } else if (sourceType === 'cloud') {
      filtered = filtered.filter(r => r._sourceType === 'cloud');
    } else {
      filtered = filtered.filter(r => r._sourceId === sourceType);
    }
  }

  // Search filter
  if (searchLower) {
    filtered = filtered.filter(r => {
      const name = (r.eventName || '').toLowerCase();
      const src = (r.eventSource || '').toLowerCase();
      const usr = (r._principalName || '').toLowerCase();
      const ip = (r.sourceIPAddress || '').toLowerCase();
      const err = (r.errorCode || '').toLowerCase();
      const errMsg = (r.errorMessage || '').toLowerCase();
      const id = (r.eventID || '').toLowerCase();
      const reqId = (r.requestID || '').toLowerCase();
      const srcName = (r._sourceName || '').toLowerCase();

      return name.includes(searchLower) ||
        src.includes(searchLower) ||
        usr.includes(searchLower) ||
        ip.includes(searchLower) ||
        err.includes(searchLower) ||
        errMsg.includes(searchLower) ||
        id.includes(searchLower) ||
        reqId.includes(searchLower) ||
        srcName.includes(searchLower);
    });
  }

  // Service filter
  if (service && service !== 'all') {
    filtered = filtered.filter(r => r._serviceShort === service || r.eventSource === service);
  }

  // Region filter
  if (region && region !== 'all') {
    filtered = filtered.filter(r => r.awsRegion === region);
  }

  // User / Principal filter
  if (user && user !== 'all') {
    filtered = filtered.filter(r => r._principalName === user);
  }

  // Status filter
  if (status === 'error') {
    filtered = filtered.filter(r => r._hasError);
  } else if (status === 'success') {
    filtered = filtered.filter(r => !r._hasError);
  }

  // ReadOnly filter
  if (readOnly === 'read') {
    filtered = filtered.filter(r => r.readOnly === true);
  } else if (readOnly === 'write') {
    filtered = filtered.filter(r => r.readOnly === false);
  }

  // Date range filter
  if (startDate) {
    filtered = filtered.filter(r => r.eventTime && r.eventTime >= startDate);
  }
  if (endDate) {
    const endISO = endDate.length === 10 ? `${endDate}T23:59:59Z` : endDate;
    filtered = filtered.filter(r => r.eventTime && r.eventTime <= endISO);
  }

  // Sorting
  const sortMult = sortOrder === 'asc' ? 1 : -1;
  filtered.sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === '_principalName' || sortField === 'user') {
      valA = a._principalName;
      valB = b._principalName;
    } else if (sortField === 'service') {
      valA = a._serviceShort;
      valB = b._serviceShort;
    } else if (sortField === 'status') {
      valA = a._hasError ? 1 : 0;
      valB = b._hasError ? 1 : 0;
    } else if (sortField === 'source') {
      valA = a._sourceType;
      valB = b._sourceType;
    }

    if (valA === undefined || valA === null) valA = '';
    if (valB === undefined || valB === null) valB = '';

    if (typeof valA === 'string') {
      return valA.localeCompare(valB) * sortMult;
    }
    return (valA > valB ? 1 : valA < valB ? -1 : 0) * sortMult;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (pageNum - 1) * pageSize;
  const pagedRecords = filtered.slice(startIndex, startIndex + pageSize);

  const tableRows = pagedRecords.map(r => ({
    _id: r._id,
    eventID: r.eventID,
    eventTime: r.eventTime,
    eventName: r.eventName,
    eventSource: r.eventSource,
    service: r._serviceShort,
    awsRegion: r.awsRegion,
    sourceIPAddress: r.sourceIPAddress,
    principalName: r._principalName,
    principalType: r._principalType,
    hasError: r._hasError,
    errorCode: r.errorCode,
    errorMessage: r.errorMessage,
    readOnly: r.readOnly,
    eventType: r.eventType,
    requestID: r.requestID,
    sourceType: r._sourceType, // 'local' | 'cloud'
    sourceName: r._sourceName,
    sourceLocation: r._sourceLocation
  }));

  res.json({
    records: tableRows,
    pagination: {
      total,
      page: pageNum,
      limit: pageSize,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    },
    sources: sourcesList,
    activeFetchState
  });
});

// Single event full details
app.get('/api/events/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const record = recordsIndex.get(id);

  if (!record) {
    return res.status(404).json({ error: 'Event not found' });
  }

  res.json(record);
});

// Export filtered events as CSV or JSON
app.get('/api/export', authMiddleware, (req, res) => {
  const {
    format = 'csv',
    search = '',
    service = '',
    region = '',
    user = '',
    status = 'all',
    readOnly = 'all',
    sourceType = 'all',
    startDate = '',
    endDate = ''
  } = req.query;

  const searchLower = (search || '').trim().toLowerCase();
  let filtered = recordsStore;

  if (sourceType && sourceType !== 'all') {
    if (sourceType === 'local') filtered = filtered.filter(r => r._sourceType === 'local');
    else if (sourceType === 'cloud') filtered = filtered.filter(r => r._sourceType === 'cloud');
    else filtered = filtered.filter(r => r._sourceId === sourceType);
  }

  if (searchLower) {
    filtered = filtered.filter(r => {
      const name = (r.eventName || '').toLowerCase();
      const src = (r.eventSource || '').toLowerCase();
      const usr = (r._principalName || '').toLowerCase();
      const ip = (r.sourceIPAddress || '').toLowerCase();
      const err = (r.errorCode || '').toLowerCase();
      const id = (r.eventID || '').toLowerCase();
      return name.includes(searchLower) || src.includes(searchLower) || usr.includes(searchLower) || ip.includes(searchLower) || err.includes(searchLower) || id.includes(searchLower);
    });
  }

  if (service && service !== 'all') filtered = filtered.filter(r => r._serviceShort === service || r.eventSource === service);
  if (region && region !== 'all') filtered = filtered.filter(r => r.awsRegion === region);
  if (user && user !== 'all') filtered = filtered.filter(r => r._principalName === user);
  if (status === 'error') filtered = filtered.filter(r => r._hasError);
  else if (status === 'success') filtered = filtered.filter(r => !r._hasError);
  if (readOnly === 'read') filtered = filtered.filter(r => r.readOnly === true);
  else if (readOnly === 'write') filtered = filtered.filter(r => r.readOnly === false);
  if (startDate) filtered = filtered.filter(r => r.eventTime && r.eventTime >= startDate);
  if (endDate) {
    const endISO = endDate.length === 10 ? `${endDate}T23:59:59Z` : endDate;
    filtered = filtered.filter(r => r.eventTime && r.eventTime <= endISO);
  }

  if (format === 'json') {
    res.setHeader('Content-Disposition', 'attachment; filename="cloudtrail_export.json"');
    res.setHeader('Content-Type', 'application/json');
    return res.json(filtered);
  }

  // Format CSV
  res.setHeader('Content-Disposition', 'attachment; filename="cloudtrail_export.csv"');
  res.setHeader('Content-Type', 'text/csv');

  const headers = ['EventTime', 'EventName', 'Service', 'Principal', 'Region', 'SourceIP', 'Status', 'ErrorCode', 'ReadOnly', 'SourceType', 'SourceName', 'EventID'];
  const rows = [headers.join(',')];

  for (const r of filtered) {
    const fields = [
      `"${r.eventTime || ''}"`,
      `"${(r.eventName || '').replace(/"/g, '""')}"`,
      `"${r._serviceShort || ''}"`,
      `"${(r._principalName || '').replace(/"/g, '""')}"`,
      `"${r.awsRegion || ''}"`,
      `"${r.sourceIPAddress || ''}"`,
      `"${r._hasError ? 'ERROR' : 'SUCCESS'}"`,
      `"${(r.errorCode || '').replace(/"/g, '""')}"`,
      `"${r.readOnly === true ? 'Read' : r.readOnly === false ? 'Write' : 'Unknown'}"`,
      `"${r._sourceType || 'local'}"`,
      `"${(r._sourceName || '').replace(/"/g, '""')}"`,
      `"${r.eventID || ''}"`
    ];
    rows.push(fields.join(','));
  }

  res.send(rows.join('\n'));
});

// ==========================================
// AI Error Analysis & Cost Intelligence APIs
// ==========================================

// Get available AI models and rate cards
app.get('/api/ai/models', authMiddleware, (req, res) => {
  res.json({
    models: getModelCatalogList()
  });
});

// Get active AI configuration
app.get('/api/ai/config', authMiddleware, (req, res) => {
  const savedConfig = readSavedConfig();
  const aiConf = savedConfig.ai || {};

  const hasGeminiKey = !!(aiConf.geminiApiKey || process.env.GEMINI_API_KEY);
  const hasAwsCreds = !!(
    (aiConf.awsAccessKeyId && aiConf.awsSecretAccessKey) ||
    (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
  );

  res.json({
    provider: aiConf.provider || 'gemini',
    geminiModel: aiConf.geminiModel || 'gemini-3.8-flash',
    bedrockModel: aiConf.bedrockModel || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    bedrockRegion: aiConf.bedrockRegion || process.env.AWS_REGION || 'us-east-1',
    hasGeminiKey,
    hasAwsCreds,
    geminiApiKey: aiConf.geminiApiKey || null,
    geminiKeySource: aiConf.geminiApiKey ? 'saved_config' : (process.env.GEMINI_API_KEY ? 'env_variable' : null),
    maskedGeminiKey: aiConf.geminiApiKey 
      ? `${aiConf.geminiApiKey.substring(0, 6)}...${aiConf.geminiApiKey.substring(aiConf.geminiApiKey.length - 4)}` 
      : (process.env.GEMINI_API_KEY ? 'Configured via .env' : null),
    awsAccessKeyId: aiConf.awsAccessKeyId ? `${aiConf.awsAccessKeyId.substring(0, 4)}...${aiConf.awsAccessKeyId.substring(aiConf.awsAccessKeyId.length - 4)}` : null,
    awsCredsSource: (aiConf.awsAccessKeyId && aiConf.awsSecretAccessKey) ? 'saved_config' : ((process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ? 'env_variable' : null)
  });
});

// Test connection to AI provider
app.post('/api/ai/test-connection', authMiddleware, async (req, res) => {
  try {
    const { provider, geminiApiKey, bedrockRegion, modelId } = req.body;
    const savedConfig = readSavedConfig();
    const aiConf = savedConfig.ai || {};
    const activeProvider = provider || aiConf.provider || 'gemini';

    const testRes = await testAIConnection({
      provider: activeProvider,
      apiKey: geminiApiKey || aiConf.geminiApiKey || process.env.GEMINI_API_KEY,
      modelId: modelId || (activeProvider === 'gemini' ? aiConf.geminiModel : aiConf.bedrockModel),
      region: bedrockRegion || aiConf.bedrockRegion || process.env.AWS_REGION,
      credentials: (aiConf.awsAccessKeyId && aiConf.awsSecretAccessKey) ? {
        accessKeyId: aiConf.awsAccessKeyId,
        secretAccessKey: aiConf.awsSecretAccessKey
      } : undefined
    });

    res.json(testRes);
  } catch (err) {
    console.error('[AI Test Connection Error]:', err.message);
    res.status(400).json({ success: false, error: err.message || 'Connection test failed' });
  }
});

// Delete saved credentials for a specific AI provider
app.delete('/api/ai/key/:provider', authMiddleware, (req, res) => {
  const { provider } = req.params;
  const current = readSavedConfig();
  const existingAi = current.ai || {};
  if (provider === 'gemini') {
    delete existingAi.geminiApiKey;
  } else if (provider === 'bedrock') {
    delete existingAi.awsAccessKeyId;
    delete existingAi.awsSecretAccessKey;
  }
  saveConfig({ ai: existingAi });
  res.json({ success: true, message: `${provider} credentials removed successfully.` });
});

// Update AI configuration
app.post('/api/ai/config', authMiddleware, (req, res) => {
  const { provider, geminiModel, bedrockModel, geminiApiKey, bedrockRegion, awsAccessKeyId, awsSecretAccessKey } = req.body;
  const current = readSavedConfig();
  const existingAi = current.ai || {};

  const updatedAi = {
    ...existingAi,
    provider: provider || existingAi.provider || 'gemini',
    geminiModel: geminiModel || existingAi.geminiModel || 'gemini-3.8-flash',
    bedrockModel: bedrockModel || existingAi.bedrockModel || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    bedrockRegion: bedrockRegion || existingAi.bedrockRegion || 'us-east-1'
  };

  if (geminiApiKey !== undefined) {
    if (geminiApiKey.trim() === '') delete updatedAi.geminiApiKey;
    else updatedAi.geminiApiKey = geminiApiKey.trim();
  }

  if (awsAccessKeyId !== undefined) updatedAi.awsAccessKeyId = awsAccessKeyId.trim();
  if (awsSecretAccessKey !== undefined) updatedAi.awsSecretAccessKey = awsSecretAccessKey.trim();

  saveConfig({ ai: updatedAi });
  res.json({ success: true, config: updatedAi });
});

// Analyze a specific failed CloudTrail event record
app.post('/api/ai/analyze-event', authMiddleware, async (req, res) => {
  try {
    const { eventId, event: directEvent, provider, modelId } = req.body;
    const event = directEvent || (eventId ? recordsIndex.get(eventId) : null);
    
    if (!event) {
      return res.status(404).json({ error: 'CloudTrail event record not found' });
    }

    const savedConfig = readSavedConfig();
    const aiConf = savedConfig.ai || {};
    const activeProvider = provider || aiConf.provider || 'gemini';
    const activeModel = modelId || (activeProvider === 'gemini' 
      ? (aiConf.geminiModel || 'gemini-3.8-flash') 
      : (aiConf.bedrockModel || 'anthropic.claude-3-5-sonnet-20241022-v2:0'));

    const diagnosis = await analyzeCloudTrailEvent({
      event,
      provider: activeProvider,
      modelId: activeModel,
      config: {
        geminiApiKey: aiConf.geminiApiKey || process.env.GEMINI_API_KEY,
        bedrockRegion: aiConf.bedrockRegion || process.env.AWS_REGION || 'us-east-1',
        awsCredentials: (aiConf.awsAccessKeyId && aiConf.awsSecretAccessKey) ? {
          accessKeyId: aiConf.awsAccessKeyId,
          secretAccessKey: aiConf.awsSecretAccessKey
        } : undefined
      }
    });

    res.json(diagnosis);
  } catch (err) {
    console.error('[AI Analysis Error]:', err.message);
    res.status(500).json({ error: err.message || 'AI root cause diagnosis failed' });
  }
});

// Generate executive error summary across all ingested failures
app.post('/api/ai/summarize-errors', authMiddleware, async (req, res) => {
  try {
    const { provider, modelId } = req.body;
    const savedConfig = readSavedConfig();
    const aiConf = savedConfig.ai || {};
    const activeProvider = provider || aiConf.provider || 'gemini';
    const activeModel = modelId || (activeProvider === 'gemini' 
      ? (aiConf.geminiModel || 'gemini-3.8-flash') 
      : (aiConf.bedrockModel || 'anthropic.claude-3-5-sonnet-20241022-v2:0'));

    const errorRecords = recordsStore.filter(r => r._hasError);
    if (errorRecords.length === 0) {
      return res.json({
        success: true,
        summary: {
          executiveSummary: 'No failed API requests or errors detected across the configured CloudTrail logs. All recorded operations succeeded with 0% error rate.',
          topFailureCategories: [],
          threatIndicators: [],
          actionPlan: ['Continue regular monitoring and log ingestion.']
        },
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, costUSD: 0, latencyMs: 0 }
      });
    }

    if (!statsCache) {
      computeStats();
    }
    const stats = statsCache || {};

    const summary = await summarizeErrorTrends({
      errorEvents: errorRecords,
      stats,
      provider: activeProvider,
      modelId: activeModel,
      config: {
        geminiApiKey: aiConf.geminiApiKey || process.env.GEMINI_API_KEY,
        bedrockRegion: aiConf.bedrockRegion || process.env.AWS_REGION || 'us-east-1',
        awsCredentials: (aiConf.awsAccessKeyId && aiConf.awsSecretAccessKey) ? {
          accessKeyId: aiConf.awsAccessKeyId,
          secretAccessKey: aiConf.awsSecretAccessKey
        } : undefined
      }
    });

    res.json(summary);
  } catch (err) {
    console.error('[AI Summary Error]:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate AI executive error summary' });
  }
});

// Get AI usage metrics, cost breakdown, and transaction logs
app.get('/api/ai/usage', authMiddleware, (req, res) => {
  res.json(getUsageMetrics());
});

// Reset AI usage logs and counter
app.delete('/api/ai/usage', authMiddleware, (req, res) => {
  res.json(resetUsageMetrics());
});

// Serve frontend build in production
const distDir = path.resolve(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  console.log(`[CloudTrail Analyzer] Serving static client from: ${distDir}`);
  app.use(express.static(distDir));
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 AWS CloudTrail Dashboard Server running on: http://localhost:${PORT}`);
  console.log(`🔑 Admin credentials: Username: "${ADMIN_USERNAME}" | Password: "${ADMIN_PASSWORD}"`);
  console.log(`📁 Configured sources: ${sourcesList.length}`);
  console.log(`📊 Unified records in memory: ${recordsStore.length}`);
  console.log('====================================================');
});

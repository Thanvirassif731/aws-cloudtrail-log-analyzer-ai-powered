import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { calculateCost, getModelMetadata } from './aiPricing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Persistence file for AI token usage and costs
const USAGE_FILE = path.resolve(__dirname, 'ai_usage.json');

// In-memory cache to prevent duplicate billing for identical errors
const diagnosisCache = new Map();

/**
 * Reads usage records from disk
 */
function readUsageStore() {
  try {
    if (fs.existsSync(USAGE_FILE)) {
      const data = fs.readFileSync(USAGE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('[AI Service] Failed to read ai_usage.json:', err.message);
  }
  return { logs: [], summary: { totalAnalyses: 0, totalTokens: 0, promptTokens: 0, completionTokens: 0, totalCostUSD: 0 } };
}

/**
 * Saves usage records to disk
 */
function saveUsageStore(store) {
  try {
    fs.writeFileSync(USAGE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[AI Service] Failed to save ai_usage.json:', err.message);
  }
}

/**
 * Records a single AI usage transaction
 */
function recordTransaction({ provider, model, action, eventName, errorCode, promptTokens, completionTokens, latencyMs, success, errorMsg }) {
  const store = readUsageStore();
  const totalTokens = (promptTokens || 0) + (completionTokens || 0);
  const costUSD = calculateCost(model, promptTokens || 0, completionTokens || 0);

  const entry = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    provider,
    model,
    action,
    eventName: eventName || 'N/A',
    errorCode: errorCode || 'N/A',
    promptTokens: promptTokens || 0,
    completionTokens: completionTokens || 0,
    totalTokens,
    costUSD,
    latencyMs: latencyMs || 0,
    success: !!success,
    errorMsg: errorMsg || null
  };

  store.logs.unshift(entry);
  // Keep last 1,000 logs
  if (store.logs.length > 1000) {
    store.logs = store.logs.slice(0, 1000);
  }

  // Update cumulative totals
  if (!store.summary) {
    store.summary = { totalAnalyses: 0, totalTokens: 0, promptTokens: 0, completionTokens: 0, totalCostUSD: 0 };
  }

  if (success) {
    store.summary.totalAnalyses += 1;
    store.summary.totalTokens += totalTokens;
    store.summary.promptTokens += (promptTokens || 0);
    store.summary.completionTokens += (completionTokens || 0);
    store.summary.totalCostUSD = Number((store.summary.totalCostUSD + costUSD).toFixed(7));
  }

  saveUsageStore(store);
  return entry;
}

/**
 * Get cumulative usage summary & recent logs
 */
export function getUsageMetrics() {
  const store = readUsageStore();
  const logs = store.logs || [];
  const summary = store.summary || { totalAnalyses: 0, totalTokens: 0, promptTokens: 0, completionTokens: 0, totalCostUSD: 0 };

  // Breakdown by provider
  const providerBreakdown = {
    gemini: { count: 0, tokens: 0, costUSD: 0 },
    bedrock: { count: 0, tokens: 0, costUSD: 0 }
  };

  // Breakdown by model
  const modelBreakdown = {};

  for (const log of logs) {
    if (!log.success) continue;
    
    // Provider
    const p = log.provider || 'gemini';
    if (!providerBreakdown[p]) providerBreakdown[p] = { count: 0, tokens: 0, costUSD: 0 };
    providerBreakdown[p].count += 1;
    providerBreakdown[p].tokens += log.totalTokens;
    providerBreakdown[p].costUSD = Number((providerBreakdown[p].costUSD + log.costUSD).toFixed(7));

    // Model
    const m = log.model || 'unknown';
    if (!modelBreakdown[m]) modelBreakdown[m] = { count: 0, tokens: 0, costUSD: 0 };
    modelBreakdown[m].count += 1;
    modelBreakdown[m].tokens += log.totalTokens;
    modelBreakdown[m].costUSD = Number((modelBreakdown[m].costUSD + log.costUSD).toFixed(7));
  }

  return {
    summary,
    providerBreakdown,
    modelBreakdown,
    recentLogs: logs.slice(0, 100)
  };
}

/**
 * Clears recorded logs and resets summary
 */
export function resetUsageMetrics() {
  saveUsageStore({ logs: [], summary: { totalAnalyses: 0, totalTokens: 0, promptTokens: 0, completionTokens: 0, totalCostUSD: 0 } });
  diagnosisCache.clear();
  return { success: true };
}

/**
 * Strips markdown code fence if AI formats output in ```json ... ```
 */
function cleanJsonOutput(text) {
  if (!text) return '{}';
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

/**
 * Executes a prompt with Google Gemini API
 */
async function callGemini({ prompt, systemPrompt, modelId, apiKey }) {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('Gemini API Key is not configured. Please add GEMINI_API_KEY to your .env file or enter it in AI Settings.');
  }

  const ai = new GoogleGenAI({ apiKey: key });
  const model = modelId || 'gemini-3.8-flash';

  const executeCall = async (targetModel) => {
    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: targetModel,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json'
      }
    });
    const latencyMs = Date.now() - startTime;

    const text = response.text || cleanJsonOutput(response.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
    const usage = response.usageMetadata || {};

    return {
      rawText: text,
      promptTokens: usage.promptTokenCount || 0,
      completionTokens: usage.candidatesTokenCount || 0,
      totalTokens: usage.totalTokenCount || 0,
      latencyMs
    };
  };

  try {
    return await executeCall(model);
  } catch (err) {
    // If 503 unavailable / high demand, try alternative Gemini model fallback once
    const isHighDemand = err.message && (err.message.includes('503') || err.message.includes('high demand') || err.message.includes('UNAVAILABLE'));
    if (isHighDemand) {
      const fallbackModel = model === 'gemini-3.5-flash-lite' ? 'gemini-3.8-flash' : 'gemini-3.5-flash-lite';
      try {
        console.warn(`[AI Gemini Fallback] ${model} experienced temporary high demand (503). Retrying with ${fallbackModel}...`);
        return await executeCall(fallbackModel);
      } catch {
        throw new Error('Google Gemini is currently experiencing high demand. Please try again in a few moments or switch models in AI Settings.');
      }
    }
    throw err;
  }
}

/**
 * Executes a prompt with AWS Bedrock API
 */
async function callBedrock({ prompt, systemPrompt, modelId, region, credentials }) {
  const awsRegion = region || process.env.AWS_REGION || 'us-east-1';
  
  const clientConfig = { region: awsRegion };
  if (credentials && credentials.accessKeyId && credentials.secretAccessKey) {
    clientConfig.credentials = {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey
    };
  }

  const client = new BedrockRuntimeClient(clientConfig);
  const model = modelId || 'anthropic.claude-3-5-sonnet-20241022-v2:0';

  const command = new ConverseCommand({
    modelId: model,
    messages: [
      {
        role: 'user',
        content: [{ text: prompt }]
      }
    ],
    system: systemPrompt ? [{ text: systemPrompt }] : undefined
  });

  const startTime = Date.now();
  const response = await client.send(command);
  const latencyMs = Date.now() - startTime;

  const text = response.output?.message?.content?.[0]?.text || '{}';
  const usage = response.usage || {};

  return {
    rawText: cleanJsonOutput(text),
    promptTokens: usage.inputTokens || 0,
    completionTokens: usage.outputTokens || 0,
    totalTokens: usage.totalTokens || 0,
    latencyMs
  };
}

/**
 * Analyzes a single failed CloudTrail event record
 */
export async function analyzeCloudTrailEvent({ event, provider = 'gemini', modelId, config = {} }) {
  if (!event) {
    throw new Error('Event object is required for AI analysis');
  }

  const activeProvider = provider || 'gemini';
  const activeModel = modelId || (activeProvider === 'gemini' ? 'gemini-3.8-flash' : 'anthropic.claude-3-5-sonnet-20241022-v2:0');

  // Compute cache key based on event error characteristics
  const cacheKey = `${activeProvider}:${activeModel}:${event.eventName}:${event.errorCode}:${(event.errorMessage || '').substring(0, 80)}`;
  if (diagnosisCache.has(cacheKey)) {
    const cached = diagnosisCache.get(cacheKey);
    return {
      ...cached,
      cached: true
    };
  }

  const systemPrompt = `You are a Principal AWS Cloud Security and IAM Architect.
Your task is to analyze failed AWS CloudTrail API events and provide an authoritative, deep root-cause explanation and remediation guide.
Always return your analysis strictly as a JSON object matching this schema:
{
  "rootCause": "Clear, plain-English explanation of why this AWS API call failed.",
  "failedAction": "Specific IAM action that failed (e.g., s3:GetObject, kms:Decrypt)",
  "resourceAffected": "Target resource ARN, bucket name, or resource ID involved",
  "identityContext": "Who made the call (Principal ARN, Account ID, IAM role/user type)",
  "remediation": {
    "summary": "1-2 sentence description of the required fix",
    "policyJson": "Copy-paste ready AWS IAM Policy JSON statement granting minimal least-privilege permissions, or null if not applicable",
    "cliCommand": "AWS CLI command to verify or fix this permission, or null if not applicable",
    "bestPractice": "Key security architecture recommendation to prevent recurrence"
  },
  "securityRisk": {
    "level": "Low | Medium | High | Critical",
    "reason": "Threat assessment explaining if this is benign misconfiguration or potential malicious lateral movement/reconnaissance"
  }
}`;

  const prompt = `Analyze this AWS CloudTrail failed API request:
Event Name: ${event.eventName || 'Unknown'}
AWS Service: ${event.eventSource || 'Unknown'}
AWS Region: ${event.awsRegion || 'Unknown'}
Error Code: ${event.errorCode || 'None'}
Error Message: ${event.errorMessage || 'None provided'}
Principal Identity: ${JSON.stringify(event.userIdentity || event._principalName || 'Unknown')}
Source IP Address: ${event.sourceIPAddress || 'Unknown'}
User Agent: ${event.userAgent || 'Unknown'}
Request Parameters: ${JSON.stringify(event.requestParameters || {})}
Response Elements: ${JSON.stringify(event.responseElements || {})}

Provide the deep root-cause analysis, missing IAM permissions, copyable IAM JSON remediation, and security severity.`;

  try {
    let result;
    if (activeProvider === 'gemini') {
      result = await callGemini({
        prompt,
        systemPrompt,
        modelId: activeModel,
        apiKey: config.geminiApiKey
      });
    } else {
      result = await callBedrock({
        prompt,
        systemPrompt,
        modelId: activeModel,
        region: config.bedrockRegion,
        credentials: config.awsCredentials
      });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(result.rawText);
    } catch (parseErr) {
      console.warn('[AI Service] JSON parse fallback on raw output:', result.rawText);
      parsedData = {
        rootCause: result.rawText,
        failedAction: event.eventName || 'N/A',
        resourceAffected: 'See request parameters',
        identityContext: event._principalName || 'Unknown',
        remediation: {
          summary: 'Review IAM policies for the calling identity.',
          policyJson: null,
          cliCommand: null,
          bestPractice: 'Enforce least privilege access.'
        },
        securityRisk: {
          level: 'Medium',
          reason: 'Automated parsing fallback'
        }
      };
    }

    const tx = recordTransaction({
      provider: activeProvider,
      model: activeModel,
      action: 'event_analysis',
      eventName: event.eventName,
      errorCode: event.errorCode,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      latencyMs: result.latencyMs,
      success: true
    });

    const responsePayload = {
      success: true,
      cached: false,
      provider: activeProvider,
      model: activeModel,
      modelMeta: getModelMetadata(activeModel),
      diagnosis: parsedData,
      usage: {
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        totalTokens: result.totalTokens,
        costUSD: tx.costUSD,
        latencyMs: result.latencyMs
      }
    };

    diagnosisCache.set(cacheKey, responsePayload);
    return responsePayload;
  } catch (err) {
    recordTransaction({
      provider: activeProvider,
      model: activeModel,
      action: 'event_analysis',
      eventName: event.eventName,
      errorCode: event.errorCode,
      promptTokens: 0,
      completionTokens: 0,
      latencyMs: 0,
      success: false,
      errorMsg: err.message
    });
    throw err;
  }
}

/**
 * Generates an executive summary of error trends across all logs
 */
export async function summarizeErrorTrends({ errorEvents = [], stats = {}, provider = 'gemini', modelId, config = {} }) {
  const activeProvider = provider || 'gemini';
  const activeModel = modelId || (activeProvider === 'gemini' ? 'gemini-3.8-flash' : 'anthropic.claude-3-5-sonnet-20241022-v2:0');

  // Sample up to 20 representative error events
  const sampleErrors = errorEvents.slice(0, 20).map(e => ({
    time: e.eventTime,
    event: e.eventName,
    service: e._serviceShort || e.eventSource,
    code: e.errorCode,
    msg: e.errorMessage,
    user: e._principalName,
    ip: e.sourceIPAddress
  }));

  const systemPrompt = `You are an AWS Cloud Security Chief Information Security Officer (CISO).
Your job is to provide an executive summary of failed API calls, access denials, and systemic anomalies observed in AWS CloudTrail audit logs.
Always return your response strictly as a JSON object matching this schema:
{
  "executiveSummary": "2-3 paragraphs providing an overarching assessment of security posture, error velocity, and systemic risks.",
  "topFailureCategories": [
    {
      "category": "e.g. Expired STS Session Tokens, Missing KMS Decrypt, Unauthorized S3 Access",
      "count": "Estimated scale or frequency",
      "impact": "Operational or security impact",
      "recommendation": "Prescriptive remediation step"
    }
  ],
  "threatIndicators": [
    {
      "indicator": "e.g. Root Account Login Failure, Brute-Force STS AssumeRole, IAM Privilege Escalation",
      "severity": "Low | Medium | High | Critical",
      "details": "Specific evidence found in the logs"
    }
  ],
  "actionPlan": [
    "Prioritized step 1 for security operations team",
    "Prioritized step 2",
    "Prioritized step 3"
  ]
}`;

  const prompt = `Analyze these CloudTrail error statistics and representative failures:
Total Ingested Events: ${stats.total || 'Unknown'}
Total Failed Requests: ${stats.errorCount || 'Unknown'}
Error Rate: ${stats.errorRate || '0%'}
Active IAM Identities with Errors: ${JSON.stringify(stats.identities?.slice(0, 10) || [])}
Top Error Codes: ${JSON.stringify(stats.topErrorCodes || [])}
Sample Error Records:
${JSON.stringify(sampleErrors, null, 2)}

Produce an executive summary with failure categories, threat indicators, and prioritized security action items.`;

  try {
    let result;
    if (activeProvider === 'gemini') {
      result = await callGemini({
        prompt,
        systemPrompt,
        modelId: activeModel,
        apiKey: config.geminiApiKey
      });
    } else {
      result = await callBedrock({
        prompt,
        systemPrompt,
        modelId: activeModel,
        region: config.bedrockRegion,
        credentials: config.awsCredentials
      });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(result.rawText);
    } catch (parseErr) {
      console.warn('[AI Service] Executive JSON parse fallback:', result.rawText);
      parsedData = {
        executiveSummary: result.rawText,
        topFailureCategories: [],
        threatIndicators: [],
        actionPlan: ['Review top error codes in Event Explorer table.']
      };
    }

    const tx = recordTransaction({
      provider: activeProvider,
      model: activeModel,
      action: 'executive_summary',
      eventName: 'Batch_Errors',
      errorCode: 'Multiple',
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      latencyMs: result.latencyMs,
      success: true
    });

    return {
      success: true,
      provider: activeProvider,
      model: activeModel,
      modelMeta: getModelMetadata(activeModel),
      summary: parsedData,
      usage: {
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        totalTokens: result.totalTokens,
        costUSD: tx.costUSD,
        latencyMs: result.latencyMs
      }
    };
  } catch (err) {
    recordTransaction({
      provider: activeProvider,
      model: activeModel,
      action: 'executive_summary',
      eventName: 'Batch_Errors',
      errorCode: 'Multiple',
      promptTokens: 0,
      completionTokens: 0,
      latencyMs: 0,
      success: false,
      errorMsg: err.message
    });
    throw err;
  }
}

/**
 * Tests live connection to an AI provider
 */
export async function testAIConnection({ provider = 'gemini', apiKey, modelId, region, credentials }) {
  if (provider === 'gemini') {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('No Gemini API key provided or found.');
    }
    const ai = new GoogleGenAI({ apiKey: key });
    const model = modelId || 'gemini-3.8-flash';
    const response = await ai.models.generateContent({
      model,
      contents: 'Respond with the single word: "OK"',
    });
    return {
      success: true,
      provider: 'gemini',
      model,
      reply: (response.text || 'OK').trim(),
      message: `Successfully connected to Google Gemini (${model})!`
    };
  } else {
    const awsRegion = region || process.env.AWS_REGION || 'us-east-1';
    const clientConfig = { region: awsRegion };
    if (credentials?.accessKeyId && credentials?.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey
      };
    }
    const client = new BedrockRuntimeClient(clientConfig);
    const model = modelId || 'amazon.nova-micro-v1:0';
    const command = new ConverseCommand({
      modelId: model,
      messages: [{ role: 'user', content: [{ text: 'Respond with the single word: "OK"' }] }]
    });
    const response = await client.send(command);
    return {
      success: true,
      provider: 'bedrock',
      model,
      reply: response.output?.message?.content?.[0]?.text || 'OK',
      message: `Successfully connected to AWS Bedrock (${model})!`
    };
  }
}


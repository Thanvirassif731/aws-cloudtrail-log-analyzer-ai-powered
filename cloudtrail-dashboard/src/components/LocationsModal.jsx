import React, { useState } from 'react';
import { api } from '../api';
import { 
  Folder, 
  Cloud, 
  HardDrive, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  RefreshCw, 
  Plus, 
  Trash2, 
  ExternalLink,
  Shield,
  Key,
  Globe,
  Info,
  Clock
} from 'lucide-react';

const COMMON_REGIONS = [
  { id: 'ap-south-1', name: 'Asia Pacific (Mumbai) - ap-south-1' },
  { id: 'us-east-1', name: 'US East (N. Virginia) - us-east-1' },
  { id: 'us-east-2', name: 'US East (Ohio) - us-east-2' },
  { id: 'us-west-2', name: 'US West (Oregon) - us-west-2' },
  { id: 'eu-west-1', name: 'Europe (Ireland) - eu-west-1' },
  { id: 'eu-central-1', name: 'Europe (Frankfurt) - eu-central-1' },
  { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore) - ap-southeast-1' },
  { id: 'ap-northeast-1', name: 'Asia Pacific (Tokyo) - ap-northeast-1' }
];

export default function LocationsModal({ isOpen, onClose, onSourcesUpdated, sources = [], activeFetchState }) {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'addLocal' | 'addS3'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Local Form state
  const [localPath, setLocalPath] = useState('');
  const [localName, setLocalName] = useState('');

  // S3 Form state
  const [s3Uri, setS3Uri] = useState('');
  const [s3Bucket, setS3Bucket] = useState('');
  const [s3Prefix, setS3Prefix] = useState('AWSLogs/');
  const [s3Region, setS3Region] = useState('ap-south-1');
  const [authMode, setAuthMode] = useState('default'); // 'default' | 'keys'
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
  const [s3Name, setS3Name] = useState('');

  if (!isOpen) return null;

  const handleAddLocal = async (e) => {
    e.preventDefault();
    if (!localPath.trim()) {
      setError('Please provide a valid directory path.');
      return;
    }

    setLoading(true);
    setError(null);
    setWarning(null);
    setSuccessMsg(null);

    try {
      const res = await api.addLocalSource(localPath.trim(), localName.trim());
      if (onSourcesUpdated) await onSourcesUpdated();

      if (res.warning) {
        setWarning(res.warning);
      } else if (res.error || res.success === false) {
        setError(res.error || 'Failed to load local directory.');
      } else {
        setSuccessMsg(res.message || 'Local folder added successfully!');
        setLocalPath('');
        setLocalName('');
        setTimeout(() => setActiveTab('list'), 1200);
      }
    } catch (err) {
      setError(err.message || 'Error adding local folder.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddS3 = async (e) => {
    e.preventDefault();
    setError(null);
    setWarning(null);
    setSuccessMsg(null);

    // Auto parse s3Uri if given
    let bucket = s3Bucket.trim();
    let prefix = s3Prefix.trim();
    if (s3Uri.trim().startsWith('s3://')) {
      const clean = s3Uri.trim().replace(/^s3:\/\//, '');
      const parts = clean.split('/');
      bucket = parts[0];
      prefix = parts.slice(1).join('/');
    }

    if (!bucket) {
      setError('Please provide an S3 Bucket Name or s3:// URI.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.addS3Source({
        bucket,
        prefix,
        region: s3Region,
        accessKeyId: authMode === 'keys' ? accessKeyId.trim() : undefined,
        secretAccessKey: authMode === 'keys' ? secretAccessKey.trim() : undefined,
        name: s3Name.trim()
      });

      if (onSourcesUpdated) await onSourcesUpdated();

      if (res.error || res.success === false) {
        setError(res.error || 'Failed to initiate S3 fetch.');
      } else {
        setSuccessMsg(res.message || 'Connecting to AWS S3 bucket in background...');
        setS3Uri('');
        setS3Bucket('');
        setAccessKeyId('');
        setSecretAccessKey('');
        setS3Name('');
        // Switch to list tab to see live fetching status
        setTimeout(() => setActiveTab('list'), 1000);
      }
    } catch (err) {
      setError(err.message || 'Error connecting to AWS S3 bucket.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSource = async (id) => {
    try {
      await api.refreshSource(id);
      if (onSourcesUpdated) await onSourcesUpdated();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteSource = async (id) => {
    try {
      await api.deleteSource(id);
      if (onSourcesUpdated) await onSourcesUpdated();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Manage Log Locations</h2>
              <p className="text-xs text-slate-400">Configure local file paths and AWS S3 bucket sources</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 bg-slate-950/20 text-xs">
          <button
            onClick={() => { setActiveTab('list'); setError(null); setWarning(null); setSuccessMsg(null); }}
            className={`pb-2.5 px-3 font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'list'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Active Locations ({sources.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('addLocal'); setError(null); setWarning(null); setSuccessMsg(null); }}
            className={`pb-2.5 px-3 font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'addLocal'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Add Local Folder</span>
          </button>
          <button
            onClick={() => { setActiveTab('addS3'); setError(null); setWarning(null); setSuccessMsg(null); }}
            className={`pb-2.5 px-3 font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'addS3'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Add AWS S3 Bucket</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Active S3 Fetch Banner if in progress */}
          {activeFetchState?.isFetching && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs animate-pulse">
              <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="font-semibold block mb-0.5">Fetching AWS S3 Archives in Progress</strong>
                <p>{activeFetchState.progress?.message || 'Downloading CloudTrail logs from Amazon S3...'}</p>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-2">
                  <div 
                    style={{ width: `${activeFetchState.progress?.percent || 20}%` }}
                    className="h-full bg-amber-500 transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Feedback alerts */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {warning && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{warning}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: ACTIVE LOCATIONS LIST */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              {sources.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                  <Globe className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="font-medium text-slate-300">No log locations configured yet</p>
                  <p>Add a local folder or an AWS S3 bucket to begin analyzing logs.</p>
                </div>
              ) : (
                sources.map((src) => {
                  const isLocal = src.type === 'local';
                  const isFetching = src.status === 'fetching' || (activeFetchState?.isFetching && activeFetchState.sourceId === src.id);
                  const isError = src.status === 'error';
                  const isLoaded = src.status === 'loaded';

                  return (
                    <div 
                      key={src.id}
                      className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                          isLocal ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {isLocal ? <HardDrive className="w-4 h-4" /> : <Cloud className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white truncate">{src.name}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              isLocal 
                                ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' 
                                : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            }`}>
                              {isLocal ? 'Local Disk' : 'AWS S3 Cloud'}
                            </span>
                            {isFetching && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                                <RefreshCw className="w-3 h-3 animate-spin" /> Fetching...
                              </span>
                            )}
                            {isError && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                Error
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[11px] text-slate-400 truncate mt-1">
                            {src.location || src.path || `s3://${src.bucket}/${src.prefix || ''}`}
                          </div>
                          {src.errorMessage && (
                            <p className="text-rose-400 text-[11px] mt-1">{src.errorMessage}</p>
                          )}
                          <div className="text-slate-500 text-[11px] flex items-center gap-3 mt-1.5">
                            <span>Archives: <strong className="text-slate-300 font-mono">{src.fileCount || 0}</strong></span>
                            <span>•</span>
                            <span>Events: <strong className="text-amber-400 font-mono">{(src.recordCount || 0).toLocaleString()}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => handleRefreshSource(src.id)}
                          disabled={isFetching}
                          title="Refresh / Rescan this source"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleDeleteSource(src.id)}
                          title="Remove location"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: ADD LOCAL FOLDER */}
          {activeTab === 'addLocal' && (
            <form onSubmit={handleAddLocal} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 uppercase tracking-wider text-[11px] mb-1.5">
                  Folder Path (.json or .json.gz logs)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Folder className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={localPath}
                    onChange={(e) => setLocalPath(e.target.value)}
                    placeholder="e.g. ../AWSLogs or ./AWSLogs or T:\Assif\KGiSL\log-data\AWSLogs"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 uppercase tracking-wider text-[11px] mb-1.5">
                  Display Label (Optional)
                </label>
                <input
                  type="text"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  placeholder="e.g. Local S3 Download, Workspace Logs"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Quick Suggestions */}
              <div>
                <span className="text-slate-400 text-[11px] block mb-1.5">Quick picks:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setLocalPath('../AWSLogs')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 font-mono text-[11px] cursor-pointer"
                  >
                    ../AWSLogs
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalPath('./AWSLogs')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 font-mono text-[11px] cursor-pointer"
                  >
                    ./AWSLogs
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Validating & Ingesting...' : 'Add Local Location'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ADD AWS S3 BUCKET */}
          {activeTab === 'addS3' && (
            <form onSubmit={handleAddS3} className="space-y-4 text-xs">
              {/* Notice */}
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                <p>
                  S3 CloudTrail archives (<code className="text-amber-300 font-mono">.json.gz</code>) will be downloaded and processed in memory. An in-app progress notification will indicate live fetching progress.
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-300 uppercase tracking-wider text-[11px] mb-1.5">
                  S3 Bucket Name or URI
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={s3Uri}
                    onChange={(e) => {
                      setS3Uri(e.target.value);
                      if (e.target.value.startsWith('s3://')) {
                        const clean = e.target.value.replace(/^s3:\/\//, '');
                        const parts = clean.split('/');
                        setS3Bucket(parts[0]);
                        setS3Prefix(parts.slice(1).join('/') || 'AWSLogs/');
                      } else {
                        setS3Bucket(e.target.value);
                      }
                    }}
                    placeholder="e.g. s3://my-cloudtrail-bucket/AWSLogs or my-cloudtrail-bucket"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 uppercase tracking-wider text-[11px] mb-1.5">
                    S3 Prefix (Optional)
                  </label>
                  <input
                    type="text"
                    value={s3Prefix}
                    onChange={(e) => setS3Prefix(e.target.value)}
                    placeholder="AWSLogs/ (default)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 uppercase tracking-wider text-[11px] mb-1.5">
                    AWS Region
                  </label>
                  <select
                    value={s3Region}
                    onChange={(e) => setS3Region(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    {COMMON_REGIONS.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Authentication selection */}
              <div>
                <label className="block font-medium text-slate-300 uppercase tracking-wider text-[11px] mb-1.5">
                  AWS Credentials
                </label>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="authMode"
                      value="default"
                      checked={authMode === 'default'}
                      onChange={() => setAuthMode('default')}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span>Default IAM / Environment Credentials</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="authMode"
                      value="keys"
                      checked={authMode === 'keys'}
                      onChange={() => setAuthMode('keys')}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span>Specify Access Key & Secret</span>
                  </label>
                </div>
              </div>

              {authMode === 'keys' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-xl animate-fade-in">
                  <div>
                    <label className="block font-medium text-slate-400 text-[11px] mb-1">
                      Access Key ID
                    </label>
                    <input
                      type="text"
                      value={accessKeyId}
                      onChange={(e) => setAccessKeyId(e.target.value)}
                      placeholder="AKIA..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-400 text-[11px] mb-1">
                      Secret Access Key
                    </label>
                    <input
                      type="password"
                      value={secretAccessKey}
                      onChange={(e) => setSecretAccessKey(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-300 uppercase tracking-wider text-[11px] mb-1.5">
                  Display Label (Optional)
                </label>
                <input
                  type="text"
                  value={s3Name}
                  onChange={(e) => setS3Name(e.target.value)}
                  placeholder="e.g. Production S3 CloudTrail"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Cloud className="w-4 h-4" />
                  <span>{loading ? 'Connecting to S3...' : 'Connect & Ingest S3 Bucket'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>{sources.length} location(s) active</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

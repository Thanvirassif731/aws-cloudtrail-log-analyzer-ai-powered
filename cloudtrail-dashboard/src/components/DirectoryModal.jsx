import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Folder, 
  FolderCheck, 
  FolderSearch, 
  FolderX, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  ArrowRight,
  HardDrive,
  Info
} from 'lucide-react';

export default function DirectoryModal({ isOpen, onClose, onPathUpdated, currentDirInfo }) {
  const [inputPath, setInputPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (isOpen && currentDirInfo?.configuredPath) {
      setInputPath(currentDirInfo.configuredPath);
      setError(null);
      setWarning(null);
      setSuccessMsg(null);
    }
  }, [isOpen, currentDirInfo]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputPath.trim()) {
      setError('Please enter a valid directory path.');
      return;
    }

    setLoading(true);
    setError(null);
    setWarning(null);
    setSuccessMsg(null);

    try {
      const res = await api.updateLogPath(inputPath.trim());

      // Trigger immediate real-time local refresh of dashboard & tables
      if (onPathUpdated) {
        await onPathUpdated();
      }

      if (res.warning) {
        setWarning(res.warning);
      } else if (res.error || res.success === false) {
        setError(res.error || 'The specified folder path is invalid or cannot be accessed.');
      } else {
        setSuccessMsg(res.message || 'Log directory updated successfully!');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Failed to access or load the specified directory path.');
      if (onPathUpdated) {
        await onPathUpdated();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPick = (quickPath) => {
    setInputPath(quickPath);
    setError(null);
    setWarning(null);
  };

  const isLoaded = currentDirInfo?.status === 'loaded' && currentDirInfo?.recordCount > 0;
  const isEmpty = currentDirInfo?.status === 'empty' || (currentDirInfo?.status === 'loaded' && currentDirInfo?.recordCount === 0);
  const isNotFound = currentDirInfo?.status === 'not_found' || currentDirInfo?.status === 'error';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <FolderSearch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Configure Log Files Location</h2>
              <p className="text-xs text-slate-400">Specify the directory containing your AWS S3 CloudTrail archives</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Current Path Status Card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">
                Active Location Status
              </span>
              {isLoaded && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active & Loaded
                </span>
              )}
              {isEmpty && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> 0 Archives Found
                </span>
              )}
              {isNotFound && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-medium flex items-center gap-1">
                  <FolderX className="w-3 h-3" /> Path Unavailable (0 Data)
                </span>
              )}
            </div>

            <div className="font-mono text-slate-200 bg-slate-900 p-2 rounded border border-slate-800/80 break-all text-[11px]">
              {currentDirInfo?.configuredPath || 'No directory configured yet'}
            </div>

            <div className="text-slate-400 text-[11px] flex items-center gap-2 pt-1">
              <span>Archives: <strong className="text-white font-mono">{currentDirInfo?.fileCount || 0}</strong> files</span>
              <span>•</span>
              <span>Events: <strong className="text-amber-400 font-mono">{(currentDirInfo?.recordCount || 0).toLocaleString()}</strong> records</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Directory Unavailable — Data Reset to 0</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Warning Message */}
          {warning && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">No CloudTrail Logs Found (0 Data)</strong>
                <span>{warning}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Input Field */}
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
              Folder Path to Log Data
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Folder className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={inputPath}
                onChange={(e) => setInputPath(e.target.value)}
                placeholder="e.g. ../AWSLogs or ./AWSLogs or /path/to/logs"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              Supports relative or absolute paths containing CloudTrail <code className="text-amber-300">.json.gz</code> or <code className="text-amber-300">.json</code> files.
            </p>
          </div>

          {/* Quick-pick Shortcuts */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5">
              Quick Suggestions:
            </label>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickPick('../AWSLogs')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 font-mono text-[11px] cursor-pointer"
              >
                ../AWSLogs
              </button>
              <button
                type="button"
                onClick={() => handleQuickPick('./AWSLogs')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 font-mono text-[11px] cursor-pointer"
              >
                ./AWSLogs
              </button>
              <button
                type="button"
                onClick={() => handleQuickPick('T:\\Assif\\KGiSL\\log-data\\AWSLogs')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 font-mono text-[11px] cursor-pointer"
              >
                Current Workspace AWSLogs
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning & Fetching...</span>
                </>
              ) : (
                <>
                  <span>Update & Ingest Logs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

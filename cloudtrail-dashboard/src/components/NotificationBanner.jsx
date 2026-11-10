import React, { useState, useEffect } from 'react';
import { Cloud, RefreshCw, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function NotificationBanner({ activeFetchState, onDismissNotification }) {
  const [visible, setVisible] = useState(true);

  const isFetching = activeFetchState?.isFetching;
  const lastNotification = activeFetchState?.lastNotification;

  useEffect(() => {
    if (isFetching || lastNotification) {
      setVisible(true);
    }
  }, [isFetching, lastNotification]);

  if (!visible) return null;
  if (!isFetching && !lastNotification) return null;

  const isSuccess = lastNotification?.type === 'success';
  const isError = lastNotification?.type === 'error';
  const isWarning = lastNotification?.type === 'warning';

  return (
    <div className="bg-slate-900 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-4 text-xs">
          {/* Ongoing S3 Fetch State */}
          {isFetching ? (
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 animate-spin">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">
                    Fetching CloudTrail logs from AWS S3...
                  </span>
                  <span className="text-amber-400 font-mono">
                    {activeFetchState?.sourceName || ''}
                  </span>
                </div>
                <div className="text-slate-400 mt-0.5 flex items-center gap-3">
                  <span>{activeFetchState.progress?.message || 'Please wait while data is downloaded and indexed...'}</span>
                  {activeFetchState.progress?.percent > 0 && (
                    <span className="font-mono text-amber-400 font-bold">
                      {activeFetchState.progress.percent}%
                    </span>
                  )}
                </div>
                {/* Progress bar */}
                <div className="w-full max-w-md h-1.5 rounded-full bg-slate-800 overflow-hidden mt-1.5">
                  <div 
                    style={{ width: `${Math.max(10, activeFetchState.progress?.percent || 15)}%` }}
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Completed / Recent Notification */
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {isSuccess && (
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              {isError && (
                <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
              {isWarning && (
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className={`font-medium ${
                  isSuccess ? 'text-emerald-300' : isError ? 'text-rose-300' : 'text-amber-300'
                }`}>
                  {lastNotification?.message}
                </span>
              </div>
            </div>
          )}

          {!isFetching && (
            <button
              onClick={() => {
                setVisible(false);
                if (onDismissNotification) onDismissNotification();
              }}
              className="text-slate-500 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

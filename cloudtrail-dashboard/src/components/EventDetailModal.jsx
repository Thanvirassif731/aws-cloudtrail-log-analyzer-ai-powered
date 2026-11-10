import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  Shield, 
  Clock, 
  Globe, 
  Server, 
  Key, 
  FileCode, 
  Layers, 
  User, 
  Terminal,
  ExternalLink
} from 'lucide-react';

export default function EventDetailModal({ eventId, onClose }) {
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'requestParams', 'responseElements', 'rawJson'
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    api.getEventDetail(eventId)
      .then(data => {
        setEventData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to load event details');
        setLoading(false);
      });
  }, [eventId]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadJson = () => {
    if (!eventData) return;
    const blob = new Blob([JSON.stringify(eventData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloudtrail_${eventData.eventName || 'event'}_${eventData.eventID || Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!eventId) return null;

  const u = eventData?.userIdentity || {};
  const hasError = Boolean(eventData?.errorCode || eventData?.errorMessage);
  const resources = eventData?.resources || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/50">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
              hasError ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {hasError ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight font-mono">
                  {eventData?.eventName || 'Loading Event...'}
                </h2>
                {eventData?._sourceType === 'cloud' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30 font-mono">
                    ☁️ S3 Cloud ({eventData?._sourceName || 'S3'})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30 font-mono">
                    💻 Local ({eventData?._sourceName || 'Local'})
                  </span>
                )}
                {eventData?.readOnly === true && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                    Read Only
                  </span>
                )}
                {eventData?.readOnly === false && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    Write / Mutating
                  </span>
                )}
                {hasError && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                    {eventData?.errorCode || 'FAILED'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                <span>Time: <strong className="text-slate-300 font-mono">{eventData?.eventTime || '-'}</strong></span>
                <span>•</span>
                <span>ID: <code className="text-slate-400 font-mono text-[11px]">{eventData?.eventID || eventId}</code></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={downloadJson}
              disabled={loading || !eventData}
              title="Download full event as JSON"
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 bg-slate-950/20 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview & Identity
          </button>
          <button
            onClick={() => setActiveTab('requestParams')}
            className={`pb-2.5 px-3 font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'requestParams'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Request Parameters
          </button>
          <button
            onClick={() => setActiveTab('responseElements')}
            className={`pb-2.5 px-3 font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'responseElements'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Response Elements
          </button>
          <button
            onClick={() => setActiveTab('rawJson')}
            className={`pb-2.5 px-3 font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'rawJson'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw CloudTrail JSON
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-400 text-sm">Loading event data...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  {/* Error Callout if event failed */}
                  {hasError && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
                      <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm mb-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Execution Error Encountered</span>
                      </div>
                      <div className="text-xs space-y-1">
                        <div>
                          <span className="text-slate-400">Error Code: </span>
                          <span className="text-rose-300 font-mono font-medium">{eventData.errorCode}</span>
                        </div>
                        {eventData.errorMessage && (
                          <div>
                            <span className="text-slate-400">Message: </span>
                            <span className="text-slate-200 font-mono">{eventData.errorMessage}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2-Column Grid: Identity & Request Context */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* User Identity Details Card */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                          <User className="w-4 h-4" />
                          <span>Caller Identity</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {u.type || 'Unknown Type'}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <div className="text-slate-400 text-[11px]">Principal / User Name:</div>
                          <div className="font-mono text-white font-medium break-all">
                            {u.userName || eventData._principalName || 'N/A'}
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-400 text-[11px]">Identity ARN:</div>
                          <div className="font-mono text-slate-300 text-[11px] break-all bg-slate-900 p-1.5 rounded border border-slate-800/80 flex items-center justify-between gap-2">
                            <span>{u.arn || 'N/A'}</span>
                            {u.arn && (
                              <button
                                onClick={() => copyToClipboard(u.arn, 'arn')}
                                className="text-slate-400 hover:text-white shrink-0 cursor-pointer"
                                title="Copy ARN"
                              >
                                {copiedKey === 'arn' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <div className="text-slate-400 text-[11px]">Account ID:</div>
                            <div className="font-mono text-slate-200">{u.accountId || eventData.recipientAccountId || 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-[11px]">Access Key ID:</div>
                            <div className="font-mono text-slate-200 text-[11px]">{u.accessKeyId || 'N/A'}</div>
                          </div>
                        </div>

                        {u.sessionContext?.attributes && (
                          <div className="pt-1 text-[11px] text-slate-400 border-t border-slate-800/60">
                            MFA Authenticated: <strong className="text-slate-300">{u.sessionContext.attributes.mfaAuthenticated || 'false'}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Request Context Card */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                          <Globe className="w-4 h-4" />
                          <span>Request Details</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
                          {eventData.eventCategory || 'Management'}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-slate-400 text-[11px]">Event Source:</div>
                            <div className="font-mono text-white font-medium">{eventData.eventSource || '-'}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-[11px]">AWS Region:</div>
                            <div className="font-mono text-white font-medium">{eventData.awsRegion || '-'}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-slate-400 text-[11px]">Source IP:</div>
                            <div className="font-mono text-slate-200">{eventData.sourceIPAddress || '-'}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-[11px]">Event Type:</div>
                            <div className="font-mono text-slate-200">{eventData.eventType || '-'}</div>
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-400 text-[11px]">User Agent:</div>
                          <div className="font-mono text-slate-300 text-[11px] break-all bg-slate-900 p-1.5 rounded border border-slate-800/80">
                            {eventData.userAgent || '-'}
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-400 text-[11px]">Request ID:</div>
                          <div className="font-mono text-slate-400 text-[11px] truncate">
                            {eventData.requestID || '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resources Affected Card */}
                  {resources.length > 0 && (
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-400" />
                        <span>Referenced Resources ({resources.length})</span>
                      </div>
                      <div className="space-y-2">
                        {resources.map((res, i) => (
                          <div key={i} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
                            <div className="text-white font-medium">{res.ARN || res.arn || 'Unknown ARN'}</div>
                            <div className="text-slate-400 text-[11px] mt-0.5">Type: {res.type || res.ResourceType || 'Resource'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TLS Details (if present) */}
                  {eventData.tlsDetails && (
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        TLS Security Configuration
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono">
                        <div>TLS Version: <strong className="text-white">{eventData.tlsDetails.tlsVersion || 'N/A'}</strong></div>
                        <div className="truncate">Cipher: <strong className="text-white">{eventData.tlsDetails.cipherSuite || 'N/A'}</strong></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: REQUEST PARAMETERS */}
              {activeTab === 'requestParams' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Payload parameters supplied to the API call</span>
                    {eventData.requestParameters && (
                      <button
                        onClick={() => copyToClipboard(eventData.requestParameters, 'requestParams')}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                      >
                        {copiedKey === 'requestParams' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'requestParams' ? 'Copied!' : 'Copy Parameters'}</span>
                      </button>
                    )}
                  </div>
                  {eventData.requestParameters ? (
                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300 font-mono overflow-x-auto max-h-[500px]">
                      {JSON.stringify(eventData.requestParameters, null, 2)}
                    </pre>
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      No requestParameters payload recorded for this event.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: RESPONSE ELEMENTS */}
              {activeTab === 'responseElements' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Elements returned by the AWS service</span>
                    {eventData.responseElements && (
                      <button
                        onClick={() => copyToClipboard(eventData.responseElements, 'responseElements')}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                      >
                        {copiedKey === 'responseElements' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'responseElements' ? 'Copied!' : 'Copy Elements'}</span>
                      </button>
                    )}
                  </div>
                  {eventData.responseElements ? (
                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-300 font-mono overflow-x-auto max-h-[500px]">
                      {JSON.stringify(eventData.responseElements, null, 2)}
                    </pre>
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      No responseElements payload recorded for this event (e.g. read operation or failed call).
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: RAW CLOUDTRAIL JSON */}
              {activeTab === 'rawJson' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Complete raw CloudTrail event record</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(eventData, 'rawJson')}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                      >
                        {copiedKey === 'rawJson' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'rawJson' ? 'Copied!' : 'Copy Full JSON'}</span>
                      </button>
                      <button
                        onClick={downloadJson}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono overflow-x-auto max-h-[500px]">
                    {JSON.stringify(eventData, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

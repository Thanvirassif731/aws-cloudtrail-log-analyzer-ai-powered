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
  ExternalLink,
  Sparkles,
  Bot,
  Cpu,
  Code2,
  RefreshCw,
  Coins
} from 'lucide-react';

export default function EventDetailModal({ eventId, onClose }) {
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'requestParams', 'responseElements', 'rawJson', 'aiAnalysis'
  const [copiedKey, setCopiedKey] = useState(null);

  // AI Diagnosis state
  const [aiDiagnosis, setAiDiagnosis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiProvider, setAiProvider] = useState('gemini'); // 'gemini' | 'bedrock'

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

  const handleRunAiDiagnosis = async (providerOverride) => {
    if (!eventData) return;
    const provider = providerOverride || aiProvider;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await api.analyzeEvent({
        eventId: eventData._id || eventData.eventID,
        event: eventData,
        provider
      });
      setAiDiagnosis(res);
    } catch (err) {
      setAiError(err.message || 'AI diagnosis failed. Please check credentials or API key in AI Settings.');
    } finally {
      setAiLoading(false);
    }
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
          <button
            onClick={() => {
              setActiveTab('aiAnalysis');
              if (!aiDiagnosis && !aiLoading) handleRunAiDiagnosis();
            }}
            className={`pb-2.5 px-3 font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'aiAnalysis'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Error Diagnosis</span>
            {eventData?._hasError && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Failed request - AI analysis available" />
            )}
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
                      <div className="mt-3 pt-2.5 border-t border-rose-500/20 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Understand why this failed and get copy-paste IAM remediation:</span>
                        <button
                          onClick={() => {
                            setActiveTab('aiAnalysis');
                            if (!aiDiagnosis && !aiLoading) handleRunAiDiagnosis();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-amber-500/20"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Error Diagnosis</span>
                        </button>
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

              {/* TAB 5: AI ERROR DIAGNOSIS & REMEDIATION */}
              {activeTab === 'aiAnalysis' && (
                <div className="space-y-4">
                  {/* Header / Provider Toolbar */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/30 border border-amber-500/40 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          AI Root-Cause Diagnosis & Fix
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
                            Intelligence
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          Automated security analysis explaining why this request failed and how to remediate it
                        </p>
                      </div>
                    </div>

                    {/* Provider Selector & Action Button */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
                        <button
                          onClick={() => {
                            setAiProvider('gemini');
                            handleRunAiDiagnosis('gemini');
                          }}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            aiProvider === 'gemini' 
                              ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm' 
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Google Gemini
                        </button>
                        <button
                          onClick={() => {
                            setAiProvider('bedrock');
                            handleRunAiDiagnosis('bedrock');
                          }}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            aiProvider === 'bedrock' 
                              ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm' 
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          AWS Bedrock
                        </button>
                      </div>

                      <button
                        onClick={() => handleRunAiDiagnosis()}
                        disabled={aiLoading}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md shadow-amber-500/10"
                      >
                        {aiLoading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>{aiDiagnosis ? 'Re-Analyze' : 'Analyze Now'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Non-Error State Note */}
                  {!eventData._hasError && !aiDiagnosis && (
                    <div className="p-8 rounded-xl bg-slate-950/40 border border-slate-800 text-center space-y-2">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                      <h5 className="text-sm font-semibold text-white">This Request Succeeded</h5>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        No error codes or authorization failures were recorded for this event. You can still run the AI analysis to inspect permission requirements and security posture.
                      </p>
                    </div>
                  )}

                  {/* Error Banner if API Fails */}
                  {aiError && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold">{aiError}</p>
                        <p className="text-slate-400">
                          Make sure your Gemini API key (via <code className="text-amber-300">GEMINI_API_KEY</code> or AI Settings) or AWS Bedrock credentials are properly configured.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Loading State Skeleton */}
                  {aiLoading && (
                    <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-slate-300 font-medium">
                        Consulting {aiProvider === 'gemini' ? 'Google Gemini' : 'AWS Bedrock'} security engine...
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Analyzing error codes, caller IAM identity, and synthesizing least-privilege remediation
                      </p>
                    </div>
                  )}

                  {/* Rendered Diagnosis Results */}
                  {aiDiagnosis?.diagnosis && !aiLoading && (
                    <div className="space-y-4">
                      {/* Token, Cost & Latency Metadata Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-300">{aiDiagnosis.modelMeta?.name || aiDiagnosis.model}</span>
                          <span>•</span>
                          <span>{aiDiagnosis.usage?.totalTokens || 0} tokens ({aiDiagnosis.usage?.promptTokens || 0} in / {aiDiagnosis.usage?.completionTokens || 0} out)</span>
                          <span>•</span>
                          <span className="text-amber-400 font-mono font-medium">${aiDiagnosis.usage?.costUSD?.toFixed(6) || '0.000000'} USD</span>
                          {aiDiagnosis.cached && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
                              Cached ($0.00)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{aiDiagnosis.usage?.latencyMs || 0}ms</span>
                        </div>
                      </div>

                      {/* 1. Root Cause Card */}
                      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Bot className="w-3.5 h-3.5" />
                            <span>Why This Failed (Root Cause)</span>
                          </h5>
                          {aiDiagnosis.diagnosis.securityRisk && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                              aiDiagnosis.diagnosis.securityRisk.level === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                              aiDiagnosis.diagnosis.securityRisk.level === 'High' ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' :
                              aiDiagnosis.diagnosis.securityRisk.level === 'Medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                              'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            }`}>
                              Risk: {aiDiagnosis.diagnosis.securityRisk.level}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-normal">
                          {aiDiagnosis.diagnosis.rootCause}
                        </p>
                        {aiDiagnosis.diagnosis.securityRisk?.reason && (
                          <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                            <strong className="text-slate-300">Security Evaluation: </strong>
                            {aiDiagnosis.diagnosis.securityRisk.reason}
                          </p>
                        )}
                      </div>

                      {/* 2. Action & Resource Context */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                          <span className="text-slate-400 block mb-1">Failed IAM Action</span>
                          <code className="text-amber-300 font-mono text-[11px] px-2 py-1 rounded bg-slate-900 border border-slate-800 block truncate">
                            {aiDiagnosis.diagnosis.failedAction || eventData.eventName}
                          </code>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                          <span className="text-slate-400 block mb-1">Target Resource</span>
                          <code className="text-slate-300 font-mono text-[11px] px-2 py-1 rounded bg-slate-900 border border-slate-800 block truncate" title={aiDiagnosis.diagnosis.resourceAffected}>
                            {aiDiagnosis.diagnosis.resourceAffected || 'Not specified'}
                          </code>
                        </div>
                      </div>

                      {/* 3. Recommended Remediation & Policy Snippet */}
                      {aiDiagnosis.diagnosis.remediation && (
                        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Recommended Remediation & Policy</span>
                            </h5>
                          </div>

                          <p className="text-xs text-slate-300">
                            {aiDiagnosis.diagnosis.remediation.summary}
                          </p>

                          {/* Copyable IAM Policy JSON */}
                          {aiDiagnosis.diagnosis.remediation.policyJson && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400 font-medium">Least-Privilege Policy Statement:</span>
                                <button
                                  onClick={() => copyToClipboard(aiDiagnosis.diagnosis.remediation.policyJson, 'remediationPolicy')}
                                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                                >
                                  {copiedKey === 'remediationPolicy' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedKey === 'remediationPolicy' ? 'Copied Policy!' : 'Copy Policy JSON'}</span>
                                </button>
                              </div>
                              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-emerald-300 font-mono overflow-x-auto max-h-48">
                                {typeof aiDiagnosis.diagnosis.remediation.policyJson === 'object' 
                                  ? JSON.stringify(aiDiagnosis.diagnosis.remediation.policyJson, null, 2)
                                  : aiDiagnosis.diagnosis.remediation.policyJson}
                              </pre>
                            </div>
                          )}

                          {/* Copyable AWS CLI Command */}
                          {aiDiagnosis.diagnosis.remediation.cliCommand && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400 font-medium">AWS CLI Verification Command:</span>
                                <button
                                  onClick={() => copyToClipboard(aiDiagnosis.diagnosis.remediation.cliCommand, 'cliCmd')}
                                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                                >
                                  {copiedKey === 'cliCmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedKey === 'cliCmd' ? 'Copied Command!' : 'Copy CLI Command'}</span>
                                </button>
                              </div>
                              <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-amber-200 font-mono overflow-x-auto">
                                {aiDiagnosis.diagnosis.remediation.cliCommand}
                              </pre>
                            </div>
                          )}

                          {/* Best Practice Tip */}
                          {aiDiagnosis.diagnosis.remediation.bestPractice && (
                            <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-300/90 flex items-start gap-2">
                              <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-amber-300">Security Best Practice: </strong>
                                {aiDiagnosis.diagnosis.remediation.bestPractice}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

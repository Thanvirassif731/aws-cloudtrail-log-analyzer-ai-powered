import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  X, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  DollarSign, 
  Bot, 
  ListOrdered,
  ArrowRight
} from 'lucide-react';

export default function AIExecutiveSummaryModal({ isOpen, onClose }) {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState('gemini');

  useEffect(() => {
    if (isOpen && !summaryData) {
      generateSummary('gemini');
    }
  }, [isOpen]);

  const generateSummary = async (selectedProvider) => {
    const p = selectedProvider || provider;
    setLoading(true);
    setError(null);
    try {
      const res = await api.summarizeErrors({ provider: p });
      setSummaryData(res);
      setProvider(p);
    } catch (err) {
      setError(err.message || 'Failed to generate AI executive error summary');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const s = summaryData?.summary || {};
  const usage = summaryData?.usage || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/30 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                AI Executive Error & Threat Summary
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono">
                  CISO Intelligence
                </span>
              </h2>
              <p className="text-xs text-slate-400">Holistic analysis of systemic failure patterns and security anomalies across all ingested logs</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Provider Switcher */}
            <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => generateSummary('gemini')}
                disabled={loading}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  provider === 'gemini' 
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Gemini
              </button>
              <button
                onClick={() => generateSummary('bedrock')}
                disabled={loading}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  provider === 'bedrock' 
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                AWS Bedrock
              </button>
            </div>

            <button
              onClick={() => generateSummary()}
              disabled={loading}
              title="Re-run summary"
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Error Generating Summary</span>
              </div>
              <p className="text-slate-400">{error}</p>
            </div>
          )}

          {loading && (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-300 font-medium">
                Synthesizing executive security overview with {provider === 'gemini' ? 'Google Gemini' : 'AWS Bedrock'}...
              </p>
              <p className="text-[11px] text-slate-500">
                Evaluating error clusters, IAM permission anomalies, and threat vectors
              </p>
            </div>
          )}

          {summaryData && !loading && (
            <div className="space-y-5">
              {/* Token & Cost Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{summaryData.modelMeta?.name || summaryData.model}</span>
                  <span>•</span>
                  <span>{usage.totalTokens || 0} tokens ({usage.promptTokens || 0} in / {usage.completionTokens || 0} out)</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-mono font-bold">${usage.costUSD?.toFixed(6) || '0.000000'} USD</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>{usage.latencyMs || 0}ms</span>
                </div>
              </div>

              {/* 1. Executive Narrative */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Executive Assessment</span>
                </h3>
                <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-line">
                  {s.executiveSummary || 'No executive narrative returned.'}
                </p>
              </div>

              {/* 2. Top Failure Categories */}
              {s.topFailureCategories && s.topFailureCategories.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Top Failure Clusters & Operational Impact</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {s.topFailureCategories.map((cat, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-rose-300 text-xs truncate max-w-[200px]" title={cat.category}>
                            {cat.category}
                          </span>
                          {cat.count && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                              {cat.count}
                            </span>
                          )}
                        </div>
                        {cat.impact && (
                          <p className="text-[11px] text-slate-400">
                            <strong className="text-slate-300">Impact: </strong>{cat.impact}
                          </p>
                        )}
                        {cat.recommendation && (
                          <p className="text-[11px] text-emerald-400/90 pt-1 border-t border-slate-800/80">
                            <strong>Remediation: </strong>{cat.recommendation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Threat Indicators */}
              {s.threatIndicators && s.threatIndicators.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Security & Threat Indicators</span>
                  </h3>
                  <div className="space-y-2">
                    {s.threatIndicators.map((t, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex items-start gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0 mt-0.5 border ${
                          t.severity === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                          t.severity === 'High' ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' :
                          t.severity === 'Medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                          'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        }`}>
                          {t.severity}
                        </span>
                        <div className="space-y-0.5 text-xs">
                          <h4 className="font-semibold text-white">{t.indicator}</h4>
                          <p className="text-slate-400 text-[11px]">{t.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Action Plan */}
              {s.actionPlan && s.actionPlan.length > 0 && (
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                  <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>Prioritized Security Action Plan</span>
                  </h3>
                  <ol className="space-y-1.5 list-decimal list-inside text-slate-300 text-xs">
                    {s.actionPlan.map((action, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <span className="text-slate-200">{action}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>AWS CloudTrail Security Intelligence</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close Summary
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Users, 
  Globe, 
  ShieldAlert, 
  Calendar, 
  ArrowUpRight, 
  Key, 
  Database, 
  Lock, 
  HardDrive, 
  FileText, 
  Clock, 
  ExternalLink,
  FolderSearch,
  FolderX,
  FolderCheck,
  Cloud,
  Sparkles
} from 'lucide-react';
import AIExecutiveSummaryModal from './AIExecutiveSummaryModal';

export default function Dashboard({ stats, onNavigateToTable, onOpenLocationsModal }) {
  const [showAiSummaryModal, setShowAiSummaryModal] = useState(false);
  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Aggregating CloudTrail statistics...</p>
        </div>
      </div>
    );
  }

  const {
    total = 0,
    localCount = 0,
    cloudCount = 0,
    errorCount = 0,
    errorRate = 0,
    readCount = 0,
    writeCount = 0,
    uniqueServicesCount = 0,
    uniqueRegionsCount = 0,
    uniqueUsersCount = 0,
    primaryAccountId,
    primaryRegion,
    rootCount = 0,
    minTime,
    maxTime,
    topServices = [],
    topRegions = [],
    topUsers = [],
    topEventNames = [],
    topErrorCodes = [],
    timeline = [],
    sourcesSummary = []
  } = stats;

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  const maxTimelineCount = Math.max(...timeline.map(t => t.count), 1);
  const readPct = total > 0 ? Math.round((readCount / total) * 100) : 0;
  const writePct = total > 0 ? Math.round((writeCount / total) * 100) : 0;

  const localPct = total > 0 ? Math.round((localCount / total) * 100) : 0;
  const cloudPct = total > 0 ? Math.round((cloudCount / total) * 100) : 0;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Empty State Banner if no logs exist */}
      {total === 0 && (
        <div className="p-5 rounded-2xl border bg-amber-500/10 border-amber-500/30 text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl shrink-0 bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">
                No CloudTrail Logs Loaded
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Configure your local log directory or connect an AWS S3 bucket containing CloudTrail archives.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenLocationsModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-all flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950"
          >
            <FolderSearch className="w-4 h-4" />
            <span>Add / Manage Locations</span>
          </button>
        </div>
      )}

      {/* Top Banner with Time Horizon & Location Sources */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Log Archive Horizon</h2>
            <p className="text-xs text-slate-400">
              {total > 0 ? (
                <>Captured Events from <span className="text-slate-200 font-medium">{formatDate(minTime)}</span> to <span className="text-slate-200 font-medium">{formatDate(maxTime)}</span></>
              ) : (
                <>No events currently captured from configured locations</>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {total > 0 ? (
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Unified Ingestion ({total.toLocaleString()} records)
            </span>
          ) : (
            <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              0 Records Loaded
            </span>
          )}
        </div>
      </div>

      {/* Source Segregation Bar (Local Files vs AWS S3 Cloud) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>Data Origin Segregation (Local Disk vs Cloud S3)</span>
            </h3>
            <p className="text-[11px] text-slate-500">Breakdown of records ingested from local filesystem vs. Amazon S3 buckets</p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => onNavigateToTable({ sourceType: 'local' })}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 cursor-pointer transition-all"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Local: <strong className="font-mono text-white">{localCount.toLocaleString()}</strong> ({localPct}%)</span>
            </button>
            <button
              onClick={() => onNavigateToTable({ sourceType: 'cloud' })}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 cursor-pointer transition-all"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>S3 Cloud: <strong className="font-mono text-white">{cloudCount.toLocaleString()}</strong> ({cloudPct}%)</span>
            </button>
          </div>
        </div>

        {/* Visual Bar */}
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
          <div 
            style={{ width: `${localPct}%` }} 
            className="bg-blue-500 transition-all duration-500"
            title={`Local: ${localCount}`}
          />
          <div 
            style={{ width: `${cloudPct}%` }} 
            className="bg-purple-500 transition-all duration-500"
            title={`Cloud S3: ${cloudCount}`}
          />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Events</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              {total.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">API calls</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Read: {readCount.toLocaleString()}</span>
            <span>•</span>
            <span>Write: {writeCount.toLocaleString()}</span>
          </div>
        </div>

        {/* Failed / Error Events */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Failed API Calls</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-rose-400 tracking-tight">
              {errorCount.toLocaleString()}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
              {errorRate}% error rate
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">{topErrorCodes.length} distinct error types</span>
            {errorCount > 0 && (
              <button
                onClick={() => onNavigateToTable({ status: 'error' })}
                className="text-rose-400 hover:text-rose-300 font-medium flex items-center gap-0.5 cursor-pointer"
              >
                Filter Errors <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Unique Services */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">AWS Services</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              {uniqueServicesCount}
            </span>
            <span className="text-xs text-slate-400">services active</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>{total > 0 ? `Top: ${topServices.slice(0, 3).map(s => s.service).join(', ')}` : 'No services active'}</span>
            <span>{uniqueRegionsCount} regions</span>
          </div>
        </div>

        {/* Unique IAM Identities */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Identities</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              {uniqueUsersCount}
            </span>
            <span className="text-xs text-slate-400">IAM roles / users</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>{rootCount > 0 ? `${rootCount} Root calls` : 'Standard identities'}</span>
          </div>
        </div>
      </div>

      {/* Security Alerts / Important Signals */}
      {(rootCount > 0 || errorCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Root Account Usage Alert */}
          {rootCount > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/30 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Root Account Activity Detected</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                      {rootCount} Events
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Privileged root account activity detected in this log dataset. AWS security best practices advise strictly auditing root usage.
                  </p>
                  <button
                    onClick={() => onNavigateToTable({ user: 'root' })}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Inspect All Root Events <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Failed Operations Summary */}
          {errorCount > 0 && (
            <div className="bg-rose-500/5 border border-rose-500/30 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">API Errors & Denials</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                      {errorCount} Failures
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Top error codes: {topErrorCodes.slice(0, 3).map(e => e.code).join(', ') || 'N/A'}.
                  </p>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => onNavigateToTable({ status: 'error' })}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Inspect Failed Requests <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setShowAiSummaryModal(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-md shadow-amber-500/10"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Executive Error Summary</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activity Timeline Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-base font-semibold text-white">Daily Event Activity Timeline</h3>
            <p className="text-xs text-slate-400">Number of CloudTrail logged API events recorded each day</p>
          </div>
          {timeline.length > 0 && (
            <span className="text-xs text-slate-500 font-mono">
              Click any bar to filter events by day
            </span>
          )}
        </div>

        <div className="mt-6">
          {timeline.length > 0 ? (
            <div className="h-56 flex items-end gap-3 pt-6 pb-2">
              {timeline.map((item) => {
                const heightPct = Math.max(8, Math.round((item.count / maxTimelineCount) * 100));
                return (
                  <div 
                    key={item.date} 
                    className="flex-1 flex flex-col items-center group relative cursor-pointer"
                    onClick={() => onNavigateToTable({ startDate: item.date, endDate: item.date })}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2.5 py-1 rounded shadow-lg border border-slate-700 pointer-events-none whitespace-nowrap z-20">
                      <span className="font-semibold">{item.count.toLocaleString()}</span> events on {item.date}
                    </div>

                    {/* Bar */}
                    <div className="w-full max-w-[48px] bg-slate-800/80 rounded-t-lg group-hover:bg-slate-700 flex flex-col justify-end overflow-hidden h-full">
                      <div 
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-gradient-to-t from-amber-500 to-amber-400 group-hover:from-amber-400 group-hover:to-amber-300 rounded-t-lg transition-all"
                      />
                    </div>

                    {/* Date label */}
                    <div className="mt-2 text-[11px] text-slate-400 font-mono truncate w-full text-center">
                      {item.date.slice(5)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
              <Activity className="w-6 h-6 text-slate-600" />
              <span>No timeline activity to display (0 events loaded)</span>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Section: Top Services & Top Event Names */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top AWS Services */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-white">Top AWS Services</h3>
              <p className="text-xs text-slate-400">Ranked by API call volume</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {topServices.length} Active
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {topServices.length > 0 ? (
              topServices.slice(0, 7).map((s) => {
                const pct = total > 0 ? ((s.count / total) * 100).toFixed(1) : 0;
                return (
                  <div 
                    key={s.service}
                    onClick={() => onNavigateToTable({ service: s.service })}
                    className="p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/80 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-200 group-hover:text-amber-400 transition-colors uppercase tracking-wider font-mono">
                        {s.service}
                      </span>
                      <span className="text-slate-400">
                        <strong className="text-white font-mono">{s.count.toLocaleString()}</strong> ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        style={{ width: `${pct}%` }} 
                        className="h-full bg-amber-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                No AWS services recorded (0 data)
              </div>
            )}
          </div>
        </div>

        {/* Top Event Names */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-white">Top Event Names (Actions)</h3>
              <p className="text-xs text-slate-400">Most frequently invoked API methods</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {topEventNames.length} Actions
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {topEventNames.length > 0 ? (
              topEventNames.slice(0, 7).map((e) => {
                const pct = total > 0 ? ((e.count / total) * 100).toFixed(1) : 0;
                return (
                  <div 
                    key={e.name}
                    onClick={() => onNavigateToTable({ search: e.name })}
                    className="p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/80 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono text-slate-200 group-hover:text-amber-400 transition-colors truncate max-w-[260px]">
                        {e.name}
                      </span>
                      <span className="text-slate-400">
                        <strong className="text-white font-mono">{e.count.toLocaleString()}</strong> ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        style={{ width: `${pct}%` }} 
                        className="h-full bg-blue-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                No API events recorded (0 data)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Executive Error Summary Modal */}
      <AIExecutiveSummaryModal
        isOpen={showAiSummaryModal}
        onClose={() => setShowAiSummaryModal(false)}
      />
    </div>
  );
}

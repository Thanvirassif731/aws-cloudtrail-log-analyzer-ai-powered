import React from 'react';
import { 
  X, 
  BookOpen, 
  Shield, 
  Key, 
  LayoutDashboard, 
  TableProperties, 
  FileText, 
  Download, 
  RefreshCw, 
  Search, 
  Filter, 
  AlertTriangle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { APP_VERSION, AUTHOR_NAME, AUTHOR_URL } from '../version';

export default function HelpGuideModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">CloudTrail Analyzer User Guide</h2>
              <p className="text-xs text-slate-400">Instructions & operational manual for administrators</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Quick Access Credentials */}
          <section className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider mb-2">
              <Key className="w-4 h-4" />
              <span>Admin Authentication Credentials</span>
            </div>
            <p className="text-xs text-slate-300 mb-2">
              The portal is secured for administrative users only. Default credentials:
            </p>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center gap-4 text-xs font-mono">
              <div>Username: <strong className="text-amber-300">admin</strong></div>
              <span className="text-slate-600">|</span>
              <div>Password: <strong className="text-amber-300">admin123</strong></div>
            </div>
          </section>

          {/* Section 1: Dashboard */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <LayoutDashboard className="w-4 h-4 text-amber-400" />
              <h3>1. Analytics Dashboard Overview</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Provides real-time aggregated metrics across all 1,076 S3 CloudTrail log archives:
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
              <li><strong>KPI Metrics:</strong> Ingests 12,302 events with total error counts (209 failures), unique AWS services (140), IAM identities (7), and regions (20).</li>
              <li><strong>Interactive Daily Timeline:</strong> Click any day's bar in the chart to automatically filter the events table to that specific day.</li>
              <li><strong>Ranked Services & Actions:</strong> Shows call volume and percentage. Click any service (e.g. KMS, STS, SSM, S3) to filter logs.</li>
              <li><strong>Security Alerts:</strong> Audits Root account operations (365 events) and API failures with 1-click filter shortcuts.</li>
            </ul>
          </section>

          {/* Section 2: Event Explorer Table */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <TableProperties className="w-4 h-4 text-amber-400" />
              <h3>2. Event Explorer Table & Search</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Explore individual CloudTrail log records with high performance:
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
              <li><strong>Global Search:</strong> Instantly filter across Event Name, Service, IAM User/Principal, Source IP, Request ID, and Error Codes.</li>
              <li><strong>Dropdown Filters:</strong> Combine filters for Service, Region, Principal, Status (Success/Error), and Type (Read/Write).</li>
              <li><strong>Column Sorting:</strong> Click any column header to sort ascending or descending.</li>
              <li><strong>Pagination:</strong> Choose 10, 25, 50, or 100 rows per page.</li>
              <li><strong>Export to CSV / JSON:</strong> Click the export buttons at the top right to download all filtered records.</li>
            </ul>
          </section>

          {/* Section 3: Deep Event Details */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <FileText className="w-4 h-4 text-amber-400" />
              <h3>3. Inspecting Event Details</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Click any row in the table or the <strong>"Details"</strong> button to open the deep inspection drawer:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
                <span className="font-semibold text-white">Overview & Identity</span>
                <p className="text-slate-400 mt-1">Caller ARN, Principal ID, Account ID, Source IP, User Agent, TLS version, and full error code + message.</p>
              </div>
              <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
                <span className="font-semibold text-white">Parameters & Elements</span>
                <p className="text-slate-400 mt-1">Pretty-printed JSON for requestParameters and responseElements with 1-click clipboard copy.</p>
              </div>
              <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg sm:col-span-2">
                <span className="font-semibold text-white">Raw CloudTrail Record</span>
                <p className="text-slate-400 mt-1">Complete raw CloudTrail JSON record with 1-click "Copy Full JSON" and "Download JSON" buttons.</p>
              </div>
            </div>
          </section>

          {/* Section 4: Rescan */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <h3>4. Rescanning Local Logs</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Whenever you download new `.json.gz` log archives into your <code className="text-amber-300">AWSLogs</code> directory, simply click the <strong>"Rescan Logs"</strong> button in the top navigation bar. The server will re-index all records in memory without restarting.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span>AWS CloudTrail Analyzer <strong className="text-amber-400 font-mono">v{APP_VERSION}</strong></span>
            <span>•</span>
            <span>Created by <a href={AUTHOR_URL} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline font-medium">{AUTHOR_NAME}</a></span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Shield, GitPullRequest, ExternalLink } from 'lucide-react';
import { APP_VERSION, AUTHOR_NAME, AUTHOR_URL, CONTRIBUTOR_NOTE } from '../version';

export default function Footer({ className = '' }) {
  return (
    <footer 
      role="contentinfo"
      className={`mt-auto border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md text-slate-400 transition-colors ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-center lg:text-left">
          
          {/* Left section: App Brand & Version & Open Source Attribution */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Shield className="w-3 h-3 text-amber-400" />
              </div>
              <span className="font-semibold text-slate-200">AWS CloudTrail Analyzer</span>
            </div>

            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
              v{APP_VERSION}
            </span>

            <span className="text-slate-600 hidden sm:inline">•</span>

            <span className="text-slate-300">
              Open source created by{' '}
              <a
                href={AUTHOR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-amber-400 hover:text-amber-300 underline decoration-amber-500/40 hover:decoration-amber-300 transition-colors inline-flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-amber-400 rounded-sm"
              >
                {AUTHOR_NAME}
                <ExternalLink className="w-3 h-3 text-amber-400/80 inline" />
              </a>
            </span>
          </div>

          {/* Right section: Contributor Call to Action */}
          <div className="flex items-center justify-center gap-2 text-xs">
            <div 
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs transition-colors shadow-sm"
            >
              <GitPullRequest className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{CONTRIBUTOR_NOTE}</span>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}

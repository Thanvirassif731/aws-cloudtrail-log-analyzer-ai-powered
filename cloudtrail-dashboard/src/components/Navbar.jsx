import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  LayoutDashboard, 
  TableProperties, 
  RefreshCw, 
  LogOut, 
  UserCheck, 
  Globe, 
  Server, 
  Layers, 
  HelpCircle, 
  Folder, 
  FolderCheck, 
  FolderX, 
  AlertTriangle,
  Cloud,
  HardDrive
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onRescan, 
  scanning, 
  onOpenHelp,
  sources = [],
  onOpenLocationsModal,
  stats,
  sourceFilter = 'all',
  onSourceFilterChange
}) {
  const { user, logout } = useAuth();
  const [rescanSuccess, setRescanSuccess] = useState(false);

  const handleRescanClick = async () => {
    if (scanning) return;
    await onRescan();
    setRescanSuccess(true);
    setTimeout(() => setRescanSuccess(false), 2500);
  };

  const totalRecords = stats?.total || 0;
  const localCount = stats?.localCount || 0;
  const cloudCount = stats?.cloudCount || 0;

  const accountId = stats?.primaryAccountId || (totalRecords > 0 ? 'Multi-Account' : 'None');
  const regionName = stats?.primaryRegion || (totalRecords > 0 ? 'Multi-Region' : 'N/A');

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Navigation */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/30 border border-amber-500/40 flex items-center justify-center shadow-md shadow-amber-500/10">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base tracking-tight">CloudTrail</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                    Analyzer
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>Account: <strong className="text-slate-300 font-mono">{accountId}</strong></span>
                  <span>•</span>
                  <span>Region: <strong className="text-slate-300 font-mono">{regionName}</strong></span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Analytics Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('table')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'table'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <TableProperties className="w-4 h-4" />
                <span>Event Explorer Table</span>
              </button>
            </nav>
          </div>

          {/* Right: Sources Selector, Help, Rescan, Admin badge, Logout */}
          <div className="flex items-center gap-2">
            {/* Manage Sources / Locations Button */}
            <button
              onClick={onOpenLocationsModal}
              title="Manage Log Locations (Local Folders & S3 Buckets)"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                totalRecords > 0
                  ? 'bg-slate-950/80 hover:bg-slate-800 text-slate-200 border-slate-700'
                  : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40 animate-pulse'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">
                Locations ({sources.length})
              </span>
              <span className="text-[10px] text-amber-400 font-mono hidden md:inline">
                ({totalRecords.toLocaleString()})
              </span>
            </button>

            {/* Help / Instructions Button */}
            <button
              onClick={onOpenHelp}
              title="Open User Guide & Instructions"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border bg-slate-800/90 hover:bg-slate-700/80 text-amber-300 border-amber-500/30 transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Help</span>
            </button>

            {/* Rescan Button */}
            <button
              onClick={handleRescanClick}
              disabled={scanning}
              title="Rescan all active locations"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                rescanSuccess
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800/90 hover:bg-slate-700/80 text-slate-300 border-slate-700'
              } disabled:opacity-50`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">
                {scanning ? 'Scanning...' : rescanSuccess ? 'Updated!' : 'Rescan'}
              </span>
            </button>

            {/* Admin User Chip */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs font-bold">
                A
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-200 leading-tight">
                  {user?.username || 'admin'}
                </div>
                <div className="text-[10px] text-amber-400/90 font-medium">Administrator</div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center gap-2 py-2 border-t border-slate-800/60">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium ${
              activeTab === 'table'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <TableProperties className="w-3.5 h-3.5" />
            <span>Event Table</span>
          </button>
        </div>
      </div>
    </header>
  );
}

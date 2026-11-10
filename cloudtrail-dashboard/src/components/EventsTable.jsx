import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Search, 
  Filter, 
  X, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  ArrowUpDown, 
  RotateCcw,
  Shield,
  Layers,
  FileSpreadsheet,
  FileCode,
  FolderSearch,
  HardDrive,
  Cloud,
  Globe
} from 'lucide-react';

export default function EventsTable({ initialFilters = {}, onSelectEvent, onOpenLocationsModal, sources = [] }) {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter options loaded from backend
  const [filterOptions, setFilterOptions] = useState({ services: [], regions: [], users: [] });

  // Current filter state
  const [filters, setFilters] = useState({
    search: '',
    service: '',
    region: '',
    user: '',
    status: 'all',
    readOnly: 'all',
    sourceType: 'all', // 'all' | 'local' | 'cloud'
    startDate: '',
    endDate: '',
    sortField: 'eventTime',
    sortOrder: 'desc',
    ...initialFilters
  });

  // Sync initialFilters if prop changes
  useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      setFilters(prev => ({
        ...prev,
        ...initialFilters,
        page: 1
      }));
    }
  }, [initialFilters]);

  // Load filter options on mount
  useEffect(() => {
    api.getFilterOptions()
      .then(opts => setFilterOptions(opts || { services: [], regions: [], users: [] }))
      .catch(() => {});
  }, [sources]);

  // Fetch events whenever filters, page, or sources change
  useEffect(() => {
    fetchEvents();
  }, [filters, pagination.page, pagination.limit, sources]);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEvents({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        service: filters.service,
        region: filters.region,
        user: filters.user,
        status: filters.status,
        readOnly: filters.readOnly,
        sourceType: filters.sourceType,
        startDate: filters.startDate,
        endDate: filters.endDate,
        sortField: filters.sortField,
        sortOrder: filters.sortOrder
      });
      setRecords(data.records || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      }));
    } catch (err) {
      setError(err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      service: '',
      region: '',
      user: '',
      status: 'all',
      readOnly: 'all',
      sourceType: 'all',
      startDate: '',
      endDate: '',
      sortField: 'eventTime',
      sortOrder: 'desc'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (field) => {
    setFilters(prev => {
      const isCurrentField = prev.sortField === field;
      const newOrder = isCurrentField && prev.sortOrder === 'desc' ? 'asc' : 'desc';
      return {
        ...prev,
        sortField: field,
        sortOrder: newOrder
      };
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleExport = (format) => {
    const exportUrl = api.getExportUrl(filters, format);
    window.open(exportUrl, '_blank');
  };

  const formatDateTime = (iso) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch {
      return iso;
    }
  };

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.service ||
    filters.region ||
    filters.user ||
    filters.status !== 'all' ||
    filters.readOnly !== 'all' ||
    filters.sourceType !== 'all' ||
    filters.startDate ||
    filters.endDate
  );

  return (
    <div className="space-y-4 pb-12 animate-fade-in">
      {/* Search and Filters Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search across Event Name, Service, IAM User, IP Address, S3 Bucket, Error Code..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
            {filters.search && (
              <button
                onClick={() => handleFilterChange('search', '')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('csv')}
              title="Export filtered records to CSV"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => handleExport('json')}
              title="Export filtered records to JSON"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-all cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Filters Row (Includes Origin / Cloud Segregation Filter) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-800">
          {/* Data Origin Segregation Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Globe className="w-3 h-3 text-amber-400" />
              <span>Data Origin</span>
            </label>
            <select
              value={filters.sourceType}
              onChange={(e) => handleFilterChange('sourceType', e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Origins (Local & S3)</option>
              <option value="local">💻 Local Files Only</option>
              <option value="cloud">☁️ AWS S3 Cloud Only</option>
            </select>
          </div>

          {/* Service Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              AWS Service
            </label>
            <select
              value={filters.service}
              onChange={(e) => handleFilterChange('service', e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">All Services</option>
              {filterOptions.services.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Region Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              AWS Region
            </label>
            <select
              value={filters.region}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">All Regions</option>
              {filterOptions.regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* User / Principal Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              IAM Principal
            </label>
            <select
              value={filters.user}
              onChange={(e) => handleFilterChange('user', e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">All Principals</option>
              {filterOptions.users.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success Only</option>
              <option value="error">Errors Only</option>
            </select>
          </div>

          {/* Reset Filters Action */}
          <div className="flex flex-col justify-end">
            <button
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* Active Filter Pills Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400 font-medium">Active Filters:</span>
            {filters.sourceType !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/30">
                Origin: {filters.sourceType === 'local' ? 'Local Files' : 'S3 Cloud'}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => handleFilterChange('sourceType', 'all')} />
              </span>
            )}
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Search: "{filters.search}"
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => handleFilterChange('search', '')} />
              </span>
            )}
            {filters.service && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/30">
                Service: {filters.service}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => handleFilterChange('service', '')} />
              </span>
            )}
            {filters.region && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Region: {filters.region}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => handleFilterChange('region', '')} />
              </span>
            )}
            {filters.user && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                User: {filters.user}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => handleFilterChange('user', '')} />
              </span>
            )}
            {filters.status !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/30">
                Status: {filters.status}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => handleFilterChange('status', 'all')} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {/* Table Header Info Bar */}
        <div className="px-5 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/40">
          <div className="text-xs text-slate-400">
            Showing <strong className="text-white font-mono">{Math.min(pagination.total, (pagination.page - 1) * pagination.limit + 1)}</strong> - <strong className="text-white font-mono">{Math.min(pagination.total, pagination.page * pagination.limit)}</strong> of <strong className="text-amber-400 font-mono">{pagination.total.toLocaleString()}</strong> events
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Rows per page:</span>
            <select
              value={pagination.limit}
              onChange={(e) => setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
              className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-medium border-b border-slate-800">
              <tr>
                <th scope="col" className="px-4 py-3 w-12 text-center">Status</th>
                <th scope="col" className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('eventTime')}>
                  <div className="flex items-center gap-1.5">
                    <span>Event Time</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th scope="col" className="px-4 py-3">Origin</th>
                <th scope="col" className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('eventName')}>
                  <div className="flex items-center gap-1.5">
                    <span>Event Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('service')}>
                  <div className="flex items-center gap-1.5">
                    <span>Service</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('user')}>
                  <div className="flex items-center gap-1.5">
                    <span>Principal / User</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('awsRegion')}>
                  <div className="flex items-center gap-1.5">
                    <span>Region</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th scope="col" className="px-4 py-3">Modality</th>
                <th scope="col" className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading CloudTrail logs...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Filter className="w-8 h-8 text-slate-600" />
                      <span className="text-sm font-medium text-slate-300">
                        No events found matching your criteria
                      </span>
                      <p className="text-xs text-slate-500">
                        Try adjusting your search terms, origin filter, or add an S3 bucket location.
                      </p>
                      {onOpenLocationsModal && (
                        <button
                          onClick={onOpenLocationsModal}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          <FolderSearch className="w-3.5 h-3.5" />
                          <span>Manage Log Locations</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const isRoot = r.principalName && r.principalName.includes('root');
                  const isCloud = r.sourceType === 'cloud';

                  return (
                    <tr 
                      key={r._id} 
                      onClick={() => onSelectEvent(r._id)}
                      className="hover:bg-slate-850 transition-colors cursor-pointer group"
                    >
                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        {r.hasError ? (
                          <div className="inline-flex p-1 rounded-md bg-rose-500/10 text-rose-400" title={r.errorCode || 'Error'}>
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="inline-flex p-1 rounded-md bg-emerald-500/10 text-emerald-400" title="Success">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </td>

                      {/* Event Time */}
                      <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">
                        {formatDateTime(r.eventTime)}
                      </td>

                      {/* Origin Badge (Local vs S3 Cloud) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isCloud ? (
                          <span 
                            title={r.sourceLocation || r.sourceName}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30"
                          >
                            <Cloud className="w-3 h-3" />
                            <span>S3 Cloud</span>
                          </span>
                        ) : (
                          <span 
                            title={r.sourceLocation || 'Local Filesystem'}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30"
                          >
                            <HardDrive className="w-3 h-3" />
                            <span>Local</span>
                          </span>
                        )}
                      </td>

                      {/* Event Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white group-hover:text-amber-400 transition-colors font-mono">
                            {r.eventName}
                          </span>
                          {r.errorCode && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              {r.errorCode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Service */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-800 text-amber-300/90 border border-slate-700">
                          {r.service}
                        </span>
                      </td>

                      {/* User / Principal */}
                      <td className="px-4 py-3 max-w-[180px] truncate">
                        <span className={`font-mono text-xs ${isRoot ? 'text-amber-400 font-semibold' : 'text-slate-300'}`}>
                          {r.principalName}
                        </span>
                      </td>

                      {/* Region */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-slate-400 font-mono">
                          {r.awsRegion}
                        </span>
                      </td>

                      {/* Modality */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.readOnly === true ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
                            Read
                          </span>
                        ) : r.readOnly === false ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            Write
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">-</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(r._id);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 group-hover:text-white rounded-lg text-xs font-medium border border-slate-700 inline-flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Page <strong className="text-white font-mono">{pagination.page}</strong> of <strong className="text-white font-mono">{pagination.totalPages}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-amber-400 font-semibold">
              {pagination.page}
            </span>

            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: pagination.totalPages }))}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

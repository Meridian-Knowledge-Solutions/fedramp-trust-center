import React, { useState, useMemo } from 'react';
import { useData } from '../../hooks/useData';
import { useModal } from '../../contexts/ModalContext';
import { useAuth } from '../../hooks/useAuth';
import { Sanitizer } from '../../utils/sanitizer';
import {
  Search, X, ChevronDown, ChevronRight, Clock,
  CheckCircle2, XCircle, AlertTriangle, Info, Terminal, Lock, Layers
} from 'lucide-react';

const getRelativeTime = (timestamp) => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'just now';
};

export const KSIGrid = () => {
  const { ksis, loading } = useData();
  const { openModal } = useModal();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter
  const filteredKsis = useMemo(() => {
    return ksis.filter(ksi => {
      const matchesSearch = searchTerm === '' ||
        ksi.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ksi.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ksi.category.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === 'passed') matchesStatus = (ksi.assertion === true || ksi.assertion === "true") && ksi.status !== 'meets_threshold';
      else if (statusFilter === 'failed') matchesStatus = ksi.assertion === false || ksi.assertion === "false";
      else if (statusFilter === 'warning') matchesStatus = ksi.status === 'warning';
      else if (statusFilter === 'meets_threshold') matchesStatus = ksi.status === 'meets_threshold';

      return matchesSearch && matchesStatus;
    });
  }, [ksis, searchTerm, statusFilter]);

  // Group by Category, sort failures to top within each group
  const groupedKsis = useMemo(() => {
    const groups = {};
    filteredKsis.forEach(ksi => {
      const cat = ksi.category || 'General Security';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ksi);
    });

    // Sort items within each group: failed first, then meets_threshold, then warning, then passed
    const statusOrder = { 'failed': 0, 'meets_threshold': 1, 'warning': 2, 'info': 3, 'passed': 4, 'unknown': 5 };
    for (const cat of Object.keys(groups)) {
      groups[cat].sort((a, b) => (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5));
    }

    // Sort categories: those with failures first, then alphabetical
    return Object.keys(groups)
      .sort((a, b) => {
        const aFailed = groups[a].some(k => k.status === 'failed');
        const bFailed = groups[b].some(k => k.status === 'failed');
        if (aFailed !== bFailed) return aFailed ? -1 : 1;
        return a.localeCompare(b);
      })
      .reduce((acc, key) => { acc[key] = groups[key]; return acc; }, {});
  }, [filteredKsis]);

  const statusCounts = useMemo(() => {
    return {
      all: ksis.length,
      passed: ksis.filter(k => (k.assertion === true || k.assertion === "true") && k.status !== 'meets_threshold').length,
      failed: ksis.filter(k => k.assertion === false || k.assertion === "false").length,
      meets_threshold: ksis.filter(k => k.status === 'meets_threshold').length,
      warning: ksis.filter(k => k.status === 'warning').length,
    };
  }, [ksis]);

  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Loading compliance data...</div>;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-900/50 p-2 rounded-xl border border-gray-700/50">
        {/* Search */}
        <div className="relative w-full md:w-96 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-10 py-2 border border-transparent rounded-lg leading-5 bg-gray-800 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-gray-800 transition-all text-sm"
            placeholder="Search controls..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 p-1 bg-gray-800 rounded-lg overflow-x-auto w-full md:w-auto no-scrollbar border border-gray-700">
          <FilterTab label="All" count={statusCounts.all} active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
          <FilterTab label="Operational" count={statusCounts.passed} active={statusFilter === 'passed'} onClick={() => setStatusFilter('passed')} />
          <FilterTab label="Failed" count={statusCounts.failed} active={statusFilter === 'failed'} onClick={() => setStatusFilter('failed')} />
          {statusCounts.meets_threshold > 0 && (
            <FilterTab label="Meets Threshold" count={statusCounts.meets_threshold} active={statusFilter === 'meets_threshold'} onClick={() => setStatusFilter('meets_threshold')} />
          )}
          {statusCounts.warning > 0 && (
            <FilterTab label="Conditional" count={statusCounts.warning} active={statusFilter === 'warning'} onClick={() => setStatusFilter('warning')} />
          )}
        </div>
      </div>

      {/* Category Sections */}
      <div className="space-y-8">
        {Object.entries(groupedKsis).map(([category, items]) => (
          <CategorySection key={category} category={category} items={items} openModal={openModal} />
        ))}

        {filteredKsis.length === 0 && (
          <div className="text-center py-20 text-gray-500 border-2 border-dashed border-gray-700 rounded-xl">
            No controls match your current filters.
            <button onClick={handleReset} className="block mx-auto mt-2 text-blue-400 hover:underline">Reset Filters</button>
          </div>
        )}
      </div>
    </div>
  );
};

// Collapsible Category Section
const CategorySection = ({ category, items, openModal }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const passed = items.filter(i => i.assertion === true || i.assertion === "true").length;
  const failed = items.filter(i => i.assertion === false || i.assertion === "false").length;
  const passRate = Math.round((passed / items.length) * 100);
  const isPerfect = passRate === 100;

  return (
    <div className="border border-gray-700 rounded-xl bg-gray-800 overflow-hidden shadow-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-750 transition-colors border-b border-gray-700 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${failed > 0 ? 'bg-red-500/10 text-red-400' : isPerfect ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
            <Layers size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{category}</h3>
            <div className="flex items-center gap-3 text-xs font-medium text-gray-400 mt-0.5">
              <span>{items.length} controls</span>
              <span className="text-gray-600">&middot;</span>
              <span className={failed > 0 ? 'text-red-400' : 'text-green-400'}>
                {failed > 0 ? `${failed} requiring action` : 'All operational'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 w-48">
            <div className="h-1.5 flex-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${failed > 0 ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${passRate}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-gray-300 w-8 text-right">{passRate}%</span>
          </div>
          {isExpanded ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronRight size={18} className="text-gray-500" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-6 bg-[#0B0C10] animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(ksi => (
              <KSICard key={ksi.id} ksi={ksi} openModal={openModal} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const FilterTab = ({ label, count, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${active
        ? 'bg-gray-700 text-white shadow-sm'
        : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
  >
    {label}
    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-gray-900 text-gray-300' : 'bg-gray-800 text-gray-600'}`}>
      {count}
    </span>
  </button>
);

const KSICard = ({ ksi, openModal }) => {
  const { isAuthenticated } = useAuth();
  const meta = Sanitizer.mapStatus(ksi.status);

  // Color mapping — blue for meets_threshold to distinguish from green pass
  const colors = {
    'passed': { border: 'border-green-500', text: 'text-green-400', bg: 'bg-green-500/10' },
    'meets_threshold': { border: 'border-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10' },
    'failed': { border: 'border-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
    'warning': { border: 'border-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    'info': { border: 'border-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10' }
  }[ksi.status] || { border: 'border-gray-500', text: 'text-gray-400', bg: 'bg-gray-500/10' };

  const IconMap = { 'CheckCircle2': CheckCircle2, 'XCircle': XCircle, 'AlertTriangle': AlertTriangle, 'Info': Info };
  const Icon = IconMap[meta.icon] || Info;
  const relTime = getRelativeTime(ksi.timestamp);

  return (
    <div
      onClick={() => openModal('why', ksi)}
      className={`group bg-gray-800 rounded-lg border border-gray-700 p-5 hover:border-gray-600 transition-all cursor-pointer flex flex-col h-full relative overflow-hidden`}
    >
      {/* Colored Accent Line (Left) */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.border}`}></div>

      <div className="flex justify-between items-start mb-3 pl-3">
        <span className="font-mono text-[10px] font-bold text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-700">
          {ksi.id}
        </span>
        <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 ${colors.bg} ${colors.text}`}>
          <Icon size={12} /> {meta.label}
        </span>
      </div>

      <h4 className="pl-3 text-sm font-medium text-gray-200 mb-2 group-hover:text-blue-400 transition-colors leading-relaxed flex-1">
        {ksi.description}
      </h4>
      {ksi.status === 'warning' && (
        <p className="pl-3 text-[10px] text-amber-400/70 mb-2 leading-snug">
          Passes validation but has conditions requiring ongoing monitoring
        </p>
      )}
      {ksi.status === 'failed' && (
        <p className="pl-3 text-[10px] text-red-400/70 mb-2 leading-snug">
          Failed validation — corrective action required
        </p>
      )}

      <div className="pl-3 pt-3 border-t border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
          <span>{ksi.commands_executed} checks</span>
          {relTime && (
            <>
              <span className="text-gray-700">&middot;</span>
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {relTime}
              </span>
            </>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isAuthenticated) {
              openModal('accessRequired', { featureName: 'CLI Logs', benefits: ['View raw CLI commands'] });
            } else {
              openModal('cli', ksi);
            }
          }}
          className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          {isAuthenticated ? <Terminal size={14} /> : <Lock size={12} />}
          View CLI
        </button>
      </div>
    </div>
  );
};

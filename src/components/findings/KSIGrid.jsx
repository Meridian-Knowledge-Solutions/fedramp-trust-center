import React, { useState, useMemo } from 'react';
import { useData } from '../../hooks/useData';
import { useModal } from '../../contexts/ModalContext';
import { useAuth } from '../../hooks/useAuth';
import { Sanitizer } from '../../utils/sanitizer';
import {
  Search, X, ChevronDown, ChevronRight, TrendingUp,
  CheckCircle2, XCircle, AlertTriangle, Info, Terminal, Lock, Layers
} from 'lucide-react';

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
      if (statusFilter === 'passed') matchesStatus = ksi.assertion === true || ksi.assertion === "true";
      else if (statusFilter === 'failed') matchesStatus = ksi.assertion === false || ksi.assertion === "false";
      else if (statusFilter === 'warning') matchesStatus = ksi.status === 'warning';

      return matchesSearch && matchesStatus;
    });
  }, [ksis, searchTerm, statusFilter]);

  // Group by Category
  const groupedKsis = useMemo(() => {
    const groups = {};
    filteredKsis.forEach(ksi => {
      const cat = ksi.category || 'General Security';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ksi);
    });
    return Object.keys(groups).sort().reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {});
  }, [filteredKsis]);

  const statusCounts = useMemo(() => {
    return {
      all: ksis.length,
      passed: ksis.filter(k => k.assertion === true || k.assertion === "true").length,
      failed: ksis.filter(k => k.assertion === false || k.assertion === "false").length,
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
      {/* 1. Dark Toolbar (Matches Screenshot) */}
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

        {/* Filter Tabs (Dark Pills) */}
        <div className="flex gap-1 p-1 bg-gray-800 rounded-lg overflow-x-auto w-full md:w-auto no-scrollbar border border-gray-700">
          <FilterTab label="All" count={statusCounts.all} active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
          <FilterTab label="Compliant" count={statusCounts.passed} active={statusFilter === 'passed'} onClick={() => setStatusFilter('passed')} />
          <FilterTab label="Failed" count={statusCounts.failed} active={statusFilter === 'failed'} onClick={() => setStatusFilter('failed')} />
          <FilterTab label="Low Risk" count={statusCounts.warning} active={statusFilter === 'warning'} onClick={() => setStatusFilter('warning')} />
        </div>
      </div>

      {/* 2. Category Sections */}
      <div className="space-y-8">
        {Object.entries(groupedKsis).map(([category, items]) => (
          <CategorySection
            key={category}
            category={category}
            items={items}
            openModal={openModal}
          />
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

// Collapsible Category Section (Dark Mode)
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
          <div className={`p-2 rounded-lg ${isPerfect ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
            <Layers size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{category}</h3>
            <div className="flex items-center gap-3 text-xs font-medium text-gray-400 mt-0.5">
              <span>{items.length} controls</span>
              <span className="text-gray-600">•</span>
              <span className={failed > 0 ? 'text-red-400' : 'text-green-400'}>
                {failed > 0 ? `${failed} Attention Items` : 'No Issues'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 w-48">
            <div className="h-1.5 flex-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isPerfect ? 'bg-green-500' : 'bg-yellow-500'}`}
                style={{ width: `${passRate}%` }}
              ></div>
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

  // Dark Theme Mapping
  const colors = {
    'passed': { border: 'border-green-500', text: 'text-green-400', bg: 'bg-green-500/10' },
    'failed': { border: 'border-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
    'warning': { border: 'border-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    'info': { border: 'border-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10' }
  }[ksi.status] || { border: 'border-gray-500', text: 'text-gray-400', bg: 'bg-gray-500/10' };

  const IconMap = { 'CheckCircle2': CheckCircle2, 'XCircle': XCircle, 'AlertTriangle': AlertTriangle, 'Info': Info };
  const Icon = IconMap[meta.icon] || Info;

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

      <h4 className="pl-3 text-sm font-medium text-gray-200 mb-4 group-hover:text-blue-400 transition-colors leading-relaxed flex-1">
        {ksi.description}
      </h4>

      <div className="pl-3 pt-3 border-t border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
          <TrendingUp size={14} />
          <span>{ksi.commands_executed} checks</span>
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
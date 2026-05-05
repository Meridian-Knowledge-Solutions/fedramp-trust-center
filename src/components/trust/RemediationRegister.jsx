/**
 * Remediation Register — FedRAMP 20x Continuous Remediation Register
 *
 * Reads remediation_backlog.json (public schema). Surfaces actionable findings
 * from the engine's resource-level evaluations as a sortable, filterable
 * table — the operational PoAM-equivalent for the trust center.
 *
 * Public schema constraints (engine-enforced redaction):
 *   - No raw resource names — only opaque "[r-<6char>]" hashes (stable for grouping)
 *   - No owner, no remediation_plan, no risk_acceptance text
 *   - reason text is either redacted-with-context or a per-KSI category fallback
 */
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../hooks/useData';
import {
  Search, X, ChevronDown, ChevronRight, AlertOctagon,
  AlertTriangle, AlertCircle, Info, Clock,
  Shield, Layers, Hash, Filter
} from 'lucide-react';

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const STATE_ORDER = { OPEN: 0, IN_PROGRESS: 1, RISK_ACCEPTED: 2, CLOSED: 3 };

const severityConfig = {
  CRITICAL: { dot: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertOctagon },
  HIGH:     { dot: 'bg-orange-500', text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: AlertTriangle },
  MEDIUM:   { dot: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: AlertCircle },
  LOW:      { dot: 'bg-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Info },
};

const stateConfig = {
  OPEN:          { text: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/30', label: 'OPEN' },
  IN_PROGRESS:   { text: 'text-blue-300', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'IN PROGRESS' },
  RISK_ACCEPTED: { text: 'text-purple-300', bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'RISK ACCEPTED' },
  CLOSED:        { text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'CLOSED' },
};

const STALE_DAYS = 30;

const daysSince = (iso) => {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / 86400000);
};

const ageLabel = (iso) => {
  const d = daysSince(iso);
  if (d == null) return '—';
  if (d === 0) return 'today';
  if (d === 1) return '1d';
  return `${d}d`;
};

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return '—'; }
};

const SeverityChip = ({ severity }) => {
  const cfg = severityConfig[severity] || severityConfig.LOW;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {severity}
    </span>
  );
};

const StateChip = ({ state }) => {
  const cfg = stateConfig[state] || stateConfig.OPEN;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
};

const StaleBadge = ({ firstSeen, state }) => {
  if (state !== 'OPEN') return null;
  const d = daysSince(firstSeen);
  if (d == null || d < STALE_DAYS) return null;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-amber-500/30 bg-amber-500/10 text-amber-300">
      <Clock size={9} /> Stale {d}d
    </span>
  );
};

const FilterPill = ({ label, count, active, onClick, color }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${
      active
        ? 'bg-white/10 text-white border-white/20'
        : 'bg-transparent text-slate-400 border-transparent hover:text-white hover:bg-white/5'
    }`}
  >
    {color && <span className={`w-1.5 h-1.5 rounded-full ${color}`} />}
    {label}
    {count != null && (
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-black/30 text-slate-200' : 'bg-white/5 text-slate-500'}`}>
        {count}
      </span>
    )}
  </button>
);

const Row = ({ item }) => {
  const [open, setOpen] = useState(false);
  const sev = severityConfig[item.severity] || severityConfig.LOW;
  const SevIcon = sev.icon;

  return (
    <>
      <tr
        onClick={() => setOpen(o => !o)}
        className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
      >
        <td className="px-3 py-2.5 align-middle">
          <div className="flex items-center gap-2">
            {open ? <ChevronDown size={12} className="text-slate-500" /> : <ChevronRight size={12} className="text-slate-500" />}
            <SevIcon size={12} className={sev.text} />
            <SeverityChip severity={item.severity} />
          </div>
        </td>
        <td className="px-3 py-2.5 align-middle font-mono text-[11px] text-white">{item.ksi}</td>
        <td className="px-3 py-2.5 align-middle font-mono text-[11px] text-slate-400">{item.resource}</td>
        <td className="px-3 py-2.5 align-middle">
          <div className="flex items-center gap-2">
            <StateChip state={item.tracking?.state || 'OPEN'} />
            <StaleBadge firstSeen={item.first_seen} state={item.tracking?.state} />
          </div>
        </td>
        <td className="px-3 py-2.5 align-middle text-[11px] text-slate-300 font-mono tabular-nums">
          {item.tracking?.target_date || '—'}
        </td>
        <td className="px-3 py-2.5 align-middle text-[11px] text-slate-400 font-mono tabular-nums">
          {ageLabel(item.first_seen)}
        </td>
        <td className="px-3 py-2.5 align-middle font-mono text-[10px] text-slate-500">{item.id}</td>
      </tr>
      {open && (
        <tr className="bg-black/30">
          <td colSpan={7} className="px-6 py-4 border-b border-white/5">
            <div className="space-y-3 text-[12px]">
              <div>
                <div className="text-[9px] uppercase tracking-wider font-bold text-slate-500 mb-1">Reason</div>
                <p className="text-slate-300 leading-relaxed font-mono">{item.reason || '—'}</p>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px]">
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 mr-2">First seen</span>
                  <span className="text-slate-300 font-mono">{formatDate(item.first_seen)}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 mr-2">Last seen</span>
                  <span className="text-slate-300 font-mono">{formatDate(item.last_seen)}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 mr-2">Status</span>
                  <span className="text-slate-300 font-mono">{item.status || '—'}</span>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export const RemediationRegister = ({ initialFilters = {} }) => {
  const { backlog, loading } = useData();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState(initialFilters.severity || 'all');
  const [stateFilter, setStateFilter] = useState(initialFilters.state || 'all');
  const [ksiFilter, setKsiFilter] = useState(initialFilters.ksi || 'all');
  const [groupByResource, setGroupByResource] = useState(false);

  // Re-apply incoming filters when navigation changes them (e.g. heatmap click).
  useEffect(() => {
    if (initialFilters.severity) setSeverityFilter(initialFilters.severity);
    if (initialFilters.state) setStateFilter(initialFilters.state);
    if (initialFilters.ksi) setKsiFilter(initialFilters.ksi);
  }, [initialFilters.severity, initialFilters.state, initialFilters.ksi]);

  const items = backlog?.items || [];

  const counts = useMemo(() => {
    const sev = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    const st = { OPEN: 0, IN_PROGRESS: 0, RISK_ACCEPTED: 0, CLOSED: 0 };
    for (const it of items) {
      if (sev[it.severity] != null) sev[it.severity]++;
      const s = it.tracking?.state || 'OPEN';
      if (st[s] != null) st[s]++;
    }
    return { severity: sev, state: st };
  }, [items]);

  const ksiOptions = useMemo(() => {
    const set = new Set(items.map(i => i.ksi).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(it => {
      if (severityFilter !== 'all' && it.severity !== severityFilter) return false;
      if (stateFilter !== 'all' && (it.tracking?.state || 'OPEN') !== stateFilter) return false;
      if (ksiFilter !== 'all' && it.ksi !== ksiFilter) return false;
      if (term) {
        const hay = `${it.id} ${it.ksi} ${it.resource} ${it.reason}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    }).sort((a, b) => {
      const sevA = SEVERITY_ORDER[a.severity] ?? 9;
      const sevB = SEVERITY_ORDER[b.severity] ?? 9;
      if (sevA !== sevB) return sevA - sevB;
      const stA = STATE_ORDER[a.tracking?.state || 'OPEN'] ?? 9;
      const stB = STATE_ORDER[b.tracking?.state || 'OPEN'] ?? 9;
      if (stA !== stB) return stA - stB;
      return new Date(a.first_seen).getTime() - new Date(b.first_seen).getTime();
    });
  }, [items, search, severityFilter, stateFilter, ksiFilter]);

  const resourceGroups = useMemo(() => {
    if (!groupByResource) return null;
    const groups = {};
    for (const it of filtered) {
      const key = it.resource || '(unknown)';
      if (!groups[key]) groups[key] = { resource: key, items: [], ksis: new Set() };
      groups[key].items.push(it);
      groups[key].ksis.add(it.ksi);
    }
    return Object.values(groups).sort((a, b) => b.items.length - a.items.length);
  }, [filtered, groupByResource]);

  const handleResetFilters = () => {
    setSearch('');
    setSeverityFilter('all');
    setStateFilter('all');
    setKsiFilter('all');
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading remediation register...</div>;
  }

  if (!backlog) {
    return (
      <div className="border border-white/5 rounded-xl bg-[#0c0c10] p-12 text-center">
        <Shield size={32} className="text-slate-600 mx-auto mb-3" />
        <h3 className="font-bold text-white text-lg mb-2">Remediation Register Not Yet Published</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          The engine has not yet published <code className="text-xs text-slate-300 bg-white/5 px-1.5 py-0.5 rounded">remediation_backlog.json</code> to the trust-center data path.
          This file is generated by the FedRAMP 20x continuous remediation register pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="border border-white/5 rounded-xl bg-[#0c0c10] p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Layers size={18} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Remediation Register</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-white/5 px-2 py-0.5 rounded bg-white/5">
                FedRAMP 20x · Public
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {backlog.total_items} actionable items
              {backlog.filtered_info_count > 0 && <> · {backlog.filtered_info_count} INFO-tier filtered</>}
              {backlog.generated_at && <> · Generated {formatDate(backlog.generated_at)}</>}
            </p>
          </div>
        </div>
        {backlog.note && (
          <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-white/5 leading-relaxed">{backlog.note}</p>
        )}
      </div>

      {/* Filter bar */}
      <div className="border border-white/5 rounded-xl bg-[#0c0c10] p-4 space-y-3">
        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by ID, KSI, resource hash, or reason..."
              className="w-full pl-9 pr-9 py-2 bg-white/5 border border-white/5 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGroupByResource(g => !g)}
              className={`px-3 py-2 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-2 border ${
                groupByResource
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Hash size={11} /> Group by resource
            </button>
            <button
              onClick={handleResetFilters}
              className="px-3 py-2 rounded-lg text-[11px] font-bold text-slate-400 hover:text-white bg-white/5 border border-white/5 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Severity filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mr-2 flex items-center gap-1.5">
            <Filter size={10} /> Severity
          </span>
          <FilterPill label="All" count={items.length} active={severityFilter === 'all'} onClick={() => setSeverityFilter('all')} />
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
            <FilterPill
              key={sev}
              label={sev}
              count={counts.severity[sev]}
              active={severityFilter === sev}
              color={severityConfig[sev].dot}
              onClick={() => setSeverityFilter(severityFilter === sev ? 'all' : sev)}
            />
          ))}
        </div>

        {/* State filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mr-2 flex items-center gap-1.5">
            <Filter size={10} /> State
          </span>
          <FilterPill label="All" active={stateFilter === 'all'} onClick={() => setStateFilter('all')} />
          {['OPEN', 'IN_PROGRESS', 'RISK_ACCEPTED', 'CLOSED'].map(s => (
            <FilterPill
              key={s}
              label={stateConfig[s].label}
              count={counts.state[s]}
              active={stateFilter === s}
              onClick={() => setStateFilter(stateFilter === s ? 'all' : s)}
            />
          ))}
        </div>

        {/* KSI dropdown — only show when there are many */}
        {ksiOptions.length > 4 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mr-1 flex items-center gap-1.5">
              <Filter size={10} /> KSI
            </span>
            <select
              value={ksiFilter}
              onChange={e => setKsiFilter(e.target.value)}
              className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[11px] font-bold text-slate-300 focus:outline-none focus:border-blue-500/40"
            >
              {ksiOptions.map(k => (
                <option key={k} value={k}>{k === 'all' ? 'All KSIs' : k}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>
          Showing {filtered.length} of {items.length} items
        </span>
        {(severityFilter !== 'all' || stateFilter !== 'all' || ksiFilter !== 'all' || search) && (
          <button onClick={handleResetFilters} className="text-blue-400 hover:text-blue-300 font-bold">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="border-2 border-dashed border-white/5 rounded-xl py-16 text-center text-slate-500">
          No items match the current filters.
        </div>
      ) : groupByResource && resourceGroups ? (
        <div className="space-y-3">
          {resourceGroups.map(g => (
            <div key={g.resource} className="border border-white/5 rounded-xl overflow-hidden bg-[#0c0c10]">
              <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Hash size={12} className="text-slate-500" />
                  <span className="font-mono text-[12px] text-white font-bold">{g.resource}</span>
                  <span className="text-[10px] text-slate-500">
                    {g.items.length} finding{g.items.length === 1 ? '' : 's'} · {g.ksis.size} KSI{g.ksis.size === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
              <table className="w-full">
                <tbody>
                  {g.items.map(item => <Row key={item.id} item={item} />)}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-white/5 rounded-xl overflow-hidden bg-[#0c0c10]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-[9px] uppercase tracking-wider font-bold text-slate-500 text-left">
                <th className="px-3 py-2.5">Severity</th>
                <th className="px-3 py-2.5">KSI</th>
                <th className="px-3 py-2.5">Resource</th>
                <th className="px-3 py-2.5">State</th>
                <th className="px-3 py-2.5">Target</th>
                <th className="px-3 py-2.5">Age</th>
                <th className="px-3 py-2.5">ID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => <Row key={item.id} item={item} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RemediationRegister;

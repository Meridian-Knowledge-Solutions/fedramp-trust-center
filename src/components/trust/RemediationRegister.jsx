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

// Console palette: severity drives the dot color + .tag variant.
const severityConfig = {
  CRITICAL: { dot: '#F2607A', tag: 'red',  icon: AlertOctagon },
  HIGH:     { dot: '#F2B85C', tag: 'warn', icon: AlertTriangle },
  MEDIUM:   { dot: '#F2B85C', tag: 'warn', icon: AlertCircle },
  LOW:      { dot: '#818CF8', tag: 'vi',   icon: Info },
};

// State drives the .tag variant + label.
const stateConfig = {
  OPEN:          { tag: 'vi',   label: 'OPEN' },
  IN_PROGRESS:   { tag: 'vi',   label: 'IN PROGRESS' },
  RISK_ACCEPTED: { tag: 'warn', label: 'RISK ACCEPTED' },
  CLOSED:        { tag: 'ok',   label: 'CLOSED' },
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
    <span className={`tag ${cfg.tag}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
      {severity}
    </span>
  );
};

const StateChip = ({ state }) => {
  const cfg = stateConfig[state] || stateConfig.OPEN;
  return <span className={`tag ${cfg.tag}`}>{cfg.label}</span>;
};

const StaleBadge = ({ firstSeen, state }) => {
  if (state !== 'OPEN') return null;
  const d = daysSince(firstSeen);
  if (d == null || d < STALE_DAYS) return null;
  return (
    <span className="tag warn" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <Clock size={9} /> STALE {d}d
    </span>
  );
};

const Row = ({ item }) => {
  const [open, setOpen] = useState(false);
  const sev = severityConfig[item.severity] || severityConfig.LOW;
  const SevIcon = sev.icon;
  const state = item.tracking?.state || 'OPEN';

  return (
    <>
      <div
        className="ctrl"
        onClick={() => setOpen(o => !o)}
        style={{ cursor: 'pointer', alignItems: 'flex-start' }}
      >
        <div className="nm" style={{ flex: 1, minWidth: 0, gap: 12 }}>
          <span style={{ color: '#424E5C', flexShrink: 0, display: 'inline-flex' }}>
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
          <SevIcon size={13} style={{ color: sev.dot, flexShrink: 0 }} />
          <span className="mono" style={{ color: '#818CF8', fontSize: 11, flexShrink: 0 }}>{item.id}</span>
          <span className="mono" style={{ color: '#E8EEF4', fontSize: 12, flexShrink: 0 }}>{item.ksi}</span>
          <span className="mono" style={{ color: '#788596', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.resource}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <SeverityChip severity={item.severity} />
          <StateChip state={state} />
          <StaleBadge firstSeen={item.first_seen} state={state} />
          <span className="mono" style={{ color: '#788596', fontSize: 11 }}>
            {item.tracking?.target_date || '—'}
          </span>
          <span className="mono" style={{ color: '#424E5C', fontSize: 11 }}>
            {ageLabel(item.first_seen)}
          </span>
        </div>
      </div>
      {open && (
        <div className="cexp" style={{ paddingTop: 14 }}>
          <div>
            <div className="mono" style={{ color: '#424E5C', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              Reason
            </div>
            <p className="mono" style={{ color: '#788596', fontSize: 12, lineHeight: 1.6 }}>{item.reason || '—'}</p>
          </div>
          <div className="kv" style={{ marginTop: 14 }}>
            <div>
              <span style={{ color: '#424E5C' }}>First seen · </span>
              <span className="mono" style={{ color: '#788596' }}>{formatDate(item.first_seen)}</span>
            </div>
            <div>
              <span style={{ color: '#424E5C' }}>Last seen · </span>
              <span className="mono" style={{ color: '#788596' }}>{formatDate(item.last_seen)}</span>
            </div>
            <div>
              <span style={{ color: '#424E5C' }}>Status · </span>
              <span className="mono" style={{ color: '#788596' }}>{item.status || '—'}</span>
            </div>
          </div>
        </div>
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
    return <div className="mono" style={{ color: '#788596', padding: '48px 0', textAlign: 'center' }}>Loading remediation register…</div>;
  }

  if (!backlog) {
    return (
      <div className="panel" style={{ padding: 48, textAlign: 'center' }}>
        <Shield size={32} style={{ color: '#424E5C', margin: '0 auto 12px' }} />
        <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Remediation Register Not Yet Published</h3>
        <p className="lede" style={{ margin: '0 auto', maxWidth: 460, fontSize: 14 }}>
          The engine has not yet published <span className="mono" style={{ color: '#818CF8' }}>remediation_backlog.json</span> to the trust-center data path.
          This file is generated by the FedRAMP 20x continuous remediation register pipeline.
        </p>
      </div>
    );
  }

  const hasActiveFilters = severityFilter !== 'all' || stateFilter !== 'all' || ksiFilter !== 'all' || !!search;

  return (
    <div className="stack">

      {/* Header */}
      <div>
        <div className="kick"><Layers size={12} /> REMEDIATION REGISTER</div>
        <h1 className="big">Open <span className="g">remediation</span></h1>
        <p className="lede" style={{ marginBottom: 0 }}>
          {backlog.total_items} actionable items
          {backlog.filtered_info_count > 0 && <> · {backlog.filtered_info_count} INFO-tier filtered</>}
          {backlog.generated_at && <> · Generated {formatDate(backlog.generated_at)}</>}
          <span className="badge i" style={{ marginLeft: 12 }}>FedRAMP 20x · Public</span>
        </p>
        {backlog.note && (
          <p className="mono" style={{ color: '#424E5C', fontSize: 11, marginTop: 14, lineHeight: 1.6 }}>{backlog.note}</p>
        )}
      </div>

      {/* Search + toggles */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search" style={{ flex: 1, minWidth: 240 }}>
          <Search size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="search by id, KSI, resource hash, or reason…"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#788596', cursor: 'pointer', display: 'inline-flex' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="seg">
          <button className={groupByResource ? '' : 'on'} onClick={() => setGroupByResource(false)}>FLAT</button>
          <button className={groupByResource ? 'on' : ''} onClick={() => setGroupByResource(true)}>
            <Hash size={10} style={{ verticalAlign: 'middle', marginRight: 5 }} />BY RESOURCE
          </button>
        </div>
        <button
          onClick={handleResetFilters}
          className="chip"
          style={{ cursor: 'pointer' }}
        >
          Reset
        </button>
      </div>

      {/* Severity chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span className="mono" style={{ color: '#424E5C', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Filter size={10} /> Severity
        </span>
        <div className="chips">
          <button className={`chip ${severityFilter === 'all' ? 'on' : ''}`}
            style={severityFilter === 'all' ? { background: '#818CF8', borderColor: '#818CF8', color: '#07090C' } : {}}
            onClick={() => setSeverityFilter('all')}>
            All <span style={{ opacity: .7 }}>{items.length}</span>
          </button>
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => {
            const on = severityFilter === sev;
            const c = severityConfig[sev].dot;
            return (
              <button key={sev} className={`chip ${on ? 'on' : ''}`}
                style={on ? { background: c, borderColor: c, color: '#07090C' } : {}}
                onClick={() => setSeverityFilter(on ? 'all' : sev)}>
                <span className="dot" style={{ background: on ? '#07090C' : c }} />{sev}
                <span style={{ opacity: .7 }}>{counts.severity[sev]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* State chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span className="mono" style={{ color: '#424E5C', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Filter size={10} /> State
        </span>
        <div className="chips">
          <button className={`chip ${stateFilter === 'all' ? 'on' : ''}`}
            style={stateFilter === 'all' ? { background: '#818CF8', borderColor: '#818CF8', color: '#07090C' } : {}}
            onClick={() => setStateFilter('all')}>
            All
          </button>
          {['OPEN', 'IN_PROGRESS', 'RISK_ACCEPTED', 'CLOSED'].map(s => {
            const on = stateFilter === s;
            return (
              <button key={s} className={`chip ${on ? 'on' : ''}`}
                style={on ? { background: '#818CF8', borderColor: '#818CF8', color: '#07090C' } : {}}
                onClick={() => setStateFilter(on ? 'all' : s)}>
                {stateConfig[s].label}
                <span style={{ opacity: .7 }}>{counts.state[s]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KSI dropdown — only show when there are many */}
      {ksiOptions.length > 4 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="mono" style={{ color: '#424E5C', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Filter size={10} /> KSI
          </span>
          <select
            value={ksiFilter}
            onChange={e => setKsiFilter(e.target.value)}
            className="mono"
            style={{ background: '#0A0E13', border: '1px solid #1A222D', borderRadius: 9, padding: '8px 12px', color: '#E8EEF4', fontSize: 12, outline: 'none' }}
          >
            {ksiOptions.map(k => (
              <option key={k} value={k}>{k === 'all' ? 'All KSIs' : k}</option>
            ))}
          </select>
        </div>
      )}

      {/* Result count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="mono" style={{ color: '#424E5C', fontSize: 11 }}>
          Showing {filtered.length} of {items.length} items
        </span>
        {hasActiveFilters && (
          <button onClick={handleResetFilters} className="mono" style={{ background: 'none', border: 'none', color: '#818CF8', fontSize: 11, cursor: 'pointer' }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Register */}
      {filtered.length === 0 ? (
        <div className="panel" style={{ padding: '64px 0', textAlign: 'center' }}>
          <span className="mono" style={{ color: '#424E5C', fontSize: 13 }}>No items match the current filters.</span>
        </div>
      ) : groupByResource && resourceGroups ? (
        <div className="stack">
          {resourceGroups.map(g => (
            <div key={g.resource} className="panel">
              <div className="ph">
                <h4 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Hash size={12} style={{ color: '#424E5C' }} />
                  <span className="mono" style={{ color: '#818CF8' }}>{g.resource}</span>
                </h4>
                <span className="map">
                  {g.items.length} finding{g.items.length === 1 ? '' : 's'} · {g.ksis.size} KSI{g.ksis.size === 1 ? '' : 's'}
                </span>
              </div>
              {g.items.map(item => <Row key={item.id} item={item} />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="panel">
          <div className="ph">
            <h4>POA&amp;M items</h4>
            <span className="map">{filtered.length} active</span>
          </div>
          {filtered.map(item => <Row key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
};

export default RemediationRegister;

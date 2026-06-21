import React, { useState, useMemo } from 'react';
import { useData } from '../../hooks/useData';
import { useModal } from '../../contexts/ModalContext';
import { Sanitizer } from '../../utils/sanitizer';
import {
  Search, X, ChevronDown, ChevronRight, ArrowRight,
  CheckCircle2, XCircle, AlertTriangle, Info, Layers
} from 'lucide-react';

export const KSIGrid = () => {
  const { ksis, loading, backlogByKsi } = useData();
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

  if (loading) return <div className="mono" style={{ color: 'var(--ash)', padding: '48px 0', textAlign: 'center' }}>Loading telemetry…</div>;

  return (
    <div className="stack">
      <h3 className="sec">Key Security Indicators · live control matrix</h3>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {/* Search */}
        <div className="search" style={{ flex: 1, minWidth: 260 }}>
          <Search size={15} />
          <input
            type="text"
            placeholder="search control id, name, category…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--ash)', cursor: 'pointer', display: 'flex' }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="chips">
          <FilterTab label="All" count={statusCounts.all} active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} dot="var(--ash)" />
          <FilterTab label="Operational" count={statusCounts.passed} active={statusFilter === 'passed'} onClick={() => setStatusFilter('passed')} dot="var(--signal)" />
          <FilterTab label="Failed" count={statusCounts.failed} active={statusFilter === 'failed'} onClick={() => setStatusFilter('failed')} dot="var(--red)" />
          {statusCounts.meets_threshold > 0 && (
            <FilterTab label="Meets Threshold" count={statusCounts.meets_threshold} active={statusFilter === 'meets_threshold'} onClick={() => setStatusFilter('meets_threshold')} dot="var(--indigo)" />
          )}
          {statusCounts.warning > 0 && (
            <FilterTab label="Conditional" count={statusCounts.warning} active={statusFilter === 'warning'} onClick={() => setStatusFilter('warning')} dot="var(--amber)" />
          )}
          <span className="mono" style={{ color: 'var(--faint)', fontSize: 11, alignSelf: 'center', marginLeft: 4 }}>
            {filteredKsis.length} / {ksis.length}
          </span>
        </div>
      </div>

      {/* Category Sections */}
      <div className="stack">
        {Object.entries(groupedKsis).map(([category, items]) => (
          <CategorySection key={category} category={category} items={items} openModal={openModal} backlogByKsi={backlogByKsi} />
        ))}

        {filteredKsis.length === 0 && (
          <div className="panel" style={{ padding: '56px 20px', textAlign: 'center' }}>
            <div className="mono" style={{ color: 'var(--ash)', fontSize: 13 }}>No controls match your current filters.</div>
            <button
              onClick={handleReset}
              className="mono"
              style={{ marginTop: 10, background: 'none', border: 'none', color: 'var(--indigo)', cursor: 'pointer', fontSize: 12 }}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Collapsible Category Section
const CategorySection = ({ category, items, openModal, backlogByKsi }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const failed = items.filter(i => i.assertion === false || i.assertion === "false").length;

  return (
    <div className="panel">
      <div className="ph" style={{ cursor: 'pointer' }} onClick={() => setIsExpanded(!isExpanded)}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Layers size={15} style={{ color: failed > 0 ? 'var(--red)' : 'var(--signal)' }} />
          {category}
          <span className="mono" style={{ color: 'var(--faint)', fontSize: 11 }}>· {items.length}</span>
        </h4>
        <span className="map" style={{ color: failed > 0 ? 'var(--red)' : 'var(--signal)' }}>
          {failed > 0 ? `${failed} requiring action` : 'all operational'}
        </span>
      </div>

      {isExpanded && items.map(ksi => (
        <KSICard key={ksi.id} ksi={ksi} openModal={openModal} backlogStats={backlogByKsi?.[ksi.id]} />
      ))}
    </div>
  );
};

const FilterTab = ({ label, count, active, onClick, dot }) => (
  <button
    className={`chip ${active ? 'on' : ''}`}
    onClick={onClick}
    style={active ? { background: dot, borderColor: dot, color: 'var(--base)' } : {}}
  >
    <span className="dot" style={{ background: active ? 'var(--base)' : dot }} />
    {label}
    <span style={{ opacity: 0.7 }}>{count}</span>
  </button>
);

// FedRAMP 20x outcome-framework chip: distinguishes Capability-mode KSIs
// (system presence + capability_status) from Output-mode KSIs (rate vs target).
const ModeChip = ({ ksi }) => {
  if (!ksi?.mode) return null;

  if (ksi.mode === 'output') {
    return <span className="badge">Output</span>;
  }

  const cap = ksi.capability_status;
  const capColor =
    cap === 'operational' ? 'var(--signal)'
    : cap === 'degraded' ? 'var(--amber)'
    : cap === 'missing' ? 'var(--red)'
    : 'var(--faint)';

  return (
    <span className="badge">
      Capability{cap && <> · <span style={{ color: capColor }}>{cap}</span></>}
    </span>
  );
};

const KSICard = ({ ksi, openModal, backlogStats }) => {
  const [open, setOpen] = useState(false);
  const meta = Sanitizer.mapStatus(ksi.status);

  // Status → console tag class + accent color
  const statusMeta = {
    'passed': { tag: 'ok', color: 'var(--signal)', mark: '✓' },
    'meets_threshold': { tag: 'vi', color: 'var(--indigo)', mark: '✓' },
    'failed': { tag: 'red', color: 'var(--red)', mark: '✕' },
    'warning': { tag: 'warn', color: 'var(--amber)', mark: '◷' },
    'info': { tag: 'vi', color: 'var(--indigo)', mark: '◇' }
  }[ksi.status] || { tag: 'warn', color: 'var(--ash)', mark: '◇' };

  const IconMap = { 'CheckCircle2': CheckCircle2, 'XCircle': XCircle, 'AlertTriangle': AlertTriangle, 'Info': Info };
  const Icon = IconMap[meta.icon] || Info;

  // Output-mode rate display: target is 95% per FedRAMP 20x outcome framework.
  const isOutputMode = ksi.mode === 'output';
  const outputTarget = 95;
  const score = typeof ksi.score === 'number' ? ksi.score : (typeof ksi.score === 'string' ? parseFloat(ksi.score) : null);

  return (
    <>
      <div className="ctrl" style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <div className="nm" style={{ minWidth: 0 }}>
          <span className="ck" style={{ color: statusMeta.color, flexShrink: 0 }}>{statusMeta.mark}</span>
          <span className="mono" style={{ color: 'var(--indigo)', fontSize: 12.5, flexShrink: 0 }}>{ksi.id}</span>
          <span style={{ color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ksi.description}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {isOutputMode && score != null && (
            <span className="mono" style={{ fontSize: 11, color: score >= outputTarget ? 'var(--signal)' : score === 0 ? 'var(--red)' : 'var(--amber)' }}>
              {score}%
            </span>
          )}
          <ModeChip ksi={ksi} />
          {backlogStats?.hasRiskAccepted && (
            <span className="badge i">Risk-accepted</span>
          )}
          <span className={`tag ${statusMeta.tag}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon size={11} /> {meta.label}
          </span>
        </div>
      </div>

      {open && (
        <div className="cexp">
          <div style={{ marginTop: 12, color: 'var(--ink)' }}>{ksi.description}</div>
          {isOutputMode && score != null && (
            <div className="mono" style={{ marginTop: 8, fontSize: 12 }}>
              <span style={{ color: score >= outputTarget ? 'var(--signal)' : score === 0 ? 'var(--red)' : 'var(--amber)' }}>{score}%</span>
              <span style={{ color: 'var(--faint)' }}> · target {outputTarget}%</span>
            </div>
          )}
          <div className="kv">
            <div><span style={{ color: 'var(--faint)' }}>Category · </span>{ksi.category || 'General Security'}</div>
            <div><span style={{ color: 'var(--faint)' }}>Status · </span><span style={{ color: statusMeta.color }} className="mono">{meta.label}</span></div>
            {ksi.mode && <div><span style={{ color: 'var(--faint)' }}>Mode · </span><span className="mono">{ksi.mode}</span></div>}
            {ksi.capability_status && <div><span style={{ color: 'var(--faint)' }}>Capability · </span><span className="mono">{ksi.capability_status}</span></div>}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); openModal('why', ksi); }}
            className="mono"
            style={{ marginTop: 14, background: 'none', border: 'none', color: 'var(--signal)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: 0 }}
          >
            View {ksi.commands_executed} CLI checks
            <ArrowRight size={12} />
          </button>
        </div>
      )}
    </>
  );
};

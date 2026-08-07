/**
 * ObservationsPanel — statistical observations (non-gating findings layer)
 *
 * Renders ksi_observations.json: behavioral signals (frequency, breadth,
 * trend) computed by the compliance pipeline — root-account usage,
 * credential hygiene, KSI stability. Observations annotate the KSI record
 * but never change an assertion, so this panel is informational by design.
 *
 * Consumes: public/data/ksi_observations.json (pipeline-synced).
 * Renders nothing if the artifact has not been synced yet.
 */
import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { BASE_PATH } from '../../config/theme';

const DATA_URL = `${BASE_PATH}ksi_observations.json`;

const TIER_META = {
    escalate: { label: 'ESCALATE', tagClass: 'tag red' },
    finding: { label: 'FINDING', tagClass: 'tag warn' },
    observe: { label: 'OBSERVE', tagClass: 'tag' },
};

const SIGNAL_LABELS = {
    'ksi_stability.flap_rate': 'KSI stability · flap rate',
    'ksi_stability.stalled_remediation': 'KSI stability · stalled remediation',
    'ksi_stability.active_failure': 'KSI stability · active failure',
    'credential_hygiene.aging': 'Credential hygiene · aging & usage',
    'credential_hygiene.unavailable': 'Credential hygiene',
    'root_account.access_keys': 'Root account · access keys',
    'root_account.recent_use': 'Root account · recent use',
    'root_account.dormancy': 'Root account · dormancy',
    'root_activity.frequency': 'Root activity · frequency (CloudTrail)',
    'root_activity.pending': 'Root activity · collection pending',
};

const StatChips = ({ statistic }) => {
    const entries = Object.entries(statistic || {}).filter(
        ([, v]) => typeof v === 'number' || typeof v === 'boolean'
    );
    if (!entries.length) return null;
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {entries.map(([k, v]) => (
                <span key={k} className="mono" style={{ fontSize: 11, color: 'var(--ash)', background: 'var(--raise2)', border: '1px solid var(--line)', borderRadius: 4, padding: '1px 7px' }}>
                    {k.replace(/_/g, ' ')}: <span style={{ color: 'var(--ink)' }}>{String(v)}</span>
                </span>
            ))}
        </div>
    );
};

const ObservationRow = ({ obs }) => {
    const meta = TIER_META[obs.tier] || TIER_META.observe;
    return (
        <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: '1px solid var(--line)', alignItems: 'flex-start' }}>
            <span className={`mono ${meta.tagClass}`} style={{ flexShrink: 0, minWidth: 76, textAlign: 'center' }}>{meta.label}</span>
            <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                        {SIGNAL_LABELS[obs.signal] || obs.signal}
                    </span>
                    {(obs.ksi_ids || []).map(id => (
                        <code key={id} className="mono" style={{ fontSize: 11, color: 'var(--indigo)' }}>{id}</code>
                    ))}
                </div>
                <p className="mono" style={{ fontSize: 12, color: 'var(--ash)', margin: '4px 0 0', lineHeight: 1.5 }}>{obs.detail}</p>
                <StatChips statistic={obs.statistic} />
                {obs.recommendation && obs.tier !== 'observe' && (
                    <p style={{ fontSize: 12, color: 'var(--ink)', margin: '6px 0 0', lineHeight: 1.5 }}>→ {obs.recommendation}</p>
                )}
            </div>
        </div>
    );
};

const ObservationsPanel = () => {
    const [data, setData] = useState(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetch(DATA_URL)
            .then(r => (r.ok ? r.json() : null))
            .then(d => { if (!cancelled && d && d.observations) setData(d); })
            .catch(() => { /* artifact not synced yet — render nothing */ });
        return () => { cancelled = true; };
    }, []);

    if (!data) return null;

    const byTier = data.summary?.by_tier || {};
    const observations = data.observations || [];
    // Escalations and findings always show; observe entries sit behind a toggle.
    const headline = observations.filter(o => o.tier !== 'observe');
    const quiet = observations.filter(o => o.tier === 'observe');
    const visible = expanded ? observations : headline;

    return (
        <div className="panel" style={{ padding: 18 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <h3 className="sec" style={{ margin: 0 }}>
                    <Activity size={14} style={{ color: 'var(--indigo)' }} /> Statistical Observations
                </h3>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ash)' }}>
                    {byTier.escalate || 0} escalate · {byTier.finding || 0} finding · {byTier.observe || 0} observe
                </span>
                <span className="mono tag" style={{ marginLeft: 'auto', fontSize: 10 }} title="Observations annotate behavioral signals (frequency, breadth, trend). They never change a KSI pass/fail assertion.">
                    NON-GATING
                </span>
            </div>
            <p className="mono" style={{ fontSize: 11, color: 'var(--ash)', margin: '0 0 8px', lineHeight: 1.5 }}>
                Frequency, breadth, and trend signals computed each pipeline run from collected evidence
                (root-account activity, credential hygiene, KSI stability). Informational — these do not
                affect the pass/fail posture above. Generated {data.metadata?.generated_at || 'N/A'}.
            </p>
            {visible.map((obs, i) => <ObservationRow key={`${obs.signal}-${(obs.ksi_ids || []).join(',')}-${i}`} obs={obs} />)}
            {quiet.length > 0 && (
                <button
                    type="button"
                    onClick={() => setExpanded(e => !e)}
                    className="mono"
                    style={{ marginTop: 10, fontSize: 11, color: 'var(--indigo)', background: 'none', border: '1px solid var(--line)', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}
                >
                    {expanded ? 'Hide' : 'Show'} {quiet.length} routine observation{quiet.length === 1 ? '' : 's'}
                </button>
            )}
        </div>
    );
};

export default ObservationsPanel;

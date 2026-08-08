/**
 * ObservationsPanel — statistical observations (non-gating findings layer)
 *
 * Renders ksi_observations.json: behavioral signals (frequency, breadth,
 * trend) computed by the compliance pipeline — root-account usage,
 * credential hygiene, KSI stability. Observations annotate the KSI record
 * but never change an assertion, so this panel is informational by design.
 *
 * Visuals (single-hue, matching the failure-dashboard Recharts idiom):
 * - Flap rate: failures per KSI in the 90-day window
 * - Stalled remediations: how many multiples of the family's median MTTR
 *   each active failure has been open, against the 2x finding threshold
 *
 * Consumes: public/data/ksi_observations.json (pipeline-synced).
 * Renders nothing if the artifact has not been synced yet.
 */
import React, { useState, useEffect } from 'react';
import { Activity, Repeat, Hourglass } from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ReferenceLine, LabelList,
} from 'recharts';
import { BASE_PATH } from '../../config/theme';

const DATA_URL = `${BASE_PATH}ksi_observations.json`;

const BAR_COLOR = '#818CF8';      // chart primary (matches dashboard charts)
const THRESHOLD_COLOR = '#F2B85C'; // warning amber — status reference only
const GRID_COLOR = '#1A222D';
const TICK_STYLE = { fontSize: 10, fill: '#788596' };

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

const ChartTooltip = ({ active, payload, label, formatter }) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <div style={{ background: '#0F141B', border: '1px solid var(--line)', borderRadius: 6, padding: '8px 12px' }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--indigo)', marginBottom: 2 }}>{label}</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink)' }}>{formatter(payload[0].payload)}</div>
        </div>
    );
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

    // --- Chart data (both derive from the stability signal) ---
    const flapData = observations
        .filter(o => o.signal === 'ksi_stability.flap_rate')
        .map(o => ({ ksi: o.ksi_ids[0], count: o.statistic.failures_in_window }))
        .sort((a, b) => b.count - a.count);

    const stalledData = observations
        .filter(o => o.signal === 'ksi_stability.stalled_remediation'
                     && o.statistic.family_median_mttr_hours > 0)
        .map(o => ({
            ksi: o.ksi_ids[0],
            multiple: Math.round((o.statistic.open_hours / o.statistic.family_median_mttr_hours) * 10) / 10,
            days: Math.round(o.statistic.open_hours / 24 * 10) / 10,
            medianHours: o.statistic.family_median_mttr_hours,
        }))
        .sort((a, b) => b.multiple - a.multiple);

    return (
        <div className="panel" style={{ padding: 18 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h3 className="sec" style={{ margin: 0 }}>
                    <Activity size={14} style={{ color: 'var(--indigo)' }} /> Statistical Observations
                </h3>
                <span className="mono tag red" style={{ fontSize: 10 }}>{byTier.escalate || 0} ESCALATE</span>
                <span className="mono tag warn" style={{ fontSize: 10 }}>{byTier.finding || 0} FINDING</span>
                <span className="mono tag" style={{ fontSize: 10 }}>{byTier.observe || 0} OBSERVE</span>
                <span className="mono tag vi" style={{ marginLeft: 'auto', fontSize: 10 }} title="Observations annotate behavioral signals (frequency, breadth, trend). They never change a KSI pass/fail assertion.">
                    NON-GATING
                </span>
            </div>
            <p className="mono" style={{ fontSize: 11, color: 'var(--ash)', margin: '0 0 14px', lineHeight: 1.5 }}>
                Frequency, breadth, and trend signals computed each pipeline run from collected evidence
                (root-account activity, credential hygiene, KSI stability). Informational — these do not
                affect the pass/fail posture above. Generated {data.metadata?.generated_at || 'N/A'}.
            </p>

            {(flapData.length > 0 || stalledData.length > 0) && (
                <div className="g2" style={{ marginBottom: 14 }}>
                    {flapData.length > 0 && (
                        <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '14px 16px 6px' }}>
                            <h4 className="sec" style={{ margin: '0 0 4px', fontSize: 12 }}>
                                <Repeat size={13} style={{ color: 'var(--indigo)' }} /> Flap Rate — failures per KSI, last 90 days
                            </h4>
                            <p className="mono" style={{ fontSize: 10, color: 'var(--faint)', margin: '0 0 8px' }}>
                                3+ failures in the window flags a fix that is not holding
                            </p>
                            <ResponsiveContainer width="100%" height={flapData.length * 30 + 30}>
                                <BarChart data={flapData} layout="vertical" margin={{ top: 0, right: 28, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID_COLOR} />
                                    <XAxis type="number" tick={TICK_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <YAxis type="category" dataKey="ksi" width={104} tick={{ ...TICK_STYLE, fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(129,140,248,0.06)' }} content={<ChartTooltip formatter={p => `${p.count} failures in 90 days`} />} />
                                    <Bar dataKey="count" fill={BAR_COLOR} barSize={14} radius={[0, 4, 4, 0]} name="Failures (90d)">
                                        <LabelList dataKey="count" position="right" style={{ fontSize: 10, fill: '#788596', fontFamily: 'var(--mono)' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    {stalledData.length > 0 && (
                        <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '14px 16px 6px' }}>
                            <h4 className="sec" style={{ margin: '0 0 4px', fontSize: 12 }}>
                                <Hourglass size={13} style={{ color: 'var(--indigo)' }} /> Stalled Remediations — multiples of family median MTTR
                            </h4>
                            <p className="mono" style={{ fontSize: 10, color: 'var(--faint)', margin: '0 0 8px' }}>
                                <span style={{ color: THRESHOLD_COLOR }}>— 2×</span> median is the finding threshold; labels show days open
                            </p>
                            <ResponsiveContainer width="100%" height={stalledData.length * 30 + 30}>
                                <BarChart data={stalledData} layout="vertical" margin={{ top: 0, right: 44, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID_COLOR} />
                                    <XAxis type="number" tick={TICK_STYLE} axisLine={false} tickLine={false} tickFormatter={v => `${v}×`} />
                                    <YAxis type="category" dataKey="ksi" width={104} tick={{ ...TICK_STYLE, fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(129,140,248,0.06)' }} content={<ChartTooltip formatter={p => `Open ${p.days} days — ${p.multiple}× the family median (${p.medianHours}h)`} />} />
                                    <ReferenceLine x={2} stroke={THRESHOLD_COLOR} strokeDasharray="4 3" />
                                    <Bar dataKey="multiple" fill={BAR_COLOR} barSize={14} radius={[0, 4, 4, 0]} name="× family median MTTR">
                                        <LabelList dataKey="days" position="right" formatter={v => `${v}d`} style={{ fontSize: 10, fill: '#788596', fontFamily: 'var(--mono)' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}

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

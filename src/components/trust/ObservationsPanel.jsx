/**
 * ObservationsPanel — statistical observations (non-gating findings layer)
 *
 * Renders ksi_observations.json: behavioral signals (frequency, breadth,
 * trend) computed by the compliance pipeline — root-account usage,
 * credential hygiene, KSI stability. Observations annotate the KSI record
 * but never change an assertion, so this panel is informational by design.
 *
 * Layout: explainer header with tier legend → two charts (flap rate,
 * stalled remediations) → observations GROUPED by signal, so a shared
 * explanation and recommendation appear once per signal instead of being
 * repeated on every affected KSI. Routine (observe-tier) signals sit
 * behind a toggle.
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

// Plain-language identity for each signal: what it measures, why it
// matters, and how to phrase one affected KSI's statistic. The shared
// recommendation comes from the observation payload and renders once
// per group instead of once per KSI.
const SIGNAL_META = {
    'ksi_stability.flap_rate': {
        title: 'Recurring failures',
        explain: 'KSIs that failed 3 or more times in the last 90 days. A pass/fail cycle that keeps repeating means the remediation treats the symptom while the underlying configuration keeps regressing.',
        itemStat: o => `${o.statistic.failures_in_window}× in 90d`,
    },
    'ksi_stability.stalled_remediation': {
        title: 'Stalled remediations',
        explain: "Active failures that have stayed open more than twice their own family's median time-to-fix — abnormal by our historical baseline, not by an arbitrary deadline.",
        itemStat: o => `${(o.statistic.open_hours / 24).toFixed(0)}d open · median ${Math.round(o.statistic.family_median_mttr_hours)}h`,
    },
    'ksi_stability.active_failure': {
        title: 'Active failures within normal remediation time',
        explain: "Currently failing, but still inside the family's usual time-to-fix — listed for completeness, not concern.",
        itemStat: o => `${(o.statistic.open_hours / 24).toFixed(1)}d open`,
    },
    'credential_hygiene.aging': {
        title: 'Credential hygiene',
        explain: 'Ages and usage of IAM credentials from the AWS credential report: unused active keys, keys overdue for rotation, stale console passwords, missing MFA.',
    },
    'credential_hygiene.unavailable': {
        title: 'Credential hygiene',
        explain: 'Credential report evidence was not available this run.',
    },
    'root_account.access_keys': {
        title: 'Root account — access keys',
        explain: 'The root account should never have API access keys.',
    },
    'root_account.recent_use': {
        title: 'Root account — recent console use',
        explain: 'Root console logins should map to documented break-glass events.',
    },
    'root_account.dormancy': {
        title: 'Root account — dormancy',
        explain: 'Confirms the root console password is not being used. Dormant is the expected, healthy state.',
    },
    'root_activity.frequency': {
        title: 'Root account activity (CloudTrail)',
        explain: 'Counts every root-account API event over the last 90 days and checks console logins for MFA. Root should be break-glass only, so the healthy reading is zero.',
    },
    'root_activity.pending': {
        title: 'Root account activity (CloudTrail)',
        explain: 'First CloudTrail collection has not run yet.',
    },
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

/** One card per signal. Multi-KSI signals render the explanation and
 *  recommendation once, with a compact chip per affected KSI. */
const SignalGroup = ({ signal, items }) => {
    const meta = SIGNAL_META[signal] || { title: signal, explain: '' };
    // A group's tier is its most severe member's tier.
    const rank = { escalate: 0, finding: 1, observe: 2 };
    const tier = items.reduce((worst, o) => (rank[o.tier] < rank[worst] ? o.tier : worst), 'observe');
    const tierMeta = TIER_META[tier] || TIER_META.observe;
    const multi = items.length > 1;
    const recommendation = items.find(o => o.recommendation)?.recommendation;

    return (
        <div style={{ padding: '14px 0', borderTop: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'baseline' }}>
                <span className={`mono ${tierMeta.tagClass}`} style={{ flexShrink: 0, minWidth: 76, textAlign: 'center' }}>{tierMeta.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{meta.title}</span>
                {multi && <span className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>{items.length} KSIs affected</span>}
            </div>
            <p className="mono" style={{ fontSize: 12, color: 'var(--ash)', margin: '6px 0 0', lineHeight: 1.55, maxWidth: '72ch' }}>
                {meta.explain}
            </p>
            {multi ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {items.map(o => (
                        <span key={o.ksi_ids.join(',')} className="mono" style={{ fontSize: 11, background: 'var(--raise2)', border: '1px solid var(--line)', borderRadius: 4, padding: '3px 9px' }}>
                            <span style={{ color: 'var(--indigo)', fontWeight: 600 }}>{o.ksi_ids[0]}</span>
                            {meta.itemStat && <span style={{ color: 'var(--ash)' }}> · {meta.itemStat(o)}</span>}
                        </span>
                    ))}
                </div>
            ) : (
                <>
                    <p className="mono" style={{ fontSize: 12, color: 'var(--ash)', margin: '6px 0 0', lineHeight: 1.5 }}>
                        {items[0].ksi_ids.map(id => (
                            <code key={id} className="mono" style={{ fontSize: 11, color: 'var(--indigo)', marginRight: 8 }}>{id}</code>
                        ))}
                        {items[0].detail}
                    </p>
                    <StatChips statistic={items[0].statistic} />
                </>
            )}
            {recommendation && tier !== 'observe' && (
                <p style={{ fontSize: 12, color: 'var(--ink)', margin: '8px 0 0', lineHeight: 1.5, maxWidth: '76ch' }}>→ {recommendation}</p>
            )}
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

    // Group by signal, preserving artifact order (escalate → finding → observe).
    const groups = [];
    const bySignal = new Map();
    for (const o of observations) {
        if (!bySignal.has(o.signal)) {
            bySignal.set(o.signal, []);
            groups.push(o.signal);
        }
        bySignal.get(o.signal).push(o);
    }
    const isQuiet = signal => bySignal.get(signal).every(o => o.tier === 'observe');
    const headlineGroups = groups.filter(s => !isQuiet(s));
    const quietGroups = groups.filter(isQuiet);
    const visibleGroups = expanded ? groups : headlineGroups;

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
            <p className="mono" style={{ fontSize: 11, color: 'var(--ash)', margin: '0 0 6px', lineHeight: 1.55, maxWidth: '90ch' }}>
                Automated behavioral review, regenerated on every pipeline run from evidence the pipeline
                already collects: root-account usage (CloudTrail), credential hygiene (IAM credential
                report), and the stability of KSI remediations (failure-tracker history). These add the
                dimension a point-in-time check cannot see — frequency and trend over time.
            </p>
            <p className="mono" style={{ fontSize: 11, color: 'var(--faint)', margin: '0 0 14px', lineHeight: 1.55 }}>
                <span className="tag" style={{ fontSize: 9 }}>OBSERVE</span> expected or benign state
                &nbsp;·&nbsp; <span className="tag warn" style={{ fontSize: 9 }}>FINDING</span> statistically significant, needs review
                &nbsp;·&nbsp; <span className="tag red" style={{ fontSize: 9 }}>ESCALATE</span> unambiguous, act now
                &nbsp;·&nbsp; None of these change the pass/fail posture above. Generated {data.metadata?.generated_at || 'N/A'}.
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

            {visibleGroups.map(signal => (
                <SignalGroup key={signal} signal={signal} items={bySignal.get(signal)} />
            ))}
            {quietGroups.length > 0 && (
                <button
                    type="button"
                    onClick={() => setExpanded(e => !e)}
                    className="mono"
                    style={{ marginTop: 10, fontSize: 11, color: 'var(--indigo)', background: 'none', border: '1px solid var(--line)', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}
                >
                    {expanded ? 'Hide' : 'Show'} {quietGroups.length} routine signal{quietGroups.length === 1 ? '' : 's'} (all healthy)
                </button>
            )}
        </div>
    );
};

export default ObservationsPanel;

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useModal } from '../../contexts/ModalContext';
import KSI_EVIDENCE_NARRATIVES from '../../config/ksiEvidenceNarrative';
import {
    ShieldCheck, Terminal, Activity, CheckCircle2, XCircle,
    AlertCircle, TrendingUp, Database, Clock, FileJson,
    BarChart3, Cpu, Eye, ChevronDown, ChevronRight
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, LineChart, Line
} from 'recharts';

import { BASE_PATH } from '../../config/theme';

// --- HELPER COMPONENTS ---

const MetricCard = ({ label, value, subtext, icon: Icon, trend, status }) => {
    // Map data status to console value accent
    const accent = status === 'excellent' || status === 'verified' || status === 'ready'
        ? 's'
        : status === 'critical'
            ? 'a'
            : status === 'warning' || status === 'issues_detected'
                ? 'a'
                : 'i';

    return (
        <div className="kpi">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {Icon && <Icon size={13} style={{ color: 'var(--ash)' }} />}
                <span className="l" style={{ margin: 0 }}>{label}</span>
            </div>
            <div className={`v ${accent}`}>{value}</div>
            {subtext && <div className="sub">{subtext}</div>}
            {trend !== undefined && (
                <div className="sub" style={{ color: trend >= 0 ? 'var(--signal)' : 'var(--red)' }}>
                    {trend >= 0 ? '+' : ''}{trend}%
                </div>
            )}
        </div>
    );
};

const StatusBadge = ({ status }) => {
    if (!status) return null;

    const cls = {
        excellent: 's',
        warning: '',
        critical: '',
        ready: 's',
        verified: 's',
        issues_detected: ''
    };

    const displayText = typeof status === 'string'
        ? status.replace(/_/g, ' ').toUpperCase()
        : String(status);

    return (
        <span className={`badge ${cls[status] || ''}`}>{displayText}</span>
    );
};

const TabButton = ({ id, label, icon: Icon, active, set, count, badge }) => (
    <a
        onClick={() => set(id)}
        className={active === id ? 'active' : ''}
    >
        <Icon size={14} />
        {label}
        {count !== undefined && (
            <span className="n">{count}</span>
        )}
        {badge && (
            <StatusBadge status={badge} />
        )}
    </a>
);

// Engine-internal synthetic resource markers that should not surface to
// engineers. Mirrors the filter in fedramp-20x-submission-final's
// generate_remediation_issue.py (PR #264). Note: empty_result_* is a REAL
// failure marker (missing infrastructure) — do not filter that one.
const isEngineNoise = (issue) => {
    if (issue && typeof issue === 'object') {
        const resource = issue.resource;
        return typeof resource === 'string' && resource.startsWith('empty_allowed_');
    }
    if (typeof issue === 'string') {
        return /\bempty_allowed_\d/.test(issue);
    }
    return false;
};

// Mode 3 outcome-class behavior: per-resource score is above threshold but the
// assertion flipped FAIL because a separate metric-level threshold breached.
// The engine is working correctly — this is not a technical failure.
const isVerdictDisagreement = (issue) => {
    const text = typeof issue === 'string' ? issue : (issue?.message || issue?.detail || '');
    return /Assertion is False but score is \d+%/i.test(text);
};

const IssueCard = ({ issue, type }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const parts = issue.split(': ');
    const ksiId = parts[0];
    const description = parts.slice(1).join(': ');

    const typeTag = {
        technical: 'red',
        compliance: 'warn',
        disagreement: 'vi'
    };

    const typeLabels = {
        technical: 'Technical Failure',
        compliance: 'Compliance Gap',
        disagreement: 'Score / Verdict Disagreement'
    };

    const tag = typeTag[type] || 'red';
    const label = typeLabels[type] || typeLabels.technical;

    return (
        <div style={{ borderBottom: '1px solid var(--line)' }}>
            <div
                className="ctrl"
                style={{ cursor: 'pointer', borderBottom: 'none' }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="nm" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="mono" style={{ color: 'var(--ink)', fontWeight: 600 }}>{ksiId}</span>
                        <span className={`tag ${tag}`}>{label}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--ash)', margin: 0 }}>{description}</p>
                </div>
                <ChevronDown
                    size={16}
                    style={{
                        color: 'var(--faint)', flexShrink: 0,
                        transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .15s'
                    }}
                />
            </div>
            {isExpanded && (
                <div className="code" style={{ borderTop: '1px solid var(--line)', whiteSpace: 'pre-wrap' }}>
                    {description}
                </div>
            )}
        </div>
    );
};

const ValidationCard = ({ validation }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeDetailTab, setActiveDetailTab] = useState('overview');
    const isPassing = validation.assertion;

    // Get narrative for this KSI
    const narrative = KSI_EVIDENCE_NARRATIVES[validation.ksi_id] || null;

    const extractService = (cmd) => {
        if (!cmd) return 'Unknown';
        if (cmd.startsWith('curl')) return 'HTTP';
        const match = cmd.match(/^aws\s+([a-z0-9-]+)/i);
        return match ? match[1] : 'CLI';
    };

    const checks = useMemo(() => {
        const executions = validation.command_executions || [];
        return executions.map((exec, idx) => ({
            index: exec.index ?? idx,
            name: exec.description || `Check ${idx + 1}`,
            command: exec.command,
            service: extractService(exec.command),
            passed: exec.status === 'success' && exec.exit_code === 0,
            exitCode: exec.exit_code,
            executionTime: exec.execution_time,
            errorMessage: exec.error_message,
        }));
    }, [validation.command_executions]);

    const serviceGroups = useMemo(() => {
        const groups = {};
        checks.forEach(check => {
            const svc = check.service;
            if (!groups[svc]) groups[svc] = { name: svc, passed: 0, failed: 0 };
            check.passed ? groups[svc].passed++ : groups[svc].failed++;
        });
        return Object.values(groups);
    }, [checks]);

    const checksCount = checks.length;
    const passedChecks = checks.filter(c => c.passed).length;

    const cleanText = (text) => {
        if (!text) return '';
        return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}✅❌⚠️📊🔧💡🚨]/gu, '').trim();
    };

    return (
        <div style={!isPassing ? { background: '#F2607A08' } : undefined}>
            {/* Row */}
            <div
                className="row"
                style={{ cursor: 'pointer' }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div style={{ width: 18, flexShrink: 0 }}>
                    <div style={{
                        width: 9, height: 9, borderRadius: '50%',
                        background: isPassing ? 'var(--signal)' : 'var(--red)'
                    }} />
                </div>
                <span className="mono" style={{ color: 'var(--ink)', width: 110, flexShrink: 0 }}>{validation.ksi_id}</span>
                <p style={{ flex: 1, fontSize: 13, color: 'var(--ash)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{validation.requirement}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 140, flexShrink: 0 }}>
                    <div style={{ flex: 1, height: 6, background: 'var(--raise2)', borderRadius: 99, overflow: 'hidden', maxWidth: 80 }}>
                        <div
                            style={{
                                height: '100%', borderRadius: 99,
                                background: validation.display_status === 'fail' ? 'var(--red)' : 'var(--signal)',
                                width: `${validation.score}%`
                            }}
                        />
                    </div>
                    <span className="mono">{validation.score}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, width: 80, flexShrink: 0 }}>
                    <span className="mono">{validation.resources_scanned}</span>
                    <ChevronDown size={16} style={{ color: 'var(--faint)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div style={{ borderTop: '1px solid var(--line)', background: 'var(--raise2)' }}>
                    <div style={{ padding: '16px 20px' }}>
                        {/* Tabs */}
                        <div className="seg" style={{ marginBottom: 16 }}>
                            {[
                                { id: 'overview', label: 'Overview' },
                                { id: 'validation', label: 'Validation Logic' },
                                { id: 'checks', label: `Checks (${passedChecks}/${checksCount})` },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    className={activeDetailTab === tab.id ? 'on' : ''}
                                    onClick={(e) => { e.stopPropagation(); setActiveDetailTab(tab.id); }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Overview */}
                        {activeDetailTab === 'overview' && (
                            <div className="stack">
                                {/* Narrative Summary */}
                                {narrative && (
                                    <div>
                                        <h3 className="sec" style={{ margin: '0 0 8px' }}>What This Validates</h3>
                                        <p style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.55, margin: 0 }}>{narrative.summary}</p>
                                    </div>
                                )}

                                {/* Result */}
                                <div>
                                    <h3 className="sec" style={{ margin: '0 0 8px' }}>Result</h3>
                                    <p style={{ fontSize: 13, color: 'var(--ash)', margin: 0 }}>{cleanText(validation.assertion_reason) || (isPassing ? 'All validations passed' : 'One or more validations failed')}</p>
                                </div>

                                {/* Services Checked */}
                                {serviceGroups.length > 0 && (
                                    <div>
                                        <h3 className="sec" style={{ margin: '0 0 8px' }}>Services Checked</h3>
                                        <div className="chips">
                                            {serviceGroups.map((g, i) => (
                                                <span key={i} className="chip">
                                                    {g.name}
                                                    <span style={{ color: g.failed === 0 ? 'var(--signal)' : 'var(--amber)' }}>
                                                        {g.passed}/{g.passed + g.failed}
                                                    </span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recommended Action */}
                                {validation.recommended_action && (
                                    <div>
                                        <h3 className="sec" style={{ margin: '0 0 8px' }}>Recommended Action</h3>
                                        <p style={{ fontSize: 13, color: 'var(--ash)', margin: 0 }}>{cleanText(validation.recommended_action)}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Validation Logic Tab - The Technical Story */}
                        {activeDetailTab === 'validation' && (
                            <div className="stack">
                                {narrative ? (
                                    <>
                                        {/* Evidence Types */}
                                        <div>
                                            <h3 className="sec" style={{ margin: '0 0 12px' }}>Evidence Collected</h3>
                                            <div className="stack">
                                                {narrative.evidenceTypes.map((ev, i) => (
                                                    <div key={i} style={{ display: 'flex', gap: 12, padding: 12, background: 'var(--raise)', borderRadius: 11, border: '1px solid var(--line)' }}>
                                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--indigo)', marginTop: 6, flexShrink: 0 }} />
                                                        <div>
                                                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{ev.name}</div>
                                                            <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 2 }}>{ev.description}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Pass/Fail Logic */}
                                        <div>
                                            <h3 className="sec" style={{ margin: '0 0 8px' }}>Validation Criteria</h3>
                                            <p style={{ fontSize: 13, color: 'var(--ash)', lineHeight: 1.55, margin: 0 }}>{narrative.validationLogic}</p>
                                        </div>

                                        {/* Pass/Fail Indicators */}
                                        <div className="g2">
                                            <div>
                                                <h3 className="sec" style={{ margin: '0 0 8px', color: 'var(--signal)' }}>Pass Indicators</h3>
                                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    {narrative.passIndicators.map((ind, i) => (
                                                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ash)' }}>
                                                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--signal)' }} />
                                                            {ind}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h3 className="sec" style={{ margin: '0 0 8px', color: 'var(--red)' }}>Fail Indicators</h3>
                                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    {narrative.failIndicators.map((ind, i) => (
                                                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ash)' }}>
                                                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--red)' }} />
                                                            {ind}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                        <p style={{ fontSize: 13, color: 'var(--ash)', margin: 0 }}>Validation narrative not yet documented for this KSI.</p>
                                        <p style={{ fontSize: 12, color: 'var(--faint)', marginTop: 4 }}>View the Checks tab for execution details.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Checks Tab */}
                        {activeDetailTab === 'checks' && (
                            <div>
                                {checks.length > 0 ? (
                                    <div className="stack" style={{ gap: 6 }}>
                                        {checks.map((check, idx) => (
                                            <CheckDetailRow key={idx} check={check} />
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ fontSize: 13, color: 'var(--ash)', padding: '16px 0', textAlign: 'center' }}>No execution data available</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const CheckDetailRow = ({ check }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div style={{ border: '1px solid var(--line)', borderRadius: 11, background: 'var(--raise)' }}>
            <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: check.passed ? 'var(--signal)' : 'var(--red)' }} />
                    <span style={{ fontSize: 13, color: 'var(--ink)' }}>{check.name}</span>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--faint)' }}>{check.service}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {check.executionTime && <span className="mono" style={{ fontSize: 10, color: 'var(--faint)' }}>{check.executionTime}</span>}
                    <span className={`tag ${check.passed ? 'ok' : 'red'}`}>
                        {check.passed ? 'PASS' : 'FAIL'}
                    </span>
                    <ChevronRight size={12} style={{ color: 'var(--faint)', transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }} />
                </div>
            </div>
            {expanded && (
                <div style={{ padding: '0 14px 12px', borderTop: '1px solid var(--line)' }}>
                    {check.errorMessage && (
                        <div className="tag red" style={{ display: 'block', marginTop: 8, padding: '6px 9px' }}>{check.errorMessage}</div>
                    )}
                    <div className="code" style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--raise2)' }}>
                        <span style={{ color: 'var(--faint)' }}>$</span> {check.command}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---

const TransparencyConsole = () => {
    const { isAuthenticated, user } = useAuth();
    const { openModal } = useModal();

    const [activeTab, setActiveTab] = useState('overview');
    const [data, setData] = useState({
        integrityReport: null,
        executionReport: null,
        consistencyLog: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasShownAuthModal, setHasShownAuthModal] = useState(false);
    const [logLines, setLogLines] = useState([]);

    // Auth gate - show modal once when unauthenticated
    useEffect(() => {
        if (!isAuthenticated && !hasShownAuthModal) {
            openModal('accessRequired', {
                featureName: 'System Transparency Console',
                benefits: [
                    'View validation engine internals',
                    'Access execution quality metrics',
                    'Review temporal consistency data',
                    'Audit KSI validation details'
                ]
            });
            setHasShownAuthModal(true);
        }
    }, [isAuthenticated, hasShownAuthModal, openModal]);

    useEffect(() => {
        // Only load data if authenticated
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                const loadFile = async (filename) => {
                    try {
                        const response = await fetch(`${BASE_PATH}${filename}`);
                        if (!response.ok) {
                            console.warn(`Failed to load ${filename}: ${response.status}`);
                            return null;
                        }
                        const text = await response.text();
                        if (text.startsWith('<!doctype') || text.startsWith('<!DOCTYPE')) {
                            console.warn(`${filename} returned HTML instead of JSON (likely 404)`);
                            return null;
                        }
                        return JSON.parse(text);
                    } catch (err) {
                        console.warn(`Error loading ${filename}:`, err.message);
                        return null;
                    }
                };

                const [intRes, execRes, consRes] = await Promise.all([
                    loadFile('validation_integrity_report.json'),
                    loadFile('execution_quality_report.json'),
                    loadFile('temporal_consistency_log.json')
                ]);

                if (!intRes && !execRes && !consRes) {
                    setError('No data files found. Please ensure data files are in the data/ directory.');
                }

                setData({
                    integrityReport: intRes,
                    executionReport: execRes,
                    consistencyLog: consRes
                });
            } catch (e) {
                console.error('Data load error:', e);
                setError(`Failed to load data: ${e.message}`);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [isAuthenticated]);

    // Live event stream — seeded from the REAL loaded reports, then streams
    useEffect(() => {
        if (loading || !isAuthenticated) return;

        const integrityReport = data.integrityReport;
        const executionReport = data.executionReport;
        const consistencyLog = data.consistencyLog;

        const summary = integrityReport?.validation_summary || {};
        const assessment = integrityReport?.overall_integrity_assessment || {};
        const temporal = integrityReport?.temporal_consistency_analysis || {};
        const checks = consistencyLog?.consistency_checks || [];
        const latest = consistencyLog?.historical_validations?.[consistencyLog.historical_validations.length - 1]?.results || [];

        // Build the event vocabulary entirely from real data points.
        const events = [];
        events.push(['ok', 'probe', 'integrity engine → online · configuration-driven framework']);
        if (summary.total_ksis) {
            events.push(['vi', 'ksi', `validation run · ${summary.passed_ksis ?? 0}/${summary.total_ksis} KSIs passing · ${summary.overall_pass_rate || ''}`.trim()]);
        }
        if (assessment.integrity_score != null) {
            events.push(['ok', 'integrity', `integrity score ${assessment.integrity_score.toFixed(1)}% · ${(assessment.audit_readiness || 'evaluated').replace(/_/g, ' ')}`]);
        }
        if (executionReport?.execution_quality_score != null) {
            events.push(['vi', 'exec', `execution quality ${executionReport.execution_quality_score}% · automation health`]);
        }
        if (executionReport?.compliance_health_score != null) {
            events.push(['ok', 'health', `compliance health ${executionReport.compliance_health_score}% · infrastructure`]);
        }
        (executionReport?.technical_issues || [])
            .filter(it => !isEngineNoise(it) && !isVerdictDisagreement(it))
            .slice(0, 3)
            .forEach(it => events.push(['wa', 'fail', String(it).split(': ')[0] + ' · technical failure']));
        (executionReport?.compliance_failures || []).slice(0, 2)
            .forEach(it => events.push(['wa', 'gap', String(it).split(': ')[0] + ' · compliance gap']));
        // latest per-KSI verdicts streamed as evidence events
        latest.slice(0, 6).forEach(v => events.push([
            v.assertion ? 'ok' : 'wa',
            'evidence',
            `${v.ksi_id} · ${v.assertion ? 'PASS' : 'FAIL'} · score ${v.score}% · ${v.resources_scanned} resources`
        ]));
        // temporal consistency snapshots
        if (temporal.average_consistency_score) {
            events.push(['ok', 'temporal', `consistency ${temporal.average_consistency_score} · ${temporal.recent_validations_count || 0} recent runs`]);
        }
        checks.slice(-3).forEach(c => events.push([
            c.issues_found === 0 ? 'ok' : 'wa',
            'consistency',
            `fingerprint ${(c.infrastructure_fingerprint || '').substring(0, 8)} · ${typeof c.consistency_score === 'number' ? c.consistency_score.toFixed(1) : c.consistency_score}% · ${c.issues_found} issues`
        ]));
        if (integrityReport?.report_metadata?.generated_at) {
            events.push(['vi', 'report', `integrity report sealed · ${new Date(integrityReport.report_metadata.generated_at).toLocaleString()}`]);
        }

        if (events.length === 0) {
            events.push(['ok', 'probe', 'awaiting validation data stream…']);
        }

        let i = 0;
        const push = () => {
            const e = events[i % events.length]; i++;
            const ts = new Date().toTimeString().slice(0, 8);
            setLogLines(prev => [...prev.slice(-12), { ts, cls: e[0], tag: e[1], ev: e[2], key: Date.now() + Math.random() }]);
        };
        for (let k = 0; k < 8; k++) push();
        const id = setInterval(push, 2100);
        return () => clearInterval(id);
    }, [loading, isAuthenticated, data]);

    if (loading) {
        return (
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="mono" style={{ color: 'var(--ash)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Activity className="animate-spin" size={18} style={{ color: 'var(--signal)' }} />
                    Loading validation data…
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <div className="panel" style={{ maxWidth: 480, padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <XCircle size={22} style={{ color: 'var(--red)' }} />
                        <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--red)' }}>Failed to Load Data</h4>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 16 }}>{error}</p>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ash)' }}>
                        <p>Expected files in <code>data/</code> directory:</p>
                        <ul style={{ paddingLeft: 16, marginTop: 4 }}>
                            <li>validation_integrity_report.json</li>
                            <li>execution_quality_report.json</li>
                            <li>temporal_consistency_log.json</li>
                        </ul>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn ghost"
                        style={{ marginTop: 16 }}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Auth gate - only render content if authenticated
    if (!isAuthenticated) {
        return (
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                <div className="panel" style={{ maxWidth: 480, width: '100%', padding: 32, textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                        <div style={{ padding: 16, background: '#818CF80D', borderRadius: 14, border: '1px solid #818CF855' }}>
                            <ShieldCheck size={44} style={{ color: 'var(--indigo)' }} />
                        </div>
                    </div>
                    <h1 className="big" style={{ fontSize: 26, marginBottom: 12 }}>Authentication Required</h1>
                    <p style={{ fontSize: 13, color: 'var(--ash)', marginBottom: 24, lineHeight: 1.55 }}>
                        The System Transparency Console contains detailed technical validation findings and certification materials restricted to authorized federal personnel.
                    </p>
                    <div className="panel" style={{ background: 'var(--raise2)', padding: 16, marginBottom: 24, textAlign: 'left' }}>
                        <p className="mono" style={{ color: 'var(--ash)', marginBottom: 12, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '.05em', fontSize: 10 }}>With Federal Access</p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[
                                'View validation engine internals',
                                'Access execution quality metrics',
                                'Review temporal consistency data',
                                'Audit KSI validation details'
                            ].map((t, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ash)' }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--signal)' }} />
                                    {t}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <button
                        onClick={() => window.history.back()}
                        className="btn ghost"
                        style={{ width: '100%' }}
                    >
                        Return to Trust Center
                    </button>
                </div>
            </div>
        );
    }

    const integrityReport = data.integrityReport;
    const executionReport = data.executionReport;
    const consistencyLog = data.consistencyLog;

    // Calculate stats with safe fallbacks
    const validationSummary = integrityReport?.validation_summary || {};
    const temporalAnalysis = integrityReport?.temporal_consistency_analysis || {};
    const executionAnalysis = integrityReport?.execution_quality_analysis || {};
    const overallAssessment = integrityReport?.overall_integrity_assessment || {};

    const rawTechnicalIssues = executionReport?.technical_issues || [];
    // Partition: drop engine-noise markers, split Mode 3 score/verdict
    // disagreements out of the technical-failure bucket (engine is working
    // as designed; calling those "Technical Failure" is misleading).
    const technicalIssues = [];
    const verdictDisagreements = [];
    for (const item of rawTechnicalIssues) {
        if (isEngineNoise(item)) continue;
        if (isVerdictDisagreement(item)) {
            verdictDisagreements.push(item);
        } else {
            technicalIssues.push(item);
        }
    }
    const complianceFailures = executionReport?.compliance_failures || [];
    const consistencyChecks = consistencyLog?.consistency_checks || [];
    const latestValidations = consistencyLog?.historical_validations?.[consistencyLog.historical_validations.length - 1]?.results || [];

    const passedCount = validationSummary.passed_ksis || 0;
    const failedCount = validationSummary.failed_ksis || 0;
    const totalCount = validationSummary.total_ksis || 0;

    // Show warning if data is incomplete
    const hasData = integrityReport || executionReport || consistencyLog;
    const isPartialData = hasData && (!integrityReport || !executionReport || !consistencyLog);

    return (
        <div className="wrap" style={{ paddingTop: 8, paddingBottom: 60 }}>
            {/* Header */}
            <div style={{ paddingTop: 30, paddingBottom: 24 }}>
                <div className="kick">⟳ — LIVE EVIDENCE STREAM</div>
                <h1 className="big">System 2.5 Transparency <span className="g">console</span></h1>
                <p className="lede">Configuration-driven validation framework with complete audit visibility. Every KSI validation, evidence snapshot, and consistency check as it happens.</p>
                <div className="hbadges">
                    <span className="badge i">SYSTEM 2.5</span>
                    <span className="badge">KSI VALIDATIONS</span>
                    <span className="badge">EXECUTION QUALITY</span>
                    <span className="badge">TEMPORAL CONSISTENCY</span>
                    {overallAssessment.audit_readiness && <StatusBadge status={overallAssessment.audit_readiness} />}
                </div>
            </div>

            {/* Navigation */}
            <nav className="tabs">
                <TabButton
                    id="overview"
                    label="Overview"
                    icon={BarChart3}
                    active={activeTab}
                    set={setActiveTab}
                />
                <TabButton
                    id="execution"
                    label="Execution Quality"
                    icon={Terminal}
                    active={activeTab}
                    set={setActiveTab}
                    count={technicalIssues.length + verdictDisagreements.length + complianceFailures.length}
                />
                <TabButton
                    id="consistency"
                    label="Consistency"
                    icon={Clock}
                    active={activeTab}
                    set={setActiveTab}
                    count={consistencyChecks.length}
                />
                <TabButton
                    id="validations"
                    label="KSI Details"
                    icon={Database}
                    active={activeTab}
                    set={setActiveTab}
                    count={totalCount}
                />
            </nav>

            {/* Content */}
            <div style={{ paddingTop: 24 }}>

                {/* Partial data warning */}
                {isPartialData && (
                    <div className="panel" style={{ marginBottom: 24, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12, borderColor: '#F2B85C55' }}>
                        <AlertCircle size={20} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--amber)', marginBottom: 4 }}>Incomplete Data</h4>
                            <p style={{ fontSize: 12, color: 'var(--ash)' }}>
                                Some data files are missing. The following files were not found:
                            </p>
                            <ul className="mono" style={{ fontSize: 11, color: 'var(--ash)', marginTop: 8, paddingLeft: 14 }}>
                                {!integrityReport && <li>validation_integrity_report.json</li>}
                                {!executionReport && <li>execution_quality_report.json</li>}
                                {!consistencyLog && <li>temporal_consistency_log.json</li>}
                            </ul>
                        </div>
                    </div>
                )}

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="stack" style={{ gap: 24 }}>
                        {!integrityReport ? (
                            <div className="panel" style={{ padding: 48, textAlign: 'center' }}>
                                <AlertCircle size={44} style={{ color: 'var(--faint)', margin: '0 auto 16px' }} />
                                <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ash)', marginBottom: 8 }}>No Integrity Report Data</h3>
                                <p className="mono" style={{ color: 'var(--faint)' }}>validation_integrity_report.json not found</p>
                            </div>
                        ) : (
                            <>
                                {/* LIVE EVENT STREAM — the centerpiece */}
                                <div className="panel">
                                    <div className="ph">
                                        <h4>Event stream</h4>
                                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--signal)', display: 'flex', alignItems: 'center', gap: 7 }}>
                                            <span className="d" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--signal)', animation: 'tcx-bl 1.6s infinite' }} />
                                            LIVE
                                        </span>
                                    </div>
                                    <div className="log" style={{ height: 300 }}>
                                        {logLines.map(l => (
                                            <div className="ln" key={l.key}>
                                                <span className="ts">{l.ts}</span>
                                                <span className={l.cls === 'wa' ? 'vi' : l.cls}>[{l.tag}]</span>
                                                <span className="ev">{l.ev}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Top-level metrics */}
                                <div className="g4">
                                    <MetricCard
                                        label="Overall Pass Rate"
                                        value={validationSummary.overall_pass_rate || '0%'}
                                        subtext={`${passedCount} of ${totalCount} KSIs passing`}
                                        icon={TrendingUp}
                                        status={passedCount / totalCount >= 0.9 ? 'excellent' : passedCount / totalCount >= 0.75 ? 'warning' : 'critical'}
                                    />
                                    <MetricCard
                                        label="Integrity Score"
                                        value={`${overallAssessment.integrity_score?.toFixed(1) || '0'}%`}
                                        subtext="Mathematical validation accuracy"
                                        icon={ShieldCheck}
                                        status={overallAssessment.integrity_score >= 90 ? 'excellent' : 'warning'}
                                    />
                                    <MetricCard
                                        label="Execution Quality"
                                        value={`${executionReport?.execution_quality_score || 0}%`}
                                        subtext={`${technicalIssues.length} technical issues`}
                                        icon={Cpu}
                                        status={technicalIssues.length === 0 ? 'excellent' : 'warning'}
                                    />
                                    <MetricCard
                                        label="Temporal Consistency"
                                        value={temporalAnalysis.average_consistency_score || '0%'}
                                        subtext={`${temporalAnalysis.recent_validations_count || 0} recent runs`}
                                        icon={Clock}
                                        status={temporalAnalysis.status}
                                    />
                                </div>

                                {/* Validation breakdown */}
                                <div className="panel">
                                    <div className="ph">
                                        <h4>Validation Status Breakdown</h4>
                                        <span className="map">live posture</span>
                                    </div>
                                    <div className="g3" style={{ padding: 18 }}>
                                        <div className="kpi" style={{ textAlign: 'center', borderColor: '#34E0C455' }}>
                                            <div className="v s" style={{ fontSize: 36 }}>{passedCount}</div>
                                            <div className="l">Passed</div>
                                        </div>
                                        <div className="kpi" style={{ textAlign: 'center', borderColor: '#F2607A55' }}>
                                            <div className="v" style={{ fontSize: 36, color: 'var(--red)' }}>{failedCount}</div>
                                            <div className="l">Failed</div>
                                        </div>
                                        <div className="kpi" style={{ textAlign: 'center' }}>
                                            <div className="v" style={{ fontSize: 36 }}>{totalCount}</div>
                                            <div className="l">Total KSIs</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Audit readiness */}
                                <div className="panel">
                                    <div className="ph">
                                        <h4>3PAO Audit Readiness</h4>
                                        <span className="map">assessment</span>
                                    </div>
                                    <div className="g3" style={{ padding: 18 }}>
                                        <div className="kpi">
                                            <div className="l" style={{ marginTop: 0, marginBottom: 8 }}>Audit Status</div>
                                            <StatusBadge status={overallAssessment.audit_readiness} />
                                        </div>
                                        <div className="kpi">
                                            <div className="l" style={{ marginTop: 0, marginBottom: 8 }}>Validation Determinism</div>
                                            <StatusBadge status={overallAssessment.validation_determinism} />
                                        </div>
                                        <div className="kpi">
                                            <div className="l" style={{ marginTop: 0, marginBottom: 8 }}>Technical Correctness</div>
                                            <StatusBadge status={overallAssessment.technical_correctness} />
                                        </div>
                                    </div>
                                </div>

                                {/* Report metadata */}
                                {integrityReport?.report_metadata && (
                                    <div className="panel" style={{ padding: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                            <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ash)' }}>
                                                <FileJson size={14} />
                                                <span>Report generated: {new Date(integrityReport.report_metadata.generated_at).toLocaleString()}</span>
                                            </div>
                                            <div className="mono" style={{ color: 'var(--faint)' }}>
                                                System 2.5 | Configuration-Driven Framework
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* EXECUTION QUALITY TAB */}
                {activeTab === 'execution' && (
                    <div className="stack" style={{ gap: 24 }}>
                        {!executionReport ? (
                            <div className="panel" style={{ padding: 48, textAlign: 'center' }}>
                                <AlertCircle size={44} style={{ color: 'var(--faint)', margin: '0 auto 16px' }} />
                                <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ash)', marginBottom: 8 }}>No Execution Data</h3>
                                <p className="mono" style={{ color: 'var(--faint)' }}>execution_quality_report.json not found</p>
                            </div>
                        ) : (
                            <>
                                {/* Summary cards */}
                                <div className="g3">
                                    <MetricCard
                                        label="Execution Quality Score"
                                        value={`${executionReport?.execution_quality_score || 0}%`}
                                        subtext="Overall automation health"
                                        icon={Cpu}
                                        status={executionReport?.execution_quality_score >= 90 ? 'excellent' : 'warning'}
                                    />
                                    <MetricCard
                                        label="Compliance Health Score"
                                        value={`${executionReport?.compliance_health_score || 0}%`}
                                        subtext="Infrastructure compliance level"
                                        icon={ShieldCheck}
                                        status={executionReport?.compliance_health_score >= 90 ? 'excellent' : 'warning'}
                                    />
                                    <MetricCard
                                        label="Total Issues"
                                        value={technicalIssues.length + verdictDisagreements.length + complianceFailures.length}
                                        subtext={`${technicalIssues.length} technical, ${verdictDisagreements.length} score/verdict, ${complianceFailures.length} compliance`}
                                        icon={AlertCircle}
                                        status={technicalIssues.length + verdictDisagreements.length + complianceFailures.length === 0 ? 'excellent' : 'warning'}
                                    />
                                </div>

                                {/* Technical Issues */}
                                {technicalIssues.length > 0 && (
                                    <div className="panel">
                                        <div className="ph">
                                            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <XCircle size={16} style={{ color: 'var(--red)' }} />
                                                Technical Issues ({technicalIssues.length})
                                            </h4>
                                            <span className="map" style={{ color: 'var(--ash)' }}>automation failures requiring attention</span>
                                        </div>
                                        <div>
                                            {technicalIssues.map((issue, idx) => (
                                                <IssueCard key={idx} issue={issue} type="technical" />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Score / Verdict Disagreements — Mode 3 outcome class */}
                                {verdictDisagreements.length > 0 && (
                                    <div className="panel">
                                        <div className="ph">
                                            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <AlertCircle size={16} style={{ color: 'var(--indigo)' }} />
                                                Score / Verdict Disagreements ({verdictDisagreements.length})
                                            </h4>
                                            <span className="map" style={{ color: 'var(--ash)' }}>per-resource score above threshold; metric-level threshold breached</span>
                                        </div>
                                        <div>
                                            {verdictDisagreements.map((issue, idx) => (
                                                <IssueCard key={idx} issue={issue} type="disagreement" />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Compliance Failures */}
                                {complianceFailures.length > 0 && (
                                    <div className="panel">
                                        <div className="ph">
                                            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <AlertCircle size={16} style={{ color: 'var(--amber)' }} />
                                                Compliance Gaps ({complianceFailures.length})
                                            </h4>
                                            <span className="map" style={{ color: 'var(--ash)' }}>resources not meeting requirements</span>
                                        </div>
                                        <div>
                                            {complianceFailures.map((issue, idx) => (
                                                <IssueCard key={idx} issue={issue} type="compliance" />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {technicalIssues.length === 0 && verdictDisagreements.length === 0 && complianceFailures.length === 0 && (
                                    <div className="panel" style={{ padding: 48, textAlign: 'center', borderColor: '#34E0C455' }}>
                                        <CheckCircle2 size={44} style={{ color: 'var(--signal)', margin: '0 auto 16px' }} />
                                        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--signal)', marginBottom: 8 }}>No Issues Detected</h3>
                                        <p style={{ color: 'var(--ash)' }}>All validations executed successfully with no compliance gaps</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* CONSISTENCY TAB */}
                {activeTab === 'consistency' && (
                    <div className="stack" style={{ gap: 24 }}>
                        {!consistencyLog || consistencyChecks.length === 0 ? (
                            <div className="panel" style={{ padding: 48, textAlign: 'center' }}>
                                <AlertCircle size={44} style={{ color: 'var(--faint)', margin: '0 auto 16px' }} />
                                <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ash)', marginBottom: 8 }}>No Consistency Data</h3>
                                <p className="mono" style={{ color: 'var(--faint)' }}>temporal_consistency_log.json not found or contains no data</p>
                            </div>
                        ) : (
                            <>
                                {/* Consistency chart */}
                                <div className="panel">
                                    <div className="ph">
                                        <h4>Temporal Consistency Trend</h4>
                                        <span className="map">{consistencyChecks.length} runs</span>
                                    </div>
                                    <div style={{ height: 256, padding: 18 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={consistencyChecks}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1A222D" vertical={false} />
                                                <XAxis
                                                    dataKey="timestamp"
                                                    tickFormatter={(ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    stroke="#788596"
                                                    style={{ fontSize: '12px' }}
                                                />
                                                <YAxis domain={[90, 100]} stroke="#788596" style={{ fontSize: '12px' }} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#0D1117', borderColor: '#1A222D', borderRadius: '8px' }}
                                                    itemStyle={{ color: '#E8EEF4' }}
                                                    labelFormatter={(ts) => new Date(ts).toLocaleString()}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="consistency_score"
                                                    stroke="#818CF8"
                                                    strokeWidth={2}
                                                    dot={{ fill: '#818CF8', r: 4 }}
                                                    activeDot={{ r: 6 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Consistency log table */}
                                <div className="panel">
                                    <div className="ph">
                                        <h4>Validation Consistency Log</h4>
                                        <span className="map">{consistencyChecks.length} validation runs tracked</span>
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ash)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                                                    <th style={{ padding: '12px 20px', textAlign: 'left', borderBottom: '1px solid var(--line)' }}>Timestamp</th>
                                                    <th style={{ padding: '12px 20px', textAlign: 'left', borderBottom: '1px solid var(--line)' }}>Consistency Score</th>
                                                    <th style={{ padding: '12px 20px', textAlign: 'left', borderBottom: '1px solid var(--line)' }}>Issues Found</th>
                                                    <th style={{ padding: '12px 20px', textAlign: 'left', borderBottom: '1px solid var(--line)' }}>Comparisons</th>
                                                    <th style={{ padding: '12px 20px', textAlign: 'left', borderBottom: '1px solid var(--line)' }}>Fingerprint</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {consistencyChecks.slice().reverse().map((check, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                                                        <td className="mono" style={{ padding: '14px 20px', color: 'var(--ink)' }}>
                                                            {new Date(check.timestamp).toLocaleString()}
                                                        </td>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                                <div style={{ width: 96, height: 6, background: 'var(--raise2)', borderRadius: 99, overflow: 'hidden' }}>
                                                                    <div
                                                                        style={{
                                                                            height: '100%', borderRadius: 99,
                                                                            background: check.consistency_score >= 99 ? 'var(--signal)' :
                                                                                check.consistency_score >= 95 ? 'var(--amber)' : 'var(--red)',
                                                                            width: `${check.consistency_score}%`
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span className="mono" style={{ color: 'var(--ink)' }}>
                                                                    {check.consistency_score.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            <span className={`tag ${check.issues_found === 0 ? 'ok' : 'red'}`}>
                                                                {check.issues_found}
                                                            </span>
                                                        </td>
                                                        <td className="mono" style={{ padding: '14px 20px', color: 'var(--ash)' }}>
                                                            {check.comparison_count}
                                                        </td>
                                                        <td className="mono" style={{ padding: '14px 20px', color: 'var(--faint)' }}>
                                                            {check.infrastructure_fingerprint?.substring(0, 12)}...
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* KSI VALIDATIONS TAB */}
                {activeTab === 'validations' && (
                    <div className="stack" style={{ gap: 24 }}>
                        {!consistencyLog || latestValidations.length === 0 ? (
                            <div className="panel" style={{ padding: 48, textAlign: 'center' }}>
                                <Database size={40} style={{ color: 'var(--faint)', margin: '0 auto 16px' }} />
                                <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--ash)', marginBottom: 4 }}>No Validation Data</h3>
                                <p className="mono" style={{ fontSize: 12, color: 'var(--faint)' }}>Validation data is not available</p>
                            </div>
                        ) : (
                            <>
                                {/* Header with stats */}
                                <div className="panel">
                                    <div className="ph">
                                        <div>
                                            <h4>Key Security Indicators</h4>
                                            <span className="map" style={{ color: 'var(--ash)' }}>FedRAMP 20x compliance validation results</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div className="v s" style={{ fontSize: 20 }}>{latestValidations.filter(v => v.assertion).length}</div>
                                                <div className="l" style={{ marginTop: 2 }}>Passing</div>
                                            </div>
                                            <div style={{ width: 1, height: 32, background: 'var(--line)' }} />
                                            <div style={{ textAlign: 'right' }}>
                                                <div className="v" style={{ fontSize: 20, color: 'var(--red)', fontFamily: 'var(--mono)' }}>{latestValidations.filter(v => !v.assertion).length}</div>
                                                <div className="l" style={{ marginTop: 2 }}>Failing</div>
                                            </div>
                                            <div style={{ width: 1, height: 32, background: 'var(--line)' }} />
                                            <div style={{ textAlign: 'right' }}>
                                                <div className="v i" style={{ fontSize: 20 }}>{latestValidations.length}</div>
                                                <div className="l" style={{ marginTop: 2 }}>Total</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div style={{ padding: '14px 20px', background: 'var(--raise2)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ flex: 1, height: 8, background: 'var(--raise)', borderRadius: 99, overflow: 'hidden' }}>
                                                <div
                                                    style={{ height: '100%', background: 'var(--signal)', borderRadius: 99, width: `${(latestValidations.filter(v => v.assertion).length / latestValidations.length) * 100}%` }}
                                                />
                                            </div>
                                            <span className="mono" style={{ color: 'var(--ink)' }}>
                                                {Math.round((latestValidations.filter(v => v.assertion).length / latestValidations.length) * 100)}% compliant
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Table-style list */}
                                <div className="panel">
                                    {/* Table header */}
                                    <div className="row" style={{ background: 'var(--raise2)', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ash)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                                        <div style={{ width: 18, flexShrink: 0 }}>St</div>
                                        <div style={{ width: 110, flexShrink: 0 }}>KSI ID</div>
                                        <div style={{ flex: 1 }}>Requirement</div>
                                        <div style={{ width: 140, flexShrink: 0 }}>Score</div>
                                        <div style={{ width: 80, flexShrink: 0, textAlign: 'right' }}>Resources</div>
                                    </div>

                                    {/* Validation rows */}
                                    <div>
                                        {latestValidations.map((validation, idx) => (
                                            <ValidationCard key={idx} validation={validation} />
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export { TransparencyConsole };

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Shield, Server, Users, MessageSquare, DollarSign, Box,
    AlertTriangle, RefreshCw, Layers, Cloud, Activity,
    CheckCircle, XCircle, Zap, ChevronDown, ChevronUp,
    ExternalLink, Info, Lock, Database, Eye, Settings,
    FileText, Building, CreditCard, Radio, Wifi, WifiOff,
    CircleDot, Signal, SignalHigh, SignalLow, SignalMedium
} from 'lucide-react';

import { BASE_PATH } from '../../config/theme';

const CATEGORY_CONFIG = {
    infrastructure: {
        icon: Cloud,
        label: 'Cloud Infrastructure',
        color: '#3b82f6',
        gradient: 'from-blue-500 to-blue-600',
        description: 'Core cloud computing resources'
    },
    identity: {
        icon: Shield,
        label: 'Identity & Access',
        color: '#a855f7',
        gradient: 'from-purple-500 to-purple-600',
        description: 'Authentication and authorization systems'
    },
    hr: {
        icon: Users,
        label: 'Human Resources',
        color: '#f59e0b',
        gradient: 'from-amber-500 to-amber-600',
        description: 'Personnel management and onboarding'
    },
    collaboration: {
        icon: MessageSquare,
        label: 'Collaboration',
        color: '#06b6d4',
        gradient: 'from-cyan-500 to-cyan-600',
        description: 'Team communication and workflows'
    },
    financial: {
        icon: DollarSign,
        label: 'Financial Health',
        color: '#10b981',
        gradient: 'from-emerald-500 to-emerald-600',
        description: 'Billing, costs, and financial stability'
    },
    application: {
        icon: Box,
        label: 'Core Application',
        color: '#f43f5e',
        gradient: 'from-rose-500 to-rose-600',
        description: 'Application components and services'
    },
    monitoring: {
        icon: Activity,
        label: 'Monitoring & Logging',
        color: '#8b5cf6',
        gradient: 'from-violet-500 to-violet-600',
        description: 'Observability and audit systems'
    },
    security: {
        icon: Lock,
        label: 'Security Services',
        color: '#ec4899',
        gradient: 'from-pink-500 to-pink-600',
        description: 'Security tools and compliance'
    },
    // Third-party integration categories (FRR-MAS-02/03)
    content_library: {
        icon: FileText,
        label: 'Content Library',
        color: '#22d3ee',
        gradient: 'from-cyan-400 to-cyan-500',
        description: 'Third-party learning content providers'
    },
    authoring_tool: {
        icon: Settings,
        label: 'Authoring Tools',
        color: '#a78bfa',
        gradient: 'from-violet-400 to-violet-500',
        description: 'Content creation and authoring'
    },
    virtual_meeting: {
        icon: Radio,
        label: 'Virtual Meeting',
        color: '#34d399',
        gradient: 'from-emerald-400 to-emerald-500',
        description: 'Video conferencing and virtual classroom'
    },
    devops: {
        icon: Database,
        label: 'DevOps',
        color: '#fb923c',
        gradient: 'from-orange-400 to-orange-500',
        description: 'Source code and CI/CD pipelines'
    },
    compliance: {
        icon: Shield,
        label: 'Compliance',
        color: '#60a5fa',
        gradient: 'from-blue-400 to-blue-500',
        description: 'Compliance data and reporting'
    }
};

const STATUS_COLORS = {
    healthy: '#34E0C4',
    warning: '#F2B85C',
    critical: '#F2607A',
    unknown: '#788596'
};

// Map a system/integration health string to a console .tag variant
const healthTag = (health, connected) => {
    if (connected === false) return 'vi';
    if (health === 'healthy') return 'ok';
    if (health === 'warning') return 'warn';
    if (health === 'critical') return 'red';
    return 'vi';
};

// ============================================
// CIA Impact — compact mono triad, console-styled
// ============================================
const CIABadge = ({ impact }) => {
    if (!impact) return null;
    const op = (level) => (level === 'High' ? 1 : (level === 'Moderate' || level === 'Mod') ? 0.6 : 0.32);
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            {['C', 'I', 'A'].map((letter) => (
                <span
                    key={letter}
                    className="mono"
                    style={{ fontSize: 10, color: 'var(--signal)', opacity: op(impact[letter]), padding: '0 2px' }}
                    title={`${letter === 'C' ? 'Confidentiality' : letter === 'I' ? 'Integrity' : 'Availability'}: ${impact[letter]}`}
                >
                    {letter}
                </span>
            ))}
        </span>
    );
};

// Third-Party / FedRAMP status — console tag
const ThirdPartyBadge = ({ isThirdParty, isAuthorized }) => {
    if (!isThirdParty) return <span className="tag vi">INTERNAL</span>;
    if (isAuthorized) return <span className="tag ok">FEDRAMP</span>;
    return <span className="tag warn">COMMERCIAL</span>;
};

// ============================================
// System Detail Panel — click-to-open overlay, console-themed
// ============================================
const SystemDetailPanel = ({ system, awsServices, driftSummary, onClose }) => {
    const [expandedService, setExpandedService] = useState(null);
    const [showAllServices, setShowAllServices] = useState(false);
    const config = CATEGORY_CONFIG[system.category] || CATEGORY_CONFIG.application;
    const Icon = config.icon;
    const isAWS = system.id === 'aws' && awsServices;

    const allServices = isAWS
        ? Object.entries(awsServices)
            .sort((a, b) => b[1] - a[1])
            .map(([name, cost]) => {
                const shortName = name.replace('Amazon ', '').replace('AWS ', '');
                const isSecurityService = name.includes('WAF') || name.includes('Firewall') ||
                    name.includes('GuardDuty') || name.includes('Security') ||
                    name.includes('Inspector') || name.includes('KMS') ||
                    name.includes('CloudTrail') || name.includes('Config') ||
                    name.includes('Secrets');
                const isNetworking = name.includes('VPC') || name.includes('Virtual Private') ||
                    name.includes('Load Balancing') || name.includes('Firewall');
                const isCompute = name.includes('EC2') || name.includes('Compute') || name.includes('Lambda');
                const isStorage = name.includes('S3') || name.includes('FSx') || name.includes('Storage');
                const isDatabase = name.includes('Database') || name.includes('RDS');
                const category = isSecurityService ? 'Security' : isNetworking ? 'Networking' :
                    isCompute ? 'Compute' : isStorage ? 'Storage' : isDatabase ? 'Database' : 'Management';
                const relatedDrift = (driftSummary || []).filter(d =>
                    d.source === 'aws' && (
                        name.toLowerCase().includes(d.type.replace(/_/g, ' ')) ||
                        d.description.includes(shortName) ||
                        d.description.includes(name)
                    )
                );
                return { name, shortName, cost, isSecurityService, category, relatedDrift };
            })
        : [];

    const visibleServices = showAllServices ? allServices : allServices.slice(0, 10);
    const systemDrift = (driftSummary || []).filter(d => d.source === system.id);

    return (
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80, paddingBottom: 32, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
        >
            <div
                className="panel"
                style={{ width: 480, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 0 80px rgba(0,0,0,0.8)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="ph" style={{ flexShrink: 0 }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon size={16} color="var(--signal)" />
                        {system.name}
                        <span className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>{config.label}</span>
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className={`tag ${healthTag(system.health, system.connected)}`}>
                            {system.connected ? (system.health || 'unknown').toUpperCase() : 'DOCUMENTED'}
                        </span>
                        <button onClick={onClose} className="badge" style={{ cursor: 'pointer', background: 'none' }}>
                            <XCircle size={13} />
                        </button>
                    </div>
                </div>

                {/* Scrollable content */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Summary KPIs */}
                    <div className="g4">
                        <div className="kpi">
                            <div className="v" style={{ fontSize: 14, color: STATUS_COLORS[system.health] || 'var(--ink)', textTransform: 'capitalize' }}>{system.health || 'Unknown'}</div>
                            <div className="l">Health</div>
                        </div>
                        <div className="kpi">
                            <div className="v s">{isAWS ? Object.keys(awsServices).length : (system.resource_count || 0)}</div>
                            <div className="l">{isAWS ? 'Services' : 'Resources'}</div>
                        </div>
                        <div className="kpi">
                            <div className={`v ${system.drift_count > 0 ? 'a' : ''}`}>{system.drift_count || 0}</div>
                            <div className="l">Drift</div>
                        </div>
                        <div className="kpi">
                            <div className="v" style={{ fontSize: 12 }}>{system.data_source || 'API'}</div>
                            <div className="l">Source</div>
                        </div>
                    </div>

                    {/* CIA Impact */}
                    {system.cia_impact && (
                        <div className="kpi">
                            <div className="l" style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 6 }}><Info size={10} /> CIA Impact · FRR-MAS-05</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0' }}>
                                <CIABadge impact={system.cia_impact} />
                                <ThirdPartyBadge isThirdParty={system.is_third_party} isAuthorized={system.is_fedramp_authorized} />
                            </div>
                            {system.cia_impact.rationale && (
                                <div className="sub" style={{ lineHeight: 1.5 }}>{system.cia_impact.rationale}</div>
                            )}
                        </div>
                    )}

                    {/* AWS Services - clickable rows */}
                    {isAWS && allServices.length > 0 && (
                        <div className="panel">
                            <div className="ph">
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Cloud size={12} /> Active Services ({allServices.length})</h4>
                                <span className="map">FRR-MAS-01</span>
                            </div>
                            {visibleServices.map((svc, idx) => (
                                <div key={idx}>
                                    <div
                                        className="row"
                                        style={{ cursor: 'pointer', justifyContent: 'space-between' }}
                                        onClick={() => setExpandedService(expandedService === idx ? null : idx)}
                                    >
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: svc.isSecurityService ? 'var(--red)' : 'var(--indigo)', flexShrink: 0 }} />
                                            <span className="svc" style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{svc.shortName}</span>
                                            {svc.relatedDrift.length > 0 && <AlertTriangle size={11} color="var(--amber)" />}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                                            <span className="mono" style={{ fontSize: 10, color: 'var(--faint)' }}>{svc.category}</span>
                                            {expandedService === idx ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        </span>
                                    </div>
                                    {expandedService === idx && (
                                        <div className="cexp" style={{ paddingLeft: 20 }}>
                                            <div className="kv">
                                                <div><span style={{ color: 'var(--faint)' }}>Full · </span>{svc.name}</div>
                                                <div><span style={{ color: 'var(--faint)' }}>Cost · </span><span className="mono" style={{ color: 'var(--signal)' }}>${svc.cost.toFixed(2)}/mo</span></div>
                                                <div><span style={{ color: 'var(--faint)' }}>Category · </span>{svc.category}</div>
                                                <div><span style={{ color: 'var(--faint)' }}>Class · </span><span style={{ color: svc.isSecurityService ? 'var(--red)' : 'var(--indigo)' }}>{svc.isSecurityService ? 'Security Service' : 'Infrastructure'}</span></div>
                                            </div>
                                            {svc.relatedDrift.length > 0 && (
                                                <div style={{ marginTop: 10, color: 'var(--amber)' }}>
                                                    {svc.relatedDrift.map((drift, dIdx) => (
                                                        <div key={dIdx} style={{ color: 'var(--ash)' }}>{drift.description}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {allServices.length > 10 && (
                                <div className="row" style={{ justifyContent: 'center' }}>
                                    <button
                                        onClick={() => { setShowAllServices(s => !s); if (showAllServices) setExpandedService(null); }}
                                        className="badge i"
                                        style={{ cursor: 'pointer', background: 'none' }}
                                    >
                                        {showAllServices ? 'Show fewer' : `Show all ${allServices.length} services`}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Drift detail for this system */}
                    {systemDrift.length > 0 && (
                        <div className="panel">
                            <div className="ph">
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={12} color="var(--amber)" /> Configuration Drift ({systemDrift.length})</h4>
                            </div>
                            {systemDrift.map((drift, idx) => (
                                <div className="row" key={idx} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 5 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span className="mono" style={{ fontSize: 11, color: 'var(--amber)' }}>{drift.type.replace(/_/g, ' ')}</span>
                                        <span className={`tag ${drift.severity === 'critical' ? 'red' : 'warn'}`}>{drift.severity}</span>
                                    </div>
                                    <span className="mono" style={{ fontSize: 11, color: 'var(--ash)' }}>{drift.description}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="ph" style={{ flexShrink: 0, borderTop: '1px solid var(--line)', borderBottom: 'none' }}>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--faint)' }}>ID: {system.id}</span>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--faint)' }}>Type: {system.system_type || 'connected'}</span>
                </div>
            </div>
        </div>
    );
};

// ============================================
// Resource row — console .row used for systems & integrations
// ============================================
const ResourceRow = ({ item, onClick }) => {
    const config = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.application;
    const Icon = config.icon;
    return (
        <div className="row" style={{ cursor: onClick ? 'pointer' : 'default', justifyContent: 'space-between', gap: 14 }} onClick={onClick}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <Icon size={15} color={item.connected ? 'var(--signal)' : 'var(--faint)'} style={{ flexShrink: 0 }} />
                <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span className="svc" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--faint)' }}>{config.label}</span>
                </span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                {item.cia_impact && <CIABadge impact={item.cia_impact} />}
                <ThirdPartyBadge isThirdParty={item.is_third_party} isAuthorized={item.is_fedramp_authorized} />
                {item.drift_count > 0 && <span className="tag warn">{item.drift_count} DRIFT</span>}
                <span className={`tag ${healthTag(item.health, item.connected)}`}>
                    {item.connected ? 'LIVE' : 'DOCUMENTED'}
                </span>
            </span>
        </div>
    );
};

// ============================================
// Main Dashboard Component
// ============================================
export const UnifiedMasDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(null);
    const [selectedSystem, setSelectedSystem] = useState(null);

    const handleSystemClick = useCallback((systemId) => {
        setSelectedSystem(prev => prev === systemId ? null : systemId);
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${BASE_PATH}mas_dashboard.json?t=${Date.now()}`);
            if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
            const json = await response.json();
            setData(json);
            setLastRefresh(new Date());
            console.log('✅ Unified MAS Dashboard loaded:', json.health?.connected_systems, 'systems connected');
        } catch (err) {
            console.error('❌ Failed to load MAS dashboard:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [loadData]);

    const totalResources = useMemo(() =>
        (data?.systems || []).reduce((sum, s) => sum + (s.resource_count || 0), 0),
        [data?.systems]
    );

    const totalDrift = useMemo(() =>
        (data?.systems || []).reduce((sum, s) => sum + (s.drift_count || 0), 0),
        [data?.systems]
    );

    // Federal data lifecycle — built from the OMB A-130 phases, anchored to
    // real scope facts (system count, integrations, hosting) where available.
    const lifecycle = useMemo(() => {
        const sysCount = data?.health?.total_systems || (data?.systems?.length || 0);
        const intCount = data?.health?.total_integrations || (data?.integrations?.length || 0);
        return [
            ['Collected', 'User Entry & Auth', 'KSI-IAM'],
            ['Processed', 'Core Application', 'KSI-SVC'],
            ['Maintained', 'Encrypted Store', 'KSI-CNA'],
            ['Disseminated', `${intCount} Third-Party`, 'KSI-TPR'],
            ['Maintained', `${sysCount} Resources`, 'KSI-MLA'],
        ];
    }, [data?.health, data?.systems, data?.integrations]);

    if (loading && !data) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 384 }}>
                <div style={{ textAlign: 'center' }}>
                    <RefreshCw size={32} className="animate-spin" color="var(--signal)" style={{ margin: '0 auto 16px' }} />
                    <div className="mono" style={{ color: 'var(--ash)' }}>Loading Minimum Assessment Scope…</div>
                </div>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="panel" style={{ padding: 32, textAlign: 'center', borderColor: '#F2607A55' }}>
                <AlertTriangle size={40} color="var(--red)" style={{ margin: '0 auto 16px' }} />
                <h4 style={{ fontSize: 18, marginBottom: 8 }}>Failed to Load Assessment Scope</h4>
                <p className="mono" style={{ color: 'var(--ash)', marginBottom: 16 }}>{error}</p>
                <button onClick={loadData} className="btn ghost" style={{ cursor: 'pointer' }}>Retry</button>
            </div>
        );
    }

    const overall = data?.health?.overall || 'unknown';
    const overallColor = STATUS_COLORS[overall] || STATUS_COLORS.unknown;
    const connectedSystems = data?.health?.connected_systems || 0;
    const totalSystems = data?.health?.total_systems || 0;

    return (
        <div className="stack" style={{ gap: 22 }}>
            {/* ── Header ── */}
            <div>
                <div className="kick">⬡ — MINIMUM ASSESSMENT SCOPE · FRR-MAS</div>
                <h1 className="big">Boundary &amp; <span className="g">data flow</span></h1>
                <p className="lede">Federal data lifecycle per OMB A-130. Physical and lower-stack controls inherited from AWS's FedRAMP authorization.</p>

                {/* live status pills */}
                <div className="hbadges" style={{ marginBottom: 0 }}>
                    <span className="badge" style={{ borderColor: `${overallColor}55`, color: overallColor }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: overallColor }} />
                        {overall.toUpperCase()}
                    </span>
                    <span className="badge s">{connectedSystems}/{totalSystems} CONNECTED</span>
                    <span className="badge">{totalResources} RESOURCES</span>
                    {data?.integrations?.length > 0 && <span className="badge i">{data.integrations.length} INTEGRATIONS</span>}
                    {totalDrift > 0 && <span className="badge" style={{ borderColor: '#F2B85C55', color: 'var(--amber)' }}>{totalDrift} DRIFT</span>}
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="badge i"
                        style={{ cursor: 'pointer', background: 'none' }}
                    >
                        <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                        {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* ── Data lifecycle flow ── */}
            <div className="flow">
                {lifecycle.map((n, i, a) => (
                    <React.Fragment key={i}>
                        <div className="node">
                            <div className="ph2">{n[0]}</div>
                            <div className="nm">{n[1]}</div>
                            <div className="ks">{n[2]}</div>
                        </div>
                        {i < a.length - 1 && <div className="arrow">→</div>}
                    </React.Fragment>
                ))}
            </div>

            {/* ── Boundary facts ── */}
            <div>
                <h3 className="sec">Boundary</h3>
                <div className="g3">
                    <div className="kpi">
                        <div className="v" style={{ fontSize: 18 }}>AWS US-East-1</div>
                        <div className="l">Hosting</div>
                        <div className="sub">inherited FedRAMP controls</div>
                    </div>
                    <div className="kpi">
                        <div className="v" style={{ fontSize: 18 }}>Multi-Tenant</div>
                        <div className="l">Tenancy</div>
                        <div className="sub">logical isolation per agency</div>
                    </div>
                    <div className="kpi">
                        <div className="v" style={{ fontSize: 18 }}>AES-256 · TLS 1.2+</div>
                        <div className="l">Encryption</div>
                        <div className="sub">KMS-managed keys</div>
                    </div>
                </div>
            </div>

            {/* ── Scope metrics ── */}
            <div>
                <h3 className="sec">Scope Telemetry</h3>
                <div className="g4">
                    <div className="kpi">
                        <div className="v s">{connectedSystems}<span style={{ color: 'var(--faint)', fontSize: 16 }}> / {totalSystems}</span></div>
                        <div className="l">Connected Systems</div>
                    </div>
                    <div className="kpi">
                        <div className="v i">{data?.integrations?.length || 0}</div>
                        <div className="l">Integrations</div>
                        {data?.health?.non_fedramp_integrations > 0 && (
                            <div className="sub">{data.health.non_fedramp_integrations} non-FedRAMP</div>
                        )}
                    </div>
                    <div className="kpi">
                        <div className="v">{totalResources}</div>
                        <div className="l">Resources In Scope</div>
                    </div>
                    <div className="kpi">
                        <div className={`v ${totalDrift > 0 ? 'a' : 's'}`}>{totalDrift}</div>
                        <div className="l">Config Drift</div>
                        {data?.health?.critical_drift > 0 && (
                            <div className="sub" style={{ color: 'var(--red)' }}>{data.health.critical_drift} critical</div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Information Resources ── */}
            {data?.systems?.length > 0 && (
                <div>
                    <h3 className="sec">Information Resources</h3>
                    <div className="panel">
                        <div className="ph">
                            <h4>Connected Systems</h4>
                            <span className="map">FRR-MAS-01 · click for detail</span>
                        </div>
                        {data.systems.map((system) => (
                            <ResourceRow key={system.id} item={system} onClick={() => handleSystemClick(system.id)} />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Third-Party Integrations ── */}
            {data?.integrations?.length > 0 && (
                <div>
                    <h3 className="sec">Third-Party Integrations</h3>
                    <div className="panel">
                        <div className="ph">
                            <h4>Documented Integrations</h4>
                            <span className="map">FRR-MAS-02 / 03</span>
                        </div>
                        {data.integrations.map((integration) => (
                            <ResourceRow key={integration.id} item={integration} />
                        ))}
                    </div>
                </div>
            )}

            {/* ── AWS Services ── */}
            {data?.aws_services && Object.keys(data.aws_services).length > 0 && (
                <div>
                    <h3 className="sec">AWS Services In Scope</h3>
                    <div className="panel">
                        <div className="ph">
                            <h4><Cloud size={13} style={{ verticalAlign: -2, marginRight: 6 }} />{Object.keys(data.aws_services).length} Services</h4>
                            <span className="map">FRR-MAS-01</span>
                        </div>
                        <div style={{ padding: '16px 18px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {Object.entries(data.aws_services)
                                .sort((a, b) => b[1] - a[1])
                                .map(([name, cost], idx) => {
                                    const isSecurityService = name.includes('WAF') || name.includes('Firewall') ||
                                        name.includes('GuardDuty') || name.includes('Security') ||
                                        name.includes('Inspector') || name.includes('KMS');
                                    return (
                                        <span
                                            key={idx}
                                            className={`tag ${isSecurityService ? 'vi' : ''}`}
                                            style={isSecurityService ? undefined : { color: 'var(--ash)', background: 'var(--raise2)' }}
                                            title={`$${cost.toFixed(2)}/mo`}
                                        >
                                            {name.replace('Amazon ', '').replace('AWS ', '')}
                                        </span>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Configuration Drift ── */}
            {(data?.drift_summary?.length || 0) > 0 && (
                <div>
                    <h3 className="sec">Configuration Drift</h3>
                    <div className="panel">
                        <div className="ph">
                            <h4><AlertTriangle size={13} color="var(--amber)" style={{ verticalAlign: -2, marginRight: 6 }} />{data.drift_summary.length} Drift Items</h4>
                            <span className="map">live diff vs. expected state</span>
                        </div>
                        {data.drift_summary.map((item, idx) => (
                            <div className="row" key={idx} style={{ justifyContent: 'space-between', gap: 14 }}>
                                <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span className="mono" style={{ fontSize: 11, color: 'var(--indigo)' }}>{item.source}</span>
                                        <span className="mono" style={{ fontSize: 11, color: 'var(--ash)' }}>{item.type}</span>
                                    </span>
                                    <span className="mono" style={{ fontSize: 11, color: 'var(--faint)', marginTop: 3 }}>{item.description}</span>
                                </span>
                                <span className={`tag ${item.severity === 'critical' ? 'red' : item.severity === 'warning' ? 'warn' : 'vi'}`}>
                                    {item.severity}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── FedRAMP MAS Compliance Footer ── */}
            <div className="panel">
                <div className="ph">
                    <h4><FileText size={13} color="var(--indigo)" style={{ verticalAlign: -2, marginRight: 6 }} />FedRAMP MAS Rule Family</h4>
                    <span className="map">{data?.meta?.compliance_ver || 'FedRAMP 20x'}</span>
                </div>
                {[
                    ['FRR-MAS-01', 'Cloud Service Offering includes all information resources (machine AND non-machine) likely to handle or impact CIA of federal customer data.'],
                    ['FRR-MAS-02', 'Third-party information resources are included and monitored.'],
                    ['FRR-MAS-03', 'Non-FedRAMP authorized third-party resources documented with justification and compensating controls.'],
                    ['FRR-MAS-04', 'Metadata about federal customer data included in assessment scope.'],
                    ['FRR-MAS-05', 'Information flows and CIA impact levels documented for ALL resources.'],
                ].map(([id, desc]) => (
                    <div className="row" key={id} style={{ gap: 14, alignItems: 'flex-start' }}>
                        <span className="mono" style={{ color: 'var(--indigo)', fontSize: 11, flexShrink: 0, minWidth: 92 }}>{id}</span>
                        <span style={{ fontSize: 13, color: 'var(--ash)', lineHeight: 1.5 }}>{desc}</span>
                    </div>
                ))}
                <div className="ph" style={{ borderBottom: 'none', borderTop: '1px solid var(--line)' }}>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--ash)' }}>
                        Fingerprint: <span style={{ color: 'var(--signal)' }}>{data?.meta?.fingerprint || 'N/A'}</span>
                    </span>
                    <span className="tag ok">Phase 2 Pilot Ready</span>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--ash)' }}>
                        Generated: {data?.meta?.generated_at ? new Date(data.meta.generated_at).toLocaleString() : 'N/A'}
                    </span>
                </div>
            </div>

            {/* ── Click-to-open system detail overlay ── */}
            {selectedSystem && (() => {
                const systemData = data?.systems?.find(s => s.id === selectedSystem);
                return systemData ? (
                    <SystemDetailPanel
                        system={systemData}
                        awsServices={data?.aws_services}
                        driftSummary={data?.drift_summary}
                        onClose={() => setSelectedSystem(null)}
                    />
                ) : null;
            })()}
        </div>
    );
};

export default UnifiedMasDashboard;

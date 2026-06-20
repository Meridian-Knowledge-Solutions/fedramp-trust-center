import React, { useState, useEffect, memo, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useModal } from '../../contexts/ModalContext';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import { API_CONFIG, QUARTERLY_REGISTRATION_URL } from '../../config/api';
import { BASE_PATH } from '../../config/theme';
import { getRouteSegments, setRoute, onRouteChange } from '../../utils/hashRoute';
import {
    Shield, ShieldCheck, Network, Activity, Layers, Download, ExternalLink,
    FileJson, Landmark, Calendar, Clock, Video, CheckCircle2, ArrowRight,
    Lock, Globe, Users, MessageSquare, Send, Mail, Database, Cpu, Server,
    Eye, AlertTriangle, TrendingUp, CheckSquare, Info, User,
    GitCommit, CircleDot, Gauge,
} from 'lucide-react';
import {
    cn, Card, Badge, Eyebrow, SectionHeader, StatCard, Fact, Sparkline, SURFACE_2,
} from './ui';
import CustomerResponsibilityMatrix from './CustomerResponsibilityMatrix';

// ============================================================================
// TRUST CENTER — agency/assessor-facing authorization & posture surface.
// Redesigned around a single design system (./ui): lead with authorization
// status + live posture, then progressive disclosure per focus area.
// ============================================================================

const TABS = [
    { id: 'overview', label: 'Overview', icon: Shield, desc: 'Authorization & posture' },
    { id: 'compliance', label: 'Compliance', icon: ShieldCheck, desc: 'NIST · KSI · CMMC · CUI' },
    { id: 'architecture', label: 'Architecture', icon: Network, desc: 'Data flow & boundary' },
    { id: 'changes', label: 'Change Activity', icon: Activity, desc: 'Significant changes' },
    { id: 'resources', label: 'Services & Resources', icon: Layers, desc: 'Scope & artifacts' },
];
const TAB_IDS = new Set(TABS.map(t => t.id));

// ───────── Federal data-flow stages (OMB A-130 lifecycle) ─────────
const FLOW_STAGES = [
    { id: 'entry', icon: User, accent: '#34d399', title: 'Federal User Entry', phase: 'Collected', desc: 'Federal users reach the Application Load Balancer over HTTPS/TLS 1.2+.', security: ['TLS 1.2+', 'PIV/CAC'], data: ['Access Logs', 'Source IP', 'Session ID'], ksis: ['KSI-IAM-01', 'KSI-IAM-02', 'KSI-SVC-02'] },
    { id: 'auth', icon: ShieldCheck, accent: '#818cf8', title: 'Identity & Auth', phase: 'Collected', desc: 'Okta Federal Gov SAML 2.0 SSO with PIV/CAC validation and MFA.', security: ['SAML 2.0', 'FIPS 140-2', 'MFA'], data: ['SAML Assertions', 'UPN Data', 'Group Membership'], ksis: ['KSI-IAM-01', 'KSI-IAM-03', 'KSI-SVC-03'] },
    { id: 'processing', icon: Cpu, accent: '#38bdf8', title: 'Application Processing', phase: 'Processed', desc: 'LMS web tier (ASP.NET on EC2) processes training, assessments, and content.', security: ['WAF', 'HTTPS', 'RBAC'], data: ['Training Records', 'Assessments', 'Completions'], ksis: ['KSI-SVC-01', 'KSI-SVC-02', 'KSI-MLA-01'] },
    { id: 'storage', icon: Database, accent: '#a78bfa', title: 'Encrypted Storage', phase: 'Maintained', desc: 'RDS, S3, and FSx with AES-256 at rest and KMS-managed keys.', security: ['AES-256', 'KMS', 'Backups'], data: ['User Records', 'Learning Data', 'Audit Logs'], ksis: ['KSI-CNA-01', 'KSI-CNA-04', 'KSI-INR-01'] },
    { id: 'dissemination', icon: Send, accent: '#fbbf24', title: 'Third-Party Dissemination', phase: 'Disseminated', desc: 'Content providers receive scoped PII via SAML SSO and xAPI/SCORM.', security: ['xAPI', 'SCORM', 'SAML SSO'], data: ['Employee Names', 'Email', 'Progress'], ksis: ['KSI-TPR-01', 'KSI-TPR-02', 'KSI-PIY-02'] },
    { id: 'monitoring', icon: Eye, accent: '#fb7185', title: 'Security Monitoring', phase: 'Maintained', desc: 'CloudWatch, CloudTrail, GuardDuty, and Config provide continuous monitoring.', security: ['24/7', 'SIEM', 'Alerts'], data: ['CloudTrail Logs', 'Flow Logs', 'Config'], ksis: ['KSI-MLA-01', 'KSI-MLA-02', 'KSI-CNA-07'] },
];

const SCN_TIER = {
    transformative: { label: 'Transformative', variant: 'danger', dot: '#fb7185' },
    adaptive: { label: 'Adaptive', variant: 'info', dot: '#38bdf8' },
    routine_recurring: { label: 'Routine', variant: 'success', dot: '#34d399' },
    impact_categorization: { label: 'Impact', variant: 'warning', dot: '#fbbf24' },
    critical: { label: 'Critical', variant: 'danger', dot: '#f43f5e' },
};

// ─────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────
const Hero = ({ cso, status, lastRefresh }) => {
    const operational = (status?.status || 'operational') === 'operational';
    return (
        <Card className="relative overflow-hidden p-7 md:p-8">
            <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-sky-500/10 blur-[110px] pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />
            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-start gap-5 min-w-0">
                    <div className="w-16 h-16 rounded-2xl bg-[#0b1220] border border-white/10 flex items-center justify-center p-3 shrink-0">
                        <img src={`${BASE_PATH}meridian-favicon.png`} alt="Meridian" className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                        <Eyebrow className="mb-1.5">FedRAMP Trust Center</Eyebrow>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{cso?.cso_name || 'Meridian LMS'}</h1>
                        <p className="text-[13px] text-slate-400 mt-1">{cso?.provider_name || 'Meridian Knowledge Solutions'}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-4">
                            <Badge variant="success" icon={ShieldCheck}>Authorized</Badge>
                            <Badge variant="info">{cso?.authorization_type || 'FedRAMP 20x'}</Badge>
                            <Badge variant="neutral">{cso?.impact_level || 'Moderate'} Impact</Badge>
                            <Badge variant="neutral">{cso?.service_model || 'SaaS'}</Badge>
                        </div>
                    </div>
                </div>

                <div className="lg:text-right shrink-0">
                    <div className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold',
                        operational ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' : 'bg-amber-500/10 text-amber-300 border-amber-500/25')}>
                        <span className="relative flex h-2 w-2">
                            <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping', operational ? 'bg-emerald-400' : 'bg-amber-400')} />
                            <span className={cn('relative inline-flex rounded-full h-2 w-2', operational ? 'bg-emerald-400' : 'bg-amber-400')} />
                        </span>
                        {operational ? 'All Systems Operational' : 'Degraded'}
                    </div>
                    <div className="mt-4 flex flex-col gap-1.5 text-[12px] text-slate-400 lg:items-end">
                        <span className="font-mono text-slate-300">{cso?.package_id || '—'}</span>
                        <div className="flex flex-wrap gap-3 lg:justify-end">
                            {cso?.marketplace_url && (
                                <a href={cso.marketplace_url} target="_blank" rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-semibold">
                                    <Landmark className="w-3.5 h-3.5" /> Marketplace <ExternalLink className="w-3 h-3 opacity-60" />
                                </a>
                            )}
                            <a href={`${BASE_PATH}cso_public_info.json`} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white font-semibold">
                                <FileJson className="w-3.5 h-3.5" /> JSON
                            </a>
                        </div>
                        {lastRefresh && <span className="text-slate-600">Updated {lastRefresh}</span>}
                    </div>
                </div>
            </div>
        </Card>
    );
};

// ───────── Tab bar ─────────
const TabBar = ({ active, onChange }) => (
    <div className="sticky top-0 z-30 -mx-1 px-1 py-3 bg-[#0a0a0c]/90 backdrop-blur-md">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {TABS.map(t => {
                const Icon = t.icon;
                const on = active === t.id;
                return (
                    <button key={t.id} onClick={() => onChange(t.id)} title={t.desc} aria-current={on ? 'page' : undefined}
                        className={cn('group flex items-center gap-2 px-4 py-2.5 rounded-xl border whitespace-nowrap transition-all shrink-0',
                            on ? 'bg-sky-500/10 border-sky-500/30 text-white' : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/[0.12]')}>
                        <Icon className={cn('w-4 h-4', on ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300')} />
                        <span className="text-[13px] font-semibold tracking-tight">{t.label}</span>
                    </button>
                );
            })}
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────
// OVERVIEW
// ─────────────────────────────────────────────────────────────────────────
const PostureStrip = ({ oar, vdr, status }) => {
    const ex = oar?.executive_summary;
    const trend = oar?.compliance_trend?.data_points?.map(p => p.compliance_rate) || [];
    const improving = oar?.compliance_trend?.trend_direction === 'improving';
    const uptime = status?.uptime_percent ? `${parseFloat(status.uptime_percent).toFixed(2)}%` : '—';

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="KSI Compliance" value={ex ? `${ex.compliance_rate}%` : '—'} accent="text-emerald-400" icon={Gauge}
                sub={ex ? `${ex.passed_ksis} of ${ex.total_ksis} indicators passing` : undefined}>
                <div className="mt-3 flex items-center justify-between">
                    <Sparkline data={trend} stroke="#34d399" />
                    {improving && <Badge variant="success" icon={TrendingUp}>Improving</Badge>}
                </div>
            </StatCard>

            <StatCard label="Active Gaps" value={ex?.active_gaps ?? '—'} accent={ex?.active_gaps ? 'text-amber-400' : 'text-emerald-400'} icon={AlertTriangle}
                sub="KSI gaps in active remediation">
                <div className="mt-4 text-[12px] text-slate-500">
                    {oar?.data_sources?.ksi_history_entries?.toLocaleString() || '—'} validation runs to date
                </div>
            </StatCard>

            <StatCard label="Open Vulnerabilities" value={vdr?.vdr_acceptance?.active ?? vdr?.snapshot?.total_vulnerabilities ?? '—'}
                accent="text-white" icon={Shield}
                sub={vdr ? `${vdr.risk?.critical ?? 0} critical · ${vdr.vdr_acceptance?.accepted ?? 0} accepted` : undefined}>
                <div className="mt-4 flex items-center gap-2">
                    {vdr?.posture?.rating && <Badge variant="success">{vdr.posture.rating} · {vdr.posture.score}</Badge>}
                </div>
            </StatCard>

            <StatCard label="Platform Uptime" value={uptime} accent="text-emerald-400" icon={Activity}
                sub={status?.avg_latency ? `${status.avg_latency} avg latency` : 'Continuously monitored'}>
                <div className="mt-4 text-[12px] text-slate-500">
                    {ex?.evidence_snapshots?.daily || '—'} daily evidence snapshots
                </div>
            </StatCard>
        </div>
    );
};

const ServiceProfile = ({ cso }) => (
    <Card className="p-7">
        <SectionHeader icon={Info} title="Service Profile" accent="text-sky-400"
            desc="What the platform is and how it is deployed." />
        <p className="text-[14px] text-slate-400 leading-relaxed max-w-3xl">
            {cso?.service_description ||
                'Enterprise SaaS platform for workforce training, compliance tracking, and professional development.'}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            <Fact label="Deployment" value={cso?.deployment_model || 'Multi-Tenant Public Cloud'} />
            <Fact label="Cloud" value={cso?.cloud_provider || 'AWS Commercial (US-East-1)'} />
            <Fact label="UEI" value={cso?.uei || '—'} mono sub="SAM.gov" />
            <Fact label="Category" value={cso?.business_category || 'Learning Management'} />
            <Fact label="Access" value={cso?.access_methods?.primary || 'HTTPS (Port 443)'} />
            <Fact label="Authentication" value={cso?.access_methods?.authentication || 'SAML 2.0 SSO with MFA'} />
            <Fact label="API" value={cso?.access_methods?.api || 'REST · OAuth 2.0 / API Key'} />
            <Fact label="Authorization" value={cso?.authorization_type || 'FedRAMP 20x'} sub={`${cso?.impact_level || 'Moderate'} baseline`} />
        </div>
    </Card>
);

const ContinuousMonitoring = ({ schedule, meeting }) => {
    const registrationUrl = QUARTERLY_REGISTRATION_URL || meeting?.registrationUrl;
    const dateLabel = meeting?.nextDate
        ? new Date(meeting.nextDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        : 'To be announced';

    return (
        <Card className="p-7">
            <SectionHeader icon={Calendar} title="Continuous Monitoring" accent="text-indigo-400"
                desc="Reporting cadence and the collaborative review (FRR-CCM-QR-02)." />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Fact label="Next Ongoing Report" value={schedule?.next_ongoing_report || 'TBD'} mono />
                <Fact label="Next Quarterly Review" value={schedule?.next_quarterly_review || 'TBD'} mono />
                <Fact label="Last Data Refresh" value={schedule?.last_data_refresh || 'TBD'} mono />
            </div>
            {meeting && (
                <div className={cn('mt-4 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4', SURFACE_2)}>
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                            <Video className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-semibold text-white">{meeting.meetingTitle || 'Quarterly Continuous Monitoring Review'}</div>
                            {meeting.description && <p className="text-[13px] text-slate-400 mt-0.5 leading-relaxed max-w-xl">{meeting.description}</p>}
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-[12px] text-slate-400">
                                <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-indigo-400" />{dateLabel}</span>
                                {meeting.time && <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-indigo-400" />{meeting.time}</span>}
                                <span className="text-slate-600">· Microsoft Teams</span>
                            </div>
                        </div>
                    </div>
                    {registrationUrl && (
                        <button onClick={() => window.open(registrationUrl, '_blank', 'noopener')}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-[13px] transition-all shrink-0">
                            <Video className="w-4 h-4" /> Register
                        </button>
                    )}
                </div>
            )}
        </Card>
    );
};

const Responsibilities = ({ items }) => {
    if (!items?.length) return null;
    return (
        <Card className="p-7">
            <SectionHeader icon={Users} title="Customer Responsibilities" accent="text-amber-400"
                desc="What your agency owns under the shared-responsibility model (ADS-CSO-PUB)." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {items.map((r, i) => (
                    <div key={i} className={cn('flex items-start gap-3 rounded-xl p-4', SURFACE_2)}>
                        <CheckSquare className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <span className="text-[13px] text-slate-300 leading-relaxed">{r}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const OverviewTab = ({ cso, oar, vdr, status, schedule, meeting }) => (
    <div className="space-y-6">
        <PostureStrip oar={oar} vdr={vdr} status={status} />
        <ServiceProfile cso={cso} />
        <ContinuousMonitoring schedule={schedule} meeting={meeting} />
        <Responsibilities items={cso?.customer_responsibilities} />
    </div>
);

// ─────────────────────────────────────────────────────────────────────────
// ARCHITECTURE — federal data-flow pipeline
// ─────────────────────────────────────────────────────────────────────────
const FlowCard = ({ stage, active, onClick }) => {
    const Icon = stage.icon;
    return (
        <button onClick={() => onClick(stage.id)}
            className={cn('relative text-left w-full rounded-2xl border p-4 transition-all min-w-0',
                active ? 'border-white/20 bg-white/[0.05]' : 'border-white/[0.06] bg-[#0f0f12] hover:border-white/15 hover:bg-white/[0.03]')}>
            <div className="absolute top-0 left-4 right-4 h-px rounded-full" style={{ background: stage.accent, opacity: 0.6 }} />
            <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg border shrink-0" style={{ borderColor: `${stage.accent}40`, background: `${stage.accent}14` }}>
                    <Icon className="w-4 h-4" style={{ color: stage.accent }} />
                </div>
                <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{stage.phase}</div>
                    <div className="text-sm font-semibold text-white leading-tight truncate">{stage.title}</div>
                </div>
            </div>
            <p className="text-[12px] leading-relaxed text-slate-400 line-clamp-2">{stage.desc}</p>
        </button>
    );
};

const FlowDetail = ({ stage }) => {
    const Icon = stage.icon;
    const Col = ({ icon: I, title, children }) => (
        <div className={cn('rounded-xl p-4', SURFACE_2)}>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-3"><I className="w-3.5 h-3.5" />{title}</div>
            {children}
        </div>
    );
    return (
        <Card className="p-6">
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-white/[0.06]">
                <div className="p-3 rounded-xl border shrink-0" style={{ borderColor: `${stage.accent}40`, background: `${stage.accent}14` }}>
                    <Icon className="w-5 h-5" style={{ color: stage.accent }} />
                </div>
                <div>
                    <h4 className="text-lg font-semibold text-white">{stage.title}</h4>
                    <p className="text-[13px] text-slate-400 mt-0.5">{stage.desc}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Col icon={Database} title="Data Elements">
                    <div className="space-y-2">
                        {stage.data.map((d, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: stage.accent }} />
                                <span className="text-[13px] text-slate-300 font-mono">{d}</span>
                            </div>
                        ))}
                    </div>
                </Col>
                <Col icon={Lock} title="Security Controls">
                    <div className="flex flex-wrap gap-1.5">
                        {stage.security.map((s, i) => <Badge key={i} variant="neutral">{s}</Badge>)}
                    </div>
                </Col>
                <Col icon={Shield} title="FedRAMP 20x KSIs">
                    <div className="flex flex-wrap gap-1.5">
                        {stage.ksis.map((k, i) => <Badge key={i} variant="info">{k}</Badge>)}
                    </div>
                </Col>
            </div>
        </Card>
    );
};

const ArchitectureTab = () => {
    const [active, setActive] = useState(null);
    const activeStage = FLOW_STAGES.find(s => s.id === active);
    return (
        <div className="space-y-6">
            <Card className="p-7">
                <SectionHeader icon={Network} title="Federal Data Flow" accent="text-sky-400"
                    desc="Complete data lifecycle per OMB A-130 classification. Select a stage to inspect controls and KSIs."
                    action={<Badge variant="info" icon={CircleDot}>OMB A-130</Badge>} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {FLOW_STAGES.map((s) => (
                        <FlowCard key={s.id} stage={s} active={active === s.id} onClick={(id) => setActive(p => p === id ? null : id)} />
                    ))}
                </div>
            </Card>
            {activeStage && <FlowDetail stage={activeStage} />}
            <Card className="p-7">
                <SectionHeader icon={Server} title="Authorization Boundary" accent="text-violet-400"
                    desc="The boundary inherits physical and lower-stack controls from AWS's FedRAMP authorization." />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Fact label="Hosting" value="AWS Commercial US-East-1" sub="Inherited FedRAMP controls" />
                    <Fact label="Tenancy" value="Multi-Tenant SaaS" sub="Logical isolation per agency" />
                    <Fact label="Encryption" value="AES-256 · TLS 1.2+" sub="KMS-managed keys" />
                </div>
            </Card>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────
// CHANGE ACTIVITY — sourced from the Ongoing Authorization Report
// ─────────────────────────────────────────────────────────────────────────
const ChangesTab = ({ oar }) => {
    const transformative = oar?.transformative_changes;
    const planned = oar?.planned_changes;
    const scnTotal = oar?.data_sources?.scn_history_entries;
    const changes = transformative?.changes || [];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="SCN Entries Tracked" value={scnTotal ?? '—'} icon={GitCommit} accent="text-white"
                    sub="Significant change notifications on record" />
                <StatCard label="Transformative Changes" value={transformative?.total_count ?? changes.length} icon={Activity} accent="text-rose-400"
                    sub="Current reporting window" />
                <StatCard label="Planned Changes" value={planned?.changes?.length ?? 0} icon={Calendar} accent="text-emerald-400"
                    sub={`Next ${planned?.window_days ?? 90}-day window`} />
            </div>

            <Card className="p-7">
                <SectionHeader icon={Activity} title="Significant Change Activity" accent="text-sky-400"
                    desc="Transformative changes from the current Ongoing Authorization Report (FRR-SCN)."
                    action={<Badge variant="success">FRR-SCN Compliant</Badge>} />
                {changes.length ? (
                    <div className="space-y-2.5">
                        {changes.map((c, i) => {
                            const tier = SCN_TIER[c.type] || SCN_TIER.adaptive;
                            return (
                                <div key={i} className={cn('flex items-start gap-3 rounded-xl p-4 border-l-2', SURFACE_2)} style={{ borderLeftColor: tier.dot }}>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2.5 flex-wrap mb-1">
                                            <span className="text-[12px] font-mono font-semibold text-white">{c.scn_id}</span>
                                            <Badge variant={tier.variant}>{tier.label}</Badge>
                                        </div>
                                        <p className="text-[13px] text-slate-300">{c.description}</p>
                                    </div>
                                    <span className="text-[12px] font-mono text-slate-500 shrink-0">{c.date}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 text-[13px] text-slate-500">No significant changes in the current reporting window.</div>
                )}
                {transformative?.note && <p className="text-[12px] text-slate-600 mt-4">{transformative.note}</p>}
            </Card>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────
// SERVICES & RESOURCES
// ─────────────────────────────────────────────────────────────────────────
const SERVICES = [
    { title: 'Course Management', desc: 'SCORM/AICC/xAPI delivery & multimedia.', features: ['Course catalog', 'Mobile player', 'Video delivery'] },
    { title: 'User Management', desc: 'SSO, RBAC, and hierarchy management.', features: ['SAML 2.0 SSO', 'MFA support', 'Role hierarchy'] },
    { title: 'Assessment Engine', desc: 'Quizzes, exams, and competency validation.', features: ['Auto-grading', 'Question banks', 'Certificates'] },
    { title: 'Compliance Tracking', desc: 'Regulatory reporting and audit trails.', features: ['Rules engine', '21 CFR Part 11', 'Audit logs'] },
    { title: 'Analytics', desc: 'Real-time dashboards and data exports.', features: ['Custom reports', 'Trend analysis', 'Scheduled exports'] },
    { title: 'Learning Record Store', desc: 'Native xAPI-compliant LRS.', features: ['Statement capture', 'Learning analytics', 'Cross-platform'] },
    { title: 'Career Development', desc: 'IDP and skills gap analysis.', features: ['Career paths', 'Skills inventory', 'IDP tracking'] },
    { title: 'Notifications', desc: 'Automated engagement engine.', features: ['Deadline alerts', 'Manager notices', 'Templates'] },
    { title: 'API Gateway', desc: 'RESTful enterprise connectivity.', features: ['REST API', 'Webhooks', 'HRIS sync'] },
];
const EXCLUDED = [
    ['On-Premise', 'Self-hosted installations.'],
    ['Private Cloud', 'Customer-specific instances.'],
    ['Custom Dev', 'Bespoke software outside core.'],
    ['Third-Party Content', 'External content libraries.'],
    ['Pro Services', 'Consulting / implementation.'],
    ['Native Mobile', 'Web-responsive only.'],
];

const ServiceCard = ({ s }) => (
    <div className={cn('rounded-2xl p-5 flex flex-col h-full transition-all hover:border-white/15 border border-white/[0.07] bg-[#0f0f12]')}>
        <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-sm font-semibold text-white">{s.title}</h4>
            <Badge variant="success">Auth</Badge>
        </div>
        <p className="text-[12px] text-slate-400 leading-relaxed mb-3">{s.desc}</p>
        <div className="space-y-1.5 mt-auto">
            {s.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-sky-500" />
                    <span className="text-[12px] text-slate-400">{f}</span>
                </div>
            ))}
        </div>
    </div>
);

const ResourcesTab = ({ cso, onDownloadPackage, onViewConfig, onDownloadConfig, onApiDocs, isAuthenticated, feedback }) => (
    <div className="space-y-6">
        <div>
            <SectionHeader icon={Layers} title="Authorized Services" accent="text-sky-400"
                desc="Capabilities within the FedRAMP authorization boundary." />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {SERVICES.map((s, i) => <ServiceCard key={i} s={s} />)}
            </div>
        </div>

        <Card className="p-7 border-rose-500/15 bg-rose-500/[0.02]">
            <SectionHeader icon={AlertTriangle} title="Services Not Included" accent="text-rose-400"
                desc="Explicitly outside the authorization boundary." />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {EXCLUDED.map(([t, d], i) => (
                    <div key={i} className={cn('rounded-xl p-4', SURFACE_2)}>
                        <div className="text-[13px] font-semibold text-rose-300">{t}</div>
                        <div className="text-[12px] text-slate-500 mt-0.5">{d}</div>
                    </div>
                ))}
            </div>
        </Card>

        <Card className="p-7">
            <SectionHeader icon={FileJson} title="Machine-Readable Artifacts" accent="text-sky-400"
                desc="OSCAL-ready authorization data and documentation." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button onClick={onDownloadPackage}
                    className="flex items-center justify-between gap-3 rounded-2xl p-5 bg-sky-600 hover:bg-sky-500 text-white transition-all">
                    <div className="text-left">
                        <div className="text-sm font-semibold flex items-center gap-2">
                            {isAuthenticated ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />} Authorization Package
                        </div>
                        <div className="text-[12px] text-sky-100/80 mt-0.5">Full OSCAL artifact bundle</div>
                    </div>
                    <ArrowRight className="w-4 h-4" />
                </button>
                <div className={cn('rounded-2xl p-5 flex items-center justify-between gap-3', SURFACE_2)}>
                    <div>
                        <div className="text-sm font-semibold text-white">Secure Configuration Guide</div>
                        <div className="text-[12px] text-slate-500 mt-0.5">Recommended hardening settings</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button onClick={onViewConfig} className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-[12px] font-semibold text-slate-300 hover:text-white">View</button>
                        <button onClick={onDownloadConfig} aria-label="Download secure configuration" className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white"><Download className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <button onClick={onApiDocs} className={cn('rounded-2xl p-5 text-left hover:border-white/15 transition-all', SURFACE_2)}>
                    <Globe className="w-4 h-4 text-sky-400 mb-2" />
                    <div className="text-sm font-semibold text-white">API Documentation</div>
                    <div className="text-[12px] text-slate-500 mt-0.5">REST · OAuth 2.0</div>
                </button>
                <a href={`${BASE_PATH}cso_public_info.json`} target="_blank" rel="noreferrer" className={cn('rounded-2xl p-5 hover:border-white/15 transition-all', SURFACE_2)}>
                    <FileJson className="w-4 h-4 text-sky-400 mb-2" />
                    <div className="text-sm font-semibold text-white">CSO Public Metadata</div>
                    <div className="text-[12px] text-slate-500 mt-0.5">Machine-readable JSON</div>
                </a>
                <a href={cso?.marketplace_url || '#'} target="_blank" rel="noreferrer" className={cn('rounded-2xl p-5 hover:border-white/15 transition-all', SURFACE_2)}>
                    <Landmark className="w-4 h-4 text-sky-400 mb-2" />
                    <div className="text-sm font-semibold text-white">FedRAMP Marketplace</div>
                    <div className="text-[12px] text-slate-500 mt-0.5">{cso?.package_id || 'Listing'}</div>
                </a>
            </div>
        </Card>

        <FeedbackBlock entries={feedback} cso={cso} />
    </div>
);

// ───────── Feedback (FRR-CCM-04/05) ─────────
const FeedbackBlock = memo(({ entries, cso }) => {
    const [question, setQuestion] = useState('');
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const fedrampEmail = cso?.contacts?.fedramp || 'fedramp_20x@meridianks.com';

    const submit = (e) => {
        e.preventDefault();
        if (!question.trim()) return;
        const subject = encodeURIComponent('FedRAMP Trust Center Feedback');
        const body = encodeURIComponent(`Question/Feedback:\n${question}\n\nSubmitter Email: ${email || 'Anonymous'}`);
        window.open(`mailto:${fedrampEmail}?subject=${subject}&body=${body}`, '_self');
        setSubmitted(true); setQuestion(''); setEmail('');
        setTimeout(() => setSubmitted(false), 5000);
    };

    return (
        <Card className="p-7">
            <SectionHeader icon={MessageSquare} title="Feedback & Questions" accent="text-indigo-400"
                desc="Asynchronous feedback mechanism (FRR-CCM-04 / CCM-05)." />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
                <form onSubmit={submit} className="space-y-3">
                    <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={3} required
                        placeholder="e.g., How is multi-AZ resilience measured for load balancers?"
                        className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@agency.gov (optional)"
                        className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50" />
                    <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-[13px] transition-all">
                        <Send className="w-4 h-4" /> Submit Feedback
                    </button>
                    {submitted && (
                        <div className="flex items-center gap-2 text-emerald-300 text-[12px] bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5">
                            <CheckCircle2 className="w-4 h-4" /> Your email client should open with the message pre-filled.
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-[12px] text-slate-500">
                        <Mail className="w-3.5 h-3.5" /> Direct: <a href={`mailto:${fedrampEmail}`} className="text-sky-400 hover:text-sky-300">{fedrampEmail}</a>
                    </div>
                </form>
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <h4 className="text-sm font-semibold text-white">Feedback Summary</h4>
                        <Badge variant="success">CCM-05</Badge>
                    </div>
                    {entries?.length ? (
                        <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                            {entries.map((e, i) => (
                                <div key={i} className={cn('rounded-xl p-4', SURFACE_2)}>
                                    <p className="text-[13px] text-white font-medium leading-relaxed">{e.question}</p>
                                    <p className="text-[12px] text-slate-400 leading-relaxed mt-2 pl-3 border-l-2 border-indigo-500/30">{e.answer}</p>
                                    {e.date && <div className="text-[11px] text-slate-600 mt-2 text-right font-mono">{e.date}</div>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={cn('rounded-xl p-8 text-center', SURFACE_2)}>
                            <MessageSquare className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                            <p className="text-[13px] text-slate-500">No feedback entries yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
});

// ─────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────
export const TrustCenterView = () => {
    const { isAuthenticated } = useAuth();
    const { openModal } = useModal();
    const { status } = useSystemStatus();

    const [cso, setCso] = useState(null);
    const [schedule, setSchedule] = useState(null);
    const [meeting, setMeeting] = useState(null);
    const [oar, setOar] = useState(null);
    const [vdr, setVdr] = useState(null);
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const rootRef = useRef(null);

    const [activeTab, setActiveTab] = useState(() => {
        const seg = getRouteSegments();
        return seg[0] === 'trust' && TAB_IDS.has(seg[1]) ? seg[1] : 'overview';
    });

    const handleTabChange = useCallback((id) => {
        setActiveTab(id);
        setRoute(['trust', id]);
        rootRef.current?.closest('main')?.scrollTo({ top: 0 });
    }, []);

    useEffect(() => {
        const sync = () => {
            const seg = getRouteSegments();
            if (seg[0] === 'trust' && TAB_IDS.has(seg[1])) setActiveTab(seg[1]);
        };
        return onRouteChange(sync);
    }, []);

    useEffect(() => {
        const ts = Date.now();
        const grab = async (path) => { try { const r = await fetch(`${BASE_PATH}${path}?t=${ts}`); return r.ok ? r.json() : null; } catch { return null; } };
        (async () => {
            const [csoD, schedD, meetD, oarD, vdrD] = await Promise.all([
                grab('cso_public_info.json'),
                grab('next_report_date.json'),
                grab('quarterly_meetings.json'),
                grab('reports/samples/oar-report.json'),
                grab('vdr_public_metrics.json'),
            ]);
            if (csoD) setCso(csoD);
            if (schedD) setSchedule(schedD);
            if (meetD) setMeeting(meetD);
            if (oarD) { setOar(oarD); if (oarD.feedback_summary?.entries) setFeedback(oarD.feedback_summary.entries); }
            if (vdrD) setVdr(vdrD);
            setLoading(false);
        })();
    }, []);

    const handleAction = (name) => {
        if (!isAuthenticated) {
            openModal('accessRequired', { featureName: name, benefits: ['Download machine-readable artifacts', 'View VDR data', 'Automated reviews'] });
            return false;
        }
        return true;
    };

    const API_DOCS_URL = 'https://meridian-knowledge-solutions.github.io/fedramp-20x-public/documentation/api/';
    const triggerDownload = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };
    const viewSecureConfig = async () => {
        if (!handleAction('View Secure Configuration')) return;
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONFIG_PUBLIC}`);
            openModal('markdown', { title: 'Secure Configuration', markdown: await res.text() });
        } catch { alert('Load failed.'); }
    };
    const downloadSecureConfig = async () => {
        if (!handleAction('Download Secure Configuration')) return;
        try {
            const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONFIG_PUBLIC}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            triggerDownload(new Blob([await res.text()], { type: 'text/markdown' }), 'secure-configuration.md');
        } catch (e) { alert(`Download failed: ${e.message}`); }
    };
    const handleDownloadPackage = async () => {
        if (!handleAction('Download Authorization Package')) return;
        try {
            const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
            if (!token) { alert('Session expired.'); return; }
            const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PACKAGE_DOWNLOAD}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Access Denied');
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch (e) { alert(`Download failed: ${e.message}`); }
    };
    const openApiDocs = () => window.open(API_DOCS_URL, '_blank');

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0a0a0c]">
                <div className="text-center animate-pulse">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-sky-500/50" />
                    <div className="text-slate-500 font-mono text-sm">Loading authorization context…</div>
                </div>
            </div>
        );
    }

    return (
        <div ref={rootRef} className="-m-6 md:-m-8 min-h-screen bg-[#0a0a0c] text-slate-300 font-sans selection:bg-sky-500/30">
            <div className="px-5 md:px-8 py-8 space-y-6 max-w-7xl mx-auto">
                <Hero cso={cso} status={status} lastRefresh={schedule?.last_data_refresh} />
                <TabBar active={activeTab} onChange={handleTabChange} />

                {activeTab === 'overview' && <OverviewTab cso={cso} oar={oar} vdr={vdr} status={status} schedule={schedule} meeting={meeting} />}
                {activeTab === 'compliance' && <CustomerResponsibilityMatrix />}
                {activeTab === 'architecture' && <ArchitectureTab />}
                {activeTab === 'changes' && <ChangesTab oar={oar} />}
                {activeTab === 'resources' && (
                    <ResourcesTab cso={cso} feedback={feedback} isAuthenticated={isAuthenticated}
                        onDownloadPackage={handleDownloadPackage} onViewConfig={viewSecureConfig}
                        onDownloadConfig={downloadSecureConfig} onApiDocs={openApiDocs} />
                )}

                <div className="pt-2 pb-8 text-center text-[11px] text-slate-600">
                    {cso?.cso_name || 'Meridian LMS'} · {cso?.package_id} · FedRAMP {cso?.authorization_type || '20x'} {cso?.impact_level || 'Moderate'} · Continuously monitored authorization
                </div>
            </div>
        </div>
    );
};

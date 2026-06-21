import React, { useState, useEffect, memo, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useModal } from '../../contexts/ModalContext';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import { API_CONFIG, QUARTERLY_REGISTRATION_URL } from '../../config/api';
import { BASE_PATH } from '../../config/theme';
import { getRouteSegments, setRoute, onRouteChange } from '../../utils/hashRoute';
import {
    Shield, ShieldCheck, Network, Activity, Layers, Download, ExternalLink, Lock,
    Video, Calendar, Clock, Mail, Send, MessageSquare, ArrowUpRight, FileJson,
    CheckCircle2, Gauge, TrendingUp, AlertTriangle, Users, Globe, Database, Cpu,
    Server, Eye, User, ChevronRight, BadgeCheck,
} from 'lucide-react';
import {
    cn, Card, Badge, Eyebrow, GradientText, IconChip, Button, SectionHeading,
    StatCard, Stat, Sparkline, Donut, HeroMesh, SHADOW_SM,
} from './saas';
import ComplianceModern from './ComplianceModern';

// ============================================================================
// TRUST CENTER — modern enterprise SaaS edition
// ============================================================================

const TABS = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
    { id: 'architecture', label: 'Architecture', icon: Network },
    { id: 'changes', label: 'Change Activity', icon: Activity },
    { id: 'resources', label: 'Services & Resources', icon: Layers },
];
const TAB_IDS = new Set(TABS.map(t => t.id));

const FLOW_STAGES = [
    { id: 'entry', icon: User, gradient: 'emerald', phase: 'Collected', title: 'Federal User Entry', desc: 'Federal users reach the Application Load Balancer over HTTPS/TLS 1.2+.', security: ['TLS 1.2+', 'PIV/CAC'], data: ['Access Logs', 'Source IP', 'Session ID'], ksis: ['KSI-IAM-01', 'KSI-IAM-02', 'KSI-SVC-02'] },
    { id: 'auth', icon: ShieldCheck, gradient: 'indigo', phase: 'Collected', title: 'Identity & Auth', desc: 'Okta Federal Gov SAML 2.0 SSO with PIV/CAC validation and MFA.', security: ['SAML 2.0', 'FIPS 140-2', 'MFA'], data: ['SAML Assertions', 'UPN Data', 'Group Membership'], ksis: ['KSI-IAM-01', 'KSI-IAM-03', 'KSI-SVC-03'] },
    { id: 'processing', icon: Cpu, gradient: 'sky', phase: 'Processed', title: 'Application Processing', desc: 'LMS web tier (ASP.NET on EC2) processes training, assessments, and content.', security: ['WAF', 'HTTPS', 'RBAC'], data: ['Training Records', 'Assessments', 'Completions'], ksis: ['KSI-SVC-01', 'KSI-SVC-02', 'KSI-MLA-01'] },
    { id: 'storage', icon: Database, gradient: 'violet', phase: 'Maintained', title: 'Encrypted Storage', desc: 'RDS, S3, and FSx with AES-256 at rest and KMS-managed keys.', security: ['AES-256', 'KMS', 'Backups'], data: ['User Records', 'Learning Data', 'Audit Logs'], ksis: ['KSI-CNA-01', 'KSI-CNA-04', 'KSI-INR-01'] },
    { id: 'dissemination', icon: Send, gradient: 'amber', phase: 'Disseminated', title: 'Third-Party Dissemination', desc: 'Content providers receive scoped PII via SAML SSO and xAPI/SCORM.', security: ['xAPI', 'SCORM', 'SAML SSO'], data: ['Employee Names', 'Email', 'Progress'], ksis: ['KSI-TPR-01', 'KSI-TPR-02', 'KSI-PIY-02'] },
    { id: 'monitoring', icon: Eye, gradient: 'rose', phase: 'Maintained', title: 'Security Monitoring', desc: 'CloudWatch, CloudTrail, GuardDuty, and Config provide continuous monitoring.', security: ['24/7', 'SIEM', 'Alerts'], data: ['CloudTrail Logs', 'Flow Logs', 'Config'], ksis: ['KSI-MLA-01', 'KSI-MLA-02', 'KSI-CNA-07'] },
];

const SCN_TONE = { transformative: 'rose', adaptive: 'sky', routine_recurring: 'green', critical: 'rose', impact_categorization: 'amber' };
const SCN_DOT = { transformative: '#f43f5e', adaptive: '#0ea5e9', routine_recurring: '#10b981', critical: '#f43f5e', impact_categorization: '#f59e0b' };

const SERVICES = [
    { icon: Layers, t: 'Course Management', d: 'SCORM / AICC / xAPI delivery & multimedia.' },
    { icon: Users, t: 'User Management', d: 'SSO, RBAC, and hierarchy management.' },
    { icon: CheckCircle2, t: 'Assessment Engine', d: 'Quizzes, exams, and competency validation.' },
    { icon: ShieldCheck, t: 'Compliance Tracking', d: 'Regulatory reporting and audit trails.' },
    { icon: Activity, t: 'Analytics', d: 'Real-time dashboards and data exports.' },
    { icon: Database, t: 'Learning Record Store', d: 'Native xAPI-compliant LRS.' },
    { icon: TrendingUp, t: 'Career Development', d: 'IDP and skills-gap analysis.' },
    { icon: MessageSquare, t: 'Notifications', d: 'Automated engagement engine.' },
    { icon: Globe, t: 'API Gateway', d: 'RESTful enterprise connectivity.' },
];
const EXCLUDED = ['On-premise / self-hosted installations', 'Private-cloud customer-specific instances', 'Custom development outside the core platform', 'Third-party content libraries', 'Professional / consulting services', 'Native mobile applications'];

const GRAD = ['emerald', 'indigo', 'sky', 'violet', 'amber', 'rose'];

// ─────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────
const Hero = ({ cso, oar, vdr, status }) => {
    const operational = (status?.status || 'operational') === 'operational';
    const rate = oar?.executive_summary?.compliance_rate;
    return (
        <div className={cn('relative overflow-hidden rounded-3xl border border-gray-200/70 bg-white', SHADOW_SM)}>
            <HeroMesh />
            <div className="relative px-6 md:px-10 py-9 md:py-11 grid lg:grid-cols-[1fr_auto] gap-10 items-center">
                <div>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center p-2 shadow-sm">
                            <img src={`${BASE_PATH}meridian-favicon.png`} alt="Meridian" className="w-full h-full object-contain" />
                        </div>
                        <Eyebrow>Trust Center</Eyebrow>
                    </div>
                    <h1 className="text-[34px] md:text-[44px] font-bold text-gray-900 tracking-tight leading-[1.05]">
                        {cso?.cso_name || 'Meridian LMS'} <GradientText>security &amp; compliance</GradientText>
                    </h1>
                    <p className="mt-4 text-[16px] text-gray-500 max-w-xl leading-relaxed">
                        {cso?.provider_name || 'Meridian Knowledge Solutions'} maintains a continuously-monitored {cso?.authorization_type || 'FedRAMP 20x'} {cso?.impact_level || 'Moderate'} authorization. Live posture, evidence, and artifacts below.
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5 mt-6">
                        <Badge variant="green" icon={BadgeCheck}>Authorized</Badge>
                        <Badge variant="brand">{cso?.authorization_type || 'FedRAMP 20x'}</Badge>
                        <Badge variant="gray">{cso?.impact_level || 'Moderate'} Impact</Badge>
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-emerald-600">
                            <span className="relative flex h-2 w-2"><span className={cn('absolute inline-flex h-full w-full rounded-full opacity-70', operational ? 'bg-emerald-400 animate-ping' : 'bg-amber-400')} /><span className={cn('relative inline-flex rounded-full h-2 w-2', operational ? 'bg-emerald-500' : 'bg-amber-500')} /></span>
                            {operational ? 'All systems operational' : 'Degraded'}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-7">
                        {cso?.marketplace_url && <Button variant="primary" iconRight={ArrowUpRight} onClick={() => window.open(cso.marketplace_url, '_blank')}>FedRAMP Marketplace</Button>}
                        <Button variant="secondary" icon={FileJson} onClick={() => window.open(`${BASE_PATH}cso_public_info.json`, '_blank')}>Public metadata</Button>
                    </div>
                </div>

                {/* Live posture glass panel */}
                <div className={cn('hidden lg:flex flex-col items-center gap-5 rounded-3xl border border-white/70 bg-white/70 backdrop-blur-xl p-7 w-[300px]', SHADOW_SM)}>
                    <Donut value={rate ? Math.round(rate) : 0} />
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                            <div className="text-[20px] font-bold text-gray-900">{oar?.executive_summary ? `${oar.executive_summary.passed_ksis}/${oar.executive_summary.total_ksis}` : '—'}</div>
                            <div className="text-[11px] text-gray-400 font-medium mt-0.5">KSIs passing</div>
                        </div>
                        <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                            <div className="text-[20px] font-bold text-gray-900">{vdr?.vdr_acceptance?.active ?? '—'}</div>
                            <div className="text-[11px] text-gray-400 font-medium mt-0.5">Open vulns</div>
                        </div>
                    </div>
                    <div className="text-[11px] font-mono text-gray-400">{cso?.package_id}</div>
                </div>
            </div>
        </div>
    );
};

// ───────── Tab bar ─────────
const TabBar = ({ active, onChange }) => (
    <div className="sticky top-0 z-30 py-3 -mx-1 px-1 bg-[#f7f8fc]/85 backdrop-blur-md">
        <div className="inline-flex gap-1 p-1 bg-white border border-gray-200/70 rounded-2xl overflow-x-auto no-scrollbar max-w-full shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
            {TABS.map(t => {
                const Icon = t.icon; const on = active === t.id;
                return (
                    <button key={t.id} onClick={() => onChange(t.id)}
                        className={cn('inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-semibold whitespace-nowrap transition-all shrink-0',
                            on ? 'text-white bg-gradient-to-b from-indigo-500 to-indigo-600 shadow-[0_1px_2px_rgba(16,24,40,0.2)]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50')}>
                        <Icon className="w-4 h-4" />{t.label}
                    </button>
                );
            })}
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────
// OVERVIEW
// ─────────────────────────────────────────────────────────────────────────
const Overview = ({ cso, oar, vdr, status, schedule, meeting }) => {
    const ex = oar?.executive_summary;
    const trend = oar?.compliance_trend?.data_points?.map(p => p.compliance_rate) || [];
    const improving = oar?.compliance_trend?.trend_direction === 'improving';
    const uptime = status?.uptime_percent ? `${parseFloat(status.uptime_percent).toFixed(2)}%` : '—';
    const registrationUrl = QUARTERLY_REGISTRATION_URL || meeting?.registrationUrl;
    const dateLabel = meeting?.nextDate ? new Date(meeting.nextDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'To be announced';

    return (
        <div className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard icon={Gauge} gradient="indigo" value={ex ? `${ex.compliance_rate}%` : '—'} label="KSI Compliance"
                    sub={ex ? `${ex.passed_ksis} of ${ex.total_ksis} passing` : undefined}
                    badge={improving && <Badge variant="green" icon={TrendingUp}>Improving</Badge>}
                    footer={<Sparkline data={trend} />} />
                <StatCard icon={AlertTriangle} gradient="amber" value={ex?.active_gaps ?? '—'} label="Active Gaps"
                    sub={`${oar?.data_sources?.ksi_history_entries?.toLocaleString() || '—'} validation runs`} />
                <StatCard icon={Shield} gradient="violet" value={vdr?.vdr_acceptance?.active ?? '—'} label="Open Vulnerabilities"
                    sub={vdr ? `${vdr.risk?.critical ?? 0} critical · ${vdr.vdr_acceptance?.accepted ?? 0} accepted` : undefined}
                    badge={vdr?.posture?.rating && <Badge variant="green">{vdr.posture.rating}</Badge>} />
                <StatCard icon={Activity} gradient="emerald" value={uptime} label="Platform Uptime"
                    sub={status?.avg_latency ? `${status.avg_latency} latency` : 'Continuously monitored'} />
            </div>

            {/* Service profile */}
            <Card className="p-7">
                <SectionHeading eyebrow="Service Profile" title="What we are, and how it's deployed" />
                <p className="text-[15px] text-gray-600 leading-relaxed max-w-3xl">
                    {cso?.service_description || 'Enterprise SaaS platform for workforce training, compliance tracking, and professional development.'}
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                    <Stat label="Deployment" value={cso?.deployment_model || 'Multi-Tenant Public Cloud'} />
                    <Stat label="Cloud" value={cso?.cloud_provider || 'AWS Commercial (US-East-1)'} />
                    <Stat label="UEI" value={cso?.uei || '—'} mono sub="SAM.gov" />
                    <Stat label="Category" value={cso?.business_category || 'Learning Management'} />
                    <Stat label="Access" value={cso?.access_methods?.primary || 'HTTPS (Port 443)'} />
                    <Stat label="Authentication" value={cso?.access_methods?.authentication || 'SAML 2.0 SSO + MFA'} />
                    <Stat label="API" value={cso?.access_methods?.api || 'REST · OAuth 2.0'} />
                    <Stat label="Authorization" value={cso?.authorization_type || 'FedRAMP 20x'} sub={`${cso?.impact_level || 'Moderate'} baseline`} />
                </div>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Continuous monitoring */}
                <Card className="p-7">
                    <SectionHeading eyebrow="Continuous Monitoring" title="Reporting cadence" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Stat label="Next Report" value={schedule?.next_ongoing_report || 'TBD'} mono />
                        <Stat label="Next Review" value={schedule?.next_quarterly_review || 'TBD'} mono />
                        <Stat label="Last Refresh" value={schedule?.last_data_refresh || 'TBD'} mono />
                    </div>
                    {meeting && (
                        <div className="mt-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 p-4 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-900"><Video className="w-4 h-4 text-indigo-600" />{meeting.meetingTitle || 'Quarterly Review'}</div>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-[12.5px] text-gray-500">
                                    <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{dateLabel}</span>
                                    {meeting.time && <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{meeting.time}</span>}
                                </div>
                            </div>
                            {registrationUrl && <Button variant="primary" className="shrink-0" onClick={() => window.open(registrationUrl, '_blank', 'noopener')}>Register</Button>}
                        </div>
                    )}
                </Card>

                {/* Responsibilities */}
                <Card className="p-7">
                    <SectionHeading eyebrow="Shared Responsibility" title="What your agency owns" />
                    <div className="space-y-2">
                        {(cso?.customer_responsibilities || []).map((r, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /></div>
                                <span className="text-[13.5px] text-gray-600 leading-relaxed">{r}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────
// ARCHITECTURE
// ─────────────────────────────────────────────────────────────────────────
const Architecture = () => {
    const [active, setActive] = useState(null);
    const stage = FLOW_STAGES.find(s => s.id === active);
    return (
        <div className="space-y-6">
            <Card className="p-7">
                <SectionHeading eyebrow="Architecture" title="Federal data flow"
                    subtitle="Complete data lifecycle per OMB A-130. Select a stage to inspect its controls and KSIs."
                    action={<Badge variant="brand">OMB A-130</Badge>} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {FLOW_STAGES.map(s => {
                        const on = active === s.id;
                        return (
                            <button key={s.id} onClick={() => setActive(on ? null : s.id)}
                                className={cn('text-left rounded-2xl border p-4 transition-all', on ? 'border-indigo-300 bg-indigo-50/50 ' + SHADOW_SM : 'border-gray-200/70 bg-white hover:border-gray-300 hover:-translate-y-0.5 ' + SHADOW_SM)}>
                                <div className="flex items-center justify-between mb-3">
                                    <IconChip icon={s.icon} gradient={s.gradient} />
                                    <Badge variant="gray">{s.phase}</Badge>
                                </div>
                                <div className="text-[14.5px] font-bold text-gray-900">{s.title}</div>
                                <p className="text-[12.5px] text-gray-500 mt-1 leading-snug">{s.desc}</p>
                            </button>
                        );
                    })}
                </div>
            </Card>
            {stage && (
                <Card className="p-7">
                    <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
                        <IconChip icon={stage.icon} gradient={stage.gradient} size="w-12 h-12" iconCls="w-6 h-6" />
                        <div><h3 className="text-[18px] font-bold text-gray-900">{stage.title}</h3><p className="text-[13.5px] text-gray-500">{stage.desc}</p></div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-5">
                        <div><div className="text-[12px] font-semibold uppercase tracking-wide text-gray-400 mb-2.5">Data Elements</div><div className="space-y-1.5">{stage.data.map(d => <div key={d} className="flex items-center gap-2 text-[13px] text-gray-700 font-mono"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />{d}</div>)}</div></div>
                        <div><div className="text-[12px] font-semibold uppercase tracking-wide text-gray-400 mb-2.5">Controls</div><div className="flex flex-wrap gap-1.5">{stage.security.map(x => <Badge key={x} variant="gray">{x}</Badge>)}</div></div>
                        <div><div className="text-[12px] font-semibold uppercase tracking-wide text-gray-400 mb-2.5">FedRAMP 20x KSIs</div><div className="flex flex-wrap gap-1.5">{stage.ksis.map(k => <Badge key={k} variant="brand">{k}</Badge>)}</div></div>
                    </div>
                </Card>
            )}
            <Card className="p-7">
                <SectionHeading eyebrow="Authorization Boundary" title="Hosting & isolation" />
                <div className="grid sm:grid-cols-3 gap-3">
                    <Stat label="Hosting" value="AWS Commercial US-East-1" sub="Inherited FedRAMP controls" />
                    <Stat label="Tenancy" value="Multi-Tenant SaaS" sub="Logical isolation per agency" />
                    <Stat label="Encryption" value="AES-256 · TLS 1.2+" sub="KMS-managed keys" />
                </div>
            </Card>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────
// CHANGES
// ─────────────────────────────────────────────────────────────────────────
const Changes = ({ oar }) => {
    const t = oar?.transformative_changes; const changes = t?.changes || [];
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={Activity} gradient="sky" value={oar?.data_sources?.scn_history_entries ?? '—'} label="SCN Entries Tracked" sub="Significant change notifications" />
                <StatCard icon={TrendingUp} gradient="rose" value={t?.total_count ?? changes.length} label="Transformative Changes" sub="Current reporting window" />
                <StatCard icon={Calendar} gradient="emerald" value={oar?.planned_changes?.changes?.length ?? 0} label="Planned Changes" sub="Next 90-day window" />
            </div>
            <Card className="p-7">
                <SectionHeading eyebrow="Change Activity" title="Significant changes"
                    subtitle="From the current Ongoing Authorization Report (FRR-SCN)." action={<Badge variant="green" icon={CheckCircle2}>FRR-SCN Compliant</Badge>} />
                {changes.length ? (
                    <div className="relative pl-6">
                        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />
                        <div className="space-y-4">
                            {changes.map((c, i) => (
                                <div key={i} className="relative">
                                    <div className="absolute -left-[22px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white" style={{ background: SCN_DOT[c.type] || '#0ea5e9', boxShadow: '0 0 0 3px rgba(0,0,0,0.03)' }} />
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant={SCN_TONE[c.type] || 'sky'}>{(c.type || '').replace('_', ' ')}</Badge>
                                                <span className="text-[14px] text-gray-900 font-medium">{c.description}</span>
                                            </div>
                                            <span className="text-[12px] font-mono text-gray-400 mt-1 inline-block">{c.scn_id}</span>
                                        </div>
                                        <span className="text-[12.5px] font-mono text-gray-400 shrink-0">{c.date}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : <div className="text-center py-10 text-[14px] text-gray-400">No significant changes in the current window.</div>}
                {t?.note && <p className="text-[12px] text-gray-400 mt-5">{t.note}</p>}
            </Card>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────
// RESOURCES
// ─────────────────────────────────────────────────────────────────────────
const Resources = ({ cso, isAuthenticated, onDownloadPackage, onViewConfig, onDownloadConfig, onApiDocs, feedback }) => (
    <div className="space-y-8">
        <div>
            <SectionHeading eyebrow="Capabilities" title="Authorized services" subtitle="Within the FedRAMP authorization boundary." />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SERVICES.map((s, i) => (
                    <Card key={i} className="p-5" hover>
                        <div className="flex items-center gap-3">
                            <IconChip icon={s.icon} gradient={GRAD[i % GRAD.length]} />
                            <div className="text-[15px] font-bold text-gray-900">{s.t}</div>
                        </div>
                        <p className="text-[13px] text-gray-500 mt-3 leading-relaxed">{s.d}</p>
                    </Card>
                ))}
            </div>
        </div>

        <Card className="p-7 bg-rose-50/40 border-rose-100">
            <SectionHeading eyebrow="Out of scope" title="Services not included" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2.5">
                {EXCLUDED.map((e, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-[13.5px] text-gray-600"><span className="w-4 h-4 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-[10px] font-bold shrink-0">✕</span>{e}</div>
                ))}
            </div>
        </Card>

        <Card className="p-7">
            <SectionHeading eyebrow="Artifacts" title="Machine-readable evidence" subtitle="OSCAL-ready authorization data and documentation." />
            <div className="grid sm:grid-cols-2 gap-3">
                <button onClick={onDownloadPackage} className="group flex items-center justify-between gap-3 rounded-2xl p-5 text-white bg-gradient-to-br from-indigo-500 to-violet-600 transition-all hover:shadow-lg">
                    <span className="text-left">
                        <span className="flex items-center gap-2 text-[15px] font-bold">{isAuthenticated ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />}Authorization Package</span>
                        <span className="block text-[12.5px] text-indigo-100 mt-0.5">Full OSCAL artifact bundle</span>
                    </span>
                    <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
                <div className="flex items-center justify-between gap-3 rounded-2xl p-5 bg-gray-50 border border-gray-100">
                    <div><div className="text-[15px] font-bold text-gray-900">Secure Configuration</div><div className="text-[12.5px] text-gray-500 mt-0.5">Recommended hardening guide</div></div>
                    <div className="flex gap-2 shrink-0">
                        <Button variant="secondary" onClick={onViewConfig} className="!px-3 !py-2 !text-[13px]">View</Button>
                        <Button variant="secondary" onClick={onDownloadConfig} className="!px-3 !py-2" aria-label="Download"><Download className="w-4 h-4" /></Button>
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-[13.5px]">
                <button onClick={onApiDocs} className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold hover:underline">API Documentation <ArrowUpRight className="w-3.5 h-3.5" /></button>
                <a href={cso?.marketplace_url || '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold hover:underline">FedRAMP Marketplace <ArrowUpRight className="w-3.5 h-3.5" /></a>
                <a href={`${BASE_PATH}cso_public_info.json`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-gray-500 font-semibold hover:text-gray-800"><FileJson className="w-3.5 h-3.5" /> CSO Metadata JSON</a>
            </div>
        </Card>

        <Feedback entries={feedback} cso={cso} />
    </div>
);

const Feedback = memo(({ entries, cso }) => {
    const [q, setQ] = useState(''); const [email, setEmail] = useState(''); const [sent, setSent] = useState(false);
    const to = cso?.contacts?.fedramp || 'fedramp_20x@meridianks.com';
    const submit = (e) => {
        e.preventDefault(); if (!q.trim()) return;
        window.open(`mailto:${to}?subject=${encodeURIComponent('FedRAMP Trust Center Feedback')}&body=${encodeURIComponent(`Question/Feedback:\n${q}\n\nSubmitter: ${email || 'Anonymous'}`)}`, '_self');
        setSent(true); setQ(''); setEmail(''); setTimeout(() => setSent(false), 5000);
    };
    return (
        <Card className="p-7">
            <SectionHeading eyebrow="FRR-CCM-04 / 05" title="Feedback & questions" subtitle="Responses are summarized anonymously in the Ongoing Authorization Report." />
            <div className="grid lg:grid-cols-2 gap-8">
                <form onSubmit={submit} className="space-y-3">
                    <textarea value={q} onChange={e => setQ(e.target.value)} rows={3} required placeholder="e.g., How is multi-AZ resilience measured?"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white resize-none transition" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@agency.gov (optional)"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition" />
                    <Button variant="primary" icon={Send} className="w-full">Submit feedback</Button>
                    {sent && <div className="text-[12.5px] text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Your email client should open with the message pre-filled.</div>}
                    <div className="flex items-center gap-1.5 text-[12.5px] text-gray-500"><Mail className="w-3.5 h-3.5" /> Direct: <a href={`mailto:${to}`} className="text-indigo-600 hover:underline">{to}</a></div>
                </form>
                <div>
                    <div className="flex items-center gap-2 mb-3"><span className="text-[14px] font-bold text-gray-900">Feedback summary</span><Badge variant="green">CCM-05</Badge></div>
                    {entries?.length ? (
                        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                            {entries.map((e, i) => (
                                <div key={i} className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                                    <p className="text-[13.5px] font-semibold text-gray-900 leading-snug">{e.question}</p>
                                    <p className="text-[12.5px] text-gray-500 leading-relaxed mt-2 pl-3 border-l-2 border-indigo-200">{e.answer}</p>
                                    {e.date && <div className="text-[11px] text-gray-400 mt-2 text-right font-mono">{e.date}</div>}
                                </div>
                            ))}
                        </div>
                    ) : <div className="rounded-xl bg-gray-50 border border-gray-100 p-8 text-center text-[13.5px] text-gray-400"><MessageSquare className="w-6 h-6 mx-auto mb-2 text-gray-300" />No feedback entries yet.</div>}
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
    const onTab = useCallback((id) => { setActiveTab(id); setRoute(['trust', id]); rootRef.current?.closest('main')?.scrollTo({ top: 0 }); }, []);
    useEffect(() => onRouteChange(() => { const s = getRouteSegments(); if (s[0] === 'trust' && TAB_IDS.has(s[1])) setActiveTab(s[1]); }), []);

    useEffect(() => {
        const ts = Date.now();
        const grab = async (p) => { try { const r = await fetch(`${BASE_PATH}${p}?t=${ts}`); return r.ok ? r.json() : null; } catch { return null; } };
        (async () => {
            const [a, b, c, d, e] = await Promise.all([grab('cso_public_info.json'), grab('next_report_date.json'), grab('quarterly_meetings.json'), grab('reports/samples/oar-report.json'), grab('vdr_public_metrics.json')]);
            if (a) setCso(a); if (b) setSchedule(b); if (c) setMeeting(c);
            if (d) { setOar(d); if (d.feedback_summary?.entries) setFeedback(d.feedback_summary.entries); }
            if (e) setVdr(e); setLoading(false);
        })();
    }, []);

    const guard = (name) => { if (!isAuthenticated) { openModal('accessRequired', { featureName: name, benefits: ['Download machine-readable artifacts', 'View VDR data', 'Automated reviews'] }); return false; } return true; };
    const dl = (blob, filename) => { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u); };
    const viewConfig = async () => { if (!guard('View Secure Configuration')) return; try { const r = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONFIG_PUBLIC}`); openModal('markdown', { title: 'Secure Configuration', markdown: await r.text() }); } catch { alert('Load failed.'); } };
    const downloadConfig = async () => { if (!guard('Download Secure Configuration')) return; try { const r = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONFIG_PUBLIC}`); if (!r.ok) throw new Error(`HTTP ${r.status}`); dl(new Blob([await r.text()], { type: 'text/markdown' }), 'secure-configuration.md'); } catch (e) { alert(`Download failed: ${e.message}`); } };
    const downloadPackage = async () => { if (!guard('Download Authorization Package')) return; try { const tok = localStorage.getItem(API_CONFIG.TOKEN_KEY); if (!tok) { alert('Session expired.'); return; } const r = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PACKAGE_DOWNLOAD}`, { headers: { Authorization: `Bearer ${tok}` } }); if (!r.ok) throw new Error('Access Denied'); const j = await r.json(); if (j.url) window.location.href = j.url; } catch (e) { alert(`Download failed: ${e.message}`); } };
    const apiDocs = () => window.open('https://meridian-knowledge-solutions.github.io/fedramp-20x-public/documentation/api/', '_blank');

    if (loading) {
        return (
            <div className="-m-6 md:-m-8 min-h-screen bg-[#f7f8fc] flex items-center justify-center">
                <div className="text-center"><div className="w-10 h-10 mx-auto mb-4 rounded-full border-[3px] border-indigo-200 border-t-indigo-600 animate-spin" /><div className="text-gray-400 text-[14px] font-medium">Loading Trust Center…</div></div>
            </div>
        );
    }

    return (
        <div ref={rootRef} className="-m-6 md:-m-8 min-h-screen bg-[#f7f8fc] text-gray-700 antialiased">
            <div className="max-w-7xl mx-auto px-5 md:px-8 py-8 space-y-6">
                <Hero cso={cso} oar={oar} vdr={vdr} status={status} />
                <TabBar active={activeTab} onChange={onTab} />
                {activeTab === 'overview' && <Overview cso={cso} oar={oar} vdr={vdr} status={status} schedule={schedule} meeting={meeting} />}
                {activeTab === 'compliance' && <ComplianceModern />}
                {activeTab === 'architecture' && <Architecture />}
                {activeTab === 'changes' && <Changes oar={oar} />}
                {activeTab === 'resources' && <Resources cso={cso} isAuthenticated={isAuthenticated} onDownloadPackage={downloadPackage} onViewConfig={viewConfig} onDownloadConfig={downloadConfig} onApiDocs={apiDocs} feedback={feedback} />}
                <div className="pt-4 pb-8 text-center text-[12px] text-gray-400">
                    {cso?.cso_name || 'Meridian LMS'} · {cso?.package_id} · FedRAMP {cso?.authorization_type || '20x'} {cso?.impact_level || 'Moderate'} · Continuously monitored
                </div>
            </div>
        </div>
    );
};

import React, { useState, useEffect, memo, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useModal } from '../../contexts/ModalContext';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import { API_CONFIG, QUARTERLY_REGISTRATION_URL } from '../../config/api';
import { BASE_PATH } from '../../config/theme';
import { getRouteSegments, setRoute, onRouteChange } from '../../utils/hashRoute';
import {
    Download, ExternalLink, Lock, Video, Calendar, Clock, Mail, Send, MessageSquare,
    ArrowUpRight, FileJson, ChevronRight,
} from 'lucide-react';
import {
    cn, C, RULE, PANEL, Kicker, Rule, Stamp, Tag, Figure, DefRow, Section, Sparkline,
} from './dossier';
import ComplianceLedger from './ComplianceLedger';

// ============================================================================
// TRUST CENTER — "Authorization Dossier"
// A formal, living public record: warm paper, editorial serif, a numbered
// section index, ruled ledgers and figures. Same data, original identity.
// ============================================================================

const SECTIONS = [
    { id: 'posture', num: '01', label: 'Posture' },
    { id: 'profile', num: '02', label: 'Service Profile' },
    { id: 'responsibility', num: '03', label: 'Shared Responsibility' },
    { id: 'architecture', num: '04', label: 'Architecture' },
    { id: 'changes', num: '05', label: 'Change Activity' },
    { id: 'services', num: '06', label: 'Services & Artifacts' },
];

const FLOW_STAGES = [
    { phase: 'Collected', title: 'Federal User Entry', desc: 'Federal users reach the Application Load Balancer over HTTPS/TLS 1.2+.', security: ['TLS 1.2+', 'PIV/CAC'], data: ['Access Logs', 'Source IP', 'Session ID'], ksis: ['KSI-IAM-01', 'KSI-IAM-02'] },
    { phase: 'Collected', title: 'Identity & Authentication', desc: 'Okta Federal Gov SAML 2.0 SSO with PIV/CAC validation and MFA.', security: ['SAML 2.0', 'FIPS 140-2', 'MFA'], data: ['SAML Assertions', 'UPN Data', 'Groups'], ksis: ['KSI-IAM-01', 'KSI-IAM-03'] },
    { phase: 'Processed', title: 'Application Processing', desc: 'LMS web tier (ASP.NET on EC2) processes training, assessments, and content.', security: ['WAF', 'HTTPS', 'RBAC'], data: ['Training Records', 'Assessments'], ksis: ['KSI-SVC-01', 'KSI-MLA-01'] },
    { phase: 'Maintained', title: 'Encrypted Storage', desc: 'RDS, S3, and FSx with AES-256 at rest and KMS-managed keys.', security: ['AES-256', 'KMS', 'Backups'], data: ['User Records', 'Learning Data', 'Audit Logs'], ksis: ['KSI-CNA-01', 'KSI-INR-01'] },
    { phase: 'Disseminated', title: 'Third-Party Dissemination', desc: 'Content providers receive scoped PII via SAML SSO and xAPI/SCORM.', security: ['xAPI', 'SCORM', 'SAML SSO'], data: ['Names', 'Email', 'Progress'], ksis: ['KSI-TPR-01', 'KSI-PIY-02'] },
    { phase: 'Maintained', title: 'Security Monitoring', desc: 'CloudWatch, CloudTrail, GuardDuty, and Config provide continuous monitoring.', security: ['24/7', 'SIEM', 'Alerts'], data: ['CloudTrail', 'Flow Logs', 'Config'], ksis: ['KSI-MLA-01', 'KSI-CNA-07'] },
];

const SCN_TONE = { transformative: 'oxblood', adaptive: 'navy', routine_recurring: 'good', critical: 'oxblood', impact_categorization: 'warn' };

const SERVICES = [
    ['Course Management', 'SCORM / AICC / xAPI delivery & multimedia.'],
    ['User Management', 'SSO, RBAC, and hierarchy management.'],
    ['Assessment Engine', 'Quizzes, exams, and competency validation.'],
    ['Compliance Tracking', 'Regulatory reporting and audit trails.'],
    ['Analytics', 'Real-time dashboards and data exports.'],
    ['Learning Record Store', 'Native xAPI-compliant LRS.'],
    ['Career Development', 'IDP and skills-gap analysis.'],
    ['Notifications', 'Automated engagement engine.'],
    ['API Gateway', 'RESTful enterprise connectivity.'],
];
const EXCLUDED = ['On-premise / self-hosted installations', 'Private-cloud customer-specific instances', 'Custom development outside core', 'Third-party content libraries', 'Professional / consulting services', 'Native mobile applications'];

// ─────────────────────────────────────────────────────────────────────────
// MASTHEAD
// ─────────────────────────────────────────────────────────────────────────
const Masthead = ({ cso, status, asOf }) => {
    const operational = (status?.status || 'operational') === 'operational';
    return (
        <header>
            <div className="flex items-center justify-between gap-4 pb-3">
                <Kicker>FedRAMP Trust Center · Public Dossier</Kicker>
                <Kicker>As of {asOf || '—'}</Kicker>
            </div>
            <Rule className="border-t-[#1c1b17]/30" />
            <div className="grid lg:grid-cols-[1fr_auto] gap-8 pt-7 pb-8">
                <div>
                    <h1 className="font-serif text-[40px] md:text-[52px] leading-[0.98] tracking-tight text-[#1c1b17]">
                        {cso?.cso_name || 'Meridian LMS'}
                    </h1>
                    <p className="mt-3 text-[15px] text-[#4a473f] max-w-xl leading-relaxed">
                        {cso?.provider_name || 'Meridian Knowledge Solutions'} — continuous-monitoring authorization record for {cso?.authorization_type || 'FedRAMP 20x'} {cso?.impact_level || 'Moderate'}.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-5">
                        <Tag tone="navy" mono>{cso?.package_id || '—'}</Tag>
                        <Tag tone="ink">{cso?.impact_level || 'Moderate'} Impact</Tag>
                        <Tag tone="ink">{cso?.service_model || 'SaaS'}</Tag>
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-[#2f6b46]">
                            <span className="relative flex h-1.5 w-1.5"><span className={cn('absolute inline-flex h-full w-full rounded-full opacity-60', operational ? 'bg-[#2f6b46] animate-ping' : 'bg-[#8a5e1c]')} /><span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', operational ? 'bg-[#2f6b46]' : 'bg-[#8a5e1c]')} /></span>
                            {operational ? 'Operational' : 'Degraded'}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-5 text-[13px]">
                        {cso?.marketplace_url && (
                            <a href={cso.marketplace_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[#1e3a5f] hover:underline font-medium">
                                FedRAMP Marketplace <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                            </a>
                        )}
                        <a href={`${BASE_PATH}cso_public_info.json`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[#6c685f] hover:text-[#1c1b17] font-medium">
                            <FileJson className="w-3.5 h-3.5" /> Machine-readable JSON
                        </a>
                    </div>
                </div>

                {/* Seal */}
                <div className="flex lg:flex-col items-center lg:items-end gap-5 lg:gap-4">
                    <div className="w-24 h-24 border border-[#1c1b17]/15 bg-[#fbfaf6] flex items-center justify-center p-4" style={{ borderRadius: 3 }}>
                        <img src={`${BASE_PATH}meridian-favicon.png`} alt="Meridian" className="w-full h-full object-contain" />
                    </div>
                    <Stamp>Authorized</Stamp>
                </div>
            </div>
            <Rule className="border-t-[#1c1b17]/30" />
        </header>
    );
};

// ─────────────────────────────────────────────────────────────────────────
// INDEX RAIL (scroll-spy)
// ─────────────────────────────────────────────────────────────────────────
const IndexRail = ({ active, onJump }) => (
    <nav className="hidden lg:block sticky top-8 self-start w-[176px] shrink-0">
        <Kicker className="block mb-4">Contents</Kicker>
        <ul className="space-y-0.5">
            {SECTIONS.map(s => {
                const on = active === s.id;
                return (
                    <li key={s.id}>
                        <button onClick={() => onJump(s.id)}
                            className={cn('group flex items-baseline gap-2.5 w-full text-left py-1.5 transition-colors',
                                on ? 'text-[#1c1b17]' : 'text-[#6c685f] hover:text-[#1c1b17]')}>
                            <span className={cn('font-mono text-[11px] pt-0.5', on ? 'text-[#1e3a5f]' : 'text-[#928d81]')}>{s.num}</span>
                            <span className={cn('text-[13px] leading-snug border-b', on ? 'border-[#1c1b17]/40 font-medium' : 'border-transparent')}>{s.label}</span>
                        </button>
                    </li>
                );
            })}
        </ul>
    </nav>
);

// ─────────────────────────────────────────────────────────────────────────
// SECTION BODIES
// ─────────────────────────────────────────────────────────────────────────
const Posture = ({ oar, vdr, status }) => {
    const ex = oar?.executive_summary;
    const trend = oar?.compliance_trend?.data_points?.map(p => p.compliance_rate) || [];
    const improving = oar?.compliance_trend?.trend_direction === 'improving';
    const uptime = status?.uptime_percent ? `${parseFloat(status.uptime_percent).toFixed(2)}%` : '—';
    return (
        <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 py-7 border-y', RULE)}>
            <div>
                <Figure value={ex ? `${ex.compliance_rate}%` : '—'} label="KSI Compliance" accent
                    sub={ex ? `${ex.passed_ksis} of ${ex.total_ksis} indicators passing` : undefined} />
                <div className="mt-3 flex items-center gap-3">
                    <Sparkline data={trend} />
                    {improving && <span className="text-[11px] text-[#2f6b46] font-medium">▲ Improving</span>}
                </div>
            </div>
            <Figure value={ex?.active_gaps ?? '—'} label="Active Gaps"
                sub={`${oar?.data_sources?.ksi_history_entries?.toLocaleString() || '—'} validation runs`} />
            <Figure value={vdr?.vdr_acceptance?.active ?? vdr?.snapshot?.total_vulnerabilities ?? '—'} label="Open Vulnerabilities"
                sub={vdr ? `${vdr.risk?.critical ?? 0} critical · ${vdr.vdr_acceptance?.accepted ?? 0} accepted` : undefined} />
            <Figure value={uptime} label="Platform Uptime"
                sub={vdr?.posture?.rating ? `VDR posture ${vdr.posture.rating} (${vdr.posture.score})` : 'Continuously monitored'} />
        </div>
    );
};

const Profile = ({ cso, schedule, meeting }) => {
    const registrationUrl = QUARTERLY_REGISTRATION_URL || meeting?.registrationUrl;
    const dateLabel = meeting?.nextDate ? new Date(meeting.nextDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'To be announced';
    return (
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-x-12 gap-y-8">
            <div>
                <p className="font-serif text-[19px] leading-relaxed text-[#2c2a23]">
                    {cso?.service_description || 'Enterprise SaaS platform for workforce training, compliance tracking, and professional development.'}
                </p>
                <div className="mt-6">
                    <Kicker>Reporting Cadence</Kicker>
                    <div className="mt-1">
                        <DefRow label="Next Ongoing Report" value={schedule?.next_ongoing_report || 'TBD'} mono />
                        <DefRow label="Next Quarterly Review" value={schedule?.next_quarterly_review || 'TBD'} mono />
                        <DefRow label="Last Data Refresh" value={schedule?.last_data_refresh || 'TBD'} mono />
                    </div>
                </div>
                {meeting && (
                    <div className={cn('mt-5 flex items-start justify-between gap-4 border rounded-sm p-4', RULE, PANEL)}>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-[13px] font-medium text-[#1c1b17]"><Video className="w-4 h-4 text-[#1e3a5f]" />{meeting.meetingTitle || 'Quarterly Continuous Monitoring Review'}</div>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[12px] text-[#6c685f]">
                                <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{dateLabel}</span>
                                {meeting.time && <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{meeting.time}</span>}
                                <span>· Microsoft Teams</span>
                            </div>
                        </div>
                        {registrationUrl && (
                            <button onClick={() => window.open(registrationUrl, '_blank', 'noopener')}
                                className="shrink-0 inline-flex items-center gap-1.5 bg-[#1e3a5f] hover:bg-[#16304f] text-white text-[12px] font-medium px-3.5 py-2 rounded-sm transition-colors">
                                Register <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                )}
            </div>
            <div>
                <Kicker>System of Record</Kicker>
                <div className="mt-1">
                    <DefRow label="Deployment" value={cso?.deployment_model || 'Multi-Tenant Public Cloud'} />
                    <DefRow label="Cloud" value={cso?.cloud_provider || 'AWS Commercial (US-East-1)'} />
                    <DefRow label="UEI" value={cso?.uei || '—'} mono sub="SAM.gov" />
                    <DefRow label="Category" value={cso?.business_category || 'Learning Management'} />
                    <DefRow label="Access" value={cso?.access_methods?.primary || 'HTTPS (Port 443)'} />
                    <DefRow label="Authentication" value={cso?.access_methods?.authentication || 'SAML 2.0 SSO with MFA'} />
                    <DefRow label="API" value={cso?.access_methods?.api || 'REST · OAuth 2.0 / API Key'} />
                </div>
                {cso?.customer_responsibilities?.length > 0 && (
                    <div className="mt-7">
                        <Kicker>Customer Responsibilities</Kicker>
                        <ol className="mt-2 space-y-2">
                            {cso.customer_responsibilities.map((r, i) => (
                                <li key={i} className="flex gap-3 text-[13px] text-[#3a382f] leading-snug">
                                    <span className="font-mono text-[11px] text-[#928d81] pt-0.5">{String(i + 1).padStart(2, '0')}</span>
                                    <span>{r}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}
            </div>
        </div>
    );
};

const Architecture = () => {
    const [open, setOpen] = useState(null);
    return (
        <div>
            <div className={cn('border rounded-sm overflow-hidden', RULE, PANEL)}>
                {FLOW_STAGES.map((s, i) => {
                    const on = open === i;
                    return (
                        <div key={i} className={cn('border-t first:border-t-0', RULE)}>
                            <button onClick={() => setOpen(on ? null : i)} className={cn('w-full text-left flex items-start gap-4 px-4 md:px-5 py-4 hover:bg-[#f3f1ea]/70 transition-colors', on && 'bg-[#f3f1ea]/60')}>
                                <span className="font-serif text-[22px] text-[#1e3a5f] leading-none w-8 shrink-0">{['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ'][i]}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <span className="text-[14px] font-medium text-[#1c1b17]">{s.title}</span>
                                        <Tag tone="ink">{s.phase}</Tag>
                                    </div>
                                    <p className="text-[13px] text-[#6c685f] mt-1 leading-snug">{s.desc}</p>
                                </div>
                                <ChevronRight className={cn('w-4 h-4 text-[#928d81] mt-1 shrink-0 transition-transform', on && 'rotate-90')} />
                            </button>
                            {on && (
                                <div className="px-4 md:pl-[68px] pb-4 grid sm:grid-cols-3 gap-x-6 gap-y-3 text-[12px]">
                                    <div><Kicker>Data Elements</Kicker><div className="mt-1.5 space-y-1">{s.data.map(d => <div key={d} className="font-mono text-[12px] text-[#3a382f]">{d}</div>)}</div></div>
                                    <div><Kicker>Controls</Kicker><div className="mt-1.5 flex flex-wrap gap-1.5">{s.security.map(x => <Tag key={x}>{x}</Tag>)}</div></div>
                                    <div><Kicker>KSIs</Kicker><div className="mt-1.5 flex flex-wrap gap-1.5">{s.ksis.map(k => <Tag key={k} tone="navy" mono>{k}</Tag>)}</div></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="grid sm:grid-cols-3 gap-x-8 mt-7">
                <DefRow label="Hosting" value="AWS Commercial US-East-1" sub="Inherited FedRAMP controls" />
                <DefRow label="Tenancy" value="Multi-Tenant SaaS" sub="Logical isolation per agency" />
                <DefRow label="Encryption" value="AES-256 · TLS 1.2+" sub="KMS-managed keys" />
            </div>
        </div>
    );
};

const Changes = ({ oar }) => {
    const t = oar?.transformative_changes;
    const changes = t?.changes || [];
    return (
        <div>
            <div className={cn('grid grid-cols-3 gap-6 py-6 border-y mb-7', RULE)}>
                <Figure value={oar?.data_sources?.scn_history_entries ?? '—'} label="SCN entries tracked" accent />
                <Figure value={t?.total_count ?? changes.length} label="Transformative" />
                <Figure value={oar?.planned_changes?.changes?.length ?? 0} label="Planned (90d)" />
            </div>
            {changes.length ? (
                <div className={cn('border rounded-sm overflow-hidden', RULE, PANEL)}>
                    {changes.map((c, i) => (
                        <div key={i} className={cn('flex items-baseline gap-4 px-4 py-3 border-t first:border-t-0', RULE)}>
                            <span className="font-mono text-[12px] text-[#928d81] shrink-0 w-24">{c.date}</span>
                            <Tag tone={SCN_TONE[c.type] || 'navy'}>{(c.type || '').replace('_', ' ')}</Tag>
                            <span className="text-[13px] text-[#1c1b17] flex-1">{c.description}</span>
                            <span className="hidden md:block font-mono text-[11px] text-[#928d81] shrink-0">{c.scn_id}</span>
                        </div>
                    ))}
                </div>
            ) : <p className="text-[13px] text-[#928d81]">No significant changes in the current reporting window.</p>}
            {t?.note && <p className="text-[12px] text-[#928d81] mt-4">{t.note}</p>}
        </div>
    );
};

const Services = ({ cso, isAuthenticated, onDownloadPackage, onViewConfig, onDownloadConfig, onApiDocs, feedback }) => (
    <div className="space-y-9">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-x-12 gap-y-8">
            <div>
                <Kicker>In Scope</Kicker>
                <div className="mt-1">
                    {SERVICES.map(([t, d]) => (
                        <div key={t} className={cn('flex items-baseline justify-between gap-4 py-2.5 border-t', RULE)}>
                            <span className="text-[14px] text-[#1c1b17]">{t}</span>
                            <span className="text-[12px] text-[#807b70] text-right max-w-[60%]">{d}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <Kicker>Not Included</Kicker>
                <ul className="mt-1">
                    {EXCLUDED.map((e, i) => (
                        <li key={i} className={cn('flex gap-3 py-2.5 border-t text-[13px] text-[#6c685f]', RULE)}>
                            <span className="text-[#8c2f2f]">✕</span>{e}
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        <div>
            <Kicker>Machine-Readable Artifacts</Kicker>
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
                <button onClick={onDownloadPackage} className="flex items-center justify-between gap-3 bg-[#1e3a5f] hover:bg-[#16304f] text-white rounded-sm px-5 py-4 transition-colors text-left">
                    <span>
                        <span className="flex items-center gap-2 text-[14px] font-medium">{isAuthenticated ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />}Authorization Package</span>
                        <span className="block text-[12px] text-white/70 mt-0.5">Full OSCAL artifact bundle</span>
                    </span>
                    <ArrowUpRight className="w-4 h-4" />
                </button>
                <div className={cn('flex items-center justify-between gap-3 border rounded-sm px-5 py-4', RULE, PANEL)}>
                    <span>
                        <span className="block text-[14px] font-medium text-[#1c1b17]">Secure Configuration Guide</span>
                        <span className="block text-[12px] text-[#807b70] mt-0.5">Recommended hardening</span>
                    </span>
                    <span className="flex gap-2 shrink-0">
                        <button onClick={onViewConfig} className="text-[12px] font-medium text-[#1e3a5f] border border-[#1e3a5f]/30 rounded-sm px-2.5 py-1.5 hover:bg-[#1e3a5f]/[0.05]">View</button>
                        <button onClick={onDownloadConfig} aria-label="Download" className="text-[#6c685f] border border-[#1c1b17]/15 rounded-sm px-2.5 py-1.5 hover:text-[#1c1b17]"><Download className="w-4 h-4" /></button>
                    </span>
                </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
                <button onClick={onApiDocs} className="inline-flex items-center gap-1.5 text-[#1e3a5f] hover:underline font-medium">API Documentation <ArrowUpRight className="w-3.5 h-3.5" /></button>
                <a href={cso?.marketplace_url || '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[#1e3a5f] hover:underline font-medium">FedRAMP Marketplace <ArrowUpRight className="w-3.5 h-3.5" /></a>
                <a href={`${BASE_PATH}cso_public_info.json`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[#6c685f] hover:text-[#1c1b17] font-medium"><FileJson className="w-3.5 h-3.5" /> CSO Metadata JSON</a>
            </div>
        </div>

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
        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-6">
            <div>
                <Kicker>Submit Feedback</Kicker>
                <p className="text-[13px] text-[#6c685f] mt-2 mb-3 leading-relaxed">Questions about security posture, KSI validation, or authorization data (FRR-CCM-04 / 05). Responses are summarized anonymously in the Ongoing Authorization Report.</p>
                <form onSubmit={submit} className="space-y-2.5">
                    <textarea value={q} onChange={e => setQ(e.target.value)} rows={3} required placeholder="e.g., How is multi-AZ resilience measured?"
                        className="w-full bg-[#fbfaf6] border border-[#1c1b17]/15 rounded-sm px-3 py-2.5 text-[13px] text-[#1c1b17] placeholder:text-[#928d81] focus:outline-none focus:border-[#1e3a5f]/50 resize-none" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@agency.gov (optional)"
                        className="w-full bg-[#fbfaf6] border border-[#1c1b17]/15 rounded-sm px-3 py-2.5 text-[13px] text-[#1c1b17] placeholder:text-[#928d81] focus:outline-none focus:border-[#1e3a5f]/50" />
                    <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#16304f] text-white text-[13px] font-medium py-2.5 rounded-sm transition-colors"><Send className="w-4 h-4" /> Submit</button>
                    {sent && <div className="text-[12px] text-[#2f6b46]">Your email client should open with the message pre-filled.</div>}
                    <div className="flex items-center gap-1.5 text-[12px] text-[#6c685f]"><Mail className="w-3.5 h-3.5" /> Direct: <a href={`mailto:${to}`} className="text-[#1e3a5f] hover:underline">{to}</a></div>
                </form>
            </div>
            <div>
                <div className="flex items-center gap-2"><Kicker>Feedback Summary</Kicker><Tag tone="good">CCM-05</Tag></div>
                {entries?.length ? (
                    <div className="mt-3 max-h-[300px] overflow-y-auto">
                        {entries.map((e, i) => (
                            <div key={i} className={cn('py-3 border-t', RULE)}>
                                <p className="text-[13px] text-[#1c1b17] font-medium leading-snug">{e.question}</p>
                                <p className="text-[12.5px] text-[#6c685f] leading-relaxed mt-1.5 pl-3 border-l-2 border-[#1e3a5f]/25">{e.answer}</p>
                                {e.date && <div className="text-[11px] text-[#928d81] mt-1.5 font-mono">{e.date}</div>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-3 flex items-center gap-2 text-[13px] text-[#928d81]"><MessageSquare className="w-4 h-4" /> No feedback entries yet.</div>
                )}
            </div>
        </div>
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
    const [active, setActive] = useState('posture');

    const rootRef = useRef(null);
    const sectionRefs = useRef({});
    const register = (id) => (el) => { if (el) sectionRefs.current[id] = el; };

    useEffect(() => {
        const ts = Date.now();
        const grab = async (p) => { try { const r = await fetch(`${BASE_PATH}${p}?t=${ts}`); return r.ok ? r.json() : null; } catch { return null; } };
        (async () => {
            const [a, b, c, d, e] = await Promise.all([
                grab('cso_public_info.json'), grab('next_report_date.json'), grab('quarterly_meetings.json'),
                grab('reports/samples/oar-report.json'), grab('vdr_public_metrics.json'),
            ]);
            if (a) setCso(a); if (b) setSchedule(b); if (c) setMeeting(c);
            if (d) { setOar(d); if (d.feedback_summary?.entries) setFeedback(d.feedback_summary.entries); }
            if (e) setVdr(e);
            setLoading(false);
        })();
    }, []);

    // Scroll-spy on the app's scrolling <main>
    useEffect(() => {
        if (loading) return;
        const root = rootRef.current?.closest('main') || null;
        const obs = new IntersectionObserver((entries) => {
            const vis = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
            if (vis[0]) setActive(vis[0].target.id);
        }, { root, rootMargin: '0px 0px -65% 0px', threshold: 0.01 });
        Object.values(sectionRefs.current).forEach(el => el && obs.observe(el));
        return () => obs.disconnect();
    }, [loading]);

    const jump = (id) => {
        sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActive(id); setRoute(['trust', id]);
    };

    useEffect(() => {
        const seg = getRouteSegments();
        if (seg[0] === 'trust' && SECTIONS.some(s => s.id === seg[1]) && !loading) {
            setTimeout(() => sectionRefs.current[seg[1]]?.scrollIntoView({ block: 'start' }), 60);
        }
    }, [loading]);
    useEffect(() => onRouteChange(() => {
        const seg = getRouteSegments();
        if (seg[0] === 'trust' && SECTIONS.some(s => s.id === seg[1])) sectionRefs.current[seg[1]]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }), []);

    // Actions
    const guard = (name) => { if (!isAuthenticated) { openModal('accessRequired', { featureName: name, benefits: ['Download machine-readable artifacts', 'View VDR data', 'Automated reviews'] }); return false; } return true; };
    const dl = (blob, filename) => { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u); };
    const viewConfig = async () => { if (!guard('View Secure Configuration')) return; try { const r = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONFIG_PUBLIC}`); openModal('markdown', { title: 'Secure Configuration', markdown: await r.text() }); } catch { alert('Load failed.'); } };
    const downloadConfig = async () => { if (!guard('Download Secure Configuration')) return; try { const r = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONFIG_PUBLIC}`); if (!r.ok) throw new Error(`HTTP ${r.status}`); dl(new Blob([await r.text()], { type: 'text/markdown' }), 'secure-configuration.md'); } catch (e) { alert(`Download failed: ${e.message}`); } };
    const downloadPackage = async () => { if (!guard('Download Authorization Package')) return; try { const tok = localStorage.getItem(API_CONFIG.TOKEN_KEY); if (!tok) { alert('Session expired.'); return; } const r = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PACKAGE_DOWNLOAD}`, { headers: { Authorization: `Bearer ${tok}` } }); if (!r.ok) throw new Error('Access Denied'); const j = await r.json(); if (j.url) window.location.href = j.url; } catch (e) { alert(`Download failed: ${e.message}`); } };
    const apiDocs = () => window.open('https://meridian-knowledge-solutions.github.io/fedramp-20x-public/documentation/api/', '_blank');

    if (loading) {
        return (
            <div className="-m-6 md:-m-8 min-h-screen bg-[#f3f1ea] flex items-center justify-center">
                <div className="text-center animate-pulse">
                    <div className="w-10 h-10 mx-auto mb-4 border-2 border-[#1e3a5f]/40" style={{ borderRadius: 2 }} />
                    <div className="text-[#928d81] font-mono text-[13px]">Compiling authorization dossier…</div>
                </div>
            </div>
        );
    }

    return (
        <div ref={rootRef} className="-m-6 md:-m-8 min-h-screen bg-[#f3f1ea] text-[#1c1b17] selection:bg-[#1e3a5f]/15"
            style={{ fontFeatureSettings: '"liga" 1, "calt" 1' }}>
            <div className="max-w-[1180px] mx-auto px-6 md:px-10 lg:px-12 py-9">
                <Masthead cso={cso} status={status} asOf={schedule?.last_data_refresh} />

                <div className="flex gap-12 pt-10">
                    <IndexRail active={active} onJump={jump} />

                    <div className="min-w-0 flex-1 space-y-16">
                        <Section id="posture" ref={register('posture')} num="01" title="Authorization Posture"
                            desc="Live continuous-monitoring metrics for the current reporting period.">
                            <Posture oar={oar} vdr={vdr} status={status} />
                        </Section>

                        <Section id="profile" ref={register('profile')} num="02" title="Service Profile"
                            desc="What the platform is, how it is deployed, and the reporting cadence.">
                            <Profile cso={cso} schedule={schedule} meeting={meeting} />
                        </Section>

                        <Section id="responsibility" ref={register('responsibility')} num="03" title="Shared Responsibility"
                            desc="Control ownership across NIST 800-53 Rev 5, FedRAMP 20x KSIs, and CMMC 2.0 L2 / CUI.">
                            <ComplianceLedger />
                        </Section>

                        <Section id="architecture" ref={register('architecture')} num="04" title="Architecture & Data Flow"
                            desc="Federal data lifecycle per OMB A-130. Select a stage to inspect controls and KSIs.">
                            <Architecture />
                        </Section>

                        <Section id="changes" ref={register('changes')} num="05" title="Change Activity"
                            desc="Significant change activity from the current Ongoing Authorization Report (FRR-SCN).">
                            <Changes oar={oar} />
                        </Section>

                        <Section id="services" ref={register('services')} num="06" title="Services & Artifacts"
                            desc="Authorization scope, downloadable artifacts, and the feedback mechanism.">
                            <Services cso={cso} isAuthenticated={isAuthenticated} onDownloadPackage={downloadPackage}
                                onViewConfig={viewConfig} onDownloadConfig={downloadConfig} onApiDocs={apiDocs} feedback={feedback} />
                        </Section>

                        <footer className={cn('pt-8 mt-4 border-t text-[12px] text-[#928d81] flex flex-wrap justify-between gap-2', RULE)}>
                            <span>{cso?.cso_name || 'Meridian LMS'} · {cso?.package_id} · FedRAMP {cso?.authorization_type || '20x'} {cso?.impact_level || 'Moderate'}</span>
                            <span>Continuously monitored authorization · Public dossier</span>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
};

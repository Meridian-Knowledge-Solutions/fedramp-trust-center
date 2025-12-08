import React, { useState, useEffect, useMemo } from 'react';
import {
    ShieldCheck, AlertTriangle, FileJson, Terminal,
    GitCommit, Activity, CheckCircle2, XCircle,
    Search, Filter, ChevronDown, ChevronRight,
    Cpu, Lock, BarChart3, FileCode, History,
    Play, Eye, Server, Code, ExternalLink, RefreshCw,
    AlertCircle, BookOpen, FileText
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

// --- CONFIGURATION ---
// With Pipeline Injection, "Remote" files are now served locally 
// from the /data/ folder in production too.
const BASE_PATH = import.meta.env.BASE_URL.endsWith('/')
    ? `${import.meta.env.BASE_URL}data/`
    : `${import.meta.env.BASE_URL}/data/`;

// --- THEME ENGINE ---
const THEME = {
    bg: 'bg-[#09090b]',
    panel: 'bg-[#121217]',
    border: 'border-white/5',
    hover: 'hover:bg-white/5',
    active: 'bg-indigo-600/10 text-indigo-400 border-indigo-500/50',
    text: { main: 'text-slate-200', muted: 'text-slate-500' }
};

// --- SYNTAX HIGHLIGHTER (Helper) ---
const highlightCode = (code) => {
    if (!code) return "";
    let safeCode = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const placeholders = [];
    const createPlaceholder = (content) => {
        const id = `__TOKEN_${placeholders.length}__`;
        placeholders.push({ id, content });
        return id;
    };
    safeCode = safeCode.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => createPlaceholder(`<span class="text-emerald-400">${match}</span>`));
    safeCode = safeCode.replace(/(#.*$)/gm, (match) => createPlaceholder(`<span class="text-slate-500 italic">${match}</span>`));
    const keywords = ["def", "return", "if", "else:", "elif", "for", "while", "import", "from", "try", "except", "with", "as", "pass", "None", "True", "False"];
    keywords.forEach(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'g');
        safeCode = safeCode.replace(regex, `<span class="text-purple-400 font-bold">${kw}</span>`);
    });
    safeCode = safeCode.replace(/\b(print|len|get|append|split|join|run_cli|validate_condition)\b(?=\()/g, (match) => `<span class="text-blue-400">${match}</span>`);
    placeholders.forEach(({ id, content }) => {
        safeCode = safeCode.replace(id, content);
    });
    return safeCode;
};

export const ThreePaoView = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [selectedKSI, setSelectedKSI] = useState(null);
    const [sourceInfo, setSourceInfo] = useState({ type: 'Checking...' });

    useEffect(() => {
        const loadArtifacts = async () => {
            setLoading(true);

            // Source is always "Pipeline Injected" now (Local Fetch)
            setSourceInfo({ type: 'Secure Pipeline Injection' });

            const safeFetch = async (filename, isText = false) => {
                const url = `${BASE_PATH}${filename}`;
                try {
                    const res = await fetch(url);
                    if (!res.ok) {
                        console.warn(`Fetch failed: ${filename} (${res.status})`);
                        return null;
                    }

                    const text = await res.text();

                    // Reject HTML (404) responses
                    if (text.trim().toLowerCase().startsWith('<!doctype html')) {
                        return null;
                    }

                    if (isText) return text;
                    if (text.trim().startsWith('<')) return null;

                    return JSON.parse(text);
                } catch (e) {
                    return null;
                }
            };

            try {
                const [report, techLog, consistency, logicDefs, fingerprint, methodologyMd, cliRegister] = await Promise.all([
                    safeFetch('3pao_audit_report.json'),
                    safeFetch('technical_validation_log.json'),
                    safeFetch('validation_consistency_log.json'),
                    safeFetch('ksi_logic.json'),
                    safeFetch('fingerprint_cache.json'),
                    safeFetch('ksi-command-validation-reference.md', true),
                    safeFetch('cli_command_register.json') // Now injected!
                ]);

                setData({
                    report,
                    techLog,
                    consistency,
                    logicDefs: logicDefs || {},
                    fingerprint,
                    methodologyMd,
                    cliRegister
                });
            } catch (e) {
                console.error("Load error:", e);
            } finally {
                setLoading(false);
            }
        };
        loadArtifacts();
    }, []);

    if (loading) return <div className="min-h-screen bg-[#0b0c10] flex items-center justify-center text-slate-500">Initializing Assessor Console...</div>;

    // Critical Failure State
    if (!data?.report) return (
        <div className="min-h-screen bg-[#0b0c10] flex flex-col items-center justify-center text-slate-500 p-6">
            <div className="bg-rose-900/20 p-4 rounded-full mb-4 text-rose-500"><AlertTriangle size={48} /></div>
            <h3 className="text-xl font-bold text-white mb-2">Authorization Package Unavailable</h3>
            <p className="max-w-md text-center mb-6">
                The system could not retrieve the assessment artifacts.
                <br /><span className="text-xs opacity-50">Target: {BASE_PATH}</span>
            </p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">Retry Connection</button>
        </div>
    );

    const handleInspect = (ksiId) => {
        let logic = data.logicDefs?.[ksiId] || data.logicDefs?.[ksiId.replace(/-/g, '_')];
        if (logic) {
            setSelectedKSI({ id: ksiId, ...logic });
        } else {
            setSelectedKSI({
                id: ksiId,
                title: "Logic Definition Not Found",
                logic: "No automated logic definition was found.",
                passing_criteria: "Manual verification required.",
                source_code: "# Source code not available."
            });
        }
    };

    return (
        <div className="-m-6 md:-m-8 min-h-screen bg-[#0b0c10] text-slate-300 font-sans selection:bg-indigo-500/30 relative">
            <header className="border-b border-white/5 bg-[#0f1115] px-8 py-6 sticky top-0 z-20 backdrop-blur-md bg-opacity-90">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            {/* UPDATED LOGO HANDLING */}
                            <div className="w-12 h-12 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center p-2 relative overflow-hidden">
                                <img
                                    src={`${BASE_PATH}meridian-favicon.png`}
                                    alt="Meridian"
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none'; // Hide broken image
                                        e.target.nextSibling.style.display = 'block'; // Show fallback
                                    }}
                                />
                                <ShieldCheck size={24} className="text-indigo-400 hidden absolute" />
                            </div>

                            <h1 className="text-2xl font-bold text-white tracking-tight">3PAO Assessment Console</h1>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">FedRAMP 20x Pilot</span>
                        </div>
                        <p className="text-sm text-slate-400 flex items-center gap-4">
                            <span className="flex items-center gap-1.5"><Activity size={14} className="text-emerald-500" /> Status: <span className="text-white font-medium">Active</span></span>
                            <span className="w-px h-3 bg-white/10" />
                            <span className="flex items-center gap-1.5"><GitCommit size={14} /> Snapshot: <span className="font-mono text-slate-300">{data.fingerprint?.fingerprint?.substring(0, 8) || 'LATEST'}</span></span>
                            <span className="w-px h-3 bg-white/10" />
                            <span className="flex items-center gap-1.5"><Server size={14} /> Source: <span className="text-slate-300 text-xs bg-white/5 px-2 py-0.5 rounded">{sourceInfo.type}</span></span>
                        </p>
                    </div>
                    <div className="flex bg-[#18181b] p-1 rounded-lg border border-white/10 overflow-x-auto">
                        <TabButton id="dashboard" label="Overview" icon={BarChart3} active={activeTab} set={setActiveTab} />
                        <TabButton id="methodology" label="Methodology" icon={BookOpen} active={activeTab} set={setActiveTab} />
                        <TabButton id="logic" label="Logic Inspector" icon={Code} active={activeTab} set={setActiveTab} />
                        <TabButton id="consistency" label="Audit Ledger" icon={History} active={activeTab} set={setActiveTab} />
                        <TabButton id="health" label="Automation Health" icon={Cpu} active={activeTab} set={setActiveTab} count={data.report?.technical_validation?.technical_issues_found} />
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-8 py-8">
                {activeTab === 'dashboard' && <DashboardTab data={data} />}
                {activeTab === 'methodology' && <MethodologyTab markdown={data.methodologyMd} />}
                {activeTab === 'logic' && <LogicTab consistency={data.consistency} logicDefs={data.logicDefs} onInspect={handleInspect} />}
                {activeTab === 'consistency' && <ConsistencyTab data={data.consistency} />}
                {activeTab === 'health' && <TechnicalTab data={data.techLog} fallback={data.report?.technical_validation} />}
            </main>

            {selectedKSI && <InspectorModal ksi={selectedKSI} onClose={() => setSelectedKSI(null)} />}
        </div>
    );
};

// --- TABS ---

const DashboardTab = ({ data }) => {
    const summary = data.report?.validation_summary || {};
    const tech = data.report?.technical_validation || {};
    const cliRegister = data.cliRegister || {};
    const logicDefs = data.logicDefs || {};

    // Total KSIs (Source of Truth: Audit Report or Fallback 65)
    const totalKSIs = summary.total_ksis || 65;

    // Automated: Count active logic definitions that have commands in register
    const automatedCount = Object.keys(logicDefs).filter(ksiId => {
        const regEntry = cliRegister[ksiId] || cliRegister[ksiId.replace(/_/g, '-')];
        return regEntry?.cli_commands?.length > 0;
    }).length;

    const coveragePct = Math.round((automatedCount / totalKSIs) * 100);

    // SVG Donut Logic
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (coveragePct / 100) * circumference;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Pass Rate" value={summary.overall_pass_rate || "0%"} icon={CheckCircle2} color="text-emerald-400" />
                <StatCard label="Automated Controls" value={`${automatedCount}/${totalKSIs}`} icon={Cpu} color="text-indigo-400" />
                <StatCard label="Failing Controls" value={summary.failing_ksis || 0} icon={XCircle} color="text-rose-400" />
                <StatCard label="Logic Warnings" value={tech.technical_issues_found || 0} icon={AlertTriangle} color="text-amber-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Executive Summary */}
                <div className="lg:col-span-2 bg-[#121217] border border-white/5 rounded-xl p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                        <Terminal size={24} className="text-purple-400" />
                        <h3 className="text-xl font-bold text-white">Executive Validation Summary</h3>
                    </div>

                    <p className="text-slate-300 leading-relaxed text-base mb-6">
                        This assessment console validates the <strong>logic</strong> behind the compliance, not just the output.
                        It employs a <strong>Graduated Scoring Model</strong> (Low/Mod/High) and automated
                        <span className="text-emerald-400 font-mono mx-1">Evidence-as-Code</span> verification.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Consistency Score</div>
                            <div className="text-2xl font-mono text-blue-400">{data.report?.consistency_analysis?.average_consistency_score || "N/A"}</div>
                            <div className="text-xs text-slate-400 mt-1">Deterministic execution</div>
                        </div>
                        <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Assessment Scope</div>
                            <div className="text-2xl font-mono text-white">{totalKSIs} KSIs</div>
                            <div className="text-xs text-slate-400 mt-1">Full Phase 2 Baseline</div>
                        </div>
                    </div>
                </div>

                {/* Automation Donut Chart */}
                <div className="bg-[#121217] border border-white/5 rounded-xl p-8 flex flex-col items-center justify-center">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Cpu size={16} /> Automation Fidelity
                    </h3>

                    <div className="relative w-40 h-40">
                        <svg className="w-full h-full transform -rotate-90">
                            {/* Background Circle */}
                            <circle
                                cx="80"
                                cy="80"
                                r={radius}
                                stroke="rgba(255,255,255,0.05)"
                                strokeWidth="12"
                                fill="transparent"
                            />
                            {/* Progress Circle */}
                            <circle
                                cx="80"
                                cy="80"
                                r={radius}
                                stroke="#10b981"
                                strokeWidth="12"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-white">{coveragePct}%</span>
                            <span className="text-xs text-emerald-400 font-bold uppercase mt-1">Automated</span>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-slate-500">
                            {automatedCount} of {totalKSIs} controls verified via CLI
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- (MethodologyTab, LogicTab, ConsistencyTab, TechnicalTab, InspectorModal below remain same) ---

const MethodologyTab = ({ markdown }) => {
    if (!markdown) return <div className="flex flex-col items-center justify-center h-64 text-slate-500 border border-white/5 rounded-xl bg-[#121217]"><FileText size={48} className="mb-4 opacity-50" /><p>Methodology reference document not found.</p></div>;
    const renderContent = () => {
        const lines = markdown.split('\n');
        const elements = [];
        let inTable = false;
        let tableRows = [];
        lines.forEach((line, idx) => {
            if (line.startsWith('## ')) elements.push(<h2 key={idx} className="text-xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2">{line.replace('## ', '')}</h2>);
            else if (line.startsWith('### ')) elements.push(<h3 key={idx} className="text-lg font-semibold text-blue-400 mt-6 mb-3">{line.replace('### ', '')}</h3>);
            else if (line.startsWith('#### ')) elements.push(<h4 key={idx} className="text-base font-bold text-emerald-400 mt-4 mb-2 flex items-center gap-2"><ShieldCheck size={16} /> {line.replace('#### ', '')}</h4>);
            else if (line.trim().startsWith('|')) { if (!inTable) inTable = true; tableRows.push(line); }
            else {
                if (inTable) { elements.push(renderTable(tableRows, idx)); inTable = false; tableRows = []; }
                if (line.trim()) {
                    const parts = line.split('**');
                    const renderedLine = parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-white">{part}</strong> : part);
                    elements.push(<p key={idx} className="text-sm text-slate-300 mb-2 leading-relaxed">{renderedLine}</p>);
                }
            }
        });
        return elements;
    };
    const renderTable = (rows, key) => {
        const header = rows[0].split('|').filter(Boolean).map(c => c.trim());
        const body = rows.slice(2).map(r => r.split('|').filter(Boolean).map(c => c.trim()));
        return (
            <div key={key} className="my-4 overflow-hidden rounded-lg border border-white/10 bg-black/20">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-slate-200"><tr>{header.map((h, i) => <th key={i} className="p-3 font-bold border-b border-white/10">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-white/5">{body.map((row, i) => (<tr key={i} className="hover:bg-white/5">{row.map((cell, j) => (<td key={j} className="p-3 text-slate-400 font-mono text-xs break-all">{cell.replace(/`/g, '')}</td>))}</tr>))}</tbody>
                </table>
            </div>
        );
    };
    return (
        <div className="bg-[#121217] border border-white/5 rounded-xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            <div className="prose prose-invert max-w-none">
                <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/10">
                    <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20"><BookOpen size={32} className="text-blue-400" /></div>
                    <div><h1 className="text-3xl font-bold text-white">Reference Methodology</h1><p className="text-slate-400 mt-1">Command Register & Validation Logic • Version 5.0</p></div>
                </div>
                {renderContent()}
            </div>
        </div>
    );
};

const LogicTab = ({ consistency, logicDefs, onInspect }) => {
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const results = consistency?.historical_validations?.[consistency.historical_validations.length - 1]?.results || [];
    const filtered = results.filter(r => {
        const matchesText = r.ksi_id.toLowerCase().includes(filter.toLowerCase()) || r.requirement.toLowerCase().includes(filter.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' ? true : statusFilter === 'FAIL' ? r.assertion === false : r.assertion === true;
        return matchesText && matchesStatus;
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex gap-4 items-center bg-[#121217] p-4 rounded-xl border border-white/5">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-3 text-slate-500" />
                    <input type="text" placeholder="Search Control ID or Requirement..." className="w-full bg-[#09090b] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:border-indigo-500/50 focus:outline-none" value={filter} onChange={(e) => setFilter(e.target.value)} />
                </div>
                <div className="flex bg-[#09090b] p-1 rounded-lg border border-white/10">
                    {['ALL', 'PASS', 'FAIL'].map(s => <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${statusFilter === s ? (s === 'FAIL' ? 'bg-rose-500 text-white' : 'bg-indigo-500 text-white') : 'text-slate-400 hover:text-white'}`}>{s}</button>)}
                </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
                {filtered.map((item, idx) => (
                    <div key={idx} onClick={() => onInspect(item.ksi_id)} className="group bg-[#121217] border border-white/5 p-5 rounded-xl hover:border-indigo-500/30 hover:bg-[#18181b] transition-all cursor-pointer relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${item.assertion ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{item.assertion ? <CheckCircle2 size={18} /> : <XCircle size={18} />}</div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-base font-bold text-white">{item.ksi_id}</span>
                                        <span className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded border border-white/5 uppercase">{item.category_prefix}</span>
                                        {logicDefs?.[item.ksi_id.replace(/-/g, '_')] && <span className="flex items-center gap-1 text-[9px] text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded"><Code size={10} /> Logic</span>}
                                    </div>
                                    <div className="text-sm text-slate-400 mt-1 line-clamp-1">{item.requirement}</div>
                                </div>
                            </div>
                            <ChevronRight className="text-slate-600 group-hover:text-white transition-colors" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ConsistencyTab = ({ data }) => {
    const history = data?.historical_validations || [];
    const chartData = history.map(h => ({
        time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        score: h.ksi_count > 0 ? (h.pass_count / h.ksi_count) * 100 : 0
    }));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Chart Card */}
            <div className="bg-[#121217] border border-white/5 rounded-xl p-6 h-80 flex flex-col">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-indigo-400" /> Validation Consistency Trend
                </h3>
                {/* Wrapper div provides explicit dimensions for Recharts */}
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#09090b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                                itemStyle={{ color: '#10b981' }}
                                formatter={(value) => [`${value.toFixed(1)}%`, 'Consistency']}
                            />
                            <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} fill="url(#colorScore)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Checks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(data?.consistency_checks || []).slice(-3).reverse().map((check, i) => (
                    <div key={i} className="bg-[#121217] border border-white/5 p-5 rounded-xl">
                        <div className="text-xs text-slate-500 mb-2">{new Date(check.timestamp).toLocaleString()}</div>
                        <div className="flex justify-between items-end">
                            <div className="text-2xl font-bold text-white">{check.consistency_score.toFixed(1)}%</div>
                            <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                {check.infrastructure_fingerprint.substring(0, 8)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TechnicalTab = ({ data, fallback }) => {
    const effectiveData = data || { issues: [], technical_issues_found: fallback?.technical_issues_found || 0, status: fallback?.technical_status || 'unknown', categories_checked: fallback?.validation_categories || [] };
    const isDataMissing = !data;
    const hasIssues = effectiveData.technical_issues_found > 0;
    const checkCount = effectiveData.categories_checked ? effectiveData.categories_checked.length : 6;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`rounded-xl p-6 flex items-start gap-4 border ${hasIssues ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                <div className={`p-2 rounded-lg ${hasIssues ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{hasIssues ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}</div>
                <div>
                    <h3 className={`text-lg font-bold ${hasIssues ? 'text-white' : 'text-white'}`}>{hasIssues ? 'Automation Integrity Warning' : 'Validation Engine Operational'}</h3>
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">{hasIssues ? "Self-validation detected anomalies in the automation harness." : `The validation engine successfully performed a self-diagnostic of ${checkCount} internal logic categories.`}</p>
                </div>
            </div>
            {isDataMissing && hasIssues && (<div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3 text-slate-400 text-sm"><AlertCircle size={18} /><span><strong>Note:</strong> Detailed technical log file could not be loaded. Displaying summary counts only.</span></div>)}
            {hasIssues && effectiveData.issues && effectiveData.issues.length > 0 && (
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Active Technical Issues</h4>
                    {effectiveData.issues.map((issue, idx) => (
                        <div key={idx} className="bg-[#121217] border border-white/5 rounded-xl p-5 flex items-start gap-4 group hover:border-amber-500/30 transition-colors">
                            <div className="p-2 bg-[#18181b] rounded-lg border border-white/5 text-slate-500 group-hover:text-amber-400"><Terminal size={18} /></div>
                            <div><div className="font-mono text-xs text-amber-400 mb-1">ISSUE #{idx + 1}</div><div className="text-slate-200 font-medium text-sm">{issue}</div></div>
                        </div>
                    ))}
                </div>
            )}
            {!hasIssues && (<div className="grid grid-cols-1 md:grid-cols-3 gap-4">{['Logic Consistency', 'Scoring Mathematics', 'Evidence Alignment', 'Command Execution', 'CLI Success Rate', 'Counting Accuracy'].map(l => <HealthCard key={l} label={l} status="PASS" />)}</div>)}
        </div>
    );
};

const HealthCard = ({ label, status }) => (<div className="bg-[#121217] border border-white/5 p-4 rounded-lg flex justify-between items-center"><span className="text-sm text-slate-400">{label}</span><span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">{status}</span></div>);

const InspectorModal = ({ ksi, onClose }) => {
    const [viewMode, setViewMode] = useState('summary');
    const codeHtml = useMemo(() => highlightCode(ksi.source_code), [ksi.source_code]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#0f1115] border border-white/10 w-full max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-white/10 bg-[#18181b] flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400"><Cpu size={24} /></div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-xl font-bold text-white font-mono">{ksi.id}</h2>
                                <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5">
                                    {['summary', 'code'].map(mode => <button key={mode} onClick={() => setViewMode(mode)} className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${viewMode === mode ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{mode}</button>)}
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 max-w-xl truncate">{ksi.title}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white p-2 hover:bg-white/5 rounded-lg"><XCircle size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-0 bg-[#0b0c10]">
                    {viewMode === 'summary' ? (
                        <div className="p-8 space-y-8">
                            <div><h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Activity size={14} className="text-indigo-400" /> Validation Logic</h3><div className="bg-[#121217] p-5 rounded-xl border border-white/5 font-sans text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{ksi.logic || "Logic definition not available."}</div></div>
                            <div><h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Terminal size={14} className="text-emerald-400" /> Live Evidence Collection</h3><div className="space-y-2">{ksi.cli_commands?.map((cmd, i) => <div key={i} className="bg-black p-4 rounded-xl border border-white/10 font-mono text-xs text-emerald-500 overflow-x-auto flex items-center"><span className="text-slate-600 mr-3 select-none">$</span>{cmd}</div>)}</div></div>
                            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3"><CheckCircle2 size={18} className="text-blue-400 mt-0.5 shrink-0" /><div><h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Passing Criteria</h3><p className="text-sm text-slate-300">{ksi.passing_criteria}</p></div></div>
                        </div>
                    ) : (
                        <div className="flex h-full flex-col">
                            <div className="bg-[#1e1e1e] text-xs font-mono text-slate-400 p-2 border-b border-white/5 flex justify-between items-center px-4"><span>File: fedramp-cvm/cli_assertion_rules.py</span><span className="text-[10px] bg-white/5 px-2 py-0.5 rounded">ReadOnly</span></div>
                            <div className="flex-1 p-6 overflow-auto bg-[#0d0d0d]"><pre className="font-mono text-sm leading-relaxed"><code className="language-python text-slate-300" dangerouslySetInnerHTML={{ __html: codeHtml }} /></pre></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- HELPERS ---
const StatCard = ({ label, value, icon: Icon, color }) => (<div className="bg-[#121217] border border-white/5 p-5 rounded-xl hover:border-white/10 transition-all"><div className="flex justify-between items-start mb-2"><div className={`p-2 rounded-lg bg-white/5 ${color}`.replace('text-', 'bg-').replace('400', '500/10')}><Icon size={20} className={color} /></div></div><div className="text-2xl font-bold text-white mb-1">{value}</div><div className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</div></div>);
const TabButton = ({ id, label, icon: Icon, active, set, count }) => (<button onClick={() => set(id)} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${active === id ? 'bg-[#27272a] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}><Icon size={16} />{label}{count > 0 && (<span className="ml-1 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{count}</span>)}</button>);
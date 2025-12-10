import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useModal } from '../../contexts/ModalContext';
import {
    ShieldCheck, AlertTriangle, FileJson, Terminal,
    GitCommit, Activity, CheckCircle2, XCircle,
    Search, Filter, ChevronDown, ChevronRight,
    Cpu, Lock, BarChart3, FileCode, History,
    Play, Eye, Server, Code, ExternalLink, RefreshCw,
    AlertCircle, BookOpen, FileText, Zap, Bug
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine
} from 'recharts';

// --- CONFIGURATION ---
const BASE_PATH = import.meta.env.BASE_URL.endsWith('/')
    ? `${import.meta.env.BASE_URL}data/`
    : `${import.meta.env.BASE_URL}/data/`;

// --- HELPER: FORCE UTC TIMEZONE ---
// Fixes "Future Date" bug by appending 'Z' if missing to force UTC interpretation
const normalizeDate = (timestamp) => {
    if (!timestamp) return new Date();
    // If it looks like ISO (has T) but missing Z and no offset (+), force UTC
    if (timestamp.includes('T') && !timestamp.endsWith('Z') && !timestamp.includes('+')) {
        return new Date(timestamp + 'Z');
    }
    return new Date(timestamp);
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
    const { isAuthenticated, login } = useAuth();
    const { openModal } = useModal();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [selectedKSI, setSelectedKSI] = useState(null);
    const [sourceInfo, setSourceInfo] = useState({ type: 'Checking...' });

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        const loadArtifacts = async () => {
            setLoading(true);
            setSourceInfo({ type: 'Secure Pipeline Injection' });
            const timestamp = Date.now();

            const safeFetch = async (filename, isText = false) => {
                const url = `${BASE_PATH}${filename}?t=${timestamp}`;
                try {
                    const res = await fetch(url);
                    if (!res.ok) return null;
                    const text = await res.text();
                    if (text.trim().toLowerCase().startsWith('<!doctype html')) return null;
                    if (isText) return text;
                    if (text.trim().startsWith('<')) return null;
                    return JSON.parse(text);
                } catch (e) { return null; }
            };

            try {
                const [report, techLog, consistency, logicDefs, fingerprint, methodologyMd, cliRegister, unified] = await Promise.all([
                    safeFetch('3pao_audit_report.json'),
                    safeFetch('technical_validation_log.json'),
                    safeFetch('validation_consistency_log.json'),
                    safeFetch('ksi_logic.json'),
                    safeFetch('fingerprint_cache.json'),
                    safeFetch('ksi-command-validation-reference.md', true),
                    safeFetch('cli_command_register.json'),
                    safeFetch('unified_ksi_validations.json')
                ]);

                setData({
                    report, techLog, consistency,
                    logicDefs: logicDefs || {},
                    fingerprint, methodologyMd, cliRegister,
                    unified
                });
            } catch (e) { console.error("Load error:", e); }
            finally { setLoading(false); }
        };
        loadArtifacts();
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <div className="-m-6 md:-m-8 min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="bg-[#121217] border border-white/10 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl relative z-10">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mx-auto mb-6">
                        <Lock size={32} className="text-rose-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Restricted Access</h2>
                    <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                        The <strong>3PAO Assessment Console</strong> contains sensitive logic definitions, source code, and unredacted audit logs.
                    </p>
                    <div className="space-y-3">
                        <button onClick={() => openModal('login')} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
                            <ShieldCheck size={18} /> Authenticate as Assessor
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-slate-500">Initializing Console...</div>;

    if (!data?.report) return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-slate-500 p-6">
            <div className="bg-rose-900/20 p-4 rounded-full mb-4 text-rose-500"><AlertTriangle size={48} /></div>
            <h3 className="text-xl font-bold text-white mb-2">Authorization Package Unavailable</h3>
            <p className="max-w-md text-center mb-6">The system could not retrieve the assessment artifacts.</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">Retry Connection</button>
        </div>
    );

    const handleInspect = (ksiId) => {
        let logic = data.logicDefs?.[ksiId] || data.logicDefs?.[ksiId.replace(/-/g, '_')];
        if (logic) { setSelectedKSI({ id: ksiId, ...logic }); }
        else { setSelectedKSI({ id: ksiId, title: "Logic Definition Not Found", logic: "No automated logic definition was found.", passing_criteria: "Manual verification required.", source_code: "# Source code not available." }); }
    };

    return (
        <div className="-m-6 md:-m-8 min-h-screen bg-[#09090b] text-slate-300 font-sans selection:bg-indigo-500/30 relative">
            <Header data={data} activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="max-w-[1600px] mx-auto px-8 py-8">
                {activeTab === 'dashboard' && <DashboardTab data={data} />}
                {activeTab === 'methodology' && <MethodologyTab markdown={data.methodologyMd} />}
                {activeTab === 'logic' && <LogicTab consistency={data.consistency} logicDefs={data.logicDefs} onInspect={handleInspect} />}
                {activeTab === 'consistency' && <ConsistencyTab data={data.consistency} />}
                {activeTab === 'health' && <TechnicalTab data={data.techLog} fallback={data.report?.technical_validation} unified={data.unified} logicDefs={data.logicDefs} onInspect={handleInspect} />}
            </main>
            {selectedKSI && <InspectorModal ksi={selectedKSI} onClose={() => setSelectedKSI(null)} />}
        </div>
    );
};

// --- TABS ---

const DashboardTab = ({ data }) => {
    const summary = data.report?.validation_summary || {};
    const tech = data.report?.technical_validation || {};
    const results = data.unified?.results || {};
    const resultKeys = Object.keys(results);
    const totalKSIs = resultKeys.length > 0 ? resultKeys.length : (summary.total_ksis || 65);
    const automatedCount = resultKeys.length > 0 ? resultKeys.length : (summary.total_ksis || 0);
    const coveragePct = totalKSIs > 0 ? Math.round((automatedCount / totalKSIs) * 100) : 0;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (coveragePct / 100) * circumference;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Pass Rate" value={summary.overall_pass_rate || "0%"} icon={CheckCircle2} color="text-emerald-400" />
                <StatCard label="Automated Controls" value={`${automatedCount}/${totalKSIs}`} icon={Cpu} color="text-indigo-400" />
                <StatCard label="Failing Controls" value={summary.failing_ksis || 0} icon={XCircle} color="text-rose-400" />
                <StatCard label="Logic Warnings" value={tech.technical_issues_found || 0} icon={AlertTriangle} color="text-amber-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-[#121217] border border-white/5 rounded-xl p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                        <Terminal size={24} className="text-purple-400" />
                        <h3 className="text-xl font-bold text-white">Executive Validation Summary</h3>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-sm mb-6">
                        This assessment console validates the <strong>logic</strong> behind the compliance, not just the output.
                        It employs a <strong>Graduated Scoring Model</strong> and automated <span className="text-emerald-400 font-mono mx-1">Evidence-as-Code</span> verification.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Consistency Score</div>
                            <div className="text-2xl font-mono text-blue-400">{data.report?.consistency_analysis?.average_consistency_score || "100.0"}%</div>
                        </div>
                        <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Assessment Scope</div>
                            <div className="text-2xl font-mono text-white">{totalKSIs} KSIs</div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#121217] border border-white/5 rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 hover:opacity-100 transition-opacity"></div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Cpu size={14} /> Automation Fidelity
                    </h3>
                    <div className="relative w-40 h-40">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="transparent" />
                            <circle cx="80" cy="80" r={radius} stroke="#6366f1" strokeWidth="12" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-white">{coveragePct}%</span>
                            <span className="text-[10px] text-indigo-400 font-bold uppercase mt-1">Automated</span>
                        </div>
                    </div>
                    <div className="mt-6 text-center"><p className="text-[10px] text-slate-500 uppercase tracking-wider">{automatedCount} of {totalKSIs} controls verified via CLI</p></div>
                </div>
            </div>
        </div>
    );
};

// --- FIX: RICH MARKDOWN RENDERER ---
const MethodologyTab = ({ markdown }) => {
    if (!markdown) return <div className="flex flex-col items-center justify-center h-64 text-slate-500 border border-white/5 rounded-xl bg-[#121217]"><FileText size={48} className="mb-4 opacity-50" /><p>Methodology reference document not found.</p></div>;

    const renderContent = () => {
        const lines = markdown.split('\n');
        const elements = [];
        let inTable = false;
        let tableRows = [];

        lines.forEach((line, idx) => {
            const trimmed = line.trim();

            // Handle Tables
            if (trimmed.startsWith('|')) {
                if (!inTable) inTable = true;
                tableRows.push(trimmed);
            } else {
                if (inTable) {
                    elements.push(renderTable(tableRows, idx));
                    inTable = false;
                    tableRows = [];
                }

                // Handle Headers
                if (trimmed.startsWith('#### ')) {
                    elements.push(<h4 key={idx} className="text-base font-bold text-emerald-400 mt-6 mb-3 flex items-center gap-2"><ShieldCheck size={16} /> {trimmed.replace('#### ', '')}</h4>);
                } else if (trimmed.startsWith('### ')) {
                    elements.push(<h3 key={idx} className="text-lg font-semibold text-blue-400 mt-8 mb-4">{trimmed.replace('### ', '')}</h3>);
                } else if (trimmed.startsWith('## ')) {
                    elements.push(<h2 key={idx} className="text-xl font-bold text-white mt-10 mb-4 border-b border-white/10 pb-2">{trimmed.replace('## ', '')}</h2>);
                }
                // Handle Lists
                else if (trimmed.startsWith('- ')) {
                    elements.push(<li key={idx} className="text-sm text-slate-300 ml-4 mb-1 list-disc marker:text-slate-500">{formatInline(trimmed.replace('- ', ''))}</li>);
                }
                // Handle Paragraphs
                else if (trimmed) {
                    elements.push(<p key={idx} className="text-sm text-slate-300 mb-3 leading-relaxed">{formatInline(trimmed)}</p>);
                }
            }
        });

        // Flush remaining table if file ends with one
        if (inTable) elements.push(renderTable(tableRows, 'end'));

        return elements;
    };

    // Helper to bold **text** and code `text`
    const formatInline = (text) => {
        const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
            if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-white/10 px-1 py-0.5 rounded text-indigo-300 font-mono text-xs">{part.slice(1, -1)}</code>;
            return part;
        });
    };

    const renderTable = (rows, key) => {
        if (rows.length < 2) return null;
        // Clean rows by splitting by | and removing empty starts/ends
        const header = rows[0].split('|').filter(c => c.trim() !== '').map(c => c.trim());
        const body = rows.slice(2).map(r => r.split('|').filter(c => c.trim() !== '').map(c => c.trim()));

        return (
            <div key={key} className="my-6 overflow-hidden rounded-lg border border-white/10 bg-[#09090b]">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#18181b] text-white">
                        <tr>{header.map((h, i) => <th key={i} className="p-3 font-bold border-b border-white/10">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {body.map((row, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                {row.map((cell, j) => (
                                    <td key={j} className="p-3 text-slate-400 text-xs">{formatInline(cell)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="bg-[#121217] border border-white/5 rounded-xl p-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/10">
                <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20"><BookOpen size={32} className="text-blue-400" /></div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Reference Methodology</h1>
                    <p className="text-slate-400 mt-1">Command Register & Validation Logic</p>
                </div>
            </div>
            <div className="prose prose-invert max-w-none text-slate-300">
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
                    <input type="text" placeholder="Search Control ID..." className="w-full bg-[#09090b] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:border-indigo-500/50 focus:outline-none" value={filter} onChange={(e) => setFilter(e.target.value)} />
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

// --- FIX: CONSISTENCY TAB (With Timezone Fix) ---
const ConsistencyTab = ({ data }) => {
    const history = data?.historical_validations || [];

    // Use normalizeDate to fix the "Future Date" bug
    const chartData = history.map(h => ({
        time: normalizeDate(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        score: h.consistency_score !== undefined ? h.consistency_score : (h.ksi_count > 0 ? (h.pass_count / h.ksi_count) * 100 : 0)
    }));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#121217] border border-white/5 rounded-xl p-6 h-80 flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-center mb-4 relative z-10">
                    <div>
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <Activity size={18} className="text-indigo-400" /> Pipeline Reliability & Consistency
                        </h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Live execution stability monitoring</p>
                    </div>
                    {chartData.length > 0 && (
                        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] font-bold text-emerald-400 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            STABLE
                        </div>
                    )}
                </div>

                <div className="flex-1 w-full min-h-0 relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.2} />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 105]} />
                            <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#818cf8' }} formatter={(value) => [`${value.toFixed(1)}%`, 'Reliability']} />
                            <ReferenceLine y={95} stroke="#10b981" strokeDasharray="3 3" label={{ value: "Target (95%)", fill: "#10b981", fontSize: 10 }} />
                            <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fill="url(#colorScore)" activeDot={{ r: 4, strokeWidth: 0, fill: '#fff' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Enhanced Recent Checks Grid (With Timezone Fix) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(data?.consistency_checks || []).slice(-3).reverse().map((check, i) => {
                    const dateObj = normalizeDate(check.timestamp);
                    return (
                        <div key={i} className="bg-[#121217] border border-white/5 p-5 rounded-xl hover:border-indigo-500/20 transition-all">
                            <div className="text-[10px] font-mono text-slate-500 mb-2">
                                {dateObj.toLocaleDateString()} <span className="mx-1">•</span> {dateObj.toLocaleTimeString()}
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-2xl font-bold text-white font-mono">{check.consistency_score.toFixed(1)}%</div>
                                    <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">Determinism Score</div>
                                </div>
                                <div className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                                    {check.infrastructure_fingerprint.substring(0, 8)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- TECHNICAL TAB ---
const TechnicalTab = ({ data, fallback, unified, logicDefs, onInspect }) => {
    const effectiveData = data || { issues: [], technical_issues_found: fallback?.technical_issues_found || 0 };
    const logIssues = effectiveData.issues || [];
    const results = unified?.results || {};
    const failedCommands = Object.values(results).filter(
        item => parseInt(item.exit_code) !== 0 && item.exit_code !== undefined
    );
    const hasIssues = effectiveData.technical_issues_found > 0 || failedCommands.length > 0 || logIssues.length > 0;

    const getCommandContext = (issueText) => {
        const match = issueText.match(/(KSI-[A-Z0-9]+)/i);
        if (match && logicDefs) {
            const ksiId = match[1];
            const def = logicDefs[ksiId] || logicDefs[ksiId.replace('-', '_')];
            if (def && def.cli_commands && def.cli_commands.length > 0) {
                return { id: ksiId, cmd: def.cli_commands[0] };
            }
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`rounded-xl p-6 flex items-start gap-4 border ${hasIssues ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                <div className={`p-2 rounded-lg ${hasIssues ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {hasIssues ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                </div>
                <div>
                    <h3 className={`text-lg font-bold ${hasIssues ? 'text-white' : 'text-white'}`}>{hasIssues ? 'Automation Integrity Warning' : 'Validation Engine Operational'}</h3>
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">{hasIssues ? "Self-validation detected anomalies or command failures in the automation harness." : `The validation engine successfully performed all internal logic checks with 0 command failures.`}</p>
                </div>
            </div>

            {logIssues.length > 0 && (
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Validation Anomalies</h4>
                    {logIssues.map((issue, idx) => {
                        const context = getCommandContext(issue);
                        return (
                            <div key={idx} className="bg-[#121217] border border-white/5 rounded-xl p-5 flex flex-col gap-4 group hover:border-amber-500/30 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-[#18181b] rounded-lg border border-white/5 text-slate-500 group-hover:text-amber-400"><Terminal size={18} /></div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div className="font-mono text-xs text-amber-400 mb-1">ISSUE #{idx + 1}</div>
                                            {context && (<button onClick={() => onInspect(context.id)} className="text-[10px] flex items-center gap-1 text-slate-500 hover:text-indigo-400 transition-colors"><Code size={12} /> Inspect {context.id}</button>)}
                                        </div>
                                        <div className="text-slate-200 font-medium text-sm">{issue}</div>
                                    </div>
                                </div>
                                {context && (<div className="ml-14 bg-black/40 p-3 rounded border border-white/5 font-mono text-xs text-slate-400"><div className="text-[9px] uppercase font-bold text-slate-600 mb-1">Associated Command Logic:</div><span className="text-rose-400/80 mr-2">$</span>{context.cmd}</div>)}
                            </div>
                        );
                    })}
                </div>
            )}

            {failedCommands.length > 0 && (
                <div className="bg-[#0f1115] border border-rose-500/20 rounded-xl overflow-hidden mt-6">
                    <div className="bg-rose-500/10 px-6 py-4 border-b border-rose-500/10 flex justify-between items-center">
                        <h3 className="text-rose-400 font-bold text-sm flex items-center gap-2"><Bug size={16} /> Command Execution Traceback</h3>
                        <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded font-bold">{failedCommands.length} ERRORS</span>
                    </div>
                    <div className="divide-y divide-white/5">
                        {failedCommands.map((fail, idx) => (
                            <div key={idx} className="p-4 hover:bg-white/5 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2"><span className="text-xs font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">{fail.ksi_id}</span><span className="text-[10px] text-rose-400 font-mono">Exit Code: {fail.exit_code}</span></div>
                                    <button onClick={() => onInspect(fail.ksi_id)} className="text-[10px] text-indigo-400 hover:text-white flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><Code size={12} /> Inspect Logic</button>
                                </div>
                                <div className="bg-black/50 p-3 rounded border border-white/5 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap"><span className="text-rose-500 mr-2">$</span>{fail.cli_command || "Command trace unavailable"}</div>
                            </div>
                        ))}
                    </div>
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

const Header = ({ data, activeTab, setActiveTab }) => (
    <header className="border-b border-white/5 bg-[#0c0c10]/80 px-8 py-6 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
                        <ShieldCheck size={20} className="text-indigo-400" />
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-tight">3PAO Assessment Console</h1>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">FedRAMP 20x</span>
                </div>
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
);
import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import {
  LayoutDashboard, ShieldAlert, User, LogOut,
  Menu, Activity, Calendar, Clock,
  FileText, RefreshCw, BarChart3, Eye, X, Shield, Layers,
  BookOpen, Code2, FileBarChart, Database, ListTodo, Lock
} from 'lucide-react';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, ReferenceLine, Cell
} from 'recharts';

import { AuthProvider, useAuth } from './hooks/useAuth';
import { DataProvider, useData } from './hooks/useData';
import { ModalProvider, useModal } from './contexts/ModalContext';
import { ModalContainer } from './components/modals';
import SettingsModal from './components/modals/SettingsModal';
import VerifyHandler from './hooks/VerifyHandler';
import { getRouteSegments, setRoute, onRouteChange } from './utils/hashRoute';

import { TrustCenterView } from './components/trust/TrustCenterView';
import { TransparencyConsole } from './components/trust/TransparencyConsole';
import { KSIFailureDashboard } from './components/trust/KSIFailureDashboard';
import { KSIGrid } from './components/findings/KSIGrid';
import MetricsDashboard from './components/trust/MetricsDashboard';
import VDRPublicMetricsDashboard from './components/trust/VDRPublicMetricsDashboard';
import { UnifiedMasDashboard } from './components/trust/UnifiedMasDashboard';
import { PoliciesTab } from './components/trust/PoliciesTab';
import { SchemaTab } from './components/trust/SchemaTab';
import { ReportsTab } from './components/trust/ReportsTab';
import { RemediationRegister } from './components/trust/RemediationRegister';
import { RemediationHeatmap } from './components/trust/RemediationHeatmap';
import { TrustCenterDataProvider } from './hooks/useTrustCenterData';

import { THEME, BASE_PATH } from './config/theme';
import './components/trust/console.css';

const TRANSITIONS = {
  default: 'transition-all duration-200 ease-out',
};

// --- UTILITIES ---
const useScrollPosition = () => {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return scrollY;
};

const getTimeElapsed = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  return 'Just now';
};

// --- MICRO COMPONENTS ---

const SidebarItem = memo(({ icon: Icon, label, badge, isActive, onClick, locked }) => (
  <button
    onClick={onClick}
    title={locked ? `${label} — requires verified federal access` : undefined}
    className={`nav ${isActive ? 'on' : ''}`}
  >
    <Icon className="ico" />
    <span style={{ flex: 1 }}>{label}</span>
    {badge && <span className="tag vi bdg" style={{ fontSize: 9, padding: '2px 6px' }}>{badge.text}</span>}
    {locked && <Lock size={12} className="lk" aria-label="Requires federal access" />}
  </button>
));

const StatsCard = memo(({ title, value, contextMetric, statusLabel, statusColor, subtitle }) => (
  <div className={`${THEME.panel} rounded-xl border ${THEME.border} p-5 group hover:border-white/20 transition-all shadow-sm`}>
    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">{title}</div>
    <div className="text-2xl font-bold text-white mb-2 tracking-tight font-mono tabular-nums">{value}</div>
    {subtitle && <div className="text-slate-500 text-[10px] mb-2 leading-snug">{subtitle}</div>}
    <div className="flex items-center justify-between text-[10px]">
      <span className={`font-medium ${statusColor}`}>{statusLabel}</span>
      <span className="text-slate-400 font-mono tabular-nums">{contextMetric}</span>
    </div>
  </div>
));

// --- DASHBOARD COMPONENTS ---

const ImpactBanner = memo(() => {
  const { metadata } = useData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }, []);

  if (!metadata) return null;

  const lastRunDate = metadata.validation_date ? new Date(metadata.validation_date) : new Date();
  const level = metadata.impact_level || 'MODERATE';
  const timeElapsed = getTimeElapsed(lastRunDate);

  const styles = {
    'HIGH': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', solid: 'bg-rose-500' },
    'MODERATE': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', solid: 'bg-amber-500' },
    'LOW': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', solid: 'bg-emerald-500' }
  }[level] || { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', solid: 'bg-blue-500' };

  return (
    <div className={`relative overflow-hidden rounded-xl border ${THEME.border} ${THEME.panel} p-0 mb-8 shadow-md group`}>
      <div className={`h-1 w-full ${styles.solid} opacity-80`} />

      <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-5 w-full md:w-auto">
          <div className={`p-3 rounded-xl border ${styles.border} ${styles.bg}`}>
            <Activity size={20} className={styles.text} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-white font-bold text-lg tracking-tight">Continuous Validation Pipeline</h2>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles.border} ${styles.bg} ${styles.text}`}>
                {level} Impact
              </span>
            </div>
            <p className="text-slate-400 text-xs flex items-center gap-2">
              Automated testing against {metadata.impact_thresholds?.min || '80%'} control baselines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-12 px-8 border-x border-white/5 hidden md:flex">
          <div className="text-center">
            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1">Pass Rate</div>
            <div className="text-white font-mono font-bold text-2xl tabular-nums">{metadata.pass_rate}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1">Control Status</div>
            <div className="text-white font-mono font-bold text-2xl flex items-center gap-2 tabular-nums">
              <span className="text-emerald-400">{metadata.passed}</span>
              <span className="text-slate-600 text-lg">/</span>
              <span className="text-slate-400 text-lg">{metadata.total_validated}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-white/5 px-2 py-1 rounded border border-white/5">
              <Calendar size={10} />
              <span className="text-slate-300 font-mono tabular-nums">
                {lastRunDate.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <Clock size={10} className="ml-1" />
              <span className="text-slate-300 font-mono tabular-nums">
                {lastRunDate.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
            </div>
            <div className="text-[9px] text-slate-500 font-mono">
              Last validated {timeElapsed}
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300 transition-colors"
          >
            <RefreshCw size={10} className={isRefreshing ? 'animate-spin' : ''} />
            Sync Now
          </button>
        </div>
      </div>
    </div>
  );
});

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = parseFloat(data.rate);
    const isPassing = value >= 90;

    return (
      <div className="bg-[#18181b]/95 border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[200px]">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/5">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">
            {new Date(data.timestamp).toLocaleString(undefined, {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
          <div className={`w-2 h-2 rounded-full ${isPassing ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`} />
        </div>

        <div className="flex items-baseline gap-2 mb-4">
          <span className={`text-3xl font-mono font-bold tracking-tight ${isPassing ? 'text-white' : 'text-rose-400'}`}>
            {value}%
          </span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Compliance</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 rounded-lg p-2 border border-white/5">
            <div className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Passing</div>
            <div className="text-emerald-400 font-mono font-bold">{data.passCount}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 border border-white/5">
            <div className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Failing</div>
            <div className="text-rose-400 font-mono font-bold">{data.failCount}</div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// --- ENHANCED CHART COMPONENT ---
const ComplianceChart = memo(() => {
  const { history, metadata } = useData();
  const [chartView, setChartView] = useState('area');

  const targetThreshold = parseFloat(metadata?.impact_thresholds?.min || 90);

  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];
    return [...history]
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(item => ({
        ...item,
        displayDate: new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        rate: parseFloat(item.compliance_rate || 0),
        passCount: parseInt(item.passed || 0),
        failCount: parseInt(item.failed || 0)
      }));
  }, [history]);

  const totalRuns = chartData.length;

  const ChartComponent = chartView === 'bar' ? BarChart : AreaChart;

  if (chartData.length === 0) {
    return (
      <div className={`${THEME.panel} rounded-xl border ${THEME.border} p-6 mb-8 shadow-sm flex items-center justify-center h-80`}>
        <div className="text-center text-slate-500">
          <BarChart3 size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Initializing Trend Data...</p>
          <p className="text-[10px] opacity-50 mt-1 uppercase tracking-wider">Awaiting pipeline history</p>
        </div>
      </div>
    );
  }

  const minRate = Math.min(...chartData.map(d => d.rate));
  const yDomainMin = Math.max(0, Math.floor(minRate - 5));

  return (
    <div className={`${THEME.panel} rounded-xl border ${THEME.border} p-6 mb-8 shadow-lg relative overflow-hidden flex flex-col h-96 group`}>
      <div className="flex justify-between items-center mb-6 relative z-10 shrink-0">
        <div>
          <h3 className="text-white font-bold text-lg mb-1 tracking-tight">Validation Velocity</h3>
          <p className="text-slate-500 text-[11px] uppercase tracking-wider font-bold">
            Real-time Compliance Trend
            <span className="text-slate-700 mx-1">•</span>
            <span className="text-blue-400 font-mono tracking-normal">{totalRuns} Historical Runs</span>
          </p>
        </div>

        <div className="flex bg-[#09090b] rounded-lg p-1 border border-white/10">
          {['area', 'bar'].map(type => (
            <button
              key={type}
              onClick={() => setChartView(type)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${chartView === type
                ? 'bg-white/10 text-white shadow-sm border border-white/5'
                : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis
              dataKey="displayDate"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 }}
              dy={10}
              minTickGap={30}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 }}
              domain={[yDomainMin, 100]}
              allowDecimals={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.5 }}
            />
            <ReferenceLine
              y={targetThreshold}
              stroke="#f59e0b"
              strokeDasharray="4 2"
              strokeWidth={1}
              label={{
                value: `TARGET (${targetThreshold}%)`,
                fill: '#f59e0b',
                fontSize: 9,
                position: 'insideTopRight',
                fontWeight: 800,
                dy: -10
              }}
            />
            {chartView === 'bar' ? (
              <Bar
                dataKey="rate"
                radius={[4, 4, 0, 0]}
                barSize={8}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.rate >= targetThreshold ? '#10b981' : '#f43f5e'}
                  />
                ))}
              </Bar>
            ) : (
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#scoreGradient)"
                activeDot={{
                  r: 6,
                  strokeWidth: 4,
                  fill: '#09090b',
                  stroke: '#10b981'
                }}
                animationDuration={1500}
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

const DashboardContent = memo(({ onOpenRegister }) => {
  const { metrics, ksis, metadata, reload } = useData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    reload().finally(() => setIsRefreshing(false));
  }, [reload]);

  const totalControls = ksis?.length || 0;
  const targetThreshold = parseFloat(metadata?.impact_thresholds?.min || 90);

  const globalStatus = metadata?.global_status || 'OPERATIONAL';
  const statusConfig = {
    OPERATIONAL: { label: 'Operational', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500', solid: 'bg-emerald-500' },
    DEGRADED: { label: 'Degraded', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500', solid: 'bg-amber-500' },
    CIRCUIT_BROKEN: { label: 'Circuit Broken', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', dot: 'bg-rose-500', solid: 'bg-rose-500' },
  }[globalStatus] || { label: 'Unknown', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', dot: 'bg-slate-500', solid: 'bg-slate-500' };

  const lastRunDate = metadata?.validation_date ? new Date(metadata.validation_date) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 slide-in-from-bottom-4">

      {/* Single unified header: status + metrics + timestamp */}
      <div className={`relative overflow-hidden rounded-xl border ${THEME.border} ${THEME.panel} shadow-md`}>
        <div className={`h-1 w-full ${statusConfig.solid} opacity-80`} />
        <div className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">

          {/* Left: Status headline */}
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl border ${statusConfig.border} ${statusConfig.bg}`}>
              <Shield size={22} className={statusConfig.color} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-0.5">
                <h2 className={`text-xl font-bold ${statusConfig.color} tracking-tight`}>{statusConfig.label}</h2>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${statusConfig.border} ${statusConfig.bg} ${statusConfig.color}`}>
                  {metadata?.impact_level || 'MODERATE'}
                </span>
              </div>
              <p className="text-slate-500 text-xs">
                {parseInt(metrics.passed)} of {totalControls} controls passing
                {lastRunDate && <> &middot; Validated {getTimeElapsed(lastRunDate)}</>}
              </p>
            </div>
          </div>

          {/* Center: Key metrics */}
          <div className="flex items-center gap-8 lg:gap-10 px-0 lg:px-6 lg:border-x border-white/5">
            <div className="text-center">
              <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1">Pass Rate</div>
              <div className="text-white font-mono font-bold text-xl tabular-nums">{metrics.score}%</div>
            </div>
            <div className="text-center">
              <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1">Target</div>
              <div className="text-white font-mono font-bold text-xl tabular-nums">{targetThreshold}%</div>
            </div>
          </div>

          {/* Right: Timestamp + sync */}
          <div className="flex items-center gap-3">
            {lastRunDate && (
              <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-white/5 px-2.5 py-1.5 rounded border border-white/5">
                <Calendar size={10} />
                <span className="font-mono tabular-nums">
                  {lastRunDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                <Clock size={10} />
                <span className="font-mono tabular-nums">
                  {lastRunDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300 transition-colors px-2.5 py-1.5 rounded border border-white/5 bg-white/5"
            >
              <RefreshCw size={10} className={isRefreshing ? 'animate-spin' : ''} />
              Sync
            </button>
          </div>
        </div>
      </div>

      {/* Remediation Backlog severity strip — only renders if backlog is published */}
      <RemediationHeatmap
        onSelectSeverity={(sev) => onOpenRegister?.(sev ? { severity: sev } : {})}
      />

      {/* KSI Grid — directly after header, no wrapper chrome */}
      <KSIGrid />

      {/* Trend chart — below the grid for context, not blocking the controls */}
      <ComplianceChart />
    </div>
  );
});

// --- APP SHELL ---

const KNOWN_VIEWS = new Set([
  'dashboard', 'trust', 'vdr', 'transparency', 'metrics',
  'failures', 'register', 'mas', 'policies', 'schema', 'reports',
]);

const VIEW_TITLES = {
  dashboard: ['Overview', 'system-wide posture'],
  trust: ['Trust Center', 'authorization, live'],
  vdr: ['VDR Security', 'vulnerability data'],
  transparency: ['Transparency Console', 'live evidence stream'],
  metrics: ['Pipeline Metrics', 'validation telemetry'],
  failures: ['Failure History', 'KSI failure timeline'],
  register: ['Remediation Register', 'open remediation'],
  mas: ['Assessment Scope', 'boundary & data flow'],
  policies: ['Policies', 'governance'],
  schema: ['Schema', 'machine-readable'],
  reports: ['Reports', 'authorization artifacts'],
};

const AppShell = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Initialize the active view from the URL hash so deep links land directly
  // (e.g. #trust/compliance/cmmc opens the Trust Center on the CMMC tab).
  const [activeView, setActiveView] = useState(() => {
    const seg = getRouteSegments()[0];
    return KNOWN_VIEWS.has(seg) ? seg : 'dashboard';
  });
  const [registerFilters, setRegisterFilters] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const scrollY = useScrollPosition();

  const { user, isAuthenticated, logout } = useAuth();
  const { openModal } = useModal();
  // Header freshness = timestamp of the last KSI continuous-validation run,
  // already loaded by DataProvider (unified_ksi_validations.json metadata).
  const { metadata } = useData();
  const freshness = metadata?.validation_date || null;

  // User-initiated navigation: update state AND the URL hash (top-level views
  // reset any deeper tab/section so the link reflects where you are).
  const navigate = useCallback((view) => {
    setActiveView(view);
    setRoute([view]);
    setMobileMenuOpen(false);
  }, []);

  // React to external hash changes (back/forward, shared deep links) without
  // rewriting the hash — preserves deeper tab/section segments.
  useEffect(() => {
    const sync = () => {
      const seg = getRouteSegments()[0];
      if (KNOWN_VIEWS.has(seg)) setActiveView(seg);
    };
    return onRouteChange(sync);
  }, []);

  // Navigate to the Remediation Register, optionally pre-filtered (e.g. heatmap click).
  const goToRegister = useCallback((filters = {}) => {
    setRegisterFilters(filters);
    navigate('register');
  }, [navigate]);

  return (
    <div className="tcx flex h-screen overflow-hidden">

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] lg:hidden animate-in fade-in duration-300"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed z-[70] h-full bg-[#080B0F] border-r border-[#1A222D] transition-transform duration-300 
          w-[280px] ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:hidden
        `}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center justify-between px-5 border-b border-[#1A222D] mb-2">
            <div className="sidehead">
              <span className="orb" />
              <div>Meridian<small>FEDRAMP&nbsp;20x&nbsp;CONSOLE</small></div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 scrollbar-none pb-[env(safe-area-inset-bottom)]">
            <div className="lbl">Platform</div>

            <SidebarItem
              icon={LayoutDashboard}
              label="Overview"
              isActive={activeView === 'dashboard'}
              onClick={() => { navigate('dashboard'); setMobileMenuOpen(false); }}
            />
            <SidebarItem
              icon={ShieldAlert}
              label="Trust Center"
              isActive={activeView === 'trust'}
              onClick={() => { navigate('trust'); setMobileMenuOpen(false); }}
            />
            <SidebarItem
              icon={Shield}
              label="VDR Security"
              locked={!isAuthenticated}
              isActive={activeView === 'vdr'}
              onClick={() => { navigate('vdr'); setMobileMenuOpen(false); }}
            />
            <SidebarItem
              icon={Eye}
              label="Transparency Console"
              locked={!isAuthenticated}
              isActive={activeView === 'transparency'}
              onClick={() => { navigate('transparency'); setMobileMenuOpen(false); }}
            />
            <SidebarItem
              icon={BarChart3}
              label="Pipeline Metrics"
              locked={!isAuthenticated}
              isActive={activeView === 'metrics'}
              onClick={() => { navigate('metrics'); setMobileMenuOpen(false); }}
            />
            <SidebarItem
              icon={Clock}
              label="Failure History"
              locked={!isAuthenticated}
              isActive={activeView === 'failures'}
              onClick={() => { navigate('failures'); setMobileMenuOpen(false); }}
            />
            <SidebarItem
              icon={ListTodo}
              label="Remediation Register"
              isActive={activeView === 'register'}
              onClick={() => goToRegister({})}
            />
            <SidebarItem
              icon={Layers}
              label="Assessment Scope"
              locked={!isAuthenticated}
              isActive={activeView === 'mas'}
              onClick={() => { navigate('mas'); setMobileMenuOpen(false); }}
            />

            <div className="lbl">Organization</div>

            <SidebarItem
              icon={BookOpen}
              label="Policies"
              locked={!isAuthenticated}
              isActive={activeView === 'policies'}
              onClick={() => { navigate('policies'); setMobileMenuOpen(false); }}
            />
            <SidebarItem
              icon={Code2}
              label="Schema"
              locked={!isAuthenticated}
              isActive={activeView === 'schema'}
              onClick={() => { navigate('schema'); setMobileMenuOpen(false); }}
            />
            <SidebarItem
              icon={FileBarChart}
              label="Reports"
              locked={!isAuthenticated}
              isActive={activeView === 'reports'}
              onClick={() => { navigate('reports'); setMobileMenuOpen(false); }}
            />

            <div className="lbl">User</div>

            {isAuthenticated ? (
              <>
                <SidebarItem icon={User} label={user.agency || 'Agency User'} />
                <SidebarItem icon={LogOut} label="Sign Out" onClick={logout} />
              </>
            ) : (
              <SidebarItem icon={FileText} label="Register Access" onClick={() => openModal('registration')} />
            )}
          </nav>

          <div className="p-4 border-t border-white/5 bg-[#09090b]">
            <button
              onClick={() => { setSettingsOpen(true); setMobileMenuOpen(false); }}
              className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-md flex items-center justify-center transition-all text-[10px] font-bold tracking-widest border border-white/5 gap-2 group uppercase"
            >
              <Database size={12} className="group-hover:rotate-90 transition-transform duration-500 text-slate-500" /> Manage Data
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 h-full bg-[#080B0F] border-r border-[#1A222D] transition-all duration-300 overflow-hidden
          ${sidebarOpen ? 'w-64' : 'w-0'}
        `}
      >
        <div className="flex flex-col h-full min-w-[256px]">
          <div className="h-16 flex items-center justify-between px-5 border-b border-[#1A222D] mb-2">
            <div className="sidehead">
              <span className="orb" />
              <div>Meridian<small>FEDRAMP&nbsp;20x&nbsp;CONSOLE</small></div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 scrollbar-none">
            <div className="lbl">Platform</div>

            <SidebarItem
              icon={LayoutDashboard}
              label="Overview"
              isActive={activeView === 'dashboard'}
              onClick={() => navigate('dashboard')}
            />
            <SidebarItem
              icon={ShieldAlert}
              label="Trust Center"
              isActive={activeView === 'trust'}
              onClick={() => navigate('trust')}
            />
            <SidebarItem
              icon={Shield}
              label="VDR Security"
              locked={!isAuthenticated}
              isActive={activeView === 'vdr'}
              onClick={() => navigate('vdr')}
            />
            <SidebarItem
              icon={Eye}
              label="Transparency Console"
              locked={!isAuthenticated}
              isActive={activeView === 'transparency'}
              onClick={() => navigate('transparency')}
            />
            <SidebarItem
              icon={BarChart3}
              label="Pipeline Metrics"
              locked={!isAuthenticated}
              isActive={activeView === 'metrics'}
              onClick={() => navigate('metrics')}
            />
            <SidebarItem
              icon={Clock}
              label="Failure History"
              locked={!isAuthenticated}
              isActive={activeView === 'failures'}
              onClick={() => navigate('failures')}
            />
            <SidebarItem
              icon={ListTodo}
              label="Remediation Register"
              isActive={activeView === 'register'}
              onClick={() => goToRegister({})}
            />
            <SidebarItem
              icon={Layers}
              label="Assessment Scope"
              locked={!isAuthenticated}
              isActive={activeView === 'mas'}
              onClick={() => navigate('mas')}
            />

            <div className="lbl">Organization</div>

            <SidebarItem
              icon={BookOpen}
              label="Policies"
              locked={!isAuthenticated}
              isActive={activeView === 'policies'}
              onClick={() => navigate('policies')}
            />
            <SidebarItem
              icon={Code2}
              label="Schema"
              locked={!isAuthenticated}
              isActive={activeView === 'schema'}
              onClick={() => navigate('schema')}
            />
            <SidebarItem
              icon={FileBarChart}
              label="Reports"
              locked={!isAuthenticated}
              isActive={activeView === 'reports'}
              onClick={() => navigate('reports')}
            />

            <div className="lbl">User</div>

            {isAuthenticated ? (
              <>
                <SidebarItem icon={User} label={user.agency || 'Agency User'} />
                <SidebarItem icon={LogOut} label="Sign Out" onClick={logout} />
              </>
            ) : (
              <SidebarItem icon={FileText} label="Register Access" onClick={() => openModal('registration')} />
            )}
          </nav>

          <div className="p-4 border-t border-white/5 bg-[#09090b]">
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-md flex items-center justify-center transition-all text-[10px] font-bold tracking-widest border border-white/5 gap-2 group uppercase"
            >
              <Database size={12} className="group-hover:rotate-90 transition-transform duration-500 text-slate-500" /> Manage Data
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Console top bar */}
        <header className="bar" style={{ zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden" style={{ color: 'var(--ash)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <Menu size={20} />
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block" style={{ color: 'var(--ash)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <Menu size={18} />
            </button>
            <div className="ttl">{(VIEW_TITLES[activeView] || ['Overview'])[0]}<small>{(VIEW_TITLES[activeView] || ['', ''])[1]}</small></div>
          </div>

          <div className="right">
            {freshness && (
              <span className="pill" title={`Last KSI continuous-validation run: ${new Date(freshness).toLocaleString()}. Key Security Indicators re-validate every 4 hours.`}>
                <span className="d" /> KSI validated · {getTimeElapsed(new Date(freshness))}
              </span>
            )}
            <span className="hidden md:inline">{isAuthenticated ? user.agency : 'Public · limited view'}</span>
            <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#1A222D,#0D1117)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)', fontSize: 12, fontWeight: 600 }}>
              {isAuthenticated ? user.agency?.charAt(0) : 'P'}
            </span>
          </div>
        </header>

        {/* Scrollable Dashboard Canvas */}
        <main className="flex-1 overflow-y-auto bg-transparent relative scrollbar-thin scrollbar-thumb-white/10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#34e0c4]/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#818cf8]/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow" style={{ animationDelay: '1s' }} />

          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto relative z-10">
            {activeView === 'dashboard' ? <DashboardContent onOpenRegister={goToRegister} /> :
              activeView === 'trust' ? <TrustCenterView /> :
              activeView === 'register' ? <RemediationRegister initialFilters={registerFilters} /> :
              !isAuthenticated ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-10 rounded-2xl border border-gray-700 max-w-lg">
                    <div className="w-16 h-16 mb-5 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                      <Lock size={28} className="text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-white text-xl mb-3">Verified federal access required</h3>
                    <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                      This section contains detailed authorization data for the service. To keep that
                      data with verified government and DoD audiences, we ask you to register with your
                      <span className="text-gray-300"> .gov / .mil email</span> before viewing it — it
                      only takes a minute, and it's how we confirm you're a federal stakeholder.
                    </p>
                    <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                      No registration is needed for our public transparency views:
                      <button onClick={() => navigate('trust')} className="text-blue-400 hover:text-blue-300 font-medium mx-1">Trust Center</button>,
                      <button onClick={() => navigate('dashboard')} className="text-blue-400 hover:text-blue-300 font-medium mx-1">Overview</button>, and the
                      <button onClick={() => navigate('register')} className="text-blue-400 hover:text-blue-300 font-medium mx-1">Remediation Register</button>.
                    </p>
                    <button
                      onClick={() => openModal('registration')}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-900/30"
                    >
                      Register with government email
                    </button>
                  </div>
                </div>
              ) :
                activeView === 'vdr' ? <VDRPublicMetricsDashboard /> :
                  activeView === 'transparency' ? <TransparencyConsole /> :
                    activeView === 'metrics' ? <MetricsDashboard /> :
                      activeView === 'failures' ? <KSIFailureDashboard /> :
                        activeView === 'mas' ? <UnifiedMasDashboard /> :
                          activeView === 'policies' ? <PoliciesTab /> :
                            activeView === 'schema' ? <SchemaTab /> :
                              activeView === 'reports' ? <ReportsTab /> : null}
          </div>
        </main>
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <VerifyHandler />
      <DataProvider>
        <TrustCenterDataProvider>
          <ModalProvider>
            <AppShell />
            <ModalContainer />
          </ModalProvider>
        </TrustCenterDataProvider>
      </DataProvider>
    </AuthProvider>
  );
}

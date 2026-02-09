import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import {
  LayoutDashboard, ShieldAlert, User, Settings, LogOut,
  Menu, Bell, Activity, Calendar, Clock,
  FileText, RefreshCw, BarChart3, Eye, X, Shield, Layers
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

import { TrustCenterView } from './components/trust/TrustCenterView';
import { TransparencyConsole } from './components/trust/TransparencyConsole';
import { KSIFailureDashboard } from './components/trust/KSIFailureDashboard';
import { KSIGrid } from './components/findings/KSIGrid';
import MetricsDashboard from './components/trust/MetricsDashboard';
import VDRPublicMetricsDashboard from './components/trust/VDRPublicMetricsDashboard';
import { UnifiedMasDashboard } from './components/trust/UnifiedMasDashboard';

// --- CONFIGURATION ---
const BASE_PATH = import.meta.env.BASE_URL.endsWith('/')
  ? `${import.meta.env.BASE_URL}data/`
  : `${import.meta.env.BASE_URL}/data/`;

// --- THEME ENGINE ---
const THEME = {
  bg: 'bg-[#09090b]',
  panel: 'bg-[#121217]',
  border: 'border-white/10',
  hover: 'hover:bg-white/5',
  active: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  text: {
    main: 'text-slate-200',
    muted: 'text-slate-500'
  }
};

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

const SidebarItem = memo(({ icon: Icon, label, badge, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`group flex items-center w-full px-3 py-3 mx-2 mb-1 text-sm font-medium rounded-md cursor-pointer ${TRANSITIONS.default} border border-transparent
    ${isActive ? THEME.active : `text-slate-400 ${THEME.hover} hover:text-slate-200`}`}
  >
    <Icon size={16} className={`mr-3 ${TRANSITIONS.default} ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
    <span className="flex-1 text-left tracking-wide">{label}</span>
    {badge && (
      <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-sm ${badge.color} border border-white/5 tracking-wider`}>
        {badge.text}
      </span>
    )}
  </button>
));

const StatsCard = memo(({ title, value, contextMetric, statusLabel, statusColor }) => (
  <div className={`${THEME.panel} rounded-xl border ${THEME.border} p-5 group hover:border-white/20 transition-all shadow-sm`}>
    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">{title}</div>
    <div className="text-2xl font-bold text-white mb-2 tracking-tight font-mono tabular-nums">{value}</div>
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

const DashboardContent = memo(() => {
  const { metrics, ksis, history, metadata } = useData();

  const totalControls = ksis?.length || 0;
  const targetThreshold = parseFloat(metadata?.impact_thresholds?.min || 90);
  const complianceTarget = `Target: ${targetThreshold}%`;

  const passingPercent = totalControls > 0 ? ((parseInt(metrics.passed) / totalControls) * 100).toFixed(1) : '0.0';
  const failingPercent = totalControls > 0 ? ((parseInt(metrics.failed) / totalControls) * 100).toFixed(1) : '0.0';
  const warningsPercent = totalControls > 0 ? ((parseInt(metrics.warning) / totalControls) * 100).toFixed(1) : '0.0';

  const complianceScore = parseFloat(metrics.score);
  const complianceStatus = complianceScore >= targetThreshold
    ? { label: 'On Target', color: 'text-emerald-400' }
    : complianceScore >= (targetThreshold - 5)
      ? { label: 'Near Target', color: 'text-amber-400' }
      : { label: 'Below Target', color: 'text-rose-400' };

  const passingStatus = parseInt(metrics.passed) > 0 ? { label: 'Active', color: 'text-emerald-400' } : { label: 'No Data', color: 'text-slate-400' };

  const failingStatus = parseInt(metrics.failed) === 0
    ? { label: 'All Clear', color: 'text-emerald-400' }
    : parseInt(metrics.failed) <= 5
      ? { label: 'Minor Issues', color: 'text-amber-400' }
      : { label: 'Needs Attention', color: 'text-rose-400' };

  const warningStatus = parseInt(metrics.warning) === 0 ? { label: 'All Clear', color: 'text-emerald-400' } : { label: 'Active', color: 'text-amber-400' };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
      <ImpactBanner />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Compliance Score"
          value={`${metrics.score}%`}
          contextMetric={complianceTarget}
          statusLabel={complianceStatus.label}
          statusColor={complianceStatus.color}
        />
        <StatsCard
          title="Passing Controls"
          value={metrics.passed}
          contextMetric={`${passingPercent}% of ${totalControls}`}
          statusLabel={passingStatus.label}
          statusColor={passingStatus.color}
        />
        <StatsCard
          title="Failing Controls"
          value={metrics.failed}
          contextMetric={`${failingPercent}% of ${totalControls}`}
          statusLabel={failingStatus.label}
          statusColor={failingStatus.color}
        />
        <StatsCard
          title="Warnings"
          value={metrics.warning}
          contextMetric={`${warningsPercent}% of ${totalControls}`}
          statusLabel={warningStatus.label}
          statusColor={warningStatus.color}
        />
      </div>
      <ComplianceChart />
      <div className={`${THEME.panel} rounded-xl border ${THEME.border} overflow-hidden shadow-sm`}>
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#09090b]">
          <div>
            <h3 className="font-bold text-white text-sm">System Controls Register</h3>
            <p className="text-slate-500 text-[10px] mt-1 font-mono uppercase tracking-wider">
              Real-time validation of {ksis.length} security controls
            </p>
          </div>
          <div className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/20 tracking-wider">
            LIVE
          </div>
        </div>
        <div className="p-0 bg-[#09090b]">
          <KSIGrid />
        </div>
      </div>
    </div>
  );
});

// --- APP SHELL ---

const AppShell = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const scrollY = useScrollPosition();

  const { user, isAuthenticated, logout } = useAuth();
  const { openModal } = useModal();

  return (
    <div className={`flex h-screen ${THEME.bg} text-slate-300 font-sans overflow-hidden selection:bg-blue-500/30`}>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] lg:hidden animate-in fade-in duration-300"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed z-[70] h-full bg-[#0c0c10] border-r border-white/5 transition-transform duration-300 
          w-[280px] ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:hidden
        `}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center justify-between px-5 border-b border-white/5 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center p-1 relative overflow-hidden">
                <img
                  src={`${import.meta.env.BASE_URL}meridian-favicon.png`}
                  alt="Meridian Logo"
                  className="w-full h-full object-contain relative z-10"
                />
                <div className="absolute inset-0 bg-blue-500/10 blur-xl"></div>
              </div>
              <div>
                <div className="font-bold text-white tracking-tight leading-none text-sm">Meridian</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5 tracking-widest uppercase">Trust Center</div>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 scrollbar-none pb-[env(safe-area-inset-bottom)]">
            <div className="px-5 pb-2 text-[10px] font-bold uppercase text-slate-600 tracking-widest font-mono">Platform</div>

            <SidebarItem
              icon={LayoutDashboard}
              label="Overview"
              isActive={activeView === 'dashboard'}
              onClick={() => { setActiveView('dashboard'); setMobileMenuOpen(false); }}
            />
            <SidebarItem
              icon={ShieldAlert}
              label="Trust Center"
              isActive={activeView === 'trust'}
              onClick={() => { setActiveView('trust'); setMobileMenuOpen(false); }}
            />
            <SidebarItem
              icon={Shield}
              label="VDR Security"
              isActive={activeView === 'vdr'}
              onClick={() => { setActiveView('vdr'); setMobileMenuOpen(false); }}
            />
            <SidebarItem
              icon={Eye}
              label="Transparency Console"
              isActive={activeView === 'transparency'}
              onClick={() => { setActiveView('transparency'); setMobileMenuOpen(false); }}
            />
            <SidebarItem
              icon={BarChart3}
              label="Pipeline Metrics"
              isActive={activeView === 'metrics'}
              onClick={() => { setActiveView('metrics'); setMobileMenuOpen(false); }}
            />
            <SidebarItem
              icon={Clock}
              label="Failure History"
              isActive={activeView === 'failures'}
              onClick={() => { setActiveView('failures'); setMobileMenuOpen(false); }}
            />
            <SidebarItem
              icon={Layers}
              label="Assessment Scope"
              isActive={activeView === 'mas'}
              onClick={() => { setActiveView('mas'); setMobileMenuOpen(false); }}
            />

            <div className="px-5 pt-8 pb-2 text-[10px] font-bold uppercase text-slate-600 tracking-widest font-mono">User</div>

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
              <Settings size={12} className="group-hover:rotate-90 transition-transform duration-500 text-slate-500" /> System Settings
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 h-full bg-[#0c0c10] border-r border-white/5 transition-all duration-300 overflow-hidden
          ${sidebarOpen ? 'w-64' : 'w-0'}
        `}
      >
        <div className="flex flex-col h-full min-w-[256px]">
          <div className="h-16 flex items-center justify-between px-5 border-b border-white/5 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center p-1 relative overflow-hidden">
                <img
                  src={`${import.meta.env.BASE_URL}meridian-favicon.png`}
                  alt="Meridian Logo"
                  className="w-full h-full object-contain relative z-10"
                />
                <div className="absolute inset-0 bg-blue-500/10 blur-xl"></div>
              </div>
              <div>
                <div className="font-bold text-white tracking-tight leading-none text-sm">Meridian</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5 tracking-widest uppercase">Trust Center</div>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 scrollbar-none">
            <div className="px-5 pb-2 text-[10px] font-bold uppercase text-slate-600 tracking-widest font-mono">Platform</div>

            <SidebarItem
              icon={LayoutDashboard}
              label="Overview"
              isActive={activeView === 'dashboard'}
              onClick={() => setActiveView('dashboard')}
            />
            <SidebarItem
              icon={ShieldAlert}
              label="Trust Center"
              isActive={activeView === 'trust'}
              onClick={() => setActiveView('trust')}
            />
            <SidebarItem
              icon={Shield}
              label="VDR Security"
              isActive={activeView === 'vdr'}
              onClick={() => setActiveView('vdr')}
            />
            <SidebarItem
              icon={Eye}
              label="Transparency Console"
              isActive={activeView === 'transparency'}
              onClick={() => setActiveView('transparency')}
            />
            <SidebarItem
              icon={BarChart3}
              label="Pipeline Metrics"
              isActive={activeView === 'metrics'}
              onClick={() => setActiveView('metrics')}
            />
            <SidebarItem
              icon={Clock}
              label="Failure History"
              isActive={activeView === 'failures'}
              onClick={() => setActiveView('failures')}
            />
            <SidebarItem
              icon={Layers}
              label="Assessment Scope"
              isActive={activeView === 'mas'}
              onClick={() => setActiveView('mas')}
            />

            <div className="px-5 pt-8 pb-2 text-[10px] font-bold uppercase text-slate-600 tracking-widest font-mono">User</div>

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
              <Settings size={12} className="group-hover:rotate-90 transition-transform duration-500 text-slate-500" /> System Settings
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Global Responsive Header */}
        <header className={`h-16 bg-[#0c0c10]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 lg:px-6 z-50 sticky top-0 ${scrollY > 0 ? 'shadow-lg shadow-black/20' : ''}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
            >
              <Menu size={22} />
            </button>

            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block text-slate-400 hover:text-white transition-colors">
              <Menu size={18} />
            </button>

            <div className="hidden sm:flex items-center px-2 py-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest font-mono">
                {activeView === 'dashboard' && 'Platform / Overview'}
                {activeView === 'trust' && 'Platform / Trust Center'}
                {activeView === 'vdr' && 'Platform / VDR Security'}
                {activeView === 'transparency' && 'Platform / Transparency Console'}
                {activeView === 'metrics' && 'Platform / Pipeline Metrics'}
                {activeView === 'failures' && 'Platform / Failure History'}
                {activeView === 'mas' && 'Platform / Assessment Scope'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 lg:space-x-6">
            <button className="relative cursor-pointer group p-2 rounded-full hover:bg-white/5 transition-colors">
              <Bell size={16} className="text-slate-400 group-hover:text-white transition-colors" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse"></span>
            </button>
            <div className="h-4 w-px bg-white/10"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <div className="text-xs font-bold text-white">{isAuthenticated ? user.agency : 'Public User'}</div>
                <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">{isAuthenticated ? 'Federal Access' : 'Limited View'}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-white font-bold text-xs shadow-inner border border-white/10 ring-1 ring-white/5">
                {isAuthenticated ? user.agency?.charAt(0) : 'P'}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Canvas */}
        <main className="flex-1 overflow-y-auto bg-[#09090b] relative scrollbar-thin scrollbar-thumb-white/10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow" style={{ animationDelay: '1s' }} />

          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto relative z-10">
            {activeView === 'dashboard' ? <DashboardContent /> :
              activeView === 'trust' ? <TrustCenterView /> :
                activeView === 'vdr' ? <VDRPublicMetricsDashboard /> :
                  activeView === 'transparency' ? <TransparencyConsole /> :
                    activeView === 'metrics' ? <MetricsDashboard /> :
                      activeView === 'failures' ? <KSIFailureDashboard /> :
                        activeView === 'mas' ? <UnifiedMasDashboard /> : null}
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
      <DataProvider>
        <ModalProvider>
          <AppShell />
          <ModalContainer />
        </ModalProvider>
      </DataProvider>
    </AuthProvider>
  );
}

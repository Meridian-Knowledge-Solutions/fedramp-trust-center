import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import {
  LayoutDashboard, ShieldAlert, User, Settings, LogOut,
  Menu, Bell, CheckCircle2, XCircle, AlertTriangle,
  Activity, TrendingUp, TrendingDown, Download, Calendar, Clock,
  Shield, Target, FileText, ChevronRight, Zap,
  Filter, RefreshCw, BarChart3, FileCheck
} from 'lucide-react';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, BarChart, Bar, Legend, ReferenceLine
} from 'recharts';

import { AuthProvider, useAuth } from './hooks/useAuth';
import { DataProvider, useData } from './hooks/useData';
import { ModalProvider, useModal } from './contexts/ModalContext';
import { ModalContainer } from './components/modals';

import { TrustCenterView } from './components/trust/TrustCenterView';
import { ThreePaoView } from './components/trust/ThreePaoView';
import { KSIGrid } from './components/findings/KSIGrid';

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

// --- MICRO COMPONENTS ---

const SidebarItem = memo(({ icon: Icon, label, badge, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`group flex items-center w-full px-3 py-2 mx-2 mb-1 text-sm font-medium rounded-md cursor-pointer ${TRANSITIONS.default} border border-transparent
    ${isActive ? THEME.active : `text-slate-400 ${THEME.hover} hover:text-slate-200`}`}
  >
    <Icon size={16} className={`mr-3 ${TRANSITIONS.default} ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
    <span className="flex-1 text-left tracking-wide">{label}</span>
    {badge && (
      <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-sm ${badge.color} border border-white/5 tracking-wider`}>
        {badge.text}
      </span>
    )}
    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 ml-2" />}
  </button>
));

const Sparkline = memo(({ data, color }) => (
  <div className="h-10 w-28 opacity-90">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="val"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={true}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
));

const StatsCard = memo(({ title, value, subtext, trend, colorClass, icon: Icon, chartData }) => {
  const isUp = trend === 'up';

  // Dynamic Sparkline Logic: Use real chartData if available, else a flat line (no fake waves)
  const sparkData = chartData && chartData.length > 0
    ? chartData
    : [{ val: 0 }, { val: 0 }];

  const hexColor = colorClass.includes('emerald') ? '#10b981' :
    colorClass.includes('rose') ? '#f43f5e' :
      colorClass.includes('amber') ? '#f59e0b' : '#3b82f6';

  return (
    <div className={`${THEME.panel} rounded-xl border ${THEME.border} p-5 relative overflow-hidden group hover:border-white/20 transition-all shadow-sm`}>
      {/* Background Gradient Effect */}
      <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`}
        style={{ backgroundImage: `linear-gradient(135deg, ${hexColor}20, transparent)` }} />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-2.5 rounded-lg bg-white/5 border border-white/5 ${colorClass}`}>
          <Icon size={18} />
        </div>
        <Sparkline data={sparkData} color={hexColor} />
      </div>

      <div className="relative z-10">
        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">{title}</div>
        <div className="text-2xl font-bold text-white mb-1 tracking-tight font-mono tabular-nums">{value}</div>
        <div className="flex items-center text-[10px] font-medium text-slate-400">
          <span className={`flex items-center ${isUp ? 'text-emerald-400' : 'text-rose-400'} mr-2 bg-white/5 px-1.5 py-0.5 rounded border border-white/5`}>
            {isUp ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
            {isUp ? 'Trending Up' : 'Attention'}
          </span>
          {subtext}
        </div>
      </div>
    </div>
  );
});

// --- DASHBOARD COMPONENTS ---

const ImpactBanner = memo(() => {
  const { metadata } = useData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Force a reload of the current view to fetch fresh data
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }, []);

  if (!metadata) return null;

  const lastRunDate = metadata.validation_date ? new Date(metadata.validation_date) : new Date();
  const level = metadata.impact_level || 'MODERATE';

  const styles = {
    'HIGH': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', solid: 'bg-rose-500' },
    'MODERATE': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', solid: 'bg-amber-500' },
    'LOW': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', solid: 'bg-emerald-500' }
  }[level] || { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', solid: 'bg-blue-500' };

  return (
    <div className={`relative overflow-hidden rounded-xl border ${THEME.border} ${THEME.panel} p-0 mb-8 shadow-md group`}>
      {/* Decorative Top Line */}
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
          <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-white/5 px-2 py-1 rounded border border-white/5">
            <Clock size={10} />
            Last Scan: <span className="text-slate-300 font-mono tabular-nums">{lastRunDate.toLocaleTimeString()}</span>
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

// --- TOOLTIP COMPONENT ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const isPassing = value >= 90;

    return (
      <div className="bg-[#18181b]/95 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 font-mono">{label}</p>
        <div className="flex items-center gap-3">
          <div className={`w-1 h-8 rounded-full ${isPassing ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-white font-mono font-bold text-xl leading-none tracking-tight">{value}%</span>
              <span className="text-[10px] text-slate-500">Compliance</span>
            </div>
            <div className={`text-[9px] font-bold mt-0.5 ${isPassing ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPassing ? 'TARGET MET' : 'BELOW TARGET'}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const ComplianceChart = memo(() => {
  const { history } = useData();
  const [chartView, setChartView] = useState('area');

  const chartData = useMemo(() => {
    if (history && history.length > 0) {
      return [...history]
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map(item => ({
          time: new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          pass: parseFloat(item.compliance_rate || 0),
          fail: 100 - parseFloat(item.compliance_rate || 0)
        }));
    }
    return [];
  }, [history]);

  const ChartComponent = chartView === 'bar' ? BarChart : AreaChart;

  if (chartData.length === 0) {
    return (
      <div className={`${THEME.panel} rounded-xl border ${THEME.border} p-6 mb-8 shadow-sm flex items-center justify-center h-72`}>
        <div className="text-center text-slate-500">
          <BarChart3 size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Initializing Trend Data...</p>
          <p className="text-[10px] opacity-50 mt-1 uppercase tracking-wider">Awaiting first history cycle</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${THEME.panel} rounded-xl border ${THEME.border} p-6 mb-8 shadow-sm relative overflow-hidden flex flex-col h-80`}>
      <div className="flex justify-between items-center mb-6 relative z-10 shrink-0">
        <div>
          <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-1">
            <BarChart3 size={16} className="text-blue-400" />
            Validation Velocity
          </h3>
          <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Rolling 30-Day Compliance Trend</p>
        </div>

        <div className="flex bg-[#09090b] rounded-md p-0.5 border border-white/5">
          {['area', 'bar'].map(type => (
            <button
              key={type}
              onClick={() => setChartView(type)}
              className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded-sm transition-all ${chartView === type
                ? 'bg-white/10 text-white shadow-sm'
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
              <linearGradient id="passGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />

            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' }}
              dy={10}
              interval="preserveStartEnd"
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#52525b', fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' }}
              domain={[0, 100]}
              ticks={[0, 50, 90, 100]}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />

            <ReferenceLine
              y={90}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
              label={{
                value: 'TARGET (90%)',
                fill: '#f59e0b',
                fontSize: 9,
                position: 'insideTopRight',
                fontWeight: 'bold',
                fillOpacity: 0.8
              }}
            />

            {chartView === 'bar' ? (
              <Bar
                dataKey="pass"
                fill="#10b981"
                radius={[2, 2, 0, 0]}
                barSize={12}
                fillOpacity={0.8}
              />
            ) : (
              <Area
                type="monotone"
                dataKey="pass"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#passGradient)"
                activeDot={{ r: 4, strokeWidth: 0, fill: '#fff', stroke: '#10b981' }}
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

const DashboardContent = memo(() => {
  const { metrics, ksis, history } = useData();

  // --- DYNAMIC SPARKLINE LOGIC ---
  const sparklines = useMemo(() => {
    if (!history || history.length === 0) return { score: [], passed: [], failed: [] };

    // Sort by date for correct trend line
    const sorted = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return {
      score: sorted.map(h => ({ val: parseFloat(h.compliance_rate || 0) })),
      passed: sorted.map(h => ({ val: parseInt(h.passed || 0) })),
      failed: sorted.map(h => ({ val: parseInt(h.failed || 0) }))
    };
  }, [history]);

  // --- DYNAMIC TREND LOGIC ---
  const getTrend = (key) => {
    if (!history || history.length < 2) return 'up';
    const last = history[history.length - 1];
    const prev = history[history.length - 2];

    // For failed count, "up" means worse, "down" means improvement
    // We strictly return the direction here, color logic handles the meaning
    if (key === 'failed') {
      return last[key] > prev[key] ? 'up' : 'down';
    }
    return last[key] >= prev[key] ? 'up' : 'down';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
      <ImpactBanner />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Compliance Score"
          value={`${metrics.score}%`}
          subtext="Target"
          trend={getTrend('compliance_rate')}
          colorClass="text-blue-400"
          icon={Activity}
          chartData={sparklines.score}
        />
        <StatsCard
          title="Passing Controls"
          value={metrics.passed}
          subtext="Active"
          trend={getTrend('passed')}
          colorClass="text-emerald-400"
          icon={CheckCircle2}
          chartData={sparklines.passed}
        />
        <StatsCard
          title="Failing Controls"
          value={metrics.failed}
          subtext="Remediation"
          trend={getTrend('failed')}
          colorClass="text-rose-400"
          icon={XCircle}
          chartData={sparklines.failed}
        />
        <StatsCard
          title="Warnings"
          value={metrics.warning}
          subtext="Low Severity"
          trend="down"
          colorClass="text-amber-400"
          icon={AlertTriangle}
          chartData={[{ val: metrics.warning }]} // No history for warnings yet
        />
      </div>

      <ComplianceChart />

      <div className={`${THEME.panel} rounded-xl border ${THEME.border} overflow-hidden shadow-sm`}>
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#09090b]">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Shield size={16} className="text-indigo-400" /> System Controls Register
            </h3>
            <p className="text-slate-500 text-[10px] mt-1 font-mono uppercase tracking-wider">
              Real-time validation of {ksis.length} security controls
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/20 flex items-center gap-2 tracking-wider">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              LIVE VALIDATION
            </div>
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
  const scrollY = useScrollPosition();

  const { user, isAuthenticated, logout } = useAuth();
  const { openModal } = useModal();

  return (
    <div className={`flex h-screen ${THEME.bg} text-slate-300 font-sans overflow-hidden selection:bg-blue-500/30`}>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-40 flex-shrink-0 w-64 h-full bg-[#0c0c10] border-r border-white/5 transition-all duration-300 transform 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-64 lg:w-0 lg:-translate-x-0 lg:overflow-hidden'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center px-5 border-b border-white/5 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center p-1 relative overflow-hidden">
                <Shield size={16} className="text-blue-500" />
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
              onClick={() => { setActiveView('dashboard'); setMobileMenuOpen(false); }}
            />
            <SidebarItem
              icon={ShieldAlert}
              label="Trust Center"
              isActive={activeView === 'trust'}
              onClick={() => { setActiveView('trust'); setMobileMenuOpen(false); }}
              badge={{ text: 'LIVE', color: 'bg-emerald-500/10 text-emerald-400' }}
            />

            <SidebarItem
              icon={FileCheck}
              label="Assessor Console"
              isActive={activeView === '3pao'}
              onClick={() => { setActiveView('3pao'); setMobileMenuOpen(false); }}
              badge={{ text: 'AUDIT', color: 'bg-purple-500/10 text-purple-400' }}
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
            <button className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-md flex items-center justify-center transition-all text-[10px] font-bold tracking-widest border border-white/5 gap-2 group uppercase">
              <Settings size={12} className="group-hover:rotate-90 transition-transform duration-500 text-slate-500" /> System Settings
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Top Header */}
        <header className={`h-16 bg-[#0c0c10]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-20 sticky top-0 ${scrollY > 0 ? 'shadow-lg shadow-black/20' : ''}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-slate-400 hover:text-white transition-colors">
              <Menu size={20} />
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block text-slate-400 hover:text-white transition-colors">
              <Menu size={18} />
            </button>

            {/* Breadcrumb */}
            <div className="hidden md:flex items-center px-3 py-1">
              <span className="text-slate-500 text-xs font-mono">
                {activeView === 'dashboard' && 'Platform / Overview'}
                {activeView === 'trust' && 'Platform / Trust Center'}
                {activeView === '3pao' && 'Platform / Assessor Console'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
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

        {/* Scrollable Canvas */}
        <main className="flex-1 overflow-y-auto bg-[#09090b] relative">
          {/* Ambient Background Effects */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

          <div className="p-6 lg:p-8 max-w-[1600px] mx-auto relative z-10">
            {activeView === 'dashboard' ? <DashboardContent /> :
              activeView === 'trust' ? <TrustCenterView /> :
                activeView === '3pao' ? <ThreePaoView /> : null}
          </div>
        </main>

      </div>
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
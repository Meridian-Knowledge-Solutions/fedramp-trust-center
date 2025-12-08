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
  LineChart, Line, BarChart, Bar, Legend
} from 'recharts';

import { AuthProvider, useAuth } from './hooks/useAuth';
import { DataProvider, useData } from './hooks/useData';
import { ModalProvider, useModal } from './contexts/ModalContext';
import { ModalContainer } from './components/modals';

import { TrustCenterView } from './components/trust/TrustCenterView';
import { ThreePaoView } from './components/trust/ThreePaoView'; // <--- NEW IMPORT
import { KSIGrid } from './components/findings/KSIGrid';

// --- THEME ENGINE ---
const THEME = {
  bg: 'bg-[#09090b]',
  panel: 'bg-[#121217]',
  border: 'border-white/5',
  hover: 'hover:bg-white/5',
  active: 'bg-blue-600/10 text-blue-400 border-blue-500/50',
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
    className={`group flex items-center w-full px-4 py-2.5 mx-3 mb-1 text-sm font-medium rounded-lg cursor-pointer ${TRANSITIONS.default} border border-transparent
    ${isActive ? THEME.active : `text-slate-400 ${THEME.hover} hover:text-slate-200 focus:bg-white/5`}
    focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
  >
    <Icon size={18} className={`mr-3 ${TRANSITIONS.default} ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
    <span className="flex-1 text-left">{label}</span>
    {badge && (
      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${badge.color} border border-white/5`}>
        {badge.text}
      </span>
    )}
    {isActive && <ChevronRight size={14} className="opacity-50 animate-pulse" />}
  </button>
));

const Sparkline = memo(({ data, color }) => (
  <div className="h-10 w-24 opacity-80">
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
  const sparkData = chartData && chartData.length > 0 ? chartData : [
    { val: 40 }, { val: 35 }, { val: 55 }, { val: 45 }, { val: 60 }, { val: 55 }, { val: 70 }
  ];

  const hexColor = colorClass.includes('emerald') ? '#10b981' :
    colorClass.includes('rose') ? '#f43f5e' :
      colorClass.includes('amber') ? '#f59e0b' : '#3b82f6';

  return (
    <div className={`${THEME.panel} rounded-xl border ${THEME.border} p-5 relative overflow-hidden group hover:border-white/10 transition-all shadow-lg`}>
      <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`}
        style={{ backgroundImage: `linear-gradient(135deg, ${hexColor}20, transparent)` }} />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-2.5 rounded-xl bg-white/5 border border-white/5 ${colorClass}`}>
          <Icon size={20} />
        </div>
        <Sparkline data={sparkData} color={hexColor} />
      </div>

      <div className="relative z-10">
        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</div>
        <div className="text-3xl font-bold text-white mb-1 tracking-tight font-mono tabular-nums">{value}</div>
        <div className="flex items-center text-xs font-medium text-slate-400">
          <span className={`flex items-center ${isUp ? 'text-emerald-400' : 'text-rose-400'} mr-2`}>
            {isUp ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
            {isUp ? '+' : '-'}{Math.floor(Math.random() * 5)}%
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
    setTimeout(() => setIsRefreshing(false), 1500);
  }, []);

  if (!metadata) return null;

  const lastRunDate = metadata.validation_date ? new Date(metadata.validation_date) : new Date();
  const nextRunDate = new Date(lastRunDate.getTime() + (6 * 60 * 60 * 1000));
  const level = metadata.impact_level || 'LOW';

  const styles = {
    'HIGH': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', solid: 'bg-rose-500' },
    'MODERATE': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', solid: 'bg-amber-500' },
    'LOW': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', solid: 'bg-emerald-500' }
  }[level] || { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', solid: 'bg-blue-500' };

  return (
    <div className={`relative overflow-hidden rounded-xl border ${THEME.border} ${THEME.panel} p-6 mb-8 hover:border-white/10 transition-colors`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.solid} opacity-60`}></div>
      <div className="absolute -right-6 -top-6 opacity-5 pointer-events-none">
        <Target size={180} className={isRefreshing ? 'animate-spin' : ''} />
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-5 w-full md:w-auto">
          <div className={`p-3 rounded-xl border ${styles.border} ${styles.bg}`}>
            <Activity size={24} className={styles.text} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-white font-bold text-lg tracking-tight">Continuous Validation Pipeline</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles.border} ${styles.bg} ${styles.text}`}>
                {level} Impact
              </span>
            </div>
            <p className="text-slate-400 text-sm flex items-center gap-2">
              Automated testing against {metadata.impact_thresholds?.min || '0%'} baselines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-12 px-8 border-x border-white/5 hidden md:flex">
          <div className="text-center">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Pass Rate</div>
            <div className="text-white font-mono font-bold text-2xl tabular-nums">{metadata.pass_rate}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Control Status</div>
            <div className="text-white font-mono font-bold text-2xl flex items-center gap-2 tabular-nums">
              <span className="text-emerald-400">{metadata.passed}</span>
              <span className="text-slate-600 text-lg">/</span>
              <span className="text-slate-400 text-lg">{metadata.total_validated}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock size={12} />
            Last Scan: <span className="text-white font-mono tabular-nums">{lastRunDate.toLocaleTimeString()}</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-500 hover:text-blue-400 transition-colors"
          >
            <RefreshCw size={10} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
});

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
    return [
      { time: 'Sep 10', pass: 92, fail: 8 },
      { time: 'Sep 11', pass: 93, fail: 7 },
      { time: 'Sep 12', pass: 91, fail: 9 },
      { time: 'Sep 13', pass: 94, fail: 6 },
      { time: 'Sep 14', pass: 95, fail: 5 },
      { time: 'Sep 15', pass: 95, fail: 5 },
      { time: 'Sep 16', pass: 96, fail: 4 }
    ];
  }, [history]);

  const ChartComponent = chartView === 'bar' ? BarChart : AreaChart;

  return (
    <div className={`${THEME.panel} rounded-xl border ${THEME.border} p-6 mb-8 shadow-lg relative overflow-hidden`}>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>

      <div className="flex justify-between items-center mb-6 relative z-10">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2 mb-1">
            <BarChart3 size={20} className="text-blue-400" />
            Validation Trends
          </h3>
          <p className="text-slate-500 text-xs">Rolling 30-day compliance velocity</p>
        </div>

        <div className="flex bg-white/5 rounded-lg p-1 border border-white/5">
          {['area', 'bar'].map(type => (
            <button
              key={type}
              onClick={() => setChartView(type)}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${chartView === type
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="passGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} domain={[80, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#09090b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: '#10b981' }}
            />
            {chartView === 'bar' ? (
              <Bar dataKey="pass" fill="#10b981" radius={[4, 4, 0, 0]} />
            ) : (
              <Area type="monotone" dataKey="pass" stroke="#10b981" strokeWidth={2} fill="url(#passGradient)" activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }} />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

const DashboardContent = memo(() => {
  const { metrics, ksis } = useData();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
      <ImpactBanner />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Compliance Score"
          value={`${metrics.score}%`}
          subtext="Target"
          trend="up"
          colorClass="text-blue-400"
          icon={Activity}
          chartData={[{ val: 88 }, { val: 89 }, { val: 90 }, { val: 91 }, { val: 92 }, { val: 94 }]}
        />
        <StatsCard
          title="Passing Controls"
          value={metrics.passed}
          subtext="Active"
          trend="up"
          colorClass="text-emerald-400"
          icon={CheckCircle2}
          chartData={[{ val: 40 }, { val: 42 }, { val: 45 }, { val: 45 }, { val: 48 }, { val: 50 }]}
        />
        <StatsCard
          title="Failing Controls"
          value={metrics.failed}
          subtext="Remediation"
          trend="down"
          colorClass="text-rose-400"
          icon={XCircle}
          chartData={[{ val: 5 }, { val: 4 }, { val: 6 }, { val: 3 }, { val: 2 }, { val: 1 }]}
        />
        <StatsCard
          title="Warnings"
          value={metrics.warning}
          subtext="Low Severity"
          trend="down"
          colorClass="text-amber-400"
          icon={AlertTriangle}
          chartData={[{ val: 10 }, { val: 12 }, { val: 11 }, { val: 9 }, { val: 8 }, { val: 5 }]}
        />
      </div>

      <ComplianceChart />

      <div className={`${THEME.panel} rounded-xl border ${THEME.border} overflow-hidden shadow-lg`}>
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div>
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <Shield size={18} className="text-indigo-400" /> System Controls Register
            </h3>
            <p className="text-slate-500 text-xs mt-1">Real-time validation status of all {ksis.length} security controls</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              LIVE VALIDATION
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#09090b]">
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
        className={`fixed lg:relative z-40 flex-shrink-0 w-72 h-full bg-[#0c0c10] border-r border-white/5 transition-all duration-300 transform 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-72 lg:w-0 lg:-translate-x-0 lg:overflow-hidden'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center px-6 border-b border-white/5 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20 relative group">
                <Shield size={16} className="text-white relative z-10" />
                <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
              </div>
              <div>
                <div className="font-bold text-white tracking-tight leading-none text-sm">Meridian</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5 tracking-widest uppercase">Trust Center</div>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-white/10">
            <div className="px-6 pb-2 text-[10px] font-bold uppercase text-slate-500 tracking-widest font-mono">Platform</div>

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
              badge={{ text: 'LIVE', color: 'bg-emerald-500/20 text-emerald-400' }}
            />

            <SidebarItem
              icon={FileCheck}
              label="Assessor Console"
              isActive={activeView === '3pao'}
              onClick={() => { setActiveView('3pao'); setMobileMenuOpen(false); }}
              badge={{ text: 'AUDIT', color: 'bg-purple-500/20 text-purple-400' }}
            />

            <div className="px-6 pt-8 pb-2 text-[10px] font-bold uppercase text-slate-500 tracking-widest font-mono">User</div>

            {isAuthenticated ? (
              <>
                <SidebarItem icon={User} label={user.agency || 'Agency User'} />
                <SidebarItem icon={LogOut} label="Sign Out" onClick={logout} />
              </>
            ) : (
              <SidebarItem icon={FileText} label="Register Access" onClick={() => openModal('registration')} />
            )}
          </nav>

          <div className="p-4 border-t border-white/5 bg-white/[0.02]">
            <button className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg flex items-center justify-center transition-all text-xs font-bold tracking-wide border border-white/5 gap-2 group">
              <Settings size={14} className="group-hover:rotate-90 transition-transform duration-500" /> SYSTEM SETTINGS
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Top Header */}
        <header className={`h-16 bg-[#0c0c10]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 lg:px-8 z-20 sticky top-0 ${scrollY > 0 ? 'shadow-lg' : ''}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-slate-400 hover:text-white transition-colors">
              <Menu size={24} />
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block text-slate-400 hover:text-white transition-colors">
              <Menu size={20} />
            </button>

            {/* Breadcrumb */}
            <div className="hidden md:flex items-center px-3 py-1.5">
              <span className="text-slate-500 text-xs font-mono">
                {activeView === 'dashboard' && 'Platform / Overview'}
                {activeView === 'trust' && 'Platform / Trust Center'}
                {activeView === '3pao' && 'Platform / Assessor Console'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button className="relative cursor-pointer group p-2 rounded-lg hover:bg-white/5 transition-colors">
              <Bell size={18} className="text-slate-400 group-hover:text-white transition-colors" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse"></span>
            </button>
            <div className="h-6 w-px bg-white/10"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <div className="text-xs font-bold text-white">{isAuthenticated ? user.agency : 'Public User'}</div>
                <div className="text-[10px] text-slate-500 font-mono">{isAuthenticated ? 'Federal Access' : 'Limited View'}</div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-white font-bold text-xs shadow-inner border border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"></div>
                {isAuthenticated ? user.agency?.charAt(0) : 'P'}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Canvas */}
        <main className="flex-1 overflow-y-auto bg-[#09090b] relative">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow" style={{ animationDelay: '1s' }} />

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
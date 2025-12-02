import React, { useState } from 'react';
import {
  LayoutDashboard, ShieldAlert, User, Settings, LogOut,
  Menu, Bell, Search, CheckCircle2, XCircle, AlertTriangle,
  Activity, TrendingUp, TrendingDown, Download, Calendar, Clock,
  Shield, Target, FileText
} from 'lucide-react';

// --- LOGIC IMPORTS ---
import { AuthProvider, useAuth } from './hooks/useAuth';
import { DataProvider, useData } from './hooks/useData';
import { ModalProvider, useModal } from './contexts/ModalContext';
import { ModalContainer } from './components/modals';

// --- VIEW IMPORTS ---
import { TrustCenterView } from './components/trust/TrustCenterView';
import { KSIGrid } from './components/findings/KSIGrid';

// --- UI COMPONENTS ---

const SidebarItem = ({ icon: Icon, label, badge, isActive, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center px-6 py-3 text-sm font-medium cursor-pointer transition-colors duration-200
    ${isActive ? 'text-white bg-gray-800 border-l-4 border-blue-500' : 'text-gray-400 hover:text-white hover:bg-gray-800 border-l-4 border-transparent'}`}
  >
    <Icon size={18} className="mr-3" />
    <span className="flex-1">{label}</span>
    {badge && (
      <span className={`px-2 py-0.5 text-xs rounded-full ${badge.color}`}>
        {badge.text}
      </span>
    )}
  </div>
);

// UPDATED: Replaced CoreUI logo with Meridian Branding
const SidebarHeader = () => (
  <div className="h-16 flex items-center px-6 bg-gray-900 border-b border-gray-800">
    <div className="flex items-center font-bold text-xl text-white tracking-tight gap-3">
      {/* Using the uploaded favicon as the logo */}
      <img
        src={`${import.meta.env.BASE_URL}meridian-favicon.png`}
        alt="Meridian Logo"
        className="w-8 h-8 rounded"
        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
      />
      {/* Fallback Icon if image fails to load */}
      <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center hidden">
        <Shield size={18} className="text-white" />
      </div>

      <span>Meridian Trust</span>
    </div>
  </div>
);

const StatsCard = ({ title, value, subtext, trend, color, icon: Icon, chartPoints }) => {
  const isUp = trend === 'up';
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 flex flex-col justify-between h-36 relative">
      <div className="p-4 z-10">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-gray-400 text-sm font-semibold mb-1">{title}</div>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className={`text-xs flex items-center ${isUp ? 'text-green-400' : 'text-red-400'}`}>
              <span className="mr-1">{subtext}</span>
              {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            </div>
          </div>
          <div className={`p-2 rounded-lg bg-opacity-20 ${color.replace('text-', 'bg-')}`}>
            <Icon size={20} className={color} />
          </div>
        </div>
      </div>

      {/* Mini Chart Background */}
      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20">
        <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
          <path
            d={`M0,40 ${chartPoints} V40 H0 Z`}
            fill="currentColor"
            className={color}
          />
        </svg>
      </div>
    </div>
  );
};

// Sleek System Context Bar (Impact Banner)
const ImpactBanner = () => {
  const { metadata } = useData();

  // Verify we're loading live data
  React.useEffect(() => {
    if (metadata) {
      console.log('📊 DATA VERIFICATION CHECK (Impact Banner):');
      console.log('  Validation Date:', metadata.validation_date);
      console.log('  Time Since Validation:', metadata.validation_date
        ? `${Math.round((Date.now() - new Date(metadata.validation_date).getTime()) / 60000)} minutes ago`
        : 'N/A'
      );
      console.log('  Pass Rate:', metadata.pass_rate);
      console.log('  Total Validated:', metadata.total_validated);
      console.log('  Passed:', metadata.passed);
      console.log('  Failed:', metadata.failed);

      // Alert if data seems stale (older than 48 hours)
      if (metadata.validation_date) {
        const ageInHours = (Date.now() - new Date(metadata.validation_date).getTime()) / 3600000;
        if (ageInHours > 48) {
          console.warn(`⚠️ WARNING: Validation data is ${Math.round(ageInHours)} hours old - may be stale!`);
        } else {
          console.log(`✅ Data freshness: ${Math.round(ageInHours)} hours old (within acceptable range)`);
        }
      }
    }
  }, [metadata]);

  if (!metadata) return null;

  const lastRunDate = metadata.validation_date ? new Date(metadata.validation_date) : new Date(Date.now() - 86400000);
  const nextRunDate = new Date(lastRunDate.getTime() + (6 * 60 * 60 * 1000));

  // Calculate data age for display
  const dataAgeMinutes = Math.round((Date.now() - lastRunDate.getTime()) / 60000);

  const formatDate = (date) => date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
  });

  // Theme config based on level
  const level = metadata.impact_level || 'LOW';
  const styles = {
    'HIGH': { border: 'border-red-500', badge: 'bg-red-500/20 text-red-400', icon: 'text-red-500' },
    'MODERATE': { border: 'border-yellow-500', badge: 'bg-yellow-500/20 text-yellow-400', icon: 'text-yellow-500' },
    'LOW': { border: 'border-green-500', badge: 'bg-green-500/20 text-green-400', icon: 'text-green-500' }
  }[level] || { border: 'border-blue-500', badge: 'bg-blue-500/20 text-blue-400', icon: 'text-blue-500' };

  return (
    <div className={`bg-gray-800 rounded-lg shadow-lg border-l-4 ${styles.border} border-y border-r border-gray-700 p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4`}>

      {/* Left: Identity & Status */}
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className={`p-2 rounded-lg bg-gray-700/50 ${styles.icon}`}>
          <Shield size={24} />
        </div>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-white font-bold text-base">Validation Pipeline</h2>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}>
              {level} Impact
            </span>
          </div>
          <p className="text-gray-400 text-xs flex items-center gap-2">
            <Target size={12} />
            Targeting {metadata.impact_thresholds?.min || '0%'} Min / {metadata.impact_thresholds?.excellent || '0%'} Exc
          </p>
        </div>
      </div>

      {/* Middle: Metrics */}
      <div className="hidden md:flex items-center gap-8 px-8 border-x border-gray-700/50">
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase font-bold">Pass Rate</div>
          <div className="text-white font-mono font-bold text-lg">{metadata.pass_rate}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase font-bold">Controls</div>
          <div className="text-white font-mono font-bold text-lg">
            <span className="text-green-500">{metadata.passed}</span>
            <span className="text-gray-600 mx-1">/</span>
            <span className="text-red-500">{metadata.failed}</span>
          </div>
        </div>
      </div>

      {/* Right: Timings */}
      <div className="flex flex-col items-end gap-1 text-xs text-gray-500 w-full md:w-auto text-right">
        <div className="flex items-center gap-2 justify-end">
          Last Run: <span className="text-gray-300 font-mono">{formatDate(lastRunDate)}</span> <Clock size={12} />
        </div>
        {dataAgeMinutes !== null && (
          <div className={`flex items-center gap-2 justify-end text-[10px] font-medium ${dataAgeMinutes < 120 ? 'text-green-400' :
              dataAgeMinutes < 1440 ? 'text-yellow-400' :
                'text-red-400'
            }`}>
            Data Age: {dataAgeMinutes < 60
              ? `${dataAgeMinutes}m`
              : dataAgeMinutes < 1440
                ? `${Math.round(dataAgeMinutes / 60)}h`
                : `${Math.round(dataAgeMinutes / 1440)}d`
            }
            {dataAgeMinutes >= 1440 && ' ⚠️'}
          </div>
        )}
        <div className="flex items-center gap-2 justify-end">
          Next Run: <span className="text-gray-300 font-mono">{formatDate(nextRunDate)}</span> <Calendar size={12} />
        </div>
      </div>
    </div>
  );
};

const MainChart = () => {
  const { history } = useData();

  if (!history || history.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 mb-6 h-64 flex items-center justify-center text-gray-500">
        Waiting for historical data...
      </div>
    );
  }

  const dataPoints = history;
  const width = 1000;
  const height = 200;
  const minRate = 60;
  const maxRate = 100;

  const points = dataPoints.map((point, index) => {
    const x = (index / (dataPoints.length - 1)) * width;
    const rate = parseFloat(point.compliance_rate);
    const normalizedRate = Math.max(0, (rate - minRate) / (maxRate - minRate));
    const y = height - (normalizedRate * height);
    return `${x},${y}`;
  }).join(' ');

  const fillPath = `M 0,${height} ${points.split(' ').map((p, i) => `L ${p}`).join(' ')} L ${width},${height} Z`;
  const linePath = `M ${points.split(' ').map(p => p.replace(',', ' ')).join(' L ')}`;

  const labels = dataPoints.filter((_, i) => i % Math.ceil(dataPoints.length / 6) === 0).map(p => {
    const d = new Date(p.timestamp);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
  });

  const currentRate = parseFloat(dataPoints[dataPoints.length - 1].compliance_rate);
  const startRate = parseFloat(dataPoints[0].compliance_rate);
  const trend = currentRate - startRate;

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h2 className="text-lg font-bold text-white">Compliance Trend</h2>
          <div className="text-gray-400 text-sm">
            Last {dataPoints.length} Runs |
            <span className={trend >= 0 ? "text-green-500 ml-1" : "text-red-500 ml-1"}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}% Trend
            </span>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="p-2 text-blue-500 hover:bg-gray-700 rounded-md transition-colors">
            <Download size={18} />
          </button>
        </div>
      </div>

      <div className="w-full h-64 relative">
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="gradientChart" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="#374151" strokeDasharray="4" />
          <line x1="0" y1={height * 0.50} x2={width} y2={height * 0.50} stroke="#374151" strokeDasharray="4" />
          <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="#374151" strokeDasharray="4" />
          <path d={fillPath} fill="url(#gradientChart)" />
          <path d={linePath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="absolute top-0 right-0 h-full flex flex-col justify-between text-xs text-gray-500 pointer-events-none py-1">
          <span>100%</span>
          <span>90%</span>
          <span>80%</span>
          <span>70%</span>
          <span>60%</span>
        </div>
      </div>
      <div className="flex justify-between mt-4 text-xs text-gray-400 px-0 border-t border-gray-700 pt-2">
        {labels.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
    </div>
  );
};

const DashboardContent = () => {
  const { metrics, ksis } = useData();

  return (
    <>
      <ImpactBanner />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Compliance Score"
          value={`${metrics.score}%`}
          subtext="+2.4% Target"
          trend="up"
          color="text-blue-500"
          icon={Activity}
          chartPoints="M0,35 L20,30 L40,38 L60,15 L80,25 L100,10"
        />
        <StatsCard
          title="Passed Controls"
          value={metrics.passed}
          subtext="Active Validations"
          trend="up"
          color="text-green-500"
          icon={CheckCircle2}
          chartPoints="M0,40 L20,35 L40,20 L60,25 L80,15 L100,5"
        />
        <StatsCard
          title="Failed Controls"
          value={metrics.failed}
          subtext="Requires Action"
          trend="down"
          color="text-red-500"
          icon={XCircle}
          chartPoints="M0,30 L25,35 L50,15 L75,20 L100,5"
        />
        <StatsCard
          title="Low Risk Items"
          value={metrics.warning}
          subtext="60 Day Tracking"
          trend="down"
          color="text-yellow-500"
          icon={AlertTriangle}
          chartPoints="M0,20 L20,25 L40,30 L60,35 L80,38 L100,40"
        />
      </div>

      <MainChart />

      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden mb-6">
        <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-800">
          <div>
            <h3 className="font-bold text-white text-lg">System Controls</h3>
            <p className="text-gray-400 text-sm">{ksis.length} Total Validations</p>
          </div>
        </div>
        <div className="p-0 bg-[#151618]">
          <div className="p-6">
            <KSIGrid />
          </div>
        </div>
      </div>
    </>
  );
};

const AppShell = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');

  const { user, isAuthenticated, logout } = useAuth();
  const { openModal } = useModal();

  return (
    <div className="flex h-screen bg-[#151618] text-gray-300 font-sans overflow-hidden">

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-30 flex-shrink-0 w-64 h-full bg-gray-900 border-r border-gray-800 transition-all duration-300 transform 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-64 lg:w-0 lg:-translate-x-0 lg:overflow-hidden'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          <SidebarHeader />
          <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-800">
            <div className="px-6 pt-2 pb-2 text-xs font-bold uppercase text-gray-500 tracking-wider">Platform</div>

            <SidebarItem
              icon={LayoutDashboard}
              label="Dashboard"
              isActive={activeView === 'dashboard'}
              onClick={() => setActiveView('dashboard')}
            />
            <SidebarItem
              icon={ShieldAlert}
              label="Trust Center"
              isActive={activeView === 'trust'}
              onClick={() => setActiveView('trust')}
            />

            <div className="px-6 pt-6 pb-2 text-xs font-bold uppercase text-gray-500 tracking-wider">Account</div>

            {isAuthenticated ? (
              <>
                <SidebarItem icon={User} label={user.agency} />
                <SidebarItem icon={LogOut} label="Logout" onClick={logout} />
              </>
            ) : (
              <SidebarItem icon={FileText} label="Register Access" onClick={() => openModal('registration')} />
            )}
          </div>
          <div className="p-4 border-t border-gray-800">
            <button className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg flex items-center justify-center transition-colors text-sm">
              <Settings size={16} className="mr-2" /> Settings
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 lg:px-6 shadow-sm z-10">
          <div className="flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 mr-2 text-gray-400 hover:text-white">
              <Menu size={24} />
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block p-2 mr-4 text-gray-400 hover:text-white">
              <Menu size={24} />
            </button>
            <div className="hidden md:flex text-gray-400 text-sm font-medium">
              <span className="text-white">Meridian Trust</span>
              <span className="mx-2">/</span>
              <span>{activeView === 'trust' ? 'Trust Center' : 'Compliance Dashboard'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden sm:block">
              <Bell size={20} className="text-gray-400 hover:text-white cursor-pointer" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-gray-900 transform translate-x-1/2 -translate-y-1/2"></span>
            </div>
            <div className="h-6 w-px bg-gray-700 hidden sm:block mx-2"></div>
            <div className="flex items-center cursor-pointer gap-3">
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold text-white">{isAuthenticated ? user.agency : 'Public User'}</div>
                <div className="text-xs text-gray-500">{isAuthenticated ? 'Federal Access' : 'Limited View'}</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {isAuthenticated ? user.agency.charAt(0) : 'P'}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin scrollbar-thumb-gray-800">
          {activeView === 'dashboard' ? <DashboardContent /> : (
            <div className="bg-gray-100 rounded-xl p-6 min-h-full shadow-sm">
              <TrustCenterView />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="h-12 bg-gray-900 border-t border-gray-800 flex items-center justify-between px-6 text-xs text-gray-500 mt-auto">
          <div>
            <a href="#" className="text-blue-500 hover:underline">Meridian Knowledge Solutions</a> © 2025
          </div>
          <div>
            FedRAMP 20x Trust Center
          </div>
        </footer>
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
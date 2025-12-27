import React, { useState } from 'react';
import { useData } from '../../hooks/useData';
import {
  Shield, Server, Database, Globe,
  ArrowDown, ChevronDown, ChevronRight, Activity
} from 'lucide-react';

const ZoneCard = ({ zoneId, data, isOpen, onToggle }) => {
  if (!data || !data.policy) return null;

  const { policy, assets = [] } = data;

  const riskColors = {
    'High': { text: 'text-rose-400', border: 'border-rose-500/30' },
    'Critical': { text: 'text-rose-400', border: 'border-rose-500/30' },
    'Medium': { text: 'text-amber-400', border: 'border-amber-500/30' },
    'Mod': { text: 'text-amber-400', border: 'border-amber-500/30' },
    'Low': { text: 'text-emerald-400', border: 'border-emerald-500/30' }
  };

  const colors = riskColors[policy.risk] || { text: 'text-slate-400', border: 'border-white/10' };

  const getZoneIcon = () => {
    if (zoneId.includes('entry')) return <Globe size={18} />;
    if (zoneId.includes('training') || zoneId.includes('processing')) return <Activity size={18} />;
    if (zoneId.includes('infrastructure')) return <Database size={18} />;
    return <Shield size={18} />;
  };

  return (
    <div className={`bg-[#18181b] border ${colors.border} rounded-xl overflow-hidden transition-all duration-200 mb-4`}>
      {/* Header - Always Visible */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02]"
        onClick={() => onToggle(zoneId)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg bg-black/40 border border-white/10 ${colors.text}`}>
            {getZoneIcon()}
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">{policy.title}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-[10px]">{policy.omb_type}</span>
              <span>•</span>
              <span>{assets.length} resource{assets.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-500 uppercase font-medium">Risk</div>
            <div className={`text-xs font-bold ${colors.text}`}>{policy.risk}</div>
          </div>
          {isOpen ?
            <ChevronDown className="text-slate-500" size={18} /> :
            <ChevronRight className="text-slate-500" size={18} />
          }
        </div>
      </div>

      {/* Expanded Details */}
      {isOpen && (
        <div className="px-4 pb-4 border-t border-white/5 bg-black/10 pt-4">
          <div className="text-xs text-slate-400 mb-3">{policy.definition}</div>

          {/* Asset Grid - Max 12 visible */}
          {assets.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
              {assets.slice(0, 12).map((asset, idx) => (
                <div key={idx} className="bg-[#27272a] p-2 rounded border border-white/5 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></div>
                  <div className="text-[11px] text-white font-medium truncate">{asset.name}</div>
                </div>
              ))}
              {assets.length > 12 && (
                <div className="bg-[#27272a] p-2 rounded border border-white/5 flex items-center justify-center">
                  <span className="text-[11px] text-slate-400 font-medium">+{assets.length - 12} more</span>
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          {policy.controls && policy.controls.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {policy.controls.map((ctrl, i) => (
                <span key={i} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-mono">
                  {ctrl}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const LiveMasDashboard = () => {
  const { masData } = useData();
  const [expandedZones, setExpandedZones] = useState([]);

  // Loading state
  if (!masData) {
    return (
      <div className="p-8 text-center border border-white/10 rounded-xl bg-[#121217]">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-12 w-12 bg-white/5 rounded-full"></div>
          <div className="text-xs text-slate-500">Loading boundary data...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (!masData.zones || Object.keys(masData.zones).length === 0) {
    return (
      <div className="p-8 text-center border border-white/10 rounded-xl bg-[#121217]">
        <div className="text-sm text-slate-400">No boundary data available</div>
      </div>
    );
  }

  const toggleZone = (id) => {
    setExpandedZones(prev =>
      prev.includes(id) ? prev.filter(z => z !== id) : [...prev, id]
    );
  };

  // Calculate totals
  const totalResources = Object.values(masData.zones).reduce(
    (sum, zone) => sum + ((zone.assets && zone.assets.length) || 0), 0
  );
  const zoneCount = Object.keys(masData.zones).length;

  // Simple drift indicator (no panic messages)
  const driftCount = masData.drift?.count || 0;
  const hasDrift = masData.drift?.detected && driftCount > 0;

  return (
    <div className="space-y-6">

      {/* Clean Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/30 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <Shield className="text-blue-400" size={22} />
          <div>
            <h2 className="text-white font-bold text-sm">Authorization Boundary</h2>
            <div className="text-xs text-blue-300/80">
              {masData.meta?.compliance_ver || 'FedRAMP 20x'} • {masData.meta?.scope || 'MODERATE'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Subtle variance indicator - no panic */}
          {hasDrift && (
            <span className="text-[10px] font-mono text-amber-400 bg-amber-900/20 px-2 py-1 rounded border border-amber-500/30">
              {driftCount} variance{driftCount !== 1 ? 's' : ''}
            </span>
          )}
          <span className="text-xs font-mono text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-500/30">
            ACTIVE
          </span>
        </div>
      </div>

      {/* Zone Cards */}
      <div className="space-y-1">
        {Object.entries(masData.zones).map(([zoneKey, zoneData], index, array) => (
          <React.Fragment key={zoneKey}>
            <ZoneCard
              zoneId={zoneKey}
              data={zoneData}
              isOpen={expandedZones.includes(zoneKey)}
              onToggle={toggleZone}
            />
            {index < array.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowDown className="text-slate-700" size={16} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Clean Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/5">
        <div className="bg-[#18181b] p-3 rounded-lg border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase font-medium mb-1">Resources</div>
          <div className="text-xl font-bold text-white">{totalResources}</div>
        </div>
        <div className="bg-[#18181b] p-3 rounded-lg border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase font-medium mb-1">Zones</div>
          <div className="text-xl font-bold text-white">{zoneCount}</div>
        </div>
        <div className="bg-[#18181b] p-3 rounded-lg border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase font-medium mb-1">Status</div>
          <div className="text-sm font-bold text-emerald-400">Authorized</div>
        </div>
        <div className="bg-[#18181b] p-3 rounded-lg border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase font-medium mb-1">ID</div>
          <div className="text-xs font-mono text-slate-400">{masData.fingerprint?.slice(0, 8) || 'N/A'}</div>
        </div>
      </div>

    </div>
  );
};
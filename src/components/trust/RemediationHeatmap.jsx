/**
 * Remediation Heatmap — single-row severity strip for the dashboard header.
 * Reads remediation_backlog.json severity_counts. Each tile navigates to the
 * Remediation Register filtered by that severity.
 */
import React from 'react';
import { useData } from '../../hooks/useData';
import { AlertOctagon, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const TILES = [
  { key: 'CRITICAL', label: 'Critical', icon: AlertOctagon, dot: 'bg-red-500',    text: 'text-red-400',    bg: 'bg-red-500/5',    border: 'border-red-500/20',    hover: 'hover:border-red-500/40' },
  { key: 'HIGH',     label: 'High',     icon: AlertTriangle, dot: 'bg-orange-500', text: 'text-orange-400', bg: 'bg-orange-500/5', border: 'border-orange-500/20', hover: 'hover:border-orange-500/40' },
  { key: 'MEDIUM',   label: 'Medium',   icon: AlertCircle,   dot: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/5', border: 'border-yellow-500/20', hover: 'hover:border-yellow-500/40' },
  { key: 'LOW',      label: 'Low',      icon: Info,          dot: 'bg-blue-500',   text: 'text-blue-400',   bg: 'bg-blue-500/5',   border: 'border-blue-500/20',   hover: 'hover:border-blue-500/40' },
];

export const RemediationHeatmap = ({ onSelectSeverity }) => {
  const { backlog } = useData();
  if (!backlog) return null;

  const counts = backlog.severity_counts || {};
  const total = backlog.total_items ?? Object.values(counts).reduce((a, b) => a + (b || 0), 0);

  return (
    <div className="border border-white/5 rounded-xl bg-[#0c0c10] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Remediation Backlog</span>
          <span className="text-[10px] text-slate-500">{total} actionable</span>
        </div>
        <button
          onClick={() => onSelectSeverity?.(null)}
          className="text-[10px] font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300"
        >
          Open Register →
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/5">
        {TILES.map(tile => {
          const Icon = tile.icon;
          const count = counts[tile.key] ?? 0;
          return (
            <button
              key={tile.key}
              onClick={() => onSelectSeverity?.(tile.key)}
              className={`p-4 transition-colors text-left ${tile.bg} ${tile.border} ${tile.hover} border-0 group`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${tile.dot}`} />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-300">{tile.label}</span>
                </div>
                <Icon size={12} className={`${tile.text} opacity-60`} />
              </div>
              <div className={`text-2xl font-black tabular-nums ${count > 0 ? tile.text : 'text-slate-600'}`}>
                {count}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RemediationHeatmap;

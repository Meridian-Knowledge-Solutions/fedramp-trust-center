/**
 * Remediation Heatmap — single-row severity strip for the dashboard header.
 * Reads remediation_backlog.json severity_counts. Each tile navigates to the
 * Remediation Register filtered by that severity.
 */
import React from 'react';
import { useData } from '../../hooks/useData';

// Severity → console "vbox big" tone: critical/high = red, medium = amber, low = teal.
const TILES = [
  { key: 'CRITICAL', label: 'Critical', tone: 'r' },
  { key: 'HIGH',     label: 'High',     tone: 'r' },
  { key: 'MEDIUM',   label: 'Medium',   tone: 'h' },
  { key: 'LOW',      label: 'Low',      tone: 'z' },
];

export const RemediationHeatmap = ({ onSelectSeverity }) => {
  const { backlog } = useData();
  if (!backlog) return null;

  const counts = backlog.severity_counts || {};
  const total = backlog.total_items ?? Object.values(counts).reduce((a, b) => a + (b || 0), 0);

  return (
    <div className="panel">
      <div className="ph">
        <h4>Remediation backlog</h4>
        <span className="map" style={{ cursor: 'pointer' }} onClick={() => onSelectSeverity?.(null)}>
          {total} actionable · open register →
        </span>
      </div>
      <div className="g4" style={{ padding: 12 }}>
        {TILES.map(tile => {
          const count = counts[tile.key] ?? 0;
          // zero counts read as "clear" → teal, regardless of severity.
          const tone = count > 0 ? tile.tone : 'z';
          return (
            <button
              key={tile.key}
              onClick={() => onSelectSeverity?.(tile.key)}
              className="vbox"
              style={{ cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
            >
              {tone === 'z' && <div className="glow" />}
              <div className={`big ${tone}`}>{count}</div>
              <div className="lab">{tile.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RemediationHeatmap;

import React from 'react';
import { 
  Filter, 
  GitMerge, 
  Flame, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  TrendingDown
} from 'lucide-react';

export default function AlertFunnel({ rawAlerts = 0, correlatedCount = 0, criticalCount = 0 }) {
  const reduction = rawAlerts ? (100 - (correlatedCount / rawAlerts) * 100).toFixed(1) : '0.0';
  return (
    <div className="funnel-container">
      <div className="funnel-header">
        <div className="funnel-title">
          <Sparkles size={14} color="var(--primary)" />
          <span>Intelligence Pipeline: Telemetry Reduction & Correlation</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#34d399', fontWeight: '600' }}>
          <TrendingDown size={13} />
          <span>{reduction}% fewer items to triage ({rawAlerts} alerts → {correlatedCount} incidents)</span>
        </div>
      </div>

      <div className="funnel-steps-grid">
        {/* Step 1: Raw Alert Ingestion */}
        <div className="funnel-card">
          <div className="funnel-card-icon">
            <Filter size={16} />
          </div>
          <div className="funnel-card-info">
            <span className="funnel-card-num">{rawAlerts.toLocaleString()}</span>
            <span className="funnel-card-label">Raw Telemetry Ingested</span>
          </div>
        </div>

        <div className="funnel-arrow">
          <ArrowRight size={16} />
        </div>

        {/* Step 2: Normalization & Correlation */}
        <div className="funnel-card highlight">
          <div className="funnel-card-icon" style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <GitMerge size={16} />
          </div>
          <div className="funnel-card-info">
            <span className="funnel-card-num" style={{ color: '#38bdf8' }}>Auto-Correlated</span>
            <span className="funnel-card-label">Temporal & Graph Engine</span>
          </div>
        </div>

        <div className="funnel-arrow">
          <ArrowRight size={16} />
        </div>

        {/* Step 3: Prioritized Incidents */}
        <div className="funnel-card">
          <div className="funnel-card-icon" style={{ backgroundColor: 'rgba(249, 115, 22, 0.15)', color: '#fb923c' }}>
            <Flame size={16} />
          </div>
          <div className="funnel-card-info">
            <span className="funnel-card-num">{correlatedCount}</span>
            <span className="funnel-card-label">Prioritized Incidents</span>
          </div>
        </div>

        <div className="funnel-arrow">
          <ArrowRight size={16} />
        </div>

        {/* Step 4: Critical Decisions */}
        <div className="funnel-card highlight" style={{ borderColor: 'rgba(239, 68, 68, 0.35)', background: 'linear-gradient(135deg, rgba(40, 16, 20, 0.8), rgba(24, 16, 26, 0.8))' }}>
          <div className="funnel-card-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
            <ShieldCheck size={16} />
          </div>
          <div className="funnel-card-info">
            <span className="funnel-card-num" style={{ color: '#f87171' }}>{criticalCount} Critical</span>
            <span className="funnel-card-label">Urgent Analyst Containment</span>
          </div>
        </div>
      </div>
    </div>
  );
}

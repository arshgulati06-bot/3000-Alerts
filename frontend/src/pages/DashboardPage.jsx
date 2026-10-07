import React from 'react';
import { 
  ShieldAlert, 
  Flame, 
  Layers, 
  Activity, 
  Radio, 
  Zap, 
  TrendingDown, 
  CheckCircle, 
  Clock,
  ExternalLink
} from 'lucide-react';
import ThreatHero from '../components/ThreatHero';
import AlertFunnel from '../components/AlertFunnel';
import IncidentTable from '../components/IncidentTable';

export default function DashboardPage({ kpis, incidents, onSelectIncident }) {
  const criticalIncident = incidents?.find(i => i.severity === 'critical') || incidents?.[0];

  return (
    <div className="content-viewport">
      {/* 1. Header Banner & Live Status Strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#fff' }}>
              Security Operations Center
            </h1>
            <span style={{ 
              fontSize: '11px', 
              fontFamily: 'var(--font-mono)', 
              background: 'rgba(56, 189, 248, 0.1)', 
              color: 'var(--primary)', 
              padding: '2px 8px', 
              borderRadius: '4px',
              border: '1px solid rgba(56, 189, 248, 0.25)'
            }}>
              PROD-CLUSTER-EAST
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Real-time multi-source security telemetry ingestion, graph correlation, and AI-grounded threat synthesis.
          </p>
        </div>

        {/* Live Status Metric Box */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          background: 'var(--bg-surface-1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 16px'
        }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Engine Ingest Rate</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#38bdf8', fontWeight: '600' }}>148.2 events/sec</div>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }}></div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Avg Correlation Latency</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#34d399', fontWeight: '600' }}>42ms</div>
          </div>
        </div>
      </div>

      {/* 2. KPI Strip */}
      <div className="kpi-grid">
        {/* KPI 1: Raw Ingested Alerts */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Raw Alerts (24h)</span>
            <div className="kpi-icon-wrap">
              <Radio size={15} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{(kpis?.rawAlertsCount || 3142).toLocaleString()}</span>
            <span style={{ fontSize: '12px', color: '#38bdf8' }}>+12% vs avg</span>
          </div>
          <div className="kpi-subtext">
            <span>Ingested from SIEM, EDR & Cloud Auth</span>
          </div>
        </div>

        {/* KPI 2: Correlated Incidents */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Correlated Incidents</span>
            <div className="kpi-icon-wrap" style={{ color: '#fb923c' }}>
              <Flame size={15} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{incidents?.length || kpis?.activeIncidentsCount || 14}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>From 3,000+ alerts</span>
          </div>
          <div className="kpi-subtext">
            <span style={{ color: '#34d399', fontWeight: '600' }}>99.5% noise reduction</span>
          </div>
        </div>

        {/* KPI 3: Critical Attention Required */}
        <div className="kpi-card" style={{ borderLeft: '3px solid var(--sev-critical)' }}>
          <div className="kpi-header">
            <span className="kpi-title" style={{ color: '#f87171' }}>Critical Action Items</span>
            <div className="kpi-icon-wrap" style={{ color: 'var(--sev-critical)', backgroundColor: 'var(--sev-critical-bg)' }}>
              <ShieldAlert size={15} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value" style={{ color: '#f87171' }}>{kpis?.criticalIncidentsCount || 2}</span>
            <span style={{ fontSize: '12px', color: '#fca5a5' }}>Requires immediate containment</span>
          </div>
          <div className="kpi-subtext">
            <span style={{ color: 'var(--sev-critical)', fontWeight: '600' }}>Active C2 & Lateral movement</span>
          </div>
        </div>

        {/* KPI 4: Average Risk Index */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Average Risk Score</span>
            <div className="kpi-icon-wrap" style={{ color: '#facc15' }}>
              <Activity size={15} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{kpis?.averageRiskScore || 78.4}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>/ 100</span>
          </div>
          <div className="kpi-subtext">
            <span>Explainable weighted composite metric</span>
          </div>
        </div>
      </div>

      {/* 3. Main Threat Hero: Visual Priority for Top Incident */}
      {criticalIncident && (
        <ThreatHero incident={criticalIncident} onInvestigate={onSelectIncident} />
      )}

      {/* 4. Telemetry Funnel */}
      <AlertFunnel 
        rawAlerts={kpis?.rawAlertsCount || 3142} 
        correlatedCount={incidents?.length || 14} 
        criticalCount={kpis?.criticalIncidentsCount || 2} 
      />

      {/* 5. Incident Table */}
      <IncidentTable 
        incidents={incidents} 
        onSelectIncident={onSelectIncident} 
        title="Prioritized Correlated Incidents Queue"
      />
    </div>
  );
}

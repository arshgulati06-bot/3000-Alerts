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
import { AlertVolumeChart, SeverityDistribution, RecentCriticalAlerts, ActiveIncidents, SystemHealthMini } from '../components/DashboardCharts';
import { MITRE_TECHNIQUES, EVENT_TECHNIQUE } from '../data/socKnowledge';

export default function DashboardPage({ kpis, incidents = [], alerts = [], backendStatus, isLive, onNavigate, onSelectIncident }) {
  const active = incidents.filter(i => i.status !== 'resolved');
  const criticalIncident = active.find(i => i.severity === 'critical') || incidents[0];
  const activeThreats = active.filter(i => ['critical', 'high'].includes(i.severity)).length;
  const criticalAlerts = alerts.filter(a => a.severity >= 9).length;
  const openIncidents = active.length;
  const investigating = incidents.filter(i => i.status === 'investigating').length;
  const contained = incidents.filter(i => i.status === 'contained').length;
  const techniqueCount = Object.keys(MITRE_TECHNIQUES).length;
  // Share of alerts whose detection maps to a MITRE ATT&CK technique
  const coverage = alerts.length ? Math.round((alerts.filter(a => EVENT_TECHNIQUE[a.event_type]).length / alerts.length) * 100) : 0;

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
              SIMULATED ENVIRONMENT
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Multi-source alert ingestion, incident correlation and explainable, evidence-grounded threat analysis.
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
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Data Source</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: isLive ? '#34d399' : '#facc15', fontWeight: '600' }}>{isLive ? 'LIVE · FastAPI' : 'DEMO DATA'}</div>
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }}></div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Alert → Incident Reduction</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#38bdf8', fontWeight: '600' }}>{alerts.length} → {incidents.length}</div>
          </div>
        </div>
      </div>

      {/* 2. KPI Strip — the five numbers a SOC lead asks for first */}
      <div className="dash-kpis">
        {[
          { title: 'Active Threats', value: activeThreats, sub: `${incidents.length} incidents from ${alerts.length.toLocaleString()} alerts`, trend: 'Critical/high, not resolved', tc: '#f87171', icon: Flame, color: '#fb923c' },
          { title: 'Critical Alerts', value: criticalAlerts, sub: 'Severity 9–10 in the alert window', trend: `${alerts.length ? Math.round((criticalAlerts / alerts.length) * 100) : 0}% of all alerts`, tc: '#f87171', icon: ShieldAlert, color: 'var(--sev-critical)', accent: true },
          { title: 'Open Incidents', value: openIncidents, sub: `${investigating} investigating · ${contained} contained`, trend: 'Queue prioritised by risk score', tc: 'var(--text-muted)', icon: Layers, color: '#38bdf8' },
          { title: 'Mean Time to Respond', value: kpis?.meanTimeToContain || '11.8m', sub: 'Demo baseline (simulated)', trend: 'Not measured in this build', tc: 'var(--text-muted)', icon: Clock, color: '#34d399' },
          { title: 'Detection Coverage', value: `${coverage}%`, sub: `${techniqueCount} ATT&CK techniques mapped`, trend: 'of alerts ATT&CK-mapped', tc: 'var(--text-muted)', icon: CheckCircle, color: '#a78bfa' },
        ].map(k => (
          <div key={k.title} className="kpi-card" style={k.accent ? { borderLeft: '3px solid var(--sev-critical)' } : undefined}>
            <div className="kpi-header">
              <span className="kpi-title">{k.title}</span>
              <div className="kpi-icon-wrap" style={{ color: k.color }}><k.icon size={15} /></div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value" style={k.accent ? { color: '#f87171' } : undefined}>{k.value}</span>
            </div>
            <div className="kpi-subtext" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span>{k.sub}</span>
              <span style={{ color: k.tc, fontWeight: 600 }}>{k.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-row">
        <AlertVolumeChart alerts={alerts} />
        <SeverityDistribution alerts={alerts} />
      </div>

      {/* 3. Main Threat Hero: Visual Priority for Top Incident */}
      {criticalIncident && (
        <ThreatHero incident={criticalIncident} onInvestigate={onSelectIncident} />
      )}

      {/* 4. Telemetry Funnel */}
      <AlertFunnel
        rawAlerts={alerts.length}
        correlatedCount={incidents.length}
        criticalCount={active.filter(i => i.severity === 'critical').length}
      />

      <div className="dash-row-3">
        <RecentCriticalAlerts alerts={alerts} incidents={incidents} onInvestigate={onSelectIncident} />
        <ActiveIncidents incidents={incidents} onInvestigate={onSelectIncident} />
        <SystemHealthMini backendStatus={backendStatus} onNavigate={onNavigate} />
      </div>

      {/* 5. Incident Table */}
      <IncidentTable 
        incidents={incidents} 
        onSelectIncident={onSelectIncident} 
        title="Prioritized Correlated Incidents Queue"
      />
    </div>
  );
}

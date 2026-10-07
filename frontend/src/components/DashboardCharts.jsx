import React, { useMemo } from 'react';
import { Activity, PieChart, ShieldAlert, Flame, HeartPulse } from 'lucide-react';
import { severityLabel } from '../data/socKnowledge';

const SEV_ORDER = ['critical', 'high', 'medium', 'low', 'info'];
const SEV_COLOR = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#38bdf8', info: '#64748b' };

function Card({ icon: Icon, title, right, children }) {
  return (
    <div className="card-section">
      <div className="card-section-header">
        <div className="card-section-title"><Icon size={15} color="var(--primary)" /><span>{title}</span></div>
        {right}
      </div>
      <div style={{ padding: '16px' }}>{children}</div>
    </div>
  );
}

/** Hourly alert volume (all vs high+critical) over the 24h window ending at the newest alert */
export function AlertVolumeChart({ alerts = [] }) {
  const { buckets, max, endLabel } = useMemo(() => {
    const times = alerts.map(a => new Date(a.timestamp).getTime()).filter(t => !isNaN(t));
    const end = times.length ? Math.max(...times) : Date.now();
    const b = Array.from({ length: 24 }, () => ({ all: 0, hot: 0 }));
    alerts.forEach(a => {
      const t = new Date(a.timestamp).getTime();
      const idx = 23 - Math.floor((end - t) / 3600000);
      if (idx >= 0 && idx < 24) { b[idx].all++; if (a.severity >= 7) b[idx].hot++; }
    });
    return { buckets: b, max: Math.max(4, ...b.map(x => x.all)), endLabel: new Date(end).toISOString().slice(11, 16) };
  }, [alerts]);

  const W = 720, H = 200, P = 28;
  const x = i => P + (i * (W - P * 2)) / 23;
  const y = v => H - P - (v / max) * (H - P * 2);
  const line = key => buckets.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ');
  const area = key => `${line(key)} L${x(23)},${H - P} L${x(0)},${H - P} Z`;

  return (
    <Card icon={Activity} title="Threat Activity — Alert Volume (24h)"
      right={<div className="dash-legend"><span><i style={{ background: '#38bdf8' }} />All alerts</span><span><i style={{ background: '#ef4444' }} />High + Critical</span></div>}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="200" preserveAspectRatio="none" role="img" aria-label="Hourly alert volume">
        <defs>
          <linearGradient id="gAll" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#38bdf8" stopOpacity="0.35" /><stop offset="1" stopColor="#38bdf8" stopOpacity="0" /></linearGradient>
          <linearGradient id="gHot" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#ef4444" stopOpacity="0.35" /><stop offset="1" stopColor="#ef4444" stopOpacity="0" /></linearGradient>
        </defs>
        {[0, 0.5, 1].map(f => (
          <g key={f}>
            <line x1={P} x2={W - P} y1={y(max * f)} y2={y(max * f)} stroke="rgba(255,255,255,0.06)" />
            <text x={P - 6} y={y(max * f) + 3} fontSize="9" fill="#64748b" textAnchor="end">{Math.round(max * f)}</text>
          </g>
        ))}
        <path d={area('all')} fill="url(#gAll)" />
        <path d={line('all')} fill="none" stroke="#38bdf8" strokeWidth="2" />
        <path d={area('hot')} fill="url(#gHot)" />
        <path d={line('hot')} fill="none" stroke="#ef4444" strokeWidth="2" />
        <text x={P} y={H - 8} fontSize="9" fill="#64748b">−24h</text>
        <text x={W / 2} y={H - 8} fontSize="9" fill="#64748b" textAnchor="middle">−12h</text>
        <text x={W - P} y={H - 8} fontSize="9" fill="#64748b" textAnchor="end">{endLabel} UTC</text>
      </svg>
    </Card>
  );
}

export function SeverityDistribution({ alerts = [] }) {
  const counts = useMemo(() => {
    const c = Object.fromEntries(SEV_ORDER.map(s => [s, 0]));
    alerts.forEach(a => { c[severityLabel(a.severity)]++; });
    return c;
  }, [alerts]);
  const total = Math.max(1, alerts.length);
  return (
    <Card icon={PieChart} title="Severity Distribution" right={<span className="ws-muted">{alerts.length} alerts</span>}>
      {SEV_ORDER.map(s => (
        <div key={s} className="dash-sevrow">
          <span style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '10px', color: SEV_COLOR[s] }}>{s}</span>
          <div className="dash-sevbar"><div style={{ width: `${(counts[s] / total) * 100}%`, background: SEV_COLOR[s] }} /></div>
          <span className="mono" style={{ textAlign: 'right' }}>{counts[s]}</span>
        </div>
      ))}
      <div className="ws-muted" style={{ marginTop: '8px' }}>Scale: 9–10 critical · 7–8 high · 4–6 medium · 2–3 low · 1 info</div>
    </Card>
  );
}

export function RecentCriticalAlerts({ alerts = [], incidents = [], onInvestigate }) {
  const rows = [...alerts].filter(a => a.severity >= 8).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 6);
  return (
    <Card icon={ShieldAlert} title="Recent Critical Alerts">
      {rows.map(a => {
        const inc = incidents.find(i => i.asset_id === a.asset_id);
        return (
          <div key={a.id || a.external_alert_id} className="dash-list-row" onClick={() => inc && onInvestigate(inc)} title={inc ? `Investigate ${inc.incident_key}` : ''}>
            <span className={`sev-badge sev-badge-${severityLabel(a.severity)}`}>{a.severity}</span>
            <span className="mono" style={{ color: 'var(--primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.event_type}</span>
            <span className="mono ws-muted">{a.asset_id}</span>
          </div>
        );
      })}
      {rows.length === 0 && <div className="ws-muted">No critical alerts.</div>}
    </Card>
  );
}

export function ActiveIncidents({ incidents = [], onInvestigate }) {
  const rows = incidents.filter(i => i.status !== 'resolved').slice(0, 6);
  return (
    <Card icon={Flame} title="Active Incidents">
      {rows.map(i => (
        <div key={i.id} className="dash-list-row" onClick={() => onInvestigate(i)}>
          <span className="mono" style={{ color: '#fff' }}>{i.incident_key}</span>
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{i.title}</span>
          <span className={`status-badge status-badge-${i.status}`}>{i.status}</span>
        </div>
      ))}
      {rows.length === 0 && <div className="ws-muted">All incidents resolved.</div>}
    </Card>
  );
}

export function SystemHealthMini({ backendStatus, onNavigate }) {
  const online = backendStatus?.connected;
  const mode = backendStatus?.data?.mode;
  const items = [
    ['Backend API', online ? 'ONLINE' : 'OFFLINE · DEMO MODE', online],
    ['Database', online ? (mode === 'demo-fallback' ? 'SQLITE DEMO FALLBACK' : 'CONNECTED') : 'DEMO DATASET', online],
    ['Alert Ingestion', online ? 'OPERATIONAL' : 'SIMULATED', online],
    ['Incident Engine', 'OPERATIONAL', true],
    ['AI Analysis', 'RULE-BASED · DEMO', true],
  ];
  return (
    <Card icon={HeartPulse} title="System Health" right={<button className="btn btn-secondary btn-sm" onClick={() => onNavigate('status')}>Details</button>}>
      {items.map(([k, v, ok]) => (
        <div key={k} className="dash-health">
          <span><span className="dot" style={{ background: ok ? '#10b981' : '#eab308' }} />{k}</span>
          <span className="mono" style={{ fontSize: '11px', color: ok ? '#34d399' : '#facc15' }}>{v}</span>
        </div>
      ))}
    </Card>
  );
}

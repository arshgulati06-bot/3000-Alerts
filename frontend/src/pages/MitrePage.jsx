import React, { useEffect, useMemo, useState } from 'react';
import { Grid3X3, X, Info, ArrowRight } from 'lucide-react';
import { MITRE_TECHNIQUES, EVENT_TECHNIQUE, incidentTechniques, severityLabel } from '../data/socKnowledge';

const TACTIC_ORDER = [
  'Initial Access / Persistence', 'Execution', 'Persistence', 'Defense Evasion', 'Credential Access',
  'Discovery', 'Lateral Movement', 'Command and Control', 'Impact',
];

const SEV_STYLE = {
  critical: { bg: 'var(--sev-critical-bg)', border: 'var(--sev-critical-border)', text: '#f87171' },
  high: { bg: 'var(--sev-high-bg)', border: 'var(--sev-high-border)', text: '#fb923c' },
  medium: { bg: 'var(--sev-medium-bg)', border: 'var(--sev-medium-border)', text: '#facc15' },
  low: { bg: 'var(--sev-low-bg)', border: 'var(--sev-low-border)', text: '#38bdf8' },
  info: { bg: 'var(--sev-low-bg)', border: 'var(--sev-low-border)', text: '#38bdf8' },
};

/**
 * ATT&CK coverage built ONLY from observed data: each technique appears because an
 * ingested alert's detection type maps to it, or a correlated incident's evidence does.
 */
export default function MitrePage({ incidents = [], alerts = [], onSelectIncident }) {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const techniques = useMemo(() => {
    const map = new Map();
    const entry = (id) => {
      if (!map.has(id)) map.set(id, { id, ...MITRE_TECHNIQUES[id], alerts: [], incidents: [] });
      return map.get(id);
    };
    alerts.forEach(a => {
      const id = EVENT_TECHNIQUE[a.event_type];
      if (id && MITRE_TECHNIQUES[id]) entry(id).alerts.push(a);
    });
    incidents.forEach(inc => {
      incidentTechniques(inc, alerts).forEach(t => {
        if (MITRE_TECHNIQUES[t.id]) {
          const e = entry(t.id);
          if (!e.incidents.some(i => i.id === inc.id)) e.incidents.push(inc);
        }
      });
    });
    return [...map.values()].map(t => {
      const maxAlert = Math.max(0, ...t.alerts.map(a => a.severity));
      const incSev = t.incidents.some(i => i.severity === 'critical') ? 9 : t.incidents.length ? 7 : 0;
      return { ...t, severity: severityLabel(Math.max(maxAlert, incSev) || 3) };
    });
  }, [alerts, incidents]);

  const tactics = TACTIC_ORDER
    .map(name => ({ name, items: techniques.filter(t => t.tactic === name).sort((a, b) => b.alerts.length - a.alerts.length) }))
    .filter(t => t.items.length);

  const current = selected ? techniques.find(t => t.id === selected) : null;

  return (
    <div className="content-viewport">
      <div className="ws-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Grid3X3 size={20} color="var(--primary)" />
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>MITRE ATT&CK® Coverage</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Techniques observed in this environment, mapped from ingested alert detections and correlated incident evidence.
          </p>
        </div>
        <div className="ws-chip" style={{ padding: '6px 12px' }}>
          <Info size={12} /> {techniques.length} techniques · {tactics.length} tactics · {alerts.filter(a => EVENT_TECHNIQUE[a.event_type]).length} mapped alerts
        </div>
      </div>

      {tactics.length === 0 ? (
        <div className="empty-state"><Grid3X3 size={28} /><p>No ATT&CK-mapped detections yet. Ingest alerts to populate coverage.</p></div>
      ) : (
        <div className="mitre-grid">
          {tactics.map(tactic => (
            <div key={tactic.name} className="mitre-col">
              <div className="mitre-col-head">
                <div className="mitre-col-title">{tactic.name}</div>
                <div className="ws-muted">{tactic.items.length} technique{tactic.items.length > 1 ? 's' : ''}</div>
              </div>
              <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {tactic.items.map(t => {
                  const c = SEV_STYLE[t.severity];
                  return (
                    <button key={t.id} className="mitre-cell" style={{ background: c.bg, borderColor: c.border }} onClick={() => setSelected(t.id)}>
                      <span className="mono" style={{ fontSize: '10px', color: c.text, fontWeight: 700 }}>{t.id}</span>
                      <span style={{ fontSize: '12px', color: '#fff', fontWeight: 600, textAlign: 'left' }}>{t.name}</span>
                      <span className="ws-muted">{t.alerts.length} alert{t.alerts.length !== 1 ? 's' : ''} · {t.incidents.length} incident{t.incidents.length !== 1 ? 's' : ''}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {current && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="mitre-tag">{current.id}</span>
                <h3 style={{ fontSize: '15px', color: '#fff' }}>{current.name}</h3>
                <span className="ws-muted">{current.tactic}</span>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div>
                <div className="ws-subtitle">Why it matters</div>
                <p style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: 1.6 }}>{current.why}</p>
              </div>
              <div>
                <div className="ws-subtitle">Related incidents ({current.incidents.length})</div>
                {current.incidents.length === 0 && <div className="ws-muted">Not part of a correlated incident yet.</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {current.incidents.map(inc => (
                    <button key={inc.id} className="ws-action" onClick={() => { setSelected(null); onSelectIncident(inc); }}>
                      <span className="mono" style={{ color: '#fff', fontSize: '12px' }}>{inc.incident_key}</span>
                      <span style={{ flex: 1, textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)' }}>{inc.title}</span>
                      <span className={`status-badge status-badge-${inc.status}`}>{inc.status}</span>
                      <ArrowRight size={13} color="var(--primary)" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="ws-subtitle">Related alerts ({current.alerts.length})</div>
                {current.alerts.length === 0 && <div className="ws-muted">Mapped from incident timeline evidence only.</div>}
                <div className="ws-alert-list">
                  {current.alerts.slice(0, 8).map(a => (
                    <div key={a.id || a.external_alert_id} className="ws-alert-row">
                      <span className={`sev-badge sev-badge-${severityLabel(a.severity)}`}>{a.severity}/10</span>
                      <span className="mono" style={{ color: '#fff' }}>{a.external_alert_id || a.id}</span>
                      <span className="mono ws-muted">{a.asset_id}</span>
                      <span className="ws-muted" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.description}</span>
                    </div>
                  ))}
                  {current.alerts.length > 8 && <div className="ws-muted">+ {current.alerts.length - 8} more in the Alert Queue</div>}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

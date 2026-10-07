import React, { useMemo, useState } from 'react';
import {
  Microscope, GitBranch, Binary, Sparkles, ShieldCheck, Server, Target, Crosshair,
  ListChecks, CheckCircle2, Circle, AlertTriangle, Info, User, Clock, Layers, Gauge,
} from 'lucide-react';
import AttackTimeline from '../components/AttackTimeline';
import EvidenceGrid from '../components/EvidenceGrid';
import { analyzeIncident, relatedAlerts, techniqueForText, severityLabel } from '../data/socKnowledge';

const WORKFLOW = ['new', 'investigating', 'contained', 'resolved'];

function fmtTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return isNaN(d) ? ts : d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

function Section({ icon: Icon, title, right, children, accent }) {
  return (
    <div className="card-section ws-card" style={accent ? { borderTop: `2px solid ${accent}` } : undefined}>
      <div className="card-section-header">
        <div className="card-section-title">
          <Icon size={15} color={accent || 'var(--primary)'} />
          <span>{title}</span>
        </div>
        {right}
      </div>
      <div style={{ padding: '16px' }}>{children}</div>
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div className="ws-field">
      <span className="ws-field-label">{label}</span>
      <span className={mono ? 'ws-field-value mono' : 'ws-field-value'}>{value ?? '—'}</span>
    </div>
  );
}

export default function InvestigationPage({ incidents = [], alerts = [], selectedIncident, onSelectIncident, onUpdateStatus, isLive }) {
  const incident = selectedIncident
    ? (incidents.find(i => i.id === selectedIncident.id) || selectedIncident)
    : incidents[0];
  const [doneActions, setDoneActions] = useState({});

  const analysis = useMemo(() => analyzeIncident(incident, alerts), [incident, alerts]);
  const related = useMemo(() => relatedAlerts(incident, alerts), [incident, alerts]);

  if (!incident) {
    return (
      <div className="content-viewport">
        <div className="empty-state">
          <Microscope size={28} />
          <p>No incidents available to investigate. Ingest alerts or start the backend to load the demo dataset.</p>
        </div>
      </div>
    );
  }

  const status = incident.status || 'new';
  const sev = severityLabel(incident.severity || incident.priority);
  const timelineEvents = (incident.timeline || []).map(ev => ({
    ...ev,
    mitre: techniqueForText(`${ev.event} ${ev.details}`),
  }));

  // Structured evidence derived from the highest-severity correlated alert + extracted IoCs
  const keyAlert = [...related].sort((a, b) => b.severity - a.severity)[0] || {};
  const evFind = (re) => (incident.evidence || []).find(e => re.test(e.key))?.value;
  const firstCmd = (incident.timeline || []).find(e => /\.exe|cmd|vssadmin|schtasks|powershell/i.test(e.details || ''))?.details;
  const structured = [
    ['Hostname', keyAlert.asset_id || incident.asset_id, true],
    ['Username', keyAlert.user || evFind(/account|user/i), true],
    ['Source IP', keyAlert.source_ip, true],
    ['Destination IP', keyAlert.destination_ip, true],
    ['Process', evFind(/process/i) || keyAlert.raw_data?.process_name || keyAlert.raw_data?.parent_process, true],
    ['Command', firstCmd || evFind(/command/i), true],
    ['Hash (SHA256)', evFind(/hash|sha/i) || keyAlert.raw_data?.sha256 || keyAlert.raw_data?.ja3_hash, true],
    ['Timestamp', fmtTime(keyAlert.timestamp || incident.created_at), true],
    ['Event Source', keyAlert.raw_data?.source || keyAlert.raw_data?.agent_id || 'Defender for Endpoint (simulated)', false],
  ];

  const riskColor = analysis.risk >= 85 ? 'var(--sev-critical)' : analysis.risk >= 70 ? 'var(--sev-high)' : 'var(--sev-medium)';

  return (
    <div className="content-viewport">
      {/* Header + incident selector */}
      <div className="ws-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <Microscope size={20} color="var(--primary)" />
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>Investigation Workspace</h1>
            <span className="ws-chip mono">{incident.incident_key}</span>
            <span className={`sev-badge sev-badge-${sev}`}>{sev}</span>
            <span className={`status-badge status-badge-${status}`}>{status}</span>
            <span className={`ws-chip ${isLive ? 'ws-chip-live' : 'ws-chip-demo'}`}>{isLive ? 'LIVE · FastAPI' : 'DEMO DATA'}</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Raw alerts → correlated incident → guided investigation → actionable response.
          </p>
        </div>
        <select
          className="ws-select"
          value={incident.id}
          onChange={(e) => {
            const found = incidents.find(i => String(i.id) === e.target.value);
            if (found) { onSelectIncident(found); setDoneActions({}); }
          }}
        >
          {incidents.map(inc => (
            <option key={inc.id} value={inc.id}>
              {inc.incident_key} · {Math.round(inc.risk_score || 0)} · {(inc.title || '').slice(0, 42)}
            </option>
          ))}
        </select>
      </div>

      {/* Workflow stepper */}
      <div className="ws-stepper">
        {WORKFLOW.map((step, idx) => {
          const cur = WORKFLOW.indexOf(status);
          const state = idx < cur ? 'done' : idx === cur ? 'current' : 'todo';
          return (
            <button key={step} className={`ws-step ws-step-${state}`} onClick={() => onUpdateStatus(incident.id, step)} title={`Set status: ${step}`}>
              {state === 'done' ? <CheckCircle2 size={14} /> : <Circle size={14} />}
              <span>{step}</span>
            </button>
          );
        })}
        <span className="ws-stepper-hint">Click a stage to transition the incident{isLive ? ' (persisted via PATCH /api/incidents)' : ''}</span>
      </div>

      <div className="ws-grid">
        {/* ===== LEFT / MAIN ===== */}
        <div className="ws-col">
          <Section icon={Layers} title="Incident Overview">
            <h2 style={{ fontSize: '17px', color: '#fff', marginBottom: '6px' }}>{incident.title}</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>{incident.summary}</p>
            <div className="ws-fields">
              <Field label="Incident ID" value={incident.incident_key} mono />
              <Field label="Primary Asset" value={incident.asset_id} mono />
              <Field label="First Detected" value={fmtTime(incident.created_at)} mono />
              <Field label="Last Activity" value={fmtTime(incident.updated_at)} mono />
              <Field label="Correlated Alerts" value={incident.alert_count ?? related.length} />
              <Field label="Confidence" value={analysis.confidence} />
              <Field label="Assigned Analyst" value={incident.assigned_analyst || 'Unassigned'} />
              <Field label="MITRE Tactic" value={incident.mitre_tactic} />
            </div>
          </Section>

          <Section icon={GitBranch} title="Attack Timeline" right={<span className="ws-muted">{timelineEvents.length} events · chronological</span>}>
            <AttackTimeline events={timelineEvents} />
          </Section>

          <Section icon={Binary} title="Evidence" right={<span className="ws-chip ws-chip-demo">SIMULATED VALUES</span>}>
            <div className="ws-fields" style={{ marginBottom: '14px' }}>
              {structured.map(([k, v, mono]) => <Field key={k} label={k} value={v} mono={mono} />)}
            </div>
            <div className="ws-subtitle">Extracted Indicators of Compromise</div>
            <EvidenceGrid evidence={incident.evidence} />
            {related.length > 0 && (
              <>
                <div className="ws-subtitle" style={{ marginTop: '16px' }}>Correlated Source Alerts ({related.length})</div>
                <div className="ws-alert-list">
                  {related.map(a => (
                    <div key={a.id || a.external_alert_id} className="ws-alert-row">
                      <span className={`sev-badge sev-badge-${severityLabel(a.severity)}`}>{a.severity}/10</span>
                      <span className="mono" style={{ color: '#fff' }}>{a.external_alert_id || a.id}</span>
                      <span className="mono" style={{ color: 'var(--primary)' }}>{a.event_type}</span>
                      <span className="ws-muted" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.description}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Section>
        </div>

        {/* ===== RIGHT RAIL ===== */}
        <div className="ws-col">
          <Section icon={Gauge} title="Risk Score" accent={riskColor}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '40px', fontWeight: 800, color: riskColor, fontFamily: 'var(--font-heading)' }}>{analysis.risk}</span>
              <span className="ws-muted">/ 100 · {analysis.riskLevel}</span>
            </div>
            <div className="ws-bar"><div style={{ width: `${analysis.risk}%`, background: riskColor }} /></div>
            {(incident.risk_factors || []).map((f, i) => (
              <div key={i} className="ws-factor"><span>{f.label}</span><span className="mono" style={{ color: riskColor }}>{f.weight}</span></div>
            ))}
          </Section>

          <Section icon={Server} title="Affected Systems">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {analysis.assets.map(a => <span key={a} className="ws-chip mono"><Server size={11} /> {a}</span>)}
              {analysis.externalIps.map(ip => <span key={ip} className="ws-chip mono ws-chip-danger"><Target size={11} /> {ip} (external)</span>)}
            </div>
          </Section>

          <Section icon={Crosshair} title="MITRE ATT&CK Mapping">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {analysis.techniques.map(t => (
                <div key={t.id} className="ws-technique">
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="mitre-tag">{t.id}</span>
                    <strong style={{ color: '#fff', fontSize: '12px' }}>{t.name}</strong>
                    <span className="ws-muted" style={{ marginLeft: 'auto' }}>{t.tactic}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{t.why}</div>
                  <div className="ws-muted" style={{ marginTop: '4px' }}>Evidence: {t.sources.slice(0, 2).join(' · ')}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={Sparkles} title="AI-Assisted Investigation" accent="#a78bfa"
            right={<span className="ws-chip" title="Deterministic rules over correlated evidence. Azure OpenAI summarization plugs into the same contract when configured."><ShieldCheck size={11} /> Explainable · rule-based</span>}>
            <div className="ws-ai-block">
              <div className="ws-subtitle">Threat Summary</div>
              <p>{analysis.summary}</p>
            </div>
            <div className="ws-ai-block">
              <div className="ws-subtitle">Risk Assessment</div>
              <p><strong style={{ color: riskColor }}>{analysis.riskLevel}</strong> — risk {analysis.risk}/100, confidence {analysis.confidence}. Tactics observed: {analysis.tactics.join(' → ')}.</p>
            </div>
            <div className="ws-ai-block">
              <div className="ws-subtitle">Why This Is Suspicious</div>
              <ul className="ai-bullet-list">{analysis.why.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
            {analysis.chain.length > 0 && (
              <div className="ws-ai-block">
                <div className="ws-subtitle">Attack Chain</div>
                <ol className="ws-chain">
                  {analysis.chain.map((c, i) => (
                    <li key={i}><span className="mono ws-muted">{c.time}</span> {c.step} {c.technique && <span className="mitre-tag">{c.technique}</span>}</li>
                  ))}
                </ol>
              </div>
            )}
            <div className="ws-disclaimer">
              <Info size={12} />
              <span>Prototype analysis generated by explainable rules over correlated alerts — no external AI model is called in demo mode. Verify before destructive actions.</span>
            </div>
          </Section>

          <Section icon={ListChecks} title="Recommended Response" accent="var(--sev-high)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {analysis.recommendations.map((r, i) => {
                const done = doneActions[i];
                return (
                  <button key={i} className={`ws-action ${done ? 'ws-action-done' : ''}`} onClick={() => setDoneActions(p => ({ ...p, [i]: !p[i] }))}>
                    {done ? <CheckCircle2 size={15} color="var(--sev-healthy)" /> : <span className="ws-action-num">{i + 1}</span>}
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>{r.action}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{r.detail}</div>
                    </div>
                    <span className={`sev-badge sev-badge-${r.priority === 'immediate' ? 'critical' : r.priority === 'high' ? 'high' : 'medium'}`}>{r.priority}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => onUpdateStatus(incident.id, 'contained')}>
                <AlertTriangle size={13} /> <span>Mark Contained</span>
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => onUpdateStatus(incident.id, 'resolved')}>
                <CheckCircle2 size={13} /> <span>Resolve Incident</span>
              </button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

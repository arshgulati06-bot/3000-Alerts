import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  Server, 
  Layers, 
  Terminal, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Ban, 
  Download,
  Share2,
  Clock,
  Radio,
  FileText
} from 'lucide-react';
import AttackTimeline from './AttackTimeline';
import EvidenceGrid from './EvidenceGrid';
import AiInvestigationPanel from './AiInvestigationPanel';

export default function IncidentDetail({ incident, onClose, onUpdateStatus }) {
  if (!incident) return null;

  const [containmentApplied, setContainmentApplied] = useState({
    isolated: false,
    revoked: false,
  });
  const [actionMessage, setActionMessage] = useState(null);

  const handleIsolate = () => {
    setContainmentApplied(prev => ({ ...prev, isolated: true }));
    setActionMessage(`Host ${incident.asset_id} successfully quarantined via EDR isolation agent.`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleRevoke = () => {
    setContainmentApplied(prev => ({ ...prev, revoked: true }));
    setActionMessage(`Active sessions revoked and credentials rotated for affected principals.`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card-lg" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
              fontFamily: 'var(--font-mono)', 
              fontWeight: '700', 
              fontSize: '14px', 
              color: '#fff',
              background: 'var(--bg-surface-3)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-medium)'
            }}>
              {incident.incident_key}
            </span>
            <span className={`sev-badge ${incident.severity === 'critical' ? 'sev-badge-critical' : 'sev-badge-high'}`}>
              {incident.severity || 'critical'}
            </span>
            <span className="status-badge status-badge-investigating">
              {incident.status}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                const reportStr = `SWORDERS SOC INCIDENT EXPORT\n\nIncident: ${incident.incident_key}\nTitle: ${incident.title}\nSeverity: ${incident.severity}\nRisk Score: ${incident.risk_score}\nAsset: ${incident.asset_id}\n\nSummary:\n${incident.summary}\n\nExported at: ${new Date().toISOString()}`;
                const blob = new Blob([reportStr], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${incident.incident_key}_report.txt`;
                a.click();
              }}
            >
              <Download size={13} />
              <span>Export Report</span>
            </button>
            <button 
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action Alert Banner */}
        {actionMessage && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '8px 24px',
            color: '#34d399',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={14} />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="modal-body">
          {/* Main Title & Asset Row */}
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
              {incident.title}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {incident.summary}
            </p>
          </div>

          {/* Risk Breakdown & Telemetry Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '16px' }}>
            {/* Risk Box */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(20, 28, 45, 0.8), rgba(15, 22, 36, 0.8))',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)' }}>
                  Composite Risk Index
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: '800', color: 'var(--sev-critical)' }}>
                  {Math.round(incident.risk_score || 87)} <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>/ 100</span>
                </span>
              </div>

              <div className="risk-bar-track">
                <div className="risk-bar-fill" style={{ width: `${incident.risk_score || 87}%` }}></div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="factor-dot"></span>
                  <span>Multiple correlated security alerts ({incident.alert_count})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="factor-dot"></span>
                  <span>Same affected high-value asset ({incident.asset_id})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="factor-dot"></span>
                  <span>Execution & Credential dumping sequence</span>
                </div>
              </div>
            </div>

            {/* Incident Metadata Strip */}
            <div style={{ 
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Target Host & Asset
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: '700', fontSize: '13px' }}>
                  {incident.asset_id}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  MITRE ATT&CK
                </span>
                <span className="mitre-tag">
                  {incident.mitre_technique || 'T1059.001 - PowerShell'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Correlated Alerts
                </span>
                <span style={{ color: '#fff', fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                  {incident.alert_count || 1} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>telemetry signals</span>
                </span>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Assigned Analyst
                </span>
                <span style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }}>
                  {incident.assigned_analyst || 'Alex Mercer (Shift A)'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Correlation Confidence
                </span>
                <span style={{ color: '#34d399', fontFamily: 'var(--font-mono)', fontWeight: '600', fontSize: '12px' }}>
                  {incident.confidence || '98.2% Grounded'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Containment Status
                </span>
                <span style={{ fontSize: '12px', color: containmentApplied.isolated ? '#34d399' : '#f97316', fontWeight: '600' }}>
                  {containmentApplied.isolated ? 'Host Quarantined ✓' : 'Awaiting Containment'}
                </span>
              </div>
            </div>
          </div>

          {/* AI Investigation Panel */}
          <AiInvestigationPanel investigation={incident.ai_investigation} />

          {/* Attack Timeline */}
          <div className="card-section">
            <div className="card-section-header">
              <div className="card-section-title">
                <Clock size={15} color="var(--primary)" />
                <span>Attack Timeline & Correlated Event Progression</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {incident.timeline?.length || 5} chronological telemetry events
              </span>
            </div>
            <div style={{ padding: '20px' }}>
              <AttackTimeline events={incident.timeline} />
            </div>
          </div>

          {/* Evidence IoC Grid */}
          <div className="card-section">
            <div className="card-section-header">
              <div className="card-section-title">
                <FileText size={15} color="var(--primary)" />
                <span>Extracted IoC Telemetry & Forensic Artifacts</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Deterministic evidence signatures
              </span>
            </div>
            <div style={{ padding: '16px' }}>
              <EvidenceGrid evidence={incident.evidence} />
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="modal-footer">
          <button 
            className="btn btn-danger btn-sm"
            onClick={handleIsolate}
            disabled={containmentApplied.isolated}
          >
            <Lock size={13} />
            <span>{containmentApplied.isolated ? 'Host Isolated ✓' : `Isolate Host (${incident.asset_id})`}</span>
          </button>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleRevoke}
            disabled={containmentApplied.revoked}
          >
            <Ban size={13} />
            <span>{containmentApplied.revoked ? 'Credentials Revoked ✓' : 'Revoke Principal Sessions'}</span>
          </button>

          <button 
            className="btn btn-primary btn-sm"
            onClick={() => {
              if (onUpdateStatus) onUpdateStatus(incident.id, 'resolved');
              setActionMessage('Incident resolved and closed in audit ledger.');
              setTimeout(() => {
                onClose();
              }, 1200);
            }}
          >
            <CheckCircle2 size={13} />
            <span>Mark Incident Resolved</span>
          </button>
        </div>
      </div>
    </div>
  );
}

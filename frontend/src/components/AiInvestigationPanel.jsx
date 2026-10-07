import React from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  GitCommit, 
  CheckCircle2, 
  HelpCircle,
  FileSearch,
  ExternalLink
} from 'lucide-react';

export default function AiInvestigationPanel({ investigation }) {
  if (!investigation) return null;

  return (
    <div className="ai-panel">
      {/* Header with Evidence-Grounded Badge */}
      <div className="ai-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="var(--primary)" />
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: '700', color: '#fff', letterSpacing: '0.04em' }}>
            AI INVESTIGATION
          </span>
        </div>
        <div className="ai-badge">
          <ShieldCheck size={12} />
          <span>EVIDENCE-GROUNDED</span>
        </div>
      </div>

      {/* 1. Executive Summary */}
      <div className="ai-section">
        <div className="ai-section-title">
          <FileSearch size={13} />
          <span>Executive Synthesis</span>
        </div>
        <p style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: '1.6', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          {investigation.summary}
        </p>
      </div>

      {/* 2. Observed Evidence */}
      {investigation.observed_evidence && (
        <div className="ai-section">
          <div className="ai-section-title">
            <CheckCircle2 size={13} color="#38bdf8" />
            <span>Observed Evidence & Correlated Signals</span>
          </div>
          <ul className="ai-bullet-list">
            {investigation.observed_evidence.map((obs, idx) => (
              <li key={idx}>{obs}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Potential Attack Path */}
      {investigation.attack_path && (
        <div className="ai-section">
          <div className="ai-section-title">
            <GitCommit size={13} color="#a855f7" />
            <span>Reconstructed Attack Path</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
            {investigation.attack_path.map((step, idx) => (
              <div 
                key={idx}
                style={{
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}
              >
                <div style={{ fontSize: '10px', color: '#c084fc', textTransform: 'uppercase', fontWeight: '700' }}>
                  Phase {idx + 1}: {step.phase}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {step.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Recommended Investigation & Remediation */}
      {investigation.recommendations && (
        <div className="ai-section">
          <div className="ai-section-title">
            <AlertCircle size={13} color="#f97316" />
            <span>Recommended Containment & Next Actions</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {investigation.recommendations.map((rec, idx) => (
              <div 
                key={idx}
                style={{
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    background: rec.priority === 'immediate' ? 'var(--sev-critical-bg)' : 'var(--sev-high-bg)',
                    color: rec.priority === 'immediate' ? '#f87171' : '#fb923c',
                    border: `1px solid ${rec.priority === 'immediate' ? 'var(--sev-critical-border)' : 'var(--sev-high-border)'}`
                  }}>
                    {rec.priority || 'Action'}
                  </span>
                  <div>
                    <strong style={{ color: '#fff', fontSize: '12px' }}>{rec.action}: </strong>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{rec.detail}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Enterprise Disclaimer */}
      <div className="ai-disclaimer">
        <HelpCircle size={12} />
        <span>{investigation.disclaimer || 'AI-assisted analysis. Verify against source evidence before containment.'}</span>
      </div>
    </div>
  );
}

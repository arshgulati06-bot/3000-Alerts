import React from 'react';
import { 
  AlertOctagon, 
  ShieldAlert, 
  Server, 
  Layers, 
  ArrowRight, 
  Activity, 
  Radio, 
  Terminal,
  Cpu
} from 'lucide-react';

export default function ThreatHero({ incident, onInvestigate }) {
  if (!incident) return null;

  return (
    <div className="threat-hero-card">
      <div className="threat-hero-grid">
        {/* Left: Incident Intelligence */}
        <div>
          <div className="threat-hero-badge-row">
            <span className="hero-priority-badge">
              <AlertOctagon size={13} />
              CRITICAL INCIDENT
            </span>
            <span className="hero-key-badge">{incident.incident_key}</span>
            <span className="status-badge status-badge-investigating">
              <Activity size={12} />
              {incident.status}
            </span>
          </div>

          <h2 className="threat-hero-title">{incident.title}</h2>
          <p className="threat-hero-desc">{incident.summary}</p>

          <div className="threat-hero-meta-row">
            <div className="meta-pill">
              <Server size={13} color="var(--primary)" />
              <span>Asset: <strong>{incident.asset_id}</strong></span>
            </div>
            <div className="meta-pill">
              <Layers size={13} color="var(--primary)" />
              <span>Correlated Alerts: <strong>{incident.alert_count}</strong></span>
            </div>
            <div className="meta-pill">
              <Terminal size={13} color="var(--accent-purple)" />
              <span>MITRE: <strong>{incident.mitre_technique}</strong></span>
            </div>
            <div className="meta-pill">
              <Radio size={13} color="var(--sev-critical)" />
              <span>Confidence: <strong>{incident.confidence || '98.2%'}</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Risk Factor Gauge & CTA */}
        <div className="threat-hero-gauge-box">
          <div className="gauge-header">
            <span className="gauge-title">Composite Risk Index</span>
            <div className="risk-score-display">
              <span className="risk-number">{Math.round(incident.risk_score || 87)}</span>
              <span className="risk-total">/ 100</span>
            </div>
          </div>

          {/* Linear Meter */}
          <div className="risk-bar-track">
            <div 
              className="risk-bar-fill" 
              style={{ width: `${incident.risk_score || 87}%` }}
            ></div>
          </div>

          {/* Risk Factors Breakdown */}
          <div className="gauge-factors">
            {incident.risk_factors ? (
              incident.risk_factors.slice(0, 3).map((f, i) => (
                <div key={i} className="factor-item">
                  <span className="factor-dot"></span>
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.label}</span>
                  <span style={{ color: 'var(--sev-critical)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>{f.weight}</span>
                </div>
              ))
            ) : (
              <>
                <div className="factor-item">
                  <span className="factor-dot"></span>
                  <span>Obfuscated Base64 execution</span>
                </div>
                <div className="factor-item">
                  <span className="factor-dot"></span>
                  <span>Lateral SMB reconnaissance</span>
                </div>
              </>
            )}
          </div>

          <button 
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '6px' }}
            onClick={() => onInvestigate(incident)}
          >
            <span>Investigate Incident</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

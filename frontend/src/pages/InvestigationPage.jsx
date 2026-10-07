import React, { useState } from 'react';
import { 
  Microscope, 
  Search, 
  GitBranch, 
  Binary, 
  Terminal, 
  ShieldCheck, 
  Layers, 
  Filter,
  Play,
  CheckCircle2,
  Share2
} from 'lucide-react';
import AttackTimeline from '../components/AttackTimeline';
import EvidenceGrid from '../components/EvidenceGrid';
import { MOCK_INCIDENTS } from '../data/mockData';

export default function InvestigationPage({ onSelectIncident }) {
  const [selectedIncident, setSelectedIncident] = useState(MOCK_INCIDENTS[0]);
  const [queryText, setQueryText] = useState('asset_id == "SERVER-01" AND severity >= 7');
  const [isQuerying, setIsQuerying] = useState(false);

  const handleRunQuery = () => {
    setIsQuerying(true);
    setTimeout(() => setIsQuerying(false), 500);
  };

  return (
    <div className="content-viewport">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Microscope size={20} color="var(--primary)" />
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>
              Forensics & Investigation Sandbox
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Deep-dive multi-dimensional correlation workbench for tier-2/tier-3 SOC threat hunting.
          </p>
        </div>

        {/* Incident Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Active Investigation Context:</span>
          <select
            value={selectedIncident.id}
            onChange={(e) => {
              const found = MOCK_INCIDENTS.find(i => String(i.id) === e.target.value);
              if (found) setSelectedIncident(found);
            }}
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: '12px',
              padding: '6px 12px',
              outline: 'none'
            }}
          >
            {MOCK_INCIDENTS.map(inc => (
              <option key={inc.id} value={inc.id}>
                {inc.incident_key} — {inc.title.slice(0, 35)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Query Bar */}
      <div style={{
        background: 'var(--bg-surface-1)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>
            SOC Telemetry Query Engine (KQL / EQL Dialect)
          </span>
          <span style={{ fontSize: '11px', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
            Index: security-telemetry-prod-*
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Terminal size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--primary)' }} />
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 14px 8px 34px',
                color: '#38bdf8',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleRunQuery} disabled={isQuerying}>
            <Play size={13} />
            <span>{isQuerying ? 'Executing...' : 'Run Query'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Forensics Workspace Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Left Column: Attack Progression Graph & Sequence */}
        <div className="card-section">
          <div className="card-section-header">
            <div className="card-section-title">
              <GitBranch size={15} color="var(--primary)" />
              <span>Attack Sequence Progression ({selectedIncident.incident_key})</span>
            </div>
            <span className="sev-badge sev-badge-critical">{selectedIncident.severity}</span>
          </div>

          <div style={{ padding: '20px' }}>
            <AttackTimeline events={selectedIncident.timeline} />
          </div>
        </div>

        {/* Right Column: Extracted Forensic Artifacts & Host Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Target Host Details */}
          <div className="card-section" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Target Host Profile: {selectedIncident.asset_id}
              </div>
              <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 6px', borderRadius: '4px' }}>
                EDR Agent Connected
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
              <div style={{ background: 'var(--bg-surface-2)', padding: '8px 10px', borderRadius: '4px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>IP Subnet</span>
                <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>10.0.0.0/24 (Prod Servers)</span>
              </div>
              <div style={{ background: 'var(--bg-surface-2)', padding: '8px 10px', borderRadius: '4px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>OS Architecture</span>
                <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>Windows Server 2025 x64</span>
              </div>
            </div>
          </div>

          {/* IoC Evidence */}
          <div className="card-section">
            <div className="card-section-header">
              <div className="card-section-title">
                <Binary size={15} color="var(--primary)" />
                <span>Forensic Artifacts</span>
              </div>
            </div>
            <div style={{ padding: '16px' }}>
              <EvidenceGrid evidence={selectedIncident.evidence} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

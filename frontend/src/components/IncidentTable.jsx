import React from 'react';
import { 
  Flame, 
  Server, 
  Layers, 
  Terminal, 
  Clock, 
  ChevronRight,
  ShieldAlert,
  ArrowUpDown
} from 'lucide-react';

export default function IncidentTable({ incidents, onSelectIncident, title = "Active Correlated Incidents" }) {
  if (!incidents || incidents.length === 0) {
    return (
      <div className="card-section" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <ShieldAlert size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
        <h4 style={{ color: '#fff', marginBottom: '6px' }}>No Incidents Found</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          All correlated threat incidents have been resolved or filtered out.
        </p>
      </div>
    );
  }

  const getSeverityRailClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'severity-rail severity-rail-critical';
      case 'high': return 'severity-rail severity-rail-high';
      case 'medium': return 'severity-rail severity-rail-medium';
      default: return 'severity-rail severity-rail-low';
    }
  };

  const getSeverityBadgeClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'sev-badge sev-badge-critical';
      case 'high': return 'sev-badge sev-badge-high';
      case 'medium': return 'sev-badge sev-badge-medium';
      default: return 'sev-badge sev-badge-low';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'status-badge status-badge-open';
      case 'investigating': return 'status-badge status-badge-investigating';
      case 'resolved': return 'status-badge status-badge-resolved';
      default: return 'status-badge';
    }
  };

  return (
    <div className="card-section">
      <div className="card-section-header">
        <div className="card-section-title">
          <Flame size={16} color="var(--primary)" />
          <span>{title}</span>
          <span style={{ 
            fontSize: '11px', 
            background: 'var(--bg-surface-3)', 
            padding: '2px 8px', 
            borderRadius: '10px', 
            color: 'var(--text-secondary)' 
          }}>
            {incidents.length} total
          </span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
          Click row to open AI Investigation & Telemetry Evidence
        </div>
      </div>

      <div className="table-responsive">
        <table className="soc-table">
          <thead>
            <tr>
              <th style={{ width: '130px' }}>Incident Key</th>
              <th>Threat Title</th>
              <th style={{ width: '100px' }}>Risk Score</th>
              <th style={{ width: '110px' }}>Severity</th>
              <th style={{ width: '130px' }}>Affected Asset</th>
              <th style={{ width: '80px' }}>Alerts</th>
              <th style={{ width: '170px' }}>MITRE Technique</th>
              <th style={{ width: '120px' }}>Status</th>
              <th style={{ width: '100px' }}>Last Active</th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((inc) => (
              <tr key={inc.id || inc.incident_key} onClick={() => onSelectIncident(inc)}>
                {/* Incident ID with Severity Rail */}
                <td style={{ whiteSpace: 'nowrap' }}>
                  <span className={getSeverityRailClass(inc.severity || inc.priority)}></span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: '#fff' }}>
                    {inc.incident_key}
                  </span>
                </td>

                {/* Threat Title */}
                <td>
                  <div style={{ fontWeight: '600', color: '#f1f5f9', marginBottom: '2px' }}>
                    {inc.title || inc.summary?.slice(0, 55) || 'Security Anomaly Event'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '320px' }}>
                    {inc.summary || 'Correlated security event requiring analyst validation.'}
                  </div>
                </td>

                {/* Risk Score */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ 
                      fontFamily: 'var(--font-mono)', 
                      fontWeight: '700', 
                      fontSize: '13px',
                      color: (inc.risk_score || 0) >= 80 ? 'var(--sev-critical)' : (inc.risk_score || 0) >= 60 ? 'var(--sev-high)' : 'var(--sev-medium)'
                    }}>
                      {Math.round(inc.risk_score || 70)}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>/100</span>
                  </div>
                </td>

                {/* Severity */}
                <td>
                  <span className={getSeverityBadgeClass(inc.severity || inc.priority)}>
                    {inc.severity || inc.priority || 'medium'}
                  </span>
                </td>

                {/* Target Asset */}
                <td>
                  <span style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '11px', 
                    background: 'var(--bg-surface-2)', 
                    padding: '3px 8px', 
                    borderRadius: '4px',
                    border: '1px solid var(--border-subtle)',
                    color: '#e2e8f0'
                  }}>
                    {inc.asset_id || 'SERVER-01'}
                  </span>
                </td>

                {/* Alert Count */}
                <td>
                  <span style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '12px', 
                    color: 'var(--text-secondary)',
                    fontWeight: '600'
                  }}>
                    {inc.alert_count || 1}
                  </span>
                </td>

                {/* MITRE Technique */}
                <td>
                  <span className="mitre-tag">
                    {inc.mitre_technique ? inc.mitre_technique.split(' - ')[0] : 'T1059'}
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal', fontSize: '10px' }}>
                      {inc.mitre_technique ? ' ' + inc.mitre_technique.split(' - ')[1]?.slice(0, 14) : ' Execution'}
                    </span>
                  </span>
                </td>

                {/* Status */}
                <td>
                  <span className={getStatusBadgeClass(inc.status)}>
                    {inc.status || 'open'}
                  </span>
                </td>

                {/* Last Active */}
                <td>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {inc.updated_at ? new Date(inc.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:28 UTC'}
                  </span>
                </td>

                {/* Arrow */}
                <td>
                  <ChevronRight size={14} color="var(--text-dim)" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

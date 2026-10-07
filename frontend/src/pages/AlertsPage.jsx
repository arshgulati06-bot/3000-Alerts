import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Search, 
  Filter, 
  PlusCircle, 
  ArrowRight, 
  Code, 
  ExternalLink, 
  Terminal,
  Clock,
  Layers,
  CheckCircle2,
  X
} from 'lucide-react';

export default function AlertsPage({ alerts = [], onOpenIngestModal }) {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedAlert(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    // Search query
    if (search) {
      const q = search.toLowerCase();
      const matchKey = alert.external_alert_id?.toLowerCase().includes(q);
      const matchType = alert.event_type?.toLowerCase().includes(q);
      const matchAsset = alert.asset_id?.toLowerCase().includes(q);
      const matchUser = alert.user?.toLowerCase().includes(q);
      const matchDesc = alert.description?.toLowerCase().includes(q);
      const matchIp = (alert.source_ip?.includes(q) || alert.destination_ip?.includes(q));
      if (!matchKey && !matchType && !matchAsset && !matchUser && !matchDesc && !matchIp) return false;
    }

    // Severity filter
    if (severityFilter === 'critical' && alert.severity < 9) return false;
    if (severityFilter === 'high' && (alert.severity < 7 || alert.severity >= 9)) return false;
    if (severityFilter === 'medium' && (alert.severity < 4 || alert.severity >= 7)) return false;
    if (severityFilter === 'low' && alert.severity > 3) return false;

    // Event type
    if (eventTypeFilter !== 'all' && !alert.event_type?.toLowerCase().includes(eventTypeFilter.toLowerCase())) {
      return false;
    }

    return true;
  });

  const getSeverityBadgeClass = (sev) => {
    if (sev >= 9) return 'sev-badge sev-badge-critical';
    if (sev >= 7) return 'sev-badge sev-badge-high';
    if (sev >= 4) return 'sev-badge sev-badge-medium';
    return 'sev-badge sev-badge-low';
  };

  const getSeverityRailClass = (sev) => {
    if (sev >= 9) return 'severity-rail severity-rail-critical';
    if (sev >= 7) return 'severity-rail severity-rail-high';
    if (sev >= 4) return 'severity-rail severity-rail-medium';
    return 'severity-rail severity-rail-low';
  };

  return (
    <div className="content-viewport">
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Radio size={20} color="var(--primary)" />
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>
              Normalized Alert Stream
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Heterogeneous security telemetry ingested, normalized to unified schema, and buffered for graph correlation.
          </p>
        </div>

        <button className="btn btn-primary btn-sm" onClick={onOpenIngestModal}>
          <PlusCircle size={14} />
          <span>Ingest Test Alert</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        background: 'var(--bg-surface-1)', 
        border: '1px solid var(--border-subtle)', 
        borderRadius: 'var(--radius-lg)', 
        padding: '12px 16px',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by Alert ID, IP, Asset, User, Description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px 6px 30px',
              color: '#fff',
              fontSize: '12px',
              outline: 'none'
            }}
          />
        </div>

        {/* Severity Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: '12px',
              padding: '5px 10px',
              outline: 'none'
            }}
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical (9–10)</option>
            <option value="high">High (7–8)</option>
            <option value="medium">Medium (4–6)</option>
            <option value="low">Low (1–3)</option>
          </select>
        </div>

        {/* Event Type Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Category:</span>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: '12px',
              padding: '5px 10px',
              outline: 'none'
            }}
          >
            <option value="all">All Categories</option>
            <option value="powershell">PowerShell / Scripting</option>
            <option value="lsass">Credential Access / LSASS</option>
            <option value="beacon">C2 Beaconing</option>
            <option value="shadow_copy">Ransomware / Shadow Copy</option>
            <option value="mfa">MFA Push / Identity</option>
            <option value="smb">Lateral SMB</option>
            <option value="port_scan">Network Recon / Scan</option>
          </select>
        </div>

        {/* Counter */}
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
          Showing {filteredAlerts.length} of {alerts.length} alerts
        </div>
      </div>

      {/* Alert Stream Table */}
      <div className="card-section">
        <div className="table-responsive">
          <table className="soc-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Alert ID</th>
                <th style={{ width: '130px' }}>Timestamp (UTC)</th>
                <th style={{ width: '90px' }}>Severity</th>
                <th style={{ width: '180px' }}>Event Type</th>
                <th>Description</th>
                <th style={{ width: '220px' }}>Source → Destination</th>
                <th style={{ width: '120px' }}>Asset ID</th>
                <th style={{ width: '120px' }}>User Principal</th>
                <th style={{ width: '60px' }}>Payload</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map((alert) => (
                <tr key={alert.id || alert.external_alert_id} onClick={() => setSelectedAlert(alert)}>
                  {/* Alert ID */}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className={getSeverityRailClass(alert.severity)}></span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: '#fff' }}>
                      {alert.external_alert_id || `ALT-${alert.id}`}
                    </span>
                  </td>

                  {/* Timestamp */}
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {alert.timestamp ? new Date(alert.timestamp).toUTCString().slice(17, 25) + ' UTC' : '12:28:30 UTC'}
                  </td>

                  {/* Severity */}
                  <td>
                    <span className={getSeverityBadgeClass(alert.severity)}>
                      {alert.severity} / 10
                    </span>
                  </td>

                  {/* Event Type */}
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontSize: '12px', fontWeight: '500' }}>
                      {alert.event_type}
                    </span>
                  </td>

                  {/* Description */}
                  <td>
                    <div style={{ color: '#e2e8f0', fontSize: '12px', maxWidth: '360px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {alert.description || 'Normalized security alert payload'}
                    </div>
                  </td>

                  {/* Network Flow */}
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                    <span style={{ color: '#38bdf8' }}>{alert.source_ip || '10.0.0.10'}</span>
                    <span style={{ color: 'var(--text-dim)', margin: '0 4px' }}>→</span>
                    <span style={{ color: '#a855f7' }}>{alert.destination_ip || '10.0.0.12'}</span>
                  </td>

                  {/* Asset */}
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', background: 'var(--bg-surface-2)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      {alert.asset_id || 'SERVER-01'}
                    </span>
                  </td>

                  {/* User */}
                  <td>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {alert.user || 'SYSTEM'}
                    </span>
                  </td>

                  {/* Raw JSON View Icon */}
                  <td>
                    <button 
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      title="Inspect Raw JSON"
                    >
                      <Code size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw JSON Payload Modal / Drawer */}
      {selectedAlert && (
        <div className="modal-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code size={16} color="var(--primary)" />
                <h3 style={{ fontSize: '15px', color: '#fff' }}>
                  Raw Telemetry Payload: {selectedAlert.external_alert_id || `ALT-${selectedAlert.id}`}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedAlert(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: 'var(--bg-surface-2)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Event Category</div>
                  <div style={{ fontSize: '12px', color: '#fff', fontFamily: 'var(--font-mono)' }}>{selectedAlert.event_type}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Severity Level</div>
                  <div style={{ fontSize: '12px', color: 'var(--sev-critical)', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{selectedAlert.severity} / 10</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Target Host</div>
                  <div style={{ fontSize: '12px', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{selectedAlert.asset_id}</div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                  Raw JSON Payload Body
                </label>
                <pre style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  color: '#38bdf8',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  overflowX: 'auto',
                  maxHeight: '320px'
                }}>
                  {JSON.stringify(selectedAlert, null, 2)}
                </pre>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedAlert(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

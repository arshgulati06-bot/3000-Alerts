import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, AlertTriangle, Sparkles, Terminal } from 'lucide-react';
import { ingestAlert } from '../services/api';

const SAMPLE_TEMPLATES = [
  {
    name: "PowerShell Encoded Execution",
    data: {
      external_alert_id: `ALT-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: new Date().toISOString(),
      source_ip: "10.0.0.45",
      destination_ip: "10.0.0.10",
      source_port: 51200,
      destination_port: 5985,
      protocol: "WinRM",
      event_type: "obfuscated_powershell",
      severity: 9,
      asset_id: "SERVER-01",
      user: "admin_svc",
      description: "Obfuscated Base64 PowerShell execution bypassing execution policy",
      raw_data: {
        command: "powershell.exe -w hidden -nop -enc JABjAGwAaQBl...",
        parent_process: "wsmprovhost.exe"
      }
    }
  },
  {
    name: "LSASS Process Memory Dump",
    data: {
      external_alert_id: `ALT-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: new Date().toISOString(),
      source_ip: "10.0.0.10",
      destination_ip: "10.0.0.10",
      source_port: 0,
      destination_port: 0,
      protocol: "LOCAL",
      event_type: "lsass_memory_access",
      severity: 10,
      asset_id: "SERVER-01",
      user: "NT AUTHORITY\\SYSTEM",
      description: "MiniDump handle requested against LSASS for credential extraction",
      raw_data: {
        target_pid: 648,
        access_mask: "0x1FFFFF"
      }
    }
  },
  {
    name: "Outbound CobaltStrike C2 Beacon",
    data: {
      external_alert_id: `ALT-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: new Date().toISOString(),
      source_ip: "10.0.0.10",
      destination_ip: "185.220.101.44",
      source_port: 49822,
      destination_port: 8443,
      protocol: "TCP",
      event_type: "c2_beacon_detected",
      severity: 9,
      asset_id: "SERVER-01",
      user: "admin_svc",
      description: "Encrypted periodic beaconing signature matching known C2 server",
      raw_data: {
        ja3_hash: "a0e9f5d64349fb13191bc781f81f42e1",
        interval_seconds: 60
      }
    }
  }
];

export default function IngestAlertModal({ onClose, onAlertIngested }) {
  const [formData, setFormData] = useState(SAMPLE_TEMPLATES[0].data);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSelectTemplate = (tpl) => {
    setFormData({
      ...tpl.data,
      external_alert_id: `ALT-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: new Date().toISOString()
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await ingestAlert(formData);
      setStatusMsg({
        type: 'success',
        text: `Alert ingested successfully! (ID: ${res.id || res.external_alert_id})`
      });
      if (onAlertIngested) onAlertIngested(res);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: `Ingestion failed: ${err.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={16} color="var(--primary)" />
            <h3 style={{ fontSize: '15px', color: '#fff' }}>Ingest Security Alert (POST /api/alerts)</h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body">
            {statusMsg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: statusMsg.type === 'success' ? '#34d399' : '#f87171',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {statusMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            {/* Quick Template Selector */}
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                Load Pre-Configured Telemetry Template
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {SAMPLE_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleSelectTemplate(tpl)}
                    style={{ fontSize: '11px' }}
                  >
                    <Sparkles size={11} color="var(--primary)" />
                    <span>{tpl.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>External Alert ID</label>
                <input
                  type="text"
                  value={formData.external_alert_id || ''}
                  onChange={(e) => setFormData({ ...formData, external_alert_id: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Event Type</label>
                <input
                  type="text"
                  value={formData.event_type || ''}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Source IP</label>
                <input
                  type="text"
                  value={formData.source_ip || ''}
                  onChange={(e) => setFormData({ ...formData, source_ip: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Destination IP</label>
                <input
                  type="text"
                  value={formData.destination_ip || ''}
                  onChange={(e) => setFormData({ ...formData, destination_ip: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Target Asset ID</label>
                <input
                  type="text"
                  value={formData.asset_id || ''}
                  onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Severity (1–10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.severity || 7}
                  onChange={(e) => setFormData({ ...formData, severity: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: '#fff', fontSize: '12px', resize: 'vertical' }}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
              <Send size={13} />
              <span>{isSubmitting ? 'Ingesting...' : 'Ingest to FastAPI'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

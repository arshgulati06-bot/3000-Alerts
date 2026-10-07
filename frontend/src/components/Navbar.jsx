import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Clock, 
  Database, 
  PlusCircle, 
  Bell, 
  Search, 
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function Navbar({ backendStatus, onOpenIngestModal, onSearch, searchQuery, criticalCount = 0 }) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="top-navbar">
      {/* Left side: Tagline & Search */}
      <div className="top-navbar-left">
        <div className="tagline-badge">
          <span>Target Paradigm:</span>
          <strong>3,000 Alerts. One Analyst.</strong>
        </div>

        {/* Global Filter / Search Input */}
        <div className="navbar-search" style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          minWidth: '200px'
        }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search alerts: IP, asset, user, IoC…"
            value={searchQuery || ''}
            onChange={(e) => onSearch && onSearch(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px 6px 30px',
              color: '#fff',
              fontSize: '12px',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'var(--transition-fast)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--border-accent)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
          />
        </div>
      </div>

      {/* Right side: Threat Pulse, Time, Backend Status, Ingest Action */}
      <div className="top-navbar-right">
        {/* Signature Sworders Threat Pulse */}
        <div className="threat-pulse-pill" title="Open critical incidents (not yet contained or resolved)" style={criticalCount ? undefined : { color: '#34d399', borderColor: 'var(--sev-healthy-border)', background: 'var(--sev-healthy-bg)' }}>
          <div className="pulse-dot" style={criticalCount ? undefined : { background: '#10b981', boxShadow: 'none' }}></div>
          <span>THREAT PULSE: {criticalCount ? `ELEVATED (${criticalCount} CRITICAL)` : 'NOMINAL'}</span>
        </div>

        {/* Backend Database Live Status Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface-2)',
          border: '1px solid var(--border-subtle)',
          color: backendStatus?.connected ? '#34d399' : '#facc15',
          whiteSpace: 'nowrap'
        }}>
          <Database size={12} />
          <span>{backendStatus?.connected ? 'API Online' : 'API Offline · Demo Data'}</span>
        </div>

        {/* Live UTC Clock */}
        <div className="navbar-clock" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          padding: '4px 8px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 'var(--radius-sm)'
        }}>
          <Clock size={12} color="var(--primary)" />
          <span>{timeStr}</span>
        </div>

        {/* Action Button: Ingest Telemetry */}
        <button 
          className="btn btn-primary btn-sm"
          onClick={onOpenIngestModal}
          title="Simulate / Post real security alert into FastAPI backend"
        >
          <PlusCircle size={14} />
          <span>Ingest Telemetry</span>
        </button>
      </div>
    </header>
  );
}

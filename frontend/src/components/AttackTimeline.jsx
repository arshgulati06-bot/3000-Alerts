import React from 'react';
import { Clock, ShieldAlert, ArrowRight, Terminal } from 'lucide-react';

export default function AttackTimeline({ events = [] }) {
  if (!events || events.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
        No chronological attack events recorded for this incident.
      </div>
    );
  }

  return (
    <div className="timeline-container">
      {events.map((ev, index) => {
        const isCrit = ev.severity?.toLowerCase() === 'critical' || ev.severity >= 8;
        return (
          <div key={ev.id || index} className="timeline-item">
            {/* Connected Node */}
            <div className={`timeline-node ${isCrit ? 'critical' : ''}`}></div>

            {/* Event Card */}
            <div className="timeline-card">
              <div className="timeline-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`sev-badge ${isCrit ? 'sev-badge-critical' : 'sev-badge-high'}`}>
                    {ev.severity || 'high'}
                  </span>
                  <strong style={{ color: '#fff', fontSize: '13px' }}>{ev.event}</strong>
                  {ev.mitre && <span className="mitre-tag">{ev.mitre}</span>}
                </div>
                <div className="timeline-time">{ev.time}</div>
              </div>

              {/* IP / Host Flow */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '12px', 
                color: 'var(--text-secondary)',
                margin: '6px 0',
                fontFamily: 'var(--font-mono)'
              }}>
                <span style={{ color: '#38bdf8' }}>{ev.source_ip || '—'}</span>
                <ArrowRight size={12} color="var(--text-dim)" />
                <span style={{ color: '#a855f7' }}>{ev.destination_ip || '—'}</span>
                {ev.asset && (
                  <span style={{ 
                    marginLeft: 'auto', 
                    fontSize: '11px', 
                    background: 'var(--bg-surface-1)', 
                    padding: '2px 6px', 
                    borderRadius: '4px',
                    color: 'var(--text-muted)'
                  }}>
                    Host: {ev.asset}
                  </span>
                )}
              </div>

              {/* Command Details */}
              {ev.details && (
                <div style={{ 
                  background: 'rgba(0, 0, 0, 0.4)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 'var(--radius-sm)', 
                  padding: '6px 10px', 
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: '#94a3b8',
                  wordBreak: 'break-all',
                  marginTop: '6px'
                }}>
                  <Terminal size={11} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: 'var(--primary)' }} />
                  {ev.details}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

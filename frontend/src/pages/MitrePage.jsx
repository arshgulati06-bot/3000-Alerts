import React, { useState, useEffect } from 'react';
import { 
  Grid3X3, 
  Terminal, 
  ShieldAlert, 
  Layers, 
  ArrowRight, 
  Info, 
  X,
  ExternalLink,
  Flame
} from 'lucide-react';
import { MOCK_MITRE_TAXONOMY } from '../data/mockData';

export default function MitrePage({ onSelectIncident, incidents = [] }) {
  const [selectedTechnique, setSelectedTechnique] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedTechnique(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'critical': return { bg: 'var(--sev-critical-bg)', border: 'var(--sev-critical-border)', text: '#f87171' };
      case 'high': return { bg: 'var(--sev-high-bg)', border: 'var(--sev-high-border)', text: '#fb923c' };
      case 'medium': return { bg: 'var(--sev-medium-bg)', border: 'var(--sev-medium-border)', text: '#facc15' };
      default: return { bg: 'var(--sev-low-bg)', border: 'var(--sev-low-border)', text: '#38bdf8' };
    }
  };

  const getMatchingIncidents = (techId) => {
    return incidents.filter(i => i.mitre_technique && i.mitre_technique.includes(techId));
  };

  return (
    <div className="content-viewport">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Grid3X3 size={20} color="var(--primary)" />
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>
              MITRE ATT&CK® Enterprise Matrix
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Tactical threat mapping and technique frequency distribution observed across correlated incidents.
          </p>
        </div>

        {/* Matrix Legend */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--bg-surface-1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 14px',
          fontSize: '11px'
        }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Active Heatmap:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--sev-critical)' }}></span>
            <span style={{ color: '#f87171' }}>Critical (High Freq)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--sev-high)' }}></span>
            <span style={{ color: '#fb923c' }}>High</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--sev-medium)' }}></span>
            <span style={{ color: '#facc15' }}>Medium</span>
          </div>
        </div>
      </div>

      {/* MITRE Matrix Columns Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        alignItems: 'start'
      }}>
        {MOCK_MITRE_TAXONOMY.map((tactic) => (
          <div 
            key={tactic.tactic_id}
            style={{
              background: 'var(--bg-surface-1)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Tactic Column Header */}
            <div style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'rgba(0,0,0,0.2)'
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#38bdf8', fontWeight: '700' }}>
                {tactic.tactic_id}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tactic.tactic_name}
              </div>
            </div>

            {/* Techniques List */}
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {tactic.techniques.map((tech) => {
                const colors = getSeverityColor(tech.severity);
                const isSelected = selectedTechnique?.id === tech.id;
                return (
                  <button
                    key={tech.id}
                    onClick={() => setSelectedTechnique(tech)}
                    style={{
                      background: isSelected ? 'var(--bg-surface-hover)' : colors.bg,
                      border: `1px solid ${isSelected ? 'var(--border-accent)' : colors.border}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: '700', color: colors.text }}>
                        {tech.id}
                      </span>
                      <span style={{ 
                        fontFamily: 'var(--font-mono)', 
                        fontSize: '10px', 
                        background: 'rgba(0,0,0,0.3)', 
                        padding: '1px 5px', 
                        borderRadius: '4px',
                        color: 'var(--text-secondary)'
                      }}>
                        {tech.count}x
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: '500', lineHeight: '1.2' }}>
                      {tech.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Technique Drilldown Drawer Modal */}
      {selectedTechnique && (
        <div className="modal-overlay" onClick={() => setSelectedTechnique(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={16} color="var(--primary)" />
                <h3 style={{ fontSize: '15px', color: '#fff' }}>
                  {selectedTechnique.id}: {selectedTechnique.name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedTechnique(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--bg-surface-2)', padding: '10px 14px', borderRadius: 'var(--radius-md)', flex: 1 }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Observed Detections</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff', fontFamily: 'var(--font-mono)' }}>{selectedTechnique.count} telemetry matches</div>
                </div>
                <div style={{ background: 'var(--bg-surface-2)', padding: '10px 14px', borderRadius: 'var(--radius-md)', flex: 1 }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Threat Classification</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: getSeverityColor(selectedTechnique.severity).text, textTransform: 'capitalize' }}>
                    {selectedTechnique.severity} Severity
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Correlated Incidents Involving This Technique
                </h4>
                {getMatchingIncidents(selectedTechnique.id).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {getMatchingIncidents(selectedTechnique.id).map(inc => (
                      <div 
                        key={inc.id}
                        onClick={() => {
                          setSelectedTechnique(null);
                          onSelectIncident(inc);
                        }}
                        style={{
                          background: 'var(--bg-surface-2)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#fff' }}>{inc.incident_key}</span>
                            <span className="sev-badge sev-badge-critical">{inc.severity}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{inc.title}</div>
                        </div>
                        <ArrowRight size={14} color="var(--primary)" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '12px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '12px' }}>
                    Detected in raw alert telemetry buffer; currently correlated into telemetry stream.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedTechnique(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Flame, 
  Search, 
  Filter, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import IncidentTable from '../components/IncidentTable';

export default function IncidentsPage({ incidents = [], onSelectIncident, onUpdateStatus }) {
  const [filterTab, setFilterTab] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = incidents.filter(inc => {
    if (filterTab === 'critical' && inc.severity !== 'critical') return false;
    if (filterTab === 'high' && inc.severity !== 'high' && inc.severity !== 'critical') return false;
    if (filterTab === 'investigating' && inc.status !== 'investigating') return false;
    if (filterTab === 'resolved' && inc.status !== 'resolved') return false;

    if (search) {
      const q = search.toLowerCase();
      const matchKey = inc.incident_key?.toLowerCase().includes(q);
      const matchTitle = inc.title?.toLowerCase().includes(q);
      const matchAsset = inc.asset_id?.toLowerCase().includes(q);
      const matchMitre = inc.mitre_technique?.toLowerCase().includes(q);
      if (!matchKey && !matchTitle && !matchAsset && !matchMitre) return false;
    }

    return true;
  });

  return (
    <div className="content-viewport">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Flame size={20} color="var(--primary)" />
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>
              Correlated Security Incidents
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Aggregated multi-stage attack clusters synthesized from normalized alert streams.
          </p>
        </div>

        {/* Status Tab Pills */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-surface-1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          gap: '4px'
        }}>
          {[
            { id: 'all', label: 'All Incidents' },
            { id: 'critical', label: 'Critical Only' },
            { id: 'investigating', label: 'Under Investigation' },
            { id: 'resolved', label: 'Resolved' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              style={{
                background: filterTab === tab.id ? 'var(--bg-surface-3)' : 'transparent',
                border: filterTab === tab.id ? '1px solid var(--border-medium)' : '1px solid transparent',
                borderRadius: 'var(--radius-sm)',
                padding: '5px 12px',
                fontSize: '12px',
                color: filterTab === tab.id ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: filterTab === tab.id ? '600' : '500',
                transition: 'var(--transition-fast)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Search */}
      <div style={{
        background: 'var(--bg-surface-1)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search incident by key, attack title, target asset, MITRE technique..."
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
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {filtered.length} incidents found
        </div>
      </div>

      {/* Incident Table */}
      <IncidentTable 
        incidents={filtered} 
        onSelectIncident={onSelectIncident}
        title="Prioritized Incident Ledger"
      />
    </div>
  );
}

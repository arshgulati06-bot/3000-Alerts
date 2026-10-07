import React from 'react';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Radio, 
  Flame, 
  Microscope, 
  Grid3X3, 
  Server, 
  Activity, 
  UserCheck,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ currentTab, onSelectTab, criticalCount = 2, totalIncidents = 14 }) {
  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
      ],
    },
    {
      title: 'INVESTIGATE',
      items: [
        { id: 'alerts', label: 'Alert Queue', icon: Radio, badge: '3.1k', badgeType: 'info' },
        { id: 'incidents', label: 'Incidents', icon: Flame, badge: criticalCount > 0 ? `${criticalCount} CRIT` : null, badgeType: 'critical' },
        { id: 'investigation', label: 'Investigation Sandbox', icon: Microscope, badge: null },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'mitre', label: 'MITRE ATT&CK', icon: Grid3X3, badge: 'Enterprise' },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'status', label: 'System Status', icon: Server, badge: 'Live' },
      ],
    },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <ShieldAlert size={20} />
        </div>
        <div>
          <div className="sidebar-brand-title">SWORDERS SOC</div>
          <div className="sidebar-brand-sub">Microsoft Innovate 2026</div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="sidebar-nav">
        {navSections.map((sec) => (
          <div key={sec.title}>
            <div className="sidebar-section-title">{sec.title}</div>
            <ul className="sidebar-menu">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => onSelectTab(item.id)}
                      style={{ width: '100%', background: 'transparent', textAlign: 'left' }}
                    >
                      <Icon size={16} color={isActive ? '#38bdf8' : '#94a3b8'} />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className={`nav-badge ${item.badgeType === 'critical' ? 'nav-badge-critical' : 'nav-badge-info'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer / Analyst Profile */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #1e293b, #334155)', 
            border: '1px solid var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
            fontWeight: '600',
            fontSize: '12px'
          }}>
            AM
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Alex Mercer
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
              Tier-2 Analyst (Shift A)
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

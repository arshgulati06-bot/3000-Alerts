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
  ChevronRight,
  LogOut
} from 'lucide-react';

function formatCount(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export default function Sidebar({ currentTab, onSelectTab, criticalCount = 0, totalIncidents = 0, alertCount = 0, user, offline, onLogout }) {
  const initials = (user?.full_name || 'Offline Demo').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
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
        { id: 'alerts', label: 'Alert Queue', icon: Radio, badge: alertCount ? formatCount(alertCount) : null, badgeType: 'info' },
        { id: 'incidents', label: 'Incidents', icon: Flame, badge: criticalCount > 0 ? `${criticalCount} CRIT` : null, badgeType: 'critical' },
        { id: 'investigation', label: 'Investigation Workspace', icon: Microscope, badge: null },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'mitre', label: 'MITRE ATT&CK', icon: Grid3X3, badge: null },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'status', label: 'System Status', icon: Server, badge: offline ? 'Demo' : 'Live' },
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
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.full_name || 'Offline demo session'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: offline ? '#eab308' : '#10b981' }}></span>
              {offline ? 'Not signed in' : (user?.role || 'SOC Analyst')}
            </div>
          </div>
          <button className="sidebar-logout" onClick={onLogout} title={offline ? 'Exit offline mode' : 'Sign out'} aria-label="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

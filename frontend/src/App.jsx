import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle2, XCircle, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import AlertsPage from './pages/AlertsPage';
import IncidentsPage from './pages/IncidentsPage';
import MitrePage from './pages/MitrePage';
import InvestigationPage from './pages/InvestigationPage';
import SystemStatusPage from './pages/SystemStatusPage';
import LoginPage from './pages/LoginPage';
import IngestAlertModal from './components/IngestAlertModal';
import {
  checkHealth, fetchAlerts, fetchIncidents, fetchKPIs, updateIncidentStatus,
  getStoredSession, fetchCurrentUser, clearSession,
} from './services/api';

const TABS = ['dashboard', 'alerts', 'incidents', 'investigation', 'mitre', 'status'];

/** Hash routes keep the current page (and investigated incident) across refresh and back/forward. */
function parseHash() {
  const [tab, id] = window.location.hash.replace(/^#\/?/, '').split('/');
  return { tab: TABS.includes(tab) ? tab : 'dashboard', incidentId: id || null };
}

function navigateTo(tab, incidentId) {
  const next = `#/${tab}${incidentId != null ? `/${incidentId}` : ''}`;
  if (window.location.hash !== next) window.location.hash = next;
}

export default function App() {
  const [route, setRoute] = useState(parseHash);
  const [backendStatus, setBackendStatus] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState({ alerts: false, incidents: false });
  const [toasts, setToasts] = useState([]);

  // auth: 'checking' | 'signed-out' | 'signed-in' | 'offline'
  const [authState, setAuthState] = useState('checking');
  const [user, setUser] = useState(null);

  const notify = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Restore session on load: validate stored token against /api/auth/me
  useEffect(() => {
    (async () => {
      const health = await checkHealth();
      setBackendStatus(health);
      const session = getStoredSession();
      if (!session) { setAuthState('signed-out'); return; }
      if (!health.connected) { setAuthState('signed-out'); return; }
      try {
        const me = await fetchCurrentUser();
        if (me) { setUser(me); setAuthState('signed-in'); } else { setAuthState('signed-out'); }
      } catch {
        setAuthState('signed-out');
      }
    })();
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const healthRes = await checkHealth();
      setBackendStatus(healthRes);
      // Skip API calls entirely when the backend is down (no console noise, instant demo fallback)
      const [kpisRes, incRes, altRes] = await Promise.all([
        fetchKPIs(),
        healthRes.connected ? fetchIncidents() : fetchIncidents({ offline: true }),
        healthRes.connected ? fetchAlerts({ page_size: 500 }) : fetchAlerts({ offline: true }),
      ]);
      setKpis(kpisRes);
      setIncidents(incRes.items || []);
      setAlerts(altRes.items || []);
      setDataSource({ alerts: !!altRes.isLive, incidents: !!incRes.isLive });
    } catch (err) {
      console.error('Error loading telemetry:', err);
      notify('Could not load SOC data. Showing what is available.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    if (authState === 'signed-in' || authState === 'offline') loadData();
  }, [authState, loadData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsIngestModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setAuthState('signed-out');
    setIncidents([]);
    setAlerts([]);
    navigateTo('dashboard');
  };

  const openInvestigation = (incident) => {
    navigateTo('investigation', incident?.id);
    window.scrollTo?.(0, 0);
  };

  const handleUpdateIncidentStatus = async (id, newStatus) => {
    const previous = incidents.find(i => i.id === id)?.status;
    if (previous === newStatus) return;
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: newStatus } : inc));
    const key = incidents.find(i => i.id === id)?.incident_key || `#${id}`;

    if (!dataSource.incidents) {
      notify(`${key} → ${newStatus.toUpperCase()} (offline demo — not persisted)`, 'info');
      return;
    }
    const res = await updateIncidentStatus(id, newStatus);
    if (res.ok) {
      notify(`${key} moved to ${newStatus.toUpperCase()} · saved to database`);
      return;
    }
    // Roll back the optimistic update so the UI never lies about persisted state
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: previous } : inc));
    if (res.status === 401) {
      notify('Your session expired. Please sign in again.', 'error');
      handleLogout();
    } else {
      notify(`Status not saved: ${res.error}`, 'error');
    }
  };

  const handleAlertIngested = (newAlert) => {
    setAlerts(prev => [newAlert, ...prev]);
    notify(`Alert ${newAlert.external_alert_id || `#${newAlert.id}`} ingested via POST /api/alerts`);
  };

  // ---------------------------------------------------------------------------
  if (authState === 'checking') {
    return (
      <div className="auth-shell">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (authState === 'signed-out') {
    return (
      <LoginPage
        backendOnline={!!backendStatus?.connected}
        onAuthenticated={(u) => { setUser(u); setAuthState('signed-in'); notify(`Signed in as ${u.full_name}`); }}
        onOfflineDemo={() => { setUser(null); setAuthState('offline'); }}
      />
    );
  }

  const selectedIncident = incidents.find(i => String(i.id) === String(route.incidentId)) || null;
  const openCritical = incidents.filter(i => i.severity === 'critical' && !['contained', 'resolved'].includes(i.status)).length;

  const renderContent = () => {
    switch (route.tab) {
      case 'alerts':
        return (
          <AlertsPage
            alerts={alerts}
            incidents={incidents}
            isLive={dataSource.alerts}
            onInvestigate={openInvestigation}
            onOpenIngestModal={() => setIsIngestModalOpen(true)}
            searchQuery={globalSearch}
            onSearchChange={setGlobalSearch}
          />
        );
      case 'incidents':
        return <IncidentsPage incidents={incidents} onSelectIncident={openInvestigation} />;
      case 'investigation':
        return (
          <InvestigationPage
            incidents={incidents}
            alerts={alerts}
            selectedIncident={selectedIncident}
            onSelectIncident={openInvestigation}
            onUpdateStatus={handleUpdateIncidentStatus}
            isLive={dataSource.incidents}
          />
        );
      case 'mitre':
        return <MitrePage incidents={incidents} alerts={alerts} onSelectIncident={openInvestigation} />;
      case 'status':
        return <SystemStatusPage dataSource={dataSource} alertCount={alerts.length} incidentCount={incidents.length} />;
      default:
        return (
          <DashboardPage
            kpis={kpis}
            incidents={incidents}
            alerts={alerts}
            backendStatus={backendStatus}
            isLive={dataSource.alerts}
            onNavigate={(tab) => navigateTo(tab)}
            onSelectIncident={openInvestigation}
          />
        );
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        currentTab={route.tab}
        onSelectTab={(tab) => navigateTo(tab)}
        criticalCount={openCritical}
        totalIncidents={incidents.length}
        alertCount={alerts.length}
        user={user}
        offline={authState === 'offline'}
        onLogout={handleLogout}
      />

      <div className="main-wrapper">
        <Navbar
          backendStatus={backendStatus}
          criticalCount={openCritical}
          onOpenIngestModal={() => setIsIngestModalOpen(true)}
          searchQuery={globalSearch}
          onSearch={(query) => {
            setGlobalSearch(query);
            if (query && route.tab !== 'alerts') navigateTo('alerts');
          }}
        />

        {!isLoading && !backendStatus?.connected && (
          <div className="offline-banner" role="status">
            <AlertTriangle size={14} />
            <span>SOC API unreachable — showing bundled <strong>DEMO DATA</strong>. Status changes and ingestion are not persisted.</span>
            <button className="btn btn-secondary btn-sm" onClick={loadData}><RefreshCw size={12} /> Retry</button>
          </div>
        )}

        <main style={{ flex: 1 }}>
          {isLoading ? (
            <div className="content-viewport" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
              <div className="loading-spinner" />
              <span style={{ fontSize: '13px' }}>Connecting to SOC telemetry pipeline…</span>
            </div>
          ) : renderContent()}
        </main>
      </div>

      {isIngestModalOpen && (
        <IngestAlertModal
          backendOnline={!!backendStatus?.connected}
          onClose={() => setIsIngestModalOpen(false)}
          onAlertIngested={handleAlertIngested}
        />
      )}

      <div className="toast-stack" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'error' ? <XCircle size={15} /> : t.type === 'info' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
            <span>{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} aria-label="Dismiss"><X size={13} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

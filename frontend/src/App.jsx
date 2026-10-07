import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import AlertsPage from './pages/AlertsPage';
import IncidentsPage from './pages/IncidentsPage';
import MitrePage from './pages/MitrePage';
import InvestigationPage from './pages/InvestigationPage';
import SystemStatusPage from './pages/SystemStatusPage';
import IngestAlertModal from './components/IngestAlertModal';
import { checkHealth, fetchAlerts, fetchIncidents, fetchKPIs, updateIncidentStatus } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [backendStatus, setBackendStatus] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState({ alerts: false, incidents: false });

  // Selecting an incident anywhere opens the full investigation workspace
  const openInvestigation = (incident) => {
    setSelectedIncident(incident);
    setCurrentTab('investigation');
    window.scrollTo?.(0, 0);
  };

  // Initialize data
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const [healthRes, kpisRes, incRes, altRes] = await Promise.all([
          checkHealth(),
          fetchKPIs(),
          fetchIncidents(),
          fetchAlerts({ page_size: 500 }),
        ]);
        setBackendStatus(healthRes);
        setKpis(kpisRes);
        setIncidents(incRes.items || []);
        setAlerts(altRes.items || []);
        setDataSource({ alerts: !!altRes.isLive, incidents: !!incRes.isLive });
      } catch (err) {
        console.error('Error loading initial telemetry:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Keyboard shortcut navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsIngestModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUpdateIncidentStatus = (id, newStatus) => {
    // Optimistic UI update; persisted via PATCH /api/incidents/{id} when backend is live
    if (dataSource.incidents) updateIncidentStatus(id, newStatus);
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: newStatus } : inc));
    if (selectedIncident && selectedIncident.id === id) {
      setSelectedIncident(prev => ({ ...prev, status: newStatus }));
    }
  };

  const handleAlertIngested = (newAlert) => {
    setAlerts(prev => [newAlert, ...prev]);
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardPage
            kpis={kpis}
            incidents={incidents}
            alerts={alerts}
            backendStatus={backendStatus}
            onNavigate={setCurrentTab}
            onSelectIncident={openInvestigation}
          />
        );
      case 'alerts':
        return (
          <AlertsPage
            alerts={alerts}
            incidents={incidents}
            isLive={dataSource.alerts}
            onInvestigate={openInvestigation}
            onOpenIngestModal={() => setIsIngestModalOpen(true)}
          />
        );
      case 'incidents':
        return (
          <IncidentsPage
            incidents={incidents}
            onSelectIncident={openInvestigation}
            onUpdateStatus={handleUpdateIncidentStatus}
          />
        );
      case 'investigation':
        return (
          <InvestigationPage
            incidents={incidents}
            alerts={alerts}
            selectedIncident={selectedIncident}
            onSelectIncident={setSelectedIncident}
            onUpdateStatus={handleUpdateIncidentStatus}
            isLive={dataSource.incidents}
          />
        );
      case 'mitre':
        return (
          <MitrePage
            incidents={incidents}
            onSelectIncident={openInvestigation}
          />
        );
      case 'status':
        return <SystemStatusPage dataSource={dataSource} alertCount={alerts.length} incidentCount={incidents.length} />;
      default:
        return (
          <DashboardPage
            kpis={kpis}
            incidents={incidents}
            alerts={alerts}
            backendStatus={backendStatus}
            onNavigate={setCurrentTab}
            onSelectIncident={openInvestigation}
          />
        );
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        criticalCount={incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved').length}
        totalIncidents={incidents.length}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Navbar
          backendStatus={backendStatus}
          onOpenIngestModal={() => setIsIngestModalOpen(true)}
          searchQuery={globalSearch}
          onSearch={(query) => {
            setGlobalSearch(query);
            if (query && currentTab !== 'alerts' && currentTab !== 'incidents') {
              setCurrentTab('alerts');
            }
          }}
        />

        <main style={{ flex: 1 }}>
          {isLoading ? (
            <div className="content-viewport" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
              <div className="loading-spinner" />
              <span style={{ fontSize: '13px' }}>Connecting to SOC telemetry pipeline…</span>
            </div>
          ) : renderContent()}
        </main>
      </div>


      {/* Ingest Alert Modal (Real Backend POST /api/alerts) */}
      {isIngestModalOpen && (
        <IngestAlertModal
          onClose={() => setIsIngestModalOpen(false)}
          onAlertIngested={handleAlertIngested}
        />
      )}
    </div>
  );
}

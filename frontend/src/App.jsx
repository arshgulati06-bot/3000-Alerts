import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import AlertsPage from './pages/AlertsPage';
import IncidentsPage from './pages/IncidentsPage';
import MitrePage from './pages/MitrePage';
import InvestigationPage from './pages/InvestigationPage';
import SystemStatusPage from './pages/SystemStatusPage';
import IncidentDetail from './components/IncidentDetail';
import IngestAlertModal from './components/IngestAlertModal';
import { checkHealth, fetchAlerts, fetchIncidents, fetchKPIs } from './services/api';

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

  // Initialize data
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const [healthRes, kpisRes, incRes, altRes] = await Promise.all([
          checkHealth(),
          fetchKPIs(),
          fetchIncidents(),
          fetchAlerts(),
        ]);
        setBackendStatus(healthRes);
        setKpis(kpisRes);
        setIncidents(incRes.items || []);
        setAlerts(altRes.items || []);
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
        setSelectedIncident(null);
        setIsIngestModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUpdateIncidentStatus = (id, newStatus) => {
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
            onSelectIncident={setSelectedIncident}
          />
        );
      case 'alerts':
        return (
          <AlertsPage
            alerts={alerts}
            onOpenIngestModal={() => setIsIngestModalOpen(true)}
          />
        );
      case 'incidents':
        return (
          <IncidentsPage
            incidents={incidents}
            onSelectIncident={setSelectedIncident}
            onUpdateStatus={handleUpdateIncidentStatus}
          />
        );
      case 'investigation':
        return (
          <InvestigationPage
            onSelectIncident={setSelectedIncident}
          />
        );
      case 'mitre':
        return (
          <MitrePage
            incidents={incidents}
            onSelectIncident={setSelectedIncident}
          />
        );
      case 'status':
        return <SystemStatusPage />;
      default:
        return (
          <DashboardPage
            kpis={kpis}
            incidents={incidents}
            onSelectIncident={setSelectedIncident}
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
          {renderContent()}
        </main>
      </div>

      {/* Detailed Investigation Modal */}
      {selectedIncident && (
        <IncidentDetail
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onUpdateStatus={handleUpdateIncidentStatus}
        />
      )}

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

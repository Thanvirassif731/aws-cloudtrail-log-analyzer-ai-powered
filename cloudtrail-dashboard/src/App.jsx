import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import EventsTable from './components/EventsTable';
import EventDetailModal from './components/EventDetailModal';
import HelpGuideModal from './components/HelpGuideModal';
import LocationsModal from './components/LocationsModal';
import NotificationBanner from './components/NotificationBanner';
import Footer from './components/Footer';
import AIUsageDashboard from './components/AIUsageDashboard';
import AISettingsModal from './components/AISettingsModal';
import ErrorBoundary from './components/ErrorBoundary';
import { api } from './api';

function MainLayout() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'table' | 'aiUsage'
  const [stats, setStats] = useState(null);
  const [sources, setSources] = useState([]);
  const [activeFetchState, setActiveFetchState] = useState(null);
  const [tableFilters, setTableFilters] = useState({});
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLocationsModal, setShowLocationsModal] = useState(false);
  const [showAISettingsModal, setShowAISettingsModal] = useState(false);

  const fetchIntervalRef = useRef(null);

  // Load stats and sources on login
  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  // Polling while S3 fetch is active
  useEffect(() => {
    if (activeFetchState?.isFetching) {
      if (!fetchIntervalRef.current) {
        fetchIntervalRef.current = setInterval(async () => {
          try {
            const status = await api.getFetchStatus();
            setActiveFetchState(status);
            if (!status.isFetching) {
              clearInterval(fetchIntervalRef.current);
              fetchIntervalRef.current = null;
              await loadAllData();
            }
          } catch (e) {
            // ignore
          }
        }, 1500);
      }
    } else {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
        fetchIntervalRef.current = null;
      }
    }

    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
        fetchIntervalRef.current = null;
      }
    };
  }, [activeFetchState?.isFetching]);

  const loadAllData = async () => {
    await Promise.all([loadStats(), loadSources()]);
  };

  const loadSources = async () => {
    try {
      const data = await api.getSources();
      setSources(data.sources || []);
      if (data.activeFetchState) {
        setActiveFetchState(data.activeFetchState);
      }
      if ((data.sources || []).length === 0) {
        setShowLocationsModal(true);
      }
    } catch (err) {
      console.error('Failed to load sources info:', err);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
      if (data.activeFetchState) {
        setActiveFetchState(data.activeFetchState);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleRescan = async () => {
    setScanning(true);
    try {
      const res = await api.rescanLogs();
      if (res.stats) {
        setStats(res.stats);
      }
      if (res.sources) {
        setSources(res.sources);
      } else {
        await loadAllData();
      }
    } catch (err) {
      console.error('Rescan error:', err);
    } finally {
      setScanning(false);
    }
  };

  const handleSourcesUpdated = async () => {
    await loadAllData();
  };

  const handleNavigateToTable = (filters = {}) => {
    setTableFilters(filters);
    setActiveTab('table');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-slate-400 text-sm">Initializing CloudTrail portal...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onRescan={handleRescan}
        scanning={scanning}
        onOpenHelp={() => setShowHelp(true)}
        sources={sources}
        onOpenLocationsModal={() => setShowLocationsModal(true)}
        onOpenAISettings={() => setShowAISettingsModal(true)}
        stats={stats}
      />

      {/* In-App Progress and Notification Banner */}
      <NotificationBanner
        activeFetchState={activeFetchState}
        onDismissNotification={() => {
          setActiveFetchState(prev => prev ? ({ ...prev, lastNotification: null }) : null);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <ErrorBoundary key={activeTab} onGoHome={() => setActiveTab('dashboard')}>
          {activeTab === 'dashboard' ? (
            <Dashboard 
              stats={stats} 
              onNavigateToTable={handleNavigateToTable} 
              onOpenLocationsModal={() => setShowLocationsModal(true)}
            />
          ) : activeTab === 'table' ? (
            <EventsTable 
              initialFilters={tableFilters}
              onSelectEvent={(id) => setSelectedEventId(id)}
              onOpenLocationsModal={() => setShowLocationsModal(true)}
              sources={sources}
            />
          ) : (
            <AIUsageDashboard 
              onOpenSettings={() => setShowAISettingsModal(true)}
              onNavigateToEvent={(id) => {
                setSelectedEventId(id);
              }}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* App Footer */}
      <Footer />

      {/* Event Details Modal */}
      {selectedEventId && (
        <EventDetailModal 
          eventId={selectedEventId} 
          onClose={() => setSelectedEventId(null)} 
        />
      )}

      {/* AI Settings & Credentials Modal */}
      <AISettingsModal
        isOpen={showAISettingsModal}
        onClose={() => setShowAISettingsModal(false)}
      />

      {/* Multi-Location Management Modal (Local & S3) */}
      <LocationsModal
        isOpen={showLocationsModal}
        onClose={() => setShowLocationsModal(false)}
        onSourcesUpdated={handleSourcesUpdated}
        sources={sources}
        activeFetchState={activeFetchState}
      />

      {/* User Guide & Instructions Modal */}
      {showHelp && (
        <HelpGuideModal onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

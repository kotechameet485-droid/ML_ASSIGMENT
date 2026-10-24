import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import type { ViewTab } from './components/Sidebar';
import { OverviewView } from './views/OverviewView';
import { FleetExplorerView } from './views/FleetExplorerView';
import { PredictionWorkspaceView } from './views/PredictionWorkspaceView';
import { BenchmarkLabView } from './views/BenchmarkLabView';
import { ExplainabilityView } from './views/ExplainabilityView';
import { ErrorDiagnosticsView } from './views/ErrorDiagnosticsView';
import { DatasetProvenanceView } from './views/DatasetProvenanceView';
import { fetchHealth } from './services/api';
import type { HealthStatus } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('overview');
  const [currentSubset, setCurrentSubset] = useState<string>('FD001');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  // Poll backend health
  useEffect(() => {
    let mounted = true;

    const checkHealth = () => {
      fetchHealth()
        .then((res) => {
          if (!mounted) return;
          setHealth(res);
          setIsBackendConnected(true);
        })
        .catch(() => {
          if (!mounted) return;
          setIsBackendConnected(false);
        });
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-sky-500 selection:text-white">
      {/* Global Header Bar */}
      <Header
        currentSubset={currentSubset}
        onSubsetChange={setCurrentSubset}
        health={health}
        isBackendConnected={isBackendConnected}
      />

      {/* Main Body Shell */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          currentSubset={currentSubset}
          isBackendConnected={isBackendConnected}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 text-slate-900">
          {currentTab === 'overview' && (
            <OverviewView
              currentSubset={currentSubset}
              onNavigate={setCurrentTab}
              onSelectSubset={setCurrentSubset}
            />
          )}

          {currentTab === 'explorer' && (
            <FleetExplorerView currentSubset={currentSubset} />
          )}

          {currentTab === 'prediction' && (
            <PredictionWorkspaceView
              currentSubset={currentSubset}
              onSelectSubset={setCurrentSubset}
            />
          )}

          {currentTab === 'benchmarks' && <BenchmarkLabView />}

          {currentTab === 'explainability' && <ExplainabilityView />}

          {currentTab === 'errors' && <ErrorDiagnosticsView />}

          {currentTab === 'datasets' && (
            <DatasetProvenanceView
              currentSubset={currentSubset}
              onSelectSubset={setCurrentSubset}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

import { useState, useEffect, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import type { ViewTab } from './components/Sidebar';
import { fetchHealth } from './services/api';
import type { HealthStatus } from './types';
import { Activity } from 'lucide-react';

const OverviewView = lazy(() => import('./views/OverviewView').then(m => ({ default: m.OverviewView })));
const FleetExplorerView = lazy(() => import('./views/FleetExplorerView').then(m => ({ default: m.FleetExplorerView })));
const PredictionWorkspaceView = lazy(() => import('./views/PredictionWorkspaceView').then(m => ({ default: m.PredictionWorkspaceView })));
const BenchmarkLabView = lazy(() => import('./views/BenchmarkLabView').then(m => ({ default: m.BenchmarkLabView })));
const ExplainabilityView = lazy(() => import('./views/ExplainabilityView').then(m => ({ default: m.ExplainabilityView })));
const ErrorDiagnosticsView = lazy(() => import('./views/ErrorDiagnosticsView').then(m => ({ default: m.ErrorDiagnosticsView })));
const DatasetProvenanceView = lazy(() => import('./views/DatasetProvenanceView').then(m => ({ default: m.DatasetProvenanceView })));

function ViewLoadingFallback({ viewName }: { viewName: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 space-y-4">
      <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-white border border-[#DDE2E5] shadow-xs">
        <Activity className="w-5 h-5 animate-spin text-[#0F62FE]" />
      </div>
      <div className="flex flex-col items-center space-y-1">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800">
          Loading {viewName}
        </span>
        <span className="font-mono text-[11px] text-slate-500">
          Mounting analytical telemetry canvas...
        </span>
      </div>
    </div>
  );
}

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
        currentTab={currentTab}
        onNavigate={setCurrentTab}
      />

      {/* Main Body Shell */}
      <div className="flex flex-1 flex-col md:flex-row relative">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          currentSubset={currentSubset}
          isBackendConnected={isBackendConnected}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 min-w-0 bg-slate-50 text-slate-900 min-h-[calc(100vh-3.5rem)]">
          {currentTab === 'overview' && (
            <Suspense fallback={<ViewLoadingFallback viewName="Executive Overview" />}>
              <OverviewView
                currentSubset={currentSubset}
                onNavigate={setCurrentTab}
                onSelectSubset={setCurrentSubset}
              />
            </Suspense>
          )}

          {currentTab === 'explorer' && (
            <Suspense fallback={<ViewLoadingFallback viewName="Fleet Explorer" />}>
              <FleetExplorerView currentSubset={currentSubset} />
            </Suspense>
          )}

          {currentTab === 'prediction' && (
            <Suspense fallback={<ViewLoadingFallback viewName="RUL Prediction" />}>
              <PredictionWorkspaceView
                currentSubset={currentSubset}
                onSelectSubset={setCurrentSubset}
              />
            </Suspense>
          )}

          {currentTab === 'benchmarks' && (
            <Suspense fallback={<ViewLoadingFallback viewName="Model Laboratory" />}>
              <BenchmarkLabView />
            </Suspense>
          )}

          {currentTab === 'explainability' && (
            <Suspense fallback={<ViewLoadingFallback viewName="Explainability (TreeSHAP)" />}>
              <ExplainabilityView />
            </Suspense>
          )}

          {currentTab === 'errors' && (
            <Suspense fallback={<ViewLoadingFallback viewName="Error Diagnostics" />}>
              <ErrorDiagnosticsView />
            </Suspense>
          )}

          {currentTab === 'datasets' && (
            <Suspense fallback={<ViewLoadingFallback viewName="Dataset Provenance" />}>
              <DatasetProvenanceView
                currentSubset={currentSubset}
                onSelectSubset={setCurrentSubset}
              />
            </Suspense>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

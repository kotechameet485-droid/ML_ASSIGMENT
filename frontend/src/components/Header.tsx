import React from 'react';
import { Database, ShieldCheck, AlertTriangle, Activity, Cpu } from 'lucide-react';
import type { HealthStatus } from '../types';

interface HeaderProps {
  currentSubset: string;
  onSubsetChange: (subset: string) => void;
  health: HealthStatus | null;
  isBackendConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentSubset,
  onSubsetChange,
  health,
  isBackendConnected
}) => {
  const isFd001 = currentSubset === 'FD001';

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-5 flex items-center justify-between sticky top-0 z-50 select-none shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Brand & Project Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-xs">
          <Cpu className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold tracking-tight text-slate-900 text-sm">
            EngineMind
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 font-medium hidden sm:inline">
            Turbofan C-MAPSS
          </span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <span className="text-slate-800 font-semibold font-mono">
            {currentSubset}
          </span>
        </div>
      </div>

      {/* Dataset Scope Segmented Control */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <div className="hidden md:flex items-center gap-1.5 px-2 text-[11px] font-mono text-slate-500 font-medium">
            <Database className="w-3.5 h-3.5" />
            <span>Dataset:</span>
          </div>
          {(['FD001', 'FD002', 'FD003', 'FD004'] as const).map((s) => {
            const isSelected = currentSubset === s;
            const hasModel = s === 'FD001';
            return (
              <button
                key={s}
                onClick={() => onSubsetChange(s)}
                className={`text-xs font-mono px-2.5 py-1 rounded-md transition-all ${
                  isSelected
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title={
                  hasModel
                    ? 'FD001: Verified Trained Pipeline & Blind Benchmarks'
                    : `${s}: Multi-Condition Raw Telemetry Exploration`
                }
              >
                {s}
                {hasModel && <span className="ml-1 text-[10px] text-sky-600 font-bold">★</span>}
              </button>
            );
          })}
        </div>

        {/* Pipeline Readiness Tag */}
        {isFd001 ? (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-md text-[11px] font-mono text-emerald-800 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tuned XGBoost (MAE 13.94)</span>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-md text-[11px] font-mono text-amber-800 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Telemetry Only ({currentSubset})</span>
          </div>
        )}

        {/* API Runtime Status */}
        <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              isBackendConnected ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          />
          <span className="text-slate-600 text-[11px] font-medium">
            {isBackendConnected ? 'API 8000' : 'Offline'}
          </span>
          {health && (
            <Activity className="w-3 h-3 text-slate-400 hidden xl:inline" />
          )}
        </div>
      </div>
    </header>
  );
};

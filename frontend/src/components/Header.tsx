import React from 'react';
import { Database, ShieldCheck, AlertTriangle, School } from 'lucide-react';
import { EngineMindRotor } from './Logo';
import type { HealthStatus } from '../types';
import type { ViewTab } from './Sidebar';

interface HeaderProps {
  currentSubset: string;
  onSubsetChange: (subset: string) => void;
  health: HealthStatus | null;
  isBackendConnected: boolean;
  currentTab?: ViewTab;
  onNavigate?: (tab: ViewTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSubset,
  onSubsetChange,
  health,
  isBackendConnected,
  onNavigate
}) => {
  const isFd001 = currentSubset === 'FD001';

  return (
    <header className="w-full h-14 border-b border-[#DDE2E5] bg-white/95 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between sticky top-0 z-50 select-none shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all">
      {/* Brand Identity & System Status */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => onNavigate?.('overview')}
          className="flex items-center gap-2.5 py-1 px-1.5 rounded-lg hover:bg-slate-100/90 transition-colors cursor-pointer group text-left"
          title="EngineMind — Navigate to Executive Overview"
        >
          <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 shadow-xs border border-slate-700/60 group-hover:border-blue-500 transition-colors">
            <EngineMindRotor className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-bold text-sm tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                EngineMind
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                v2.4
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 leading-none mt-1">
              NASA C-MAPSS Intelligence
            </span>
          </div>
        </button>

        <div className="h-5 w-px bg-slate-200 hidden md:block" />

        <div className="hidden xl:flex items-center gap-1.5 text-xs font-mono text-slate-500 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Operational Intelligence</span>
        </div>
      </div>

      {/* Realistic Interactive Controls & Status Indicators */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 pl-2">
        {/* Realistic Industrial Segmented Subset Selector */}
        <div className="inline-flex items-center bg-[#ECEFF2] p-1 rounded-lg border border-[#D5DCE2] shadow-inner gap-0.5">
          <div className="hidden sm:flex items-center gap-1 pl-1.5 pr-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
            <Database className="w-3 h-3 text-[#0F62FE]" />
            <span>Subset</span>
          </div>

          {(['FD001', 'FD002', 'FD003', 'FD004'] as const).map((s) => {
            const isSelected = currentSubset === s;
            const hasModel = s === 'FD001';
            return (
              <button
                key={s}
                type="button"
                onClick={() => onSubsetChange(s)}
                className={`relative flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)] border border-slate-300/90'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium active:scale-95'
                }`}
                title={
                  hasModel
                    ? 'FD001: Verified Pipeline & Pre-trained XGBoost Model'
                    : `${s}: Multi-Condition Raw Telemetry Exploration`
                }
              >
                <span>{s}</span>
                {hasModel && (
                  <span className={`text-[9px] font-black px-1 rounded-xs tracking-tighter ${
                    isSelected ? 'bg-blue-50 text-[#0F62FE]' : 'text-slate-400'
                  }`}>
                    ★
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Model Readiness Tag */}
        {isFd001 ? (
          <div
            className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-linear-to-b from-white to-emerald-50/70 border border-emerald-300/80 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.04)] text-xs font-mono"
            title="Active Model: XGBoost Regressor tuned on FD001 (MAE: 13.94 cycles)"
          >
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
              <ShieldCheck className="w-3 h-3" />
            </span>
            <span className="font-semibold text-slate-800">Tuned XGBoost</span>
            <span className="px-1.5 py-0.2 bg-emerald-600 text-white text-[10px] font-bold rounded-xs shadow-2xs">
              MAE 13.94
            </span>
          </div>
        ) : (
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-linear-to-b from-white to-amber-50/70 border border-amber-300/80 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.04)] text-xs font-mono"
            title={`Exploring multi-regime telemetry for ${currentSubset}`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-semibold text-slate-800">Telemetry Only</span>
            <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-bold rounded-xs shadow-2xs">
              {currentSubset}
            </span>
          </div>
        )}

        {/* Realistic API Health Pill */}
        <div
          className="flex items-center gap-2 px-2.5 py-1 bg-white border border-slate-300/80 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.04)] text-xs font-mono"
          title={isBackendConnected ? 'Backend FastAPI server active on port 8000' : 'Backend server unreachable'}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isBackendConnected ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isBackendConnected ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
          </span>
          <span className="text-slate-700 font-semibold text-[11px] hidden sm:inline">
            API :8000
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-xs uppercase tracking-wider ${
              isBackendConnected
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {isBackendConnected ? (health?.status === 'ok' ? 'HEALTHY' : 'ONLINE') : 'OFFLINE'}
          </span>
        </div>

        {/* Academic Benchmark Badge */}
        <div
          className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white border border-slate-300/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          title="NASA Commercial Modular Aero-Propulsion System Simulation Benchmark"
        >
          <div className="w-6 h-6 rounded bg-blue-50 border border-blue-200/80 flex items-center justify-center text-[#0F62FE] shrink-0">
            <School className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold text-slate-800 leading-tight">
              Academic Research
            </span>
            <span className="text-[9px] text-slate-500 font-mono leading-none">
              NASA C-MAPSS
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};


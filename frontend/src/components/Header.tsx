import React from 'react';
import { Database, ShieldCheck, AlertTriangle, School } from 'lucide-react';
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
    <header className="h-14 border-b border-[#DDE2E5] bg-white px-5 flex items-center justify-between sticky top-0 z-50 select-none shadow-[0_1px_2px_rgba(30,37,43,0.04)]">
      {/* Workflow Breadcrumb Bar from Stitch */}
      <div className="flex items-center gap-4 overflow-hidden">
        <div className="flex items-center gap-1.5 text-xs text-[#5A6570] font-mono">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#737687] font-bold">
            Workflow:
          </span>
          <span className="hover:text-[#0F62FE] transition-colors">Raw Ingestion</span>
          <span className="text-[#C3C6D8]">›</span>
          <span className="hover:text-[#0F62FE] transition-colors">Causal Features</span>
          <span className="text-[#C3C6D8]">›</span>
          <span className="hover:text-[#0F62FE] transition-colors">Model Lab</span>
          <span className="text-[#C3C6D8]">›</span>
          <span className="hover:text-[#0F62FE] transition-colors">RUL Inference</span>
          <span className="text-[#C3C6D8]">›</span>
          <span className="text-[#0F62FE] font-bold">TreeSHAP</span>
        </div>
      </div>

      {/* Controls & Badges */}
      <div className="flex items-center gap-3">
        {/* Dataset Segmented Selector */}
        <div className="flex items-center bg-[#F1F3F5] p-0.5 rounded border border-[#DDE2E5]">
          <div className="hidden sm:flex items-center gap-1 px-2 text-[10px] font-mono text-[#5A6570] font-bold uppercase">
            <Database className="w-3 h-3 text-[#0F62FE]" />
            <span>Subset:</span>
          </div>
          {(['FD001', 'FD002', 'FD003', 'FD004'] as const).map((s) => {
            const isSelected = currentSubset === s;
            const hasModel = s === 'FD001';
            return (
              <button
                key={s}
                onClick={() => onSubsetChange(s)}
                className={`text-[11px] font-mono px-2 py-0.5 rounded transition-all ${
                  isSelected
                    ? 'bg-white text-[#121D26] font-bold shadow-xs border border-[#CDD5DA]'
                    : 'text-[#5A6570] hover:text-[#121D26] hover:bg-[#E5E9EC]'
                }`}
                title={
                  hasModel
                    ? 'FD001: Trained Pipeline & Verified Benchmark'
                    : `${s}: Multi-Condition Raw Telemetry Exploration`
                }
              >
                {s}
                {hasModel && <span className="ml-1 text-[9px] text-[#0F62FE]">★</span>}
              </button>
            );
          })}
        </div>

        {/* Model Pipeline Readiness Tag */}
        {isFd001 ? (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-[#F0FDF4] border border-[#BBF7D0] rounded text-[11px] font-mono text-[#15803D] font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
            <span>Tuned XGBoost (MAE 13.94)</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-[#FFFBEB] border border-[#FDE68A] rounded text-[11px] font-mono text-[#B45309] font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Telemetry Only ({currentSubset})</span>
          </div>
        )}

        {/* API Latency / Health Chip */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#F8F9FA] border border-[#DDE2E5] rounded text-[11px] font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              isBackendConnected ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          />
          <span className="text-[#5A6570] font-medium">
            {isBackendConnected ? 'API :8000' : 'Offline'}
          </span>
          {health && isBackendConnected && (
            <span className="text-[10px] text-emerald-700 font-bold ml-0.5">
              HEALTHY
            </span>
          )}
        </div>

        {/* Academic Research Badge */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded bg-[#F8F9FA] border border-[#DDE2E5]">
          <School className="w-3.5 h-3.5 text-[#0F62FE]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#121D26] leading-none">
              Academic Research
            </span>
            <span className="text-[9px] text-[#737687] font-mono leading-none mt-0.5">
              NASA C-MAPSS
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};


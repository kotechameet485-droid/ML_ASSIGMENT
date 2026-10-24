import React from 'react';
import {
  Activity,
  Layers,
  Gauge,
  Scale,
  BrainCircuit,
  AlertTriangle,
  FolderArchive,
  Database
} from 'lucide-react';
import { EngineMindLogo } from './Logo';

export type ViewTab =
  | 'overview'
  | 'datasets'
  | 'explorer'
  | 'benchmarks'
  | 'prediction'
  | 'explainability'
  | 'errors';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  currentSubset: string;
  isBackendConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentSubset,
  isBackendConnected
}) => {
  const navItems = [
    {
      id: 'overview' as ViewTab,
      label: 'System Overview',
      icon: Activity,
      badge: 'PROD'
    },
    {
      id: 'datasets' as ViewTab,
      label: 'Dataset Explorer',
      icon: FolderArchive,
      badge: currentSubset
    },
    {
      id: 'explorer' as ViewTab,
      label: 'Fleet Explorer',
      icon: Layers,
      badge: null
    },
    {
      id: 'benchmarks' as ViewTab,
      label: 'Model Laboratory',
      icon: Scale,
      badge: '4 Models'
    },
    {
      id: 'prediction' as ViewTab,
      label: 'RUL Prediction',
      icon: Gauge,
      badge: currentSubset === 'FD001' ? 'READY' : 'LOCKED'
    },
    {
      id: 'explainability' as ViewTab,
      label: 'Explainability & SHAP',
      icon: BrainCircuit,
      badge: 'TreeSHAP'
    },
    {
      id: 'errors' as ViewTab,
      label: 'Error Diagnostics',
      icon: AlertTriangle,
      badge: '100 Units'
    }
  ];

  return (
    <aside className="w-64 border-r border-[#2C343D] bg-[#1E252B] flex flex-col justify-between shrink-0 select-none text-[#E7F2FF]">
      <div className="flex flex-col">
        {/* Brand & Logo Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#2C343D] bg-[#171D22]">
          <div className="flex items-center gap-2">
            <EngineMindLogo className="h-7 w-auto" inverted={true} />
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#2C343D] text-[#94A3B8] border border-[#3E4854] font-medium">
            v2.4 {currentSubset}
          </span>
        </div>

        {/* Section Heading */}
        <div className="px-4 py-2 border-b border-[#2C343D]/60 flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-semibold">
            Diagnostic Suites
          </span>
          <span className="text-[9px] font-mono text-[#64748B]">NASA C-MAPSS</span>
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col p-2 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center justify-between px-3 py-2 rounded text-xs transition-colors text-left ${
                  isActive
                    ? 'bg-[#0F62FE] text-white font-semibold shadow-xs'
                    : 'text-[#C3C6D8] hover:bg-[#2C343D] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#818CF8]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-medium ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badge === 'LOCKED'
                        ? 'bg-amber-900/40 text-amber-300 border border-amber-700/50'
                        : 'bg-[#2C343D] text-[#94A3B8]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Context Card & Health Status */}
      <div className="p-3 border-t border-[#2C343D] flex flex-col gap-2 bg-[#171D22]">
        <div className="bg-[#242C34] border border-[#333D48] rounded p-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-semibold">
              Active Context
            </span>
            <span className="text-[10px] font-mono text-[#38BDF8] font-medium flex items-center gap-1">
              <Database className="w-2.5 h-2.5" />
              {currentSubset}
            </span>
          </div>
          <p className="text-[11px] text-white font-mono leading-tight">
            {currentSubset === 'FD001'
              ? 'FD001 (Sea-Level Single)'
              : `${currentSubset} (Multi-Condition)`}
          </p>
          <p className="text-[10px] text-[#94A3B8] font-mono">
            {currentSubset === 'FD001' ? '100 Train / 100 Test Units' : 'Exploration Telemetry'}
          </p>
        </div>

        {/* Live Backend Connection Indicator */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-[#242C34] border border-[#333D48]">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
              }`}
            />
            <span className="text-[11px] text-white font-mono truncate">
              API :8000
            </span>
          </div>
          <span
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
              isBackendConnected
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                : 'bg-red-950/80 text-red-300 border border-red-800/60'
            }`}
          >
            {isBackendConnected ? 'HEALTHY' : 'OFFLINE'}
          </span>
        </div>
      </div>
    </aside>
  );
};


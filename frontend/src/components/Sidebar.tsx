import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Gauge,
  Scale,
  BrainCircuit,
  AlertTriangle,
  FolderArchive,
  Terminal
} from 'lucide-react';

export type ViewTab =
  | 'overview'
  | 'explorer'
  | 'prediction'
  | 'benchmarks'
  | 'explainability'
  | 'errors'
  | 'datasets';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  currentSubset: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentSubset
}) => {
  const navSections = [
    {
      group: 'MONITORING & TELEMETRY',
      items: [
        {
          id: 'overview' as ViewTab,
          label: 'Executive Overview',
          icon: LayoutDashboard,
          badge: null
        },
        {
          id: 'explorer' as ViewTab,
          label: 'Fleet Explorer',
          icon: Layers,
          badge: currentSubset
        },
        {
          id: 'prediction' as ViewTab,
          label: 'RUL Prediction',
          icon: Gauge,
          badge: 'Online'
        }
      ]
    },
    {
      group: 'MODEL EVALUATION',
      items: [
        {
          id: 'benchmarks' as ViewTab,
          label: 'Benchmark Lab',
          icon: Scale,
          badge: '4 Models'
        },
        {
          id: 'explainability' as ViewTab,
          label: 'Explainability & SHAP',
          icon: BrainCircuit,
          badge: null
        },
        {
          id: 'errors' as ViewTab,
          label: 'Error Diagnostics',
          icon: AlertTriangle,
          badge: '100 Test'
        }
      ]
    },
    {
      group: 'GOVERNANCE & PROVENANCE',
      items: [
        {
          id: 'datasets' as ViewTab,
          label: 'Dataset & Provenance',
          icon: FolderArchive,
          badge: null
        }
      ]
    }
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 select-none">
      <div className="p-4 space-y-6">
        {navSections.map((sec, secIdx) => (
          <div key={secIdx}>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-3 mb-1.5 font-bold">
              {sec.group}
            </div>
            <nav className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-sky-50 text-sky-900 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-sky-600' : 'text-slate-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isActive
                            ? 'bg-sky-100 text-sky-800 font-semibold'
                            : 'bg-slate-100 text-slate-500'
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
        ))}

        {/* Model Pipeline Status Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold tracking-wider">
            <span>Model Registry</span>
            <span className="text-emerald-700 font-bold">PROD</span>
          </div>
          <div className="text-slate-900 font-semibold text-xs">
            Tuned XGBoost (125 Cap)
          </div>
          <div className="space-y-1 pt-1 border-t border-slate-200/80 text-slate-500 text-[11px]">
            <div className="flex justify-between">
              <span>Features:</span>
              <span className="text-slate-800 font-medium">98 Channels</span>
            </div>
            <div className="flex justify-between">
              <span>Cross-Val:</span>
              <span className="text-slate-800 font-medium">5-Fold Grouped</span>
            </div>
            <div className="flex justify-between">
              <span>Blind Test MAE:</span>
              <span className="text-sky-700 font-bold">13.94 cycles</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between font-mono">
          <span className="text-slate-700 font-semibold flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span>NASA C-MAPSS FD001</span>
          </span>
          <span className="text-emerald-700 font-bold text-[10px]">VERIFIED</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          Decision support heuristic only.
        </p>
      </div>
    </aside>
  );
};

import React, { useState } from 'react';
import {
  Activity,
  Layers,
  Gauge,
  Scale,
  BrainCircuit,
  AlertTriangle,
  FolderArchive,
  Database,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Sidebar as AceternitySidebar,
  SidebarBody,
  SidebarLink,
  useSidebar,
} from './ui/sidebar';
import { EngineMindLogo } from './Logo';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

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

const SidebarContent: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentSubset,
  isBackendConnected,
}) => {
  const { open, setOpen } = useSidebar();

  const navItems = [
    {
      id: 'overview' as ViewTab,
      label: 'Overview',
      icon: <Activity className="w-4 h-4 text-[#60A5FA]" />,
      badge: 'PROD',
    },
    {
      id: 'datasets' as ViewTab,
      label: 'Dataset Explorer',
      icon: <FolderArchive className="w-4 h-4 text-[#38BDF8]" />,
      badge: currentSubset,
    },
    {
      id: 'explorer' as ViewTab,
      label: 'Fleet Explorer',
      icon: <Layers className="w-4 h-4 text-[#818CF8]" />,
      badge: null,
    },
    {
      id: 'benchmarks' as ViewTab,
      label: 'Model Laboratory',
      icon: <Scale className="w-4 h-4 text-[#A78BFA]" />,
      badge: '4 Models',
    },
    {
      id: 'prediction' as ViewTab,
      label: 'RUL Prediction',
      icon: <Gauge className="w-4 h-4 text-[#F472B6]" />,
      badge: currentSubset === 'FD001' ? 'READY' : 'LOCKED',
    },
    {
      id: 'explainability' as ViewTab,
      label: 'Explainability',
      icon: <BrainCircuit className="w-4 h-4 text-[#34D399]" />,
      badge: 'TreeSHAP',
    },
    {
      id: 'errors' as ViewTab,
      label: 'Error Analysis',
      icon: <AlertTriangle className="w-4 h-4 text-[#FBBF24]" />,
      badge: '100 Units',
    },
  ];

  return (
    <div className="flex flex-1 flex-col justify-between h-full overflow-hidden">
      <div className="flex flex-col overflow-y-auto overflow-x-hidden no-scrollbar">
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between border-b border-[#1D2935] pb-2 px-1">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded bg-[#1D2935] border border-[#273747]">
              <EngineMindLogo className="h-5 w-5" inverted={true} />
            </div>

            <motion.div
              animate={{
                display: open ? 'flex' : 'none',
                opacity: open ? 1 : 0,
              }}
              transition={{ duration: 0.15 }}
              className="flex-col min-w-0"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-[#F8FAFC] leading-none">
                  EngineMind
                </span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#1D2935] text-[#94A3B8] border border-[#273747] font-semibold">
                  v2.4
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 truncate leading-tight mt-0.5">
                Predictive Maintenance Intelligence
              </span>
            </motion.div>
          </div>
        </div>

        {/* Diagnostic Suites Section Header */}
        <motion.div
          animate={{
            display: open ? 'flex' : 'none',
            opacity: open ? 1 : 0,
          }}
          transition={{ duration: 0.15 }}
          className="pt-4 pb-2 px-1 flex items-center justify-between"
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
            Diagnostic Suites
          </span>
          <span className="text-[9px] font-mono text-slate-600">NASA C-MAPSS</span>
        </motion.div>

        {/* Primary Navigation List */}
        <nav className="flex flex-col gap-1 mt-1">
          {navItems.map((item) => (
            <SidebarLink
              key={item.id}
              link={{
                label: item.label,
                icon: item.icon,
                badge: item.badge,
              }}
              isActive={currentTab === item.id}
              onClick={() => onSelectTab(item.id)}
            />
          ))}
        </nav>
      </div>

      {/* Bottom Footer Section: Active Context & Health Indicator */}
      <div className="pt-3 border-t border-[#1D2935] flex flex-col gap-2 mt-auto">
        {/* Active Context Card (Expanded only) */}
        <motion.div
          animate={{
            display: open ? 'flex' : 'none',
            opacity: open ? 1 : 0,
          }}
          transition={{ duration: 0.15 }}
          className="flex-col bg-[#16202A] border border-[#1D2935] rounded-md p-2.5 text-xs font-mono space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Active Context
            </span>
            <span className="text-[10px] text-[#38BDF8] font-bold flex items-center gap-1">
              <Database className="w-2.5 h-2.5" />
              {currentSubset}
            </span>
          </div>
          <p className="text-[11px] text-[#F8FAFC] font-semibold leading-tight">
            {currentSubset === 'FD001'
              ? 'FD001 (Sea-Level Single)'
              : `${currentSubset} (Multi-Condition)`}
          </p>
          <p className="text-[10px] text-slate-400">
            {currentSubset === 'FD001' ? '100 Train / 100 Test Units' : 'Exploration Telemetry'}
          </p>
        </motion.div>

        {/* Live Backend Connection Indicator */}
        <div
          className={cn(
            'flex items-center rounded-md border border-[#1D2935] bg-[#16202A] transition-all',
            open ? 'justify-between px-2.5 py-1.5' : 'justify-center p-2'
          )}
          title={
            isBackendConnected
              ? 'FastAPI Server Connected (127.0.0.1:8000)'
              : 'FastAPI Server Offline'
          }
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span
                className={cn(
                  'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                  isBackendConnected ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                )}
              />
              <span
                className={cn(
                  'relative inline-flex rounded-full h-2 w-2',
                  isBackendConnected ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                )}
              />
            </span>
            <motion.span
              animate={{
                display: open ? 'inline-block' : 'none',
                opacity: open ? 1 : 0,
              }}
              transition={{ duration: 0.15 }}
              className="text-[11px] text-[#F8FAFC] font-mono truncate"
            >
              API :8000
            </motion.span>
          </div>

          <motion.span
            animate={{
              display: open ? 'inline-block' : 'none',
              opacity: open ? 1 : 0,
            }}
            transition={{ duration: 0.15 }}
            className={cn(
              'text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider',
              isBackendConnected
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                : 'bg-red-950/80 text-red-300 border border-red-800/60'
            )}
          >
            {isBackendConnected ? 'HEALTHY' : 'OFFLINE'}
          </motion.span>
        </div>

        {/* Desktop Pin / Collapse Toggle Button */}
        <div className="hidden md:flex justify-end pt-1">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center justify-center p-1 rounded text-slate-400 hover:text-white hover:bg-[#1D2935] transition-colors w-full"
            title={open ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {open ? (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 hover:text-white">
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Collapse Rail</span>
              </div>
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const [open, setOpen] = useState(false);

  return (
    <AceternitySidebar open={open} setOpen={setOpen} animate={true}>
      <SidebarBody className="justify-between">
        <SidebarContent {...props} />
      </SidebarBody>
    </AceternitySidebar>
  );
};

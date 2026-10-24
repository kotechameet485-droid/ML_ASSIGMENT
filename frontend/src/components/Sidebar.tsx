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
} from './ui/sidebar';
import { useSidebar } from './ui/use-sidebar';
import { EngineMindRotor } from './Logo';
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
      icon: <Activity className="w-4 h-4 text-[#0F62FE]" />,
      badge: 'PROD',
    },
    {
      id: 'datasets' as ViewTab,
      label: 'Dataset Explorer',
      icon: <FolderArchive className="w-4 h-4 text-[#0284C7]" />,
      badge: currentSubset,
    },
    {
      id: 'explorer' as ViewTab,
      label: 'Fleet Explorer',
      icon: <Layers className="w-4 h-4 text-[#6366F1]" />,
      badge: null,
    },
    {
      id: 'benchmarks' as ViewTab,
      label: 'Model Laboratory',
      icon: <Scale className="w-4 h-4 text-[#8B5CF6]" />,
      badge: '4 Models',
    },
    {
      id: 'prediction' as ViewTab,
      label: 'RUL Prediction',
      icon: <Gauge className="w-4 h-4 text-[#EA580C]" />,
      badge: currentSubset === 'FD001' ? 'READY' : 'LOCKED',
    },
    {
      id: 'explainability' as ViewTab,
      label: 'Explainability',
      icon: <BrainCircuit className="w-4 h-4 text-[#16A34A]" />,
      badge: 'TreeSHAP',
    },
    {
      id: 'errors' as ViewTab,
      label: 'Error Analysis',
      icon: <AlertTriangle className="w-4 h-4 text-[#DC2626]" />,
      badge: '100 Units',
    },
  ];

  return (
    <div className="flex flex-1 flex-col justify-between h-full overflow-hidden text-slate-800">
      <div className="flex flex-col overflow-y-auto overflow-x-hidden no-scrollbar">
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between border-b border-[#DDE2E5] pb-2 px-1">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded bg-[#F8F9FA] border border-[#DDE2E5] shadow-xs">
              <EngineMindRotor className="w-5 h-5" />
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
                <span className="font-bold text-sm tracking-tight text-[#121D26] leading-none">
                  EngineMind
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#F1F3F5] text-slate-700 border border-[#DDE2E5] font-bold">
                  v2.4
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-500 truncate leading-tight mt-0.5">
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
          className="pt-3 pb-1.5 px-1 flex items-center justify-between"
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            Diagnostic Suites
          </span>
          <span className="text-[9px] font-mono text-slate-400">NASA C-MAPSS</span>
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
      <div className="pt-3 border-t border-[#DDE2E5] flex flex-col gap-2 mt-auto">
        {/* Active Context Card (Expanded only) */}
        <motion.div
          animate={{
            display: open ? 'flex' : 'none',
            opacity: open ? 1 : 0,
          }}
          transition={{ duration: 0.15 }}
          className="flex-col bg-[#F8F9FA] border border-[#DDE2E5] rounded-md p-2.5 text-xs font-mono space-y-1 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              Active Context
            </span>
            <span className="text-[10px] text-[#0F62FE] font-bold flex items-center gap-1">
              <Database className="w-2.5 h-2.5" />
              {currentSubset}
            </span>
          </div>
          <p className="text-[11px] text-slate-900 font-semibold leading-tight">
            {currentSubset === 'FD001'
              ? 'FD001 (Sea-Level Single)'
              : `${currentSubset} (Multi-Condition)`}
          </p>
          <p className="text-[10px] text-slate-500">
            {currentSubset === 'FD001' ? '100 Train / 100 Test Units' : 'Exploration Telemetry'}
          </p>
        </motion.div>

        {/* Live Backend Connection Indicator */}
        <div
          className={cn(
            'flex items-center rounded-md border border-[#DDE2E5] bg-[#F8F9FA] transition-all shadow-2xs',
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
                  isBackendConnected ? 'bg-emerald-400' : 'bg-rose-400'
                )}
              />
              <span
                className={cn(
                  'relative inline-flex rounded-full h-2 w-2',
                  isBackendConnected ? 'bg-emerald-500' : 'bg-rose-500'
                )}
              />
            </span>
            <motion.span
              animate={{
                display: open ? 'inline-block' : 'none',
                opacity: open ? 1 : 0,
              }}
              transition={{ duration: 0.15 }}
              className="text-[11px] text-slate-800 font-mono font-medium truncate"
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
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            )}
          >
            {isBackendConnected ? 'HEALTHY' : 'OFFLINE'}
          </motion.span>
        </div>

        {/* Desktop Pin / Collapse Toggle Button */}
        <div className="hidden md:flex justify-end pt-0.5">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center justify-center p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-[#F1F3F5] transition-colors w-full cursor-pointer"
            title={open ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {open ? (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 hover:text-slate-800">
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

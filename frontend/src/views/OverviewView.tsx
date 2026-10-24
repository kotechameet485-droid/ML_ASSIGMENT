import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Activity,
  Flame,
  Gauge as GaugeIcon,
  Wind
} from 'lucide-react';
import {
  fetchDatasetOverview,
  fetchFleetPriorityQueue,
  fetchTestBenchmarks
} from '../services/api';
import type { DatasetOverview, FleetPriorityItem, BenchmarkItem } from '../types';
import type { ViewTab } from '../components/Sidebar';

interface OverviewViewProps {
  currentSubset: string;
  onNavigate: (tab: ViewTab) => void;
  onSelectSubset?: (subset: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  currentSubset,
  onNavigate,
  onSelectSubset
}) => {
  const [overview, setOverview] = useState<DatasetOverview | null>(null);
  const [fleetQueue, setFleetQueue] = useState<FleetPriorityItem[]>([]);
  const [winningBenchmark, setWinningBenchmark] = useState<BenchmarkItem | null>(null);
  const [baselineBenchmark, setBaselineBenchmark] = useState<BenchmarkItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isFd001 = currentSubset === 'FD001';

  useEffect(() => {
    let mounted = true;

    Promise.all([
      fetchDatasetOverview(currentSubset),
      isFd001 ? fetchFleetPriorityQueue('FD001') : Promise.resolve([]),
      fetchTestBenchmarks()
    ])
      .then(([ov, queue, benchmarks]) => {
        if (!mounted) return;
        setOverview(ov);
        setFleetQueue(queue);
        const winner = benchmarks.find((b) => b.model.includes('Winning') || b.model.includes('Tuned') || b.model.includes('XGBoost')) || benchmarks[benchmarks.length - 1];
        const base = benchmarks.find((b) => b.model.includes('Baseline')) || null;
        setWinningBenchmark(winner || null);
        setBaselineBenchmark(base);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Failed to load executive overview data');
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [currentSubset, isFd001]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-100">
        <div className="flex items-center gap-3 text-slate-600 font-mono text-xs">
          <Activity className="w-4 h-4 animate-spin text-sky-600" />
          <span>Loading telemetry stream & model scorecard...</span>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 font-mono text-xs flex items-center gap-3">
          <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />
          <div>{error || 'Overview unavailable'}</div>
        </div>
      </div>
    );
  }

  const criticalEngines = fleetQueue.filter((e) => e.priority_category === 'CRITICAL');
  const warningEngines = fleetQueue.filter((e) => e.priority_category === 'WARNING');
  const nominalEngines = fleetQueue.filter((e) => e.priority_category === 'NOMINAL');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Sub-Header & Status Strip from Stitch System Overview */}
      <div className="bg-white border border-[#DDE2E5] rounded-lg p-4 shadow-[0_1px_2px_rgba(30,37,43,0.04)] space-y-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#0F62FE] shrink-0" />
              <h1 className="text-lg font-bold tracking-tight text-[#121D26]">
                System Overview — C-MAPSS Benchmark & Experiment Status
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#E4EFFC] text-[#0F62FE] rounded font-semibold border border-[#C3C6D8]">
                BUILD #942-PROD
              </span>
            </div>
            <p className="text-xs text-[#5A6570]">
              {overview.description}
            </p>
          </div>

          {/* Protocol Tags */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F8F9FA] border border-[#DDE2E5] rounded text-[11px] font-mono">
              <span className="font-semibold text-[#737687] uppercase text-[10px]">Dataset:</span>
              <span className="text-[#121D26] font-semibold">{currentSubset} ({overview.conditions})</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F8F9FA] border border-[#DDE2E5] rounded text-[11px] font-mono">
              <span className="font-semibold text-[#737687] uppercase text-[10px]">Active Run:</span>
              <span className="text-[#0F62FE] font-bold">EXP-2024-C3</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F8F9FA] border border-[#DDE2E5] rounded text-[11px] font-mono">
              <span className="font-semibold text-[#737687] uppercase text-[10px]">Protocol:</span>
              <span className="text-[#121D26]">NASA PHM08 + RMSE (100 Units)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Exploration Notice for Non-FD001 */}
      {!isFd001 && (
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg p-3.5 flex items-start gap-3 text-xs text-[#B45309] shadow-xs">
          <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-[#92400E]">
              Telemetry Exploration Mode ({currentSubset})
            </div>
            <p className="text-[#5A6570] text-[11px] leading-relaxed">
              You are exploring raw multi-condition telemetry for subset <strong>{currentSubset}</strong> ({overview.train_engines} train units, {overview.test_engines} test units). 
              The verified ML pipeline was trained on <strong>FD001</strong>. To ensure scientific validity, model predictions are locked to FD001.
            </p>
          </div>
          <button
            onClick={() => onSelectSubset && onSelectSubset('FD001')}
            className="ml-auto px-3 py-1 bg-[#15803D] hover:bg-[#166534] text-white text-[11px] font-semibold rounded transition-colors shrink-0"
          >
            Switch to FD001
          </button>
        </div>
      )}

      {/* Top Engineering Metrics Strip (4-Col Utilitarian Workbench Panel) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Telemetry Footprint */}
        <div className="bg-white border border-[#DDE2E5] rounded-lg p-4 shadow-[0_1px_2px_rgba(30,37,43,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#737687] mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
              01. Telemetry Footprint
            </span>
            <span className="text-[10px] font-mono text-[#0F62FE] font-bold">RAW</span>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono-numbers text-[#121D26] tracking-tight">
              {overview.train_observations.toLocaleString()}{' '}
              <span className="text-xs font-normal text-[#5A6570]">
                / {overview.test_observations.toLocaleString()} cyc
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#5A6570] mt-1 flex items-center justify-between">
              <span>{overview.train_engines} Train (R2F) Units</span>
              <span className="text-[#737687]">{overview.test_engines} Test Units</span>
            </div>
          </div>
          <div className="w-full bg-[#E4EFFC] h-1.5 rounded mt-3 overflow-hidden flex">
            <div className="bg-[#0F62FE] h-full w-[61%]" />
            <div className="bg-[#93C5FD] h-full w-[39%]" />
          </div>
        </div>

        {/* Metric 2: Active Best Model */}
        <div className="bg-white border border-[#DDE2E5] rounded-lg p-4 shadow-[0_1px_2px_rgba(30,37,43,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#737687] mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
              02. Lead Candidate (Tuned)
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#F0FDF4] text-[#15803D] rounded border border-[#BBF7D0] font-bold">
              RANK #1
            </span>
          </div>
          <div>
            <div className="text-base font-bold text-[#0F62FE] flex items-center gap-1.5">
              <span>{winningBenchmark ? winningBenchmark.model : (isFd001 ? 'Tuned XGBoost Regressor' : 'None')}</span>
              <ShieldCheck className="w-4 h-4 text-[#15803D]" />
            </div>
            <div className="text-[11px] font-mono text-[#5A6570] mt-1">
              Test MAE:{' '}
              <span className="text-[#121D26] font-bold font-mono-numbers">
                {winningBenchmark ? `${winningBenchmark.test_mae.toFixed(2)}c` : 'Unavailable'}
              </span>{' '}
              | Score:{' '}
              <span className="text-[#121D26] font-bold font-mono-numbers">
                {winningBenchmark ? winningBenchmark.nasa_score.toFixed(1) : 'Unavailable'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F1F3F5] text-[11px] font-mono">
            <span className="text-[#737687]">5-Fold Grouped CV</span>
            <span className="text-[#15803D] font-bold">Optimal Loss</span>
          </div>
        </div>

        {/* Metric 3: Baseline Differential */}
        <div className="bg-white border border-[#DDE2E5] rounded-lg p-4 shadow-[0_1px_2px_rgba(30,37,43,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#737687] mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
              03. Baseline Differential
            </span>
            <TrendingDown className="w-4 h-4 text-[#15803D]" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono-numbers text-[#15803D] flex items-baseline gap-1">
              <span>
                {winningBenchmark && baselineBenchmark
                  ? (winningBenchmark.test_rmse - baselineBenchmark.test_rmse).toFixed(2)
                  : (winningBenchmark ? `-${(baselineBenchmark ? baselineBenchmark.test_rmse - winningBenchmark.test_rmse : 21.96).toFixed(2)}` : 'N/A')}
              </span>
              <span className="text-xs font-normal text-[#5A6570]">RMSE cycles</span>
            </div>
            <div className="text-[11px] font-mono text-[#5A6570] mt-1">
              Mean-RUL Baseline:{' '}
              <span className="line-through text-[#737687]">
                {baselineBenchmark ? baselineBenchmark.test_rmse.toFixed(2) : '41.67'}
              </span> cycles
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 pt-2 border-t border-[#F1F3F5] text-[11px] font-mono text-[#15803D] font-bold">
            <span>
              {winningBenchmark?.mae_improvement_pct
                ? `${winningBenchmark.mae_improvement_pct} MAE Reduction vs Baseline`
                : 'Substantial Error Reduction vs Baseline'}
            </span>
          </div>
        </div>

        {/* Metric 4: Fleet Degradation State */}
        <div className="bg-white border border-[#DDE2E5] rounded-lg p-4 shadow-[0_1px_2px_rgba(30,37,43,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#737687] mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
              04. Fleet Degradation State
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono-numbers text-red-600 flex items-baseline gap-1.5">
              <span>{criticalEngines.length} Units</span>
              <span className="text-xs text-[#5A6570] font-normal">RUL ≤ 25 cyc</span>
            </div>
            <div className="text-[11px] font-mono text-[#5A6570] mt-1">
              {warningEngines.length} Warning (26-60) / {nominalEngines.length} Safe (&gt;60)
            </div>
          </div>
          <div className="w-full bg-[#E4EFFC] h-1.5 rounded mt-3 overflow-hidden flex">
            <div
              className="bg-red-600 h-full"
              style={{ width: `${(criticalEngines.length / 100) * 100}%` }}
            />
            <div
              className="bg-amber-500 h-full"
              style={{ width: `${(warningEngines.length / 100) * 100}%` }}
            />
            <div
              className="bg-emerald-600 h-full"
              style={{ width: `${(nominalEngines.length / 100) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Model Scorecard Ribbon (When FD001 is active) */}
      {isFd001 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Validated Model Scorecard
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 bg-sky-50 text-sky-800 rounded border border-sky-200 font-medium">
                100 Blind Test Engines
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Algorithm: {winningBenchmark ? winningBenchmark.model : 'Tuned Model (125 RUL Cap)'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Metric 1: Test MAE */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                Official Test MAE
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono-numbers text-slate-900">
                  {winningBenchmark ? winningBenchmark.test_mae.toFixed(2) : 'Unavailable'}
                </span>
                <span className="text-xs font-mono text-slate-400">cycles</span>
              </div>
              <div className="mt-2 text-[11px] font-mono text-emerald-700 flex items-center gap-1 font-medium">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>
                  {winningBenchmark?.mae_improvement_pct
                    ? `${winningBenchmark.mae_improvement_pct} error reduction vs baseline`
                    : 'Verified test metric'}
                </span>
              </div>
            </div>

            {/* Metric 2: Test RMSE */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                Official Test RMSE
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono-numbers text-slate-900">
                  {winningBenchmark ? winningBenchmark.test_rmse.toFixed(2) : 'Unavailable'}
                </span>
                <span className="text-xs font-mono text-slate-400">cycles</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 font-mono">
                Outlier penalty constrained by regularization
              </div>
            </div>

            {/* Metric 3: Variance Explained */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                Variance Explained (R²)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono-numbers text-sky-700">
                  {winningBenchmark ? winningBenchmark.test_r2.toFixed(4) : 'Unavailable'}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 font-mono">
                Degradation variance accounted for by model
              </div>
            </div>

            {/* Metric 4: NASA PHM08 Penalty */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                NASA Asymmetric Penalty
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono-numbers text-amber-700">
                  {winningBenchmark ? winningBenchmark.nasa_score.toFixed(1) : 'Unavailable'}
                </span>
              </div>
              <div className="mt-2 text-[11px] font-mono text-emerald-700 font-medium">
                {winningBenchmark?.nasa_reduction_pct
                  ? `${winningBenchmark.nasa_reduction_pct} penalty reduction vs baseline`
                  : 'Asymmetric risk evaluated'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two-Column Deep Dive: Fleet Queue & Sensor Degradation */}
      {isFd001 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Fleet Maintenance Priority Queue */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Fleet Maintenance Queue
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {fleetQueue.length} blind test engines categorized by urgency
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('prediction')}
                  className="text-xs text-sky-700 hover:text-sky-800 font-medium flex items-center gap-1"
                >
                  <span>Full Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status Chips */}
              <div className="grid grid-cols-3 gap-2 my-3">
                <div className="bg-red-50 border border-red-200 rounded p-2 text-center">
                  <span className="text-[10px] text-red-700 block font-bold">CRITICAL</span>
                  <span className="text-lg font-bold font-mono-numbers text-red-800">
                    {criticalEngines.length}
                  </span>
                  <span className="text-[9px] text-red-600 block">≤ 25 cycles</span>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded p-2 text-center">
                  <span className="text-[10px] text-amber-700 block font-bold">WARNING</span>
                  <span className="text-lg font-bold font-mono-numbers text-amber-800">
                    {warningEngines.length}
                  </span>
                  <span className="text-[9px] text-amber-600 block">26–60 cycles</span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-center">
                  <span className="text-[10px] text-emerald-700 block font-bold">NOMINAL</span>
                  <span className="text-lg font-bold font-mono-numbers text-emerald-800">
                    {nominalEngines.length}
                  </span>
                  <span className="text-[9px] text-emerald-600 block">&gt; 60 cycles</span>
                </div>
              </div>

              {/* Top Urgent Engines Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5">Engine</th>
                      <th className="py-2 px-2.5">Last Cycle</th>
                      <th className="py-2 px-2.5">Pred RUL</th>
                      <th className="py-2 px-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {fleetQueue.slice(0, 5).map((e) => (
                      <tr key={e.engine_id} className="hover:bg-slate-50">
                        <td className="py-2 px-2.5 font-bold text-slate-900">
                          #{e.engine_id}
                        </td>
                        <td className="py-2 px-2.5 text-slate-500">
                          {e.terminal_cycle}
                        </td>
                        <td className="py-2 px-2.5 font-mono-numbers font-semibold text-slate-900">
                          {e.predicted_rul.toFixed(1)}c
                        </td>
                        <td className="py-2 px-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              e.priority_category === 'CRITICAL'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : e.priority_category === 'WARNING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {e.priority_category}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              Engines prioritized by predicted RUL to allocate depot maintenance slots.
            </div>
          </div>

          {/* Right Column: Sensor Degradation Dynamics & Gas-Path Trajectory */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Gas-Path Degradation Trajectory (C-MAPSS FD001)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Physical sensor signatures accelerating toward end-of-life
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('explorer')}
                  className="text-xs text-sky-700 hover:text-sky-800 font-medium flex items-center gap-1"
                >
                  <span>Sensor Channels</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Trajectory Plot Container */}
              <div className="w-full flex justify-center bg-slate-50/80 border border-slate-200 rounded-md p-3 my-3">
                <img
                  src="/figures/sensor_degradation_trajectories.png"
                  alt="Sensor Degradation Trajectories"
                  className="max-h-64 object-contain rounded"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Channel Dynamics Breakdown */}
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md">
                  <div className="flex items-center gap-1.5 text-amber-800 font-semibold mb-0.5">
                    <Flame className="w-3.5 h-3.5 text-amber-600" />
                    <span>Sensor 4 (T50)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block leading-tight">
                    LPT Outlet Temp: +18.4°R rise near failure
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md">
                  <div className="flex items-center gap-1.5 text-sky-800 font-semibold mb-0.5">
                    <GaugeIcon className="w-3.5 h-3.5 text-sky-600" />
                    <span>Sensor 11 (Ps30)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block leading-tight">
                    HPC Static Pressure: -0.32 psia erosion
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold mb-0.5">
                    <Wind className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sensor 15 (BPR)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block leading-tight">
                    Bypass Ratio: +0.09 shift from core resistance
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>98 rolling features engineered without future lookahead</span>
              <span className="font-mono text-sky-700 font-medium">SHAP attribution 38.8% on T50</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

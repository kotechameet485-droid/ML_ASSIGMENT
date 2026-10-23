import React, { useState, useEffect } from 'react';
import { ArrowUpDown } from 'lucide-react';
import {
  fetchErrorSummary,
  fetchEngineErrors,
  fetchRulBrackets
} from '../services/api';
import type { ErrorSummary, ErrorEngineItem, RulBracketItem } from '../types';

export const ErrorDiagnosticsView: React.FC = () => {
  const [summary, setSummary] = useState<ErrorSummary | null>(null);
  const [brackets, setBrackets] = useState<RulBracketItem[]>([]);
  const [errors, setErrors] = useState<ErrorEngineItem[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'over' | 'under'>('all');
  const [sortBy, setSortBy] = useState<'engine_id' | 'absolute_error' | 'residual'>('absolute_error');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      fetchErrorSummary(),
      fetchRulBrackets(),
      fetchEngineErrors(filterType)
    ])
      .then(([sum, brk, errs]) => {
        if (!mounted) return;
        setSummary(sum);
        setBrackets(brk);
        setErrors(errs);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load error diagnostics:', err);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [filterType]);

  const sortedErrors = [...errors].sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];
    if (sortAsc) return valA > valB ? 1 : -1;
    return valA < valB ? 1 : -1;
  });

  if (loading && !summary) {
    return (
      <div className="p-8 flex items-center justify-center min-h-100">
        <div className="text-slate-500 font-mono text-xs flex items-center gap-2">
          <span>Loading residual error diagnostics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Model Diagnostics</span>
            <span>•</span>
            <span className="font-mono font-medium text-slate-700">NASA C-MAPSS FD001</span>
            <span>•</span>
            <span>100 Test Units Residual Audit</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Model Error Diagnostics & Residual Audit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete residual audit across all 100 test turbofan engines. Detailed analysis of early vs late predictions and NASA asymmetric penalty mechanics.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
              Mean Absolute Error
            </span>
            <div className="text-2xl font-bold font-mono-numbers text-slate-900 mt-1">
              {summary.mae.toFixed(2)}
              <span className="text-xs font-mono text-slate-400 ml-1.5 font-normal">cycles</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-2">
              Median Absolute Error: {summary.median_absolute_error.toFixed(1)}c
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
              Root Mean Squared Error
            </span>
            <div className="text-2xl font-bold font-mono-numbers text-slate-900 mt-1">
              {summary.rmse.toFixed(2)}
              <span className="text-xs font-mono text-slate-400 ml-1.5 font-normal">cycles</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-2">
              Max Absolute Error: {summary.max_absolute_error.toFixed(1)}c
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
              Over vs Under-Estimations
            </span>
            <div className="text-xl font-bold font-mono-numbers text-slate-900 mt-1 flex items-baseline gap-2">
              <span className="text-red-700">{summary.overestimated_count} Late</span>
              <span className="text-slate-300">/</span>
              <span className="text-emerald-700">{summary.underestimated_count} Early</span>
            </div>
            <div className="text-[11px] font-mono text-emerald-700 mt-2 font-medium">
              Mean Residual: {summary.mean_residual.toFixed(2)} (Conservative)
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
              NASA PHM08 Penalty Score
            </span>
            <div className="text-2xl font-bold font-mono-numbers text-amber-700 mt-1">
              {summary.nasa_phm08_score.toFixed(1)}
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-2">
              Within ±15 cycles: {summary.within_15_cycles_pct}% of engines
            </div>
          </div>
        </div>
      )}

      {/* Residual Distribution Plot & Asymmetric Penalty Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Residual Plot */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Residual Error Distribution
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Zero-Centered Gaussian
            </span>
          </div>

          <div className="w-full flex justify-center bg-slate-50 border border-slate-200 rounded-md p-3">
            <img
              src="/figures/residual_distribution.png"
              alt="Residual Distribution"
              className="max-h-72 object-contain rounded"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div className="flex justify-between text-xs font-mono text-slate-500 pt-2 border-t border-slate-100">
            <span className="text-emerald-700 font-medium">Under: Safe Early Inspection</span>
            <span className="text-red-700 font-medium">Over: Unsafe Late Failure</span>
          </div>
        </div>

        {/* NASA Asymmetric Scoring & Aviation Risk */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3.5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                NASA PHM08 Asymmetric Aviation Penalty
              </h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Why symmetric metrics (MAE/RMSE) are insufficient for aviation safety
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 space-y-2.5 font-mono text-xs my-3">
              <div className="text-slate-800 text-[11px]">
                Residual formula: <code className="text-sky-700 font-bold">d = Predicted_RUL - True_RUL</code>
              </div>
              <div className="p-2.5 bg-white rounded border border-slate-200 space-y-1 text-[11px] shadow-xs">
                <div className="text-emerald-700 font-semibold">
                  d &lt; 0 (Early/Conservative): S = exp(-d / 13) - 1
                </div>
                <div className="text-red-700 font-bold">
                  d ≥ 0 (Late/Unsafe): S = exp(d / 10) - 1
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                Predicting an engine will survive 20 cycles when it will fail in 5 cycles (overestimation) risks catastrophic in-flight failure. The NASA PHM08 penalty function penalizes positive errors exponentially.
              </p>
            </div>
          </div>

          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs font-mono text-red-800">
            <strong>Worst Overestimation:</strong> Engine #2 (+25.5 cycles late). Handled by operational safety threshold buffer.
          </div>
        </div>
      </div>

      {/* Error Breakdown by True RUL Brackets */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Error Breakdown by Degradation Horizon
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Performance Across Engine Lifespan Brackets
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {brackets.map((b, i) => (
            <div key={i} className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-1.5 font-mono text-xs">
              <div className="text-slate-900 font-bold text-xs">{b.bracket}</div>
              <div className="text-[11px] text-slate-500">Units: {b.engine_count} engines</div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-400">MAE:</span>
                <span className="text-slate-900 font-bold">{b.mae.toFixed(1)}c</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">RMSE:</span>
                <span className="text-slate-700">{b.rmse.toFixed(1)}c</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mean Bias:</span>
                <span className={b.mean_residual < 0 ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                  {b.mean_residual > 0 ? '+' : ''}{b.mean_residual.toFixed(1)}c
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filterable Per-Engine Error Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Per-Engine Prediction Residual Table
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Showing {sortedErrors.length} evaluated test units
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Filter buttons */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs font-medium">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterType === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('over')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterType === 'over' ? 'bg-white text-red-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Overestimated (Late)
              </button>
              <button
                onClick={() => setFilterType('under')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterType === 'under' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Underestimated (Early)
              </button>
            </div>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="p-1 bg-white border border-slate-200 rounded text-slate-600 hover:text-slate-900 shadow-xs"
              title="Toggle Sort Order"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200 sticky top-0">
              <tr>
                <th
                  onClick={() => setSortBy('engine_id')}
                  className="py-2 px-3 cursor-pointer hover:text-slate-900"
                >
                  Engine ID {sortBy === 'engine_id' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="py-2 px-3">Last Cycle</th>
                <th className="py-2 px-3">True RUL</th>
                <th className="py-2 px-3">Predicted RUL</th>
                <th
                  onClick={() => setSortBy('residual')}
                  className="py-2 px-3 cursor-pointer hover:text-slate-900"
                >
                  Residual {sortBy === 'residual' && (sortAsc ? '▲' : '▼')}
                </th>
                <th
                  onClick={() => setSortBy('absolute_error')}
                  className="py-2 px-3 cursor-pointer hover:text-slate-900"
                >
                  Abs Error {sortBy === 'absolute_error' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="py-2 px-3">Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sortedErrors.map((e) => (
                <tr key={e.engine_id} className="hover:bg-slate-50">
                  <td className="py-1.5 px-3 font-bold text-slate-900">Engine #{e.engine_id}</td>
                  <td className="py-1.5 px-3">{e.last_observed_cycle}c</td>
                  <td className="py-1.5 px-3 font-mono-numbers">{e.true_rul.toFixed(1)}</td>
                  <td className="py-1.5 px-3 font-mono-numbers text-sky-700 font-semibold">{e.predicted_rul.toFixed(1)}</td>
                  <td
                    className={`py-1.5 px-3 font-bold font-mono-numbers ${
                      e.residual > 0 ? 'text-red-700' : 'text-emerald-700'
                    }`}
                  >
                    {e.residual > 0 ? '+' : ''}{e.residual.toFixed(1)}
                  </td>
                  <td className="py-1.5 px-3 font-mono-numbers">{e.absolute_error.toFixed(1)}</td>
                  <td className="py-1.5 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        e.residual > 0
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {e.error_type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

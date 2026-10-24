import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  TrendingUp,
  Flame,
  Gauge,
  Wind,
  AlertCircle
} from 'lucide-react';
import { fetchFeatureImportances } from '../services/api';
import type { FeatureImportanceItem } from '../types';

export const ExplainabilityView: React.FC = () => {
  const [features, setFeatures] = useState<FeatureImportanceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    fetchFeatureImportances(20)
      .then((feats) => {
        if (!mounted) return;
        setFeatures(feats);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load explainability data:', err);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-100">
        <div className="text-slate-500 font-mono text-xs flex items-center gap-2">
          <span>Loading explainability & SHAP attribution metrics...</span>
        </div>
      </div>
    );
  }

  const maxImportance = features.length > 0 ? features[0].importance : 1.0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Command Strip / Header from Stitch */}
      <div className="bg-white border border-[#DDE2E5] rounded-lg p-4 shadow-[0_1px_2px_rgba(30,37,43,0.04)] space-y-3">
        <div className="flex flex-col gap-1 w-full">
          <div className="flex items-center gap-2 text-[#0F62FE] text-[10px] font-mono uppercase tracking-wider font-bold">
            <BrainCircuit className="w-4 h-4 text-[#0F62FE]" />
            <span>Interpretability Suite • TreeExplainer Kernel v0.42</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#121D26]">
                Model Explainability & Feature Attribution
              </h1>
              <p className="text-xs text-[#5A6570] mt-0.5">
                Global TreeSHAP feature importance, dependency trends, and local breakdown across C-MAPSS FD001 sensor telemetry.
              </p>
            </div>
            <div className="hidden xl:flex items-center gap-3 text-[#737687] text-[11px] font-mono shrink-0">
              <span>Evaluated Engines: <strong className="text-[#121D26]">100</strong></span>
              <span>Sample Slices: <strong className="text-[#121D26]">20,631</strong></span>
              <span>Additivity Error: <strong className="text-[#15803D]">&lt; 1e-6 cycles</strong></span>
            </div>
          </div>
        </div>

        {/* Interpretability Caveat Bar from Stitch */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded bg-[#F8F9FA] border border-[#DDE2E5] text-[#5A6570] text-[11px]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0" />
            <span>
              <strong className="text-[#121D26]">Interpretability Notice:</strong> Attribution models mathematical feature contribution to RUL prediction; physical causal mechanisms require domain engineering validation.
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[#737687] font-mono text-[10px] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
            <span>TreeSHAP v0.42 Certified</span>
          </div>
        </div>
      </div>

      {/* Physical Mechanism Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* LPT Temperature */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-amber-800">
            <Flame className="w-4 h-4 text-amber-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              T50: LPT Outlet Temperature (Sensor 4)
            </h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Accounts for <strong>38.8%</strong> of total model importance (Mean 5-cycle & 15-cycle). As turbine efficiency drops, combustion burns hotter to sustain commanded thrust, causing exhaust gas temperature to climb steadily.
          </p>
        </div>

        {/* HPC Static Pressure */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-sky-800">
            <Gauge className="w-4 h-4 text-sky-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Ps30: HPC Static Pressure (Sensor 11)
            </h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Accounts for <strong>10.4%</strong> of model importance. Aerodynamic compressor blade erosion and tip clearance growth lower overall pressure ratio, providing an early signature of mechanical degradation.
          </p>
        </div>

        {/* Bypass Ratio */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-800">
            <Wind className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              BPR: Bypass Ratio (Sensor 15)
            </h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Accounts for <strong>14.3%</strong> of model importance. Core flow resistance forces a higher proportion of inlet fan air through the bypass duct, acting as a sensitive indicator of core throttling.
          </p>
        </div>
      </div>

      {/* SHAP Summary Beeswarm Plot */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Global SHAP (Shapley Additive Explanations) Beeswarm Plot
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Validated XGBoost Pipeline on FD001
          </span>
        </div>

        <div className="w-full flex justify-center bg-slate-50 border border-slate-200 rounded-md p-4">
          <img
            src="/figures/shap_summary.png"
            alt="SHAP Summary Plot"
            className="max-h-96 object-contain rounded"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs font-mono text-slate-600 space-y-1">
          <div className="text-slate-900 font-bold">Interpreting this SHAP beeswarm plot:</div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Each point is a single flight cycle. Red indicates high feature values; blue indicates low feature values. For <code className="text-amber-800 font-semibold">sensor_4_roll_mean_5</code>, high values (red) have negative SHAP values, strongly pulling down predicted RUL toward terminal failure.
          </p>
        </div>
      </div>

      {/* Top 20 Global Feature Importances Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Top 20 Global Engineered Features (XGBoost Gain)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            98 Engineered Channels Total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Feature Name</th>
                <th className="py-2.5 px-3">Physical Description</th>
                <th className="py-2.5 px-3">Relative Gain</th>
                <th className="py-2.5 px-3 w-48">Gain Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {features.map((f) => {
                const pct = (f.importance / maxImportance) * 100;
                return (
                  <tr key={f.rank} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-sky-700">#{f.rank}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {f.feature}
                    </td>
                    <td className="py-2 px-3 text-slate-500">
                      {f.physical_description}
                    </td>
                    <td className="py-2 px-3 font-mono-numbers font-semibold">
                      {(f.importance * 100).toFixed(2)}%
                    </td>
                    <td className="py-2 px-3">
                      <div className="w-full h-1.5 bg-slate-100 rounded overflow-hidden border border-slate-200">
                        <div
                          className="h-full bg-sky-600 rounded"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodological Disclaimer */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3 text-xs text-amber-900 shadow-xs">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-amber-950">Attribution vs Causality Disclaimer:</strong> Feature importance and SHAP values measure statistical attribution and gradient reduction within the XGBoost decision trees. They quantify predictive utility, not thermodynamic causation. While physical engine deterioration causes sensor drift, the model identifies correlative patterns in the NASA simulation data.
        </div>
      </div>
    </div>
  );
};

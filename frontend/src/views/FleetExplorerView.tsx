import React, { useState, useEffect } from 'react';
import {
  Download,
  Activity,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';
import { fetchEngines, fetchTelemetry } from '../services/api';
import type { EngineItem } from '../types';
import { TelemetryChart } from '../components/TelemetryChart';

interface FleetExplorerViewProps {
  currentSubset: string;
}

const AVAILABLE_SENSORS = [
  { id: 'sensor_4', name: 'Sensor 4: LPT Outlet Temp (T50)', color: '#0284c7', unit: '°R' },
  { id: 'sensor_11', name: 'Sensor 11: HPC Outlet Pressure (Ps30)', color: '#d97706', unit: 'psia' },
  { id: 'sensor_15', name: 'Sensor 15: Bypass Ratio (BPR)', color: '#16a34a', unit: 'ratio' },
  { id: 'sensor_9', name: 'Sensor 9: Physical Core Speed (Nc)', color: '#7c3aed', unit: 'rpm' },
  { id: 'sensor_2', name: 'Sensor 2: LPC Outlet Temp (T24)', color: '#db2777', unit: '°R' },
  { id: 'sensor_3', name: 'Sensor 3: HPC Outlet Temp (T30)', color: '#ea580c', unit: '°R' },
  { id: 'sensor_12', name: 'Sensor 12: Fuel Flow to Ps30 (phi)', color: '#0891b2', unit: 'pps/psia' },
  { id: 'sensor_21', name: 'Sensor 21: LPT Coolant Bleed (W31)', color: '#ca8a04', unit: 'lbm/s' }
];

export const FleetExplorerView: React.FC<FleetExplorerViewProps> = ({ currentSubset }) => {
  const [partition, setPartition] = useState<'train' | 'test'>('test');
  const [engines, setEngines] = useState<EngineItem[]>([]);
  const [selectedEngineId, setSelectedEngineId] = useState<number>(1);
  const [telemetryData, setTelemetryData] = useState<any[]>([]);
  const [groundTruthRul, setGroundTruthRul] = useState<number | null>(null);
  const [selectedSensors, setSelectedSensors] = useState<string[]>(['sensor_4', 'sensor_11', 'sensor_15']);
  const [loadingTelemetry, setLoadingTelemetry] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const rowsPerPage = 12;

  // Load engines when subset or partition changes
  useEffect(() => {
    let mounted = true;

    fetchEngines(currentSubset, partition)
      .then((res) => {
        if (!mounted) return;
        setEngines(res.engines);
        if (res.engines.length > 0) {
          setSelectedEngineId(res.engines[0].engine_id);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('Failed to load engines:', err);
      });

    return () => {
      mounted = false;
    };
  }, [currentSubset, partition]);

  const handleEngineChange = (newId: number) => {
    setSelectedEngineId(newId);
    setPage(1);
    setLoadingTelemetry(true);
  };

  // Load telemetry when selected engine changes
  useEffect(() => {
    if (!selectedEngineId) return;
    let mounted = true;

    fetchTelemetry(currentSubset, selectedEngineId, partition)
      .then((res) => {
        if (!mounted) return;
        setTelemetryData(res.telemetry);
        setGroundTruthRul(res.ground_truth_rul ?? null);
        setLoadingTelemetry(false);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('Failed to load telemetry:', err);
        setLoadingTelemetry(false);
      });

    return () => {
      mounted = false;
    };
  }, [currentSubset, selectedEngineId, partition]);

  const toggleSensor = (id: string) => {
    if (selectedSensors.includes(id)) {
      if (selectedSensors.length > 1) {
        setSelectedSensors(selectedSensors.filter((s) => s !== id));
      }
    } else {
      if (selectedSensors.length < 4) {
        setSelectedSensors([...selectedSensors, id]);
      }
    }
  };

  const handleExportCSV = () => {
    if (!telemetryData || telemetryData.length === 0) return;
    const headers = Object.keys(telemetryData[0]).join(',');
    const rows = telemetryData.map((row) => Object.values(row).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentSubset}_${partition}_engine_${selectedEngineId}_telemetry.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeSensors = AVAILABLE_SENSORS.filter((s) => selectedSensors.includes(s.id));
  const totalPages = Math.ceil(telemetryData.length / rowsPerPage);
  const currentTableRows = telemetryData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const selectedEngineMeta = engines.find((e) => e.engine_id === selectedEngineId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Stitch Context Command Strip */}
      <div className="bg-[#121D26] text-white px-4 py-2.5 rounded-sm flex flex-wrap items-center justify-between gap-3 font-mono text-xs shadow-xs border-b border-[#2A3742]">
        <div className="flex items-center gap-3">
          <span className="bg-[#0F62FE] text-white px-2 py-0.5 rounded-xs font-bold text-[10px] tracking-wider uppercase">
            TELEMETRY-TRACE // V2.4
          </span>
          <span className="text-slate-300 text-[11px]">
            SUBSET: <strong className="text-white">{currentSubset}</strong>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 text-[11px]">
            UNIT: <strong className="text-white font-mono">#{selectedEngineId}</strong>
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>PARTITION: <span className="text-emerald-400 font-semibold uppercase">{partition}</span></span>
          <span className="text-slate-600">|</span>
          <span>STATUS: <span className="text-sky-400 font-semibold uppercase">ACTIVE STREAM</span></span>
        </div>
      </div>

      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DDE2E5] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
            <span className="uppercase tracking-wider">Fleet Telemetry Explorer</span>
            <span>•</span>
            <span className="font-semibold text-slate-800">{currentSubset} Partition</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#121D26] font-sans">
            Turbofan Time-Series Trajectory Explorer
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Inspect raw operational settings and high-pressure component degradation trajectories across all recorded flight cycles.
          </p>
        </div>

        {/* Partition Switcher & Export */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center bg-[#F1F3F5] p-1 rounded-sm border border-[#DDE2E5] text-xs font-mono">
            <button
              onClick={() => setPartition('test')}
              className={`px-3 py-1 rounded-xs transition-all font-semibold ${
                partition === 'test'
                  ? 'bg-[#0F62FE] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Test Trajectories
            </button>
            <button
              onClick={() => setPartition('train')}
              className={`px-3 py-1 rounded-xs transition-all font-semibold ${
                partition === 'train'
                  ? 'bg-[#0F62FE] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Train (Run-to-Failure)
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={telemetryData.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-[#F8F9FA] border border-[#DDE2E5] rounded-sm text-xs text-slate-700 font-mono font-medium transition-colors disabled:opacity-50 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Control Panel: Engine Selector & Quick Meta Bar */}
      <div className="bg-white border border-[#DDE2E5] rounded-sm p-4 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Engine Selector */}
          <div className="lg:col-span-4 space-y-1">
            <label className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block font-semibold">
              Target Engine Unit
            </label>
            <select
              value={selectedEngineId}
              onChange={(e) => handleEngineChange(Number(e.target.value))}
              className="w-full bg-[#F8F9FA] border border-[#DDE2E5] rounded-sm px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0F62FE] font-semibold"
            >
              {engines.map((e) => (
                <option key={e.engine_id} value={e.engine_id}>
                  Engine #{e.engine_id} — {e.total_cycles} cycles recorded
                </option>
              ))}
            </select>
          </div>

          {/* Engine Quick Metrics Strip */}
          {selectedEngineMeta && (
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#F8F9FA] border border-[#DDE2E5] rounded-sm p-2.5 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Total Cycles:</span>
                <span className="text-[#121D26] font-bold text-sm font-mono">
                  {selectedEngineMeta.total_cycles}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Recorded Range:</span>
                <span className="text-slate-700 font-mono">
                  {selectedEngineMeta.min_cycle} → {selectedEngineMeta.max_cycle}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Dataset Partition:</span>
                <span className="text-[#0F62FE] font-bold uppercase">
                  {partition}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
                  {partition === 'test' ? 'True Ground RUL:' : 'End-of-Life:'}
                </span>
                <span
                  className={`font-bold font-mono ${
                    partition === 'test' ? 'text-amber-800' : 'text-slate-800'
                  }`}
                >
                  {partition === 'test'
                    ? groundTruthRul !== null
                      ? `${groundTruthRul} cycles`
                      : 'Blind'
                    : `Terminated @ C${selectedEngineMeta.max_cycle}`}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sensor Channel Filter Chips */}
      <div className="bg-white border border-[#DDE2E5] rounded-sm p-3.5 space-y-2 shadow-xs">
        <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider flex items-center justify-between font-semibold">
          <span>Active Sensor Channels ({selectedSensors.length}/4 selected):</span>
          <span className="text-slate-400 text-[10px]">Click channel pill to toggle visibility</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {AVAILABLE_SENSORS.map((s) => {
            const isSelected = selectedSensors.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggleSensor(s.id)}
                className={`px-2.5 py-1 rounded-sm text-xs font-mono flex items-center gap-1.5 border transition-all ${
                  isSelected
                    ? 'bg-[#EBF0F5] text-[#004CCD] font-bold border-[#0F62FE] shadow-xs'
                    : 'bg-[#F8F9FA] text-slate-600 border-[#DDE2E5] hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span>{s.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Telemetry Chart Component */}
      {loadingTelemetry ? (
        <div className="h-80 flex items-center justify-center bg-white border border-[#DDE2E5] rounded-sm shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 font-mono text-xs">
            <Activity className="w-4 h-4 animate-spin text-[#0F62FE]" />
            <span>Streaming multi-sensor telemetry records...</span>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#DDE2E5] rounded-sm p-4 shadow-xs">
          <TelemetryChart data={telemetryData} sensors={activeSensors} height={340} />
        </div>
      )}

      {/* Telemetry Data Table */}
      <div className="bg-white border border-[#DDE2E5] rounded-sm p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#DDE2E5] pb-2.5">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#0F62FE]" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#121D26]">
              Raw Operational Telemetry (Engine #{selectedEngineId})
            </h3>
          </div>
          <div className="text-xs font-mono text-slate-500">
            Records {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, telemetryData.length)} of {telemetryData.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#F8F9FA] text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-[#DDE2E5]">
              <tr>
                <th className="py-2.5 px-3">Cycle</th>
                <th className="py-2.5 px-3">Altitude (Set 1)</th>
                <th className="py-2.5 px-3">Mach (Set 2)</th>
                <th className="py-2.5 px-3">TRA (Set 3)</th>
                <th className="py-2.5 px-3 text-[#004CCD]">T50 (Sens 4)</th>
                <th className="py-2.5 px-3 text-amber-800">Ps30 (Sens 11)</th>
                <th className="py-2.5 px-3 text-emerald-800">BPR (Sens 15)</th>
                <th className="py-2.5 px-3 text-purple-800">Nc (Sens 9)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBF0F5] text-slate-700">
              {currentTableRows.map((r, i) => (
                <tr key={i} className="hover:bg-[#F8F9FA] transition-colors">
                  <td className="py-2 px-3 font-bold text-[#121D26] font-mono">C{r.cycle}</td>
                  <td className="py-2 px-3 font-mono">{Number(r.setting_1).toFixed(4)}</td>
                  <td className="py-2 px-3 font-mono">{Number(r.setting_2).toFixed(4)}</td>
                  <td className="py-2 px-3 font-mono">{Number(r.setting_3).toFixed(1)}</td>
                  <td className="py-2 px-3 text-[#004CCD] font-mono font-bold">
                    {r.sensor_4 ? Number(r.sensor_4).toFixed(2) : '-'}
                  </td>
                  <td className="py-2 px-3 text-amber-800 font-mono font-bold">
                    {r.sensor_11 ? Number(r.sensor_11).toFixed(2) : '-'}
                  </td>
                  <td className="py-2 px-3 text-emerald-800 font-mono font-bold">
                    {r.sensor_15 ? Number(r.sensor_15).toFixed(4) : '-'}
                  </td>
                  <td className="py-2 px-3 text-purple-800 font-mono font-bold">
                    {r.sensor_9 ? Number(r.sensor_9).toFixed(2) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="flex items-center justify-between pt-2 border-t border-[#DDE2E5]">
          <span className="text-[11px] font-mono text-slate-500">
            Page {page} of {totalPages || 1}
          </span>
          <div className="flex items-center gap-1 font-mono">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1 rounded-xs bg-[#F8F9FA] border border-[#DDE2E5] text-slate-700 hover:text-slate-900 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages || totalPages === 0}
              className="p-1 rounded-xs bg-[#F8F9FA] border border-[#DDE2E5] text-slate-700 hover:text-slate-900 disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

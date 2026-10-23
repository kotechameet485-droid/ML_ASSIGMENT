import React, { useState } from 'react';

interface TelemetryPoint {
  cycle: number;
  [key: string]: any;
}

interface TelemetryChartProps {
  data: TelemetryPoint[];
  sensors: { id: string; name: string; color: string; unit: string }[];
  height?: number;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  data,
  sensors,
  height = 320
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0 || sensors.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center bg-white border border-slate-200 rounded-md text-slate-400 font-mono text-xs shadow-sm"
        style={{ height }}
      >
        No telemetry records available for this cycle range.
      </div>
    );
  }

  const padding = { top: 20, right: 30, bottom: 40, left: 60 };
  const width = 800; // viewBox coordinate space
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minCycle = data[0].cycle;
  const maxCycle = data[data.length - 1].cycle;
  const cycleSpan = Math.max(maxCycle - minCycle, 1);

  // Compute min/max per sensor for normalized plotting
  const sensorRanges: Record<string, { min: number; max: number }> = {};
  sensors.forEach((s) => {
    const vals = data.map((d) => d[s.id] ?? 0);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    sensorRanges[s.id] = { min, max: max === min ? min + 1 : max };
  });

  const getX = (cycle: number) => {
    return padding.left + ((cycle - minCycle) / cycleSpan) * chartWidth;
  };

  const getY = (val: number, sId: string) => {
    const range = sensorRanges[sId];
    const norm = (val - range.min) / (range.max - range.min);
    return padding.top + chartHeight - norm * chartHeight;
  };

  // Build SVG path for each sensor
  const paths = sensors.map((s) => {
    const points = data.map((d) => {
      const x = getX(d.cycle);
      const y = getY(d[s.id] ?? 0, s.id);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return {
      sensor: s,
      d: `M ${points.join(' L ')}`
    };
  });

  const activePoint = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-md p-4 shadow-sm">
      {/* Legend & Tooltip Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs font-mono font-semibold uppercase text-slate-500">
            Channels:
          </span>
          {sensors.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5 text-xs font-mono">
              <span
                className="w-3 h-1.5 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-slate-800 font-medium">{s.name}</span>
              <span className="text-slate-500 text-[10px]">({s.unit})</span>
            </div>
          ))}
        </div>

        {activePoint && (
          <div className="flex items-center gap-3 text-xs font-mono bg-slate-50 px-3 py-1 rounded border border-slate-200 text-slate-800 shadow-sm">
            <span className="text-sky-600 font-bold">
              Cycle: {activePoint.cycle}
            </span>
            {sensors.map((s) => (
              <span key={s.id} style={{ color: s.color }} className="font-semibold">
                {s.id}: {(activePoint[s.id] ?? 0).toFixed(2)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair select-none"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const svgX = (mouseX / rect.width) * width;
            if (svgX >= padding.left && svgX <= width - padding.right) {
              const fraction = (svgX - padding.left) / chartWidth;
              const idx = Math.min(
                Math.max(Math.round(fraction * (data.length - 1)), 0),
                data.length - 1
              );
              setHoverIndex(idx);
            }
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + chartHeight * ratio;
            return (
              <line
                key={`grid-y-${ratio}`}
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            );
          })}

          {/* Cycle X-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const cycleVal = Math.round(minCycle + cycleSpan * ratio);
            const x = padding.left + chartWidth * ratio;
            return (
              <g key={`cycle-label-${ratio}`}>
                <line
                  x1={x}
                  y1={padding.top + chartHeight}
                  x2={x}
                  y2={padding.top + chartHeight + 6}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={padding.top + chartHeight + 20}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  C{cycleVal}
                </text>
              </g>
            );
          })}

          {/* Sensor Lines */}
          {paths.map(({ sensor, d }) => (
            <path
              key={sensor.id}
              d={d}
              fill="none"
              stroke={sensor.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Hover Crosshair & Data Indicator */}
          {activePoint && (
            <g>
              <line
                x1={getX(activePoint.cycle)}
                y1={padding.top}
                x2={getX(activePoint.cycle)}
                y2={padding.top + chartHeight}
                stroke="#0284c7"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              {sensors.map((s) => (
                <circle
                  key={`dot-${s.id}`}
                  cx={getX(activePoint.cycle)}
                  cy={getY(activePoint[s.id] ?? 0, s.id)}
                  r="4"
                  fill="#ffffff"
                  stroke={s.color}
                  strokeWidth="2.5"
                />
              ))}
            </g>
          )}
        </svg>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mt-2 px-1">
        <span>X: Flight Operational Cycles</span>
        <span>Y: Relative Degradation Range (Normalized per Channel)</span>
      </div>
    </div>
  );
};

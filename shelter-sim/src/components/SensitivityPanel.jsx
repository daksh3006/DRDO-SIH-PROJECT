import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Sliders, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { fetchSensitivitySweep } from '../services/api';

const SWEEP_OPTIONS = [
  { id: 'wall_thickness', label: 'Wall Thickness (Insulation Depth)', unit: 'm' },
  { id: 'roof_thickness', label: 'Roof Thickness (Insulation Depth)', unit: 'm' },
  { id: 'window_area', label: 'South Window Area', unit: 'm²' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-lg text-slate-800">
      <p className="mb-1.5 font-bold text-[#0369A1]">Setting: {label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="tabular-nums font-semibold">
          {p.name}: {p.value} {p.unit || ''}
        </p>
      ))}
    </div>
  );
};

export default function SensitivityPanel({ currentParams }) {
  const [sweepVar, setSweepVar] = useState('wall_thickness');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runSweep = (v) => {
    setLoading(true);
    setError(null);
    fetchSensitivitySweep(currentParams, v)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message || 'Sweep failed');
        setLoading(false);
      });
  };

  useEffect(() => {
    runSweep(sweepVar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sweepVar]);

  const selectedOpt = SWEEP_OPTIONS.find((o) => o.id === sweepVar) || SWEEP_OPTIONS[0];

  let insight = null;
  if (data?.sweep_results?.length >= 2) {
    const first = data.sweep_results[0];
    const last = data.sweep_results[data.sweep_results.length - 1];
    const tempDiff = round1(last.min_temp - first.min_temp);
    const lossDiffPct = round1(
      ((first.outward_heat_transfer_kwh - last.outward_heat_transfer_kwh) /
        (first.outward_heat_transfer_kwh || 1)) *
        100
    );

    insight = {
      firstVal: `${first.value} ${selectedOpt?.unit || ''}`,
      lastVal: `${last.value} ${selectedOpt?.unit || ''}`,
      tempChange: tempDiff >= 0 ? `+${tempDiff}°C` : `${tempDiff}°C`,
      lossChange: lossDiffPct >= 0 ? `decreases by ${lossDiffPct}%` : `increases by ${Math.abs(lossDiffPct)}%`,
    };
  }

  function round1(v) {
    return Math.round(v * 10) / 10;
  }

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-xl border border-[#90CDF4] bg-[#C1E7FF]/40 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-[#0284C7]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Parametric Sensitivity Analysis
              </h2>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-700">
              Vary one design variable across its physical spectrum to quantify thermal impact on comfort and energy transfer.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-bold text-slate-800">Sweep Variable:</label>
            <select
              value={sweepVar}
              onChange={(e) => setSweepVar(e.target.value)}
              className="rounded-lg border border-[#BAE6FD] bg-white px-3 py-1.5 text-xs font-semibold text-[#0369A1] focus:border-[#0284C7] focus:outline-none shadow-2xs"
            >
              {SWEEP_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-slate-600">
          <Loader2 className="mr-2 h-6 w-6 animate-spin text-[#0284C7]" />
          <span className="text-xs font-semibold">Computing 5-point parametric sweep…</span>
        </div>
      )}

      {error && !data && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs font-semibold text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Key Insight Highlight */}
          {insight && (
            <div className="flex items-start gap-2.5 rounded-xl border border-[#FDBA74] bg-[#FED8A7]/40 p-3 text-xs text-amber-950 shadow-2xs font-medium">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <span>
                <strong className="font-bold text-amber-900">Quantitative Insight</strong>: Adjusting {data.variable_name} from{' '}
                <strong className="font-bold text-amber-900">{insight.firstVal}</strong> to{' '}
                <strong className="font-bold text-amber-900">{insight.lastVal}</strong> shifts minimum indoor temperature by{' '}
                <strong className="font-bold text-amber-900">{insight.tempChange}</strong> and total 24h outward heat transfer{' '}
                <strong className="font-bold text-amber-900">{insight.lossChange}</strong>.
              </span>
            </div>
          )}

          {/* Sensitivity Graph */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Temperature Sensitivity Curve: {data.variable_name}
              </h3>
              <span className="text-[10px] text-slate-500 font-mono font-medium">Min / Avg / Max Indoor Response</span>
            </div>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.sweep_results || []} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 500 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                    unit="°C"
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#475569', fontWeight: 500 }} />
                  <Line
                    type="monotone"
                    dataKey="min_temp"
                    name="24h Min Temp"
                    unit="°C"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#0284c7' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="average_temp"
                    name="24h Avg Temp"
                    unit="°C"
                    stroke="#059669"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={{ r: 3, fill: '#059669' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="max_temp"
                    name="24h Max Temp"
                    unit="°C"
                    stroke="#d97706"
                    strokeWidth={1.5}
                    dot={{ r: 3, fill: '#d97706' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Parametric Data Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-800">
              Parametric Sweep Data Matrix
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-600 font-bold bg-[#F0F7FF]">
                    <th className="py-2.5 px-3 font-bold">{data.variable_name}</th>
                    <th className="py-2.5 px-3 font-bold">Min Temp (°C)</th>
                    <th className="py-2.5 px-3 font-bold">Avg Temp (°C)</th>
                    <th className="py-2.5 px-3 font-bold">Max Temp (°C)</th>
                    <th className="py-2.5 px-3 font-bold">Comfort Hours</th>
                    <th className="py-2.5 px-3 font-bold">Outward Heat Transfer (kWh)</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.sweep_results || []).map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-[#D6F5FF]/30 font-medium">
                      <td className="py-2.5 px-3 font-bold text-[#0369A1]">{row.label}</td>
                      <td className="py-2.5 px-3 tabular-nums text-slate-800">{row.min_temp}</td>
                      <td className="py-2.5 px-3 tabular-nums text-slate-800">{row.average_temp}</td>
                      <td className="py-2.5 px-3 tabular-nums text-slate-800">{row.max_temp}</td>
                      <td className="py-2.5 px-3 font-bold tabular-nums text-emerald-700">
                        {row.comfort_hours} / 24h
                      </td>
                      <td className="py-2.5 px-3 tabular-nums text-rose-700 font-semibold">
                        {row.outward_heat_transfer_kwh} kWh
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

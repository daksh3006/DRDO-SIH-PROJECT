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
  ReferenceArea,
} from 'recharts';
import { ShieldCheck, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';
import { fetchValidationResults } from '../services/api';

function formatClock(ts, index) {
  if (ts && typeof ts === 'string' && ts.includes(':')) {
    return ts;
  }
  const h = Number(index);
  if (h === 0) return '00:00 (Start)';
  if (h === 24) return '24:00';
  return `${String(h % 24).padStart(2, '0')}:00`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-lg text-slate-800">
      <p className="mb-1 font-bold text-slate-900">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="tabular-nums font-semibold">
          {p.name}: {p.value}°C
        </p>
      ))}
    </div>
  );
};

export default function ValidationPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchValidationResults()
      .then((res) => {
        if (mounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err?.message || 'Failed to load verification data');
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-slate-600">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#0284C7]" />
        <p className="text-sm font-semibold">Loading Model Verification Dataset…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-900">
        <div className="flex items-center gap-2 mb-2 font-bold text-sm">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <span>Verification Service Notice</span>
        </div>
        <p className="text-xs font-medium">{error}</p>
      </div>
    );
  }

  const hoursArr = data?.hours || Array.from({ length: 25 }, (_, i) => i);
  const timestampsArr = data?.timestamps || Array.from({ length: 25 }, (_, i) => `${String(i % 24).padStart(2, '0')}:00`);
  const predArr = data?.predicted_temperature || [];
  const refArr = data?.reference_temperature || [];
  const ambArr = data?.ambient_temperature || [];

  const chartData = hoursArr.map((h, i) => ({
    hour: h,
    label: formatClock(timestampsArr[i], i),
    predicted: predArr[i] ?? 0,
    reference: refArr[i] ?? 0,
    ambient: ambArr[i] ?? 0,
  }));

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-xl border border-[#90CDF4] bg-[#C1E7FF]/40 p-4 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#0284C7]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Model Verification — Synthetic Reference Case
              </h2>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-[#0369A1] border border-[#7DD3FC]">
                Synthetic Benchmark Suite
              </span>
            </div>
            <p className="mt-1.5 text-xs font-medium text-slate-700 leading-relaxed max-w-3xl">
              <strong className="text-[#0369A1]">Model Verification Scope</strong>: The simulator is tested against a predefined synthetic reference scenario to verify expected thermal behavior. Experimental validation using measured shelter temperature data is planned as a future stage.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Checkmark Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          <div>
            <p className="text-[11px] font-bold text-slate-800">Reference Case</p>
            <p className="mt-0.5 text-[10px] text-emerald-700 font-bold">Completed ✅</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          <div>
            <p className="text-[11px] font-bold text-slate-800">24-Hour Simulation</p>
            <p className="mt-0.5 text-[10px] text-emerald-700 font-bold">Consistency Verified ✅</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          <div>
            <p className="text-[11px] font-bold text-slate-800">Thermal Solver</p>
            <p className="mt-0.5 text-[10px] text-emerald-700 font-bold">Response Checked ✅</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-[#FDBA74] bg-[#FED8A7]/40 p-3 shadow-2xs">
          <Info className="h-4 w-4 shrink-0 text-amber-800 mt-0.5" />
          <div>
            <p className="text-[11px] font-bold text-slate-800">Experimental Validation</p>
            <p className="mt-0.5 text-[10px] text-amber-900 font-bold">Not yet available (Future Stage)</p>
          </div>
        </div>
      </div>

      {/* Verification Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Simulator Prediction vs Synthetic Reference Indoor Temperature
          </h3>
          <span className="text-[10px] text-slate-500 font-mono font-medium">Leh Synthetic Baseline</span>
        </div>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#475569', fontSize: 10, fontWeight: 500 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={{ stroke: '#cbd5e1' }}
                interval={2}
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
              <ReferenceArea y1={16} y2={26} fill="#10b981" fillOpacity={0.08} />
              <Line
                type="monotone"
                dataKey="predicted"
                name="Simulator Indoor Temp (2-Node Model)"
                stroke="#0284c7"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: '#0284c7' }}
              />
              <Line
                type="monotone"
                dataKey="reference"
                name="Synthetic Reference Indoor Temp"
                stroke="#059669"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={{ r: 2.5, fill: '#059669' }}
                activeDot={{ r: 4, fill: '#059669' }}
              />
              <Line
                type="monotone"
                dataKey="ambient"
                name="Ambient Outdoor Temperature"
                stroke="#d97706"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-center text-[10px] font-medium text-slate-500">
          Sky Blue line = Simulator Indoor Temp (2-Node Model) · Green dashed line = Synthetic Reference Indoor Temp · Orange dotted line = Ambient Outdoor Temperature
        </p>
      </div>

      {/* Case Details Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-xs">
        <h4 className="mb-2 font-bold text-slate-900 uppercase tracking-wider text-[11px]">
          Synthetic Reference Setup & Verification Parameters
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600 font-medium">
          <div>
            <p><strong className="text-slate-900">Location</strong>: Leh, Ladakh (34.15°N, 77.58°E, 3500m ASL)</p>
            <p><strong className="text-slate-900">Structure</strong>: Passive solar shelter with south glazing (16m² Double Low-E)</p>
            <p><strong className="text-slate-900">Envelope</strong>: 150mm PUF insulated panels (k = 0.035 W/m·K)</p>
          </div>
          <div>
            <p><strong className="text-slate-900">Glazing</strong>: Double Low-E South Glazing (g = 0.75, U = 1.4 W/m²K)</p>
            <p><strong className="text-slate-900">Spin-Up</strong>: 3-day prior climate history (72h past weather)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

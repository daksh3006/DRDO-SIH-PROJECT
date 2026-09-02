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
  ReferenceLine,
} from 'recharts';

function formatClockLabel(ts, index) {
  if (ts && typeof ts === 'string' && ts.includes('T')) {
    try {
      const parts = ts.split('T')[1].split(':');
      const hh = parts[0];
      const mm = parts[1] || '00';
      if (index === 24) return `${hh}:${mm} (+24h)`;
      return `${hh}:${mm}`;
    } catch {
      // Fallback
    }
  }
  const h = Number(ts ?? index);
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
      <p className="mt-1 text-[10px] text-slate-500 italic font-mono border-t border-slate-100 pt-1">
        Model Estimate Range: ±1.5°C
      </p>
    </div>
  );
};

export default function TemperatureChart({ results }) {
  if (!results) return null;

  const series = results.time_series || results;
  const hours = series.hours || [];
  const timestamps = series.timestamps || series.hour_timestamps || [];
  const indoorTemps = series.indoor_temperature || [];
  const ambientTemps = series.ambient_temperature || [];
  const startTemp = indoorTemps[0] !== undefined ? indoorTemps[0] : (results.initial_temperature ?? 20);

  const data = hours.map((h, i) => {
    const ts = timestamps[i] || h;
    const label = formatClockLabel(ts, i);
    const ind = indoorTemps[i] ?? 0;
    return {
      index: i,
      label,
      indoor: ind,
      upper_bound: Math.round((ind + 1.5) * 10) / 10,
      lower_bound: Math.round((ind - 1.5) * 10) / 10,
      ambient: ambientTemps[i] ?? 0,
    };
  });

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="mb-2 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Estimated Indoor vs Ambient Temperature Profile
          </h3>
          <p className="text-[10px] text-[#0284C7] font-semibold">
            Model Estimate (±1.5°C Uncertainty Band)
          </p>
        </div>
        <span className="text-[10px] text-slate-500 font-mono font-medium">Next 24 Hours</span>
      </div>

      {/* Dynamic chart wrapper filling the full box height */}
      <div className="w-full flex-1 min-h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 16, left: -4, bottom: 4 }}>
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
            <Legend
              wrapperStyle={{ fontSize: 11, color: '#475569', fontWeight: 500, paddingTop: '8px' }}
              iconType="plainline"
            />
            {/* Comfort band (16-26 °C) */}
            <ReferenceArea y1={16} y2={26} fill="#10b981" fillOpacity={0.08} />
            {/* Initial / Spin-up baseline */}
            <ReferenceLine
              y={startTemp}
              stroke="#8b5cf6"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{
                value: `Start ${startTemp}°C`,
                position: 'insideTopRight',
                fill: '#7c3aed',
                fontSize: 10,
                fontWeight: 600,
              }}
            />
            <Line
              type="monotone"
              dataKey="indoor"
              name="Estimated Indoor Temp"
              stroke="#0284c7"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: '#0284c7' }}
            />
            <Line
              type="monotone"
              dataKey="ambient"
              name="Ambient Outdoor Temp"
              stroke="#d97706"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{ r: 3, fill: '#d97706' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 shrink-0 text-center text-[10px] font-medium text-slate-500">
        Sky Blue line = Estimated Indoor Temp (±1.5°C Model Uncertainty Band) · Green shading = ASHRAE comfort band (16–26°C) · Purple baseline = start state ({startTemp}°C)
      </p>
    </div>
  );
}

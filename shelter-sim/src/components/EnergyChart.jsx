import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
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
          {p.name}: {p.value} W
        </p>
      ))}
    </div>
  );
};

export default function EnergyChart({ results }) {
  if (!results) return null;

  const series = results.time_series || results;
  const hours = series.hours || [];
  const timestamps = series.timestamps || series.hour_timestamps || [];
  const solarGains = series.solar_gain || [];
  const heatLosses = series.heat_loss || [];

  const data = hours.map((h, i) => {
    const ts = timestamps[i] || h;
    const label = formatClockLabel(ts, i);
    return {
      index: i,
      label,
      solar: solarGains[i] ?? 0,
      loss: heatLosses[i] ?? 0,
    };
  });

  return (
    <div className="h-full w-full rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Component Heat Transfer & Solar Gains
        </h3>
        <span className="text-[10px] text-slate-500 font-mono font-medium">
          Window Transmitted Solar vs Outward Heat Loss
        </span>
      </div>
      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
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
              unit=" W"
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={{ stroke: '#cbd5e1' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#475569', fontWeight: 500 }} />
            <Area
              type="monotone"
              dataKey="solar"
              name="Transmitted Window Solar Gain"
              stroke="#d97706"
              fill="#fed8a7"
              fillOpacity={0.6}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="loss"
              name="Outward System Heat Loss"
              stroke="#e11d48"
              fill="#ffe4e6"
              fillOpacity={0.5}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

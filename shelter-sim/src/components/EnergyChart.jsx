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

function toClock(hour) {
  const h = Number(hour) % 24;
  return `${String(h).padStart(2, '0')}:00`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-slate-300">{toClock(label)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="tabular-nums">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function EnergyChart({ results }) {
  if (!results) return null;

  const data = results.hours.map((h, i) => ({
    hour: h,
    solar: results.solar_gain[i],
    loss: results.heat_loss[i],
  }));

  return (
    <div className="h-full w-full rounded-lg border border-slate-700/80 bg-slate-900/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Energy Balance
        </h3>
        <span className="text-[10px] text-slate-500">Solar gain vs heat loss · Today</span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="hour"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            tickFormatter={toClock}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
            interval={2}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
          <Area
            type="monotone"
            dataKey="solar"
            name="Solar Heat Gain"
            stroke="#eab308"
            fill="#eab308"
            fillOpacity={0.25}
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="loss"
            name="Heat Loss"
            stroke="#f43f5e"
            fill="#f43f5e"
            fillOpacity={0.2}
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

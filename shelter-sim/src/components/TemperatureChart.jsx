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
          {p.name}: {p.value}°C
        </p>
      ))}
    </div>
  );
};

export default function TemperatureChart({ results }) {
  if (!results) return null;

  const comfortTemp = results.comfort_temperature ?? 30;

  const data = results.hours.map((h, i) => ({
    hour: h,
    clock: toClock(h),
    indoor: results.indoor_temperature[i],
    ambient: results.ambient_temperature[i],
  }));

  return (
    <div className="h-full w-full rounded-lg border border-slate-700/80 bg-slate-900/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Indoor vs Ambient Temperature
        </h3>
        <span className="text-[10px] text-slate-500">Today · 24-hour profile</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
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
            unit="°C"
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
            iconType="plainline"
          />
          {/* Comfort band 16–26°C (standard) */}
          <ReferenceArea y1={16} y2={26} fill="#10b981" fillOpacity={0.06} />
          {/* User's preferred comfortable temperature */}
          <ReferenceLine
            y={comfortTemp}
            stroke="#a78bfa"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{
              value: `Comfort ${comfortTemp}°C`,
              position: 'insideTopRight',
              fill: '#a78bfa',
              fontSize: 10,
            }}
          />
          <Line
            type="monotone"
            dataKey="indoor"
            name="Indoor"
            stroke="#22d3ee"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: '#22d3ee' }}
          />
          <Line
            type="monotone"
            dataKey="ambient"
            name="Ambient"
            stroke="#f97316"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            activeDot={{ r: 3, fill: '#f97316' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[10px] text-slate-500">
        Green band = standard comfort (16–26 °C) · Purple line = your preferred temperature ({comfortTemp}°C)
      </p>
    </div>
  );
}

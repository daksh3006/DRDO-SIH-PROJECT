import {
  Thermometer,
  ThermometerSnowflake,
  ThermometerSun,
  Sun,
  ArrowDownToLine,
  Clock,
} from 'lucide-react';

const cards = [
  {
    key: 'average_temperature',
    label: 'Avg Indoor Temp',
    unit: '°C',
    icon: Thermometer,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/30',
  },
  {
    key: 'minimum_temperature',
    label: 'Min Indoor Temp',
    unit: '°C',
    icon: ThermometerSnowflake,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/30',
  },
  {
    key: 'maximum_temperature',
    label: 'Max Indoor Temp',
    unit: '°C',
    icon: ThermometerSun,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
  },
  {
    key: 'total_solar_gain',
    label: 'Indoor Solar Gain',
    unit: 'kWh',
    icon: Sun,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/30',
  },
  {
    key: 'total_heat_loss',
    label: 'Total Heat Loss',
    unit: 'kWh',
    icon: ArrowDownToLine,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/30',
  },
  {
    key: 'comfort_hours',
    label: 'Comfort Hours',
    unit: 'h',
    icon: Clock,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
  },
];

export default function SummaryCards({ summary }) {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map(({ key, label, unit, icon: Icon, color, bg }) => (
        <div
          key={key}
          className={`rounded-lg border ${bg} px-3 py-2.5`}
        >
          <div className="mb-1 flex items-center gap-1.5">
            <Icon className={`h-3.5 w-3.5 ${color}`} />
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              {label}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold tabular-nums text-slate-100">
              {summary[key] != null ? summary[key] : '—'}
            </span>
            <span className="text-[11px] text-slate-500">{unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

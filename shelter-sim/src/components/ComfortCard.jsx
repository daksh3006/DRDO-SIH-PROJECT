import { CheckCircle2, Snowflake, Flame } from 'lucide-react';

export default function ComfortCard({ results }) {
  if (!results?.comfort_status) return null;

  const counts = results.comfort_status.reduce(
    (acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    { comfortable: 0, too_cold: 0, too_hot: 0 }
  );

  const total = results.comfort_status.length || 24;
  const pct = (n) => Math.round((n / total) * 100);

  const segments = [
    {
      key: 'comfortable',
      label: 'Comfortable',
      count: counts.comfortable,
      color: 'bg-emerald-500',
      text: 'text-emerald-300',
      icon: CheckCircle2,
    },
    {
      key: 'too_cold',
      label: 'Too Cold',
      count: counts.too_cold,
      color: 'bg-sky-500',
      text: 'text-sky-300',
      icon: Snowflake,
    },
    {
      key: 'too_hot',
      label: 'Too Hot',
      count: counts.too_hot,
      color: 'bg-rose-500',
      text: 'text-rose-300',
      icon: Flame,
    },
  ];

  const dominant = segments.reduce((a, b) => (b.count > a.count ? b : a));

  return (
    <div className="rounded-lg border border-slate-700/80 bg-slate-900/60 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-300">
        Thermal Comfort Status
      </h3>

      {/* Dominant status badge */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            dominant.key === 'comfortable'
              ? 'bg-emerald-500/20 text-emerald-400'
              : dominant.key === 'too_cold'
              ? 'bg-sky-500/20 text-sky-400'
              : 'bg-rose-500/20 text-rose-400'
          }`}
        >
          <dominant.icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100">
            {dominant.label.toUpperCase()}
          </p>
          <p className="text-xs text-slate-400">
            Dominant condition · {dominant.count} of {total} hours
          </p>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="mb-3 flex h-3 overflow-hidden rounded-full bg-slate-800">
        {segments.map((s) =>
          s.count > 0 ? (
            <div
              key={s.key}
              className={`${s.color} transition-all`}
              style={{ width: `${pct(s.count)}%` }}
              title={`${s.label}: ${s.count}h`}
            />
          ) : null
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2">
        {segments.map((s) => (
          <div key={s.key} className="text-center">
            <div className="flex items-center justify-center gap-1">
              <s.icon className={`h-3 w-3 ${s.text}`} />
              <span className={`text-sm font-semibold tabular-nums ${s.text}`}>
                {s.count}h
              </span>
            </div>
            <p className="text-[10px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

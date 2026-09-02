import { CheckCircle2, Snowflake, Flame } from 'lucide-react';

export default function ComfortCard({ results }) {
  const comfortStatus = results?.time_series?.comfort_status || results?.comfort_status;
  if (!comfortStatus) return null;

  const counts = comfortStatus.reduce(
    (acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    { comfortable: 0, too_cold: 0, too_hot: 0 }
  );

  const total = comfortStatus.length || 24;
  const pct = (n) => Math.round((n / total) * 100);

  const segments = [
    {
      key: 'comfortable',
      label: 'Comfortable',
      count: counts.comfortable,
      color: 'bg-emerald-500',
      text: 'text-emerald-700',
      icon: CheckCircle2,
    },
    {
      key: 'too_cold',
      label: 'Too Cold',
      count: counts.too_cold,
      color: 'bg-[#0284C7]',
      text: 'text-[#0369A1]',
      icon: Snowflake,
    },
    {
      key: 'too_hot',
      label: 'Too Hot',
      count: counts.too_hot,
      color: 'bg-rose-500',
      text: 'text-rose-700',
      icon: Flame,
    },
  ];

  const dominant = segments.reduce((a, b) => (b.count > a.count ? b : a));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Thermal Comfort Status
        </h3>
        <span className="text-[10px] text-slate-500 font-mono font-medium">16°C – 26°C Range</span>
      </div>

      {/* Dominant status badge */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            dominant.key === 'comfortable'
              ? 'bg-emerald-100 text-emerald-700'
              : dominant.key === 'too_cold'
              ? 'bg-[#C1E7FF] text-[#0369A1]'
              : 'bg-rose-100 text-rose-700'
          }`}
        >
          <dominant.icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">
            {dominant.label.toUpperCase()}
          </p>
          <p className="text-xs font-medium text-slate-600">
            Dominant condition · {dominant.count} of {total} elapsed hours
          </p>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="mb-3 flex h-3 overflow-hidden rounded-full bg-slate-100">
        {segments.map((s) =>
          s.count > 0 ? (
            <div
              key={s.key}
              className={`${s.color} transition-all`}
              style={{ width: `${pct(s.count)}%` }}
              title={`${s.label}: ${s.count}h (${pct(s.count)}%)`}
            />
          ) : null
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2">
        {segments.map((s) => (
          <div key={s.key} className="text-center">
            <div className="flex items-center justify-center gap-1">
              <s.icon className={`h-3.5 w-3.5 ${s.text}`} />
              <span className={`text-sm font-bold tabular-nums ${s.text}`}>
                {s.count}h
              </span>
            </div>
            <p className="text-[10px] font-semibold text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

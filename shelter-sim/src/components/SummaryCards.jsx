import {
  Thermometer,
  Snowflake,
  Flame,
  Sun,
  TrendingDown,
  Clock,
} from 'lucide-react';

const cardDefs = [
  {
    keys: ['average_temperature', 'average_temp'],
    label: 'Avg indoor',
    fullName: 'Average 24-Hour Indoor Temperature',
    unit: '°C',
    sub: 'est. ± 1.5°C',
    detail: 'Mean indoor temperature across the 24-hour simulation period calculated by the 2-node thermal energy balance ODE with ±1.5°C model uncertainty band.',
    icon: Thermometer,
    ringStroke: 'text-[#0284C7]',
    ringTrack: 'text-[#E0F2FE]',
    iconColor: 'text-[#0284C7]',
    defaultPct: 65,
  },
  {
    keys: ['minimum_temperature', 'min_temp'],
    label: 'Min indoor',
    fullName: 'Minimum Diurnal Indoor Temperature',
    unit: '°C',
    sub: 'est. ± 1.5°C',
    detail: 'Lowest estimated shelter indoor temperature reached during nocturnal cold hours, indicating peak heating demand requirement.',
    icon: Snowflake,
    ringStroke: 'text-[#0284C7]',
    ringTrack: 'text-[#E0F2FE]',
    iconColor: 'text-[#0284C7]',
    defaultPct: 45,
  },
  {
    keys: ['maximum_temperature', 'max_temp'],
    label: 'Max indoor',
    fullName: 'Maximum Peak Indoor Temperature',
    unit: '°C',
    sub: 'est. ± 1.5°C',
    detail: 'Highest estimated shelter indoor temperature reached during peak afternoon solar gain, quantifying overheating potential.',
    icon: Flame,
    ringStroke: 'text-[#D97706]',
    ringTrack: 'text-[#FEF3C7]',
    iconColor: 'text-[#D97706]',
    defaultPct: 80,
  },
  {
    keys: ['total_solar_gain', 'total_solar_gain_kwh'],
    label: 'Window solar gain',
    fullName: 'Window Transmitted Solar Radiation Gain',
    unit: 'kWh',
    sub: '24h total',
    detail: 'Total cumulative solar energy entering through glazing over 24 hours, calculated from solar position, incidence angle, and glass solar heat gain coefficient (g-value).',
    icon: Sun,
    ringStroke: 'text-[#B45309]',
    ringTrack: 'text-[#FEF3C7]',
    iconColor: 'text-[#B45309]',
    defaultPct: 70,
  },
  {
    keys: ['total_heat_loss', 'outward_heat_transfer_kwh'],
    label: 'Outward heat loss',
    fullName: 'Outward Envelope Thermal Energy Transfer',
    unit: 'kWh',
    sub: '24h outward',
    detail: 'Total 24-hour thermal energy escaping through wall, roof, and window assemblies driven by indoor-to-outdoor temperature differential.',
    icon: TrendingDown,
    ringStroke: 'text-[#C2410C]',
    ringTrack: 'text-[#FFEDD5]',
    iconColor: 'text-[#C2410C]',
    defaultPct: 75,
  },
  {
    keys: ['comfort_hours'],
    label: 'Comfort hours',
    fullName: 'Thermal Comfort Duration (16°C – 26°C)',
    unit: '/ 24h',
    sub: '16–26°C range',
    detail: 'Number of hours during the 24-hour cycle where estimated indoor temperature remains within the ASHRAE cold-climate passive thermal comfort range.',
    icon: Clock,
    ringStroke: 'text-[#059669]',
    ringTrack: 'text-[#D1FAE5]',
    iconColor: 'text-[#059669]',
    getPct: (val) => Math.round(((Number(val) || 0) / 24) * 100),
  },
];

export default function SummaryCards({ summary }) {
  if (!summary) return null;

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="grid grid-cols-2 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-6 lg:divide-x divide-slate-200">
        {cardDefs.map(({ keys, label, fullName, unit, sub, detail, icon: Icon, ringStroke, ringTrack, iconColor, defaultPct, getPct }, idx) => {
          let val = null;
          for (const k of keys) {
            if (summary[k] !== undefined && summary[k] !== null) {
              val = summary[k];
              break;
            }
          }

          const pct = getPct ? getPct(val) : defaultPct;

          return (
            <div key={label} className="group relative flex items-center gap-3 p-3.5 sm:p-4 hover:bg-[#F0F7FF]/50 transition-colors cursor-pointer">
              {/* Circular Progress Ring Icon */}
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className={ringTrack}
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={ringStroke}
                    strokeDasharray={`${pct}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>

              {/* Text Column */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-500 truncate">{label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-extrabold tabular-nums text-slate-900 leading-tight">
                    {val != null ? val : '—'}
                  </span>
                  <span className="text-xs font-medium text-slate-600">{unit}</span>
                </div>
                <p className="text-[10px] font-medium text-slate-400 truncate">{sub}</p>
              </div>

              {/* Animated Big Hover Detail Card */}
              <div
                className={`absolute top-full z-50 mt-2 w-72 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur-md opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200 ease-out ${
                  idx === 0
                    ? 'left-0'
                    : idx === cardDefs.length - 1
                    ? 'right-0'
                    : 'left-1/2 -translate-x-1/2'
                }`}
              >
                {/* Arrow indicator */}
                <div
                  className={`absolute -top-2 h-4 w-4 rotate-45 border-l border-t border-slate-200 bg-white ${
                    idx === 0
                      ? 'left-8'
                      : idx === cardDefs.length - 1
                      ? 'right-8'
                      : 'left-1/2 -translate-x-1/2'
                  }`}
                />

                <div className="relative z-10 space-y-2.5">
                  {/* Header with Full Name */}
                  <div className="flex items-start gap-2.5 border-b border-slate-100 pb-2.5">
                    <div className="p-2 rounded-xl bg-[#F0F7FF] border border-[#C1E7FF] shrink-0">
                      <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{fullName}</h4>
                      <span className="text-[10px] font-semibold text-[#0284C7]">{sub}</span>
                    </div>
                  </div>

                  {/* Calculated Value Highlight */}
                  <div className="flex items-baseline justify-between bg-[#F0F7FF]/60 px-3 py-2 rounded-xl border border-[#B9E2FE]/60">
                    <span className="text-[11px] font-semibold text-slate-600">Calculated Value:</span>
                    <span className="text-base font-extrabold text-slate-900 tabular-nums">
                      {val != null ? val : '—'} <span className="text-xs font-semibold text-slate-700">{unit}</span>
                    </span>
                  </div>

                  {/* Short Engineering Detail */}
                  <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                    {detail}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

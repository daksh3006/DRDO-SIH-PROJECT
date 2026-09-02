import { Sun, ArrowDown, ArrowUp } from 'lucide-react';

export default function ShelterDiagram({ results, params }) {
  const indoor =
    results?.summary?.average_temperature != null
      ? results.summary.average_temperature
      : (results?.summary?.average_temp != null ? results.summary.average_temp : (params?.initial_temperature ?? '—'));

  const solarTotal = results?.summary?.total_solar_gain ?? results?.summary?.total_solar_gain_kwh;
  const lossTotal = results?.summary?.total_heat_loss ?? results?.summary?.outward_heat_transfer_kwh;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-800">
        Conceptual Energy Flow
      </h3>

      <div className="relative mx-auto aspect-[4/3] max-w-[320px]">
        {/* Sun */}
        <div className="absolute right-2 top-0 flex flex-col items-center">
          <Sun className="h-8 w-8 text-[#D97706]" />
          <span className="mt-0.5 text-[9px] font-semibold text-[#B45309]">Solar</span>
        </div>

        {/* Solar rays */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 320 240"
          fill="none"
        >
          {/* Sun rays into window */}
          <line
            x1="270"
            y1="30"
            x2="200"
            y2="110"
            stroke="#d97706"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.8"
          />
          <line
            x1="280"
            y1="40"
            x2="210"
            y2="115"
            stroke="#d97706"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.6"
          />

          {/* Shelter outline */}
          {/* Floor */}
          <polygon
            points="60,180 160,210 260,180 160,150"
            fill="#f1f5f9"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          {/* Left wall */}
          <polygon
            points="60,180 60,100 160,70 160,150"
            fill="#e2e8f0"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          {/* Right wall */}
          <polygon
            points="160,150 160,70 260,100 260,180"
            fill="#f8fafc"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          {/* Roof */}
          <polygon
            points="60,100 160,70 260,100 160,55"
            fill="#c1e7ff"
            stroke="#0284c7"
            strokeWidth="1.5"
          />
          {/* Window on right face */}
          <rect
            x="190"
            y="110"
            width="40"
            height="30"
            fill="#d6f5ff"
            fillOpacity="0.8"
            stroke="#0284c7"
            strokeWidth="1.5"
          />

          {/* Heat loss arrows */}
          <path
            d="M140 65 L140 40"
            stroke="#e11d48"
            strokeWidth="2"
            markerEnd="url(#arrowRed)"
          />
          <path
            d="M180 65 L180 40"
            stroke="#e11d48"
            strokeWidth="2"
            markerEnd="url(#arrowRed)"
          />

          {/* Markers */}
          <defs>
            <marker
              id="arrowRed"
              markerWidth="6"
              markerHeight="6"
              refX="3"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L6,3 L0,6 Z" fill="#e11d48" />
            </marker>
          </defs>
        </svg>

        {/* Indoor temp label */}
        <div className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 text-center bg-white/90 px-3 py-1 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-semibold text-slate-500">Indoor</p>
          <p className="text-lg font-bold tabular-nums text-[#0284C7]">
            {indoor}
            <span className="text-xs font-semibold text-slate-600">°C</span>
          </p>
        </div>

        {/* Legend labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[10px] font-bold">
          <div className="flex items-center gap-1 text-[#B45309]">
            <ArrowDown className="h-3.5 w-3.5" />
            <span>
              Solar{solarTotal != null ? `: ${solarTotal}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-1 text-rose-700">
            <ArrowUp className="h-3.5 w-3.5" />
            <span>
              Loss{lossTotal != null ? `: ${lossTotal}` : ''}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-2 text-center text-[10px] font-medium text-slate-500">
        Conceptual diagram — shows solar absorption and envelope loss paths.
      </p>
    </div>
  );
}

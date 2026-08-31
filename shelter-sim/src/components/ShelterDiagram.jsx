import { Sun, ArrowDown, ArrowUp } from 'lucide-react';

export default function ShelterDiagram({ results, params }) {
  const indoor =
    results?.summary?.average_temperature != null
      ? results.summary.average_temperature
      : params?.initial_temperature ?? '—';

  const solarTotal = results?.summary?.total_solar_gain;
  const lossTotal = results?.summary?.total_heat_loss;

  return (
    <div className="rounded-lg border border-slate-700/80 bg-slate-900/60 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-300">
        Conceptual Energy Flow
      </h3>

      <div className="relative mx-auto aspect-[4/3] max-w-[320px]">
        {/* Sun */}
        <div className="absolute right-2 top-0 flex flex-col items-center">
          <Sun className="h-8 w-8 text-yellow-400" />
          <span className="mt-0.5 text-[9px] text-yellow-500/80">Solar</span>
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
            stroke="#eab308"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.7"
          />
          <line
            x1="280"
            y1="40"
            x2="210"
            y2="115"
            stroke="#eab308"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.5"
          />

          {/* Shelter outline - simple isometric-ish box */}
          {/* Floor */}
          <polygon
            points="60,180 160,210 260,180 160,150"
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="1.5"
          />
          {/* Left wall */}
          <polygon
            points="60,180 60,100 160,70 160,150"
            fill="#0f172a"
            stroke="#475569"
            strokeWidth="1.5"
          />
          {/* Right wall */}
          <polygon
            points="160,150 160,70 260,100 260,180"
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="1.5"
          />
          {/* Roof */}
          <polygon
            points="60,100 160,70 260,100 160,55"
            fill="#334155"
            stroke="#64748b"
            strokeWidth="1.5"
          />
          {/* Window on right face */}
          <rect
            x="190"
            y="110"
            width="40"
            height="30"
            fill="#0ea5e9"
            fillOpacity="0.25"
            stroke="#38bdf8"
            strokeWidth="1"
          />

          {/* Heat loss arrows (up through roof) */}
          <path
            d="M140 65 L140 40"
            stroke="#f43f5e"
            strokeWidth="1.5"
            markerEnd="url(#arrowRed)"
          />
          <path
            d="M180 65 L180 40"
            stroke="#f43f5e"
            strokeWidth="1.5"
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
              <path d="M0,0 L6,3 L0,6 Z" fill="#f43f5e" />
            </marker>
          </defs>
        </svg>

        {/* Indoor temp label */}
        <div className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="text-[10px] text-slate-400">Indoor</p>
          <p className="text-lg font-bold tabular-nums text-cyan-300">
            {indoor}
            <span className="text-xs font-normal text-slate-400">°C</span>
          </p>
        </div>

        {/* Legend labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[9px]">
          <div className="flex items-center gap-1 text-yellow-400/90">
            <ArrowDown className="h-3 w-3" />
            <span>
              Solar{solarTotal != null ? `: ${solarTotal}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-1 text-rose-400/90">
            <ArrowUp className="h-3 w-3" />
            <span>
              Loss{lossTotal != null ? `: ${lossTotal}` : ''}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-2 text-center text-[10px] text-slate-500">
        Conceptual diagram — not a CAD model. Shows primary heat paths.
      </p>
    </div>
  );
}

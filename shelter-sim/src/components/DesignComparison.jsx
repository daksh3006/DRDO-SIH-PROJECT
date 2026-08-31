import { Trophy, Plus, Trash2 } from 'lucide-react';
import { WALL_MATERIALS, ROOF_MATERIALS } from '../data/materials';

export default function DesignComparison({
  designs,
  onAddCurrent,
  onRemove,
  currentParams,
  hasResults,
}) {
  const bestIdx =
    designs.length > 0
      ? designs.reduce(
          (best, d, i, arr) =>
            (d.summary?.comfort_hours ?? 0) >
            (arr[best].summary?.comfort_hours ?? 0)
              ? i
              : best,
          0
        )
      : -1;

  return (
    <div className="rounded-lg border border-slate-700/80 bg-slate-900/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Design & Material Comparison
        </h3>
        <button
          type="button"
          onClick={onAddCurrent}
          disabled={!hasResults}
          className="inline-flex items-center gap-1 rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-40"
        >
          <Plus className="h-3 w-3" />
          Save Current Design
        </button>
      </div>

      {designs.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">
          Run a simulation and click “Save Current Design” to compare
          configurations (e.g. brick vs composite walls).
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="pb-2 pr-3 font-medium">Design</th>
                <th className="pb-2 pr-3 font-medium">Wall</th>
                <th className="pb-2 pr-3 font-medium">Roof</th>
                <th className="pb-2 pr-3 font-medium">Avg °C</th>
                <th className="pb-2 pr-3 font-medium">Min °C</th>
                <th className="pb-2 pr-3 font-medium">Max °C</th>
                <th className="pb-2 pr-3 font-medium">Solar</th>
                <th className="pb-2 pr-3 font-medium">Loss</th>
                <th className="pb-2 pr-3 font-medium">Comfort h</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {designs.map((d, i) => {
                const isBest = i === bestIdx && designs.length > 1;
                const wallName =
                  WALL_MATERIALS[d.params.wall_material]?.name ||
                  d.params.wall_material;
                const roofName =
                  ROOF_MATERIALS[d.params.roof_material]?.name ||
                  d.params.roof_material;
                return (
                  <tr
                    key={d.id}
                    className={`border-b border-slate-800 ${
                      isBest ? 'bg-emerald-500/10' : ''
                    }`}
                  >
                    <td className="py-2.5 pr-3 font-medium text-slate-200">
                      <span className="inline-flex items-center gap-1">
                        {d.label}
                        {isBest && (
                          <Trophy className="h-3.5 w-3.5 text-amber-400" />
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-400">{wallName}</td>
                    <td className="py-2.5 pr-3 text-slate-400">{roofName}</td>
                    <td className="py-2.5 pr-3 tabular-nums text-slate-200">
                      {d.summary?.average_temperature ?? '—'}
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums text-slate-200">
                      {d.summary?.minimum_temperature ?? '—'}
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums text-slate-200">
                      {d.summary?.maximum_temperature ?? '—'}
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums text-slate-400">
                      {d.summary?.total_solar_gain ?? '—'}
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums text-slate-400">
                      {d.summary?.total_heat_loss ?? '—'}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`font-semibold tabular-nums ${
                          isBest ? 'text-emerald-400' : 'text-slate-200'
                        }`}
                      >
                        {d.summary?.comfort_hours ?? '—'}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <button
                        type="button"
                        onClick={() => onRemove(d.id)}
                        className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-rose-400"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {designs.length > 1 && (
        <p className="mt-2 text-[10px] text-slate-500">
          Best design highlighted by highest comfort hours (16–26 °C).
        </p>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Trophy, Plus, Trash2, SlidersHorizontal, Info } from 'lucide-react';
import { WALL_MATERIALS, ROOF_MATERIALS } from '../data/materials';

const PRESETS = {
  cold: {
    label: 'Cold Climate Priority',
    weights: { comfort: 0.30, minTemp: 0.40, stability: 0.10, energyLoss: 0.20 },
  },
  stability: {
    label: 'Thermal Stability Priority',
    weights: { comfort: 0.30, minTemp: 0.20, stability: 0.40, energyLoss: 0.10 },
  },
  equal: {
    label: 'Equal Weights',
    weights: { comfort: 0.25, minTemp: 0.25, stability: 0.25, energyLoss: 0.25 },
  },
};

function computeSubScores(s) {
  if (!s) return { comfortScore: 0, minTempScore: 0, stabilityScore: 0, lossScore: 0 };
  const comfortHours = s.comfort_hours ?? 0;
  const minTemp = s.minimum_temperature ?? s.min_temp ?? 0;
  const maxTemp = s.maximum_temperature ?? s.max_temp ?? 0;
  const tempSwing = Math.max(0, maxTemp - minTemp);
  const heatLoss = s.outward_heat_transfer_kwh ?? s.total_heat_loss ?? 0;

  const comfortScore = Math.min(100, Math.round((comfortHours / 24.0) * 100));
  const minTempScore = Math.min(100, Math.max(0, Math.round(((minTemp + 10.0) / 26.0) * 100)));
  const stabilityScore = Math.min(100, Math.max(0, Math.round((1.0 - tempSwing / 25.0) * 100)));
  const lossScore = Math.min(100, Math.max(0, Math.round((1.0 - heatLoss / 500.0) * 100)));

  return { comfortScore, minTempScore, stabilityScore, lossScore };
}

function computeWeightedScore(s, weights) {
  const { comfortScore, minTempScore, stabilityScore, lossScore } = computeSubScores(s);
  const totalWeight =
    (weights.comfort || 0) +
    (weights.minTemp || 0) +
    (weights.stability || 0) +
    (weights.energyLoss || 0);

  if (totalWeight <= 0) return 0;

  const weightedSum =
    comfortScore * weights.comfort +
    minTempScore * weights.minTemp +
    stabilityScore * weights.stability +
    lossScore * weights.energyLoss;

  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

export default function DesignComparison({
  designs,
  onAddCurrent,
  onRemove,
  hasResults,
}) {
  const [weights, setWeights] = useState(PRESETS.cold.weights);
  const [showWeightControls, setShowWeightControls] = useState(false);

  const applyPreset = (key) => {
    if (PRESETS[key]) {
      setWeights(PRESETS[key].weights);
    }
  };

  const handleWeightChange = (field, val) => {
    const n = Math.max(0, Math.min(100, parseInt(val || '0', 10))) / 100;
    setWeights((prev) => ({ ...prev, [field]: n }));
  };

  const scores = designs.map((d) => computeWeightedScore(d.summary, weights));
  const bestIdx =
    designs.length > 0
      ? scores.reduce((best, s, i, arr) => (s > arr[best] ? i : best), 0)
      : -1;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      {/* Header */}
      <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Weighted Engineering Score & Design Comparison
            </h3>
            <span className="rounded-md bg-[#C1E7FF]/60 px-2 py-0.5 text-[10px] font-bold text-[#0369A1] border border-[#7DD3FC]">
              Configurable Weights
            </span>
          </div>
          <p className="text-[10px] font-medium text-slate-600">
            Multi-criteria weighted evaluation of comfort hours, minimum temperature, thermal stability & heat loss reduction.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowWeightControls((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-[#D6F5FF] transition-all shadow-2xs"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#0284C7]" />
            Configure Weights
          </button>

          <button
            type="button"
            onClick={onAddCurrent}
            disabled={!hasResults}
            className="inline-flex items-center gap-1 rounded-lg bg-[#0284C7] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#0369A1] disabled:opacity-40 transition-all shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Save Current Design
          </button>
        </div>
      </div>

      {/* Configurable Weight Controls */}
      {showWeightControls && (
        <div className="mb-4 rounded-xl border border-[#90CDF4] bg-[#F0F7FF] p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#C1E7FF] pb-2">
            <span className="text-xs font-bold text-slate-800">Weighting Criteria Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(PRESETS).map(([key, p]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  className="rounded-lg border border-[#BAE6FD] bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-[#C1E7FF] hover:text-[#0369A1] transition-all"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs font-semibold text-slate-700">
            <div>
              <label className="block text-[10px] font-bold text-slate-600">Comfort Hours (16–26°C)</label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round((weights.comfort || 0) * 100)}
                  onChange={(e) => handleWeightChange('comfort', e.target.value)}
                  className="w-full accent-[#0284C7]"
                />
                <span className="w-8 font-mono text-[10px] font-bold text-[#0284C7]">
                  {Math.round((weights.comfort || 0) * 100)}%
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600">Min Temp Maintenance</label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round((weights.minTemp || 0) * 100)}
                  onChange={(e) => handleWeightChange('minTemp', e.target.value)}
                  className="w-full accent-[#0284C7]"
                />
                <span className="w-8 font-mono text-[10px] font-bold text-[#0284C7]">
                  {Math.round((weights.minTemp || 0) * 100)}%
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600">Thermal Stability</label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round((weights.stability || 0) * 100)}
                  onChange={(e) => handleWeightChange('stability', e.target.value)}
                  className="w-full accent-[#0284C7]"
                />
                <span className="w-8 font-mono text-[10px] font-bold text-[#0284C7]">
                  {Math.round((weights.stability || 0) * 100)}%
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600">Heat Loss Reduction</label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round((weights.energyLoss || 0) * 100)}
                  onChange={(e) => handleWeightChange('energyLoss', e.target.value)}
                  className="w-full accent-[#0284C7]"
                />
                <span className="w-8 font-mono text-[10px] font-bold text-[#0284C7]">
                  {Math.round((weights.energyLoss || 0) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      {designs.length === 0 ? (
        <p className="py-6 text-center text-xs font-medium text-slate-500">
          Run a simulation and click “Save Current Design” to compare alternative shelter configurations.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-600 font-bold bg-[#F0F7FF]">
                <th className="py-2.5 px-3 font-bold">Design</th>
                <th className="py-2.5 px-3 font-bold">Wall</th>
                <th className="py-2.5 px-3 font-bold">Roof</th>
                <th className="py-2.5 px-3 font-bold">Min °C</th>
                <th className="py-2.5 px-3 font-bold">Outward Loss</th>
                <th className="py-2.5 px-3 font-bold">Comfort h</th>
                <th className="py-2.5 px-3 font-bold text-slate-500">S_comfort</th>
                <th className="py-2.5 px-3 font-bold text-slate-500">S_min</th>
                <th className="py-2.5 px-3 font-bold text-slate-500">S_stab</th>
                <th className="py-2.5 px-3 font-bold text-slate-500">S_loss</th>
                <th className="py-2.5 px-3 font-bold">Score</th>
                <th className="py-2.5 px-3 font-bold"></th>
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
                const sub = computeSubScores(d.summary);
                const score = scores[i];

                return (
                  <tr
                    key={d.id}
                    className={`border-b border-slate-100 transition-colors ${
                      isBest ? 'bg-[#FED8A7]/30 font-semibold' : 'hover:bg-[#D6F5FF]/30 font-medium'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      <span className="inline-flex items-center gap-1.5">
                        {d.label}
                        {isBest && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#FED8A7] px-1.5 py-0.5 text-[10px] font-bold text-amber-950 border border-[#FDBA74]">
                            <Trophy className="h-3 w-3 text-amber-700" /> Best
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{wallName}</td>
                    <td className="py-2.5 px-3 text-slate-700">{roofName}</td>
                    <td className="py-2.5 px-3 tabular-nums text-slate-800">
                      {d.summary?.minimum_temperature ?? d.summary?.min_temp ?? '—'}°C
                    </td>
                    <td className="py-2.5 px-3 tabular-nums text-slate-700 font-semibold">
                      {d.summary?.outward_heat_transfer_kwh ?? d.summary?.total_heat_loss ?? '—'} kWh
                    </td>
                    <td className="py-2.5 px-3 font-bold tabular-nums text-emerald-700">
                      {d.summary?.comfort_hours ?? 0}/24h
                    </td>
                    <td className="py-2.5 px-3 tabular-nums text-slate-500 font-mono text-[10px]">
                      {sub.comfortScore}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums text-slate-500 font-mono text-[10px]">
                      {sub.minTempScore}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums text-slate-500 font-mono text-[10px]">
                      {sub.stabilityScore}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums text-slate-500 font-mono text-[10px]">
                      {sub.lossScore}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-bold tabular-nums text-sm ${
                          isBest ? 'text-amber-900 font-extrabold' : 'text-[#0284C7]'
                        }`}
                      >
                        {score}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() => onRemove(d.id)}
                        className="rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-700 transition-colors"
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

      <p className="mt-3 text-[10px] font-medium text-slate-500 leading-relaxed flex items-center gap-1">
        <Info className="h-3.5 w-3.5 shrink-0 text-[#0284C7]" />
        Sub-scores (S_comfort, S_min, S_stab, S_loss) are normalized 0–100 metrics. Final Weighted Engineering Score = ∑ (Weight_i × S_i).
      </p>
    </div>
  );
}

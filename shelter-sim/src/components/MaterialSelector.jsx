import { WALL_MATERIALS, ROOF_MATERIALS, getMaterialR } from '../data/materials';

function MaterialCard({ label, materials, value, thickness, onChange }) {
  const mat = materials[value];
  const rValue = mat ? getMaterialR(mat, thickness) : null;

  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
      >
        {Object.values(materials).map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      {mat && (
        <div className="rounded-md border border-slate-700/80 bg-slate-900/60 p-2.5 text-[11px] leading-relaxed text-slate-400">
          <p className="mb-1.5 text-slate-300">{mat.description}</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <span>k = {mat.conductivity} W/m·K</span>
            <span>ρ = {mat.density} kg/m³</span>
            <span>c = {mat.specific_heat} J/kg·K</span>
            {rValue && <span className="text-cyan-400">R ≈ {rValue} m²K/W</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MaterialSelector({
  wallMaterial,
  roofMaterial,
  wallThickness,
  roofThickness,
  onWallChange,
  onRoofChange,
}) {
  return (
    <div className="space-y-4">
      <MaterialCard
        label="Wall Material"
        materials={WALL_MATERIALS}
        value={wallMaterial}
        thickness={wallThickness}
        onChange={onWallChange}
      />
      <MaterialCard
        label="Roof Material"
        materials={ROOF_MATERIALS}
        value={roofMaterial}
        thickness={roofThickness}
        onChange={onRoofChange}
      />
    </div>
  );
}

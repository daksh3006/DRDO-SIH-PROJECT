import { MapPin, Box, Layers, Thermometer, ChevronDown } from 'lucide-react';
import MaterialSelector from './MaterialSelector';
import { DEFAULT_PARAMS } from '../data/materials';

function Section({ icon: Icon, title, children, defaultOpen = true }) {
  return (
    <details open={defaultOpen} className="group border-b border-slate-700/60">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:bg-slate-800/50">
        <Icon className="h-3.5 w-3.5 text-cyan-400" />
        <span className="flex-1">{title}</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-500 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 px-3 pb-4 pt-1">{children}</div>
    </details>
  );
}

function NumberInput({ label, value, onChange, unit, step = 1, min, max }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-slate-400">
        {label}
        {unit && <span className="ml-1 text-slate-500">({unit})</span>}
      </label>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
      />
    </div>
  );
}

export default function Sidebar({ params, onChange }) {
  const set = (key) => (val) => onChange({ ...params, [key]: val });

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-r border-slate-700/80 bg-slate-900/80">
      <div className="sticky top-0 z-10 border-b border-slate-700/60 bg-slate-900 px-3 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Simulation Inputs
        </h2>
      </div>

      <Section icon={MapPin} title="Location" defaultOpen>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-slate-400">
            Site
          </label>
          <input
            type="text"
            value={params.location}
            onChange={(e) => set('location')(e.target.value)}
            placeholder="e.g. Leh, Ladakh"
            className="w-full rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Latitude"
            value={params.latitude}
            onChange={set('latitude')}
            step={0.0001}
          />
          <NumberInput
            label="Longitude"
            value={params.longitude}
            onChange={set('longitude')}
            step={0.0001}
          />
        </div>
        <p className="text-[10px] text-slate-500">
          Climate data will be resolved from location by backend (WEATHER module).
        </p>
      </Section>

      <Section icon={Box} title="Shelter Geometry" defaultOpen>
        <NumberInput
          label="Wall Area"
          value={params.wall_area}
          onChange={set('wall_area')}
          unit="m²"
          min={1}
        />
        <NumberInput
          label="Roof Area"
          value={params.roof_area}
          onChange={set('roof_area')}
          unit="m²"
          min={1}
        />
        <NumberInput
          label="Window / Opening Area"
          value={params.window_area}
          onChange={set('window_area')}
          unit="m²"
          min={0}
          step={0.5}
        />
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Wall Thickness"
            value={params.wall_thickness}
            onChange={set('wall_thickness')}
            unit="m"
            step={0.05}
            min={0.05}
          />
          <NumberInput
            label="Roof Thickness"
            value={params.roof_thickness}
            onChange={set('roof_thickness')}
            unit="m"
            step={0.05}
            min={0.05}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-slate-400">
            Orientation
          </label>
          <select
            value={params.orientation}
            onChange={(e) => set('orientation')(e.target.value)}
            className="w-full rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {['South', 'North', 'East', 'West', 'South-East', 'South-West'].map(
              (o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              )
            )}
          </select>
        </div>
      </Section>

      <Section icon={Layers} title="Materials" defaultOpen>
        <MaterialSelector
          wallMaterial={params.wall_material}
          roofMaterial={params.roof_material}
          wallThickness={params.wall_thickness}
          roofThickness={params.roof_thickness}
          onWallChange={set('wall_material')}
          onRoofChange={set('roof_material')}
        />
      </Section>

      <Section icon={Thermometer} title="Thermal Parameters" defaultOpen>
        <NumberInput
          label="Initial Indoor Temperature"
          value={params.initial_temperature}
          onChange={set('initial_temperature')}
          unit="°C"
          step={0.5}
        />
        <NumberInput
          label="Thermal Capacity / Mass"
          value={params.thermal_capacity}
          onChange={set('thermal_capacity')}
          unit="J/K"
          step={10000}
          min={10000}
        />
        <p className="text-[10px] text-slate-500">
          Higher thermal mass stabilizes indoor temperature against diurnal swings.
        </p>
      </Section>

      <div className="mt-auto border-t border-slate-700/60 p-3 text-[10px] text-slate-500">
        Parameters map directly to{' '}
        <code className="text-cyan-500/80">simulate_shelter(...)</code>
      </div>
    </aside>
  );
}

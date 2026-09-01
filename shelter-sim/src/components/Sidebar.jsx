import { MapPin, Box, Layers, Thermometer, ChevronDown } from 'lucide-react';
import MaterialSelector from './MaterialSelector';
import { estimateThermalCapacity } from '../data/materials';

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
        value={value === null || value === undefined ? '' : value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '' || raw === '-' || raw === '.' || raw === '-.') {
            onChange(raw === '' ? '' : raw);
            return;
          }
          const num = parseFloat(raw);
          if (!Number.isNaN(num)) {
            onChange(num);
          }
        }}
        className="w-full rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
      />
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-slate-400">
        {label}
      </label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
      />
    </div>
  );
}

function formatCapacity(c) {
  if (c >= 1_000_000) return `${(c / 1_000_000).toFixed(2)} MJ/K`;
  if (c >= 1_000) return `${Math.round(c / 1_000)} kJ/K`;
  return `${c} J/K`;
}

export default function Sidebar({ params, onChange, weatherInfo }) {
  const set = (key) => (val) => onChange({ ...params, [key]: val });

  const updateLocation = (city, state) => {
    const name = [city, state].filter(Boolean).join(', ');
    onChange({
      ...params,
      city,
      state,
      location: name || params.location,
    });
  };

  // Live thermal capacity from current geometry + materials
  const thermalCapacity = estimateThermalCapacity(params);

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-r border-slate-700/80 bg-slate-900/80">
      <div className="sticky top-0 z-10 border-b border-slate-700/60 bg-slate-900 px-3 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Simulation Inputs
        </h2>
      </div>

      {/* ========== LOCATION ========== */}
      <Section icon={MapPin} title="Location" defaultOpen>
        <TextInput
          label="City"
          value={params.city || ''}
          onChange={(v) => updateLocation(v, params.state)}
          placeholder="e.g. Leh"
        />
        <TextInput
          label="State / UT"
          value={params.state || ''}
          onChange={(v) => updateLocation(params.city, v)}
          placeholder="e.g. Ladakh"
        />

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

        <p className="text-[10px] leading-relaxed text-slate-500">
          Weather is fetched automatically for <strong className="text-slate-400">today</strong> at
          these coordinates (Open-Meteo). Ambient temperature cannot be edited.
        </p>

        {weatherInfo && (
          <div className="rounded-md border border-cyan-500/30 bg-cyan-500/5 p-2.5 text-[11px]">
            <p className="mb-1.5 font-medium text-cyan-300">
              Today&apos;s Ambient Weather (read-only)
            </p>
            <div className="grid grid-cols-3 gap-1 text-slate-300">
              <div>
                <span className="text-slate-500">Min</span>
                <br />
                {weatherInfo.ambient_min}°C
              </div>
              <div>
                <span className="text-slate-500">Avg</span>
                <br />
                {weatherInfo.ambient_avg}°C
              </div>
              <div>
                <span className="text-slate-500">Max</span>
                <br />
                {weatherInfo.ambient_max}°C
              </div>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500">
              Source: {weatherInfo.source}
            </p>
          </div>
        )}
      </Section>

      {/* ========== GEOMETRY ========== */}
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

      {/* ========== MATERIALS ========== */}
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

      {/* ========== COMFORT + AUTO THERMAL MASS ========== */}
      <Section icon={Thermometer} title="Comfort & Thermal Mass" defaultOpen>
        <NumberInput
          label="Your Comfortable Temperature"
          value={params.comfort_temperature}
          onChange={set('comfort_temperature')}
          unit="°C"
          step={0.5}
          min={10}
          max={40}
        />
        <p className="text-[10px] text-slate-500">
          Starting indoor temperature for the simulation (default 30°C).
        </p>

        {/* Auto-calculated thermal capacity — updates live */}
        <div className="rounded-md border border-slate-600 bg-slate-800/80 px-2.5 py-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">
              Thermal Capacity / Mass
            </span>
            <span className="text-[10px] text-cyan-400/80">auto</span>
          </div>
          <p className="mt-1 text-sm font-semibold tabular-nums text-slate-100">
            {formatCapacity(thermalCapacity)}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">
            {thermalCapacity.toLocaleString()} J/K
          </p>
          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
            Calculated from wall &amp; roof materials, areas and thicknesses.
            Higher mass → more stable indoor temperature.
          </p>
        </div>
      </Section>

      <div className="mt-auto border-t border-slate-700/60 p-3 text-[10px] text-slate-500">
        Weather is fetched live for today from Open-Meteo. Thermal mass is
        estimated automatically from your design.
      </div>
    </aside>
  );
}

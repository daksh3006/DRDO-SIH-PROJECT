import { useEffect, useRef, useState } from 'react';
import { MapPin, Box, Layers, Thermometer, ChevronDown, Loader2 } from 'lucide-react';
import MaterialSelector from './MaterialSelector';
import { estimateThermalCapacity, estimateThermalCapacityBreakdown } from '../data/materials';
import { reverseGeocode } from '../services/api';

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
          if (!Number.isNaN(num)) onChange(num);
        }}
        className="w-full rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
      />
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, readOnly = false }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-slate-400">
        {label}
      </label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(e) => onChange && onChange(e.target.value)}
        className={`w-full rounded-md border border-slate-600 px-2.5 py-1.5 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
          readOnly
            ? 'bg-slate-900/80 text-slate-300 cursor-default'
            : 'bg-slate-800 text-slate-100'
        }`}
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
  const [geoLoading, setGeoLoading] = useState(false);
  const [placeName, setPlaceName] = useState(params.location || '');
  const geoTimer = useRef(null);
  const lastGeo = useRef('');

  // Reverse-geocode when latitude / longitude change (debounced)
  useEffect(() => {
    const lat = Number(params.latitude);
    const lon = Number(params.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return;

    const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    if (key === lastGeo.current) return;

    if (geoTimer.current) clearTimeout(geoTimer.current);
    geoTimer.current = setTimeout(async () => {
      setGeoLoading(true);
      try {
        const data = await reverseGeocode(lat, lon);
        lastGeo.current = key;
        const city = data.city || '';
        const state = data.state || '';
        const display =
          data.display_name ||
          [city, state, data.country].filter(Boolean).join(', ');
        setPlaceName(display);
        onChange({
          ...params,
          city,
          state,
          location: display,
          latitude: lat,
          longitude: lon,
        });
      } catch {
        // Keep existing labels if geocoding fails
      } finally {
        setGeoLoading(false);
      }
    }, 600);

    return () => {
      if (geoTimer.current) clearTimeout(geoTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.latitude, params.longitude]);

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

        <div>
          <label className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            Detected area
            {geoLoading && (
              <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
            )}
          </label>
          <div className="rounded-md border border-slate-600 bg-slate-900/80 px-2.5 py-1.5 text-sm text-slate-200">
            {placeName || params.location || 'Enter latitude & longitude'}
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            Place name is filled automatically from coordinates (OpenStreetMap).
          </p>
        </div>

        <p className="text-[10px] leading-relaxed text-slate-500">
          Weather is fetched for <strong className="text-slate-400">today</strong> at
          these coordinates. Ambient temperature cannot be edited.
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
          label="Wall Area (gross, incl. openings)"
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

      {/* ========== COMFORT + THERMAL MASS ========== */}
      <Section icon={Thermometer} title="Comfort & Thermal Mass" defaultOpen>
        <NumberInput
          label="Initial Indoor Temperature"
          value={params.initial_temperature}
          onChange={set('initial_temperature')}
          unit="°C"
          step={0.5}
          min={10}
          max={40}
        />
        <p className="text-[10px] text-slate-500">
          Temperature at which the shelter starts. Default 20°C. The graph shows how indoor temperature then drifts.
        </p>

        <div className="rounded-md border border-slate-600 bg-slate-800/80 px-2.5 py-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">
              Envelope thermal capacity (C_env)
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
            C_env = C_walls + C_roof using <strong className="text-slate-400">net</strong> wall
            area (gross − windows). Indoor air capacity is separate in the 2-node model.
          </p>
        </div>
      </Section>

      <div className="mt-auto border-t border-slate-700/60 p-3 text-[10px] text-slate-500">
        Enter lat/lon → area name is detected automatically. Weather is for today.
      </div>
    </aside>
  );
}

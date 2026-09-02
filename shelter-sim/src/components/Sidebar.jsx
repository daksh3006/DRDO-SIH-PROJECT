import { useEffect, useRef, useState } from 'react';
import { MapPin, Box, Layers, ChevronDown, Loader2, AlertCircle, AlertTriangle, Thermometer } from 'lucide-react';
import MaterialSelector from './MaterialSelector';
import { estimateThermalCapacity, estimateThermalCapacityBreakdown, WINDOW_MATERIALS } from '../data/materials';
import { reverseGeocode } from '../services/api';

function Section({ icon: Icon, title, children, defaultOpen = true }) {
  return (
    <details open={defaultOpen} className="group border-b border-[#C1E7FF]/60">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-800 hover:bg-[#D6F5FF]/40 transition-colors">
        <Icon className="h-4 w-4 text-[#0284C7]" />
        <span className="flex-1 text-slate-800">{title}</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-500 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 px-3.5 pb-4 pt-1 bg-white">{children}</div>
    </details>
  );
}

function NumberInput({ label, value, onChange, unit, step = 1, min, max }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-slate-700">
        {label}
        {unit && <span className="ml-1 font-normal text-slate-500">({unit})</span>}
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
        className="w-full rounded-lg border border-[#BAE6FD] bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7] transition-all shadow-2xs font-medium"
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
  const set = (key) => (val) => onChange((prev) => ({ ...prev, [key]: val }));
  const [geoLoading, setGeoLoading] = useState(false);
  const [placeName, setPlaceName] = useState(params.location || '');
  const geoTimer = useRef(null);
  const lastGeo = useRef('');

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

        onChange((prev) => ({
          ...prev,
          city,
          state,
          location: display,
          latitude: lat,
          longitude: lon,
        }));
      } catch {
        // Keep existing labels
      } finally {
        setGeoLoading(false);
      }
    }, 600);

    return () => {
      if (geoTimer.current) clearTimeout(geoTimer.current);
    };
  }, [params.latitude, params.longitude, onChange]);

  const thermalCapacity = estimateThermalCapacity(params);
  const breakdown = estimateThermalCapacityBreakdown(params);

  const grossWall = Number(params.wall_area || 0);
  const winArea = Number(params.window_area || 0);
  const wallThk = Number(params.wall_thickness || 0);
  const roofThickness = Number(params.roof_thickness || 0);

  const windowAreaValid = winArea <= grossWall * 0.85;
  const wallThicknessValid = wallThk >= 0.03 && wallThk <= 1.5;
  const roofThicknessValid = roofThickness >= 0.03 && roofThickness <= 1.5;

  const warnings = [];
  if (!windowAreaValid) {
    warnings.push(`Window area (${winArea} m²) exceeds 85% wall limit (${(grossWall * 0.85).toFixed(1)} m²).`);
  }
  if (wallThk > 0 && wallThk < 0.05 && wallThicknessValid) {
    warnings.push(`Thin wall insulation (${(wallThk * 1000).toFixed(0)} mm) offers low thermal resistance.`);
  }

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-r border-[#C1E7FF] bg-white">
      <div className="sticky top-0 z-10 border-b border-[#C1E7FF] bg-[#F0F7FF] px-3.5 py-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#0369A1]">
          Simulation Inputs
        </h2>
      </div>

      {warnings.length > 0 && (
        <div className="m-3 space-y-1 rounded-xl border border-[#FDBA74] bg-[#FED8A7]/40 p-2.5 text-[11px] text-amber-950 shadow-2xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
            <span>Physical Warnings</span>
          </div>
          {warnings.map((w, idx) => (
            <p key={idx} className="text-[10px] text-amber-900 font-medium leading-tight">
              • {w}
            </p>
          ))}
        </div>
      )}

      {/* ========== LOCATION ========== */}
      <Section icon={MapPin} title="Location" defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Latitude"
            value={params.latitude}
            onChange={set('latitude')}
            step={0.0001}
            min={-90}
            max={90}
          />
          <NumberInput
            label="Longitude"
            value={params.longitude}
            onChange={set('longitude')}
            step={0.0001}
            min={-180}
            max={180}
          />
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
            Detected Area
            {geoLoading && (
              <Loader2 className="h-3 w-3 animate-spin text-[#0284C7]" />
            )}
          </label>
          <div className="rounded-lg border border-[#BAE6FD] bg-[#F0F7FF] px-2.5 py-1.5 text-xs font-medium text-slate-800">
            {placeName || params.location || 'Enter latitude & longitude'}
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            Coordinates reverse-geocoded via OpenStreetMap.
          </p>
        </div>

        {weatherInfo && (
          <div className="rounded-lg border border-[#90CDF4] bg-[#D6F5FF]/40 p-2.5 text-[11px] text-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <p className="font-bold text-[#0369A1]">
                Next 24h Ambient Weather
              </p>
              {weatherInfo.source?.includes('Offline') && (
                <span className="rounded-full bg-[#FED8A7] px-2 py-0.5 text-[9px] font-bold text-amber-900 border border-[#FDBA74]">
                  Demo Mode
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1 text-slate-700 font-semibold">
              <div>
                <span className="text-slate-500 font-normal">Min</span>
                <br />
                {weatherInfo.ambient_min}°C
              </div>
              <div>
                <span className="text-slate-500 font-normal">Avg</span>
                <br />
                {weatherInfo.ambient_avg}°C
              </div>
              <div>
                <span className="text-slate-500 font-normal">Max</span>
                <br />
                {weatherInfo.ambient_max}°C
              </div>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-600 truncate">
              Source: {weatherInfo.source}
            </p>
            {weatherInfo.source?.includes('Offline') && (
              <p className="mt-1 text-[9px] text-amber-900 italic font-medium">
                Offline Reference Dataset — Demo Mode
              </p>
            )}
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
        {!windowAreaValid && (
          <div className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 p-2 text-[11px] text-rose-800 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>Window area cannot exceed 85% of wall area ({(grossWall * 0.85).toFixed(1)} m²).</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Wall Thickness (0.03-1.5m)"
            value={params.wall_thickness}
            onChange={set('wall_thickness')}
            unit="m"
            step={0.01}
            min={0.03}
            max={1.5}
          />
          <NumberInput
            label="Roof Thickness (0.03-1.5m)"
            value={params.roof_thickness}
            onChange={set('roof_thickness')}
            unit="m"
            step={0.01}
            min={0.03}
            max={1.5}
          />
        </div>
        <p className="text-[10px] text-slate-500">Allowed insulation depth: 0.03–1.5 m</p>
        {(!wallThicknessValid || !roofThicknessValid) && (
          <div className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 p-2 text-[11px] text-rose-800 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>Wall and roof thickness must be between 0.03 m and 1.5 m.</span>
          </div>
        )}
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-700">
            Window / Façade Orientation
          </label>
          <select
            value={params.orientation}
            onChange={(e) => set('orientation')(e.target.value)}
            className="w-full rounded-lg border border-[#BAE6FD] bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7] font-medium shadow-2xs"
          >
            {[
              'South',
              'North',
              'East',
              'West',
              'North-East',
              'South-East',
              'South-West',
              'North-West',
            ].map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </Section>

      {/* ========== MATERIALS & GLAZING ========== */}
      <Section icon={Layers} title="Materials & Glazing" defaultOpen>
        <MaterialSelector
          wallMaterial={params.wall_material}
          roofMaterial={params.roof_material}
          wallThickness={params.wall_thickness}
          roofThickness={params.roof_thickness}
          onWallChange={set('wall_material')}
          onRoofChange={set('roof_material')}
        />

        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-700">
            Window Glazing Type
          </label>
          <select
            value={params.window_type || 'double_glazing'}
            onChange={(e) => set('window_type')(e.target.value)}
            className="w-full rounded-lg border border-[#BAE6FD] bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7] font-medium shadow-2xs"
          >
            {Object.entries(WINDOW_MATERIALS).map(([key, item]) => (
              <option key={key} value={key}>
                {item.name} (U={item.u}, g={item.g})
              </option>
            ))}
          </select>
          <p className="mt-1 text-[10px] text-slate-500">
            {WINDOW_MATERIALS[params.window_type || 'double_glazing']?.description}
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-[#C1E7FF]/60">
          <input
            type="checkbox"
            id="spin_up_toggle"
            checked={params.spin_up !== false}
            onChange={(e) => set('spin_up')(e.target.checked)}
            className="rounded border-[#BAE6FD] text-[#0284C7] focus:ring-[#0284C7]"
          />
          <label htmlFor="spin_up_toggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
            72h thermal spin-up equilibrium
          </label>
        </div>
        <p className="text-[10px] text-slate-500">
          Establishes periodic steady-state starting state from climate history.
        </p>

        <div className="rounded-lg border border-[#90CDF4] bg-[#D6F5FF]/40 px-3 py-2.5 text-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#0369A1]">
              Envelope Thermal Capacity (C_env)
            </span>
            <span className="text-[10px] font-bold text-[#0284C7]">auto</span>
          </div>
          <p className="mt-1 text-sm font-bold tabular-nums text-slate-900">
            {formatCapacity(thermalCapacity)}
          </p>
          <div className="mt-1.5 grid grid-cols-2 gap-1 text-[10px] text-slate-600 font-medium">
            <span>Walls: {formatCapacity(breakdown.C_walls)}</span>
            <span>Roof: {formatCapacity(breakdown.C_roof)}</span>
            <span>Air+Contents: {formatCapacity(breakdown.C_air)}</span>
            <span>Volume: {breakdown.volume} m³</span>
          </div>
        </div>
      </Section>

      {/* ========== THERMAL COMFORT RANGE ========== */}
      <Section icon={Thermometer} title="Thermal Comfort Target" defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Min Comfort Temp"
            value={params.comfort_min}
            onChange={set('comfort_min')}
            unit="°C"
            step={0.5}
            min={-20}
            max={40}
          />
          <NumberInput
            label="Max Comfort Temp"
            value={params.comfort_max}
            onChange={set('comfort_max')}
            unit="°C"
            step={0.5}
            min={0}
            max={50}
          />
        </div>
        <p className="text-[10px] text-slate-500">
          Default: 16°C – 26°C (ASHRAE Cold Climate Comfort Standard). Customize if desired.
        </p>
      </Section>
    </aside>
  );
}

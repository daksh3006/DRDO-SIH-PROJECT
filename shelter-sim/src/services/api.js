/**
 * API service layer for Thermal Shelter Simulator
 */

import { estimateThermalCapacity } from '../data/materials';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/** Coerce value to number; empty/invalid → fallback */
function toNum(v, fallback = 0) {
  if (v === '' || v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Run thermal simulation against the backend.
 */
export async function runSimulation(params) {
  const thermalCapacity = estimateThermalCapacity(params);

  const payload = {
    location: params.location || `${params.city || ''}, ${params.state || ''}`.trim(),
    city: params.city || null,
    state: params.state || null,
    latitude: toNum(params.latitude),
    longitude: toNum(params.longitude),
    wall_area: toNum(params.wall_area),
    roof_area: toNum(params.roof_area),
    window_area: toNum(params.window_area),
    wall_thickness: toNum(params.wall_thickness),
    roof_thickness: toNum(params.roof_thickness),

    wall_material: params.wall_material,
    roof_material: params.roof_material,

    thermal_capacity: thermalCapacity,
    initial_temperature: toNum(params.comfort_temperature, 30),

    orientation: params.orientation || 'South',
  };

  if (Number.isNaN(payload.latitude) || Number.isNaN(payload.longitude)) {
    throw new Error(
      'Latitude and Longitude are required and must be valid numbers.'
    );
  }

  const response = await fetch(`${API_BASE_URL}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detail = 'Unknown error';
    try {
      const errBody = await response.json();
      detail = errBody.detail || JSON.stringify(errBody);
    } catch {
      detail = await response.text().catch(() => 'Unknown error');
    }
    throw new Error(`Simulation failed (${response.status}): ${detail}`);
  }

  return response.json();
}

export async function checkBackendStatus() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Offline mock (only used when backend is down)
 */
export function generateMockResults(params) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const thermalCapacity = estimateThermalCapacity(params);

  const ambient = hours.map((h) => {
    const base = -2;
    const amplitude = 12;
    return +(
      base + amplitude * Math.sin(((h - 6) / 24) * 2 * Math.PI)
    ).toFixed(1);
  });

  const kWall =
    params.wall_material === 'insulated_panel' ||
    params.wall_material === 'composite'
      ? 0.15
      : 0.45;
  const kRoof =
    params.roof_material === 'insulated_panel' ||
    params.roof_material === 'composite'
      ? 0.12
      : 0.5;
  const thermalInertia = Math.min(0.85, thermalCapacity / 250000);

  const comfortTemp = toNum(params.comfort_temperature, 30);
  let indoor = comfortTemp;
  const indoorTemps = [];
  const solarGains = [];
  const heatLosses = [];
  const comfortStatus = [];

  hours.forEach((h) => {
    const solar =
      h >= 7 && h <= 17
        ? Math.max(0, 650 * Math.sin(((h - 7) / 10) * Math.PI))
        : 0;
    const solarGain = +(
      (solar * (params.window_area || 10) * 0.55) /
      1000
    ).toFixed(2);

    const deltaT = indoor - ambient[h];
    const loss = +(
      ((kWall * (params.wall_area || 100)) / (params.wall_thickness || 0.3) +
        (kRoof * (params.roof_area || 80)) / (params.roof_thickness || 0.2) +
        5.5 * (params.window_area || 10)) *
      Math.abs(deltaT) /
      1000
    ).toFixed(2);

    const net = solarGain * 0.8 - (deltaT > 0 ? loss : -loss * 0.4);
    indoor = indoor + net * (1 - thermalInertia) * 0.35;
    indoor = Math.max(ambient[h] - 2, Math.min(ambient[h] + 18, indoor));

    indoorTemps.push(+indoor.toFixed(1));
    solarGains.push(solarGain);
    heatLosses.push(loss);

    if (indoor >= 16 && indoor <= 26) comfortStatus.push('comfortable');
    else if (indoor < 16) comfortStatus.push('too_cold');
    else comfortStatus.push('too_hot');
  });

  const avg = indoorTemps.reduce((a, b) => a + b, 0) / 24;
  const ambAvg = ambient.reduce((a, b) => a + b, 0) / 24;

  return {
    hours,
    ambient_temperature: ambient,
    indoor_temperature: indoorTemps,
    solar_gain: solarGains,
    heat_loss: heatLosses,
    comfort_status: comfortStatus,
    summary: {
      average_temperature: +avg.toFixed(1),
      minimum_temperature: +Math.min(...indoorTemps).toFixed(1),
      maximum_temperature: +Math.max(...indoorTemps).toFixed(1),
      total_solar_gain: +solarGains.reduce((a, b) => a + b, 0).toFixed(1),
      total_heat_loss: +heatLosses.reduce((a, b) => a + b, 0).toFixed(1),
      comfort_hours: comfortStatus.filter((c) => c === 'comfortable').length,
      ambient_min: +Math.min(...ambient).toFixed(1),
      ambient_max: +Math.max(...ambient).toFixed(1),
      ambient_avg: +ambAvg.toFixed(1),
    },
    weather_meta: {
      source: 'Mock (offline)',
      date_used: new Date().toISOString().slice(0, 10),
    },
    comfort_temperature: comfortTemp,
    thermal_capacity: thermalCapacity,
    _mock: true,
  };
}

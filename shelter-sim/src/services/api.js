/**
 * API service layer for Thermal Shelter Simulator
 *
 * Change API_BASE_URL to point to your FastAPI backend.
 * During local development the Vite proxy rewrites /api → http://localhost:8000
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Run thermal simulation against the backend.
 * Backend wraps the existing simulate_shelter(...) function.
 *
 * @param {Object} params - Simulation parameters matching backend signature
 * @returns {Promise<Object>} Simulation results
 */
export async function runSimulation(params) {
  const payload = {
    location: params.location || 'Leh',
    wall_area: Number(params.wall_area),
    roof_area: Number(params.roof_area),
    window_area: Number(params.window_area),
    wall_thickness: Number(params.wall_thickness),
    roof_thickness: Number(params.roof_thickness),
    wall_material: params.wall_material,
    roof_material: params.roof_material,
    thermal_capacity: Number(params.thermal_capacity) || 100000.0,
    initial_temperature: params.initial_temperature != null
      ? Number(params.initial_temperature)
      : null,
  };

  const response = await fetch(`${API_BASE_URL}/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Simulation failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Health / connectivity check
 */
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
 * Generate realistic mock data for demo when backend is unavailable.
 * Mirrors expected response shape so UI works offline for SIH presentation.
 */
export function generateMockResults(params) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Approximate high-altitude diurnal ambient temperature (Ladakh-like)
  const ambient = hours.map((h) => {
    const base = -2;
    const amplitude = 12;
    return +(base + amplitude * Math.sin(((h - 6) / 24) * 2 * Math.PI)).toFixed(1);
  });

  // Simple passive response model for demo only
  const kWall = params.wall_material === 'insulated_panel' || params.wall_material === 'composite' ? 0.15 : 0.45;
  const kRoof = params.roof_material === 'insulated_panel' || params.roof_material === 'composite' ? 0.12 : 0.5;
  const thermalInertia = Math.min(0.85, (params.thermal_capacity || 100000) / 250000);
  const initial = params.initial_temperature ?? 12;

  let indoor = initial;
  const indoorTemps = [];
  const solarGains = [];
  const heatLosses = [];
  const comfort = [];

  hours.forEach((h) => {
    // Simplified solar irradiance (clear-sky approximation)
    const solar = h >= 7 && h <= 17
      ? Math.max(0, 650 * Math.sin(((h - 7) / 10) * Math.PI))
      : 0;
    const solarGain = +(solar * (params.window_area || 10) * 0.55 / 1000).toFixed(2); // kWh-ish units for chart

    const deltaT = indoor - ambient[h];
    const loss = +(
      (kWall * (params.wall_area || 100) / (params.wall_thickness || 0.3) +
        kRoof * (params.roof_area || 80) / (params.roof_thickness || 0.2) +
        5.5 * (params.window_area || 10)) *
      Math.abs(deltaT) /
      1000
    ).toFixed(2);

    // Update indoor temperature with inertia
    const net = solarGain * 0.8 - (deltaT > 0 ? loss : -loss * 0.4);
    indoor = indoor + net * (1 - thermalInertia) * 0.35;
    indoor = Math.max(ambient[h] - 2, Math.min(ambient[h] + 18, indoor));

    indoorTemps.push(+indoor.toFixed(1));
    solarGains.push(solarGain);
    heatLosses.push(loss);

    if (indoor >= 16 && indoor <= 26) comfort.push('comfortable');
    else if (indoor < 16) comfort.push('too_cold');
    else comfort.push('too_hot');
  });

  const avg = indoorTemps.reduce((a, b) => a + b, 0) / 24;
  const minT = Math.min(...indoorTemps);
  const maxT = Math.max(...indoorTemps);
  const totalSolar = solarGains.reduce((a, b) => a + b, 0);
  const totalLoss = heatLosses.reduce((a, b) => a + b, 0);
  const comfortHours = comfort.filter((c) => c === 'comfortable').length;

  return {
    hours,
    ambient_temperature: ambient,
    indoor_temperature: indoorTemps,
    solar_gain: solarGains,
    heat_loss: heatLosses,
    comfort_status: comfort,
    summary: {
      average_temperature: +avg.toFixed(1),
      minimum_temperature: +minT.toFixed(1),
      maximum_temperature: +maxT.toFixed(1),
      total_solar_gain: +totalSolar.toFixed(1),
      total_heat_loss: +totalLoss.toFixed(1),
      comfort_hours: comfortHours,
    },
    _mock: true,
  };
}

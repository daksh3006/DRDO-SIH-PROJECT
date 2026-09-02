/**
 * API service layer for Thermal Shelter Simulator
 */

import { estimateThermalCapacity } from '../data/materials';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

function toNum(v, fallback = 0) {
  if (v === '' || v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function runSimulation(params) {
  const thermalCapacity = estimateThermalCapacity(params);

  const payload = {
    location:
      params.location ||
      `${params.city || ''}, ${params.state || ''}`.trim(),
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
    initial_temperature: toNum(params.initial_temperature, 20),
    orientation: params.orientation || 'South',
    shelter_height: toNum(params.shelter_height, 2.5),
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

export async function reverseGeocode(lat, lon) {
  const url = `${API_BASE_URL}/geocode?lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lon)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding failed (${response.status})`);
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
 * Offline mock DISABLED — do not invent different physics.
 * Returns null so the UI can show a reconnect message.
 */
export function generateMockResults(_params) {
  return null;
}

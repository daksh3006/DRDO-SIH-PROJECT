// Material properties aligned with typical backend MATERIALS.py values.
// Frontend displays these for user feedback; thermal calc stays in Python.

export const WALL_MATERIALS = {
  brick: {
    id: 'brick',
    name: 'Brick',
    conductivity: 0.72,      // W/(m·K)
    density: 1920,            // kg/m³
    specific_heat: 790,       // J/(kg·K)
    description: 'Traditional fired clay brick – moderate insulation',
  },
  concrete: {
    id: 'concrete',
    name: 'Concrete',
    conductivity: 1.4,
    density: 2300,
    specific_heat: 880,
    description: 'Dense concrete – high thermal mass, higher conductivity',
  },
  stone: {
    id: 'stone',
    name: 'Stone (Local)',
    conductivity: 1.7,
    density: 2500,
    specific_heat: 790,
    description: 'Local stone masonry common in high-altitude regions',
  },
  mud: {
    id: 'mud',
    name: 'Mud / Adobe',
    conductivity: 0.5,
    density: 1600,
    specific_heat: 880,
    description: 'Traditional earth construction – good for passive design',
  },
  insulated_panel: {
    id: 'insulated_panel',
    name: 'Insulated Panel',
    conductivity: 0.04,
    density: 40,
    specific_heat: 1400,
    description: 'High-performance insulated sandwich panel',
  },
  composite: {
    id: 'composite',
    name: 'Composite (Brick + Insulation)',
    conductivity: 0.18,
    density: 900,
    specific_heat: 900,
    description: 'Brick outer + internal insulation layer',
  },
};

export const ROOF_MATERIALS = {
  concrete: {
    id: 'concrete',
    name: 'Concrete Slab',
    conductivity: 1.4,
    density: 2300,
    specific_heat: 880,
    description: 'Standard RCC roof slab',
  },
  insulated_panel: {
    id: 'insulated_panel',
    name: 'Insulated Panel',
    conductivity: 0.035,
    density: 35,
    specific_heat: 1400,
    description: 'Lightweight high-R insulated roof panel',
  },
  metal_sheet: {
    id: 'metal_sheet',
    name: 'Metal Sheet',
    conductivity: 45,
    density: 7800,
    specific_heat: 500,
    description: 'CGI / metal sheet – high conductivity, needs insulation',
  },
  thatch: {
    id: 'thatch',
    name: 'Thatch / Straw',
    conductivity: 0.07,
    density: 150,
    specific_heat: 1600,
    description: 'Traditional thatch – good natural insulator',
  },
  composite: {
    id: 'composite',
    name: 'Composite Roof',
    conductivity: 0.12,
    density: 600,
    specific_heat: 1000,
    description: 'Multi-layer insulated composite roof',
  },
};

export function getMaterialR(material, thickness) {
  // Simple R-value estimate (m²K/W) = thickness / k
  if (!material || !thickness || thickness <= 0) return null;
  return (thickness / material.conductivity).toFixed(2);
}

export const DEFAULT_PARAMS = {
  location: 'Leh, Ladakh',
  latitude: 34.1526,
  longitude: 77.5771,
  wall_area: 120,
  roof_area: 80,
  window_area: 12,
  wall_thickness: 0.35,
  roof_thickness: 0.25,
  wall_material: 'brick',
  roof_material: 'insulated_panel',
  thermal_capacity: 150000,
  initial_temperature: 15,
  orientation: 'South',
  simulation_hours: 24,
};

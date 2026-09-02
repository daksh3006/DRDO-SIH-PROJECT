// Material properties — must match backend MATERIALS.py exactly.

export const WALL_MATERIALS = {
  brick: {
    id: 'brick',
    name: 'Brick',
    conductivity: 0.72,
    density: 1920,
    specific_heat: 790,
    solar_absorptivity: 0.65,
    emissivity: 0.90,
    description: 'Traditional fired clay brick – moderate thermal mass (representative value)',
  },
  concrete: {
    id: 'concrete',
    name: 'Concrete',
    conductivity: 1.4,
    density: 2300,
    specific_heat: 880,
    solar_absorptivity: 0.60,
    emissivity: 0.88,
    description: 'Dense concrete – high thermal mass (representative value)',
  },
  stone: {
    id: 'stone',
    name: 'Stone (Local)',
    conductivity: 1.7,
    density: 2500,
    specific_heat: 790,
    solar_absorptivity: 0.60,
    emissivity: 0.90,
    description: 'Local stone masonry (representative value)',
  },
  mud: {
    id: 'mud',
    name: 'Mud / Adobe',
    conductivity: 0.5,
    density: 1600,
    specific_heat: 880,
    solar_absorptivity: 0.68,
    emissivity: 0.92,
    description: 'Traditional earth construction (representative value)',
  },
  insulated_panel: {
    id: 'insulated_panel',
    name: 'Insulated Panel',
    conductivity: 0.035,
    density: 40,
    specific_heat: 1400,
    solar_absorptivity: 0.35,
    emissivity: 0.85,
    description: 'High-performance insulated sandwich panel (representative value)',
  },
  composite: {
    id: 'composite',
    name: 'Composite (Brick + Insulation)',
    conductivity: 0.18,
    density: 900,
    specific_heat: 900,
    solar_absorptivity: 0.55,
    emissivity: 0.90,
    description: 'Brick outer + internal insulation layer (representative value)',
  },
};

export const ROOF_MATERIALS = {
  concrete: {
    id: 'concrete',
    name: 'Concrete Slab',
    conductivity: 1.4,
    density: 2300,
    specific_heat: 880,
    solar_absorptivity: 0.60,
    emissivity: 0.88,
    description: 'Standard RCC roof slab (representative value)',
  },
  insulated_panel: {
    id: 'insulated_panel',
    name: 'Insulated Panel',
    conductivity: 0.035,
    density: 40,
    specific_heat: 1400,
    solar_absorptivity: 0.35,
    emissivity: 0.85,
    description: 'Lightweight high-R insulated roof panel (representative value)',
  },
  metal_sheet: {
    id: 'metal_sheet',
    name: 'Metal Sheet',
    conductivity: 45,
    density: 7800,
    specific_heat: 500,
    solar_absorptivity: 0.75,
    emissivity: 0.30,
    description: 'CGI / metal sheet – high solar absorption (representative value)',
  },
  thatch: {
    id: 'thatch',
    name: 'Thatch / Straw',
    conductivity: 0.07,
    density: 150,
    specific_heat: 1600,
    solar_absorptivity: 0.70,
    emissivity: 0.90,
    description: 'Traditional thatch roof (representative value)',
  },
  composite_roof: {
    id: 'composite_roof',
    name: 'Composite Roof',
    conductivity: 0.12,
    density: 600,
    specific_heat: 1000,
    solar_absorptivity: 0.45,
    emissivity: 0.85,
    description: 'Multi-layer insulated composite roof (representative value)',
  },
};

export const WINDOW_MATERIALS = {
  single_glazing: {
    id: 'single_glazing',
    name: 'Single Glazing (4mm)',
    u: 5.8,
    g: 0.85,
    description: 'Basic single glass pane - high heat loss',
  },
  double_glazing: {
    id: 'double_glazing',
    name: 'Double Glazing (Standard)',
    u: 2.8,
    g: 0.75,
    description: 'Standard double glazing with air gap',
  },
  double_low_e: {
    id: 'double_low_e',
    name: 'Double Glazing (Low-E)',
    u: 1.4,
    g: 0.60,
    description: 'Double glazing with Low-Emissivity coating',
  },
  triple_glazing: {
    id: 'triple_glazing',
    name: 'Triple Glazing (High Performance)',
    u: 0.8,
    g: 0.50,
    description: 'Triple pane insulated glazing for extreme cold',
  },
  insulated_translucent: {
    id: 'insulated_translucent',
    name: 'Insulated Translucent Panel',
    u: 1.2,
    g: 0.45,
    description: 'Aerogel or multi-wall polycarbonate daylighting panel',
  },
};

export function getMaterialR(material, thickness) {
  if (!material || !thickness || thickness <= 0) return null;
  return (thickness / material.conductivity).toFixed(2);
}

export function estimateThermalCapacity(params) {
  const wallMat = WALL_MATERIALS[params.wall_material];
  const roofMat = ROOF_MATERIALS[params.roof_material];
  const grossWall = Number(params.wall_area) || 0;
  const windowArea = Number(params.window_area) || 0;
  const netWall = Math.max(0, grossWall - windowArea);
  const roofArea = Number(params.roof_area) || 0;
  const wallThk = Number(params.wall_thickness) || 0;
  const roofThk = Number(params.roof_thickness) || 0;

  let C_walls = 0;
  let C_roof = 0;
  if (wallMat && netWall > 0 && wallThk > 0) {
    C_walls = wallMat.density * wallMat.specific_heat * netWall * wallThk;
  }
  if (roofMat && roofArea > 0 && roofThk > 0) {
    C_roof = roofMat.density * roofMat.specific_heat * roofArea * roofThk;
  }
  return Math.round(C_walls + C_roof);
}

export function estimateThermalCapacityBreakdown(params) {
  const wallMat = WALL_MATERIALS[params.wall_material];
  const roofMat = ROOF_MATERIALS[params.roof_material];
  const grossWall = Number(params.wall_area) || 0;
  const windowArea = Number(params.window_area) || 0;
  const netWall = Math.max(0, grossWall - windowArea);
  const roofArea = Number(params.roof_area) || 0;
  const wallThk = Number(params.wall_thickness) || 0;
  const roofThk = Number(params.roof_thickness) || 0;
  const C_walls =
    wallMat && netWall > 0 && wallThk > 0
      ? wallMat.density * wallMat.specific_heat * netWall * wallThk
      : 0;
  const C_roof =
    roofMat && roofArea > 0 && roofThk > 0
      ? roofMat.density * roofMat.specific_heat * roofArea * roofThk
      : 0;
  const height = Number(params.shelter_height) || 2.5;
  const volume = Math.max(roofArea, 0) * height;
  const C_air = 1.2 * 1005 * volume;
  return {
    net_wall_area: netWall,
    C_walls: Math.round(C_walls),
    C_roof: Math.round(C_roof),
    C_env: Math.round(C_walls + C_roof),
    C_air: Math.round(C_air),
    volume: Math.round(volume * 10) / 10,
  };
}

export const DEFAULT_PARAMS = {
  location: 'Leh, Ladakh',
  city: 'Leh',
  state: 'Ladakh',
  latitude: 34.1526,
  longitude: 77.5771,
  wall_area: 145,
  roof_area: 86,
  window_area: 1,
  wall_thickness: 0.4,
  roof_thickness: 0.25,
  wall_material: 'brick',
  roof_material: 'metal_sheet',
  window_type: 'double_glazing',
  initial_temperature: '',
  orientation: 'South',
  shelter_height: 2.5,
  comfort_min: 16,
  comfort_max: 26,
  spin_up: true,
};

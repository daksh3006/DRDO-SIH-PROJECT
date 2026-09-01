// Material properties aligned with backend MATERIALS.py values.
// All values are real engineering properties (SI units).

export const WALL_MATERIALS = {
  brick: {
    id: 'brick',
    name: 'Brick',
    conductivity: 0.72,      // W/(m·K)
    density: 1920,           // kg/m³
    specific_heat: 790,      // J/(kg·K)
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
  if (!material || !thickness || thickness <= 0) return null;
  return (thickness / material.conductivity).toFixed(2);
}

/**
 * Real thermal capacity (J/K) from geometry + material properties.
 *
 * C = Σ (ρ × c × V)
 *   walls:  ρ_wall × c_wall × A_wall × thickness_wall
 *   roof:   ρ_roof × c_roof × A_roof × thickness_roof
 *   air:    ρ_air × c_air × volume   (volume ≈ roof_area × 2.5 m)
 *
 * No artificial min/max clamps — value follows materials and geometry only.
 */
export function estimateThermalCapacity(params) {
  const wallMat = WALL_MATERIALS[params.wall_material];
  const roofMat = ROOF_MATERIALS[params.roof_material];

  const wallArea = Number(params.wall_area) || 0;
  const roofArea = Number(params.roof_area) || 0;
  const wallThk = Number(params.wall_thickness) || 0;
  const roofThk = Number(params.roof_thickness) || 0;

  let C = 0;

  // Walls: full volumetric heat capacity
  if (wallMat && wallArea > 0 && wallThk > 0) {
    const volumeWall = wallArea * wallThk; // m³
    C += wallMat.density * wallMat.specific_heat * volumeWall;
  }

  // Roof: full volumetric heat capacity
  if (roofMat && roofArea > 0 && roofThk > 0) {
    const volumeRoof = roofArea * roofThk; // m³
    C += roofMat.density * roofMat.specific_heat * volumeRoof;
  }

  // Indoor air (ρ ≈ 1.2 kg/m³, c ≈ 1005 J/(kg·K))
  // Volume approximated from roof area × typical internal height 2.5 m
  if (roofArea > 0) {
    const volumeAir = roofArea * 2.5;
    C += 1.2 * 1005 * volumeAir;
  }

  return Math.round(C); // real value in J/K, no artificial limits
}

export const DEFAULT_PARAMS = {
  location: 'Leh, Ladakh',
  city: 'Leh',
  state: 'Ladakh',
  latitude: 34.1526,
  longitude: 77.5771,
  wall_area: 120,
  roof_area: 80,
  window_area: 12,
  wall_thickness: 0.35,
  roof_thickness: 0.25,
  wall_material: 'brick',
  roof_material: 'insulated_panel',
  comfort_temperature: 30,
  orientation: 'South',
  simulation_hours: 24,
};

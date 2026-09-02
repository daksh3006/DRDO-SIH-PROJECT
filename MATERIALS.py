# Single source of material properties (SI units).
# Keys are lowercase IDs matching the frontend exactly.

MATERIALS = {
    # -------- Walls --------
    "brick": {
        "name": "Brick",
        "k": 0.72,
        "density": 1920,
        "specific_heat": 790,
        "solar_absorptivity": 0.65,
        "emissivity": 0.90,
    },
    "concrete": {
        "name": "Concrete",
        "k": 1.40,
        "density": 2300,
        "specific_heat": 880,
        "solar_absorptivity": 0.60,
        "emissivity": 0.88,
    },
    "stone": {
        "name": "Stone (Local)",
        "k": 1.70,
        "density": 2500,
        "specific_heat": 790,
        "solar_absorptivity": 0.60,
        "emissivity": 0.90,
    },
    "mud": {
        "name": "Mud / Adobe",
        "k": 0.50,
        "density": 1600,
        "specific_heat": 880,
        "solar_absorptivity": 0.68,
        "emissivity": 0.92,
    },
    "insulated_panel": {
        "name": "Insulated Panel",
        "k": 0.035,
        "density": 40,
        "specific_heat": 1400,
        "solar_absorptivity": 0.35,  # Light reflective finish
        "emissivity": 0.85,
    },
    "composite": {
        "name": "Composite (Brick + Insulation)",
        "k": 0.18,
        "density": 900,
        "specific_heat": 900,
        "solar_absorptivity": 0.55,
        "emissivity": 0.90,
    },
    # -------- Roofs --------
    "metal_sheet": {
        "name": "Metal Sheet",
        "k": 45.0,
        "density": 7800,
        "specific_heat": 500,
        "solar_absorptivity": 0.75,
        "emissivity": 0.30,
    },
    "thatch": {
        "name": "Thatch / Straw",
        "k": 0.07,
        "density": 150,
        "specific_heat": 1600,
        "solar_absorptivity": 0.70,
        "emissivity": 0.90,
    },
    "composite_roof": {
        "name": "Composite Roof",
        "k": 0.12,
        "density": 600,
        "specific_heat": 1000,
        "solar_absorptivity": 0.45,
        "emissivity": 0.85,
    },
}

WINDOW_MATERIALS = {
    "single_glazing": {
        "name": "Single Glazing (4mm)",
        "u": 5.8,
        "g": 0.85,
    },
    "double_glazing": {
        "name": "Double Glazing (Standard)",
        "u": 2.8,
        "g": 0.75,
    },
    "double_low_e": {
        "name": "Double Glazing (Low-E)",
        "u": 1.4,
        "g": 0.60,
    },
    "triple_glazing": {
        "name": "Triple Glazing (High Performance)",
        "u": 0.8,
        "g": 0.50,
    },
    "insulated_translucent": {
        "name": "Insulated Translucent Panel",
        "u": 1.2,
        "g": 0.45,
    },
}


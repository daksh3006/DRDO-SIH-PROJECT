# Single source of material properties (SI units).
# Keys are lowercase IDs matching the frontend exactly.

MATERIALS = {
    # -------- Walls --------
    "brick": {
        "name": "Brick",
        "k": 0.72,
        "density": 1920,
        "specific_heat": 790,
    },
    "concrete": {
        "name": "Concrete",
        "k": 1.40,
        "density": 2300,
        "specific_heat": 880,
    },
    "stone": {
        "name": "Stone (Local)",
        "k": 1.70,
        "density": 2500,
        "specific_heat": 790,
    },
    "mud": {
        "name": "Mud / Adobe",
        "k": 0.50,
        "density": 1600,
        "specific_heat": 880,
    },
    "insulated_panel": {
        "name": "Insulated Panel",
        "k": 0.035,
        "density": 40,
        "specific_heat": 1400,
    },
    "composite": {
        "name": "Composite (Brick + Insulation)",
        "k": 0.18,
        "density": 900,
        "specific_heat": 900,
    },
    # -------- Roofs --------
    "metal_sheet": {
        "name": "Metal Sheet",
        "k": 45.0,
        "density": 7800,
        "specific_heat": 500,
    },
    "thatch": {
        "name": "Thatch / Straw",
        "k": 0.07,
        "density": 150,
        "specific_heat": 1600,
    },
    # Distinct from wall "composite" — different build-up
    "composite_roof": {
        "name": "Composite Roof",
        "k": 0.12,
        "density": 600,
        "specific_heat": 1000,
    },
}

"""
24-hour passive shelter thermal simulation.

Energy balance (simple lumped capacitance model):
    net_heat = solar_gain - conduction_loss
    ΔT = (net_heat * dt) / thermal_capacity
"""

from __future__ import annotations
import numpy as np
from MATERIALS import MATERIALS


def _resolve_material(name: str) -> dict:
    """Look up material with flexible matching (case, spaces, underscores)."""
    if not name:
        raise KeyError("Material name is empty")

    raw = str(name).strip()
    candidates = [
        raw,
        raw.lower(),
        raw.lower().replace(" ", "_"),
        raw.lower().replace("-", "_"),
        raw.replace(" ", "_"),
        raw.title(),
        raw.capitalize(),
    ]

    for key in candidates:
        if key in MATERIALS:
            return MATERIALS[key]

    # Last resort: compare normalised keys
    norm = raw.lower().replace(" ", "_").replace("-", "_")
    for k, v in MATERIALS.items():
        if k.lower().replace(" ", "_") == norm:
            return v
        if v.get("name", "").lower() == raw.lower():
            return v

    raise KeyError(
        f"Unknown material '{name}'. Available: {list(MATERIALS.keys())}"
    )


def simulate_shelter(
    wall_area: float,
    roof_area: float,
    window_area: float,
    wall_thickness: float,
    roof_thickness: float,
    wall_material: str,
    roof_material: str,
    ambient_temperature: np.ndarray,
    solar_irradiance: np.ndarray,
    thermal_capacity: float = 150000.0,
    initial_temperature: float | None = None,
    roof_absorptivity: float = 0.55,
    window_transmissivity: float = 0.55,
    window_U: float = 2.8,
):
    wall = _resolve_material(wall_material)
    roof = _resolve_material(roof_material)

    # U-values (W/m²K)
    wall_U = wall["k"] / max(float(wall_thickness), 0.05)
    roof_U = roof["k"] / max(float(roof_thickness), 0.05)

    # Real U-values from k / thickness (no artificial cap)

    ambient_temperature = np.asarray(ambient_temperature, dtype=float)
    solar_irradiance = np.asarray(solar_irradiance, dtype=float)

    n_hours = len(ambient_temperature)
    if n_hours != 24:
        raise ValueError(f"Expected 24 hourly values, got {n_hours}")

    hours = np.arange(n_hours)
    indoor_temperature = np.zeros(n_hours)
    heat_loss_his = np.zeros(n_hours)
    solar_gain_his = np.zeros(n_hours)

    if initial_temperature is None:
        indoor_temperature[0] = float(ambient_temperature[0])
    else:
        indoor_temperature[0] = float(initial_temperature)

    dt = 3600.0
    C = max(float(thermal_capacity), 1.0)  # real value; only guard against zero/negative

    for t in range(n_hours - 1):
        Tin = indoor_temperature[t]
        Tout = ambient_temperature[t]
        solar = max(0.0, float(solar_irradiance[t]))

        wall_loss = wall_U * wall_area * (Tin - Tout)
        roof_loss = roof_U * roof_area * (Tin - Tout)
        window_loss = window_U * window_area * (Tin - Tout)
        total_heat_loss = wall_loss + roof_loss + window_loss

        solar_gain_roof = solar * roof_area * roof_absorptivity * 0.22
        solar_gain_window = solar * window_area * window_transmissivity
        total_solar_gain = solar_gain_roof + solar_gain_window

        net_heat = total_solar_gain - total_heat_loss
        dT = (net_heat * dt) / C
        dT = float(dT)  # no artificial temperature-step limit
        indoor_temperature[t + 1] = Tin + dT

        heat_loss_his[t] = total_heat_loss
        solar_gain_his[t] = total_solar_gain

    heat_loss_his[-1] = heat_loss_his[-2] if n_hours > 1 else 0.0
    solar_gain_his[-1] = solar_gain_his[-2] if n_hours > 1 else 0.0

    return hours, indoor_temperature, heat_loss_his, solar_gain_his

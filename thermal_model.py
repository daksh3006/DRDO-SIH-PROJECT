"""
2-node thermal shelter model.

Node 1: building envelope (walls + roof)
Node 2: indoor air + effective contents

Outside air → envelope
Envelope → inside air
Window → inside air
Ventilation → inside air
Solar absorbed by envelope
Solar transmitted through window
Internal gains
"""

from __future__ import annotations

from datetime import date
import numpy as np

from MATERIALS import MATERIALS


R_SI = 0.13
R_SE = 0.04

RHO_AIR = 1.20
CP_AIR = 1005.0

DEFAULT_ACH = 0.8

WINDOW_U = 2.8
WINDOW_G = 0.55

GROUND_ALBEDO = 0.20

CONTENTS_MASS_PER_VOLUME = 20.0
CONTENTS_CP = 1000.0


def _resolve_material(name: str) -> dict:
    if not name:
        raise KeyError("Material name is empty")

    raw = str(name).strip()
    candidates = [
        raw,
        raw.lower(),
        raw.lower().replace(" ", "_"),
        raw.lower().replace("-", "_"),
        raw.replace(" ", "_"),
    ]

    for key in candidates:
        if key in MATERIALS:
            return MATERIALS[key]

    norm = raw.lower().replace(" ", "_").replace("-", "_")
    for key, value in MATERIALS.items():
        if key.lower().replace(" ", "_") == norm:
            return value
        if value.get("name", "").lower() == raw.lower():
            return value

    raise KeyError(
        f"Unknown material '{name}'. Available: {list(MATERIALS.keys())}"
    )


def _half_resistance_conductance(
    area: float,
    k: float,
    thickness: float,
    surface_resistance: float,
) -> float:
    """H from air node to middle of envelope layer: A / (R_surface + L/(2k))."""
    area = max(float(area), 0.0)
    k = max(float(k), 1e-6)
    thickness = max(float(thickness), 0.01)
    resistance = surface_resistance + thickness / (2.0 * k)
    return area / resistance


def _window_conductance(area: float) -> float:
    """Window U is overall; do not add R_si/R_se again."""
    return max(float(area), 0.0) * WINDOW_U


def _orientation_degrees(orientation: str) -> float:
    mapping = {
        "North": 0.0,
        "North-East": 45.0,
        "East": 90.0,
        "South-East": 135.0,
        "South": 180.0,
        "South-West": 225.0,
        "West": 270.0,
        "North-West": 315.0,
    }
    return mapping.get(str(orientation), 180.0)


def _vertical_solar_irradiance(
    ghi: float,
    solar_azimuth: float,
    solar_elevation: float,
    facade_azimuth: float,
    albedo: float = GROUND_ALBEDO,
    dni: float | None = None,
    dhi: float | None = None,
) -> float:
    """Approximate irradiance on a vertical facade (W/m²)."""
    ghi = max(float(ghi), 0.0)
    if ghi <= 0.0 or solar_elevation <= 0.0:
        return 0.0

    elevation_rad = np.radians(solar_elevation)
    azimuth_diff_rad = np.radians(float(solar_azimuth) - float(facade_azimuth))

    if dni is not None and dhi is not None:
        dni_v = max(float(dni), 0.0)
        dhi_v = max(float(dhi), 0.0)
    else:
        diffuse_fraction = np.clip(
            0.35 + 0.25 * (1.0 - np.sin(elevation_rad)), 0.20, 0.70
        )
        dhi_v = ghi * diffuse_fraction
        direct_horizontal = max(ghi - dhi_v, 0.0)
        sin_elevation = max(np.sin(elevation_rad), 0.05)
        dni_v = direct_horizontal / sin_elevation

    cos_incidence = np.cos(elevation_rad) * np.cos(azimuth_diff_rad)
    direct_vertical = max(0.0, dni_v * cos_incidence)
    diffuse_vertical = dhi_v * 0.5
    reflected_vertical = ghi * albedo * 0.5

    return max(0.0, direct_vertical + diffuse_vertical + reflected_vertical)


def _solar_position(
    latitude: float,
    longitude: float,
    hour: float,
    when: date | None = None,
    utc_offset_hours: float | None = None,
) -> tuple[float, float]:
    """Approximate solar elevation and azimuth (deg). Azimuth clockwise from North.

    Prefer weather timestamps: pass `when` (local date) and local hour.
    utc_offset_hours: local = UTC + offset (used for rough equation-of-time free solar time).
    """
    if when is None:
        when = date.today()
    day_of_year = when.timetuple().tm_yday
    declination = np.radians(
        23.44 * np.sin(np.radians((360.0 / 365.0) * (day_of_year - 81)))
    )
    lat_rad = np.radians(latitude)
    # Approximate local solar time: local clock hour + longitude correction
    # relative to standard meridian for the offset (15° per hour).
    if utc_offset_hours is not None:
        std_meridian = 15.0 * utc_offset_hours
        time_correction = (longitude - std_meridian) / 15.0
        solar_time = hour + time_correction
    else:
        solar_time = hour + (longitude / 15.0)
    hour_angle = np.radians(15.0 * (solar_time - 12.0))

    sin_altitude = (
        np.sin(lat_rad) * np.sin(declination)
        + np.cos(lat_rad) * np.cos(declination) * np.cos(hour_angle)
    )
    altitude = np.degrees(np.arcsin(np.clip(sin_altitude, -1.0, 1.0)))
    if altitude <= 0:
        return 0.0, 180.0

    azimuth = np.degrees(
        np.arctan2(
            np.sin(hour_angle),
            (
                np.cos(hour_angle) * np.sin(lat_rad)
                - np.tan(declination) * np.cos(lat_rad)
            ),
        )
    )
    azimuth = (azimuth + 180.0) % 360.0
    return altitude, azimuth


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
    thermal_capacity: float,
    initial_temperature: float | None = None,
    latitude: float = 0.0,
    longitude: float = 0.0,
    orientation: str = "South",
    roof_absorptivity: float = 0.65,
    wall_absorptivity: float = 0.55,
    window_g: float = WINDOW_G,
    ach: float = DEFAULT_ACH,
    internal_gains: float = 50.0,
    substeps: int = 12,
    dni: np.ndarray | None = None,
    dhi: np.ndarray | None = None,
    shelter_height: float = 2.5,
    hour_timestamps: list | None = None,
    utc_offset_hours: float | None = None,
):
    wall = _resolve_material(wall_material)
    roof = _resolve_material(roof_material)

    gross_wall = max(float(wall_area), 0.0)
    windows = min(max(float(window_area), 0.0), gross_wall)
    net_wall = max(gross_wall - windows, 0.0)
    roof_a = max(float(roof_area), 0.0)
    height = max(float(shelter_height), 0.5)
    volume = max(roof_a * height, 1.0)

    H_wall_out = _half_resistance_conductance(
        net_wall, wall["k"], wall_thickness, R_SE
    )
    H_wall_in = _half_resistance_conductance(
        net_wall, wall["k"], wall_thickness, R_SI
    )
    H_roof_out = _half_resistance_conductance(
        roof_a, roof["k"], roof_thickness, R_SE
    )
    H_roof_in = _half_resistance_conductance(
        roof_a, roof["k"], roof_thickness, R_SI
    )

    H_out = H_wall_out + H_roof_out
    H_in = H_wall_in + H_roof_in
    H_window = _window_conductance(windows)
    H_vent = ach * volume * RHO_AIR * CP_AIR / 3600.0

    C_env = max(float(thermal_capacity), 1.0)
    C_air = volume * RHO_AIR * CP_AIR
    C_contents = volume * CONTENTS_MASS_PER_VOLUME * CONTENTS_CP
    C_indoor = max(C_air + C_contents, 1.0)

    ambient_temperature = np.asarray(ambient_temperature, dtype=float)
    solar_irradiance = np.asarray(solar_irradiance, dtype=float)

    n_hours = len(ambient_temperature)
    if n_hours < 2:
        raise ValueError(
            f"Need at least 2 hourly temperature values, got {n_hours}"
        )
    if len(solar_irradiance) != n_hours:
        raise ValueError(
            f"Solar series length {len(solar_irradiance)} != temperature length {n_hours}"
        )

    if dni is not None:
        dni = np.asarray(dni, dtype=float)
        dni = np.nan_to_num(dni, nan=0.0)
    if dhi is not None:
        dhi = np.asarray(dhi, dtype=float)
        dhi = np.nan_to_num(dhi, nan=0.0)

    T_start = (
        float(initial_temperature)
        if initial_temperature is not None
        else float(ambient_temperature[0])
    )
    T_in = T_start
    T_env = T_start

    # Time index 0 = initial state; indices 1..n-1 = after each elapsed hour
    # With n=25 (hours 0..24) this is exactly 24 elapsed hours.
    hours = np.arange(n_hours)
    indoor_temperature = np.zeros(n_hours)
    heat_loss_his = np.zeros(n_hours)
    solar_gain_his = np.zeros(n_hours)

    indoor_temperature[0] = T_in
    dt = 3600.0 / max(int(substeps), 1)
    facade_azimuth = _orientation_degrees(orientation)

    for t in range(1, n_hours):
        Tout = float(ambient_temperature[t])
        ghi = max(float(solar_irradiance[t]), 0.0)

        when = date.today()
        local_hour = float(t)
        if hour_timestamps and t < len(hour_timestamps) and hour_timestamps[t]:
            try:
                from datetime import datetime
                ts = str(hour_timestamps[t]).replace("Z", "")
                # Open-Meteo: "2026-09-02T14:00"
                timestamp = datetime.fromisoformat(ts)
                when = timestamp.date()
                local_hour = timestamp.hour + timestamp.minute / 60.0
            except Exception:
                pass
        solar_elevation, solar_azimuth = _solar_position(
            latitude=latitude,
            longitude=longitude,
            hour=local_hour,
            when=when,
            utc_offset_hours=utc_offset_hours,
        )

        dni_t = float(dni[t]) if dni is not None and t < len(dni) else None
        dhi_t = float(dhi[t]) if dhi is not None and t < len(dhi) else None

        roof_solar = ghi
        facade_solar = _vertical_solar_irradiance(
            ghi=ghi,
            solar_azimuth=solar_azimuth,
            solar_elevation=solar_elevation,
            facade_azimuth=facade_azimuth,
            dni=dni_t,
            dhi=dhi_t,
        )

        Q_solar_roof = roof_solar * roof_a * roof_absorptivity
        Q_solar_wall = facade_solar * net_wall * wall_absorptivity
        Q_solar_opaque = Q_solar_roof + Q_solar_wall
        Q_solar_window = facade_solar * windows * float(window_g)
        Q_internal = float(internal_gains)

        hour_loss = 0.0
        hour_solar = 0.0

        for _ in range(max(int(substeps), 1)):
            Q_amb_env = H_out * (Tout - T_env)
            Q_env_in = H_in * (T_env - T_in)
            Q_window = H_window * (Tout - T_in)
            Q_vent = H_vent * (Tout - T_in)

            dT_env = (Q_amb_env - Q_env_in + Q_solar_opaque) * dt / C_env
            T_env += dT_env

            dT_in = (
                Q_env_in + Q_window + Q_vent + Q_solar_window + Q_internal
            ) * dt / C_indoor
            T_in += dT_in

            # Total heat leaving the indoor+envelope system toward ambient
            # (positive when the shelter is losing heat overall)
            loss_env_out = H_out * max(T_env - Tout, 0.0)
            loss_window = H_window * max(T_in - Tout, 0.0)
            loss_vent = H_vent * max(T_in - Tout, 0.0)
            hour_loss += loss_env_out + loss_window + loss_vent
            # Indoor-useful solar (windows) tracked separately from opaque absorption
            hour_solar += Q_solar_window

        indoor_temperature[t] = T_in
        heat_loss_his[t] = hour_loss / max(int(substeps), 1)
        solar_gain_his[t] = hour_solar / max(int(substeps), 1)

    return hours, indoor_temperature, heat_loss_his, solar_gain_his

"""
Real weather data fetcher using Open-Meteo API.
Returns forecast weather for 24-hour simulation starting at current local hour,
plus 3 days of preceding historical weather for realistic thermal spin-up.

Includes an offline demo fallback dataset if network/API calls fail.
"""

from __future__ import annotations
import asyncio
from datetime import datetime, timezone as dt_timezone, timedelta
import logging
import httpx
import numpy as np
from typing import Tuple

logger = logging.getLogger("thermal_sim")

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"


def _generate_offline_fallback(n=25) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, dict, dict]:
    """Offline reference weather dataset (Leh winter conditions) for demo reliability."""
    amb = np.array([
        -8.2, -9.1, -10.0, -10.5, -11.2, -10.8, -8.5, -4.2, 0.5, 3.8,
        6.2, 8.5, 9.8, 9.2, 7.5, 4.0, 0.2, -2.5, -4.8, -6.0,
        -7.1, -7.8, -8.2, -8.8, -9.5
    ])
    sol = np.array([
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 45.0, 210.0, 430.0, 620.0,
        740.0, 780.0, 750.0, 640.0, 460.0, 240.0, 60.0, 0.0, 0.0, 0.0,
        0.0, 0.0, 0.0, 0.0, 0.0
    ])
    dni = sol * 0.7
    dhi = sol * 0.3
    wind = np.full(n, 2.5)

    past_amb = np.tile(amb[1:], 3)
    past_sol = np.tile(sol[1:], 3)
    past_wind = np.tile(wind[1:], 3)

    today_str = datetime.now().strftime("%Y-%m-%d")
    sliced_times = [f"{today_str}T{h:02d}:00" for h in range(n)]

    past_timestamps = []
    start_dt = datetime.now() - timedelta(days=3)
    for h in range(72):
        dt_h = start_dt + timedelta(hours=h)
        past_timestamps.append(dt_h.strftime("%Y-%m-%dT%H:00"))

    meta = {
        "latitude": 34.1526,
        "longitude": 77.5771,
        "elevation": 3500,
        "timezone": "Asia/Kolkata",
        "source": "Offline Reference Weather Dataset (Demo Fallback)",
        "hours": sliced_times,
        "start_idx": 72,
        "past_hours_count": 72,
    }

    past_weather = {
        "ambient": past_amb,
        "solar": past_sol,
        "wind": past_wind,
        "timestamps": past_timestamps,
    }

    return amb, sol, dni, dhi, wind, meta, past_weather


async def fetch_weather(
    latitude: float,
    longitude: float,
    timezone: str = "auto",
    max_retries: int = 2,
    start_from_current_hour: bool = True,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, dict, dict]:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": (
            "temperature_2m,"
            "shortwave_radiation,"
            "direct_normal_irradiance,"
            "diffuse_radiation,"
            "wind_speed_10m"
        ),
        "forecast_days": 3,
        "past_days": 3,
        "timezone": timezone,
    }

    data = None
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(FORECAST_URL, params=params)
                response.raise_for_status()
                data = response.json()
            break
        except Exception as e:
            logger.warning(f"Weather API attempt {attempt+1} failed: {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(1.0)

    if not data or "hourly" not in data:
        logger.info("Using offline demo fallback weather dataset.")
        return _generate_offline_fallback()

    hourly = data.get("hourly", {})
    temps = hourly.get("temperature_2m", [])
    solar = hourly.get("shortwave_radiation", [])
    dni = hourly.get("direct_normal_irradiance", [])
    dhi = hourly.get("diffuse_radiation", [])
    winds = hourly.get("wind_speed_10m", [])
    times = hourly.get("time", [])

    n = 25  # 24 elapsed hourly intervals
    start_idx = 72  # Default offset when past_days=3

    if start_from_current_hour and times:
        try:
            utc_offset = data.get("utc_offset_seconds") or 0
            loc_tz = dt_timezone(timedelta(seconds=utc_offset))
            now_loc = datetime.now(loc_tz)
            now_iso_hour = now_loc.strftime("%Y-%m-%dT%H:00")

            for idx, t_str in enumerate(times):
                if t_str >= now_iso_hour:
                    start_idx = idx
                    break
        except Exception:
            start_idx = 72

    end_idx = start_idx + n
    if len(temps) < end_idx or len(solar) < end_idx:
        start_idx = max(0, len(temps) - n)
        end_idx = len(temps)

    ambient_temperature = np.array(temps[start_idx:end_idx], dtype=float)
    solar_irradiance = np.nan_to_num(np.array(solar[start_idx:end_idx], dtype=float), nan=0.0)
    dni_arr = np.nan_to_num(np.array(dni[start_idx:end_idx], dtype=float), nan=0.0) if dni else np.zeros(n)
    dhi_arr = np.nan_to_num(np.array(dhi[start_idx:end_idx], dtype=float), nan=0.0) if dhi else np.zeros(n)
    wind_arr = (
        np.nan_to_num(np.array(winds[start_idx:end_idx], dtype=float), nan=2.0)
        if winds
        else np.full(n, 2.0)
    )

    past_start = max(0, start_idx - 72)
    past_timestamps = times[past_start:start_idx] if times else []
    past_sol = np.nan_to_num(np.array(solar[past_start:start_idx], dtype=float), nan=0.0) if solar else solar_irradiance

    # Normalize solar radiation units from kJ/m² to W/m² if values exceed Atmospheric Solar Constant (1361 W/m²)
    if np.max(solar_irradiance) > 1361.0:
        solar_irradiance = solar_irradiance / 3.6
        dni_arr = dni_arr / 3.6
        dhi_arr = dhi_arr / 3.6
        past_sol = past_sol / 3.6

    past_weather = {
        "ambient": np.array(temps[past_start:start_idx], dtype=float) if temps else ambient_temperature,
        "solar": past_sol,
        "wind": np.nan_to_num(np.array(winds[past_start:start_idx], dtype=float), nan=2.0) if winds else wind_arr,
        "timestamps": past_timestamps,
    }

    sliced_times = times[start_idx:end_idx] if times else [f"{h:02d}:00" for h in range(n)]

    meta = {
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "elevation": data.get("elevation"),
        "timezone": data.get("timezone"),
        "timezone_abbreviation": data.get("timezone_abbreviation"),
        "utc_offset_seconds": data.get("utc_offset_seconds"),
        "source": "Open-Meteo Forecast API",
        "hours": sliced_times,
        "start_idx": start_idx,
        "past_hours_count": len(past_weather["ambient"]),
    }

    return ambient_temperature, solar_irradiance, dni_arr, dhi_arr, wind_arr, meta, past_weather


def fetch_weather_sync(
    latitude: float,
    longitude: float,
    timezone: str = "auto",
):
    return asyncio.run(fetch_weather(latitude, longitude, timezone))

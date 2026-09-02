"""
Real weather data fetcher using the free Open-Meteo Forecast API.
Returns temperature, GHI, DNI, DHI for 24 hours.
"""

from __future__ import annotations
import asyncio
import httpx
import numpy as np
from typing import Tuple


FORECAST_URL = "https://api.open-meteo.com/v1/forecast"


async def fetch_weather(
    latitude: float,
    longitude: float,
    timezone: str = "auto",
    max_retries: int = 3,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, dict]:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": (
            "temperature_2m,"
            "shortwave_radiation,"
            "direct_normal_irradiance,"
            "diffuse_radiation"
        ),
        "forecast_days": 2,
        "timezone": timezone,
    }

    last_error = None
    data = None
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(FORECAST_URL, params=params)
                response.raise_for_status()
                data = response.json()
            break
        except (httpx.HTTPStatusError, httpx.RequestError) as e:
            last_error = e
            if attempt < max_retries - 1:
                await asyncio.sleep(1.5 * (attempt + 1))
            else:
                raise last_error

    hourly = data.get("hourly", {})
    temps = hourly.get("temperature_2m", [])
    solar = hourly.get("shortwave_radiation", [])
    dni = hourly.get("direct_normal_irradiance", [])
    dhi = hourly.get("diffuse_radiation", [])
    times = hourly.get("time", [])

    n = 25  # hours 0..24 inclusive → 24 elapsed hours
    if (
        len(temps) < n
        or len(solar) < n
        or len(dni) < n
        or len(dhi) < n
    ):
        raise ValueError(
            "Open-Meteo returned insufficient hourly weather data "
            f"(temp={len(temps)}, ghi={len(solar)}, "
            f"dni={len(dni)}, dhi={len(dhi)}; need {n})."
        )

    ambient_temperature = np.array(temps[:n], dtype=float)
    solar_irradiance = np.nan_to_num(
        np.array(solar[:n], dtype=float), nan=0.0
    )
    dni_arr = np.nan_to_num(np.array(dni[:n], dtype=float), nan=0.0)
    dhi_arr = np.nan_to_num(np.array(dhi[:n], dtype=float), nan=0.0)

    meta = {
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "elevation": data.get("elevation"),
        "timezone": data.get("timezone"),
        "timezone_abbreviation": data.get("timezone_abbreviation"),
        "utc_offset_seconds": data.get("utc_offset_seconds"),
        "source": "Open-Meteo Forecast",
        "hours": times[:n] if times else [f"{h:02d}:00" for h in range(n)],
    }

    return ambient_temperature, solar_irradiance, dni_arr, dhi_arr, meta


def fetch_weather_sync(
    latitude: float,
    longitude: float,
    timezone: str = "auto",
):
    return asyncio.run(fetch_weather(latitude, longitude, timezone))

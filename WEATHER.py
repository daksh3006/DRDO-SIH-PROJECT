"""
Real weather data fetcher using the free Open-Meteo Forecast API.
Always fetches the next 24 hourly values for "today" at the given coordinates.
No API key required.
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
) -> Tuple[np.ndarray, np.ndarray, dict]:
    """
    Fetch 24-hour hourly temperature and solar irradiance for today.

    Returns
    -------
    ambient_temperature : np.ndarray shape (24,)
    solar_irradiance    : np.ndarray shape (24,)
    meta                : dict
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "temperature_2m,shortwave_radiation",
        "forecast_days": 1,
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
    times = hourly.get("time", [])

    if len(temps) < 24 or len(solar) < 24:
        raise ValueError(
            f"Open-Meteo returned insufficient hourly data "
            f"(temp={len(temps)}, solar={len(solar)})."
        )

    ambient_temperature = np.array(temps[:24], dtype=float)
    solar_irradiance = np.array(solar[:24], dtype=float)
    solar_irradiance = np.nan_to_num(solar_irradiance, nan=0.0)

    meta = {
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "elevation": data.get("elevation"),
        "timezone": data.get("timezone"),
        "timezone_abbreviation": data.get("timezone_abbreviation"),
        "source": "Open-Meteo Forecast",
        "hours": times[:24] if times else [f"{h:02d}:00" for h in range(24)],
    }

    return ambient_temperature, solar_irradiance, meta


def fetch_weather_sync(
    latitude: float,
    longitude: float,
    timezone: str = "auto",
) -> Tuple[np.ndarray, np.ndarray, dict]:
    return asyncio.run(fetch_weather(latitude, longitude, timezone))

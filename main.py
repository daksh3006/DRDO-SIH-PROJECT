"""
FastAPI backend for the Area-Specific Passive Shelter Thermal Simulator.
"""

from __future__ import annotations
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import httpx

from thermal_model import simulate_shelter
from WEATHER import fetch_weather

app = FastAPI(
    title="Thermal Shelter Simulator",
    description="24-hour passive shelter thermal comfort simulation",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

COMFORT_MIN = 16.0
COMFORT_MAX = 26.0


class SimulationRequest(BaseModel):
    location: str = "Leh, Ladakh"
    city: Optional[str] = None
    state: Optional[str] = None
    latitude: float = Field(..., description="Latitude in decimal degrees")
    longitude: float = Field(..., description="Longitude in decimal degrees")

    wall_area: float = Field(..., gt=0)
    roof_area: float = Field(..., gt=0)
    window_area: float = Field(..., ge=0)
    wall_thickness: float = Field(..., gt=0)
    roof_thickness: float = Field(..., gt=0)

    wall_material: str
    roof_material: str

    thermal_capacity: float = Field(..., gt=0)
    initial_temperature: Optional[float] = None

    orientation: Optional[str] = "South"
    shelter_height: float = Field(2.5, gt=0)


@app.get("/api/health")
@app.get("/health")
def health():
    return {"status": "ok", "version": "3.0.0"}


@app.get("/api/geocode")
@app.get("/geocode")
async def reverse_geocode(
    lat: float = Query(...),
    lon: float = Query(...),
):
    try:
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {
            "lat": lat,
            "lon": lon,
            "format": "json",
            "zoom": 10,
            "addressdetails": 1,
        }
        headers = {
            "User-Agent": "DRDO-SIH-ShelterSimulator/3.0 (educational project)"
        }
        async with httpx.AsyncClient(timeout=12.0) as client:
            r = await client.get(url, params=params, headers=headers)
            r.raise_for_status()
            data = r.json()

        address = data.get("address") or {}
        city = (
            address.get("city")
            or address.get("town")
            or address.get("village")
            or address.get("hamlet")
            or address.get("suburb")
            or address.get("county")
            or ""
        )
        state = (
            address.get("state")
            or address.get("region")
            or address.get("state_district")
            or ""
        )
        country = address.get("country") or ""
        display = data.get("display_name") or ", ".join(
            p for p in [city, state, country] if p
        )
        return {
            "city": city,
            "state": state,
            "country": country,
            "display_name": display,
            "latitude": lat,
            "longitude": lon,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail=f"Reverse geocoding failed: {exc}"
        )


@app.post("/api/simulate")
@app.post("/simulate")
async def simulate(request: SimulationRequest):
    try:
        try:
            ambient, solar, dni, dhi, weather_meta = await fetch_weather(
                latitude=request.latitude,
                longitude=request.longitude,
            )
        except Exception as weather_err:
            raise HTTPException(
                status_code=502,
                detail=f"Failed to fetch weather data: {weather_err}",
            )

        hour_timestamps = weather_meta.get("hours") or None
        # Open-Meteo returns timezone name; offset not always numeric — leave None
        # unless present in meta later.
        utc_offset_hours = weather_meta.get("utc_offset_seconds")
        if utc_offset_hours is not None:
            try:
                utc_offset_hours = float(utc_offset_hours) / 3600.0
            except Exception:
                utc_offset_hours = None

        (
            hours,
            indoor_temperature,
            heat_loss,
            solar_gain,
        ) = simulate_shelter(
            wall_area=request.wall_area,
            roof_area=request.roof_area,
            window_area=request.window_area,
            wall_thickness=request.wall_thickness,
            roof_thickness=request.roof_thickness,
            wall_material=request.wall_material,
            roof_material=request.roof_material,
            ambient_temperature=ambient,
            solar_irradiance=solar,
            thermal_capacity=request.thermal_capacity,
            initial_temperature=request.initial_temperature,
            latitude=request.latitude,
            longitude=request.longitude,
            orientation=request.orientation or "South",
            dni=dni,
            dhi=dhi,
            shelter_height=request.shelter_height,
            hour_timestamps=hour_timestamps,
            utc_offset_hours=utc_offset_hours,
        )

        hours = hours.tolist()
        indoor_temperature = [round(float(t), 2) for t in indoor_temperature]
        ambient_list = [round(float(t), 2) for t in ambient]
        heat_loss = [round(float(h), 1) for h in heat_loss]
        solar_gain = [round(float(s), 1) for s in solar_gain]

        comfort_status = []
        for t in indoor_temperature:
            if COMFORT_MIN <= t <= COMFORT_MAX:
                comfort_status.append("comfortable")
            elif t < COMFORT_MIN:
                comfort_status.append("too_cold")
            else:
                comfort_status.append("too_hot")

        avg_t = sum(indoor_temperature) / len(indoor_temperature)
        total_solar_kwh = sum(solar_gain) * 3600.0 / 3_600_000.0
        total_heat_loss_kwh = sum(heat_loss) * 3600.0 / 3_600_000.0

        summary = {
            "average_temperature": round(avg_t, 1),
            "minimum_temperature": round(min(indoor_temperature), 1),
            "maximum_temperature": round(max(indoor_temperature), 1),
            "total_solar_gain": round(total_solar_kwh, 2),  # indoor (window) solar gain kWh
            "total_heat_loss": round(total_heat_loss_kwh, 2),
            "total_solar_gain_kwh": round(total_solar_kwh, 2),
            "total_heat_loss_kwh": round(total_heat_loss_kwh, 2),
            "indoor_solar_gain_kwh": round(total_solar_kwh, 2),
            "comfort_hours": comfort_status.count("comfortable"),
            "ambient_min": round(min(ambient_list), 1),
            "ambient_max": round(max(ambient_list), 1),
            "ambient_avg": round(sum(ambient_list) / len(ambient_list), 1),
        }

        return {
            "hours": hours,
            "ambient_temperature": ambient_list,
            "indoor_temperature": indoor_temperature,
            "solar_gain": solar_gain,
            "heat_loss": heat_loss,
            "comfort_status": comfort_status,
            "summary": summary,
            "weather_meta": weather_meta,
            "initial_temperature": request.initial_temperature
            if request.initial_temperature is not None
            else ambient_list[0],
            "location_used": {
                "name": request.location,
                "city": request.city,
                "state": request.state,
                "latitude": request.latitude,
                "longitude": request.longitude,
            },
        }

    except KeyError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

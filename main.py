"""
FastAPI backend for THERMA CORE - Area-Specific Passive Shelter Thermal Simulator.
"""

from __future__ import annotations

import logging
from typing import Optional

import httpx
import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

from thermal_model import run_validation_experiment, simulate_shelter
from WEATHER import fetch_weather

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("thermal_sim")

app = FastAPI(
    title="THERMA CORE - Passive Shelter Thermal Simulation Engine",
    description="Reduced-order 2-node transient passive shelter thermal simulation platform.",
    version="3.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SimulationRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    location: str = "Custom Location"
    city: str = ""
    state: str = ""

    wall_area: float = Field(..., gt=0.0, description="Gross wall area in m²")
    roof_area: float = Field(..., gt=0.0, description="Roof area in m²")
    window_area: float = Field(..., ge=0.0, description="Window / opening area in m²")
    wall_thickness: float = Field(..., ge=0.03, le=1.5, description="Wall thickness in m (0.03-1.5m)")
    roof_thickness: float = Field(..., ge=0.03, le=1.5, description="Roof thickness in m (0.03-1.5m)")

    wall_material: str
    roof_material: str
    window_type: Optional[str] = "double_glazing"

    thermal_capacity: float = Field(..., gt=0.0)
    initial_temperature: Optional[float] = Field(None, ge=-50.0, le=60.0)

    orientation: Optional[str] = "South"
    shelter_height: float = Field(2.5, gt=0.0)
    roof_pitch: float = Field(15.0, ge=0.0, le=90.0, description="Roof pitch/tilt angle in degrees")
    spin_up: bool = True

    comfort_min: float = Field(16.0, description="User defined minimum comfort temperature in °C")
    comfort_max: float = Field(26.0, description="User defined maximum comfort temperature in °C")

    @model_validator(mode="after")
    def validate_physical_limits(self) -> SimulationRequest:
        max_window_area = 0.85 * self.wall_area
        if self.window_area > max_window_area:
            raise ValueError(
                f"Window area ({self.window_area:.2f} m²) cannot exceed 85% of gross wall area "
                f"({max_window_area:.2f} m²)."
            )
        if self.comfort_min >= self.comfort_max:
            raise ValueError(
                f"Min comfort temperature ({self.comfort_min}°C) must be less than max comfort temperature ({self.comfort_max}°C)."
            )
        return self


class SensitivityRequest(SimulationRequest):
    sweep_variable: str = Field("wall_thickness", description="Variable to sweep: wall_thickness, roof_thickness, window_area")


@app.get("/api/health")
@app.get("/health")
def health():
    return {"status": "ok", "version": "3.2.0"}


@app.get("/api/validate")
@app.get("/validate")
def validate_model():
    """Returns a synthetic reference case for model verification."""
    try:
        return run_validation_experiment()
    except Exception as exc:
        logger.error(f"Validation experiment error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to run model verification suite.")


@app.get("/api/geocode")
@app.get("/geocode")
async def reverse_geocode(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0),
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
            "User-Agent": "DRDO-SIH-ShelterSimulator/3.2 (educational project)"
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
        logger.error(f"Geocoding error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=502, detail="Reverse geocoding service currently unavailable."
        )


@app.post("/api/simulate")
@app.post("/simulate")
async def simulate(request: SimulationRequest):
    try:
        try:
            ambient, solar, dni, dhi, wind, weather_meta, past_weather = await fetch_weather(
                latitude=request.latitude,
                longitude=request.longitude,
            )
        except Exception as weather_err:
            logger.error(f"Weather API error: {weather_err}", exc_info=True)
            raise HTTPException(
                status_code=502,
                detail=f"Failed to fetch weather data: {weather_err}",
            )

        hour_timestamps = weather_meta.get("hours") or None
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
            breakdown_his,
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
            window_type=request.window_type,
            roof_pitch=request.roof_pitch,
            spin_up=request.spin_up,
            past_weather=past_weather,
            dni=dni,
            dhi=dhi,
            wind_speed=wind,
            shelter_height=request.shelter_height,
            hour_timestamps=hour_timestamps,
            utc_offset_hours=utc_offset_hours,
        )

        elapsed_indoor = indoor_temperature[1:]
        elapsed_ambient = ambient[1:]
        elapsed_loss = heat_loss[1:]
        elapsed_gain = solar_gain[1:]

        c_min = request.comfort_min
        c_max = request.comfort_max

        comfort_hours_count = sum(
            1 for t in elapsed_indoor if c_min <= t <= c_max
        )
        comfort_status = [
            "comfortable" if c_min <= t <= c_max else ("too_cold" if t < c_min else "too_hot")
            for t in elapsed_indoor
        ]

        total_loss_kwh = sum(elapsed_loss) * 3600.0 / 3_600_000.0
        total_gain_kwh = sum(elapsed_gain) * 3600.0 / 3_600_000.0

        return {
            "time_series": {
                "hours": hours[1:].tolist(),
                "timestamps": (hour_timestamps[1:] if hour_timestamps and len(hour_timestamps) >= len(hours) else hours[1:].tolist()),
                "indoor_temperature": [round(float(t), 1) for t in elapsed_indoor],
                "ambient_temperature": [round(float(t), 1) for t in elapsed_ambient],
                "solar_gain": [round(float(g), 1) for g in elapsed_gain],
                "heat_loss": [round(float(l), 1) for l in elapsed_loss],
                "comfort_status": comfort_status,
            },
            "summary": {
                "average_temperature": round(float(np.mean(elapsed_indoor)), 1),
                "minimum_temperature": round(float(np.min(elapsed_indoor)), 1),
                "maximum_temperature": round(float(np.max(elapsed_indoor)), 1),
                "comfort_hours": comfort_hours_count,
                "comfort_min": c_min,
                "comfort_max": c_max,
                "outward_heat_transfer_kwh": round(total_loss_kwh, 2),
                "total_solar_gain_kwh": round(total_gain_kwh, 2),
                "ambient_min": round(float(np.min(elapsed_ambient)), 1),
                "ambient_max": round(float(np.max(elapsed_ambient)), 1),
                "ambient_avg": round(float(np.mean(elapsed_ambient)), 1),
            },
            "weather_meta": weather_meta,
            "location_used": {
                "name": request.location,
                "city": request.city,
                "state": request.state,
                "latitude": request.latitude,
                "longitude": request.longitude,
            },
        }

    except ValueError as exc:
        logger.warning(f"Validation error: {exc}")
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.error(f"Internal simulation error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal simulation error occurred.")


@app.post("/api/sensitivity")
@app.post("/sensitivity")
async def parametric_sensitivity(request: SensitivityRequest):
    """Runs a 5-step parametric sensitivity sweep over the selected design variable."""
    try:
        ambient, solar, dni, dhi, wind, weather_meta, past_weather = await fetch_weather(
            latitude=request.latitude,
            longitude=request.longitude,
        )
        var = request.sweep_variable

        max_allowed_window = round(request.wall_area * 0.85, 1)
        raw_win_steps = [2.0, 4.0, 8.0, 12.0, 16.0, 24.0]
        valid_win_steps = sorted(list(set([round(min(v, max_allowed_window), 1) for v in raw_win_steps if v <= max_allowed_window or v == raw_win_steps[0]])))

        ranges = {
            "wall_thickness": [0.10, 0.20, 0.35, 0.50, 0.70],
            "roof_thickness": [0.05, 0.15, 0.25, 0.35, 0.50],
            "window_area": valid_win_steps,
        }

        sweep_values = ranges.get(var, ranges["wall_thickness"])
        results = []

        c_min = request.comfort_min
        c_max = request.comfort_max

        for val in sweep_values:
            params_dict = request.model_dump()
            params_dict[var] = val

            (
                hours,
                indoor_temp,
                heat_loss,
                solar_gain,
                _,
            ) = simulate_shelter(
                wall_area=params_dict["wall_area"],
                roof_area=params_dict["roof_area"],
                window_area=params_dict["window_area"],
                wall_thickness=params_dict["wall_thickness"],
                roof_thickness=params_dict["roof_thickness"],
                wall_material=params_dict["wall_material"],
                roof_material=params_dict["roof_material"],
                ambient_temperature=ambient,
                solar_irradiance=solar,
                thermal_capacity=params_dict["thermal_capacity"],
                initial_temperature=params_dict["initial_temperature"],
                latitude=params_dict["latitude"],
                longitude=params_dict["longitude"],
                orientation=params_dict["orientation"],
                window_type=params_dict["window_type"],
                spin_up=params_dict["spin_up"],
                dni=dni,
                dhi=dhi,
                wind_speed=wind,
                shelter_height=params_dict["shelter_height"],
            )

            elapsed_indoor = indoor_temp[1:]
            elapsed_loss = heat_loss[1:]
            comfort_c = sum(1 for t in elapsed_indoor if c_min <= t <= c_max)
            total_loss_kwh = sum(elapsed_loss) * 3600.0 / 3_600_000.0

            results.append({
                "value": val,
                "label": f"{val} {'m' if 'thickness' in var else 'm²'}",
                "average_temp": round(float(np.mean(elapsed_indoor)), 1),
                "min_temp": round(float(np.min(elapsed_indoor)), 1),
                "max_temp": round(float(np.max(elapsed_indoor)), 1),
                "comfort_hours": comfort_c,
                "outward_heat_transfer_kwh": round(total_loss_kwh, 2),
            })

        return {
            "sweep_variable": var,
            "variable_name": var.replace("_", " ").title(),
            "sweep_results": results,
        }

    except Exception as exc:
        logger.error(f"Sensitivity analysis error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to run parametric sensitivity analysis.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

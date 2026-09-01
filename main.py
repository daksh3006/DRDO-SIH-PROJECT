"""
FastAPI backend for the Area-Specific Passive Shelter Thermal Simulator.
Fetches today's real weather from Open-Meteo and runs the energy-balance model.
"""

from __future__ import annotations
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

from thermal_model import simulate_shelter
from WEATHER import fetch_weather

app = FastAPI(
    title="Thermal Shelter Simulator",
    description="24-hour passive shelter thermal comfort simulation with today's live weather",
    version="2.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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

    thermal_capacity: float = Field(150000.0, gt=1000)
    initial_temperature: Optional[float] = None

    orientation: Optional[str] = "South"


@app.get("/api/health")
@app.get("/health")
def health():
    return {"status": "ok", "version": "2.2.0"}


@app.post("/api/simulate")
@app.post("/simulate")
async def simulate(request: SimulationRequest):
    try:
        # 1. Fetch today's weather for the given coordinates
        try:
            ambient, solar, weather_meta = await fetch_weather(
                latitude=request.latitude,
                longitude=request.longitude,
            )
        except Exception as weather_err:
            raise HTTPException(
                status_code=502,
                detail=f"Failed to fetch weather data: {weather_err}",
            )

        # 2. Run thermal simulation (indoor starts from ambient[0])
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
        )

        hours = hours.tolist()
        indoor_temperature = [round(float(t), 2) for t in indoor_temperature]
        ambient_list = [round(float(t), 2) for t in ambient]
        heat_loss = [round(float(h), 1) for h in heat_loss]
        solar_gain = [round(float(s), 1) for s in solar_gain]

        comfort_status = []
        for t in indoor_temperature:
            if 16 <= t <= 26:
                comfort_status.append("comfortable")
            elif t < 16:
                comfort_status.append("too_cold")
            else:
                comfort_status.append("too_hot")

        avg_t = sum(indoor_temperature) / len(indoor_temperature)
        summary = {
            "average_temperature": round(avg_t, 1),
            "minimum_temperature": round(min(indoor_temperature), 1),
            "maximum_temperature": round(max(indoor_temperature), 1),
            "total_solar_gain": round(sum(solar_gain) * 3600 / 3_600_000, 2),
            "total_heat_loss": round(sum(heat_loss) * 3600 / 3_600_000, 2),
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
            "comfort_temperature": request.initial_temperature if request.initial_temperature is not None else 30,
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

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

from thermal_model import simulate_shelter


app = FastAPI(title="Thermal Shelter Simulator")


class SimulationRequest(BaseModel):
    location: str = "Leh"

    wall_area: float
    roof_area: float
    window_area: float

    wall_thickness: float
    roof_thickness: float

    wall_material: str
    roof_material: str

    thermal_capacity: float = 100000.0
    initial_temperature: Optional[float] = None


@app.get("/api/health")
def health_check():
    return {
        "status": "ok"
    }


@app.post("/api/simulate")
def simulate(request: SimulationRequest):

    try:
        (
            hours,
            indoor_temperature,
            heat_loss,
            solar_gain
        ) = simulate_shelter(
            wall_area=request.wall_area,
            roof_area=request.roof_area,
            window_area=request.window_area,
            wall_thickness=request.wall_thickness,
            roof_thickness=request.roof_thickness,
            wall_material=request.wall_material,
            roof_material=request.roof_material,
            thermal_capacity=request.thermal_capacity,
            initial_temperature=request.initial_temperature
        )

        # Convert NumPy arrays to normal Python lists
        hours = hours.tolist()
        indoor_temperature = indoor_temperature.tolist()
        heat_loss = heat_loss.tolist()
        solar_gain = solar_gain.tolist()

        # Ambient data comes from WEATHER.py
        from WEATHER import AMBIENT_TEMPERATURE

        ambient_temperature = AMBIENT_TEMPERATURE.tolist()

        # Comfort calculation
        comfort_status = []

        for temperature in indoor_temperature:
            if 16 <= temperature <= 26:
                comfort_status.append("comfortable")
            elif temperature < 16:
                comfort_status.append("too_cold")
            else:
                comfort_status.append("too_hot")

        # Summary
        average_temperature = sum(indoor_temperature) / len(indoor_temperature)

        summary = {
            "average_temperature": round(average_temperature, 1),
            "minimum_temperature": round(min(indoor_temperature), 1),
            "maximum_temperature": round(max(indoor_temperature), 1),

            "total_solar_gain": round(
                sum(solar_gain) * 3600 / 3_600_000,
                2
            ),

            "total_heat_loss": round(
                sum(heat_loss) * 3600 / 3_600_000,
                2
            ),

            "comfort_hours": comfort_status.count("comfortable")
        }

        return {
            "hours": hours,
            "ambient_temperature": ambient_temperature,
            "indoor_temperature": indoor_temperature,
            "solar_gain": solar_gain,
            "heat_loss": heat_loss,
            "comfort_status": comfort_status,
            "summary": summary
        }

    except KeyError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown material: {exc}"
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc)
        )
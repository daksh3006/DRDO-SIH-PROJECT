# Thermal Shelter Simulator

**Area-Specific Passive Shelter Thermal Comfort & Engineering Analysis Platform**  
SIH Prototype – High-Altitude Passive Thermal Simulation & Model Verification

A professional engineering platform for simulating and analyzing passive thermal performance of shelters in high-altitude cold climates (e.g., Leh, Ladakh).

> **Core Project Statement**: The Thermal Shelter Simulator is a reduced-order 2-node transient thermal simulation platform that uses location-specific weather data to predict 24-hour shelter thermal behaviour and compare passive shelter designs. The current prototype performs model verification against synthetic reference scenarios and has not yet been experimentally validated using measured shelter temperature data.

---

## Technical Features & Physics Core

1. **Reduced-Order 2-Node Transient Thermal Model**: Building envelope thermal mass node ($T_{\text{env}}$, $C_{\text{env}}$) and indoor air + contents node ($T_{\text{in}}$, $C_{\text{indoor}}$) coupled via surface resistances ($R_{\text{si}}$, $R_{\text{se}}$).
2. **3-Day Historical Weather Spin-Up**: Ingests preceding 72 hours of Open-Meteo climate history (temperature, solar radiation, wind speed) to establish true periodic thermal mass equilibrium prior to the 24-hour simulation window.
3. **Estimated Ground Temperature Boundary**: Continuous floor slab coupling ($H_{\text{ground}} = A_{\text{floor}} \cdot U_{\text{floor}}$) with $T_{\text{ground}} = T_{\text{mean}} - 2.0\text{K}$.
4. **Simplified Pitched Roof Solar Irradiance Model**: Tilt-angle solar irradiance calculation for roof surfaces ($\beta = 15^\circ$) combining direct beam, sky diffuse, and ground-reflected radiation.
5. **Effective Sky Temperature Approximation**: Nocturnal sky radiation exchange using $T_{\text{sky}} = T_{\text{out}} - 12.0\text{K}$.
6. **Configurable Weighted Engineering Score**: Multi-criteria weighted evaluation balancing comfort hours ($16\text{–}26^\circ\text{C}$), cold-climate minimum temperature maintenance, diurnal thermal stability, and heat loss reduction, with user-configurable weighting controls and presets.
7. **Parametric Sensitivity Analysis**: Single-parameter sweeps over wall thickness, roof thickness, ACH, window area, and occupant loads to quantify thermal sensitivities.

---

## Quick Start

### 1. Start Python FastAPI Backend

```bash
uvicorn main:app --reload --port 8000
# or python main.py
```

### 2. Start React Frontend

```bash
cd shelter-sim
npm install
npm run dev
```

Open http://localhost:5173

---

## Backend Integration & API Endpoints

### 1. Simulation Endpoint: `POST /api/simulate`
Computes the 24-hour transient thermal response for given shelter geometry, materials, roof pitch, and location.

### 2. Synthetic Reference Case Endpoint: `GET /api/validate`
Returns a synthetic reference case for model verification comparing 2-node simulation predictions against predefined synthetic reference benchmark trajectories.

### 3. Parametric Sensitivity Endpoint: `POST /api/sensitivity`
Runs a 5-step parametric sweep across design variables (`wall_thickness`, `roof_thickness`, `ach`, `window_area`, `occupants`) to quantify trade-offs in comfort hours, minimum temperature, and heat transfer.

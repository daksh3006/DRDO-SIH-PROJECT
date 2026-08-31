# Thermal Shelter Simulator

**Area-Specific Passive Shelter Thermal Comfort Simulator**  
SIH (Smart India Hackathon) Prototype – Frontend

A professional engineering-style web application for simulating passive thermal performance of shelters in high-altitude cold climates (e.g. Ladakh).

## Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React
- **Backend** (separate): Python + FastAPI wrapping existing `simulate_shelter(...)`

## Quick Start

```bash
cd shelter-sim
npm install
npm run dev
```

Open http://localhost:5173

## Project Structure

```
src/
  components/
    Header.jsx           # Top bar with Run / Reset / status
    Sidebar.jsx          # Input panel (location, geometry, materials, thermal)
    MaterialSelector.jsx # Wall & roof material dropdowns + properties
    SummaryCards.jsx     # KPI row after simulation
    TemperatureChart.jsx # Indoor vs Ambient line chart
    EnergyChart.jsx      # Solar gain vs heat loss area chart
    ComfortCard.jsx      # Comfort hours breakdown
    ShelterDiagram.jsx   # Conceptual energy-flow diagram
    DesignComparison.jsx # Side-by-side design comparison table
  pages/
    Dashboard.jsx        # Main orchestration page
  services/
    api.js               # API client + mock fallback
  data/
    materials.js         # Material library & default params
  App.jsx
  index.css
  main.jsx
```

## Backend Integration

### API Endpoint

```
POST /simulate
```

### Request body (matches existing Python function)

```json
{
  "location": "Leh",
  "wall_area": 120,
  "roof_area": 80,
  "window_area": 12,
  "wall_thickness": 0.35,
  "roof_thickness": 0.25,
  "wall_material": "brick",
  "roof_material": "insulated_panel",
  "thermal_capacity": 150000,
  "initial_temperature": 15
}
```

### Expected response

```json
{
  "hours": [0, 1, ..., 23],
  "ambient_temperature": [...],
  "indoor_temperature": [...],
  "solar_gain": [...],
  "heat_loss": [...],
  "comfort_status": ["too_cold", "comfortable", ...],
  "summary": {
    "average_temperature": 18.4,
    "minimum_temperature": 8.2,
    "maximum_temperature": 25.1,
    "total_solar_gain": 12450,
    "total_heat_loss": 8320,
    "comfort_hours": 17
  }
}
```

### Changing the API URL

1. **Development (recommended)**  
   Vite proxies `/api/*` → `http://localhost:8000/*`  
   (see `vite.config.js`)

2. **Environment variable**  
   Create `.env`:
   ```
   VITE_API_URL=http://your-backend-host:8000
   ```
   Then restart `npm run dev`.

3. **Code location**  
   `src/services/api.js` → `API_BASE_URL`

### Health check (optional but recommended)

Backend should expose:

```
GET /health  →  200 OK
```

Frontend polls this to show "Backend Online" vs "Demo Mode (Mock)".

## Demo Mode

If the backend is unreachable, the UI automatically falls back to a realistic mock simulation so the SIH demo never breaks. A clear banner indicates demo mode.

## Default Location

Pre-filled for **Leh, Ladakh** (34.15°N, 77.58°E) – high-altitude cold climate representative of the problem statement.

## Notes for Judges / Evaluators

- All thermal physics remain in the Python backend (`simulate_shelter`).
- Frontend only collects design parameters and visualizes the returned time-series.
- Material properties shown in the UI are for user feedback; the backend MATERIALS.py is the source of truth for calculations.
- Design Comparison lets you save multiple runs and highlight the configuration with the most comfort hours.

import { X, BookOpen, Layers, Wind, Sun, Thermometer, ShieldCheck, History, AlertTriangle } from 'lucide-react';

export default function AssumptionsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl my-8 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#C1E7FF] bg-[#F0F7FF] px-6 py-4 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#0284C7]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Model Assumptions & Engineering Basis
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 px-6 py-5 text-xs leading-relaxed text-slate-700 max-h-[75vh] overflow-y-auto font-medium">
          {/* Core Project Statement */}
          <div className="rounded-xl border border-[#90CDF4] bg-[#C1E7FF]/40 p-4 text-slate-800">
            <div className="flex items-center gap-2 font-bold text-xs mb-1.5 text-[#0369A1]">
              <ShieldCheck className="h-4 w-4 text-[#0284C7]" />
              <span>Reduced-Order 2-Node Transient Thermal Model Scope</span>
            </div>
            <p className="leading-relaxed">
              The THERMA CORE platform is a reduced-order 2-node transient thermal simulation platform that uses location-specific weather data to predict 24-hour shelter thermal behaviour and compare passive shelter designs. The current prototype performs model verification against synthetic reference scenarios and has not yet been experimentally validated using measured shelter temperature data.
            </p>
          </div>

          {/* Dedicated Prototype Limitations Box */}
          <div className="rounded-xl border border-[#FDBA74] bg-[#FED8A7]/40 p-4 space-y-2 text-amber-950">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              Current Prototype Limitations
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs text-amber-950 font-medium list-disc list-inside">
              <li>Reduced-order 2-node thermal model</li>
              <li>Effective sky-temperature approximation (T_sky = T_out - 12°C)</li>
              <li>Simplified pitched-roof solar irradiance model</li>
              <li>No experimental sensor validation yet</li>
              <li>Thermal bridges and moisture/condensation not modeled</li>
              <li>Lumped air node assumes uniform indoor mixing</li>
            </ul>
          </div>

          {/* 1. Lumped Mass Network */}
          <div className="space-y-1.5 border-b border-slate-100 pb-4">
            <h3 className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              <Layers className="h-4 w-4 text-[#0284C7]" />
              1. Reduced-Order 2-Node Transient Thermal Model
            </h3>
            <p className="text-slate-600">
              We use a reduced-order 2-node transient thermal model for fast 24-hour simulation to enable rapid comparison of alternative shelter configurations:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
              <li><strong className="text-slate-900">Envelope Node (T_env)</strong>: Aggregated heat capacity of external walls and roof (C_env = ρ · c · V_envelope).</li>
              <li><strong className="text-slate-900">Indoor Air Node (T_in)</strong>: Aggregated indoor air volume plus internal contents (C_indoor = C_air + C_contents).</li>
              <li><strong className="text-slate-900">Surface Resistance</strong>: Standard indoor film resistance R_si = 0.13 m²K/W; dynamic exterior film resistance R_se = 1 / h_e.</li>
            </ul>
          </div>

          {/* 2. Multi-Day Spin-up */}
          <div className="space-y-1.5 border-b border-slate-100 pb-4">
            <h3 className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              <History className="h-4 w-4 text-indigo-600" />
              2. 3-Day Historical Weather Thermal Spin-Up
            </h3>
            <p className="text-slate-600">
              Initial thermal state is established via actual climate history preceding the 24-hour simulation window:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
              <li><strong className="text-slate-900">Climate History Ingestion</strong>: Fetches preceding 72 hours of Open-Meteo hourly weather history (temperature, solar radiation, wind speed).</li>
              <li><strong className="text-slate-900">Thermal Mass Spin-Up</strong>: Solves 72 continuous ODE steps prior to t=0 so envelope and indoor nodes reach realistic periodic thermal mass equilibrium.</li>
            </ul>
          </div>

          {/* 3. Estimated Ground Boundary */}
          <div className="space-y-1.5 border-b border-slate-100 pb-4">
            <h3 className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              <Thermometer className="h-4 w-4 text-[#0369A1]" />
              3. Estimated Ground Temperature Boundary
            </h3>
            <p className="text-slate-600">
              Floor slab coupled continuously to deep ground soil:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
              <li><strong className="text-slate-900">Ground Conductance</strong>: H_ground = A_floor · U_floor (default U_floor = 1.5 W/m²K).</li>
              <li><strong className="text-slate-900">Estimated Ground Temperature</strong>: Approximated from annual mean outdoor temperature (T_ground = T_mean - 2.0°C).</li>
            </ul>
          </div>

          {/* 4. Pitched Roof Solar Model */}
          <div className="space-y-1.5 border-b border-slate-100 pb-4">
            <h3 className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              <Sun className="h-4 w-4 text-[#D97706]" />
              4. Simplified Pitched-Roof Solar Irradiance Model
            </h3>
            <p className="text-slate-600">
              Solar irradiance on pitched roof surface (pitch angle β, default 15°):
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
              <li><strong className="text-slate-900">Roof Tilt Correction</strong>: G_roof = GHI · cos(β) + GHI · albedo · 0.5 · (1 - cos(β)).</li>
              <li><strong className="text-slate-900">Vertical Facades</strong>: Beam, diffuse, and ground-reflected decomposition based on facade orientation and solar position.</li>
            </ul>
          </div>

          {/* 5. Effective Sky Temperature */}
          <div className="space-y-1.5">
            <h3 className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              <Wind className="h-4 w-4 text-emerald-600" />
              5. Effective Sky Temperature Approximation & Convection
            </h3>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
              <li><strong className="text-slate-900">Effective Sky Temperature Approximation</strong>: T_sky = T_out - 12.0°C.</li>
              <li><strong className="text-slate-900">Exterior Convection Coefficient</strong>: h_e = 5.8 + 3.8 · v_wind (W/m²K) (McAdams correlation).</li>
              <li><strong className="text-slate-900">Material Data Sources</strong>: Standard datasheets from EN ISO 6946 and ASHRAE Fundamentals.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-[#F0F7FF] px-6 py-3 text-right rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#0284C7] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#0369A1] shadow-2xs transition-all"
          >
            Close Assumptions Panel
          </button>
        </div>
      </div>
    </div>
  );
}

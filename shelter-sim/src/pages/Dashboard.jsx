import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import SummaryCards from '../components/SummaryCards';
import TemperatureChart from '../components/TemperatureChart';
import EnergyChart from '../components/EnergyChart';
import ComfortCard from '../components/ComfortCard';
import ShelterDiagram from '../components/ShelterDiagram';
import DesignComparison from '../components/DesignComparison';
import { DEFAULT_PARAMS } from '../data/materials';
import {
  runSimulation,
  checkBackendStatus,
  generateMockResults,
} from '../services/api';
import { AlertTriangle, FlaskConical } from 'lucide-react';

export default function Dashboard() {
  const [params, setParams] = useState({ ...DEFAULT_PARAMS });
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [designs, setDesigns] = useState([]);
  const [designCounter, setDesignCounter] = useState(1);

  // Check backend on mount
  useEffect(() => {
    let mounted = true;
    checkBackendStatus().then((ok) => {
      if (mounted) setBackendOnline(ok);
    });
    const interval = setInterval(() => {
      checkBackendStatus().then((ok) => {
        if (mounted) setBackendOnline(ok);
      });
    }, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setError(null);

    try {
      let data;
      if (backendOnline) {
        data = await runSimulation(params);
      } else {
        // Simulate network delay for realism in demo
        await new Promise((r) => setTimeout(r, 900));
        data = generateMockResults(params);
      }
      setResults(data);
    } catch (err) {
      console.error(err);
      // Fallback to mock so demo never breaks
      setError(
        err.message || 'Backend unavailable — showing offline mock results'
      );
      const mock = generateMockResults(params);
      setResults(mock);
    } finally {
      setIsRunning(false);
    }
  }, [params, backendOnline]);

  const handleReset = () => {
    setParams({ ...DEFAULT_PARAMS });
    setResults(null);
    setError(null);
  };

  const handleAddDesign = () => {
    if (!results) return;
    const label = `Design ${String.fromCharCode(64 + designCounter)}`;
    setDesigns((prev) => [
      ...prev,
      {
        id: Date.now(),
        label,
        params: { ...params },
        summary: { ...results.summary },
      },
    ]);
    setDesignCounter((c) => c + 1);
  };

  const handleRemoveDesign = (id) => {
    setDesigns((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-925 text-slate-200">
      <Header
        location={params.location}
        backendOnline={backendOnline}
        isRunning={isRunning}
        onRun={handleRun}
        onReset={handleReset}
      />

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="hidden w-72 shrink-0 lg:block xl:w-80">
          <Sidebar
            params={params}
            onChange={setParams}
            weatherInfo={
              results
                ? {
                    ambient_min: results.summary?.ambient_min,
                    ambient_max: results.summary?.ambient_max,
                    ambient_avg: results.summary?.ambient_avg,
                    source: results.weather_meta?.source,
                    date_used: results.weather_meta?.date_used || results.location_used?.date,
                  }
                : null
            }
          />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4">
          {/* Mobile params notice */}
          <div className="mb-3 rounded-md border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-400 lg:hidden">
            Adjust parameters in a larger viewport or expand the input panel
            (desktop recommended for full engineering workflow).
          </div>

          {/* Error / mock banner */}
          {error && (
            <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {results?._mock && !error && (
            <div className="mb-3 flex items-start gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
              <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Demo mode — results generated locally. Connect FastAPI backend
                at <code className="text-cyan-300">/api/simulate</code> for live
                physics.
              </span>
            </div>
          )}

          {/* Empty state */}
          {!results && !isRunning && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/30">
                <FlaskConical className="h-8 w-8 text-cyan-400" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-slate-100">
                Ready to Simulate
              </h2>
              <p className="mb-6 max-w-md text-sm text-slate-400">
                Enter shelter geometry, materials and thermal parameters on the
                left, then click <strong className="text-cyan-300">Run Simulation</strong>{' '}
                to predict 24-hour indoor temperature and comfort for your
                climate.
              </p>
              <button
                type="button"
                onClick={handleRun}
                className="rounded-md bg-cyan-600 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
              >
                Run Simulation
              </button>
            </div>
          )}

          {/* Loading */}
          {isRunning && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-900/40 px-6 py-20">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
              <p className="text-sm font-medium text-slate-300">
                Running thermal simulation…
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Solving energy balance for 24-hour period
              </p>
            </div>
          )}

          {/* Results */}
          {results && !isRunning && (
            <div className="space-y-4">
              <SummaryCards summary={results.summary} />

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <TemperatureChart results={results} />
                </div>
                <div className="space-y-4">
                  <ComfortCard results={results} />
                  <ShelterDiagram results={results} params={params} />
                </div>
              </div>

              <EnergyChart results={results} />

              <DesignComparison
                designs={designs}
                onAddCurrent={handleAddDesign}
                onRemove={handleRemoveDesign}
                currentParams={params}
                hasResults={!!results}
              />
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-925 px-4 py-2 text-center text-[10px] text-slate-600">
        SIH Prototype · Area-Specific Passive Shelter Thermal Comfort Simulator ·
        Thermal calculations remain on Python backend
      </footer>
    </div>
  );
}

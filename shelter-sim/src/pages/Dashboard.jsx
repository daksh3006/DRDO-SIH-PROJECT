import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import SummaryCards from '../components/SummaryCards';
import TemperatureChart from '../components/TemperatureChart';
import EnergyChart from '../components/EnergyChart';
import ComfortCard from '../components/ComfortCard';
import ShelterDiagram from '../components/ShelterDiagram';
import DesignComparison from '../components/DesignComparison';
import ValidationPanel from '../components/ValidationPanel';
import SensitivityPanel from '../components/SensitivityPanel';
import AssumptionsModal from '../components/AssumptionsModal';
import { DEFAULT_PARAMS } from '../data/materials';
import {
  runSimulation,
  checkBackendStatus,
} from '../services/api';
import { AlertTriangle, FlaskConical, X } from 'lucide-react';

export default function Dashboard() {
  const [params, setParams] = useState({ ...DEFAULT_PARAMS });
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [error, setError] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [designs, setDesigns] = useState([]);
  const [designCounter, setDesignCounter] = useState(1);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('simulator'); // 'simulator' | 'validation' | 'sensitivity'
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);

  // Check backend status on mount & interval
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
    setLoadingStep(1);
    setError(null);
    setMobileSidebarOpen(false);

    const stepTimer = setInterval(() => {
      setLoadingStep((s) => (s < 4 ? s + 1 : s));
    }, 650);

    try {
      if (!backendOnline) {
        throw new Error(
          'Backend unavailable. Python server (main.py) must be running at /api to solve physics equations.'
        );
      }
      const data = await runSimulation(params);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Simulation failed');
      setResults(null);
    } finally {
      clearInterval(stepTimer);
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

  const winArea = Number(params.window_area || 0);
  const grossWall = Number(params.wall_area || 0);
  const isInputInvalid = winArea > grossWall * 0.85;

  return (
    <div className="flex min-h-screen flex-col bg-[#F0F7FF] text-slate-900">
      <Header
        location={params.location}
        backendOnline={backendOnline}
        isRunning={isRunning}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRun={handleRun}
        onReset={handleReset}
        onToggleSidebar={() => setMobileSidebarOpen((v) => !v)}
        onOpenAssumptions={() => setAssumptionsOpen(true)}
      />

      <div className="relative mx-auto flex w-full max-w-[1600px] flex-1 overflow-hidden">
        {/* Desktop Sidebar (Only visible in Simulator tab) */}
        {activeTab === 'simulator' && (
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
                    }
                  : null
              }
            />
          </div>
        )}

        {/* Mobile Slide-over Drawer */}
        {mobileSidebarOpen && activeTab === 'simulator' && (
          <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/40 backdrop-blur-xs">
            <div className="relative w-80 max-w-[85vw] h-full bg-white shadow-2xl">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="absolute right-3 top-3 z-20 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
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
                      }
                    : null
                }
              />
            </div>
            <div
              className="flex-1"
              onClick={() => setMobileSidebarOpen(false)}
            />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4">
          {/* TAB 1: SIMULATOR */}
          {activeTab === 'simulator' && (
            <>
              {error && (
                <div className="mb-3 flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 shadow-2xs">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {!results && !isRunning && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#B9E2FE] bg-white px-6 py-20 text-center shadow-xs">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#C1E7FF]/50 border border-[#7DD3FC]">
                    <FlaskConical className="h-8 w-8 text-[#0284C7]" />
                  </div>
                  <h2 className="mb-2 text-lg font-bold text-slate-900">
                    Ready for Thermal Simulation
                  </h2>
                  <p className="mb-6 max-w-md text-sm font-medium text-slate-600">
                    Configure shelter geometry, wall & roof materials, glazing, and ventilation inputs, then click{' '}
                    <strong className="text-[#0284C7] font-bold">Run Simulation</strong> to estimate the 24-hour thermal profile.
                  </p>
                  <button
                    type="button"
                    onClick={handleRun}
                    disabled={isInputInvalid}
                    className="rounded-xl bg-[#0284C7] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0369A1] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Run Simulation
                  </button>
                </div>
              )}

              {isRunning && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-[#B9E2FE] bg-white px-6 py-20 shadow-xs">
                  <div className="mb-4 h-10 w-10 animate-spin rounded-full border-3 border-[#C1E7FF] border-t-[#0284C7]" />
                  <p className="text-sm font-bold text-[#0284C7]">
                    {loadingStep === 1 && 'Fetching Weather Data…'}
                    {loadingStep === 2 && 'Running 72h Historical Weather Spin-Up…'}
                    {loadingStep === 3 && 'Solving 2-Node Thermal Energy Balance…'}
                    {loadingStep >= 4 && 'Generating Analysis & Comfort Metrics…'}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-600 font-mono font-semibold">
                    <span className={loadingStep >= 1 ? 'text-[#0284C7] font-bold' : 'opacity-40'}>1. Weather</span>
                    <span>→</span>
                    <span className={loadingStep >= 2 ? 'text-[#0284C7] font-bold' : 'opacity-40'}>2. Spin-Up</span>
                    <span>→</span>
                    <span className={loadingStep >= 3 ? 'text-[#0284C7] font-bold' : 'opacity-40'}>3. Solve ODE</span>
                    <span>→</span>
                    <span className={loadingStep >= 4 ? 'text-[#0284C7] font-bold' : 'opacity-40'}>4. Analysis</span>
                  </div>
                </div>
              )}

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
                    hasResults={!!results}
                  />
                </div>
              )}
            </>
          )}

          {/* TAB 2: MODEL VERIFICATION */}
          {activeTab === 'validation' && <ValidationPanel />}

          {/* TAB 3: SENSITIVITY SWEEP */}
          {activeTab === 'sensitivity' && (
            <SensitivityPanel currentParams={params} />
          )}
        </main>
      </div>

      {/* Assumptions Modal */}
      <AssumptionsModal
        isOpen={assumptionsOpen}
        onClose={() => setAssumptionsOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-[#C1E7FF] bg-white px-4 py-2.5 text-center text-[11px] font-semibold text-slate-600">
        THERMA CORE · Reduced-Order Transient Thermal Model · 24-Hour Elapsed Interval Analysis
      </footer>
    </div>
  );
}

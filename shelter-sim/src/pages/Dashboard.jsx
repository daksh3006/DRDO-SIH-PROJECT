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
import { AlertTriangle, FlaskConical, Play, ArrowLeft, SlidersHorizontal } from 'lucide-react';

export default function Dashboard() {
  const [params, setParams] = useState({ ...DEFAULT_PARAMS });
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [error, setError] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [designs, setDesigns] = useState([]);
  const [designCounter, setDesignCounter] = useState(1);
  const [activeTab, setActiveTab] = useState('simulator'); // 'simulator' | 'validation' | 'sensitivity'
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  
  // Mobile step mode: 'inputs' (shows input sidebar first) or 'results' (shows graphs/metrics)
  const [mobileStep, setMobileStep] = useState('inputs');

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
    setMobileStep('results');

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
    setMobileStep('inputs');
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

  const weatherInfo = results
    ? {
        ambient_min: results.summary?.ambient_min,
        ambient_max: results.summary?.ambient_max,
        ambient_avg: results.summary?.ambient_avg,
        source: results.weather_meta?.source,
      }
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#F0F7FF] text-slate-900 font-sans">
      <Header
        location={params.location}
        backendOnline={backendOnline}
        isRunning={isRunning}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRun={handleRun}
        onReset={handleReset}
        onToggleSidebar={() => setMobileStep((s) => (s === 'inputs' ? 'results' : 'inputs'))}
        onOpenAssumptions={() => setAssumptionsOpen(true)}
      />

      <div className="relative mx-auto flex w-full max-w-[1600px] flex-1 overflow-hidden">
        {/* Desktop Sidebar (Always visible in Simulator tab on desktop) */}
        {activeTab === 'simulator' && (
          <div className="hidden w-72 shrink-0 lg:block xl:w-80 border-r border-[#C1E7FF] bg-white">
            <Sidebar
              params={params}
              onChange={setParams}
              weatherInfo={weatherInfo}
            />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4">
          {/* TAB 1: SIMULATOR */}
          {activeTab === 'simulator' && (
            <>
              {/* MOBILE VIEW: STEP 1 - INPUTS PANEL */}
              <div className={mobileStep === 'inputs' ? 'block lg:hidden space-y-3' : 'hidden'}>
                <div className="rounded-2xl border border-[#C1E7FF] bg-white shadow-xs overflow-hidden">
                  <Sidebar
                    params={params}
                    onChange={setParams}
                    weatherInfo={weatherInfo}
                  />
                  {/* Sticky Bottom Action Bar on Mobile */}
                  <div className="sticky bottom-0 z-20 border-t border-[#C1E7FF] bg-white/95 backdrop-blur-md p-3 shadow-lg">
                    <button
                      type="button"
                      onClick={handleRun}
                      disabled={isRunning || isInputInvalid}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0284C7] py-3 text-sm font-bold text-white shadow-md hover:bg-[#0369A1] active:scale-[0.99] disabled:opacity-50 transition-all"
                    >
                      {isRunning ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Running Thermal Model…
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 fill-current" />
                          Run Simulation & View Graphs
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* RESULTS AREA (Visible on Desktop OR when Mobile is in 'results' step) */}
              <div className={mobileStep === 'results' ? 'block' : 'hidden lg:block'}>
                {/* Mobile Results Top Action Header */}
                <div className="mb-3.5 flex items-center justify-between gap-2 rounded-xl border border-[#B9E2FE] bg-[#D6F5FF]/70 px-3.5 py-2.5 lg:hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setMobileStep('inputs')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#0284C7] bg-white px-3 py-1.5 text-xs font-bold text-[#0284C7] shadow-2xs hover:bg-[#0284C7] hover:text-white transition-all"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Edit Inputs
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#0369A1]">
                      {results ? 'Results Generated' : 'Ready'}
                    </span>
                    <button
                      type="button"
                      onClick={handleRun}
                      disabled={isRunning || isInputInvalid}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#0284C7] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#0369A1] disabled:opacity-50 transition-all"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Re-Run
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mb-3 flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 shadow-2xs">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}

                {!results && !isRunning && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#B9E2FE] bg-white px-6 py-16 sm:py-20 text-center shadow-xs">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 p-1 border border-[#C1E7FF] shadow-md">
                      <img src="/logo.png" alt="THERMA CORE Logo" className="h-full w-full object-contain rounded-xl" />
                    </div>
                    <h2 className="mb-2 text-lg font-bold text-slate-900">
                      Ready for Thermal Simulation
                    </h2>
                    <p className="mb-6 max-w-md text-sm font-medium text-slate-600">
                      Configure shelter geometry, wall & roof materials, glazing, and location inputs, then click{' '}
                      <strong className="text-[#0284C7] font-bold">Run Simulation</strong> to calculate the 24-hour thermal profile.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setMobileStep('inputs')}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#0284C7] bg-white px-5 py-2.5 text-sm font-bold text-[#0284C7] shadow-xs hover:bg-[#D6F5FF] lg:hidden transition-all"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        Configure Inputs
                      </button>
                      <button
                        type="button"
                        onClick={handleRun}
                        disabled={isInputInvalid}
                        className="w-full sm:w-auto rounded-xl bg-[#0284C7] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0369A1] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Run Simulation
                      </button>
                    </div>
                  </div>
                )}

                {isRunning && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-[#B9E2FE] bg-white px-6 py-16 sm:py-20 shadow-xs">
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
              </div>
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

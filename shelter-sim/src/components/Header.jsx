import { Activity, MapPin, Play, RotateCcw, Wifi, WifiOff } from 'lucide-react';

export default function Header({
  location,
  backendOnline,
  isRunning,
  onRun,
  onReset,
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-700/80 bg-slate-925/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-600/20 border border-cyan-500/40">
            <Activity className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight text-slate-100">
              Thermal Shelter Simulator
            </h1>
            <p className="truncate text-[11px] text-slate-400">
              Area-Specific Passive Shelter Thermal Comfort
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <MapPin className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-medium">{location || '—'}</span>
          </div>
          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 border ${
              backendOnline
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
            }`}
          >
            {backendOnline ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            <span className="font-medium">
              {backendOnline ? 'Backend Online' : 'Demo Mode (Mock)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            type="button"
            onClick={onRun}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 rounded-md bg-cyan-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Simulating…
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Run Simulation
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

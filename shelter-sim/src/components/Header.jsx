import {
  Activity,
  Sliders,
  RotateCcw,
  Play,
  BookOpen,
  ShieldCheck,
  Menu,
} from 'lucide-react';

export default function Header({
  isRunning,
  activeTab,
  onTabChange,
  onRun,
  onReset,
  onToggleSidebar,
  onOpenAssumptions,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#C1E7FF] bg-white/95 backdrop-blur-md shadow-xs">
      <div className="relative mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 py-2">
        {/* Left Logo & Subtitle */}
        <div className="flex items-center gap-3">
          {activeTab === 'simulator' && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-[#D6F5FF] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="THERMA CORE Logo"
              className="h-11 sm:h-13 w-auto object-contain shrink-0"
            />
            <div className="hidden lg:block border-l border-slate-300 pl-3">
              <p className="text-[11px] font-extrabold text-slate-800 leading-tight tracking-wide">
                DRDO Area-Specific Passive Shelter
              </p>
              <p className="text-[10px] font-semibold text-slate-500">
                Thermal Simulation Platform
              </p>
            </div>
          </div>
        </div>

        {/* Center Navigation Tabs (Perfectly Centered) */}
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 rounded-xl border border-[#B9E2FE] bg-[#F0F7FF] p-1 text-xs shadow-inner">
          <button
            type="button"
            onClick={() => onTabChange('simulator')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-medium transition-all ${
              activeTab === 'simulator'
                ? 'bg-[#0284C7] text-white shadow-sm font-semibold'
                : 'text-slate-700 hover:bg-[#D6F5FF] hover:text-slate-900'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Simulator
          </button>

          <button
            type="button"
            onClick={() => onTabChange('validation')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-medium transition-all ${
              activeTab === 'validation'
                ? 'bg-[#0284C7] text-white shadow-sm font-semibold'
                : 'text-slate-700 hover:bg-[#D6F5FF] hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Model Verification
          </button>

          <button
            type="button"
            onClick={() => onTabChange('sensitivity')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-medium transition-all ${
              activeTab === 'sensitivity'
                ? 'bg-[#0284C7] text-white shadow-sm font-semibold'
                : 'text-slate-700 hover:bg-[#D6F5FF] hover:text-slate-900'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            Sensitivity Sweep
          </button>

          <button
            type="button"
            onClick={onOpenAssumptions}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-medium text-slate-700 hover:bg-[#FED8A7]/50 hover:text-amber-900 transition-all"
          >
            <BookOpen className="h-3.5 w-3.5 text-amber-700" />
            Assumptions
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onReset}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-[#D6F5FF] disabled:opacity-50 transition-all shadow-2xs"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {activeTab === 'simulator' && (
            <button
              type="button"
              onClick={onRun}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0284C7] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0369A1] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isRunning ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Simulating…
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Run Simulation
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="flex md:hidden border-t border-[#C1E7FF] bg-white px-2 py-1 text-[11px]">
        <button
          type="button"
          onClick={() => onTabChange('simulator')}
          className={`flex-1 py-1.5 text-center font-semibold ${
            activeTab === 'simulator' ? 'text-[#0284C7] border-b-2 border-[#0284C7]' : 'text-slate-600'
          }`}
        >
          Simulator
        </button>
        <button
          type="button"
          onClick={() => onTabChange('validation')}
          className={`flex-1 py-1.5 text-center font-semibold ${
            activeTab === 'validation' ? 'text-[#0284C7] border-b-2 border-[#0284C7]' : 'text-slate-600'
          }`}
        >
          Verification
        </button>
        <button
          type="button"
          onClick={() => onTabChange('sensitivity')}
          className={`flex-1 py-1.5 text-center font-semibold ${
            activeTab === 'sensitivity' ? 'text-[#0284C7] border-b-2 border-[#0284C7]' : 'text-slate-600'
          }`}
        >
          Sensitivity
        </button>
        <button
          type="button"
          onClick={onOpenAssumptions}
          className="flex-1 py-1.5 text-center font-semibold text-amber-800 hover:text-amber-900"
        >
          Assumptions
        </button>
      </div>
    </header>
  );
}

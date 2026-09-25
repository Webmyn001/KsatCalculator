import { Droplets, Gauge, Moon, Sun, House, Ruler } from 'lucide-react';

export default function Header({ module, onModuleChange, onHome, showHome, dark, toggleDark }) {
  const subtitle =
    module === 'dcp'
      ? 'Dynamic Cone Penetrometer'
      : module === 'calibration'
        ? 'Soil Moisture Instrument Calibration'
        : 'Mini Disk Infiltrometer · 2 cm Suction';

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
            {module === 'dcp' ? (
              <Gauge className="h-5 w-5" aria-hidden="true" />
            ) : module === 'calibration' ? (
              <Ruler className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Droplets className="h-5 w-5" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-extrabold leading-tight sm:text-lg">
              KunsatCalculator
            </h1>
            <p className="truncate text-[11px] font-medium text-emerald-100 sm:text-xs">{subtitle}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div
            role="tablist"
            aria-label="Calculator"
            className="flex rounded-lg bg-white/10 p-0.5 ring-1 ring-white/20"
          >
            <button
              role="tab"
              type="button"
              aria-selected={module === 'infiltrometer'}
              onClick={() => onModuleChange('infiltrometer')}
              title="Mini Disk Infiltrometer (2 cm suction)"
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition sm:text-sm ${
                module === 'infiltrometer'
                  ? 'bg-white text-emerald-800 shadow'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Droplets className="h-4 w-4" aria-hidden="true" />
              <span className="hidden md:inline">Infiltrometer</span>
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={module === 'dcp'}
              onClick={() => onModuleChange('dcp')}
              title="Dynamic Cone Penetrometer soil strength"
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition sm:text-sm ${
                module === 'dcp' ? 'bg-white text-emerald-800 shadow' : 'text-white hover:bg-white/10'
              }`}
            >
              <Gauge className="h-4 w-4" aria-hidden="true" />
              <span className="hidden md:inline">DCP</span>
            </button>
            <button
              role="tab"
              type="button"
              aria-selected={module === 'calibration'}
              onClick={() => onModuleChange('calibration')}
              title="Soil moisture instrument calibration and gravimetric moisture"
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition sm:text-sm ${
                module === 'calibration' ? 'bg-white text-emerald-800 shadow' : 'text-white hover:bg-white/10'
              }`}
            >
              <Ruler className="h-4 w-4" aria-hidden="true" />
              <span className="hidden lg:inline">Calibration</span>
            </button>
          </div>

          {showHome && module === 'infiltrometer' && (
            <button
              onClick={onHome}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold ring-1 ring-white/20 transition hover:bg-white/20"
            >
              <House className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Home</span>
            </button>
          )}
          <button
            onClick={toggleDark}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex items-center justify-center rounded-lg bg-white/10 p-2.5 ring-1 ring-white/20 transition hover:bg-white/20"
            aria-label="Toggle dark mode"
          >
            {dark ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
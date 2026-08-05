import { useState } from 'react';
import { BookOpen, ChevronDown, Divide, Sigma, Gauge } from 'lucide-react';

const FORMULAS = [
  {
    icon: Divide,
    title: 'Infiltration',
    formula: 'Iᵢ = V(i−1) − Vᵢ',
    note: 'For the first row I₀ = 0. Each step’s decrease in reservoir volume equals the volume infiltrated.',
  },
  {
    icon: Sigma,
    title: 'Cumulative Infiltration',
    formula: 'Cᵢ = C(i−1) + Iᵢ',
    note: 'Running total of infiltrated volume (cm³ or mL).',
  },
  {
    icon: BookOpen,
    title: 'Cumulative Infiltration Depth',
    formula: 'D = Cᵢ / 14.53',
    note: 'Cumulative volume divided by the Mini Disk area (14.53 cm²) gives infiltration depth in cm.',
  },
  {
    icon: Sigma,
    title: 'Polynomial Regression',
    formula: 'y = ax² + bx + c',
    note: 'Least-squares fit of cumulative infiltration depth (y) against √time (x). a, b, c rounded to 4 decimal places.',
  },
  {
    icon: Gauge,
    title: 'Hydraulic Conductivity',
    formula: 'K = a / A',
    note: 'A is the Van Genuchten parameter determined by soil texture (Zhang, 1997) — it accounts for the disk radius and 2 cm suction.',
  },
];

export default function FormulaSection() {
  const [open, setOpen] = useState(true);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
          <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          Formulas Used
        </span>
        <ChevronDown
          className={`h-5 w-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 dark:border-slate-800">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FORMULAS.map(({ icon: Icon, title, formula, note }) => (
              <div
                key={title}
                className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100 dark:bg-slate-800/50 dark:ring-slate-800"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</h3>
                </div>
                <p className="mb-1.5 font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  {formula}
                </p>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{note}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
            A is the Van Genuchten parameter determined by soil texture. Select a texture from the
            lookup table or enter a custom value — A affects only the final hydraulic conductivity.
          </p>
        </div>
      )}
    </div>
  );
}

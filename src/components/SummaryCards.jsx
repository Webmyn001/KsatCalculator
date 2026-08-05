import { Droplets, Layers, Ruler, Gauge, Sigma, Percent } from 'lucide-react';
import { formatNumber, formatEquation } from '../utils/formatting';
import InfoTip from './InfoTip';

const ACCENTS = {
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
};

export default function SummaryCards({
  totalInfiltrationCm3,
  finalCumulativeCm,
  regression,
  k,
  unit,
  scientific,
}) {
  const cards = [
    {
      label: `Total Infiltration (${unit})`,
      value: formatNumber(totalInfiltrationCm3, 2, scientific),
      icon: Droplets,
      accent: ACCENTS.emerald,
      tip: 'Sum of all infiltration increments, equal to the total volume of water that entered the soil over the test period.',
    },
    {
      label: `Final Cumulative Infiltration (${unit})`,
      value: formatNumber(totalInfiltrationCm3, 2, scientific),
      icon: Layers,
      accent: ACCENTS.teal,
      tip: 'Cumᵢ = Cum(i−1) + Iᵢ — the running total of infiltrated volume at the end of the measurement period.',
    },
    {
      label: 'Final Cumulative Infiltration (cm)',
      value: formatNumber(finalCumulativeCm, 3, scientific),
      icon: Ruler,
      accent: ACCENTS.sky,
      tip: 'Depth of infiltrated water: cumulative volume ÷ disk area (14.53 cm²).',
    },
    {
      label: 'Hydraulic Conductivity (cm/s)',
      value: k != null ? formatNumber(k, 6, scientific) : '—',
      icon: Gauge,
      accent: ACCENTS.violet,
      tip: 'K = C₁ / A, where C₁ is the quadratic coefficient of the fitted curve and A is the Van Genuchten parameter.',
    },
    {
      label: 'Polynomial Equation',
      value: regression ? formatEquation(regression) : '—',
      icon: Sigma,
      accent: ACCENTS.amber,
      tip: 'Second-order least-squares fit of cumulative infiltration (cm) vs √time: y = ax² + bx + c.',
    },
    {
      label: 'R²',
      value: regression ? formatNumber(regression.r2, 4, scientific) : '—',
      icon: Percent,
      accent: ACCENTS.rose,
      tip: 'Coefficient of determination — how well the polynomial explains the observed data (1 = perfect fit).',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map(({ label, value, icon: Icon, accent, tip }) => (
        <div
          key={label}
          className="card animate-fadeUp flex items-center gap-4 p-5"
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}
          >
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              <span className="truncate">{label}</span>
              <InfoTip text={tip} />
            </div>
            <div className="truncate font-mono text-lg font-bold text-slate-800 dark:text-slate-100">
              {value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

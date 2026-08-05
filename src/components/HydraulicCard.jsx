import { Gauge } from 'lucide-react';
import { formatNumber } from '../utils/formatting';
import InfoTip from './InfoTip';

export default function HydraulicCard({ k, aCoef, aParam, scientific }) {
  const ready = k != null && aCoef != null && aParam != null;
  return (
    <div className="card flex h-full flex-col p-5 sm:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
          <Gauge className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          Hydraulic Conductivity
        </h2>
        <InfoTip text="Unsaturated hydraulic conductivity K at the applied suction (2 cm). Computed as K = C₁ / A following Zhang (1997)." />
      </div>

      {ready ? (
        <>
          <div className="flex flex-col items-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 px-4 py-6 text-white shadow-inner">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-100">
              K (unsaturated)
            </p>
            <p className="mt-1 font-mono text-3xl font-extrabold">
              {formatNumber(k, 6, scientific)}
            </p>
            <p className="text-sm font-medium text-emerald-100">cm/s</p>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm ring-1 ring-slate-100 dark:bg-slate-800/50 dark:ring-slate-800">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Calculation
            </p>
            <p className="flex items-center justify-between py-0.5">
              <span className="text-slate-500 dark:text-slate-400">C₁ = a (quadratic coef.)</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">
                {formatNumber(aCoef, 6, scientific)} cm/s
              </span>
            </p>
            <p className="flex items-center justify-between py-0.5">
              <span className="text-slate-500 dark:text-slate-400">A (Van Genuchten)</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">
                {formatNumber(aParam, 6, scientific)}
              </span>
            </p>
            <div className="my-2 border-t border-slate-200 dark:border-slate-700" />
            <p className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">K = C₁ / A</span>
              <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                {formatNumber(k, 6, scientific)} cm/s
              </span>
            </p>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 py-10 text-center dark:bg-slate-800/50">
          <Gauge className="h-8 w-8 text-slate-300 dark:text-slate-600" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            K is not available yet
          </p>
          <p className="max-w-xs text-xs text-slate-400 dark:text-slate-500">
            Enter volume readings and set the Van Genuchten A parameter (soil texture) to
            compute K = C₁ / A.
          </p>
        </div>
      )}
    </div>
  );
}

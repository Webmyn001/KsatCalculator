import { Sigma, Percent } from 'lucide-react';
import { formatEquation, formatNumber } from '../utils/formatting';

export default function EquationCard({ regression, scientific }) {
  return (
    <div className="card flex h-full flex-col p-5 sm:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
          <Sigma className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          Polynomial Regression
        </h2>
      </div>

      {regression ? (
        <>
          <div className="rounded-xl bg-emerald-50 p-4 text-center ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:ring-emerald-900">
            <p className="font-mono text-lg font-bold text-emerald-800 dark:text-emerald-300">
              {formatEquation(regression)}
            </p>
            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
              Second-order least-squares fit · x = √t (seconds)
            </p>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-100 dark:bg-amber-950/30 dark:ring-amber-900">
            <Percent className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              R² = {formatNumber(regression.r2, 4, scientific)}
            </span>
          </div>

          <div className="mt-4 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
            <p>
              <span className="font-semibold text-slate-700 dark:text-slate-200">a</span> ={' '}
              <span className="font-mono">{formatNumber(regression.a, 4, scientific)}</span>{' '}
              (cm/s)
            </p>
            <p>
              <span className="font-semibold text-slate-700 dark:text-slate-200">b</span> ={' '}
              <span className="font-mono">{formatNumber(regression.b, 4, scientific)}</span>{' '}
              (cm/s¹⁄²)
            </p>
            <p className="pt-1 text-xs text-slate-400 dark:text-slate-500">
              Fitted from {regression.count} valid data points.
            </p>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 py-10 text-center dark:bg-slate-800/50">
          <Sigma className="h-8 w-8 text-slate-300 dark:text-slate-600" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            No regression available
          </p>
          <p className="max-w-xs text-xs text-slate-400 dark:text-slate-500">
            At least 3 valid volume readings are required to fit y = ax² + bx + c.
          </p>
        </div>
      )}
    </div>
  );
}

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  Scatter,
} from 'recharts';
import { Sigma } from 'lucide-react';
import { sorptivityFromRegression } from '../utils/sorptivity';
import { formatNumber } from '../utils/formatting';

/**
 * Sorptivity is taken straight from the fitted infiltration curve
 * (I = C1*t + C2*sqrt(t), Zhang 1997): the coefficient of sqrt(t) is C2,
 * the soil sorptivity Sw. The card reads the regression already computed
 * by the infiltrometer, so values update live with the volume readings and
 * there is no separate data entry.
 */
export default function SorptivityCard({ regression, scientific, isDark }) {
  const data = useMemo(() => sorptivityFromRegression(regression), [regression]);

  if (data.sw == null || data.n === 0) {
    return (
      <div className="card flex h-full flex-col items-center justify-center gap-2 p-5 text-center sm:p-6">
        <Sigma className="h-8 w-8 text-slate-300 dark:text-slate-600" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          No sorptivity yet
        </p>
        <p className="max-w-xs text-xs text-slate-400 dark:text-slate-500">
          Fit the infiltration curve first (at least 3 valid volume readings) to read C2 of
          I = C1&middot;t + C2&middot;&#8730;t as sorptivity.
        </p>
      </div>
    );
  }

  const theme = isDark
    ? { grid: '#1e293b', axis: '#94a3b8', tooltipBg: '#0f172a', tooltipBorder: '#334155' }
    : { grid: '#e2e8f0', axis: '#64748b', tooltipBg: '#ffffff', tooltipBorder: '#cbd5e1' };

  const chartData = [
    ...data.fitted.map((p) => ({ sqrtTime: p.sqrtTime, obs: null, fit: p.cumulativeInfiltration })),
    ...data.points.map((p) => ({ sqrtTime: p.sqrtTime, obs: p.cumulativeInfiltration, fit: null })),
  ].sort((a, b) => a.sqrtTime - b.sqrtTime);

  return (
    <div className="card flex h-full flex-col p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
          <Sigma className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          Sorptivity (S&#8341;)
        </h2>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900">
          C2 of I = C1&middot;t + C2&middot;&#8730;t
        </span>
      </div>

      <div className="rounded-xl bg-emerald-50 p-4 text-center ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:ring-emerald-900">
        <p className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-300">
          {formatNumber(data.sw, 4, scientific)}{' '}
          <span className="text-base font-bold">cm&middot;s&#8315;&#189;</span>
        </p>
        <p className="mt-1 font-mono text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          I = {formatNumber(data.sw, 4, scientific)} &#8730;t (from fitted curve)
        </p>
        <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
          Fitted from {data.n} valid observation{data.n === 1 ? '' : 's'} &middot; R&#178;
          = {formatNumber(data.r2, 4, scientific)} &middot; RMSE =
          {formatNumber(data.rmse, 4, scientific)} cm
        </p>
      </div>

      <div className="mt-4 h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 20, bottom: 16, left: 4 }}>
            <CartesianGrid stroke={theme.grid} strokeDasharray="4 4" />
            <XAxis
              dataKey="sqrtTime"
              type="number"
              domain={[0, 'auto']}
              label={{ value: '\u221at (s\u00bd)', position: 'insideBottom', offset: -2, fill: theme.axis, fontSize: 12 }}
              tick={{ fill: theme.axis, fontSize: 12 }}
              stroke={theme.grid}
            />
            <YAxis
              dataKey="obs"
              type="number"
              domain={[0, 'auto']}
              label={{ value: 'Cumulative infiltration I (cm)', angle: -90, position: 'insideLeft', offset: 8, fill: theme.axis, fontSize: 12 }}
              tick={{ fill: theme.axis, fontSize: 12 }}
              stroke={theme.grid}
            />
            <Tooltip
              contentStyle={{ backgroundColor: theme.tooltipBg, borderColor: theme.tooltipBorder, borderRadius: 10, fontSize: 12 }}
              labelFormatter={(v) => `\u221at = ${v}`}
              formatter={(value, name) => [
                `${Number(value).toFixed(4)} cm`,
                name === 'Measured data' ? 'Measured data' : 'Fitted curve',
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              dataKey="fit"
              name="Fitted curve"
              type="monotone"
              connectNulls
              dot={false}
              stroke="#0d9488"
              strokeWidth={2.5}
              isAnimationActive
            />
            <Scatter
              dataKey="obs"
              name="Measured data"
              fill="#10b981"
              fillOpacity={1}
              stroke="#065f46"
              strokeWidth={1.5}
              shape={(props) => {
                const { cx, cy } = props;
                if (cx == null || cy == null) return null;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={3.5}
                    fill="#10b981"
                    fillOpacity={1}
                    stroke="#065f46"
                    strokeWidth={1.5}
                  />
                );
              }}
              line={false}
              isAnimationActive
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
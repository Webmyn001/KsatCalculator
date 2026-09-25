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
import { calculateSorptivity } from '../utils/sorptivity';
import { formatNumber } from '../utils/formatting';

/**
 * Sorptivity is always derived from the infiltration dataset already
 * computed by the infiltrometer (function of elapsed time and cumulative
 * infiltration). Rows come in with `time` (s) and `cumulativeCm` (cm),
 * so the user never re-enters time or cumulative infiltration and the
 * value updates live with the volume readings.
 */
export default function SorptivityCard({ rows, scientific, isDark }) {
  const data = useMemo(() => {
    const mapped = (rows || [])
      .filter((r) => r && r.time > 0 && r.cumulativeCm != null)
      .map((r) => ({ time: r.time, cumulativeInfiltration: r.cumulativeCm }));
    return calculateSorptivity(mapped);
  }, [rows]);

  if (data.n === 0) {
    return (
      <div className="card flex h-full flex-col items-center justify-center gap-2 p-5 text-center sm:p-6">
        <Sigma className="h-8 w-8 text-slate-300 dark:text-slate-600" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          No sorptivity yet
        </p>
        <p className="max-w-xs text-xs text-slate-400 dark:text-slate-500">
          Enter at least one volume reading with elapsed time to fit I = S&#8341;&#8730;t.
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
          I = S&#8341;&#8730;t &middot; through origin
        </span>
      </div>

      <div className="rounded-xl bg-emerald-50 p-4 text-center ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:ring-emerald-900">
        <p className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-300">
          {formatNumber(data.sw, 4, scientific)}{' '}
          <span className="text-base font-bold">cm&middot;s&#8315;&#189;</span>
        </p>
        <p className="mt-1 font-mono text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          I = {formatNumber(data.sw, 4, scientific)} &#8730;t
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
              dataKey="fit"
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
                name === 'Measured data' ? 'Measured data' : 'I = S\u8341\u221at',
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              dataKey="fit"
              name="I = S\u8341\u221at"
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
              fillOpacity={0.9}
              stroke="#047857"
              strokeWidth={1}
              line={false}
              isAnimationActive
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
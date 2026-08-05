import { forwardRef, useMemo } from 'react';
import {
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Scatter,
  Line,
  ResponsiveContainer,
} from 'recharts';
import { LineChart } from 'lucide-react';

const GraphPlot = forwardRef(function GraphPlot(
  { points, curve, hasData, isDark },
  ref,
) {
  const theme = isDark
    ? { grid: '#1e293b', axis: '#94a3b8', tooltipBg: '#0f172a', tooltipBorder: '#334155' }
    : { grid: '#e2e8f0', axis: '#64748b', tooltipBg: '#ffffff', tooltipBorder: '#cbd5e1' };

  const chartData = useMemo(() => {
    const merged = [
      ...curve.map((p) => ({ sqrtTime: p.sqrtTime, obs: null, fit: p.cumCm })),
      ...points.map((p) => ({ sqrtTime: p.sqrtTime, obs: p.cumCm, fit: null })),
    ];
    return merged.sort((a, b) => a.sqrtTime - b.sqrtTime);
  }, [points, curve]);

  return (
    <div ref={ref} className="card p-5 sm:p-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
          <LineChart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          Cumulative Infiltration vs √Time
        </h2>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900">
          Scatter + polynomial fit
        </span>
      </div>

      {hasData ? (
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 24, bottom: 12, left: 4 }}
            >
              <CartesianGrid stroke={theme.grid} strokeDasharray="4 4" />
              <XAxis
                dataKey="sqrtTime"
                type="number"
                domain={[0, 'auto']}
                label={{
                  value: '√Time (s¹⁄²)',
                  position: 'insideBottom',
                  offset: -4,
                  fill: theme.axis,
                  fontSize: 12,
                }}
                tick={{ fill: theme.axis, fontSize: 12 }}
                stroke={theme.grid}
              />
              <YAxis
                dataKey="fit"
                type="number"
                domain={[0, 'auto']}
                label={{
                  value: 'Cumulative Infiltration (cm)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 8,
                  fill: theme.axis,
                  fontSize: 12,
                }}
                tick={{ fill: theme.axis, fontSize: 12 }}
                stroke={theme.grid}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.tooltipBg,
                  borderColor: theme.tooltipBorder,
                  borderRadius: 10,
                  fontSize: 12,
                }}
                labelFormatter={(v) => `√Time = ${v}`}
                formatter={(value, name) => [
                  `${Number(value).toFixed(4)} cm`,
                  name === 'Measured data' ? 'Measured data' : 'Polynomial fit',
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                dataKey="fit"
                name="Polynomial fit"
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
      ) : (
        <div className="flex h-[380px] flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 text-center dark:bg-slate-800/50">
          <LineChart className="h-10 w-10 text-slate-300 dark:text-slate-600" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Enter volume readings to see the graph
          </p>
          <p className="max-w-xs text-xs text-slate-400 dark:text-slate-500">
            The polynomial curve is fitted to Cumulative Infiltration (cm) against √Time.
          </p>
        </div>
      )}
    </div>
  );
});

export default GraphPlot;

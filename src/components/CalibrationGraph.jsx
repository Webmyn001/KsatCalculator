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
import { LineChart } from 'lucide-react';

export default function CalibrationGraph({ points, line, hasData, isDark }) {
  const theme = isDark
    ? { grid: '#1e293b', axis: '#94a3b8', tooltipBg: '#0f172a', tooltipBorder: '#334155' }
    : { grid: '#e2e8f0', axis: '#64748b', tooltipBg: '#ffffff', tooltipBorder: '#cbd5e1' };

  const chartData = [
    ...line.map((p) => ({ reading: p.reading, obs: null, fit: p.moisture })),
    ...points.map((p) => ({ reading: p.reading, obs: p.moisture, fit: null })),
  ].sort((a, b) => a.reading - b.reading);

  return (
    <div className="flex h-full flex-col">
      {hasData ? (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 20, bottom: 16, left: 4 }}>
              <CartesianGrid stroke={theme.grid} strokeDasharray="4 4" />
              <XAxis
                dataKey="reading"
                type="number"
                domain={[0, 'auto']}
                label={{ value: 'Instrument reading (R)', position: 'insideBottom', offset: -2, fill: theme.axis, fontSize: 12 }}
                tick={{ fill: theme.axis, fontSize: 12 }}
                stroke={theme.grid}
              />
              <YAxis
                dataKey="fit"
                type="number"
                domain={[0, 'auto']}
                label={{ value: 'Gravimetric moisture (%)', angle: -90, position: 'insideLeft', offset: 10, fill: theme.axis, fontSize: 12 }}
                tick={{ fill: theme.axis, fontSize: 12 }}
                stroke={theme.grid}
              />
              <Tooltip
                contentStyle={{ backgroundColor: theme.tooltipBg, borderColor: theme.tooltipBorder, borderRadius: 10, fontSize: 12 }}
                labelFormatter={(v) => `Reading = ${v}`}
                formatter={(value, name) => [
                  `${Number(value).toFixed(3)} %`,
                  name === 'Calibration samples' ? 'Calibration samples' : 'MC = aR + b',
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                dataKey="fit"
                name="MC = aR + b"
                type="monotone"
                connectNulls
                dot={false}
                stroke="#0d9488"
                strokeWidth={2.5}
                isAnimationActive
              />
              <Scatter
                dataKey="obs"
                name="Calibration samples"
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
        <div className="flex h-[280px] w-full flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 text-center dark:bg-slate-800/50">
          <LineChart className="h-10 w-10 text-slate-300 dark:text-slate-600" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Add calibration samples to see the curve
          </p>
          <p className="max-w-xs text-xs text-slate-400 dark:text-slate-500">
            The fitted line MC = aR + b is drawn over the calibration points.
          </p>
        </div>
      )}
    </div>
  );
}
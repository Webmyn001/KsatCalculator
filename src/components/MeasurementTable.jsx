import {
  Table2,
  Undo2,
  FlaskConical,
  Wand2,
  AlertTriangle,
} from 'lucide-react';
import { formatNumber } from '../utils/formatting';
import InfoTip from './InfoTip';

const TH = 'px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 whitespace-nowrap';

export default function MeasurementTable({
  rows,
  volumeInputs,
  unit,
  onUnitChange,
  scientific,
  onScientificChange,
  onVolumeChange,
  onLoadSample,
  onUndo,
  canUndo,
}) {
  const volUnit = unit;

  const flags = rows.map((r, i) => {
    const raw = String(volumeInputs[i] ?? '').trim();
    const num = Number(raw);
    const negative = raw !== '' && num < 0;
    const invalid = raw !== '' && (Number.isNaN(num) || negative);
    const increased =
      i > 0 &&
      rows[i].volume != null &&
      rows[i - 1].volume != null &&
      rows[i].volume > rows[i - 1].volume;
    return { raw, negative, invalid, increased };
  });

  const issues = [];
  flags.forEach((f, i) => {
    if (f.negative || f.invalid) {
      issues.push({
        type: 'error',
        text: `Row ${i + 1}: volume must be a non-negative number.`,
      });
    } else if (f.increased) {
      issues.push({
        type: 'warn',
        text: `Row ${i + 1}: volume (${rows[i].volume}) is larger than the previous reading (${rows[i - 1].volume}). Volume should decrease with time.`,
      });
    }
  });

  const cellClass = (f) => {
    if (f.negative || f.invalid) {
      return 'w-full rounded-md border border-rose-400 bg-rose-50 px-2 py-1.5 text-center text-sm text-rose-700 outline-none ring-rose-200 focus:ring-2 dark:bg-rose-950/50 dark:text-rose-300';
    }
    if (f.increased) {
      return 'w-full rounded-md border border-amber-400 bg-amber-50 px-2 py-1.5 text-center text-sm text-amber-800 outline-none ring-amber-200 focus:ring-2 dark:bg-amber-950/40 dark:text-amber-300';
    }
    return 'w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-center text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30';
  };

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
          <Table2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          Measurement Table
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            {['cm³', 'mL'].map((u) => (
              <button
                key={u}
                onClick={() => onUnitChange(u)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  unit === u
                    ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200 dark:bg-slate-700 dark:text-emerald-300'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {u}
              </button>
            ))}
          </div>

          <button
            onClick={() => onScientificChange(!scientific)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 transition ${
              scientific
                ? 'bg-emerald-600 text-white ring-emerald-600'
                : 'bg-slate-100 text-slate-500 ring-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700'
            }`}
            title="Toggle scientific notation"
          >
            Sci. notation
          </button>

          <button
            onClick={onLoadSample}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200 transition hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900"
          >
            <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
            Example data
          </button>

          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
            Undo
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
              <th className={TH}>Time (s)</th>
              <th className={TH}>
                <span className="inline-flex items-center gap-1">
                  √Time
                  <InfoTip text="Square root of elapsed time. Plotted on the x-axis for the polynomial regression." />
                </span>
              </th>
              <th className={TH}>
                Volume Remaining ({volUnit})
                <span className="block font-normal normal-case">
                  editable only
                </span>
              </th>
              <th className={TH}>
                Infiltration ({volUnit})
                <InfoTip text="I₀ = 0 and Iᵢ = V(i−1) − Vᵢ for later rows. The decrease in reservoir volume equals the volume infiltrated." />
              </th>
              <th className={TH}>
                Cumulative Infiltration ({volUnit})
                <InfoTip text="Cumᵢ = Cum(i−1) + Iᵢ. Running total of infiltrated volume." />
              </th>
              <th className={TH}>
                Cumulative Infiltration (cm)
                <InfoTip text="Depth of infiltrated water: cumulative volume ÷ disk area (14.53 cm²)." />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.time}
                className="border-b border-slate-100 transition last:border-0 hover:bg-emerald-50/40 dark:border-slate-800 dark:hover:bg-slate-800/40"
              >
                <td className="px-3 py-2 text-center font-semibold text-slate-700 dark:text-slate-200">
                  {r.time}
                </td>
                <td className="px-3 py-2 text-center font-mono text-slate-600 dark:text-slate-300">
                  {formatNumber(r.sqrtTime, 4, scientific)}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={volumeInputs[r.index]}
                    onChange={(e) => onVolumeChange(r.index, e.target.value)}
                    placeholder="—"
                    aria-label={`Volume remaining at ${r.time} seconds`}
                    className={cellClass(flags[r.index])}
                  />
                </td>
                <td className="px-3 py-2 text-center font-mono text-slate-600 dark:text-slate-300">
                  {r.infiltration != null ? formatNumber(r.infiltration, 2, scientific) : '—'}
                </td>
                <td className="px-3 py-2 text-center font-mono font-medium text-slate-700 dark:text-slate-200">
                  {r.cumulative != null ? formatNumber(r.cumulative, 2, scientific) : '—'}
                </td>
                <td className="px-3 py-2 text-center font-mono font-medium text-emerald-700 dark:text-emerald-400">
                  {r.cumulativeCm != null ? formatNumber(r.cumulativeCm, 3, scientific) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900">
          <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
          Disk area = 14.53 cm²
        </span>
        <span className="text-slate-400 dark:text-slate-500">
          Only the Volume Remaining column is editable — everything else updates instantly.
        </span>
      </div>

      {issues.length > 0 && (
        <div className="mt-3 space-y-1.5 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:ring-amber-900">
          {issues.map((issue, i) => (
            <p
              key={i}
              className={`flex items-start gap-2 text-xs font-medium ${
                issue.type === 'error' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-700 dark:text-amber-300'
              }`}
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {issue.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

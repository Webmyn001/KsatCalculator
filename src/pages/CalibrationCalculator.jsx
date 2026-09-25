import { useMemo, useState } from 'react';
import {
  Ruler,
  GraduationCap,
  Plus,
  Trash2,
  Eraser,
  Sigma,
  Download,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  calculateLinearCalibration,
  calculateGravimetricMoisture,
  applyCalibration,
} from '../utils/calibration';
import { formatNumber, todayISO } from '../utils/formatting';
import CalibrationGraph from '../components/CalibrationGraph';

const DEFAULT_ROWS = [
  { id: 'dry', condition: 'Dry', reading: '', moisture: '' },
  { id: 'moist', condition: 'Moist', reading: '', moisture: '' },
  { id: 'wet', condition: 'Wet', reading: '', moisture: '' },
];

let nextId = 0;
function uid() {
  nextId += 1;
  return `row-${Date.now()}-${nextId}`;
}

const INPUT =
  'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 focus:ring-2 border-slate-300 focus:border-emerald-500 focus:ring-emerald-200 dark:border-slate-700 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30';

const BTN_SEC =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-emerald-600 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40';

const BTN_GHOST =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-300 transition hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700';

function SectionHeading({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
        <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        {title}
      </h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
  );
}

function StatBox({ label, value, sub }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-700">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-mono text-xl font-bold text-slate-800 dark:text-slate-100">
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  );
}

function downloadCsv(filename, headers, rows) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CalibrationCalculator({ isDark }) {
  const [rows, setRows] = useState(DEFAULT_ROWS);

  const setRow = (id, field, value) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addRow = () =>
    setRows((rs) => [...rs, { id: uid(), condition: `Sample ${rs.length + 1}`, reading: '', moisture: '' }]);
  const removeRow = (id) => setRows((rs) => rs.filter((r) => r.id !== id));
  const clearRows = () => setRows(DEFAULT_ROWS);

  const fit = useMemo(
    () =>
      calculateLinearCalibration(
        rows
          .map((r) => ({ reading: r.reading, moisture: r.moisture }))
          .filter((p) => p.reading !== '' && p.moisture !== ''),
      ),
    [rows],
  );

  const graphPoints = fit.points.map((p) => ({
    reading: p.r,
    moisture: p.m,
  }));
  const maxReading =
    graphPoints.length > 0
      ? Math.max(...graphPoints.map((p) => p.reading))
      : 100;
  const graphLine =
    fit.a == null
      ? []
      : [
          { reading: 0, moisture: fit.b },
          { reading: maxReading, moisture: fit.a * maxReading + fit.b },
        ];

  // Field conversion
  const [fieldRows, setFieldRows] = useState([]);
  const [fieldLabel, setFieldLabel] = useState('');

  const addFieldRow = () => {
    const val = fieldLabel.trim() || `Sample ${fieldRows.length + 1}`;
    setFieldRows((fs) => [...fs, { id: uid(), label: val, reading: '' }]);
    setFieldLabel('');
  };
  const setField = (id, value) =>
    setFieldRows((fs) => fs.map((f) => (f.id === id ? { ...f, reading: value } : f)));
  const removeField = (id) => setFieldRows((fs) => fs.filter((f) => f.id !== id));
  const clearFields = () => setFieldRows([]);

  const canConvert = fit.a != null && fit.b != null;

  // Gravimetric moisture helper (oven-drying method)
  const [gravWet, setGravWet] = useState('');
  const [gravDry, setGravDry] = useState('');
  const gravResult = calculateGravimetricMoisture(gravWet, gravDry);

  const transferGrav = () => {
    if (gravResult == null) return;
    setRows((rs) => [
      ...rs,
      {
        id: uid(),
        condition: `Sample ${rs.length + 1}`,
        reading: '',
        moisture: formatNumber(gravResult, 4, false),
      },
    ]);
    setGravWet('');
    setGravDry('');
  };

  const prevExists = rows.filter((r) => r.reading !== '' && r.moisture !== '').length;
  const fitMessage =
    prevExists === 0
      ? null
      : prevExists < 2
        ? 'At least two calibration samples are needed to fit MC = aR + b.'
        : fit.a == null
          ? 'All calibration readings are identical (same instrument reading) — a linear fit cannot be defined.'
          : null;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex items-start gap-3 rounded-2xl bg-sky-50 px-5 py-4 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:ring-sky-900">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-sky-900 dark:text-sky-200">
          Build a calibration equation{' '}
          <span className="font-semibold">MC = a&middot;R + b</span> between an instrument
          reading (R) and gravimetric moisture content (MC, %) obtained by oven-drying.
          Enter at least two calibration samples (ideally Dry, Moist and Wet). The fitted
          equation is then applied to field readings.
        </p>
      </div>

      {/* Calibration samples */}
      <section>
        <div className="card p-5 sm:p-6">
          <SectionHeading
            icon={Ruler}
            title="Calibration Samples"
            subtitle="Instrument readings paired with gravimetric moisture content (%)."
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-wide text-slate-400 dark:border-slate-700 dark:text-slate-500">
                  <th className="py-2 pr-3">Condition / Sample</th>
                  <th className="py-2 pr-3">Instrument Reading (R)</th>
                  <th className="py-2 pr-3">Gravimetric Moisture (%)</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    <td className="py-2 pr-3">
                      <input
                        className={INPUT}
                        value={r.condition}
                        onChange={(e) => setRow(r.id, 'condition', e.target.value)}
                        aria-label="Condition or sample label"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        inputMode="decimal"
                        className={INPUT}
                        placeholder="e.g. 34"
                        value={r.reading}
                        onChange={(e) => setRow(r.id, 'reading', e.target.value)}
                        aria-label="Instrument reading"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        inputMode="decimal"
                        className={INPUT}
                        placeholder="e.g. 22.5"
                        value={r.moisture}
                        onChange={(e) => setRow(r.id, 'moisture', e.target.value)}
                        aria-label="Gravimetric moisture percent"
                      />
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeRow(r.id)}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                        title="Remove sample"
                        aria-label={`Remove ${r.condition}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={addRow} className={BTN_SEC}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add sample
            </button>
            <button type="button" onClick={clearRows} className={BTN_GHOST}>
              <Eraser className="h-4 w-4" aria-hidden="true" /> Reset to Dry / Moist / Wet
            </button>
          </div>
          {fitMessage && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {fitMessage}
            </div>
          )}
        </div>
      </section>

      {/* Gravimetric calculator helper */}
      <section>
        <div className="card p-5 sm:p-6">
          <SectionHeading
            icon={GraduationCap}
            title="Gravimetric Moisture Calculator"
            subtitle="Oven-drying method: MC = ((M_wet - M_dry) / M_dry) × 100."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Wet soil mass (g)
              </label>
              <input
                type="number"
                inputMode="decimal"
                className={INPUT}
                placeholder="e.g. 24.0"
                value={gravWet}
                onChange={(e) => setGravWet(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Dry soil mass (g)
              </label>
              <input
                type="number"
                inputMode="decimal"
                className={INPUT}
                placeholder="e.g. 18.0"
                value={gravDry}
                onChange={(e) => setGravDry(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <div className="w-full rounded-xl bg-emerald-50 px-4 py-2.5 text-center ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:ring-emerald-900">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  Moisture
                </p>
                <p className="font-mono text-lg font-bold text-emerald-800 dark:text-emerald-300">
                  {gravResult == null ? '\u2014' : `${formatNumber(gravResult, 4, false)} %`}
                </p>
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={transferGrav}
                disabled={gravResult == null}
                className={`${BTN_SEC} w-full`}
              >
                <Plus className="h-4 w-4" aria-hidden="true" /> Fill last sample
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Calibration equation + stats */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card flex h-full flex-col p-5 sm:p-6">
          <SectionHeading
            icon={Sigma}
            title="Calibration Equation"
            subtitle="Least-squares linear fit MC = aR + b."
          />
          {fit.a != null ? (
            <>
              <div className="rounded-xl bg-emerald-50 p-4 text-center ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:ring-emerald-900">
                <p className="font-mono text-lg font-bold text-emerald-800 dark:text-emerald-300">
                  {fit.equation}
                </p>
                <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                  Fitted from {fit.n} samples by ordinary least squares.
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <StatBox label="Slope (a)" value={formatNumber(fit.a, 4, false)} sub="% per reading unit" />
                <StatBox label="Intercept (b)" value={formatNumber(fit.b, 4, false)} sub="%" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <StatBox label="R²" value={formatNumber(fit.r2, 4, false)} sub="goodness of fit" />
                <StatBox label="RMSE" value={formatNumber(fit.rmse, 4, false)} sub="% moisture" />
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 py-10 text-center dark:bg-slate-800/50">
              <Sigma className="h-8 w-8 text-slate-300 dark:text-slate-600" aria-hidden="true" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No equation yet</p>
              <p className="max-w-xs text-xs text-slate-400 dark:text-slate-500">
                Enter at least two calibration samples with distinct readings.
              </p>
            </div>
          )}
        </div>

        <div className="card flex h-full flex-col p-5 sm:p-6">
          <SectionHeading icon={Ruler} title="Calibration Curve" subtitle="Reading vs gravimetric moisture." />
          <CalibrationGraph
            points={graphPoints}
            line={graphLine}
            hasData={graphPoints.length > 0}
            isDark={isDark}
          />
        </div>
      </section>

      {/* Field conversion */}
      <section>
        <div className="card p-5 sm:p-6">
          <SectionHeading
            icon={Ruler}
            title="Field Conversion"
            subtitle="Apply the calibration equation to field instrument readings → Estimated Reference-Equivalent Moisture Content."
          />
          {!canConvert && prevExists >= 2 ? (
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900">
              Fill in at least two distinct calibration readings above before converting field values.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Sample / location label
                  </label>
                  <input
                    className={`${INPUT} w-60`}
                    placeholder={`e.g. Plot A, depth 0-10 cm`}
                    value={fieldLabel}
                    onChange={(e) => setFieldLabel(e.target.value)}
                  />
                </div>
                <button type="button" onClick={addFieldRow} className={BTN_SEC}>
                  <Plus className="h-4 w-4" aria-hidden="true" /> Add field reading
                </button>
                {fieldRows.length > 0 && (
                  <button type="button" onClick={clearFields} className={BTN_GHOST}>
                    <Eraser className="h-4 w-4" aria-hidden="true" /> Clear
                  </button>
                )}
                {fieldRows.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const converted = fieldRows.map((f) => [
                        f.label,
                        f.reading,
                        applyCalibration(f.reading, fit.a, fit.b),
                      ]);
                      downloadCsv(
                        `field-conversion-${todayISO()}.csv`,
                        ['Sample / location', 'Instrument reading (R)', 'Estimated moisture (%)'],
                        converted,
                      );
                    }}
                    className={`${BTN_SEC} ml-auto`}
                  >
                    <Download className="h-4 w-4" aria-hidden="true" /> CSV
                  </button>
                )}
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-wide text-slate-400 dark:border-slate-700 dark:text-slate-500">
                      <th className="py-2 pr-3">Sample / location</th>
                      <th className="py-2 pr-3">Instrument reading (R)</th>
                      <th className="py-2 text-right">Estimated Reference-Equivalent Moisture (%)</th>
                      <th className="py-2 pl-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fieldRows.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-sm text-slate-400">
                          Add field readings to convert them with the fitted equation.
                        </td>
                      </tr>
                    )}
                    {fieldRows.map((f) => {
                      const mc = applyCalibration(f.reading, fit.a, fit.b);
                      return (
                        <tr key={f.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                          <td className="py-2 pr-3 font-medium text-slate-700 dark:text-slate-200">{f.label}</td>
                          <td className="py-2 pr-3">
                            <input
                              type="number"
                              inputMode="decimal"
                              className={`${INPUT} w-40`}
                              placeholder="e.g. 45"
                              value={f.reading}
                              onChange={(e) => setField(f.id, e.target.value)}
                              aria-label="Field instrument reading"
                            />
                          </td>
                          <td className="py-2 text-right">
                            <span className={`font-mono font-bold ${mc == null ? 'text-slate-400' : 'text-emerald-700 dark:text-emerald-300'}`}>
                              {mc == null ? '\u2014' : `${formatNumber(mc, 4, false)} %`}
                            </span>
                          </td>
                          <td className="py-2 pl-3 text-right">
                            <button
                              type="button"
                              onClick={() => removeField(f.id)}
                              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                              title="Remove reading"
                              aria-label={`Remove ${f.label}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>

      <footer className="print:hidden pt-4 pb-8 text-center">
        <p className="mt-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
          KunsatCalculator — Soil Physics Instruments
        </p>
      </footer>
    </main>
  );
}
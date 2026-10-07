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
  calculateBulkDensity,
  calculateVolumetricMoisture,
  applyCalibration,
} from '../utils/calibration';
import { exportFieldExcel, exportFieldPdf } from '../utils/fieldExport';
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

  // Instrument readings are volumetric; reference moisture is gravimetric
  // (g/g). When a bulk density is supplied we convert references to volumetric:
  //   cv = cw * rho_b / rho_w
  // and fit the calibration on the volumetric basis.
  const [bulkDensity, setBulkDensity] = useState('');
  const [waterDensity, setWaterDensity] = useState('1');

  const rhoB = bulkDensity === '' ? null : Number(bulkDensity);
  const rhoW = Number(waterDensity);
  const volumetricActive = rhoB != null && Number.isFinite(rhoB) && rhoB > 0;
  const volumetric = (moisture) => {
    if (!volumetricActive) return null;
    if (!Number.isFinite(rhoW) || rhoW <= 0) return null;
    return calculateVolumetricMoisture(Number(moisture), rhoB, rhoW);
  };

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
          .map((r) => {
            const cw = r.moisture;
            const m = cw !== '' && volumetric(cw) != null ? volumetric(cw) : cw;
            return { reading: r.reading, moisture: m };
          })
          .filter((p) => p.reading !== '' && p.moisture !== ''),
      ),
    [rows, bulkDensity, waterDensity],
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
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [copiedMsg, setCopiedMsg] = useState('');

  const convertedFieldRows = () =>
    fieldRows.map((f) => {
      const mc = applyCalibration(f.reading, fit.a, fit.b);
      return {
        label: f.label,
        reading: f.reading,
        moisture: mc == null ? null : mc,
      };
    });

  const importJson = () => {
    setJsonError('');
    let parsed;
    try {
      parsed = JSON.parse(jsonText.trim());
    } catch {
      setJsonError('Invalid JSON — please check the syntax.');
      return;
    }
    if (!Array.isArray(parsed)) {
      setJsonError('JSON must be an array of numbers or objects.');
      return;
    }
    const rowsArr = parsed.map((item, idx) => {
      if (typeof item === 'number' || (typeof item === 'string' && item !== '')) {
        return { id: uid(), label: `Sample ${idx + 1}`, reading: String(item) };
      }
      if (typeof item === 'object' && item !== null) {
        const label = item.label ?? item.sample ?? item.name ?? item.location;
        const reading = item.reading ?? item.value ?? item.r;
        return { id: uid(), label: label ? String(label) : `Sample ${idx + 1}`, reading: String(reading ?? '') };
      }
      return null;
    });
    const valid = rowsArr.filter(Boolean);
    if (valid.length === 0) {
      setJsonError('No readings found in the JSON — use e.g. [{"label":"Plot A","reading":45}, ...] or [45, 52, 38].');
      return;
    }
    setFieldRows((fs) => [...fs, ...valid]);
    setJsonText('');
  };

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
  const [gravVolume, setGravVolume] = useState('');
  const gravResult = calculateGravimetricMoisture(gravWet, gravDry);
  const bulkDensityResult = calculateBulkDensity(gravDry, gravVolume);
  const volumetricResult = calculateVolumetricMoisture(gravResult, bulkDensityResult, rhoW);

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
    if (bulkDensityResult != null && bulkDensity === '') {
      setBulkDensity(formatNumber(bulkDensityResult, 4, false));
    }
    setGravWet('');
    setGravDry('');
    setGravVolume('');
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
          reading (R, volumetric) and reference moisture content obtained by oven-drying
          (gravimetric, g/g). Enter at least two calibration samples (ideally Dry, Moist
          and Wet). When a bulk density and density of water are supplied, gravimetric
          references are converted to volumetric (
          <span className="font-semibold">c&#118; = c&#119; &middot; &rho;&#8310; / &rho;&#119;</span>)
          before fitting. The fitted equation is then applied to field readings.
        </p>
      </div>

      {/* Calibration samples */}
      <section>
        <div className="card p-5 sm:p-6">
          <SectionHeading
            icon={Ruler}
            title="Calibration Samples"
            subtitle="Instrument readings (volumetric) paired with reference gravimetric moisture content (%)."
          />
          <div className="mb-4 grid gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 sm:grid-cols-3 dark:bg-slate-800/50 dark:ring-slate-700">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Bulk density &rho;&#8310; (g/cm³)
              </label>
              <input
                type="number"
                inputMode="decimal"
                className={INPUT}
                placeholder="e.g. 1.40"
                value={bulkDensity}
                onChange={(e) => setBulkDensity(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Density of water &rho;&#119; (unit must match)
              </label>
              <select
                className={INPUT}
                value={waterDensity}
                onChange={(e) => setWaterDensity(e.target.value)}
              >
                <option value="1">1 g/cm³ (0.001 kg/cm³)</option>
                <option value="1000">1000 kg/m³</option>
              </select>
            </div>
            <div className="flex items-end">
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Reference moisture is converted to volumetric before fitting:{' '}
                <span className="font-semibold">
                  c&#118; = c&#119; &middot; &rho;&#8310; / &rho;&#119;
                </span>
                . Leave bulk density empty to fit on gravimetric values directly.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-wide text-slate-400 dark:border-slate-700 dark:text-slate-500">
                  <th className="py-2 pr-3">Condition / Sample</th>
                  <th className="py-2 pr-3">Instrument Reading (R)</th>
                  <th className="py-2 pr-3">Reference Gravimetric (%)</th>
                  {volumetricActive && <th className="py-2 pr-3">Volumetric (%)</th>}
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
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*[.,]?[0-9]*"
                        className={INPUT}
                        placeholder="e.g. 22.5"
                        value={r.moisture}
                        onChange={(e) => setRow(r.id, 'moisture', e.target.value)}
                        aria-label="Reference gravimetric moisture percent"
                      />
                    </td>
                    {volumetricActive && (
                      <td className="py-2 pr-3">
                        <span className="font-mono text-emerald-700 dark:text-emerald-300">
                          {r.moisture === '' || volumetric(r.moisture) == null
                            ? '\u2014'
                            : `${formatNumber(volumetric(r.moisture), 4, false)}`}
                        </span>
                      </td>
                    )}
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
            subtitle="Oven-drying method: MC = ((M_wet - M_dry) / M_dry) × 100. Add the sample volume to also get bulk density and volumetric moisture."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Sample volume (cm³)
              </label>
              <input
                type="number"
                inputMode="decimal"
                className={INPUT}
                placeholder="e.g. 14.7"
                value={gravVolume}
                onChange={(e) => setGravVolume(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <div className="w-full rounded-xl bg-emerald-50 px-4 py-2.5 text-center ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:ring-emerald-900">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  Moisture
                </p>
                <p className="font-mono text-base font-bold text-emerald-800 dark:text-emerald-300">
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
            <div className="flex items-end">
              <div className="w-full rounded-xl bg-sky-50 px-4 py-2.5 text-center ring-1 ring-sky-200 dark:bg-sky-950/40 dark:ring-sky-900">
                <p className="text-xs font-bold uppercase tracking-wide text-sky-600 dark:text-sky-400">
                  Bulk density
                </p>
                <p className="font-mono text-base font-bold text-sky-800 dark:text-sky-300">
                  {bulkDensityResult == null ? '\u2014' : `${formatNumber(bulkDensityResult, 4, false)} g/cm³`}
                </p>
              </div>
            </div>
            <div className="flex items-end">
              <div className="w-full rounded-xl bg-emerald-50 px-4 py-2.5 text-center ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:ring-emerald-900">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  Volumetric moisture
                </p>
                <p className="font-mono text-base font-bold text-emerald-800 dark:text-emerald-300">
                  {volumetricResult == null
                    ? '\u2014'
                    : `${formatNumber(volumetricResult, 4, false)} %`}
                </p>
              </div>
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
          <SectionHeading icon={Ruler} title="Calibration Curve" subtitle="Reading vs reference moisture." />
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
            subtitle={`Apply the calibration equation to field instrument readings → Estimated ${volumetricActive ? 'Volumetric' : 'Reference-Equivalent'} Moisture Content.`}
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
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        downloadCsv(
                          `field-conversion-${todayISO()}.csv`,
                          ['Sample / location', 'Instrument reading (R)', 'Estimated moisture (%)'],
                          convertedFieldRows().map((f) => [
                            f.label,
                            f.reading,
                            f.moisture == null ? '' : formatNumber(f.moisture, 2, false),
                          ]),
                        );
                        setCopiedMsg('CSV downloaded.');
                      }}
                      className={`${BTN_SEC} ml-auto`}
                    >
                      <Download className="h-4 w-4" aria-hidden="true" /> CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const rows = convertedFieldRows().map((f) => ({
                          label: f.label,
                          reading: f.reading,
                          moisture: f.moisture,
                        }));
                        exportFieldExcel(rows).then(() => {
                          setCopiedMsg('Excel workbook downloaded.');
                        });
                      }}
                      className={BTN_SEC}
                    >
                      <Download className="h-4 w-4" aria-hidden="true" /> Excel (.xlsx)
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const rows = convertedFieldRows().map((f) => ({
                          label: f.label,
                          reading: f.reading,
                          moisture: f.moisture,
                        }));
                        await exportFieldPdf(rows);
                        setCopiedMsg('PDF report downloaded.');
                      }}
                      className={BTN_GHOST}
                    >
                      <Download className="h-4 w-4" aria-hidden="true" /> PDF
                    </button>
                  </>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Bulk import via JSON (paste readings)
                </label>
                <textarea
                  rows={3}
                  className={`${INPUT} w-full font-mono text-xs`}
                  placeholder={'[{"label":"Plot A","reading":45},{"label":"Plot B","reading":52}]'}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={importJson} disabled={!jsonText.trim()} className={BTN_SEC}>
                    <Plus className="h-4 w-4" aria-hidden="true" /> Import readings
                  </button>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    Accepts an array of numbers (<code>[45, 52, 38]</code>) or objects with
                    <code> label/reading</code>, <code>sample/value</code> or <code>name/location</code>.
                  </span>
                </div>
                {jsonError && (
                  <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">{jsonError}</p>
                )}
              </div>

              {copiedMsg && (
                <p className="no-print mt-3 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900">
                  {copiedMsg}
                </p>
              )}

              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-wide text-slate-400 dark:border-slate-700 dark:text-slate-500">
                      <th className="py-2 pr-3">Sample / location</th>
                      <th className="py-2 pr-3">Instrument reading (R)</th>
                      <th className="py-2 text-right">
                        Estimated {volumetricActive ? 'Volumetric' : 'Reference-Equivalent'} Moisture (%)
                      </th>
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
                              type="text"
                              inputMode="decimal"
                              pattern="[0-9]*[.,]?[0-9]*"
                              className={`${INPUT} w-40`}
                              placeholder="e.g. 45"
                              value={f.reading}
                              onChange={(e) => setField(f.id, e.target.value)}
                              aria-label="Field instrument reading"
                            />
                          </td>
                          <td className="py-2 text-right">
                            <span className={`font-mono font-bold ${mc == null ? 'text-slate-400' : 'text-emerald-700 dark:text-emerald-300'}`}>
                              {mc == null ? '\u2014' : `${formatNumber(mc, 2, false)} %`}
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
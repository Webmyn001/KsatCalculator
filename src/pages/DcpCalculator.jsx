import { useMemo, useRef, useState } from 'react';
import {
  Droplets,
  Gauge,
  GraduationCap,
  ClipboardList,
  Plus,
  Trash2,
  Eraser,
  Calculator,
  Download,
  Printer,
  AlertTriangle,
} from 'lucide-react';
import {
  ENERGY,
  TRANSITION_INTERVAL,
  fmt,
  calculateEnergies,
  calculateRangeSummary,
  calculateSoilStrength,
  validateReadings,
} from '../utils/dcp';

const EXAMPLE_DEPTHS = [70, 124, 150, 196, 233, 300, 310];

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

function Dash({ value }) {
  return <span>{value === null || value === undefined ? '—' : value}</span>;
}

function TypeBadge({ row }) {
  if (row.type !== 'transition') {
    return <span className="badge-normal inline-block rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">Normal</span>;
  }
  return (
    <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
      Transition
      {row.inserted && (
        <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          auto
        </span>
      )}
    </span>
  );
}

export default function DcpCalculator() {
  const [readings, setReadings] = useState([]);
  const [results, setResults] = useState(null);
  const [issues, setIssues] = useState([]);
  const idRef = useRef(1);
  const resultsRef = useRef(null);

  const updateReading = (id, depth) => {
    setReadings((prev) => prev.map((r) => (r.id === id ? { ...r, depth } : r)));
    setResults(null);
  };

  const addReading = () => {
    setReadings((prev) => [...prev, { id: idRef.current++, depth: null }]);
    setResults(null);
  };

  const deleteReading = (id) => {
    setReadings((prev) => prev.filter((r) => r.id !== id));
    setResults(null);
  };

  const clearAll = () => {
    setReadings([]);
    setResults(null);
    setIssues([]);
  };

  const loadExample = () => {
    setReadings(EXAMPLE_DEPTHS.map((depth) => ({ id: idRef.current++, depth })));
    setResults(null);
    setIssues([]);
  };

  const calculate = () => {
    const problems = validateReadings(readings);
    setIssues(problems);
    if (problems.length) {
      setResults(null);
      return;
    }
    const detail = calculateEnergies(readings);
    const rangeSummary = calculateRangeSummary(detail);
    const total = calculateSoilStrength(detail);
    setResults({ detail, rangeSummary, total });
    setTimeout(
      () => resultsRef.current && resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      60,
    );
  };

  const downloadCsv = () => {
    if (!results) {
      setIssues(['Please click "Calculate Results" before downloading.']);
      return;
    }
    const { detail, rangeSummary, total } = results;
    const csv = [
      'Dynamic Cone Penetrometer Soil Strength Calculator',
      'Department of Soil Science and Land Resources Management, Obafemi Awolowo University',
      `Energy constant: ${ENERGY} kPa/kg/cm2 - Transition interval: ${TRANSITION_INTERVAL} mm`,
      '',
      'Detailed DCP Calculation',
      'Serial No.,Depth (mm),Previous Depth,Next Depth,Transition Point,Energy,Type,Calculation',
      ...detail.map(
        (r) =>
          [
            r.serial,
            r.depth,
            r.prevDepth === null ? '' : r.prevDepth,
            r.nextDepth === null ? '' : r.nextDepth,
            r.transitionPoint === null ? '' : r.transitionPoint,
            fmt(r.energy),
            r.type,
            r.calc === null ? '' : r.calc,
          ].join(','),
      ),
      '',
      'Soil Strength Summary',
      'Depth Range,Soil Strength (kPa)',
      ...rangeSummary.ranges.map((r) => `${r.label},${fmt(r.value)}`),
      '',
      `Total Soil Strength (kPa),${fmt(total)}`,
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dcp-calculator-results.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const inputRows = useMemo(
    () =>
      readings.map((r, idx) => (
        <tr key={r.id}>
          <td className="px-4 py-2 text-right font-variant-numeric tabular-nums text-slate-600 dark:text-slate-300">
            {idx + 1}
          </td>
          <td className="px-4 py-2">
            <input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              autoComplete="off"
              placeholder="Depth (mm)"
              value={r.depth === null || r.depth === undefined ? '' : r.depth}
              onChange={(e) => {
                const v = e.target.value.trim();
                updateReading(r.id, v === '' ? null : Number(v));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addReading();
                }
              }}
              className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-emerald-900"
            />
          </td>
          <td className="px-4 py-2 text-right">
            <button
              type="button"
              onClick={() => deleteReading(r.id)}
              title="Delete reading"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </td>
        </tr>
      )),
    [readings],
  );

  const detailRows = useMemo(() => {
    if (!results) return null;
    return results.detail.map((r) => (
      <tr key={`${r.serial}-${r.depth}`} className={r.type === 'transition' ? 'bg-emerald-50 dark:bg-emerald-950/30' : ''}>
        <td className="px-4 py-2 text-right font-variant-numeric tabular-nums">{r.serial}</td>
        <td className="px-4 py-2 text-right font-variant-numeric tabular-nums">{r.depth} mm</td>
        <td className="px-4 py-2 text-right font-variant-numeric tabular-nums text-slate-500 dark:text-slate-400">
          <Dash value={r.prevDepth} />
        </td>
        <td className="px-4 py-2 text-right font-variant-numeric tabular-nums text-slate-500 dark:text-slate-400">
          <Dash value={r.nextDepth} />
        </td>
        <td className="px-4 py-2 text-right font-variant-numeric tabular-nums text-emerald-700 dark:text-emerald-400">
          <Dash value={r.transitionPoint} />
        </td>
        <td className="px-4 py-2 text-right font-variant-numeric tabular-nums font-semibold">{fmt(r.energy)}</td>
        <td className="px-4 py-2">
          <TypeBadge row={r} />
        </td>
        <td className="px-4 py-2 text-xs font-mono text-emerald-800 dark:text-emerald-300">
          {r.calc ? r.calc : '—'}
        </td>
      </tr>
    ));
  }, [results]);

  const summaryRows = useMemo(() => {
    if (!results) return null;
    return results.rangeSummary.ranges.map((r) => (
      <tr key={r.label}>
        <td className="px-4 py-2">
          {r.label}
          <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">({r.depthSpec})</span>
        </td>
        <td className="px-4 py-2 text-right font-variant-numeric tabular-nums font-semibold">{fmt(r.value)}</td>
      </tr>
    ));
  }, [results]);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <div className="no-print flex items-start gap-3 rounded-2xl bg-emerald-50 px-5 py-4 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:ring-emerald-900">
        <Gauge className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-emerald-900 dark:text-emerald-200">
          DCP procedure: 8 kg load dropped freely from 50 cm until penetration reaches 200 mm. Each drop records a
          serial number and depth (mm). Energy constant <span className="font-semibold">{ENERGY} kPa/kg/cm²</span>,
          transition levels every <span className="font-semibold">{TRANSITION_INTERVAL} mm</span> (150, 300, 450, …).
          Method as taught at the{' '}
          <span className="font-semibold">Department of Soil Science and Land Resources Management, O.A.U.</span>
        </p>
      </div>

      <div className="print-only">
        <h1 className="text-xl font-extrabold text-emerald-800">DYNAMIC CONE PENETROMETER SOIL STRENGTH CALCULATOR</h1>
        <p className="text-sm">Department of Soil Science and Land Resources Management, Obafemi Awolowo University</p>
        <p className="text-sm">
          Energy constant: {ENERGY} kPa/kg/cm² &middot; Transition interval: {TRANSITION_INTERVAL} mm
        </p>
        <hr className="my-2 border-slate-400" />
      </div>

      <section className="card no-print p-5 sm:p-6">
        <SectionHeading
          icon={ClipboardList}
          title="Enter Readings"
          subtitle="Serial numbers are generated automatically. Enter only the depth reading (mm) after each drop."
        />
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <th className="px-4 py-2.5 text-right">Serial No.</th>
                <th className="px-4 py-2.5 text-left">Depth (mm)</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {inputRows}
              {readings.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                    No readings yet. Click “Add Reading” or “Load Example” to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addReading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Reading
          </button>
          <button
            type="button"
            onClick={loadExample}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Load Example
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950"
          >
            <Eraser className="h-4 w-4" aria-hidden="true" />
            Clear All
          </button>
          <button
            type="button"
            onClick={calculate}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-300 transition hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900 dark:hover:bg-emerald-950"
          >
            <Calculator className="h-4 w-4" aria-hidden="true" />
            Calculate Results
          </button>
        </div>
        <p className="mt-3 text-xs font-semibold text-slate-400 dark:text-slate-500">
          {readings.length ? `${readings.length} reading(s) entered` : 'No readings yet'}
        </p>
      </section>

      {issues.length > 0 && (
        <div className="no-print rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Please fix the following before calculating:
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {issues.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      <section ref={resultsRef} className="card p-5 sm:p-6">
        <SectionHeading
          icon={Droplets}
          title="Detailed Calculation"
          subtitle="Transition rows are shown in green. The interpolation formula used for each transition point is shown in the last column."
        />
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <th className="px-4 py-2.5 text-right">Serial No.</th>
                <th className="px-4 py-2.5 text-right">Depth (mm)</th>
                <th className="px-4 py-2.5 text-right">Prev. Depth</th>
                <th className="px-4 py-2.5 text-right">Next Depth</th>
                <th className="px-4 py-2.5 text-right">Transition Point</th>
                <th className="px-4 py-2.5 text-right">Energy</th>
                <th className="px-4 py-2.5 text-left">Type</th>
                <th className="px-4 py-2.5 text-left">Calculation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {detailRows}
              {!results && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                    Enter readings and click “Calculate Results” to see the full calculation table.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <SectionHeading
          icon={Gauge}
          title="Soil Strength Summary"
          subtitle="Energy values summed per 150 mm depth band."
        />
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <th className="px-4 py-2.5 text-left">Depth Range</th>
                <th className="px-4 py-2.5 text-right">Soil Strength (kPa)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{summaryRows}</tbody>
          </table>
        </div>

        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
          <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Total Soil Strength: </span>
          <span className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-300">
            {results ? fmt(results.total) : '—'}
          </span>
          <span className="ml-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">kPa</span>
        </div>

        <div className="no-print mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={downloadCsv}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Print / Save as PDF
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950"
          >
            <Eraser className="h-4 w-4" aria-hidden="true" />
            Clear / Reset All
          </button>
        </div>

        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          Soil strength is the sum of all energy values within each 150 mm depth band, following the OAU Soil Science
          class convention. Energy uses the constant {ENERGY} kPa/kg/cm² and the total is reported in kPa.
        </p>
      </section>

      <footer className="pt-4 pb-8 text-center">
        <div className="mx-auto flex max-w-xl items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <GraduationCap className="h-4 w-4" aria-hidden="true" />
          <span>
            Built for the Department of Soil Science and Land Resources Management, Obafemi Awolowo University, Ile-Ife,
            Osun State.
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-300 dark:text-slate-600">
          KunsatCalculator — Mini Disk Infiltrometer &amp; DCP Calculators
        </p>
      </footer>
    </main>
  );
}
import {
  FileSpreadsheet,
  FileText,
  ImageDown,
  Copy,
  PlusCircle,
  Download,
} from 'lucide-react';
import { exportExcel } from '../utils/excelExport';
import { exportPdf } from '../utils/pdfExport';
import { exportGraphPng, copyTableToClipboard } from '../utils/clipboard';
import { formatDate } from '../utils/formatting';
import { calculateSorptivity } from '../utils/sorptivity';

const BTN =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ring-1 transition disabled:cursor-not-allowed disabled:opacity-40';

export default function ExportButtons({
  calc,
  graphRef,
  toast,
}) {
  const { state, derived, reset } = calc;
  const { experiment, soilTexture, aParam, unit, scientific } = state;
  const { rows, regression, k } = derived;
  const dateGenerated = new Date().toISOString().slice(0, 10);

  const sorptivity = calculateSorptivity(
    rows
      .filter((r) => r.time > 0 && r.cumulativeCm != null)
      .map((r) => ({ time: r.time, cumulativeInfiltration: r.cumulativeCm })),
  );

  const busy = (fn) => async () => {
    try {
      await fn();
    } catch (err) {
      console.error(err);
      toast('Something went wrong. Please try again.', 'warning');
    }
  };

  const handleExcel = busy(async () => {
    await exportExcel({
      experiment,
      soilTexture,
      aParam,
      rows,
      regression,
      k,
      unit,
      dateGenerated,
      sorptivity,
    });
    toast('Excel workbook downloaded.');
  });

  const handlePdf = busy(async () => {
    await exportPdf({
      experiment,
      soilTexture,
      aParam,
      rows,
      regression,
      k,
      unit,
      graphRef,
      dateGenerated,
      sorptivity,
    });
    toast('PDF report downloaded.');
  });

  const handlePng = busy(async () => {
    await exportGraphPng(graphRef);
    toast('Graph image downloaded.');
  });

  const handleCopy = busy(async () => {
    await copyTableToClipboard(rows, unit);
    toast('Table copied — paste directly into Excel.');
  });

  const handleNew = () => {
    if (
      !window.confirm(
        'Start a new experiment? The current data will be archived to the session history.',
      )
    ) {
      return;
    }
    const item = reset();
    toast(
      item
        ? 'New experiment started. Previous results saved to history.'
        : 'New experiment started.',
    );
  };

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
          <Download className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          Download &amp; Share
        </h2>
        <span className="hidden text-xs text-slate-400 dark:text-slate-500 sm:inline">
          Date generated: {formatDate(dateGenerated)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <button
          onClick={handleExcel}
          disabled={!rows.some((r) => r.volume != null)}
          className={`${BTN} bg-emerald-600 text-white ring-emerald-600 hover:bg-emerald-700`}
        >
          <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
          Excel (.xlsx)
        </button>
        <button
          onClick={handlePdf}
          disabled={!rows.some((r) => r.volume != null)}
          className={`${BTN} bg-rose-600 text-white ring-rose-600 hover:bg-rose-700`}
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          PDF Report
        </button>
        <button
          onClick={handlePng}
          disabled={!rows.some((r) => r.volume != null)}
          className={`${BTN} bg-sky-600 text-white ring-sky-600 hover:bg-sky-700`}
        >
          <ImageDown className="h-4 w-4" aria-hidden="true" />
          Graph PNG
        </button>
        <button
          onClick={handleCopy}
          disabled={!rows.some((r) => r.volume != null)}
          className={`${BTN} bg-slate-700 text-white ring-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:ring-slate-600 dark:hover:bg-slate-500`}
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy Table
        </button>
        <button
          onClick={handleNew}
          className={`${BTN} bg-amber-500 text-white ring-amber-500 hover:bg-amber-600`}
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          New Experiment
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
        Scientific notation: {scientific ? 'on' : 'off'} · Unit: {unit}. All reports include the
        experiment information, table, equation, R², hydraulic conductivity and sorptivity.
      </p>
    </div>
  );
}

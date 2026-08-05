import { useState } from 'react';
import {
  History,
  ChevronDown,
  FolderOpen,
  Trash2,
  X,
  Gauge,
} from 'lucide-react';
import { formatDate, formatNumber } from '../utils/formatting';

export default function HistoryPanel({
  history,
  onRestore,
  onRemove,
  onClear,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
          <History className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          Calculation History
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {history.length}
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 dark:border-slate-800">
          {history.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-slate-50 py-8 text-center dark:bg-slate-800/50">
              <FolderOpen className="h-8 w-8 text-slate-300 dark:text-slate-600" aria-hidden="true" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                No saved experiments this session
              </p>
              <p className="max-w-xs text-xs text-slate-400 dark:text-slate-500">
                Completed experiments are archived here when you start a new one. History is kept
                only for the current session.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex justify-end">
                <button
                  onClick={onClear}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50 dark:text-rose-400 dark:ring-rose-900 dark:hover:bg-rose-950/30"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Clear history
                </button>
              </div>
              <ul className="space-y-3">
                {history.map((h) => (
                  <li
                    key={h.id}
                    className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100 dark:bg-slate-800/50 dark:ring-slate-800"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                          {h.experiment.name || 'Untitled experiment'}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                          {h.experiment.date ? formatDate(h.experiment.date) : '—'}
                          {h.experiment.location ? ` · ${h.experiment.location}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                          <Gauge className="h-3 w-3" aria-hidden="true" />
                          K = {h.k != null ? formatNumber(h.k, 6) : '—'} cm/s
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Total inf.: {h.totalInfiltrationCm3 != null ? formatNumber(h.totalInfiltrationCm3, 2) : '—'} cm³
                      </span>
                      <span>R² = {h.r2 != null ? formatNumber(h.r2, 4) : '—'}</span>
                      <span>Soil: {h.soilTexture || 'Custom'} (A = {h.aParam ?? '—'})</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => onRestore(h)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                      >
                        <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
                        Restore
                      </button>
                      <button
                        onClick={() => onRemove(h.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50 dark:text-rose-400 dark:ring-rose-900 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

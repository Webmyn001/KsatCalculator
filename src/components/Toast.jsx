import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ICONS = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-400" />,
  info: <Info className="h-4 w-4 text-sky-400" />,
};

export default function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-pop pointer-events-auto flex items-start gap-2.5 rounded-xl bg-slate-800 px-4 py-3 text-sm text-white shadow-xl ring-1 ring-white/10 dark:bg-slate-700"
        >
          <span className="mt-0.5 shrink-0">{ICONS[t.type] || ICONS.info}</span>
          <span className="flex-1">{t.msg}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="shrink-0 rounded p-0.5 text-slate-400 transition hover:text-white"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

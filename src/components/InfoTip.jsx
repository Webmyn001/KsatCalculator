import { Info } from 'lucide-react';

export default function InfoTip({ text, className = '' }) {
  return (
    <span className={`group relative inline-flex align-middle ${className}`}>
      <Info
        className="h-3.5 w-3.5 cursor-help text-slate-400 transition hover:text-emerald-600 dark:hover:text-emerald-400"
        aria-hidden="true"
      />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-64 -translate-x-1/2 rounded-lg bg-slate-800 px-3 py-2 text-left text-xs font-normal leading-snug text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:block group-hover:opacity-100 dark:bg-slate-700">
        {text}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700" />
      </span>
    </span>
  );
}

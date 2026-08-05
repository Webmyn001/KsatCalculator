import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  ClipboardList,
  MapPin,
  Mountain,
  User,
  CalendarDays,
} from 'lucide-react';

const FIELDS = [
  {
    name: 'name',
    label: 'Experiment Name',
    placeholder: 'e.g. Plot A — Hillside field',
    icon: ClipboardList,
    required: true,
  },
  {
    name: 'location',
    label: 'Location (optional)',
    placeholder: 'e.g. O.A.U. Teaching and Research Farm',
    icon: MapPin,
  },
  {
    name: 'soilType',
    label: 'Soil Type (optional)',
    placeholder: 'e.g. Sandy loam',
    icon: Mountain,
  },
  {
    name: 'researcher',
    label: 'Researcher Name (optional)',
    placeholder: 'e.g. Adetola O. B.',
    icon: User,
  },
];

const inputClass = (hasError) =>
  `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 focus:ring-2 ${
    hasError
      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-500 dark:focus:ring-rose-500/30'
      : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200 dark:border-slate-700 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30'
  }`;

export default function ExperimentForm({ experiment, onChange, formVersion }) {
  const {
    register,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: experiment, mode: 'onChange' });

  useEffect(() => {
    reset(experiment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formVersion]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {FIELDS.map(({ name, label, placeholder, icon: Icon, required }) => (
        <div key={name} className={name === 'name' ? 'sm:col-span-2' : ''}>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            {label}
            {required && <span className="text-rose-500">*</span>}
          </label>
          <input
            type="text"
            placeholder={placeholder}
            aria-invalid={Boolean(errors[name])}
            className={inputClass(Boolean(errors[name]))}
            {...register(name, {
              ...(required ? { required: 'Experiment name is required' } : {}),
              onChange: (e) => onChange(name, e.target.value),
            })}
          />
          {errors[name] && (
            <p className="mt-1 text-xs font-medium text-rose-500">
              {errors[name].message}
            </p>
          )}
        </div>
      ))}

      <div className="sm:col-span-2">
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <CalendarDays className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          Date
        </label>
        <input
          type="date"
          className={`${inputClass(false)} max-w-xs`}
          {...register('date', {
            onChange: (e) => onChange('date', e.target.value),
          })}
        />
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
          Automatically set to today&apos;s date.
        </p>
      </div>
    </div>
  );
}

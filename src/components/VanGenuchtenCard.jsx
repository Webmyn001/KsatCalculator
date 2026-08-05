import { Layers, Wrench } from 'lucide-react';
import { SOIL_TEXTURES } from '../constants/soils';
import InfoTip from './InfoTip';

export default function VanGenuchtenCard({
  soilTexture,
  aParam,
  onSelectTexture,
  onAParamChange,
}) {
  const aValue = aParam != null ? String(aParam) : '';

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
          <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          Van Genuchten Parameter (A)
        </h2>
        <InfoTip text="The A parameter links the van Genuchten soil hydraulic parameters (α, n) to the infiltrometer disk radius and applied suction. It is determined by soil texture." />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Soil Texture (auto-fills A)
          </label>
          <select
            value={soilTexture ?? ''}
            onChange={(e) => onSelectTexture(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30"
          >
            <option value="">— Select soil texture —</option>
            {SOIL_TEXTURES.map((s) => (
              <option key={s.texture} value={s.texture}>
                {s.texture} (A = {s.a})
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
            Values for the Mini Disk at 2 cm suction (Zhang, 1997).
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            A Parameter (manual override)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="any"
              value={aValue}
              onChange={(e) => onAParamChange(e.target.value)}
              placeholder="e.g. 6.27"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30"
            />
            {soilTexture === null && aParam != null && (
              <Wrench
                className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-amber-500"
                aria-hidden="true"
              />
            )}
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
            {soilTexture === null && aParam != null ? (
              <>
                Custom value — texture lookup cleared.
              </>
            ) : (
              'Select a texture above, or type a custom value.'
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs leading-relaxed text-emerald-900 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900">
        Example values depend on soil texture — e.g. Sand ≈ 1.73, Loam ≈ 6.27,
        Clay ≈ 4.30. The selected value is used as the divisor in K = C₁ / A.
      </div>
    </div>
  );
}

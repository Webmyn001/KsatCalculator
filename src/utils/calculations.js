import { TIMES, DISK_AREA } from '../constants/times';
import { round } from './formatting';

/**
 * Parse a raw volume cell string into a non-negative number (or null).
 */
export function parseVolumeInput(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (s === '') return null;
  const num = Number(s);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
}

/**
 * Build the full measurement table from raw volume inputs.
 * Infiltration:  I0 = 0,  Ii = V(i-1) - Vi
 * Cumulative:    Cum(i) = Cum(i-1) + Ii
 * Depth:         CumCm = Cum / DiskArea (14.53 cm²)
 */
export function buildRows(volumeInputs) {
  const volumes = volumeInputs.map(parseVolumeInput);
  const rows = [];
  let cumulative = null;

  for (let i = 0; i < TIMES.length; i += 1) {
    const v = volumes[i];
    const vPrev = i > 0 ? volumes[i - 1] : null;

    let infiltration = null;
    if (i === 0) infiltration = 0;
    else if (v !== null && vPrev !== null) infiltration = round(vPrev - v, 6);

    if (i === 0) cumulative = 0;
    else if (cumulative !== null && infiltration !== null) {
      cumulative = round(cumulative + infiltration, 6);
    } else {
      cumulative = null;
    }

    rows.push({
      index: i,
      time: TIMES[i],
      sqrtTime: round(Math.sqrt(TIMES[i]), 4),
      volume: v,
      infiltration,
      cumulative,
      cumulativeCm: cumulative !== null ? round(cumulative / DISK_AREA, 6) : null,
    });
  }

  return { rows, volumes };
}

/**
 * Hydraulic conductivity: K = C1 / A, with C1 = a (quadratic coefficient),
 * A = Van Genuchten parameter for the selected soil texture.
 */
export function computeHydraulicConductivity(aCoef, aParam) {
  if (!Number.isFinite(aCoef) || !Number.isFinite(aParam) || aParam === 0) {
    return null;
  }
  return aCoef / aParam;
}

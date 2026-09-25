/**
 * Soil moisture instrument calibration + gravimetric moisture utilities.
 *
 * Pure math module — no React, no side effects. Everything here is reusable
 * and unit-testable with `node`.
 *
 * Calibration model (soil lab convention):
 *   Moisture content  MC = a * R + b
 * where R is the instrument reading and a (slope), b (intercept) come from a
 * least-squares linear fit through the calibration points
 * (sampled at different soil moisture conditions: e.g. Dry / Moist / Wet).
 *
 * Gravimetric moisture (oven-drying method):
 *   MC = ((M_wet - M_dry) / M_dry) * 100    (%)
 */

/**
 * Least-squares linear fit: MC = a*R + b
 * @param {Array<{reading: number, moisture: number}>} points — calibration pairs
 * @returns {{a: number|null, b: number|null, r2: number|null, rmse: number|null, n: number, equation: string|null}}
 */
export function calculateLinearCalibration(points) {
  const valid = (Array.isArray(points) ? points : [])
    .map((p) => ({ r: Number(p && p.reading), m: Number(p && p.moisture) }))
    .filter((p) => Number.isFinite(p.r) && Number.isFinite(p.m));

  const n = valid.length;
  if (n < 2) {
    return { a: null, b: null, r2: null, rmse: null, n, equation: null, points: valid };
  }

  // Same instrument reading on all points => undefined slope (vertical regression).
  const firstR = valid[0].r;
  if (valid.every((p) => p.r === firstR)) {
    return { a: null, b: null, r2: null, rmse: null, n, equation: null, points: valid };
  }

  const meanR = valid.reduce((s, p) => s + p.r, 0) / n;
  const meanM = valid.reduce((s, p) => s + p.m, 0) / n;

  let num = 0;
  let den = 0;
  for (const p of valid) {
    num += (p.r - meanR) * (p.m - meanM);
    den += (p.r - meanR) * (p.r - meanR);
  }
  const a = num / den;
  const b = meanM - a * meanR;

  const pred = (r) => a * r + b;
  const r2 = calculateR2(
    valid.map((p) => p.m),
    valid.map((p) => pred(p.r)),
  );
  const rmse = calculateRMSE(
    valid.map((p) => p.m),
    valid.map((p) => pred(p.r)),
  );

  return {
    a,
    b,
    r2,
    rmse,
    n,
    equation: `MC = ${fmt(a)}R ${b >= 0 ? '+' : '-'} ${fmt(Math.abs(b))}`,
    points: valid,
  };
}

/**
 * Coefficient of determination (R^2) between observed and predicted.
 * @param {Array<number>} observed
 * @param {Array<number>} predicted
 */
export function calculateR2(observed, predicted) {
  const o = Array.isArray(observed) ? observed : [];
  const p = Array.isArray(predicted) ? predicted : [];
  const n = Math.min(o.length, p.length);
  if (n < 2) return null;

  let sum = 0;
  for (let i = 0; i < n; i++) sum += Number(o[i]);
  const mean = sum / n;

  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const oi = Number(o[i]);
    const pi = Number(p[i]);
    if (!Number.isFinite(oi) || !Number.isFinite(pi)) return null;
    ssTot += (oi - mean) * (oi - mean);
    ssRes += (pi - oi) * (pi - oi);
  }
  if (ssTot === 0) return 1;
  return 1 - ssRes / ssTot;
}

/**
 * Root mean squared error between observed and predicted.
 * @param {Array<number>} observed
 * @param {Array<number>} predicted
 */
export function calculateRMSE(observed, predicted) {
  const o = Array.isArray(observed) ? observed : [];
  const p = Array.isArray(predicted) ? predicted : [];
  const n = Math.min(o.length, p.length);
  if (n === 0) return null;

  let sumSq = 0;
  for (let i = 0; i < n; i++) {
    const d = Number(o[i]) - Number(p[i]);
    if (!Number.isFinite(d)) return null;
    sumSq += d * d;
  }
  return Math.sqrt(sumSq / n);
}

/**
 * Gravimetric moisture content by oven-drying (%).
 * @param {number} wetMass wet soil + can mass
 * @param {number} dryMass dried soil + can mass
 */
export function calculateGravimetricMoisture(wetMass, dryMass) {
  const Mw = Number(wetMass);
  const Md = Number(dryMass);
  if (!Number.isFinite(Mw) || !Number.isFinite(Md) || Md <= 0) return null;
  return ((Mw - Md) / Md) * 100;
}

/**
 * Apply a calibration to a field reading: MC = a*R + b.
 * @param {number} reading instrument field reading
 * @param {number} slope calibration slope (a)
 * @param {number} intercept calibration intercept (b)
 */
export function applyCalibration(reading, slope, intercept) {
  const r = Number(reading);
  const a = Number(slope);
  const b = Number(intercept);
  if (!Number.isFinite(r) || !Number.isFinite(a) || !Number.isFinite(b)) return null;
  return a * r + b;
}

function fmt(x) {
  if (!Number.isFinite(x)) return '0';
  if (x !== 0 && (Math.abs(x) >= 1000 || Math.abs(x) < 0.001)) return x.toExponential(4);
  return x.toFixed(4);
}
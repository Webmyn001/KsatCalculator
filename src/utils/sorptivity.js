/**
 * Sorptivity (Sw) of a soil computed from cumulative infiltration vs time.
 *
 * Assumes the early-time infiltration model  I = Sw * t^(1/2)  (cm), where
 * t is elapsed time (s). Sorptivity is the slope of a least-squares line
 * forced through the origin on the scale x = sqrt(t), y = I:
 *
 *     Sw = sum(I_i * sqrt(t_i)) / sum(t_i),        units: cm · s^(-1/2)
 *
 * The dataset is the existing infiltration dataset already calculated by
 * the infiltrometer (time + cumulative infiltration in cm) — the caller
 * passes it straight through, so there is no second data entry and results
 * update live as the user edits volume readings.
 */

/**
 * Fit I = Sw * sqrt(t) through the origin using least squares.
 * @param {Array<{time: number, cumulativeInfiltration: number}>} infiltrationData
 * @returns {{ sw: number|null, n: number, r2: number|null, rmse: number|null,
 *            points: Array<{sqrtTime:number, cumulativeInfiltration:number}>,
 *            fitted: Array<{sqrtTime:number, cumulativeInfiltration:number}> }}
 */
export function calculateSorptivity(infiltrationData) {
  if (!Array.isArray(infiltrationData)) {
    return { sw: null, n: 0, r2: null, rmse: null, points: [], fitted: [] };
  }

  const points = [];
  for (const d of infiltrationData) {
    const time = Number(d && d.time);
    const cum = Number(d && d.cumulativeInfiltration);
    if (!Number.isFinite(time) || time <= 0) continue;
    if (!Number.isFinite(cum) || cum < 0) continue;
    points.push({ sqrtTime: Math.sqrt(time), cumulativeInfiltration: cum });
  }

  const n = points.length;
  if (n === 0) {
    return { sw: null, n, r2: null, rmse: null, points, fitted: [] };
  }

  // Least squares through the origin: minimize sum((I - Sw*sqrt(t))^2).
  let sumXY = 0;
  let sumXX = 0;
  for (const p of points) {
    sumXY += p.sqrtTime * p.cumulativeInfiltration;
    sumXX += p.sqrtTime * p.sqrtTime;
  }
  if (sumXX === 0) {
    return { sw: null, n, r2: null, rmse: null, points, fitted: [] };
  }
  const sw = sumXY / sumXX;

  const fitted = points.map((p) => ({
    sqrtTime: p.sqrtTime,
    cumulativeInfiltration: sw * p.sqrtTime,
  }));

  const r2 = calculateR2(
    points.map((p) => p.cumulativeInfiltration),
    fitted.map((p) => p.cumulativeInfiltration),
  );
  const rmse = calculateRMSE(
    points.map((p) => p.cumulativeInfiltration),
    fitted.map((p) => p.cumulativeInfiltration),
  );

  return { sw, n, r2, rmse, points, fitted };
}

/**
 * Coefficient of determination (R^2) between actual and predicted values.
 * @param {Array<number>} actual
 * @param {Array<number>} predicted
 */
export function calculateR2(actual, predicted) {
  if (!Array.isArray(actual) || !Array.isArray(predicted)) return null;
  const n = Math.min(actual.length, predicted.length);
  if (n === 0) return null;

  const valid = [];
  for (let i = 0; i < n; i++) {
    const a = Number(actual[i]);
    const p = Number(predicted[i]);
    if (Number.isFinite(a) && Number.isFinite(p)) valid.push([a, p]);
  }
  if (valid.length === 0) return null;

  let sumAct = 0;
  for (const [a] of valid) sumAct += a;
  const mean = sumAct / valid.length;

  let ssTot = 0;
  let ssRes = 0;
  for (const [a, p] of valid) {
    ssTot += (a - mean) * (a - mean);
    ssRes += (a - p) * (a - p);
  }
  if (ssTot === 0) return 1;
  return 1 - ssRes / ssTot;
}

/**
 * Root mean squared error between actual and predicted values.
 * @param {Array<number>} actual
 * @param {Array<number>} predicted
 */
export function calculateRMSE(actual, predicted) {
  if (!Array.isArray(actual) || !Array.isArray(predicted)) return null;
  const n = Math.min(actual.length, predicted.length);
  if (n === 0) return null;

  let sumSq = 0;
  let count = 0;
  for (let i = 0; i < n; i++) {
    const a = Number(actual[i]);
    const p = Number(predicted[i]);
    if (Number.isFinite(a) && Number.isFinite(p)) {
      sumSq += (a - p) * (a - p);
      count += 1;
    }
  }
  if (count === 0) return null;
  return Math.sqrt(sumSq / count);
}
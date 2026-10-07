/**
 * Sorptivity (Sw) derived from the fitted infiltration curve.
 *
 * The infiltration curve produced by the infiltrometer is fitted as a
 * polynomial in x = sqrt(t):   cumCm = a*x^2 + b*x + c
 * which, in terms of time, expands to:
 *
 *     I = a*t + b*sqrt(t) + c
 *
 * This matches the two-term infiltration equation of Zhang (1997):
 *
 *     I = C1*t + C2*sqrt(t)
 *
 * where C2 (the coefficient of sqrt(t)) is the soil sorptivity Sw, with
 * units cm * s^(-1/2). Therefore sorptivity is the coefficient b of the
 * fitted curve, NOT an independent origin-forced fit.
 */

/**
 * Extract sorptivity from a fitted infiltration regression.
 * @param {object|null} regression fitPolynomial result { a, b, c, r2, fitted }
 * @returns {{ sw: number|null, n: number, r2: number|null, rmse: number|null,
 *            equation: string|null,
 *            points: Array<{sqrtTime:number, cumulativeInfiltration:number}>,
 *            fitted: Array<{sqrtTime:number, cumulativeInfiltration:number}> }}
 */
export function sorptivityFromRegression(regression) {
  if (
    !regression ||
    !Array.isArray(regression.fitted) ||
    regression.fitted.length === 0
  ) {
    return { sw: null, n: 0, r2: null, rmse: null, equation: null, points: [], fitted: [] };
  }

  const n = regression.fitted.length;

  const sw = Number(regression.b); // coefficient of sqrt(t) -> C2 = sorptivity
  if (!Number.isFinite(sw)) {
    return { sw: null, n, r2: null, rmse: null, equation: null, points: [], fitted: [] };
  }

  const points = regression.fitted.map((p) => ({
    sqrtTime: p.x,
    cumulativeInfiltration: p.y,
  }));
  const fitted = regression.fitted.map((p) => ({
    sqrtTime: p.x,
    cumulativeInfiltration: p.yFit,
  }));

  const r2 = calculateR2(
    points.map((p) => p.cumulativeInfiltration),
    fitted.map((p) => p.cumulativeInfiltration),
  );
  const rmse = calculateRMSE(
    points.map((p) => p.cumulativeInfiltration),
    fitted.map((p) => p.cumulativeInfiltration),
  );

  const equation = `I = ${formatCoef(regression.a)}*t ${sw >= 0 ? '+' : '-'} ${formatCoef(Math.abs(sw))}*sqrt(t) ${regression.c >= 0 ? '+' : '-'} ${formatCoef(Math.abs(regression.c))}`;

  return { sw, n, r2, rmse, equation, points, fitted };
}

function formatCoef(x) {
  if (!Number.isFinite(x)) return '0';
  if (x !== 0 && (Math.abs(x) >= 1000 || Math.abs(x) < 0.001)) return x.toExponential(3);
  return Number(x.toFixed(4)).toString();
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
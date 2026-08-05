import { lusolve } from 'mathjs';

/**
 * Fit a polynomial of `degree` via least-squares (normal equations).
 * points: [{ x, y }]
 * Returns { a, b, c, r2, fitted, count } where a is the coefficient
 * of x^degree (i.e. y = a·x² + b·x + c for degree 2).
 */
export function fitPolynomial(points, degree = 2) {
  const valid = (points || []).filter(
    (p) => Number.isFinite(p.x) && Number.isFinite(p.y),
  );
  if (valid.length < degree + 1) return null;

  const m = degree + 1;
  const A = [];
  const B = [];
  for (let i = 0; i < m; i += 1) {
    const row = [];
    for (let j = 0; j < m; j += 1) {
      row.push(valid.reduce((s, p) => s + p.x ** (i + j), 0));
    }
    A.push(row);
    B.push([valid.reduce((s, p) => s + p.x ** i * p.y, 0)]);
  }

  const solution = lusolve(A, B);
  const coefs = Array.from(solution, (r) => r[0]); // [c, b, a]

  const ybar = valid.reduce((s, p) => s + p.y, 0) / valid.length;
  let ssRes = 0;
  let ssTot = 0;
  const fitted = valid.map((p) => {
    const yFit = coefs.reduce((s, co, j) => s + co * p.x ** j, 0);
    ssRes += (p.y - yFit) ** 2;
    ssTot += (p.y - ybar) ** 2;
    return { x: p.x, y: p.y, yFit };
  });

  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return {
    a: coefs[2],
    b: coefs[1],
    c: coefs[0],
    r2,
    fitted,
    count: valid.length,
  };
}

/**
 * Generate smooth line points along a fitted quadratic for plotting.
 */
export function fittedCurve(regression, xMin, xMax, steps = 60) {
  if (!regression) return [];
  const { a, b, c } = regression;
  const out = [];
  for (let i = 0; i <= steps; i += 1) {
    const x = xMin + ((xMax - xMin) * i) / steps;
    const y = Math.max(0, a * x * x + b * x + c);
    out.push({ sqrtTime: x, cumCm: y });
  }
  return out;
}

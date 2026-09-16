export const ENERGY = 1.506816;
export const TRANSITION_INTERVAL = 150;

export function fmt(value) {
  return value.toFixed(6);
}

/* True when a depth sits exactly on a 150 mm transition level (150, 300, 450, ...). */
export function isTransitionLevel(d) {
  const q = d / TRANSITION_INTERVAL;
  return d > 0 && Math.abs(q - Math.round(q)) < 1e-9;
}

/* Every 150 mm transition level strictly between two consecutive depths. */
export function detectTransitionLevelsBetween(prev, next) {
  const levels = [];
  if (next <= prev) return levels;
  let t = Math.floor(prev / TRANSITION_INTERVAL) * TRANSITION_INTERVAL + TRANSITION_INTERVAL;
  while (t < next) {
    levels.push(t);
    t += TRANSITION_INTERVAL;
  }
  return levels;
}

/* All transition points crossed by every pair of consecutive readings. */
export function detectTransitionPoints(readings) {
  const points = [];
  for (let i = 0; i < readings.length - 1; i++) {
    const prev = readings[i].depth;
    const next = readings[i + 1].depth;
    const levels = detectTransitionLevelsBetween(prev, next);
    for (const t of levels) {
      points.push({ point: t, prevDepth: prev, nextDepth: next });
    }
  }
  return points;
}

/* Transition Energy = [(Transition Point - Previous Depth) / (Next Depth - Previous Depth)] x 1.506816 */
export function calculateTransitionEnergy(t, prev, next) {
  return ((t - prev) / (next - prev)) * ENERGY;
}

export function buildFormula(t, prev, next) {
  return `[(${t} − ${prev}) ÷ (${next} − ${prev})] × ${ENERGY}`;
}

/* Ordered detailed rows: recorded readings plus inserted transition points. */
export function calculateEnergies(readings) {
  const detail = [];
  const n = readings.length;
  let tCount = 0;

  for (let i = 0; i < n; i++) {
    const depth = readings[i].depth;
    const prevDepth = i > 0 ? readings[i - 1].depth : null;
    const nextDepth = i < n - 1 ? readings[i + 1].depth : null;
    let type = 'normal';
    let energy = ENERGY;
    let transitionPoint = null;
    let calc = null;

    if (isTransitionLevel(depth) && prevDepth !== null && nextDepth !== null) {
      type = 'transition';
      transitionPoint = depth;
      energy = calculateTransitionEnergy(depth, prevDepth, nextDepth);
      calc = buildFormula(depth, prevDepth, nextDepth);
    }

    detail.push({
      serial: String(i + 1),
      inserted: false,
      depth,
      prevDepth,
      nextDepth,
      transitionPoint,
      energy,
      type,
      calc,
    });

    if (i < n - 1) {
      const levels = detectTransitionLevelsBetween(depth, readings[i + 1].depth);
      for (const t of levels) {
        tCount += 1;
        detail.push({
          serial: `T${tCount}`,
          inserted: true,
          depth: t,
          prevDepth: depth,
          nextDepth: readings[i + 1].depth,
          transitionPoint: t,
          energy: calculateTransitionEnergy(t, depth, readings[i + 1].depth),
          type: 'transition',
          calc: buildFormula(t, depth, readings[i + 1].depth),
        });
      }
    }
  }

  return detail;
}

/* Sum energies per 150 mm band, labelled in cm: 0-15, 15-30, 30-45, ... */
export function calculateRangeSummary(detail) {
  const total = calculateSoilStrength(detail);
  if (!detail.length) return { ranges: [], total };

  let maxIndex = 1;
  for (const r of detail) {
    maxIndex = Math.max(maxIndex, Math.ceil(r.depth / TRANSITION_INTERVAL));
  }
  const sums = new Array(maxIndex).fill(0);
  for (const r of detail) {
    sums[Math.ceil(r.depth / TRANSITION_INTERVAL) - 1] += r.energy;
  }

  return {
    ranges: sums.map((value, k) => ({
      label: `${k * 15}–${(k + 1) * 15} cm`,
      depthSpec: `${k * 150}–${(k + 1) * 150} mm`,
      value,
    })),
    total,
  };
}

/* Summation of all energy values is the soil strength for the location. */
export function calculateSoilStrength(detail) {
  return detail.reduce((sum, r) => sum + r.energy, 0);
}

/* Validation: returns a list of human-readable problems (empty when valid). */
export function validateReadings(readings) {
  const issues = [];
  const n = readings.length;

  if (n === 0) {
    issues.push('Add at least one depth reading before calculating.');
    return issues;
  }

  for (let i = 0; i < n; i++) {
    const d = readings[i].depth;
    if (d === null || d === undefined || d === '') {
      issues.push(`Reading #${i + 1}: no depth has been entered. Enter a positive number in mm.`);
    } else if (!Number.isFinite(d)) {
      issues.push(`Reading #${i + 1}: ${JSON.stringify(d)} is not a valid number.`);
    } else if (d <= 0) {
      issues.push(`Reading #${i + 1}: depth must be a positive number (entered ${d} mm).`);
    } else if (i > 0 && d <= readings[i - 1].depth) {
      issues.push(
        `Reading #${i + 1} (${d} mm) is not greater than reading #${i} (${readings[i - 1].depth} mm). ` +
          'Depths must be strictly ascending with no duplicates (a duplicate makes the interpolation denominator zero).',
      );
    }
  }

  if (n >= 1 && isTransitionLevel(readings[0].depth)) {
    issues.push(
      `Reading #1 (${readings[0].depth} mm) is exactly on a transition level but has no previous depth, ` +
        'so its transition energy cannot be interpolated. Enter an earlier reading before it.',
    );
  }
  if (n > 1 && isTransitionLevel(readings[n - 1].depth)) {
    issues.push(
      `The last reading (${readings[n - 1].depth} mm) is exactly on a transition level but has no next depth, ` +
        'so its transition energy cannot be interpolated. Enter a later reading after it.',
    );
  }

  return issues;
}
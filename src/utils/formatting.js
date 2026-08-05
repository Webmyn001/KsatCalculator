export function isNullish(v) {
  return v === null || v === undefined || !Number.isFinite(v);
}

export function round(value, decimals = 4) {
  if (isNullish(value)) return value;
  const r = Number(value.toFixed(decimals));
  return Object.is(r, -0) ? 0 : r;
}

export function formatNumber(value, decimals = 4, scientific = false) {
  if (isNullish(value)) return '—';
  if (scientific && value !== 0 && (Math.abs(value) >= 1e5 || Math.abs(value) < 1e-3)) {
    return value.toExponential(4);
  }
  return Number(value.toFixed(decimals)).toLocaleString('en-US', {
    maximumFractionDigits: decimals,
  });
}

export function formatEquation(regression) {
  if (!regression) return 'No valid data';
  const { a, b } = regression;
  return `y = ${formatNumber(a, 4)}x² ${b >= 0 ? '+' : '−'} ${formatNumber(Math.abs(b), 4)}x`;
}

export function todayISO() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const mIdx = Number(m) - 1;
  if (Number.isNaN(mIdx) || mIdx < 0 || mIdx > 11) return iso;
  return `${d} ${months[mIdx]} ${y}`;
}

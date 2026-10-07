import { formatNumber } from './formatting';

export async function exportGraphPng(graphRef) {
  if (!graphRef || !graphRef.current) return false;
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(graphRef.current, {
    backgroundColor: null,
    scale: 2,
  });
  const link = document.createElement('a');
  link.download = `KunsatCalculator_graph_${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  return true;
}

export async function copyTableToClipboard(rows, unit) {
  const volUnit = unit;
  const header = [
    'Time (s)',
    '√Time',
    `Volume Remaining (${volUnit})`,
    `Infiltration (${volUnit})`,
    `Cumulative Infiltration (${volUnit})`,
    'Cumulative Infiltration (cm)',
  ];
  const lines = rows.map((r) =>
    [
      r.time,
      formatNumber(r.sqrtTime, 4),
      r.volume != null ? formatNumber(r.volume, 2) : '',
      r.infiltration != null ? formatNumber(r.infiltration, 2) : '',
      r.cumulative != null ? formatNumber(r.cumulative, 2) : '',
      r.cumulativeCm != null ? formatNumber(r.cumulativeCm, 3) : '',
    ].join('\t'),
  );
  const tsv = [header.join('\t'), ...lines].join('\r\n');
  await navigator.clipboard.writeText(tsv);
  return true;
}

export async function copyDcpTable({ detail, rangeSummary, total }) {
  const header = [
    'Serial No.',
    'Depth (mm)',
    'Prev. Depth',
    'Next Depth',
    'Transition Point',
    'Energy',
    'Type',
    'Calculation',
  ];
  const lines = detail.map((r) =>
    [
      r.serial,
      r.depth,
      r.prevDepth === null ? '' : r.prevDepth,
      r.nextDepth === null ? '' : r.nextDepth,
      r.transitionPoint === null ? '' : r.transitionPoint,
      r.energy,
      r.type,
      r.calc === null ? '' : r.calc,
    ].join('\t'),
  );
  const tsv = [
    header.join('\t'),
    ...lines,
    '',
    'Depth Range\tSoil Strength (kPa)',
    ...rangeSummary.ranges.map((r) => `${r.label}\t${r.value}`),
    '',
    `Total Soil Strength (kPa)\t${total}`,
  ].join('\r\n');
  await navigator.clipboard.writeText(tsv);
  return true;
}

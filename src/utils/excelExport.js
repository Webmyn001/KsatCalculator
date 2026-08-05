import { DISK_AREA } from '../constants/times';
import { formatEquation, formatNumber } from './formatting';

const HEADER_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '047857' } },
  alignment: { horizontal: 'center', vertical: 'center' },
};

const TITLE_STYLE = {
  font: { bold: true, sz: 14, color: { rgb: '064E3B' } },
};

const LABEL_STYLE = {
  font: { bold: true },
  alignment: { horizontal: 'left', vertical: 'center' },
};

function applyHeader(XLSX, sheet, row, cols) {
  for (let c = 0; c < cols; c += 1) {
    const cell = sheet[XLSX.utils.encode_cell({ r: row, c })];
    if (cell) cell.s = HEADER_STYLE;
  }
}

export async function exportExcel({
  experiment,
  soilTexture,
  aParam,
  rows,
  regression,
  k,
  unit,
  dateGenerated,
}) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  // ---- Report sheet ----
  const volUnit = unit;
  const reportRows = [
    ['KunsatCalculator — Mini Disk Infiltrometer (2 cm Suction)'],
    ['Infiltration & Hydraulic Conductivity Report'],
    [],
    ['Experiment Name', experiment.name || '—'],
    ['Location', experiment.location || '—'],
    ['Soil Type', experiment.soilType || '—'],
    ['Researcher', experiment.researcher || '—'],
    ['Experiment Date', experiment.date || '—'],
    ['Soil Texture (Van Genuchten)', soilTexture || 'Custom / Manual'],
    ['Van Genuchten A Parameter', aParam ?? '—'],
    ['Disk Area (cm²)', DISK_AREA],
    [],
    ['Polynomial Equation', regression ? formatEquation(regression) : 'No valid data'],
    ['R²', regression ? formatNumber(regression.r2, 4) : '—'],
    ['Hydraulic Conductivity K (cm/s)', k != null ? formatNumber(k, 6) : '—'],
    [],
    ['Date Generated', dateGenerated],
  ];
  const report = XLSX.utils.aoa_to_sheet(reportRows);
  report['!cols'] = [{ wch: 34 }, { wch: 40 }];
  const titleCell = report['A1'];
  titleCell.s = TITLE_STYLE;
  for (let r = 2; r < reportRows.length; r += 1) {
    const cell = report[XLSX.utils.encode_cell({ r, c: 0 })];
    if (cell && reportRows[r][0] && reportRows[r][1] !== undefined) cell.s = LABEL_STYLE;
  }
  report['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
  XLSX.utils.book_append_sheet(wb, report, 'Report');

  // ---- Data sheet ----
  const data = [
    ['Time (s)', '√Time', `Volume Remaining (${volUnit})`, `Infiltration (${volUnit})`, `Cumulative Infiltration (${volUnit})`, 'Cumulative Infiltration (cm)'],
    ...rows.map((r) => [
      r.time,
      r.sqrtTime,
      r.volume ?? '',
      r.infiltration ?? '',
      r.cumulative ?? '',
      r.cumulativeCm ?? '',
    ]),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(data);
  applyHeader(XLSX, sheet, 0, 6);
  sheet['!cols'] = [
    { wch: 10, alignment: { horizontal: 'center' } },
    { wch: 12, alignment: { horizontal: 'center' } },
    { wch: 22, alignment: { horizontal: 'center' } },
    { wch: 20, alignment: { horizontal: 'center' } },
    { wch: 26, alignment: { horizontal: 'center' } },
    { wch: 24, alignment: { horizontal: 'center' } },
  ];
  XLSX.utils.book_append_sheet(wb, sheet, 'Data');

  const safeName = (experiment.name || 'experiment')
    .replace(/[\\/:*?"<>|]/g, '_')
    .trim()
    .slice(0, 40);
  XLSX.writeFile(wb, `KunsatCalculator_${safeName || 'report'}.xlsx`);
}

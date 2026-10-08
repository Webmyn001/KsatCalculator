import { formatNumber, todayISO } from './formatting';

const GREEN = [4, 120, 87];
const DARK = [6, 78, 59];

function sanitize(s) {
  return String(s ?? '')
    .replace(/√/g, 'sqrt')
    .replace(/−/g, '-')
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '');
}

export async function exportFieldExcel(fieldRows, opts = {}) {
  const XLSX = await import('xlsx');
  const filename =
    opts.filename ||
    `field-conversion-${opts.dateGenerated || todayISO()}.xlsx`;
  const title = opts.title ? String(opts.title).trim() : '';
  const fit = opts.fit;
  const rows = [];
  if (title) rows.push([title]);
  if (title) rows.push([]);
  if (fit && fit.equation) {
    rows.push(['Calibration Equation', fit.equation]);
    rows.push(['R² (goodness of fit)', fit.r2 == null ? '—' : formatNumber(fit.r2, 4, false)]);
    rows.push(['RMSE', fit.rmse == null ? '—' : `${formatNumber(fit.rmse, 4, false)} %`]);
    rows.push(['Samples fitted (n)', fit.n == null ? '—' : String(fit.n)]);
    rows.push([]);
  }
  rows.push(['Sample / Location', 'Instrument Reading (R)', 'Estimated Moisture (%)']);
  rows.push(
    ...fieldRows.map((f) => [
      f.label ? String(f.label) : '',
      f.reading === '' || f.reading == null ? '' : String(f.reading),
      f.moisture == null || !Number.isFinite(f.moisture)
        ? ''
        : formatNumber(f.moisture, 2, false),
    ]),
  );
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [
    { wch: 30 },
    { wch: 22, alignment: { horizontal: 'center' } },
    { wch: 22, alignment: { horizontal: 'center' } },
  ];
  if (title) {
    sheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Field Conversion');
  XLSX.writeFile(wb, filename);
}

export async function exportFieldPdf(fieldRows, opts = {}) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const dateGenerated = opts.dateGenerated || todayISO();
  const title = opts.title ? String(opts.title).trim() : '';
  const fit = opts.fit;

  const headerLines = [];
  headerLines.push({ text: 'SOIL MOISTURE FIELD CONVERSION', y: 12, size: 16, style: 'bold' });
  headerLines.push({
    text: 'Estimated Reference-Equivalent Moisture Content',
    y: 19,
    size: 11,
    style: 'normal',
  });
  let y = 25;
  if (title) {
    headerLines.push({ text: sanitize(title), y, size: 10, style: 'bold' });
    y += 6.5;
  }
  if (fit && fit.equation) {
    headerLines.push({
      text: `Calibration Equation: ${sanitize(fit.equation)}`,
      y,
      size: 10,
      style: 'bold',
    });
    y += 6;
    const stats = `R² = ${
      fit.r2 == null ? '—' : formatNumber(fit.r2, 4)
    }   RMSE = ${
      fit.rmse == null ? '—' : `${formatNumber(fit.rmse, 4)} %`
    }   Samples = ${fit.n == null ? '—' : fit.n}`;
    headerLines.push({ text: stats, y, size: 9, style: 'normal' });
    y += 6.5;
  }
  const bannerHeight = Math.max(26, y + 6);

  doc.setFillColor(...GREEN);
  doc.rect(0, 0, pageWidth, bannerHeight, 'F');
  for (const line of headerLines) {
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', line.style);
    doc.setFontSize(line.size);
    doc.text(line.text, pageWidth / 2, line.y, { align: 'center', maxWidth: pageWidth - 24 });
  }

  autoTable(doc, {
    startY: bannerHeight + 8,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 2.4 },
    head: [['Sample / Location', 'Instrument Reading (R)', 'Estimated Moisture (%)']],
    body: fieldRows.map((f) => [
      sanitize(f.label),
      f.reading === '' || f.reading == null ? '—' : String(f.reading),
      f.moisture == null || !Number.isFinite(f.moisture) ? '—' : `${formatNumber(f.moisture, 2)} %`,
    ]),
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text(`Date Generated: ${dateGenerated}`, 14, pageHeight - 12);
  doc.text('Generated using KunsatCalculator', pageWidth / 2, pageHeight - 8, {
    align: 'center',
  });
  doc.save(`field-conversion-${dateGenerated}.pdf`);
}
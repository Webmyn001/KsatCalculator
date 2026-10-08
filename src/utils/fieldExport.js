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
  const rows = title
    ? [[title], [], ['Sample / Location', 'Instrument Reading (R)', 'Estimated Moisture (%)']]
    : [['Sample / Location', 'Instrument Reading (R)', 'Estimated Moisture (%)']];
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
    { wch: 20, alignment: { horizontal: 'center' } },
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

  doc.setFillColor(...GREEN);
  doc.rect(0, 0, pageWidth, title ? 32 : 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SOIL MOISTURE FIELD CONVERSION', pageWidth / 2, title ? 12 : 11, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Estimated Reference-Equivalent Moisture Content', pageWidth / 2, title ? 19 : 18, {
    align: 'center',
  });
  if (title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(sanitize(title), pageWidth / 2, 27, { align: 'center', maxWidth: pageWidth - 24 });
  }

  autoTable(doc, {
    startY: title ? 40 : 34,
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
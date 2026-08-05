import { DISK_AREA } from '../constants/times';
import { formatEquation, formatNumber } from './formatting';

const GREEN = [4, 120, 87];
const DARK = [6, 78, 59];
const GRAY = [71, 85, 105];

function sanitize(s) {
  return String(s ?? 'N/A')
    .replace(/√/g, 'sqrt')
    .replace(/−/g, '-')
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '');
}

export async function exportPdf({
  experiment,
  soilTexture,
  aParam,
  rows,
  regression,
  k,
  unit,
  graphRef,
  dateGenerated,
}) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const { default: html2canvas } = await import('html2canvas');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...GREEN);
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MINI DISK INFILTROMETER CALCULATOR', pageWidth / 2, 11, {
    align: 'center',
  });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('2 cm Suction — Infiltration & Hydraulic Conductivity Report', pageWidth / 2, 18, {
    align: 'center',
  });

  let y = 34;
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Experiment Information', 14, y);
  y += 2;

  autoTable(doc, {
    startY: y + 2,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 2.2 },
    body: [
      ['Experiment Name', sanitize(experiment.name)],
      ['Location', sanitize(experiment.location)],
      ['Soil Type', sanitize(experiment.soilType)],
      ['Researcher', sanitize(experiment.researcher)],
      ['Experiment Date', sanitize(experiment.date)],
      ['Van Genuchten Parameter A', aParam != null ? String(aParam) : '—'],
      ['Soil Texture (A source)', sanitize(soilTexture) || 'Custom / Manual'],
      ['Disk Area (cm²)', String(DISK_AREA)],
    ],
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
    },
  });
  y = doc.lastAutoTable.finalY + 8;

  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Measurement Data', 14, y);
  y += 2;

  const volUnit = unit;
  autoTable(doc, {
    startY: y + 2,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 1.6, halign: 'center' },
    head: [
      ['Time (s)', '√Time', `Vol. Remaining (${volUnit})`, `Infiltration (${volUnit})`, `Cumulative (${volUnit})`, 'Cumulative (cm)'],
    ],
    body: rows.map((r) => [
      r.time,
      formatNumber(r.sqrtTime, 4),
      r.volume != null ? formatNumber(r.volume, 2) : '—',
      r.infiltration != null ? formatNumber(r.infiltration, 2) : '—',
      r.cumulative != null ? formatNumber(r.cumulative, 2) : '—',
      r.cumulativeCm != null ? formatNumber(r.cumulativeCm, 3) : '—',
    ]),
  });
  y = doc.lastAutoTable.finalY + 8;

  if (regression) {
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      theme: 'grid',
      headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 2.4 },
      body: [
        ['Polynomial Equation', sanitize(formatEquation(regression))],
        ['Coefficient of Determination (R²)', formatNumber(regression.r2, 4)],
        ['Hydraulic Conductivity K (cm/s)', k != null ? formatNumber(k, 6) : '—'],
      ],
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
      },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (graphRef && graphRef.current) {
    try {
      const canvas = await html2canvas(graphRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const img = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 28;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      if (y + imgHeight + 20 > doc.internal.pageSize.getHeight()) {
        doc.addPage();
        y = 14;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...DARK);
      doc.text('Cumulative Infiltration vs √Time', 14, y);
      doc.addImage(img, 'PNG', 14, y + 4, imgWidth, imgHeight);
    } catch {
      doc.setTextColor(...GRAY);
      doc.setFontSize(10);
      doc.text('(Graph could not be captured for this report.)', 14, y + 6);
    }
  }

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(
    `Date Generated: ${dateGenerated}`,
    14,
    pageHeight - 12,
  );
  doc.text(
    'Generated using KunsatCalculator',
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' },
  );

  const safeName = (experiment.name || 'experiment')
    .replace(/[\\/:*?"<>|]/g, '_')
    .trim()
    .slice(0, 40);
  doc.save(`KunsatCalculator_${safeName || 'report'}.pdf`);
}

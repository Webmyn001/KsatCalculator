import {
  ENERGY,
  TRANSITION_INTERVAL,
  fmt,
  calculateEnergies,
  calculateRangeSummary,
  calculateSoilStrength,
} from './dcp';
import { todayISO } from './formatting';

const GREEN = [4, 120, 87];
const DARK = [6, 78, 59];
const GRAY = [71, 85, 105];

// jsPDF standard fonts are Latin-1; make the interpolation formula ASCII-safe.
function sanitize(s) {
  return String(s ?? '')
    .replace(/−/g, '-')
    .replace(/÷/g, '/')
    .replace(/×/g, 'x')
    .replace(/²/g, '2')
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '');
}

/**
 * Export every DCP experiment in the session as one multi-page PDF.
 * Each experiment shows the readings table, the full detailed calculation
 * (including transition interpolation), the soil-strength summary and total.
 *
 * @param {Array<{readings: Array<{depth:number}>}>} entries
 * @param {{dateGenerated?:string, filename?:string}} [opts]
 */
export async function exportDcpAllPdf(entries, opts = {}) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const dateGenerated = opts.dateGenerated || todayISO();

  const list = (entries || []).filter(
    (e) => e && Array.isArray(e.readings) && e.readings.length,
  );
  if (list.length === 0) return;

  const drawHeader = (subtitle) => {
    doc.setFillColor(...GREEN);
    doc.rect(0, 0, pageWidth, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(
      'DYNAMIC CONE PENETROMETER SOIL STRENGTH CALCULATOR',
      pageWidth / 2,
      6,
      { align: 'center' },
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(subtitle, pageWidth / 2, 11, { align: 'center' });
  };

  const tableMargin = { top: 18, left: 14, right: 14, bottom: 12 };
  const headStyles = { fillColor: GREEN, textColor: 255, fontStyle: 'bold' };

  list.forEach((entry, i) => {
    const readings = (entry.readings || [])
      .map((r) => ({ depth: Number(r.depth) }))
      .filter((r) => Number.isFinite(r.depth));
    if (readings.length === 0) return;

    const detail = calculateEnergies(readings);
    const rangeSummary = calculateRangeSummary(detail);
    const total = calculateSoilStrength(detail);

    if (i > 0) doc.addPage();
    const subtitle = `Combined Report - Experiment ${i + 1} of ${list.length}`;
    drawHeader(subtitle);
    let headerPage = doc.getCurrentPageInfo().pageNumber;
    const redraw = () => {
      const current = doc.getCurrentPageInfo().pageNumber;
      if (current !== headerPage) {
        drawHeader(`${subtitle} (continued)`);
        headerPage = current;
      }
    };

    let y = 18;
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Experiment ${i + 1}`, 14, y);
    y += 2;

    // Method parameters
    autoTable(doc, {
      startY: y,
      margin: tableMargin,
      theme: 'grid',
      headStyles,
      styles: { fontSize: 8.5, cellPadding: 1.4 },
      body: [
        ['Energy constant', `${ENERGY} kPa/kg/cm2`],
        ['Transition interval', `${TRANSITION_INTERVAL} mm`],
        ['Number of readings', String(readings.length)],
      ],
      columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' } },
      didDrawPage: redraw,
    });
    y = doc.lastAutoTable.finalY + 3;

    // Readings entered
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Readings Entered', 14, y);
    autoTable(doc, {
      startY: y + 2,
      margin: tableMargin,
      theme: 'grid',
      headStyles,
      styles: { fontSize: 8, cellPadding: 1.2, halign: 'center' },
      head: [['Serial No.', 'Depth (mm)']],
      body: readings.map((r, idx) => [String(idx + 1), String(r.depth)]),
      didDrawPage: redraw,
    });
    y = doc.lastAutoTable.finalY + 4;

    // Detailed calculation (full table, incl. transition interpolation)
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Detailed Calculation', 14, y);
    autoTable(doc, {
      startY: y + 2,
      margin: tableMargin,
      theme: 'grid',
      headStyles,
      styles: { fontSize: 7, cellPadding: 1, halign: 'center', overflow: 'linebreak' },
      columnStyles: { 7: { cellWidth: 78, halign: 'left' } },
      head: [
        [
          'Serial No.',
          'Depth (mm)',
          'Prev. Depth',
          'Next Depth',
          'Transition Point',
          'Energy',
          'Type',
          'Calculation',
        ],
      ],
      body: detail.map((r) => [
        r.serial,
        String(r.depth),
        r.prevDepth == null ? '—' : String(r.prevDepth),
        r.nextDepth == null ? '—' : String(r.nextDepth),
        r.transitionPoint == null ? '—' : String(r.transitionPoint),
        fmt(r.energy),
        r.type === 'transition'
          ? r.inserted
            ? 'Transition (auto)'
            : 'Transition'
          : 'Normal',
        r.calc ? sanitize(r.calc) : '—',
      ]),
      didDrawPage: redraw,
    });
    y = doc.lastAutoTable.finalY + 4;

    // Soil strength summary
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Soil Strength Summary', 14, y);
    autoTable(doc, {
      startY: y + 2,
      margin: tableMargin,
      theme: 'grid',
      headStyles,
      styles: { fontSize: 8.5, cellPadding: 1.2 },
      head: [['Depth Range', 'Soil Strength (kPa)']],
      body: rangeSummary.ranges.map((r) => [
        `${r.label} (${r.depthSpec})`,
        fmt(r.value),
      ]),
      columnStyles: { 1: { halign: 'right' } },
      didDrawPage: redraw,
    });
    y = doc.lastAutoTable.finalY + 4;

    // Total soil strength highlight
    if (y + 14 > pageHeight - 6) {
      doc.addPage();
      drawHeader(`${subtitle} (continued)`);
      y = 18;
    }
    doc.setFillColor(209, 250, 229);
    doc.rect(14, y, pageWidth - 28, 12, 'F');
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Total Soil Strength: ${fmt(total)} kPa`, 18, y + 7.5);
  });

  // Page numbers
  const totalPages = doc.getNumberOfPages();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - 14, pageHeight - 6, {
      align: 'right',
    });
  }

  const safeName = (
    opts.filename || `KunsatCalculator_DCP_AllExperiments_${dateGenerated}`
  )
    .replace(/[\\/:*?"<>|]/g, '_')
    .slice(0, 80);
  doc.save(`${safeName}.pdf`);
}

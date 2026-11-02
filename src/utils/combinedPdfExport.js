import { DISK_AREA } from '../constants/times';
import { buildRows, computeHydraulicConductivity } from './calculations';
import { fitPolynomial } from './regression';
import { sorptivityFromRegression } from './sorptivity';
import { formatEquation, formatNumber, todayISO } from './formatting';

const GREEN = [4, 120, 87];
const DARK = [6, 78, 59];
const GRAY = [71, 85, 105];
const GRID = [226, 232, 240];
const TEAL = [13, 148, 136];
const EMERALD = [16, 185, 129];
const EMERALD_DARK = [4, 120, 87];

function sanitize(s) {
  return String(s ?? 'N/A')
    .replace(/√/g, 'sqrt')
    .replace(/−/g, '-')
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '');
}

/** Rebuild every derived value for one archived/current experiment. */
function computeEntry(entry, fallbackUnit) {
  const volumeInputs = Array.isArray(entry.volumeInputs) ? entry.volumeInputs : [];
  const { rows } = buildRows(volumeInputs);
  const regression = fitPolynomial(
    rows
      .filter((r) => r.cumulativeCm !== null)
      .map((r) => ({ x: r.sqrtTime, y: r.cumulativeCm })),
  );
  const k = computeHydraulicConductivity(regression ? regression.a : null, entry.aParam);
  const sorptivity = sorptivityFromRegression(regression);
  const last = rows[rows.length - 1];
  const points = rows
    .filter((r) => r.cumulativeCm !== null)
    .map((r) => ({ x: r.sqrtTime, y: r.cumulativeCm }));
  return {
    rows,
    regression,
    k,
    sorptivity,
    points,
    unit: entry.unit || fallbackUnit || 'cm³',
    totalInfiltrationCm3: last ? last.cumulative : null,
    finalCumulativeCm: last ? last.cumulativeCm : null,
  };
}

/**
 * Draw the cumulative infiltration vs sqrt(time) chart directly into the PDF.
 * Drawing natively keeps 20 graphs fast and avoids offscreen DOM rendering.
 */
function drawChart(doc, box, points, regression) {
  const { x, y, w, h } = box;
  doc.setDrawColor(...GRID);
  doc.setLineWidth(0.2);
  doc.rect(x, y, w, h);

  if (!points || points.length === 0) {
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('No data', x + w / 2, y + h / 2, { align: 'center' });
    return;
  }

  const maxX = Math.max(...points.map((p) => p.x), 1e-6);
  let yMax = Math.max(...points.map((p) => p.y), 0);

  const fit = [];
  if (regression) {
    for (let i = 0; i <= 60; i += 1) {
      const xx = (maxX * i) / 60;
      const yy = Math.max(
        0,
        regression.a * xx * xx + regression.b * xx + regression.c,
      );
      fit.push({ x: xx, y: yy });
      if (yy > yMax) yMax = yy;
    }
  }
  if (!(yMax > 0)) yMax = 1;
  yMax *= 1.1;

  const padL = 16;
  const padR = 8;
  const padT = 10;
  const padB = 14;
  const px = x + padL;
  const py = y + padT;
  const pw = w - padL - padR;
  const ph = h - padT - padB;
  const sx = (v) => px + (v / maxX) * pw;
  const sy = (v) => py + ph - (v / yMax) * ph;

  // Grid
  doc.setDrawColor(...GRID);
  doc.setLineWidth(0.1);
  for (let i = 0; i <= 4; i += 1) {
    const xx = px + (pw * i) / 4;
    doc.line(xx, py, xx, py + ph);
  }
  for (let i = 0; i <= 4; i += 1) {
    const yy = py + (ph * i) / 4;
    doc.line(px, yy, px + pw, yy);
  }

  // Axes
  doc.setDrawColor(...GRAY);
  doc.setLineWidth(0.3);
  doc.line(px, py + ph, px + pw, py + ph);
  doc.line(px, py, px, py + ph);

  // Tick labels
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  for (let i = 0; i <= 4; i += 1) {
    const v = (maxX * i) / 4;
    const xx = px + (pw * i) / 4;
    doc.text(formatNumber(v, 2), xx, py + ph + 4, { align: 'center' });
  }
  for (let i = 0; i <= 4; i += 1) {
    const v = (yMax * i) / 4;
    const yy = py + ph - (ph * i) / 4;
    doc.text(formatNumber(v, 3), px - 1.5, yy + 1, { align: 'right' });
  }

  // Axis titles
  doc.setFontSize(7);
  doc.text('X: sqrt(Time) (s^1/2)', px + pw / 2, y + h - 2, { align: 'center' });
  doc.text('Y: Cumulative Infiltration (cm)', x + 2, y + 5);

  // Fitted curve
  if (fit.length > 1) {
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.7);
    for (let i = 1; i < fit.length; i += 1) {
      doc.line(
        sx(fit[i - 1].x),
        sy(fit[i - 1].y),
        sx(fit[i].x),
        sy(fit[i].y),
      );
    }
  }

  // Measured points
  doc.setFillColor(...EMERALD);
  doc.setDrawColor(...EMERALD_DARK);
  doc.setLineWidth(0.15);
  for (const p of points) {
    doc.circle(sx(p.x), sy(p.y), 0.9, 'FD');
  }

  // Legend (top-right inside the plot)
  const lx = px + pw - 42;
  const ly = py + 3;
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.7);
  doc.line(lx, ly, lx + 6, ly);
  doc.setTextColor(...GRAY);
  doc.setFontSize(6.5);
  doc.text('Polynomial fit', lx + 7, ly + 1);
  doc.setFillColor(...EMERALD);
  doc.setDrawColor(...EMERALD_DARK);
  doc.circle(lx + 27, ly, 0.8, 'FD');
  doc.text('Measured data', lx + 29, ly + 1);
}

/**
 * Export every experiment in the session as a single multi-page PDF.
 *
 * @param {Array<{experiment:object, soilTexture:string, aParam:number,
 *   volumeInputs:Array<string|number>, unit?:string}>} entries
 * @param {{unit?:string, dateGenerated?:string, filename?:string}} [opts]
 */
export async function exportAllPdf(entries, opts = {}) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const dateGenerated = opts.dateGenerated || todayISO();

  const list = (entries || []).filter(Boolean);
  if (list.length === 0) return;

  const drawHeader = (subtitle) => {
    doc.setFillColor(...GREEN);
    doc.rect(0, 0, pageWidth, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('MINI DISK INFILTROMETER CALCULATOR', pageWidth / 2, 7, {
      align: 'center',
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(subtitle, pageWidth / 2, 12.5, { align: 'center' });
  };

  list.forEach((entry, i) => {
    const {
      rows,
      regression,
      k,
      sorptivity,
      points,
      unit,
      totalInfiltrationCm3,
      finalCumulativeCm,
    } = computeEntry(entry, opts.unit);

    if (i > 0) doc.addPage();
    const subtitle = `Combined Report - Experiment ${i + 1} of ${list.length}`;
    drawHeader(subtitle);
    let y = 22;

    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Experiment ${i + 1}`, 14, y);
    y += 3;

    // Parameters
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      theme: 'grid',
      headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 1.8 },
      body: [
        ['Van Genuchten Parameter A', entry.aParam != null ? String(entry.aParam) : '—'],
        ['Soil Texture (A source)', sanitize(entry.soilTexture) || 'Custom / Manual'],
        ['Disk Area (cm2)', String(DISK_AREA)],
      ],
      columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold' } },
    });
    y = doc.lastAutoTable.finalY + 4;

    // Measurement data
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      theme: 'grid',
      headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 1.4, halign: 'center' },
      head: [
        [
          'Time (s)',
          'sqrt(Time)',
          `Vol. Remaining (${unit})`,
          `Infiltration (${unit})`,
          `Cumulative (${unit})`,
          'Cumulative (cm)',
        ],
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
    y = doc.lastAutoTable.finalY + 4;

    // Equations and results
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      theme: 'grid',
      headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 1.8 },
      body: [
        ['Polynomial Equation', regression ? sanitize(formatEquation(regression)) : '—'],
        ['Coefficient of Determination (R2)', formatNumber(regression ? regression.r2 : null, 4)],
        ['Hydraulic Conductivity K = C1 / A (cm/s)', k != null ? formatNumber(k, 6) : '—'],
        ['Sorptivity Sw (cm s^-1/2)', sorptivity.sw != null ? formatNumber(sorptivity.sw, 6) : '—'],
        [`Total Infiltration (${unit})`, totalInfiltrationCm3 != null ? formatNumber(totalInfiltrationCm3, 2) : '—'],
        ['Final Cumulative Depth (cm)', finalCumulativeCm != null ? formatNumber(finalCumulativeCm, 3) : '—'],
        ['Samples fitted (n)', String(sorptivity.n || (regression ? regression.count : 0))],
      ],
      columnStyles: { 0: { cellWidth: 62, fontStyle: 'bold' } },
    });
    y = doc.lastAutoTable.finalY + 6;

    // Graph
    const graphW = Math.min(pageWidth - 28, 150);
    const graphH = 68;
    if (y + graphH + 12 > pageHeight - 16) {
      doc.addPage();
      drawHeader(`${subtitle} (continued)`);
      y = 22;
    }
    const gx = (pageWidth - graphW) / 2;
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Cumulative Infiltration vs sqrt(Time)', 14, y);
    drawChart(doc, { x: gx, y: y + 3, w: graphW, h: graphH }, points, regression);
  });

  // Page numbers on every page
  const total = doc.getNumberOfPages();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    doc.text(`Page ${p} of ${total}`, pageWidth - 14, pageHeight - 10, {
      align: 'right',
    });
  }

  const safeName = (opts.filename || `KunsatCalculator_AllExperiments_${dateGenerated}`)
    .replace(/[\\/:*?"<>|]/g, '_')
    .slice(0, 80);
  doc.save(`${safeName}.pdf`);
}

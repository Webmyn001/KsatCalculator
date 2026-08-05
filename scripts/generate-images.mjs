import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public');
mkdirSync(outDir, { recursive: true });

const gradient = `
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#065f46"/>
    <stop offset="0.5" stop-color="#059669"/>
    <stop offset="1" stop-color="#0d9488"/>
  </linearGradient>
  <linearGradient id="drop" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ffffff" stop-opacity="0.96"/>
    <stop offset="1" stop-color="#cffafe"/>
  </linearGradient>`;

function dropletPath(scale = 1) {
  return `
    <g transform="translate(${600 * scale} ${165 * scale}) scale(${scale})">
      <path d="M0-82 C 50 -33 88 14 88 52 a 88 88 0 1 1 -176 0 C -88 14 -50 -33 0 -82 Z" fill="url(#drop)"/>
      <path d="M-9 24 a 9 9 0 0 0 9 9" stroke="#065f46" stroke-width="9" fill="none" stroke-linecap="round"/>
    </g>`;
}

const ogSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>${gradient}</defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1120" cy="60" r="200" fill="#ffffff" opacity="0.07"/>
  <circle cx="80" cy="600" r="240" fill="#ffffff" opacity="0.06"/>
  <circle cx="1150" cy="600" r="120" fill="#ffffff" opacity="0.05"/>
  ${dropletPath(1)}
  <text x="600" y="352" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="84" font-weight="bold" fill="#ffffff">KunsatCalculator</text>
  <text x="600" y="412" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#d1fae5">Mini Disk Infiltrometer · 2 cm Suction</text>
  <text x="600" y="478" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#a7f3d0">Unsaturated hydraulic conductivity &amp; infiltration (Zhang, 1997)</text>
</svg>`;

function iconSvg(size, radius = size * 0.22) {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>${gradient}
    <clipPath id="r"><rect width="512" height="512" rx="${radius}"/></clipPath>
  </defs>
  <g clip-path="url(#r)">
    <rect width="512" height="512" fill="url(#bg)"/>
    <circle cx="430" cy="60" r="110" fill="#ffffff" opacity="0.08"/>
    ${dropletPath(512 / 1200)}
  </g>
</svg>`;
}

async function main() {
  await sharp(Buffer.from(ogSvg)).png().toFile(join(outDir, 'og-image.png'));
  await sharp(Buffer.from(iconSvg(512, 115))).png().toFile(join(outDir, 'icon-512.png'));
  await sharp(Buffer.from(iconSvg(512, 115))).resize(180, 180).png().toFile(join(outDir, 'icon-180.png'));
  await sharp(Buffer.from(iconSvg(512, 115))).resize(32, 32).png().toFile(join(outDir, 'favicon-32.png'));
  console.log('Generated: og-image.png, icon-512.png, icon-180.png, favicon-32.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

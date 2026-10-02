import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const INK = "#0B0F14";
const GRADIENT_TOP = "#6EE7B7";
const GRADIENT_BOTTOM = "#059669";

// The Tally mark: four rising tally strokes (a tiny bar chart) crossed by the
// fifth stroke, drawn as an upward trend line. Coordinates are on a 512 grid.
const SLASH = `x1="124" y1="330" x2="388" y2="176"`;
const MARK = `
  <defs>
    <mask id="gap" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
      <rect width="512" height="512" fill="#FFFFFF"/>
      <line ${SLASH} stroke="#000000" stroke-width="62" stroke-linecap="round"/>
    </mask>
  </defs>
  <g stroke="${INK}" stroke-width="44" stroke-linecap="round" mask="url(#gap)">
    <line x1="168" y1="368" x2="168" y2="262"/>
    <line x1="226" y1="368" x2="226" y2="226"/>
    <line x1="284" y1="368" x2="284" y2="190"/>
    <line x1="342" y1="368" x2="342" y2="154"/>
  </g>
  <line ${SLASH} stroke="#FFFFFF" stroke-width="34" stroke-linecap="round"/>`;

/**
 * @param {object} opts
 * @param {number} opts.size   output pixel size
 * @param {boolean} opts.rounded  rounded-square tile (favicon / "any" icons) vs full bleed (OS-masked)
 * @param {number} opts.scale  mark scale inside the tile (shrink for maskable safe zone)
 */
function iconSvg({ size, rounded, scale = 1 }) {
  const rx = rounded ? 512 * 0.23 : 0;
  const offset = (512 - 512 * scale) / 2;
  return `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${GRADIENT_TOP}"/>
      <stop offset="1" stop-color="${GRADIENT_BOTTOM}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${rx}" fill="url(#bg)"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">${MARK}</g>
</svg>`;
}

// Favicon (vector, used by browsers that support SVG icons)
writeFileSync(path.join(outDir, "icon.svg"), iconSvg({ size: 512, rounded: true }));

for (const size of [32, 192, 256, 384, 512]) {
  await sharp(Buffer.from(iconSvg({ size, rounded: true })))
    .png()
    .toFile(path.join(outDir, `icon-${size}.png`));
}

// Maskable icon: full bleed, mark kept inside the ~80% safe zone
await sharp(Buffer.from(iconSvg({ size: 512, rounded: false, scale: 0.8 })))
  .png()
  .toFile(path.join(outDir, "icon-512-maskable.png"));

// Apple touch icon: full bleed, iOS applies its own mask
await sharp(Buffer.from(iconSvg({ size: 180, rounded: false })))
  .png()
  .toFile(path.join(outDir, "apple-touch-icon.png"));

console.log("Icons generated in", outDir);

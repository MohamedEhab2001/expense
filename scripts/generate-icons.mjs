import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const BG = "#0B0F14";
const ACCENT = "#34D399";

function markSvg({ size, padding = 0 }) {
  const inner = size - padding * 2;
  const r = inner * 0.22;
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="${BG}"/>
    <g transform="translate(${padding}, ${padding})">
      <rect x="0" y="0" width="${inner}" height="${inner}" rx="${r}" fill="${BG}"/>
      <text
        x="50%" y="54%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-weight="700"
        font-size="${inner * 0.52}"
        fill="${ACCENT}"
      >M</text>
    </g>
  </svg>`;
}

const sizes = [192, 256, 384, 512];

for (const size of sizes) {
  await sharp(Buffer.from(markSvg({ size })))
    .png()
    .toFile(path.join(outDir, `icon-${size}.png`));
}

// Maskable icon: safe zone is the inner ~80% (40% radius) — pad ~10% each side
await sharp(Buffer.from(markSvg({ size: 512, padding: 512 * 0.1 })))
  .png()
  .toFile(path.join(outDir, "icon-512-maskable.png"));

// Apple touch icon (no padding needed, iOS applies its own mask)
await sharp(Buffer.from(markSvg({ size: 180 })))
  .png()
  .toFile(path.join(outDir, "apple-touch-icon.png"));

console.log("Icons generated in", outDir);

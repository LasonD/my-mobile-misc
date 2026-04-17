// Generates resources/icon.png (and foreground/background pair)
// using pngjs. No native dependencies.
//
// Design: lavender→violet gradient, large Cyrillic letter "Д" in gold,
// small pink heart accent for psychology/sexology theme.
//
// Run:  node scripts/gen-icon.mjs

import { PNG } from 'pngjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'resources');
const SIZE = 1024;

// --- Pixel helpers ---

function makeCanvas(w, h) {
  const png = new PNG({ width: w, height: h });
  return png;
}

function setPx(png, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= png.width || y < 0 || y >= png.height) return;
  const i = (y * png.width + x) * 4;
  png.data[i] = r;
  png.data[i + 1] = g;
  png.data[i + 2] = b;
  png.data[i + 3] = a;
}

function fillRect(png, x0, y0, x1, y1, r, g, b, a = 255) {
  const X0 = Math.max(0, Math.min(x0, x1));
  const X1 = Math.min(png.width, Math.max(x0, x1));
  const Y0 = Math.max(0, Math.min(y0, y1));
  const Y1 = Math.min(png.height, Math.max(y0, y1));
  for (let y = Y0; y < Y1; y++) {
    for (let x = X0; x < X1; x++) {
      setPx(png, x, y, r, g, b, a);
    }
  }
}

function fillGradient(png, topRgb, bottomRgb) {
  for (let y = 0; y < png.height; y++) {
    const t = y / (png.height - 1);
    const r = Math.round(topRgb[0] * (1 - t) + bottomRgb[0] * t);
    const g = Math.round(topRgb[1] * (1 - t) + bottomRgb[1] * t);
    const b = Math.round(topRgb[2] * (1 - t) + bottomRgb[2] * t);
    for (let x = 0; x < png.width; x++) {
      setPx(png, x, y, r, g, b);
    }
  }
}

function fillCircle(png, cx, cy, radius, r, g, b, a = 255) {
  const r2 = radius * radius;
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) {
        setPx(png, x, y, r, g, b, a);
      }
    }
  }
}

function fillHeart(png, cx, cy, size, r, g, b) {
  // Parametric: x = 16 sin^3 t, y = 13 cos t − 5 cos 2t − 2 cos 3t − cos 4t
  // We scan pixels within bounding box and fill those matching the heart implicit equation.
  const s = size / 32;
  for (let y = cy - size; y <= cy + size; y++) {
    for (let x = cx - size; x <= cx + size; x++) {
      const nx = (x - cx) / s;
      const ny = -(y - cy) / s; // flip so heart points down-ish
      // Heart curve: (x² + y² − 1)³ − x² y³ ≤ 0
      const term = Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * ny * ny * ny;
      if (term <= 0) setPx(png, x, y, r, g, b);
    }
  }
}

function drawD(png, cx, cy, scale, r, g, b) {
  // Build Cyrillic "Д" from simple rectangles.
  // Coordinates are in "units"; scale to actual pixels.
  const u = scale;
  const rect = (ux, uy, uw, uh) =>
    fillRect(png, cx + ux * u, cy + uy * u, cx + (ux + uw) * u, cy + (uy + uh) * u, r, g, b);

  // Top horizontal bar
  rect(-4, -6, 8, 1.4);
  // Left vertical
  rect(-4, -6, 1.4, 10);
  // Right vertical
  rect(2.6, -6, 1.4, 10);
  // Bottom base (wider than body)
  rect(-6, 4, 12, 1.4);
  // Left leg
  rect(-6, 5.4, 1.4, 2.2);
  // Right leg
  rect(4.6, 5.4, 1.4, 2.2);
}

function save(png, filename) {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(resolve(OUT_DIR, filename), PNG.sync.write(png));
  console.log(`✓ ${filename} (${png.width}×${png.height})`);
}

// ---- Render icon-only (full icon with gradient background) ----
{
  const png = makeCanvas(SIZE, SIZE);
  // Background gradient: #2a1c3a → #5c3b7a
  fillGradient(png, [0x2a, 0x1c, 0x3a], [0x5c, 0x3b, 0x7a]);
  // Subtle deco circle bottom-right
  fillCircle(png, SIZE, SIZE, SIZE * 0.55, 0xcd, 0xb4, 0xdb, 36);
  fillCircle(png, 0, 0, SIZE * 0.4, 0xff, 0xd3, 0x6a, 28);

  // Cyrillic Д in gold, centered
  const cx = Math.round(SIZE / 2);
  const cy = Math.round(SIZE / 2) + 20;
  drawD(png, cx, cy - 20, 60, 0xff, 0xd3, 0x6a);

  // Pink heart accent
  fillHeart(png, cx, cy + 260, 60, 0xff, 0x85, 0xa2);

  save(png, 'icon.png');
  save(png, 'icon-only.png');
}

// ---- Adaptive icon foreground (transparent bg, centered Д) ----
{
  const png = makeCanvas(SIZE, SIZE);
  // Transparent background
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i + 3] = 0;
  }
  // Scale the Д tighter so it survives safe-zone crop.
  const cx = Math.round(SIZE / 2);
  const cy = Math.round(SIZE / 2);
  drawD(png, cx, cy, 48, 0xff, 0xd3, 0x6a);
  fillHeart(png, cx, cy + 210, 50, 0xff, 0x85, 0xa2);
  save(png, 'icon-foreground.png');
}

// ---- Adaptive icon background (solid gradient) ----
{
  const png = makeCanvas(SIZE, SIZE);
  fillGradient(png, [0x2a, 0x1c, 0x3a], [0x5c, 0x3b, 0x7a]);
  save(png, 'icon-background.png');
}

console.log('Done.');

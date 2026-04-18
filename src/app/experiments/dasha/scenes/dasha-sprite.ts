import * as Phaser from 'phaser';

/**
 * Pixel-art sprite for Dasha on a 56×68 virtual grid (4× more detail than
 * the original 28×34). Built procedurally with primitives (fillRect +
 * pixel-perfect ellipses) so we can express arched brows, lashes, a
 * highlight on the lip and silver snap buttons on the jacket.
 *
 * Reference photos: long brown hair with a middle part and sun highlights,
 * warm round face with subtle smile, yellow leather biker jacket with a
 * V-neck white shirt underneath and a visible zipper slider.
 *
 * Final texture is 112×136 at PIXEL_SIZE=2 (same display size as the old
 * sprite, but packed with more pixels).
 */

const W = 56;
const H = 68;
const PX = 2;

// ---- Palette ----

const HAIR = 0x5a3a2a;
const HAIR_HI = 0x8e6b4a;
const HAIR_LO = 0x331e14;
const SKIN = 0xfad2ae;
const SKIN_HI = 0xffe1c1;
const SKIN_LO = 0xd9a37a;
const BROW = 0x6b4630;
const EYE_DARK = 0x2a1c10;
const EYE_IRIS = 0x8a6746;
const WHITE = 0xffffff;
const LIP_DARK = 0xa2415f;
const LIP = 0xc96a80;
const BLUSH = 0xff9eb3;
const JACKET = 0xdcc238;
const JACKET_HI = 0xf0df4c;
const JACKET_LO = 0x9e8a22;
const BUTTON = 0xcccccc;
const BUTTON_HI = 0xffffff;
const ZIPPER = 0x3a3224;
const SHIRT = 0xfaf4e8;

// ---- Rendering primitives ----

function drawRect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number) {
  g.fillStyle(color, 1);
  g.fillRect(x * PX, y * PX, w * PX, h * PX);
}

function drawPixel(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number) {
  g.fillStyle(color, 1);
  g.fillRect(x * PX, y * PX, PX, PX);
}

function drawEllipse(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: number
) {
  g.fillStyle(color, 1);
  const x0 = Math.floor(cx - rx);
  const x1 = Math.ceil(cx + rx);
  const y0 = Math.floor(cy - ry);
  const y1 = Math.ceil(cy + ry);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) {
        g.fillRect(x * PX, y * PX, PX, PX);
      }
    }
  }
}

function drawTriangle(
  g: Phaser.GameObjects.Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  color: number
) {
  g.fillStyle(color, 1);
  g.fillTriangle(x1 * PX, y1 * PX, x2 * PX, y2 * PX, x3 * PX, y3 * PX);
}

// ---- Dasha ----

function paintDasha(g: Phaser.GameObjects.Graphics, variant: 'idle' | 'blink') {
  // 1. Hair silhouette — oval at crown + long strands hanging past the shoulders.
  drawEllipse(g, 28, 20, 24, 18, HAIR);
  drawRect(g, 4, 22, 17, 40, HAIR);
  drawRect(g, 35, 22, 17, 40, HAIR);
  // Long hair tapers at bottom
  drawRect(g, 8, 60, 12, 4, HAIR);
  drawRect(g, 36, 60, 12, 4, HAIR);

  // 2. Hair highlights (sunny middle-parted strands)
  drawRect(g, 26, 8, 1, 6, HAIR_LO);
  drawRect(g, 29, 8, 1, 6, HAIR_LO);
  drawRect(g, 22, 12, 2, 20, HAIR_HI);
  drawRect(g, 32, 12, 2, 20, HAIR_HI);
  drawRect(g, 11, 36, 2, 24, HAIR_HI);
  drawRect(g, 43, 36, 2, 24, HAIR_HI);

  // 3. Face shape — softly round without chipmunk cheeks.
  drawEllipse(g, 28, 28, 14, 15, SKIN);
  // Soft warm sheen across upper cheek area
  drawRect(g, 18, 25, 20, 1, SKIN_HI);

  // 4. Bangs sweeping across forehead (hair sits on top of skin)
  drawEllipse(g, 28, 14, 16, 5, HAIR);
  // Middle part gap in bangs (skin colour peeks through)
  drawPixel(g, 28, 13, HAIR_HI);
  drawPixel(g, 27, 13, HAIR_HI);

  // 5. Forward strand — diagonal from bangs to brow
  drawPixel(g, 22, 14, HAIR);
  drawPixel(g, 21, 16, HAIR);
  drawPixel(g, 20, 18, HAIR);
  drawPixel(g, 19, 20, HAIR);

  // 6. Brows — softer, shorter, natural (not plucked).
  drawRect(g, 15, 21, 7, 1, BROW);
  drawRect(g, 34, 21, 7, 1, BROW);
  drawPixel(g, 16, 22, BROW);
  drawPixel(g, 20, 22, BROW);
  drawPixel(g, 35, 22, BROW);
  drawPixel(g, 39, 22, BROW);

  if (variant === 'idle') {
    // 7a. Eyes — natural open, warm hazel, no glam catchlight.
    // Subtle upper lash line (thin)
    drawRect(g, 16, 24, 7, 1, EYE_DARK);
    drawRect(g, 34, 24, 7, 1, EYE_DARK);
    // Sclera
    drawEllipse(g, 19, 26, 3, 2, WHITE);
    drawEllipse(g, 37, 26, 3, 2, WHITE);
    // Hazel iris (bigger, fills eye more)
    drawEllipse(g, 19, 26, 2, 2, EYE_IRIS);
    drawEllipse(g, 37, 26, 2, 2, EYE_IRIS);
    // Small dark pupil centre
    drawPixel(g, 19, 26, EYE_DARK);
    drawPixel(g, 37, 26, EYE_DARK);
    // No big catchlight — just a subtle dot
    drawPixel(g, 18, 25, WHITE);
    drawPixel(g, 36, 25, WHITE);
  } else {
    // 7b. Closed eyes — arched lash line
    for (let x = 16; x <= 22; x++) drawPixel(g, x, 26, EYE_DARK);
    for (let x = 34; x <= 40; x++) drawPixel(g, x, 26, EYE_DARK);
    // small lashes flicking down at corners
    drawPixel(g, 16, 27, EYE_DARK);
    drawPixel(g, 22, 27, EYE_DARK);
    drawPixel(g, 34, 27, EYE_DARK);
    drawPixel(g, 40, 27, EYE_DARK);
  }

  // 8. Nose — tiny & cute, minimal shading
  drawPixel(g, 27, 31, SKIN_LO);
  drawPixel(g, 28, 31, SKIN_LO);
  drawPixel(g, 27, 32, SKIN_LO);

  // 9. Blush — subtle, small rosy dots
  drawEllipse(g, 16, 33, 2, 1, BLUSH);
  drawEllipse(g, 40, 33, 2, 1, BLUSH);

  // 10. Lips — small soft smile, corners turned up.
  drawRect(g, 25, 37, 6, 1, LIP);
  drawPixel(g, 24, 37, LIP_DARK);
  drawPixel(g, 31, 37, LIP_DARK);
  // Subtle smile curve (corners raised)
  drawPixel(g, 24, 36, LIP);
  drawPixel(g, 31, 36, LIP);
  // Tiny lower lip hint
  drawRect(g, 26, 38, 4, 1, LIP_DARK);

  // 11. Rounder chin — soften the point; small dimple in middle.
  drawEllipse(g, 28, 42, 6, 3, SKIN);
  drawPixel(g, 28, 41, SKIN_LO);
  drawRect(g, 23, 44, 10, 1, SKIN_LO);

  // 12. Neck
  drawRect(g, 24, 45, 9, 4, SKIN);
  drawRect(g, 24, 48, 9, 1, SKIN_LO);

  // 13. White shirt V-neck (between jacket lapels)
  drawTriangle(g, 23, 49, 33, 49, 28, 57, SHIRT);
  drawRect(g, 23, 49, 11, 1, SHIRT);

  // 14. Yellow jacket body
  drawRect(g, 4, 50, 22, 18, JACKET);
  drawRect(g, 30, 50, 22, 18, JACKET);
  drawRect(g, 4, 65, 48, 3, JACKET_LO);
  // Shoulder highlights
  drawRect(g, 4, 50, 6, 2, JACKET_HI);
  drawRect(g, 46, 50, 6, 2, JACKET_HI);

  // 15. Lapels — angled darker triangles peeling back from the neckline
  drawTriangle(g, 22, 49, 18, 58, 23, 58, JACKET_HI);
  drawTriangle(g, 34, 49, 38, 58, 33, 58, JACKET_HI);

  // 16. Zipper (centre front)
  drawRect(g, 28, 56, 1, 12, ZIPPER);
  // Zipper slider rectangle
  drawRect(g, 27, 57, 3, 2, BUTTON);

  // 17. Silver snap buttons on lapels
  const snaps: Array<[number, number]> = [
    [20, 52],
    [20, 58],
    [36, 52],
    [36, 58],
  ];
  for (const [bx, by] of snaps) {
    drawPixel(g, bx, by, BUTTON);
    drawPixel(g, bx + 1, by, BUTTON_HI);
  }
}

export function buildDashaTextures(scene: Phaser.Scene) {
  {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    paintDasha(g, 'idle');
    g.generateTexture('dasha_idle', W * PX, H * PX);
    g.destroy();
  }
  {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    paintDasha(g, 'blink');
    g.generateTexture('dasha_blink', W * PX, H * PX);
    g.destroy();
  }
}

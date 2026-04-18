import * as Phaser from 'phaser';

/**
 * Parameterized humanoid pixel-art sprite on a 56×68 virtual grid (same
 * dimensions as Dasha's sprite so everyone fits the same stage slot).
 *
 * Style matches Dasha but is intentionally simpler: no reference photos —
 * characters are distinguished by hair style/colour, skin tone, clothing, and
 * one optional accessory. Generates both an idle texture and a blink texture
 * for the character registry.
 */

const W = 56;
const H = 68;
const PX = 2;

// ---------- Config ----------

export type HairStyle =
  | 'short'
  | 'medium'
  | 'long'
  | 'long-curly'
  | 'bob'
  | 'bun'
  | 'ponytail'
  | 'balding';
export type ShirtStyle = 'plain' | 'collared' | 'vneck' | 'uniform';
export type FacialHair = 'none' | 'stubble' | 'mustache' | 'beard';
export type Accessory = 'glasses' | 'tie' | 'hat-cap' | 'earrings' | 'scarf';

export interface HumanConfig {
  /** Unique key used for texture caching. */
  id: string;
  /** 'f' = softer face + lips/blush; 'm' = thicker brows, no blush, thin lips. */
  gender: 'f' | 'm';
  skin: number;
  hair: { color: number; style: HairStyle };
  eye?: number;
  shirt: { color: number; style: ShirtStyle };
  jacket?: { color: number };
  accessory?: Accessory | null;
  accessoryColor?: number;
  facialHair?: FacialHair;
}

// ---------- Primitives ----------

function drawRect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number) {
  g.fillStyle(color, 1);
  g.fillRect(x * PX, y * PX, w * PX, h * PX);
}

function drawPixel(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number) {
  g.fillStyle(color, 1);
  g.fillRect(x * PX, y * PX, PX, PX);
}

function drawEllipse(g: Phaser.GameObjects.Graphics, cx: number, cy: number, rx: number, ry: number, color: number) {
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
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  color: number
) {
  g.fillStyle(color, 1);
  g.fillTriangle(x1 * PX, y1 * PX, x2 * PX, y2 * PX, x3 * PX, y3 * PX);
}

// ---------- Colour shading ----------

function clamp8(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function shade(color: number, factor: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const f = 1 + factor;
  return (clamp8(r * f) << 16) | (clamp8(g * f) << 8) | clamp8(b * f);
}

interface Palette {
  skin: number;
  skinHi: number;
  skinLo: number;
  hair: number;
  hairHi: number;
  hairLo: number;
  brow: number;
  eye: number;
  eyeDark: number;
  lip: number;
  lipDark: number;
  blush: number;
  shirt: number;
  shirtHi: number;
  shirtLo: number;
  jacket?: number;
  jacketHi?: number;
  jacketLo?: number;
  white: number;
}

function buildPalette(cfg: HumanConfig): Palette {
  const p: Palette = {
    skin: cfg.skin,
    skinHi: shade(cfg.skin, 0.12),
    skinLo: shade(cfg.skin, -0.18),
    hair: cfg.hair.color,
    hairHi: shade(cfg.hair.color, 0.3),
    hairLo: shade(cfg.hair.color, -0.35),
    brow: shade(cfg.hair.color, -0.25),
    eye: cfg.eye ?? 0x6a4a30,
    eyeDark: 0x2a1c10,
    lip: 0xc96a80,
    lipDark: 0xa2415f,
    blush: 0xff9eb3,
    shirt: cfg.shirt.color,
    shirtHi: shade(cfg.shirt.color, 0.15),
    shirtLo: shade(cfg.shirt.color, -0.25),
    white: 0xffffff,
  };
  if (cfg.jacket) {
    p.jacket = cfg.jacket.color;
    p.jacketHi = shade(cfg.jacket.color, 0.18);
    p.jacketLo = shade(cfg.jacket.color, -0.3);
  }
  return p;
}

// ---------- Hair paint ----------

function paintHairBack(g: Phaser.GameObjects.Graphics, cfg: HumanConfig, p: Palette) {
  switch (cfg.hair.style) {
    case 'long':
      drawRect(g, 4, 22, 17, 40, p.hair);
      drawRect(g, 35, 22, 17, 40, p.hair);
      drawRect(g, 8, 60, 12, 4, p.hair);
      drawRect(g, 36, 60, 12, 4, p.hair);
      break;
    case 'long-curly': {
      // Wider, bumpier silhouette — curls add volume.
      drawRect(g, 2, 22, 20, 38, p.hair);
      drawRect(g, 34, 22, 20, 38, p.hair);
      drawRect(g, 6, 58, 16, 5, p.hair);
      drawRect(g, 34, 58, 16, 5, p.hair);
      // Extra curl bumps at shoulder level & sides.
      const bumps: Array<[number, number]> = [
        [1, 28], [2, 34], [1, 42], [2, 50], [1, 58],
        [54, 28], [53, 34], [54, 42], [53, 50], [54, 58],
        [5, 63], [20, 63], [35, 63], [50, 63],
      ];
      for (const [x, y] of bumps) {
        drawEllipse(g, x, y, 2, 2, p.hair);
      }
      break;
    }
    case 'medium':
      drawRect(g, 8, 22, 10, 22, p.hair);
      drawRect(g, 38, 22, 10, 22, p.hair);
      break;
    case 'ponytail':
      drawEllipse(g, 48, 24, 5, 10, p.hair);
      drawRect(g, 45, 32, 6, 12, p.hair);
      break;
    case 'bob':
      drawRect(g, 10, 22, 8, 16, p.hair);
      drawRect(g, 38, 22, 8, 16, p.hair);
      break;
    // short, bun, balding: no back layer
  }
}

function paintHairFront(g: Phaser.GameObjects.Graphics, cfg: HumanConfig, p: Palette) {
  switch (cfg.hair.style) {
    case 'short':
      drawEllipse(g, 28, 17, 14, 10, p.hair);
      drawRect(g, 14, 18, 28, 5, p.hair);
      // sparse highlights
      drawPixel(g, 22, 14, p.hairHi);
      drawPixel(g, 32, 14, p.hairHi);
      break;
    case 'medium':
      drawEllipse(g, 28, 18, 18, 10, p.hair);
      drawRect(g, 12, 20, 32, 5, p.hair);
      drawRect(g, 22, 12, 2, 14, p.hairHi);
      drawRect(g, 32, 12, 2, 14, p.hairHi);
      break;
    case 'long':
      // Crown + bangs (same footprint as 'medium'/'bob') so face stays visible.
      drawEllipse(g, 28, 17, 18, 9, p.hair);
      drawRect(g, 12, 19, 32, 4, p.hair);
      // Side locks framing the face, stopping well above the jaw.
      drawRect(g, 10, 23, 3, 12, p.hair);
      drawRect(g, 43, 23, 3, 12, p.hair);
      drawPixel(g, 22, 14, p.hairHi);
      drawPixel(g, 32, 14, p.hairHi);
      break;
    case 'bob':
      drawEllipse(g, 28, 18, 16, 9, p.hair);
      drawRect(g, 12, 20, 32, 6, p.hair);
      drawRect(g, 14, 20, 28, 2, p.hairHi);
      break;
    case 'bun':
      // Hair hugs head + a round knot on top
      drawEllipse(g, 28, 19, 14, 9, p.hair);
      drawEllipse(g, 28, 8, 7, 5, p.hair);
      drawRect(g, 14, 20, 28, 4, p.hair);
      break;
    case 'ponytail':
      drawEllipse(g, 28, 18, 14, 9, p.hair);
      drawRect(g, 14, 20, 28, 4, p.hair);
      drawPixel(g, 22, 14, p.hairHi);
      drawPixel(g, 32, 14, p.hairHi);
      break;
    case 'long-curly':
      // Rounder, voluminous top with surface curl bumps.
      drawEllipse(g, 28, 19, 18, 10, p.hair);
      drawRect(g, 12, 20, 32, 4, p.hair);
      // Bumpy curl highlights on top surface.
      for (const [x, y] of [[18, 14], [24, 12], [32, 12], [38, 14]] as const) {
        drawEllipse(g, x, y, 3, 3, p.hair);
      }
      drawPixel(g, 22, 13, p.hairHi);
      drawPixel(g, 34, 13, p.hairHi);
      drawPixel(g, 28, 11, p.hairHi);
      break;
    case 'balding': {
      // Horseshoe fringe: hair on sides and back of head, bald on top.
      // Side tufts above ears.
      drawRect(g, 10, 21, 6, 8, p.hair);
      drawRect(g, 40, 21, 6, 8, p.hair);
      // Narrow strip at back of crown.
      drawRect(g, 16, 21, 24, 2, p.hair);
      // Subtle receding hairline highlights (skin shows through top).
      drawPixel(g, 14, 20, p.hairHi);
      drawPixel(g, 42, 20, p.hairHi);
      break;
    }
  }
}

// ---------- Face / features ----------

function paintFace(g: Phaser.GameObjects.Graphics, cfg: HumanConfig, p: Palette) {
  const rx = 14;
  const ry = cfg.gender === 'f' ? 15 : 16;
  drawEllipse(g, 28, 28, rx, ry, p.skin);
  // Cheek sheen — subtle
  drawRect(g, 18, 25, 20, 1, p.skinHi);
}

function paintBrows(g: Phaser.GameObjects.Graphics, cfg: HumanConfig, p: Palette) {
  if (cfg.gender === 'f') {
    drawRect(g, 15, 21, 7, 1, p.brow);
    drawRect(g, 34, 21, 7, 1, p.brow);
    drawPixel(g, 16, 22, p.brow);
    drawPixel(g, 20, 22, p.brow);
    drawPixel(g, 35, 22, p.brow);
    drawPixel(g, 39, 22, p.brow);
  } else {
    drawRect(g, 15, 21, 7, 2, p.brow);
    drawRect(g, 34, 21, 7, 2, p.brow);
  }
}

function paintEyes(g: Phaser.GameObjects.Graphics, cfg: HumanConfig, p: Palette, variant: 'idle' | 'blink') {
  if (variant === 'idle') {
    drawRect(g, 16, 24, 7, 1, p.eyeDark);
    drawRect(g, 34, 24, 7, 1, p.eyeDark);
    drawEllipse(g, 19, 26, 3, 2, p.white);
    drawEllipse(g, 37, 26, 3, 2, p.white);
    drawEllipse(g, 19, 26, 2, 2, p.eye);
    drawEllipse(g, 37, 26, 2, 2, p.eye);
    drawPixel(g, 19, 26, p.eyeDark);
    drawPixel(g, 37, 26, p.eyeDark);
    drawPixel(g, 18, 25, p.white);
    drawPixel(g, 36, 25, p.white);
  } else {
    for (let x = 16; x <= 22; x++) drawPixel(g, x, 26, p.eyeDark);
    for (let x = 34; x <= 40; x++) drawPixel(g, x, 26, p.eyeDark);
    drawPixel(g, 16, 27, p.eyeDark);
    drawPixel(g, 22, 27, p.eyeDark);
    drawPixel(g, 34, 27, p.eyeDark);
    drawPixel(g, 40, 27, p.eyeDark);
  }
}

function paintNose(g: Phaser.GameObjects.Graphics, cfg: HumanConfig, p: Palette) {
  drawPixel(g, 27, 31, p.skinLo);
  drawPixel(g, 28, 31, p.skinLo);
  drawPixel(g, 27, 32, p.skinLo);
  if (cfg.gender === 'm') drawPixel(g, 28, 32, p.skinLo);
}

function paintBlush(g: Phaser.GameObjects.Graphics, p: Palette) {
  drawEllipse(g, 16, 33, 2, 1, p.blush);
  drawEllipse(g, 40, 33, 2, 1, p.blush);
}

function paintMouth(g: Phaser.GameObjects.Graphics, cfg: HumanConfig, p: Palette) {
  if (cfg.gender === 'f') {
    drawRect(g, 25, 37, 6, 1, p.lip);
    drawPixel(g, 24, 37, p.lipDark);
    drawPixel(g, 31, 37, p.lipDark);
    drawPixel(g, 24, 36, p.lip);
    drawPixel(g, 31, 36, p.lip);
    drawRect(g, 26, 38, 4, 1, p.lipDark);
  } else {
    drawRect(g, 25, 37, 6, 1, p.skinLo);
  }
}

function paintChinAndNeck(g: Phaser.GameObjects.Graphics, cfg: HumanConfig, p: Palette) {
  drawEllipse(g, 28, 42, 6, 3, p.skin);
  drawPixel(g, 28, 41, p.skinLo);
  drawRect(g, 23, 44, 10, 1, p.skinLo);
  drawRect(g, 24, 45, 9, 4, p.skin);
  drawRect(g, 24, 48, 9, 1, p.skinLo);
  // Subtle jaw for masculine
  if (cfg.gender === 'm') {
    drawPixel(g, 22, 42, p.skinLo);
    drawPixel(g, 34, 42, p.skinLo);
  }
}

function paintShirt(g: Phaser.GameObjects.Graphics, cfg: HumanConfig, p: Palette) {
  switch (cfg.shirt.style) {
    case 'plain':
      drawRect(g, 8, 49, 40, 19, p.shirt);
      drawRect(g, 8, 49, 40, 2, p.shirtHi);
      drawRect(g, 8, 65, 40, 3, p.shirtLo);
      break;
    case 'collared':
      drawRect(g, 8, 50, 40, 18, p.shirt);
      drawRect(g, 8, 65, 40, 3, p.shirtLo);
      // Collar flaps
      drawTriangle(g, 22, 49, 28, 54, 23, 54, p.shirtLo);
      drawTriangle(g, 34, 49, 28, 54, 33, 54, p.shirtLo);
      break;
    case 'vneck':
      drawRect(g, 8, 49, 40, 19, p.shirt);
      drawRect(g, 8, 65, 40, 3, p.shirtLo);
      drawTriangle(g, 23, 49, 33, 49, 28, 57, p.skin);
      break;
    case 'uniform':
      drawRect(g, 8, 48, 40, 20, p.shirt);
      drawRect(g, 8, 48, 40, 2, p.shirtHi);
      drawRect(g, 8, 65, 40, 3, p.shirtLo);
      // Epaulettes
      drawRect(g, 10, 50, 6, 1, p.shirtHi);
      drawRect(g, 40, 50, 6, 1, p.shirtHi);
      break;
  }
}

function paintJacket(g: Phaser.GameObjects.Graphics, cfg: HumanConfig, p: Palette) {
  if (!cfg.jacket || p.jacket === undefined) return;
  drawRect(g, 4, 50, 22, 18, p.jacket);
  drawRect(g, 30, 50, 22, 18, p.jacket);
  drawRect(g, 4, 65, 48, 3, p.jacketLo!);
  drawRect(g, 4, 50, 6, 2, p.jacketHi!);
  drawRect(g, 46, 50, 6, 2, p.jacketHi!);
  // Lapels
  drawTriangle(g, 22, 49, 18, 58, 23, 58, p.jacketHi!);
  drawTriangle(g, 34, 49, 38, 58, 33, 58, p.jacketHi!);
}

function paintFacialHair(g: Phaser.GameObjects.Graphics, cfg: HumanConfig, p: Palette) {
  if (cfg.facialHair === 'none' || !cfg.facialHair) return;
  const shadeColor = p.hairLo;
  switch (cfg.facialHair) {
    case 'stubble':
      for (let x = 22; x <= 34; x += 2) drawPixel(g, x, 40, shadeColor);
      for (let x = 23; x <= 33; x += 2) drawPixel(g, x, 41, shadeColor);
      break;
    case 'mustache':
      drawRect(g, 24, 36, 8, 1, shadeColor);
      break;
    case 'beard':
      drawRect(g, 22, 39, 12, 2, shadeColor);
      drawRect(g, 24, 41, 8, 2, shadeColor);
      drawRect(g, 26, 43, 4, 1, shadeColor);
      break;
  }
}

function paintAccessory(g: Phaser.GameObjects.Graphics, cfg: HumanConfig, p: Palette) {
  const color = cfg.accessoryColor ?? 0x2a1c10;
  switch (cfg.accessory) {
    case 'glasses':
      // Rectangular frames around each eye + bridge
      drawRect(g, 14, 23, 11, 1, color);
      drawRect(g, 14, 28, 11, 1, color);
      drawRect(g, 14, 23, 1, 6, color);
      drawRect(g, 24, 23, 1, 6, color);
      drawRect(g, 32, 23, 11, 1, color);
      drawRect(g, 32, 28, 11, 1, color);
      drawRect(g, 32, 23, 1, 6, color);
      drawRect(g, 42, 23, 1, 6, color);
      drawRect(g, 25, 25, 7, 1, color);
      break;
    case 'tie':
      drawTriangle(g, 28, 49, 26, 51, 30, 51, color);
      drawRect(g, 27, 51, 3, 8, color);
      break;
    case 'hat-cap':
      // Peaked cap (security / barista style)
      drawEllipse(g, 28, 12, 16, 5, color);
      drawRect(g, 12, 12, 32, 2, color);
      drawRect(g, 10, 14, 36, 2, shade(color, -0.3));
      break;
    case 'earrings':
      drawPixel(g, 14, 30, color);
      drawPixel(g, 42, 30, color);
      break;
    case 'scarf':
      drawRect(g, 22, 48, 14, 3, color);
      drawRect(g, 22, 51, 4, 3, color);
      break;
  }
}

// ---------- Composite ----------

function paintHuman(g: Phaser.GameObjects.Graphics, cfg: HumanConfig, variant: 'idle' | 'blink') {
  const p = buildPalette(cfg);

  paintHairBack(g, cfg, p);
  paintFace(g, cfg, p);
  paintHairFront(g, cfg, p);
  paintBrows(g, cfg, p);
  paintEyes(g, cfg, p, variant);
  paintNose(g, cfg, p);
  if (cfg.gender === 'f') paintBlush(g, p);
  paintMouth(g, cfg, p);
  paintChinAndNeck(g, cfg, p);
  paintShirt(g, cfg, p);
  if (cfg.jacket) paintJacket(g, cfg, p);
  if (cfg.facialHair && cfg.facialHair !== 'none') paintFacialHair(g, cfg, p);
  if (cfg.accessory) paintAccessory(g, cfg, p);
}

// ---------- Texture + sprite ----------

function ensureTextures(scene: Phaser.Scene, cfg: HumanConfig) {
  const idleKey = `${cfg.id}_idle`;
  const blinkKey = `${cfg.id}_blink`;
  if (!scene.textures.exists(idleKey)) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    paintHuman(g, cfg, 'idle');
    g.generateTexture(idleKey, W * PX, H * PX);
    g.destroy();
  }
  if (!scene.textures.exists(blinkKey)) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    paintHuman(g, cfg, 'blink');
    g.generateTexture(blinkKey, W * PX, H * PX);
    g.destroy();
  }
  return { idleKey, blinkKey };
}

/**
 * Builds a pixel-art humanoid container with bottom-center origin, blink
 * loop, and a subtle idle breathing tween — same behaviour as Dasha's sprite.
 */
export function renderHumanSprite(
  scene: Phaser.Scene,
  cfg: HumanConfig
): Phaser.GameObjects.Container {
  const { idleKey, blinkKey } = ensureTextures(scene, cfg);
  const container = scene.add.container(0, 0);
  const shadow = scene.add.ellipse(2, 130, 110, 18, 0x000000, 0.25);
  const sprite = scene.add.sprite(0, 0, idleKey).setOrigin(0.5, 1);
  container.add([shadow, sprite]);

  const blinkTimer = scene.time.addEvent({
    delay: 3200 + Math.floor(Math.random() * 1200),
    loop: true,
    callback: () => {
      if (!scene.textures.exists(blinkKey)) return;
      sprite.setTexture(blinkKey);
      scene.time.delayedCall(120, () => sprite.setTexture(idleKey));
    },
  });

  scene.tweens.add({
    targets: sprite,
    y: '+=2',
    duration: 1600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  container.once(Phaser.GameObjects.Events.DESTROY, () => blinkTimer.remove());
  return container;
}

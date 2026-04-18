import * as Phaser from 'phaser';

/**
 * Simple pixel-art cat sprite on the same 56×68 virtual grid as the humans,
 * so Max stands at the same stage slot. Scottish Straight: upright ears, round
 * head, sitting-forward pose.
 */

const W = 56;
const H = 68;
const PX = 2;

export interface CatConfig {
  id: string;
  fur: number;        // main coat colour
  belly?: number;     // lighter underside
  eye?: number;       // iris colour
  stripes?: boolean;  // tabby stripes
}

function drawRect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, c: number) {
  g.fillStyle(c, 1);
  g.fillRect(x * PX, y * PX, w * PX, h * PX);
}

function drawPixel(g: Phaser.GameObjects.Graphics, x: number, y: number, c: number) {
  g.fillStyle(c, 1);
  g.fillRect(x * PX, y * PX, PX, PX);
}

function drawEllipse(g: Phaser.GameObjects.Graphics, cx: number, cy: number, rx: number, ry: number, c: number) {
  g.fillStyle(c, 1);
  const x0 = Math.floor(cx - rx);
  const x1 = Math.ceil(cx + rx);
  const y0 = Math.floor(cy - ry);
  const y1 = Math.ceil(cy + ry);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) g.fillRect(x * PX, y * PX, PX, PX);
    }
  }
}

function drawTriangle(
  g: Phaser.GameObjects.Graphics,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  c: number
) {
  g.fillStyle(c, 1);
  g.fillTriangle(x1 * PX, y1 * PX, x2 * PX, y2 * PX, x3 * PX, y3 * PX);
}

function clamp8(v: number): number { return Math.max(0, Math.min(255, Math.round(v))); }

function shade(color: number, factor: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const f = 1 + factor;
  return (clamp8(r * f) << 16) | (clamp8(g * f) << 8) | clamp8(b * f);
}

function paintCat(g: Phaser.GameObjects.Graphics, cfg: CatConfig, variant: 'idle' | 'blink') {
  const fur = cfg.fur;
  const furHi = shade(fur, 0.2);
  const furLo = shade(fur, -0.3);
  const belly = cfg.belly ?? shade(fur, 0.3);
  const eye = cfg.eye ?? 0x4a8a4a;
  const nose = 0xe68aa3;
  const dark = 0x1a1208;

  // Body (sitting): broad trapezoid below the head.
  drawEllipse(g, 28, 56, 16, 10, fur);
  drawRect(g, 12, 50, 32, 14, fur);
  // Belly patch
  drawEllipse(g, 28, 58, 9, 7, belly);

  // Tail curled around the right side of the body.
  drawRect(g, 42, 50, 3, 10, fur);
  drawRect(g, 44, 47, 3, 6, fur);
  drawRect(g, 46, 44, 3, 5, fur);
  drawPixel(g, 48, 44, furLo);
  drawPixel(g, 42, 60, furLo);

  // Front paws on the ground.
  drawEllipse(g, 19, 65, 4, 2, fur);
  drawEllipse(g, 37, 65, 4, 2, fur);
  drawPixel(g, 17, 66, furLo);
  drawPixel(g, 39, 66, furLo);

  // Head (big, round).
  drawEllipse(g, 28, 33, 14, 13, fur);
  // Cheek puffs / muzzle area (lighter)
  drawEllipse(g, 25, 38, 4, 3, belly);
  drawEllipse(g, 31, 38, 4, 3, belly);
  // Forehead stripe + highlights
  drawRect(g, 26, 22, 4, 2, furLo);
  drawPixel(g, 22, 26, furLo);
  drawPixel(g, 34, 26, furLo);

  // Stripes on cheeks / body — tabby accent.
  if (cfg.stripes) {
    drawRect(g, 16, 52, 2, 8, furLo);
    drawRect(g, 20, 54, 2, 6, furLo);
    drawRect(g, 36, 52, 2, 8, furLo);
    drawRect(g, 32, 54, 2, 6, furLo);
  }

  // Upright ears (Scottish Straight — not folded).
  drawTriangle(g, 15, 19, 21, 19, 18, 12, fur);
  drawTriangle(g, 35, 19, 41, 19, 38, 12, fur);
  // Inner ear (pink)
  drawTriangle(g, 17, 19, 20, 19, 18, 14, nose);
  drawTriangle(g, 36, 19, 40, 19, 38, 14, nose);

  // Eyes.
  if (variant === 'idle') {
    drawEllipse(g, 23, 33, 2, 3, dark);
    drawEllipse(g, 33, 33, 2, 3, dark);
    drawEllipse(g, 23, 33, 1, 2, eye);
    drawEllipse(g, 33, 33, 1, 2, eye);
    drawPixel(g, 22, 31, 0xffffff);
    drawPixel(g, 32, 31, 0xffffff);
    // Vertical pupils
    drawRect(g, 23, 33, 1, 2, dark);
    drawRect(g, 33, 33, 1, 2, dark);
  } else {
    // Blink: horizontal lines.
    drawRect(g, 22, 33, 3, 1, dark);
    drawRect(g, 32, 33, 3, 1, dark);
  }

  // Nose (small pink triangle).
  drawTriangle(g, 27, 37, 29, 37, 28, 39, nose);

  // Mouth (W shape below nose).
  drawPixel(g, 28, 40, dark);
  drawPixel(g, 27, 41, dark);
  drawPixel(g, 29, 41, dark);
  drawPixel(g, 26, 42, dark);
  drawPixel(g, 30, 42, dark);

  // Whiskers.
  drawRect(g, 18, 39, 4, 1, furLo);
  drawRect(g, 20, 41, 4, 1, furLo);
  drawRect(g, 34, 39, 4, 1, furLo);
  drawRect(g, 32, 41, 4, 1, furLo);
}

function ensureTextures(scene: Phaser.Scene, cfg: CatConfig) {
  const idleKey = `${cfg.id}_idle`;
  const blinkKey = `${cfg.id}_blink`;
  if (!scene.textures.exists(idleKey)) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    paintCat(g, cfg, 'idle');
    g.generateTexture(idleKey, W * PX, H * PX);
    g.destroy();
  }
  if (!scene.textures.exists(blinkKey)) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    paintCat(g, cfg, 'blink');
    g.generateTexture(blinkKey, W * PX, H * PX);
    g.destroy();
  }
  return { idleKey, blinkKey };
}

export function renderCatSprite(
  scene: Phaser.Scene,
  cfg: CatConfig
): Phaser.GameObjects.Container {
  const { idleKey, blinkKey } = ensureTextures(scene, cfg);
  const container = scene.add.container(0, 0);
  const shadow = scene.add.ellipse(2, 130, 96, 16, 0x000000, 0.28);
  const sprite = scene.add.sprite(0, 0, idleKey).setOrigin(0.5, 1);
  container.add([shadow, sprite]);

  const blinkTimer = scene.time.addEvent({
    delay: 4200 + Math.floor(Math.random() * 1500),
    loop: true,
    callback: () => {
      if (!scene.textures.exists(blinkKey)) return;
      sprite.setTexture(blinkKey);
      scene.time.delayedCall(140, () => sprite.setTexture(idleKey));
    },
  });

  scene.tweens.add({
    targets: sprite,
    y: '+=1',
    duration: 1800,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  container.once(Phaser.GameObjects.Events.DESTROY, () => blinkTimer.remove());
  return container;
}

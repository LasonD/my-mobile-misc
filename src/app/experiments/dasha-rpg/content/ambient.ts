import * as Phaser from 'phaser';

/**
 * Small ambient-life helpers used by location builders.
 *
 * Every helper that adds game objects attaches them to the location's host
 * container so they travel with it. Recurring spawners are bound to the
 * host's DESTROY event, so when the scene transitions to a new location and
 * the old container is destroyed, all pending timers stop automatically.
 *
 * Keep everything sparse and alpha-muted — this is atmosphere, not action.
 */

export interface RecurringOpts {
  minMs: number;
  maxMs: number;
  fn: () => void;
  initialDelayMs?: number;
}

/**
 * Schedules a recurring callback with randomized delays between `minMs` and
 * `maxMs`. The loop auto-stops when `host` is destroyed.
 */
export function scheduleRecurring(
  scene: Phaser.Scene,
  host: Phaser.GameObjects.Container,
  opts: RecurringOpts
) {
  let cancelled = false;
  let pending: Phaser.Time.TimerEvent | undefined;

  host.once(Phaser.GameObjects.Events.DESTROY, () => {
    cancelled = true;
    pending?.remove(false);
    pending = undefined;
  });

  const nextDelay = () => Phaser.Math.Between(opts.minMs, opts.maxMs);
  const tick = () => {
    pending = undefined;
    if (cancelled || !host.active) return;
    opts.fn();
    pending = scene.time.delayedCall(nextDelay(), tick);
  };
  pending = scene.time.delayedCall(opts.initialDelayMs ?? nextDelay(), tick);
}

// ---------- Passing silhouette ----------

export interface PasserbyOpts {
  /** Vertical position of the silhouette's feet. */
  yFeet: number;
  /** Uniform scale; 1 is ~36px tall. */
  scale?: number;
  /** Pixels/sec horizontal travel speed. */
  speed?: number;
  direction?: 'ltr' | 'rtl';
  color?: number;
  alpha?: number;
  /** Head-bob amplitude in px. */
  bob?: number;
}

export function spawnPasserby(
  scene: Phaser.Scene,
  host: Phaser.GameObjects.Container,
  opts: PasserbyOpts
) {
  const { width } = scene.scale;
  const s = opts.scale ?? 1;
  const speed = opts.speed ?? 90;
  const color = opts.color ?? 0x2a1c2a;
  const alpha = opts.alpha ?? 0.45;
  const dir = opts.direction ?? (Math.random() < 0.5 ? 'ltr' : 'rtl');
  const bob = opts.bob ?? 2;

  const silhouette = scene.add.container(0, 0);
  // Body (tapered shoulders), head. Feet at local y = 0.
  const body = scene.add.graphics();
  body.fillStyle(color, alpha);
  // Torso trapezoid
  body.fillTriangle(-8 * s, -12 * s, 8 * s, -12 * s, 6 * s, 0);
  body.fillTriangle(-8 * s, -12 * s, 8 * s, -12 * s, -6 * s, 0);
  body.fillRect(-6 * s, -30 * s, 12 * s, 20 * s);
  // Head
  body.fillCircle(0, -36 * s, 6 * s);
  silhouette.add(body);
  host.add(silhouette);

  const padding = 40;
  const startX = dir === 'ltr' ? -padding : width + padding;
  const endX = dir === 'ltr' ? width + padding : -padding;
  silhouette.setPosition(startX, opts.yFeet);

  const distance = Math.abs(endX - startX);
  const durationMs = (distance / speed) * 1000;

  scene.tweens.add({
    targets: silhouette,
    x: endX,
    duration: durationMs,
    ease: 'Linear',
    onComplete: () => silhouette.destroy(),
  });
  // Subtle walking bob: oscillate y around the feet line.
  scene.tweens.add({
    targets: silhouette,
    y: opts.yFeet - bob,
    duration: 260,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}

// ---------- Flying bird ----------

export interface BirdOpts {
  /** Vertical position the bird glides towards (±20px random). */
  y: number;
  speed?: number;
  direction?: 'ltr' | 'rtl';
  scale?: number;
  color?: number;
  alpha?: number;
}

export function spawnBird(
  scene: Phaser.Scene,
  host: Phaser.GameObjects.Container,
  opts: BirdOpts
) {
  const { width } = scene.scale;
  const speed = opts.speed ?? 170;
  const dir = opts.direction ?? (Math.random() < 0.5 ? 'ltr' : 'rtl');
  const s = opts.scale ?? 1;
  const color = opts.color ?? 0x2a1c2a;
  const alpha = opts.alpha ?? 0.7;

  const bird = scene.add.graphics();
  host.add(bird);

  const redraw = (flap: number) => {
    bird.clear();
    bird.lineStyle(2, color, alpha);
    bird.beginPath();
    const wWidth = 10 * s;
    const wPeak = flap * 5 * s;
    bird.moveTo(-wWidth, 0);
    bird.lineTo(0, -wPeak);
    bird.lineTo(wWidth, 0);
    bird.strokePath();
  };

  const flapState = { v: 1 };
  redraw(1);
  scene.tweens.add({
    targets: flapState,
    v: 0.2,
    duration: 220,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
    onUpdate: () => redraw(flapState.v),
  });

  const pad = 30;
  const startX = dir === 'ltr' ? -pad : width + pad;
  const endX = dir === 'ltr' ? width + pad : -pad;
  const startY = opts.y + Phaser.Math.Between(-10, 10);
  const endY = opts.y + Phaser.Math.Between(-20, 20);
  bird.setPosition(startX, startY);

  const durationMs = (Math.abs(endX - startX) / speed) * 1000;
  scene.tweens.add({
    targets: bird,
    x: endX,
    y: endY,
    duration: durationMs,
    ease: 'Sine.easeInOut',
    onComplete: () => bird.destroy(),
  });
}

// ---------- Steam puff ----------

export function spawnSteamPuff(
  scene: Phaser.Scene,
  host: Phaser.GameObjects.Container,
  opts: { x: number; y: number }
) {
  const r = Phaser.Math.Between(3, 6);
  const puff = scene.add.circle(opts.x, opts.y, r, 0xffffff, 0.55);
  host.add(puff);
  scene.tweens.add({
    targets: puff,
    y: opts.y - 40 - Math.random() * 18,
    x: opts.x + (Math.random() * 14 - 7),
    alpha: 0,
    scale: 1.7,
    duration: 1400 + Math.random() * 500,
    ease: 'Cubic.easeOut',
    onComplete: () => puff.destroy(),
  });
}

// ---------- Dust mote (light beam) ----------

export function spawnDustMote(
  scene: Phaser.Scene,
  host: Phaser.GameObjects.Container,
  opts: { x: number; y: number; driftRange?: number; tint?: number }
) {
  const r = Phaser.Math.FloatBetween(0.8, 1.8);
  const mote = scene.add.circle(opts.x, opts.y, r, opts.tint ?? 0xfff3c8, 0.85);
  host.add(mote);
  const driftRange = opts.driftRange ?? 40;
  scene.tweens.add({
    targets: mote,
    x: opts.x + (Math.random() * driftRange - driftRange / 2),
    y: opts.y - Phaser.Math.Between(30, 90),
    alpha: 0,
    duration: 3500 + Math.random() * 1500,
    ease: 'Sine.easeOut',
    onComplete: () => mote.destroy(),
  });
}

// ---------- Drifting cloud ----------

/**
 * Animates a pre-existing cloud (circle) as slow horizontal drift that wraps
 * around the scene edges. Intended to be called on each static cloud after
 * the location is built.
 */
export function driftCloud(
  scene: Phaser.Scene,
  host: Phaser.GameObjects.Container,
  cloud: Phaser.GameObjects.Arc,
  opts: { speed?: number; direction?: 'ltr' | 'rtl' } = {}
) {
  const { width } = scene.scale;
  const speed = opts.speed ?? Phaser.Math.FloatBetween(6, 14);
  const dir = opts.direction ?? (Math.random() < 0.5 ? 'ltr' : 'rtl');
  const pad = (cloud.radius ?? 30) + 20;

  let cancelled = false;
  host.once(Phaser.GameObjects.Events.DESTROY, () => {
    cancelled = true;
  });

  const drift = () => {
    if (cancelled || !cloud.active) return;
    const currentX = cloud.x;
    const targetX = dir === 'ltr' ? width + pad : -pad;
    const distance = Math.abs(targetX - currentX);
    const duration = (distance / speed) * 1000;
    scene.tweens.add({
      targets: cloud,
      x: targetX,
      duration,
      ease: 'Linear',
      onComplete: () => {
        if (cancelled || !cloud.active) return;
        // Wrap to the opposite edge and keep drifting.
        cloud.x = dir === 'ltr' ? -pad : width + pad;
        drift();
      },
    });
  };
  drift();
}

// ---------- Window twinkle (fireflies / evening lights) ----------

export function spawnTwinkle(
  scene: Phaser.Scene,
  host: Phaser.GameObjects.Container,
  opts: { x: number; y: number; range?: number; color?: number }
) {
  const range = opts.range ?? 40;
  const x = opts.x + (Math.random() * range - range / 2);
  const y = opts.y + (Math.random() * range - range / 2);
  const dot = scene.add.circle(x, y, Phaser.Math.FloatBetween(1.2, 2.2), opts.color ?? 0xffe8a8, 0);
  host.add(dot);
  scene.tweens.add({
    targets: dot,
    alpha: Phaser.Math.FloatBetween(0.6, 1),
    duration: 700,
    yoyo: true,
    ease: 'Sine.easeInOut',
    onComplete: () => dot.destroy(),
  });
}

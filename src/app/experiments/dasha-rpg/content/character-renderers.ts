import * as Phaser from 'phaser';

/**
 * Shared rendering helpers for character widgets.
 * These build a `Container` with shadow + circular frame + big emoji,
 * which is the default avatar style for secondary characters.
 */

const RADIUS = 60;

export interface EmojiCharacterOptions {
  emoji: string;
  ring: number;
  bg: number;
}

export function renderEmojiAvatar(
  scene: Phaser.Scene,
  opts: EmojiCharacterOptions
): Phaser.GameObjects.Container {
  // Bottom-center anchored: container (0,0) corresponds to bottom of the avatar,
  // so positioning at stageY lines up exactly with Dasha's pixel sprite (which
  // also has bottom-center origin) and keeps the avatar out of the dialogue box.
  const container = scene.add.container(0, 0);
  const cy = -RADIUS;
  const shadow = scene.add.ellipse(4, 8, RADIUS * 2 - 4, 14, 0x000000, 0.28);
  const bg = scene.add.circle(0, cy, RADIUS, opts.bg);
  const ring = scene.add.graphics();
  ring.lineStyle(5, opts.ring, 1);
  ring.strokeCircle(0, cy, RADIUS);
  ring.lineStyle(2, 0xffffff, 0.6);
  ring.strokeCircle(0, cy, RADIUS - 4);
  const emoji = scene.add
    .text(0, cy + 6, opts.emoji, {
      fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
      fontSize: '84px',
    })
    .setOrigin(0.5);
  container.add([shadow, bg, ring, emoji]);
  return container;
}

/**
 * Builds Dasha's pixel-art sprite + blink animation as a Container.
 * Falls back to static sprite if the blink texture is missing.
 */
export function renderDashaSprite(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const container = scene.add.container(0, 0);
  const shadow = scene.add.ellipse(2, 130, 110, 18, 0x000000, 0.25);
  const sprite = scene.add.sprite(0, 0, 'dasha_idle').setOrigin(0.5, 1);
  container.add([shadow, sprite]);

  const blinkTimer = scene.time.addEvent({
    delay: 3200,
    loop: true,
    callback: () => {
      if (!scene.textures.exists('dasha_blink')) return;
      sprite.setTexture('dasha_blink');
      scene.time.delayedCall(120, () => sprite.setTexture('dasha_idle'));
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

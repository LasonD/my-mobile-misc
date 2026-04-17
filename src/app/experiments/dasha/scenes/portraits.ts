import * as Phaser from 'phaser';

import type { Speaker } from './dialogue-data';

export interface PortraitDef {
  emoji: string;
  ring: number;
  bg: number;
}

export const PORTRAITS: Record<Speaker, PortraitDef | null> = {
  narrator: null,
  dasha: { emoji: '\u{1F469}\u200D\u{1F393}', ring: 0xcdb4db, bg: 0xf8f0ff }, // 👩‍🎓
  professor: { emoji: '\u{1F468}\u200D\u{1F3EB}', ring: 0x8ecae6, bg: 0xeaf5fb }, // 👨‍🏫
  client1: { emoji: '\u{1F629}', ring: 0xffb4a2, bg: 0xfff0ec }, // 😩
  wife: { emoji: '\u{1F937}\u200D\u2640\uFE0F', ring: 0xffc8dd, bg: 0xffeff4 }, // 🤷‍♀️
  husband: { emoji: '\u{1F9D1}\u200D\u{1F4BB}', ring: 0xa2d2ff, bg: 0xebf4ff }, // 🧑‍💻
  client3: { emoji: '\u{1FAE3}', ring: 0xbde0fe, bg: 0xeef7ff }, // 🫣
};

const RADIUS = 54;

export function buildPortraitWidget(
  scene: Phaser.Scene,
  x: number,
  y: number,
  speaker: Speaker
): Phaser.GameObjects.Container | null {
  const def = PORTRAITS[speaker];
  if (!def) return null;

  const container = scene.add.container(x, y);
  const shadow = scene.add.circle(3, 5, RADIUS, 0x000000, 0.1);
  const bg = scene.add.circle(0, 0, RADIUS, def.bg);

  const ring = scene.add.graphics();
  ring.lineStyle(4, def.ring, 1);
  ring.strokeCircle(0, 0, RADIUS);
  ring.lineStyle(2, 0xffffff, 0.6);
  ring.strokeCircle(0, 0, RADIUS - 3);

  const emoji = scene.add
    .text(0, 4, def.emoji, {
      fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
      fontSize: '72px',
    })
    .setOrigin(0.5);

  container.add([shadow, bg, ring, emoji]);
  return container;
}

import * as Phaser from 'phaser';

import { LocationDef, LocationId } from '../engine/types';

/**
 * Every location is a self-contained builder that returns a single
 * GameObject (typically a Container) representing the background scene.
 * Scene will destroy it on transition and instantiate a new one.
 */

function gradientBg(
  scene: Phaser.Scene,
  topLeft: number,
  topRight: number,
  bottomLeft: number,
  bottomRight: number
): Phaser.GameObjects.Graphics {
  const { width, height } = scene.scale;
  const g = scene.add.graphics();
  g.fillGradientStyle(topLeft, topRight, bottomLeft, bottomRight, 1);
  g.fillRect(0, 0, width, height);
  return g;
}

function addClouds(scene: Phaser.Scene, container: Phaser.GameObjects.Container) {
  const { width, height } = scene.scale;
  for (let i = 0; i < 10; i++) {
    const c = scene.add.circle(
      Phaser.Math.Between(0, width),
      Phaser.Math.Between(0, height * 0.4),
      Phaser.Math.Between(26, 54),
      0xffffff,
      0.45
    );
    container.add(c);
  }
}

function addFloor(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  color: number,
  top: number
) {
  const { width, height } = scene.scale;
  const rect = scene.add.rectangle(0, top, width, height - top, color).setOrigin(0);
  container.add(rect);
}

// ---- Location builders ----

export const LOCATIONS: Record<LocationId, LocationDef> = {
  kse_entrance: {
    id: 'kse_entrance',
    name: 'Вхід до КШЕ',
    tint: 0xf8fafc,
    build: (scene) => {
      const { width, height } = scene.scale;
      const container = scene.add.container(0, 0);
      container.add(gradientBg(scene, 0xaacce4, 0xc5dcea, 0xdfe9ed, 0xe8f0f1));
      addClouds(scene, container);

      // Ground path
      addFloor(scene, container, 0x96a899, height * 0.72);

      // KSE building silhouette
      const building = scene.add.graphics();
      const bx = width * 0.15;
      const by = height * 0.3;
      const bw = width * 0.7;
      const bh = height * 0.42;
      building.fillStyle(0xf0ede4, 1);
      building.fillRoundedRect(bx, by, bw, bh, 4);
      // Roof
      building.fillStyle(0xcfc7b4, 1);
      building.fillRect(bx - 6, by, bw + 12, 12);
      // Columns
      building.fillStyle(0xd9d3c3, 1);
      for (let i = 0; i < 6; i++) {
        const cx = bx + 20 + i * (bw / 6);
        building.fillRect(cx, by + 20, 16, bh - 40);
      }
      // Door
      building.fillStyle(0x4a3a2d, 1);
      building.fillRoundedRect(bx + bw / 2 - 28, by + bh - 70, 56, 70, 4);
      // Gold KSE sign
      building.fillStyle(0xe6b23a, 1);
      building.fillRect(bx + bw / 2 - 34, by + 18, 68, 10);
      container.add(building);

      // Sign text
      const sign = scene.add
        .text(width / 2, by + 23, 'КШЕ', {
          fontFamily: 'Georgia, serif',
          fontSize: '14px',
          color: '#2a1c1c',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      container.add(sign);

      return container;
    },
  },

  kse_lobby: {
    id: 'kse_lobby',
    name: 'Фоє КШЕ',
    tint: 0xfcf8f4,
    build: (scene) => {
      const { width, height } = scene.scale;
      const container = scene.add.container(0, 0);
      container.add(gradientBg(scene, 0xf2ece0, 0xf0e6d2, 0xe4d8bc, 0xdccda5));

      // Floor
      addFloor(scene, container, 0xb4a084, height * 0.68);

      // Back wall with diplomas/pictures
      const wallGfx = scene.add.graphics();
      for (let i = 0; i < 4; i++) {
        const fx = (width * 0.15) + i * (width * 0.2);
        const fy = height * 0.2;
        wallGfx.fillStyle(0xfffbea, 1);
        wallGfx.fillRect(fx, fy, width * 0.12, height * 0.18);
        wallGfx.lineStyle(3, 0x8a6b2a, 1);
        wallGfx.strokeRect(fx, fy, width * 0.12, height * 0.18);
      }
      container.add(wallGfx);

      // Reception desk
      const desk = scene.add.graphics();
      desk.fillStyle(0x6b4a30, 1);
      desk.fillRoundedRect(width * 0.1, height * 0.52, width * 0.3, 24, 4);
      container.add(desk);

      // Plant
      const plant = scene.add.graphics();
      const px = width * 0.8;
      const py = height * 0.55;
      plant.fillStyle(0x5a4633, 1);
      plant.fillRect(px, py, 30, 30);
      plant.fillStyle(0x2e6b3a, 1);
      plant.fillCircle(px + 15, py - 8, 18);
      plant.fillCircle(px + 4, py - 4, 12);
      plant.fillCircle(px + 26, py - 2, 12);
      container.add(plant);

      return container;
    },
  },

  lecture_hall: {
    id: 'lecture_hall',
    name: 'Аудиторія',
    tint: 0xfafafa,
    build: (scene) => {
      const { width, height } = scene.scale;
      const container = scene.add.container(0, 0);
      container.add(gradientBg(scene, 0xe8e4db, 0xe0dcd2, 0xc7c1b2, 0xb8b3a4));

      // Blackboard (greenboard)
      const boardG = scene.add.graphics();
      boardG.fillStyle(0x3a5a4a, 1);
      boardG.fillRoundedRect(width * 0.15, height * 0.12, width * 0.7, height * 0.35, 6);
      boardG.lineStyle(6, 0x6b4a30, 1);
      boardG.strokeRoundedRect(width * 0.15, height * 0.12, width * 0.7, height * 0.35, 6);
      container.add(boardG);
      const formula = scene.add
        .text(width / 2, height * 0.22, 'U(x,y) = ln(x) + ln(y)', {
          fontFamily: 'Courier New, monospace',
          fontSize: '22px',
          color: '#faf4dc',
        })
        .setOrigin(0.5);
      container.add(formula);
      const hint = scene.add
        .text(width * 0.18, height * 0.34, '"Корисність" — не каламбур', {
          fontFamily: 'Courier New, monospace',
          fontSize: '14px',
          color: '#c4d0b8',
          fontStyle: 'italic',
        })
        .setOrigin(0, 0.5);
      container.add(hint);

      // Desks
      const desks = scene.add.graphics();
      for (let r = 0; r < 3; r++) {
        const y = height * 0.6 + r * 38;
        desks.fillStyle(r === 0 ? 0x8a6b4a : r === 1 ? 0x7a5e42 : 0x6b5239, 1);
        desks.fillRect(width * 0.1, y, width * 0.8, 18);
      }
      container.add(desks);

      // Floor
      addFloor(scene, container, 0x9d8366, height * 0.73);

      return container;
    },
  },

  cafeteria: {
    id: 'cafeteria',
    name: 'Кафе КШЕ',
    tint: 0xfff8f0,
    build: (scene) => {
      const { width, height } = scene.scale;
      const container = scene.add.container(0, 0);
      container.add(gradientBg(scene, 0xffe7cc, 0xffddd0, 0xffc7b2, 0xffb996));

      // Tile stripe
      const stripe = scene.add.graphics();
      stripe.fillStyle(0x6b3a22, 1);
      stripe.fillRect(0, height * 0.38, width, 4);
      container.add(stripe);

      // Counter + coffee machine
      const counter = scene.add.graphics();
      counter.fillStyle(0x8a5a3a, 1);
      counter.fillRoundedRect(width * 0.15, height * 0.42, width * 0.7, 30, 6);
      counter.fillStyle(0x3a3a3a, 1);
      counter.fillRoundedRect(width * 0.3, height * 0.3, 70, 60, 4);
      counter.fillStyle(0xff9966, 1);
      counter.fillCircle(width * 0.3 + 35, height * 0.34, 6);
      container.add(counter);

      // Menu board
      const menu = scene.add.graphics();
      menu.fillStyle(0x2a2a2a, 1);
      menu.fillRect(width * 0.55, height * 0.18, 130, 60);
      container.add(menu);
      const menuText = scene.add
        .text(width * 0.55 + 10, height * 0.2, 'Еспресо — 25\nЛате — 45\nPhD-шот — ∞', {
          fontFamily: 'Courier New, monospace',
          fontSize: '13px',
          color: '#f0eac2',
          lineSpacing: 4,
        });
      container.add(menuText);

      // Floor
      addFloor(scene, container, 0xb28a6a, height * 0.74);

      return container;
    },
  },

  dormitory: {
    id: 'dormitory',
    name: 'Гуртожиток',
    tint: 0xfdf5ff,
    build: (scene) => {
      const { width, height } = scene.scale;
      const container = scene.add.container(0, 0);
      container.add(gradientBg(scene, 0xf0e5ff, 0xe6dcff, 0xd5c8f2, 0xbeaee0));

      // window
      const w = scene.add.graphics();
      w.fillStyle(0xffe9a8, 1);
      w.fillRoundedRect(width * 0.6, height * 0.18, width * 0.25, height * 0.25, 6);
      w.lineStyle(3, 0x8a6b3a, 1);
      w.strokeRoundedRect(width * 0.6, height * 0.18, width * 0.25, height * 0.25, 6);
      w.beginPath();
      w.moveTo(width * 0.6 + (width * 0.25) / 2, height * 0.18);
      w.lineTo(width * 0.6 + (width * 0.25) / 2, height * 0.18 + height * 0.25);
      w.strokePath();
      container.add(w);

      // bed
      const bed = scene.add.graphics();
      bed.fillStyle(0xd4b3f0, 1);
      bed.fillRoundedRect(width * 0.1, height * 0.5, width * 0.35, 30, 6);
      bed.fillStyle(0xf8d9f0, 1);
      bed.fillRoundedRect(width * 0.12, height * 0.46, 30, 20, 4);
      container.add(bed);

      // Desk with books
      const desk = scene.add.graphics();
      desk.fillStyle(0x8a6b4a, 1);
      desk.fillRoundedRect(width * 0.5, height * 0.55, width * 0.3, 22, 4);
      desk.fillStyle(0xd93c4a, 1);
      desk.fillRect(width * 0.52, height * 0.49, 20, 30);
      desk.fillStyle(0x4a7fa5, 1);
      desk.fillRect(width * 0.56, height * 0.49, 20, 30);
      container.add(desk);

      // Floor
      addFloor(scene, container, 0xa88fc8, height * 0.76);

      return container;
    },
  },
};

export function getLocation(id: LocationId): LocationDef | null {
  return LOCATIONS[id] ?? null;
}

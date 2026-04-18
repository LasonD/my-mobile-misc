import * as Phaser from 'phaser';

import {
  driftCloud,
  scheduleRecurring,
  spawnBird,
  spawnDustMote,
  spawnPasserby,
  spawnSteamPuff,
  spawnTwinkle,
} from './ambient';
import { LocationDef, LocationId } from '../engine/types';

/**
 * Every location is a self-contained builder that returns a single
 * GameObject (typically a Container) representing the background scene.
 * Scene will destroy it on transition and instantiate a new one.
 *
 * Ambient life (birds, passersby, steam, …) is layered in through child
 * containers so it can sit either behind or in front of foreground props.
 * All spawners are bound to the host container's DESTROY event via
 * `scheduleRecurring` — no manual cleanup needed at call sites.
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

/**
 * Adds clouds and returns them so callers can drift them. Each cloud is an
 * independent Arc (circle) so `driftCloud` can tween it across the screen.
 */
function addClouds(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container
): Phaser.GameObjects.Arc[] {
  const { width, height } = scene.scale;
  const clouds: Phaser.GameObjects.Arc[] = [];
  for (let i = 0; i < 10; i++) {
    const c = scene.add.circle(
      Phaser.Math.Between(0, width),
      Phaser.Math.Between(0, height * 0.4),
      Phaser.Math.Between(26, 54),
      0xffffff,
      0.45
    );
    container.add(c);
    clouds.push(c);
  }
  return clouds;
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

      // Clouds — drifting slowly across the sky.
      const clouds = addClouds(scene, container);
      clouds.forEach((c) => driftCloud(scene, container, c));

      // Bird layer sits over clouds but behind the building silhouette.
      const birdLayer = scene.add.container(0, 0);
      container.add(birdLayer);

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
      building.fillStyle(0xcfc7b4, 1);
      building.fillRect(bx - 6, by, bw + 12, 12);
      building.fillStyle(0xd9d3c3, 1);
      for (let i = 0; i < 6; i++) {
        const cx = bx + 20 + i * (bw / 6);
        building.fillRect(cx, by + 20, 16, bh - 40);
      }
      building.fillStyle(0x4a3a2d, 1);
      building.fillRoundedRect(bx + bw / 2 - 28, by + bh - 70, 56, 70, 4);
      building.fillStyle(0xe6b23a, 1);
      building.fillRect(bx + bw / 2 - 34, by + 18, 68, 10);
      container.add(building);

      const sign = scene.add
        .text(width / 2, by + 23, 'КШЕ', {
          fontFamily: 'Georgia, serif',
          fontSize: '14px',
          color: '#2a1c1c',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      container.add(sign);

      // Passerby layer — walkers along the path, in front of the building.
      const passerbyLayer = scene.add.container(0, 0);
      container.add(passerbyLayer);

      // Birds glide across every 4–9s, sometimes in small flocks.
      scheduleRecurring(scene, birdLayer, {
        minMs: 4000,
        maxMs: 9000,
        initialDelayMs: 1800,
        fn: () => {
          const burst = Math.random() < 0.25 ? 3 : 1;
          const y = Phaser.Math.Between(60, Math.floor(height * 0.22));
          const dir: 'ltr' | 'rtl' = Math.random() < 0.5 ? 'ltr' : 'rtl';
          for (let i = 0; i < burst; i++) {
            scene.time.delayedCall(i * 180, () =>
              spawnBird(scene, birdLayer, {
                y: y + i * 10,
                direction: dir,
                scale: Phaser.Math.FloatBetween(0.75, 1.1),
              })
            );
          }
        },
      });

      // Passersby walk along the ground every 5–14s.
      scheduleRecurring(scene, passerbyLayer, {
        minMs: 5000,
        maxMs: 14000,
        initialDelayMs: 2500,
        fn: () =>
          spawnPasserby(scene, passerbyLayer, {
            yFeet: height * 0.72 + Phaser.Math.Between(-2, 10),
            scale: Phaser.Math.FloatBetween(0.75, 1.05),
            speed: Phaser.Math.Between(60, 110),
            color: Phaser.Math.RND.pick([0x2a1c2a, 0x3a2e3f, 0x4a2a32]),
          }),
      });

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
      addFloor(scene, container, 0xb4a084, height * 0.68);

      // Back wall with diplomas/pictures
      const wallGfx = scene.add.graphics();
      for (let i = 0; i < 4; i++) {
        const fx = width * 0.15 + i * (width * 0.2);
        const fy = height * 0.2;
        wallGfx.fillStyle(0xfffbea, 1);
        wallGfx.fillRect(fx, fy, width * 0.12, height * 0.18);
        wallGfx.lineStyle(3, 0x8a6b2a, 1);
        wallGfx.strokeRect(fx, fy, width * 0.12, height * 0.18);
      }
      container.add(wallGfx);

      // Silhouette passerby layer — between back wall and foreground props.
      const passerbyLayer = scene.add.container(0, 0);
      container.add(passerbyLayer);

      // Reception desk (hides the lower half of passersby for a parallax feel).
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

      // Dust/light mote layer — subtle indoor sparkle.
      const moteLayer = scene.add.container(0, 0);
      container.add(moteLayer);

      // Students passing every 3–8s in the background.
      scheduleRecurring(scene, passerbyLayer, {
        minMs: 3000,
        maxMs: 8000,
        initialDelayMs: 1400,
        fn: () =>
          spawnPasserby(scene, passerbyLayer, {
            yFeet: height * 0.6 + Phaser.Math.Between(-6, 6),
            scale: Phaser.Math.FloatBetween(0.7, 0.9),
            speed: Phaser.Math.Between(70, 130),
            alpha: 0.38,
            color: 0x2a1c2a,
          }),
      });

      // Warm dust motes near the diploma wall.
      scheduleRecurring(scene, moteLayer, {
        minMs: 250,
        maxMs: 700,
        fn: () =>
          spawnDustMote(scene, moteLayer, {
            x: Phaser.Math.Between(width * 0.2, width * 0.85),
            y: height * 0.5,
            driftRange: 30,
            tint: 0xfff0c2,
          }),
      });

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

      addFloor(scene, container, 0x9d8366, height * 0.73);

      // Dust motes drifting in front of the board — "chalk dust".
      const moteLayer = scene.add.container(0, 0);
      container.add(moteLayer);
      scheduleRecurring(scene, moteLayer, {
        minMs: 300,
        maxMs: 900,
        fn: () =>
          spawnDustMote(scene, moteLayer, {
            x: Phaser.Math.Between(width * 0.18, width * 0.82),
            y: height * 0.46,
            driftRange: 26,
            tint: 0xe8e0c8,
          }),
      });

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

      const stripe = scene.add.graphics();
      stripe.fillStyle(0x6b3a22, 1);
      stripe.fillRect(0, height * 0.38, width, 4);
      container.add(stripe);

      // Passerby layer (behind the counter) for patrons milling about.
      const passerbyLayer = scene.add.container(0, 0);
      container.add(passerbyLayer);

      // Counter + coffee machine
      const counter = scene.add.graphics();
      counter.fillStyle(0x8a5a3a, 1);
      counter.fillRoundedRect(width * 0.15, height * 0.42, width * 0.7, 30, 6);
      counter.fillStyle(0x3a3a3a, 1);
      counter.fillRoundedRect(width * 0.3, height * 0.3, 70, 60, 4);
      counter.fillStyle(0xff9966, 1);
      counter.fillCircle(width * 0.3 + 35, height * 0.34, 6);
      container.add(counter);

      const menu = scene.add.graphics();
      menu.fillStyle(0x2a2a2a, 1);
      menu.fillRect(width * 0.55, height * 0.18, 130, 60);
      container.add(menu);
      const menuText = scene.add.text(
        width * 0.55 + 10,
        height * 0.2,
        'Еспресо — 25\nЛате — 45\nPhD-шот — ∞',
        {
          fontFamily: 'Courier New, monospace',
          fontSize: '13px',
          color: '#f0eac2',
          lineSpacing: 4,
        }
      );
      container.add(menuText);

      addFloor(scene, container, 0xb28a6a, height * 0.74);

      // Steam from the coffee machine spout.
      const steamLayer = scene.add.container(0, 0);
      container.add(steamLayer);
      const steamX = width * 0.3 + 35;
      const steamY = height * 0.3 - 4;
      scheduleRecurring(scene, steamLayer, {
        minMs: 380,
        maxMs: 900,
        initialDelayMs: 400,
        fn: () => spawnSteamPuff(scene, steamLayer, { x: steamX, y: steamY }),
      });

      // Patrons crossing the background every 5–12s.
      scheduleRecurring(scene, passerbyLayer, {
        minMs: 5000,
        maxMs: 12000,
        initialDelayMs: 3000,
        fn: () =>
          spawnPasserby(scene, passerbyLayer, {
            yFeet: height * 0.38 + Phaser.Math.Between(-4, 4),
            scale: Phaser.Math.FloatBetween(0.65, 0.85),
            speed: Phaser.Math.Between(70, 110),
            alpha: 0.4,
          }),
      });

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

      addFloor(scene, container, 0xa88fc8, height * 0.76);

      // Twinkling fairy-light row along the window + slow breathing window glow.
      const twinkleLayer = scene.add.container(0, 0);
      container.add(twinkleLayer);
      const windowCx = width * 0.6 + (width * 0.25) / 2;
      const windowCy = height * 0.18 + (height * 0.25) / 2;

      scheduleRecurring(scene, twinkleLayer, {
        minMs: 260,
        maxMs: 700,
        fn: () =>
          spawnTwinkle(scene, twinkleLayer, {
            x: windowCx,
            y: windowCy,
            range: width * 0.22,
            color: 0xffe8a8,
          }),
      });

      // Very subtle warm pulsing inside the window — like a lantern breathing.
      scene.tweens.add({
        targets: w,
        alpha: { from: 1, to: 0.85 },
        duration: 2400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      return container;
    },
  },

  apartment_hallway_dark: {
    id: 'apartment_hallway_dark',
    name: 'Коридор (ранок)',
    tint: 0xc8c0d4,
    build: (scene) => {
      const { width, height } = scene.scale;
      const container = scene.add.container(0, 0);
      // Deep pre-dawn blue-violet — hallway with no direct window light.
      container.add(gradientBg(scene, 0x181226, 0x201834, 0x2a1f40, 0x1e1630));

      // Bathroom door, ajar. A narrow vertical strip of slightly warmer tone
      // suggests the doorway; the door itself is a rectangle tilted a few
      // degrees open. Placed off-center so Dasha (center) can "collide" with it.
      const doorFrameX = width * 0.62;
      const doorFrameY = height * 0.18;
      const doorFrameW = width * 0.14;
      const doorFrameH = height * 0.56;

      // Frame (slightly lighter than wall).
      const frame = scene.add.graphics();
      frame.fillStyle(0x2e2238, 1);
      frame.fillRect(doorFrameX - 3, doorFrameY, doorFrameW + 6, doorFrameH);
      container.add(frame);

      // Doorway interior — faint cool light leaking out (moonlight through
      // the bathroom window, say). Thin sliver since door is only ajar.
      const interior = scene.add.graphics();
      interior.fillStyle(0x3a3050, 1);
      interior.fillRect(doorFrameX + 2, doorFrameY + 4, doorFrameW - 4, doorFrameH - 8);
      container.add(interior);

      // The door itself — rotated slightly to look ajar. Anchor at the hinge.
      const door = scene.add.rectangle(
        doorFrameX + doorFrameW - 4,
        doorFrameY + doorFrameH / 2,
        doorFrameW - 6,
        doorFrameH - 10,
        0x4a3855
      );
      door.setOrigin(1, 0.5);
      door.setAngle(-22);
      container.add(door);

      // Tiny handle highlight.
      const handle = scene.add.circle(
        doorFrameX + 8,
        doorFrameY + doorFrameH / 2,
        2,
        0xc8b8d8
      );
      container.add(handle);

      // Floor — darker than wall, slight gradient to edge.
      addFloor(scene, container, 0x120b1c, height * 0.82);

      // Very occasional slow dust mote — the apartment is still, but air drifts.
      const dustLayer = scene.add.container(0, 0);
      container.add(dustLayer);
      scheduleRecurring(scene, dustLayer, {
        minMs: 1800,
        maxMs: 4000,
        fn: () =>
          spawnDustMote(scene, dustLayer, {
            x: Phaser.Math.Between(width * 0.1, width * 0.9),
            y: Phaser.Math.Between(height * 0.2, height * 0.7),
            tint: 0x8a80a0,
          }),
      });

      return container;
    },
  },

  apartment_kitchen: {
    id: 'apartment_kitchen',
    name: 'Кухня',
    tint: 0xfff4d8,
    build: (scene) => {
      const { width, height } = scene.scale;
      const container = scene.add.container(0, 0);
      // Morning kitchen — pale lavender sky above, warm yellow interior below.
      container.add(gradientBg(scene, 0xa8b0d8, 0xb8a8c8, 0xf0d8a0, 0xe8c080));

      // Window on the left, letting in pale dawn light.
      const winX = width * 0.08;
      const winY = height * 0.15;
      const winW = width * 0.28;
      const winH = height * 0.32;

      const winFrame = scene.add.graphics();
      winFrame.fillStyle(0xc8d4e8, 1);
      winFrame.fillRect(winX, winY, winW, winH);
      winFrame.lineStyle(3, 0x7a6a4a, 1);
      winFrame.strokeRect(winX, winY, winW, winH);
      // Cross bars.
      winFrame.beginPath();
      winFrame.moveTo(winX + winW / 2, winY);
      winFrame.lineTo(winX + winW / 2, winY + winH);
      winFrame.moveTo(winX, winY + winH / 2);
      winFrame.lineTo(winX + winW, winY + winH / 2);
      winFrame.strokePath();
      container.add(winFrame);

      // Counter running across the bottom half.
      const counterY = height * 0.52;
      const counter = scene.add.graphics();
      counter.fillStyle(0x6a4a2e, 1);
      counter.fillRoundedRect(0, counterY, width, 24, 4);
      // Counter top surface, slightly lighter.
      counter.fillStyle(0x8a6a4e, 1);
      counter.fillRoundedRect(0, counterY, width, 6, 4);
      container.add(counter);

      // Sink (dark inset in counter).
      const sinkX = width * 0.55;
      const sinkW = width * 0.18;
      const sink = scene.add.graphics();
      sink.fillStyle(0x3a3028, 1);
      sink.fillRoundedRect(sinkX, counterY + 3, sinkW, 16, 3);
      container.add(sink);

      // Kettle on the counter, slightly left of center. Small round shape.
      const kettleX = width * 0.38;
      const kettleY = counterY - 18;
      const kettleBody = scene.add.circle(kettleX, kettleY, 14, 0x2a1f28);
      const kettleSpout = scene.add.triangle(
        kettleX - 14,
        kettleY - 2,
        0,
        0,
        -8,
        -4,
        0,
        6,
        0x2a1f28
      );
      const kettleHandle = scene.add.circle(kettleX + 12, kettleY - 6, 4, 0x2a1f28);
      container.add([kettleBody, kettleSpout, kettleHandle]);

      // Subtle warm light glowing from under the kettle (electric base).
      const base = scene.add.circle(kettleX, kettleY + 13, 12, 0xffcf66, 0.35);
      container.add(base);

      // Wall cabinet above the sink.
      const cab = scene.add.graphics();
      cab.fillStyle(0x8a6a4a, 1);
      cab.fillRoundedRect(sinkX - 4, height * 0.22, sinkW + 8, height * 0.22, 4);
      cab.lineStyle(2, 0x5a3e28, 1);
      cab.strokeRoundedRect(sinkX - 4, height * 0.22, sinkW + 8, height * 0.22, 4);
      // Two cabinet doors — vertical line down the middle.
      cab.beginPath();
      cab.moveTo(sinkX - 4 + (sinkW + 8) / 2, height * 0.22);
      cab.lineTo(sinkX - 4 + (sinkW + 8) / 2, height * 0.44);
      cab.strokePath();
      container.add(cab);

      // Floor.
      addFloor(scene, container, 0x9a7a5a, height * 0.78);

      // Slow steam puffs from the kettle.
      const steamLayer = scene.add.container(0, 0);
      container.add(steamLayer);
      scheduleRecurring(scene, steamLayer, {
        minMs: 900,
        maxMs: 1800,
        fn: () =>
          spawnSteamPuff(scene, steamLayer, {
            x: kettleX - 14,
            y: kettleY - 6,
          }),
      });

      // Very sparse bird silhouettes past the window at distant frequency.
      const birdLayer = scene.add.container(0, 0);
      container.add(birdLayer);
      scheduleRecurring(scene, birdLayer, {
        minMs: 4000,
        maxMs: 9000,
        fn: () =>
          spawnBird(scene, birdLayer, {
            y: Phaser.Math.Between(winY + 8, winY + winH - 16),
            alpha: 0.35,
          }),
      });

      return container;
    },
  },

  apartment_kitchen_evening: {
    id: 'apartment_kitchen_evening',
    name: 'Кухня (вечір)',
    tint: 0xffd79a,
    build: (scene) => {
      const { width, height } = scene.scale;
      const container = scene.add.container(0, 0);
      // Night sky outside, warm lamp-lit interior on the counter level.
      container.add(gradientBg(scene, 0x0f0820, 0x1a1028, 0x3a2a1a, 0x5a3a20));

      // Window with night behind it — deep navy with a few distant lights.
      const winX = width * 0.08;
      const winY = height * 0.15;
      const winW = width * 0.28;
      const winH = height * 0.32;

      const winGlass = scene.add.graphics();
      winGlass.fillStyle(0x101830, 1);
      winGlass.fillRect(winX, winY, winW, winH);
      container.add(winGlass);

      // Scatter a dozen distant city-light pixels.
      for (let i = 0; i < 12; i++) {
        const lx = Phaser.Math.Between(winX + 4, winX + winW - 4);
        const ly = Phaser.Math.Between(winY + 4, winY + winH - 4);
        const light = scene.add.circle(lx, ly, Phaser.Math.FloatBetween(0.8, 1.4), 0xffcf66, 0.85);
        container.add(light);
      }

      const winFrame = scene.add.graphics();
      winFrame.lineStyle(3, 0x5a4a3a, 1);
      winFrame.strokeRect(winX, winY, winW, winH);
      winFrame.beginPath();
      winFrame.moveTo(winX + winW / 2, winY);
      winFrame.lineTo(winX + winW / 2, winY + winH);
      winFrame.moveTo(winX, winY + winH / 2);
      winFrame.lineTo(winX + winW, winY + winH / 2);
      winFrame.strokePath();
      container.add(winFrame);

      // Counter running across the bottom half.
      const counterY = height * 0.52;
      const counter = scene.add.graphics();
      counter.fillStyle(0x4a3020, 1);
      counter.fillRoundedRect(0, counterY, width, 24, 4);
      counter.fillStyle(0x6a4a32, 1);
      counter.fillRoundedRect(0, counterY, width, 6, 4);
      container.add(counter);

      // Sink.
      const sinkX = width * 0.55;
      const sinkW = width * 0.18;
      const sink = scene.add.graphics();
      sink.fillStyle(0x1a1410, 1);
      sink.fillRoundedRect(sinkX, counterY + 3, sinkW, 16, 3);
      container.add(sink);

      // Kettle.
      const kettleX = width * 0.38;
      const kettleY = counterY - 18;
      const kettleBody = scene.add.circle(kettleX, kettleY, 14, 0x1a1018);
      const kettleSpout = scene.add.triangle(
        kettleX - 14,
        kettleY - 2,
        0,
        0,
        -8,
        -4,
        0,
        6,
        0x1a1018
      );
      const kettleHandle = scene.add.circle(kettleX + 12, kettleY - 6, 4, 0x1a1018);
      container.add([kettleBody, kettleSpout, kettleHandle]);

      // Desk lamp — silhouette on the right side of the counter.
      const lampX = width * 0.82;
      const lampY = counterY - 4;
      const lampBase = scene.add.rectangle(lampX, lampY, 10, 6, 0x2a1c1a);
      const lampStem = scene.add.rectangle(lampX, lampY - 14, 3, 22, 0x2a1c1a);
      const lampShade = scene.add.triangle(
        lampX,
        lampY - 30,
        -14,
        10,
        14,
        10,
        0,
        -6,
        0x3a2428
      );
      container.add([lampBase, lampStem, lampShade]);

      // Warm pool of light under the lamp — large soft circle.
      const lampGlow = scene.add.circle(lampX - 6, counterY + 4, 56, 0xffcf66, 0.22);
      container.add(lampGlow);
      scene.tweens.add({
        targets: lampGlow,
        alpha: { from: 0.22, to: 0.28 },
        duration: 2600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Wall cabinet — darker than morning variant.
      const cab = scene.add.graphics();
      cab.fillStyle(0x4a3020, 1);
      cab.fillRoundedRect(sinkX - 4, height * 0.22, sinkW + 8, height * 0.22, 4);
      cab.lineStyle(2, 0x2a1810, 1);
      cab.strokeRoundedRect(sinkX - 4, height * 0.22, sinkW + 8, height * 0.22, 4);
      cab.beginPath();
      cab.moveTo(sinkX - 4 + (sinkW + 8) / 2, height * 0.22);
      cab.lineTo(sinkX - 4 + (sinkW + 8) / 2, height * 0.44);
      cab.strokePath();
      container.add(cab);

      // Floor — dark.
      addFloor(scene, container, 0x3a2a22, height * 0.78);

      return container;
    },
  },
};

export function getLocation(id: LocationId): LocationDef | null {
  return LOCATIONS[id] ?? null;
}

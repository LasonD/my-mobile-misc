import * as Phaser from 'phaser';

import { buildDashaTextures } from '../../dasha/scenes/dasha-sprite';
import { SoftSounds } from '../../dasha/scenes/soft-sounds';
import { CHARACTERS } from '../content/characters';
import { CharacterId } from '../engine/types';
import { SaveManager } from './save-manager';

/**
 * "Знайомі" — character directory. Lists every character defined in the
 * registry; the ones whose ID has appeared on stage in any visited node are
 * fully revealed (avatar + name + bio). The rest are silhouettes.
 *
 * The card list scrolls vertically via touch drag / mouse wheel.
 */
export class DirectoryScene extends Phaser.Scene {
  private sfx = new SoftSounds();
  private listContainer?: Phaser.GameObjects.Container;
  private scrollMin = 0;
  private scrollMax = 0;
  private dragging = false;
  private lastPointerY = 0;
  private scrollPossible = false;

  constructor() {
    super('directory');
  }

  create() {
    buildDashaTextures(this);
    this.drawBackground();
    this.drawHeader();
    this.drawGrid();

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('pointerupoutside', this.onPointerUp, this);
    this.input.on('wheel', this.onWheel, this);

    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => {
      this.sfx.dispose();
      this.scale.off('resize', this.onResize, this);
    });
  }

  // ---------- Background ----------

  private drawBackground() {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1220, 0x221632, 0x3d2352, 0x5c3b7a, 1);
    bg.fillRect(0, 0, width, height);
  }

  // ---------- Header ----------

  private drawHeader() {
    const { width } = this.scale;

    const back = this.add
      .text(16, 18, '↩ меню', {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#baa6d4',
        fontStyle: 'italic',
        backgroundColor: '#1a1428',
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
      })
      .setDepth(50)
      .setInteractive({ useHandCursor: true });
    back.on('pointerup', () => {
      this.sfx.pop();
      this.scene.start('title');
    });

    this.add
      .text(width / 2, 28, 'Знайомі', {
        fontFamily: 'Georgia, serif',
        fontSize: '24px',
        color: '#ffd36a',
        fontStyle: 'bold',
        stroke: '#3a1a4a',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0)
      .setDepth(50);
  }

  // ---------- Grid ----------

  private drawGrid() {
    const { width, height } = this.scale;
    const state = SaveManager.load();
    const met = state?.metCharacters ?? new Set<CharacterId>();
    const ids = Object.keys(CHARACTERS) as CharacterId[];

    const headerH = 72;
    const footerH = 14;
    const margin = 14;
    const gap = 10;
    const cols = width < 560 ? 1 : 2;

    const cardW = (width - margin * 2 - gap * (cols - 1)) / cols;
    const cardH = 116;

    const rows = Math.ceil(ids.length / cols);
    const totalH = rows * cardH + Math.max(0, rows - 1) * gap;
    const visibleH = height - headerH - footerH;

    const container = this.add.container(0, headerH).setDepth(20);
    this.listContainer = container;

    ids.forEach((id, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = margin + col * (cardW + gap);
      const y = row * (cardH + gap);
      this.renderCard(container, x, y, cardW, cardH, id, met.has(id));
    });

    // Scroll bounds: container.y goes from headerH (top of list visible) down to
    // headerH - (totalH - visibleH) (so the bottom of the list aligns with the
    // bottom of the visible area). When content fits, no scroll.
    this.scrollMax = headerH;
    this.scrollMin = totalH > visibleH ? headerH - (totalH - visibleH) : headerH;
    this.scrollPossible = totalH > visibleH;

    if (this.scrollPossible) {
      // Subtle scroll affordance — small dashed line on the right
      const hint = this.add
        .text(width - 14, headerH + 6, '⇅', {
          fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
          fontSize: '16px',
          color: '#cdb4db',
        })
        .setOrigin(1, 0)
        .setAlpha(0.55)
        .setDepth(45);
      this.tweens.add({
        targets: hint,
        alpha: { from: 0.55, to: 0.15 },
        duration: 1400,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private renderCard(
    parent: Phaser.GameObjects.Container,
    x: number,
    y: number,
    w: number,
    h: number,
    id: CharacterId,
    isMet: boolean
  ) {
    const def = CHARACTERS[id];
    const tint = def?.color ?? 0xcdb4db;

    const bg = this.add.graphics();
    bg.fillStyle(isMet ? 0x2a1c3a : 0x141022, 0.92);
    bg.fillRoundedRect(x, y, w, h, 12);
    bg.lineStyle(2, isMet ? tint : 0x4a4060, isMet ? 1 : 0.55);
    bg.strokeRoundedRect(x, y, w, h, 12);
    parent.add(bg);

    const avatarAreaW = 92;

    if (isMet && def) {
      const avatarScale = id === 'dasha' ? 0.62 : 0.7;
      const avatar = def.render(this, undefined) as Phaser.GameObjects.Container;
      avatar.setScale(avatarScale);
      // Bottom-center origin: place at bottom of card's avatar zone, with a
      // small lift so the shadow doesn't touch the border.
      avatar.setPosition(x + avatarAreaW / 2, y + h - 8);
      parent.add(avatar);

      const textX = x + avatarAreaW + 6;
      const textW = w - avatarAreaW - 18;

      const nameTxt = this.add.text(textX, y + 12, def.name, {
        fontFamily: 'Georgia, serif',
        fontSize: '16px',
        color: '#fdf6f3',
        fontStyle: 'bold',
      });
      parent.add(nameTxt);

      const bioTxt = this.add.text(textX, y + 36, def.bio ?? '', {
        fontFamily: 'Georgia, serif',
        fontSize: '11.5px',
        color: '#cdb4db',
        fontStyle: 'italic',
        wordWrap: { width: textW },
        lineSpacing: 2,
      });
      parent.add(bioTxt);
    } else {
      // Locked silhouette
      const cx = x + avatarAreaW / 2;
      const cy = y + h / 2;
      const ring = this.add.graphics();
      ring.lineStyle(2, 0x4a4060, 0.7);
      ring.strokeCircle(cx, cy, 36);
      parent.add(ring);

      parent.add(
        this.add
          .text(cx, cy, '?', {
            fontFamily: 'Georgia, serif',
            fontSize: '40px',
            color: '#4a4060',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
      );

      const textX = x + avatarAreaW + 6;
      parent.add(
        this.add.text(textX, y + 24, '???', {
          fontFamily: 'Georgia, serif',
          fontSize: '15px',
          color: '#6b5e7d',
          fontStyle: 'bold',
        })
      );
      parent.add(
        this.add.text(textX, y + 50, 'Ще не зустрічались', {
          fontFamily: 'Georgia, serif',
          fontSize: '11.5px',
          color: '#5e5373',
          fontStyle: 'italic',
          wordWrap: { width: w - avatarAreaW - 18 },
        })
      );
    }
  }

  // ---------- Scroll ----------

  private onPointerDown = (p: Phaser.Input.Pointer) => {
    this.sfx.resume();
    if (!this.scrollPossible) return;
    this.dragging = true;
    this.lastPointerY = p.y;
  };

  private onPointerMove = (p: Phaser.Input.Pointer) => {
    if (!this.dragging || !this.listContainer) return;
    const dy = p.y - this.lastPointerY;
    this.lastPointerY = p.y;
    this.listContainer.y = Phaser.Math.Clamp(
      this.listContainer.y + dy,
      this.scrollMin,
      this.scrollMax
    );
  };

  private onPointerUp = () => {
    this.dragging = false;
  };

  private onWheel = (
    _pointer: Phaser.Input.Pointer,
    _over: Phaser.GameObjects.GameObject[],
    _dx: number,
    dy: number
  ) => {
    if (!this.scrollPossible || !this.listContainer) return;
    this.listContainer.y = Phaser.Math.Clamp(
      this.listContainer.y - dy,
      this.scrollMin,
      this.scrollMax
    );
  };

  // ---------- Resize ----------

  private onResize = () => {
    this.scene.restart();
  };
}

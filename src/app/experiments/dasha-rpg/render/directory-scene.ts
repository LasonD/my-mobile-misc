import * as Phaser from 'phaser';

import { buildDashaTextures } from '../../dasha/scenes/dasha-sprite';
import { SoftSounds } from '../../dasha/scenes/soft-sounds';
import { CHARACTERS } from '../content/characters';
import { CharacterId } from '../engine/types';
import { SaveManager } from './save-manager';

/**
 * "Знайомі" — character directory. Lists every character defined in the
 * registry; the ones whose ID has appeared on stage in any visited node are
 * fully revealed (avatar + name + one-line hook). The rest are silhouettes.
 *
 * Tapping a met card opens a modal with the full bio and a bigger portrait.
 * The list scrolls vertically via touch drag / mouse wheel.
 */
export class DirectoryScene extends Phaser.Scene {
  private sfx = new SoftSounds();
  private listContainer?: Phaser.GameObjects.Container;
  private scrollMin = 0;
  private scrollMax = 0;
  private dragging = false;
  private dragged = false;
  private lastPointerY = 0;
  private scrollPossible = false;

  private modalOpen = false;
  private modalLayer?: Phaser.GameObjects.Container;

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
      if (this.modalOpen) return;
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
    const cardH = 108;

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

    this.scrollMax = headerH;
    this.scrollMin = totalH > visibleH ? headerH - (totalH - visibleH) : headerH;
    this.scrollPossible = totalH > visibleH;

    if (this.scrollPossible) {
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
    const drawBg = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(isMet ? (hover ? 0x3a2a4a : 0x2a1c3a) : 0x141022, 0.92);
      bg.fillRoundedRect(x, y, w, h, 12);
      bg.lineStyle(2, isMet ? tint : 0x4a4060, isMet ? (hover ? 1 : 0.9) : 0.55);
      bg.strokeRoundedRect(x, y, w, h, 12);
    };
    drawBg(false);
    parent.add(bg);

    const avatarAreaW = 88;

    if (isMet && def) {
      const avatarScale = id === 'dasha' ? 0.58 : 0.66;
      const avatar = def.render(this, undefined) as Phaser.GameObjects.Container;
      avatar.setScale(avatarScale);
      avatar.setPosition(x + avatarAreaW / 2, y + h - 8);
      parent.add(avatar);

      const textX = x + avatarAreaW + 4;
      const textW = w - avatarAreaW - 16;

      const nameTxt = this.add.text(textX, y + 12, def.name, {
        fontFamily: 'Georgia, serif',
        fontSize: '16px',
        color: '#fdf6f3',
        fontStyle: 'bold',
        wordWrap: { width: textW },
      });
      parent.add(nameTxt);

      const hookTxt = this.add.text(textX, nameTxt.y + nameTxt.height + 4, def.hook ?? '', {
        fontFamily: 'Georgia, serif',
        fontSize: '12px',
        color: '#cdb4db',
        fontStyle: 'italic',
        wordWrap: { width: textW },
        lineSpacing: 2,
      });
      parent.add(hookTxt);

      // Tap zone for the entire card — opens the modal. Scroll-drag is
      // distinguished from a tap via the `dragged` flag set in onPointerMove.
      const zone = this.add
        .zone(x, y, w, h)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => drawBg(true));
      zone.on('pointerout', () => drawBg(false));
      zone.on('pointerup', () => {
        if (this.dragged || this.modalOpen) return;
        this.openCharacterModal(id);
      });
      parent.add(zone);
    } else {
      const cx = x + avatarAreaW / 2;
      const cy = y + h / 2;
      const ring = this.add.graphics();
      ring.lineStyle(2, 0x4a4060, 0.7);
      ring.strokeCircle(cx, cy, 34);
      parent.add(ring);

      parent.add(
        this.add
          .text(cx, cy, '?', {
            fontFamily: 'Georgia, serif',
            fontSize: '38px',
            color: '#4a4060',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
      );

      const textX = x + avatarAreaW + 4;
      parent.add(
        this.add.text(textX, y + 22, '???', {
          fontFamily: 'Georgia, serif',
          fontSize: '15px',
          color: '#6b5e7d',
          fontStyle: 'bold',
        })
      );
      parent.add(
        this.add.text(textX, y + 48, 'Ще не зустрічались', {
          fontFamily: 'Georgia, serif',
          fontSize: '11.5px',
          color: '#5e5373',
          fontStyle: 'italic',
          wordWrap: { width: w - avatarAreaW - 16 },
        })
      );
    }
  }

  // ---------- Modal ----------

  private openCharacterModal(id: CharacterId) {
    if (this.modalOpen) return;
    const def = CHARACTERS[id];
    if (!def) return;

    this.modalOpen = true;
    // Cancel any in-progress scroll drag so it doesn't affect modal close.
    this.dragging = false;
    this.dragged = false;

    this.sfx.pop();

    const { width, height } = this.scale;
    const layer = this.add.container(0, 0).setDepth(200);
    this.modalLayer = layer;

    // Full-screen darkening overlay
    const overlay = this.add
      .rectangle(0, 0, width, height, 0x0a0614, 0)
      .setOrigin(0)
      .setInteractive();
    layer.add(overlay);
    this.tweens.add({ targets: overlay, alpha: 0.86, duration: 240 });

    // Panel geometry
    const panelW = Math.min(440, width - 28);
    const padX = 22;
    const padY = 22;
    const contentW = panelW - padX * 2;

    // Measure texts first
    const nameTxt = this.add
      .text(0, 0, def.name, {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        color: '#ffd36a',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#3a1a4a',
        strokeThickness: 2,
        wordWrap: { width: contentW },
      })
      .setOrigin(0.5, 0);

    const hookTxt = this.add
      .text(0, 0, def.hook ?? '', {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#cdb4db',
        fontStyle: 'italic',
        align: 'center',
        wordWrap: { width: contentW },
        lineSpacing: 3,
      })
      .setOrigin(0.5, 0);

    const bioTxt = this.add
      .text(0, 0, def.bio ?? '', {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#fdf6f3',
        wordWrap: { width: contentW },
        lineSpacing: 4,
      })
      .setOrigin(0, 0);

    // Avatar — render at close-to-native scale, bottom-center origin.
    const avatarScale = id === 'dasha' ? 1.0 : 1.1;
    const avatar = def.render(this, undefined) as Phaser.GameObjects.Container;
    avatar.setScale(avatarScale);
    const avatarVisualH = 140;

    const gapAfterAvatar = 10;
    const gapAfterName = 6;
    const gapAfterHook = 14;

    const panelH =
      padY +
      avatarVisualH +
      gapAfterAvatar +
      nameTxt.height +
      gapAfterName +
      hookTxt.height +
      gapAfterHook +
      bioTxt.height +
      padY;
    const panelX = (width - panelW) / 2;
    const panelY = Math.max(24, (height - panelH) / 2);

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1a1428, 1);
    panelBg.fillRoundedRect(panelX, panelY, panelW, panelH, 18);
    panelBg.lineStyle(3, def.color ?? 0xcdb4db, 1);
    panelBg.strokeRoundedRect(panelX, panelY, panelW, panelH, 18);
    layer.add(panelBg);

    // Decorative divider line between hook and bio
    const dividerY = panelY + padY + avatarVisualH + gapAfterAvatar + nameTxt.height +
      gapAfterName + hookTxt.height + gapAfterHook / 2;
    const divider = this.add.graphics();
    divider.lineStyle(1, def.color ?? 0xcdb4db, 0.4);
    divider.lineBetween(panelX + padX + 20, dividerY, panelX + panelW - padX - 20, dividerY);
    layer.add(divider);

    // Avatar bottom at panelY + padY + avatarVisualH
    avatar.setPosition(width / 2, panelY + padY + avatarVisualH - 4);
    layer.add(avatar);

    nameTxt.setPosition(width / 2, panelY + padY + avatarVisualH + gapAfterAvatar);
    hookTxt.setPosition(width / 2, nameTxt.y + nameTxt.height + gapAfterName);
    bioTxt.setPosition(panelX + padX, hookTxt.y + hookTxt.height + gapAfterHook);
    layer.add(nameTxt);
    layer.add(hookTxt);
    layer.add(bioTxt);

    // Close button
    const close = this.add
      .text(panelX + panelW - 12, panelY + 8, '×', {
        fontFamily: 'Georgia, serif',
        fontSize: '28px',
        color: '#fdf6f3',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    close.on('pointerup', () => this.closeCharacterModal());
    layer.add(close);

    // Tap on overlay (outside the panel) closes the modal.
    overlay.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (
        p.x >= panelX &&
        p.x <= panelX + panelW &&
        p.y >= panelY &&
        p.y <= panelY + panelH
      ) {
        return; // inside panel — ignore
      }
      this.closeCharacterModal();
    });

    layer.setAlpha(0);
    this.tweens.add({ targets: layer, alpha: 1, duration: 200 });
  }

  private closeCharacterModal() {
    if (!this.modalOpen) return;
    this.modalOpen = false;
    const layer = this.modalLayer;
    this.modalLayer = undefined;
    if (!layer) return;
    this.tweens.add({
      targets: layer,
      alpha: 0,
      duration: 160,
      onComplete: () => layer.destroy(),
    });
  }

  // ---------- Scroll ----------

  private onPointerDown = (p: Phaser.Input.Pointer) => {
    this.sfx.resume();
    if (this.modalOpen) return;
    this.dragged = false;
    if (this.scrollPossible) {
      this.dragging = true;
      this.lastPointerY = p.y;
    }
  };

  private onPointerMove = (p: Phaser.Input.Pointer) => {
    if (!this.dragging || !this.listContainer || this.modalOpen) return;
    const dy = p.y - this.lastPointerY;
    this.lastPointerY = p.y;
    if (Math.abs(dy) > 0.5) this.dragged = true;
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
    if (!this.scrollPossible || !this.listContainer || this.modalOpen) return;
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

import * as Phaser from 'phaser';

import { AmbientPlayer, playTitleTheme, preloadAudio } from './audio-manager';
import { UPCOMING, listScenarios } from '../content/scenarios/index';

import { CHARACTERS } from '../content/characters';
import { GameState } from '../engine/types';
import { SaveManager } from './save-manager';
import { SoftSounds } from '../../dasha/scenes/soft-sounds';
import { TITLE_FACTS } from '../content/facts';
import { buildDashaTextures } from '../../dasha/scenes/dasha-sprite';
import { evaluate } from '../engine/evaluators';

const FACT_INTERVAL_MS = 11000;
const TITLE_INTERVAL_MS = 30000;

const TITLE_VARIANTS: string[] = [
  'Даша: як це було',
  'Даша: як воно все',
  'Дашині дні',
  'Привіт, я Даша',
  'Ось Даша',
  'Даша, коли ніхто не дивиться',
  'Щось про Дашу',
  'Даша: джерело № 88',
  'Дашині хроніки',
  'З Дашиного щоденника',
];

const SUBTITLE_VARIANTS: string[] = [
  'Київ. Люди. Сексологія. І не тільки :)',
  'Лекції. Село. Курсова. Друзі.',
  'Квартира. Кіт. Кава. 87 джерел.',
  'Третій курс. Практика. Курсова. Вижити.',
  'Ранок. Дзвінок з США. Обійми. Повторити.',
  'Даша. Як вона є. Без зайвого.',
  'Психологія. Сексологія. І ще трошки.',
  'Не серіал. Не кіно. Просто суботи.',
];

export class TitleScene extends Phaser.Scene {
  private sfx = new SoftSounds();
  private factText?: Phaser.GameObjects.Text;
  private factTimer?: Phaser.Time.TimerEvent;
  private factOrder: number[] = [];
  private factCursor = 0;
  private titleText?: Phaser.GameObjects.Text;
  private titleTimer?: Phaser.Time.TimerEvent;
  private titleOrder: number[] = [];
  private titleCursor = 0;
  private subtitleText?: Phaser.GameObjects.Text;
  private subtitleTimer?: Phaser.Time.TimerEvent;
  private subtitleOrder: number[] = [];
  private subtitleCursor = 0;
  private themePlayer?: AmbientPlayer;

  constructor() {
    super('title');
  }

  preload() {
    preloadAudio(this);
  }

  create() {
    buildDashaTextures(this);
    this.factOrder = this.shuffledIndices(TITLE_FACTS.length);
    this.titleOrder = this.shuffledIndices(TITLE_VARIANTS.length);
    this.subtitleOrder = this.shuffledIndices(SUBTITLE_VARIANTS.length);

    this.drawBackground();
    this.drawSparkles();

    const state = SaveManager.load();

    const isNarrow = this.scale.width < 560;

    this.drawTitle(isNarrow);
    this.drawDasha(isNarrow);
    this.drawLevelSelect(state, isNarrow);
    this.drawResetButton(state);
    this.drawDirectoryButton(state);
    this.drawFactTicker();

    // Browsers block autoplay until the user interacts — kick off the
    // title-theme fade-in on the first tap alongside the SFX unlock.
    this.input.once('pointerdown', () => {
      this.sfx.resume();
      this.themePlayer = playTitleTheme(this);
    });
    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => {
      this.sfx.dispose();
      this.themePlayer?.dispose();
      this.factTimer?.remove();
      this.titleTimer?.remove();
      this.subtitleTimer?.remove();
      this.scale.off('resize', this.onResize, this);
    });
  }

  // ---------- Background ----------

  private drawBackground() {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1220, 0x221632, 0x3d2352, 0x5c3b7a, 1);
    bg.fillRect(0, 0, width, height);

    const arc = this.add.graphics();
    arc.lineStyle(2, 0xcdb4db, 0.2);
    for (let r = 120; r < Math.max(width, height); r += 80) {
      arc.strokeCircle(width, height, r);
    }
  }

  private drawSparkles() {
    const { width, height } = this.scale;
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height * 0.7);
      const r = Phaser.Math.FloatBetween(0.6, 1.8);
      const dot = this.add.circle(x, y, r, 0xffffff, Phaser.Math.FloatBetween(0.3, 0.8));
      this.tweens.add({
        targets: dot,
        alpha: { from: dot.alpha, to: 0.05 },
        duration: Phaser.Math.Between(1500, 3500),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }
  }

  // ---------- Title ----------

  private drawTitle(narrow: boolean) {
    const { width, height } = this.scale;
    const cx = width / 2;
    // Leave a little air above the title so the "Знайомі" pill in the corner
    // doesn't crowd it, but not so much that the title floats in the middle.
    const y = Math.max(58, height * (narrow ? 0.11 : 0.12));

    // Pick the first title from the shuffled order; subsequent rotations
    // happen via `rotateTitle` on a 30-second interval.
    const firstTitle = TITLE_VARIANTS[this.titleOrder[this.titleCursor % this.titleOrder.length]];
    this.titleCursor++;

    this.titleText = this.add
      .text(cx, y, firstTitle, {
        fontFamily: 'Georgia, serif',
        fontSize: narrow ? '34px' : '45px',
        color: '#ffd36a',
        fontStyle: 'italic bold',
        stroke: '#3a1a4a',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    const firstSubtitle = SUBTITLE_VARIANTS[this.subtitleOrder[this.subtitleCursor % this.subtitleOrder.length]];
    this.subtitleCursor++;

    this.subtitleText = this.add
      .text(cx, y + this.titleText.height * 0.7, firstSubtitle, {
        fontFamily: 'Georgia, serif',
        fontSize: narrow ? '16px' : '20px',
        color: '#cdb4db',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);
    const sub = this.subtitleText;

    this.titleTimer = this.time.addEvent({
      delay: TITLE_INTERVAL_MS,
      loop: true,
      callback: () => this.rotateTitle(),
    });
    this.subtitleTimer = this.time.addEvent({
      delay: TITLE_INTERVAL_MS,
      loop: true,
      callback: () => this.rotateSubtitle(),
    });

    const flourish = this.add.graphics();
    flourish.lineStyle(2, 0xffd36a, 0.8);
    flourish.beginPath();
    flourish.moveTo(cx - 70, sub.y + 18);
    flourish.lineTo(cx + 70, sub.y + 18);
    flourish.strokePath();
  }

  // ---------- Dasha ----------

  private drawDasha(narrow: boolean) {
    const { width, height } = this.scale;
    const cx = width / 2;
    const y = height * (narrow ? 0.4 : 0.38);
    const scale = narrow ? 0.95 : 1.1;

    const container = this.add.container(cx, y);
    const shadow = this.add.ellipse(0, 10, 110 * scale, 16, 0x000000, 0.35);
    const sprite = this.add.sprite(0, 0, 'dasha_idle').setOrigin(0.5, 1).setScale(scale);
    container.add([shadow, sprite]);

    const blinker = this.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => {
        if (!this.textures.exists('dasha_blink')) return;
        sprite.setTexture('dasha_blink');
        this.time.delayedCall(130, () => sprite.setTexture('dasha_idle'));
      },
    });
    container.once(Phaser.GameObjects.Events.DESTROY, () => blinker.remove());

    this.tweens.add({
      targets: sprite,
      y: '+=3',
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ---------- Level select ----------

  private drawLevelSelect(state: GameState | null, narrow: boolean) {
    const { width, height } = this.scale;
    const listTop = height * (narrow ? 0.48 : 0.5);
    const listBottom = height * 0.88;
    const listHeight = listBottom - listTop;

    const entries: LevelEntry[] = [];

    // Resume entry (if mid-scenario)
    const midway =
      state && state.currentScenario && state.currentNode && !this.isScenarioDone(state, state.currentScenario);
    if (midway) {
      const reg = listScenarios().find((r) => r.scenario.id === state!.currentScenario);
      entries.push({
        kind: 'resume',
        title: '⏵ Продовжити',
        description: reg ? `${reg.scenario.title} — ${state!.currentNode}` : 'Недавня сесія',
        icon: '\u{1F4CD}',
        status: 'available',
        onClick: () => this.startScenario(state!.currentScenario!, { load: true }),
      });
    }

    // Registered scenarios
    for (const reg of listScenarios()) {
      const done = this.isScenarioDone(state, reg.scenario.id);
      // If the scenario has an unlock gate, evaluate it. No save state means
      // no progress — the gate fails and the scenario stays locked.
      const locked = reg.meta.unlock
        ? !state || !evaluate(reg.meta.unlock, state)
        : false;
      entries.push({
        kind: 'scenario',
        title: reg.scenario.title,
        description: reg.meta.description,
        icon: reg.meta.icon ?? '\u{1F4D6}',
        status: done ? 'completed' : locked ? 'locked' : 'available',
        onClick: locked
          ? () => { /* no-op */ }
          : () => this.startScenario(reg.scenario.id, { load: false }),
      });
    }

    // Upcoming placeholders — show only the first two to save vertical space.
    for (const meta of UPCOMING.slice(0, 2)) {
      entries.push({
        kind: 'upcoming',
        title: 'Незабаром',
        description: meta.description,
        icon: meta.icon ?? '\u{1F552}',
        status: 'locked',
        onClick: () => { /* no-op */ },
      });
    }

    const gap = 10;
    const maxCount = Math.max(entries.length, 1);
    const cardH = Phaser.Math.Clamp(
      Math.floor((listHeight - gap * (maxCount - 1)) / maxCount),
      60,
      86
    );
    const cardW = Math.min(width - 32, 440);
    const startX = (width - cardW) / 2;

    entries.forEach((entry, i) => {
      const y = listTop + i * (cardH + gap);
      this.renderLevelCard(startX, y, cardW, cardH, entry);
    });
  }

  private renderLevelCard(x: number, y: number, w: number, h: number, entry: LevelEntry) {
    const dim = entry.status === 'locked';
    const color = entry.status === 'completed' ? 0x8ed29a : entry.status === 'available' ? 0xcdb4db : 0x6b5e7d;
    const bgColor = dim ? 0x1a1428 : 0x2a1c3a;

    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 0.92);
    bg.fillRoundedRect(x, y, w, h, 12);
    bg.lineStyle(2, color, dim ? 0.5 : 1);
    bg.strokeRoundedRect(x, y, w, h, 12);

    // Icon at fixed vertical midpoint
    const iconBg = this.add.circle(x + 30, y + h / 2, 18, 0x1a1428, 0.7);
    iconBg.setStrokeStyle(1, color, dim ? 0.5 : 1);
    this.add
      .text(x + 30, y + h / 2, entry.icon, {
        fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
        fontSize: '20px',
      })
      .setOrigin(0.5);

    // Title at top of card
    this.add.text(x + 58, y + 10, entry.title, {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: dim ? '#8a7a9e' : '#fdf6f3',
      fontStyle: 'bold',
    });

    // Description flows below title; small font so 2 lines fit in 86px card
    this.add.text(x + 58, y + 32, entry.description, {
      fontFamily: 'Georgia, serif',
      fontSize: '11px',
      color: dim ? '#5e5373' : '#baa6d4',
      fontStyle: 'italic',
      wordWrap: { width: w - 80 },
      lineSpacing: 2,
    });

    // Status badge on the right
    const badge = entry.status === 'completed' ? '\u2713' : entry.status === 'locked' ? '\u{1F512}' : '\u25B6';
    this.add
      .text(x + w - 14, y + h / 2, badge, {
        fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
        fontSize: '16px',
        color: dim ? '#5e5373' : '#fdf6f3',
      })
      .setOrigin(1, 0.5);

    if (entry.status !== 'locked') {
      const zone = this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(0x3a2a4a, 0.95);
        bg.fillRoundedRect(x, y, w, h, 12);
        bg.lineStyle(2, color, 1);
        bg.strokeRoundedRect(x, y, w, h, 12);
      });
      zone.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(bgColor, 0.92);
        bg.fillRoundedRect(x, y, w, h, 12);
        bg.lineStyle(2, color, 1);
        bg.strokeRoundedRect(x, y, w, h, 12);
      });
      zone.on('pointerup', () => {
        this.sfx.good();
        entry.onClick();
      });
    }
  }

  private startScenario(id: string, opts: { load: boolean }) {
    this.factTimer?.remove();
    this.scene.start('rpg', { scenarioId: id, load: opts.load });
  }

  // ---------- Directory button ----------

  private drawDirectoryButton(state: GameState | null) {
    const { width } = this.scale;
    const totalChars = Object.keys(CHARACTERS).length;
    const metCount = state?.metCharacters?.size ?? 0;
    const label = `👥 Знайомі · ${metCount}/${totalChars}`;

    const padX = 12;
    const padY = 6;
    const txt = this.add
      .text(0, 0, label, {
        fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, Georgia, serif',
        fontSize: '13px',
        color: '#fdf6f3',
        fontStyle: 'italic',
      })
      .setOrigin(0, 0)
      .setDepth(50);

    const bw = txt.width + padX * 2;
    const bh = txt.height + padY * 2;
    const x = width - bw - 14;
    const y = 14;

    const bg = this.add.graphics().setDepth(49);
    bg.fillStyle(0x1a1428, 0.85);
    bg.fillRoundedRect(x, y, bw, bh, 8);
    bg.lineStyle(1.5, 0xcdb4db, 0.85);
    bg.strokeRoundedRect(x, y, bw, bh, 8);

    txt.setPosition(x + padX, y + padY);

    const zone = this.add
      .zone(x, y, bw, bh)
      .setOrigin(0)
      .setDepth(51)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x3a2a4a, 0.95);
      bg.fillRoundedRect(x, y, bw, bh, 8);
      bg.lineStyle(1.5, 0xcdb4db, 1);
      bg.strokeRoundedRect(x, y, bw, bh, 8);
    });
    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1a1428, 0.85);
      bg.fillRoundedRect(x, y, bw, bh, 8);
      bg.lineStyle(1.5, 0xcdb4db, 0.85);
      bg.strokeRoundedRect(x, y, bw, bh, 8);
    });
    zone.on('pointerup', () => {
      this.sfx.pop();
      this.factTimer?.remove();
      this.scene.start('directory');
    });
  }

  private isScenarioDone(state: GameState | null, id: string): boolean {
    if (!state) return false;
    const reg = listScenarios().find((r) => r.scenario.id === id);
    if (!reg?.meta.done) return false;
    return evaluate(reg.meta.done, state);
  }

  // ---------- Reset button ----------

  private drawResetButton(state: GameState | null) {
    // Only show reset if there's something to reset — no point offering it on
    // a fresh install.
    if (!state) return;

    const padX = 10;
    const padY = 6;
    const label = '🗑 Скинути';
    const txt = this.add
      .text(0, 0, label, {
        fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, Georgia, serif',
        fontSize: '13px',
        color: '#e8a8b0',
        fontStyle: 'italic',
      })
      .setOrigin(0, 0)
      .setDepth(50);

    const bw = txt.width + padX * 2;
    const bh = txt.height + padY * 2;
    // Pin to the top-left mirror of the "Знайомі" pill in the top-right.
    const x = 14;
    const y = 14;

    const bg = this.add.graphics().setDepth(49);
    const drawBg = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(hover ? 0x4a1a28 : 0x2a1420, hover ? 0.95 : 0.85);
      bg.fillRoundedRect(x, y, bw, bh, 8);
      bg.lineStyle(1.5, 0xd96a7a, hover ? 1 : 0.7);
      bg.strokeRoundedRect(x, y, bw, bh, 8);
    };
    drawBg(false);

    txt.setPosition(x + padX, y + padY);

    const zone = this.add
      .zone(x, y, bw, bh)
      .setOrigin(0)
      .setDepth(51)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => drawBg(true));
    zone.on('pointerout', () => drawBg(false));
    zone.on('pointerup', () => {
      this.sfx.pop();
      this.showResetConfirmation();
    });
  }

  private showResetConfirmation() {
    const { width, height } = this.scale;
    const modalW = Math.min(340, width - 32);
    const modalH = 170;
    const modalX = (width - modalW) / 2;
    const modalY = (height - modalH) / 2;

    // Single container owns everything — one destroy() kills the whole modal.
    const modal = this.add.container(0, 0).setDepth(100);

    const close = () => {
      this.input.keyboard?.off('keydown-ESC', close);
      modal.destroy();
    };

    // Dim backdrop — also acts as "click outside to cancel".
    const overlay = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.6)
      .setOrigin(0)
      .setInteractive();
    overlay.on('pointerup', close);
    modal.add(overlay);

    // Modal card
    const card = this.add.graphics();
    card.fillStyle(0x2a1c3a, 0.98);
    card.fillRoundedRect(modalX, modalY, modalW, modalH, 14);
    card.lineStyle(2, 0xcdb4db, 1);
    card.strokeRoundedRect(modalX, modalY, modalW, modalH, 14);
    // Swallow clicks on the card so they don't bubble up to the overlay.
    const cardZone = this.add
      .zone(modalX, modalY, modalW, modalH)
      .setOrigin(0)
      .setInteractive();
    cardZone.on('pointerup', (_p: unknown, _x: unknown, _y: unknown, evt: Phaser.Types.Input.EventData) => {
      evt.stopPropagation?.();
    });
    modal.add([card, cardZone]);

    const title = this.add
      .text(width / 2, modalY + 24, 'Скинути прогрес?', {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#fdf6f3',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const message = this.add
      .text(width / 2, modalY + 58, 'Усі збережені сцени, вибори та квести\nбудуть стерті. Дію не можна відмінити.', {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#baa6d4',
        align: 'center',
        lineSpacing: 3,
      })
      .setOrigin(0.5);

    modal.add([title, message]);

    const btnW = 120;
    const btnH = 38;
    const btnGap = 12;
    const btnY = modalY + modalH - btnH - 16;
    const cancelX = (width - btnW * 2 - btnGap) / 2;
    const confirmX = cancelX + btnW + btnGap;

    modal.add(
      this.buildModalButton(cancelX, btnY, btnW, btnH, 'Скасувати', {
        fill: 0x3a2a4a,
        fillHover: 0x4a3a5a,
        border: 0xcdb4db,
      }, close)
    );

    modal.add(
      this.buildModalButton(confirmX, btnY, btnW, btnH, 'Так, скинути', {
        fill: 0x4a1a28,
        fillHover: 0x6a2038,
        border: 0xd96a7a,
      }, () => {
        close();
        this.sfx.pop();
        this.factTimer?.remove();
        SaveManager.clear();
        this.scene.restart();
      })
    );

    this.input.keyboard?.on('keydown-ESC', close);
  }

  /** Build a self-contained button and return it as a container for modal ownership. */
  private buildModalButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    colors: { fill: number; fillHover: number; border: number },
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);

    const bg = this.add.graphics();
    const draw = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(hover ? colors.fillHover : colors.fill, hover ? 1 : 0.9);
      bg.fillRoundedRect(x, y, w, h, 8);
      bg.lineStyle(1.5, colors.border, hover ? 1 : 0.85);
      bg.strokeRoundedRect(x, y, w, h, 8);
    };
    draw(false);

    const text = this.add
      .text(x + w / 2, y + h / 2, label, {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#fdf6f3',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const zone = this.add
      .zone(x, y, w, h)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => draw(true));
    zone.on('pointerout', () => draw(false));
    zone.on('pointerup', (_p: unknown, _x: unknown, _y: unknown, evt: Phaser.Types.Input.EventData) => {
      evt.stopPropagation?.();
      onClick();
    });

    container.add([bg, text, zone]);
    return container;
  }

  // ---------- Fact ticker ----------

  private drawFactTicker() {
    const { width, height } = this.scale;
    // Place just above the bottom, but with margin for safe area (already inset by CSS).
    const y = height - 18;
    this.factText = this.add
      .text(width / 2, y, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '12.5px',
        color: '#cdb4db',
        fontStyle: 'italic',
        align: 'center',
        wordWrap: { width: width - 32 },
      })
      .setOrigin(0.5, 1)
      .setDepth(50);

    this.showFact();
    this.factTimer = this.time.addEvent({
      delay: FACT_INTERVAL_MS,
      loop: true,
      callback: () => this.showFact(),
    });
  }

  private showFact() {
    if (!this.factText) return;
    const idx = this.factOrder[this.factCursor % this.factOrder.length];
    this.factCursor++;
    const next = TITLE_FACTS[idx];

    this.tweens.add({
      targets: this.factText,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        this.factText!.setText(next);
        this.tweens.add({ targets: this.factText, alpha: 1, duration: 500 });
      },
    });
  }

  private rotateTitle() {
    if (!this.titleText) return;
    const idx = this.titleOrder[this.titleCursor % this.titleOrder.length];
    this.titleCursor++;
    const next = TITLE_VARIANTS[idx];

    this.tweens.add({
      targets: this.titleText,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.titleText!.setText(next);
        this.tweens.add({ targets: this.titleText, alpha: 1, duration: 500 });
      },
    });
  }

  private rotateSubtitle() {
    if (!this.subtitleText) return;
    const idx = this.subtitleOrder[this.subtitleCursor % this.subtitleOrder.length];
    this.subtitleCursor++;
    const next = SUBTITLE_VARIANTS[idx];

    this.tweens.add({
      targets: this.subtitleText,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.subtitleText!.setText(next);
        this.tweens.add({ targets: this.subtitleText, alpha: 1, duration: 500 });
      },
    });
  }

  private shuffledIndices(n: number): number[] {
    const arr = Array.from({ length: n }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ---------- Resize ----------

  private onResize = () => {
    this.scene.restart();
  };
}

interface LevelEntry {
  kind: 'resume' | 'scenario' | 'upcoming';
  title: string;
  description: string;
  icon: string;
  status: 'available' | 'completed' | 'locked';
  onClick: () => void;
}

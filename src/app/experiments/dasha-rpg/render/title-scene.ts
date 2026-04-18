import * as Phaser from 'phaser';

import { buildDashaTextures } from '../../dasha/scenes/dasha-sprite';
import { SoftSounds } from '../../dasha/scenes/soft-sounds';
import { CHARACTERS } from '../content/characters';
import { TITLE_FACTS } from '../content/facts';
import { UPCOMING, listScenarios } from '../content/scenarios/index';
import { evaluate } from '../engine/evaluators';
import { GameState } from '../engine/types';
import { SaveManager } from './save-manager';

const FACT_INTERVAL_MS = 11000;

export class TitleScene extends Phaser.Scene {
  private sfx = new SoftSounds();
  private factText?: Phaser.GameObjects.Text;
  private factTimer?: Phaser.Time.TimerEvent;
  private factOrder: number[] = [];
  private factCursor = 0;

  constructor() {
    super('title');
  }

  create() {
    buildDashaTextures(this);
    this.factOrder = this.shuffledIndices(TITLE_FACTS.length);

    this.drawBackground();
    this.drawSparkles();

    const state = SaveManager.load();

    const isNarrow = this.scale.width < 560;

    this.drawTitle(isNarrow);
    this.drawDasha(isNarrow);
    this.drawLevelSelect(state, isNarrow);
    this.drawDirectoryButton(state);
    this.drawFactTicker();

    this.input.once('pointerdown', () => this.sfx.resume());
    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => {
      this.sfx.dispose();
      this.factTimer?.remove();
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

    const title = this.add
      .text(cx, y, 'Пригоди Даші', {
        fontFamily: 'Georgia, serif',
        fontSize: narrow ? '44px' : '58px',
        color: '#ffd36a',
        fontStyle: 'bold',
        stroke: '#3a1a4a',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    const sub = this.add
      .text(cx, y + title.height * 0.7, 'Глава 1 · Перший курс', {
        fontFamily: 'Georgia, serif',
        fontSize: narrow ? '16px' : '20px',
        color: '#cdb4db',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

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
      const locked = reg.meta.unlock && state
        ? !evaluate(reg.meta.unlock, state)
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

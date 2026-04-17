import * as Phaser from 'phaser';

import { buildDashaTextures } from '../../dasha/scenes/dasha-sprite';
import { SoftSounds } from '../../dasha/scenes/soft-sounds';
import { TITLE_FACTS } from '../content/facts';
import { SaveManager, SaveSummary } from './save-manager';

const FACT_INTERVAL_MS = 5000;

export interface TitleStartPayload {
  /** Set when returning from RpgScene after scenario end. */
  returning?: boolean;
}

export class TitleScene extends Phaser.Scene {
  private sfx = new SoftSounds();
  private factText?: Phaser.GameObjects.Text;
  private factIndex = 0;
  private factTimer?: Phaser.Time.TimerEvent;
  private sparkleTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('title');
  }

  create() {
    buildDashaTextures(this);
    this.drawBackground();
    this.drawSparkles();
    this.drawDasha();
    this.drawTitle();
    this.drawMenu();
    this.drawProgress();
    this.drawFactTicker();

    this.input.once('pointerdown', () => this.sfx.resume());

    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => {
      this.sfx.dispose();
      this.factTimer?.remove();
      this.sparkleTimer?.remove();
      this.scale.off('resize', this.onResize, this);
    });
  }

  // ---------- Background ----------

  private drawBackground() {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1220, 0x221632, 0x3d2352, 0x5c3b7a, 1);
    bg.fillRect(0, 0, width, height);

    // Deco arcs
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
      const y = Phaser.Math.Between(0, height * 0.8);
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

  private drawDasha() {
    const { width, height } = this.scale;
    const container = this.add.container(width * 0.25, height * 0.55);
    const sprite = this.add.sprite(0, 0, 'dasha_idle').setOrigin(0.5, 1).setScale(1.1);
    const shadow = this.add.ellipse(0, 12, 120, 18, 0x000000, 0.35);
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

  // ---------- Title ----------

  private drawTitle() {
    const { width, height } = this.scale;
    const centerX = width * 0.62;
    const titleY = height * 0.22;

    const title = this.add
      .text(centerX, titleY, 'Даша', {
        fontFamily: 'Georgia, serif',
        fontSize: '72px',
        color: '#ffd36a',
        fontStyle: 'bold',
        stroke: '#3a1a4a',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    const sub = this.add
      .text(centerX, titleY + 56, 'Хроніки КШЕ', {
        fontFamily: 'Georgia, serif',
        fontSize: '28px',
        color: '#cdb4db',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

    // Underline flourish
    const flourish = this.add.graphics();
    flourish.lineStyle(2, 0xffd36a, 0.8);
    flourish.beginPath();
    flourish.moveTo(centerX - 80, titleY + 82);
    flourish.lineTo(centerX + 80, titleY + 82);
    flourish.strokePath();

    this.tweens.add({
      targets: [title, sub, flourish],
      alpha: { from: 0, to: 1 },
      y: '-=8',
      duration: 600,
      ease: 'Sine.easeOut',
    });
  }

  // ---------- Menu ----------

  private drawMenu() {
    const { width, height } = this.scale;
    const hasSave = SaveManager.exists();

    const items: MenuItem[] = [];
    if (hasSave) {
      items.push({
        label: 'Продовжити',
        hint: 'Завантажити збереження',
        color: 0xffd36a,
        onClick: () => this.startGame({ load: true }),
      });
    }
    items.push({
      label: hasSave ? 'Почати спочатку' : 'Почати',
      hint: 'Перший день у КШЕ',
      color: 0xcdb4db,
      onClick: () => {
        SaveManager.clear();
        this.startGame({ load: false });
      },
    });
    items.push({
      label: 'Про гру',
      hint: 'Хто такі Даша й Валерія',
      color: 0xa8b8d4,
      onClick: () => this.showAbout(),
    });

    const startX = width * 0.55;
    const startY = height * 0.42;
    const btnW = Math.min(width * 0.4, 360);
    items.forEach((item, i) => {
      this.renderMenuButton(startX, startY + i * 74, btnW, item);
    });
  }

  private renderMenuButton(x: number, y: number, w: number, item: MenuItem) {
    const h = 60;
    const left = x;

    const bg = this.add.graphics();
    bg.fillStyle(0x2a1c3a, 0.92);
    bg.fillRoundedRect(left, y, w, h, 12);
    bg.lineStyle(3, item.color, 1);
    bg.strokeRoundedRect(left, y, w, h, 12);

    const label = this.add.text(left + 20, y + 10, item.label, {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      color: '#fdf6f3',
      fontStyle: 'bold',
    });
    const hint = this.add.text(left + 20, y + 36, item.hint, {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#baa6d4',
      fontStyle: 'italic',
    });

    const zone = this.add.zone(left, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      this.tweens.add({ targets: [bg, label, hint], scale: 1.02, duration: 120 });
      bg.clear();
      bg.fillStyle(0x3a2a4a, 0.95);
      bg.fillRoundedRect(left, y, w, h, 12);
      bg.lineStyle(3, item.color, 1);
      bg.strokeRoundedRect(left, y, w, h, 12);
    });
    zone.on('pointerout', () => {
      this.tweens.add({ targets: [bg, label, hint], scale: 1, duration: 120 });
      bg.clear();
      bg.fillStyle(0x2a1c3a, 0.92);
      bg.fillRoundedRect(left, y, w, h, 12);
      bg.lineStyle(3, item.color, 1);
      bg.strokeRoundedRect(left, y, w, h, 12);
    });
    zone.on('pointerup', () => {
      this.sfx.good();
      item.onClick();
    });
  }

  // ---------- Progress ----------

  private drawProgress() {
    const summary = SaveManager.summary();
    if (!summary) return;

    const { width, height } = this.scale;
    const panelW = Math.min(width * 0.5, 340);
    const panelH = 82;
    const x = width * 0.04;
    const y = height - panelH - 56;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1428, 0.9);
    bg.fillRoundedRect(x, y, panelW, panelH, 12);
    bg.lineStyle(2, 0xcdb4db, 0.8);
    bg.strokeRoundedRect(x, y, panelW, panelH, 12);

    this.add.text(x + 14, y + 10, 'Прогрес', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#cdb4db',
      fontStyle: 'bold',
    });
    this.add.text(
      x + 14,
      y + 30,
      `Квестів пройдено: ${summary.questsCompleted}`,
      {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#fdf6f3',
      }
    );
    this.add.text(
      x + 14,
      y + 48,
      `Вузлів пройдено: ${summary.nodesVisited}`,
      {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#fdf6f3',
      }
    );
    const saved = summary.savedAt ? this.formatTimestamp(summary.savedAt) : '—';
    this.add.text(x + 14, y + 66, `Збережено: ${saved}`, {
      fontFamily: 'Georgia, serif',
      fontSize: '11px',
      color: '#baa6d4',
    });
  }

  // ---------- Fact ticker ----------

  private drawFactTicker() {
    const { width, height } = this.scale;
    const y = height - 28;
    this.factText = this.add
      .text(width / 2, y, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#baa6d4',
        fontStyle: 'italic',
        align: 'center',
        wordWrap: { width: width - 60 },
      })
      .setOrigin(0.5);

    this.showFact();
    this.factTimer = this.time.addEvent({
      delay: FACT_INTERVAL_MS,
      loop: true,
      callback: () => this.showFact(),
    });
  }

  private showFact() {
    if (!this.factText) return;
    const next = TITLE_FACTS[this.factIndex % TITLE_FACTS.length];
    this.factIndex++;

    this.tweens.add({
      targets: this.factText,
      alpha: 0,
      duration: 350,
      onComplete: () => {
        this.factText!.setText(next);
        this.tweens.add({ targets: this.factText, alpha: 1, duration: 420 });
      },
    });
  }

  // ---------- About modal ----------

  private formatTimestamp(ts: number): string {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private showAbout() {
    const { width, height } = this.scale;
    const container = this.add.container(0, 0).setDepth(50);

    const overlay = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.75)
      .setOrigin(0)
      .setInteractive();
    const text = this.add
      .text(
        width / 2,
        height / 2,
        [
          'Даша: Хроніки КШЕ',
          '',
          'Рольова гра про першокурсницю психологічного факультету',
          'Київської школи економіки.',
          '',
          'Вибори мають значення. Персонажі реальні. Жарти — теж.',
          '',
          'Тап — закрити',
        ].join('\n'),
        {
          fontFamily: 'Georgia, serif',
          fontSize: '16px',
          color: '#fdf6f3',
          align: 'center',
          lineSpacing: 6,
          wordWrap: { width: width * 0.8 },
        }
      )
      .setOrigin(0.5);

    container.add([overlay, text]);
    overlay.on('pointerup', () => container.destroy());
  }

  // ---------- Navigation ----------

  private startGame(opts: { load: boolean }) {
    this.factTimer?.remove();
    this.scene.start('rpg', opts);
  }

  // ---------- Resize ----------

  private onResize = () => {
    // Simple strategy: restart scene to re-layout.
    this.scene.restart();
  };
}

interface MenuItem {
  label: string;
  hint: string;
  color: number;
  onClick: () => void;
}

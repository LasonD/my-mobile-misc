import * as Phaser from 'phaser';

import {
  DialogueLine,
  INTRO,
  LEVELS,
  LevelConfig,
  OUTRO,
  SESSION_INTROS,
  SESSION_OUTROS,
  SPEAKER_NAMES,
  Speaker,
} from './dialogue-data';
import { PORTRAITS, buildPortraitWidget } from './portraits';
import { buildDashaTextures } from './dasha-sprite';
import { SoftSounds } from './soft-sounds';
import { Voice } from './voice';

type Phase = 'dialogue' | 'playing' | 'finale';

interface BubbleType {
  kind: 'sadness' | 'anxiety' | 'shame' | 'intimacy' | 'insight' | 'stigma' | 'book' | 'coffee';
  emoji: string;
  color: number;
  ringColor: number;
  trustDelta: number;
  scoreDelta: number;
  missPenalty: number;
  catchBehavior?: 'powerup-slow' | 'powerup-time';
}

const BUBBLE_TYPES: BubbleType[] = [
  { kind: 'sadness', emoji: '\u{1F499}', color: 0xc6dbff, ringColor: 0x6a8fb8, trustDelta: 3, scoreDelta: 10, missPenalty: 3 },
  { kind: 'anxiety', emoji: '\u{1F49B}', color: 0xfff2a6, ringColor: 0xc9a94a, trustDelta: 3, scoreDelta: 10, missPenalty: 3 },
  { kind: 'shame', emoji: '\u{1F49C}', color: 0xe4c9f6, ringColor: 0x9a6fbf, trustDelta: 3, scoreDelta: 10, missPenalty: 3 },
  { kind: 'intimacy', emoji: '\u{1F497}', color: 0xffcbe0, ringColor: 0xdb5a88, trustDelta: 8, scoreDelta: 30, missPenalty: 5 },
  { kind: 'insight', emoji: '\u2B50', color: 0xfff6c2, ringColor: 0xe4b300, trustDelta: 12, scoreDelta: 50, missPenalty: 2 },
  { kind: 'stigma', emoji: '\u26A1', color: 0xffc7c0, ringColor: 0xd9393c, trustDelta: -15, scoreDelta: -25, missPenalty: 0 },
  { kind: 'book', emoji: '\u{1F4DA}', color: 0xc7e8d0, ringColor: 0x3c8a5d, trustDelta: 0, scoreDelta: 5, missPenalty: 0, catchBehavior: 'powerup-slow' },
  { kind: 'coffee', emoji: '\u2615', color: 0xdec4a7, ringColor: 0x8a5a2b, trustDelta: 0, scoreDelta: 5, missPenalty: 0, catchBehavior: 'powerup-time' },
];

export class DashaScene extends Phaser.Scene {
  private phase: Phase = 'dialogue';

  // Dialogue state
  private dialogueQueue: DialogueLine[] = [];
  private lineIndex = 0;
  private typedChars = 0;
  private typingTimer?: Phaser.Time.TimerEvent;
  private typewriterDone = true;
  private advanceCooldownUntil = 0;

  // Dialogue UI
  private dialogueContainer?: Phaser.GameObjects.Container;
  private portraitWidget?: Phaser.GameObjects.Container;
  private speakerText?: Phaser.GameObjects.Text;
  private dialogueText?: Phaser.GameObjects.Text;
  private hintText?: Phaser.GameObjects.Text;
  private dialogueBox?: Phaser.GameObjects.Graphics;
  private dialogueOverlay?: Phaser.GameObjects.Rectangle;

  // Game state
  private sessionIndex = 0; // 0..2
  private score = 0;
  private trust = 60;
  private readonly maxTrust = 100;
  private timeLeft = 0;
  private slowMoUntil = 0;
  private lastFrame = 0;

  // Game entities
  private catcher?: Phaser.GameObjects.Container;
  private catcherX = 0;
  private bubblesLayer?: Phaser.GameObjects.Layer;
  private bubbles: Phaser.GameObjects.Container[] = [];
  private spawnTimer?: Phaser.Time.TimerEvent;
  private levelConfig!: LevelConfig;

  // Game UI
  private gameHud?: Phaser.GameObjects.Container;
  private trustBarBg?: Phaser.GameObjects.Rectangle;
  private trustBar?: Phaser.GameObjects.Rectangle;
  private trustLabel?: Phaser.GameObjects.Text;
  private scoreText?: Phaser.GameObjects.Text;
  private timerText?: Phaser.GameObjects.Text;
  private patientContainer?: Phaser.GameObjects.Container;
  private thoughtCloud?: Phaser.GameObjects.Text;

  // Audio
  private sfx = new SoftSounds();
  private voice = new Voice();

  // Dragging
  private dragging = false;

  constructor() {
    super('dasha');
  }

  create() {
    buildDashaTextures(this);
    this.drawBackgroundClouds();

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('pointerupoutside', this.onPointerUp, this);

    this.scale.on('resize', this.onResize, this);

    this.events.once('shutdown', () => {
      this.sfx.dispose();
      this.voice.cancel();
      this.typingTimer?.remove();
      this.spawnTimer?.remove();
      this.scale.off('resize', this.onResize, this);
    });

    // Start with intro
    this.playDialogue(INTRO, () => this.beginSession(0));
  }

  override update(_time: number, delta: number) {
    if (this.phase !== 'playing') return;

    const now = this.time.now;
    const slowFactor = now < this.slowMoUntil ? 0.35 : 1;
    const effDelta = delta * slowFactor;

    this.timeLeft -= effDelta / 1000;
    if (this.timerText) {
      this.timerText.setText(`${Math.max(this.timeLeft, 0).toFixed(1)} с`);
    }

    const bottomY = this.scale.height * 0.88;

    // Move bubbles down
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      if (!b.active) {
        this.bubbles.splice(i, 1);
        continue;
      }
      const speed = (b.getData('fallSpeed') as number) ?? this.levelConfig.fallSpeed;
      b.y += (speed * effDelta) / 1000;

      // wobble
      const swayAmp = (b.getData('swayAmp') as number) ?? 12;
      const swayPhase = (b.getData('swayPhase') as number) ?? 0;
      const baseX = (b.getData('baseX') as number) ?? b.x;
      b.x = baseX + Math.sin((now + swayPhase) / 400) * swayAmp;

      // Check for catch with catcher rect
      if (this.catcher && b.active) {
        const cx = this.catcher.x;
        const cy = this.catcher.y;
        if (Math.abs(b.x - cx) < 50 && Math.abs(b.y - cy) < 34) {
          this.handleCatch(b);
          continue;
        }
      }

      // Escaped offscreen
      if (b.y > bottomY + 40) {
        const type = (b.getData('type') as BubbleType) ?? null;
        if (type) this.handleMiss(type);
        b.destroy();
      }
    }

    // Trust check
    if (this.trust <= 0) {
      this.trust = 0;
      this.endSession(true /* failed */);
      return;
    }
    if (this.timeLeft <= 0) {
      this.endSession(false);
      return;
    }
  }

  // ===================== Background =====================

  private drawBackgroundClouds() {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    // Soft vertical gradient via two rectangles
    bg.fillGradientStyle(0xf6edfb, 0xf6edfb, 0xfce8f1, 0xfce8f1, 1);
    bg.fillRect(0, 0, width, height);

    // Decorative soft circles
    const dots = this.add.graphics();
    for (let i = 0; i < 18; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const r = Phaser.Math.Between(20, 60);
      dots.fillStyle(0xffffff, 0.35);
      dots.fillCircle(x, y, r);
    }
  }

  // ===================== Dialogue =====================

  private playDialogue(lines: DialogueLine[], onComplete: () => void) {
    this.phase = 'dialogue';
    this.tearDownGame();

    this.dialogueQueue = lines.slice();
    this.lineIndex = 0;
    this.showDialogueUi(onComplete);
    this.renderCurrentLine();
  }

  private showDialogueUi(onComplete: () => void) {
    const { width, height } = this.scale;

    this.dialogueOverlay = this.add
      .rectangle(0, 0, width, height, 0xffffff, 0.55)
      .setOrigin(0)
      .setDepth(20);

    const container = this.add.container(0, 0).setDepth(21);
    this.dialogueContainer = container;

    const boxH = Math.min(260, height * 0.42);
    const boxY = height - boxH - 20;

    const box = this.add.graphics();
    box.fillStyle(0xffffff, 0.95);
    box.fillRoundedRect(20, boxY, width - 40, boxH, 18);
    box.lineStyle(3, 0xcdb4db, 1);
    box.strokeRoundedRect(20, boxY, width - 40, boxH, 18);
    this.dialogueBox = box;

    this.speakerText = this.add
      .text(40, boxY + 16, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '20px',
        color: '#7d5fff',
        fontStyle: 'bold',
      })
      .setDepth(22);

    this.dialogueText = this.add
      .text(40, boxY + 56, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '19px',
        color: '#2a1c3a',
        wordWrap: { width: width - 80 },
        lineSpacing: 6,
      })
      .setDepth(22);

    this.hintText = this.add
      .text(width - 40, boxY + boxH - 28, '— тап, щоб продовжити —', {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#9a7ab6',
        fontStyle: 'italic',
      })
      .setOrigin(1, 0)
      .setDepth(22);

    this.tweens.add({
      targets: this.hintText,
      alpha: { from: 0.4, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    container.add([box, this.speakerText, this.dialogueText, this.hintText]);

    // Store the completion callback for later
    container.setData('onComplete', onComplete);
  }

  private renderCurrentLine() {
    const line = this.dialogueQueue[this.lineIndex];
    if (!line) return;

    // Remove previous portrait
    this.portraitWidget?.destroy();
    this.portraitWidget = undefined;

    // Speaker label
    const name =
      line.name ?? SPEAKER_NAMES[line.who] ?? '';
    this.speakerText?.setText(name);

    // Portrait (if not narrator). Dasha uses her pixel-art sprite; others get emoji portraits.
    if (line.who === 'dasha') {
      const container = this.add
        .container(this.scale.width - 92, this.scale.height - 300)
        .setDepth(23);
      const shadow = this.add.ellipse(0, 140, 120, 20, 0x000000, 0.2);
      const sprite = this.add.sprite(0, 0, 'dasha_idle').setOrigin(0.5, 1);
      sprite.setScale(1);
      container.add([shadow, sprite]);

      // blink loop
      const blinker = this.time.addEvent({
        delay: 3200,
        loop: true,
        callback: () => {
          sprite.setTexture('dasha_blink');
          this.time.delayedCall(120, () => sprite.setTexture('dasha_idle'));
        },
      });
      container.setData('blinker', blinker);
      container.once(Phaser.GameObjects.Events.DESTROY, () => blinker.remove());

      // subtle breathing sway
      this.tweens.add({
        targets: sprite,
        y: '+=3',
        duration: 1600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // bounce-in
      container.setScale(0.4);
      this.tweens.add({ targets: container, scale: 1, duration: 260, ease: 'Back.easeOut' });
      this.portraitWidget = container;
    } else if (PORTRAITS[line.who]) {
      const w = buildPortraitWidget(
        this,
        this.scale.width - 86,
        this.scale.height - 250,
        line.who
      );
      if (w) {
        w.setDepth(23);
        this.portraitWidget = w;
        w.setScale(0.4);
        this.tweens.add({
          targets: w,
          scale: 1,
          duration: 260,
          ease: 'Back.easeOut',
        });
      }
    }

    // Typewriter
    this.dialogueText?.setText('');
    this.typedChars = 0;
    this.typewriterDone = false;
    this.typingTimer?.remove();

    this.voice.say(line.text, line.who);
    this.sfx.page();

    const fullText = line.text;
    this.typingTimer = this.time.addEvent({
      delay: 24,
      loop: true,
      callback: () => {
        this.typedChars++;
        this.dialogueText?.setText(fullText.slice(0, this.typedChars));
        if (this.typedChars >= fullText.length) {
          this.typewriterDone = true;
          this.typingTimer?.remove();
        }
      },
    });
  }

  private tearDownDialogue() {
    this.typingTimer?.remove();
    this.voice.cancel();
    this.dialogueOverlay?.destroy();
    this.dialogueOverlay = undefined;
    this.dialogueContainer?.destroy();
    this.dialogueContainer = undefined;
    this.portraitWidget?.destroy();
    this.portraitWidget = undefined;
    this.speakerText = undefined;
    this.dialogueText = undefined;
    this.hintText = undefined;
    this.dialogueBox = undefined;
  }

  private advanceDialogue() {
    if (this.phase !== 'dialogue') return;
    // Finish typewriter first if still printing
    if (!this.typewriterDone) {
      this.typedChars = this.dialogueQueue[this.lineIndex]?.text.length ?? 0;
      this.dialogueText?.setText(this.dialogueQueue[this.lineIndex]?.text ?? '');
      this.typewriterDone = true;
      this.typingTimer?.remove();
      return;
    }

    this.lineIndex++;
    if (this.lineIndex >= this.dialogueQueue.length) {
      const onDone = this.dialogueContainer?.getData('onComplete') as (() => void) | undefined;
      this.tearDownDialogue();
      onDone?.();
      return;
    }

    this.renderCurrentLine();
  }

  // ===================== Session gameplay =====================

  private beginSession(index: number) {
    if (index > 2) {
      this.playDialogue(OUTRO, () => this.restartGame());
      return;
    }
    this.sessionIndex = index;
    this.playDialogue(SESSION_INTROS[index], () => this.startLevel());
  }

  private startLevel() {
    this.phase = 'playing';
    this.levelConfig = LEVELS[this.sessionIndex];
    this.timeLeft = this.levelConfig.duration;
    this.trust = 60;
    this.score = 0;
    this.slowMoUntil = 0;
    this.bubbles = [];

    this.buildGameHud();
    this.buildPatient();
    this.buildCatcher();

    this.spawnTimer = this.time.addEvent({
      delay: this.levelConfig.spawnInterval,
      callback: this.spawnBubble,
      callbackScope: this,
      loop: true,
    });
  }

  private endSession(failed: boolean) {
    this.phase = 'dialogue';
    this.spawnTimer?.remove();
    this.bubbles.forEach((b) => b.destroy());
    this.bubbles = [];

    if (failed) {
      // retry: replay the intro for this session
      this.floatCenterText('Рапорт втрачено, спробуймо ще', 0xd9393c);
      this.sfx.wrong();
      this.time.delayedCall(1500, () => {
        this.tearDownGame();
        this.beginSession(this.sessionIndex);
      });
      return;
    }

    this.sfx.levelUp();
    this.floatCenterText(`Сесія ${this.sessionIndex + 1} завершена · ${this.score} очок`, 0x7d5fff);
    this.time.delayedCall(1500, () => {
      this.tearDownGame();
      this.playDialogue(SESSION_OUTROS[this.sessionIndex], () =>
        this.beginSession(this.sessionIndex + 1)
      );
    });
  }

  private restartGame() {
    this.tearDownGame();
    this.scene.restart();
  }

  private tearDownGame() {
    this.spawnTimer?.remove();
    this.spawnTimer = undefined;
    this.bubbles.forEach((b) => b.destroy());
    this.bubbles = [];
    this.catcher?.destroy();
    this.catcher = undefined;
    this.gameHud?.destroy();
    this.gameHud = undefined;
    this.trustBarBg = undefined;
    this.trustBar = undefined;
    this.trustLabel = undefined;
    this.scoreText = undefined;
    this.timerText = undefined;
    this.patientContainer?.destroy();
    this.patientContainer = undefined;
    this.thoughtCloud?.destroy();
    this.thoughtCloud = undefined;
    this.dashaFigure?.destroy();
    this.dashaFigure = undefined;
  }

  // ===================== HUD / scene elements =====================

  private buildGameHud() {
    const { width } = this.scale;

    const bar = this.add.container(0, 0).setDepth(15);
    const bg = this.add.rectangle(0, 0, width, 46, 0xffffff, 0.85).setOrigin(0);
    bg.setStrokeStyle(0);

    this.timerText = this.add
      .text(14, 13, '0.0 с', {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#5a4a7a',
        fontStyle: 'bold',
      });

    this.scoreText = this.add
      .text(width - 14, 13, '0 очок', {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#7d5fff',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);

    this.trustLabel = this.add
      .text(width / 2, 12, 'Довіра', {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#8a7a9e',
      })
      .setOrigin(0.5, 0);

    const barWidth = Math.min(220, width * 0.5);
    this.trustBarBg = this.add
      .rectangle(width / 2, 32, barWidth, 10, 0xeadcf3)
      .setOrigin(0.5, 0.5);
    this.trustBar = this.add
      .rectangle(width / 2 - barWidth / 2, 32, (barWidth * this.trust) / this.maxTrust, 10, 0xcdb4db)
      .setOrigin(0, 0.5);

    bar.add([bg, this.timerText, this.scoreText, this.trustLabel, this.trustBarBg, this.trustBar]);
    this.gameHud = bar;
    this.updateTrustBar();
  }

  private updateTrustBar() {
    if (!this.trustBarBg || !this.trustBar) return;
    const barWidth = this.trustBarBg.width;
    const tgt = (barWidth * Math.max(this.trust, 0)) / this.maxTrust;
    this.tweens.add({
      targets: this.trustBar,
      width: tgt,
      duration: 180,
      ease: 'Sine.easeOut',
    });
    const color =
      this.trust > 60 ? 0x91c98a : this.trust > 30 ? 0xcdb4db : 0xe89a9a;
    this.trustBar.setFillStyle(color);
  }

  private buildPatient() {
    const { width } = this.scale;
    const container = this.add.container(width / 2, 100).setDepth(5);
    const head = this.add.circle(0, 0, 28, 0xfbd7bc);
    const ring = this.add.graphics();
    ring.lineStyle(3, 0xcdb4db, 1);
    ring.strokeCircle(0, 0, 28);
    // generic face (eyes + mouth)
    const eyes = this.add.graphics();
    eyes.fillStyle(0x2a1c3a, 1);
    eyes.fillCircle(-9, -3, 2);
    eyes.fillCircle(9, -3, 2);
    eyes.lineStyle(2, 0x2a1c3a, 1);
    eyes.beginPath();
    eyes.arc(0, 8, 5, 0.15 * Math.PI, 0.85 * Math.PI);
    eyes.strokePath();

    // thought cloud symbol
    this.thoughtCloud = this.add
      .text(50, -20, '\u{1F4AD}', {
        fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
        fontSize: '32px',
      })
      .setOrigin(0.5);

    container.add([head, ring, eyes, this.thoughtCloud]);
    this.patientContainer = container;

    this.tweens.add({
      targets: container,
      y: '+=4',
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private dashaFigure?: Phaser.GameObjects.Container;

  private buildDashaFigure() {
    const { height } = this.scale;
    const container = this.add.container(60, height - 140).setDepth(7);
    const shadow = this.add.ellipse(0, 96, 86, 16, 0x000000, 0.2);
    const sprite = this.add.sprite(0, 0, 'dasha_idle').setOrigin(0.5, 1).setScale(0.7);
    container.add([shadow, sprite]);

    const blinker = this.time.addEvent({
      delay: 3600,
      loop: true,
      callback: () => {
        sprite.setTexture('dasha_blink');
        this.time.delayedCall(120, () => sprite.setTexture('dasha_idle'));
      },
    });
    container.setData('blinker', blinker);
    container.once(Phaser.GameObjects.Events.DESTROY, () => blinker.remove());

    this.tweens.add({
      targets: sprite,
      y: '+=2',
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.dashaFigure = container;
  }

  private buildCatcher() {
    this.buildDashaFigure();

    const { width, height } = this.scale;
    this.catcherX = width / 2;

    const container = this.add.container(this.catcherX, height - 80).setDepth(8);

    // notebook shape
    const shadow = this.add.rectangle(4, 6, 120, 38, 0x000000, 0.18).setOrigin(0.5);
    const body = this.add.graphics();
    body.fillStyle(0xfff8ea, 1);
    body.fillRoundedRect(-60, -19, 120, 38, 8);
    body.lineStyle(3, 0xcdb4db, 1);
    body.strokeRoundedRect(-60, -19, 120, 38, 8);
    // spiral dots
    body.fillStyle(0xcdb4db, 0.8);
    for (let i = -50; i <= 50; i += 12) {
      body.fillCircle(i, -19, 2.2);
    }
    // lines
    body.lineStyle(1, 0xc9b8dd, 0.8);
    body.beginPath();
    body.moveTo(-50, -4);
    body.lineTo(50, -4);
    body.strokePath();
    body.beginPath();
    body.moveTo(-50, 6);
    body.lineTo(50, 6);
    body.strokePath();

    const pencil = this.add
      .text(52, -20, '\u{1F58A}', {
        fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
        fontSize: '22px',
      })
      .setOrigin(0.5);

    container.add([shadow, body, pencil]);
    this.catcher = container;
  }

  // ===================== Bubbles =====================

  private spawnBubble() {
    if (this.phase !== 'playing') return;
    const { width } = this.scale;

    // Weighted pick based on level config
    let type: BubbleType;
    const roll = Math.random();
    if (roll < this.levelConfig.stigmaRate) {
      type = pickByKind('stigma');
    } else if (roll < this.levelConfig.stigmaRate + this.levelConfig.specialRate) {
      // insight or intimacy or powerup
      const sub = Math.random();
      if (sub < 0.4) type = pickByKind('intimacy');
      else if (sub < 0.7) type = pickByKind('insight');
      else if (sub < 0.85) type = pickByKind('book');
      else type = pickByKind('coffee');
    } else {
      const basics: BubbleType['kind'][] = ['sadness', 'anxiety', 'shame'];
      type = pickByKind(basics[Math.floor(Math.random() * basics.length)]);
    }

    const x = Phaser.Math.Between(40, width - 40);
    const container = this.add.container(x, 140).setDepth(6);

    // Bubble background
    const bg = this.add.circle(0, 0, 28, type.color);
    const ring = this.add.graphics();
    ring.lineStyle(3, type.ringColor, 1);
    ring.strokeCircle(0, 0, 28);

    // Emoji icon
    const icon = this.add
      .text(0, 0, type.emoji, {
        fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
        fontSize: '30px',
      })
      .setOrigin(0.5);

    container.add([bg, ring, icon]);
    container.setData('type', type);
    container.setData('baseX', x);
    container.setData('swayAmp', Phaser.Math.Between(6, 16));
    container.setData('swayPhase', Phaser.Math.Between(0, 10000));
    container.setData(
      'fallSpeed',
      this.levelConfig.fallSpeed + Phaser.Math.Between(-20, 20)
    );

    this.bubbles.push(container);

    // spawn puff
    this.tweens.add({
      targets: container,
      scale: { from: 0.3, to: 1 },
      duration: 220,
      ease: 'Back.easeOut',
    });
  }

  private handleCatch(bubble: Phaser.GameObjects.Container) {
    const type = bubble.getData('type') as BubbleType;
    bubble.destroy();

    this.score = Math.max(0, this.score + type.scoreDelta);
    this.trust = Phaser.Math.Clamp(this.trust + type.trustDelta, 0, this.maxTrust);
    this.scoreText?.setText(`${this.score} очок`);
    this.updateTrustBar();

    // sound + fx
    if (type.kind === 'stigma') {
      this.sfx.wrong();
      this.cameras.main.flash(180, 220, 60, 60, false);
      this.floatAt(bubble.x, bubble.y, 'стигма', 0xd9393c);
    } else if (type.kind === 'insight') {
      this.sfx.insight();
      this.flashSparkle(bubble.x, bubble.y, 0xfff6c2);
      this.floatAt(bubble.x, bubble.y, `+${type.scoreDelta}`, 0xe4b300);
    } else if (type.kind === 'intimacy') {
      this.sfx.bonus();
      this.flashSparkle(bubble.x, bubble.y, 0xffcbe0);
      this.floatAt(bubble.x, bubble.y, `+${type.scoreDelta} ♥`, 0xdb5a88);
    } else if (type.catchBehavior === 'powerup-slow') {
      this.sfx.good();
      this.slowMoUntil = this.time.now + 3500;
      this.floatAt(bubble.x, bubble.y, 'уповільнення', 0x3c8a5d);
    } else if (type.catchBehavior === 'powerup-time') {
      this.sfx.good();
      this.timeLeft += 5;
      this.floatAt(bubble.x, bubble.y, '+5 с', 0x8a5a2b);
    } else {
      this.sfx.pop();
      this.floatAt(bubble.x, bubble.y, `+${type.scoreDelta}`, type.ringColor);
    }
  }

  private handleMiss(type: BubbleType) {
    if (type.missPenalty <= 0) return;
    this.trust = Phaser.Math.Clamp(this.trust - type.missPenalty, 0, this.maxTrust);
    this.updateTrustBar();
    this.sfx.miss();
  }

  // ===================== FX helpers =====================

  private floatAt(x: number, y: number, text: string, color: number) {
    const hex = '#' + color.toString(16).padStart(6, '0');
    const t = this.add
      .text(x, y, text, {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: hex,
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(12);
    this.tweens.add({
      targets: t,
      y: y - 40,
      alpha: 0,
      duration: 700,
      onComplete: () => t.destroy(),
    });
  }

  private floatCenterText(text: string, color: number) {
    const { width, height } = this.scale;
    const hex = '#' + color.toString(16).padStart(6, '0');
    const t = this.add
      .text(width / 2, height / 2, text, {
        fontFamily: 'Georgia, serif',
        fontSize: '26px',
        color: hex,
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(25);
    t.setScale(0.3);
    this.tweens.add({
      targets: t,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: t,
      alpha: 0,
      delay: 1100,
      duration: 400,
      onComplete: () => t.destroy(),
    });
  }

  private flashSparkle(x: number, y: number, color: number) {
    const ring = this.add.circle(x, y, 10, color, 0.6).setDepth(11);
    this.tweens.add({
      targets: ring,
      scale: 4,
      alpha: 0,
      duration: 500,
      onComplete: () => ring.destroy(),
    });
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const sx = x + Math.cos(angle) * 10;
      const sy = y + Math.sin(angle) * 10;
      const p = this.add.circle(sx, sy, 3, 0xffffff, 1).setDepth(11);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * 50,
        y: y + Math.sin(angle) * 50,
        alpha: 0,
        duration: 520,
        onComplete: () => p.destroy(),
      });
    }
  }

  // ===================== Input =====================

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    this.sfx.resume();
    if (this.phase === 'dialogue') {
      if (this.time.now < this.advanceCooldownUntil) return;
      this.advanceCooldownUntil = this.time.now + 120;
      this.advanceDialogue();
      return;
    }
    if (this.phase === 'playing' && this.catcher) {
      this.dragging = true;
      this.moveCatcherTo(pointer.x);
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (this.phase === 'playing' && this.dragging) {
      this.moveCatcherTo(pointer.x);
    }
  }

  private onPointerUp(_pointer: Phaser.Input.Pointer) {
    this.dragging = false;
  }

  private moveCatcherTo(x: number) {
    if (!this.catcher) return;
    const { width } = this.scale;
    const clamped = Phaser.Math.Clamp(x, 70, width - 70);
    this.catcher.x = clamped;
    this.catcherX = clamped;
  }

  // ===================== Resize =====================

  private onResize = (gameSize: Phaser.Structs.Size) => {
    this.cameras.resize(gameSize.width, gameSize.height);
  };
}

function pickByKind(kind: BubbleType['kind']): BubbleType {
  const found = BUBBLE_TYPES.find((b) => b.kind === kind);
  if (!found) throw new Error(`Unknown bubble kind: ${kind}`);
  return found;
}

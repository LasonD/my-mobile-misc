import * as Phaser from 'phaser';

import { SoundEngine } from './sound-engine';

type EnemyKind = 'tank' | 'apc' | 'artillery' | 'aa' | 'heavy';

interface EnemyConfig {
  texture: string;
  speedMultiplier: number;
  hp: number;
  points: number;
  scale: number;
  shotInterval?: number; // ms — omit for non-shooters
}

const ENEMY_TABLE: Record<EnemyKind, EnemyConfig> = {
  tank: { texture: 'tank', speedMultiplier: 1.0, hp: 1, points: 10, scale: 1 },
  apc: { texture: 'apc', speedMultiplier: 1.7, hp: 1, points: 15, scale: 1 },
  artillery: { texture: 'artillery', speedMultiplier: 0.65, hp: 2, points: 25, scale: 1.1 },
  aa: { texture: 'aa', speedMultiplier: 0.8, hp: 2, points: 30, scale: 1, shotInterval: 1600 },
  heavy: { texture: 'heavy', speedMultiplier: 0.5, hp: 3, points: 40, scale: 1.15 },
};

export class MainScene extends Phaser.Scene {
  private score = 0;
  private lives = 3;
  private gameActive = true;
  private rampTimer = 0;

  private enemies!: Phaser.Physics.Arcade.Group;
  private drones!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;

  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private hudBg!: Phaser.GameObjects.Rectangle;

  private frontLine!: Phaser.GameObjects.Graphics;

  private enemySpeed = 75;
  private spawnInterval = 1400;
  private spawnTimer?: Phaser.Time.TimerEvent;

  private sfx = new SoundEngine();

  constructor() {
    super('main');
  }

  create() {
    this.buildTextures();
    this.drawBackground();
    this.drawHud();

    this.enemies = this.physics.add.group();
    this.drones = this.physics.add.group();

    this.physics.add.overlap(
      this.drones,
      this.enemies,
      this.handleHit as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.input.on('pointerdown', this.handleTap, this);

    this.startSpawning();

    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.onResize, this);
    });
  }

  override update(_time: number, delta: number) {
    if (!this.gameActive) return;

    this.rampTimer += delta;
    if (this.rampTimer > 8000) {
      this.rampTimer = 0;
      this.enemySpeed = Math.min(this.enemySpeed + 12, 200);
      this.spawnInterval = Math.max(this.spawnInterval - 120, 500);
      this.startSpawning();
    }

    const lineY = this.getFrontLineY();
    this.enemies.getChildren().forEach((obj: Phaser.GameObjects.GameObject) => {
      const enemy = obj as Phaser.Physics.Arcade.Sprite;
      if (!enemy.active) return;
      if (enemy.y >= lineY) {
        this.loseLife();
        this.explode(enemy.x, enemy.y, 0x66aaff);
        enemy.destroy();
      }
    });
  }

  private drawBackground() {
    const { width, height } = this.scale;
    // Gradient sky via two stacked rectangles + some faint stars
    this.add.rectangle(0, 0, width, height, 0x0b1422).setOrigin(0);
    this.add.rectangle(0, 0, width, height * 0.5, 0x15233d).setOrigin(0).setAlpha(0.6);

    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height * 0.9);
      const r = Phaser.Math.FloatBetween(0.5, 1.8);
      this.add.circle(x, y, r, 0xffffff, Phaser.Math.FloatBetween(0.15, 0.5));
    }

    // Ground strip below the front line — slightly warmer tone
    const lineY = this.getFrontLineY();
    this.add.rectangle(0, lineY, width, height - lineY, 0x1a1107).setOrigin(0).setAlpha(0.85);

    // Front line (yellow-blue dashed)
    this.frontLine = this.add.graphics();
    this.drawFrontLine();
  }

  private drawFrontLine() {
    const { width } = this.scale;
    const y = this.getFrontLineY();
    this.frontLine.clear();
    this.frontLine.lineStyle(3, 0xffd700, 0.85);
    let x = 0;
    while (x < width) {
      this.frontLine.beginPath();
      this.frontLine.moveTo(x, y);
      this.frontLine.lineTo(x + 14, y);
      this.frontLine.strokePath();
      x += 22;
    }
    this.frontLine.lineStyle(3, 0x0057b7, 0.85);
    x = 11;
    while (x < width) {
      this.frontLine.beginPath();
      this.frontLine.moveTo(x, y + 4);
      this.frontLine.lineTo(x + 14, y + 4);
      this.frontLine.strokePath();
      x += 22;
    }
  }

  private getFrontLineY() {
    return this.scale.height * 0.86;
  }

  private drawHud() {
    const { width } = this.scale;
    this.hudBg = this.add.rectangle(0, 0, width, 44, 0x000000, 0.35).setOrigin(0).setDepth(9);
    this.scoreText = this.add
      .text(14, 10, 'Score: 0', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '20px',
        color: '#ffd700',
      })
      .setDepth(10);
    this.livesText = this.add
      .text(width - 14, 10, this.hearts(), {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#ff4e5a',
      })
      .setOrigin(1, 0)
      .setDepth(10);
  }

  private hearts() {
    return '\u2764'.repeat(Math.max(this.lives, 0));
  }

  // --- Textures ---
  private buildTextures() {
    this.buildDroneTexture();
    this.buildTankTexture();
    this.buildApcTexture();
    this.buildArtilleryTexture();
    this.buildSparkTexture();
  }

  private buildDroneTexture() {
    const w = 44;
    const h = 40;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // rotor arms
    g.lineStyle(3, 0x2a2a2a, 1);
    g.strokeLineShape(new Phaser.Geom.Line(6, 6, 38, 34));
    g.strokeLineShape(new Phaser.Geom.Line(38, 6, 6, 34));

    // rotor disks
    g.fillStyle(0x202020, 0.7);
    g.fillCircle(6, 6, 6);
    g.fillCircle(38, 6, 6);
    g.fillCircle(6, 34, 6);
    g.fillCircle(38, 34, 6);
    g.lineStyle(1, 0x3a3a3a, 1);
    g.strokeCircle(6, 6, 6);
    g.strokeCircle(38, 6, 6);
    g.strokeCircle(6, 34, 6);
    g.strokeCircle(38, 34, 6);

    // body — yellow over blue (Ukrainian flag)
    g.fillStyle(0xffd700, 1);
    g.fillRoundedRect(12, 12, 20, 8, 3);
    g.fillStyle(0x0057b7, 1);
    g.fillRoundedRect(12, 20, 20, 8, 3);
    g.lineStyle(1.5, 0x000000, 0.5);
    g.strokeRoundedRect(12, 12, 20, 16, 3);

    // camera lens (center red LED)
    g.fillStyle(0xff2233, 1);
    g.fillCircle(22, 20, 2.4);

    g.generateTexture('drone', w, h);
    g.destroy();
  }

  private buildTankTexture() {
    const w = 52;
    const h = 44;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // tracks
    g.fillStyle(0x1a1a1a, 1);
    g.fillRoundedRect(2, 0, 48, 8, 3);
    g.fillRoundedRect(2, 36, 48, 8, 3);
    g.fillStyle(0x333333, 1);
    for (let i = 0; i < 6; i++) {
      g.fillRect(4 + i * 8, 2, 4, 4);
      g.fillRect(4 + i * 8, 38, 4, 4);
    }

    // hull
    g.fillStyle(0x3f5038, 1);
    g.fillRoundedRect(4, 8, 44, 28, 4);
    g.lineStyle(1.5, 0x22301d, 1);
    g.strokeRoundedRect(4, 8, 44, 28, 4);

    // turret
    g.fillStyle(0x334229, 1);
    g.fillCircle(26, 22, 10);
    g.lineStyle(1.5, 0x1e2917, 1);
    g.strokeCircle(26, 22, 10);

    // barrel
    g.fillStyle(0x222222, 1);
    g.fillRoundedRect(26, 20, 26, 4, 1);

    // enemy marker
    g.fillStyle(0xc8102e, 1);
    g.fillCircle(26, 22, 3);

    g.generateTexture('tank', w, h);
    g.destroy();
  }

  private buildApcTexture() {
    const w = 48;
    const h = 34;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // wheels
    g.fillStyle(0x1a1a1a, 1);
    for (let i = 0; i < 4; i++) {
      g.fillCircle(8 + i * 10, 4, 4);
      g.fillCircle(8 + i * 10, 30, 4);
    }

    // hull
    g.fillStyle(0x4a5b44, 1);
    g.fillRoundedRect(2, 6, 44, 22, 4);
    g.lineStyle(1.5, 0x2b3527, 1);
    g.strokeRoundedRect(2, 6, 44, 22, 4);

    // viewports
    g.fillStyle(0x1a1f17, 1);
    g.fillRect(8, 13, 28, 4);

    // mini turret
    g.fillStyle(0x32402b, 1);
    g.fillRoundedRect(18, 20, 12, 6, 2);
    g.fillRect(30, 22, 14, 2);

    // enemy marker
    g.fillStyle(0xc8102e, 1);
    g.fillCircle(24, 23, 2.2);

    g.generateTexture('apc', w, h);
    g.destroy();
  }

  private buildArtilleryTexture() {
    const w = 58;
    const h = 44;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // tracks
    g.fillStyle(0x1a1a1a, 1);
    g.fillRoundedRect(2, 2, 50, 8, 3);
    g.fillRoundedRect(2, 34, 50, 8, 3);
    g.fillStyle(0x2f2f2f, 1);
    for (let i = 0; i < 7; i++) {
      g.fillRect(4 + i * 7, 4, 3, 4);
      g.fillRect(4 + i * 7, 36, 3, 4);
    }

    // hull
    g.fillStyle(0x3a4a2d, 1);
    g.fillRoundedRect(4, 10, 46, 24, 4);
    g.lineStyle(1.5, 0x1f2a17, 1);
    g.strokeRoundedRect(4, 10, 46, 24, 4);

    // turret
    g.fillStyle(0x2c3a21, 1);
    g.fillRoundedRect(18, 14, 22, 16, 3);

    // long barrel
    g.fillStyle(0x202020, 1);
    g.fillRoundedRect(28, 20, 30, 4, 1);
    g.fillStyle(0x333333, 1);
    g.fillRect(52, 18, 6, 8);

    // marker
    g.fillStyle(0xc8102e, 1);
    g.fillCircle(28, 22, 3);

    g.generateTexture('artillery', w, h);
    g.destroy();
  }

  private buildSparkTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('spark', 8, 8);
    g.destroy();
  }

  // --- Spawning ---
  private startSpawning() {
    this.spawnTimer?.remove(false);
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnInterval,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true,
    });
  }

  private spawnEnemy() {
    if (!this.gameActive) return;
    const { width } = this.scale;
    const x = Phaser.Math.Between(30, width - 30);

    const roll = Math.random();
    const kind: EnemyKind = roll < 0.55 ? 'tank' : roll < 0.85 ? 'apc' : 'artillery';
    const cfg = ENEMY_TABLE[kind];

    const enemy = this.enemies.create(x, -40, cfg.texture) as Phaser.Physics.Arcade.Sprite;
    enemy.setScale(cfg.scale);
    enemy.setDepth(3);
    enemy.setVelocityY(this.enemySpeed * cfg.speedMultiplier);
    enemy.setData('points', cfg.points);
    enemy.setData('hp', cfg.hp);

    // subtle wobble
    this.tweens.add({
      targets: enemy,
      x: enemy.x + Phaser.Math.Between(-8, 8),
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // --- Input / strike ---
  private handleTap(pointer: Phaser.Input.Pointer) {
    if (!this.gameActive) return;
    const { width, height } = this.scale;

    const startX = Phaser.Math.Clamp(pointer.x, 30, width - 30);
    const startY = height - 10;
    const drone = this.drones.create(startX, startY, 'drone') as Phaser.Physics.Arcade.Sprite;
    drone.setDepth(6);
    drone.setScale(0.9);

    const angle = Phaser.Math.Angle.Between(drone.x, drone.y, pointer.x, pointer.y);
    const speed = 480;
    drone.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    drone.setRotation(angle + Math.PI / 2);

    this.attachTrail(drone);

    this.time.delayedCall(3500, () => {
      if (drone.active) drone.destroy();
    });
  }

  private attachTrail(drone: Phaser.Physics.Arcade.Sprite) {
    const emitter = this.add.particles(0, 0, 'spark', {
      follow: drone,
      lifespan: 320,
      speed: 0,
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.9, end: 0 },
      frequency: 28,
      tint: [0xffd700, 0x0057b7, 0xffffff],
      blendMode: 'ADD',
    });
    emitter.setDepth(4);
    drone.once('destroy', () => emitter.destroy());
  }

  private handleHit = (
    droneObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ) => {
    const drone = droneObj as Phaser.Physics.Arcade.Sprite;
    const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
    if (!drone.active || !enemy.active) return;

    const ex = enemy.x;
    const ey = enemy.y;
    const points = (enemy.getData('points') as number | undefined) ?? 10;
    let hp = (enemy.getData('hp') as number | undefined) ?? 1;

    drone.destroy();

    hp -= 1;
    if (hp > 0) {
      enemy.setData('hp', hp);
      this.cameras.main.shake(60, 0.003);
      this.explode(ex, ey, 0xffaa00, 8);
      return;
    }

    enemy.destroy();
    this.score += points;
    this.scoreText.setText(`Score: ${this.score}`);
    this.explode(ex, ey);
    this.cameras.main.shake(120, 0.006);

    this.floatText(ex, ey, `+${points}`);
  };

  private explode(x: number, y: number, tint = 0xff6611, count = 22) {
    const burst = this.add.particles(x, y, 'spark', {
      lifespan: 600,
      speed: { min: 80, max: 240 },
      scale: { start: 1.6, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [tint, 0xffd700, 0xffffff],
      quantity: count,
      blendMode: 'ADD',
      emitting: false,
    });
    burst.setDepth(7);
    burst.explode(count);
    this.time.delayedCall(800, () => burst.destroy());

    const shock = this.add.circle(x, y, 6, tint, 0.55).setDepth(6);
    this.tweens.add({
      targets: shock,
      scale: 6,
      alpha: 0,
      duration: 360,
      onComplete: () => shock.destroy(),
    });
  }

  private floatText(x: number, y: number, text: string) {
    const t = this.add
      .text(x, y, text, {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '18px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(8);
    this.tweens.add({
      targets: t,
      y: y - 40,
      alpha: 0,
      duration: 700,
      onComplete: () => t.destroy(),
    });
  }

  private loseLife() {
    if (!this.gameActive) return;
    this.lives = Math.max(this.lives - 1, 0);
    this.livesText.setText(this.hearts());
    this.cameras.main.flash(180, 255, 80, 80);
    if (this.lives <= 0) this.gameOver();
  }

  private gameOver() {
    this.gameActive = false;
    this.spawnTimer?.remove(false);
    this.enemies.getChildren().forEach((obj: Phaser.GameObjects.GameObject) => {
      const e = obj as Phaser.Physics.Arcade.Sprite;
      e.setVelocity(0, 0);
    });

    const { width, height } = this.scale;
    const overlay = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0)
      .setDepth(20);

    const title = this.add
      .text(width / 2, height / 2 - 60, 'Слава Україні!', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '30px',
        color: '#ffd700',
        stroke: '#0057b7',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(21);

    const sub = this.add
      .text(width / 2, height / 2 - 14, `Score: ${this.score}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(21);

    const btn = this.add
      .text(width / 2, height / 2 + 50, '  Restart  ', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '22px',
        color: '#0057b7',
        backgroundColor: '#ffd700',
        padding: { left: 16, right: 16, top: 8, bottom: 8 },
      })
      .setOrigin(0.5)
      .setDepth(21)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerup', () => {
      // Consume the pointer so it doesn't also trigger a strike spawn after restart
      this.time.delayedCall(50, () => this.scene.restart());
    });

    // Fade-in
    [overlay, title, sub, btn].forEach((o) => (o as any).setAlpha(0));
    this.tweens.add({ targets: [overlay, title, sub, btn], alpha: 1, duration: 300 });

    // Reset for next session
    this.events.once('shutdown', () => {
      this.score = 0;
      this.lives = 3;
      this.gameActive = true;
      this.enemySpeed = 75;
      this.spawnInterval = 1400;
      this.rampTimer = 0;
    });
  }

  private onResize = (gameSize: Phaser.Structs.Size) => {
    this.cameras.resize(gameSize.width, gameSize.height);
    this.hudBg.setSize(gameSize.width, 44);
    this.livesText.setX(gameSize.width - 14);
    this.drawFrontLine();
  };
}

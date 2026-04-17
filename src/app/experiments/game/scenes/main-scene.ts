import * as Phaser from 'phaser';

import { SoundEngine } from './sound-engine';

type EnemyKind = 'tank' | 'apc' | 'artillery' | 'aa' | 'heavy';

interface EnemyConfig {
  texture: string;
  speedMultiplier: number;
  hp: number;
  points: number;
  scale: number;
  shotInterval?: number; // ms; set for shooters
}

const ENEMY_TABLE: Record<EnemyKind, EnemyConfig> = {
  tank: { texture: 'tank', speedMultiplier: 1.0, hp: 1, points: 10, scale: 1 },
  apc: { texture: 'apc', speedMultiplier: 1.7, hp: 1, points: 15, scale: 1 },
  artillery: { texture: 'artillery', speedMultiplier: 0.65, hp: 2, points: 25, scale: 1.1 },
  aa: { texture: 'aa', speedMultiplier: 0.8, hp: 2, points: 30, scale: 1, shotInterval: 1600 },
  heavy: { texture: 'heavy', speedMultiplier: 0.5, hp: 3, points: 40, scale: 1.15 },
};

interface DronePath {
  x0: number;
  y0: number;
  tx: number;
  ty: number;
  peak: number;
  start: number;
  duration: number;
}

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
  private cooldownBar!: Phaser.GameObjects.Rectangle;

  private frontLine!: Phaser.GameObjects.Graphics;
  private chargeIndicator?: Phaser.GameObjects.Graphics;

  private enemySpeed = 75;
  private spawnInterval = 1400;
  private spawnTimer?: Phaser.Time.TimerEvent;

  private sfx = new SoundEngine();

  private chargeStart = 0;
  private isCharging = false;
  private nextLaunchTime = 0;

  private readonly COOLDOWN_MS = 500;
  private readonly MIN_RANGE = 160;
  private readonly MAX_RANGE_FACTOR = 1.1; // * screen diagonal
  private readonly MAX_CHARGE_MS = 900;

  constructor() {
    super('main');
  }

  create() {
    this.buildTextures();
    this.drawBackground();
    this.drawHud();

    this.enemies = this.physics.add.group();
    this.drones = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();

    this.physics.add.overlap(
      this.drones,
      this.enemies,
      this.handleHit as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.enemyBullets,
      this.drones,
      this.handleDroneShot as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.input.on('pointerdown', this.handleDown, this);
    this.input.on('pointermove', this.handleMove, this);
    this.input.on('pointerup', this.handleUp, this);
    this.input.on('pointerupoutside', this.handleUp, this);

    this.startSpawning();

    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.onResize, this);
      this.sfx.dispose();
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

    this.updateDrones();

    const lineY = this.getFrontLineY();
    this.enemies.getChildren().forEach((obj: Phaser.GameObjects.GameObject) => {
      const e = obj as Phaser.Physics.Arcade.Sprite;
      if (!e.active) return;

      // Shoot if the enemy is a shooter and already on screen
      const interval = e.getData('shotInterval') as number | undefined;
      if (interval) {
        const nextShot = (e.getData('nextShot') as number) ?? 0;
        if (this.time.now >= nextShot && e.y > 50 && e.y < lineY - 10) {
          this.fireEnemyShot(e);
          e.setData('nextShot', this.time.now + interval);
        }
      }

      if (e.y >= lineY) {
        this.loseLife();
        this.explode(e.x, e.y, 0x66aaff);
        e.destroy();
      }
    });

    this.enemyBullets.getChildren().forEach((obj: Phaser.GameObjects.GameObject) => {
      const b = obj as Phaser.Physics.Arcade.Sprite;
      if (!b.active) return;
      if (b.y < -20) b.destroy();
    });

    // Cooldown bar
    const remaining = Math.max(0, this.nextLaunchTime - this.time.now);
    const ready = 1 - Math.min(remaining / this.COOLDOWN_MS, 1);
    this.cooldownBar.setScale(ready, 1);
    this.cooldownBar.setFillStyle(ready >= 1 ? 0xffd700 : 0x6e5200);

    if (this.isCharging) {
      const p = this.input.activePointer;
      const hold = this.time.now - this.chargeStart;
      const t = Math.min(hold / this.MAX_CHARGE_MS, 1);
      this.showChargeIndicator(p.x, p.y, t);
    }
  }

  // ------- Background / HUD -------

  private drawBackground() {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x0b1422).setOrigin(0);
    this.add.rectangle(0, 0, width, height * 0.5, 0x15233d).setOrigin(0).setAlpha(0.6);

    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height * 0.9);
      const r = Phaser.Math.FloatBetween(0.5, 1.8);
      this.add.circle(x, y, r, 0xffffff, Phaser.Math.FloatBetween(0.15, 0.5));
    }

    const lineY = this.getFrontLineY();
    this.add.rectangle(0, lineY, width, height - lineY, 0x1a1107).setOrigin(0).setAlpha(0.85);

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
    const { width, height } = this.scale;
    this.hudBg = this.add
      .rectangle(0, 0, width, 44, 0x000000, 0.35)
      .setOrigin(0)
      .setDepth(9);
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

    // Cooldown strip along the bottom edge — base (tank garage)
    this.cooldownBar = this.add
      .rectangle(0, height - 4, width, 4, 0xffd700)
      .setOrigin(0, 0)
      .setDepth(10);

    // Launch-point marker at the bottom-center
    const marker = this.add.graphics().setDepth(9);
    marker.fillStyle(0xffd700, 0.7);
    marker.fillCircle(width / 2, height - 10, 5);
    marker.lineStyle(2, 0x0057b7, 0.8);
    marker.strokeCircle(width / 2, height - 10, 10);
    marker.setData('launchMarker', true);
  }

  private hearts() {
    return '\u2764'.repeat(Math.max(this.lives, 0));
  }

  // ------- Textures -------

  private buildTextures() {
    this.buildDroneTexture();
    this.buildTankTexture();
    this.buildApcTexture();
    this.buildArtilleryTexture();
    this.buildAaTexture();
    this.buildHeavyTexture();
    this.buildSparkTexture();
    this.buildEnemyBulletTexture();
  }

  private buildDroneTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.lineStyle(3, 0x2a2a2a, 1);
    g.strokeLineShape(new Phaser.Geom.Line(6, 6, 38, 34));
    g.strokeLineShape(new Phaser.Geom.Line(38, 6, 6, 34));

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

    g.fillStyle(0xffd700, 1);
    g.fillRoundedRect(12, 12, 20, 8, 3);
    g.fillStyle(0x0057b7, 1);
    g.fillRoundedRect(12, 20, 20, 8, 3);
    g.lineStyle(1.5, 0x000000, 0.5);
    g.strokeRoundedRect(12, 12, 20, 16, 3);

    g.fillStyle(0xff2233, 1);
    g.fillCircle(22, 20, 2.4);

    g.generateTexture('drone', 44, 40);
    g.destroy();
  }

  private buildTankTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x1a1a1a, 1);
    g.fillRoundedRect(2, 0, 48, 8, 3);
    g.fillRoundedRect(2, 36, 48, 8, 3);
    g.fillStyle(0x333333, 1);
    for (let i = 0; i < 6; i++) {
      g.fillRect(4 + i * 8, 2, 4, 4);
      g.fillRect(4 + i * 8, 38, 4, 4);
    }
    g.fillStyle(0x3f5038, 1);
    g.fillRoundedRect(4, 8, 44, 28, 4);
    g.lineStyle(1.5, 0x22301d, 1);
    g.strokeRoundedRect(4, 8, 44, 28, 4);
    g.fillStyle(0x334229, 1);
    g.fillCircle(26, 22, 10);
    g.lineStyle(1.5, 0x1e2917, 1);
    g.strokeCircle(26, 22, 10);
    g.fillStyle(0x222222, 1);
    g.fillRoundedRect(26, 20, 26, 4, 1);
    g.fillStyle(0xc8102e, 1);
    g.fillCircle(26, 22, 3);
    g.generateTexture('tank', 52, 44);
    g.destroy();
  }

  private buildApcTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x1a1a1a, 1);
    for (let i = 0; i < 4; i++) {
      g.fillCircle(8 + i * 10, 4, 4);
      g.fillCircle(8 + i * 10, 30, 4);
    }
    g.fillStyle(0x4a5b44, 1);
    g.fillRoundedRect(2, 6, 44, 22, 4);
    g.lineStyle(1.5, 0x2b3527, 1);
    g.strokeRoundedRect(2, 6, 44, 22, 4);
    g.fillStyle(0x1a1f17, 1);
    g.fillRect(8, 13, 28, 4);
    g.fillStyle(0x32402b, 1);
    g.fillRoundedRect(18, 20, 12, 6, 2);
    g.fillRect(30, 22, 14, 2);
    g.fillStyle(0xc8102e, 1);
    g.fillCircle(24, 23, 2.2);
    g.generateTexture('apc', 48, 34);
    g.destroy();
  }

  private buildArtilleryTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x1a1a1a, 1);
    g.fillRoundedRect(2, 2, 50, 8, 3);
    g.fillRoundedRect(2, 34, 50, 8, 3);
    g.fillStyle(0x2f2f2f, 1);
    for (let i = 0; i < 7; i++) {
      g.fillRect(4 + i * 7, 4, 3, 4);
      g.fillRect(4 + i * 7, 36, 3, 4);
    }
    g.fillStyle(0x3a4a2d, 1);
    g.fillRoundedRect(4, 10, 46, 24, 4);
    g.lineStyle(1.5, 0x1f2a17, 1);
    g.strokeRoundedRect(4, 10, 46, 24, 4);
    g.fillStyle(0x2c3a21, 1);
    g.fillRoundedRect(18, 14, 22, 16, 3);
    g.fillStyle(0x202020, 1);
    g.fillRoundedRect(28, 20, 30, 4, 1);
    g.fillStyle(0x333333, 1);
    g.fillRect(52, 18, 6, 8);
    g.fillStyle(0xc8102e, 1);
    g.fillCircle(28, 22, 3);
    g.generateTexture('artillery', 58, 44);
    g.destroy();
  }

  private buildAaTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    // Wheels
    g.fillStyle(0x1a1a1a, 1);
    for (let i = 0; i < 4; i++) {
      g.fillCircle(8 + i * 10, 30, 5);
    }
    // Body (dark olive)
    g.fillStyle(0x33402a, 1);
    g.fillRoundedRect(2, 16, 46, 14, 3);
    g.lineStyle(1.5, 0x1a2313, 1);
    g.strokeRoundedRect(2, 16, 46, 14, 3);
    // Turret base
    g.fillStyle(0x404f2f, 1);
    g.fillRoundedRect(15, 10, 20, 10, 3);
    // Twin AA barrels (angled up)
    g.fillStyle(0x222222, 1);
    g.fillRect(17, -2, 3, 14);
    g.fillRect(30, -2, 3, 14);
    g.fillStyle(0x555555, 1);
    g.fillRect(16, -2, 5, 3);
    g.fillRect(29, -2, 5, 3);
    // Radar dish
    g.fillStyle(0x888888, 1);
    g.fillCircle(25, 13, 2.2);
    // Enemy marker
    g.fillStyle(0xc8102e, 1);
    g.fillCircle(40, 22, 2.2);
    g.generateTexture('aa', 50, 38);
    g.destroy();
  }

  private buildHeavyTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    // Wide tracks
    g.fillStyle(0x141414, 1);
    g.fillRoundedRect(2, 0, 60, 10, 3);
    g.fillRoundedRect(2, 44, 60, 10, 3);
    g.fillStyle(0x2d2d2d, 1);
    for (let i = 0; i < 8; i++) {
      g.fillRect(4 + i * 7, 2, 4, 5);
      g.fillRect(4 + i * 7, 47, 4, 5);
    }
    // Hull
    g.fillStyle(0x2c3825, 1);
    g.fillRoundedRect(4, 10, 56, 34, 5);
    g.lineStyle(2, 0x101811, 1);
    g.strokeRoundedRect(4, 10, 56, 34, 5);
    // Side armor plates
    g.fillStyle(0x3a4a2c, 1);
    g.fillRect(4, 18, 56, 2);
    g.fillRect(4, 34, 56, 2);
    // Turret (big)
    g.fillStyle(0x253017, 1);
    g.fillRoundedRect(18, 16, 30, 22, 4);
    g.lineStyle(1.5, 0x101811, 1);
    g.strokeRoundedRect(18, 16, 30, 22, 4);
    // Long thick barrel
    g.fillStyle(0x1a1a1a, 1);
    g.fillRoundedRect(34, 25, 30, 6, 2);
    g.fillStyle(0x2a2a2a, 1);
    g.fillRect(60, 23, 4, 10);
    // Commander hatch
    g.fillStyle(0x445522, 1);
    g.fillCircle(25, 22, 3);
    // Enemy marker
    g.fillStyle(0xc8102e, 1);
    g.fillCircle(32, 28, 3);
    g.generateTexture('heavy', 66, 54);
    g.destroy();
  }

  private buildSparkTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('spark', 8, 8);
    g.destroy();
  }

  private buildEnemyBulletTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x551100, 1);
    g.fillCircle(6, 8, 5);
    g.fillStyle(0xff4400, 1);
    g.fillCircle(6, 8, 3.5);
    g.fillStyle(0xffdd66, 1);
    g.fillCircle(6, 8, 1.6);
    // trailing tail
    g.fillStyle(0xff4400, 0.55);
    g.fillTriangle(2, 8, 10, 8, 6, 16);
    g.generateTexture('enemyBullet', 12, 18);
    g.destroy();
  }

  // ------- Spawning -------

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
    let kind: EnemyKind;
    if (roll < 0.35) kind = 'tank';
    else if (roll < 0.55) kind = 'apc';
    else if (roll < 0.72) kind = 'artillery';
    else if (roll < 0.88) kind = 'aa';
    else kind = 'heavy';
    const cfg = ENEMY_TABLE[kind];

    const enemy = this.enemies.create(x, -40, cfg.texture) as Phaser.Physics.Arcade.Sprite;
    enemy.setScale(cfg.scale);
    enemy.setDepth(3);
    enemy.setVelocityY(this.enemySpeed * cfg.speedMultiplier);
    enemy.setData('points', cfg.points);
    enemy.setData('hp', cfg.hp);
    if (cfg.shotInterval) {
      enemy.setData('shotInterval', cfg.shotInterval);
      enemy.setData('nextShot', this.time.now + Phaser.Math.Between(800, 1800));
    }

    this.tweens.add({
      targets: enemy,
      x: enemy.x + Phaser.Math.Between(-8, 8),
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ------- Input / drone launch -------

  private handleDown(pointer: Phaser.Input.Pointer) {
    if (!this.gameActive) return;
    if (this.time.now < this.nextLaunchTime) return;
    this.sfx.resume();
    this.chargeStart = this.time.now;
    this.isCharging = true;
    this.showChargeIndicator(pointer.x, pointer.y, 0);
  }

  private handleMove(pointer: Phaser.Input.Pointer) {
    if (!this.isCharging) return;
    const hold = this.time.now - this.chargeStart;
    const t = Math.min(hold / this.MAX_CHARGE_MS, 1);
    this.showChargeIndicator(pointer.x, pointer.y, t);
  }

  private handleUp(pointer: Phaser.Input.Pointer) {
    if (!this.isCharging) return;
    this.isCharging = false;
    this.hideChargeIndicator();
    if (!this.gameActive) return;

    const hold = this.time.now - this.chargeStart;
    const charge = Math.min(hold / this.MAX_CHARGE_MS, 1);
    const { width, height } = this.scale;
    const diagonal = Math.hypot(width, height);
    const maxRange = this.MIN_RANGE + (diagonal * this.MAX_RANGE_FACTOR - this.MIN_RANGE) * charge;

    const x0 = width / 2;
    const y0 = height - 10;
    let tx = pointer.x;
    let ty = pointer.y;
    const dx = tx - x0;
    const dy = ty - y0;
    const dist = Math.hypot(dx, dy);
    if (dist > maxRange) {
      const s = maxRange / dist;
      tx = x0 + dx * s;
      ty = y0 + dy * s;
    }

    this.launchDrone(x0, y0, tx, ty);
    this.nextLaunchTime = this.time.now + this.COOLDOWN_MS;
    this.sfx.launch();
  }

  private launchDrone(x0: number, y0: number, tx: number, ty: number) {
    const drone = this.drones.create(x0, y0, 'drone') as Phaser.Physics.Arcade.Sprite;
    drone.setScale(0.9).setDepth(6);
    const body = drone.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(0, 0);

    const dist = Math.hypot(tx - x0, ty - y0);
    const peak = Math.min(240, dist * 0.55);
    const duration = 450 + dist * 1.3;

    const path: DronePath = {
      x0,
      y0,
      tx,
      ty,
      peak,
      start: this.time.now,
      duration,
    };
    drone.setData('path', path);

    this.attachTrail(drone);
  }

  private updateDrones() {
    this.drones.getChildren().forEach((obj: Phaser.GameObjects.GameObject) => {
      const d = obj as Phaser.Physics.Arcade.Sprite;
      if (!d.active) return;
      const p = d.getData('path') as DronePath | undefined;
      if (!p) return;
      const t = (this.time.now - p.start) / p.duration;
      if (t >= 1) {
        this.explode(p.tx, p.ty, 0xaaaaaa, 10);
        d.destroy();
        return;
      }
      const x = p.x0 + (p.tx - p.x0) * t;
      const yStraight = p.y0 + (p.ty - p.y0) * t;
      const y = yStraight - p.peak * 4 * t * (1 - t);
      d.setPosition(x, y);

      const nt = Math.min(t + 0.02, 1);
      const nx = p.x0 + (p.tx - p.x0) * nt;
      const ny = p.y0 + (p.ty - p.y0) * nt - p.peak * 4 * nt * (1 - nt);
      d.setRotation(Math.atan2(ny - y, nx - x) + Math.PI / 2);
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

  // ------- Charge indicator -------

  private showChargeIndicator(x: number, y: number, t: number) {
    if (!this.chargeIndicator) {
      this.chargeIndicator = this.add.graphics().setDepth(11);
    }
    const g = this.chargeIndicator;
    g.clear();
    const radius = 22 + t * 30;
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0xffd700),
      Phaser.Display.Color.ValueToColor(0x0057b7),
      100,
      Math.round(t * 100)
    );
    const hex = Phaser.Display.Color.GetColor(c.r, c.g, c.b);
    g.lineStyle(3, hex, 0.9);
    g.strokeCircle(x, y, radius);
    g.lineStyle(4, 0xffffff, 0.7);
    g.beginPath();
    g.arc(x, y, radius + 5, -Math.PI / 2, -Math.PI / 2 + t * Math.PI * 2);
    g.strokePath();
    g.fillStyle(hex, 0.35);
    g.fillCircle(x, y, 5);
  }

  private hideChargeIndicator() {
    this.chargeIndicator?.clear();
  }

  // ------- Enemy shooting -------

  private fireEnemyShot(enemy: Phaser.Physics.Arcade.Sprite) {
    const b = this.enemyBullets.create(
      enemy.x,
      enemy.y - 14,
      'enemyBullet'
    ) as Phaser.Physics.Arcade.Sprite;
    b.setDepth(4);
    (b.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    b.setVelocity(0, -340);
    this.sfx.enemyShot();

    const flash = this.add.circle(enemy.x, enemy.y - 8, 6, 0xffaa00, 0.9).setDepth(5);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2.2,
      duration: 160,
      onComplete: () => flash.destroy(),
    });
  }

  // ------- Collision callbacks -------

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
      this.sfx.smallHit();
      return;
    }

    enemy.destroy();
    this.score += points;
    this.scoreText.setText(`Score: ${this.score}`);
    this.explode(ex, ey);
    this.cameras.main.shake(120, 0.006);
    this.floatText(ex, ey, `+${points}`);
    this.sfx.explosion();
  };

  private handleDroneShot = (
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    droneObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ) => {
    const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
    const drone = droneObj as Phaser.Physics.Arcade.Sprite;
    if (!bullet.active || !drone.active) return;
    this.explode(drone.x, drone.y, 0xff6600, 12);
    bullet.destroy();
    drone.destroy();
    this.sfx.droneDown();
  };

  // ------- FX helpers -------

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
    this.sfx.loseLife();
    if (this.lives <= 0) this.gameOver();
  }

  private gameOver() {
    this.gameActive = false;
    this.spawnTimer?.remove(false);
    this.enemies.getChildren().forEach((obj: Phaser.GameObjects.GameObject) => {
      const e = obj as Phaser.Physics.Arcade.Sprite;
      e.setVelocity(0, 0);
    });
    this.enemyBullets.getChildren().forEach((obj: Phaser.GameObjects.GameObject) => {
      const b = obj as Phaser.Physics.Arcade.Sprite;
      b.setVelocity(0, 0);
    });
    this.sfx.gameOver();

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
      this.time.delayedCall(50, () => this.scene.restart());
    });

    [overlay, title, sub, btn].forEach((o) => (o as Phaser.GameObjects.Components.AlphaSingle).setAlpha(0));
    this.tweens.add({ targets: [overlay, title, sub, btn], alpha: 1, duration: 300 });

    this.events.once('shutdown', () => {
      this.score = 0;
      this.lives = 3;
      this.gameActive = true;
      this.enemySpeed = 75;
      this.spawnInterval = 1400;
      this.rampTimer = 0;
      this.nextLaunchTime = 0;
      this.isCharging = false;
    });
  }

  private onResize = (gameSize: Phaser.Structs.Size) => {
    this.cameras.resize(gameSize.width, gameSize.height);
    this.hudBg.setSize(gameSize.width, 44);
    this.livesText.setX(gameSize.width - 14);
    this.cooldownBar.setPosition(0, gameSize.height - 4);
    this.cooldownBar.setSize(gameSize.width, 4);
    this.drawFrontLine();
  };
}

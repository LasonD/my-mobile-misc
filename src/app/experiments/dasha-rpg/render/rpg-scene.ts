import * as Phaser from 'phaser';

import { buildDashaTextures } from '../../dasha/scenes/dasha-sprite';
import { SoftSounds } from '../../dasha/scenes/soft-sounds';
import { getCharacter } from '../content/characters';
import { getLocation } from '../content/locations';
import { getQuest } from '../content/quests';
import { getScenario } from '../content/scenarios/index';
import { StoryEngine } from '../engine/story-engine';
import { AmbientPlayer, preloadAudio } from './audio-manager';
import { SaveManager } from './save-manager';
import {
  CharacterId,
  CharacterOnStage,
  Choice,
  DialogueLine,
  EngineEvents,
  LocationId,
  Position,
  QuestId,
  Scenario,
  SoundKey,
} from '../engine/types';
import { Voice } from './voice';

const POSITION_TO_FRAC: Record<Position, number> = {
  'far-left': 0.15,
  'left': 0.32,
  'center': 0.5,
  'right': 0.68,
  'far-right': 0.85,
};

export class RpgScene extends Phaser.Scene {
  private engine!: StoryEngine;
  private sfx = new SoftSounds();
  private voice = new Voice();
  private ambient?: AmbientPlayer;

  // Current location
  private locationId: LocationId | null = null;
  private locationObject: Phaser.GameObjects.GameObject | null = null;

  // Character widgets on stage, keyed by CharacterId
  private stage: Map<CharacterId, Phaser.GameObjects.GameObject> = new Map();

  // Dialogue UI
  private dialogueBox?: Phaser.GameObjects.Graphics;
  private speakerText?: Phaser.GameObjects.Text;
  private dialogueText?: Phaser.GameObjects.Text;
  private hintText?: Phaser.GameObjects.Text;
  private typewriterTimer?: Phaser.Time.TimerEvent;
  private typedChars = 0;
  private currentFullText = '';
  private typewriterDone = true;

  // Choices UI
  private choicesContainer?: Phaser.GameObjects.Container;

  // HUD
  private questBanner?: Phaser.GameObjects.Container;

  // Current dialog box height (dynamic). Used to compute stage-Y for characters.
  private dialogBoxH = 120;

  constructor() {
    super('rpg');
  }

  preload() {
    preloadAudio(this);
  }

  create(data: { scenarioId?: string; load?: boolean } = {}) {
    // Phaser re-uses the same scene instance across `scene.start` calls, so
    // class fields persist. Reset anything that tracks GameObjects or scene
    // state — otherwise stale refs make `onLocationChanged` / `onCharactersChanged`
    // skip re-rendering after a reset.
    this.locationId = null;
    this.locationObject = null;
    this.stage = new Map();
    this.dialogBoxH = 120;
    this.typedChars = 0;
    this.currentFullText = '';
    this.typewriterDone = true;

    buildDashaTextures(this);

    this.ambient = new AmbientPlayer(this);

    this.drawBaseBackground();
    this.buildDialogueUi();
    this.buildBackButton();

    // Always load the persisted global state (flags/stats accumulated across
    // scenarios) so cross-chapter callbacks still work. When `load` is false,
    // we discard the saved scenario pointer and start at the chosen scenario's
    // startNode instead.
    const saved = SaveManager.load();
    this.engine = new StoryEngine(saved ?? undefined);
    this.bindEngine();

    this.input.on('pointerdown', this.onPointerDown, this);
    this.scale.on('resize', this.onResize, this);

    this.events.once('shutdown', () => {
      this.sfx.dispose();
      this.voice.cancel();
      this.ambient?.dispose();
      this.typewriterTimer?.remove();
      this.scale.off('resize', this.onResize, this);
    });

    const scenarioId = data.scenarioId ?? saved?.currentScenario ?? 'first_day';
    const scenario = getScenario(scenarioId);
    if (!scenario) {
      throw new Error(`${scenarioId} scenario not registered`);
    }

    const resuming =
      !!data.load && !!saved && saved.currentScenario === scenarioId && !!saved.currentNode;

    if (resuming) {
      (this.engine as unknown as { scenario: unknown }).scenario = scenario;
      this.engine.state.currentScenario = scenario.id;
      this.engine.goto(saved!.currentNode!);
    } else {
      // Fresh start of this scenario, keep global state (flags/stats).
      this.engine.state.history = [];
      this.engine.start(scenario);
    }
  }

  // ---------------- Base background ----------------

  private drawBaseBackground() {
    const { width, height } = this.scale;
    this.add
      .rectangle(0, 0, width, height, 0x1a1220)
      .setOrigin(0)
      .setDepth(-10)
      .setData('role', 'void');
  }

  // ---------------- Engine bindings ----------------

  private bindEngine() {
    this.engine.on(EngineEvents.NodeEntered, () => SaveManager.save(this.engine.state));
    this.engine.on(EngineEvents.LocationChanged, this.onLocationChanged, this);
    this.engine.on(EngineEvents.CharactersChanged, this.onCharactersChanged, this);
    this.engine.on(EngineEvents.LineShown, this.onLineShown, this);
    this.engine.on(EngineEvents.ChoiceShown, this.onChoiceShown, this);
    this.engine.on(EngineEvents.QuestStarted, this.onQuestStarted, this);
    this.engine.on(EngineEvents.ObjectiveCompleted, this.onObjectiveCompleted, this);
    this.engine.on(EngineEvents.QuestCompleted, this.onQuestCompleted, this);
    this.engine.on(EngineEvents.ScenarioEnded, this.onScenarioEnded, this);
    this.engine.on(EngineEvents.SoundRequested, (payload: { sound: SoundKey }) =>
      this.playSfx(payload.sound)
    );
  }

  private buildBackButton() {
    const { width } = this.scale;
    const x = width - 16;
    const y = 14;
    const btn = this.add
      .text(x, y, '↩ меню', {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#baa6d4',
        fontStyle: 'italic',
        backgroundColor: '#1a1428',
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
      })
      .setOrigin(1, 0)
      .setDepth(35)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerup', () => this.scene.start('title'));
  }

  // ---------------- Input ----------------

  private onPointerDown() {
    this.sfx.resume();
    // Choices are clickable via their own handlers — tapping elsewhere is ignored.
    if (this.choicesContainer) return;
    if (!this.typewriterDone) {
      this.finishTypewriter();
      return;
    }
    this.engine.advance();
  }

  // ---------------- Location transitions ----------------

  private onLocationChanged(newId: LocationId) {
    if (newId === this.locationId) return;
    const def = getLocation(newId);
    if (!def) return;

    const oldLocation = this.locationObject;
    this.locationId = newId;

    // Cross-fade the ambient loop to match the new scenery.
    this.ambient?.playForLocation(newId);

    // Fade out characters briefly so they don't pop above new bg
    this.stage.forEach((o) => this.fadeOut(o as Phaser.GameObjects.Container));

    // Flash
    this.cameras.main.fadeOut(180, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      oldLocation?.destroy();
      this.locationObject = def.build(this);
      (this.locationObject as Phaser.GameObjects.Container).setDepth(-5);
      this.cameras.main.fadeIn(220, 0, 0, 0);
    });
  }

  private fadeOut(obj: Phaser.GameObjects.Container) {
    if (!obj) return;
    this.tweens.add({
      targets: obj,
      alpha: 0,
      duration: 140,
      onComplete: () => obj.destroy(),
    });
  }

  // ---------------- Character placement ----------------

  private onCharactersChanged(characters: CharacterOnStage[]) {
    const newIds = new Set(characters.map((c) => c.id));

    // Remove characters no longer on stage
    for (const [id, widget] of this.stage.entries()) {
      if (!newIds.has(id)) {
        this.slideOut(widget as Phaser.GameObjects.Container);
        this.stage.delete(id);
      }
    }

    // Characters sit on an invisible "stage" line that is 24 px above the
    // dialogue box top. Sprite origins are bottom-center so this keeps them
    // from being clipped by the text panel on any screen size.
    const stageY = this.scale.height - this.dialogBoxH - 24;

    // Add/update current characters
    for (const placement of characters) {
      const def = getCharacter(placement.id);
      if (!def) continue;
      const existing = this.stage.get(placement.id);
      const targetX = this.scale.width * POSITION_TO_FRAC[placement.position];
      const targetY = stageY;

      if (existing) {
        this.tweens.add({
          targets: existing,
          x: targetX,
          duration: 320,
          ease: 'Sine.easeInOut',
        });
      } else {
        const obj = placement.onPhone
          ? this.renderInPhone(def, placement.emotion)
          : (def.render(this, placement.emotion) as Phaser.GameObjects.Container);
        obj.setPosition(targetX, targetY + 40);
        obj.setAlpha(0);
        obj.setDepth(1);
        this.stage.set(placement.id, obj);
        this.tweens.add({
          targets: obj,
          y: targetY,
          alpha: 1,
          duration: 340,
          ease: 'Back.easeOut',
        });
      }
    }
  }

  /**
   * Wrap a character sprite inside a phone-frame overlay for video-call
   * scenes. The phone is anchored at Y=0 (same convention as full sprites),
   * so the caller places it on the stage line and the phone "stands" upward
   * to chest-level where the other character is holding it.
   */
  private renderInPhone(
    def: { render: (scene: Phaser.Scene, emotion: string | undefined) => Phaser.GameObjects.GameObject },
    emotion: string | undefined
  ): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);

    const phoneW = 110;
    const phoneH = 200;
    const corner = 14;

    const body = this.add.graphics();
    body.fillStyle(0x1a1220, 1);
    body.fillRoundedRect(-phoneW / 2, -phoneH, phoneW, phoneH, corner);
    body.lineStyle(2, 0x5a4a6a, 1);
    body.strokeRoundedRect(-phoneW / 2, -phoneH, phoneW, phoneH, corner);

    // Speaker notch on the top bezel.
    const notchW = 28;
    body.fillStyle(0x3a2a48, 1);
    body.fillRoundedRect(-notchW / 2, -phoneH + 7, notchW, 4, 2);

    // Screen inset.
    const screenInset = 6;
    const topBezel = 18;
    const bottomBezel = 14;
    const screenW = phoneW - screenInset * 2;
    const screenH = phoneH - topBezel - bottomBezel;
    const screenX = -screenW / 2;
    const screenY = -phoneH + topBezel;
    const screen = this.add.graphics();
    screen.fillStyle(0x0f0820, 1);
    screen.fillRect(screenX, screenY, screenW, screenH);

    // Home indicator bar at the bottom bezel.
    body.fillStyle(0x5a4a6a, 0.7);
    body.fillRoundedRect(-20, -bottomBezel + 5, 40, 3, 1.5);

    container.add([body, screen]);

    // Character sprite inside the screen, scaled down. Sprites are bottom-
    // center anchored, so place feet at the bottom of the screen area.
    const charSprite = def.render(this, emotion) as Phaser.GameObjects.Container;
    const scale = 0.62;
    charSprite.setScale(scale);
    charSprite.setPosition(0, screenY + screenH - 6);
    container.add(charSprite);

    return container;
  }

  private slideOut(obj: Phaser.GameObjects.Container) {
    if (!obj) return;
    this.tweens.add({
      targets: obj,
      y: obj.y + 40,
      alpha: 0,
      duration: 240,
      onComplete: () => obj.destroy(),
    });
  }

  private highlightSpeaker(speakerId?: CharacterId | 'narrator') {
    for (const [id, widget] of this.stage.entries()) {
      const obj = widget as Phaser.GameObjects.Container;
      const isSpeaker = id === speakerId;
      obj.setAlpha(1);
      this.tweens.killTweensOf(obj);
      this.tweens.add({
        targets: obj,
        scale: isSpeaker ? 1.0 : 0.88,
        duration: 180,
        ease: 'Sine.easeOut',
      });
    }
  }

  // ---------------- Dialogue UI ----------------

  private buildDialogueUi() {
    const { width } = this.scale;
    const pad = 16;

    this.dialogueBox = this.add.graphics().setDepth(20);

    this.speakerText = this.add
      .text(0, 0, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '19px',
        color: '#cdb4db',
        fontStyle: 'bold',
      })
      .setDepth(21);

    this.dialogueText = this.add
      .text(0, 0, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#fdf6f3',
        wordWrap: { width: width - pad * 2 - 32 },
        lineSpacing: 5,
      })
      .setDepth(21);

    this.hintText = this.add
      .text(0, 0, '— тап, щоб далі —', {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#baa6d4',
        fontStyle: 'italic',
      })
      .setOrigin(1, 0)
      .setDepth(21);

    this.tweens.add({
      targets: this.hintText,
      alpha: { from: 0.4, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    this.layoutDialogueBox('');
  }

  /**
   * Measures the wrapped dialogue text height, resizes the box to fit, and
   * repositions the speaker / hint labels. Returns the new box height so
   * callers can reposition characters above it.
   */
  private layoutDialogueBox(fullText: string): number {
    const { width, height } = this.scale;
    const pad = 16;
    const innerPadX = 16;
    const speakerH = 22;
    const gapAfterSpeaker = 14;
    const hintH = 26;

    // Measure with the full (not typed) text so the box doesn't jitter.
    const prev = this.dialogueText?.text ?? '';
    this.dialogueText?.setText(fullText || ' ');
    const textH = this.dialogueText?.height ?? 0;
    this.dialogueText?.setText(prev);

    const contentH = speakerH + gapAfterSpeaker + textH + hintH + 14; // +14 top pad
    const minH = 96;
    const maxH = Math.min(260, height * 0.42);
    const boxH = Math.max(minH, Math.min(maxH, contentH));
    const boxY = height - boxH - 12;

    const g = this.dialogueBox;
    if (g) {
      g.clear();
      g.fillStyle(0x1a1428, 0.88);
      g.fillRoundedRect(pad, boxY, width - pad * 2, boxH, 16);
      g.lineStyle(3, 0xcdb4db, 1);
      g.strokeRoundedRect(pad, boxY, width - pad * 2, boxH, 16);
    }

    this.speakerText?.setPosition(pad + innerPadX, boxY + 12);
    this.dialogueText?.setPosition(pad + innerPadX, boxY + 12 + speakerH + gapAfterSpeaker - 4);
    this.hintText?.setPosition(width - pad - innerPadX, boxY + boxH - 22);

    this.dialogBoxH = boxH;
    return boxH;
  }

  private repositionStage() {
    const stageY = this.scale.height - this.dialogBoxH - 24;
    for (const [, widget] of this.stage.entries()) {
      const obj = widget as Phaser.GameObjects.Container;
      this.tweens.add({
        targets: obj,
        y: stageY,
        duration: 260,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private onLineShown(payload: { line: DialogueLine; index: number; total: number }) {
    const { line } = payload;
    const speakerId = line.speaker ?? 'narrator';
    const def = getCharacter(speakerId);
    const name = def?.name ?? '';
    const nameColor = def?.color ? '#' + def.color.toString(16).padStart(6, '0') : '#cdb4db';

    this.speakerText?.setText(name);
    this.speakerText?.setColor(nameColor);

    this.highlightSpeaker(speakerId);

    this.voice.say(line.text, def?.voice);
    this.playSfx('page');

    this.typedChars = 0;
    this.currentFullText = line.text;
    this.typewriterDone = false;
    this.dialogueText?.setText('');

    // Resize the dialog box to fit the new line, then glide characters above it.
    this.layoutDialogueBox(line.text);
    this.repositionStage();
    this.typewriterTimer?.remove();
    this.typewriterTimer = this.time.addEvent({
      delay: 24,
      loop: true,
      callback: () => {
        this.typedChars++;
        this.dialogueText?.setText(this.currentFullText.slice(0, this.typedChars));
        if (this.typedChars >= this.currentFullText.length) {
          this.finishTypewriter();
        }
      },
    });
  }

  private finishTypewriter() {
    this.typedChars = this.currentFullText.length;
    this.dialogueText?.setText(this.currentFullText);
    this.typewriterDone = true;
    this.typewriterTimer?.remove();
    this.typewriterTimer = undefined;
  }

  // ---------------- Choices UI ----------------

  private onChoiceShown(choices: Choice[]) {
    this.choicesContainer?.destroy();
    const { width, height } = this.scale;
    const container = this.add.container(0, 0).setDepth(25);
    const btnW = Math.min(width * 0.86, 500);
    const innerW = btnW - 36;
    const padX = 18;
    const padY = 12;
    const gapBetween = 12;
    const gapLabelHint = 4;

    // Build labels first so we can compute each button's height from wrapped
    // text. Then stack them bottom-up above the dialog box.
    type ChoiceLayout = {
      label: Phaser.GameObjects.Text;
      hint?: Phaser.GameObjects.Text;
      btnH: number;
    };
    const layouts: ChoiceLayout[] = choices.map((choice) => {
      const label = this.add
        .text(0, 0, choice.text, {
          fontFamily: 'Georgia, serif',
          fontSize: '16px',
          color: '#fdf6f3',
          wordWrap: { width: innerW },
          lineSpacing: 2,
        })
        .setDepth(26);
      let hint: Phaser.GameObjects.Text | undefined;
      if (choice.hint) {
        hint = this.add
          .text(0, 0, choice.hint, {
            fontFamily: 'Georgia, serif',
            fontSize: '13px',
            color: '#baa6d4',
            fontStyle: 'italic',
            wordWrap: { width: innerW },
          })
          .setDepth(26);
      }
      const contentH = label.height + (hint ? gapLabelHint + hint.height : 0);
      const btnH = Math.max(48, contentH + padY * 2);
      return { label, hint, btnH };
    });

    // Place stack so it finishes 20px above the top of the dialog box.
    const totalH =
      layouts.reduce((sum, l) => sum + l.btnH, 0) + gapBetween * (layouts.length - 1);
    const dialogTop = height - this.dialogBoxH - 12;
    let cursorY = Math.max(16, dialogTop - 20 - totalH);

    // Zones are created non-interactive and enabled only after the fade-in
    // completes. Without this, a pointerdown that advanced the dialogue also
    // lingers as a pointerup, which then fires on a choice button the engine
    // just mounted — the player selects an option they didn't read.
    const zones: Phaser.GameObjects.Zone[] = [];

    layouts.forEach((layout, idx) => {
      const x = (width - btnW) / 2;
      const y = cursorY;
      const { btnH, label, hint } = layout;

      const bg = this.add.graphics().setDepth(25);
      bg.fillStyle(0x1f1630, 0.95);
      bg.fillRoundedRect(x, y, btnW, btnH, 10);
      bg.lineStyle(2, 0xcdb4db, 1);
      bg.strokeRoundedRect(x, y, btnW, btnH, 10);

      label.setPosition(x + padX, y + padY);
      hint?.setPosition(x + padX, y + padY + label.height + gapLabelHint);

      const zone = this.add.zone(x, y, btnW, btnH).setOrigin(0);
      const hoverTargets: Phaser.GameObjects.GameObject[] = hint
        ? [bg, label, hint]
        : [bg, label];
      zone.on('pointerover', () => {
        this.tweens.add({ targets: hoverTargets, alpha: 0.8, duration: 120 });
      });
      zone.on('pointerout', () => {
        this.tweens.add({ targets: hoverTargets, alpha: 1, duration: 120 });
      });
      zone.on('pointerup', () => this.handleChoice(choices, idx));
      zones.push(zone);

      const children: Phaser.GameObjects.GameObject[] = hint
        ? [bg, label, hint, zone]
        : [bg, label, zone];
      container.add(children);

      cursorY += btnH + gapBetween;
    });

    this.choicesContainer = container;
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 220,
      onComplete: () => {
        for (const z of zones) z.setInteractive({ useHandCursor: true });
      },
    });
    this.playSfx('pop');
  }

  private handleChoice(choices: Choice[], index: number) {
    this.choicesContainer?.destroy();
    this.choicesContainer = undefined;
    this.playSfx('good');
    this.engine.choose(choices, index);
  }

  // ---------------- Quest HUD ----------------

  private onQuestStarted(payload: { quest: QuestId }) {
    const quest = getQuest(payload.quest);
    if (!quest) return;
    this.showBanner(`Новий квест · ${quest.title}`, 0xcdb4db);
  }

  private onObjectiveCompleted(payload: { quest: QuestId; objective: string }) {
    const quest = getQuest(payload.quest);
    const obj = quest?.objectives.find((o) => o.id === payload.objective);
    if (!obj) return;
    this.showBanner(`✓ ${obj.description}`, 0x8ed29a);
    this.playSfx('levelUp');
  }

  private onQuestCompleted(payload: { quest: QuestId }) {
    const quest = getQuest(payload.quest);
    if (!quest) return;
    this.showBanner(`Квест завершено · ${quest.title}`, 0xffd36a);
    this.playSfx('finale');
  }

  private showBanner(text: string, color: number) {
    this.questBanner?.destroy();
    const { width } = this.scale;
    const bannerY = 14;
    const padX = 14;

    const container = this.add.container(0, bannerY).setDepth(30);
    const bg = this.add.graphics();
    const hex = color;
    bg.fillStyle(0x1a1428, 0.9);
    bg.lineStyle(2, hex, 1);
    const label = this.add
      .text(0, 0, text, {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#fdf6f3',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    const innerW = label.width + padX * 2;
    const innerH = label.height + 10;
    const x = (width - innerW) / 2;
    bg.fillRoundedRect(x, 0, innerW, innerH, 8);
    bg.strokeRoundedRect(x, 0, innerW, innerH, 8);
    label.setPosition(x + padX, innerH / 2);

    container.add([bg, label]);
    container.setY(-innerH);
    this.tweens.add({ targets: container, y: bannerY, duration: 280, ease: 'Back.easeOut' });
    this.tweens.add({
      targets: container,
      y: -innerH,
      duration: 400,
      delay: 2400,
      onComplete: () => container.destroy(),
    });
    this.questBanner = container;
  }

  // ---------------- End of scenario ----------------

  private onScenarioEnded(scenario?: Scenario) {
    const { width, height } = this.scale;
    const headline = scenario?.epilogue?.headline ?? `Кінець · ${scenario?.title ?? 'сценарію'}`;
    const lines = scenario?.epilogue?.lines ?? [];

    // Opaque curtain — fully covers the scene so nothing bleeds through.
    const curtain = this.add
      .rectangle(0, 0, width, height, 0x0e0818, 0)
      .setOrigin(0)
      .setDepth(40);
    this.tweens.add({ targets: curtain, alpha: 0.96, duration: 450 });

    // Panel geometry: centered, max ~560px wide, capped to 90% of screen.
    const panelW = Math.min(560, width - 32);
    const panelX = (width - panelW) / 2;
    const padX = 22;
    const padY = 22;
    const contentW = panelW - padX * 2;

    // Build all text objects first to measure total panel height.
    const title = this.add
      .text(0, 0, headline, {
        fontFamily: 'Georgia, serif',
        fontSize: '26px',
        color: '#cdb4db',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: contentW },
      })
      .setOrigin(0.5, 0)
      .setDepth(42)
      .setAlpha(0);

    const divider = this.add.graphics().setDepth(42).setAlpha(0);

    const lineObjects: Phaser.GameObjects.Text[] = lines.map((text) =>
      this.add
        .text(0, 0, text, {
          fontFamily: 'Georgia, serif',
          fontSize: '15px',
          color: '#fdf6f3',
          wordWrap: { width: contentW },
          lineSpacing: 4,
        })
        .setDepth(42)
        .setAlpha(0)
    );

    const btnLabel = '  До меню  ';
    const btn = this.add
      .text(0, 0, btnLabel, {
        fontFamily: 'Georgia, serif',
        fontSize: '17px',
        color: '#1a1428',
        backgroundColor: '#cdb4db',
        padding: { left: 18, right: 18, top: 10, bottom: 10 },
      })
      .setOrigin(0.5, 0)
      .setDepth(42)
      .setAlpha(0)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerup', () => this.scene.start('title'));

    const gapAfterTitle = 14;
    const dividerH = 10;
    const gapBetweenLines = 10;
    const gapBeforeBtn = 24;
    const linesH = lineObjects.reduce(
      (sum, l, i) => sum + l.height + (i > 0 ? gapBetweenLines : 0),
      0
    );
    const panelH =
      padY * 2 + title.height + gapAfterTitle + dividerH + linesH + gapBeforeBtn + btn.height;
    const panelY = Math.max(24, (height - panelH) / 2);

    // Panel background
    const panelBg = this.add.graphics().setDepth(41).setAlpha(0);
    panelBg.fillStyle(0x1a1428, 1);
    panelBg.fillRoundedRect(panelX, panelY, panelW, panelH, 18);
    panelBg.lineStyle(3, 0xcdb4db, 1);
    panelBg.strokeRoundedRect(panelX, panelY, panelW, panelH, 18);

    // Position texts
    title.setPosition(width / 2, panelY + padY);
    const dividerY = panelY + padY + title.height + gapAfterTitle;
    divider.lineStyle(1, 0xcdb4db, 0.4);
    divider.lineBetween(panelX + padX + 24, dividerY, panelX + panelW - padX - 24, dividerY);

    let cursorY = dividerY + dividerH;
    lineObjects.forEach((lineObj, i) => {
      if (i > 0) cursorY += gapBetweenLines;
      lineObj.setPosition(panelX + padX, cursorY);
      cursorY += lineObj.height;
    });

    btn.setPosition(width / 2, cursorY + gapBeforeBtn);

    // Cascade fade-in: panel → title → lines → button
    this.tweens.add({ targets: panelBg, alpha: 1, duration: 320, delay: 280 });
    this.tweens.add({ targets: title, alpha: 1, duration: 300, delay: 500 });
    this.tweens.add({ targets: divider, alpha: 1, duration: 300, delay: 640 });
    lineObjects.forEach((obj, i) => {
      this.tweens.add({ targets: obj, alpha: 1, duration: 280, delay: 760 + i * 180 });
    });
    this.tweens.add({
      targets: btn,
      alpha: 1,
      duration: 300,
      delay: 760 + lineObjects.length * 180 + 120,
    });

    this.playSfx('finale');
  }

  // ---------------- Resize ----------------

  private onResize = (gameSize: Phaser.Structs.Size) => {
    this.cameras.resize(gameSize.width, gameSize.height);
    this.layoutDialogueBox(this.currentFullText);
    this.repositionStage();
  };

  // ---------------- Audio ----------------

  private playSfx(key: SoundKey) {
    switch (key) {
      case 'pop':
        this.sfx.pop();
        break;
      case 'good':
        this.sfx.good();
        break;
      case 'bonus':
        this.sfx.bonus();
        break;
      case 'insight':
        this.sfx.insight();
        break;
      case 'wrong':
        this.sfx.wrong();
        break;
      case 'miss':
        this.sfx.miss();
        break;
      case 'page':
        this.sfx.page();
        break;
      case 'levelUp':
        this.sfx.levelUp();
        break;
      case 'finale':
        this.sfx.finale();
        break;
    }
  }
}

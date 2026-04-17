import * as Phaser from 'phaser';

import { buildDashaTextures } from '../../dasha/scenes/dasha-sprite';
import { SoftSounds } from '../../dasha/scenes/soft-sounds';
import { getCharacter } from '../content/characters';
import { getLocation } from '../content/locations';
import { getQuest } from '../content/quests';
import { getScenario } from '../content/scenarios/index';
import { StoryEngine } from '../engine/story-engine';
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

  constructor() {
    super('rpg');
  }

  create(data: { scenarioId?: string; load?: boolean } = {}) {
    buildDashaTextures(this);

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

    // Characters sit on an invisible "stage" line that is 12 px above the
    // dialogue box top. Sprite origins are bottom-center so this keeps them
    // from being clipped by the text panel on any screen size.
    const dialogBoxH = Math.min(240, this.scale.height * 0.38);
    const stageY = this.scale.height - dialogBoxH - 24;

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
        const obj = def.render(this, placement.emotion) as Phaser.GameObjects.Container;
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
    const { width, height } = this.scale;
    const boxH = Math.min(240, height * 0.38);
    const boxY = height - boxH - 12;
    const pad = 16;

    this.dialogueBox = this.add.graphics().setDepth(20);
    this.redrawDialogueBox();

    this.speakerText = this.add
      .text(pad + 16, boxY + 14, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '19px',
        color: '#cdb4db',
        fontStyle: 'bold',
      })
      .setDepth(21);

    this.dialogueText = this.add
      .text(pad + 16, boxY + 50, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#fdf6f3',
        wordWrap: { width: width - pad * 2 - 32 },
        lineSpacing: 5,
      })
      .setDepth(21);

    this.hintText = this.add
      .text(width - pad - 16, boxY + boxH - 26, '— тап, щоб далі —', {
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
  }

  private redrawDialogueBox() {
    const { width, height } = this.scale;
    const boxH = Math.min(240, height * 0.38);
    const boxY = height - boxH - 12;
    const pad = 16;
    const g = this.dialogueBox;
    if (!g) return;
    g.clear();
    g.fillStyle(0x1a1428, 0.88);
    g.fillRoundedRect(pad, boxY, width - pad * 2, boxH, 16);
    g.lineStyle(3, 0xcdb4db, 1);
    g.strokeRoundedRect(pad, boxY, width - pad * 2, boxH, 16);
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
    const startY = height * 0.18;
    const btnW = Math.min(width * 0.86, 500);
    const gap = 14;

    choices.forEach((choice, idx) => {
      const y = startY + idx * (56 + gap);
      const x = (width - btnW) / 2;

      const bg = this.add.graphics();
      bg.fillStyle(0x1f1630, 0.95);
      bg.fillRoundedRect(x, y, btnW, 56, 10);
      bg.lineStyle(2, 0xcdb4db, 1);
      bg.strokeRoundedRect(x, y, btnW, 56, 10);

      const textStr = choice.hint ? `${choice.text}\n${choice.hint}` : choice.text;
      const label = this.add
        .text(x + 18, y + 10, textStr, {
          fontFamily: 'Georgia, serif',
          fontSize: '16px',
          color: '#fdf6f3',
          lineSpacing: 2,
        })
        .setDepth(26);
      if (choice.hint) {
        // Style the hint part (second line) differently — hack: split into two texts
        label.setText(choice.text);
        const hintLbl = this.add
          .text(x + 18, y + 32, choice.hint, {
            fontFamily: 'Georgia, serif',
            fontSize: '13px',
            color: '#baa6d4',
            fontStyle: 'italic',
          })
          .setDepth(26);
        container.add(hintLbl);
      }

      const zone = this.add
        .zone(x, y, btnW, 56)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => {
        this.tweens.add({ targets: [bg, label], alpha: 0.8, duration: 120 });
      });
      zone.on('pointerout', () => {
        this.tweens.add({ targets: [bg, label], alpha: 1, duration: 120 });
      });
      zone.on('pointerup', () => this.handleChoice(choices, idx));

      container.add([bg, label, zone]);
    });

    this.choicesContainer = container;
    container.setAlpha(0);
    this.tweens.add({ targets: container, alpha: 1, duration: 220 });
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

  private onScenarioEnded() {
    const { width, height } = this.scale;
    const overlay = this.add
      .rectangle(0, 0, width, height, 0x000000, 0)
      .setOrigin(0)
      .setDepth(40);
    this.tweens.add({ targets: overlay, alpha: 0.7, duration: 500 });

    this.add
      .text(width / 2, height / 2 - 30, 'Кінець сценарію', {
        fontFamily: 'Georgia, serif',
        fontSize: '28px',
        color: '#cdb4db',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(41);

    const btn = this.add
      .text(width / 2, height / 2 + 30, '  До меню  ', {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#1a1428',
        backgroundColor: '#cdb4db',
        padding: { left: 14, right: 14, top: 8, bottom: 8 },
      })
      .setOrigin(0.5)
      .setDepth(41)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerup', () => this.scene.start('title'));

    this.playSfx('finale');
  }

  // ---------------- Resize ----------------

  private onResize = (gameSize: Phaser.Structs.Size) => {
    this.cameras.resize(gameSize.width, gameSize.height);
    this.redrawDialogueBox();
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

import * as Phaser from 'phaser';

import { evaluate, applyAll } from './evaluators';
import {
  CharacterOnStage,
  Choice,
  DialogueLine,
  EngineEvents,
  Effect,
  GameState,
  NodeId,
  Scenario,
  StoryNode,
  createInitialState,
} from './types';

/**
 * Rendering-agnostic story state machine.
 * Emits events via Phaser.Events.EventEmitter — subscribe from your scene
 * or UI layer. The engine never touches the DOM or the canvas.
 */
export class StoryEngine extends Phaser.Events.EventEmitter {
  readonly state: GameState;
  private scenario: Scenario | null = null;
  private node: StoryNode | null = null;
  private lineIndex = 0;
  private waitingForChoice = false;
  private finished = false;

  constructor(initialState: GameState = createInitialState()) {
    super();
    this.state = initialState;
  }

  /** Begin a scenario at its startNode. */
  start(scenario: Scenario) {
    this.scenario = scenario;
    this.state.currentScenario = scenario.id;
    this.finished = false;
    this.goto(scenario.startNode);
  }

  /** Move to a named node. Resolves condition/redirect chains. */
  goto(nodeId: NodeId) {
    if (!this.scenario) throw new Error('No scenario loaded');

    // Follow redirect chain (bounded for safety).
    let currentId = nodeId;
    for (let hop = 0; hop < 16; hop++) {
      const node = this.scenario.nodes[currentId];
      if (!node) throw new Error(`Unknown node: ${currentId}`);
      if (node.condition && !evaluate(node.condition, this.state)) {
        if (!node.redirect) {
          throw new Error(`Node "${currentId}" condition failed with no redirect`);
        }
        currentId = node.redirect;
        continue;
      }
      this.enterNode(currentId, node);
      return;
    }
    throw new Error(`Redirect loop starting at ${nodeId}`);
  }

  private enterNode(id: NodeId, node: StoryNode) {
    // Exit handler for previous node
    if (this.node) {
      const prevId = this.state.currentNode;
      this.applyEffects(this.node.onExit);
      this.emit(EngineEvents.NodeExited, prevId);
    }

    this.node = node;
    this.state.currentNode = id;
    this.state.visited.add(id);
    this.state.history.push(id);
    this.lineIndex = 0;
    this.waitingForChoice = false;

    // Apply onEnter effects
    this.applyEffects(node.onEnter);

    // Fire frame-level events (scene uses these to update visuals)
    this.emit(EngineEvents.NodeEntered, { id, node });
    if (node.location) {
      this.emit(EngineEvents.LocationChanged, node.location);
    }
    if (node.characters) {
      this.emit(EngineEvents.CharactersChanged, node.characters);
    }

    // If node has dialogue, show first line. Otherwise, treat dialogue as done.
    if (node.dialogue && node.dialogue.length > 0) {
      this.emit(EngineEvents.LineShown, {
        line: node.dialogue[0],
        index: 0,
        total: node.dialogue.length,
      });
      this.applyEffects(node.dialogue[0].effects);
    } else {
      this.onDialogueFinished();
    }
  }

  /**
   * Called by the UI when the player taps to continue past the current line.
   * If more lines remain, shows the next one. Otherwise, finishes dialogue
   * (which either shows choices or auto-advances via `next`).
   */
  advance() {
    if (!this.node || this.finished) return;
    if (this.waitingForChoice) return;

    const total = this.node.dialogue?.length ?? 0;
    if (this.lineIndex + 1 < total) {
      this.lineIndex++;
      const line = this.node.dialogue![this.lineIndex];
      this.emit(EngineEvents.LineShown, {
        line,
        index: this.lineIndex,
        total,
      });
      this.applyEffects(line.effects);
      return;
    }

    this.onDialogueFinished();
  }

  private onDialogueFinished() {
    if (!this.node) return;
    this.emit(EngineEvents.DialogueFinished);

    const visibleChoices = (this.node.choices ?? []).filter((c) =>
      c.condition ? evaluate(c.condition, this.state) : true
    );

    if (visibleChoices.length > 0) {
      this.waitingForChoice = true;
      this.emit(EngineEvents.ChoiceShown, visibleChoices);
      return;
    }

    if (this.node.next) {
      const next = this.node.next;
      this.goto(next);
      return;
    }

    // Scenario end
    this.finished = true;
    this.emit(EngineEvents.ScenarioEnded);
  }

  /** Select a visible choice by its array index (as shown in ChoiceShown). */
  choose(visibleChoices: Choice[], index: number) {
    if (!this.waitingForChoice) return;
    const choice = visibleChoices[index];
    if (!choice) return;
    this.waitingForChoice = false;
    this.applyEffects(choice.effects);
    this.goto(choice.next);
  }

  // ---- helpers ----

  private applyEffects(effects: Effect[] | undefined) {
    const changes = applyAll(effects, this.state);
    for (const c of changes) {
      switch (c.kind) {
        case 'add_stat':
        case 'set_stat':
          this.emit(EngineEvents.StatChanged, c.payload);
          break;
        case 'set_flag':
        case 'clear_flag':
          this.emit(EngineEvents.FlagChanged, c.payload);
          break;
        case 'start_quest':
          this.emit(EngineEvents.QuestStarted, c.payload);
          break;
        case 'complete_quest':
          this.emit(EngineEvents.QuestCompleted, c.payload);
          break;
        case 'complete_objective':
          this.emit(EngineEvents.ObjectiveCompleted, c.payload);
          break;
        case 'play_sound':
          this.emit(EngineEvents.SoundRequested, c.payload);
          break;
      }
    }
  }

  /** For render-side scene peeking at the current node for restoration. */
  peekNode(): { id: NodeId; node: StoryNode } | null {
    if (!this.node || !this.state.currentNode) return null;
    return { id: this.state.currentNode, node: this.node };
  }

  peekCurrentLine(): DialogueLine | null {
    if (!this.node || !this.node.dialogue) return null;
    return this.node.dialogue[this.lineIndex] ?? null;
  }

  peekCharacters(): CharacterOnStage[] {
    return this.node?.characters ?? [];
  }
}

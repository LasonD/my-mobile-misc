/**
 * Core types for the Dasha RPG visual-novel engine.
 *
 * Design goals:
 *  - Scenarios are declarative data graphs (nodes), not imperative code.
 *  - All branching goes through Condition nodes; all mutation goes through Effect nodes.
 *  - The engine is rendering-agnostic; the Phaser scene subscribes to engine events.
 */

export type CharacterId = string;
export type LocationId = string;
export type NodeId = string;
export type ScenarioId = string;
export type QuestId = string;
export type FlagId = string;
export type StatId = string;
export type VariableKey = string;
export type EmotionId = string;

// ---------------- Game State ----------------

export interface GameState {
  flags: Record<FlagId, boolean>;
  stats: Record<StatId, number>;
  variables: Record<VariableKey, string | number>;
  visited: Set<NodeId>;
  quests: Record<QuestId, QuestProgress>;
  currentScenario: ScenarioId | null;
  currentNode: NodeId | null;
  history: NodeId[];
}

export interface QuestProgress {
  state: 'active' | 'completed' | 'failed';
  completedObjectives: Set<string>;
  startedAt?: NodeId;
}

export function createInitialState(): GameState {
  return {
    flags: {},
    stats: {},
    variables: {},
    visited: new Set(),
    quests: {},
    currentScenario: null,
    currentNode: null,
    history: [],
  };
}

// ---------------- Effects (mutate state) ----------------

export type Effect =
  | { kind: 'set_flag'; flag: FlagId; value?: boolean }
  | { kind: 'clear_flag'; flag: FlagId }
  | { kind: 'add_stat'; stat: StatId; delta: number }
  | { kind: 'set_stat'; stat: StatId; value: number }
  | { kind: 'set_var'; key: VariableKey; value: string | number }
  | { kind: 'start_quest'; quest: QuestId }
  | { kind: 'complete_objective'; quest: QuestId; objective: string }
  | { kind: 'complete_quest'; quest: QuestId }
  | { kind: 'fail_quest'; quest: QuestId }
  | { kind: 'play_sound'; sound: SoundKey };

// ---------------- Conditions (read state) ----------------

export type Condition =
  | { kind: 'flag'; flag: FlagId; value?: boolean }
  | { kind: 'stat_gte'; stat: StatId; value: number }
  | { kind: 'stat_lte'; stat: StatId; value: number }
  | { kind: 'stat_eq'; stat: StatId; value: number }
  | { kind: 'visited'; node: NodeId }
  | { kind: 'quest_active'; quest: QuestId }
  | { kind: 'quest_completed'; quest: QuestId }
  | { kind: 'all'; of: Condition[] }
  | { kind: 'any'; of: Condition[] }
  | { kind: 'not'; of: Condition };

// ---------------- Sound keys (from SoftSounds palette) ----------------

export type SoundKey =
  | 'pop'
  | 'good'
  | 'bonus'
  | 'insight'
  | 'wrong'
  | 'miss'
  | 'page'
  | 'levelUp'
  | 'finale';

// ---------------- Characters & Locations ----------------

export type Position = 'far-left' | 'left' | 'center' | 'right' | 'far-right';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  color?: number;
  /**
   * Builds a fresh GameObject for the current emotion. Scene owns it afterwards
   * (positions, tweens, destroys on exit). For Dasha returns her pixel-art sprite;
   * for others, an emoji-in-frame avatar container.
   */
  render: (scene: Phaser.Scene, emotion: EmotionId | undefined) => Phaser.GameObjects.GameObject;
  voice?: VoiceProfile;
  /** For UI tags — short bio shown in a future character log. */
  bio?: string;
}

export interface VoiceProfile {
  lang: string;
  pitch: number;
  rate: number;
  volume: number;
}

export interface CharacterOnStage {
  id: CharacterId;
  position: Position;
  emotion?: EmotionId;
  flip?: boolean;
}

export interface LocationDef {
  id: LocationId;
  name: string;
  /** Builds the background layer(s). Return value will be destroyed on transition. */
  build: (scene: Phaser.Scene) => Phaser.GameObjects.GameObject;
  /** Optional ambient tint for characters & UI. */
  tint?: number;
}

// ---------------- Dialogue & Choices ----------------

export interface DialogueLine {
  speaker?: CharacterId | 'narrator';
  text: string;
  emotion?: EmotionId;
  effects?: Effect[];
}

export interface Choice {
  text: string;
  next: NodeId;
  condition?: Condition;
  effects?: Effect[];
  /** Hint shown in parentheses to tell the player what this option signals. */
  hint?: string;
}

// ---------------- Story Nodes ----------------

export interface StoryNode {
  /** Set by the scenario builder; not required in the literal. */
  id?: NodeId;
  /** When entering this node, change to this location (with fade transition). */
  location?: LocationId;
  /** Who is on stage during this node. */
  characters?: CharacterOnStage[];
  /** Effects applied the moment this node becomes current. */
  onEnter?: Effect[];
  /** Sequential dialogue lines. */
  dialogue?: DialogueLine[];
  /** If present, engine waits for the player to pick a choice. */
  choices?: Choice[];
  /** If no choices, engine auto-advances to this node on tap past last line. */
  next?: NodeId;
  /** Effects applied when leaving (after dialogue, before next/choice). */
  onExit?: Effect[];
  /** If present and false, engine jumps to `redirect` instead of rendering this node. */
  condition?: Condition;
  redirect?: NodeId;
}

// ---------------- Scenarios ----------------

export interface Scenario {
  id: ScenarioId;
  title: string;
  startNode: NodeId;
  nodes: Record<NodeId, StoryNode>;
}

// ---------------- Quests ----------------

export interface QuestDef {
  id: QuestId;
  title: string;
  description: string;
  objectives: QuestObjective[];
}

export interface QuestObjective {
  id: string;
  description: string;
}

// ---------------- Engine event names ----------------

export const EngineEvents = {
  NodeEntered: 'node-entered',
  LineShown: 'line-shown',
  DialogueFinished: 'dialogue-finished',
  ChoiceShown: 'choice-shown',
  NodeExited: 'node-exited',
  LocationChanged: 'location-changed',
  CharactersChanged: 'characters-changed',
  QuestStarted: 'quest-started',
  QuestCompleted: 'quest-completed',
  ObjectiveCompleted: 'objective-completed',
  StatChanged: 'stat-changed',
  FlagChanged: 'flag-changed',
  SoundRequested: 'sound-requested',
  ScenarioEnded: 'scenario-ended',
} as const;

export type EngineEvent = (typeof EngineEvents)[keyof typeof EngineEvents];

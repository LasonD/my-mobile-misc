import { GameState } from '../engine/types';

const STORAGE_KEY = 'dasha-rpg-save-v1';

interface SerializedQuest {
  state: 'active' | 'completed' | 'failed';
  completedObjectives: string[];
  startedAt?: string;
}

interface SerializedState {
  flags: Record<string, boolean>;
  stats: Record<string, number>;
  variables: Record<string, string | number>;
  visited: string[];
  quests: Record<string, SerializedQuest>;
  currentScenario: string | null;
  currentNode: string | null;
  history: string[];
  metCharacters: string[];
  savedAt: number;
}

export class SaveManager {
  static exists(): boolean {
    try {
      return !!localStorage.getItem(STORAGE_KEY);
    } catch {
      return false;
    }
  }

  static save(state: GameState) {
    try {
      const quests: Record<string, SerializedQuest> = {};
      for (const id of Object.keys(state.quests)) {
        const q = state.quests[id];
        quests[id] = {
          state: q.state,
          completedObjectives: Array.from(q.completedObjectives),
          startedAt: q.startedAt,
        };
      }
      const payload: SerializedState = {
        flags: state.flags,
        stats: state.stats,
        variables: state.variables,
        visited: Array.from(state.visited),
        quests,
        currentScenario: state.currentScenario,
        currentNode: state.currentNode,
        history: state.history.slice(-40),
        metCharacters: Array.from(state.metCharacters),
        savedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota / privacy-mode errors
    }
  }

  static load(): GameState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SerializedState;
      const quests: GameState['quests'] = {};
      for (const id of Object.keys(parsed.quests ?? {})) {
        const q = parsed.quests[id];
        quests[id] = {
          state: q.state,
          completedObjectives: new Set(q.completedObjectives ?? []),
          startedAt: q.startedAt,
        };
      }
      return {
        flags: parsed.flags ?? {},
        stats: parsed.stats ?? {},
        variables: parsed.variables ?? {},
        visited: new Set(parsed.visited ?? []),
        quests,
        currentScenario: parsed.currentScenario ?? null,
        currentNode: parsed.currentNode ?? null,
        history: parsed.history ?? [],
        metCharacters: new Set(parsed.metCharacters ?? []),
      };
    } catch {
      return null;
    }
  }

  static summary(): SaveSummary | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SerializedState;
      const questsCompleted = Object.values(parsed.quests ?? {}).filter(
        (q) => q.state === 'completed'
      ).length;
      const nodesVisited = (parsed.visited ?? []).length;
      return {
        scenario: parsed.currentScenario,
        currentNode: parsed.currentNode,
        questsCompleted,
        nodesVisited,
        savedAt: parsed.savedAt,
      };
    } catch {
      return null;
    }
  }

  static clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

export interface SaveSummary {
  scenario: string | null;
  currentNode: string | null;
  questsCompleted: number;
  nodesVisited: number;
  savedAt: number;
}

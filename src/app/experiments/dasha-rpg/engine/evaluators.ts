import type { Condition, Effect, GameState, NodeId } from './types';

/** Evaluate a condition against the current game state. */
export function evaluate(cond: Condition | undefined, state: GameState): boolean {
  if (!cond) return true;
  switch (cond.kind) {
    case 'flag':
      return (state.flags[cond.flag] ?? false) === (cond.value ?? true);
    case 'stat_gte':
      return (state.stats[cond.stat] ?? 0) >= cond.value;
    case 'stat_lte':
      return (state.stats[cond.stat] ?? 0) <= cond.value;
    case 'stat_eq':
      return (state.stats[cond.stat] ?? 0) === cond.value;
    case 'visited':
      return state.visited.has(cond.node);
    case 'quest_active':
      return state.quests[cond.quest]?.state === 'active';
    case 'quest_completed':
      return state.quests[cond.quest]?.state === 'completed';
    case 'all':
      return cond.of.every((c) => evaluate(c, state));
    case 'any':
      return cond.of.some((c) => evaluate(c, state));
    case 'not':
      return !evaluate(cond.of, state);
  }
}

/**
 * Apply a single effect to the state. Returns a list of change descriptions
 * so the engine can fan out events (stat-changed, quest-started, etc.).
 */
export interface EffectChange {
  kind: Effect['kind'];
  payload: Record<string, unknown>;
}

export function apply(effect: Effect, state: GameState): EffectChange {
  switch (effect.kind) {
    case 'set_flag': {
      const value = effect.value ?? true;
      state.flags[effect.flag] = value;
      return { kind: effect.kind, payload: { flag: effect.flag, value } };
    }
    case 'clear_flag': {
      state.flags[effect.flag] = false;
      return { kind: effect.kind, payload: { flag: effect.flag, value: false } };
    }
    case 'add_stat': {
      const current = state.stats[effect.stat] ?? 0;
      state.stats[effect.stat] = current + effect.delta;
      return {
        kind: effect.kind,
        payload: { stat: effect.stat, previous: current, value: current + effect.delta },
      };
    }
    case 'set_stat': {
      const previous = state.stats[effect.stat] ?? 0;
      state.stats[effect.stat] = effect.value;
      return {
        kind: effect.kind,
        payload: { stat: effect.stat, previous, value: effect.value },
      };
    }
    case 'set_var': {
      state.variables[effect.key] = effect.value;
      return { kind: effect.kind, payload: { key: effect.key, value: effect.value } };
    }
    case 'start_quest': {
      if (!state.quests[effect.quest]) {
        state.quests[effect.quest] = {
          state: 'active',
          completedObjectives: new Set(),
        };
      }
      return { kind: effect.kind, payload: { quest: effect.quest } };
    }
    case 'complete_objective': {
      const q = state.quests[effect.quest];
      if (q) q.completedObjectives.add(effect.objective);
      return {
        kind: effect.kind,
        payload: { quest: effect.quest, objective: effect.objective },
      };
    }
    case 'complete_quest': {
      if (state.quests[effect.quest]) {
        state.quests[effect.quest].state = 'completed';
      }
      return { kind: effect.kind, payload: { quest: effect.quest } };
    }
    case 'fail_quest': {
      if (state.quests[effect.quest]) {
        state.quests[effect.quest].state = 'failed';
      }
      return { kind: effect.kind, payload: { quest: effect.quest } };
    }
    case 'play_sound':
      return { kind: effect.kind, payload: { sound: effect.sound } };
  }
}

export function applyAll(effects: Effect[] | undefined, state: GameState): EffectChange[] {
  if (!effects || !effects.length) return [];
  return effects.map((e) => apply(e, state));
}

/** Small helpers for authoring scenarios with less noise. */
export const fx = {
  flag: (flag: string, value = true): Effect => ({ kind: 'set_flag', flag, value }),
  clearFlag: (flag: string): Effect => ({ kind: 'clear_flag', flag }),
  stat: (stat: string, delta: number): Effect => ({ kind: 'add_stat', stat, delta }),
  setStat: (stat: string, value: number): Effect => ({ kind: 'set_stat', stat, value }),
  setVar: (key: string, value: string | number): Effect => ({ kind: 'set_var', key, value }),
  startQuest: (quest: string): Effect => ({ kind: 'start_quest', quest }),
  objective: (quest: string, objective: string): Effect => ({
    kind: 'complete_objective',
    quest,
    objective,
  }),
  completeQuest: (quest: string): Effect => ({ kind: 'complete_quest', quest }),
  failQuest: (quest: string): Effect => ({ kind: 'fail_quest', quest }),
  sound: (sound: Effect extends { kind: 'play_sound'; sound: infer S } ? S : never): Effect => ({
    kind: 'play_sound',
    sound,
  }),
};

export const cond = {
  flag: (flag: string, value = true): Condition => ({ kind: 'flag', flag, value }),
  statGte: (stat: string, value: number): Condition => ({ kind: 'stat_gte', stat, value }),
  statLte: (stat: string, value: number): Condition => ({ kind: 'stat_lte', stat, value }),
  statEq: (stat: string, value: number): Condition => ({ kind: 'stat_eq', stat, value }),
  visited: (node: NodeId): Condition => ({ kind: 'visited', node }),
  questActive: (quest: string): Condition => ({ kind: 'quest_active', quest }),
  questDone: (quest: string): Condition => ({ kind: 'quest_completed', quest }),
  all: (...of: Condition[]): Condition => ({ kind: 'all', of }),
  any: (...of: Condition[]): Condition => ({ kind: 'any', of }),
  not: (of: Condition): Condition => ({ kind: 'not', of }),
};

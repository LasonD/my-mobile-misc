import { cond } from '../../engine/evaluators';
import { FLAGS, QUESTS } from '../../engine/keys';
import { Scenario, ScenarioId, ScenarioMeta, ScenarioRegistration } from '../../engine/types';
import { FIRST_DAY } from './first-day';
import { SECOND_SATURDAY } from './second-saturday';

/**
 * Scenario registry. Each scenario is a graph of nodes; metadata describes how
 * it appears in the level-select list and whether it's locked.
 *
 * Scenarios are mostly independent: each one starts from its startNode, but
 * all of them share the global GameState. That lets a specific choice in one
 * scenario flip a flag that a later scenario reads via a `cond.flag(...)` to
 * show an alternative line. This keeps chapters composable.
 *
 * To add a new chapter:
 *   1. Create a new file exporting a `Scenario` constant.
 *   2. Register it below with its meta (`order`, `description`, optional `unlock`).
 *   3. Convention: the last node's `onEnter` should set `scenario_<id>_done`
 *      or complete a quest — put the matching condition in `meta.done`.
 */
export const SCENARIOS: Record<ScenarioId, ScenarioRegistration> = {
  [FIRST_DAY.id]: {
    scenario: FIRST_DAY,
    meta: {
      order: 1,
      description: 'Спогад про перший день у КШЕ. Два роки тому, 8:42, вул. Шпака, 3.',
      icon: '\u{1F4D6}', // 📖 (book — flashback)
      done: cond.questDone(QUESTS.FIRST_DAY),
    },
  },
  [SECOND_SATURDAY.id]: {
    scenario: SECOND_SATURDAY,
    meta: {
      order: 2,
      description: 'Субота, 8:15. Ліза спить, Олеся на обміні. Акти 1-2 готові; Акт 3 ще попереду.',
      icon: '\u{1F3E0}', // 🏠 (house)
      unlock: cond.questDone(QUESTS.FIRST_DAY),
      // Тимчасово: вважаємо сценарій пройденим після завершення Акту 2.
      // Буде замінено на справжній "scenario done" flag, коли Акт 3 буде готовим.
      done: cond.flag(FLAGS.ACT2_DONE),
    },
  },
};

/** Placeholder entries for upcoming chapters — show as locked. */
export const UPCOMING: ScenarioMeta[] = [
  {
    order: 3,
    description: 'Вихідні в Обухові. Саша, Golf, кіт Макс.',
    icon: '\u{1F431}', // 🐱
  },
  {
    order: 4,
    description: '«Що? Де? Коли?» — економічна версія. Перший вихід на сцену.',
    icon: '\u{1F3C6}', // 🏆
  },
];

export function getScenario(id: ScenarioId): Scenario | null {
  return SCENARIOS[id]?.scenario ?? null;
}

export function getScenarioMeta(id: ScenarioId): ScenarioMeta | null {
  return SCENARIOS[id]?.meta ?? null;
}

export function listScenarios(): ScenarioRegistration[] {
  return Object.values(SCENARIOS).sort((a, b) => a.meta.order - b.meta.order);
}

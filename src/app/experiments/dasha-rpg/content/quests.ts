import { QuestDef, QuestId } from '../engine/types';

/**
 * Registry of all quests. Scenarios reference these by id via
 * `start_quest`, `complete_objective`, `complete_quest` effects.
 */
export const QUESTS: Record<QuestId, QuestDef> = {
  first_day: {
    id: 'first_day',
    title: 'Перший день у КШЕ',
    description: 'Познайомитись, не загубитись, вижити.',
    objectives: [
      { id: 'pass_security', description: 'Пройти охорону на вході' },
      { id: 'meet_valeria', description: 'Знайти Валерію у лобі' },
      { id: 'attend_lecture', description: 'Потрапити на першу лекцію' },
      { id: 'survive_day', description: 'Пережити перший день' },
    ],
  },
};

export function getQuest(id: QuestId): QuestDef | null {
  return QUESTS[id] ?? null;
}

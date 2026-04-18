import { OBJECTIVES, QUESTS } from '../engine/keys';
import { QuestDef, QuestId } from '../engine/types';

/**
 * Registry of quest definitions (title/description/objectives). The actual
 * quest/objective string keys live in `engine/keys.ts` — this file just
 * attaches human-readable metadata to them.
 */
export const QUEST_DEFS: Record<QuestId, QuestDef> = {
  [QUESTS.FIRST_DAY]: {
    id: QUESTS.FIRST_DAY,
    title: 'Перший день у КШЕ',
    description: 'Познайомитись, не загубитись, вижити.',
    objectives: [
      { id: OBJECTIVES.PASS_SECURITY, description: 'Пройти охорону на вході' },
      { id: OBJECTIVES.MEET_YASYA, description: 'Знайти Ясю в лобі' },
      { id: OBJECTIVES.ATTEND_LECTURE, description: 'Потрапити на першу лекцію' },
      { id: OBJECTIVES.SURVIVE_DAY, description: 'Пережити перший день' },
    ],
  },
};

export function getQuest(id: QuestId): QuestDef | null {
  return QUEST_DEFS[id] ?? null;
}

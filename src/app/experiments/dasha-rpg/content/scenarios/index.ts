import { Scenario, ScenarioId } from '../../engine/types';
import { FIRST_DAY } from './first-day';

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  [FIRST_DAY.id]: FIRST_DAY,
};

export function getScenario(id: ScenarioId): Scenario | null {
  return SCENARIOS[id] ?? null;
}

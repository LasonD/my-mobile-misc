/**
 * Central registry of all flag, stat, quest, and objective string keys used
 * across scenarios. Authoring helpers (`fx.*`, `cond.*`) accept typed
 * references to these registries, so typos fail at compile time instead of
 * silently evaluating to `false` at runtime.
 *
 * To add a new key: append it here, then reference the constant from the
 * scenario file. Never write the raw string literal in scenario code.
 */

export const FLAGS = {
  POSTED_SELFIE: 'posted_selfie',
  SAID_PSYCHOLOGY: 'said_psychology',
  BOLD_INTRO: 'bold_intro',
  TEAMED_WITH_YASYA: 'teamed_with_yasya',
  COFFEE_FIRST: 'coffee_first',
  PUBLIC_SEX_CLAIM: 'public_sex_claim',
} as const;

export const STATS = {
  CHARISMA: 'charisma',
  STRESS: 'stress',
  REPUTATION: 'reputation',
} as const;

export const QUESTS = {
  FIRST_DAY: 'first_day',
} as const;

/**
 * Objectives are flat across quests. If two quests need an objective with
 * the same semantic name, rename one to disambiguate (e.g. `PASS_SECURITY_KSE`
 * vs `PASS_SECURITY_OFFICE`).
 */
export const OBJECTIVES = {
  PASS_SECURITY: 'pass_security',
  MEET_YASYA: 'meet_yasya',
  ATTEND_LECTURE: 'attend_lecture',
  SURVIVE_DAY: 'survive_day',
} as const;

export type KnownFlag = (typeof FLAGS)[keyof typeof FLAGS];
export type KnownStat = (typeof STATS)[keyof typeof STATS];
export type KnownQuest = (typeof QUESTS)[keyof typeof QUESTS];
export type KnownObjective = (typeof OBJECTIVES)[keyof typeof OBJECTIVES];

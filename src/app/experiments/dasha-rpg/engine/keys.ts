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
  // first_day
  POSTED_SELFIE: 'posted_selfie',
  SAID_PSYCHOLOGY: 'said_psychology',
  BOLD_INTRO: 'bold_intro',
  TEAMED_WITH_YASYA: 'teamed_with_yasya',
  COFFEE_FIRST: 'coffee_first',
  PUBLIC_SEX_CLAIM: 'public_sex_claim',

  // second_saturday — Act 1
  DOOR_HIT_IN_DARK: 'door_hit_in_dark',
  SATURDAY_LAUNDRY_RAN: 'saturday_laundry_ran',
  SATURDAY_LAUNDRY_WAITED: 'saturday_laundry_waited',
  SATURDAY_LAUNDRY_HANDWASH: 'saturday_laundry_handwash',

  // second_saturday — Act 2
  SATURDAY_APOLOGY: 'saturday_apology',
  SATURDAY_PUSHBACK: 'saturday_pushback',
  SATURDAY_DEFLECTED_JOKE: 'saturday_deflected_joke',
  DOOR_TALK_DIRECT: 'door_talk_direct',
  DOOR_TALK_DEFLECT: 'door_talk_deflect',
  DOOR_TALK_SERIOUS: 'door_talk_serious',
  LIZA_DOOR_REASON_KNOWN: 'liza_door_reason_known',
  ACT2_DONE: 'second_saturday_act2_done',

  // second_saturday — Act 3
  OLESYA_OVERWORK_SUSPECTED: 'olesya_overwork_suspected',
  OLESYA_ASKED_DIRECTLY: 'olesya_asked_directly',
  OLESYA_IGNORED_OVERWORK: 'olesya_ignored_overwork',
  OLESYA_LATER_MESSAGE: 'olesya_later_message',
  SCENARIO_SATURDAY_DONE: 'scenario_saturday_done',
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

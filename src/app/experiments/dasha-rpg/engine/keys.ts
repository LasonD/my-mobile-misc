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

  // second_saturday — local choices (one-node scope, not referenced elsewhere)
  SATURDAY_QUIET_HUMBLE: 'saturday_quiet_humble',
  SATURDAY_QUIET_REAL: 'saturday_quiet_real',
  SATURDAY_QUIET_CHALLENGE: 'saturday_quiet_challenge',
  SATURDAY_TAZ_PROUD: 'saturday_taz_proud',
  SATURDAY_TAZ_MODEST: 'saturday_taz_modest',
  SATURDAY_TAZ_TEASING: 'saturday_taz_teasing',
  SATURDAY_OLESYA_TIRED: 'saturday_olesya_tired',
  SATURDAY_OLESYA_MINIMAL: 'saturday_olesya_minimal',
  SATURDAY_OLESYA_PIVOT: 'saturday_olesya_pivot',
  SATURDAY_DOORS_ACCEPT: 'saturday_doors_accept',
  SATURDAY_DOORS_REMIND: 'saturday_doors_remind',
  SATURDAY_DOORS_OFFER_HUG: 'saturday_doors_offer_hug',

  // third_obukhiv — completion
  SCENARIO_OBUKHIV_DONE: 'scenario_obukhiv_done',

  // third_obukhiv — local choices (one-node scope)
  // Тон, яким Даша «приземлює» Сашину тривогу при зустрічі.
  OBUKHIV_ARRIVAL_WARM: 'obukhiv_arrival_warm',     // пряме «це я, не співбесіда»
  OBUKHIV_ARRIVAL_TEASE: 'obukhiv_arrival_tease',   // помічає прибирання, тепло
  OBUKHIV_ARRIVAL_CAT: 'obukhiv_arrival_cat',       // заземлює через Макса

  // Як Даша реагує на «у мене не було стола» — до того, як знаходять Максову платформу.
  OBUKHIV_TABLE_SOLVE: 'obukhiv_table_solve',       // встає, оглядає, знаходить сама
  OBUKHIV_TABLE_NORMALIZE: 'obukhiv_table_normalize', // словом нормалізує («дзеркало на стільці»)
  OBUKHIV_TABLE_TALKCAT: 'obukhiv_table_talkcat',   // звертається до Макса

  // Як Даша зустріне Сашину паніку від проковтнутої грудки васабі.
  OBUKHIV_WASABI_LAUGH: 'obukhiv_wasabi_laugh',     // відкритий сміх, разом
  OBUKHIV_WASABI_HELP: 'obukhiv_wasabi_help',       // дія: молоко/кефір
  OBUKHIV_WASABI_TEASE: 'obukhiv_wasabi_tease',     // м'який жарт «найкращий друг»

  // Як Даша обрамляє «чому» свого подарунка — квитків на «Діалог у темряві».
  OBUKHIV_GIFT_PRESENT: 'obukhiv_gift_present',     // про нас: «без екранів»
  OBUKHIV_GIFT_STORY: 'obukhiv_gift_story',         // особиста історія: була у вересні
  OBUKHIV_GIFT_CURIOUS: 'obukhiv_gift_curious',     // чесно про цікавість: «для мене теж»
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

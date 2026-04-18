import { fx } from '../../engine/evaluators';
import { FLAGS } from '../../engine/keys';
import { Scenario } from '../../engine/types';

/**
 * Субота, перший тиждень березня. Звичайний ранок у квартирі.
 * Олеся на обміні в США, Ліза вночі працювала в Ретровілі й спить.
 * Даша — одна з собою і побутом.
 *
 * Iterative build: Act 1 (ранок, одна в квартирі) готовий. Акти 2 і 3 —
 * `act1_end` заглушка, будуть додані пізніше. Див. SCENARIO_DRAFTS.md.
 */
export const SECOND_SATURDAY: Scenario = {
  id: 'second_saturday',
  title: 'Субота · Тиша до 11-ї',
  startNode: 'waking_dark',
  nodes: {
    // ---- Act 1: ранок, одна в квартирі ----

    waking_dark: {
      location: 'apartment_hallway_dark',
      characters: [{ id: 'dasha', position: 'center' }],
      dialogue: [
        { speaker: 'narrator', text: '8:15. Субота. Коридор.' },
        { speaker: 'narrator', text: 'Сонце вже встало, але до квартири ще не дійшло.' },
        { speaker: 'dasha', text: '(вставати. тихо. вставати тихо.)' },
        { speaker: 'dasha', text: '(туалет.)' },
      ],
      next: 'door_bump',
    },

    door_bump: {
      location: 'apartment_hallway_dark',
      characters: [{ id: 'dasha', position: 'center' }],
      onEnter: [fx.flag(FLAGS.DOOR_HIT_IN_DARK)],
      dialogue: [
        { speaker: 'narrator', text: '[БУМ]' },
        { speaker: 'dasha', text: '...' },
        { speaker: 'dasha', text: '(ну звісно. двері. знову двері.)' },
        { speaker: 'dasha', text: '(сьогодні — коліно. завтра — лоб. я заведу щоденник.)' },
        { speaker: 'dasha', text: '(ні. я не буду її будити через коліно. я краще за це.)' },
        { speaker: 'dasha', text: '(хоча мені дуже хочеться.)' },
      ],
      next: 'kitchen_thoughts',
    },

    kitchen_thoughts: {
      location: 'apartment_kitchen',
      characters: [{ id: 'dasha', position: 'center' }],
      dialogue: [
        { speaker: 'narrator', text: 'Кухня. Даша ставить чайник.' },
        { speaker: 'narrator', text: 'На порозі спальні — кошик для білизни.' },
        { speaker: 'narrator', text: 'Вісім кілограмів, як мінімум. Цикл — три з половиною години.' },
        { speaker: 'narrator', text: 'Ще немає дев\u2019ятої.' },
        { speaker: 'dasha', text: '(Ліза прийшла о 2:40. я чула каструлю.)' },
        { speaker: 'dasha', text: '(але я в цій квартирі не гість.)' },
        { speaker: 'dasha', text: '(...мама б у таз відмила. без обговорень.)' },
      ],
      choices: [
        {
          text: 'Запускати.',
          next: 'act1_end',
          effects: [fx.flag(FLAGS.SATURDAY_LAUNDRY_RAN)],
        },
        {
          text: 'Почекати до 11-ї.',
          next: 'act1_end',
          effects: [fx.flag(FLAGS.SATURDAY_LAUNDRY_WAITED)],
        },
        {
          text: 'Помити руками в тазу.',
          next: 'act1_end',
          effects: [fx.flag(FLAGS.SATURDAY_LAUNDRY_HANDWASH)],
        },
      ],
    },

    // ---- Заглушка: межа Акту 1 ----
    // Без `next` — engine емітить ScenarioEnded і гравця повертає в меню.

    act1_end: {
      location: 'apartment_kitchen',
      characters: [{ id: 'dasha', position: 'center' }],
      dialogue: [
        { speaker: 'narrator', text: '[Акт 1 завершено. Акт 2 — у розробці.]' },
      ],
    },
  },
  epilogue: {
    headline: 'Продовження слідує',
    lines: [
      'Ліза ще спить. Олеся прокидається в Чикаго.',
      'Пральна машина чекає рішення. Або вже не чекає.',
      '— Далі буде —',
    ],
  },
};

import { cond, fx } from '../../engine/evaluators';
import { FLAGS } from '../../engine/keys';
import { Scenario } from '../../engine/types';

/**
 * Субота, перший тиждень березня. Звичайний ранок у квартирі.
 * Олеся на обміні в США, Ліза вночі працювала в Ретровілі й спить.
 * Даша — одна з собою і побутом.
 *
 * Iterative build:
 *   Акт 1 — ранок одній у квартирі (waking_dark → door_bump → kitchen_thoughts).
 *   Акт 2 — Ліза прокидається, три вхідні гілки залежно від вибору про пральну машину,
 *            сходяться на розмові про двері.
 *   Акт 3 — ще в розробці; наприкінці `act2_end` сценарій завершується.
 *
 * Docs/планування: ../../SCENARIO_DRAFTS.md (розділ E).
 */
export const SECOND_SATURDAY: Scenario = {
  id: 'second_saturday',
  title: 'Субота · Тиша до 11-ї',
  startNode: 'waking_dark',
  nodes: {
    // =====================================================================
    // Акт 1 — ранок, одна в квартирі
    // =====================================================================

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
          next: 'noise_wake',
          effects: [fx.flag(FLAGS.SATURDAY_LAUNDRY_RAN)],
        },
        {
          text: 'Почекати до 11-ї.',
          next: 'quiet_morning',
          effects: [fx.flag(FLAGS.SATURDAY_LAUNDRY_WAITED)],
        },
        {
          text: 'Помити руками в тазу.',
          next: 'splash_wake',
          effects: [fx.flag(FLAGS.SATURDAY_LAUNDRY_HANDWASH)],
        },
      ],
    },

    // =====================================================================
    // Акт 2 — Ліза прокидається
    // =====================================================================

    // ---- Гілка RAN — пральна машина на повних обертах ----

    noise_wake: {
      location: 'apartment_kitchen',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'liza', position: 'right' },
      ],
      dialogue: [
        { speaker: 'narrator', text: '9:20. Пральна машина жухає на повних обертах.' },
        {
          speaker: 'narrator',
          text: 'У дверях кухні — Ліза. Волосся тугим вузлом. Тапці — лівий на правій.',
        },
        { speaker: 'liza', text: 'Дашка.' },
        { speaker: 'liza', text: 'Субота. Дев\u2019ята двадцять. Пральна машина.' },
        { speaker: 'liza', text: 'Я тебе люблю. Але серйозно?' },
      ],
      choices: [
        {
          text: 'Вибач. Я думала, до одинадцятої закінчиться.',
          next: 'liza_response',
          effects: [fx.flag(FLAGS.SATURDAY_APOLOGY)],
        },
        {
          text: 'Я теж у цій квартирі живу. Ти о 2-й приходиш — мені теж не спиться.',
          next: 'liza_response',
          effects: [fx.flag(FLAGS.SATURDAY_PUSHBACK)],
        },
        {
          text: 'Я встала о шостій. Пральна машина — це половина моїх нервів.',
          next: 'liza_response',
          effects: [fx.flag(FLAGS.SATURDAY_DEFLECTED_JOKE)],
        },
      ],
    },

    liza_response: {
      location: 'apartment_kitchen',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'liza', position: 'right' },
      ],
      dialogue: [
        // APOLOGY branch
        {
          condition: cond.flag(FLAGS.SATURDAY_APOLOGY),
          speaker: 'liza',
          text: 'Ок. Я знаю що не зі зла.',
        },
        {
          condition: cond.flag(FLAGS.SATURDAY_APOLOGY),
          speaker: 'liza',
          text: 'Зараз каву заварю — перезавантажусь.',
        },
        // PUSHBACK branch
        {
          condition: cond.flag(FLAGS.SATURDAY_PUSHBACK),
          speaker: 'liza',
          text: 'О. Ну. Я записую.',
        },
        {
          condition: cond.flag(FLAGS.SATURDAY_PUSHBACK),
          speaker: 'liza',
          text: 'О. Справедливо. Перший раз мене будять з контраргументом о 9:20.',
        },
        // DEFLECT branch
        {
          condition: cond.flag(FLAGS.SATURDAY_DEFLECTED_JOKE),
          speaker: 'liza',
          text: '«Половина моїх нервів.» Я цю фразу в тебе поцуплю.',
        },
        {
          condition: cond.flag(FLAGS.SATURDAY_DEFLECTED_JOKE),
          speaker: 'liza',
          text: 'І на чайових розкажу хлопцям. Ти мене не підведи.',
        },
        // Common
        { speaker: 'narrator', text: 'Ліза йде в туалет.' },
      ],
      next: 'kitchen_together',
    },

    // ---- Гілка WAITED — тиха кухня, Ліза прокидається сама ----

    quiet_morning: {
      location: 'apartment_kitchen',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'liza', position: 'right' },
      ],
      dialogue: [
        { speaker: 'narrator', text: '10:45. Чайник холодний удруге. Кошик досі на порозі.' },
        { speaker: 'narrator', text: 'Курсова перед Дашею — вже друга година.' },
        {
          speaker: 'dasha',
          text: '(87 джерел. 88-ме наснилось. воно було про Excel-шлюб.)',
        },
        { speaker: 'narrator', text: 'У коридорі — кроки. Легкі. Ліза жива.' },
        { speaker: 'liza', text: 'Добрий ранок. Хоча для мене зараз — ніч.' },
        { speaker: 'liza', text: 'Я чула — не вмикала машину.' },
        { speaker: 'liza', text: 'Ціню.' },
        { speaker: 'dasha', text: '(нічого. правда.)' },
        { speaker: 'narrator', text: 'Ліза йде в туалет.' },
      ],
      next: 'kitchen_together',
    },

    // ---- Гілка HANDWASH — плюскіт з ванної ----

    splash_wake: {
      location: 'apartment_kitchen',
      characters: [{ id: 'liza', position: 'center' }],
      dialogue: [
        { speaker: 'narrator', text: '10:45. З ванної — плюскіт.' },
        { speaker: 'narrator', text: 'Розмірений. Довгий. Не скоро закінчиться.' },
        { speaker: 'liza', text: '(...)' },
        { speaker: 'liza', text: '(це не дощ. у нас нема дощу. у нас штукатурка.)' },
        { speaker: 'narrator', text: 'Ліза встає, йде перевіряти.' },
      ],
      next: 'amused_liza',
    },

    amused_liza: {
      location: 'apartment_kitchen',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'liza', position: 'right' },
      ],
      dialogue: [
        {
          speaker: 'narrator',
          text: 'Ліза стоїть у дверях ванної. Даша — в нічній футболці, схилилась над тазом.',
        },
        { speaker: 'liza', text: 'Ти. Прала. В тазу.' },
        { speaker: 'dasha', text: 'Так.' },
        { speaker: 'liza', text: 'В 2026. В Києві. В тазу.' },
        { speaker: 'dasha', text: 'Мама так робила. Виявляється — працює.' },
        {
          speaker: 'liza',
          text: 'Я повинна це записати. «День, коли Даша Гак прала руками в березні 2026.»',
        },
        {
          speaker: 'narrator',
          text: 'Ліза повертається на кухню — поки Даша складає таз і витирає руки.',
        },
      ],
      next: 'kitchen_together',
    },

    // ---- Спільна середина ----

    kitchen_together: {
      location: 'apartment_kitchen',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'liza', position: 'right' },
      ],
      dialogue: [
        {
          speaker: 'narrator',
          text: 'Кухня. Лізин ритуал — чашка, кавоварка, маленький круглий мішечок.',
        },
        // Path-specific vibe line
        {
          condition: cond.flag(FLAGS.SATURDAY_LAUNDRY_RAN),
          speaker: 'narrator',
          text: 'Пральна машина ще жухає. Лишилось близько години.',
        },
        {
          condition: cond.flag(FLAGS.SATURDAY_LAUNDRY_WAITED),
          speaker: 'narrator',
          text: 'Тиша. Чайник засвистів і замовк.',
        },
        {
          condition: cond.flag(FLAGS.SATURDAY_LAUNDRY_HANDWASH),
          speaker: 'narrator',
          text: 'Таз — на балконі. Сушка повна.',
        },
        { speaker: 'liza', text: 'Мама передала цих мішечків минулого разу.' },
        { speaker: 'liza', text: 'Я рахую — як довго вистачить.' },
        // One-shot tonal variation: pushback = cooler offer
        {
          condition: cond.flag(FLAGS.SATURDAY_PUSHBACK),
          speaker: 'liza',
          text: 'Одну. Собі.',
        },
        {
          condition: cond.not(cond.flag(FLAGS.SATURDAY_PUSHBACK)),
          speaker: 'liza',
          text: 'Хочеш одну?',
        },
        {
          condition: cond.not(cond.flag(FLAGS.SATURDAY_PUSHBACK)),
          speaker: 'dasha',
          text: 'Одну. Так.',
        },
        // Bruise β-trigger — always fires (Dasha always hit the door in Act 1)
        {
          speaker: 'narrator',
          text: 'Ліза подає чашку. І тут помічає Дашине коліно — воно ще в шортах.',
        },
        { speaker: 'liza', text: 'Ти вдарилась. Знову двері?' },
      ],
      next: 'doors_talk',
    },

    doors_talk: {
      location: 'apartment_kitchen',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'liza', position: 'right' },
      ],
      dialogue: [
        { speaker: 'dasha', text: '(...)' },
      ],
      choices: [
        {
          text: 'Так. В темряві об них же. Двадцятий раз.',
          next: 'liza_inattention',
          effects: [fx.flag(FLAGS.DOOR_TALK_DIRECT)],
        },
        {
          text: 'Та нічого. Я нормально.',
          next: 'liza_inattention',
          effects: [fx.flag(FLAGS.DOOR_TALK_DEFLECT)],
        },
        {
          text: 'Лізо. Можемо про двері?',
          next: 'liza_inattention',
          effects: [fx.flag(FLAGS.DOOR_TALK_SERIOUS)],
        },
      ],
    },

    liza_inattention: {
      location: 'apartment_kitchen',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'liza', position: 'right' },
      ],
      onEnter: [fx.flag(FLAGS.LIZA_DOOR_REASON_KNOWN)],
      dialogue: [
        // DIRECT
        {
          condition: cond.flag(FLAGS.DOOR_TALK_DIRECT),
          speaker: 'liza',
          text: 'Ага.',
        },
        {
          condition: cond.flag(FLAGS.DOOR_TALK_DIRECT),
          speaker: 'liza',
          text: 'Я не знаю. Я просто не помічаю. Я приходжу, сплю як дуб.',
        },
        {
          condition: cond.flag(FLAGS.DOOR_TALK_DIRECT),
          speaker: 'liza',
          text: 'Завтра знову забуду. Вибач.',
        },
        // DEFLECT
        {
          condition: cond.flag(FLAGS.DOOR_TALK_DEFLECT),
          speaker: 'liza',
          text: 'Нормально — це коли не вдарилась.',
        },
        {
          condition: cond.flag(FLAGS.DOOR_TALK_DEFLECT),
          speaker: 'liza',
          text: 'Я не помічаю тих дверей. Вибач. Я втомлена. Спробую.',
        },
        // SERIOUS
        {
          condition: cond.flag(FLAGS.DOOR_TALK_SERIOUS),
          speaker: 'liza',
          text: '...',
        },
        {
          condition: cond.flag(FLAGS.DOOR_TALK_SERIOUS),
          speaker: 'liza',
          text: 'Я думала — може ти на мене дивишся і щось не кажеш.',
        },
        {
          condition: cond.flag(FLAGS.DOOR_TALK_SERIOUS),
          speaker: 'liza',
          text: 'Виявляється — ти просто в стіну з ними.',
        },
        {
          condition: cond.flag(FLAGS.DOOR_TALK_SERIOUS),
          speaker: 'liza',
          text: 'Вибач. Я не знаю як відповісти. Я не помічаю.',
        },
        {
          condition: cond.flag(FLAGS.DOOR_TALK_SERIOUS),
          speaker: 'dasha',
          text: '(вона чекала, що в мене щось важливіше.)',
        },
        {
          condition: cond.flag(FLAGS.DOOR_TALK_SERIOUS),
          speaker: 'dasha',
          text: '(а я просто втомилась не казати.)',
        },
        // Common closing
        { speaker: 'liza', text: '...' },
        { speaker: 'liza', text: 'Іди-но. Я тебе обійму. Я цього не вмію. Але обійму.' },
      ],
      next: 'act2_end',
    },

    // =====================================================================
    // Заглушка — межа Акту 2. Без `next` — engine завершує сценарій.
    // =====================================================================

    act2_end: {
      location: 'apartment_kitchen',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'liza', position: 'right' },
      ],
      onEnter: [fx.flag(FLAGS.ACT2_DONE)],
      dialogue: [
        { speaker: 'narrator', text: '[Акт 2 завершено. Акт 3 — у розробці.]' },
      ],
    },
  },
  epilogue: {
    headline: 'Продовження слідує',
    lines: [
      'Ліза ще не спить — просто вдає для себе, що спить.',
      'Олеся прокидається в Чикаго. Між шифтами.',
      '— Далі буде —',
    ],
  },
};

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
    // Transition — день іде до вечора. Тихий пропуск часу.
    // =====================================================================

    act2_end: {
      location: 'apartment_kitchen',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'liza', position: 'right' },
      ],
      onEnter: [fx.flag(FLAGS.ACT2_DONE)],
      dialogue: [
        { speaker: 'narrator', text: '...' },
        { speaker: 'narrator', text: 'Субота тягнеться далі — лекції з телефону, обід, ще одна партія кави.' },
        { speaker: 'narrator', text: 'Ніхто нікого не чіпав.' },
        { speaker: 'narrator', text: 'Вечір приходить тихо.' },
      ],
      next: 'evening_kitchen',
    },

    // =====================================================================
    // Акт 3 — вечір, відеодзвінок з Олесею
    // =====================================================================

    // Відеодзвінок з Олесею рендериться тимчасово як звичайний on-stage
    // персонаж — текст narrator-а обрамляє це як екран телефону. Коли буде
    // додано phone-overlay helper, поведінка тут не змінюється.

    evening_kitchen: {
      location: 'apartment_kitchen_evening',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'liza', position: 'right' },
      ],
      dialogue: [
        { speaker: 'narrator', text: '23:40. Настільна лампа на кухні — єдине світло.' },
        { speaker: 'narrator', text: 'Даша над курсовою. Друга чашка чаю, вже холодна.' },
        { speaker: 'narrator', text: 'Ліза поруч, на стільці — ноги на другому. Серіал на телефоні, звук прикручено, субтитри.' },
        { speaker: 'dasha', text: '(ще два параграфи. тоді можна спати.)' },
        { speaker: 'dasha', text: '(точніше — не можна. але я собі дозволю.)' },
        { speaker: 'liza', text: '(зі стільця) Дашка. Ти там жива?' },
        { speaker: 'dasha', text: 'Жива. Пишу про шлюб.' },
        { speaker: 'liza', text: 'Я це пропущу без сарказму. Записано, продовжуй.' },
        { speaker: 'narrator', text: 'Телефон Даши вібрує.' },
      ],
      next: 'olesya_call',
    },

    olesya_call: {
      location: 'apartment_kitchen_evening',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'olesia', position: 'center' },
        { id: 'liza', position: 'right' },
      ],
      dialogue: [
        { speaker: 'narrator', text: 'Даша приймає виклик. На екрані — Олеся.' },
        {
          speaker: 'narrator',
          text: 'За її плечем — стіна американського гуртожитку. Постер «Гамільтона» скошений.',
        },
        { speaker: 'narrator', text: 'У Олесіній руці — червона бляшанка. Енергетик.' },
        { speaker: 'olesia', text: 'Привіт. 16:40 тут. Між двома шифтами.' },
        { speaker: 'dasha', text: 'Привіт. Ти як?' },
        { speaker: 'olesia', text: 'Живу. Закрила трьох кандидатів, йду на четвертого. Побачимо.' },
        { speaker: 'olesia', text: 'Ти як?' },
        { speaker: 'dasha', text: 'Курсова. 87 джерел, 88-ме наснилось.' },
        {
          speaker: 'olesia',
          text: 'О, моя економічна душа тремтить. Я колись покажу тобі свій Excel по годинах сну.',
        },
        { speaker: 'olesia', text: 'Жах. Але структура — бог.' },
      ],
      next: 'liza_notices',
    },

    liza_notices: {
      location: 'apartment_kitchen_evening',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'olesia', position: 'center' },
        { id: 'liza', position: 'right' },
      ],
      dialogue: [
        { speaker: 'narrator', text: 'Ліза відкладає серіал і нахиляється до Даши.' },
        // Tone varies by Act 2 door_talk choice.
        {
          condition: cond.flag(FLAGS.DOOR_TALK_SERIOUS),
          speaker: 'liza',
          text: '(шепіт) Ти її бачиш? Дашка. Вона не спить. По-справжньому.',
        },
        {
          condition: cond.flag(FLAGS.DOOR_TALK_DIRECT),
          speaker: 'liza',
          text: '(шепіт) Ти бачиш? Поки говорить — тримається. Але вона не спить.',
        },
        {
          condition: cond.flag(FLAGS.DOOR_TALK_DEFLECT),
          speaker: 'liza',
          text: '(шепіт) Це — не ок. Ти бачиш?',
        },
        // Common:
        { speaker: 'dasha', text: '(теж бачу.)' },
        { speaker: 'narrator', text: 'Олеся на екрані відвертається — хтось стукає у її двері.' },
        { speaker: 'olesia', text: 'Секунду, хлопці...' },
        { speaker: 'dasha', text: '(зараз. або ні.)' },
      ],
      next: 'dasha_reaction',
    },

    dasha_reaction: {
      location: 'apartment_kitchen_evening',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'olesia', position: 'center' },
        { id: 'liza', position: 'right' },
      ],
      onEnter: [fx.flag(FLAGS.OLESYA_OVERWORK_SUSPECTED)],
      dialogue: [
        { speaker: 'dasha', text: '(...)' },
      ],
      choices: [
        {
          text: 'Олесь, а ти давно спала?',
          next: 'call_ends',
          effects: [fx.flag(FLAGS.OLESYA_ASKED_DIRECTLY)],
        },
        {
          text: '(зробити вигляд, що не помітили)',
          next: 'call_ends',
          effects: [fx.flag(FLAGS.OLESYA_IGNORED_OVERWORK)],
        },
        {
          text: 'Олесь, я тобі потім напишу — є розмова.',
          next: 'call_ends',
          effects: [fx.flag(FLAGS.OLESYA_LATER_MESSAGE)],
        },
      ],
    },

    call_ends: {
      location: 'apartment_kitchen_evening',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'olesia', position: 'center' },
        { id: 'liza', position: 'right' },
      ],
      dialogue: [
        // ========== DIRECT branch ==========
        {
          condition: cond.flag(FLAGS.OLESYA_ASKED_DIRECTLY),
          speaker: 'olesia',
          text: 'Сорі, сорі. Хлопці в коридорі. А, ти щось питала?',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_ASKED_DIRECTLY),
          speaker: 'dasha',
          text: 'Олесь. Ти давно спала?',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_ASKED_DIRECTLY),
          speaker: 'olesia',
          text: '...',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_ASKED_DIRECTLY),
          speaker: 'olesia',
          text: 'Та ну. Все нормально. Я спала — позавчора. Чи вчора. Не пам\u2019ятаю точно.',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_ASKED_DIRECTLY),
          speaker: 'olesia',
          text: 'Але по годинах — є. По циклам. Це не офіційний сон, але я функціоную.',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_ASKED_DIRECTLY),
          speaker: 'dasha',
          text: '(«функціоную» — це не те саме, що «жива».)',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_ASKED_DIRECTLY),
          speaker: 'olesia',
          text: 'Я знаю що ти зараз думаєш. І ти, ймовірно, права.',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_ASKED_DIRECTLY),
          speaker: 'olesia',
          text: 'Я тебе чую. Приємно, що спитала. Цей шифт додому — і лягаю.',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_ASKED_DIRECTLY),
          speaker: 'olesia',
          text: 'Обіцяю. А потім на третій — але він завтра.',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_ASKED_DIRECTLY),
          speaker: 'dasha',
          text: 'Олесь...',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_ASKED_DIRECTLY),
          speaker: 'olesia',
          text: 'Знаю. Люблю тебе. Дзвони.',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_ASKED_DIRECTLY),
          speaker: 'narrator',
          text: 'Екран гасне.',
        },
        // ========== IGNORED branch ==========
        {
          condition: cond.flag(FLAGS.OLESYA_IGNORED_OVERWORK),
          speaker: 'olesia',
          text: 'Окей, хлопці пішли. Що ми там?',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_IGNORED_OVERWORK),
          speaker: 'dasha',
          text: 'Курсова. Яка в тебе кофеїнова палітра сьогодні?',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_IGNORED_OVERWORK),
          speaker: 'olesia',
          text: 'Ред Булл плюс лате. Класика. Завтра заміняю на Монстер — рекомендую.',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_IGNORED_OVERWORK),
          speaker: 'dasha',
          text: 'Нотатка зроблена.',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_IGNORED_OVERWORK),
          speaker: 'olesia',
          text: 'Все, хлопці стукають ще. Мушу йти. Обійми Лізі.',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_IGNORED_OVERWORK),
          speaker: 'narrator',
          text: 'Екран гасне.',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_IGNORED_OVERWORK),
          speaker: 'liza',
          text: 'Ти бачила бляшанку?',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_IGNORED_OVERWORK),
          speaker: 'dasha',
          text: 'Бачила.',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_IGNORED_OVERWORK),
          speaker: 'liza',
          text: 'Ну.',
        },
        // ========== LATER branch ==========
        {
          condition: cond.flag(FLAGS.OLESYA_LATER_MESSAGE),
          speaker: 'olesia',
          text: 'Так, вибач, що відволікаюсь. Що хотіла?',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_LATER_MESSAGE),
          speaker: 'dasha',
          text: 'Олесь. Я тобі напишу. Є розмова. Не сьогодні — почитаєш коли буде пауза.',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_LATER_MESSAGE),
          speaker: 'olesia',
          text: 'Ок. Все гаразд?',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_LATER_MESSAGE),
          speaker: 'dasha',
          text: 'Так. Просто довге повідомлення.',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_LATER_MESSAGE),
          speaker: 'olesia',
          text: 'Напиши. Між шифтами буде вікно.',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_LATER_MESSAGE),
          speaker: 'narrator',
          text: 'Екран гасне.',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_LATER_MESSAGE),
          speaker: 'narrator',
          text: 'Даша відкриває Telegram. Набирає. Стирає.',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_LATER_MESSAGE),
          speaker: 'narrator',
          text: 'Знову набирає. Стирає. Знову.',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_LATER_MESSAGE),
          speaker: 'dasha',
          text: '(як сказати «ми про тебе переживаємо» так, щоб не образити?)',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_LATER_MESSAGE),
          speaker: 'narrator',
          text: 'Врешті пише. Надсилає. Відкладає телефон.',
        },
        {
          condition: cond.flag(FLAGS.OLESYA_LATER_MESSAGE),
          speaker: 'dasha',
          text: '(завтра прочитає. або післязавтра.)',
        },
      ],
      next: 'closing_beat',
    },

    closing_beat: {
      location: 'apartment_kitchen_evening',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'liza', position: 'right' },
      ],
      onEnter: [fx.flag(FLAGS.SCENARIO_SATURDAY_DONE)],
      dialogue: [
        { speaker: 'narrator', text: 'Даша ополіскує чашку. Ставить у сушарку.' },
        { speaker: 'narrator', text: 'Ліза спустила ноги зі стільця. Потягнулась. Позіхнула. Пішла у туалет.' },
        { speaker: 'narrator', text: 'Ліза зачиняє двері.' },
        // Dasha's inner beat varies by Act 2 door_talk choice.
        {
          condition: cond.flag(FLAGS.DOOR_TALK_SERIOUS),
          speaker: 'dasha',
          text: '(вона запам\u2019ятала. вона сказала — спробую, і от.)',
        },
        {
          condition: cond.flag(FLAGS.DOOR_TALK_DIRECT),
          speaker: 'dasha',
          text: '(вона пам\u2019ятає.)',
        },
        {
          condition: cond.flag(FLAGS.DOOR_TALK_DEFLECT),
          speaker: 'dasha',
          text: '(я навіть не просила. а вона все одно.)',
        },
        // Common closing:
        { speaker: 'narrator', text: 'З-за дверей — приглушено:' },
        { speaker: 'liza', text: '(з туалету) Дашка. Дякую.' },
        { speaker: 'dasha', text: '...' },
        { speaker: 'dasha', text: '(я теж.)' },
      ],
      // No `next` → engine fires ScenarioEnded → epilogue renders.
    },
  },
  epilogue: {
    headline: 'Кінець суботи',
    lines: [
      'Кошик порожній. Білизна десь сохне — на балконі чи в пралці, байдуже.',
      'Олеся в США. Завтра — ще одна лекція. Може, напише. Може, нескоро.',
      'Ліза в ліжку, наполовину під ковдрою. Встане десь після 13-ї.',
      'Даша в ліжку. Вкладка з курсовою закрита. Відкриті «Сутінки».',
      '— Продовження в іншу суботу —',
    ],
  },
};

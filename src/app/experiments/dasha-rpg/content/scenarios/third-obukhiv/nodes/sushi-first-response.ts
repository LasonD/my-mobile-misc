import { cond } from '../../../../engine/evaluators';
import { FLAGS } from '../../../../engine/keys';
import { StoryNode } from '../../../../engine/types';

/**
 * `sushi_first_response` — конвергентна нода для трьох гілок реакції Даші
 * на васабі-катастрофу. Усі сходяться на тому, що Саша оклигує і вони
 * їдять далі — але вектор м'якості/енергії в кожній гілці різний.
 *
 * Гілки:
 *   1. LAUGH — Даша сміється відкрито. Саша спочатку «я думав, ти добра»
 *      крізь сльози, потім приєднується. Найгучніша й найшвидша гілка.
 *      Тіло справляється швидше через спільний сміх.
 *
 *   2. HELP — Даша одразу в дію. Сашин конкретний орієнтир («кефір,
 *      холодильник, біля моркви») задає темп: він уже хазяїн ситуації,
 *      просто хазяїн із сльозами. Беззвучна турбота.
 *
 *   3. TEASE — Даша одним легким жартом ловить ситуацію. Саша спершу
 *      «дякую за підтримку» хрипко, потім видихає. Жарт у любові.
 *
 * Спільне завершення: Саша — вже спокійний, обережно бере наступний
 * шматок. Цього разу — без зеленого. Дашин внутрішній рядок ловить
 * момент: «він мені довірив зробити з ним щось перше. у двадцять три.
 * вперше за всіх» — це й є серце ноди, заземлене за завісою комедії.
 *
 * Прапори, які читає:
 *   OBUKHIV_WASABI_LAUGH | OBUKHIV_WASABI_HELP | OBUKHIV_WASABI_TEASE
 *
 * Прапори, які ставить: жоден.
 *
 * Виходить у: `museum_gift` (нода 4 — Даша віддає квитки на «Діалог у темряві»).
 *
 * Тонові орієнтири:
 *   — «(хрипко)» в Сашиних рядках — не комедійна прикраса. Це конкретна
 *     фізіологія: він жив минуту тому з повним ротом васабі. Голос повинен
 *     виглядати фізично постраждалим.
 *   — Дашин фінальний рядок — без іронії. Це момент, коли вся комедія
 *     ноди раптом розкладається в щось серйозне і ніжне. Не пояснювати.
 */
export const SUSHI_FIRST_RESPONSE_NODE: StoryNode = {
  location: 'obukhiv_apartment_room',
  characters: [
    { id: 'dasha', position: 'left' },
    { id: 'sasha', position: 'center' },
    { id: 'max_cat', position: 'far-right' },
  ],
  dialogue: [
    // === LAUGH — спільний сміх ==============================================
    {
      condition: cond.flag(FLAGS.OBUKHIV_WASABI_LAUGH),
      speaker: 'narrator',
      text: 'Даша сміється — відкрито, голосно, рукою прикриває рота.',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_WASABI_LAUGH),
      speaker: 'sasha',
      text: '(хрипко) Я... я думав, ти добра.',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_WASABI_LAUGH),
      speaker: 'dasha',
      text: 'Я добра. Я дуже добра. Просто... твоє обличчя.',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_WASABI_LAUGH),
      speaker: 'narrator',
      text: 'Саша починає сміятись теж. Крізь сльози і кашель.',
    },

    // === HELP — Даша в дію ==================================================
    {
      condition: cond.flag(FLAGS.OBUKHIV_WASABI_HELP),
      speaker: 'sasha',
      text: '(хрипко) Кефір. Холодильник. Біля моркви.',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_WASABI_HELP),
      speaker: 'narrator',
      text: 'Даша вже біжить на кухню. Дверцята, склянка, повертається.',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_WASABI_HELP),
      speaker: 'dasha',
      text: 'Пий повільно. Молочне в’яже гостроту. Вода тільки розмаже.',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_WASABI_HELP),
      speaker: 'narrator',
      text: 'Саша п’є. Дише. Витирає сльози рукавом.',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_WASABI_HELP),
      speaker: 'sasha',
      text: 'Дякую.',
    },

    // === TEASE — м'який жарт ================================================
    {
      condition: cond.flag(FLAGS.OBUKHIV_WASABI_TEASE),
      speaker: 'sasha',
      text: '(хрипко) Дуже... дякую за підтримку.',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_WASABI_TEASE),
      speaker: 'dasha',
      text: 'Я ж попередила. Я сказала «найкращий друг». Тісно стало одразу.',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_WASABI_TEASE),
      speaker: 'narrator',
      text: 'Саша видихає повільно. Береться за пляшку води. П’є.',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_WASABI_TEASE),
      speaker: 'sasha',
      text: 'Окей. Я навчився.',
    },

    // === Спільне закриття ===================================================
    {
      speaker: 'narrator',
      text: 'Через кілька секунд — вже без сліз. Саша обережно бере наступний шматок. Маленький мазок соусу. Цього разу — без зеленого.',
    },
    { speaker: 'sasha', text: 'Запам’ятав. На все життя.' },
    {
      speaker: 'dasha',
      text: '(він мені довірив зробити з ним щось перше. у двадцять три. вперше за всіх.)',
    },
  ],
  next: 'museum_gift',
};

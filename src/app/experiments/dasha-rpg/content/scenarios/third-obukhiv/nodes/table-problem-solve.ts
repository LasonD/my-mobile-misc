import { cond } from '../../../../engine/evaluators';
import { FLAGS } from '../../../../engine/keys';
import { StoryNode } from '../../../../engine/types';

/**
 * `table_problem_solve` — конвергентна нода: три гілки за прапорами
 * `OBUKHIV_TABLE_*` сходяться на тому самому рішенні (ставимо суші на
 * платформу Максового будиночка), але ведуть туди по-різному.
 *
 * Структура:
 *   1. Гілка 1 — `OBUKHIV_TABLE_SOLVE` (Даша діє).
 *      Даша встає, обходить кімнату, сама знаходить платформу.
 *      Саша не встигає. Це — найкоротша гілка, бо рішення «приходить»
 *      швидко через її активність.
 *
 *   2. Гілка 2 — `OBUKHIV_TABLE_NORMALIZE` (Даша словом).
 *      Дзеркало на стільці — Дашин артефакт із її квартири, передається
 *      як рівноцінний приклад «не все ідеальне». Саша видихає; його ж
 *      погляд знаходить платформу. У цій гілці він знаходить — не вона.
 *
 *   3. Гілка 3 — `OBUKHIV_TABLE_TALKCAT` (через Макса).
 *      Макс відповідає поглядом і нерозбірливим звуком. Саша «перекладає»
 *      кошатську відповідь — це його перший легкий жарт у сценарії.
 *      Платформу він знаходить сам, у тому ж русі.
 *
 *   4. **Спільне завершення.** Картон зверху платформи (Саша приніс із
 *      кухні — щоб гладко). Пакет суші стає на цей імпровізований стіл.
 *      Макс не йде — лишається біля своєї бази. Даша одним рядком ловить
 *      майбутню проблему («це буде проблема. але потім.») — це сетап для
 *      `max_heist` (нода 7). Сідають на підлогу обабіч будиночка.
 *
 * Прапори, які читає:
 *   OBUKHIV_TABLE_SOLVE | OBUKHIV_TABLE_NORMALIZE | OBUKHIV_TABLE_TALKCAT
 *
 * Прапори, які ставить: жоден.
 *
 * Виходить у: `sushi_first` (нода 3 — Сашин перший раз із суші + васабі).
 *
 * Тонові орієнтири:
 *   — Картон поверх платформи — конкретна деталь. Це Сашина спроба врятувати
 *     ситуацію через дрібну охайність: щоб піднос був гладкий, не нерівний.
 *     Дрібниця, яка робить мізансцену людською, а не просто кумедною.
 *   — Дашин внутрішній рядок «це найдивніший стіл, за яким я колись їла»
 *     — це **не** іронія зверху-вниз. Це теплий маркер «це моє». Через
 *     нього сценарій вкорінює, що ця абсурдна вечеря — не комедія для
 *     неї, а *своє*.
 */
export const TABLE_PROBLEM_SOLVE_NODE: StoryNode = {
  location: 'obukhiv_apartment_room',
  characters: [
    { id: 'dasha', position: 'left' },
    { id: 'sasha', position: 'center' },
    { id: 'max_cat', position: 'far-right' },
  ],
  dialogue: [
    // === Гілка SOLVE — Даша встає і знаходить ===============================
    {
      condition: cond.flag(FLAGS.OBUKHIV_TABLE_SOLVE),
      speaker: 'narrator',
      text: 'Даша встає. Робить два повільних кола кімнатою — від вікна до кутка, від кутка до Макса.',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_TABLE_SOLVE),
      speaker: 'dasha',
      text: 'А це що — оце, де Макс зверху спить?',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_TABLE_SOLVE),
      speaker: 'sasha',
      text: 'Це... це Максів будиночок.',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_TABLE_SOLVE),
      speaker: 'dasha',
      text: 'Платформа зверху рівна. Я бачила ще з порога.',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_TABLE_SOLVE),
      speaker: 'sasha',
      text: '...ох.',
    },

    // === Гілка NORMALIZE — Даша словом, Саша знаходить ======================
    {
      condition: cond.flag(FLAGS.OBUKHIV_TABLE_NORMALIZE),
      speaker: 'sasha',
      text: '...дзеркало?',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_TABLE_NORMALIZE),
      speaker: 'dasha',
      text: 'Старе. Велике. Стоїть на стільці в коридорі. Ніяк не доходять руки повісити.',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_TABLE_NORMALIZE),
      speaker: 'dasha',
      text: 'Але ти від цього дзеркала виглядаєш цілішим, ніж від ідеального.',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_TABLE_NORMALIZE),
      speaker: 'narrator',
      text: 'Саша видихає — вперше глибоко за день. Дивиться по кімнаті. Погляд зупиняється.',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_TABLE_NORMALIZE),
      speaker: 'sasha',
      text: 'А Максів... зверху ж рівний.',
    },

    // === Гілка TALKCAT — Макс мовчить, Саша «перекладає» ====================
    {
      condition: cond.flag(FLAGS.OBUKHIV_TABLE_TALKCAT),
      speaker: 'narrator',
      text: 'Макс не відповідає. Кліпає. Видає звук, який може означати «так», «ні», або «ваші справи мене не цікавлять».',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_TABLE_TALKCAT),
      speaker: 'sasha',
      text: 'Це було «так». Я знаю його тон.',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_TABLE_TALKCAT),
      speaker: 'dasha',
      text: 'А я думала — «ні». Перекладай далі, мені цікаво.',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_TABLE_TALKCAT),
      speaker: 'sasha',
      text: 'Зверху ж рівне. Він там вночі спить. Він точно сказав «так».',
    },

    // === Спільне завершення =================================================
    {
      speaker: 'narrator',
      text: 'Саша приносить шматок картону із кухні — щоб зверху було гладко. Кладе.',
    },
    { speaker: 'narrator', text: 'Пакет суші стає на платформу Максового будиночка.' },
    {
      speaker: 'narrator',
      text: 'Макс прижимається боком до своєї бази. Не йде. Дивиться знизу вгору на пакет.',
    },
    { speaker: 'sasha', text: 'Він не йде. Він гарантує собі право першого огляду.' },
    { speaker: 'dasha', text: '(це буде проблема. але потім.)' },
    {
      speaker: 'narrator',
      text: 'Саша і Даша опускаються на підлогу — він з одного боку будиночка, вона з іншого.',
    },
    {
      speaker: 'dasha',
      text: '(це найдивніший стіл, за яким я колись їла. і він зараз мій.)',
    },
  ],
  next: 'sushi_first',
};

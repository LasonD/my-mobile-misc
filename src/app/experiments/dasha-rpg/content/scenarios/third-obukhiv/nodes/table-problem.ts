import { cond, fx } from '../../../../engine/evaluators';
import { FLAGS } from '../../../../engine/keys';
import { StoryNode } from '../../../../engine/types';

/**
 * `table_problem` — друга нода: Сашина варіативна відповідь + момент паніки
 * через відсутність стола + вибір Дашиного підходу до заземлення.
 *
 * Ця нода складається з трьох логічних шарів:
 *
 *   1. **Відповідь Саши на тон Дашиної зустрічі.**
 *      Читає один із трьох прапорів — `OBUKHIV_ARRIVAL_*` — і вибирає
 *      відповідні рядки. Це показує, як його тіло відреагувало на її
 *      жест: WARM — видихає словами; TEASE — м'яко спалахує і визнає;
 *      CAT — сідає поруч на підлогу. Не зливає історію, лише дає
 *      персонажу відрефлексувати щойно отриманий вибір гравця.
 *
 *   2. **Спільний міст до їжі — і момент завмирання.**
 *      Саша згадує, що «ми поїмо», оглядається — і завмирає. Стола
 *      немає. Він уперше при Даші голосно називає себе дурнем — це
 *      пік внутрішньої напруги ноди. Дашин внутрішній рядок ловить
 *      прихований больовий момент: «це турбує його зараз більше,
 *      ніж нас разом».
 *
 *   3. **Вибір тону Даші**, як вона зустріне його паніку.
 *      Не змінює рішення (платформа Макса все одно стане столом), але
 *      по-різному прокладає шлях до нього в наступному вузлі
 *      `table_problem_solve`.
 *
 * Прапори, які читає:
 *   OBUKHIV_ARRIVAL_WARM | OBUKHIV_ARRIVAL_TEASE | OBUKHIV_ARRIVAL_CAT
 *
 * Прапори, які ставить:
 *   OBUKHIV_TABLE_SOLVE      — Даша діє: встає, оглядає, знаходить сама
 *   OBUKHIV_TABLE_NORMALIZE  — словом заземлює («дзеркало на стільці»)
 *   OBUKHIV_TABLE_TALKCAT    — звертається до Макса як до партнера
 *
 * Виходить у: `table_problem_solve`.
 *
 * Тонові орієнтири:
 *   — Саша катастрофізує дрібницю. Тон не «жалкий», а «надмірно жорстокий
 *     до себе» — це його спосіб справлятися. «Я повний дурень» прозвучить
 *     і не повинно лякати — Даша почує і не дозволить йому залишитись там.
 *   — Даша *не* співчуває знизу-вгору. Вона рівна йому. Її варіанти — три
 *     способи дати йому опору, не три рівні жалю.
 *   — Макс — мовчазний центр. Не реагує на дискусію над ним. Кіт.
 */
export const TABLE_PROBLEM_NODE: StoryNode = {
  location: 'obukhiv_apartment_room',
  characters: [
    { id: 'dasha', position: 'left' },
    { id: 'sasha', position: 'center' },
    { id: 'max_cat', position: 'far-right' },
  ],
  dialogue: [
    // === Шар 1: Сашина відповідь на тон зустрічі ============================

    // WARM — пряме «це я, не співбесіда»
    {
      condition: cond.flag(FLAGS.OBUKHIV_ARRIVAL_WARM),
      speaker: 'sasha',
      text: '...ок. Ок. Ти права. Сорі. Я переплутав з підготовкою.',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_ARRIVAL_WARM),
      speaker: 'sasha',
      text: 'Я уявляв, як я тобі двері відчиняю, разів двадцять. Жоден не виглядав, як те, що зараз сталось.',
    },

    // TEASE — Даша помітила, що Саша забув
    {
      condition: cond.flag(FLAGS.OBUKHIV_ARRIVAL_TEASE),
      speaker: 'sasha',
      text: 'Що я забув?',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_ARRIVAL_TEASE),
      speaker: 'dasha',
      text: 'Пилосос за дверима. Кутик з папером від доставки. Дві кружки в раковині. Одна — твоя.',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_ARRIVAL_TEASE),
      speaker: 'sasha',
      text: '...ти всі двадцять секунд так сканувала?',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_ARRIVAL_TEASE),
      speaker: 'dasha',
      text: 'Я ж психологиня. Це професійне.',
    },

    // CAT — Даша заземлила через Макса; Саша приймає запрошення
    {
      condition: cond.flag(FLAGS.OBUKHIV_ARRIVAL_CAT),
      speaker: 'narrator',
      text: 'Саша вагається секунду — і опускається поруч на коліна. Не тягнеться до Макса; просто сідає.',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_ARRIVAL_CAT),
      speaker: 'sasha',
      text: 'Ок. Ок. Я з вами.',
    },
    {
      condition: cond.flag(FLAGS.OBUKHIV_ARRIVAL_CAT),
      speaker: 'sasha',
      text: 'Він тебе вже не сприймає як гостя. Я бачу. Він тобі довірив пакет.',
    },

    // === Шар 2: міст до їжі — і момент завмирання ===========================
    { speaker: 'narrator', text: 'За кілька секунд розмова повертається до плану.' },
    { speaker: 'sasha', text: 'Я думав ми поїмо. Я хотів... я хотів накрити.' },
    { speaker: 'narrator', text: 'Саша оглядається — і завмирає.' },
    { speaker: 'sasha', text: 'О. О, ні.' },
    { speaker: 'narrator', text: 'Даша простежує його погляд. Вільне пасмо стіни. Бар на кухні. Підлога.' },
    { speaker: 'narrator', text: 'Жодного журнального стола.' },

    { speaker: 'sasha', text: 'У мене не було стола. Я ж дивився Reels про столики. Цілий вечір.' },
    { speaker: 'sasha', text: 'Я думав, що бар достатньо широкий. Заміряв учора. Не достатньо.' },
    { speaker: 'sasha', text: 'Я повний дурень.' },

    {
      speaker: 'dasha',
      text: '(він планував стіл і не замовив. і це турбує його зараз більше, ніж нас разом.)',
    },

    // === Шар 3: вибір тону Даші =============================================
    // (Falls through to `choices` below.)
  ],
  choices: [
    {
      text: '(встаю, оглядаюсь) Саш, не біжи нікуди. Я подивлюсь.',
      next: 'table_problem_solve',
      effects: [fx.flag(FLAGS.OBUKHIV_TABLE_SOLVE)],
      hint: 'Дія',
    },
    {
      text: 'Саш. У мене вдома дзеркало стоїть на стільці. Стіл — найменша наша проблема.',
      next: 'table_problem_solve',
      effects: [fx.flag(FLAGS.OBUKHIV_TABLE_NORMALIZE)],
      hint: 'Заземлити словом',
    },
    {
      text: 'Максе. Ти позичиш свій дах на годинку? Я тобі шматок поверну. Може.',
      next: 'table_problem_solve',
      effects: [fx.flag(FLAGS.OBUKHIV_TABLE_TALKCAT)],
      hint: 'Через кота',
    },
  ],
};

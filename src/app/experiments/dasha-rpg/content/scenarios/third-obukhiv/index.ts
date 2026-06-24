import { Scenario, StoryNode } from '../../../engine/types';
import { ARRIVAL_NODE } from './nodes/arrival';
import { TABLE_PROBLEM_NODE } from './nodes/table-problem';
import { TABLE_PROBLEM_SOLVE_NODE } from './nodes/table-problem-solve';
import { SUSHI_FIRST_NODE } from './nodes/sushi-first';
import { SUSHI_FIRST_RESPONSE_NODE } from './nodes/sushi-first-response';
import { MUSEUM_GIFT_NODE } from './nodes/museum-gift';
import { MUSEUM_GIFT_RESPONSE_NODE } from './nodes/museum-gift-response';

/**
 * Сценарій 3 — «Вихідні в Обухові».
 *
 * Контекст: 14 лютого 2026, субота. Перший раз, коли Саша запросив Дашу
 * до себе в Обухів. Він перенервував із підготовкою (прибрав, але не
 * ідеально; склеїв із А3-аркушів проекційний екран; купив суші разом
 * з Дашею, але формально — від неї). У кишені в Даші ще квитки на
 * «Діалог у темряві» — поки що не знає.
 *
 * Структура (10 вузлів — кожен у окремому файлі під `nodes/`):
 *   1. arrival          — поріг, Саша незграбний, Макс знайомиться
 *   2. table_problem    — нема столу → ставлять на Максів будиночок
 *   3. sushi_first      — Саша вперше їсть суші + інцидент із васабі
 *   4. museum_gift      — Даша віддає квитки на «Діалог у темряві»
 *   5. hdmi             — 2 хв намагань підключити проектор; видно А3-екран
 *   6. movie_start      — кадр догори ногами; перший справжній сміх Саши
 *   7. max_heist        — Макс краде шматок суші
 *   8. risque_pause     — конфузна пауза на сцені «Тітаніка»
 *   9. closing          — «I'll never let go», Макс між ними
 *   10. epilogue        — вночі скотч відлипає, екран падає
 *
 * Робочий процес: один вузол за раз — повністю прокручується в окремому
 * файлі (з тоновими нотатками в шапці), потім імпортується сюди.
 */

/**
 * Тимчасовий «to-be-continued» вузол. Кожен ще не написаний `next`
 * вказує на нього, щоб сценарій можна було пройти до кінця написаного
 * і не падати в engine.
 */
const TBD_NODE: StoryNode = {
  location: 'obukhiv_apartment_room',
  characters: [
    { id: 'dasha', position: 'left' },
    { id: 'sasha', position: 'center' },
    { id: 'max_cat', position: 'far-right' },
  ],
  dialogue: [
    { speaker: 'narrator', text: '· · ·' },
    { speaker: 'narrator', text: '(далі — наступний вузол. Поки в роботі.)' },
  ],
  // No next/choices → engine fires ScenarioEnded → epilogue placeholder.
};

export const THIRD_OBUKHIV: Scenario = {
  id: 'third_obukhiv',
  title: 'Вихідні в Обухові · 14 лютого',
  startNode: 'arrival',
  nodes: {
    arrival: ARRIVAL_NODE,
    table_problem: TABLE_PROBLEM_NODE,
    table_problem_solve: TABLE_PROBLEM_SOLVE_NODE,
    sushi_first: SUSHI_FIRST_NODE,
    sushi_first_response: SUSHI_FIRST_RESPONSE_NODE,
    museum_gift: MUSEUM_GIFT_NODE,
    museum_gift_response: MUSEUM_GIFT_RESPONSE_NODE,
    _tbd: TBD_NODE,
    // ↓ додаються по мірі написання кожної ноди
  },
  epilogue: {
    headline: 'Кінець уривку',
    lines: [
      '(сценарій у розробці — далі буде)',
    ],
  },
};

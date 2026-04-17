export type Speaker =
  | 'narrator'
  | 'dasha'
  | 'professor'
  | 'client1'
  | 'wife'
  | 'husband'
  | 'client3';

export interface DialogueLine {
  who: Speaker;
  name?: string;
  text: string;
}

export const SPEAKER_NAMES: Record<Speaker, string> = {
  narrator: '',
  dasha: 'Даша',
  professor: 'Проф. Коваленко',
  client1: 'Артем (фінанси)',
  wife: 'Оля',
  husband: 'Макс',
  client3: 'Клієнт N',
};

export const INTRO: DialogueLine[] = [
  { who: 'narrator', text: 'Київська школа економіки. Перший день семестру.' },
  { who: 'narrator', text: 'Факультет психології. Авдиторія 3.14.' },
  { who: 'dasha', text: 'Доброго ранку! Я — Даша, і я обираю спеціалізацію.' },
  { who: 'professor', text: 'Слухаю вас, пані Дашо.' },
  { who: 'dasha', text: 'Сексологія.' },
  { who: 'professor', text: '...у КШЕ?' },
  { who: 'dasha', text: 'У КШЕ. З економічним підходом.' },
  { who: 'professor', text: 'Тема курсової?' },
  { who: 'dasha', text: '«Економіка довіри в інтимних стосунках: моделі й дані».' },
  { who: 'professor', text: 'Скільки джерел?' },
  { who: 'dasha', text: '87. І три регресії.' },
  { who: 'professor', text: '...Вітаю. У вас перший клієнт через п\'ять хвилин.' },
  { who: 'dasha', text: 'Я готова.' },
];

export const SESSION_INTROS: DialogueLine[][] = [
  // --- Session 1: стрес-студент з фінансів ---
  [
    { who: 'narrator', text: 'Сесія 1. Перший клієнт: однокурсник із факультету фінансів.' },
    { who: 'client1', text: 'Я... я не можу плакати без Excel-таблиці.' },
    { who: 'client1', text: 'Остання сльоза мала примітку: "квартал 3, негативний".' },
    { who: 'dasha', text: '*робить записи* Класичний КШЕ-синдром.' },
    { who: 'dasha', text: 'Ловимо його емоції (сині, жовті, фіолетові).' },
    { who: 'dasha', text: 'Уникаємо стигм ⚡ — вони там, де він сам себе гризе.' },
    { who: 'dasha', text: 'А рожеві серця 💗 — подвійні очки. Це моя спеціалізація.' },
    { who: 'dasha', text: 'Рухай блокнот пальцем. Поїхали.' },
  ],
  // --- Session 2: пара з Excel-шлюбом ---
  [
    { who: 'narrator', text: 'Сесія 2. Пара. Прийшли разом — уже прогрес.' },
    { who: 'wife', text: 'Він склав Excel нашого шлюбу.' },
    { who: 'husband', text: '17 вкладок. Автооновлення щонеділі о 9:00.' },
    { who: 'wife', text: 'У графі "ніжність" стоїть формула. ФОРМУЛА.' },
    { who: 'dasha', text: 'А почуття ви обговорюєте голосом?' },
    { who: 'husband', text: 'Я думав, почуття — це KPI.' },
    { who: 'dasha', text: 'Сьогодні ми це змінимо. Темп буде швидшим.' },
  ],
  // --- Session 3: делікатна тема ---
  [
    { who: 'narrator', text: 'Сесія 3. Остання перед захистом дипломної.' },
    { who: 'client3', text: 'Я... не знаю, чи доречно сюди прийти.' },
    { who: 'client3', text: 'Це... така тема... ну, ви розумієте.' },
    { who: 'dasha', text: 'У мене спеціалізація. Не соромтесь.' },
    { who: 'client3', text: 'Справді? Я думав, вас це здивує.' },
    { who: 'dasha', text: 'Мене дивує лише відсутність згоди та якісної інформації.' },
    { who: 'client3', text: '*видихає* Добре. Я довіряю.' },
    { who: 'dasha', text: 'Фінальна сесія. Найскладніша. Я готова — готові?' },
  ],
];

export const SESSION_OUTROS: DialogueLine[][] = [
  // --- After Session 1 ---
  [
    { who: 'client1', text: 'Я... я вперше за місяць не думав про ROI.' },
    { who: 'dasha', text: 'Ваш ROI не прив\'язаний до вашої самооцінки.' },
    { who: 'dasha', text: '(Хоча CFO КШЕ б з цим поспорив.)' },
    { who: 'client1', text: 'Дякую. Я, мабуть, ще запишусь.' },
    { who: 'narrator', text: 'Рапорт встановлено. Сесію 1 завершено.' },
  ],
  // --- After Session 2 ---
  [
    { who: 'wife', text: 'Ми... ми обійнялись. Без електронної таблиці.' },
    { who: 'husband', text: 'Я вперше відчув... щось неметричне.' },
    { who: 'dasha', text: 'Прогрес. Спробуйте завтра подивитись захід сонця.' },
    { who: 'husband', text: 'Я вчора дивився. Прибутковість зображення — 14%.' },
    { who: 'wife', text: 'Ми працюємо над цим.' },
    { who: 'dasha', text: '*посміхається* Крок за кроком.' },
  ],
  // --- After Session 3 ---
  [
    { who: 'client3', text: 'Я не очікував, що буде так... нормально.' },
    { who: 'dasha', text: 'Бо це нормально. Просто про це мало говорять.' },
    { who: 'client3', text: 'Я передам друзям ваш контакт.' },
    { who: 'dasha', text: 'Буду рада. Але без OLX-формату, будь ласка.' },
  ],
];

export const OUTRO: DialogueLine[] = [
  { who: 'narrator', text: '— Церемонія вручення дипломів КШЕ —' },
  { who: 'professor', text: 'Пані Дашо. Ваша теза.' },
  { who: 'professor', text: '«Інвестиції в інтимність: емпіричне дослідження».' },
  { who: 'professor', text: 'Вже прийнята до Nature Human Behaviour.' },
  { who: 'dasha', text: '*скромно посміхається*' },
  { who: 'professor', text: 'Три видавництва пропонують книгу. TED запрошує на виступ.' },
  { who: 'professor', text: 'ВООЗ хоче консультацію. В листі — 14 запитань.' },
  { who: 'dasha', text: 'Я починаю з TED. Потім — книга. Потім — ВООЗ.' },
  { who: 'dasha', text: 'Клініка — через рік.' },
  { who: 'professor', text: 'Ви все спланували.' },
  { who: 'dasha', text: 'Я в КШЕ училась. У нас так прийнято.' },
  { who: 'narrator', text: 'Так Даша стала найвідомішою сексологинею покоління.' },
  { who: 'narrator', text: 'Єдиною, яка цитує Фройда й Канемана в одному параграфі.' },
  { who: 'narrator', text: 'Дяка за гру. ♥' },
  { who: 'narrator', text: '(тап — почати заново)' },
];

export interface LevelConfig {
  duration: number;
  spawnInterval: number;
  stigmaRate: number;
  specialRate: number;
  fallSpeed: number;
}

export const LEVELS: LevelConfig[] = [
  { duration: 32, spawnInterval: 750, stigmaRate: 0.15, specialRate: 0.12, fallSpeed: 120 },
  { duration: 38, spawnInterval: 620, stigmaRate: 0.22, specialRate: 0.15, fallSpeed: 150 },
  { duration: 44, spawnInterval: 520, stigmaRate: 0.28, specialRate: 0.18, fallSpeed: 180 },
];

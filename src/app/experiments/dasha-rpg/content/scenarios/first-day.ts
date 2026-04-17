import { cond, fx } from '../../engine/evaluators';
import { Scenario } from '../../engine/types';

/**
 * Перший день Даши в КШЕ на факультеті психології.
 * Демонструє: зміну локацій, вибори з наслідками, квест з етапами,
 * персонажів із різними емоціями, відсилки до реальних фактів про КШЕ
 * (Милованов, Брік, Case Champ, "Що? Де? Коли?", Houston MA).
 */
export const FIRST_DAY: Scenario = {
  id: 'first_day',
  title: 'Перший день у КШЕ',
  startNode: 'arrival',
  nodes: {
    // ---- Entrance ----
    arrival: {
      location: 'kse_entrance',
      characters: [{ id: 'dasha', position: 'center' }],
      onEnter: [fx.startQuest('first_day'), fx.setStat('charisma', 5), fx.setStat('stress', 2)],
      dialogue: [
        { speaker: 'narrator', text: '8:42 ранку. Київ. Вул. Шпака, 3.' },
        { speaker: 'narrator', text: 'Перший день Даши на факультеті психології КШЕ.' },
        { speaker: 'dasha', text: 'Добре. Глибокий вдих. Я готова.' },
        { speaker: 'dasha', text: '(справді готова? 87 джерел у курсовій не допоможуть, якщо я заблукаю в коридорі)' },
      ],
      choices: [
        {
          text: 'Зробити селфі на вході для Instagram',
          next: 'selfie',
          effects: [fx.stat('charisma', 1), fx.flag('posted_selfie')],
          hint: 'Студентський рефлекс',
        },
        {
          text: 'Подзвонити мамі',
          next: 'call_mom',
          effects: [fx.stat('stress', -1)],
          hint: 'Заспокоїтись',
        },
        {
          text: 'Просто зайти',
          next: 'enter_lobby',
          effects: [fx.stat('charisma', 1)],
          hint: 'По-діловому',
        },
      ],
    },

    selfie: {
      location: 'kse_entrance',
      characters: [{ id: 'dasha', position: 'center' }],
      dialogue: [
        { speaker: 'dasha', text: '*клац* Ідеально. #КШЕ #Психологія #NoFilter' },
        { speaker: 'narrator', text: 'За 30 секунд — 47 лайків. Один з них від @mylovanov.' },
        { speaker: 'dasha', text: 'Президент університету лайкнув моє селфі? Це знак?' },
      ],
      next: 'enter_lobby',
    },

    call_mom: {
      location: 'kse_entrance',
      characters: [{ id: 'dasha', position: 'center' }],
      dialogue: [
        { speaker: 'dasha', text: 'Мам? Я приїхала. Так. Так, підкладку взяла. Так, парасолю взяла.' },
        { speaker: 'dasha', text: 'Мам, ні, я не піду на економіку. Я на психологію.' },
        { speaker: 'dasha', text: '(пауза)' },
        { speaker: 'dasha', text: 'Мам, сексологія — це теж психологія. Усе, бувай.' },
      ],
      next: 'enter_lobby',
    },

    // ---- Lobby / security ----
    enter_lobby: {
      location: 'kse_lobby',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'security', position: 'right' },
      ],
      dialogue: [
        { speaker: 'security', text: 'Доброго ранку. Перепустка?' },
        { speaker: 'dasha', text: '(мить паніки) Я — першокурсниця. Сьогодні перший день.' },
        { speaker: 'security', text: 'Ага. Факультет?' },
      ],
      choices: [
        {
          text: '"Психологія."',
          next: 'security_psy',
          effects: [fx.flag('said_psychology')],
        },
        {
          text: '"Сексологія."',
          next: 'security_sex',
          effects: [fx.flag('bold_intro'), fx.stat('charisma', 2)],
          hint: 'Сміливо. Подивимось на реакцію.',
        },
        {
          text: '"Економіка… ну, майже."',
          next: 'security_maybe',
          effects: [fx.stat('stress', 1)],
          hint: 'Ніколи не бреши охоронцю.',
        },
      ],
    },

    security_psy: {
      location: 'kse_lobby',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'security', position: 'right' },
      ],
      dialogue: [
        { speaker: 'security', text: 'Психологія, так. На третьому поверсі. Ліфт праворуч.' },
        { speaker: 'security', text: 'І… не лякайтесь професорки Коваленко. Вона жорстка, але справедлива.' },
        { speaker: 'dasha', text: 'Дякую!' },
      ],
      onExit: [fx.objective('first_day', 'pass_security')],
      next: 'lobby_valeria',
    },

    security_sex: {
      location: 'kse_lobby',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'security', position: 'right' },
      ],
      dialogue: [
        { speaker: 'security', text: '...' },
        { speaker: 'security', text: 'Ви серйозно?' },
        { speaker: 'dasha', text: 'Спеціалізація. Напрям сексології. У психології це нормально.' },
        { speaker: 'security', text: 'Перший раз таке чую на вході. Зате точно не забуду ваше обличчя.' },
        { speaker: 'security', text: 'Третій поверх. Ліфт праворуч.' },
      ],
      onExit: [fx.objective('first_day', 'pass_security'), fx.stat('reputation', 1)],
      next: 'lobby_valeria',
    },

    security_maybe: {
      location: 'kse_lobby',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'security', position: 'right' },
      ],
      dialogue: [
        { speaker: 'security', text: '"Майже" — це не факультет, пані.' },
        { speaker: 'security', text: 'Психологія, економіка, право? Вибирайте.' },
        { speaker: 'dasha', text: 'Психологія. Вибачте.' },
        { speaker: 'security', text: 'Третій поверх.' },
      ],
      onExit: [fx.objective('first_day', 'pass_security')],
      next: 'lobby_valeria',
    },

    // ---- Meet Valeria ----
    lobby_valeria: {
      location: 'kse_lobby',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'valeria', position: 'right' },
      ],
      dialogue: [
        { speaker: 'narrator', text: 'Біля рецепції — знайоме обличчя.' },
        { speaker: 'valeria', text: 'ДАША! Дашенька, я тут!' },
        { speaker: 'dasha', text: 'Валерія! Я думала, ти на презентації в спортклубі.' },
        { speaker: 'valeria', text: 'Була. Вирішила, що замість баскетболу піду на курс з крос-культурної психології. Логіка.' },
        { speaker: 'dasha', text: 'Класична Палій-логіка.' },
        { speaker: 'valeria', text: 'Слухай, я чула, що сьогодні сам Милованов має виступати з привітальним словом.' },
        { speaker: 'valeria', text: 'І ректор Брік теж. Економіст + соціолог в одному кадрі. Історія.' },
      ],
      onEnter: [fx.objective('first_day', 'meet_valeria')],
      choices: [
        {
          text: '"Круто. Пішли шукати аудиторію."',
          next: 'heading_to_lecture',
          effects: [fx.flag('teamed_with_valeria')],
        },
        {
          text: '"А що на дошці оголошень?"',
          next: 'notice_board',
          hint: 'Є квест-хук про Case Champ',
        },
        {
          text: '"Спочатку кава?"',
          next: 'cafe_break_early',
          effects: [fx.stat('stress', -1), fx.flag('coffee_first')],
        },
      ],
    },

    notice_board: {
      location: 'kse_lobby',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'valeria', position: 'right' },
      ],
      dialogue: [
        { speaker: 'narrator', text: 'На стенді — три оголошення:' },
        { speaker: 'narrator', text: '▸ Case Champ 2026 — реєстрація відкрита.' },
        { speaker: 'narrator', text: '▸ "Що? Де? Коли?" — економічна версія, щочетверга.' },
        { speaker: 'narrator', text: '▸ Волейбольний клуб шукає гравців. Шапка з логотипом у подарунок.' },
        { speaker: 'valeria', text: 'Нам треба на Case Champ. Це +стипендія й лінія в резюме.' },
        { speaker: 'dasha', text: 'Я б у ЩДК пішла. Але спершу виживемо до кінця дня.' },
      ],
      next: 'heading_to_lecture',
    },

    cafe_break_early: {
      location: 'cafeteria',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'valeria', position: 'right' },
      ],
      dialogue: [
        { speaker: 'valeria', text: 'Еспресо. Подвійне.' },
        { speaker: 'dasha', text: 'Лате. І печиво. Я нервую.' },
        { speaker: 'narrator', text: 'У кафе вже черга з 10 людей. Усі — першокурсники. Усі нервують.' },
        { speaker: 'dasha', text: 'Чомусь від цього трохи легше.' },
      ],
      next: 'heading_to_lecture',
    },

    // ---- Lecture ----
    heading_to_lecture: {
      location: 'lecture_hall',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'valeria', position: 'center' },
      ],
      dialogue: [
        { speaker: 'narrator', text: 'Аудиторія 301. Порожньо тільки перші п\'ять хвилин.' },
        { speaker: 'narrator', text: 'Далі — повна зала. На дошці вже виведена формула корисності.' },
        { speaker: 'valeria', text: 'Навіщо нам функція корисності на психології?' },
        { speaker: 'dasha', text: 'У КШЕ все пов\'язане. Навіть сни.' },
      ],
      onEnter: [fx.objective('first_day', 'attend_lecture')],
      next: 'prof_entrance',
    },

    prof_entrance: {
      location: 'lecture_hall',
      characters: [
        { id: 'dasha', position: 'far-left' },
        { id: 'valeria', position: 'left' },
        { id: 'prof_psy', position: 'right' },
      ],
      dialogue: [
        { speaker: 'prof_psy', text: 'Доброго ранку. Я — Олена Коваленко. Курс: "Вступ до психологічної практики".' },
        { speaker: 'prof_psy', text: 'Перші 5 хвилин — знайомство. Кожен встає, називає ім\'я й напрям спеціалізації.' },
        { speaker: 'valeria', text: '(шепоче) Я скажу "клінічна". Це безпечно.' },
      ],
      choices: [
        {
          text: 'Одразу сказати "сексологія"',
          next: 'prof_sex',
          effects: [fx.flag('public_sex_claim'), fx.stat('reputation', 2)],
          hint: 'Смілива заявка на репутацію',
        },
        {
          text: 'Сказати "клінічна, можливо, сексологія"',
          next: 'prof_safe',
          hint: 'Обережніший варіант',
        },
        {
          text: 'Пропустити чергу, дати Валерії першою',
          next: 'prof_val_first',
          effects: [fx.stat('stress', 1)],
          hint: 'Шпигнути в подругу',
        },
      ],
    },

    prof_sex: {
      location: 'lecture_hall',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'prof_psy', position: 'right' },
      ],
      dialogue: [
        { speaker: 'dasha', text: 'Даша. Планую спеціалізацію в сексології.' },
        { speaker: 'prof_psy', text: 'Сексологія. Чудово. У вашому випуску ви — перша, хто це каже відкрито.' },
        { speaker: 'prof_psy', text: 'Запам\'ятайте цю хвилину. Це і є її професія.' },
      ],
      next: 'day_end',
    },

    prof_safe: {
      location: 'lecture_hall',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'prof_psy', position: 'right' },
      ],
      dialogue: [
        { speaker: 'dasha', text: 'Даша. Клінічна, з можливим нахилом у сексологію.' },
        { speaker: 'prof_psy', text: 'Розумно. Подивимось, що візьме гору.' },
      ],
      next: 'day_end',
    },

    prof_val_first: {
      location: 'lecture_hall',
      characters: [
        { id: 'dasha', position: 'far-left' },
        { id: 'valeria', position: 'left' },
        { id: 'prof_psy', position: 'right' },
      ],
      dialogue: [
        { speaker: 'valeria', text: 'Валерія. Клінічна. Поки що.' },
        { speaker: 'prof_psy', text: 'Чудово.' },
        { speaker: 'dasha', text: 'Даша. Психологія, спеціалізація визначається.' },
        { speaker: 'prof_psy', text: 'У вас буде 4 роки на рішення.' },
      ],
      next: 'day_end',
    },

    // ---- End of day ----
    day_end: {
      location: 'cafeteria',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'valeria', position: 'right' },
      ],
      onEnter: [fx.objective('first_day', 'survive_day'), fx.completeQuest('first_day')],
      dialogue: [
        { speaker: 'narrator', text: '17:30. День завершився. Перше кафе. Обидві живі.' },
        { speaker: 'valeria', text: 'Отже. Ти справді збираєшся стати відомою сексологинею?' },
        { speaker: 'dasha', text: 'Збираюсь. Я ж не жартую.' },
        { speaker: 'valeria', text: 'Я знаю. Просто хотіла ще раз почути. Для підтримки.' },
        { speaker: 'dasha', text: 'Дякую.' },
        { speaker: 'narrator', text: '— Кінець першого дня —' },
        { speaker: 'narrator', text: '(далі — сценарій 2 буде додано пізніше)' },
      ],
    },
  },
};

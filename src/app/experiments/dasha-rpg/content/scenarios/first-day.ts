import { fx } from '../../engine/evaluators';
import { FLAGS, OBJECTIVES, QUESTS, STATS } from '../../engine/keys';
import { Scenario } from '../../engine/types';

/**
 * Перший день Даші в КШЕ на факультеті психології.
 * Демонструє: зміну локацій, вибори з наслідками, квест з етапами,
 * персонажів із різними емоціями, відсилки до реальних фактів про КШЕ
 * (Милованов, Брік, Case Champ, "Що? Де? Коли?", Houston MA).
 */
export const FIRST_DAY: Scenario = {
  id: QUESTS.FIRST_DAY,
  title: 'Пролог · Як усе почалось',
  startNode: 'arrival',
  nodes: {
    // ---- Entrance ----
    arrival: {
      location: 'kse_entrance',
      characters: [{ id: 'dasha', position: 'center' }],
      onEnter: [fx.startQuest(QUESTS.FIRST_DAY), fx.setStat(STATS.CHARISMA, 5), fx.setStat(STATS.STRESS, 2)],
      dialogue: [
        { speaker: 'narrator', text: '*Спогад. Два роки тому.*' },
        { speaker: 'narrator', text: '8:42 ранку. Київ. Вул. Шпака, 3.' },
        { speaker: 'narrator', text: 'Перший день Даші на факультеті психології КШЕ.' },
        { speaker: 'dasha', text: 'Добре. Глибокий вдих. Я готова.' },
        { speaker: 'dasha', text: '(справді готова? 87 джерел у курсовій не допоможуть, якщо я заблукаю в коридорі)' },
      ],
      choices: [
        {
          text: 'Зробити селфі на вході для Instagram',
          next: 'selfie',
          effects: [fx.stat(STATS.CHARISMA, 1), fx.flag(FLAGS.POSTED_SELFIE)],
          hint: 'Студентський рефлекс',
        },
        {
          text: 'Подзвонити мамі',
          next: 'call_mom',
          effects: [fx.stat(STATS.STRESS, -1)],
          hint: 'Заспокоїтись',
        },
        {
          text: 'Просто зайти',
          next: 'enter_lobby',
          effects: [fx.stat(STATS.CHARISMA, 1)],
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
          effects: [fx.flag(FLAGS.SAID_PSYCHOLOGY)],
        },
        {
          text: '"Сексологія."',
          next: 'security_sex',
          effects: [fx.flag(FLAGS.BOLD_INTRO), fx.stat(STATS.CHARISMA, 2)],
          hint: 'Сміливо. Подивимось на реакцію.',
        },
        {
          text: '"Економіка… ну, майже."',
          next: 'security_maybe',
          effects: [fx.stat(STATS.STRESS, 1)],
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
      onExit: [fx.objective(QUESTS.FIRST_DAY, OBJECTIVES.PASS_SECURITY)],
      next: 'lobby_yasya',
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
      onExit: [fx.objective(QUESTS.FIRST_DAY, OBJECTIVES.PASS_SECURITY), fx.stat(STATS.REPUTATION, 1)],
      next: 'lobby_yasya',
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
      onExit: [fx.objective(QUESTS.FIRST_DAY, OBJECTIVES.PASS_SECURITY)],
      next: 'lobby_yasya',
    },

    // ---- Meet Yasya ----
    lobby_yasya: {
      location: 'kse_lobby',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'yasya', position: 'right' },
      ],
      dialogue: [
        { speaker: 'narrator', text: 'Біля рецепції — знайоме обличчя.' },
        { speaker: 'yasya', text: 'Дашка! Ну хто прийшла зустрічати першокурсницю? Я.' },
        { speaker: 'dasha', text: 'Яся! Ти ж мала бути в семінарі?' },
        { speaker: 'yasya', text: 'Семінар почекає. Ти колись водила мене сюди по коридорах. Тепер моя черга.' },
        { speaker: 'dasha', text: '*обнімає* Дякую. Серйозно. Я думала, що буду одна.' },
        { speaker: 'yasya', text: 'Ні. Сьогодні в тебе є старша подруга з картою КШЕ в голові.' },
        { speaker: 'yasya', text: 'До речі — Милованов нібито виступатиме з привітальним словом. І Брік теж.' },
      ],
      onEnter: [fx.objective(QUESTS.FIRST_DAY, OBJECTIVES.MEET_YASYA)],
      choices: [
        {
          text: '"Покажи мені аудиторію 301."',
          next: 'heading_to_lecture',
          effects: [fx.flag(FLAGS.TEAMED_WITH_YASYA)],
        },
        {
          text: '"А що там на дошці оголошень?"',
          next: 'notice_board',
          hint: 'Дашу тягне до Case Champ-у',
        },
        {
          text: '"Кава перед першою парою?"',
          next: 'cafe_break_early',
          effects: [fx.stat(STATS.STRESS, -1), fx.flag(FLAGS.COFFEE_FIRST)],
        },
      ],
    },

    notice_board: {
      location: 'kse_lobby',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'yasya', position: 'right' },
      ],
      dialogue: [
        { speaker: 'narrator', text: 'На стенді — три оголошення:' },
        { speaker: 'narrator', text: '▸ Case Champ 2026 — реєстрація відкрита.' },
        { speaker: 'narrator', text: '▸ "Що? Де? Коли?" — економічна версія, щочетверга.' },
        { speaker: 'narrator', text: '▸ Волейбольний клуб шукає гравців. Шапка з логотипом у подарунок.' },
        { speaker: 'yasya', text: 'Case Champ — це +стипендія й лінія в резюме. Я в минулому році дійшла до півфіналу.' },
        { speaker: 'dasha', text: 'Я б у ЩДК пішла. Але спершу виживемо до кінця дня.' },
      ],
      next: 'heading_to_lecture',
    },

    cafe_break_early: {
      location: 'cafeteria',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'yasya', position: 'right' },
      ],
      dialogue: [
        { speaker: 'yasya', text: 'Бариста знає мене краще, ніж декан. Замовляю — лате з вівсяним. Тобі — таке ж?' },
        { speaker: 'dasha', text: 'Лате. І печиво. Я нервую.' },
        { speaker: 'narrator', text: 'У кафе вже черга з 10 людей. Усі — першокурсники. Усі нервують.' },
        { speaker: 'yasya', text: 'Перший день — це наче перший раз у спортзалі. Ноги тремтять, але потім звикаєш.' },
        { speaker: 'dasha', text: 'Чомусь від цього трохи легше.' },
      ],
      next: 'heading_to_lecture',
    },

    // ---- Lecture ----
    heading_to_lecture: {
      location: 'lecture_hall',
      characters: [
        { id: 'dasha', position: 'center' },
        { id: 'yasya', position: 'left' },
      ],
      dialogue: [
        { speaker: 'yasya', text: 'Ось вона — 301. Я тебе тут лишаю, у мене своя пара на 4-му.' },
        { speaker: 'yasya', text: 'Не панікуй. Коваленко жорстка, але справедлива. Скажеш правду — буде задоволена.' },
        { speaker: 'dasha', text: 'А якщо я скажу "сексологія"?' },
        { speaker: 'yasya', text: 'Тоді вона запам\'ятає тебе на всі чотири роки. Що, до речі, плюс.' },
        { speaker: 'narrator', text: 'Яся махає рукою і зникає в коридорі.' },
        { speaker: 'narrator', text: 'Аудиторія 301. Порожньо тільки перші п\'ять хвилин. Потім — повна зала.' },
        { speaker: 'narrator', text: 'На дошці вже виведена формула корисності. Бо КШЕ.' },
        { speaker: 'dasha', text: '(глибокий вдих)' },
      ],
      onEnter: [fx.objective(QUESTS.FIRST_DAY, OBJECTIVES.ATTEND_LECTURE)],
      next: 'prof_entrance',
    },

    prof_entrance: {
      location: 'lecture_hall',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'prof_psy', position: 'right' },
      ],
      dialogue: [
        { speaker: 'prof_psy', text: 'Доброго ранку. Я — Олена Коваленко. Курс: "Вступ до психологічної практики".' },
        { speaker: 'prof_psy', text: 'Перші 5 хвилин — знайомство. Кожен встає, називає ім\'я й напрям спеціалізації.' },
        { speaker: 'dasha', text: '(серце в горлі)' },
      ],
      choices: [
        {
          text: 'Одразу сказати "сексологія"',
          next: 'prof_sex',
          effects: [fx.flag(FLAGS.PUBLIC_SEX_CLAIM), fx.stat(STATS.REPUTATION, 2)],
          hint: 'Смілива заявка на репутацію',
        },
        {
          text: 'Сказати "клінічна, можливо, сексологія"',
          next: 'prof_safe',
          hint: 'Обережніший варіант',
        },
        {
          text: 'Пропустити чергу, дати іншим піти першими',
          next: 'prof_wait',
          effects: [fx.stat(STATS.STRESS, 1)],
          hint: 'Виграти час, але потім зайти всіх ходом',
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

    prof_wait: {
      location: 'lecture_hall',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'prof_psy', position: 'right' },
      ],
      dialogue: [
        { speaker: 'narrator', text: 'Шість одногрупників вже представились. Усі — "клінічна", "організаційна". Безпечно.' },
        { speaker: 'prof_psy', text: 'Залишилась одна. Прошу.' },
        { speaker: 'dasha', text: 'Даша. Психологія, спеціалізація — сексологія.' },
        { speaker: 'prof_psy', text: 'Останньою — і одразу унікум. Прийнято.' },
      ],
      next: 'day_end',
    },

    // ---- End of day ----
    day_end: {
      location: 'cafeteria',
      characters: [
        { id: 'dasha', position: 'left' },
        { id: 'yasya', position: 'right' },
      ],
      onEnter: [fx.objective(QUESTS.FIRST_DAY, OBJECTIVES.SURVIVE_DAY), fx.completeQuest(QUESTS.FIRST_DAY)],
      dialogue: [
        { speaker: 'narrator', text: '17:30. День завершився. Перше кафе. Яся вже з лате.' },
        { speaker: 'yasya', text: 'Ну? Жива?' },
        { speaker: 'dasha', text: 'Жива. Коваленко мене запам\'ятала. Не впевнена, що в хорошому сенсі.' },
        { speaker: 'yasya', text: 'У хорошому. У КШЕ "запам\'ятали" = "є на радарі". Це база.' },
        { speaker: 'yasya', text: 'Отже. Ти справді збираєшся стати відомою сексологинею?' },
        { speaker: 'dasha', text: 'Збираюсь. Я ж не жартую.' },
        { speaker: 'yasya', text: 'Знаю. Просто хотіла ще раз почути. Для підтримки.' },
        { speaker: 'dasha', text: 'Дякую. За все.' },
        { speaker: 'yasya', text: 'Тільки не звикай — у мене за тиждень два дедлайни і я зникну.' },
      ],
    },
  },
  epilogue: {
    headline: 'Кінець першого дня',
    lines: [
      '18:20. Метро червоної. Даша перевіряє Instagram — 124 лайки на селфі з входу. Лайк від @mylovanov — досі стоїть.',
      '19:05. Квартира. Олеся надсилає фото з американського кампусу: «тут кава в "старбаксі" за 6 доларів». Даша відповідає фотографією конспекту: «тут функція корисності за безцінь».',
      '21:40. Ліза повернулась із Ретровіля, принесла пів-тірамісу. Каструля не стукнула. Прогрес.',
      'Саша: «приїду в середу. Максимум три дні, я памʼятаю».',
      '23:50. Курсова під подушкою. 87 джерел. Наснилось 88-ме.',
      '— Далі буде —',
    ],
  },
};

import { CharacterDef, CharacterId } from '../engine/types';
import { renderCatSprite } from '../render/cat-sprite';
import { renderHumanSprite } from '../render/human-sprite';
import { renderDashaSprite } from './character-renderers';

/**
 * Registry of every named character. Dasha keeps her custom pixel-art sprite
 * (reference-photo tuned); everyone else uses the parameterized human-sprite
 * builder with per-character configs. Max the cat has his own cat-sprite
 * builder. Emoji avatars are no longer used for primary characters.
 */
export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  dasha: {
    id: 'dasha',
    name: 'Даша',
    color: 0xcdb4db,
    render: (scene) => renderDashaSprite(scene),
    voice: { lang: 'uk-UA', pitch: 1.25, rate: 1.1, volume: 1.0 },
    hook: 'Це я. 19, 3 курс психології КШЕ, майбутня сексологиня. З Лелюхівки — в топи.',
    bio: 'Дарія Гак, с. Лелюхівка → Київ. 3 курс КШЕ, психологія, напрям сексології.',
  },
  valeria: {
    id: 'valeria',
    name: 'Валерія Палій',
    color: 0xb56a8c,
    render: (scene) =>
      renderHumanSprite(scene, {
        id: 'valeria',
        gender: 'f',
        skin: 0xfad7b8,
        hair: { color: 0xd9864a, style: 'long-curly' },
        eye: 0x6a4a2a,
        shirt: { color: 0xfdf4ec, style: 'collared' },
        jacket: { color: 0x7a3a4a },
        accessory: 'earrings',
        accessoryColor: 0xe0c060,
      }),
    voice: { lang: 'uk-UA', pitch: 1.05, rate: 1.05, volume: 1.0 },
    hook: 'Моя викладачка. «Маленька правочка» = два тижні.',
    bio: 'Викладачка КШЕ, з якою у Даші тісний контакт. Керівниця в кількох спільних статтях; Даша часто допомагає з організацією подій і презентацій.',
  },
  yasya: {
    id: 'yasya',
    name: 'Яся',
    color: 0xe28a4a,
    render: (scene) =>
      renderHumanSprite(scene, {
        id: 'yasya',
        gender: 'f',
        skin: 0xf5c9a3,
        hair: { color: 0x8a5a3a, style: 'medium' },
        eye: 0x5a3a2a,
        shirt: { color: 0xf0e4d0, style: 'plain' },
        jacket: { color: 0x6a7a4a },
      }),
    voice: { lang: 'uk-UA', pitch: 1.0, rate: 0.98, volume: 1.0 },
    hook: 'Подруга, 30, 2 курс. Я на рік її старша за курсом, вона мене — за віком.',
    bio: 'Подруга Даші, ~30 років. 2 курс психології КШЕ — торік прийшла мати-студенткою. Даша (тоді 2 курс) була її баді: вводила в курс справ. Тепер Яся, хоча й молодша за курсом, підтримує як старша подруга.',
  },
  olesia: {
    id: 'olesia',
    name: 'Олеся',
    color: 0xe8b04a,
    render: (scene) =>
      renderHumanSprite(scene, {
        id: 'olesia',
        gender: 'f',
        skin: 0xfde0b8,
        hair: { color: 0xd4a046, style: 'ponytail' },
        eye: 0x4a6b8c,
        shirt: { color: 0xfaf4e8, style: 'collared' },
        jacket: { color: 0xd49a30 },
        accessory: 'glasses',
        accessoryColor: 0x2a1c10,
      }),
    voice: { lang: 'uk-UA', pitch: 1.1, rate: 1.0, volume: 1.0 },
    hook: 'Сусідка-економістка. На обміні в США. Excel на ранкову рутину.',
    bio: 'Співмешканка. Економіка КШЕ. Дисциплінована як бюджет. Зараз на обміні в американському університеті — 3 місяці, тимчасово не в квартирі.',
  },
  liza: {
    id: 'liza',
    name: 'Ліза',
    color: 0xd9527a,
    render: (scene) =>
      renderHumanSprite(scene, {
        id: 'liza',
        gender: 'f',
        skin: 0xffd4b8,
        hair: { color: 0x3a2218, style: 'long' },
        eye: 0x4a3a2a,
        shirt: { color: 0xe68aa3, style: 'plain' },
      }),
    voice: { lang: 'uk-UA', pitch: 1.15, rate: 1.05, volume: 0.98 },
    hook: 'Сусідка. О 2-й — її зміна, моя безсонниця.',
    bio: 'Співмешканка. Економіка КШЕ + офіціантка в Ретровілі. Повертається о 2-й. Любить поспати у вихідні. Автор SLA «Саша ≤ 3 дні на тиждень».',
  },
  sasha: {
    id: 'sasha',
    name: 'Саша',
    color: 0x3d4a5c,
    render: (scene) =>
      renderHumanSprite(scene, {
        id: 'sasha',
        gender: 'm',
        skin: 0xe8b68a,
        hair: { color: 0x3a2418, style: 'short' },
        eye: 0x4a3018,
        shirt: { color: 0x4a5268, style: 'plain' },
        facialHair: 'stubble',
      }),
    voice: { lang: 'uk-UA', pitch: 0.85, rate: 1.0, volume: 1.0 },
    hook: 'Хлопець. Обухів, Golf, Shorts & Reels. Ревную до Golf-а.',
    bio: 'Хлопець Даші, 23. Програміст. Живе в Обухові. Чорний Golf універсал, дизель — пробіг пам\'ятаю краще, ніж наші дати. Прокрастинує в Shorts і Reels, потім допрацьовує до ночі.',
  },
  max_cat: {
    id: 'max_cat',
    name: 'Кіт Макс',
    color: 0xb58868,
    render: (scene) =>
      renderCatSprite(scene, {
        id: 'max_cat',
        fur: 0xa87a4a,
        belly: 0xf0d4a0,
        eye: 0xc0a848,
        stripes: true,
      }),
    voice: { lang: 'uk-UA', pitch: 1.8, rate: 1.1, volume: 0.9 },
    hook: 'Єдина поважна причина їхати в Обухов.',
    bio: 'Шотландський прямовухий. Живе в Саши в Обухові. Терапевт без диплома.',
  },
  mylovanov: {
    id: 'mylovanov',
    name: 'Президент Милованов',
    color: 0x1b3a5f,
    render: (scene) =>
      renderHumanSprite(scene, {
        id: 'mylovanov',
        gender: 'm',
        skin: 0xf0c8a0,
        hair: { color: 0x5a4a3a, style: 'short' },
        eye: 0x3a2a18,
        shirt: { color: 0xfdfbf5, style: 'collared' },
        jacket: { color: 0x1a2840 },
        accessory: 'tie',
        accessoryColor: 0x8a1a2a,
      }),
    voice: { lang: 'uk-UA', pitch: 0.75, rate: 0.95, volume: 1.0 },
    hook: 'Лайкнув моє селфі. ПРЕЗИДЕНТ. Лайкнув. Селфі.',
    bio: 'Президент КШЕ. PhD Wisconsin. Колишній міністр економіки. Twitter-економіст (@Mylovanov).',
  },
  brik: {
    id: 'brik',
    name: 'Ректор Брік',
    color: 0x355c7d,
    render: (scene) =>
      renderHumanSprite(scene, {
        id: 'brik',
        gender: 'm',
        skin: 0xe8b890,
        hair: { color: 0x2a1c14, style: 'short' },
        eye: 0x2a1c10,
        shirt: { color: 0xf0f4fa, style: 'collared' },
        jacket: { color: 0x2a3a5c },
        accessory: 'tie',
        accessoryColor: 0x2a5c4a,
      }),
    voice: { lang: 'uk-UA', pitch: 0.85, rate: 1.0, volume: 1.0 },
    hook: 'Ректор-соціолог. Цілий день у network analysis.',
    bio: 'Ректор КШЕ з 2022. Соціолог релігії, PhD Мадрид, магістр Утрехт. Сповідує network analysis.',
  },
  prof_psy: {
    id: 'prof_psy',
    name: 'Проф. Коваленко',
    color: 0x7a5ea8,
    render: (scene) =>
      renderHumanSprite(scene, {
        id: 'prof_psy',
        gender: 'f',
        skin: 0xf0d4b0,
        hair: { color: 0x8a6a7a, style: 'bun' },
        eye: 0x4a3a5a,
        shirt: { color: 0xf8e8dc, style: 'collared' },
        jacket: { color: 0x5a3a6a },
        accessory: 'glasses',
        accessoryColor: 0x3a2a1a,
      }),
    voice: { lang: 'uk-UA', pitch: 1.05, rate: 0.95, volume: 1.0 },
    hook: 'Жорстка. Справедлива. Кава без цукру.',
    bio: 'Викладачка психології КШЕ. Шанує CBT і каву без цукру. «Запам\'ятала» = є на радарі.',
  },
  yegor: {
    id: 'yegor',
    name: 'Єгор',
    color: 0x4a6b8c,
    render: (scene) =>
      renderHumanSprite(scene, {
        id: 'yegor',
        gender: 'm',
        skin: 0xe8b890,
        hair: { color: 0x2a1c18, style: 'balding' },
        eye: 0x2a1c10,
        shirt: { color: 0x4a6b8c, style: 'collared' },
        facialHair: 'beard',
      }),
    voice: { lang: 'uk-UA', pitch: 0.9, rate: 1.0, volume: 1.0 },
    hook: '«Співавтор» статті про ветеранів. Пише одне слово — своє ім\'я.',
    bio: 'Викладач, співавтор Даші по дослідженню про сексуальну реабілітацію поранених ветеранів. Важко шукати респондентів, а Єгор мало включається — хоч і буде першим автором.',
  },
  security: {
    id: 'security',
    name: 'Охоронець Петро',
    color: 0x5a6b4d,
    render: (scene) =>
      renderHumanSprite(scene, {
        id: 'security',
        gender: 'm',
        skin: 0xd9a880,
        hair: { color: 0x5a5a5a, style: 'short' },
        eye: 0x3a3a2a,
        shirt: { color: 0x3a4a2e, style: 'uniform' },
        accessory: 'hat-cap',
        accessoryColor: 0x2a3a1e,
        facialHair: 'mustache',
      }),
    voice: { lang: 'uk-UA', pitch: 0.7, rate: 0.9, volume: 1.0 },
    hook: '«Сексологія — це вид спорту?» Тепер знає, що ні.',
    bio: 'Бастіон перепустки на вході КШЕ. Знає всіх в обличчя. Майже.',
  },
  alex: {
    id: 'alex',
    name: 'Олекс',
    color: 0x3d7d9a,
    render: (scene) =>
      renderHumanSprite(scene, {
        id: 'alex',
        gender: 'm',
        skin: 0xfad2b0,
        hair: { color: 0x4a3a2a, style: 'short' },
        eye: 0x3a5a7a,
        shirt: { color: 0x9a4a5a, style: 'plain' },
        accessory: 'glasses',
        accessoryColor: 0x2a2a2a,
      }),
    voice: { lang: 'uk-UA', pitch: 0.95, rate: 1.1, volume: 0.95 },
    hook: 'Одногрупник. Другий тиждень — уже планує Гарвард.',
    bio: 'Першокурсник-економіст КШЕ. Уже планує вступати в Гарвард на магістра. Ми на другому тижні.',
  },
  marta: {
    id: 'marta',
    name: 'Марта',
    color: 0xb28a6a,
    render: (scene) =>
      renderHumanSprite(scene, {
        id: 'marta',
        gender: 'f',
        skin: 0xe8b68a,
        hair: { color: 0x6a3a2a, style: 'long-curly' },
        eye: 0x4a2a18,
        shirt: { color: 0xb28a5a, style: 'plain' },
        accessory: 'scarf',
        accessoryColor: 0x8a3a4a,
      }),
    voice: { lang: 'uk-UA', pitch: 1.3, rate: 0.9, volume: 0.95 },
    hook: 'Арт-клуб. На 2-й парі — філософія, на 3-й — дзен.',
    bio: 'Одногрупниця з арт-клубу. Живопис, філософія на 2-й парі. Її спокій — підозріло ефективний.',
  },
};

export function getCharacter(id: CharacterId | 'narrator'): CharacterDef | null {
  if (id === 'narrator') return null;
  return CHARACTERS[id] ?? null;
}

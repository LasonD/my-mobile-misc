import { CharacterDef, CharacterId } from '../engine/types';
import { renderDashaSprite, renderEmojiAvatar } from './character-renderers';

/**
 * Registry of every named character that can appear in any scenario.
 * Secondary characters use an emoji + framed-circle avatar. Dasha has a
 * custom pixel-art sprite (from the earlier Dasha game) with blink & sway.
 */
export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  dasha: {
    id: 'dasha',
    name: 'Даша',
    color: 0xcdb4db,
    render: (scene) => renderDashaSprite(scene),
    voice: { lang: 'uk-UA', pitch: 1.25, rate: 1.1, volume: 1.0 },
    bio: 'Дарія Гак, с. Лелюхівка → Київ. Першокурсниця КШЕ, психологія, напрям сексології.',
  },
  valeria: {
    id: 'valeria',
    name: 'Валерія Палій',
    color: 0xb56a8c,
    render: (scene) =>
      renderEmojiAvatar(scene, { emoji: '\u{1F469}\u200D\u{1F3EB}', ring: 0xb56a8c, bg: 0xf6e4ec }), // 👩‍🏫
    voice: { lang: 'uk-UA', pitch: 1.05, rate: 1.05, volume: 1.0 },
    bio: 'Викладачка КШЕ, з якою у Даши тісний контакт. Керівниця в кількох спільних статтях; Даша часто допомагає з організацією подій і презентацій.',
  },
  yasya: {
    id: 'yasya',
    name: 'Яся',
    color: 0xe28a4a,
    render: (scene) =>
      renderEmojiAvatar(scene, { emoji: '\u{1F469}\u200D\u{1F393}', ring: 0xe28a4a, bg: 0xfceedc }), // 👩‍🎓
    voice: { lang: 'uk-UA', pitch: 1.0, rate: 0.98, volume: 1.0 },
    bio: 'Подруга Даши, ~30 років, психологія КШЕ (старший курс). Колись Даша була її баді на першому курсі — вводила в курс справ. Тепер Яся повертає послугу.',
  },
  olesia: {
    id: 'olesia',
    name: 'Олеся',
    color: 0xe8b04a,
    render: (scene) =>
      renderEmojiAvatar(scene, { emoji: '\u{1F469}\u200D\u{1F4BC}', ring: 0xe8b04a, bg: 0xfff5dc }), // 👩‍💼
    voice: { lang: 'uk-UA', pitch: 1.1, rate: 1.0, volume: 1.0 },
    bio: 'Співмешканка. Економіка КШЕ. Дисциплінована як бюджет.',
  },
  liza: {
    id: 'liza',
    name: 'Ліза',
    color: 0xd9527a,
    render: (scene) =>
      renderEmojiAvatar(scene, { emoji: '\u{1F469}\u200D\u{1F373}', ring: 0xd9527a, bg: 0xfce3ec }), // 👩‍🍳
    voice: { lang: 'uk-UA', pitch: 1.15, rate: 1.05, volume: 0.98 },
    bio: 'Співмешканка. Економіка КШЕ + офіціантка. Повертається о 2-й.',
  },
  sasha: {
    id: 'sasha',
    name: 'Саша',
    color: 0x3d4a5c,
    render: (scene) =>
      renderEmojiAvatar(scene, { emoji: '\u{1F468}\u200D\u{1F527}', ring: 0x3d4a5c, bg: 0xe5e9ef }), // 👨‍🔧
    voice: { lang: 'uk-UA', pitch: 0.85, rate: 1.0, volume: 1.0 },
    bio: 'Хлопець Даши. Живе аж в Обухові. Чорний Golf універсал, дизель.',
  },
  max_cat: {
    id: 'max_cat',
    name: 'Кіт Макс',
    color: 0xb58868,
    render: (scene) =>
      renderEmojiAvatar(scene, { emoji: '\u{1F431}', ring: 0xb58868, bg: 0xf3e3d2 }), // 🐱
    voice: { lang: 'uk-UA', pitch: 1.8, rate: 1.1, volume: 0.9 },
    bio: 'Шотландський прямовухий. Живе в Обухові. Єдина причина туди їздити.',
  },
  mylovanov: {
    id: 'mylovanov',
    name: 'Президент Милованов',
    color: 0x1b3a5f,
    render: (scene) =>
      renderEmojiAvatar(scene, { emoji: '\u{1F9D1}\u200D\u{1F4BC}', ring: 0x1b3a5f, bg: 0xeaf0f8 }), // 🧑‍💼
    voice: { lang: 'uk-UA', pitch: 0.75, rate: 0.95, volume: 1.0 },
    bio: 'Президент КШЕ. PhD Wisconsin. Колишній міністр економіки. Twitter-економіст.',
  },
  brik: {
    id: 'brik',
    name: 'Ректор Брік',
    color: 0x355c7d,
    render: (scene) =>
      renderEmojiAvatar(scene, { emoji: '\u{1F468}\u200D\u{1F3EB}', ring: 0x355c7d, bg: 0xe6eef3 }), // 👨‍🏫
    voice: { lang: 'uk-UA', pitch: 0.85, rate: 1.0, volume: 1.0 },
    bio: 'Ректор КШЕ з 2022. Соціолог (PhD Мадрид). Сповідує network analysis.',
  },
  prof_psy: {
    id: 'prof_psy',
    name: 'Проф. Коваленко',
    color: 0x7a5ea8,
    render: (scene) =>
      renderEmojiAvatar(scene, { emoji: '\u{1F469}\u200D\u{1F3EB}', ring: 0x7a5ea8, bg: 0xf1ebfa }), // 👩‍🏫
    voice: { lang: 'uk-UA', pitch: 1.05, rate: 0.95, volume: 1.0 },
    bio: 'Викладачка психології. Шанує CBT і каву без цукру.',
  },
  yegor: {
    id: 'yegor',
    name: 'Єгор',
    color: 0x4a6b8c,
    render: (scene) =>
      renderEmojiAvatar(scene, { emoji: '\u{1F468}\u200D\u{1F3EB}', ring: 0x4a6b8c, bg: 0xe8eff5 }), // 👨‍🏫
    voice: { lang: 'uk-UA', pitch: 0.9, rate: 1.0, volume: 1.0 },
    bio: 'Викладач, співавтор Даши по дослідженню про сексуальну реабілітацію ветеранів. Ідеолог "давай ти все напишеш, я підпишу".',
  },
  security: {
    id: 'security',
    name: 'Охоронець Петро',
    color: 0x5a6b4d,
    render: (scene) =>
      renderEmojiAvatar(scene, { emoji: '\u{1F482}', ring: 0x5a6b4d, bg: 0xeef0e7 }), // 💂
    voice: { lang: 'uk-UA', pitch: 0.7, rate: 0.9, volume: 1.0 },
    bio: 'Бастіон перепустки. Знає всіх в обличчя. Майже.',
  },
  alex: {
    id: 'alex',
    name: 'Олекс',
    color: 0x3d7d9a,
    render: (scene) =>
      renderEmojiAvatar(scene, { emoji: '\u{1F913}', ring: 0x3d7d9a, bg: 0xe7f2f7 }), // 🤓
    voice: { lang: 'uk-UA', pitch: 0.95, rate: 1.1, volume: 0.95 },
    bio: 'Першокурсник-економіст. Уже планує вступати в Гарвард.',
  },
  marta: {
    id: 'marta',
    name: 'Марта',
    color: 0xb28a6a,
    render: (scene) =>
      renderEmojiAvatar(scene, { emoji: '\u{1F9DA}\u200D\u2640\uFE0F', ring: 0xb28a6a, bg: 0xf6ede3 }), // 🧚‍♀️
    voice: { lang: 'uk-UA', pitch: 1.3, rate: 0.9, volume: 0.95 },
    bio: 'Арт-клуб, живопис, філософія на 2-й парі.',
  },
};

export function getCharacter(id: CharacterId | 'narrator'): CharacterDef | null {
  if (id === 'narrator') return null;
  return CHARACTERS[id] ?? null;
}

import * as Phaser from 'phaser';

import { LocationId } from '../engine/types';

/**
 * Background music / ambient loop manager for the Dasha RPG.
 *
 * Music is only used on the title screen. All in-game locations use field-
 * recording ambience (birds, crowd murmur, crickets) rather than music.
 *
 * Audio files live in `src/assets/dasha-rpg/sounds/` and are loaded on scene
 * preload. If a file is missing (e.g. the user hasn't downloaded it yet), the
 * loader emits `loaderror` and we simply skip it — silence is the fallback so
 * the game never breaks over missing audio.
 *
 * Credits:
 *   title-theme.ogg       — "Meadow Thoughts" (harp). Public domain (CC0).
 *   amb-street.mp3        — "Forest Ambience". Public domain (CC0).
 *   amb-dormitory.mp3     — "Crickets ambient noise". Public domain (CC0).
 *   amb-lobby.mp3         — "Crowd - school excursion" by Gregor Quendel.
 *                           Licensed under CC-BY-SA 4.0.
 *   amb-cafeteria.mp3     — "Crowd - mall ambience" by Gregor Quendel.
 *                           Licensed under CC-BY-SA 4.0.
 */

const BASE = 'assets/dasha-rpg/sounds';

export const AUDIO_KEYS = {
  titleTheme: 'amb_title_theme',
  street: 'amb_street',
  lobby: 'amb_lobby',
  lecture: 'amb_lecture',
  cafeteria: 'amb_cafeteria',
  dormitory: 'amb_dormitory',
} as const;

/**
 * Each entry lists both a primary and a fallback path so the loader tries
 * whichever format the browser supports first. Missing keys (no file on disk)
 * fail silently via `preloadAudio`'s loaderror handler.
 */
export const AUDIO_FILES: Array<{ key: string; paths: string[] }> = [
  { key: AUDIO_KEYS.titleTheme, paths: [`${BASE}/title-theme.ogg`, `${BASE}/title-theme.mp3`] },
  { key: AUDIO_KEYS.street, paths: [`${BASE}/amb-street.mp3`, `${BASE}/amb-street.ogg`] },
  { key: AUDIO_KEYS.lobby, paths: [`${BASE}/amb-lobby.mp3`, `${BASE}/amb-lobby.ogg`] },
  { key: AUDIO_KEYS.lecture, paths: [`${BASE}/amb-lecture.mp3`, `${BASE}/amb-lecture.ogg`] },
  { key: AUDIO_KEYS.cafeteria, paths: [`${BASE}/amb-cafeteria.mp3`, `${BASE}/amb-cafeteria.ogg`] },
  { key: AUDIO_KEYS.dormitory, paths: [`${BASE}/amb-dormitory.mp3`, `${BASE}/amb-dormitory.ogg`] },
];

const LOCATION_TO_KEY: Record<LocationId, string | undefined> = {
  kse_entrance: AUDIO_KEYS.street,
  kse_lobby: AUDIO_KEYS.lobby,
  lecture_hall: AUDIO_KEYS.lecture,
  cafeteria: AUDIO_KEYS.cafeteria,
  dormitory: AUDIO_KEYS.dormitory,
};

const AMBIENT_TARGET_VOLUME = 0.35;
const THEME_TARGET_VOLUME = 0.45;
const FADE_MS = 900;

/**
 * Enqueues all ambient files on a scene's loader. Safe to call multiple times
 * — already-cached keys are skipped. Missing files are swallowed silently via
 * a `loaderror` listener.
 */
export function preloadAudio(scene: Phaser.Scene) {
  for (const entry of AUDIO_FILES) {
    if (scene.cache.audio.exists(entry.key)) continue;
    scene.load.audio(entry.key, entry.paths);
  }
  scene.load.on('loaderror', (file: Phaser.Loader.File) => {
    // Any of our audio files that are missing — just ignore. Silence fallback.
    if (file.type === 'audio') {
      // no-op; AmbientPlayer will check cache.exists before playing
    }
  });
}

/**
 * Handles fading the currently-playing ambient in/out and swapping to a new
 * one when the player changes location. Title theme is a separate channel so
 * it can coexist (e.g. brief overlap during scene swap).
 */
export class AmbientPlayer {
  private current?: Phaser.Sound.BaseSound;
  private currentKey?: string;

  constructor(private scene: Phaser.Scene) {}

  /** Plays the ambient loop mapped to the given location. Safe if missing. */
  playForLocation(locationId: LocationId) {
    const key = LOCATION_TO_KEY[locationId];
    if (!key) {
      this.fadeOutCurrent();
      return;
    }
    this.playKey(key, AMBIENT_TARGET_VOLUME);
  }

  /** Plays a specific audio key; cross-fades from current if different. */
  playKey(key: string, targetVolume: number) {
    if (this.currentKey === key) return;
    if (!this.scene.cache.audio.exists(key)) {
      this.fadeOutCurrent();
      return;
    }

    const next = this.scene.sound.add(key, { loop: true, volume: 0 });
    try {
      next.play();
    } catch {
      next.destroy();
      return;
    }

    this.scene.tweens.add({
      targets: next,
      volume: targetVolume,
      duration: FADE_MS,
      ease: 'Sine.easeInOut',
    });

    this.fadeOutCurrent();
    this.current = next;
    this.currentKey = key;
  }

  private fadeOutCurrent() {
    const prev = this.current;
    this.current = undefined;
    this.currentKey = undefined;
    if (!prev) return;
    this.scene.tweens.add({
      targets: prev,
      volume: 0,
      duration: FADE_MS,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        try {
          prev.stop();
        } catch {
          /* ignore */
        }
        prev.destroy();
      },
    });
  }

  /** Immediately stops and disposes the current sound. Use on scene shutdown. */
  dispose() {
    const prev = this.current;
    this.current = undefined;
    this.currentKey = undefined;
    if (!prev) return;
    try {
      prev.stop();
    } catch {
      /* ignore */
    }
    prev.destroy();
  }
}

/** Convenience for the title screen — plays the title theme at gentle volume. */
export function playTitleTheme(scene: Phaser.Scene): AmbientPlayer {
  const player = new AmbientPlayer(scene);
  player.playKey(AUDIO_KEYS.titleTheme, THEME_TARGET_VOLUME);
  return player;
}

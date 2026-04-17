import type { Speaker } from './dialogue-data';

interface VoiceProfile {
  lang: string;
  pitch: number; // 0-2
  rate: number; // 0.1-10
  volume: number; // 0-1
}

const PROFILES: Record<Speaker, VoiceProfile> = {
  narrator: { lang: 'uk-UA', pitch: 0.9, rate: 1.0, volume: 0.7 },
  dasha: { lang: 'uk-UA', pitch: 1.25, rate: 1.1, volume: 1.0 },
  professor: { lang: 'uk-UA', pitch: 0.7, rate: 0.92, volume: 1.0 },
  client1: { lang: 'uk-UA', pitch: 0.95, rate: 1.25, volume: 0.95 },
  wife: { lang: 'uk-UA', pitch: 1.35, rate: 1.05, volume: 1.0 },
  husband: { lang: 'uk-UA', pitch: 0.8, rate: 1.0, volume: 1.0 },
  client3: { lang: 'uk-UA', pitch: 1.0, rate: 0.95, volume: 0.9 },
};

/** Strips action markers like *робить записи* and leading/trailing whitespace. */
function cleanForSpeech(text: string): string {
  return text
    .replace(/\*[^*]+\*/g, '')
    .replace(/[♥️\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export class Voice {
  private synth: SpeechSynthesis | null =
    typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  private enabled = true;

  /** Returns the best-match voice for the given locale, or null if none. */
  private pickVoice(lang: string): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    const voices = this.synth.getVoices();
    if (!voices.length) return null;
    const exact = voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase());
    if (exact) return exact;
    const prefix = lang.split('-')[0].toLowerCase();
    const close = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
    return close ?? voices.find((v) => v.default) ?? voices[0];
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) this.cancel();
  }

  cancel() {
    this.synth?.cancel();
  }

  say(text: string, who: Speaker) {
    if (!this.enabled || !this.synth) return;
    const cleaned = cleanForSpeech(text);
    if (!cleaned) return;

    this.synth.cancel();

    const utter = new SpeechSynthesisUtterance(cleaned);
    const profile = PROFILES[who];
    utter.lang = profile.lang;
    utter.pitch = profile.pitch;
    utter.rate = profile.rate;
    utter.volume = profile.volume;

    const voice = this.pickVoice(profile.lang);
    if (voice) utter.voice = voice;

    this.synth.speak(utter);
  }
}

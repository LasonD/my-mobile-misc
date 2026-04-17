import type { VoiceProfile } from '../engine/types';

const DEFAULT_PROFILE: VoiceProfile = { lang: 'uk-UA', pitch: 1.0, rate: 1.0, volume: 1.0 };

function cleanForSpeech(text: string): string {
  return text
    .replace(/\*[^*]+\*/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[♥️\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export class Voice {
  private synth: SpeechSynthesis | null =
    typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  private enabled = true;

  private pickVoice(lang: string): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    const voices = this.synth.getVoices();
    if (!voices.length) return null;
    const exact = voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase());
    if (exact) return exact;
    const prefix = lang.split('-')[0].toLowerCase();
    return voices.find((v) => v.lang.toLowerCase().startsWith(prefix))
      ?? voices.find((v) => v.default)
      ?? voices[0];
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) this.cancel();
  }

  cancel() {
    this.synth?.cancel();
  }

  say(text: string, profile: VoiceProfile = DEFAULT_PROFILE) {
    if (!this.enabled || !this.synth) return;
    const cleaned = cleanForSpeech(text);
    if (!cleaned) return;
    this.synth.cancel();

    const utter = new SpeechSynthesisUtterance(cleaned);
    utter.lang = profile.lang;
    utter.pitch = profile.pitch;
    utter.rate = profile.rate;
    utter.volume = profile.volume;
    const voice = this.pickVoice(profile.lang);
    if (voice) utter.voice = voice;
    this.synth.speak(utter);
  }
}

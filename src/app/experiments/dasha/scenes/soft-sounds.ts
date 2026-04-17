type AudioContextCtor = typeof AudioContext;

/**
 * Soft, feminine SFX palette for the Dasha game.
 * All sounds are procedurally generated via WebAudio — no external assets.
 */
export class SoftSounds {
  private ctx: AudioContext | null = null;
  private enabled = true;

  constructor() {
    const Ctor: AudioContextCtor | undefined =
      (window.AudioContext as AudioContextCtor) ||
      ((window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext);
    if (Ctor) this.ctx = new Ctor();
  }

  resume() {
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
  }

  setEnabled(on: boolean) {
    this.enabled = on;
  }

  dispose() {
    void this.ctx?.close();
    this.ctx = null;
  }

  pop() {
    // gentle bubble-pop: high sine blip
    this.tone({ type: 'sine', fromHz: 900, toHz: 420, duration: 0.1, volume: 0.14 });
  }

  good() {
    // light two-note "ding"
    this.tone({ type: 'sine', fromHz: 740, toHz: 740, duration: 0.14, volume: 0.1 });
    this.toneAt(this.now() + 0.06, { type: 'sine', fromHz: 990, toHz: 990, duration: 0.16, volume: 0.12 });
  }

  bonus() {
    // sparkle arpeggio
    const base = this.now();
    [523, 659, 784, 988].forEach((hz, i) => {
      this.toneAt(base + i * 0.05, { type: 'triangle', fromHz: hz, toHz: hz, duration: 0.14, volume: 0.1 });
    });
  }

  insight() {
    // warm chord
    const base = this.now();
    [440, 554, 660].forEach((hz) => {
      this.toneAt(base, { type: 'sine', fromHz: hz, toHz: hz, duration: 0.5, volume: 0.09 });
    });
  }

  wrong() {
    // soft "ой"
    this.tone({ type: 'triangle', fromHz: 360, toHz: 180, duration: 0.28, volume: 0.18 });
  }

  miss() {
    // quiet low thud
    this.tone({ type: 'sine', fromHz: 180, toHz: 90, duration: 0.18, volume: 0.1 });
  }

  page() {
    // short paper-turn click
    this.noise({ duration: 0.06, volume: 0.08, decay: 4 });
  }

  levelUp() {
    const base = this.now();
    [440, 554, 659, 880].forEach((hz, i) => {
      this.toneAt(base + i * 0.11, {
        type: 'triangle',
        fromHz: hz,
        toHz: hz * 1.02,
        duration: 0.28,
        volume: 0.13,
      });
    });
  }

  finale() {
    // triumphant chord progression
    const base = this.now();
    const chords = [
      [392, 494, 587], // G
      [440, 554, 659], // A
      [523, 659, 784], // C
      [587, 740, 880], // D
    ];
    chords.forEach((chord, i) => {
      const start = base + i * 0.32;
      chord.forEach((hz) => {
        this.toneAt(start, { type: 'sine', fromHz: hz, toHz: hz, duration: 0.4, volume: 0.1 });
      });
    });
  }

  // ---- primitives ----

  private now() {
    return this.ctx?.currentTime ?? 0;
  }

  private tone(opts: { type: OscillatorType; fromHz: number; toHz: number; duration: number; volume: number }) {
    this.toneAt(this.now(), opts);
  }

  private toneAt(
    startAt: number,
    opts: { type: OscillatorType; fromHz: number; toHz: number; duration: number; volume: number }
  ) {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = opts.type;
    osc.frequency.setValueAtTime(opts.fromHz, startAt);
    if (opts.fromHz !== opts.toHz) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(opts.toHz, 1), startAt + opts.duration);
    }
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(opts.volume, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + opts.duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + opts.duration + 0.05);
  }

  private noise(opts: { duration: number; volume: number; decay: number }) {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx;
    const start = this.now();
    const samples = Math.floor(ctx.sampleRate * opts.duration);
    const buf = ctx.createBuffer(1, samples, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, opts.decay);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(opts.volume, start);
    src.connect(gain).connect(ctx.destination);
    src.start(start);
    src.stop(start + opts.duration + 0.02);
  }
}

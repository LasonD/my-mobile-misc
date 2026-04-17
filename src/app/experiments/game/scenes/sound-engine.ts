type AudioContextCtor = typeof AudioContext;

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;

  constructor() {
    const Ctor: AudioContextCtor | undefined =
      (window.AudioContext as AudioContextCtor) ||
      ((window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext);
    if (Ctor) this.ctx = new Ctor();
  }

  /** Call from a user-gesture handler so the browser unlocks audio output. */
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

  // ---- Effects ----

  launch() {
    this.tone({ type: 'square', fromHz: 320, toHz: 920, duration: 0.18, volume: 0.12 });
  }

  explosion() {
    this.noise({ duration: 0.45, volume: 0.28, decay: 2.2 });
    this.tone({ type: 'triangle', fromHz: 200, toHz: 60, duration: 0.3, volume: 0.18 });
  }

  smallHit() {
    this.tone({ type: 'square', fromHz: 600, toHz: 300, duration: 0.1, volume: 0.1 });
  }

  enemyShot() {
    this.tone({ type: 'sawtooth', fromHz: 140, toHz: 70, duration: 0.12, volume: 0.1 });
  }

  droneDown() {
    this.tone({ type: 'sine', fromHz: 240, toHz: 40, duration: 0.25, volume: 0.18 });
  }

  loseLife() {
    this.tone({ type: 'triangle', fromHz: 460, toHz: 160, duration: 0.35, volume: 0.22 });
  }

  gameOver() {
    const steps = [520, 420, 330, 240];
    steps.forEach((hz, i) => {
      this.toneAt(this.now() + i * 0.16, {
        type: 'triangle',
        fromHz: hz,
        toHz: hz * 0.85,
        duration: 0.28,
        volume: 0.16,
      });
    });
  }

  // ---- Primitives ----

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
    osc.frequency.exponentialRampToValueAtTime(Math.max(opts.toHz, 1), startAt + opts.duration);
    gain.gain.setValueAtTime(opts.volume, startAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + opts.duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + opts.duration + 0.02);
  }

  private noise(opts: { duration: number; volume: number; decay: number }) {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx;
    const startAt = this.now();
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
    gain.gain.setValueAtTime(opts.volume, startAt);
    src.connect(gain).connect(ctx.destination);
    src.start(startAt);
    src.stop(startAt + opts.duration + 0.02);
  }
}

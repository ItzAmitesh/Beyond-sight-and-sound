/* ============================================================
   Beyond Sight & Sound — Sound Engine
   Fully synthesized sounds via Web Audio API (no external media,
   so SRS section 15 "media unavailable" risk is minimized).
   Includes stereo panning for Follow the Sound (VI mode).
   Capability-checked: silently no-ops when unsupported.
   ============================================================ */

export type SoundName =
  | 'bell' | 'bird' | 'cat' | 'dog' | 'horn' | 'rain' | 'drum' | 'train'
  | 'success' | 'error' | 'tap' | 'star' | 'fanfare' | 'sparkle' | 'unlock';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private volume = 0.9;
  /** set true when a creation attempt fails — do not retry every tap */
  private broken = false;

  get supported() {
    return typeof window !== 'undefined' && 'AudioContext' in window;
  }

  /** must be called from a user gesture at least once (browser autoplay policy) */
  unlock() {
    if (this.broken || !this.supported) return;
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.volume;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      this.broken = true;
    }
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this.volume;
  }

  private env(gain: GainNode, t0: number, peak: number, attack: number, decay: number) {
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.001), t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
  }

  private tone(
    freqStart: number, freqEnd: number, dur: number, type: OscillatorType,
    peak = 0.25, when = 0, pan = 0, slideCurve: 'exp' | 'lin' = 'exp',
  ) {
    if (!this.ctx || !this.master) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    if (slideCurve === 'exp') {
      osc.frequency.setValueAtTime(Math.max(freqStart, 1), t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + dur);
    } else {
      osc.frequency.setValueAtTime(freqStart, t0);
      osc.frequency.linearRampToValueAtTime(freqEnd, t0 + dur);
    }
    this.env(g, t0, peak, 0.015, dur);
    this.route(osc, g, pan);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  private noise(dur: number, filterFreq: number, peak = 0.2, when = 0, pan = 0, q = 1) {
    if (!this.ctx || !this.master) return;
    const t0 = this.ctx.currentTime + when;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = q;
    const g = this.ctx.createGain();
    this.env(g, t0, peak, 0.02, dur);
    src.connect(filter);
    filter.connect(g);
    this.routeFrom(g, pan);
    src.start(t0);
  }

  private route(node: AudioNode, g: GainNode, pan: number) {
    node.connect(g);
    this.routeFrom(g, pan);
  }

  private routeFrom(g: GainNode, pan: number) {
    if (!this.ctx || !this.master) return;
    if (pan !== 0 && this.ctx.createStereoPanner) {
      const p = this.ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      g.connect(p);
      p.connect(this.master);
    } else {
      g.connect(this.master);
    }
  }

  /** play a named sound; pan in [-1,1] for spatial games */
  play(name: SoundName, opts: { pan?: number; rate?: number } = {}) {
    this.unlock();
    if (!this.ctx || !this.master || this.broken) return;
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    const pan = opts.pan ?? 0;
    const r = opts.rate ?? 1;
    try {
      switch (name) {
        case 'bell':
          this.tone(880 * r, 870 * r, 1.1, 'sine', 0.3, 0, pan);
          this.tone(1318 * r, 1310 * r, 0.9, 'sine', 0.15, 0.01, pan);
          break;
        case 'bird':
          this.tone(2100 * r, 2900 * r, 0.09, 'sine', 0.22, 0, pan);
          this.tone(2600 * r, 1900 * r, 0.1, 'sine', 0.22, 0.12, pan);
          this.tone(2300 * r, 3100 * r, 0.12, 'sine', 0.2, 0.26, pan);
          break;
        case 'cat':
          this.tone(520 * r, 900 * r, 0.16, 'sawtooth', 0.12, 0, pan);
          this.tone(900 * r, 420 * r, 0.3, 'sawtooth', 0.12, 0.16, pan);
          break;
        case 'dog':
          this.tone(340 * r, 130 * r, 0.09, 'sawtooth', 0.3, 0, pan);
          this.noise(0.06, 700, 0.1, 0, pan, 0.8);
          this.tone(320 * r, 120 * r, 0.11, 'sawtooth', 0.3, 0.14, pan);
          break;
        case 'horn':
          this.tone(400, 400, 0.55, 'square', 0.1, 0, pan);
          this.tone(502, 502, 0.55, 'square', 0.1, 0, pan);
          break;
        case 'rain':
          this.noise(1.4, 1400, 0.16, 0, pan, 0.6);
          this.noise(1.4, 400, 0.08, 0.05, pan, 0.5);
          break;
        case 'drum':
          this.tone(140, 48, 0.28, 'sine', 0.5, 0, pan);
          this.noise(0.04, 900, 0.12, 0, pan, 0.7);
          break;
        case 'train':
          this.noise(0.12, 300, 0.2, 0, pan, 0.9);
          this.noise(0.12, 300, 0.2, 0.22, pan, 0.9);
          this.tone(180, 170, 0.4, 'triangle', 0.12, 0, pan);
          break;
        case 'tap':
          this.tone(660, 660, 0.07, 'sine', 0.15, 0, pan);
          break;
        case 'success': {
          const notes = [523.25, 659.25, 783.99];
          notes.forEach((f, i) => this.tone(f, f, 0.22, 'sine', 0.22, i * 0.09, pan));
          this.tone(1046.5, 1046.5, 0.35, 'sine', 0.14, 0.27, pan);
          break;
        }
        case 'error':
          this.tone(300, 260, 0.18, 'sine', 0.18, 0, pan);
          this.tone(240, 210, 0.22, 'sine', 0.16, 0.16, pan);
          break;
        case 'star':
          [880, 1108, 1318, 1760].forEach((f, i) =>
            this.tone(f, f, 0.14, 'triangle', 0.16, i * 0.07, pan));
          break;
        case 'sparkle':
          [1568, 2093, 2637].forEach((f, i) =>
            this.tone(f, f * 1.1, 0.1, 'sine', 0.1, i * 0.05, pan));
          break;
        case 'unlock':
          this.tone(392, 392, 0.12, 'sine', 0.2, 0, pan);
          this.tone(523, 523, 0.12, 'sine', 0.2, 0.1, pan);
          this.tone(659, 659, 0.2, 'sine', 0.2, 0.2, pan);
          break;
        case 'fanfare': {
          const seq: Array<[number, number]> = [
            [523, 0], [659, 0.12], [784, 0.24], [1046, 0.4],
          ];
          seq.forEach(([f, w]) => {
            this.tone(f, f, 0.3, 'triangle', 0.2, w, pan);
            this.tone(f / 2, f / 2, 0.3, 'sine', 0.12, w, pan);
          });
          break;
        }
      }
    } catch {
      /* never crash on audio — SRS NFR-9 */
    }
  }
}

export const soundEngine = new SoundEngine();

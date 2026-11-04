/* ============================================================
   Beyond Sight & Sound — Narrator (Web Speech API)
   Mode-appropriate audio narration for the Audio-Tactile track.
   Capability-checked: exposes `supported` so UI can disclose
   unavailability per SRS section 15 (Haptics/media unsupported).
   ============================================================ */

type Lang = 'en' | 'hi';

class Narrator {
  private enabled = true;
  private rate = 0.95;
  private lang: Lang = 'en';
  private voice: SpeechSynthesisVoice | null = null;

  get supported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  configure(opts: { rate?: number; lang?: Lang; enabled?: boolean; volume?: number }) {
    if (opts.rate !== undefined) this.rate = opts.rate;
    if (opts.lang !== undefined) this.lang = opts.lang;
    if (opts.enabled !== undefined) this.enabled = opts.enabled;
    if (opts.volume !== undefined) this.volume = Math.max(0, Math.min(1, opts.volume));
    this.pickVoice();
  }

  private pickVoice() {
    if (!this.supported) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;
    const want = this.lang === 'hi' ? ['hi-IN', 'en-IN'] : ['en-IN', 'en-GB', 'en-US'];
    for (const code of want) {
      const v = voices.find((vv) => vv.lang.replace('_', '-').startsWith(code));
      if (v) { this.voice = v; return; }
    }
    this.voice = voices[0] ?? null;
  }

  /** speak text; cancels anything currently being spoken */
  speak(text: string, onEnd?: () => void) {
    if (!this.supported || !this.enabled || !text) { onEnd?.(); return; }
    try {
      window.speechSynthesis.cancel();
      if (!this.voice) this.pickVoice();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = this.rate;
      u.volume = this.volume;
      u.pitch = 1.05;
      u.lang = this.lang === 'hi' ? 'hi-IN' : 'en-IN';
      if (this.voice) u.voice = this.voice;
      if (onEnd) u.onend = () => onEnd();
      window.speechSynthesis.speak(u);
    } catch {
      onEnd?.();
    }
  }

  stop() {
    if (!this.supported) return;
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  }
}

export const narrator = new Narrator();

/* cache voices early — Chrome loads them asynchronously */
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => narrator['pickVoice']?.();
}

/* ============================================================
   Beyond Sight & Sound — Haptics (Vibration API)
   Distinguishable, adjustable vibration cues per SRS 11.1.
   Always paired with a non-haptic alternative by callers
   (SRS: "offer non-haptic alternatives because vibration support
   varies by device and user").
   ============================================================ */

export type HapticPattern = 'tap' | 'success' | 'error' | 'pattern' | 'celebrate';
export type HapticStrength = 'off' | 'low' | 'strong';

const BASE: Record<HapticPattern, number[]> = {
  tap: [30],
  success: [40, 60, 40],
  error: [80, 50, 80],
  pattern: [120, 80, 120, 80, 120],
  celebrate: [40, 40, 40, 40, 120],
};

class Haptics {
  private strength: HapticStrength = 'low';
  private lastUnsupportedNotice = false;

  get supported() {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  configure(strength: HapticStrength) {
    this.strength = strength;
  }

  /** returns true when a vibration was actually issued */
  fire(pattern: HapticPattern = 'tap'): boolean {
    if (this.strength === 'off' || !this.supported) return false;
    try {
      const scale = this.strength === 'strong' ? 1.6 : 1;
      const p = BASE[pattern].map((ms) => Math.round(ms * scale));
      return navigator.vibrate(p);
    } catch {
      return false;
    }
  }

  markUnsupportedNoticed() { this.lastUnsupportedNotice = true; }
  get noticedUnsupported() { return this.lastUnsupportedNotice; }
}

export const haptics = new Haptics();

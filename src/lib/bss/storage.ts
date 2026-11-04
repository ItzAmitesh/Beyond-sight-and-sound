/* ============================================================
   Beyond Sight & Sound — Local Persistence
   PPTX page 16: "Data: Local Storage for prototype progress".
   Privacy per SRS section 13: nickname-only labels, nothing
   leaves the device, no unnecessary identifiers.
   ============================================================ */

import { DEFAULT_PREFS, DEFAULT_PROGRESS, type Profile } from './types';

const PROFILES_KEY = 'bss-profiles-v1';
const ACTIVE_KEY = 'bss-active-v1';

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function loadProfiles(): Profile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Profile[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(hydrate);
  } catch {
    return [];
  }
}

export function saveProfiles(profiles: Profile[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch { /* storage full/blocked — fail silently, PoC scope */ }
}

export function loadActiveId(): string | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage.getItem(ACTIVE_KEY); } catch { return null; }
}

export function saveActiveId(id: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (id) window.localStorage.setItem(ACTIVE_KEY, id);
    else window.localStorage.removeItem(ACTIVE_KEY);
  } catch { /* ignore */ }
}

export function newProfile(name: string, avatar: string): Profile {
  return {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || 'Friend',
    avatar,
    mode: 'visual',
    prefs: { ...DEFAULT_PREFS },
    progress: JSON.parse(JSON.stringify(DEFAULT_PROGRESS)),
    createdAt: Date.now(),
    resume: null,
    lastReaction: null,
  };
}

/** fill missing fields for profiles saved by older versions of the PoC */
function hydrate(p: Profile): Profile {
  return {
    ...p,
    prefs: { ...DEFAULT_PREFS, ...(p.prefs ?? {}) },
    progress: {
      ...JSON.parse(JSON.stringify(DEFAULT_PROGRESS)),
      ...(p.progress ?? {}),
      dailyWords: p.progress?.dailyWords ?? { date: '', count: 0 },
      stars: p.progress?.stars ?? {},
      badges: p.progress?.badges ?? [],
      gameCompletions: p.progress?.gameCompletions ?? {},
    },
    resume: p.resume ?? null,
    lastReaction: p.lastReaction ?? null,
  };
}

/** forgiving streak per SRS 12.1 — missing a day never removes progress */
export function bumpStreakAndDaily(progress: Profile['progress']): Profile['progress'] {
  const today = todayStr();
  const next = { ...progress, dailyWords: { ...progress.dailyWords } };

  if (next.lastPlayedDate !== today) {
    next.streak = next.lastPlayedDate === yesterdayStr() ? next.streak + 1 : 1;
    next.lastPlayedDate = today;
  }
  if (next.dailyWords.date !== today) {
    next.dailyWords = { date: today, count: 0 };
  }
  return next;
}

/** wipe everything (Settings → Reset) */
export function wipeAll() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PROFILES_KEY);
    window.localStorage.removeItem(ACTIVE_KEY);
  } catch { /* ignore */ }
}

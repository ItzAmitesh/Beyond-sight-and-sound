'use client';

/* ============================================================
   Beyond Sight & Sound — App Context
   Screen state machine, profile management, progress updates,
   and mode-aware feedback helpers (sound / narration / haptics).
   ============================================================ */

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { soundEngine } from './audio';
import { narrator } from './speech';
import { haptics, type HapticPattern } from './haptics';
import {
  loadProfiles, saveProfiles, loadActiveId, saveActiveId,
  newProfile, wipeAll, bumpStreakAndDaily, todayStr,
} from './storage';
import {
  ALL_BADGES, CHAPTERS, CHAPTER_BONUS, GAMES, MASTER_EXPLORER,
  MASTER_EXPLORER_BONUS, POINTS_PER_CORRECT, gameById,
} from './content';
import type {
  GameId, GameResult, Preferences, Profile, SensoryMode, TextScale,
} from './types';

/* --------------------------- Screens --------------------------- */

export type Screen =
  | { name: 'welcome' }
  | { name: 'profilePicker' }
  | { name: 'setupName' }
  | { name: 'setupMode'; draftId: string }
  | { name: 'setupLanguage'; draftId: string }
  | { name: 'setupCalibration'; draftId: string }
  | { name: 'home' }
  | { name: 'explore' }
  | { name: 'rewards' }
  | { name: 'profile' }
  | { name: 'settings' }
  | { name: 'caregiver' }
  | { name: 'story'; chapterId: string }
  | { name: 'game'; gameId: GameId; chapterId?: string }
  | { name: 'complete'; result: GameResult };

type Boot = 'loading' | 'ready';

export interface FlashMsg { id: number; text: string; emoji?: string }

interface AppCtx {
  boot: Boot;
  profiles: Profile[];
  profile: Profile | null;
  mode: SensoryMode;
  prefs: Preferences | null;
  screen: Screen;
  go: (s: Screen) => void;
  back: () => void;
  canGoBack: boolean;
  flash: FlashMsg | null;
  showToast: (text: string, emoji?: string) => void;
  // profiles
  createProfile: (name: string, avatar: string) => string;
  selectProfile: (id: string) => void;
  setMode: (m: SensoryMode) => void;
  updatePrefs: (patch: Partial<Preferences>) => void;
  deleteProfile: (id: string) => void;
  resetEverything: () => void;
  // feedback helpers
  say: (text: string, onEnd?: () => void) => void;
  playSound: (name: Parameters<typeof soundEngine.play>[0], pan?: number) => void;
  buzz: (pattern?: HapticPattern) => boolean;
  // gameplay
  sessionWords: React.MutableRefObject<string[]>;
  sessionStart: React.MutableRefObject<number>;
  startGame: (gameId: GameId, chapterId?: string) => void;
  recordCorrect: (word?: string) => void;
  finishGame: (gameId: GameId, chapterId: string | undefined, score: number, total: number) => void;
  exitGameEarly: (gameId: GameId, roundIndex: number, score: number, chapterId?: string) => void;
  clearResume: () => void;
  saveReaction: (emoji: string) => void;
  chapterUnlocked: (chapterIndex: number) => boolean;
}

const Ctx = createContext<AppCtx | null>(null);

export function useBSS(): AppCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useBSS must be used inside BSSProvider');
  return ctx;
}

const TEXT_SCALE_PX: Record<TextScale, string> = {
  normal: '16px', large: '18.5px', xl: '21px',
};

export function BSSProvider({ children }: { children: React.ReactNode }) {
  const [boot, setBoot] = useState<Boot>('loading');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: 'welcome' });
  const [flash, setFlash] = useState<FlashMsg | null>(null);
  const stackRef = useRef<Screen[]>([]);
  const sessionWords = useRef<string[]>([]);
  const sessionStart = useRef<number>(Date.now());
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------------------- boot ---------------------- */
  useEffect(() => {
    const loaded = loadProfiles();
    const savedActive = loadActiveId();
    setProfiles(loaded);
    if (loaded.length && savedActive && loaded.some((p) => p.id === savedActive)) {
      setActiveId(savedActive);
      setScreen({ name: 'home' });
    } else if (loaded.length) {
      setScreen({ name: 'profilePicker' });
    } else {
      setScreen({ name: 'welcome' });
    }
    setBoot('ready');
  }, []);

  /* --------------- global first-gesture unlock --------------- */
  useEffect(() => {
    const unlock = () => soundEngine.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const profile = useMemo(
    () => profiles.find((p) => p.id === activeId) ?? null,
    [profiles, activeId],
  );

  /* --------------- apply preferences globally --------------- */
  useEffect(() => {
    const prefs = profile?.prefs;
    if (!prefs) return;
    document.documentElement.style.fontSize = TEXT_SCALE_PX[prefs.textScale];
    document.documentElement.dataset.contrast = prefs.highContrast ? 'high' : 'normal';
    document.documentElement.dataset.motion = prefs.animationSpeed;
    narrator.configure({
      rate: prefs.narrationSpeed,
      lang: prefs.language,
      enabled: true,
      volume: prefs.volume,
    });
    soundEngine.setVolume(prefs.volume);
    haptics.configure(prefs.hapticStrength);
  }, [profile?.prefs]);

  /* stop narration on any navigation */
  useEffect(() => { narrator.stop(); }, [screen]);

  const showToast = useCallback((text: string, emoji?: string) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ id: Date.now(), text, emoji });
    flashTimer.current = setTimeout(() => setFlash(null), 2600);
  }, []);

  const persist = useCallback((next: Profile[]) => {
    setProfiles(next);
    saveProfiles(next);
  }, []);

  /* ---------------------- navigation ---------------------- */

  const go = useCallback((s: Screen) => {
    setScreen((prev) => {
      stackRef.current = [...stackRef.current.slice(-14), prev];
      return s;
    });
  }, []);

  const back = useCallback(() => {
    setScreen((prev) => {
      const prevStack = stackRef.current;
      if (!prevStack.length) return { name: 'home' };
      const target = prevStack[prevStack.length - 1];
      stackRef.current = prevStack.slice(0, -1);
      // skip past completed screens
      if (target.name === 'complete' || target.name === 'game') return { name: 'home' };
      return target;
    });
  }, []);

  /* ---------------------- profiles ---------------------- */

  const createProfile = useCallback((name: string, avatar: string) => {
    const p = newProfile(name, avatar);
    persist([...loadProfiles(), p]);
    setActiveId(p.id);
    saveActiveId(p.id);
    return p.id;
  }, [persist]);

  const selectProfile = useCallback((id: string) => {
    setActiveId(id);
    saveActiveId(id);
    stackRef.current = [];
    setScreen({ name: 'home' });
  }, []);

  const patchProfile = useCallback((id: string, fn: (p: Profile) => Profile) => {
    const loaded = loadProfiles();
    const next = loaded.map((p) => (p.id === id ? fn(p) : p));
    persist(next);
  }, [persist]);

  const setMode = useCallback((m: SensoryMode) => {
    if (!activeId) return;
    patchProfile(activeId, (p) => ({ ...p, mode: m }));
    showToast(m === 'visual' ? 'Now in Visual / Sign Mode' : 'Now in Audio-Tactile Mode',
      m === 'visual' ? '👋' : '🎧');
  }, [activeId, patchProfile, showToast]);

  const updatePrefs = useCallback((patch: Partial<Preferences>) => {
    if (!activeId) return;
    patchProfile(activeId, (p) => ({ ...p, prefs: { ...p.prefs, ...patch } }));
  }, [activeId, patchProfile]);

  const deleteProfile = useCallback((id: string) => {
    const loaded = loadProfiles().filter((p) => p.id !== id);
    persist(loaded);
    if (activeId === id) {
      const nextId = loaded[0]?.id ?? null;
      setActiveId(nextId);
      saveActiveId(nextId);
      setScreen(loaded.length ? { name: 'profilePicker' } : { name: 'welcome' });
    }
  }, [activeId, persist]);

  const resetEverything = useCallback(() => {
    wipeAll();
    narrator.stop();
    setProfiles([]);
    setActiveId(null);
    stackRef.current = [];
    setScreen({ name: 'welcome' });
  }, []);

  /* ---------------------- feedback helpers ---------------------- */

  const say = useCallback((text: string, onEnd?: () => void) => {
    if (!profile || profile.mode !== 'audio') { onEnd?.(); return; }
    narrator.speak(text, onEnd);
  }, [profile]);

  const playSound = useCallback<ReturnType<typeof soundEngine.play>>(
    (name, pan) => soundEngine.play(name, { pan }),
    [],
  );

  const buzz = useCallback((pattern: HapticPattern = 'tap') => haptics.fire(pattern), []);

  /* ---------------------- gameplay ---------------------- */

  const startGame = useCallback((gameId: GameId, chapterId?: string) => {
    sessionWords.current = [];
    sessionStart.current = Date.now();
    narrator.stop();
    go({ name: 'game', gameId, chapterId });
  }, [go]);

  const recordCorrect = useCallback((word?: string) => {
    if (!activeId || !profile) return;
    if (word) sessionWords.current.push(word);
    patchProfile(activeId, (p) => {
      const prog = bumpStreakAndDaily(p.progress);
      prog.wordsLearned = prog.wordsLearned + 1;
      prog.dailyWords = {
        date: todayStr(),
        count: (prog.dailyWords.date === todayStr() ? prog.dailyWords.count : 0) + 1,
      };
      return { ...p, progress: prog };
    });
  }, [activeId, patchProfile, profile]);

  const finishGame = useCallback((
    gameId: GameId, chapterId: string | undefined, score: number, total: number,
  ) => {
    if (!activeId || !profile) return;
    const def = gameById(gameId);
    const firstCompletion = (profile.progress.gameCompletions[gameId] ?? 0) === 0;
    const words = [...sessionWords.current];
    const seconds = Math.round((Date.now() - sessionStart.current) / 1000);

    let starsEarned = 0;
    if (chapterId) {
      starsEarned = score >= total ? 3 : score >= Math.ceil(total * 0.66) ? 2 : 1;
    }

    const newBadges: string[] = [];
    if (firstCompletion) newBadges.push(def.badge.id);

    const result: GameResult = {
      gameId, chapterId, score, total,
      pointsEarned: score * POINTS_PER_CORRECT + (chapterId ? CHAPTER_BONUS : 0),
      starsEarned,
      newBadges,
      wordsLearned: words,
      isChapterFinish: Boolean(chapterId),
    };

    patchProfile(activeId, (p) => {
      let prog = bumpStreakAndDaily(p.progress);
      prog.points += result.pointsEarned;
      prog.gamesPlayed += 1;
      prog.timeSpent += seconds;
      prog.gameCompletions = {
        ...prog.gameCompletions,
        [gameId]: (prog.gameCompletions[gameId] ?? 0) + 1,
      };
      if (chapterId) {
        prog.stars = {
          ...prog.stars,
          [chapterId]: Math.max(prog.stars[chapterId] ?? 0, starsEarned),
        };
      }
      prog.badges = [...prog.badges, ...newBadges];
      // Master Explorer: every chapter has at least one star
      const allDone = CHAPTERS.every((c) => (prog.stars[c.id] ?? 0) >= 1);
      if (allDone && !prog.badges.includes(MASTER_EXPLORER.id)) {
        prog.badges = [...prog.badges, MASTER_EXPLORER.id];
        prog.points += MASTER_EXPLORER_BONUS;
        result.newBadges = [...result.newBadges, MASTER_EXPLORER.id];
        result.pointsEarned += MASTER_EXPLORER_BONUS;
      }
      return { ...p, progress: prog, resume: null };
    });

    // final chapter-completion badge list must reflect what we just saved
    go({ name: 'complete', result });
  }, [activeId, go, patchProfile, profile]);

  const exitGameEarly = useCallback((
    gameId: GameId, roundIndex: number, score: number, chapterId?: string,
  ) => {
    if (!activeId) return;
    if (roundIndex > 0) {
      patchProfile(activeId, (p) => ({
        ...p,
        resume: { gameId, roundIndex, score },
      }));
      showToast('Progress saved. You can continue later!', '💾');
    }
    narrator.stop();
    stackRef.current = [];
    setScreen({ name: 'home' });
  }, [activeId, patchProfile, showToast]);

  const clearResume = useCallback(() => {
    if (!activeId) return;
    patchProfile(activeId, (p) => ({ ...p, resume: null }));
  }, [activeId, patchProfile]);

  const saveReaction = useCallback((emoji: string) => {
    if (!activeId) return;
    patchProfile(activeId, (p) => ({ ...p, lastReaction: emoji }));
  }, [activeId, patchProfile]);

  const chapterUnlocked = useCallback((chapterIndex: number) => {
    if (!profile || chapterIndex === 0) return true;
    const prev = CHAPTERS[chapterIndex - 1];
    return (profile.progress.stars[prev.id] ?? 0) >= 1;
  }, [profile]);

  const value: AppCtx = {
    boot, profiles, profile,
    mode: profile?.mode ?? 'visual',
    prefs: profile?.prefs ?? null,
    screen, go, back,
    canGoBack: stackRef.current.length > 0,
    flash, showToast,
    createProfile, selectProfile, setMode, updatePrefs, deleteProfile, resetEverything,
    say, playSound, buzz,
    sessionWords, sessionStart,
    startGame, recordCorrect, finishGame, exitGameEarly, clearResume, saveReaction,
    chapterUnlocked,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** list of games for the child's mode first, then the other mode (FR-11) */
export function gamesForMode(mode: SensoryMode) {
  return {
    primary: GAMES.filter((g) => g.mode === mode),
    secondary: GAMES.filter((g) => g.mode !== mode),
  };
}

export function badgeById(id: string) {
  return ALL_BADGES.find((b) => b.id === id);
}

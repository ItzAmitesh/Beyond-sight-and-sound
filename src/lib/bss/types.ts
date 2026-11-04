/* ============================================================
   Beyond Sight & Sound — Core Types
   Data model per SRS Section 14 (Data and External Interfaces)
   ============================================================ */

/** The two sensory-appropriate experience tracks (SRS 1., FR-1) */
export type SensoryMode = 'visual' | 'audio';
// 'visual' = Visual/Sign Mode (Deaf track: ISL, visual cues, animation)
// 'audio'  = Audio-Tactile Mode (VI track: narration, sound, haptics)

export type Language = 'en' | 'hi';

export type TextScale = 'normal' | 'large' | 'xl';
export type HapticStrength = 'off' | 'low' | 'strong';
export type AnimationSpeed = 'normal' | 'reduced';

/** User-adjustable accessibility & personalization preferences (FR-8, SRS 7) */
export interface Preferences {
  narrationSpeed: number; // 0.6 – 1.4 (Web Speech rate)
  textScale: TextScale;
  highContrast: boolean;
  hapticStrength: HapticStrength;
  animationSpeed: AnimationSpeed;
  volume: number; // 0 – 1
  autoRepeat: boolean; // repeat instructions automatically (VI)
  language: Language;
}

export const DEFAULT_PREFS: Preferences = {
  narrationSpeed: 0.95,
  textScale: 'normal',
  highContrast: false,
  hapticStrength: 'low',
  animationSpeed: 'normal',
  volume: 0.9,
  autoRepeat: true,
  language: 'en',
};

/** Progress record (SRS 14: Progress record + Reward record) */
export interface Progress {
  points: number;
  /** chapterId -> stars earned (0–3) */
  stars: Record<string, number>;
  /** earned badge ids */
  badges: string[];
  /** gameId -> number of successful sessions */
  gameCompletions: Record<string, number>;
  /** lifetime words learned (correct answers) */
  wordsLearned: number;
  /** today's words for the daily goal */
  dailyWords: { date: string; count: number };
  /** forgiving streak — never removes earned progress (SRS 12.1) */
  streak: number;
  lastPlayedDate: string;
  gamesPlayed: number;
  /** accumulated play seconds for the caregiver summary (FR-9) */
  timeSpent: number;
}

export const DEFAULT_PROGRESS: Progress = {
  points: 0,
  stars: {},
  badges: [],
  gameCompletions: {},
  wordsLearned: 0,
  dailyWords: { date: '', count: 0 },
  streak: 0,
  lastPlayedDate: '',
  gamesPlayed: 0,
  timeSpent: 0,
};

/** Child profile (SRS 14: Child profile) */
export interface Profile {
  id: string;
  name: string;
  avatar: string; // emoji avatar
  mode: SensoryMode;
  prefs: Preferences;
  progress: Progress;
  createdAt: number;
  /** FR-14 save & resume — partially finished game session */
  resume?: { gameId: string; roundIndex: number; score: number } | null;
  /** FR-12 feedback record — last emoji reaction */
  lastReaction?: string | null;
}

/** Result of one game session, used by the completion screen */
export interface GameResult {
  gameId: string;
  chapterId?: string;
  score: number; // correct answers
  total: number; // total rounds
  pointsEarned: number;
  starsEarned: number; // for chapter quests 0–3, free play = 0
  newBadges: string[];
  wordsLearned: string[];
  isChapterFinish: boolean;
}

/* ------------------------- Content types ------------------------- */

export type GameId =
  | 'sound-match'
  | 'audio-memory'
  | 'follow-sound'
  | 'sign-match'
  | 'visual-puzzle'
  | 'find-clue';

export interface GameDef {
  id: GameId;
  title: string;
  titleHi?: string;
  emoji: string;
  mode: SensoryMode;
  skill: string;
  how: string; // one-line description of the mechanic
  color: string; // tailwind gradient classes for the card
  badge: { id: string; name: string; emoji: string; note: string };
  chapterOnly?: boolean;
}

export interface StoryPanel {
  emoji: string;
  text: string;
  textHi?: string;
}

export interface ChapterDef {
  id: string;
  index: number;
  title: string;
  emoji: string;
  color: string;
  story: StoryPanel[];
  /** mode-specific game used to complete this chapter's quest */
  gameByMode: Record<SensoryMode, GameId>;
  questLine: string;
}

export interface BadgeDef {
  id: string;
  name: string;
  emoji: string;
  note: string;
}

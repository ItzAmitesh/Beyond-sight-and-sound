/* ============================================================
   Beyond Sight & Sound — Content Definitions
   Games per PPTX pages 11–13, chapters per page 14,
   gamification rules per SRS Section 12.
   ============================================================ */

import type { BadgeDef, ChapterDef, GameDef, GameId } from './types';

/** Daily goal: learn 20 new words (UI mockup "Daily Goal 12/20") */
export const DAILY_WORD_GOAL = 20;

/** Points for one correct answer */
export const POINTS_PER_CORRECT = 10;
/** Bonus for finishing a chapter quest */
export const CHAPTER_BONUS = 50;
/** Master Explorer bonus */
export const MASTER_EXPLORER_BONUS = 100;

export const GAMES: GameDef[] = [
  {
    id: 'sound-match',
    title: 'Sound Match',
    titleHi: 'आवाज़ पहचानो',
    emoji: '🎧',
    mode: 'audio',
    skill: 'Sound recognition + decision making',
    how: 'Hear a sound, then choose what made it.',
    color: 'from-amber-400 to-orange-500',
    badge: { id: 'badge-sharp-ears', name: 'Sharp Ears', emoji: '👂', note: 'Finished Sound Match' },
  },
  {
    id: 'audio-memory',
    title: 'Audio Memory',
    titleHi: 'आवाज़ याद रखो',
    emoji: '🧠',
    mode: 'audio',
    skill: 'Listening + memory',
    how: 'Hear a sequence of sounds, then repeat the order.',
    color: 'from-fuchsia-500 to-purple-600',
    badge: { id: 'badge-echo-memory', name: 'Echo Memory', emoji: '🔮', note: 'Finished Audio Memory' },
  },
  {
    id: 'follow-sound',
    title: 'Follow the Sound',
    titleHi: 'आवाज़ के पीछे चलो',
    emoji: '🧭',
    mode: 'audio',
    skill: 'Directional awareness + exploration',
    how: 'Kiko makes a sound. Which side is it coming from?',
    color: 'from-teal-400 to-emerald-600',
    badge: { id: 'badge-path-finder', name: 'Path Finder', emoji: '🧭', note: 'Finished Follow the Sound' },
  },
  {
    id: 'sign-match',
    title: 'Sign Match',
    titleHi: 'इशारा पहचानो',
    emoji: '🤟',
    mode: 'visual',
    skill: 'Visual recognition + communication',
    how: 'See a sign, then choose its meaning.',
    color: 'from-sky-400 to-blue-600',
    badge: { id: 'badge-sign-star', name: 'Sign Star', emoji: '🤟', note: 'Finished Sign Match' },
  },
  {
    id: 'visual-puzzle',
    title: 'Visual Puzzle',
    titleHi: 'चित्र पहेली',
    emoji: '🧩',
    mode: 'visual',
    skill: 'Pattern recognition + logic',
    how: 'Look at the pattern. Which piece comes next?',
    color: 'from-violet-500 to-purple-700',
    badge: { id: 'badge-puzzle-master', name: 'Puzzle Master', emoji: '🧩', note: 'Finished Visual Puzzle' },
  },
  {
    id: 'find-clue',
    title: 'Find the Clue',
    titleHi: 'सुराग ढूँढो',
    emoji: '🔍',
    mode: 'visual',
    skill: 'Observation + exploration',
    how: 'Look around the scene and tap the hidden clue.',
    color: 'from-rose-400 to-pink-600',
    badge: { id: 'badge-eagle-eye', name: 'Eagle Eye', emoji: '👁️', note: 'Finished Find the Clue' },
  },
];

export const gameById = (id: GameId): GameDef => GAMES.find((g) => g.id === id)!;

/**
 * Chapters per PPTX page 14 — one shared narrative, mode-specific gameplay.
 * Chapter N+1 stays locked until chapter N earns at least one star (FR-13).
 */
export const CHAPTERS: ChapterDef[] = [
  {
    id: 'ch-forest',
    index: 0,
    title: 'The Lost Forest',
    emoji: '🌳',
    color: 'from-emerald-400 via-green-500 to-teal-600',
    questLine: 'Kiko is lost. Find the way through the forest!',
    story: [
      {
        emoji: '🌟',
        text: 'This is Kiko, a little firefly who lights up the night.',
        textHi: 'यह है किको, एक छोटी जुगनू जो रात में रोशनी बिखेरती है।',
      },
      {
        emoji: '🌲',
        text: 'One evening, Kiko flew too far... and got lost in a big, dark forest.',
        textHi: 'एक शाम किको बहुत दूर उड़ गई... और एक बड़े अंधेरे जंगल में रास्ता भूल गई।',
      },
      {
        emoji: '🦉',
        text: 'The forest is full of sounds and signs. Kiko needs your help to find the way!',
        textHi: 'जंगल आवाज़ों और इशारों से भरा है। किको को रास्ता ढूँढने में आपकी मदद चाहिए!',
      },
    ],
    gameByMode: { audio: 'sound-match', visual: 'find-clue' },
  },
  {
    id: 'ch-cave',
    index: 1,
    title: 'Mystery Cave',
    emoji: '🦇',
    color: 'from-indigo-400 via-violet-500 to-purple-700',
    questLine: 'Kiko found a mysterious cave. Solve its challenge!',
    story: [
      {
        emoji: '🕯️',
        text: 'Kiko followed a twinkling light and reached a mysterious cave.',
        textHi: 'किको एक टिमटिमाती रोशनी के पीछे-पीछे एक रहस्यमयी गुफा तक पहुँची।',
      },
      {
        emoji: '🎵',
        text: 'Inside, the cave echoes with magical sounds and patterns.',
        textHi: 'अंदर गुफा जादुई आवाज़ों और पैटर्न से गूँजती है।',
      },
      {
        emoji: '🧩',
        text: 'The cave will only open if someone solves its challenge. Can you do it?',
        textHi: 'गुफा तभी खुलेगी जब कोई उसकी चुनौती हल करे। क्या आप कर सकते हैं?',
      },
    ],
    gameByMode: { audio: 'audio-memory', visual: 'visual-puzzle' },
  },
  {
    id: 'ch-home',
    index: 2,
    title: 'The Way Home',
    emoji: '🏠',
    color: 'from-amber-400 via-orange-500 to-rose-500',
    questLine: 'The final challenge — guide Kiko home!',
    story: [
      {
        emoji: '🌄',
        text: 'The cave opened! Kiko can see the sunrise over her meadow.',
        textHi: 'गुफा खुल गई! किको अपने घर के मैदान पर सूर्योदय देख सकती है।',
      },
      {
        emoji: '🤟',
        text: 'But the last path is tricky. Kiko must follow signs and signals.',
        textHi: 'लेकिन आखिरी रास्ता उलझा हुआ है। किको को इशारों को पहचानना होगा।',
      },
      {
        emoji: '🏠',
        text: 'Help Kiko understand every signal and bring her safely home!',
        textHi: 'हर इशारे को समझकर किको को सुरक्षित घर तक पहुँचाएँ!',
      },
    ],
    gameByMode: { audio: 'follow-sound', visual: 'sign-match' },
  },
];

export const chapterById = (id: string): ChapterDef => CHAPTERS.find((c) => c.id === id)!;

/** Badge awarded when all three chapters are complete (PPTX page 15) */
export const MASTER_EXPLORER: BadgeDef = {
  id: 'badge-master-explorer',
  name: 'Master Explorer',
  emoji: '🏆',
  note: 'Completed every chapter!',
};

export const ALL_BADGES: BadgeDef[] = [
  ...GAMES.map((g) => g.badge),
  MASTER_EXPLORER,
];

/** Emoji avatar choices for profiles */
export const AVATARS = ['🐱', '🦊', '🐼', '🐸', '🦁', '🐰', '🦄', '🐯'];

/** Finger-count hand config for ISL numeral signs in Sign Match */
export const NUMERAL_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five'];

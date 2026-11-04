'use client';

/* ============================================================
   Visual/Sign mode games (PPTX page 12 — Amitesh's mode)
   Design rule: do NOT require audio to understand the task.
   All feedback is visual first (state, icon, animation);
   meaning is never carried by color alone (SRS 11.1).
   ============================================================ */

import { useEffect, useMemo, useState } from 'react';
import { useBSS } from '@/lib/bss/context';
import { Card } from '../../bits';
import { Kiko } from '../../kiko';
import { shuffle, type GameProps } from './shared';

/* ------------------- ISL-style numeral hand ------------------- */

/** Simplified visual sign representation for numerals (prototype asset) */
export function SignHand({ count, size = 150 }: { count: number; size?: number }) {
  const fw = 12, gap = 4;
  const totalW = count * fw + (count - 1) * gap;
  const startX = 60 - totalW / 2;
  return (
    <svg viewBox="0 0 120 130" width={size} height={size * 1.08} role="img"
      aria-label={`Sign for the number ${count}: ${count} fingers up`}>
      {/* fingers */}
      {Array.from({ length: count }).map((_, i) => (
        <rect key={i} x={startX + i * (fw + gap)} y={20} width={fw} height={48} rx={6}
          fill="#FDBA8C" stroke="#EA9A64" strokeWidth="2" />
      ))}
      {/* thumb */}
      {count >= 1 && (
        <ellipse cx={count >= 4 ? 24 : 96} cy="78" rx="9" ry="13" fill="#FDBA8C" stroke="#EA9A64" strokeWidth="2"
          transform={`rotate(${count >= 4 ? -35 : 35} ${count >= 4 ? 24 : 96} 78)`} />
      )}
      {/* palm */}
      <rect x="32" y="62" width="56" height="44" rx="16" fill="#FDBA8C" stroke="#EA9A64" strokeWidth="2" />
      {/* wrist */}
      <rect x="44" y="102" width="32" height="22" rx="10" fill="#7C3AED" />
      {/* friendly face on palm */}
      <circle cx="50" cy="80" r="2.6" fill="#92400E" />
      <circle cx="70" cy="80" r="2.6" fill="#92400E" />
      <path d="M53 90 Q 60 95 67 90" stroke="#92400E" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------- Sign Match ------------------------- */

const GESTURES = [
  { emoji: '👋', label: 'Hello' },
  { emoji: '👍', label: 'Yes' },
  { emoji: '👎', label: 'No' },
  { emoji: '🙏', label: 'Thank you' },
  { emoji: '🤝', label: 'Friend' },
  { emoji: '👏', label: 'Well done' },
  { emoji: '🤟', label: 'I love you' },
];

const NUM_WORDS = ['One', 'Two', 'Three', 'Four', 'Five'];

export function SignMatchGame({ initialRound, initialScore, onProgress, onFinish }: GameProps) {
  const { playSound, buzz, recordCorrect, say, mode } = useBSS();
  const TOTAL = 4;
  const [round, setRound] = useState(initialRound);
  const [score, setScore] = useState(initialScore);
  const [tried, setTried] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const isNumeralRound = round % 2 === 0;
  const number = useMemo(() => 1 + Math.floor(Math.random() * 5), [round]); // 1..5
  const gesture = useMemo(() => GESTURES[Math.floor(Math.random() * GESTURES.length)], [round]);

  useEffect(() => { onProgress(round, score); }, [round, score, onProgress]);

  const numOptions = useMemo(() => {
    const pool = NUM_WORDS.filter((_, i) => i + 1 !== number);
    return shuffle([`${number}`, ...shuffle(pool).slice(0, 3)]);
  }, [number]);

  const gestureOptions = useMemo(() => {
    const pool = GESTURES.filter((g) => g.label !== gesture.label);
    return shuffle([gesture, ...shuffle(pool).slice(0, 3)]);
  }, [gesture]);

  useEffect(() => {
    if (mode !== 'audio') return;
    const t = setTimeout(() =>
      say(isNumeralRound ? 'Look at the sign. Which number is it?' : 'Look at the sign. What does it mean?'), 400);
    return () => clearTimeout(t);
  }, [say, isNumeralRound, mode, round]);

  const succeed = (label: string) => {
    if (!tried) recordCorrect(label);
    playSound('success');
    buzz('success');
    if (mode === 'audio') say(`Yes! That sign means ${label}.`);
    setTimeout(() => {
      setPicked(null); setTried(false);
      if (round + 1 >= TOTAL) onFinish(score + (tried ? 0 : 1), TOTAL);
      else { setRound((r) => r + 1); setScore((s) => s + (tried ? 0 : 1)); }
    }, 1600);
  };

  const fail = () => {
    playSound('error');
    buzz('error');
    setTried(true);
    if (mode === 'audio') say('Look again carefully and try once more.');
    setTimeout(() => setPicked(null), 900);
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card className="text-center">
        <p className="text-sm font-bold tracking-wide text-violet-500 uppercase">Round {round + 1} of {TOTAL}</p>
        <h2 className="mt-1 text-xl font-black text-violet-950">
          {isNumeralRound ? 'Which number is this sign? 🔢' : 'What does this sign mean? 💬'}
        </h2>
      </Card>

      {/* the sign card — large, centered */}
      <div className="mx-auto flex min-h-48 w-full max-w-[260px] flex-col items-center justify-center
        rounded-3xl border-[3px] border-violet-300 bg-white p-4 shadow-xl bss-pop" key={round}>
        {isNumeralRound ? (
          <SignHand count={number} />
        ) : (
          <span className="text-8xl" aria-hidden>{gesture.emoji}</span>
        )}
        <span className="mt-1 rounded-full bg-violet-100 px-3 py-0.5 text-[10px] font-black tracking-wide text-violet-600 uppercase">
          {isNumeralRound ? 'Sign: number' : 'Sign card'}
        </span>
      </div>

      {/* options */}
      <div className="mt-auto grid grid-cols-2 gap-3">
        {isNumeralRound
          ? numOptions.map((n) => (
            <button
              key={n}
              onClick={() => (Number(n) === number ? succeed(NUM_WORDS[number - 1]) : fail())}
              aria-label={`Number ${n}`}
              className={`bss-tap flex min-h-20 items-center justify-center gap-2 rounded-3xl border-[3px] p-3
                shadow-md transition-all active:scale-95 focus-visible:outline-4 focus-visible:outline-amber-400
                ${picked === n
                  ? Number(n) === number ? 'border-emerald-500 bg-emerald-100 ring-4 ring-emerald-200'
                    : 'border-rose-400 bg-rose-50 bss-shake'
                  : 'border-violet-200 bg-white hover:border-violet-400'}`}
            >
              <span className="text-3xl font-black text-violet-800">{n}</span>
              <span className="text-xs font-bold text-violet-500">{NUM_WORDS[Number(n) - 1]}</span>
            </button>
          ))
          : gestureOptions.map((g) => (
            <button
              key={g.label}
              onClick={() => (g.label === gesture.label ? succeed(g.label) : fail())}
              aria-label={g.label}
              className={`bss-tap flex min-h-20 flex-col items-center justify-center gap-0.5 rounded-3xl border-[3px] p-3
                shadow-md transition-all active:scale-95 focus-visible:outline-4 focus-visible:outline-amber-400
                ${picked === g.label
                  ? g.label === gesture.label ? 'border-emerald-500 bg-emerald-100 ring-4 ring-emerald-200'
                    : 'border-rose-400 bg-rose-50 bss-shake'
                  : 'border-violet-200 bg-white hover:border-violet-400'}`}
            >
              <span className="text-3xl" aria-hidden>{g.emoji}</span>
              <span className="text-sm font-black text-violet-950">{g.label}</span>
            </button>
          ))}
      </div>

      <p className="text-center text-[10px] font-semibold text-violet-300">
        Sign cards are simplified illustrations for this prototype.
      </p>
    </div>
  );
}

/* ------------------------- Visual Puzzle ------------------------- */

type Puzzle = { strip: string[]; answer: string; options: string[]; say: string };

const PUZZLES: Puzzle[] = [
  { strip: ['🔴', '🔵', '🔴', '🔵'], answer: '🔴', options: ['🔴', '🔵', '🟢'], say: 'red blue red blue — what comes next?' },
  { strip: ['🍎', '🍌', '🍌', '🍎', '🍌'], answer: '🍌', options: ['🍌', '🍎', '🍇'], say: 'apple banana banana, apple banana… what comes next?' },
  { strip: ['⭐', '🌙', '☀️', '⭐', '🌙'], answer: '☀️', options: ['☀️', '⭐', '🌙'], say: 'star moon sun, star moon… what comes next?' },
];

export function VisualPuzzleGame({ initialRound, initialScore, onProgress, onFinish }: GameProps) {
  const { playSound, buzz, recordCorrect, say, mode } = useBSS();
  const TOTAL = PUZZLES.length;
  const [round, setRound] = useState(initialRound);
  const [score, setScore] = useState(initialScore);
  const [tried, setTried] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const puzzle = PUZZLES[round % TOTAL];
  const options = useMemo(() => shuffle(puzzle.options), [puzzle]);

  useEffect(() => { onProgress(round, score); }, [round, score, onProgress]);

  useEffect(() => {
    if (mode !== 'audio') return;
    const t = setTimeout(() => say(`Look at the pattern. ${puzzle.say}`), 400);
    return () => clearTimeout(t);
  }, [say, puzzle, mode]);

  const choose = (opt: string) => {
    if (solved) return;
    setPicked(opt);
    if (opt === puzzle.answer) {
      if (!tried) recordCorrect('pattern');
      setSolved(true);
      playSound('success');
      buzz('success');
      if (mode === 'audio') say('You completed the pattern!');
      setTimeout(() => {
        setPicked(null); setTried(false); setSolved(false);
        if (round + 1 >= TOTAL) onFinish(score + (tried ? 0 : 1), TOTAL);
        else { setRound((r) => r + 1); setScore((s) => s + (tried ? 0 : 1)); }
      }, 1700);
    } else {
      playSound('error');
      buzz('error');
      setTried(true);
      if (mode === 'audio') say('Look at the pattern again. You can do it!');
      setTimeout(() => setPicked(null), 900);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-5">
      <Card className="text-center">
        <p className="text-sm font-bold tracking-wide text-violet-500 uppercase">Round {round + 1} of {TOTAL}</p>
        <h2 className="mt-1 text-xl font-black text-violet-950">Complete the pattern 🧩</h2>
      </Card>

      {/* pattern strip */}
      <div className="flex items-center justify-center gap-2 rounded-3xl border-[3px] border-violet-200
        bg-white p-5 shadow-lg" key={round}>
        {puzzle.strip.map((s, i) => (
          <span key={i} className="bss-pop flex size-13 items-center justify-center rounded-2xl bg-violet-50
            text-4xl shadow-sm" style={{ animationDelay: `${i * 90}ms` }} aria-hidden>{s}</span>
        ))}
        <span className="mx-1 text-3xl font-black text-violet-300" aria-hidden>→</span>
        <span className={`flex size-13 items-center justify-center rounded-2xl border-[3px] text-4xl shadow-inner
          ${solved ? 'border-emerald-400 bg-emerald-100 bss-pop' : 'border-dashed border-violet-400 bg-violet-50'}`}>
          {solved ? puzzle.answer : '❓'}
        </span>
      </div>

      <p className="text-center text-sm font-bold text-violet-500">Which one comes next?</p>

      <div className="mt-auto grid grid-cols-3 gap-3">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => choose(o)}
            aria-label={`Option ${o}`}
            className={`bss-tap flex min-h-24 items-center justify-center rounded-3xl border-[3px] p-3 shadow-md
              transition-all active:scale-95 focus-visible:outline-4 focus-visible:outline-amber-400
              ${picked === o
                ? o === puzzle.answer ? 'border-emerald-500 bg-emerald-100 ring-4 ring-emerald-200'
                  : 'border-rose-400 bg-rose-50 bss-shake'
                : solved && o === puzzle.answer ? 'border-emerald-500 bg-emerald-100'
                : 'border-violet-200 bg-white hover:border-violet-400'}`}
          >
            <span className="text-4xl" aria-hidden>{o}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------- Find the Clue ------------------------- */

interface ClueScene {
  bg: string; // tailwind bg for scene card
  title: string;
  target: { emoji: string; label: string };
  items: Array<{ emoji: string; x: number; y: number; size?: number }>;
}

const SCENES: ClueScene[] = [
  {
    bg: 'from-lime-200 via-green-200 to-emerald-300',
    title: 'Sunny Garden',
    target: { emoji: '🦋', label: 'Butterfly' },
    items: [
      { emoji: '🌷', x: 10, y: 68 }, { emoji: '🌻', x: 30, y: 74 }, { emoji: '🌼', x: 52, y: 66 },
      { emoji: '🐞', x: 70, y: 80 }, { emoji: '🌿', x: 86, y: 70 }, { emoji: '🐝', x: 18, y: 38 },
      { emoji: '🐌', x: 40, y: 86 }, { emoji: '🍄', x: 62, y: 90 }, { emoji: '🪨', x: 80, y: 90 },
      { emoji: '🌳', x: 88, y: 34, size: 44 }, { emoji: '🍃', x: 58, y: 30 }, { emoji: '☀️', x: 8, y: 8, size: 30 },
      { emoji: '🦋', x: 66, y: 42, size: 34 }, { emoji: '🐜', x: 26, y: 56 },
    ],
  },
  {
    bg: 'from-indigo-300 via-violet-400 to-purple-500',
    title: 'Night Sky',
    target: { emoji: '🌙', label: 'Moon' },
    items: [
      { emoji: '⭐', x: 12, y: 22 }, { emoji: '⭐', x: 30, y: 12 }, { emoji: '⭐', x: 52, y: 20 },
      { emoji: '✨', x: 70, y: 14 }, { emoji: '⭐', x: 88, y: 24 }, { emoji: '☁️', x: 16, y: 48 },
      { emoji: '☁️', x: 60, y: 55 }, { emoji: '🦇', x: 38, y: 34 }, { emoji: '🌟', x: 80, y: 44 },
      { emoji: '✨', x: 10, y: 70 }, { emoji: '⭐', x: 46, y: 66 }, { emoji: '🌟', x: 28, y: 82 },
      { emoji: '🌙', x: 78, y: 70, size: 38 }, { emoji: '🦉', x: 50, y: 88 },
    ],
  },
  {
    bg: 'from-amber-200 via-orange-200 to-rose-300',
    title: 'Fruit Market',
    target: { emoji: '🍎', label: 'Apple' },
    items: [
      { emoji: '🥕', x: 12, y: 24 }, { emoji: '🍌', x: 34, y: 18 }, { emoji: '🍇', x: 56, y: 26 },
      { emoji: '🍞', x: 78, y: 20 }, { emoji: '🧅', x: 10, y: 52 }, { emoji: '🌶️', x: 30, y: 46 },
      { emoji: '🍅', x: 52, y: 54 }, { emoji: '🥭', x: 74, y: 48 }, { emoji: '🍉', x: 18, y: 78 },
      { emoji: '🫑', x: 40, y: 84 }, { emoji: '🧄', x: 62, y: 80 }, { emoji: '🥔', x: 82, y: 76 },
      { emoji: '🍎', x: 48, y: 34, size: 30 }, { emoji: '🧺', x: 90, y: 88, size: 30 },
    ],
  },
];

export function FindClueGame({ initialRound, initialScore, onProgress, onFinish }: GameProps) {
  const { playSound, buzz, recordCorrect, say, mode } = useBSS();
  const TOTAL = SCENES.length;
  const [round, setRound] = useState(initialRound);
  const [score, setScore] = useState(initialScore);
  const [tried, setTried] = useState(false);
  const [wrongId, setWrongId] = useState<number | null>(null);
  const [found, setFound] = useState(false);
  const [sparkleAt, setSparkleAt] = useState<{ x: number; y: number } | null>(null);
  const scene = SCENES[round % TOTAL];

  useEffect(() => { onProgress(round, score); }, [round, score, onProgress]);

  useEffect(() => {
    if (mode !== 'audio') return;
    const t = setTimeout(() => say(`Find the ${scene.target.label}`), 400);
    return () => clearTimeout(t);
  }, [say, scene, mode]);

  const tap = (item: ClueScene['items'][number], idx: number) => {
    if (found) return;
    if (item.emoji === scene.target.emoji) {
      if (!tried) recordCorrect(scene.target.label);
      setFound(true);
      setSparkleAt({ x: item.x, y: item.y });
      playSound('sparkle');
      setTimeout(() => { playSound('success'); buzz('success'); }, 250);
      if (mode === 'audio') say(`You found the ${scene.target.label}! Great looking!`);
      setTimeout(() => {
        setFound(false); setSparkleAt(null); setTried(false); setWrongId(null);
        if (round + 1 >= TOTAL) onFinish(score + (tried ? 0 : 1), TOTAL);
        else { setRound((r) => r + 1); setScore((s) => s + (tried ? 0 : 1)); }
      }, 1900);
    } else {
      setWrongId(idx);
      setTried(true);
      buzz('error');
      if (mode === 'audio') say('Not that one. Look again!');
      setTimeout(() => setWrongId(null), 800);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card className="text-center">
        <p className="text-sm font-bold tracking-wide text-violet-500 uppercase">Round {round + 1} of {TOTAL} · {scene.title}</p>
        <h2 className="mt-1 text-xl font-black text-violet-950">Find the clue! 🔍</h2>
      </Card>

      {/* prompt card — visual, always visible (no audio needed) */}
      <div className="mx-auto flex items-center gap-3 rounded-2xl border-[3px] border-violet-300 bg-white px-5 py-2.5 shadow-lg bss-pop" key={`p-${round}`}>
        <span className="text-4xl" aria-hidden>{scene.target.emoji}</span>
        <span className="text-lg font-black text-violet-950">Find: {scene.target.label}</span>
      </div>

      {/* scene */}
      <div className={`relative mx-auto aspect-[4/3] w-full overflow-hidden rounded-3xl border-[3px] border-white
        bg-gradient-to-br ${scene.bg} shadow-xl`} role="img" aria-label={`${scene.title} scene`}>
        {scene.items.map((item, i) => {
          const isWrong = wrongId === i;
          const isTarget = item.emoji === scene.target.emoji;
          return (
            <button
              key={i}
              onClick={() => tap(item, i)}
              disabled={found}
              aria-hidden // visual scene; prompt card carries the accessible label
              tabIndex={-1}
              className={`absolute -translate-x-1/2 -translate-y-1/2 text-[26px] leading-none transition-all
                ${isWrong ? 'bss-shake opacity-60' : 'hover:scale-125'}
                ${found && isTarget ? 'bss-speaking' : ''}`}
              style={{ left: `${item.x}%`, top: `${item.y}%`, fontSize: item.size ? `${item.size}px` : undefined }}
            >
              {item.emoji}
            </button>
          );
        })}
        {sparkleAt && (
          <span className="bss-burst pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-5xl"
            style={{ left: `${sparkleAt.x}%`, top: `${sparkleAt.y}%` }} aria-hidden>✨</span>
        )}
        {found && (
          <span className="bss-pop absolute inset-x-0 bottom-3 mx-auto w-max rounded-full bg-emerald-500 px-4
            py-1.5 text-sm font-black text-white shadow-lg" aria-hidden>
            ✅ Found it!
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-center gap-3">
        <Kiko size={52} mood="happy" />
        <p className="text-sm font-bold text-violet-500">
          {found ? 'Great searching!' : 'Look carefully around the scene.'}
        </p>
      </div>
    </div>
  );
}

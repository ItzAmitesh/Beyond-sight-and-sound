'use client';

/* ============================================================
   Audio-Tactile mode games (PPTX page 11 — Siddhi's mode)
   Design rule: do NOT require vision to complete the task.
   Every instruction is narrated AND shown as text (SRS 11.1:
   never a single sensory channel for essential information).
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBSS } from '@/lib/bss/context';
import { soundEngine, type SoundName } from '@/lib/bss/audio';
import { BigButton, Card } from '../../bits';
import { Kiko } from '../../kiko';
import { shuffle, type GameProps } from './shared';

/* ------------------------- Sound Match ------------------------- */

const SM_ITEMS: Array<{ sound: SoundName; emoji: string; label: string }> = [
  { sound: 'bird', emoji: '🐦', label: 'Bird' },
  { sound: 'cat', emoji: '🐱', label: 'Cat' },
  { sound: 'dog', emoji: '🐶', label: 'Dog' },
  { sound: 'bell', emoji: '🔔', label: 'Bell' },
  { sound: 'horn', emoji: '🚗', label: 'Car' },
  { sound: 'rain', emoji: '🌧️', label: 'Rain' },
  { sound: 'drum', emoji: '🥁', label: 'Drum' },
  { sound: 'train', emoji: '🚂', label: 'Train' },
];

export function SoundMatchGame({ initialRound, initialScore, onProgress, onFinish }: GameProps) {
  const { say, playSound, buzz, recordCorrect, mode } = useBSS();
  const TOTAL = 4;
  const plan = useMemo(() => shuffle(SM_ITEMS).slice(0, TOTAL), []);
  const [round, setRound] = useState(initialRound);
  const [score, setScore] = useState(initialScore);
  const [triedThisRound, setTriedThisRound] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const options = useMemo(() => {
    const target = plan[round % plan.length];
    const distract = shuffle(SM_ITEMS.filter((i) => i.sound !== target.sound)).slice(0, 3);
    return shuffle([target, ...distract]);
  }, [plan, round]);
  const target = plan[round % plan.length];

  useEffect(() => {
    onProgress(round, score);
  }, [round, score, onProgress]);

  const playTarget = useCallback(() => {
    setPlaying(true);
    playSound(target.sound);
    setTimeout(() => setPlaying(false), 1500);
  }, [playSound, target.sound]);

  useEffect(() => {
    if (mode !== 'audio') return;
    const t = setTimeout(() => {
      say('Listen! What made this sound?');
      setTimeout(playTarget, 1400);
    }, 300);
    return () => clearTimeout(t);
  }, [say, playTarget, mode]);

  // visual mode: autoplay each round (audio mode narrates first, then plays)
  useEffect(() => {
    if (mode === 'audio') return;
    const t = setTimeout(playTarget, 350);
    return () => clearTimeout(t);
  }, [playTarget, mode]);

  const choose = (item: typeof target) => {
    setPicked(item.label);
    if (item.sound === target.sound) {
      if (!triedThisRound) { recordCorrect(target.label); }
      playSound('success');
      buzz('success');
      if (mode === 'audio') say(`Yes! That is the ${target.label}!`);
      setTimeout(() => {
        setPicked(null);
        setTriedThisRound(false);
        if (round + 1 >= TOTAL) onFinish(score + (triedThisRound ? 0 : 1), TOTAL);
        else { setRound((r) => r + 1); setScore((s) => s + (triedThisRound ? 0 : 1)); }
      }, 1600);
    } else {
      playSound('error');
      buzz('error');
      setTriedThisRound(true);
      if (mode === 'audio') say('Almost! Listen again and try once more.');
      setTimeout(() => setPicked(null), 900);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card className="text-center">
        <p className="text-sm font-bold tracking-wide text-violet-500 uppercase">Round {round + 1} of {TOTAL}</p>
        <h2 className="mt-1 text-xl font-black text-violet-950">Listen… what made this sound? 👂</h2>
      </Card>

      {/* big speaker target with replay — dual channel: sound + speaker visual */}
      <button
        onClick={playTarget}
        aria-label="Play the sound again"
        className={`bss-tap mx-auto flex size-32 items-center justify-center rounded-full border-4
          border-amber-300 bg-gradient-to-br from-amber-100 to-amber-300 text-6xl shadow-xl transition-all
          hover:scale-105 active:scale-95 focus-visible:outline-4 focus-visible:outline-amber-500
          ${playing ? 'bss-speaking' : ''}`}
      >
        {playing ? '🎶' : '🔊'}
      </button>
      <p className="text-center text-sm font-bold text-violet-500">
        {playing ? 'Sound is playing…' : 'Tap the speaker to hear it again'}
      </p>

      <div className="mt-auto grid grid-cols-2 gap-3">
        {options.map((o) => (
          <button
            key={o.label}
            onClick={() => choose(o)}
            aria-label={o.label}
            className={`bss-tap flex min-h-24 flex-col items-center justify-center gap-1 rounded-3xl border-[3px]
              p-3 shadow-md transition-all active:scale-95 focus-visible:outline-4 focus-visible:outline-amber-400
              ${picked === o.label
                ? o.sound === target.sound
                  ? 'border-emerald-500 bg-emerald-100 ring-4 ring-emerald-200'
                  : 'border-rose-400 bg-rose-50 bss-shake'
                : 'border-violet-200 bg-white hover:border-violet-400'}`}
          >
            <span className="text-4xl" aria-hidden>{o.emoji}</span>
            <span className="text-sm font-black text-violet-950">{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------- Audio Memory ------------------------- */

const AM_TILES: Array<{ sound: SoundName; emoji: string; label: string }> = [
  { sound: 'bell', emoji: '🔔', label: 'Bell' },
  { sound: 'bird', emoji: '🐦', label: 'Bird' },
  { sound: 'drum', emoji: '🥁', label: 'Drum' },
  { sound: 'rain', emoji: '🌧️', label: 'Rain' },
];

export function AudioMemoryGame({ initialRound, initialScore, onProgress, onFinish }: GameProps) {
  const { say, playSound, buzz, recordCorrect, mode } = useBSS();
  const TOTAL = 3;
  const [round, setRound] = useState(initialRound);
  const [score, setScore] = useState(initialScore);
  const [phase, setPhase] = useState<'listen' | 'yourTurn' | 'check'>('listen');
  const [step, setStep] = useState(0); // index child must reproduce
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [wrongAt, setWrongAt] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const seqLen = round + 2; // 2, 3, 4
  const seq = useMemo(
    () => Array.from({ length: seqLen }, () => Math.floor(Math.random() * AM_TILES.length)),
    [seqLen],
  );

  useEffect(() => { onProgress(round, score); }, [round, score, onProgress]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => clearTimers, []);

  const playSequence = useCallback((s: number[]) => {
    clearTimers();
    setPhase('listen');
    setStep(0);
    s.forEach((tileIdx, i) => {
      timers.current.push(setTimeout(() => {
        setActiveTile(tileIdx);
        playSound(AM_TILES[tileIdx].sound);
        timers.current.push(setTimeout(() => setActiveTile(null), 550));
      }, 700 + i * 900));
    });
    timers.current.push(setTimeout(() => {
      setPhase('yourTurn');
      if (mode === 'audio') say('Your turn! Repeat the sounds in the same order.');
    }, 700 + s.length * 900 + 200));
  }, [playSound, say, mode]);

  /* build + play sequence per round (sequence derived via useMemo) */
  useEffect(() => {
    if (mode === 'audio') {
      say(`Round ${round + 1}. Listen carefully. I will play ${seqLen} sounds. Remember the order!`);
    }
    const t = setTimeout(() => playSequence(seq), mode === 'audio' ? 2600 : 500);
    timers.current.push(t);
    return clearTimers;
  }, [round]);

  const tapTile = (idx: number) => {
    if (phase !== 'yourTurn') return;
    setActiveTile(idx);
    playSound(AM_TILES[idx].sound);
    setTimeout(() => setActiveTile(null), 300);

    if (seq[step] === idx) {
      const nextStep = step + 1;
      if (nextStep >= seq.length) {
        // complete!
        if (wrongAt === null) recordCorrect(AM_TILES[idx].label);
        setPhase('check');
        playSound('success');
        buzz('success');
        if (mode === 'audio') say('Perfect memory!');
        setTimeout(() => {
          setWrongAt(null);
          if (round + 1 >= TOTAL) onFinish(score + (wrongAt === null ? 1 : 0), TOTAL);
          else { setRound((r) => r + 1); setScore((s) => s + (wrongAt === null ? 1 : 0)); }
        }, 1700);
      } else {
        setStep(nextStep);
      }
    } else {
      setWrongAt(step);
      setPhase('check');
      playSound('error');
      buzz('error');
      if (mode === 'audio') say('Oops! Let us hear the sequence again. Listen carefully.');
      setTimeout(() => { setWrongAt(null); playSequence(seq); }, 1600);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card className="text-center">
        <p className="text-sm font-bold tracking-wide text-violet-500 uppercase">Round {round + 1} of {TOTAL} · {seqLen} sounds</p>
        <h2 className="mt-1 text-xl font-black text-violet-950">
          {phase === 'listen' ? '👂 Listen carefully…' : phase === 'yourTurn' ? '🙋 Your turn — repeat the order!' : phase === 'check' ? '✨ Checking…' : ''}
        </h2>
        <div className="mt-2 flex justify-center gap-1.5" aria-label={`${step} of ${seq.length} repeated`}>
          {seq.map((_, i) => (
            <span key={i} className={`size-3 rounded-full ${i < step ? 'bg-emerald-400' : 'bg-violet-200'}`} aria-hidden />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {AM_TILES.map((t, i) => (
          <button
            key={t.label}
            onClick={() => tapTile(i)}
            disabled={phase === 'listen'}
            aria-label={`${t.label} sound${activeTile === i ? ', playing' : ''}`}
            className={`bss-tap flex min-h-32 flex-col items-center justify-center gap-2 rounded-3xl border-[3px] p-4
              shadow-lg transition-all active:scale-95 focus-visible:outline-4 focus-visible:outline-amber-400
              disabled:cursor-default
              ${activeTile === i ? 'border-violet-600 bg-violet-100 scale-105 ring-4 ring-violet-300'
                : wrongAt !== null ? 'border-violet-200 bg-white'
                : 'border-violet-200 bg-white hover:border-violet-400 enabled:hover:bg-violet-50'}
              ${phase === 'listen' ? 'opacity-70' : ''}`}
          >
            <span className="text-5xl" aria-hidden>{t.emoji}</span>
            <span className="text-sm font-black text-violet-950">{t.label}</span>
          </button>
        ))}
      </div>

      {phase === 'yourTurn' && (
        <BigButton variant="secondary" className="mx-auto" onClick={() => playSequence(seq)}>
          🔁 Hear the sequence again
        </BigButton>
      )}
    </div>
  );
}

/* ------------------------- Follow the Sound ------------------------- */

type Direction = 'left' | 'front' | 'right';

export function FollowSoundGame({ initialRound, initialScore, onProgress, onFinish }: GameProps) {
  const { say, playSound, buzz, recordCorrect, mode } = useBSS();
  const TOTAL = 4;
  const [round, setRound] = useState(initialRound);
  const [score, setScore] = useState(initialScore);
  const [tried, setTried] = useState(false);
  const [picked, setPicked] = useState<Direction | null>(null);
  const [playing, setPlaying] = useState(false);
  const target: Direction = useMemo(
    () => (['left', 'front', 'right'] as Direction[])[
      // seeded-ish pick that changes every round
      (round * 5 + Math.floor(Math.random() * 3)) % 3
    ],
    [round],
  );
  const pan = target === 'left' ? -1 : target === 'right' ? 1 : 0;

  useEffect(() => { onProgress(round, score); }, [round, score, onProgress]);

  const playCue = useCallback(() => {
    setPlaying(true);
    // three beeps from the panned position so direction is clear
    playSound('bell', pan);
    setTimeout(() => playSound('bell', pan), 700);
    setTimeout(() => playSound('bell', pan), 1400);
    setTimeout(() => setPlaying(false), 2100);
  }, [pan, playSound]);

  useEffect(() => {
    if (mode !== 'audio') return;
    say('Kiko is hiding! Listen with care — where is her sound coming from?');
    const t = setTimeout(playCue, 2200);
    return () => clearTimeout(t);
  }, [say, playCue, mode]);

  // visual mode: autoplay the spatial cue each round
  useEffect(() => {
    if (mode === 'audio') return;
    const t = setTimeout(playCue, 350);
    return () => clearTimeout(t);
  }, [playCue, mode]);

  const choose = (dir: Direction) => {
    setPicked(dir);
    if (dir === target) {
      if (!tried) recordCorrect(`${target} side`);
      playSound('success');
      buzz('success');
      if (mode === 'audio') say(`Found me! I was on the ${target === 'front' ? 'front' : `${target} side`}.`);
      setTimeout(() => {
        setPicked(null); setTried(false);
        if (round + 1 >= TOTAL) onFinish(score + (tried ? 0 : 1), TOTAL);
        else { setRound((r) => r + 1); setScore((s) => s + (tried ? 0 : 1)); }
      }, 1700);
    } else {
      playSound('error');
      buzz('error');
      setTried(true);
      if (mode === 'audio') say('Not there! Listen again — follow the sound.');
      setTimeout(() => setPicked(null), 900);
    }
  };

  const opts: Array<{ dir: Direction; emoji: string; label: string }> = [
    { dir: 'left', emoji: '⬅️', label: 'Left' },
    { dir: 'front', emoji: '⬆️', label: 'Front' },
    { dir: 'right', emoji: '➡️', label: 'Right' },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card className="text-center">
        <p className="text-sm font-bold tracking-wide text-violet-500 uppercase">Round {round + 1} of {TOTAL}</p>
        <h2 className="mt-1 text-xl font-black text-violet-950">Where is Kiko? 🧭</h2>
        <p className="mt-1 text-xs font-semibold text-violet-400">
          🎧 Tip: headphones make the direction easier to hear.
        </p>
      </Card>

      <div className="relative mx-auto flex h-40 w-full max-w-xs items-center justify-center rounded-3xl border-2 border-violet-100 bg-white/70">
        {/* child silhouette center */}
        <span className="text-6xl" aria-hidden>🧒</span>
        <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-4xl transition-all ${target === 'left' && playing ? 'bss-speaking' : 'opacity-40'}`} aria-hidden>🌳</span>
        <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-4xl transition-all ${target === 'right' && playing ? 'bss-speaking' : 'opacity-40'}`} aria-hidden>🌳</span>
        <span className={`absolute top-3 left-1/2 -translate-x-1/2 text-3xl transition-all ${target === 'front' && playing ? 'bss-speaking' : 'opacity-40'}`} aria-hidden>🌳</span>
        {/* Kiko appears on success */}
        {picked === target && (
          <span className="bss-pop absolute -top-5 right-8" aria-hidden><Kiko size={60} mood="cheer" /></span>
        )}
      </div>

      <button
        onClick={playCue}
        disabled={playing}
        className={`bss-tap mx-auto flex min-h-13 items-center gap-2 rounded-full border-2 border-amber-300
          bg-amber-50 px-6 font-bold text-amber-800 shadow-md transition-all active:scale-95
          focus-visible:outline-4 focus-visible:outline-amber-500 ${playing ? 'bss-speaking' : ''}`}
      >
        🔊 {playing ? 'Listening…' : 'Play the sound again'}
      </button>

      <div className="mt-auto grid grid-cols-3 gap-3">
        {opts.map((o) => (
          <button
            key={o.dir}
            onClick={() => choose(o.dir)}
            aria-label={o.label}
            className={`bss-tap flex min-h-24 flex-col items-center justify-center gap-1 rounded-3xl border-[3px] p-3
              shadow-md transition-all active:scale-95 focus-visible:outline-4 focus-visible:outline-amber-400
              ${picked === o.dir
                ? o.dir === target
                  ? 'border-emerald-500 bg-emerald-100 ring-4 ring-emerald-200'
                  : 'border-rose-400 bg-rose-50 bss-shake'
                : 'border-violet-200 bg-white hover:border-violet-400'}`}
          >
            <span className="text-4xl" aria-hidden>{o.emoji}</span>
            <span className="text-sm font-black text-violet-950">{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

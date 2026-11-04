'use client';

/* ============================================================
   Game host shell + shared helpers for the six games.
   Handles: exit confirmation (SRS 15 "child exits mid-quest"),
   save & resume (FR-14), round progress dots, score display.
   Games themselves are mode-specific and self-contained.
   ============================================================ */

import { useEffect, useState } from 'react';
import { useBSS } from '@/lib/bss/context';
import { POINTS_PER_CORRECT } from '@/lib/bss/content';
import type { GameId } from '@/lib/bss/types';
import { Pill } from '../../bits';
import { Kiko } from '../../kiko';

export const GAME_ROUNDS: Record<GameId, number> = {
  'sound-match': 4,
  'audio-memory': 3,
  'follow-sound': 4,
  'sign-match': 4,
  'visual-puzzle': 3,
  'find-clue': 3,
};

export interface GameProps {
  initialRound: number;
  initialScore: number;
  onProgress: (roundIndex: number, score: number) => void;
  onFinish: (score: number, total: number) => void;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ------------------------- host ------------------------- */

export function GameHost({ gameId, chapterId }: { gameId: GameId; chapterId?: string }) {
  const { profile, exitGameEarly, finishGame, playSound, clearResume } = useBSS();
  const total = GAME_ROUNDS[gameId];
  const savedResume = profile?.resume ?? null;
  const canResume = savedResume?.gameId === gameId && savedResume.roundIndex > 0;

  // resume state is read once at mount via lazy initializers (FR-14)
  const [roundIndex, setRoundIndex] = useState(() => (canResume ? savedResume!.roundIndex : 0));
  const [score, setScore] = useState(() => (canResume ? savedResume!.score : 0));
  const [confirmExit, setConfirmExit] = useState(false);
  const [resumeAsk, setResumeAsk] = useState(canResume);

  const onProgress = (r: number, s: number) => {
    setRoundIndex(r);
    setScore(s);
  };

  const startOver = () => {
    setResumeAsk(false);
    setRoundIndex(0);
    setScore(0);
    clearResume();
    playSound('tap');
  };

  return (
    <div className="flex min-h-full flex-col px-5 pb-8 pt-5">
      {/* header */}
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => setConfirmExit(true)}
          aria-label="Leave game"
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl border-2 border-violet-200
            bg-white text-lg text-violet-600 shadow-md hover:bg-violet-50 active:scale-95
            focus-visible:outline-4 focus-visible:outline-amber-400"
        >
          ✕
        </button>
        <div className="flex flex-1 items-center justify-center gap-1.5" aria-label={`Round ${Math.min(roundIndex + 1, total)} of ${total}`}>
          {Array.from({ length: total }).map((_, i) => (
            <span key={i}
              className={`h-2.5 rounded-full transition-all ${i < roundIndex ? 'w-6 bg-emerald-400' : i === roundIndex ? 'w-6 bg-violet-600' : 'w-2.5 bg-violet-200'}`}
              aria-hidden />
          ))}
        </div>
        <Pill className="shrink-0 bg-amber-100 text-amber-800">⭐ {score * POINTS_PER_CORRECT}</Pill>
      </div>

      {resumeAsk ? (
        <ResumeAsk
          onResume={() => setResumeAsk(false)}
          onStartOver={startOver}
          round={savedResume!.roundIndex}
        />
      ) : (
        <GameRouter
          key={`${gameId}-${roundIndex === 0 && score === 0 ? 'fresh' : 'live'}`}
          gameId={gameId}
          initialRound={roundIndex}
          initialScore={score}
          onProgress={onProgress}
          onFinish={(s, t) => finishGame(gameId, chapterId, s, t)}
        />
      )}

      {/* exit confirm modal — safe exit per SRS 15 */}
      {confirmExit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-violet-950/60 p-6"
          role="dialog" aria-modal="true" aria-label="Leave game confirmation">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl bss-pop">
            <Kiko size={72} mood="sleepy" />
            <h2 className="mt-2 text-xl font-black text-violet-950">Leave the quest?</h2>
            <p className="mt-1 text-sm font-semibold text-violet-500">
              {roundIndex > 0
                ? 'Kiko will save your progress so you can continue later!'
                : 'You are at the beginning — nothing to worry about.'}
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                onClick={() => setConfirmExit(false)}
                className="min-h-13 rounded-2xl border-2 border-violet-700 bg-violet-600 px-5 py-3 text-base
                  font-bold text-white shadow-lg hover:bg-violet-700 active:scale-[0.98]
                  focus-visible:outline-4 focus-visible:outline-amber-400"
              >
                🎮 Keep playing
              </button>
              <button
                onClick={() => exitGameEarly(gameId, roundIndex, score, chapterId)}
                className="min-h-12 rounded-2xl border-2 border-violet-200 bg-white px-5 py-3 text-base
                  font-bold text-violet-700 hover:bg-violet-50 active:scale-[0.98]
                  focus-visible:outline-4 focus-visible:outline-amber-400"
              >
                💾 Save & leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResumeAsk({ onResume, onStartOver, round }: { onResume: () => void; onStartOver: () => void; round: number }) {
  const { say } = useBSS();
  useEffect(() => {
    say(`Welcome back! You were on round ${round + 1}. Continue where you left off, or start over.`);
  }, [say, round]);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
      <Kiko size={110} mood="happy" />
      <h2 className="text-2xl font-black text-violet-950">Welcome back! 👋</h2>
      <p className="max-w-xs text-sm font-semibold text-violet-500">
        You were on <b>round {round + 1}</b>. Continue where you left off?
      </p>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={onResume}
          className="min-h-14 rounded-2xl border-2 border-violet-700 bg-violet-600 text-lg font-bold text-white
            shadow-lg hover:bg-violet-700 active:scale-[0.98] focus-visible:outline-4 focus-visible:outline-amber-400"
        >
          ▶ Continue (round {round + 1})
        </button>
        <button
          onClick={onStartOver}
          className="min-h-13 rounded-2xl border-2 border-violet-200 bg-white text-base font-bold text-violet-700
            hover:bg-violet-50 active:scale-[0.98] focus-visible:outline-4 focus-visible:outline-amber-400"
        >
          🔄 Start over
        </button>
      </div>
    </div>
  );
}

/* router lives here to avoid circular imports */
import { SoundMatchGame, AudioMemoryGame, FollowSoundGame } from './audioGames';
import { SignMatchGame, VisualPuzzleGame, FindClueGame } from './visualGames';

function GameRouter(props: GameProps & { gameId: GameId }) {
  switch (props.gameId) {
    case 'sound-match': return <SoundMatchGame {...props} />;
    case 'audio-memory': return <AudioMemoryGame {...props} />;
    case 'follow-sound': return <FollowSoundGame {...props} />;
    case 'sign-match': return <SignMatchGame {...props} />;
    case 'visual-puzzle': return <VisualPuzzleGame {...props} />;
    case 'find-clue': return <FindClueGame {...props} />;
  }
}

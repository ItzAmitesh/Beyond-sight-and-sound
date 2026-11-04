'use client';

/* ============================================================
   Home / Quest Map (FR-3, FR-13), Profile Picker (FR-10),
   Explore catalogue (FR-11).
   ============================================================ */

import { useEffect } from 'react';
import { useBSS, gamesForMode } from '@/lib/bss/context';
import { CHAPTERS, DAILY_WORD_GOAL, gameById } from '@/lib/bss/content';
import type { GameDef } from '@/lib/bss/types';
import { BigButton, Card, ModeChip, Pill, ProgressRing, StarRow, TopBar } from '../bits';
import { Kiko } from '../kiko';

/* ------------------------- Profile picker ------------------------- */

export function ProfilePickerScreen() {
  const { profiles, selectProfile, go, deleteProfile } = useBSS();

  return (
    <div className="flex min-h-full flex-col gap-4 px-6 pb-10 pt-12">
      <div className="text-center">
        <Kiko size={86} mood="happy" />
        <h1 className="mt-1 text-2xl font-black text-violet-950">Who is playing today?</h1>
      </div>

      {profiles.map((p) => (
        <Card key={p.id} className="flex items-center gap-3">
          <button
            onClick={() => selectProfile(p.id)}
            className="flex min-h-16 flex-1 items-center gap-3 rounded-2xl text-left transition-all hover:bg-violet-50
              focus-visible:outline-4 focus-visible:outline-amber-400 active:scale-[0.99]"
            aria-label={`Play as ${p.name}`}
          >
            <span className="flex size-14 items-center justify-center rounded-2xl bg-violet-100 text-3xl" aria-hidden>
              {p.avatar}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-lg font-black text-violet-950">{p.name}</span>
              <span className="mt-1 flex flex-wrap gap-1.5">
                <ModeChip mode={p.mode} />
                <Pill className="bg-amber-100 text-amber-800">⭐ {p.progress.points} pts</Pill>
              </span>
            </span>
            <span aria-hidden className="text-2xl text-violet-300">▶</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Remove profile "${p.name}" and its progress from this device?`)) {
                deleteProfile(p.id);
              }
            }}
            aria-label={`Remove ${p.name}`}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-violet-100
              text-violet-300 hover:border-rose-300 hover:text-rose-500 focus-visible:outline-4 focus-visible:outline-amber-400"
          >
            🗑
          </button>
        </Card>
      ))}

      <BigButton variant="secondary" className="mt-2 w-full" onClick={() => go({ name: 'setupName' })}>
        ➕ Add a new child
      </BigButton>
      <p className="text-center text-xs font-semibold text-violet-400">
        🔒 Profiles stay private on this device only.
      </p>
    </div>
  );
}

/* ---------------------------- Home ---------------------------- */

export function HomeScreen() {
  const { profile, go, startGame, chapterUnlocked, mode, say } = useBSS();
  const progress = profile?.progress;

  const dailyWords = progress?.dailyWords.date === new Date().toISOString().slice(0, 10)
    ? progress.dailyWords.count : 0;

  // next action: incomplete chapter in order, or replay highest unlocked
  const nextChapter = progress
    ? CHAPTERS.find((c) => (progress.stars[c.id] ?? 0) === 0 && chapterUnlocked(c.index))
    : undefined;
  const lastChapter = progress
    ? [...CHAPTERS].reverse().find((c) => chapterUnlocked(c.index))
    : undefined;
  const continueChapter = nextChapter ?? lastChapter ?? CHAPTERS[0];
  const continueGame = gameById(continueChapter.gameByMode[mode]);

  useEffect(() => {
    if (profile && mode === 'audio') {
      const t = setTimeout(() =>
        say(`Hello ${profile.name}! Ready for an adventure? Press continue quest to play ${continueGame.title}.`), 600);
      return () => clearTimeout(t);
    }
  }, [mode, say, profile, continueGame.title]);

  if (!profile) return null;

  const openChapter = (c: (typeof CHAPTERS)[number]) => {
    if (!chapterUnlocked(c.index)) {
      say('This quest is locked. Finish the previous chapter first.');
      return;
    }
    go({ name: 'story', chapterId: c.id });
  };

  return (
    <div className="flex min-h-full flex-col gap-4 px-5 pb-8 pt-6">
      {/* greeting row — matches UI mockup "Hello, Alex!" */}
      <div className="flex items-center gap-3">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-md" aria-hidden>
          {profile.avatar}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-wide text-violet-400 uppercase">Welcome back</p>
          <h1 className="truncate text-xl font-black text-violet-950">Hello, {profile.name}!</h1>
        </div>
        <button
          onClick={() => go({ name: 'settings' })}
          aria-label="Settings"
          className="flex size-12 items-center justify-center rounded-2xl border-2 border-violet-200 bg-white text-xl
            shadow-md transition-all hover:bg-violet-50 active:scale-95 focus-visible:outline-4 focus-visible:outline-amber-400"
        >
          ⚙️
        </button>
      </div>

      {/* continue quest card (UI mockup: Continue Your Quest 40%) */}
      <button
        onClick={() => openChapter(continueChapter)}
        className={`bss-tap relative overflow-hidden rounded-3xl bg-gradient-to-br ${continueChapter.color}
          p-5 text-left text-white shadow-xl transition-all hover:shadow-2xl active:scale-[0.99]
          focus-visible:outline-4 focus-visible:outline-amber-300`}
      >
        <div className="flex items-center gap-4">
          <span className="text-5xl drop-shadow-lg" aria-hidden>{continueChapter.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-widest uppercase opacity-90">
              {nextChapter ? 'Continue your quest' : 'Play again'}
            </p>
            <p className="truncate text-xl font-black">Chapter {continueChapter.index + 1}: {continueChapter.title}</p>
            <p className="truncate text-sm font-semibold opacity-90">
              {continueGame.emoji} {continueGame.title} · {continueChapter.questLine}
            </p>
          </div>
          <span aria-hidden className="text-3xl drop-shadow">▶</span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/30">
          <div
            className="h-full rounded-full bg-white transition-all"
            style={{ width: `${(Object.values(progress.stars).reduce((a, s) => a + s, 0) / 9) * 100}%` }}
          />
        </div>
      </button>

      {/* daily goal — "Learn 20 new words" (UI mockup) */}
      <Card className="flex items-center gap-4">
        <ProgressRing value={Math.min(dailyWords, DAILY_WORD_GOAL)} total={DAILY_WORD_GOAL} />
        <div className="min-w-0 flex-1">
          <p className="font-black text-violet-950">🎯 Today&apos;s goal</p>
          <p className="text-sm font-semibold text-violet-500">
            Learn {DAILY_WORD_GOAL} new words — {dailyWords}/{DAILY_WORD_GOAL} done!
            {dailyWords >= DAILY_WORD_GOAL ? ' Goal complete! 🎉' : ''}
          </p>
        </div>
        {progress.streak > 0 && (
          <Pill className="shrink-0 bg-orange-100 text-orange-700" >
            🔥 {progress.streak} day{progress.streak > 1 ? 's' : ''}
          </Pill>
        )}
      </Card>

      {/* quest map */}
      <h2 className="mt-1 px-1 text-sm font-black tracking-widest text-violet-500 uppercase">
        Your quest map
      </h2>
      <div className="relative flex max-w-full flex-col gap-1">
        {CHAPTERS.map((c, i) => {
          const stars = progress.stars[c.id] ?? 0;
          const unlocked = chapterUnlocked(c.index);
          const complete = stars >= 3;
          const locked = !unlocked;
          return (
            <div key={c.id} className="flex gap-3">
              {/* connector rail */}
              <div className="flex flex-col items-center">
                <span
                  className={`flex size-16 items-center justify-center rounded-full border-4 text-3xl shadow-lg transition-all
                    ${locked ? 'border-violet-200 bg-violet-100 opacity-70 grayscale'
                      : `bg-gradient-to-br ${c.color} border-white shadow-xl ${complete ? '' : 'bss-float'}`}`}
                  aria-hidden
                >
                  {locked ? '🔒' : c.emoji}
                </span>
                {i < CHAPTERS.length - 1 && (
                  <span className={`w-1.5 flex-1 rounded-full ${stars > 0 ? 'bg-violet-400' : 'bg-violet-200'}`}
                    style={{ minHeight: 28 }} aria-hidden />
                )}
              </div>
              <button
                onClick={() => openChapter(c)}
                aria-label={`Chapter ${i + 1}: ${c.title}${locked ? '. Locked.' : ''}. ${stars} of 3 stars.`}
                className={`mb-4 flex min-h-16 min-w-0 flex-1 flex-col items-start justify-center overflow-hidden rounded-2xl border-2 px-4 py-2
                  text-left transition-all active:scale-[0.99] focus-visible:outline-4 focus-visible:outline-amber-400
                  ${locked ? 'border-dashed border-violet-200 bg-white/60' : 'border-violet-100 bg-white shadow-md hover:border-violet-300 hover:shadow-lg'}`}
              >
                <span className="flex w-full min-w-0 items-center justify-between gap-2">
                  <span className={`min-w-0 truncate font-black ${locked ? 'text-violet-400' : 'text-violet-950'}`}>
                    Ch {i + 1} · {c.title}
                  </span>
                  <StarRow earned={stars} size="sm" />
                </span>
                <span className={`max-w-full truncate text-xs font-semibold ${locked ? 'text-violet-300' : 'text-violet-500'}`}>
                  {locked
                    ? '🔒 Finish the previous chapter to unlock'
                    : complete ? '🏆 Completed — play again anytime!' : c.questLine}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {progress.streak > 0 && (
        <p className="text-center text-xs font-medium text-violet-400">
          🔥 Streaks are just for fun — your stars are always safe.
        </p>
      )}
    </div>
  );
}

/* ---------------------------- Explore ---------------------------- */

function GameCard({ game, onClick, tag }: { game: GameDef; onClick: () => void; tag?: string }) {
  return (
    <button
      onClick={onClick}
      className="bss-tap flex min-h-36 flex-col items-center justify-center gap-2 rounded-3xl border-2
        border-violet-100 bg-white p-4 text-center shadow-md transition-all hover:border-violet-300
        hover:shadow-xl active:scale-[0.98] focus-visible:outline-4 focus-visible:outline-amber-400"
    >
      <span className={`flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${game.color}
        text-3xl text-white shadow-md`} aria-hidden>
        {game.emoji}
      </span>
      <span className="text-sm font-black leading-tight text-violet-950">{game.title}</span>
      <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-violet-500">{game.how}</span>
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${game.mode === 'audio' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>
        {game.mode === 'audio' ? '🎧 Sound' : '👁️ Visual'}{tag ? ` · ${tag}` : ''}
      </span>
    </button>
  );
}

export function ExploreScreen() {
  const { go, mode, startGame, profile, say } = useBSS();
  const { primary, secondary } = gamesForMode(mode);

  useEffect(() => {
    if (profile?.mode === 'audio') {
      const t = setTimeout(() =>
        profile && say('Game room! Pick any game. Your mode games are listed first.'), 500);
      return () => clearTimeout(t);
    }
  }, [profile, say]);

  const open = (g: GameDef) => startGame(g.id);

  return (
    <div className="flex min-h-full flex-col gap-4 px-5 pb-8 pt-6">
      <TopBar title="Game Room" subtitle="Pick a game — every game teaches something new" />
      <ModeChip mode={mode} />

      <h2 className="px-1 text-sm font-black tracking-widest text-violet-500 uppercase">
        {mode === 'audio' ? '🎧 Listening & touch games' : '👁️ Visual & sign games'}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {primary.map((g) => <GameCard key={g.id} game={g} onClick={() => open(g)} />)}
      </div>

      <h2 className="mt-2 px-1 text-sm font-black tracking-widest text-violet-500 uppercase">
        Try the other sense {mode === 'audio' ? '(Visual games)' : '(Sound games)'}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {secondary.map((g) => <GameCard key={g.id} game={g} onClick={() => open(g)} tag="other mode" />)}
      </div>

      <p className="mt-1 text-center text-xs font-semibold text-violet-400">
        Chapter quests use your mode&apos;s games — free play is always open too.
      </p>
    </div>
  );
}

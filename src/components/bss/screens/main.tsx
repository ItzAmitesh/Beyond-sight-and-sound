'use client';

/* ============================================================
   Completion (FR-5, FR-12, FR-15 mode-consistent feedback),
   Rewards (badges/stars/points), Profile stats,
   Settings (FR-8 mode-aware), Caregiver Corner (FR-9).
   ============================================================ */

import { useEffect, useMemo, useState } from 'react';
import { useBSS } from '@/lib/bss/context';
import { ALL_BADGES, CHAPTERS, DAILY_WORD_GOAL, MASTER_EXPLORER, gameById } from '@/lib/bss/content';
import { BigButton, Card, ModeChip, Pill, StarRow, TopBar } from '../bits';
import { Kiko } from '../kiko';

/* --------------------------- Completion --------------------------- */

const CONFETTI = ['🎉', '⭐', '✨', '🌟', '💜', '🎊'];

export function CompletionScreen({ result }: { result: import('@/lib/bss/types').GameResult }) {
  const { profile, go, say, playSound, buzz, saveReaction, showToast } = useBSS();
  const game = gameById(result.gameId);
  const isAudio = profile?.mode === 'audio';

  useEffect(() => {
    playSound('fanfare');
    buzz('celebrate');
    if (isAudio) {
      const t = setTimeout(() =>
        say(`Great job! You earned ${result.pointsEarned} points.${result.starsEarned ? ` You got ${result.starsEarned} stars!` : ''}`), 500);
      return () => clearTimeout(t);
    }
  }, [isAudio, playSound, say, buzz, result.pointsEarned, result.starsEarned]);

  const nextChapter = useMemo(() => {
    if (!result.chapterId) return undefined;
    const idx = CHAPTERS.findIndex((c) => c.id === result.chapterId);
    return idx >= 0 && idx < CHAPTERS.length - 1 ? CHAPTERS[idx + 1] : undefined;
  }, [result.chapterId]);

  const perfect = result.score === result.total;

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center gap-4 overflow-hidden px-6 pb-10 pt-8 text-center">
      {/* confetti — gentle, reduced-motion aware */}
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="bss-confetti-piece pointer-events-none text-2xl"
          style={{
            left: `${5 + i * 6.7}%`,
            animationDuration: `${2.4 + (i % 5) * 0.55}s`,
            animationDelay: `${(i % 7) * 0.22}s`,
          }}
          aria-hidden
        >
          {CONFETTI[i % CONFETTI.length]}
        </span>
      ))}

      <div className="bss-pop"><Kiko size={140} mood="cheer" /></div>
      <h1 className="bss-pop text-4xl font-black text-violet-950">
        {perfect ? 'Perfect! 🌟' : 'Great Job!'}
      </h1>
      <p className="text-lg font-bold text-violet-600">
        {game.emoji} {game.title} · {result.score}/{result.total} correct
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Pill className="bg-amber-100 px-4 py-2 text-base text-amber-800 bss-pop">
          + {result.pointsEarned} points
        </Pill>
        {result.starsEarned > 0 && (
          <span className="bss-pop rounded-2xl bg-white px-4 py-2 shadow-md" style={{ animationDelay: '0.2s' }}>
            <StarRow earned={result.starsEarned} size="md" />
          </span>
        )}
      </div>

      {result.wordsLearned.length > 0 && (
        <p className="max-w-xs text-sm font-semibold text-violet-500">
          🔤 New words practised: {result.wordsLearned.slice(0, 6).map((w) => ` ${w}`).join(',')}
        </p>
      )}

      {result.newBadges.length > 0 && (
        <Card className="w-full max-w-sm border-amber-300 bg-amber-50">
          <p className="text-xs font-black tracking-widest text-amber-700 uppercase">New badge{result.newBadges.length > 1 ? 's' : ''}!</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            {result.newBadges.map((id) => {
              const b = ALL_BADGES.find((x) => x.id === id);
              if (!b) return null;
              return (
                <div key={id} className="flex flex-col items-center">
                  <span className="text-4xl" aria-hidden>{b.emoji}</span>
                  <span className="text-xs font-black text-amber-900">{b.name}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* FR-12: optional simple reaction, clear skip path */}
      <div className="mt-1">
        <p className="mb-2 text-xs font-bold tracking-wide text-violet-400 uppercase">
          How did you feel? (optional)
        </p>
        <div className="flex items-center justify-center gap-2.5">
          {['🤩', '🙂', '😐'].map((e) => (
            <button
              key={e}
              onClick={() => { saveReaction(e); showToast('Thanks for sharing!', e); }}
              aria-label={`React ${e}`}
              className="flex size-13 items-center justify-center rounded-2xl border-2 border-violet-200 bg-white
                text-2xl shadow-md transition-all hover:scale-110 hover:border-violet-400 active:scale-95
                focus-visible:outline-4 focus-visible:outline-amber-400"
            >
              {e}
            </button>
          ))}
          <button
            onClick={() => showToast('No problem!')}
            className="min-h-12 rounded-2xl border-2 border-transparent px-3 text-sm font-bold text-violet-400
              hover:bg-violet-50 focus-visible:outline-4 focus-visible:outline-amber-400"
          >
            Skip
          </button>
        </div>
      </div>

      <div className="mt-2 flex w-full max-w-sm flex-col gap-2.5">
        {nextChapter && (
          <BigButton size="lg" className="w-full"
            onClick={() => go({ name: 'story', chapterId: nextChapter.id })}>
            ➡️ Next: Chapter {nextChapter.index + 1} — {nextChapter.title}
          </BigButton>
        )}
        <div className="flex gap-2.5">
          <BigButton variant="secondary" className="flex-1" onClick={() => go({ name: 'home' })}>
            🏠 Home
          </BigButton>
          <BigButton variant="secondary" className="flex-1" onClick={() => go({ name: 'rewards' })}>
            🏅 Rewards
          </BigButton>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Rewards ----------------------------- */

export function RewardsScreen() {
  const { profile, go, say } = useBSS();
  if (!profile) return null;
  const { progress } = profile;
  const totalStars = Object.values(progress.stars).reduce((a, s) => a + s, 0);

  return (
    <div className="flex min-h-full flex-col gap-4 px-5 pb-8 pt-6">
      <TopBar title="My Rewards" subtitle="Everything you earned — keep exploring!" />

      <div className="grid grid-cols-3 gap-3">
        <Card className="flex flex-col items-center gap-0.5 p-3">
          <span className="text-2xl" aria-hidden>⭐</span>
          <span className="text-xl font-black text-violet-950">{progress.points}</span>
          <span className="text-[10px] font-bold tracking-wide text-violet-400 uppercase">Points</span>
        </Card>
        <Card className="flex flex-col items-center gap-0.5 p-3">
          <span className="text-2xl" aria-hidden>🌟</span>
          <span className="text-xl font-black text-violet-950">{totalStars}/9</span>
          <span className="text-[10px] font-bold tracking-wide text-violet-400 uppercase">Stars</span>
        </Card>
        <Card className="flex flex-col items-center gap-0.5 p-3">
          <span className="text-2xl" aria-hidden>🔤</span>
          <span className="text-xl font-black text-violet-950">{progress.wordsLearned}</span>
          <span className="text-[10px] font-bold tracking-wide text-violet-400 uppercase">Words</span>
        </Card>
      </div>

      {/* chapter stars */}
      <Card>
        <p className="mb-2 text-sm font-black tracking-widest text-violet-500 uppercase">Chapter stars</p>
        <div className="flex flex-col gap-2">
          {CHAPTERS.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className="text-xl" aria-hidden>{c.emoji}</span>
                <span className="truncate text-sm font-bold text-violet-900">{c.title}</span>
              </span>
              <StarRow earned={progress.stars[c.id] ?? 0} size="sm" />
            </div>
          ))}
        </div>
      </Card>

      {/* badges */}
      <Card>
        <p className="mb-3 text-sm font-black tracking-widest text-violet-500 uppercase">Badge collection</p>
        <div className="grid grid-cols-3 gap-3">
          {ALL_BADGES.map((b) => {
            const earned = progress.badges.includes(b.id);
            const isMaster = b.id === MASTER_EXPLORER.id;
            return (
              <div
                key={b.id}
                className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center transition-all
                  ${earned ? 'border-amber-300 bg-amber-50 shadow-md' : 'border-violet-100 bg-violet-50/60 opacity-55 grayscale'}`}
                aria-label={`${b.name}: ${earned ? 'earned' : 'not earned yet'}`}
              >
                <span className="text-3xl" aria-hidden>{earned ? b.emoji : '❔'}</span>
                <span className={`text-[11px] font-black leading-tight ${isMaster ? 'text-amber-700' : 'text-violet-800'}`}>
                  {b.name}
                </span>
                <span className="text-[9px] font-semibold leading-tight text-violet-400">
                  {earned ? b.note : isMaster ? 'Finish every chapter' : 'Play the game'}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <p className="text-center text-xs font-semibold text-violet-400">
        🎁 Rewards celebrate effort — no pressure, no leaderboards. (SRS 12.1)
      </p>
    </div>
  );
}

/* ----------------------------- Profile ----------------------------- */

export function ProfileScreen() {
  const { profile, go, setMode, say } = useBSS();
  if (!profile) return null;
  const { progress } = profile;
  const questsDone = CHAPTERS.filter((c) => (progress.stars[c.id] ?? 0) > 0).length;

  return (
    <div className="flex min-h-full flex-col gap-4 px-5 pb-8 pt-6">
      <TopBar
        title={profile.name}
        subtitle="Your explorer profile"
        right={
          <button
            onClick={() => go({ name: 'settings' })}
            aria-label="Settings"
            className="flex size-12 items-center justify-center rounded-2xl border-2 border-violet-200 bg-white
              text-xl shadow-md hover:bg-violet-50 active:scale-95 focus-visible:outline-4 focus-visible:outline-amber-400"
          >
            ⚙️
          </button>
        }
      />

      <BigButton variant="secondary" className="w-full" onClick={() => go({ name: 'profilePicker' })}>
        👥 Switch or add child
      </BigButton>

      <Card className="flex flex-col items-center gap-2 py-6">
        <span className="flex size-24 items-center justify-center rounded-full bg-violet-100 text-6xl shadow-inner" aria-hidden>
          {profile.avatar}
        </span>
        <h2 className="text-2xl font-black text-violet-950">{profile.name}</h2>
        <ModeChip mode={profile.mode} />
        <div className="mt-1 flex gap-2">
          {(['visual', 'audio'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                if (m !== profile.mode) {
                  setMode(m);
                  say(m === 'audio' ? 'Switched to audio tactile mode.' : 'Switched to visual sign mode.');
                }
              }}
              disabled={m === profile.mode}
              className={`min-h-10 rounded-full border-2 px-3 text-xs font-black transition-all
                focus-visible:outline-4 focus-visible:outline-amber-400
                ${m === profile.mode ? 'cursor-default border-transparent bg-violet-100 text-violet-400'
                  : 'border-violet-300 bg-white text-violet-600 hover:bg-violet-50 active:scale-95'}`}
            >
              switch to {m === 'visual' ? '👁️ visual' : '🎧 audio'}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="flex items-center gap-3 p-4">
          <span className="text-3xl" aria-hidden>🎮</span>
          <div>
            <p className="text-2xl font-black leading-none text-violet-950">{progress.gamesPlayed}</p>
            <p className="text-xs font-bold text-violet-400">games played</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="text-3xl" aria-hidden>🗺️</span>
          <div>
            <p className="text-2xl font-black leading-none text-violet-950">{questsDone}/3</p>
            <p className="text-xs font-bold text-violet-400">quests done</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="text-3xl" aria-hidden>🔤</span>
          <div>
            <p className="text-2xl font-black leading-none text-violet-950">{progress.wordsLearned}</p>
            <p className="text-xs font-bold text-violet-400">words learned</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="text-3xl" aria-hidden>🔥</span>
          <div>
            <p className="text-2xl font-black leading-none text-violet-950">{progress.streak}</p>
            <p className="text-xs font-bold text-violet-400">day streak</p>
          </div>
        </Card>
      </div>

      <Card className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden>🎯</span>
          <div>
            <p className="font-black text-violet-950">Daily goal</p>
            <p className="text-xs font-semibold text-violet-400">Learn {DAILY_WORD_GOAL} words every day</p>
          </div>
        </div>
        <Pill className="bg-violet-100 text-violet-700">
          {progress.dailyWords.date === new Date().toISOString().slice(0, 10) ? progress.dailyWords.count : 0}/{DAILY_WORD_GOAL}
        </Pill>
      </Card>
    </div>
  );
}

/* ----------------------------- Settings ----------------------------- */

function SegRow<T extends string>({
  label, icon, value, options, onChange, hint,
}: {
  label: string; icon: string; value: T;
  options: Array<{ v: T; label: string }>;
  onChange: (v: T) => void; hint?: string;
}) {
  return (
    <div className="py-1">
      <div className="mb-1.5 flex items-center gap-2">
        <span aria-hidden>{icon}</span>
        <p className="text-sm font-black text-violet-950">{label}</p>
      </div>
      <div className="flex gap-2" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            aria-pressed={value === o.v}
            className={`min-h-11 flex-1 rounded-xl border-2 text-xs font-black transition-all
              focus-visible:outline-4 focus-visible:outline-amber-400 active:scale-95
              ${value === o.v ? 'border-violet-600 bg-violet-600 text-white shadow-md'
                : 'border-violet-200 bg-white text-violet-600 hover:bg-violet-50'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {hint && <p className="mt-1 text-[11px] font-semibold text-violet-400">{hint}</p>}
    </div>
  );
}

function ToggleRow({
  label, icon, checked, onChange, hint,
}: { label: string; icon: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-2">
        <span aria-hidden>{icon}</span>
        <div>
          <p className="text-sm font-black text-violet-950">{label}</p>
          {hint && <p className="text-[11px] font-semibold text-violet-400">{hint}</p>}
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-all
          focus-visible:outline-4 focus-visible:outline-amber-400
          ${checked ? 'border-violet-700 bg-violet-600' : 'border-violet-200 bg-violet-100'}`}
      >
        <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-all
          ${checked ? 'left-[calc(100%-1.75rem)]' : 'left-0.5'}`} aria-hidden />
      </button>
    </div>
  );
}

export function SettingsScreen() {
  const {
    profile, back, prefs, updatePrefs, mode, setMode, go, resetEverything, playSound, buzz, say, profiles,
  } = useBSS();
  const [gateOpen, setGateOpen] = useState(false);
  const [gateA, setGateA] = useState(0);
  const [gateB, setGateB] = useState(0);
  const [gateAns, setGateAns] = useState('');

  if (!profile || !prefs) return null;
  const isAudio = mode === 'audio';
  const hapticSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const openCaregiver = () => {
    const a = 10 + Math.floor(Math.random() * 20);
    const b = 5 + Math.floor(Math.random() * 20);
    setGateA(a); setGateB(b); setGateAns(''); setGateOpen(true);
  };

  return (
    <div className="flex min-h-full flex-col gap-4 px-5 pb-8 pt-6">
      <TopBar title="Settings" subtitle="Make the app feel just right" onBack={back} />

      {/* mode-specific accessibility section (PPTX page 15) */}
      {isAudio ? (
        <Card>
          <p className="mb-1 text-xs font-black tracking-widest text-amber-600 uppercase">🎧 Audio-Tactile settings</p>
          {!speechSupported && (
            <p className="mb-2 rounded-xl bg-amber-50 p-2 text-xs font-bold text-amber-700">
              ⚠️ Spoken narration is not supported on this device. All instructions stay visible as text.
            </p>
          )}
          <SegRow
            label="Narration speed" icon="🗣️" value={String(prefs.narrationSpeed)}
            options={[
              { v: '0.75', label: 'Slow' }, { v: '0.95', label: 'Normal' }, { v: '1.2', label: 'Fast' },
            ]}
            onChange={(v) => {
              updatePrefs({ narrationSpeed: Number(v) });
              say('This is how I will talk. Is this speed good for you?');
            }}
          />
          <ToggleRow
            label="Repeat instructions" icon="🔁" checked={prefs.autoRepeat}
            onChange={(v) => updatePrefs({ autoRepeat: v })}
            hint="Kiko repeats instructions automatically"
          />
          <SegRow
            label="Vibration strength" icon="📳" value={prefs.hapticStrength}
            options={[
              { v: 'off', label: 'Off' }, { v: 'low', label: 'Gentle' }, { v: 'strong', label: 'Strong' },
            ]}
            onChange={(v) => { updatePrefs({ hapticStrength: v }); if (v !== 'off') setTimeout(() => buzz('pattern'), 150); }}
            hint={!hapticSupported ? '⚠️ Vibration is not available on this device — visual cues are always shown too.' : undefined}
          />
          <SegRow
            label="Volume" icon="🔊" value={String(prefs.volume)}
            options={[
              { v: '0.4', label: 'Quiet' }, { v: '0.8', label: 'Normal' }, { v: '1', label: 'Loud' },
            ]}
            onChange={(v) => { updatePrefs({ volume: Number(v) }); playSound('bell'); }}
          />
        </Card>
      ) : (
        <Card>
          <p className="mb-1 text-xs font-black tracking-widest text-sky-600 uppercase">👋 Visual / Sign settings</p>
          <ToggleRow
            label="High contrast" icon="🌗" checked={prefs.highContrast}
            onChange={(v) => updatePrefs({ highContrast: v })}
            hint="Black background, yellow borders, maximum clarity"
          />
          <SegRow
            label="Text size" icon="🔠" value={prefs.textScale}
            options={[
              { v: 'normal', label: 'Normal' }, { v: 'large', label: 'Big' }, { v: 'xl', label: 'Biggest' },
            ]}
            onChange={(v) => updatePrefs({ textScale: v })}
          />
          <SegRow
            label="Animation speed" icon="🎬" value={prefs.animationSpeed}
            options={[
              { v: 'normal', label: 'Playful' }, { v: 'reduced', label: 'Calm' },
            ]}
            onChange={(v) => updatePrefs({ animationSpeed: v })}
            hint="Calm mode reduces movement for sensory comfort"
          />
          <ToggleRow
            label="Vibration feedback" icon="📳" checked={prefs.hapticStrength !== 'off'}
            onChange={(v) => { updatePrefs({ hapticStrength: v ? 'low' : 'off' }); if (v) setTimeout(() => buzz('tap'), 150); }}
            hint={!hapticSupported ? '⚠️ Not available on this device — visual cues are always shown.' : undefined}
          />
        </Card>
      )}

      {/* common settings */}
      <Card>
        <p className="mb-1 text-xs font-black tracking-widest text-violet-500 uppercase">🧩 General</p>
        <SegRow
          label="Language" icon="🌍" value={prefs.language}
          options={[{ v: 'en', label: 'English' }, { v: 'hi', label: 'हिन्दी' }]}
          onChange={(v) => { updatePrefs({ language: v }); say(v === 'hi' ? 'भाषा बदली गई' : 'Language changed'); }}
        />
        <div className="py-1">
          <p className="mb-1.5 text-sm font-black text-violet-950">🎨 Sensory mode</p>
          <div className="flex gap-2">
            <button
              onClick={() => { if (isAudio) { setMode('visual'); } }}
              aria-pressed={mode === 'visual'}
              className={`min-h-12 flex-1 rounded-xl border-2 text-xs font-black transition-all active:scale-95
                focus-visible:outline-4 focus-visible:outline-amber-400
                ${mode === 'visual' ? 'border-sky-600 bg-sky-500 text-white shadow-md' : 'border-violet-200 bg-white text-violet-600 hover:bg-violet-50'}`}
            >
              👁️ Visual / Sign
            </button>
            <button
              onClick={() => { if (isAudio) { setMode('audio'); say('Audio tactile mode on.'); } }}
              aria-pressed={mode === 'audio'}
              className={`min-h-12 flex-1 rounded-xl border-2 text-xs font-black transition-all active:scale-95
                focus-visible:outline-4 focus-visible:outline-amber-400
                ${mode === 'audio' ? 'border-amber-600 bg-amber-500 text-white shadow-md' : 'border-violet-200 bg-white text-violet-600 hover:bg-violet-50'}`}
            >
              🎧 Audio-Tactile
            </button>
          </div>
          <p className="mt-1 text-[11px] font-semibold text-violet-400">
            Both modes share the same quests and rewards (SRS NFR-3).
          </p>
        </div>
      </Card>

      <Card>
        <p className="mb-2 text-xs font-black tracking-widest text-violet-500 uppercase">🧑‍👩‍👧 Grown-ups</p>
        <div className="flex flex-col gap-2">
          <BigButton variant="secondary" className="w-full" onClick={openCaregiver}>
            👨‍👩‍👧 Caregiver Corner ({profiles.length} profile{profiles.length > 1 ? 's' : ''})
          </BigButton>
          <button
            onClick={() => {
              if (window.confirm('Erase ALL profiles and progress from this device? This cannot be undone.')) {
                resetEverything();
              }
            }}
            className="min-h-11 rounded-xl border-2 border-rose-200 bg-white text-sm font-black text-rose-500
              hover:bg-rose-50 active:scale-95 focus-visible:outline-4 focus-visible:outline-amber-400"
          >
            🗑 Reset all data
          </button>
        </div>
      </Card>

      <p className="text-center text-xs font-semibold text-violet-400">
        🔒 Private by design: everything stays on this device. No ads, no purchases. (SRS §13)
      </p>

      {/* caregiver math gate */}
      {gateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-violet-950/60 p-6"
          role="dialog" aria-modal="true" aria-label="Grown-up check">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl bss-pop">
            <h2 className="text-xl font-black text-violet-950">Grown-ups only 🔐</h2>
            <p className="mt-1 text-sm font-semibold text-violet-500">What is {gateA} + {gateB}?</p>
            <input
              inputMode="numeric"
              value={gateAns}
              onChange={(e) => setGateAns(e.target.value)}
              className="mt-3 min-h-13 w-full rounded-2xl border-[3px] border-violet-200 px-4 text-center
                text-xl font-black text-violet-950 focus:border-violet-500 focus:outline-4 focus:outline-amber-300"
              aria-label="Your answer"
            />
            <div className="mt-4 flex gap-2.5">
              <button
                onClick={() => setGateOpen(false)}
                className="min-h-12 flex-1 rounded-2xl border-2 border-violet-200 font-bold text-violet-600
                  hover:bg-violet-50 active:scale-95 focus-visible:outline-4 focus-visible:outline-amber-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (Number(gateAns) === gateA + gateB) { setGateOpen(false); go({ name: 'caregiver' }); }
                  else { setGateAns(''); setGateA(10 + Math.floor(Math.random() * 20)); setGateB(5 + Math.floor(Math.random() * 20)); }
                }}
                className="min-h-12 flex-1 rounded-2xl border-2 border-violet-700 bg-violet-600 font-bold text-white
                  shadow-lg hover:bg-violet-700 active:scale-95 focus-visible:outline-4 focus-visible:outline-amber-400"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------- Caregiver Corner ------------------------- */

export function CaregiverScreen() {
  const { profiles, back } = useBSS();

  const fmtTime = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    return `${Math.round(sec / 60)} min`;
  };
  const fmtDate = (iso: string) => {
    if (!iso) return 'Never';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex min-h-full flex-col gap-4 px-5 pb-8 pt-6">
      <TopBar title="Caregiver Corner" subtitle="Read-only progress summary (FR-9)" onBack={back} />

      <Card className="border-amber-200 bg-amber-50">
        <p className="text-xs font-bold leading-relaxed text-amber-800">
          🔒 Privacy note: all data is stored locally on this device. Profiles use nicknames only —
          no names, photos, locations or contacts are collected (SRS §13). Clear any profile any
          time from its trash button or “Reset all data”.
        </p>
      </Card>

      {profiles.length === 0 && (
        <Card className="py-8 text-center">
          <p className="font-bold text-violet-500">No profiles yet.</p>
        </Card>
      )}

      {profiles.map((p) => {
        const stars = Object.values(p.progress.stars).reduce((a, s) => a + s, 0);
        const questsDone = CHAPTERS.filter((c) => (p.progress.stars[c.id] ?? 0) > 0).length;
        const reaction = p.lastReaction;
        return (
          <Card key={p.id}>
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-violet-100 text-2xl" aria-hidden>
                {p.avatar}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-black text-violet-950">{p.name}</p>
                <ModeChip mode={p.mode} />
              </div>
              {reaction && (
                <span className="flex flex-col items-center" title="Last reaction after a quest (FR-12)">
                  <span className="text-2xl" aria-hidden>{reaction}</span>
                  <span className="text-[9px] font-bold text-violet-400">felt</span>
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              <div className="rounded-xl bg-violet-50 py-2">
                <p className="text-base font-black text-violet-900">{p.progress.points}</p>
                <p className="text-[9px] font-bold text-violet-400 uppercase">points</p>
              </div>
              <div className="rounded-xl bg-violet-50 py-2">
                <p className="text-base font-black text-violet-900">{stars}/9</p>
                <p className="text-[9px] font-bold text-violet-400 uppercase">stars</p>
              </div>
              <div className="rounded-xl bg-violet-50 py-2">
                <p className="text-base font-black text-violet-900">{questsDone}/3</p>
                <p className="text-[9px] font-bold text-violet-400 uppercase">quests</p>
              </div>
              <div className="rounded-xl bg-violet-50 py-2">
                <p className="text-base font-black text-violet-900">{p.progress.wordsLearned}</p>
                <p className="text-[9px] font-bold text-violet-400 uppercase">words</p>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <Pill className="bg-orange-100 text-orange-700">🔥 {p.progress.streak}-day streak</Pill>
              <Pill className="bg-violet-100 text-violet-700">🎮 {p.progress.gamesPlayed} games</Pill>
              <Pill className="bg-violet-100 text-violet-700">⏱ {fmtTime(p.progress.timeSpent)} played</Pill>
              <Pill className="bg-violet-100 text-violet-700">📅 last: {fmtDate(p.progress.lastPlayedDate)}</Pill>
            </div>
          </Card>
        );
      })}

      <p className="text-center text-xs font-semibold text-violet-400">
        Time & activity are indicative for this proof-of-concept.
      </p>
    </div>
  );
}

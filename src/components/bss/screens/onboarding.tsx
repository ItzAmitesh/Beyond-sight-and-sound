'use client';

/* ============================================================
   Onboarding flow (SRS 7.1 IA):
   Welcome → Profile name → Sensory Mode → Language → Calibration
   Caregiver-supported setup per SRS section 4.
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import { useBSS } from '@/lib/bss/context';
import { AVATARS } from '@/lib/bss/content';
import { BigButton, Card } from '../bits';
import { Kiko, KikoSays } from '../kiko';

/* ---------------------------- Welcome ---------------------------- */

export function WelcomeScreen() {
  const { go, say, buzz, profile } = useBSS();
  // welcome narration only in audio mode; spoken after the first tap on Get Started
  const [leaving, setLeaving] = useState(false);

  const start = () => {
    buzz('tap');
    if (!profile || profile.mode === 'audio') say("Hello! Welcome to Beyond Sight and Sound. Let's begin!");
    setLeaving(true);
    setTimeout(() => go({ name: profile ? 'profilePicker' : 'setupName' }), 350);
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-between px-6 pb-10 pt-14 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="bss-float"><Kiko size={150} mood="cheer" /></div>
        <div className="bss-pop">
          <h1 className="text-3xl font-black leading-tight tracking-tight text-violet-950">
            Beyond Sight
            <br />& Sound
          </h1>
        </div>
        <p className="text-lg font-bold text-violet-600">Different senses. Same adventures.</p>
        <p className="text-sm font-semibold tracking-widest text-violet-400 uppercase">Play · Learn · Grow</p>
      </div>

      <Card className="w-full">
        <KikoSays
          text="Hi! I'm Kiko the Firefly. I will be your guide on every quest. Choose how you love to play — with signs and pictures, or sounds and touch!"
        />
      </Card>

      <div className="flex w-full flex-col gap-3">
        <BigButton size="lg" className="w-full" onClick={start}>
          🚀 Get Started
        </BigButton>
        {profile && (
          <BigButton variant="secondary" className="w-full" onClick={() => go({ name: 'setupName' })}>
            ➕ Add another child
          </BigButton>
        )}
        <p className="text-center text-xs font-medium text-violet-400">
          {leaving ? 'Loading your adventure…' : 'A caregiver can help with setup.'}
        </p>
      </div>
    </div>
  );
}

/* ---------------------------- Name ---------------------------- */

export function SetupNameScreen() {
  const { go, createProfile, say } = useBSS();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);

  useEffect(() => {
    const t = setTimeout(() => say('Who is playing today? Type a nickname. You can pick a picture too.'), 400);
    return () => clearTimeout(t);
  }, [say]);

  const submit = () => {
    const id = createProfile(name, avatar);
    go({ name: 'setupMode', draftId: id });
  };

  return (
    <div className="flex min-h-full flex-col gap-5 px-6 pb-10 pt-10">
      <div className="text-center">
        <Kiko size={90} mood="happy" />
        <h1 className="mt-2 text-2xl font-black text-violet-950">Who is playing?</h1>
        <p className="text-sm font-semibold text-violet-500">A nickname is enough — no personal details needed.</p>
      </div>

      <div>
        <label htmlFor="bss-name" className="mb-2 block text-sm font-bold text-violet-800">
          Nickname
        </label>
        <input
          id="bss-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alex"
          maxLength={14}
          className="min-h-14 w-full rounded-2xl border-[3px] border-violet-200 bg-white px-4 text-lg font-bold
            text-violet-950 placeholder:text-violet-300 focus:border-violet-500 focus:outline-4 focus:outline-amber-300"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-violet-800">Pick your buddy</p>
        <div className="grid grid-cols-4 gap-2.5">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => setAvatar(a)}
              aria-label={`Choose avatar ${a}`}
              aria-pressed={avatar === a}
              className={`flex min-h-16 items-center justify-center rounded-2xl border-[3px] text-3xl transition-all
                active:scale-95 focus-visible:outline-4 focus-visible:outline-amber-400
                ${avatar === a ? 'border-violet-600 bg-violet-100 ring-4 ring-violet-200' : 'border-violet-200 bg-white hover:bg-violet-50'}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto">
        <BigButton size="lg" className="w-full" disabled={!name.trim()} onClick={submit}>
          Next: Choose how to play →
        </BigButton>
      </div>
    </div>
  );
}

/* ---------------------------- Mode ---------------------------- */

export function SetupModeScreen({ draftId }: { draftId: string }) {
  const { go, updatePrefs, say, setMode, playSound, buzz } = useBSS();

  useEffect(() => {
    const t = setTimeout(() => say('Choose how you want to play. You can change this later.'), 400);
    return () => clearTimeout(t);
  }, [say]);

  const choose = (mode: 'visual' | 'audio') => {
    setMode(mode);
    if (mode === 'audio') {
      playSound('sparkle');
      say('Audio tactile mode. You will hear sounds and feel vibrations. Great choice!');
    } else {
      buzz('pattern');
    }
    setTimeout(() => go({ name: 'setupLanguage', draftId }), 600);
  };

  return (
    <div className="flex min-h-full flex-col gap-5 px-6 pb-10 pt-10">
      <div className="text-center">
        <h1 className="text-2xl font-black text-violet-950">How do you like to play?</h1>
        <p className="mt-1 text-sm font-semibold text-violet-500">
          Two ways to enjoy the same adventure. You can switch anytime.
        </p>
      </div>

      <button
        onClick={() => choose('visual')}
        className="bss-tap group flex flex-col items-center gap-2 rounded-3xl border-[3px] border-sky-200
          bg-gradient-to-b from-sky-50 to-white p-6 text-center shadow-md transition-all hover:border-sky-400
          hover:shadow-xl active:scale-[0.98] focus-visible:outline-4 focus-visible:outline-amber-400"
      >
        <span className="text-6xl" aria-hidden>👋</span>
        <span className="text-xl font-black text-sky-900">Visual / Sign Mode</span>
        <span className="text-sm font-semibold text-sky-700">
          Pictures, animations and Indian Sign Language. No sound needed.
        </span>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">
          👁️ Everything is visual
        </span>
      </button>

      <button
        onClick={() => choose('audio')}
        className="bss-tap group flex flex-col items-center gap-2 rounded-3xl border-[3px] border-amber-200
          bg-gradient-to-b from-amber-50 to-white p-6 text-center shadow-md transition-all hover:border-amber-400
          hover:shadow-xl active:scale-[0.98] focus-visible:outline-4 focus-visible:outline-amber-400"
      >
        <span className="text-6xl" aria-hidden>🎧</span>
        <span className="text-xl font-black text-amber-900">Audio-Tactile Mode</span>
        <span className="text-sm font-semibold text-amber-700">
          Sounds, spoken voice and vibrations. No looking needed.
        </span>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
          👂 Everything is heard & felt
        </span>
      </button>

      <p className="mt-auto text-center text-xs font-semibold text-violet-400">
        🛡️ Kiko never uses scary sounds or flashing lights.
      </p>
    </div>
  );
}

/* ---------------------------- Language ---------------------------- */

export function SetupLanguageScreen({ draftId }: { draftId: string }) {
  const { go, updatePrefs, say } = useBSS();

  useEffect(() => {
    const t = setTimeout(() => say('Choose your language.'), 300);
    return () => clearTimeout(t);
  }, [say]);

  const choose = (lang: 'en' | 'hi') => {
    updatePrefs({ language: lang });
    say(lang === 'hi' ? 'आपकी भाषा चुनी गई।' : 'English selected.');
    setTimeout(() => go({ name: 'setupCalibration', draftId }), 500);
  };

  return (
    <div className="flex min-h-full flex-col gap-5 px-6 pb-10 pt-14">
      <div className="text-center">
        <span className="text-5xl" aria-hidden>🌍</span>
        <h1 className="mt-2 text-2xl font-black text-violet-950">Choose your language</h1>
        <p className="text-sm font-semibold text-violet-500">Select the language for voice and text.</p>
      </div>
      <button
        onClick={() => choose('en')}
        className="bss-tap flex min-h-24 items-center gap-4 rounded-3xl border-[3px] border-violet-200 bg-white
          p-5 shadow-md transition-all hover:border-violet-400 hover:shadow-lg active:scale-[0.98]
          focus-visible:outline-4 focus-visible:outline-amber-400"
      >
        <span className="text-4xl" aria-hidden>🔤</span>
        <span className="text-left">
          <span className="block text-lg font-black text-violet-950">English</span>
          <span className="block text-sm font-semibold text-violet-500">Voice, words and stories in English</span>
        </span>
      </button>
      <button
        onClick={() => choose('hi')}
        className="bss-tap flex min-h-24 items-center gap-4 rounded-3xl border-[3px] border-violet-200 bg-white
          p-5 shadow-md transition-all hover:border-violet-400 hover:shadow-lg active:scale-[0.98]
          focus-visible:outline-4 focus-visible:outline-amber-400"
      >
        <span className="text-4xl" aria-hidden>🪔</span>
        <span className="text-left">
          <span className="block text-lg font-black text-violet-950">हिन्दी (Hindi)</span>
          <span className="block text-sm font-semibold text-violet-500">आवाज़ और कहानियाँ हिन्दी में</span>
        </span>
      </button>
    </div>
  );
}

/* ---------------------------- Calibration ---------------------------- */

export function SetupCalibrationScreen({ draftId }: { draftId: string }) {
  const { go, profile, say, playSound, buzz, selectProfile } = useBSS();
  const [testedSound, setTestedSound] = useState(false);
  const [testedHaptic, setTestedHaptic] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() =>
      say('Let us try things out. Press the buttons to test sound and vibration.'), 400);
    return () => clearTimeout(t);
  }, [say]);

  const hapticSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (draftId) selectProfile(draftId);
    playSound('fanfare');
    buzz('celebrate');
  };

  return (
    <div className="flex min-h-full flex-col gap-4 px-6 pb-10 pt-10">
      <div className="text-center">
        <Kiko size={80} mood="cheer" />
        <h1 className="mt-1 text-2xl font-black text-violet-950">Make it feel right</h1>
        <p className="text-sm font-semibold text-violet-500">
          Try each one. You can change these later in Settings.
        </p>
      </div>

      <Card className="flex items-center gap-4">
        <button
          onClick={() => { playSound('bird'); say('This is a bird sound.'); setTestedSound(true); }}
          className={`flex size-20 shrink-0 items-center justify-center rounded-2xl border-[3px] text-4xl shadow-md
            transition-all active:scale-95 focus-visible:outline-4 focus-visible:outline-amber-400
            ${testedSound ? 'border-emerald-400 bg-emerald-50' : 'border-violet-200 bg-white hover:bg-violet-50'}`}
          aria-label="Test the sound"
        >
          🔊
        </button>
        <div className="min-w-0">
          <p className="font-black text-violet-950">Sound & voice test</p>
          <p className="text-sm font-semibold text-violet-500">
            {testedSound ? '✅ Sounds are working!' : 'Tap to hear Kiko chirp'}
          </p>
        </div>
      </Card>

      <Card className="flex items-center gap-4">
        <button
          onClick={() => { buzz('pattern'); setTestedHaptic(true); }}
          className={`flex size-20 shrink-0 items-center justify-center rounded-2xl border-[3px] text-4xl shadow-md
            transition-all active:scale-95 focus-visible:outline-4 focus-visible:outline-amber-400
            ${testedHaptic ? 'border-emerald-400 bg-emerald-50' : 'border-violet-200 bg-white hover:bg-violet-50'}`}
          aria-label="Test the vibration"
        >
          📳
        </button>
        <div className="min-w-0">
          <p className="font-black text-violet-950">Vibration test</p>
          <p className="text-sm font-semibold text-violet-500">
            {!hapticSupported
              ? '⚠️ Not available on this device — visual cues will be used instead.'
              : testedHaptic ? '✅ Vibrations are working!' : 'Tap to feel a gentle pattern'}
          </p>
        </div>
      </Card>

      <Card>
        <p className="font-black text-violet-950">Text size & contrast</p>
        <p className="text-sm font-semibold text-violet-500">
          Find them later in <b>Settings → Accessibility</b>. Everything in this app can grow bigger
          and clearer.
        </p>
      </Card>

      <div className="mt-auto">
        <BigButton size="lg" className="w-full" onClick={finish}>
          ✅ Looks good — Start playing!
        </BigButton>
      </div>
    </div>
  );
}

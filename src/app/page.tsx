'use client';

/* ============================================================
   Beyond Sight & Sound — App Shell
   Mobile-first proof-of-concept (SRS §16): one route, app-like
   screen state machine, phone frame on desktop, Local Storage
   persistence. Bottom nav: Home • Play • Rewards • Profile.
   ============================================================ */

import { BSSProvider, useBSS } from '@/lib/bss/context';
import type { Screen } from '@/lib/bss/context';
import { Kiko } from '@/components/bss/kiko';
import { WelcomeScreen, SetupNameScreen, SetupModeScreen, SetupLanguageScreen, SetupCalibrationScreen } from '@/components/bss/screens/onboarding';
import { ProfilePickerScreen, HomeScreen, ExploreScreen } from '@/components/bss/screens/home';
import { StoryScreen } from '@/components/bss/screens/story';
import { GameHost } from '@/components/bss/screens/games/shared';
import { CompletionScreen, RewardsScreen, ProfileScreen, SettingsScreen, CaregiverScreen } from '@/components/bss/screens/main';

/* --------------------------- splash --------------------------- */

function Splash() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="bss-float"><Kiko size={120} glow /></div>
      <p className="text-lg font-black tracking-tight text-violet-950">Beyond Sight &amp; Sound</p>
      <p className="text-xs font-bold tracking-widest text-violet-400 uppercase">Loading your adventure…</p>
    </div>
  );
}

/* --------------------------- router --------------------------- */

function ScreenRouter() {
  const { screen } = useBSS();
  const s = screen as Screen;
  switch (s.name) {
    case 'welcome': return <WelcomeScreen />;
    case 'profilePicker': return <ProfilePickerScreen />;
    case 'setupName': return <SetupNameScreen />;
    case 'setupMode': return <SetupModeScreen draftId={s.draftId} />;
    case 'setupLanguage': return <SetupLanguageScreen draftId={s.draftId} />;
    case 'setupCalibration': return <SetupCalibrationScreen draftId={s.draftId} />;
    case 'home': return <HomeScreen />;
    case 'explore': return <ExploreScreen />;
    case 'story': return <StoryScreen chapterId={s.chapterId} />;
    case 'game': return <GameHost gameId={s.gameId} chapterId={s.chapterId} />;
    case 'complete': return <CompletionScreen result={s.result} />;
    case 'rewards': return <RewardsScreen />;
    case 'profile': return <ProfileScreen />;
    case 'settings': return <SettingsScreen />;
    case 'caregiver': return <CaregiverScreen />;
    default: return <HomeScreen />;
  }
}

/* ------------------------- bottom nav ------------------------- */

const NAV: Array<{ key: Screen['name']; icon: string; label: string }> = [
  { key: 'home', icon: '🏠', label: 'Home' },
  { key: 'explore', icon: '🎮', label: 'Play' },
  { key: 'rewards', icon: '🏅', label: 'Rewards' },
  { key: 'profile', icon: '👤', label: 'Profile' },
];

function BottomNav() {
  const { screen, go, playSound, buzz, say } = useBSS();
  const showOn: Screen['name'][] = ['home', 'explore', 'rewards', 'profile'];
  if (!showOn.includes(screen.name)) return null;

  return (
    <nav
      aria-label="Main navigation"
      className="relative z-20 flex items-stretch gap-1 border-t-2 border-violet-100 bg-white/95 px-2 py-1.5 shadow-[0_-6px_20px_rgba(124,58,237,0.08)] backdrop-blur"
    >
      {NAV.map((n) => {
        const active = screen.name === n.key;
        return (
          <button
            key={n.key}
            onClick={() => {
              if (!active) { playSound('tap'); buzz('tap'); if (n.key === 'home') say('Home'); }
              go({ name: n.key } as Screen);
            }}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl
              transition-all active:scale-95 focus-visible:outline-4 focus-visible:outline-amber-400
              ${active ? 'bg-violet-100 text-violet-700' : 'text-violet-400 hover:text-violet-600'}`}
          >
            <span className={`text-2xl leading-none ${active ? 'bss-pop' : ''}`} aria-hidden>{n.icon}</span>
            <span className="text-[10px] font-black tracking-wide uppercase">{n.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* --------------------------- toast --------------------------- */

function FlashToast() {
  const { flash } = useBSS();
  if (!flash) return null;
  return (
    <div key={flash.id} className="pointer-events-none absolute left-1/2 top-4 z-50 -translate-x-1/2"
      role="status" aria-live="polite">
      <div className="bss-pop flex items-center gap-2 rounded-full border-2 border-violet-200 bg-white/95
        px-4 py-2 shadow-xl backdrop-blur">
        {flash.emoji && <span className="text-xl" aria-hidden>{flash.emoji}</span>}
        <span className="text-sm font-black text-violet-900">{flash.text}</span>
      </div>
    </div>
  );
}

/* ---------------------------- shell ---------------------------- */

function Shell() {
  const { boot, screen } = useBSS();
  const screenKey = screen.name === 'game'
    ? `game-${screen.gameId}`
    : screen.name === 'story' ? `story-${screen.chapterId}` : screen.name;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-violet-950 sm:p-6">
      {/* phone frame — full-bleed on mobile, framed device on desktop */}
      <div
        className="bss-app-bg relative flex h-dvh w-full max-w-[430px] flex-col overflow-hidden
          sm:h-[min(900px,94dvh)] sm:rounded-[2.4rem] sm:border-8 sm:border-violet-950 sm:shadow-2xl"
        role="application"
        aria-label="Beyond Sight and Sound app"
      >
        {boot === 'loading' ? (
          <Splash />
        ) : (
          <>
            <main key={screenKey} className="bss-scroll flex-1 overflow-y-auto animate-in fade-in duration-300">
              <ScreenRouter />
            </main>
            <BottomNav />
          </>
        )}
        <FlashToast />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <BSSProvider>
      <Shell />
    </BSSProvider>
  );
}

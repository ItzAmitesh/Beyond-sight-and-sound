'use client';

/* ============================================================
   Interactive Story intro (FR-4) — mode-appropriate:
   • Audio-Tactile: panels are narrated aloud, replay button
   • Visual/Sign: large text + emoji panels, no sound needed
   Then hands over to the chapter's quest game.
   ============================================================ */

import { useEffect, useState } from 'react';
import { useBSS } from '@/lib/bss/context';
import { chapterById, gameById } from '@/lib/bss/content';
import { BigButton, Card, TopBar } from '../bits';
import { Kiko } from '../kiko';

export function StoryScreen({ chapterId }: { chapterId: string }) {
  const { go, back, mode, say, playSound, buzz, profile } = useBSS();
  const chapter = chapterById(chapterId);
  const game = gameById(chapter.gameByMode[mode]);
  const [panel, setPanel] = useState(0);
  const isLast = panel === chapter.story.length - 1;
  const isAudio = mode === 'audio';

  /* narrate current panel (audio mode only — visual mode never requires sound) */
  useEffect(() => {
    if (!isAudio) return;
    const t = setTimeout(() => say(chapter.story[panel].text), 350);
    return () => clearTimeout(t);
  }, [panel, isAudio, say, chapter.story]);

  const next = () => {
    playSound('tap');
    if (!isLast) setPanel((p) => p + 1);
    else startQuest();
  };

  const startQuest = () => {
    playSound('unlock');
    buzz('success');
    go({ name: 'game', gameId: game.id, chapterId });
  };

  const active = chapter.story[panel];

  return (
    <div className="flex min-h-full flex-col gap-4 px-5 pb-8 pt-6">
      <TopBar
        title={`Chapter ${chapter.index + 1}: ${chapter.title}`}
        subtitle={isAudio ? '🔊 Listen to the story' : '👀 Read and watch'}
        onBack={back}
      />

      {/* progress dots */}
      <div className="flex justify-center gap-2" aria-label={`Panel ${panel + 1} of ${chapter.story.length}`}>
        {chapter.story.map((_, i) => (
          <span key={i}
            className={`h-2.5 rounded-full transition-all ${i === panel ? 'w-8 bg-violet-600' : 'w-2.5 bg-violet-200'}`}
            aria-hidden />
        ))}
      </div>

      {/* story panel */}
      <Card className={`relative overflow-hidden bg-gradient-to-br ${chapter.color} border-0 p-0`}>
        <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-6 text-center text-white">
          <span className="bss-pop text-8xl drop-shadow-xl" key={panel} aria-hidden>{active.emoji}</span>
          <p className="text-lg font-bold leading-relaxed drop-shadow-md" key={`t-${panel}`}>
            {active.text}
          </p>
          {profile?.prefs.language === 'hi' && active.textHi && (
            <p className="text-sm font-semibold opacity-90">{active.textHi}</p>
          )}
        </div>
      </Card>

      {/* audio-mode replay (never the only channel — text is on the panel) */}
      {isAudio && (
        <button
          onClick={() => say(active.text)}
          className="bss-tap mx-auto flex min-h-12 items-center gap-2 rounded-full border-2 border-violet-200
            bg-white px-5 font-bold text-violet-700 shadow-md active:scale-95
            focus-visible:outline-4 focus-visible:outline-amber-400"
        >
          🔁 Hear it again
        </button>
      )}

      <div className="mt-auto flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Kiko size={64} mood="happy" />
          <p className="flex-1 rounded-2xl border-2 border-violet-100 bg-white p-3 text-sm font-bold text-violet-800 shadow-sm">
            Quest: <b>{chapter.questLine}</b>
            <br /><span className="text-violet-500">You will play: {game.emoji} {game.title}</span>
          </p>
        </div>

        <div className="flex gap-3">
          {!isLast && (
            <BigButton variant="secondary" size="lg" className="flex-1" onClick={() => setPanel((p) => Math.max(0, p - 1))}>
              ← Back
            </BigButton>
          )}
          <BigButton size="lg" className="flex-[2]" onClick={next}>
            {isLast ? `🎮 Start the quest!` : 'Next →'}
          </BigButton>
        </div>
      </div>
    </div>
  );
}

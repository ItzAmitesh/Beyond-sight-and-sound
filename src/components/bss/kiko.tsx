'use client';

/* Kiko the Firefly — the shared mascot connecting both sensory
   tracks (SRS FR-7). Pure SVG + CSS so it works in every mode
   with a gentle glow (visual) and can be paired with buzz(). */

interface KikoProps {
  size?: number;
  mood?: 'happy' | 'cheer' | 'sleepy';
  glow?: boolean;
  className?: string;
}

export function Kiko({ size = 120, mood = 'happy', glow = true, className = '' }: KikoProps) {
  return (
    <div
      className={`bss-kiko ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Kiko the firefly, your guide"
    >
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <defs>
          <radialGradient id="kiko-glow" cx="50%" cy="55%" r="50%">
            <stop offset="0%" stopColor="#FFE082" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#FFC107" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FFC107" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="kiko-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#5B21B6" />
          </linearGradient>
        </defs>

        {glow && <circle cx="60" cy="62" r="46" fill="url(#kiko-glow)" className="kiko-glow" />}

        {/* wings */}
        <g className="kiko-wings">
          <ellipse cx="36" cy="46" rx="20" ry="11" fill="#E9D5FF" opacity="0.85"
            transform="rotate(-28 36 46)" />
          <ellipse cx="84" cy="46" rx="20" ry="11" fill="#E9D5FF" opacity="0.85"
            transform="rotate(28 84 46)" />
        </g>

        {/* antennae */}
        <path d="M52 30 Q 46 18 38 16" stroke="#5B21B6" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M68 30 Q 74 18 82 16" stroke="#5B21B6" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="37" cy="15" r="3.4" fill="#FACC15" />
        <circle cx="83" cy="15" r="3.4" fill="#FACC15" />

        {/* body */}
        <ellipse cx="60" cy="62" rx="26" ry="30" fill="url(#kiko-body)" />
        {/* tail light */}
        <ellipse cx="60" cy="82" rx="13" ry="12" fill="#FDE047" className="kiko-tail" />
        <ellipse cx="60" cy="82" rx="7" ry="6.5" fill="#FEF9C3" />

        {/* face */}
        <circle cx="51" cy="54" r="4.2" fill="#fff" />
        <circle cx="69" cy="54" r="4.2" fill="#fff" />
        <circle cx="52" cy="55" r="2.2" fill="#1E1B4B" />
        <circle cx="68" cy="55" r="2.2" fill="#1E1B4B" />
        {mood === 'sleepy' ? (
          <path d="M52 68 Q 60 64 68 68" stroke="#E9D5FF" strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : mood === 'cheer' ? (
          <ellipse cx="60" cy="67" rx="7" ry="5.5" fill="#E9D5FF" />
        ) : (
          <path d="M51 65 Q 60 73 69 65" stroke="#E9D5FF" strokeWidth="3.2" fill="none" strokeLinecap="round" />
        )}
        <circle cx="44" cy="61" r="3.4" fill="#F472B6" opacity="0.55" />
        <circle cx="76" cy="61" r="3.4" fill="#F472B6" opacity="0.55" />
      </svg>
    </div>
  );
}

/** Kiko with a speech bubble — used for instructions & celebrations */
export function KikoSays({
  text, size = 92, mood = 'happy', children,
}: { text?: string; size?: number; mood?: 'happy' | 'cheer' | 'sleepy'; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <Kiko size={size} mood={mood} />
      {(text || children) && (
        <div className="relative flex-1 rounded-2xl bg-white/95 px-4 py-3 shadow-md border-2 border-violet-200">
          <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 size-5 rotate-45 bg-white border-l-2 border-b-2 border-violet-200" />
          {children ?? (
            <p className="text-[15px] font-semibold leading-snug text-violet-950">{text}</p>
          )}
        </div>
      )}
    </div>
  );
}

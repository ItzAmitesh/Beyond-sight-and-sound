'use client';

/* ============================================================
   Shared UI bits — big accessible controls used across screens.
   Touch targets ≥ 48dp, never color-only meaning (SRS 11.1),
   mode-aware feedback on press (sound + haptic + visual).
   ============================================================ */

import React from 'react';
import { useBSS } from '@/lib/bss/context';

export function StarRow({
  earned, total = 3, size = 'md',
}: { earned: number; total?: number; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-base' : 'text-2xl';
  return (
    <span className={`inline-flex gap-1 ${cls}`} aria-label={`${earned} of ${total} stars`}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={i < earned ? '' : 'opacity-30 grayscale'} aria-hidden>
          {i < earned ? '⭐' : '☆'}
        </span>
      ))}
    </span>
  );
}

interface BigButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'success';
  size?: 'md' | 'lg';
  icon?: React.ReactNode;
  silent?: boolean; // skip tap sound/haptic (e.g., when the button makes its own)
}

export function BigButton({
  variant = 'primary', size = 'md', icon, className = '', silent, onClick, ...rest
}: BigButtonProps) {
  const { playSound, buzz } = useBSS();
  const styles: Record<string, string> = {
    primary: 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 border-2 border-violet-700 hover:bg-violet-700',
    secondary: 'bg-white text-violet-800 border-2 border-violet-300 hover:bg-violet-50 shadow-md',
    ghost: 'bg-transparent text-violet-700 border-2 border-transparent hover:bg-violet-100',
    success: 'bg-emerald-500 text-white border-2 border-emerald-600 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30',
  };
  return (
    <button
      onClick={(e) => {
        if (!silent) { playSound('tap'); buzz('tap'); }
        onClick?.(e);
      }}
      className={`inline-flex min-h-12 items-center justify-center gap-2.5 rounded-2xl px-6 font-bold tracking-wide transition-all
        active:scale-[0.97] focus-visible:outline-4 focus-visible:outline-amber-400 focus-visible:outline-offset-2
        disabled:opacity-50 disabled:pointer-events-none select-none
        ${size === 'lg' ? 'min-h-14 text-lg px-8' : 'text-base'} ${styles[variant]} ${className}`}
      {...rest}
    />
  );
}

/** Big circular icon option used in games (choices, sound tiles) */
export function ChoiceCard({
  emoji, label, state = 'idle', onClick, disabled, className = '', big,
}: {
  emoji: React.ReactNode; label: string;
  state?: 'idle' | 'correct' | 'wrong';
  onClick?: () => void; disabled?: boolean; className?: string; big?: boolean;
}) {
  const { playSound, buzz } = useBSS();
  const stateCls =
    state === 'correct' ? 'bg-emerald-100 border-emerald-500 ring-4 ring-emerald-300 scale-105' :
    state === 'wrong' ? 'bg-rose-50 border-rose-400 ring-4 ring-rose-200 bss-shake' :
    'bg-white border-violet-200 hover:border-violet-400 hover:bg-violet-50';
  return (
    <button
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        playSound('tap');
        buzz('tap');
        onClick?.();
      }}
      className={`bss-tap flex flex-col items-center justify-center gap-1.5 rounded-3xl border-[3px] p-4 shadow-md
        transition-all active:scale-95 focus-visible:outline-4 focus-visible:outline-amber-400
        disabled:cursor-default ${stateCls} ${big ? 'min-h-32 min-w-28' : 'min-h-28 min-w-24'} ${className}`}
      aria-label={label}
    >
      <span className={big ? 'text-5xl leading-none' : 'text-4xl leading-none'} aria-hidden>{emoji}</span>
      <span className="text-sm font-bold text-violet-950">{label}</span>
      {state === 'correct' && <span aria-hidden className="text-lg leading-none">✅</span>}
    </button>
  );
}

/** Screen header with back button + optional title (visual, not audio-dependent) */
export function TopBar({
  title, onBack, right, subtitle,
}: { title: string; onBack?: () => void; right?: React.ReactNode; subtitle?: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Go back"
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 border-violet-200
            bg-white text-2xl text-violet-700 shadow-md transition-all hover:bg-violet-50
            focus-visible:outline-4 focus-visible:outline-amber-400 active:scale-95"
        >
          ←
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-extrabold text-violet-950">{title}</h1>
        {subtitle && <p className="truncate text-sm font-medium text-violet-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

/** Section card in the app's rounded style */
export function Card({
  children, className = '', onClick,
}: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-3xl border-2 border-violet-100 bg-white/95 p-4 shadow-md ${onClick ? 'cursor-pointer transition-all hover:shadow-lg hover:border-violet-300 active:scale-[0.99]' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/** Round progress ring for the daily goal */
export function ProgressRing({
  value, total, size = 64, stroke = 8,
}: { value: number; total: number; size?: number; stroke?: number }) {
  const pct = Math.min(1, total > 0 ? value / total : 0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img"
      aria-label={`${value} of ${total}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EDE9FE" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="url(#ringGrad)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-700"
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-violet-800">
        {value}/{total}
      </span>
    </div>
  );
}

/** Small pill with icon + label */
export function Pill({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${className}`}>
      {children}
    </span>
  );
}

/** Mode chip: always icon + text (never color alone) */
export function ModeChip({ mode }: { mode: 'visual' | 'audio' }) {
  return mode === 'visual' ? (
    <Pill className="bg-sky-100 text-sky-800">👁️ Visual / Sign</Pill>
  ) : (
    <Pill className="bg-amber-100 text-amber-800">🎧 Audio-Tactile</Pill>
  );
}

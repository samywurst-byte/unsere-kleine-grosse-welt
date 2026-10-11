import type { ReactNode } from 'react';
import { HERO_CAPES, HERO_COLORS, symbolEmoji } from '../../data/heroWorld';
import type { HeroLook } from '../../types';

export type MomoMood = 'happy' | 'talk' | 'think' | 'sleep';

/** Momo, der kleine Drache. */
export function Momo({ mood = 'happy', size = 120, className = '' }: { mood?: MomoMood; size?: number; className?: string }) {
  const body = '#5cbf8a';
  const dark = '#3f9a6a';
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={`momo momo--${mood} ${className}`} aria-hidden="true">
      <path d="M86 92 C108 96 112 76 104 66 C112 80 100 90 84 84 Z" fill={dark} />
      <path d="M36 66 C14 52 12 72 18 80 C24 72 30 74 38 78 Z" fill="#f2a65a" />
      <path d="M84 66 C106 52 108 72 102 80 C96 72 90 74 82 78 Z" fill="#f2a65a" />
      <ellipse cx="60" cy="84" rx="30" ry="27" fill={body} />
      <ellipse cx="60" cy="90" rx="18" ry="17" fill="#f7e6a8" />
      <path d="M50 88 h20 M50 95 h20" stroke="#e8cf86" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="44" cy="110" rx="9" ry="5" fill={dark} />
      <ellipse cx="76" cy="110" rx="9" ry="5" fill={dark} />
      <path d="M44 24 L40 8 L52 20 Z" fill="#f2c94c" />
      <path d="M76 24 L80 8 L68 20 Z" fill="#f2c94c" />
      <circle cx="60" cy="44" r="27" fill={body} />
      <path d="M60 17 l-4 -6 l4 2 l4 -2 Z" fill="#f2a65a" />
      {mood === 'sleep' ? (
        <>
          <path d="M43 44 q6 5 12 0 M65 44 q6 5 12 0" stroke="#24382c" strokeWidth="3" fill="none" strokeLinecap="round" />
          <text x="92" y="22" fontSize="16" fontWeight="800" fill="#6b7fa8">z</text>
          <text x="102" y="10" fontSize="12" fontWeight="800" fill="#6b7fa8">z</text>
        </>
      ) : (
        <>
          <circle cx="49" cy="42" r="8" fill="#fff" />
          <circle cx="71" cy="42" r="8" fill="#fff" />
          <circle cx={mood === 'think' ? 51 : 50} cy={mood === 'think' ? 39 : 43} r="4.2" fill="#24382c" />
          <circle cx={mood === 'think' ? 73 : 72} cy={mood === 'think' ? 39 : 43} r="4.2" fill="#24382c" />
          <circle cx="51.5" cy="41" r="1.4" fill="#fff" />
          <circle cx="73.5" cy="41" r="1.4" fill="#fff" />
        </>
      )}
      <circle cx="40" cy="54" r="5" fill="#f4a3a3" opacity=".7" />
      <circle cx="80" cy="54" r="5" fill="#f4a3a3" opacity=".7" />
      <circle cx="56" cy="53" r="1.4" fill={dark} />
      <circle cx="64" cy="53" r="1.4" fill={dark} />
      {mood === 'talk' && <ellipse cx="60" cy="61" rx="6" ry="5" fill="#9b3b3b" />}
      {mood === 'think' && <circle cx="62" cy="61" r="3" fill="#9b3b3b" />}
      {(mood === 'happy' || mood === 'sleep') && <path d="M52 59 q8 8 16 0" stroke="#24382c" strokeWidth="3" fill="none" strokeLinecap="round" />}
    </svg>
  );
}

export const DEFAULT_LOOK: HeroLook = { color: 'blue', cape: 'gold', mask: false, symbol: 'star' };

/** Die Heldenfigur eines Kindes. */
export function HeroFigure({ look, size = 140, className = '' }: { look?: HeroLook; size?: number; className?: string }) {
  const l = look ?? DEFAULT_LOOK;
  const color = HERO_COLORS.find((c) => c.id === l.color)?.hex ?? HERO_COLORS[0].hex;
  const cape = HERO_CAPES.find((c) => c.id === l.cape)?.hex;
  const skin = '#f1c27d';
  return (
    <svg viewBox="0 0 100 140" width={size * (100 / 140)} height={size} className={`hero-figure ${className}`} aria-hidden="true">
      {cape && <path d="M32 50 L68 50 L86 130 Q50 122 14 130 Z" fill={cape} />}
      <rect x="37" y="98" width="11" height="30" rx="4" fill="#3d3d55" />
      <rect x="52" y="98" width="11" height="30" rx="4" fill="#3d3d55" />
      <ellipse cx="42" cy="129" rx="8" ry="4" fill="#26263a" />
      <ellipse cx="58" cy="129" rx="8" ry="4" fill="#26263a" />
      <rect x="19" y="54" width="11" height="36" rx="5.5" fill={color} transform="rotate(12 24 56)" />
      <rect x="70" y="54" width="11" height="36" rx="5.5" fill={color} transform="rotate(-12 76 56)" />
      <circle cx="20" cy="91" r="6" fill={skin} />
      <circle cx="80" cy="91" r="6" fill={skin} />
      <rect x="29" y="48" width="42" height="56" rx="13" fill={color} />
      <rect x="29" y="90" width="42" height="6" fill="#000" opacity=".22" />
      <circle cx="50" cy="70" r="12" fill="#fff" opacity=".92" />
      <text x="50" y="75.5" fontSize="15" textAnchor="middle">{symbolEmoji(l.symbol)}</text>
      <circle cx="50" cy="29" r="20" fill={skin} />
      <path d="M30 27 Q32 7 50 8 Q68 7 70 27 Q62 17 50 18 Q38 17 30 27 Z" fill="#5a3b22" />
      {l.mask ? (
        <>
          <rect x="29" y="23" width="42" height="11" rx="5.5" fill="#26263a" />
          <circle cx="42" cy="28.5" r="3.6" fill="#fff" />
          <circle cx="58" cy="28.5" r="3.6" fill="#fff" />
          <circle cx="42.5" cy="28.5" r="1.8" fill="#26263a" />
          <circle cx="58.5" cy="28.5" r="1.8" fill="#26263a" />
        </>
      ) : (
        <>
          <circle cx="42" cy="28" r="2.6" fill="#26263a" />
          <circle cx="58" cy="28" r="2.6" fill="#26263a" />
        </>
      )}
      <path d="M43 38 q7 6 14 0" stroke="#7a3b2a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Momo mit Sprechblase. */
export function MomoSays({ text, mood = 'talk', size = 110, children }: { text: string; mood?: MomoMood; size?: number; children?: ReactNode }) {
  return (
    <div className="momo-says">
      <Momo mood={mood} size={size} className="momo--bob" />
      <div className="momo-says__bubble">
        <p className="hero-say">{text}</p>
        {children}
      </div>
    </div>
  );
}

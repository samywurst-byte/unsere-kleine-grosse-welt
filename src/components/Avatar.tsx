import type { JSX } from 'react';
import type { AvatarKey, ColorKey } from '../types';

/** Selbst gezeichnete, austauschbare Avatare. Keine externen Bilder. */

const INK = '#2F3437';

function Eyes({ y = 54, dx = 12, r = 3.2 }: { y?: number; dx?: number; r?: number }) {
  return (
    <g fill={INK}>
      <circle cx={50 - dx} cy={y} r={r} />
      <circle cx={50 + dx} cy={y} r={r} />
      <circle cx={50 - dx + 1} cy={y - 1} r={0.9} fill="#fff" />
      <circle cx={50 + dx + 1} cy={y - 1} r={0.9} fill="#fff" />
    </g>
  );
}

function Blush({ y = 63, dx = 19 }: { y?: number; dx?: number }) {
  return (
    <g fill="#EBA894" opacity={0.55}>
      <ellipse cx={50 - dx} cy={y} rx={5} ry={3.4} />
      <ellipse cx={50 + dx} cy={y} rx={5} ry={3.4} />
    </g>
  );
}

function Fox() {
  return (
    <g>
      <path d="M22 44 L28 13 L47 31 Z" fill="#D9874F" />
      <path d="M78 44 L72 13 L53 31 Z" fill="#D9874F" />
      <path d="M28 36 L31 21 L41 31 Z" fill="#F6DCC6" />
      <path d="M72 36 L69 21 L59 31 Z" fill="#F6DCC6" />
      <path d="M18 46 Q50 14 82 46 Q80 70 50 84 Q20 70 18 46 Z" fill="#E19A65" />
      <path d="M20 50 Q37 55 50 83 Q26 74 20 50 Z" fill="#FFF7EE" />
      <path d="M80 50 Q63 55 50 83 Q74 74 80 50 Z" fill="#FFF7EE" />
      <Eyes y={52} dx={13} />
      <ellipse cx={50} cy={75} rx={4.6} ry={3.4} fill={INK} />
      <Blush y={63} dx={21} />
    </g>
  );
}

function Rabbit() {
  return (
    <g>
      <ellipse cx={37} cy={27} rx={8.5} ry={21} fill="#EEE7DB" transform="rotate(-8 37 27)" />
      <ellipse cx={63} cy={27} rx={8.5} ry={21} fill="#EEE7DB" transform="rotate(8 63 27)" />
      <ellipse cx={37} cy={28} rx={4} ry={14} fill="#F1C7CD" transform="rotate(-8 37 28)" />
      <ellipse cx={63} cy={28} rx={4} ry={14} fill="#F1C7CD" transform="rotate(8 63 28)" />
      <ellipse cx={50} cy={62} rx={27} ry={24} fill="#F6F1E8" />
      <Eyes y={58} dx={11} />
      <path d="M46 66 L54 66 L50 70.5 Z" fill="#D98F9C" />
      <path d="M50 70.5 Q50 75 45 76 M50 70.5 Q50 75 55 76" stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Blush y={67} dx={18} />
    </g>
  );
}

function Hedgehog() {
  const spikes: string[] = [];
  const cx = 50, cy = 56;
  const n = 15;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI * (1.05 + (0.9 * i) / n);
    const r = i % 2 === 0 ? 30 : 38;
    spikes.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  // Untere Hälfte des Stachelkleids als glatte Kurve schließen
  const path = `M ${spikes.join(' L ')} Q 86 84 50 86 Q 14 84 ${spikes[0]} Z`;
  return (
    <g>
      <path d={path} fill="#9E7C60" />
      <ellipse cx={50} cy={64} rx={23} ry={20} fill="#F3E2CB" />
      <Eyes y={60} dx={9} r={3} />
      <circle cx={50} cy={70} r={4.2} fill={INK} />
      <Blush y={69} dx={15} />
    </g>
  );
}

function Flower() {
  const petals = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    return <ellipse key={i} cx={50 + 22 * Math.cos(a)} cy={50 + 22 * Math.sin(a)} rx={15} ry={15} fill="#E9B7C6" />;
  });
  return (
    <g>
      {petals}
      <circle cx={50} cy={50} r={19} fill="#F2CF7A" />
      <Eyes y={48} dx={7} r={2.6} />
      <path d="M44 56 Q50 61 56 56" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
    </g>
  );
}

function Bear() {
  return (
    <g>
      <circle cx={28} cy={32} r={11} fill="#A9805E" />
      <circle cx={72} cy={32} r={11} fill="#A9805E" />
      <circle cx={28} cy={32} r={5.5} fill="#DDBE9E" />
      <circle cx={72} cy={32} r={5.5} fill="#DDBE9E" />
      <circle cx={50} cy={56} r={29} fill="#BC9370" />
      <ellipse cx={50} cy={67} rx={13} ry={10} fill="#EBD6BD" />
      <Eyes y={52} dx={12} />
      <ellipse cx={50} cy={63} rx={4.5} ry={3.2} fill={INK} />
      <Blush y={63} dx={21} />
    </g>
  );
}

function Owl() {
  return (
    <g>
      <path d="M24 30 L32 40 L40 32 Z M76 30 L68 40 L60 32 Z" fill="#8E7B9E" />
      <ellipse cx={50} cy={58} rx={28} ry={28} fill="#A796B6" />
      <ellipse cx={50} cy={70} rx={16} ry={14} fill="#E4DAEC" />
      <circle cx={39} cy={50} r={10} fill="#FFFDF8" />
      <circle cx={61} cy={50} r={10} fill="#FFFDF8" />
      <circle cx={39} cy={51} r={4.2} fill={INK} />
      <circle cx={61} cy={51} r={4.2} fill={INK} />
      <path d="M46 58 L54 58 L50 65 Z" fill="#E3A56C" />
    </g>
  );
}

function Parent({ variant }: { variant: 'a' | 'b' }) {
  return (
    <g>
      {variant === 'a' ? (
        <>
          <circle cx={50} cy={22} r={10} fill="#6E5140" />
          <path d="M22 56 Q22 26 50 26 Q78 26 78 56 L78 74 Q70 64 70 52 L30 52 Q30 64 22 74 Z" fill="#6E5140" />
        </>
      ) : (
        <path d="M24 50 Q24 22 50 22 Q76 22 76 50 Q72 38 50 36 Q28 38 24 50 Z" fill="#5A4636" />
      )}
      <ellipse cx={50} cy={56} rx={22} ry={24} fill="#F1D3BA" />
      {variant === 'b' && <path d="M28 50 Q30 34 50 34 Q70 34 72 50 Q66 40 50 40 Q34 40 28 50 Z" fill="#5A4636" />}
      <Eyes y={56} dx={9} r={2.8} />
      <path d="M43 67 Q50 72 57 67" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Blush y={64} dx={14} />
    </g>
  );
}

const DRAW: Record<AvatarKey, () => JSX.Element> = {
  fox: Fox, rabbit: Rabbit, hedgehog: Hedgehog, flower: Flower, bear: Bear, owl: Owl,
  'parent-a': () => <Parent variant="a" />, 'parent-b': () => <Parent variant="b" />,
};

export const AVATAR_LABELS: Record<AvatarKey, string> = {
  fox: 'Fuchs', rabbit: 'Hase', hedgehog: 'Igel', flower: 'Blume', bear: 'Bär', owl: 'Eule',
  'parent-a': 'Person mit Dutt', 'parent-b': 'Person mit kurzen Haaren',
};

export function Avatar({ avatar, color, size = 72, label }: {
  avatar: AvatarKey; color: ColorKey; size?: number; label?: string;
}) {
  const Draw = DRAW[avatar] ?? Fox;
  return (
    <svg
      viewBox="0 0 100 100" width={size} height={size} className={`avatar tone-${color}`}
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}
    >
      <circle cx={50} cy={50} r={50} fill="var(--tone-soft)" />
      <Draw />
    </svg>
  );
}

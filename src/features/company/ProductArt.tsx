import type { ReactNode } from 'react';

/** Eigene kleine Zeichnungen der Weihnachtsprodukte (keine Fotos), sonst das Emoji. */
const ART: Record<string, ReactNode> = {
  'bead-trees': (
    <>
      {[[50, 22, 0], [44, 34, 1], [56, 34, 0], [38, 46, 0], [50, 46, 2], [62, 46, 0], [32, 58, 1], [44, 58, 0], [56, 58, 0], [68, 58, 2], [26, 70, 0], [38, 70, 2], [50, 70, 0], [62, 70, 1], [74, 70, 0]]
        .map(([x, y, c], i) => <circle key={i} cx={x} cy={y} r="6" fill={['#5E8C61', '#C0504D', '#C9A55A'][c]} stroke="#3E5E40" strokeWidth="1" />)}
      <rect x="46" y="76" width="8" height="12" rx="2" fill="#8A5532" />
      <path d="M50 4 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" fill="#E8C35A" stroke="#B08A2E" />
    </>
  ),
  'wood-gnomes': (
    <>
      <rect x="32" y="48" width="36" height="40" rx="4" fill="#E2C49A" stroke="#A9865A" />
      <path d="M28 52 L50 8 L72 52 Z" fill="#C0504D" stroke="#8C3B2A" />
      <circle cx="50" cy="9" r="4" fill="#fff" />
      <path d="M32 58 Q50 98 68 58 Z" fill="#F7F3EC" stroke="#CFC6B8" />
      <circle cx="50" cy="58" r="6" fill="#E8B48F" stroke="#A9865A" />
    </>
  ),
  'wood-village': (
    <>
      {[[8, 46, 26, '#91AEC7'], [37, 34, 28, '#D5A17E'], [68, 50, 24, '#A5BBA5']].map(([x, y, w, c], i) => {
        const X = Number(x), Y = Number(y), W = Number(w);
        return (
          <g key={i}>
            <rect x={X} y={Y} width={W} height={88 - Y} fill="#F1E4CF" stroke="#A9865A" />
            <path d={`M${X - 3} ${Y} L${X + W / 2} ${Y - W * 0.6} L${X + W + 3} ${Y} Z`} fill={String(c)} stroke="#6F6A5E" />
            <rect x={X + W / 2 - 4} y={Y + 10} width="8" height="8" fill="#E8C35A" />
            <rect x={X + W / 2 - 4} y={78} width="8" height="10" fill="#8A5532" />
          </g>
        );
      })}
      <path d="M2 88 H98" stroke="#CFC6B8" strokeWidth="3" />
    </>
  ),
  'peg-snowflakes': (
    <g transform="translate(50 50)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <rect key={a} x="-4" y="-44" width="8" height="38" rx="3" fill="#E9D7B5" stroke="#B49A6E" transform={`rotate(${a})`} />
      ))}
      <circle r="7" fill="#F7F3EC" stroke="#B49A6E" />
    </g>
  ),
  'slice-reindeer': (
    <>
      <path d="M36 30 L28 10 M30 18 L20 14 M64 30 L72 10 M70 18 L80 14" stroke="#8A5532" strokeWidth="4" strokeLinecap="round" />
      <circle cx="50" cy="56" r="34" fill="#C9A77A" stroke="#8A6A44" strokeWidth="2" />
      <circle cx="50" cy="56" r="26" fill="#E6CFA6" />
      <circle cx="50" cy="56" r="16" fill="none" stroke="#C9A77A" />
      <circle cx="40" cy="50" r="4" fill="#2F3437" /><circle cx="60" cy="50" r="4" fill="#2F3437" />
      <circle cx="50" cy="66" r="7" fill="#C0504D" />
    </>
  ),
  'thumb-snowmen': (
    <>
      <circle cx="50" cy="52" r="40" fill="#E6CFA6" stroke="#8A6A44" strokeWidth="2" />
      <ellipse cx="50" cy="66" rx="14" ry="16" fill="#fff" />
      <ellipse cx="50" cy="38" rx="11" ry="12" fill="#fff" />
      <circle cx="46" cy="36" r="1.8" fill="#2F3437" /><circle cx="54" cy="36" r="1.8" fill="#2F3437" />
      <path d="M50 40 l7 2 -7 1z" fill="#E08A3C" />
      <rect x="38" y="47" width="24" height="5" rx="2" fill="#C0504D" />
    </>
  ),
};

export function ProductArt({ catalogId, emoji, size = 96 }: { catalogId?: string; emoji: string; size?: number }) {
  const art = catalogId ? ART[catalogId] : undefined;
  if (!art) return <span className="kc-art kc-art--emoji" style={{ fontSize: size * 0.7 }} aria-hidden="true">{emoji}</span>;
  return <svg className="kc-art" width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">{art}</svg>;
}

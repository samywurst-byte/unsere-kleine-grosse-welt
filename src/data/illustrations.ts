/**
 * Strichzeichnungen für die Arbeitsblätter: schwarze Linien, weiße Flächen, druckerfreundlich und zum Ausmalen geeignet.
 * Koordinaten in einem 100 × 100 Feld, y nach unten (wie SVG). Später gezeichnete Formen liegen oben.
 * Jedes Bild hat ein Wort, dessen Anfangsbuchstaben und die Silbenzahl, damit Anlaut- und Silbenaufgaben stimmen.
 */

export interface Shape {
  d: string;
  /** Füllung: weiß (Standard), schwarz oder keine (offene Linie). */
  fill?: 'white' | 'black' | 'none';
  /** false: nur Fläche, ohne Kontur (zum Überdecken innerer Linien). */
  stroke?: boolean;
  /** Linienstärke relativ zur Grundstärke. */
  weight?: number;
}

export interface Illustration {
  id: string;
  word: string;
  /** Anfangsbuchstabe groß, wie in LETTERS ("M", "A" ...). */
  initial: string;
  syllables: number;
  shapes: Shape[];
}

// ------------------------------------------------------------- Bausteine

const f = (n: number) => Number(n.toFixed(2));

function ellipse(cx: number, cy: number, rx: number, ry: number, fill: Shape['fill'] = 'white', extra: Partial<Shape> = {}): Shape {
  return {
    d: `M ${f(cx - rx)} ${f(cy)} A ${rx} ${ry} 0 1 0 ${f(cx + rx)} ${f(cy)} A ${rx} ${ry} 0 1 0 ${f(cx - rx)} ${f(cy)} Z`,
    fill, ...extra,
  };
}
const circle = (cx: number, cy: number, r: number, fill: Shape['fill'] = 'white', extra: Partial<Shape> = {}) => ellipse(cx, cy, r, r, fill, extra);
const dot = (cx: number, cy: number, r = 2.5) => circle(cx, cy, r, 'black', { stroke: false });
const line = (d: string, weight?: number): Shape => ({ d, fill: 'none', weight });
const shape = (d: string, fill: Shape['fill'] = 'white', extra: Partial<Shape> = {}): Shape => ({ d, fill, ...extra });
const rect = (x: number, y: number, w: number, h: number, fill: Shape['fill'] = 'white'): Shape =>
  shape(`M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`, fill);

function around(cx: number, cy: number, radius: number, count: number, offset = 0): [number, number][] {
  return Array.from({ length: count }, (_, i) => {
    const a = offset + (i * 2 * Math.PI) / count;
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
  });
}

function rays(cx: number, cy: number, r1: number, r2: number, count: number): Shape[] {
  return Array.from({ length: count }, (_, i) => {
    const a = (i * 2 * Math.PI) / count;
    return line(`M ${f(cx + r1 * Math.cos(a))} ${f(cy + r1 * Math.sin(a))} L ${f(cx + r2 * Math.cos(a))} ${f(cy + r2 * Math.sin(a))}`);
  });
}

// ------------------------------------------------------------- Bilder

const ILLUSTRATION_LIST: Illustration[] = [
  // ---- M
  {
    id: 'maus', word: 'Maus', initial: 'M', syllables: 1,
    shapes: [
      line('M 84 66 C 98 70 98 86 84 85 C 74 84 74 92 88 94'),
      ellipse(42, 82, 7, 4), ellipse(70, 82, 7, 4),
      ellipse(57, 63, 29, 19),
      circle(38, 42, 11), circle(38, 42, 5.5, 'none'),
      shape('M 46 52 C 40 46 26 48 12 61 C 24 72 40 74 46 66 Z'),
      dot(27, 56, 2.4), dot(12.5, 61, 2.8),
      line('M 16 63 L 4 58'), line('M 16 64 L 4 69'),
    ],
  },
  {
    id: 'mond', word: 'Mond', initial: 'M', syllables: 1,
    shapes: [
      shape('M 50 8 A 42 42 0 1 0 50 92 A 34 34 0 1 1 50 8 Z'),
      dot(36, 46, 2.4),
      line('M 30 62 Q 36 66 42 62'),
      shape('M 80 14 L 83 22 L 91 22 L 85 27 L 87 35 L 80 30 L 73 35 L 75 27 L 69 22 L 77 22 Z'),
    ],
  },
  {
    id: 'melone', word: 'Melone', initial: 'M', syllables: 3,
    shapes: [
      shape('M 8 40 A 42 42 0 0 0 92 40 Z'),
      line('M 16 40 A 34 34 0 0 0 84 40'),
      ...[[34, 52], [50, 56], [66, 52], [42, 66], [58, 66]].map(([x, y]) => ellipse(x, y, 2.2, 3.4, 'black', { stroke: false })),
    ],
  },
  // ---- A
  {
    id: 'affe', word: 'Affe', initial: 'A', syllables: 2,
    shapes: [
      circle(17, 48, 12), circle(17, 48, 6, 'none'),
      circle(83, 48, 12), circle(83, 48, 6, 'none'),
      circle(50, 48, 33),
      shape('M 50 36 C 40 26 22 32 27 48 C 20 58 28 80 50 80 C 72 80 80 58 73 48 C 78 32 60 26 50 36 Z'),
      dot(40, 46, 3.4), dot(60, 46, 3.4),
      dot(46.5, 60, 1.5), dot(53.5, 60, 1.5),
      line('M 39 68 Q 50 76 61 68'),
      line('M 44 16 Q 50 8 56 16'),
    ],
  },
  {
    id: 'apfel', word: 'Apfel', initial: 'A', syllables: 2,
    shapes: [
      line('M 50 30 Q 49 18 55 9', 1.3),
      shape('M 50 30 C 35 18 12 25 14 52 C 16 76 35 94 50 85 C 65 94 84 76 86 52 C 88 25 65 18 50 30 Z'),
      shape('M 54 21 Q 68 6 80 15 Q 68 29 54 21 Z'),
      line('M 26 44 Q 26 36 32 32'),
    ],
  },
  {
    id: 'ananas', word: 'Ananas', initial: 'A', syllables: 3,
    shapes: [
      shape('M 36 40 L 28 16 L 42 28 L 50 3 L 58 28 L 72 16 L 64 40 Z'),
      ellipse(50, 64, 22, 30),
      line('M 34 46 L 66 82'), line('M 30 62 L 52 92'), line('M 44 37 L 72 68'),
      line('M 66 46 L 34 82'), line('M 70 62 L 48 92'), line('M 56 37 L 28 68'),
    ],
  },
  // ---- I
  {
    id: 'igel', word: 'Igel', initial: 'I', syllables: 2,
    shapes: [
      ellipse(40, 84, 6, 4), ellipse(72, 84, 6, 4),
      shape('M 26 78 L 22 60 L 31 63 L 29 47 L 38 54 L 39 38 L 47 48 L 52 33 L 57 46 L 64 35 L 67 48 L 76 41 L 76 53 L 86 51 L 83 62 L 93 65 L 86 73 L 92 80 Z'),
      shape('M 34 58 C 24 59 13 68 6 75 C 13 81 27 83 38 80 Z'),
      dot(6.5, 75, 2.8), dot(23, 67, 2.3),
    ],
  },
  {
    id: 'insel', word: 'Insel', initial: 'I', syllables: 2,
    shapes: [
      line('M 4 86 Q 14 80 24 86 Q 34 92 44 86 Q 54 80 64 86 Q 74 92 84 86 Q 92 81 98 86'),
      shape('M 14 80 Q 50 56 86 80 Z'),
      shape('M 50 66 Q 54 42 48 24 L 53 24 Q 60 42 56 67 Z'),
      shape('M 50 24 Q 34 12 16 24 Q 32 20 50 24 Z'),
      shape('M 50 24 Q 66 12 84 24 Q 68 20 50 24 Z'),
      shape('M 50 24 Q 36 26 26 40 Q 40 28 50 24 Z'),
      shape('M 50 24 Q 64 26 74 40 Q 60 28 50 24 Z'),
      circle(80, 12, 6),
    ],
  },
  // ---- O
  {
    id: 'ofen', word: 'Ofen', initial: 'O', syllables: 2,
    shapes: [
      rect(16, 20, 68, 72),
      line('M 16 36 L 84 36'),
      circle(28, 28, 3.5), circle(40, 28, 3.5), circle(60, 28, 3.5), circle(72, 28, 3.5),
      rect(26, 48, 48, 34),
      line('M 32 43 L 68 43', 1.6),
      line('M 30 72 L 70 72'),
    ],
  },
  {
    id: 'ohr', word: 'Ohr', initial: 'O', syllables: 1,
    shapes: [
      shape('M 34 30 C 36 10 74 4 80 32 C 84 50 70 56 66 66 C 62 78 64 90 50 92 C 40 93 34 86 38 80 C 30 64 32 48 34 30 Z'),
      line('M 46 34 C 52 22 70 26 68 40 C 66 50 56 50 56 60 C 56 66 52 70 48 70'),
    ],
  },
  // ---- L
  {
    id: 'loewe', word: 'Löwe', initial: 'L', syllables: 2,
    shapes: [
      ...around(50, 50, 34, 14).map(([x, y]) => circle(x, y, 11)),
      circle(50, 50, 35, 'white', { stroke: false }),
      circle(34, 30, 7), circle(66, 30, 7),
      circle(50, 52, 24),
      dot(41, 46, 2.8), dot(59, 46, 2.8),
      shape('M 45 55 L 55 55 L 50 61 Z', 'black'),
      line('M 50 61 Q 46 68 40 65'), line('M 50 61 Q 54 68 60 65'),
    ],
  },
  {
    id: 'leiter', word: 'Leiter', initial: 'L', syllables: 2,
    shapes: [
      line('M 30 6 L 26 96', 1.4), line('M 70 6 L 74 96', 1.4),
      ...[16, 30, 44, 58, 72, 86].map((y) => line(`M ${f(30 - (y - 6) * 0.044)} ${y} L ${f(70 + (y - 6) * 0.044)} ${y}`)),
    ],
  },
  {
    id: 'loeffel', word: 'Löffel', initial: 'L', syllables: 2,
    shapes: [
      shape('M 46 44 L 45 90 Q 50 97 55 90 L 54 44 Z'),
      ellipse(50, 26, 17, 23),
      line('M 42 16 Q 44 10 50 9'),
    ],
  },
  // ---- S
  {
    id: 'sonne', word: 'Sonne', initial: 'S', syllables: 2,
    shapes: [
      ...rays(50, 50, 28, 44, 12),
      circle(50, 50, 22),
      dot(42, 45, 2.4), dot(58, 45, 2.4),
      line('M 41 56 Q 50 64 59 56'),
    ],
  },
  {
    id: 'sofa', word: 'Sofa', initial: 'S', syllables: 2,
    shapes: [
      rect(16, 76, 6, 9), rect(78, 76, 6, 9),
      shape('M 20 54 L 20 32 Q 20 26 26 26 L 74 26 Q 80 26 80 32 L 80 54 Z'),
      rect(14, 52, 72, 26),
      line('M 50 52 L 50 64'),
      shape('M 6 46 Q 6 40 12 40 L 18 40 Q 24 40 24 46 L 24 78 L 6 78 Z'),
      shape('M 76 46 Q 76 40 82 40 L 88 40 Q 94 40 94 46 L 94 78 L 76 78 Z'),
    ],
  },
  {
    id: 'socke', word: 'Socke', initial: 'S', syllables: 2,
    shapes: [
      shape('M 34 8 L 62 8 L 62 56 C 62 64 68 68 76 70 C 94 74 92 94 74 94 L 44 94 C 26 94 26 76 34 68 Z'),
      line('M 34 15 L 62 15'), line('M 34 21 L 62 21'),
      line('M 76 70 C 70 78 72 90 78 93'),
      line('M 34 68 C 42 72 44 84 38 92'),
    ],
  },
  // ---- E
  {
    id: 'esel', word: 'Esel', initial: 'E', syllables: 2,
    shapes: [
      shape('M 38 36 C 28 12 24 2 30 2 C 38 2 46 18 46 34 Z'),
      shape('M 62 36 C 72 12 76 2 70 2 C 62 2 54 18 54 34 Z'),
      line('M 34 12 C 37 20 40 26 41 32'), line('M 66 12 C 63 20 60 26 59 32'),
      ellipse(50, 54, 21, 27),
      ellipse(50, 76, 17, 14),
      dot(41, 50, 2.6), dot(59, 50, 2.6),
      ellipse(44, 77, 2, 3, 'black', { stroke: false }), ellipse(56, 77, 2, 3, 'black', { stroke: false }),
      line('M 44 86 Q 50 89 56 86'),
      line('M 45 30 L 50 23 L 55 30'),
    ],
  },
  {
    id: 'ente', word: 'Ente', initial: 'E', syllables: 2,
    shapes: [
      line('M 8 92 Q 18 86 28 92 Q 38 98 48 92 Q 58 86 68 92 Q 78 98 88 92'),
      shape('M 18 60 C 16 86 74 90 88 66 C 92 58 86 50 78 56 C 68 62 50 60 40 52 C 30 46 18 50 18 60 Z'),
      line('M 44 66 Q 56 76 70 64'),
      circle(30, 38, 14),
      shape('M 17 36 L 3 41 L 17 45 Z'),
      dot(27, 35, 2.4),
    ],
  },
  // ---- N
  {
    id: 'nase', word: 'Nase', initial: 'N', syllables: 2,
    shapes: [
      circle(50, 50, 40),
      dot(35, 40, 3), dot(65, 40, 3),
      line('M 34 31 Q 38 28 42 30'), line('M 58 30 Q 62 28 66 31'),
      shape('M 50 38 C 49 50 38 58 42 64 C 45 68 55 68 58 64', 'none', { weight: 1.6 }),
      line('M 38 76 Q 50 83 62 76'),
    ],
  },
  {
    id: 'nest', word: 'Nest', initial: 'N', syllables: 1,
    shapes: [
      ellipse(37, 50, 9, 12), ellipse(63, 50, 9, 12), ellipse(50, 46, 9, 12),
      shape('M 8 52 C 12 92 88 92 92 52 Z'),
      line('M 12 62 Q 50 70 88 62'), line('M 18 72 Q 50 80 82 72'), line('M 28 81 Q 50 87 72 81'),
    ],
  },
  {
    id: 'nuss', word: 'Nuss', initial: 'N', syllables: 1,
    shapes: [
      shape('M 50 22 C 76 22 86 50 79 70 C 73 89 27 89 21 70 C 14 50 24 22 50 22 Z'),
      shape('M 22 42 C 28 20 72 20 78 42 C 64 34 36 34 22 42 Z'),
      line('M 50 22 L 52 12', 1.3),
      line('M 36 56 Q 38 70 46 76'),
    ],
  },
  // ---- Bilder mit anderen Anfangslauten (für Anlaut- und Silbenaufgaben)
  {
    id: 'baum', word: 'Baum', initial: 'B', syllables: 1,
    shapes: [
      shape('M 44 56 L 42 94 L 58 94 L 56 56 Z'),
      shape('M 30 64 C 10 64 10 38 27 36 C 24 16 46 8 55 20 C 66 6 88 18 80 36 C 96 40 92 66 70 64 Z'),
    ],
  },
  {
    id: 'ball', word: 'Ball', initial: 'B', syllables: 1,
    shapes: [
      circle(50, 52, 37),
      line('M 13 52 Q 50 68 87 52'),
      line('M 50 15 Q 34 52 50 89'),
    ],
  },
  {
    id: 'haus', word: 'Haus', initial: 'H', syllables: 1,
    shapes: [
      rect(62, 18, 9, 20),
      rect(22, 48, 56, 44),
      shape('M 12 50 L 50 12 L 88 50 Z'),
      rect(45, 66, 15, 26),
      rect(28, 56, 12, 12), line('M 34 56 L 34 68'), line('M 28 62 L 40 62'),
    ],
  },
  {
    id: 'fisch', word: 'Fisch', initial: 'F', syllables: 1,
    shapes: [
      shape('M 70 50 L 92 32 L 92 68 Z'),
      shape('M 14 50 C 30 26 62 26 76 50 C 62 74 30 74 14 50 Z'),
      dot(28, 46, 2.6),
      line('M 38 38 Q 45 50 38 62'),
      line('M 50 60 Q 56 66 62 60'),
    ],
  },
  {
    id: 'herz', word: 'Herz', initial: 'H', syllables: 1,
    shapes: [shape('M 50 88 C 20 66 6 48 12 30 C 18 12 42 12 50 30 C 58 12 82 12 88 30 C 94 48 80 66 50 88 Z')],
  },
  {
    id: 'hut', word: 'Hut', initial: 'H', syllables: 1,
    shapes: [
      ellipse(50, 72, 42, 11),
      shape('M 28 72 L 31 30 C 32 22 68 22 69 30 L 72 72 Z'),
      line('M 29.5 58 L 70.5 58'), line('M 30 52 L 70 52'),
    ],
  },
  {
    id: 'tasse', word: 'Tasse', initial: 'T', syllables: 2,
    shapes: [
      ellipse(46, 88, 36, 6),
      shape('M 66 44 C 90 40 90 72 64 72', 'none', { weight: 1.4 }),
      shape('M 22 34 L 28 82 C 30 88 62 88 64 82 L 70 34 Z'),
      ellipse(46, 34, 24, 6),
      line('M 38 24 Q 34 18 38 12'), line('M 50 24 Q 46 18 50 12'),
    ],
  },
  {
    id: 'blume', word: 'Blume', initial: 'B', syllables: 2,
    shapes: [
      line('M 50 48 L 50 96', 1.2),
      shape('M 50 78 Q 66 62 76 70 Q 66 84 50 78 Z'),
      ...around(50, 32, 15, 6, -Math.PI / 2).map(([x, y]) => circle(x, y, 10)),
      circle(50, 32, 9),
    ],
  },
];

export const ILLUSTRATIONS = new Map(ILLUSTRATION_LIST.map((i) => [i.id, i]));
export const ALL_ILLUSTRATIONS = ILLUSTRATION_LIST;

/** Bild zum Themenwort eines Buchstabens (M → Maus). Fehlt es, malen die Kinder selbst. */
export const THEME_ILLUSTRATION: Record<string, string> = {
  M: 'maus', A: 'affe', I: 'igel', O: 'ofen', L: 'loewe', S: 'sonne', E: 'esel', N: 'nase',
};

export function illustrationsStartingWith(upper: string): Illustration[] {
  return ILLUSTRATION_LIST.filter((i) => i.initial === upper);
}

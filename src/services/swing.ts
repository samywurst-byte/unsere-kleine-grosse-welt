import type { SwingPattern } from '../data/swingExercises';

/** Ein Strich als Punktfolge (x nach rechts, y nach unten). */
export type Stroke = [number, number][];

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/**
 * Schwung als Striche in einem Feld der Breite `width` und Höhe `height` (oben links = 0/0).
 * `period` ist die Länge einer Wiederholung. Kreise, Schnecken und Punkte sind einzelne Striche.
 */
export function swingStrokes(pattern: SwingPattern, width: number, height: number, period: number): Stroke[] {
  const h = height;
  const mid = h / 2;
  const reps = Math.max(1, Math.floor(width / Math.max(period, 1)));
  const w = pattern === 'line' ? width : reps * period;
  const sample = (fn: (t: number) => [number, number], from: number, to: number, steps: number): Stroke =>
    range(steps + 1).map((i) => fn(from + ((to - from) * i) / steps));

  switch (pattern) {
    case 'line':
      return [[[0, mid], [width, mid]]];
    case 'rain':
      return range(reps).map((i) => [[i * period + period / 2, 0], [i * period + period / 2, h]]);
    case 'wave':
      return [sample((x) => [x, mid - mid * Math.sin((2 * Math.PI * x) / period)], 0, w, reps * 32)];
    case 'zigzag':
      return [range(reps * 2 + 1).map((i) => [(i * period) / 2, i % 2 ? 0 : h])];
    case 'garland':
      // u u u: oben anfangen, unten rund, oben spitz
      return [sample((x) => [x, h * Math.abs(Math.sin((Math.PI * x) / period))], 0, w, reps * 32)];
    case 'arcade':
      // n n n: unten anfangen, oben rund, unten spitz
      return [sample((x) => [x, h - h * Math.abs(Math.sin((Math.PI * x) / period))], 0, w, reps * 32)];
    case 'loop': {
      // Schleifen wie ein laufendes l: Trochoide mit Schlaufe nach oben
      const a = period / (2 * Math.PI);
      const b = period * 0.28;
      const first = Math.PI;
      const pts = sample((t) => [a * t - b * Math.sin(t), mid + mid * Math.cos(t)], first, first + reps * 2 * Math.PI, reps * 48);
      const x0 = Math.min(...pts.map((p) => p[0]));
      return [pts.map(([x, y]) => [x - x0, y])];
    }
    case 'circle': {
      const rad = Math.min(h, period * 0.85) / 2;
      return range(reps).map((i) => sample((t) => [i * period + period / 2 + rad * Math.sin(t), mid - rad * Math.cos(t)], 0, 2 * Math.PI, 48));
    }
    case 'dots': {
      const rad = Math.min(h, period) * 0.3;
      return range(reps).map((i) => sample((t) => [i * period + period / 2 + rad * Math.sin(t), mid - rad * Math.cos(t)], 0, 2 * Math.PI, 24));
    }
    case 'spiral': {
      const rad = Math.min(h, period) / 2;
      const turns = 2.5;
      return range(reps).map((i) => sample((t) => {
        const rr = (rad * t) / (turns * 2 * Math.PI);
        return [i * period + period / 2 + rr * Math.sin(t), mid - rr * Math.cos(t)];
      }, 0, turns * 2 * Math.PI, 90));
    }
    case 'eight':
      return range(reps).map((i) => sample((t) => [i * period + period / 2 + (period * 0.45) * Math.sin(t), mid + mid * Math.sin(t) * Math.cos(t) * 1.9], 0, 2 * Math.PI, 72));
    case 'castle': {
      const pts: [number, number][] = [[0, h]];
      for (const i of range(reps)) {
        const x = i * period;
        pts.push([x, 0], [x + period / 2, 0], [x + period / 2, h], [x + period, h]);
      }
      return [pts];
    }
    case 'stairs': {
      // Treppe hinauf: Stufe für Stufe
      const rise = h / reps;
      const pts: [number, number][] = [[0, h]];
      for (const i of range(reps)) pts.push([i * period, h - (i + 1) * rise], [(i + 1) * period, h - (i + 1) * rise]);
      return [pts];
    }
  }
}

/** Nur der Anfang einer Zeile (für „selbst weitermalen“): der erste Kreis oder der Strich bis `upTo` (x). */
export function strokesUpTo(strokes: Stroke[], upTo: number): Stroke[] {
  if (!strokes.length) return [];
  if (strokes.length > 1) return [strokes[0]];
  const s = strokes[0];
  const over = s.findIndex(([x]) => x > upTo + 0.01);
  return [over > 1 ? s.slice(0, over) : s];
}

export function strokeToPath(stroke: Stroke, dx = 0, dy = 0): string {
  return stroke.map(([x, y], i) => `${i ? 'L' : 'M'}${(x + dx).toFixed(1)} ${(y + dy).toFixed(1)}`).join(' ');
}

/**
 * Schwungübungen: ein Blatt pro Kind und Woche, 8 Varianten je Altersstufe. Nach 8 Wochen (etwa 2 Monaten) wiederholen sie sich.
 * Kleine Kinder: große Linien, Kreise und Punkte. Kindergartenkinder: Wellen, Zickzack, Girlanden, Schleifen.
 * Vorschulkinder: ein Schwung, der zu Buchstaben führt, dazu Buchstaben und Ziffern in der Lineatur zum Nachspuren.
 */
import type { PackTrack } from '../types';

export type SwingPattern =
  | 'line' | 'rain' | 'wave' | 'zigzag' | 'garland' | 'arcade' | 'loop' | 'circle' | 'spiral' | 'eight' | 'castle' | 'stairs' | 'dots';

export type SwingLevel = 'toddler' | 'swing' | 'letters';

export interface SwingRow {
  pattern: SwingPattern;
  /** Höhe des Schwungs in pt. */
  height: number;
  /** Länge einer Wiederholung in pt (Kreise, Schnecken und Punkte: Abstand). */
  period: number;
  /** trace = ganze Zeile gestrichelt zum Nachfahren, start = nur der Anfang vorgemalt, dann selbst weiter. */
  style: 'trace' | 'start';
  /** Bild am Anfang und Ende (Illustrations-Id), nur bei den Kleinsten. */
  from?: string;
  to?: string;
}

export interface SwingSheet {
  title: string;
  rows: SwingRow[];
  /** Nur Vorschulstufe: Buchstaben und Ziffern zum Nachspuren. */
  letters?: string[];
  digits?: string[];
}

export const SWING_VARIANTS = 8;

export const PATTERN_NAME: Record<SwingPattern, string> = {
  line: 'Gerade Linie', rain: 'Regen', wave: 'Wellen', zigzag: 'Zickzack', garland: 'Girlanden', arcade: 'Bögen', loop: 'Schleifen',
  circle: 'Kreise', spiral: 'Schnecken', eight: 'Liegende Acht', castle: 'Burgmauer', stairs: 'Treppe', dots: 'Punkte tupfen',
};

export const SWING_INSTRUCTION: Record<SwingLevel, string> = {
  toddler: 'Mit dicken Wachsmalern oder Fingerfarbe. Erst mit dem Finger nachfahren, dann malen. Mitmalen und die Hand führen ist erlaubt.',
  swing: 'Erst mit dem Finger nachfahren, dann mit dem Stift. In den Zeilen mit nur einem Anfang selbst weitermalen. Langsam ist gut.',
  letters: 'Erst den Schwung, dann Buchstaben und Zahlen nachspuren. Immer oben anfangen, wie der Punkt zeigt. Lieber wenige schöne als viele schnelle.',
};

const r = (pattern: SwingPattern, height: number, period: number, style: SwingRow['style'] = 'trace', from?: string, to?: string): SwingRow =>
  ({ pattern, height, period, style, from, to });

const TODDLER: SwingSheet[] = [
  { title: 'Gerade Wege', rows: [r('line', 90, 0, 'trace', 'maus', 'apfel'), r('line', 90, 0, 'trace', 'ente', 'nest'), r('line', 90, 0, 'trace', 'ball', 'haus')] },
  { title: 'Es regnet', rows: [r('rain', 100, 34), r('rain', 100, 34), r('rain', 100, 34)] },
  { title: 'Große Kreise', rows: [r('circle', 110, 150), r('circle', 110, 150), r('circle', 110, 150)] },
  { title: 'Große Wellen', rows: [r('wave', 100, 200, 'trace', 'fisch', 'ente'), r('wave', 100, 200, 'trace', 'fisch', 'nest'), r('wave', 100, 200)] },
  { title: 'Punkte tupfen', rows: [r('dots', 60, 80), r('dots', 60, 80), r('dots', 60, 80), r('dots', 60, 80)] },
  { title: 'Berge', rows: [r('zigzag', 100, 160, 'trace', 'maus', 'baum'), r('zigzag', 100, 160), r('zigzag', 100, 160)] },
  { title: 'Schnecken', rows: [r('spiral', 120, 160), r('spiral', 120, 160), r('spiral', 120, 160)] },
  { title: 'Bunt gemischt', rows: [r('line', 90, 0, 'trace', 'igel', 'apfel'), r('circle', 100, 150), r('wave', 100, 200)] },
];

const SWING: SwingSheet[] = [
  { title: 'Wellen', rows: [r('wave', 70, 100), r('wave', 50, 70), r('wave', 50, 70, 'start'), r('wave', 32, 50), r('wave', 32, 50, 'start')] },
  { title: 'Zickzack', rows: [r('zigzag', 70, 70), r('zigzag', 50, 50), r('zigzag', 50, 50, 'start'), r('zigzag', 32, 36), r('zigzag', 32, 36, 'start')] },
  { title: 'Girlanden und Bögen', rows: [r('garland', 60, 70), r('garland', 40, 50), r('garland', 40, 50, 'start'), r('arcade', 60, 70), r('arcade', 40, 50, 'start')] },
  { title: 'Kreise und Schnecken', rows: [r('circle', 60, 80), r('circle', 40, 56), r('circle', 40, 56, 'start'), r('spiral', 70, 95), r('spiral', 70, 95, 'start')] },
  { title: 'Schleifen', rows: [r('loop', 60, 60), r('loop', 45, 48), r('loop', 45, 48, 'start'), r('eight', 60, 130), r('eight', 60, 130, 'start')] },
  { title: 'Burg und Treppe', rows: [r('castle', 50, 60), r('castle', 40, 50, 'start'), r('stairs', 60, 80), r('stairs', 60, 80, 'start'), r('rain', 50, 24)] },
  { title: 'Wellen und Zacken', rows: [r('wave', 60, 90), r('zigzag', 60, 60), r('wave', 40, 60, 'start'), r('zigzag', 40, 46, 'start'), r('garland', 40, 50)] },
  { title: 'Alles gemischt', rows: [r('garland', 50, 60), r('arcade', 50, 60), r('loop', 50, 52), r('spiral', 60, 85), r('wave', 40, 60, 'start')] },
];

/** In der Lineatur: Höhe wird beim Zeichnen an das Mittelband angepasst. */
const LETTERS: SwingSheet[] = [
  { title: 'Bögen, M und A', rows: [r('arcade', 0, 26), r('arcade', 0, 26, 'start')], letters: ['M', 'm', 'A', 'a'], digits: ['1', '2'] },
  { title: 'Girlanden, I und O', rows: [r('garland', 0, 26), r('garland', 0, 26, 'start')], letters: ['I', 'i', 'O', 'o'], digits: ['3', '4'] },
  { title: 'Schleifen, L und S', rows: [r('loop', 0, 22), r('loop', 0, 22, 'start')], letters: ['L', 'l', 'S', 's'], digits: ['5', '6'] },
  { title: 'Wellen, E und N', rows: [r('wave', 0, 34), r('wave', 0, 34, 'start')], letters: ['E', 'e', 'N', 'n'], digits: ['7', '8'] },
  { title: 'Zickzack, T und R', rows: [r('zigzag', 0, 24), r('zigzag', 0, 24, 'start')], letters: ['T', 't', 'R', 'r'], digits: ['9', '0'] },
  { title: 'Kreise, U und D', rows: [r('circle', 0, 30), r('circle', 0, 30, 'start')], letters: ['U', 'u', 'D', 'd'], digits: ['1', '3'] },
  { title: 'Burgmauer, W und F', rows: [r('castle', 0, 26), r('castle', 0, 26, 'start')], letters: ['W', 'w', 'F', 'f'], digits: ['2', '5'] },
  { title: 'Bögen, H und K', rows: [r('arcade', 0, 26), r('garland', 0, 26, 'start')], letters: ['H', 'h', 'K', 'k'], digits: ['6', '8'] },
];

export const SWING_SHEETS: Record<SwingLevel, SwingSheet[]> = { toddler: TODDLER, swing: SWING, letters: LETTERS };

/** Welche Stufe zu welcher Spur im Lernpaket passt. */
export function swingLevelForTrack(track: PackTrack): SwingLevel | null {
  if (track === 'toddler') return 'toddler';
  if (track === 'preschool') return 'swing';
  if (track === 'letters') return 'letters';
  // Schulkinder (reading, math) brauchen keine Schwungblätter mehr.
  return null;
}

/** Variante 0..7 aus der Kalenderwoche: jede Woche die nächste, nach 8 Wochen von vorn. */
export const swingVariantForWeek = (isoWeek: number) => (((isoWeek - 1) % SWING_VARIANTS) + SWING_VARIANTS) % SWING_VARIANTS;

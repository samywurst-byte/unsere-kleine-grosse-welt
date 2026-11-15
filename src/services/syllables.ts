import { EARLY_SYLLABLE_WORDS, SYLLABLE_ONSETS, SYLLABLE_VOWELS, WEEK_WORD_PRIORITY } from '../data/syllableMethod';
import { READ_WORDS } from '../data/readingContent';
import { canRead } from './projects';
import { graphemes, plain } from './reading';

/**
 * Silbenmethode: Silben und Wörter nur aus Buchstaben, die das Kind schon kennengelernt hat.
 * Rein und deterministisch; der Zufall kommt von außen.
 */

type Rnd = () => number;

function shuffle<T>(items: T[], rnd: Rnd): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const isSyllableVowel = (g: string) => SYLLABLE_VOWELS.includes(g);

/** Offene Silben (Mitlaut + Silbenmacher) aus bekannten Lauten, die mit dem Fokus zuerst: MA, ME, MO ... */
export function openSyllables(known: string[], focus: string[] = []): string[] {
  const set = new Set(known);
  const onsets = SYLLABLE_ONSETS.filter((c) => set.has(c));
  const vowels = SYLLABLE_VOWELS.filter((v) => set.has(v));
  const all = onsets.flatMap((c) => vowels.map((v) => c + v));
  const inFocus = (s: string) => focus.some((f) => s.startsWith(f) || s.endsWith(f));
  return [...all.filter(inFocus), ...all.filter((s) => !inFocus(s))];
}

/** Geht die Silbenmethode schon? Dafür braucht es mindestens einen Mitlaut und einen Silbenmacher. */
export const canBuildSyllables = (known: string[]) => openSyllables(known).length > 0;

/**
 * Silbenteppich: vier Zeilen zum Vorlesen, erst groß (MA), dann klein (ma).
 * Die Silben mit dem neuen Laut kommen öfter vor. Einzelne Silbenmacher (O wie in O-ma) sind auch Silben.
 */
export function syllableCarpet(known: string[], focus: string[], rnd: Rnd, cols = 5, rows = 4): string[][] {
  const syl = openSyllables(known, focus);
  if (!syl.length) return [];
  const focused = syl.filter((s) => focus.some((f) => s.startsWith(f) || s.endsWith(f)));
  const vowels = SYLLABLE_VOWELS.filter((v) => known.includes(v));
  // Fokus-Silben doppelt gewichten, damit der neue Laut oft dran ist
  const pool = [...focused, ...focused, ...syl, ...vowels.slice(0, 2)];
  const out: string[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: string[] = [];
    let bag: string[] = [];
    while (row.length < cols) {
      if (!bag.length) bag = shuffle(pool, rnd);
      const next = bag.pop()!;
      // Nicht zweimal dieselbe Silbe nebeneinander, wenn es anders geht
      if (row[row.length - 1] === next && new Set(pool).size > 1) continue;
      row.push(next);
    }
    out.push(r < rows / 2 ? row : row.map((s) => s.toLowerCase()));
  }
  return out;
}

/** Alle Silbenwörter, früheste zuerst, ohne Doppelte. */
const ALL_WORDS: string[] = [...new Set([...EARLY_SYLLABLE_WORDS, ...READ_WORDS.map((w) => w.w)])];

/** Strichzeichnung zu einem Wort, wenn es eine gibt. */
export function wordIllustration(word: string): string | undefined {
  return READ_WORDS.find((w) => w.w === word)?.ill;
}

const hasFocus = (word: string, focus: string[]) => graphemes(plain(word)).some((g) => focus.includes(g));

/** Wörter, die das Kind mit seinen Lauten lesen kann; mit dem neuen Laut zuerst, dann Wörter mit mehr Silben. */
export function syllableWords(known: string[], focus: string[], rnd: Rnd, n = 6): string[] {
  // Nur Wörter, die man malen kann oder die mindestens zwei Silben haben (kein „am“ zum Malen)
  const readable = ALL_WORDS.filter((w) => canRead(plain(w), known) && (w.includes('-') || !!wordIllustration(w)));
  const withFocus = shuffle(readable.filter((w) => hasFocus(w, focus)), rnd);
  const rest = shuffle(readable.filter((w) => !hasFocus(w, focus)), rnd);
  // Zweisilbige Wörter vorziehen: genau dafür ist das Silbenlesen da
  const twoFirst = (list: string[]) => [...list.filter((w) => w.includes('-')), ...list.filter((w) => !w.includes('-'))];
  return [...twoFirst(withFocus), ...twoFirst(rest)].slice(0, n);
}

/** Wort der Woche: ein Wort, das das Kind im Alltag wirklich benutzen kann (MAMA, OMA ...). */
export function weekWord(known: string[], focus: string[], words: string[]): string | undefined {
  const readable = WEEK_WORD_PRIORITY.filter((w) => canRead(plain(w), known));
  return readable.find((w) => hasFocus(w, focus)) ?? readable[0] ?? words.find((w) => w.includes('-')) ?? words[0];
}

/** Eine Silbenkarte: Text so, wie er im Wort steht, Farbe 0 = blau (1., 3. Silbe), 1 = rot (2., 4. Silbe). */
export interface SyllableCard { text: string; color: 0 | 1 }

/**
 * Silbenkarten zum Ausschneiden: alle Silben der Wörter in ihrer Farbe, aufgefüllt mit Teppich-Silben bis `count`.
 * Daraus lassen sich die Wörter legen (Ma + ma = Mama).
 */
export function syllableCards(words: string[], extra: string[], count = 16): SyllableCard[] {
  const cards: SyllableCard[] = [];
  const add = (card: SyllableCard) => {
    if (cards.length < count && !cards.some((c) => c.text === card.text && c.color === card.color)) cards.push(card);
  };
  for (const w of words) w.split('-').forEach((text, i) => add({ text, color: (i % 2) as 0 | 1 }));
  for (const s of extra) {
    const cap = s[0].toUpperCase() + s.slice(1).toLowerCase();
    add({ text: cap, color: 0 });
    add({ text: s.toLowerCase(), color: 1 });
  }
  // Zu wenige? Die Wortsilben noch einmal, damit Wörter wie Ma-ma zweimal gelegt werden können
  for (let k = 0; cards.length < count && k < cards.length; k++) cards.push({ ...cards[k] });
  return cards;
}

/** "Ma-ma" → "Ma + ma" (zum Legen). */
export const recipe = (word: string) => word.split('-').join(' + ');

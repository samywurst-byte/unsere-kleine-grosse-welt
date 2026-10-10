import { CHECK_SENTENCES, DRAW_SENTENCES, READ_TEXTS, READ_WORDS, SIGHT_WORDS, SOUND_BOX_WORDS, type CheckSentence, type ReadText } from '../data/readingContent';
import { LETTERS } from '../data/readingCurriculum';
import { atLeastMostly, type GoalState } from './learning';
import { canRead, knownLetters } from './projects';

/**
 * Lesestufen 6 bis 9: was ein Kind schon lesen kann und welche Lese- und Schreibblätter es bekommt.
 * Rein und deterministisch; der Zufall kommt von außen (fester Startwert je Woche und Kind).
 */

type Rnd = () => number;

/** "Ra-ke-te" → "Rakete" */
export const plain = (s: string) => s.replace(/-/g, '');

/** "Ra-ke-te" → ["Ra", "ke", "te"] */
export const syllablesOf = (word: string) => word.split('-');

const COMBOS = LETTERS.filter((l) => l.combo && l.upper !== 'ST' && l.upper !== 'SP').map((l) => l.upper).sort((a, b) => b.length - a.length);

/** Laute eines lautgetreuen Wortes: "Maus" → M, AU, S. Für Lautkästchen. */
export function graphemes(word: string): string[] {
  const w = word.toUpperCase();
  const out: string[] = [];
  for (let i = 0; i < w.length;) {
    const combo = COMBOS.find((c) => w.startsWith(c, i));
    out.push(combo ?? w[i]);
    i += combo?.length ?? 1;
  }
  return out;
}

/** Wörter eines Satzes ohne Satzzeichen und Silbenstriche. */
export function wordsOf(sentence: string): string[] {
  return plain(sentence).split(/\s+/).map((w) => w.replace(/[.,!?:;„“"…]/g, '')).filter(Boolean);
}

export const sentenceReadable = (s: string, known: string[]) => wordsOf(s).every((w) => canRead(w, known));

export function readableWords(known: string[]): string[] {
  return READ_WORDS.filter((w) => canRead(plain(w.w), known)).map((w) => w.w);
}

export const readableChecks = (known: string[]) => CHECK_SENTENCES.filter((c) => sentenceReadable(c.s, known));
export const readableDrawSentences = (known: string[]) => DRAW_SENTENCES.filter((s) => sentenceReadable(s, known));
export const readableTexts = (known: string[]) => READ_TEXTS.filter((t) => sentenceReadable(t.text, known));

function shuffle<T>(items: T[], rnd: Rnd): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Nur Lesbares in fester Zufallsfolge, notfalls weniger als n. Erst wenn gar nichts lesbar ist
 * (Freigabe ohne sichere Buchstaben), kommt der ganze Vorrat dran.
 */
function pick<T>(readable: T[], all: T[], n: number, rnd: Rnd): T[] {
  return shuffle(readable.length ? readable : all, rnd).slice(0, n);
}

// ------------------------------------------------------------- Blätter

export type ReadingSpec =
  | { kind: 'read-draw'; words: string[] }
  | { kind: 'word-copy'; words: string[] }
  | { kind: 'sound-boxes'; items: { ill: string; word: string; sounds: number }[] }
  | { kind: 'sentence-check'; items: CheckSentence[]; sightWords?: string[] }
  | { kind: 'sentence-draw'; sentences: string[] }
  | { kind: 'sentence-write'; model: string }
  | { kind: 'read-aloud'; text: ReadText }
  | { kind: 'text-questions'; text: ReadText; questions: { q: string; options: string[] }[] };

export interface ReadingPage { spec: ReadingSpec; goals: { goalId: string; label: string }[] }

export const READ_ORDER = ['read.comprehension', 'read.fluency', 'read.sentences', 'read.words'] as const;
export const WRITE_ORDER = ['read.write-sentence', 'read.write-sounds', 'read.write-copy'] as const;

/** Höchste freigegebene Fertigkeit aus einer Reihe. */
function highest(states: GoalState[], order: readonly string[]): string | undefined {
  const released = new Set(states.filter((s) => s.released).map((s) => s.goal.id));
  return order.find((id) => released.has(id));
}

export function readingPageFor(goalId: string, states: GoalState[], rnd: Rnd): ReadingPage | null {
  const known = knownLetters(states);
  const sight = states.find((s) => s.goal.id === 'read.sight-words');
  switch (goalId) {
    case 'read.words':
      return { goals: [{ goalId, label: 'Kurze Wörter lesen' }], spec: { kind: 'read-draw', words: pick(readableWords(known), READ_WORDS.map((w) => w.w), 6, rnd) } };
    case 'read.sentences': {
      const checks = readableChecks(known);
      const items = pick(checks, CHECK_SENTENCES, 8, rnd);
      // Abwechselnd: „Stimmt das?“ oder Lesen und malen; mit wenigen lesbaren Prüfsätzen immer malen
      if (rnd() < 0.5 || checks.length < 4) {
        const draw = pick(readableDrawSentences(known), DRAW_SENTENCES, 3, rnd);
        return { goals: [{ goalId, label: 'Kurze Sätze lesen' }], spec: { kind: 'sentence-draw', sentences: draw } };
      }
      return {
        goals: [{ goalId, label: 'Kurze Sätze lesen' }],
        spec: { kind: 'sentence-check', items, ...(sight?.released ? { sightWords: shuffle(SIGHT_WORDS, rnd).slice(0, 10) } : {}) },
        ...(sight?.released ? { goals: [{ goalId, label: 'Kurze Sätze lesen' }, { goalId: 'read.sight-words', label: 'Kleine Wörter auf einen Blick' }] } : {}),
      };
    }
    case 'read.fluency': {
      const texts = readableTexts(known);
      const pool = texts.length ? texts : READ_TEXTS.filter((t) => t.level === 1);
      // Für flüssiges Lesen eher kurze Texte
      const short = pool.filter((t) => t.level <= 2);
      const text = (short.length ? short : pool)[Math.floor(rnd() * (short.length || pool.length))];
      return { goals: [{ goalId, label: 'Flüssiger lesen' }], spec: { kind: 'read-aloud', text } };
    }
    case 'read.comprehension': {
      const texts = readableTexts(known);
      const pool = texts.length ? texts : READ_TEXTS;
      const text = pool[Math.floor(rnd() * pool.length)];
      return {
        goals: [{ goalId, label: 'Fragen zum Text beantworten' }],
        spec: { kind: 'text-questions', text, questions: text.questions.map((q) => ({ q: q.q, options: shuffle(q.options, rnd) })) },
      };
    }
    case 'read.write-copy':
      return { goals: [{ goalId, label: 'Wörter abschreiben' }], spec: { kind: 'word-copy', words: pick(readableWords(known), READ_WORDS.map((w) => w.w), 6, rnd) } };
    case 'read.write-sounds': {
      const items = shuffle(SOUND_BOX_WORDS, rnd).slice(0, 6).map((ill) => {
        const word = READ_WORDS.find((w) => w.ill === ill)?.w ?? ill;
        return { ill, word: plain(word), sounds: graphemes(plain(word)).length };
      });
      return { goals: [{ goalId, label: 'Schreiben, was man hört' }], spec: { kind: 'sound-boxes', items } };
    }
    case 'read.write-sentence': {
      const model = pick(readableDrawSentences(known), DRAW_SENTENCES, 1, rnd)[0];
      return { goals: [{ goalId, label: 'Einen Satz schreiben' }], spec: { kind: 'sentence-write', model } };
    }
    default:
      return null;
  }
}

/**
 * Lese- und Schreibblatt für ein Kind: je eins zur höchsten freigegebenen Fertigkeit.
 * `fallback`: Schulkinder ohne Freigaben bekommen trotzdem Wörter lesen und abschreiben.
 */
export function readingPages(states: GoalState[], rnd: Rnd, fallback = false): ReadingPage[] {
  const read = highest(states, READ_ORDER) ?? (fallback ? 'read.words' : undefined);
  const write = highest(states, WRITE_ORDER) ?? (fallback ? 'read.write-copy' : undefined);
  const out: ReadingPage[] = [];
  for (const id of [read, write]) {
    const p = id ? readingPageFor(id, states, rnd) : null;
    if (p) out.push(p);
  }
  return out;
}

/** Hat das Kind die Lesestufen ab 6 schon freigegeben? */
export const readsWords = (states: GoalState[]) => states.some((s) => s.released && s.goal.stage >= 6);

/** Für die Lesekiste am Tablet: Wörter und Sätze, die das Kind schon lesen kann. */
export function readingBox(states: GoalState[]): { words: string[]; sentences: string[]; showSentences: boolean } | null {
  const by = new Map(states.map((s) => [s.goal.id, s]));
  const syllables = by.get('read.syllable-reading');
  if (!syllables?.released) return null;
  const known = knownLetters(states);
  const words = readableWords(known);
  const sentencesOn = !!by.get('read.sentences')?.released || atLeastMostly(by.get('read.words')?.status ?? 'not-started');
  const sentences = sentencesOn ? [...readableDrawSentences(known), ...readableChecks(known).map((c) => c.s)] : [];
  return { words, sentences, showSentences: sentencesOn };
}

import type { FamilyDatabase } from '../database/db';
import { ALL_ILLUSTRATIONS, ILLUSTRATIONS, THEME_ILLUSTRATION, illustrationsStartingWith, type Illustration } from '../data/illustrations';
import { LETTERS, letterGoalId, type LetterInfo } from '../data/readingCurriculum';
import type { ChildProfile, DateKey, LearningPack, LearningRelease, PackTrack } from '../types';
import { ageInYears, fromDateKey } from '../utils/dates';
import { newId } from '../utils/id';
import { pathPhase, todaysLetter, suggestions, type GoalState } from './learning';
import { currentMathGoals, mathStates } from './math';
import { extraMathPage, mathMemoryPairs, mathPageFor, type MathPage, type MathSpec } from './mathSheets';
import type { LearningGoal } from '../data/readingCurriculum';
import { SWING_SHEETS, lettersSheetFor, swingLevelForTrack, swingVariantForWeek, type SwingLevel, type SwingSheet } from '../data/swingExercises';
import { getISOWeek } from 'date-fns';
import { coloringForWeek } from '../data/coloringPages';
import { craftForWeek, type Craft } from '../data/crafts';
import type { Drawing } from '../data/drawKit';
import { plain, readingPages, readsWords, type ReadingSpec } from './reading';
import { soundAnimal, type SoundAnimal } from '../data/syllableMethod';
import { canBuildSyllables, openSyllables, recipe, syllableCards, syllableCarpet, syllableWords, weekWord, wordIllustration, type SyllableCard } from './syllables';

/**
 * Lernpaket der Woche: ein gemeinsames Thema (Buchstabe mit Bildwort), passende Blätter für jedes Kind,
 * ein gemeinsames Spiel und der Beobachtungsbogen für die Eltern.
 * Die Planung ist rein und deterministisch: dasselbe Paket ergibt beim Nachdrucken dieselben Seiten.
 */

export const TRACK_LABEL: Record<PackTrack, string> = {
  letters: 'Buchstaben und Laute',
  reading: 'Lesen und Schreiben',
  preschool: 'Zählen, Silben, Anfangslaute',
  toddler: 'Malen und Kleben',
  math: 'Nur Rechnen (Schule)',
  skip: 'Diese Woche nicht',
};

const VOWELS = ['A', 'E', 'I', 'O', 'U', 'Ä', 'Ö', 'Ü'];

// ------------------------------------------------------------- Seitentypen

export type PageSpec =
  | { kind: 'letter-intro'; letter: LetterInfo; illustration?: string }
  | { kind: 'letter-hunt'; letter: LetterInfo; grid: string[][]; targets: number; pictures: { id: string; match: boolean }[] }
  | { kind: 'review-hunt'; letters: LetterInfo[]; grid: string[][]; targets: number }
  | { kind: 'onset-sort'; letters: LetterInfo[]; pictures: { id: string; initial: string }[] }
  | { kind: 'review-write'; letters: LetterInfo[] }
  | { kind: 'syllables'; letter: LetterInfo; syllables: string[] }
  | { kind: 'word-trace'; letter: LetterInfo; illustration?: string; name: string }
  | { kind: 'counting'; rows: { count: number; illustration: string }[] }
  | { kind: 'syllable-onset'; letter: LetterInfo; pictures: string[]; onset: boolean }
  | { kind: 'coloring'; illustration: string }
  | { kind: 'memory'; cards: string[]; players: { name: string; track: PackTrack }[] }
  | { kind: 'math'; title: string; math: MathSpec }
  | { kind: 'reading'; title: string; reading: ReadingSpec }
  | { kind: 'math-memory'; heading: string; cards: string[] }
  | { kind: 'observation'; rows: SheetChild[] }
  | { kind: 'swing'; level: SwingLevel; variant: number; sheet: SwingSheet }
  | { kind: 'picture'; theme: string; index: number; title: string; drawing: Drawing }
  | { kind: 'craft'; craft: Craft }
  // Silbenmethode
  | { kind: 'sound-week'; childName: string; letters: LetterInfo[]; animals: SoundAnimal[]; days: WeekDay[]; goals: string[]; review: boolean }
  | { kind: 'sound-animal'; letter: LetterInfo; animal: SoundAnimal; pictures: { id: string; match: boolean }[] }
  | { kind: 'syllable-carpet'; letters: LetterInfo[]; carpet: string[][]; slide: string[] }
  | { kind: 'syllable-words'; words: { word: string; options: string[]; answer?: string }[] }
  | { kind: 'syllable-cards'; cards: SyllableCard[]; recipes: string[] }
  | { kind: 'syllable-write'; syllables: string[]; word?: string };

/** Ein Tag der Silbenwoche: 5 bis 10 Minuten gemeinsam. */
export interface WeekDay { day: string; title: string; todo: string }

/** Eine Zeile im Beobachtungsbogen. Ohne Lernziel ("free.…") wird sie nur für euch festgehalten. */
export interface SheetRow { label: string; goalId: string }
export interface SheetChild { childId: string; name: string; goals: SheetRow[] }

export type PageSection = 'child' | 'game' | 'observation';

export interface PlannedPage {
  id: string;
  section: PageSection;
  childId?: string;
  childName?: string;
  title: string;
  spec: PageSpec;
}

export interface PackPlan {
  pack: LearningPack;
  letter: LetterInfo;
  title: string;
  pages: PlannedPage[];
}

/** Druckauswahl: alles, ein Kind, nur das Spiel oder nur der Beobachtungsbogen. */
export type PrintScope = 'all' | 'game' | 'observation' | 'extras' | `child:${string}`;

export function pagesForScope(plan: PackPlan, scope: PrintScope): PlannedPage[] {
  if (scope === 'all') return plan.pages;
  if (scope === 'game') return plan.pages.filter((p) => p.section === 'game');
  if (scope === 'observation') return plan.pages.filter((p) => p.section === 'observation');
  if (scope === 'extras') return plan.pages.filter((p) => p.spec.kind === 'craft' || p.spec.kind === 'picture');
  const childId = scope.slice('child:'.length);
  return plan.pages.filter((p) => p.childId === childId);
}

// ------------------------------------------------------------- Zufall mit festem Startwert

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function seededRandom(seed: string): () => number {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rnd: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ------------------------------------------------------------- Vorgaben

export function letterInfo(upper: string): LetterInfo {
  return LETTERS.find((l) => l.upper === upper) ?? LETTERS[0];
}

export function themeTitle(letter: LetterInfo): string {
  return `${letter.upper} wie ${letter.word}`;
}

/** "M", "M und A", "M, A und I" */
export const joinDe = (items: string[]) => items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} und ${items[items.length - 1]}`;

/** Buchstaben einer Wiederholungswoche (leer = normale Woche). */
export function reviewLetters(pack: Pick<LearningPack, 'review'>): LetterInfo[] {
  return (pack.review ?? []).map((u) => LETTERS.find((l) => l.upper === u)).filter((l): l is LetterInfo => !!l);
}

/** Titel eines Pakets: "M wie Maus" oder "Wiederholung: M und A". */
export function packTitle(pack: Pick<LearningPack, 'letter' | 'review'>): string {
  const review = reviewLetters(pack);
  return review.length ? `Wiederholung: ${joinDe(review.map((l) => l.upper))}` : themeTitle(letterInfo(pack.letter));
}

/**
 * Nach zwei Paketen mit neuem Buchstaben schlägt die App eine Wiederholungswoche vor, mit den Buchstaben dieser beiden Pakete.
 * Gezählt werden nur Pakete, in denen ein Kind Buchstabenblätter hatte. Danach braucht es wieder zwei neue.
 */
export function reviewSuggestion(packs: LearningPack[], weekStart: DateKey): string[] | null {
  const byWeek = new Map<DateKey, LearningPack>();
  for (const p of [...packs].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) if (p.weekStart < weekStart) byWeek.set(p.weekStart, p);
  const last = [...byWeek.values()]
    .filter((p) => p.children.some((c) => c.track === 'letters'))
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
    .slice(0, 2);
  if (last.length < 2 || last.some((p) => p.review?.length)) return null;
  return [...new Set([last[1].letter, last[0].letter])];
}

/** Fortlaufende Wochennummer über Jahresgrenzen hinweg. */
export function weekIndex(weekStart: DateKey): number {
  const [y, m, d] = weekStart.split('-').map(Number);
  return Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(2024, 0, 1)) / (7 * 86_400_000));
}
const mod = (n: number, k: number) => ((n % k) + k) % k;

/** Buchstaben mit eigenem Bildwort, durch die die Vorschulblätter Woche für Woche wandern. */
const PICTURE_LETTERS = Object.keys(THEME_ILLUSTRATION);

/**
 * Anfangslaut für die Vorschulblätter: wandert jede Woche weiter, unabhängig vom Buchstaben des Lesekinds.
 * So bekommt das Vorschulkind auch dann Neues, wenn das große Kind einen Buchstaben länger übt oder wiederholt.
 */
export function preschoolLetter(weekStart: DateKey): LetterInfo {
  return letterInfo(PICTURE_LETTERS[mod(weekIndex(weekStart), PICTURE_LETTERS.length)]);
}

/** Ausmalbild für die Kleinsten: jede Woche ein anderes aus allen Bildern. */
export function toddlerPicture(weekStart: DateKey): string {
  return ALL_ILLUSTRATIONS[mod(weekIndex(weekStart), ALL_ILLUSTRATIONS.length)].id;
}

/** Welche Blätter ein Kind bekommt: Schulkind → keine, Lesepfad aktiv → Buchstaben, ab 3 Jahren → Vorschule, sonst Malen. */
export function defaultTrack(child: ChildProfile, today: DateKey, states: GoalState[]): PackTrack {
  const phase = pathPhase(child, today).kind;
  // Schulkinder machen ihre Hausaufgaben; Übungsblätter zum Unterricht nur, wenn eingeschaltet
  if (phase === 'in-school') return child.schoolPractice ? (readsWords(states) ? 'reading' : 'math') : 'skip';
  if (phase === 'active' || states.some((s) => s.released)) return 'letters';
  const age = child.birthDate ? ageInYears(child.birthDate, today) : child.ageStage === 'small' ? 2 : 4;
  return age >= 3 ? 'preschool' : 'toddler';
}

/** Themenbuchstabe: der Buchstabe, an dem das Lesekind gerade arbeitet, sonst der nächste Vorschlag, sonst M. */
export function defaultLetter(readingStates: { states: GoalState[]; releases: LearningRelease[]; childId: string }[], today: DateKey): string {
  for (const { states, releases, childId } of readingStates) {
    const current = todaysLetter(states);
    if (current?.goal.letter && (current.status === 'introducing' || current.status === 'practising' || current.status === 'review')) {
      return current.goal.letter.upper;
    }
    const next = suggestions(states, releases, childId, today).find((s) => s.kind === 'release' && s.goal.kind === 'letter');
    if (next?.goal.letter) return next.goal.letter.upper;
    if (current?.goal.letter) return current.goal.letter.upper;
  }
  return LETTERS[0].upper;
}

// ------------------------------------------------------------- Bausteine je Seite

function themeIllustration(letter: LetterInfo): string | undefined {
  return THEME_ILLUSTRATION[letter.upper];
}

const DISTRACTOR_UPPER = ['A', 'E', 'I', 'O', 'U', 'L', 'S', 'N', 'T', 'R', 'H', 'K', 'B', 'D', 'F', 'W', 'M'];
const COMBO_TOKENS = ['EI', 'AU', 'SCH', 'CH', 'EU', 'IE', 'ST', 'SP', 'PF', 'QU'];

/** Buchstabenraster: Zielbuchstaben groß und klein zwischen anderen Buchstaben. */
export function letterGrid(letter: LetterInfo, rnd: () => number): { grid: string[][]; targets: number } {
  const cols = letter.combo ? 5 : 7;
  const rows = 6;
  const total = rows * cols;
  const targets = letter.combo ? 8 : 10;
  const pool = letter.combo
    ? COMBO_TOKENS.filter((t) => t !== letter.upper).flatMap((t) => [t, t.toLowerCase()])
    : DISTRACTOR_UPPER.filter((u) => u !== letter.upper && u !== letter.lower.toUpperCase())
      .flatMap((u) => [u, u.toLowerCase()])
      // I und l sehen in der Grundschrift gleich aus, als Ablenker zu verwirrend
      .filter((t) => t !== 'I' && t !== 'l');
  const tokens: string[] = [];
  for (let i = 0; i < targets; i++) tokens.push(i % 2 === 0 ? letter.upper : letter.lower);
  while (tokens.length < total) tokens.push(pool[Math.floor(rnd() * pool.length)]);
  const mixed = shuffle(tokens, rnd);
  return { grid: Array.from({ length: rows }, (_, r) => mixed.slice(r * cols, r * cols + cols)), targets };
}

/** Wiederholungsraster: alle Buchstaben der Wiederholung groß und klein zwischen anderen. */
export function reviewGrid(letters: LetterInfo[], rnd: () => number): { grid: string[][]; targets: number } {
  const combo = letters.some((l) => l.combo || l.upper.length > 1);
  const cols = combo ? 5 : 7;
  const rows = 6;
  const per = letters.length > 2 ? 4 : 6;
  const own = new Set(letters.flatMap((l) => [l.upper, l.lower, l.lower.toUpperCase()]));
  const pool = (combo ? [...COMBO_TOKENS, ...DISTRACTOR_UPPER] : DISTRACTOR_UPPER)
    .filter((u) => !own.has(u))
    .flatMap((u) => [u, u.toLowerCase()])
    .filter((t) => t !== 'I' && t !== 'l' && !own.has(t));
  const tokens: string[] = [];
  for (const l of letters) for (let i = 0; i < per; i++) tokens.push(i % 2 === 0 ? l.upper : l.lower);
  const targets = tokens.length;
  while (tokens.length < rows * cols) tokens.push(pool[Math.floor(rnd() * pool.length)]);
  const mixed = shuffle(tokens, rnd);
  return { grid: Array.from({ length: rows }, (_, r) => mixed.slice(r * cols, r * cols + cols)), targets };
}

/** Bilder zum Sortieren nach Anfangslaut: bis zu drei je Buchstabe, nur wenn mindestens zwei Buchstaben Bilder haben. */
export function sortPictures(letters: LetterInfo[], rnd: () => number): { letters: LetterInfo[]; pictures: { id: string; initial: string }[] } {
  const withPics = letters.filter((l) => illustrationsStartingWith(l.upper).length > 0);
  if (withPics.length < 2) return { letters: [], pictures: [] };
  const per = withPics.length > 2 ? 2 : 3;
  const pictures = withPics.flatMap((l) => shuffle(illustrationsStartingWith(l.upper), rnd).slice(0, per).map((i) => ({ id: i.id, initial: l.upper })));
  return { letters: withPics, pictures: shuffle(pictures, rnd).slice(0, 6) };
}

function otherPictures(upper: string, exclude: Set<string>): Illustration[] {
  return ALL_ILLUSTRATIONS.filter((i) => i.initial !== upper && !exclude.has(i.id));
}

/** Bilder für die Anlautsuche: bis zu drei mit dem Themenlaut, der Rest mit anderen Anfangslauten. */
function onsetPictures(letter: LetterInfo, count: number, rnd: () => number): { id: string; match: boolean }[] {
  const matches = shuffle(illustrationsStartingWith(letter.upper), rnd).slice(0, Math.min(3, count - 2));
  if (!matches.length) return [];
  const used = new Set(matches.map((m) => m.id));
  const others = shuffle(otherPictures(letter.upper, used), rnd).slice(0, count - matches.length);
  return shuffle([...matches.map((m) => ({ id: m.id, match: true })), ...others.map((o) => ({ id: o.id, match: false }))], rnd);
}

/** Offene Silben aus dem Themenbuchstaben und schon freigegebenen Buchstaben (MA, MI, MO ...). */
export function syllablesFor(letter: LetterInfo, knownUppers: string[]): string[] {
  if (letter.combo || letter.upper.length > 1) return [];
  const known = new Set([...knownUppers, letter.upper]);
  const isVowel = VOWELS.includes(letter.upper);
  const out = isVowel
    ? [...known].filter((u) => !VOWELS.includes(u) && /^[A-Z]$/.test(u)).map((c) => c + letter.upper)
    : VOWELS.filter((v) => known.has(v)).map((v) => letter.upper + v);
  return out.slice(0, 5);
}

export const READING_TITLE: Record<ReadingSpec['kind'], string> = {
  'read-draw': 'Lesen und malen',
  'word-copy': 'Wörter abschreiben',
  'sound-boxes': 'Schreib, was du hörst',
  'sentence-check': 'Stimmt das?',
  'sentence-draw': 'Lesen und malen',
  'sentence-write': 'Einen Satz schreiben',
  'read-aloud': 'Lesen wie ein Profi',
  'text-questions': 'Lesen und ankreuzen',
};

/** Lese- und Schreibblätter ab Stufe 6 mit ihren Zeilen für den Beobachtungsbogen. */
function readingSpecs(states: GoalState[], rnd: () => number, fallback: boolean): { specs: PageSpec[]; goals: SheetRow[] } {
  const pages = readingPages(states, rnd, fallback);
  return {
    specs: pages.map((p) => ({ kind: 'reading', title: READING_TITLE[p.spec.kind], reading: p.spec })),
    goals: pages.flatMap((p) => p.goals.map((g) => ({ label: g.label, goalId: g.goalId }))),
  };
}

/** Silben aus mehreren Buchstaben (für die Wiederholung), ohne Doppelte. */
function reviewSyllables(letters: LetterInfo[], known: string[]): string[] {
  return [...new Set(letters.flatMap((l) => syllablesFor(l, known).slice(0, 3)))].slice(0, 5);
}

/** Wiederholungswoche für das Lesekind: wiedererkennen, Anlaute sortieren, nur ein bisschen schreiben. */
function reviewPages(child: ChildProfile, letters: LetterInfo[], states: GoalState[], seed: string): PageSpec[] {
  const rnd = seededRandom(`${seed}|${child.id}|review`);
  const { grid, targets } = reviewGrid(letters, rnd);
  const pages: PageSpec[] = [{ kind: 'review-hunt', letters, grid, targets }];
  const sort = sortPictures(letters, rnd);
  if (sort.pictures.length) pages.push({ kind: 'onset-sort', letters: sort.letters, pictures: sort.pictures });
  pages.push({ kind: 'review-write', letters });
  const blendReleased = states.some((s) => s.goal.id === 'read.blend' && s.released);
  const known = states.filter((s) => s.released && s.goal.kind === 'letter').map((s) => s.goal.letter!.upper);
  const syllables = blendReleased ? reviewSyllables(letters, known) : [];
  if (syllables.length >= 2) pages.push({ kind: 'syllables', letter: letters[0], syllables });
  pages.push(...readingSpecs(states, seededRandom(`${seed}|${child.id}|reading`), false).specs);
  return pages;
}


// ------------------------------------------------------------- Silbenmethode

/** Laute, mit denen das Kind Silben bauen darf: freigegebene Buchstaben, Buchstaben früherer Pakete und die der Woche. */
export function syllableKnown(states: GoalState[], prior: string[], focus: LetterInfo[]): string[] {
  const released = states.filter((s) => s.released && s.goal.kind === 'letter').map((s) => s.goal.letter!.upper);
  return [...new Set([...released, ...prior, ...focus.map((l) => l.upper)])].filter((u) => LETTERS.some((l) => l.upper === u));
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
const shown = (w: string) => plain(w);

/** Fünf kurze Lernzeiten (Montag bis Freitag) und ein Ausblick fürs Wochenende. */
export function syllableWeekDays(letters: LetterInfo[], animals: SoundAnimal[], slide: string[], words: string[], word: string | undefined, review: boolean): WeekDay[] {
  const names = joinDe(letters.map((l) => l.upper));
  const first = slide[0] ?? '';
  const [c0, v0] = first.length >= 2 ? [first.slice(0, first.length - 1), first.slice(-1)] : [first, ''];
  const sample = words.slice(0, 2).map(shown);
  return [
    {
      day: 'Montag',
      title: review ? 'Lauttiere wiederholen' : `${animals[0].animal} kennenlernen`,
      todo: review
        ? `Alle Lauttiere der letzten Wochen mit ihren Gebärden zeigen: ${letters.map((l, i) => `${l.upper} wie ${animals[i].animal}`).join(', ')}. Mama macht eine Gebärde, das Kind sagt den Laut.`
        : `Lautspruch sagen und die Gebärde zusammen machen. Blatt „Das ${letters[0].upper}“: großen Buchstaben mit dem Finger fahren, Bilder mit dem Laut suchen. Den Tag über: Wer hört den Laut zuerst?`,
    },
    {
      day: 'Dienstag',
      title: 'Silben rutschen und schwingen',
      todo: `${c0 ? `${c0} und ${v0} rutschen zusammen: ${c0.toLowerCase().repeat(3)}${v0.toLowerCase().repeat(3)}, ${first}. ` : ''}Silbenteppich lesen: Mama zeigt, das Kind liest. Dann Silben schwingen: bei jeder Silbe einen Schritt gehen und den Arm in einem Bogen schwingen.`,
    },
    {
      day: 'Mittwoch',
      title: 'Silbenkarten legen',
      todo: 'Karten ausschneiden. Mama legt ein Wort aus einer blauen und einer roten Karte, das Kind liest. Dann tauschen: Das Kind legt, Mama liest. Quatschwörter sind erlaubt und machen am meisten Spaß.',
    },
    {
      day: 'Donnerstag',
      title: 'Wörter lesen',
      todo: sample.length
        ? `Blatt „Wörter lesen“: Silbe für Silbe, der Finger fährt die Bögen mit. Erst langsam, dann noch einmal schnell. Wörter wie ${joinDe(sample)} als Kärtchen an die passende Stelle in der Wohnung legen.`
        : `Mit den Silbenkarten Quatschwörter legen und vorlesen. Wer liest das lustigste Wort?`,
    },
    {
      day: 'Freitag',
      title: 'Selbst schreiben',
      todo: word
        ? `Blatt „Silben schreiben“: Silbe erst schwingen, dann schreiben. Das Wort ${shown(word)} auf den Zettel schreiben und echt benutzen: verschenken, an die Tür hängen oder auf den Einkaufszettel.`
        : 'Blatt „Silben schreiben“: Silbe erst schwingen, dann schreiben.',
    },
    {
      day: 'Wochenende',
      title: 'Nur im Alltag, ganz ohne Blatt',
      todo: `Namen der Familie und Dinge beim Einkaufen in Silben klatschen (To-ma-te). ${names}: Wer entdeckt die Buchstaben auf Schildern und Verpackungen?`,
    },
  ];
}

interface SyllablePlan { specs: PageSpec[]; slide: string[]; words: string[]; word?: string; animals: SoundAnimal[] }

/** Blätter der Silbenwoche für das Lesekind. Null, wenn es noch keine Silbe gibt (z. B. nur M bekannt). */
function syllablePages(child: ChildProfile, letters: LetterInfo[], states: GoalState[], prior: string[], seed: string, review: boolean): SyllablePlan | null {
  const known = syllableKnown(states, prior, letters);
  if (!canBuildSyllables(known)) return null;
  const focus = letters.map((l) => l.upper);
  const rnd = seededRandom(`${seed}|${child.id}|silben`);
  const animals = letters.map((l) => soundAnimal(l.upper, l.word));
  const open = openSyllables(known, focus);
  const slide = open.slice(0, 3);
  const carpet = syllableCarpet(known, focus, rnd);
  const words = syllableWords(known, focus, rnd, 6);
  const word = weekWord(known, focus, words);
  const days = syllableWeekDays(letters, animals, slide, words, word, review);
  const goals = [
    `die Silben ${joinDe(slide)} lesen`,
    ...(words.length >= 2 ? [`Wörter wie ${joinDe(words.slice(0, 2).map(shown))} Silbe für Silbe lesen`] : []),
    ...(word ? [`das Wort ${shown(word)} selbst schreiben und im Alltag benutzen`] : []),
  ];
  const specs: PageSpec[] = [{ kind: 'sound-week', childName: child.name, letters, animals, days, goals, review }];
  if (!review) {
    specs.push({ kind: 'sound-animal', letter: letters[0], animal: animals[0], pictures: onsetPictures(letters[0], 6, rnd) });
  }
  specs.push({ kind: 'syllable-carpet', letters, carpet, slide });
  // Das Wort der Woche zuerst, damit es sicher gelegt werden kann
  const cardWords = [...new Set([...(word ? [word] : []), ...words])].filter((w) => w.includes('-')).slice(0, 4);
  specs.push({ kind: 'syllable-cards', cards: syllableCards(cardWords, open.slice(0, 4)), recipes: cardWords.map(recipe) });
  if (words.length >= 2) {
    const picked = words.slice(0, 6).map((w) => {
      const ill = wordIllustration(w);
      if (!ill) return { word: w, options: [] };
      const others = shuffle(ALL_ILLUSTRATIONS.filter((i) => i.id !== ill), rnd).slice(0, 2).map((i) => i.id);
      return { word: w, options: shuffle([ill, ...others], rnd), answer: ill };
    });
    specs.push({ kind: 'syllable-words', words: picked });
  }
  const writeSyl = slide.length >= 2 ? [cap(slide[0]), slide[1].toLowerCase()] : [cap(slide[0]), slide[0].toLowerCase()];
  specs.push({ kind: 'syllable-write', syllables: writeSyl, word });
  return { specs, slide, words, word, animals };
}

function childPages(
  child: ChildProfile, track: PackTrack, letter: LetterInfo, states: GoalState[], seed: string, weekStart: DateKey, review: LetterInfo[],
  prior: string[] = [],
): PageSpec[] {
  const rnd = seededRandom(`${seed}|${child.id}`);
  const theme = themeIllustration(letter);
  switch (track) {
    case 'letters': {
      // Silbenmethode: sobald es eine Silbe gibt, lesen die Blätter in Silben statt nur nachzuspuren
      const silben = syllablePages(child, review.length ? review : [letter], states, prior, seed, review.length > 0);
      if (silben) {
        return [...silben.specs, ...readingSpecs(states, seededRandom(`${seed}|${child.id}|reading`), false).specs];
      }
      if (review.length) return reviewPages(child, review, states, seed);
      const { grid, targets } = letterGrid(letter, rnd);
      const pages: PageSpec[] = [
        { kind: 'sound-animal', letter, animal: soundAnimal(letter.upper, letter.word), pictures: [] },
        { kind: 'letter-hunt', letter, grid, targets, pictures: onsetPictures(letter, 6, rnd) },
      ];
      const blendReleased = states.some((s) => s.goal.id === 'read.blend' && s.released);
      const known = states.filter((s) => s.released && s.goal.kind === 'letter').map((s) => s.goal.letter!.upper);
      const syllables = blendReleased ? syllablesFor(letter, known) : [];
      pages.push(syllables.length >= 2
        ? { kind: 'syllables', letter, syllables }
        : { kind: 'word-trace', letter, illustration: theme, name: child.name });
      pages.push(...readingSpecs(states, seededRandom(`${seed}|${child.id}|reading`), false).specs);
      return pages;
    }
    case 'reading':
      return readingSpecs(states, seededRandom(`${seed}|${child.id}|reading`), true).specs;
    case 'preschool': {
      // Eigener Anlaut der Woche, damit es auch in Wiederholungswochen Neues gibt
      const own = preschoolLetter(weekStart);
      const counting = [themeIllustration(own), ...illustrationsStartingWith(own.upper).map((i) => i.id)].filter((x): x is string => !!x);
      const pool = [...new Set(counting)];
      const counts = shuffle([1, 2, 3, 4, 5], rnd);
      const onset = onsetPictures(own, 6, rnd);
      const pictures = onset.length ? onset.map((p) => p.id) : shuffle(ALL_ILLUSTRATIONS, rnd).slice(0, 6).map((i) => i.id);
      const rows = shuffle(pool, rnd);
      return [
        { kind: 'counting', rows: counts.map((count, i) => ({ count, illustration: rows[i % rows.length] ?? 'ball' })) },
        { kind: 'syllable-onset', letter: own, pictures, onset: onset.length > 0 },
      ];
    }
    case 'toddler':
      return [{ kind: 'coloring', illustration: toddlerPicture(weekStart) }];
    default:
      return [];
  }
}

function memoryCards(letters: LetterInfo[], rnd: () => number): string[] {
  const first = letters.flatMap((letter) => [themeIllustration(letter), ...illustrationsStartingWith(letter.upper).map((i) => i.id)])
    .filter((x): x is string => !!x);
  const unique = [...new Set(first)];
  const rest = shuffle(ALL_ILLUSTRATIONS.map((i) => i.id).filter((id) => !unique.includes(id)), rnd);
  const six = [...unique, ...rest].slice(0, 6);
  return shuffle([...six, ...six], rnd);
}

function observationGoals(track: PackTrack, letter: LetterInfo, specs: PageSpec[], readingRows: SheetRow[], review: LetterInfo[]): SheetRow[] {
  const letterGoal = letterGoalId(letter.upper);
  const page3 = specs[2];
  switch (track) {
    case 'reading':
      return readingRows;
    case 'letters': {
      const week = specs.find((s): s is Extract<PageSpec, { kind: 'sound-week' }> => s.kind === 'sound-week');
      if (week) {
        const carpet = specs.find((s): s is Extract<PageSpec, { kind: 'syllable-carpet' }> => s.kind === 'syllable-carpet');
        const words = specs.find((s): s is Extract<PageSpec, { kind: 'syllable-words' }> => s.kind === 'syllable-words');
        const write = specs.find((s): s is Extract<PageSpec, { kind: 'syllable-write' }> => s.kind === 'syllable-write');
        return [
          ...week.letters.flatMap((l, i) => [
            { label: `Laut ${l.upper} mit Lauttier (${week.animals[i].animal}) und Gebärde`, goalId: letterGoalId(l.upper) },
            ...(review.length ? [] : [{ label: `${l.upper} im Wort hören und ${l.upper === l.lower ? l.upper : `${l.upper} und ${l.lower}`} wiedererkennen`, goalId: letterGoalId(l.upper) }]),
          ]),
          { label: 'Silben schwingen und klatschen', goalId: 'read.syllables' },
          { label: `Silben lesen (${joinDe(carpet?.slide ?? [])})`, goalId: 'read.syllable-reading' },
          ...(words ? [{ label: `Wörter aus Silben lesen (${joinDe(words.words.slice(0, 2).map((w) => plain(w.word)))})`, goalId: 'read.syllable-reading' }] : []),
          ...(write?.word ? [{ label: `${plain(write.word)} selbst schreiben`, goalId: 'free.week-word' }] : []),
          ...readingRows,
        ];
      }
      if (review.length) {
        const sorted = specs.find((s): s is Extract<PageSpec, { kind: 'onset-sort' }> => s.kind === 'onset-sort');
        const hasSyllables = specs.some((s) => s.kind === 'syllables');
        return [
          ...review.flatMap((l) => [
            { label: `${l.upper === l.lower ? l.upper : `${l.upper} und ${l.lower}`} wiedererkennen und schreiben`, goalId: letterGoalId(l.upper) },
            ...(sorted?.letters.some((x) => x.upper === l.upper) ? [{ label: `Anlaut ${l.upper} hören`, goalId: letterGoalId(l.upper) }] : []),
          ]),
          ...(hasSyllables ? [{ label: 'Silben lesen', goalId: 'read.syllable-reading' }] : []),
          ...readingRows,
        ];
      }
      return [
        { label: `${letter.upper} und ${letter.lower} unter anderen Buchstaben finden`, goalId: letterGoal },
        { label: `Den Laut von ${letter.upper} hören (wie in ${letter.word})`, goalId: letterGoal },
        { label: `${letter.upper} und ${letter.lower} nachspuren und schreiben`, goalId: letterGoal },
        page3?.kind === 'syllables'
          ? { label: `Silben mit ${letter.upper} lesen`, goalId: 'read.syllable-reading' }
          : { label: 'Den eigenen Namen schreiben', goalId: 'free.own-name' },
        ...readingRows,
      ];
    }
    case 'preschool': {
      const onset = specs.find((s): s is Extract<PageSpec, { kind: 'syllable-onset' }> => s.kind === 'syllable-onset');
      return [
        { label: 'Bis 5 zählen', goalId: 'math.count10' },
        { label: 'Silben klatschen', goalId: 'read.syllables' },
        { label: `Anfangslaut ${(onset?.letter ?? letter).upper} hören`, goalId: 'read.onset' },
      ];
    }
    case 'toddler':
      return [
        { label: 'Malen oder kleben', goalId: 'free.craft' },
        { label: 'Das Bild zeigen und benennen', goalId: 'free.naming' },
      ];
    default:
      return [];
  }
}

export interface PlanInput {
  pack: LearningPack;
  children: ChildProfile[];
  /** Lernstand je Kind (für Silbenfreigabe und Buchstaben). */
  statesByChild: Map<string, GoalState[]>;
  /** Rechenpfad je Kind. */
  mathStatesByChild?: Map<string, GoalState[]>;
  /** Für die Phase vor oder nach der Einschulung. */
  today?: DateKey;
  /** Buchstaben früherer Pakete: zählen für die Silben mit, auch wenn sie im Lesepfad nicht freigegeben sind. */
  priorLetters?: string[];
}

/** Ein bis zwei Rechenblätter zu dem, woran das Kind gerade rechnet. */
function childMathPages(child: ChildProfile, states: GoalState[], today: DateKey, seed: string, review = false): { pages: MathPage[]; goals: LearningGoal[] } {
  const rnd = seededRandom(`${seed}|${child.id}|math`);
  const goals = currentMathGoals(states, child, today).map((s) => s.goal);
  if (review) return reviewMathPages(states, goals, rnd);
  const pages: MathPage[] = [];
  for (const g of goals) {
    const p = mathPageFor(g, rnd);
    // Zwei Ziele mit demselben Blatt (z. B. Würfelbilder): beim zweiten ein anderes Blatt nehmen
    const same = p && pages.some((x) => x.title === p.title);
    const page = same ? extraMathPage(g, rnd) : p;
    if (page && !pages.some((x) => x.title === page.title)) pages.push(page);
  }
  if (pages.length === 1 && goals.length === 1) {
    const extra = extraMathPage(goals[0], rnd);
    if (extra) pages.push(extra);
  }
  return { pages, goals };
}

/**
 * Rechnen in der Wiederholungswoche: nichts Neues. Ein Blatt zum zuletzt sicheren Ziel und eine andere Blattart zum aktuellen.
 */
function reviewMathPages(states: GoalState[], current: LearningGoal[], rnd: () => number): { pages: MathPage[]; goals: LearningGoal[] } {
  const secured = states
    .filter((s) => s.released && (s.status === 'mostly' || s.status === 'mastered') && !current.some((g) => g.id === s.goal.id))
    .sort((a, b) => (b.lastDate ?? '').localeCompare(a.lastDate ?? ''))[0]?.goal;
  const pages: MathPage[] = [];
  const goals: LearningGoal[] = [];
  const add = (goal: LearningGoal, page: MathPage | null) => {
    if (!page || pages.length >= 2 || pages.some((p) => p.title === page.title)) return;
    pages.push(page);
    if (!goals.includes(goal)) goals.push(goal);
  };
  if (secured) add(secured, mathPageFor(secured, rnd));
  for (const g of current) add(g, extraMathPage(g, rnd) ?? mathPageFor(g, rnd));
  for (const g of current) add(g, mathPageFor(g, rnd));
  return { pages, goals };
}

/** Schwungblatt der Vorschulstufe mit einem Buchstaben, den das Kind schon kennt (statt fester Reihenfolge). */
function swingLetterFor(states: GoalState[], letter: LetterInfo, review: LetterInfo[], weekStart: DateKey): LetterInfo {
  if (review.length) return review[0];
  const known = states.filter((s) => s.released && s.goal.kind === 'letter' && s.goal.letter && s.goal.letter.upper !== letter.upper)
    .map((s) => s.goal.letter!);
  return known.length ? known[mod(weekIndex(weekStart), known.length)] : letter;
}

export function planPack({ pack, children, statesByChild, mathStatesByChild, today = pack.weekStart, priorLetters = [] }: PlanInput): PackPlan {
  const letter = letterInfo(pack.letter);
  const review = reviewLetters(pack);
  const seed = `${pack.weekStart}|${pack.letter}`;
  const pages: PlannedPage[] = [];
  const observationRows: SheetChild[] = [];
  const mathGoals: LearningGoal[] = [];

  for (const { childId, track, math } of pack.children) {
    const child = children.find((c) => c.id === childId);
    if (!child || track === 'skip') continue;
    const childReview = track === 'letters' ? review : [];
    const states = statesByChild.get(childId) ?? [];
    const specs = track === 'math' ? [] : childPages(child, track, letter, states, seed, pack.weekStart, childReview, priorLetters);
    // Dieselben Zufallszahlen wie in childPages, damit Blätter und Bogen zusammenpassen
    const readingRows = track === 'letters' || track === 'reading'
      ? readingSpecs(statesByChild.get(childId) ?? [], seededRandom(`${seed}|${childId}|reading`), track === 'reading').goals
      : [];
    const goals = observationGoals(track, letter, specs, readingRows, childReview);
    // Pakete von vor dem Rechenpfad haben kein Feld: dann gehören Rechenblätter dazu
    if (track === 'math' || (math !== false && track !== 'toddler')) {
      const m = childMathPages(child, mathStatesByChild?.get(childId) ?? mathStates(childId, [], [], today), today, seed, review.length > 0);
      for (const p of m.pages) specs.push({ kind: 'math', title: p.title, math: p.spec });
      goals.push(...m.goals.filter((g) => !goals.some((x) => x.goalId === g.id)).map((g) => ({ label: g.title, goalId: g.id })));
      mathGoals.push(...m.goals);
    }
    const swing = swingLevelForTrack(track);
    if (swing) {
      const variant = swingVariantForWeek(getISOWeek(fromDateKey(pack.weekStart)));
      const base = SWING_SHEETS[swing][variant];
      const sheet = swing === 'letters' ? lettersSheetFor(base, swingLetterFor(states, letter, childReview, pack.weekStart)) : base;
      specs.push({ kind: 'swing', level: swing, variant, sheet });
    }
    // Für alle Kinder dieselbe Bastelvorlage und dasselbe Ausmalbild, jedes Kind bekommt sein eigenes Blatt
    if (track !== 'math') specs.push(...weeklyExtras(pack.weekStart));
    specs.forEach((spec, i) => pages.push({
      id: `${childId}-${i + 1}`, section: 'child', childId, childName: child.name, title: pageTitle(spec, letter), spec,
    }));
    if (specs.length) observationRows.push({ childId, name: child.name, goals });
  }

  const players = pack.children
    .filter((c) => c.track !== 'skip')
    .map((c) => ({ name: children.find((k) => k.id === c.childId)?.name ?? '', track: c.track }))
    .filter((p) => p.name);
  pages.push({
    id: 'game', section: 'game', title: 'Memory für alle',
    spec: { kind: 'memory', cards: memoryCards(review.length ? review : [letter], seededRandom(`${seed}|memory`)), players },
  });
  if (mathGoals.length) {
    const { heading, pairs } = mathMemoryPairs(mathGoals, seededRandom(`${seed}|math-memory`));
    const cards = shuffle(pairs.flat(), seededRandom(`${seed}|math-memory-cards`));
    pages.push({ id: 'game-math', section: 'game', title: 'Rechen-Memory', spec: { kind: 'math-memory', heading, cards } });
  }
  if (observationRows.length) {
    pages.push({ id: 'observation', section: 'observation', title: 'Beobachtungsbogen', spec: { kind: 'observation', rows: observationRows } });
  }
  return { pack, letter, title: packTitle(pack), pages };
}

/** Bastelvorlage und Ausmalbild der Woche. */
export function weeklyExtras(weekStart: DateKey): PageSpec[] {
  const date = fromDateKey(weekStart);
  const kw = getISOWeek(date);
  const { theme, index } = coloringForWeek(kw);
  const pic = theme.pictures[index];
  return [
    { kind: 'craft', craft: craftForWeek(kw, date.getMonth()) },
    { kind: 'picture', theme: theme.name, index, title: pic.title, drawing: pic.drawing },
  ];
}

export function pageTitle(spec: PageSpec, letter: LetterInfo): string {
  switch (spec.kind) {
    case 'letter-intro': return `Das ${letter.upper}`;
    case 'letter-hunt': return `Finde das ${letter.upper}`;
    case 'review-hunt': return `Weißt du noch? ${joinDe(spec.letters.map((l) => l.upper))}`;
    case 'onset-sort': return 'Womit fängt es an?';
    case 'review-write': return 'Ein bisschen schreiben';
    case 'syllables': return 'Laute verbinden';
    case 'word-trace': return 'Wörter schreiben';
    case 'counting': return 'Wie viele sind es?';
    case 'syllable-onset': return 'Silben klatschen';
    case 'coloring': return `Ausmalbild: ${ILLUSTRATIONS.get(spec.illustration)?.word ?? 'Bild'}`;
    case 'memory': return 'Memory für alle';
    case 'math': return spec.title;
    case 'reading': return spec.title;
    case 'math-memory': return 'Rechen-Memory';
    case 'observation': return 'Beobachtungsbogen';
    case 'swing': return `Schwungblatt ${spec.variant + 1}: ${spec.sheet.title}`;
    case 'craft': return `Basteln: ${spec.craft.title}`;
    case 'sound-week': return spec.review ? 'Silbenwoche: Wiederholung' : `Silbenwoche: ${spec.letters[0].upper} wie ${spec.animals[0].animal}`;
    case 'sound-animal': return `Das ${spec.letter.upper} wie ${spec.animal.animal}`;
    case 'syllable-carpet': return 'Silbenteppich';
    case 'syllable-words': return 'Wörter lesen';
    case 'syllable-cards': return 'Silbenkarten';
    case 'syllable-write': return 'Silben schreiben';
    case 'picture': return `Ausmalbild: ${spec.title}`;
  }
}

// ------------------------------------------------------------- Speichern

export function packForWeek(packs: LearningPack[], weekStart: DateKey): LearningPack | undefined {
  return packs.filter((p) => p.weekStart === weekStart).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export async function savePack(
  db: FamilyDatabase, weekStart: DateKey, letter: string, children: LearningPack['children'], existing?: LearningPack, review?: string[],
): Promise<LearningPack> {
  const pack: LearningPack = {
    id: existing?.id ?? newId('pack'), weekStart, letter, children,
    createdAt: existing?.createdAt ?? new Date().toISOString(), prints: existing?.prints ?? [],
  };
  if (review?.length) pack.review = review;
  await db.learningPacks.put(pack);
  return pack;
}

export async function recordPrint(db: FamilyDatabase, packId: string, scope: PrintScope, pages: number): Promise<void> {
  await db.learningPacks.where('id').equals(packId).modify((p) => {
    p.prints = [...p.prints, { at: new Date().toISOString(), scope, pages }];
  });
}

/** Buchstaben aller Pakete vor dieser Woche, in denen ein Kind Buchstabenblätter hatte (auch Wiederholungen). */
export function priorPackLetters(packs: LearningPack[], weekStart: DateKey): string[] {
  const out = packs
    .filter((p) => p.weekStart < weekStart && p.children.some((c) => c.track === 'letters'))
    .flatMap((p) => [p.letter, ...(p.review ?? [])]);
  return [...new Set(out)];
}

import type { FamilyDatabase } from '../database/db';
import { ALL_ILLUSTRATIONS, ILLUSTRATIONS, THEME_ILLUSTRATION, illustrationsStartingWith, type Illustration } from '../data/illustrations';
import { LETTERS, type LetterInfo } from '../data/readingCurriculum';
import type { ChildProfile, DateKey, LearningPack, LearningRelease, PackTrack } from '../types';
import { ageInYears } from '../utils/dates';
import { newId } from '../utils/id';
import { pathPhase, todaysLetter, suggestions, type GoalState } from './learning';
import { currentMathGoals, mathStates } from './math';
import { mathMemoryPairs, mathPageFor, numberWallPage, type MathPage, type MathSpec } from './mathSheets';
import type { LearningGoal } from '../data/readingCurriculum';

/**
 * Lernpaket der Woche: ein gemeinsames Thema (Buchstabe mit Bildwort), passende Blätter für jedes Kind,
 * ein gemeinsames Spiel und der Beobachtungsbogen für die Eltern.
 * Die Planung ist rein und deterministisch: dasselbe Paket ergibt beim Nachdrucken dieselben Seiten.
 */

export const TRACK_LABEL: Record<PackTrack, string> = {
  letters: 'Buchstaben und Laute',
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
  | { kind: 'syllables'; letter: LetterInfo; syllables: string[] }
  | { kind: 'word-trace'; letter: LetterInfo; illustration?: string; name: string }
  | { kind: 'counting'; rows: { count: number; illustration: string }[] }
  | { kind: 'syllable-onset'; letter: LetterInfo; pictures: string[]; onset: boolean }
  | { kind: 'coloring'; illustration: string }
  | { kind: 'memory'; cards: string[]; players: { name: string; track: PackTrack }[] }
  | { kind: 'math'; title: string; math: MathSpec }
  | { kind: 'math-memory'; heading: string; cards: string[] }
  | { kind: 'observation'; rows: { name: string; goals: string[] }[] };

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
export type PrintScope = 'all' | 'game' | 'observation' | `child:${string}`;

export function pagesForScope(plan: PackPlan, scope: PrintScope): PlannedPage[] {
  if (scope === 'all') return plan.pages;
  if (scope === 'game') return plan.pages.filter((p) => p.section === 'game');
  if (scope === 'observation') return plan.pages.filter((p) => p.section === 'observation');
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

/** Welche Blätter ein Kind bekommt: Schulkind → keine, Lesepfad aktiv → Buchstaben, ab 3 Jahren → Vorschule, sonst Malen. */
export function defaultTrack(child: ChildProfile, today: DateKey, states: GoalState[]): PackTrack {
  const phase = pathPhase(child, today).kind;
  // Schulkinder machen ihre Hausaufgaben; Übungsblätter zum Unterricht nur, wenn eingeschaltet
  if (phase === 'in-school') return child.schoolPractice ? 'math' : 'skip';
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

function childPages(child: ChildProfile, track: PackTrack, letter: LetterInfo, states: GoalState[], seed: string): PageSpec[] {
  const rnd = seededRandom(`${seed}|${child.id}`);
  const theme = themeIllustration(letter);
  switch (track) {
    case 'letters': {
      const { grid, targets } = letterGrid(letter, rnd);
      const pages: PageSpec[] = [
        { kind: 'letter-intro', letter, illustration: theme },
        { kind: 'letter-hunt', letter, grid, targets, pictures: onsetPictures(letter, 6, rnd) },
      ];
      const blendReleased = states.some((s) => s.goal.id === 'read.blend' && s.released);
      const known = states.filter((s) => s.released && s.goal.kind === 'letter').map((s) => s.goal.letter!.upper);
      const syllables = blendReleased ? syllablesFor(letter, known) : [];
      pages.push(syllables.length >= 2
        ? { kind: 'syllables', letter, syllables }
        : { kind: 'word-trace', letter, illustration: theme, name: child.name });
      return pages;
    }
    case 'preschool': {
      const counting = [theme, ...illustrationsStartingWith(letter.upper).map((i) => i.id)].filter((x): x is string => !!x);
      const pool = counting.length ? counting : ['ball', 'sonne', 'herz'];
      const counts = shuffle([1, 2, 3, 4, 5], rnd);
      const onset = onsetPictures(letter, 6, rnd);
      const pictures = onset.length ? onset.map((p) => p.id) : shuffle(ALL_ILLUSTRATIONS, rnd).slice(0, 6).map((i) => i.id);
      return [
        { kind: 'counting', rows: counts.map((count, i) => ({ count, illustration: pool[i % pool.length] })) },
        { kind: 'syllable-onset', letter, pictures, onset: onset.length > 0 },
      ];
    }
    case 'toddler':
      return [{ kind: 'coloring', illustration: theme ?? illustrationsStartingWith(letter.upper)[0]?.id ?? 'sonne' }];
    default:
      return [];
  }
}

function memoryCards(letter: LetterInfo, rnd: () => number): string[] {
  const first = [themeIllustration(letter), ...illustrationsStartingWith(letter.upper).map((i) => i.id)].filter((x): x is string => !!x);
  const unique = [...new Set(first)];
  const rest = shuffle(ALL_ILLUSTRATIONS.map((i) => i.id).filter((id) => !unique.includes(id)), rnd);
  const six = [...unique, ...rest].slice(0, 6);
  return shuffle([...six, ...six], rnd);
}

function observationGoals(track: PackTrack, letter: LetterInfo, page3: PageSpec | undefined): string[] {
  switch (track) {
    case 'letters':
      return [
        `${letter.upper} und ${letter.lower} unter anderen Buchstaben finden`,
        `Den Laut von ${letter.upper} hören (wie in ${letter.word})`,
        `${letter.upper} und ${letter.lower} nachspuren und schreiben`,
        page3?.kind === 'syllables' ? `Silben mit ${letter.upper} lesen` : 'Den eigenen Namen schreiben',
      ];
    case 'preschool':
      return ['Bis 5 zählen', 'Silben klatschen', `Anfangslaut ${letter.upper} hören`];
    case 'toddler':
      return ['Malen oder kleben', 'Das Bild zeigen und benennen'];
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
}

/** Ein bis zwei Rechenblätter zu dem, woran das Kind gerade rechnet. */
function childMathPages(child: ChildProfile, states: GoalState[], today: DateKey, seed: string): { pages: MathPage[]; goals: LearningGoal[] } {
  const rnd = seededRandom(`${seed}|${child.id}|math`);
  const goals = currentMathGoals(states, child, today).map((s) => s.goal);
  const pages = goals.map((g) => mathPageFor(g, rnd)).filter((p): p is MathPage => !!p);
  if (pages.length === 1 && goals.length === 1) {
    const wall = numberWallPage(goals[0], rnd);
    if (wall) pages.push(wall);
  }
  return { pages, goals };
}

export function planPack({ pack, children, statesByChild, mathStatesByChild, today = pack.weekStart }: PlanInput): PackPlan {
  const letter = letterInfo(pack.letter);
  const seed = `${pack.weekStart}|${pack.letter}`;
  const pages: PlannedPage[] = [];
  const observationRows: { name: string; goals: string[] }[] = [];
  const mathGoals: LearningGoal[] = [];

  for (const { childId, track, math } of pack.children) {
    const child = children.find((c) => c.id === childId);
    if (!child || track === 'skip') continue;
    const specs = track === 'math' ? [] : childPages(child, track, letter, statesByChild.get(childId) ?? [], seed);
    const goals = observationGoals(track, letter, specs[2]);
    // Pakete von vor dem Rechenpfad haben kein Feld: dann gehören Rechenblätter dazu
    if (track === 'math' || (math !== false && track !== 'toddler')) {
      const m = childMathPages(child, mathStatesByChild?.get(childId) ?? mathStates(childId, [], [], today), today, seed);
      for (const p of m.pages) specs.push({ kind: 'math', title: p.title, math: p.spec });
      goals.push(...m.goals.map((g) => g.title));
      mathGoals.push(...m.goals);
    }
    specs.forEach((spec, i) => pages.push({
      id: `${childId}-${i + 1}`, section: 'child', childId, childName: child.name, title: pageTitle(spec, letter), spec,
    }));
    if (specs.length) observationRows.push({ name: child.name, goals });
  }

  const players = pack.children
    .filter((c) => c.track !== 'skip')
    .map((c) => ({ name: children.find((k) => k.id === c.childId)?.name ?? '', track: c.track }))
    .filter((p) => p.name);
  pages.push({
    id: 'game', section: 'game', title: 'Memory für alle',
    spec: { kind: 'memory', cards: memoryCards(letter, seededRandom(`${seed}|memory`)), players },
  });
  if (mathGoals.length) {
    const { heading, pairs } = mathMemoryPairs(mathGoals, seededRandom(`${seed}|math-memory`));
    const cards = shuffle(pairs.flat(), seededRandom(`${seed}|math-memory-cards`));
    pages.push({ id: 'game-math', section: 'game', title: 'Rechen-Memory', spec: { kind: 'math-memory', heading, cards } });
  }
  if (observationRows.length) {
    pages.push({ id: 'observation', section: 'observation', title: 'Beobachtungsbogen', spec: { kind: 'observation', rows: observationRows } });
  }
  return { pack, letter, title: themeTitle(letter), pages };
}

export function pageTitle(spec: PageSpec, letter: LetterInfo): string {
  switch (spec.kind) {
    case 'letter-intro': return `Das ${letter.upper}`;
    case 'letter-hunt': return `Finde das ${letter.upper}`;
    case 'syllables': return 'Laute verbinden';
    case 'word-trace': return 'Wörter schreiben';
    case 'counting': return 'Wie viele sind es?';
    case 'syllable-onset': return 'Silben klatschen';
    case 'coloring': return `Ausmalbild: ${ILLUSTRATIONS.get(spec.illustration)?.word ?? 'Bild'}`;
    case 'memory': return 'Memory für alle';
    case 'math': return spec.title;
    case 'math-memory': return 'Rechen-Memory';
    case 'observation': return 'Beobachtungsbogen';
  }
}

// ------------------------------------------------------------- Speichern

export function packForWeek(packs: LearningPack[], weekStart: DateKey): LearningPack | undefined {
  return packs.filter((p) => p.weekStart === weekStart).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export async function savePack(
  db: FamilyDatabase, weekStart: DateKey, letter: string, children: LearningPack['children'], existing?: LearningPack,
): Promise<LearningPack> {
  const pack: LearningPack = {
    id: existing?.id ?? newId('pack'), weekStart, letter, children,
    createdAt: existing?.createdAt ?? new Date().toISOString(), prints: existing?.prints ?? [],
  };
  await db.learningPacks.put(pack);
  return pack;
}

export async function recordPrint(db: FamilyDatabase, packId: string, scope: PrintScope, pages: number): Promise<void> {
  await db.learningPacks.where('id').equals(packId).modify((p) => {
    p.prints = [...p.prints, { at: new Date().toISOString(), scope, pages }];
  });
}

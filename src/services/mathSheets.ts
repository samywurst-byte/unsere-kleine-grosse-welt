import { TIMES_ROW_ORDER } from '../data/mathCurriculum';
import type { LearningGoal } from '../data/readingCurriculum';

/**
 * Inhalte der Rechenblätter, rein und deterministisch (fester Zufall je Woche und Kind).
 * Aufgaben bleiben im Zahlenraum der Stufe, Ergebnisse sind nie negativ.
 */

/** Teil einer Aufgabenzeile: Text oder ein leeres Kästchen (null) zum Hineinschreiben. */
export type TaskPart = string | null;

export type MathSpec =
  | { kind: 'dice-match'; dice: number[]; digits: number[]; compare: [number, number][] }
  | { kind: 'digit-trace'; digits: number[] }
  | { kind: 'ten-frame'; numbers: number[] }
  | { kind: 'number-house'; houses: { top: number; rows: [number | null, number | null][] }[] }
  | { kind: 'packets'; heading: string; instruction: string; tasks: TaskPart[][]; help?: 'ten' | 'twenty' }
  | { kind: 'number-wall'; walls: (number | null)[][][]; max: number }
  | { kind: 'times-row'; n: number; withDiv: boolean; skip: (number | null)[] }
  | { kind: 'story'; stories: { text: string; op: '+' | '−' | '·' | ':' }[] }
  | { kind: 'task-family'; triples: [number, number, number][] }
  | { kind: 'neighbors'; numbers: number[]; max: number }
  | { kind: 'hundred-chart'; shown: boolean[] }
  | { kind: 'dot-draw'; numbers: number[] };

export interface MathPage {
  title: string;
  goalTitle: string;
  spec: MathSpec;
}

type Rnd = () => number;
const int = (rnd: Rnd, min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));

function shuffle<T>(items: T[], rnd: Rnd): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Eindeutige Aufgaben erzeugen (keine Wiederholung auf einem Blatt). */
function uniqueTasks(count: number, make: () => TaskPart[]): TaskPart[][] {
  const seen = new Set<string>();
  const out: TaskPart[][] = [];
  for (let guard = 0; out.length < count && guard < count * 50; guard++) {
    const t = make();
    const key = JSON.stringify(t);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

const task = (text: string): TaskPart[] => [text, null];
const MINUS = '−';
const TIMES = '·';

function packets(goalId: string, rnd: Rnd): MathSpec | null {
  const n = 24;
  switch (goalId) {
    case 'math.add10':
      return { kind: 'packets', heading: 'Plus bis 10', instruction: 'Rechne. Du darfst das Zehnerfeld oder Plättchen benutzen.', help: 'ten',
        tasks: uniqueTasks(n, () => { const a = int(rnd, 0, 9); const b = int(rnd, 1, 10 - a); return task(`${a} + ${b} =`); }) };
    case 'math.sub10':
      return { kind: 'packets', heading: 'Minus bis 10', instruction: 'Rechne. Du darfst das Zehnerfeld oder Plättchen benutzen.', help: 'ten',
        tasks: uniqueTasks(n, () => { const a = int(rnd, 2, 10); const b = int(rnd, 1, a); return task(`${a} ${MINUS} ${b} =`); }) };
    case 'math.add20':
      return { kind: 'packets', heading: 'Plus bis 20', instruction: 'Rechne. Bei Aufgaben über die 10: erst bis 10, dann weiter.', help: 'twenty',
        tasks: uniqueTasks(n, () => {
          if (rnd() < 0.5) { const a = int(rnd, 3, 9); const b = int(rnd, 11 - a, 9); return task(`${a} + ${b} =`); }
          const a = int(rnd, 11, 18); const b = int(rnd, 1, 20 - a); return task(`${a} + ${b} =`);
        }) };
    case 'math.sub20':
      return { kind: 'packets', heading: 'Minus bis 20', instruction: 'Rechne. Bei Aufgaben über die 10: erst zur 10, dann weiter.', help: 'twenty',
        tasks: uniqueTasks(n, () => {
          if (rnd() < 0.5) { const a = int(rnd, 11, 18); const b = int(rnd, a - 9, 9); return task(`${a} ${MINUS} ${b} =`); }
          const a = int(rnd, 12, 20); const b = int(rnd, 1, a - 10); return task(`${a} ${MINUS} ${b} =`);
        }) };
    case 'math.double-half':
      return { kind: 'packets', heading: 'Verdoppeln und Halbieren', instruction: 'Verdopple die Zahl oder finde die Hälfte.',
        tasks: uniqueTasks(n, () => {
          const k = int(rnd, 1, 10);
          return rnd() < 0.5 ? task(`${k} + ${k} =`) : task(`Die Hälfte von ${2 * k} ist`);
        }) };
    case 'math.place100':
      return { kind: 'packets', heading: 'Zehner und Einer', instruction: 'Schreibe auf, wie viele Zehner (Z) und Einer (E) es sind. Oder umgekehrt.',
        tasks: uniqueTasks(18, () => {
          const z = int(rnd, 1, 9); const e = int(rnd, 0, 9);
          return rnd() < 0.5 ? [`${10 * z + e} =`, null, 'Z', null, 'E'] : [`${z} Z ${e} E =`, null];
        }) };
    case 'math.addsub100':
      return { kind: 'packets', heading: 'Plus und Minus bis 100', instruction: 'Rechne in Schritten: erst die Zehner, dann die Einer.',
        tasks: uniqueTasks(n, () => {
          if (rnd() < 0.5) { const a = int(rnd, 10, 80); const b = int(rnd, 2, 99 - a); return task(`${a} + ${b} =`); }
          const a = int(rnd, 20, 99); const b = int(rnd, 2, a - 1); return task(`${a} ${MINUS} ${b} =`);
        }) };
    case 'math.div-remainder':
      return { kind: 'packets', heading: 'Teilen mit Rest', instruction: 'Teile und schreibe auf, was übrig bleibt.',
        tasks: uniqueTasks(18, () => {
          const d = int(rnd, 2, 9); const q = int(rnd, 1, 9); const r = int(rnd, 0, d - 1);
          return [`${d * q + r} : ${d} =`, null, 'Rest', null];
        }) };
    case 'math.squares20':
      return { kind: 'packets', heading: 'Quadratzahlen', instruction: 'Zerlege, wenn du magst: 13 · 13 = 10 · 13 + 3 · 13.',
        tasks: shuffle(Array.from({ length: 20 }, (_, i) => task(`${i + 1} ${TIMES} ${i + 1} =`)), rnd).slice(0, 18) };
    default:
      return null;
  }
}

function numberWalls(stage: number, rnd: Rnd): MathSpec {
  const max = stage <= 4 ? 10 : stage === 5 ? 20 : 100;
  const walls: (number | null)[][][] = [];
  for (let i = 0; i < 6; i++) {
    let a = 0; let b = 0; let c = 0;
    do { a = int(rnd, 0, max / 2); b = int(rnd, 0, max / 4); c = int(rnd, 0, max / 2); } while (a + 2 * b + c > max || a + 2 * b + c < max / 3);
    const top = a + 2 * b + c;
    // Die ersten vier: Grundsteine gegeben. Die letzten zwei: Spitze gegeben, ein Grundstein fehlt.
    walls.push(i < 4 ? [[a, b, c], [null, null], [null]] : [[a, null, c], [null, null], [top]]);
  }
  return { kind: 'number-wall', walls, max };
}

function timesRow(n: number, withDiv: boolean, rnd: Rnd): MathSpec {
  const skip: (number | null)[] = Array.from({ length: 10 }, (_, i) => (i < 2 || rnd() < 0.35 ? (i + 1) * n : null));
  return { kind: 'times-row', n, withDiv, skip };
}

const MAX_HOUSE = 10;

/** Ein Rechenblatt zum Lernziel; null, wenn es dafür noch kein Blatt gibt (Klasse 3 und 4 schriftlich). */
export function mathPageFor(goal: LearningGoal, rnd: Rnd): MathPage | null {
  const page = (title: string, spec: MathSpec): MathPage => ({ title, goalTitle: goal.title, spec });
  const id = goal.id;
  if (id === 'math.subitize' || id === 'math.compare') {
    const dice = shuffle([1, 2, 3, 4, 5, 6], rnd).slice(0, 5);
    const compare: [number, number][] = [0, 1, 2].map(() => { const a = int(rnd, 1, 6); let b = int(rnd, 1, 6); if (b === a) b = a === 6 ? 2 : a + 1; return [a, b]; });
    return page('Würfelbilder', { kind: 'dice-match', dice, digits: shuffle(dice, rnd), compare });
  }
  if (id === 'math.count10' || id === 'math.number-quantity' || id === 'math.digits') {
    return page('Zahlen schreiben', { kind: 'digit-trace', digits: [1, 2, 3, 4, 5, 6, 7, 8, 9, 0] });
  }
  if (id === 'math.five' || id === 'math.pairs10') {
    return page('Das Zehnerfeld', { kind: 'ten-frame', numbers: shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rnd).slice(0, 6) });
  }
  if (id === 'math.decompose10') {
    const start = int(rnd, 4, 8);
    const houses = [start, start + 1, start + 2].filter((t) => t <= MAX_HOUSE).map((top) => ({
      top,
      rows: Array.from({ length: top + 1 }, (_, i): [number | null, number | null] => (rnd() < 0.5 ? [i, null] : [null, top - i])),
    }));
    return page('Zahlenhäuser', { kind: 'number-house', houses });
  }
  const times = /^math\.times\.(\d+)$/.exec(id);
  if (times) return page(`Die ${times[1]}er-Reihe`, timesRow(Number(times[1]), false, rnd));
  const div = /^math\.div\.(\d+)$/.exec(id);
  if (div) return page(`Mal und geteilt: ${div[1]}`, timesRow(Number(div[1]), true, rnd));
  if (id === 'math.big-times') {
    const n = int(rnd, 11, 20);
    return page(`Die ${n}er-Reihe`, timesRow(n, false, rnd));
  }
  const p = packets(id, rnd);
  return p ? page(p.kind === 'packets' ? p.heading : goal.title, p) : null;
}

/** Zweites Blatt für Stufen 4 bis 6, wenn nur ein Ziel geübt wird: Rechenmauern im selben Zahlenraum. */
export function numberWallPage(goal: LearningGoal, rnd: Rnd): MathPage | null {
  if (goal.stage < 4 || goal.stage > 6) return null;
  return { title: 'Rechenmauern', goalTitle: goal.title, spec: numberWalls(goal.stage, rnd) };
}

/** Rechen-Memory für die ganze Familie, passend zur höchsten Stufe, an der gerade gerechnet wird. */
export function mathMemoryPairs(goals: LearningGoal[], rnd: Rnd): { heading: string; pairs: [string, string][] } {
  const top = [...goals].sort((a, b) => b.stage - a.stage)[0];
  if (!top || top.stage <= 2) {
    return { heading: 'Würfelbild sucht Zahl', pairs: [1, 2, 3, 4, 5, 6].map((k) => [`dice:${k}`, String(k)]) };
  }
  if (top.stage === 3) {
    return { heading: 'Verliebte Zahlen: zusammen 10', pairs: [[0, 10], [1, 9], [2, 8], [3, 7], [4, 6], [5, 5]].map(([a, b]) => [`frame:${a}`, String(b)]) };
  }
  if (top.stage <= 6) {
    const max = top.stage === 4 ? 10 : top.stage === 5 ? 20 : 100;
    const used = new Set<number>();
    const pairs: [string, string][] = [];
    for (let guard = 0; pairs.length < 6 && guard < 500; guard++) {
      const a = int(rnd, 1, max - 1); const b = int(rnd, 1, max - a);
      if (used.has(a + b)) continue;
      used.add(a + b);
      pairs.push([`${a} + ${b}`, String(a + b)]);
    }
    return { heading: 'Aufgabe sucht Ergebnis', pairs };
  }
  const rows = goals.map((g) => /^math\.(?:times|div)\.(\d+)$/.exec(g.id)?.[1]).filter(Boolean).map(Number);
  const pool = rows.length ? rows : TIMES_ROW_ORDER.slice(0, 3);
  const used = new Set<number>();
  const pairs: [string, string][] = [];
  for (let guard = 0; pairs.length < 6 && guard < 500; guard++) {
    const n = pool[int(rnd, 0, pool.length - 1)]; const k = int(rnd, 2, 10);
    if (used.has(n * k)) continue;
    used.add(n * k);
    pairs.push([`${k} ${TIMES} ${n}`, String(k * n)]);
  }
  return { heading: 'Einmaleins-Memory', pairs };
}


// ------------------------------------------------------------- Abwechslung

type Story = { op: '+' | '−' | '·' | ':'; text: (a: number, b: number) => string };

/** Rechengeschichten. Zahlen immer mindestens 2, damit die Mehrzahl stimmt. */
const ADD_STORIES: Story[] = [
  { op: '+', text: (a, b) => `Auf dem Teller liegen ${a} Äpfel. Mama legt noch ${b} dazu. Wie viele Äpfel sind es jetzt?` },
  { op: '+', text: (a, b) => `Im Bus sitzen ${a} Kinder. An der Haltestelle steigen ${b} Kinder ein. Wie viele Kinder sind jetzt im Bus?` },
  { op: '+', text: (a, b) => `Leo hat ${a} Murmeln. Er bekommt ${b} Murmeln geschenkt. Wie viele Murmeln hat er jetzt?` },
  { op: '+', text: (a, b) => `Auf der Wiese stehen ${a} Schafe. Dann kommen noch ${b} Schafe dazu. Wie viele Schafe sind es jetzt?` },
  { op: '+', text: (a, b) => `Mila findet am Montag ${a} Muscheln und am Dienstag ${b} Muscheln. Wie viele Muscheln sind es zusammen?` },
];
const SUB_STORIES: Story[] = [
  { op: '−', text: (a, b) => `Auf dem Baum sitzen ${a} Vögel. ${b} Vögel fliegen weg. Wie viele Vögel sitzen noch auf dem Baum?` },
  { op: '−', text: (a, b) => `In der Dose sind ${a} Kekse. Die Kinder essen ${b} Kekse. Wie viele Kekse sind noch in der Dose?` },
  { op: '−', text: (a, b) => `Ole hat ${a} Luftballons. ${b} Luftballons platzen. Wie viele Luftballons hat er noch?` },
  { op: '−', text: (a, b) => `Im Teich schwimmen ${a} Enten. ${b} Enten watscheln an Land. Wie viele Enten schwimmen noch?` },
  { op: '−', text: (a, b) => `Mila hat ${a} Sticker. Sie schenkt Leo ${b} Sticker. Wie viele Sticker hat Mila noch?` },
];
const ADD100_STORIES: Story[] = [
  { op: '+', text: (a, b) => `Ein Buch kostet ${a} Euro, ein Spiel kostet ${b} Euro. Wie viel kosten beide zusammen?` },
  { op: '+', text: (a, b) => `Die Klasse sammelt ${a} Kastanien, die Nachbarklasse ${b} Kastanien. Wie viele Kastanien sind es zusammen?` },
  { op: '+', text: (a, b) => `Lena ist ${a} cm groß. Ihr Turm aus Bausteinen ist ${b} cm höher als sie. Wie hoch ist der Turm?` },
];
const SUB100_STORIES: Story[] = [
  { op: '−', text: (a, b) => `Lena hat ${a} Euro gespart. Sie kauft ein Spiel für ${b} Euro. Wie viel Geld hat sie noch?` },
  { op: '−', text: (a, b) => `Ein Zug hat ${a} Sitzplätze. ${b} Plätze sind besetzt. Wie viele Plätze sind noch frei?` },
  { op: '−', text: (a, b) => `Ein Buch hat ${a} Seiten. Ben hat schon ${b} Seiten gelesen. Wie viele Seiten fehlen noch?` },
];
/** a = Anzahl der Gruppen, b = Anzahl je Gruppe */
const TIMES_STORIES: Story[] = [
  { op: '·', text: (a, b) => `${a} Kinder haben je ${b} Murmeln. Wie viele Murmeln haben sie zusammen?` },
  { op: '·', text: (a, b) => `In einer Packung sind ${b} Stifte. Papa kauft ${a} Packungen. Wie viele Stifte sind es?` },
  { op: '·', text: (a, b) => `Auf jedem Teller liegen ${b} Kekse. Es gibt ${a} Teller. Wie viele Kekse sind es?` },
  { op: '·', text: (a, b) => `Ein Regal hat ${a} Bretter. Auf jedem Brett stehen ${b} Bücher. Wie viele Bücher sind es?` },
];
/** a = Gesamtzahl, b = Teiler */
const DIV_STORIES: Story[] = [
  { op: ':', text: (a, b) => `${a} Kekse werden gerecht auf ${b} Teller verteilt. Wie viele Kekse liegen auf jedem Teller?` },
  { op: ':', text: (a, b) => `${a} Kinder bilden Gruppen mit je ${b} Kindern. Wie viele Gruppen gibt es?` },
  { op: ':', text: (a, b) => `${a} Euro werden gerecht unter ${b} Kindern geteilt. Wie viel bekommt jedes Kind?` },
];

function stories(stage: number, row: number | undefined, rnd: Rnd): MathSpec {
  const out: { text: string; op: Story['op'] }[] = [];
  // Jede Geschichte höchstens einmal pro Blatt
  const used = new Set<Story>();
  const add = (list: Story[], a: number, b: number) => {
    const free = list.filter((x) => !used.has(x));
    const s = (free.length ? free : list)[int(rnd, 0, (free.length || list.length) - 1)];
    used.add(s);
    out.push({ op: s.op, text: s.text(a, b) });
  };
  while (out.length < 4) {
    if (stage <= 5) {
      const max = stage === 4 ? 10 : 20;
      if (out.length % 2 === 0) { const a = int(rnd, 2, max - 2); const b = int(rnd, 2, max - a); add(ADD_STORIES, a, b); } else { const a = int(rnd, 4, max); const b = int(rnd, 2, a - 1); add(SUB_STORIES, a, b); }
    } else if (stage === 6) {
      if (out.length % 2 === 0) { const a = int(rnd, 12, 70); const b = int(rnd, 5, 99 - a); add(ADD100_STORIES, a, b); } else { const a = int(rnd, 30, 99); const b = int(rnd, 5, a - 5); add(SUB100_STORIES, a, b); }
    } else if (stage === 7) {
      add(TIMES_STORIES, int(rnd, 2, 10), row && row > 1 ? row : int(rnd, 2, 10));
    } else {
      const d = row && row > 1 ? row : int(rnd, 2, 9); const q = int(rnd, 2, 10); add(DIV_STORIES, d * q, d);
    }
  }
  return { kind: 'story', stories: out };
}

function taskFamilies(max: number, rnd: Rnd): MathSpec {
  const triples: [number, number, number][] = [];
  for (let guard = 0; triples.length < 4 && guard < 200; guard++) {
    const a = int(rnd, 1, max - 2); const b = int(rnd, 1, max - a);
    if (a === b || triples.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) continue;
    triples.push([a, b, a + b]);
  }
  return { kind: 'task-family', triples };
}

function neighbors(max: number, rnd: Rnd): MathSpec {
  const pool = shuffle(Array.from({ length: max - 1 }, (_, i) => i + 1), rnd);
  return { kind: 'neighbors', numbers: pool.slice(0, Math.min(15, pool.length)), max };
}

function hundredChart(rnd: Rnd): MathSpec {
  // Die erste Spalte und die Zehnerzahlen bleiben stehen, damit die Ordnung sichtbar ist
  return { kind: 'hundred-chart', shown: Array.from({ length: 100 }, (_, i) => i % 10 === 0 || (i + 1) % 10 === 0 || rnd() < 0.45) };
}

const timesRowOf = (id: string) => Number(/^math\.(?:times|div)\.(\d+)$/.exec(id)?.[1]) || undefined;

/**
 * Zweites Blatt, wenn ein Kind nur an einem Lernziel rechnet: im Wechsel Rechengeschichten,
 * Aufgabenfamilien, Nachbarzahlen, Hundertertafel oder Rechenmauern im selben Zahlenraum.
 */
export function extraMathPage(goal: LearningGoal, rnd: Rnd): MathPage | null {
  const page = (title: string, spec: MathSpec): MathPage => ({ title, goalTitle: goal.title, spec });
  const story = () => page('Rechengeschichten', stories(goal.stage, timesRowOf(goal.id), rnd));
  const wall = () => numberWallPage(goal, rnd);
  const options: (() => MathPage | null)[] = (() => {
    switch (goal.stage) {
      case 1: return [() => page('Male so viele', { kind: 'dot-draw', numbers: shuffle([1, 2, 3, 4, 5], rnd) })];
      case 2: return [() => page('Male so viele', { kind: 'dot-draw', numbers: shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], rnd).slice(0, 6) }), () => page('Nachbarzahlen', neighbors(10, rnd))];
      case 3: return [() => page('Nachbarzahlen', neighbors(10, rnd))];
      case 4: return [story, () => page('Aufgabenfamilien', taskFamilies(10, rnd)), wall];
      case 5: return [story, () => page('Aufgabenfamilien', taskFamilies(20, rnd)), () => page('Nachbarzahlen', neighbors(20, rnd)), wall];
      case 6: return [story, () => page('Die Hundertertafel', hundredChart(rnd)), () => page('Nachbarzahlen', neighbors(100, rnd)), wall];
      case 7: case 8: return [story];
      default: return [];
    }
  })();
  if (!options.length) return null;
  return options[Math.floor(rnd() * options.length)]();
}

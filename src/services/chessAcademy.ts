import { Chess, type Square } from 'chess.js';
import type { FamilyDatabase } from '../database/db';
import type { ChessProgress } from '../types';

export type { ChessProgress };

/**
 * Schachakademie: Brettlogik für die Lektionen. Die Zugregeln kommen aus chess.js,
 * Steine (Hindernisse) werden dafür als eigene Bauern eingesetzt: Sie blockieren wie Figuren,
 * der Springer springt darüber. Sterne sind leere Felder, die man durch Draufziehen einsammelt.
 */

export type PieceCode = 'wK' | 'wQ' | 'wR' | 'wB' | 'wN' | 'wP' | 'bK' | 'bQ' | 'bR' | 'bB' | 'bN' | 'bP';
export type Board = Record<string, PieceCode>;

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const ALL_SQUARES: string[] = Array.from({ length: 64 }, (_, i) => `${FILES[i % 8]}${8 - Math.floor(i / 8)}`);

/** a1 ist dunkel, h1 hell. */
export const isLight = (sq: string) => (FILES.indexOf(sq[0] as (typeof FILES)[number]) + Number(sq[1])) % 2 === 0;

export const START_BOARD: Board = (() => {
  const b: Board = {};
  const back = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'] as const;
  FILES.forEach((f, i) => {
    b[`${f}1`] = `w${back[i]}` as PieceCode;
    b[`${f}2`] = 'wP';
    b[`${f}7`] = 'bP';
    b[`${f}8`] = `b${back[i]}` as PieceCode;
  });
  return b;
})();

export const PIECE_NAME: Record<string, string> = { K: 'König', Q: 'Dame', R: 'Turm', B: 'Läufer', N: 'Springer', P: 'Bauer' };

/** FEN mit Weiß am Zug; Steine werden zu weißen Bauern. */
export function toFen(board: Board, stones: string[] = []): string {
  const at = (sq: string): string => {
    const p = board[sq];
    if (p) return p[0] === 'w' ? p[1] : p[1].toLowerCase();
    return stones.includes(sq) ? 'P' : '';
  };
  const rows: string[] = [];
  for (let r = 8; r >= 1; r--) {
    let row = '';
    let empty = 0;
    for (const f of FILES) {
      const c = at(`${f}${r}`);
      if (!c) { empty++; continue; }
      if (empty) { row += empty; empty = 0; }
      row += c;
    }
    if (empty) row += empty;
    rows.push(row);
  }
  return `${rows.join('/')} w - - 0 1`;
}

/** Erlaubte Zielfelder einer weißen Figur (Steine sind keine Figuren und ziehen nie). */
export function targetsFrom(board: Board, stones: string[], from: string): string[] {
  const piece = board[from];
  if (!piece || piece[0] !== 'w') return [];
  const chess = new Chess(toFen(board, stones), { skipValidation: true });
  return [...new Set(chess.moves({ square: from as Square, verbose: true }).map((m) => m.to as string))];
}

// ------------------------------------------------------------- Übungen

export type ChessExercise =
  /** Felder antippen: alle (`all`) oder eines davon. */
  | { kind: 'tap'; say: string; hint: string; board?: Board; start?: boolean; targets: string[] | 'light' | 'dark'; all?: boolean; noMirror?: boolean }
  /** Zeigen, wohin eine Figur ziehen kann: `count` richtige Felder finden. */
  | { kind: 'moves'; say: string; hint: string; board: Board; stones?: string[]; square: string; count: number }
  /** Alle Sterne einsammeln, mit beliebig vielen Zügen; `par` ist die kleinste Zahl. */
  | { kind: 'collect'; say: string; hint: string; board: Board; stones?: string[]; stars: string[]; flag?: boolean }
  /** Welche Figur holt den Stern mit einem Zug? Die Figur antippen. */
  | { kind: 'which'; say: string; hint: string; board: Board; stones?: string[]; stars: [string] };

export interface ExerciseState { board: Board; stars: string[]; moves: number }

export const initialState = (ex: ChessExercise): ExerciseState => ({
  board: { ...(ex.kind === 'tap' && ex.start ? START_BOARD : ex.board ?? {}) },
  stars: ex.kind === 'collect' || ex.kind === 'which' ? [...ex.stars] : [],
  moves: 0,
});

/** Zielfelder einer Tipp-Aufgabe. */
export const tapTargets = (ex: Extract<ChessExercise, { kind: 'tap' }>): string[] =>
  ex.targets === 'light' ? ALL_SQUARES.filter(isLight) : ex.targets === 'dark' ? ALL_SQUARES.filter((q) => !isLight(q)) : ex.targets;

export function applyMove(state: ExerciseState, from: string, to: string): ExerciseState {
  const board = { ...state.board };
  board[to] = board[from];
  delete board[from];
  return { board, stars: state.stars.filter((s) => s !== to), moves: state.moves + 1 };
}

/** Kleinste Zahl an Zügen, um alle Sterne zu sammeln (Breitensuche), und ein Weg dorthin. */
export function solveCollect(ex: Extract<ChessExercise, { kind: 'collect' }>): { par: number; path: [string, string][] } | null {
  const stones = ex.stones ?? [];
  const key = (s: ExerciseState) => `${Object.entries(s.board).map(([q, p]) => q + p).sort().join(',')}|${[...s.stars].sort().join(',')}`;
  const start = initialState(ex);
  const seen = new Set([key(start)]);
  let frontier: { s: ExerciseState; path: [string, string][] }[] = [{ s: start, path: [] }];
  for (let depth = 0; depth < 12 && frontier.length; depth++) {
    const next: typeof frontier = [];
    for (const { s, path } of frontier) {
      for (const from of Object.keys(s.board)) {
        for (const to of targetsFrom(s.board, stones, from)) {
          const n = applyMove(s, from, to);
          const p: [string, string][] = [...path, [from, to]];
          if (!n.stars.length) return { par: p.length, path: p };
          const k = key(n);
          if (seen.has(k)) continue;
          seen.add(k);
          next.push({ s: n, path: p });
        }
      }
    }
    frontier = next;
  }
  return null;
}

/** Figuren, die den Stern einer „Welche Figur?“-Aufgabe mit einem Zug erreichen. */
export function whichAnswers(ex: Extract<ChessExercise, { kind: 'which' }>): string[] {
  return Object.keys(ex.board).filter((sq) => targetsFrom(ex.board, ex.stones ?? [], sq).includes(ex.stars[0]));
}

/** Spiegelt eine Aufgabe von links nach rechts, damit Wiederholungen anders aussehen. */
const mirrorSq = (sq: string) => `${FILES[7 - FILES.indexOf(sq[0] as (typeof FILES)[number])]}${sq[1]}`;
const mirrorBoard = (b: Board): Board => Object.fromEntries(Object.entries(b).map(([q, p]) => [mirrorSq(q), p]));

export function mirrorExercise(ex: ChessExercise): ChessExercise {
  switch (ex.kind) {
    case 'tap': return ex.noMirror || ex.start || typeof ex.targets === 'string' ? ex : { ...ex, ...(ex.board ? { board: mirrorBoard(ex.board) } : {}), targets: ex.targets.map(mirrorSq) };
    case 'moves': return { ...ex, board: mirrorBoard(ex.board), stones: ex.stones?.map(mirrorSq), square: mirrorSq(ex.square) };
    case 'collect': return { ...ex, board: mirrorBoard(ex.board), stones: ex.stones?.map(mirrorSq), stars: ex.stars.map(mirrorSq) };
    case 'which': return { ...ex, board: mirrorBoard(ex.board), stones: ex.stones?.map(mirrorSq), stars: [mirrorSq(ex.stars[0])] };
  }
}

// ------------------------------------------------------------- Freischalten und Fortschritt

/** So viele Fehler darf eine Runde haben, damit die Lektion als sicher gilt. */
export const SECURE_MAX_MISTAKES = 2;
/** Höchstens so viele neue Lektionen pro Woche (Montag bis Sonntag). */
export const NEW_LESSONS_PER_WEEK = 2;

export type LessonStatus = 'secure' | 'practice' | 'open' | 'locked' | 'week-limit';

export const chessProgressId = (childId: string, lessonId: string) => `${childId}|${lessonId}`;

/** Monday as week start; `iso` is a timestamp, `weekStart` a date key. */
const inWeek = (iso: string | undefined, weekStart: string) => {
  if (!iso) return false;
  const d = new Date(iso);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const end = new Date(`${weekStart}T00:00:00`);
  end.setDate(end.getDate() + 7);
  const endKey = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
  return key >= weekStart && key < endKey;
};

/**
 * Stand jeder Lektion für ein Kind. Die nächste Lektion öffnet sich, wenn die vorige sicher sitzt,
 * höchstens zwei neue pro Woche. Mama oder Papa können jederzeit freigeben.
 */
export function lessonStatuses(lessonIds: string[], progress: ChessProgress[], childId: string, weekStart: string): LessonStatus[] {
  const mine = new Map(progress.filter((p) => p.childId === childId).map((p) => [p.lessonId, p]));
  const newThisWeek = [...mine.values()].filter((p) => inWeek(p.firstCompletedAt, weekStart)).length;
  return lessonIds.map((id, i) => {
    const p = mine.get(id);
    if (p?.completedAt) return p.secure ? 'secure' : 'practice';
    const prev = i > 0 ? mine.get(lessonIds[i - 1]) : undefined;
    const reachable = i === 0 || !!p?.released || !!prev?.secure;
    if (!reachable) return 'locked';
    if (!p?.released && newThisWeek >= NEW_LESSONS_PER_WEEK) return 'week-limit';
    return 'open';
  });
}

/** Ergebnis einer Runde verbuchen. Gibt zurück, ob es die erste geschaffte Runde war (neues Abzeichen). */
export function recordRun(prev: ChessProgress | undefined, childId: string, lessonId: string, mistakes: number, realBoard: number, now: string): { progress: ChessProgress; newBadge: boolean } {
  const secure = (prev?.secure ?? false) || mistakes <= SECURE_MAX_MISTAKES;
  const progress: ChessProgress = {
    ...(prev ?? { id: chessProgressId(childId, lessonId), childId, lessonId, runs: 0, secure: false }),
    runs: (prev?.runs ?? 0) + 1,
    lastMistakes: mistakes,
    firstCompletedAt: prev?.firstCompletedAt ?? now,
    completedAt: now,
    secure,
    realBoard: (prev?.realBoard ?? 0) + realBoard,
    updatedAt: now,
  };
  return { progress, newBadge: !prev?.completedAt };
}

// ------------------------------------------------------------- Speichern

export async function saveChessRun(db: FamilyDatabase, childId: string, lessonId: string, mistakes: number, realBoard: number): Promise<{ progress: ChessProgress; newBadge: boolean }> {
  return db.transaction('rw', db.chessProgress, async () => {
    const prev = await db.chessProgress.get(chessProgressId(childId, lessonId));
    const result = recordRun(prev, childId, lessonId, mistakes, realBoard, new Date().toISOString());
    await db.chessProgress.put(result.progress);
    return result;
  });
}

/** Mama oder Papa geben eine Lektion vorzeitig frei (oder nehmen das zurück). */
export async function setChessRelease(db: FamilyDatabase, childId: string, lessonId: string, released: boolean): Promise<void> {
  const id = chessProgressId(childId, lessonId);
  const prev = await db.chessProgress.get(id);
  await db.chessProgress.put({ ...(prev ?? { id, childId, lessonId, runs: 0, secure: false }), released, updatedAt: new Date().toISOString() });
}

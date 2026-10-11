import { describe, expect, it } from 'vitest';
import { CHESS_LESSONS } from '../src/data/chessLessons';
import { exportData, validateBackup } from '../src/services/backup';
import {
  ALL_SQUARES, applyMove, initialState, isLight, lessonStatuses, mirrorExercise, recordRun, saveChessRun, setChessRelease, solveCollect, START_BOARD,
  tapTargets, targetsFrom, toFen, whichAnswers,
} from '../src/services/chessAcademy';
import type { ChessProgress } from '../src/types';
import { openDb } from './helpers';

describe('Schachbrett', () => {
  it('hat rechts unten ein helles Feld und die richtige Grundstellung', () => {
    expect(isLight('h1')).toBe(true);
    expect(isLight('a1')).toBe(false);
    expect(ALL_SQUARES.filter(isLight)).toHaveLength(32);
    expect(toFen(START_BOARD)).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1');
    expect(START_BOARD.d1).toBe('wQ');
    expect(isLight('d1')).toBe(true); // Die Dame steht auf ihrer Farbe
  });

  it('zieht Figuren nach den echten Regeln; Steine blockieren, das Pferd springt', () => {
    expect(targetsFrom({ a1: 'wR' }, [], 'a1')).toHaveLength(14);
    expect(targetsFrom({ d4: 'wR' }, ['d6', 'b4', 'f4'], 'd4').sort()).toEqual(['c4', 'd1', 'd2', 'd3', 'd5', 'e4']);
    expect(targetsFrom({ c1: 'wB' }, [], 'c1').every((q) => !isLight(q))).toBe(true);
    expect(targetsFrom({ d4: 'wQ' }, [], 'd4')).toHaveLength(27);
    expect(targetsFrom({ d4: 'wN' }, ['c3', 'c4', 'c5', 'd3', 'd5', 'e3', 'e4', 'e5'], 'd4')).toHaveLength(8);
    expect(targetsFrom({ a1: 'wR', a4: 'wB' }, [], 'a1')).not.toContain('a4'); // eigene Figur schlägt man nicht
    const s = applyMove(initialState({ kind: 'collect', say: '', hint: '', board: { a1: 'wR' }, stars: ['a6'] }), 'a1', 'a6');
    expect([s.stars, s.moves, s.board.a6]).toEqual([[], 1, 'wR']);
  });
});

describe('Lektionen', () => {
  it('sind alle lösbar, auch gespiegelt, mit kurzen Wegen und eindeutigen Antworten', () => {
    expect(new Set(CHESS_LESSONS.map((l) => l.id)).size).toBe(CHESS_LESSONS.length);
    for (const l of CHESS_LESSONS) {
      expect(l.exercises.length, l.id).toBeGreaterThanOrEqual(3);
      expect(l.mama.length, l.id).toBeGreaterThan(0);
      for (const original of l.exercises) {
        for (const ex of [original, mirrorExercise(original)]) {
          const name = `${l.id}: ${ex.say}`;
          if (ex.kind === 'collect') {
            const s = solveCollect(ex);
            expect(s, name).not.toBeNull();
            expect(s!.par, name).toBeLessThanOrEqual(4);
            expect(ex.stars.every((q) => !ex.board[q] && !ex.stones?.includes(q)), name).toBe(true);
          }
          if (ex.kind === 'which') expect(whichAnswers(ex), name).toHaveLength(1);
          if (ex.kind === 'moves') expect(targetsFrom(ex.board, ex.stones ?? [], ex.square).length, name).toBeGreaterThanOrEqual(ex.count);
          if (ex.kind === 'tap') expect(tapTargets(ex).every((q) => ALL_SQUARES.includes(q)), name).toBe(true);
        }
      }
      if (l.demo) {
        let at = l.demo.square;
        let board = l.demo.board;
        for (const to of l.demo.path) {
          expect(targetsFrom(board, l.demo.stones ?? [], at), `${l.id} Vorführung`).toContain(to);
          board = { [to]: board[at] };
          at = to;
        }
      }
    }
  });
});

describe('Fortschritt', () => {
  const ids = CHESS_LESSONS.map((l) => l.id);
  const done = (lessonId: string, at: string, secure = true): ChessProgress =>
    ({ id: `k|${lessonId}`, childId: 'k', lessonId, runs: 1, firstCompletedAt: at, completedAt: at, secure, updatedAt: at });

  it('öffnet die nächste Lektion erst, wenn die vorige sitzt, und höchstens zwei neue pro Woche', () => {
    expect(lessonStatuses(ids, [], 'k', '2026-10-12').slice(0, 3)).toEqual(['open', 'locked', 'locked']);
    const wobbly = [done('board', '2026-10-12T10:00:00')].map((p) => ({ ...p, secure: false }));
    expect(lessonStatuses(ids, wobbly, 'k', '2026-10-12').slice(0, 2)).toEqual(['practice', 'locked']);
    const two = [done('board', '2026-10-12T10:00:00'), done('rook', '2026-10-13T10:00:00')];
    expect(lessonStatuses(ids, two, 'k', '2026-10-12').slice(0, 3)).toEqual(['secure', 'secure', 'week-limit']);
    expect(lessonStatuses(ids, two, 'k', '2026-10-19').slice(0, 3)).toEqual(['secure', 'secure', 'open']); // neue Woche
    const released = [...two, { id: 'k|bishop', childId: 'k', lessonId: 'bishop', runs: 0, secure: false, released: true, updatedAt: '' }];
    expect(lessonStatuses(ids, released, 'k', '2026-10-12')[2]).toBe('open');
    expect(lessonStatuses(ids, two, 'anderes-kind', '2026-10-12')[0]).toBe('open');
  });

  it('merkt sich Runden; eine gute Runde macht die Lektion sicher', () => {
    const first = recordRun(undefined, 'k', 'rook', 4, 0, '2026-10-12T10:00:00');
    expect([first.newBadge, first.progress.secure, first.progress.runs]).toEqual([true, false, 1]);
    const second = recordRun(first.progress, 'k', 'rook', 1, 2, '2026-10-14T10:00:00');
    expect([second.newBadge, second.progress.secure, second.progress.runs, second.progress.realBoard, second.progress.firstCompletedAt])
      .toEqual([false, true, 2, 2, '2026-10-12T10:00:00']);
    expect(recordRun(second.progress, 'k', 'rook', 9, 0, 'x').progress.secure).toBe(true); // einmal sicher bleibt sicher
  });

  it('speichert in der Datenbank und kommt mit in die Sicherung', async () => {
    const db = await openDb();
    await saveChessRun(db, 'child-1', 'board', 0, 1);
    await setChessRelease(db, 'child-1', 'queen', true);
    expect(await db.chessProgress.count()).toBe(2);
    const backup = await exportData(db);
    expect(backup.tables.chessProgress).toHaveLength(2);
    expect(validateBackup(backup).ok).toBe(true);
  });
});

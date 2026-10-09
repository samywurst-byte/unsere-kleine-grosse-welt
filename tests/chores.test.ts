import { describe, expect, it } from 'vitest';
import { choresForDate, completeChore, ensureChoreOccurrences, moveChore, skipChore } from '../src/services/chores';
import { FamilyDatabase } from '../src/database/db';
import { freshDbName, openDb } from './helpers';

// 2026-10-06 ist ein Dienstag, 2026-10-10 ein Samstag.
const TUE = '2026-10-06';
const WED = '2026-10-07';
const SAT = '2026-10-10';
const NEXT_TUE = '2026-10-13';

describe('Haushaltsaufgaben', () => {
  it('erzeugt dienstags und samstags je eine Aufgabe pro Kind, an anderen Tagen keine', async () => {
    const db = await openDb();
    for (const d of [TUE, WED, SAT]) await ensureChoreOccurrences(db, d);
    const tue = await choresForDate(db, TUE);
    const sat = await choresForDate(db, SAT);
    expect(tue.map((c) => c.definitionId).sort()).toEqual(['chore-1', 'chore-2', 'chore-3']);
    expect(sat).toHaveLength(3);
    expect(await choresForDate(db, WED)).toHaveLength(0);
  });

  it('ist idempotent: mehrfaches Erzeugen legt keine Duplikate an', async () => {
    const db = await openDb();
    await ensureChoreOccurrences(db, TUE);
    await ensureChoreOccurrences(db, TUE);
    expect(await db.choreOccurrences.count()).toBe(3);
  });

  it('Erledigungen bleiben nach einem Neustart erhalten', async () => {
    const name = freshDbName();
    const db = await openDb(name);
    await ensureChoreOccurrences(db, TUE);
    await completeChore(db, 'chore-1|' + TUE);
    db.close();

    const reopened = new FamilyDatabase(name);
    await reopened.open();
    await ensureChoreOccurrences(reopened, TUE);
    const taro = await reopened.choreOccurrences.get('chore-1|' + TUE);
    expect(taro?.status).toBe('done');
    expect(await reopened.choreOccurrences.count()).toBe(3);
  });

  it('erzeugt in der Folgewoche neue Instanzen und lässt die alte Woche unverändert', async () => {
    const db = await openDb();
    await ensureChoreOccurrences(db, TUE);
    await completeChore(db, 'chore-2|' + TUE);
    await ensureChoreOccurrences(db, NEXT_TUE);
    const next = await choresForDate(db, NEXT_TUE);
    expect(next.every((c) => c.status === 'open')).toBe(true);
    expect((await db.choreOccurrences.get('chore-2|' + TUE))?.status).toBe('done');
  });

  it('verschobene Aufgaben wandern auf den neuen Tag und werden am alten Tag nicht neu erzeugt', async () => {
    const db = await openDb();
    await ensureChoreOccurrences(db, TUE);
    await moveChore(db, 'chore-1|' + TUE, WED);
    await ensureChoreOccurrences(db, TUE);
    expect((await choresForDate(db, TUE)).map((c) => c.childId)).not.toContain('child-1');
    expect((await choresForDate(db, WED)).map((c) => c.definitionId)).toEqual(['chore-1']);
  });

  it('ausgesetzte Aufgaben bleiben sichtbar und gelten nicht als offen', async () => {
    const db = await openDb();
    await ensureChoreOccurrences(db, SAT);
    await skipChore(db, 'chore-3|' + SAT);
    const sat = await choresForDate(db, SAT);
    expect(sat.find((c) => c.childId === 'child-3')?.status).toBe('skipped');
  });

  it('deaktivierte Aufgaben erzeugen keine neuen Instanzen', async () => {
    const db = await openDb();
    await db.choreDefinitions.update('chore-1', { active: false });
    await ensureChoreOccurrences(db, SAT);
    expect((await choresForDate(db, SAT)).map((c) => c.childId)).not.toContain('child-1');
  });
});

describe('Haushaltsaufgaben nach Änderung der Vorlage', () => {
  it('blendet offene Instanzen aus, wenn der Wochentag geändert wurde, erledigte bleiben', async () => {
    const db = await openDb();
    await ensureChoreOccurrences(db, TUE);
    await completeChore(db, 'chore-1|' + TUE);
    await db.choreDefinitions.update('chore-2', { weekdays: [3, 6] });
    const tue = await choresForDate(db, TUE);
    expect(tue.map((c) => c.definitionId).sort()).toEqual(['chore-1', 'chore-3']);
  });
});

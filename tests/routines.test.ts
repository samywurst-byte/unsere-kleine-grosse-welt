import { describe, expect, it } from 'vitest';
import { completedRoutineIds, routinesForChild, setRoutineDone } from '../src/services/routines';
import type { ChildProfile } from '../src/types';
import { openDb } from './helpers';

describe('Routinen', () => {
  it('liefert Kindergarten-Routinen nur an Kindergartentagen', async () => {
    const db = await openDb();
    const defs = await db.routineDefinitions.toArray();
    const monday = routinesForChild(defs, 'child-1', '2026-10-05').map((d) => d.title);
    const sunday = routinesForChild(defs, 'child-1', '2026-10-11').map((d) => d.title);
    expect(monday).toContain('Kindergarten vorbereiten');
    expect(sunday).not.toContain('Kindergarten vorbereiten');
    expect(sunday).toContain('Mindestens 15 Minuten draußen');
  });

  it('speichert Erledigungen pro Kind und Datum ohne Duplikate, kleinstes Kind mit Hilfe', async () => {
    const db = await openDb();
    const def = (await db.routineDefinitions.toArray()).find((d) => d.title === 'Mindestens 15 Minuten draußen')!;
    const small = (await db.members.get('child-3')) as ChildProfile;
    await setRoutineDone(db, def, small, '2026-10-05', true);
    await setRoutineDone(db, def, small, '2026-10-05', true);
    expect(await db.routineOccurrences.count()).toBe(1);
    expect((await db.routineOccurrences.toArray())[0].assisted).toBe(true);
    expect((await completedRoutineIds(db, 'child-3', '2026-10-06')).size).toBe(0);
    await setRoutineDone(db, def, small, '2026-10-05', false);
    expect(await db.routineOccurrences.count()).toBe(0);
  });
});

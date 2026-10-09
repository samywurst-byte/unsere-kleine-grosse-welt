import type { FamilyDatabase } from '../database/db';
import type { ChoreDefinition, ChoreOccurrence, DateKey } from '../types';
import { weekdayOf } from '../utils/dates';

export function choreOccurrenceId(definitionId: string, scheduledDate: DateKey): string {
  return `${definitionId}|${scheduledDate}`;
}

export function choreDefinitionsFor(defs: ChoreDefinition[], date: DateKey): ChoreDefinition[] {
  const wd = weekdayOf(date);
  return defs.filter((d) => d.active && d.weekdays.includes(wd));
}

/**
 * Legt fehlende Instanzen für einen Tag an. Idempotent: vorhandene Instanzen
 * (auch erledigte, ausgesetzte oder verschobene) werden nie überschrieben.
 */
export async function ensureChoreOccurrences(db: FamilyDatabase, date: DateKey): Promise<void> {
  await db.transaction('rw', db.choreDefinitions, db.choreOccurrences, async () => {
    const defs = choreDefinitionsFor(await db.choreDefinitions.toArray(), date);
    for (const def of defs) {
      const id = choreOccurrenceId(def.id, date);
      if (await db.choreOccurrences.get(id)) continue;
      await db.choreOccurrences.add({
        id, definitionId: def.id, childId: def.childId, scheduledDate: date, date, status: 'open', doneTogether: false,
      });
    }
  });
}

/**
 * Instanzen an einem Tag. Offene, nicht verschobene Instanzen, die nicht mehr zur Vorlage passen
 * (Aufgabe deaktiviert oder Wochentag geändert), werden ausgeblendet. Erledigtes bleibt immer sichtbar.
 */
export async function choresForDate(db: FamilyDatabase, date: DateKey): Promise<ChoreOccurrence[]> {
  const [occ, defs] = await Promise.all([
    db.choreOccurrences.where('date').equals(date).toArray(),
    db.choreDefinitions.toArray(),
  ]);
  const defMap = new Map(defs.map((d) => [d.id, d]));
  return occ.filter((o) => {
    if (o.status !== 'open') return true;
    const def = defMap.get(o.definitionId);
    if (!def?.active) return false;
    return o.date !== o.scheduledDate || def.weekdays.includes(weekdayOf(o.scheduledDate));
  });
}

export async function completeChore(db: FamilyDatabase, id: string, together = false): Promise<void> {
  await db.choreOccurrences.update(id, { status: 'done', completedAt: new Date().toISOString(), doneTogether: together });
}

export async function reopenChore(db: FamilyDatabase, id: string): Promise<void> {
  await db.choreOccurrences.update(id, { status: 'open', completedAt: undefined, doneTogether: false });
}

/** Aussetzen: ohne negative Folgen, die Instanz bleibt als "ausgesetzt" sichtbar. */
export async function skipChore(db: FamilyDatabase, id: string): Promise<void> {
  await db.choreOccurrences.update(id, { status: 'skipped' });
}

export type MoveResult = 'moved' | 'conflict' | 'missing';

/**
 * Verschiebt eine Haushaltsaufgabe. Steht dieselbe Aufgabe am Zieltag bereits an
 * (verschoben oder regulär geplant), wird nicht verschoben, damit sie nicht doppelt erscheint.
 */
export async function moveChore(db: FamilyDatabase, id: string, newDate: DateKey): Promise<MoveResult> {
  return db.transaction('rw', db.choreOccurrences, db.choreDefinitions, async () => {
    const occ = await db.choreOccurrences.get(id);
    if (!occ) return 'missing';
    if (occ.date === newDate) return 'moved';
    const sameDay = await db.choreOccurrences.where('date').equals(newDate)
      .and((o) => o.definitionId === occ.definitionId && o.id !== id).count();
    const def = await db.choreDefinitions.get(occ.definitionId);
    const regular = newDate !== occ.scheduledDate && def
      && choreDefinitionsFor([def], newDate).length > 0
      && !(await db.choreOccurrences.get(choreOccurrenceId(def.id, newDate)));
    if (sameDay > 0 || regular) return 'conflict';
    await db.choreOccurrences.update(id, { date: newDate, status: 'open' });
    return 'moved';
  });
}

import type { FamilyDatabase } from '../database/db';
import type { ChildProfile, DateKey, RoutineDefinition, RoutineOccurrence, RoutinePhase } from '../types';
import { weekdayOf } from '../utils/dates';

const PHASE_ORDER: Record<RoutinePhase, number> = { morning: 0, afternoon: 1, evening: 2 };

export function routineOccurrenceId(definitionId: string, childId: string, date: DateKey): string {
  return `${definitionId}|${childId}|${date}`;
}

/**
 * Welche Routinen ein Kind an einem Tag hat. Reine Funktion.
 * `kindergartenDay: false` (Ferien, freier Tag) blendet Kindergarten-Routinen aus.
 */
export function routinesForChild(
  defs: RoutineDefinition[], childId: string, date: DateKey, opts: { kindergartenDay?: boolean } = {},
): RoutineDefinition[] {
  const wd = weekdayOf(date);
  const kg = opts.kindergartenDay ?? true;
  return defs
    .filter((d) => d.active && d.assignedTo.includes(childId) && d.weekdays.includes(wd) && (kg || !d.kindergartenOnly))
    .sort((a, b) => PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase] || a.order - b.order);
}

export async function setRoutineDone(
  db: FamilyDatabase, def: RoutineDefinition, child: ChildProfile, date: DateKey, done: boolean,
): Promise<void> {
  const id = routineOccurrenceId(def.id, child.id, date);
  if (!done) {
    await db.routineOccurrences.delete(id);
    return;
  }
  // put mit deterministischer Id: mehrfaches Antippen erzeugt keine Duplikate.
  const occ: RoutineOccurrence = {
    id, definitionId: def.id, childId: child.id, date, completedAt: new Date().toISOString(), assisted: child.needsHelp,
  };
  await db.routineOccurrences.put(occ);
}

export async function completedRoutineIds(db: FamilyDatabase, childId: string, date: DateKey): Promise<Set<string>> {
  const list = await db.routineOccurrences.where('[childId+date]').equals([childId, date]).toArray();
  return new Set(list.map((o) => o.definitionId));
}

import type { FamilyDatabase } from '../database/db';
import type { ChildProfile, DateKey, RoutineDefinition, RoutineOccurrence, RoutinePhase, SpecialDayMode } from '../types';
import { noKindergartenFor, tasksHiddenFor } from './specialDay';
import { weekdayOf } from '../utils/dates';
import { SCHOOL_ROUTINES } from '../data/schoolRoutines';

const PHASE_ORDER: Record<RoutinePhase, number> = { morning: 0, afternoon: 1, evening: 2 };

export function routineOccurrenceId(definitionId: string, childId: string, date: DateKey): string {
  return `${definitionId}|${childId}|${date}`;
}

/**
 * Welche Routinen ein Kind an einem Tag hat. Reine Funktion.
 * `kindergartenDay: false` (Ferien, freier Tag) blendet Kindergarten-Routinen aus.
 * Ein Sondermodus (krank, Urlaub …) kann für einzelne Kinder alles ausblenden oder den Kindergarten streichen.
 */
export function routinesForChild(
  defs: RoutineDefinition[], childId: string, date: DateKey, opts: { kindergartenDay?: boolean; special?: SpecialDayMode; schoolChild?: boolean } = {},
): RoutineDefinition[] {
  if (tasksHiddenFor(opts.special, childId)) return [];
  const wd = weekdayOf(date);
  const kg = (opts.kindergartenDay ?? true) && !noKindergartenFor(opts.special, childId);
  const stage = opts.schoolChild ? 'school' : 'kindergarten';
  return defs
    .filter((d) => d.active && d.assignedTo.includes(childId) && d.weekdays.includes(wd) && (kg || !d.kindergartenOnly) && (!d.stage || d.stage === stage))
    .sort((a, b) => PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase] || a.order - b.order);
}

/** Ab dem Einschulungsdatum gilt ein Kind als Schulkind: dann erscheinen Schul- statt Kindergartenroutinen. */
export function isSchoolChildOn(child: Pick<ChildProfile, 'schoolEntryDate'>, date: DateKey): boolean {
  return !!child.schoolEntryDate && date >= child.schoolEntryDate;
}

export const schoolRoutineId = (templateId: string, childId: string) => `school-${templateId}-${childId}`;

/**
 * Schulkind-Routinen vorbereiten: werden jetzt angelegt, erscheinen aber erst ab dem Einschulungsdatum.
 * Mehrfaches Antippen legt nichts doppelt an; bereits angepasste Routinen bleiben unverändert.
 */
export async function prepareSchoolRoutines(db: FamilyDatabase, child: ChildProfile): Promise<number> {
  const defs = await db.routineDefinitions.toArray();
  const maxOrder = Math.max(0, ...defs.map((d) => d.order));
  const now = new Date().toISOString();
  const fresh = SCHOOL_ROUTINES.map((t, i): RoutineDefinition => ({
    id: schoolRoutineId(t.id, child.id), title: t.title, icon: t.icon, phase: t.phase, weekdays: t.weekdays, assignedTo: [child.id],
    order: maxOrder + 1 + i, active: true, highlight: false, kindergartenOnly: t.schoolDaysOnly, stage: 'school', createdAt: now,
  })).filter((d) => !defs.some((x) => x.id === d.id));
  await db.routineDefinitions.bulkAdd(fresh);
  return fresh.length;
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

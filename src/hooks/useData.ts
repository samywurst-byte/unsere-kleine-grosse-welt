import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo } from 'react';
import { db } from '../database/db';
import { expandOccurrences, isHolidayOn } from '../services/calendar';
import { choresForDate, ensureChoreOccurrences } from '../services/chores';
import type { ChildProfile, DateKey, EventOccurrence } from '../types';

/** Live-Abfragen: Komponenten aktualisieren sich automatisch, wenn sich Daten ändern. */

export function useSettings() {
  return useLiveQuery(() => db.settings.get('app'), []);
}

export function useMembers() {
  return useLiveQuery(() => db.members.orderBy('sortOrder').toArray(), []);
}

export function useChildren(): ChildProfile[] | undefined {
  const members = useMembers();
  return useMemo(
    () => members?.filter((m): m is ChildProfile => m.role === 'child' && m.active),
    [members],
  );
}

export function useRoutineDefinitions() {
  return useLiveQuery(() => db.routineDefinitions.orderBy('order').toArray(), []);
}

export function useChoreDefinitions() {
  return useLiveQuery(() => db.choreDefinitions.toArray(), []);
}

export function useTimerPresets() {
  return useLiveQuery(() => db.timerPresets.orderBy('order').toArray(), []);
}

export function useRoutineCompletions(date: DateKey) {
  return useLiveQuery(() => db.routineOccurrences.where('date').equals(date).toArray(), [date]);
}

/** Haushaltsinstanzen eines Tages; fehlende werden beim Anzeigen einmalig angelegt. */
export function useChores(date: DateKey | null) {
  useEffect(() => { if (date) void ensureChoreOccurrences(db, date); }, [date]);
  return useLiveQuery(() => (date ? choresForDate(db, date) : []), [date]);
}

export function useOccurrences(from: DateKey, to: DateKey): EventOccurrence[] | undefined {
  const events = useLiveQuery(() => db.events.toArray(), []);
  const exceptions = useLiveQuery(() => db.eventExceptions.toArray(), []);
  const members = useMembers();
  return useMemo(() => {
    if (!events || !exceptions || !members) return undefined;
    return expandOccurrences({ events, exceptions, members, from, to });
  }, [events, exceptions, members, from, to]);
}

export function useIsHoliday(date: DateKey): boolean {
  const occ = useOccurrences(date, date);
  return occ ? isHolidayOn(occ, date) : false;
}

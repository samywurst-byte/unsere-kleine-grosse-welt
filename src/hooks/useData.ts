import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo } from 'react';
import { db } from '../database/db';
import { expandOccurrences, isHolidayOn } from '../services/calendar';
import { choresForDate, ensureChoreOccurrences } from '../services/chores';
import { isKindergartenDay } from '../services/dayPhase';
import { noKindergartenForAll } from '../services/specialDay';
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
  const settings = useSettings();
  const region = settings ? settings.holidayRegion ?? 'BW' : undefined;
  return useMemo(() => {
    if (!events || !exceptions || !members || !region) return undefined;
    return expandOccurrences({ events, exceptions, members, from, to, holidayRegion: region });
  }, [events, exceptions, members, from, to, region]);
}

export function useIsHoliday(date: DateKey): boolean {
  const occ = useOccurrences(date, date);
  return occ ? isHolidayOn(occ, date) : false;
}

/** Ist heute ein echter Kindergartentag (Wochentag laut Einstellungen und keine Ferien)? */
export function useKindergartenDay(date: DateKey): boolean | undefined {
  const settings = useSettings();
  const holiday = useIsHoliday(date);
  const special = useSpecialDay(date);
  const children = useChildren();
  if (!settings || special === undefined || !children) return undefined;
  return isKindergartenDay(date, settings, holiday || noKindergartenForAll(special ?? undefined, children.map((c) => c.id)));
}

/** Sondermodus für diesen Tag; null = keiner. */
export function useSpecialDay(date: DateKey) {
  return useLiveQuery(async () => (await db.specialDays.get(date)) ?? null, [date]);
}

export function useSpecialDays(from: DateKey) {
  return useLiveQuery(() => db.specialDays.where('date').aboveOrEqual(from).toArray(), [from]);
}

export function useMissions() {
  return useLiveQuery(() => db.missions.toArray(), []);
}

export function useMissionCompletions(date?: DateKey) {
  return useLiveQuery(() => (date ? db.missionCompletions.where('date').equals(date).toArray() : db.missionCompletions.toArray()), [date]);
}

export function useStarTransactions() {
  return useLiveQuery(() => db.starTransactions.toArray(), []);
}

export function useWorld() {
  return useLiveQuery(async () => {
    const [countries, unlocks, stamps] = await Promise.all([db.countries.orderBy('order').toArray(), db.countryUnlocks.toArray(), db.passportStamps.toArray()]);
    return { countries, unlocks, stamps };
  }, []);
}

export function useRituals() {
  return useLiveQuery(() => db.rituals.toArray(), []);
}

export function useRitualFavorites() {
  return useLiveQuery(() => db.ritualFavorites.toArray(), []);
}

export function useDeviceMeta() {
  return useLiveQuery(async () => (await db.deviceMeta.get('device')) ?? { id: 'device' as const }, []);
}

export function useLearning(childId: string | undefined) {
  return useLiveQuery(async () => {
    if (!childId) return { observations: [], releases: [] };
    const [observations, releases] = await Promise.all([
      db.learningObservations.where('childId').equals(childId).toArray(),
      db.learningReleases.where('childId').equals(childId).toArray(),
    ]);
    return { observations, releases };
  }, [childId]);
}

/** Lernstand aller Kinder (für das Lernpaket der Woche). */
export function useAllLearning() {
  return useLiveQuery(async () => {
    const [observations, releases] = await Promise.all([db.learningObservations.toArray(), db.learningReleases.toArray()]);
    return { observations, releases };
  }, []);
}

export function useLearningPacks() {
  return useLiveQuery(() => db.learningPacks.orderBy('weekStart').reverse().toArray(), []);
}

export function useFamilyTimeSessions(date: DateKey) {
  return useLiveQuery(() => db.familyTimeSessions.where('date').equals(date).toArray(), [date]);
}

export function useFamilyTimeSessionsBetween(from: DateKey, to: DateKey) {
  return useLiveQuery(() => db.familyTimeSessions.where('date').between(from, to, true, true).toArray(), [from, to]);
}

export function useWeekendAdventures() {
  return useLiveQuery(() => db.weekendAdventures.orderBy('weekend').reverse().toArray(), []);
}

export function useCouncilNote(date: DateKey) {
  return useLiveQuery(async () => (await db.familyCouncilNotes.get(date)) ?? null, [date]);
}

export function useFamilyMemories() {
  return useLiveQuery(() => db.familyMemories.orderBy('date').reverse().toArray(), []);
}

export function useRecipes() {
  return useLiveQuery(() => db.recipes.toArray(), []);
}

/** Alle Wochenpläne (klein: ein Eintrag pro Woche). */
export function useMealPlans() {
  return useLiveQuery(() => db.mealPlans.toArray(), []);
}

export function useShoppingItems() {
  return useLiveQuery(() => db.shoppingItems.orderBy('createdAt').toArray(), []);
}

import type { FamilyDatabase } from '../database/db';
import type { DateKey, SpecialDayKind, SpecialDayMode } from '../types';
import { addDaysKey } from '../utils/dates';

/**
 * Sondermodus „Heute ist alles anders“: krank, Ferien, Ausflug, Besuch, kein Kindergarten, freier Tag.
 * Niemand verliert etwas. Ausgeblendete Aufgaben gelten nicht als vergessen.
 */

export const SPECIAL_KIND: Record<SpecialDayKind, { label: string; emoji: string; text: string; hideByDefault: boolean }> = {
  sick: { label: 'Krank', emoji: '🤒', text: 'Heute ruhen wir uns aus. Gute Besserung!', hideByDefault: true },
  vacation: { label: 'Urlaub', emoji: '🏖️', text: 'Heute ist Urlaub. Genießt die Zeit!', hideByDefault: true },
  trip: { label: 'Ausflug', emoji: '🚗', text: 'Heute sind wir unterwegs.', hideByDefault: true },
  visit: { label: 'Besuch', emoji: '👵', text: 'Heute bekommen wir Besuch.', hideByDefault: false },
  'no-kindergarten': { label: 'Kein Kindergarten', emoji: '🏠', text: 'Heute ist kein Kindergarten.', hideByDefault: false },
  'free-day': { label: 'Freier Tag', emoji: '🌈', text: 'Heute ist ein freier Tag.', hideByDefault: true },
};

export const SPECIAL_KINDS = Object.keys(SPECIAL_KIND) as SpecialDayKind[];

export function affects(special: SpecialDayMode | undefined, childId: string): boolean {
  return !!special && special.childIds.includes(childId);
}

/** Fällt für dieses Kind der Kindergarten aus? (Besuch ändert daran nichts.) */
export function noKindergartenFor(special: SpecialDayMode | undefined, childId: string): boolean {
  return affects(special, childId) && special!.kind !== 'visit';
}

/** Routinen und Haushaltsaufgaben für dieses Kind heute ausblenden? */
export function tasksHiddenFor(special: SpecialDayMode | undefined, childId: string): boolean {
  return affects(special, childId) && special!.hideRoutines;
}

/** Für die ganze Familie kein Kindergartentag, wenn alle Kinder betroffen sind. */
export function noKindergartenForAll(special: SpecialDayMode | undefined, childIds: string[]): boolean {
  return childIds.length > 0 && childIds.every((id) => noKindergartenFor(special, id));
}

/** Für einen oder mehrere Tage festlegen (z. B. Urlaub von bis). Ein Tag hat höchstens einen Sondermodus. */
export async function setSpecialDays(db: FamilyDatabase, from: DateKey, to: DateKey, mode: Omit<SpecialDayMode, 'date'>): Promise<number> {
  const { note, ...rest } = mode;
  const days: SpecialDayMode[] = [];
  for (let d = from; d <= to && days.length < 60; d = addDaysKey(d, 1)) {
    days.push({ ...rest, date: d, ...(note?.trim() ? { note: note.trim() } : {}) });
  }
  await db.specialDays.bulkPut(days);
  return days.length;
}

export async function clearSpecialDay(db: FamilyDatabase, date: DateKey): Promise<void> {
  await db.specialDays.delete(date);
}

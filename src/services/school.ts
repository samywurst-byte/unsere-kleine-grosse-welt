import type { DateKey } from '../types';
import { isValidDateKey } from '../utils/dates';

/** Der Lesepfad beginnt ein Jahr vor dem geplanten Schulbeginn. */
export function readingPathStart(schoolEntryDate: DateKey): DateKey {
  const [y, m, d] = schoolEntryDate.split('-').map(Number);
  const year = y - 1;
  // 29. Februar gibt es im Vorjahr nicht immer
  const lastDay = new Date(year, m, 0).getDate();
  return `${year}-${String(m).padStart(2, '0')}-${String(Math.min(d, lastDay)).padStart(2, '0')}`;
}

export function isValidSchoolEntry(date: DateKey | undefined, birthDate: DateKey | undefined): boolean {
  if (!date) return true;
  if (!isValidDateKey(date)) return false;
  return !birthDate || date > birthDate;
}

export function formatMonthYear(date: DateKey): string {
  const [y, m] = date.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
}

import { addDays, differenceInCalendarDays, differenceInYears, format, parse, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import type { DateKey, TimeOfDay, Weekday } from '../types';

/** Lokales Kalenderdatum als "yyyy-MM-dd". */
export function toDateKey(date: Date): DateKey {
  return format(date, 'yyyy-MM-dd');
}

/** Liest einen DateKey als lokale Mitternacht (nicht UTC). */
export function fromDateKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysKey(key: DateKey, days: number): DateKey {
  return toDateKey(addDays(fromDateKey(key), days));
}

export function weekdayOf(key: DateKey): Weekday {
  return fromDateKey(key).getDay() as Weekday;
}

export function daysBetween(from: DateKey, to: DateKey): number {
  return differenceInCalendarDays(fromDateKey(to), fromDateKey(from));
}

/** Montag der Woche, in der `key` liegt. */
export function weekStartKey(key: DateKey): DateKey {
  return toDateKey(startOfWeek(fromDateKey(key), { weekStartsOn: 1 }));
}

export function weekKeys(startKey: DateKey): DateKey[] {
  return Array.from({ length: 7 }, (_, i) => addDaysKey(startKey, i));
}

/** Kombiniert Datum und Wanduhrzeit zu einem echten lokalen Zeitpunkt (sommerzeitsicher). */
export function atTime(key: DateKey, time: TimeOfDay): Date {
  const [y, m, d] = key.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
}

export function minutesOfDay(time: TimeOfDay): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function nowMinutes(now: Date): number {
  return now.getHours() * 60 + now.getMinutes();
}

export function isValidDateKey(value: unknown): value is DateKey {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = parse(value, 'yyyy-MM-dd', new Date());
  return !Number.isNaN(d.getTime()) && toDateKey(d) === value;
}

export function isValidTime(value: unknown): value is TimeOfDay {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function ageInYears(birthDate: DateKey, today: DateKey): number {
  return differenceInYears(fromDateKey(today), fromDateKey(birthDate));
}

export function formatLong(key: DateKey): string {
  return format(fromDateKey(key), 'EEEE, d. MMMM yyyy', { locale: de });
}

export function formatDayMonth(key: DateKey): string {
  return format(fromDateKey(key), 'd. MMMM', { locale: de });
}

export function formatWeekdayShort(key: DateKey): string {
  return format(fromDateKey(key), 'EEEEEE', { locale: de });
}

export function formatWeekday(key: DateKey): string {
  return format(fromDateKey(key), 'EEEE', { locale: de });
}

export const WEEKDAY_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];
export const WEEKDAY_SHORT: Record<Weekday, string> = { 0: 'So', 1: 'Mo', 2: 'Di', 3: 'Mi', 4: 'Do', 5: 'Fr', 6: 'Sa' };
export const WEEKDAY_LONG: Record<Weekday, string> = {
  0: 'Sonntag', 1: 'Montag', 2: 'Dienstag', 3: 'Mittwoch', 4: 'Donnerstag', 5: 'Freitag', 6: 'Samstag',
};

/** "1 Std. 20 Min." bzw. "45 Min." */
export function formatDuration(totalMinutes: number): string {
  const m = Math.max(0, Math.round(totalMinutes));
  if (m < 60) return `${m} Min.`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h} Std.` : `${h} Std. ${rest} Min.`;
}

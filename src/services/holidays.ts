import type { CalendarEvent, DateKey, HolidayRegion } from '../types';
import { addDaysKey } from '../utils/dates';

/**
 * Gesetzliche Feiertage. An Feiertagen ist kein Kindergarten: die App zeigt dann einen freien Tag.
 * Bisher nur Baden-Württemberg; weitere Bundesländer lassen sich hier ergänzen.
 */

const pad = (n: number) => String(n).padStart(2, '0');
const key = (y: number, m: number, d: number): DateKey => `${y}-${pad(m)}-${pad(d)}`;

/** Ostersonntag (gregorianisch, Gaußsche Osterformel nach Meeus/Jones/Butcher). */
export function easterSunday(year: number): DateKey {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return key(year, month, day);
}

export function publicHolidays(region: HolidayRegion, year: number): { date: DateKey; name: string }[] {
  if (region === 'none') return [];
  const easter = easterSunday(year);
  return [
    { date: key(year, 1, 1), name: 'Neujahr' },
    { date: key(year, 1, 6), name: 'Heilige Drei Könige' },
    { date: addDaysKey(easter, -2), name: 'Karfreitag' },
    { date: addDaysKey(easter, 1), name: 'Ostermontag' },
    { date: key(year, 5, 1), name: 'Tag der Arbeit' },
    { date: addDaysKey(easter, 39), name: 'Christi Himmelfahrt' },
    { date: addDaysKey(easter, 50), name: 'Pfingstmontag' },
    { date: addDaysKey(easter, 60), name: 'Fronleichnam' },
    { date: key(year, 10, 3), name: 'Tag der Deutschen Einheit' },
    { date: key(year, 11, 1), name: 'Allerheiligen' },
    { date: key(year, 12, 25), name: '1. Weihnachtstag' },
    { date: key(year, 12, 26), name: '2. Weihnachtstag' },
  ].sort((x, y) => x.date.localeCompare(y.date));
}

export const HOLIDAY_ID_PREFIX = 'feiertag-';

/** Feiertage im Zeitraum als virtuelle Termine (Kategorie „holiday“), wie die Geburtstage aus den Profilen. */
export function publicHolidayEvents(region: HolidayRegion, from: DateKey, to: DateKey): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  for (let y = Number(from.slice(0, 4)); y <= Number(to.slice(0, 4)); y++) {
    for (const h of publicHolidays(region, y)) {
      if (h.date < from || h.date > to) continue;
      out.push({
        id: `${HOLIDAY_ID_PREFIX}${h.date}`, title: h.name, category: 'holiday', startDate: h.date,
        memberIds: [], packingList: [], createdAt: '', updatedAt: '',
      });
    }
  }
  return out;
}

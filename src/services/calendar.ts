import type { CalendarEvent, DateKey, EventException, EventOccurrence, HolidayRegion, Member, Weekday } from '../types';
import { HOLIDAY_ID_PREFIX, publicHolidayEvents } from './holidays';
import { addDaysKey, atTime, daysBetween, fromDateKey, toDateKey, weekdayOf, weekStartKey } from '../utils/dates';

/**
 * Reine Kalenderlogik: berechnet aus Terminen, Serien und Ausnahmen die konkreten Vorkommen.
 * Gerechnet wird ausschließlich mit lokalen Kalendertagen, daher keine Probleme mit Sommerzeit,
 * Monats- oder Jahreswechsel.
 */

function maxKey(a: DateKey, b: DateKey) { return a > b ? a : b; }
function minKey(a: DateKey, b: DateKey) { return a < b ? a : b; }

function eachDay(from: DateKey, to: DateKey): DateKey[] {
  const out: DateKey[] = [];
  for (let d = from; d <= to; d = addDaysKey(d, 1)) out.push(d);
  return out;
}

/** Alle Plantage einer Serie (ohne Ausnahmen) im Bereich [from, to]. */
export function seriesDates(event: CalendarEvent, from: DateKey, to: DateKey): DateKey[] {
  const rec = event.recurrence;
  if (!rec) {
    const end = event.endDate && event.endDate > event.startDate ? event.endDate : event.startDate;
    const a = maxKey(from, event.startDate);
    const b = minKey(to, end);
    return a <= b ? eachDay(a, b) : [];
  }
  const interval = Math.max(1, Math.floor(rec.interval || 1));
  const last = rec.until ? minKey(to, rec.until) : to;
  const first = maxKey(from, event.startDate);
  if (first > last) return [];

  if (rec.freq === 'weekly') {
    const days: Weekday[] = rec.byWeekday?.length ? rec.byWeekday : [weekdayOf(event.startDate)];
    const anchor = weekStartKey(event.startDate);
    return eachDay(first, last).filter((d) => {
      if (!days.includes(weekdayOf(d))) return false;
      const weeks = Math.floor(daysBetween(anchor, weekStartKey(d)) / 7);
      return weeks % interval === 0;
    });
  }

  // yearly
  const start = fromDateKey(event.startDate);
  const out: DateKey[] = [];
  for (let y = fromDateKey(first).getFullYear(); y <= fromDateKey(last).getFullYear(); y++) {
    if ((y - start.getFullYear()) % interval !== 0) continue;
    const key = yearlyDate(start.getMonth(), start.getDate(), y);
    if (key >= first && key <= last) out.push(key);
  }
  return out;
}

/** 29. Februar wird in Nicht-Schaltjahren am 28. Februar gefeiert. */
function yearlyDate(month: number, day: number, year: number): DateKey {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return toDateKey(new Date(year, month, Math.min(day, lastDay)));
}

export function possessive(name: string): string {
  return /[sßxz]$/i.test(name) ? `${name}'` : `${name}s`;
}

/** Geburtstage aus den Profilen als virtuelle jährliche Termine. */
export function birthdayEvents(members: Member[]): CalendarEvent[] {
  return members
    .filter((m) => m.active && m.birthDate)
    .map((m) => ({
      id: `birthday-${m.id}`,
      title: `${possessive(m.name)} Geburtstag`,
      category: 'birthday' as const,
      startDate: m.birthDate!,
      memberIds: [m.id],
      packingList: [],
      recurrence: { freq: 'yearly' as const, interval: 1 },
      createdAt: '',
      updatedAt: '',
    }));
}

export function occurrenceSortTime(o: EventOccurrence): string {
  return o.departureTime ?? o.startTime ?? '';
}

export function sortOccurrences(list: EventOccurrence[]): EventOccurrence[] {
  return [...list].sort((a, b) =>
    a.date.localeCompare(b.date)
    || occurrenceSortTime(a).localeCompare(occurrenceSortTime(b))
    || a.event.title.localeCompare(b.event.title, 'de'));
}

export function expandOccurrences(params: {
  events: CalendarEvent[];
  exceptions: EventException[];
  members?: Member[];
  from: DateKey;
  to: DateKey;
  /** Gesetzliche Feiertage einblenden. Fehlt = keine (z. B. in Tests). */
  holidayRegion?: HolidayRegion;
}): EventOccurrence[] {
  const { events, exceptions, from, to } = params;
  const holidays = publicHolidayEvents(params.holidayRegion ?? 'none', from, to);
  const all = [...events, ...birthdayEvents(params.members ?? []), ...holidays];
  const byId = new Map(all.map((e) => [e.id, e]));
  const exMap = new Map(exceptions.map((x) => [`${x.eventId}|${x.originalDate}`, x]));
  const out: EventOccurrence[] = [];

  for (const event of all) {
    for (const date of seriesDates(event, from, to)) {
      const ex = exMap.get(`${event.id}|${date}`);
      if (ex) continue; // abgesagt oder verschoben: wird unten behandelt
      out.push({
        key: `${event.id}|${date}`,
        event, date, originalDate: date,
        startTime: event.startTime, endTime: event.endTime, departureTime: event.departureTime,
        isMoved: false,
        generated: event.category === 'birthday' && event.id.startsWith('birthday-') ? 'birthday'
          : event.id.startsWith(HOLIDAY_ID_PREFIX) ? 'public-holiday' : undefined,
      });
    }
  }

  for (const ex of exceptions) {
    if (ex.type !== 'moved' || !ex.newDate || ex.newDate < from || ex.newDate > to) continue;
    const event = byId.get(ex.eventId);
    if (!event) continue;
    // Nur echte Vorkommen der Serie dürfen verschoben werden.
    if (!seriesDates(event, ex.originalDate, ex.originalDate).length) continue;
    out.push({
      key: `${event.id}|${ex.originalDate}`,
      event, date: ex.newDate, originalDate: ex.originalDate,
      startTime: ex.newStartTime ?? event.startTime,
      endTime: ex.newEndTime ?? event.endTime,
      departureTime: ex.newDepartureTime ?? event.departureTime,
      isMoved: true, exception: ex,
    });
  }
  return sortOccurrences(out);
}

export interface UpcomingEvent {
  occurrence: EventOccurrence;
  at: Date;
  kind: 'departure' | 'start';
  minutesUntil: number;
}

/** Nächster Termin mit Uhrzeit nach `now`. Abfahrt hat Vorrang vor Beginn. */
export function nextUpcoming(occurrences: EventOccurrence[], now: Date): UpcomingEvent | undefined {
  let best: UpcomingEvent | undefined;
  for (const o of occurrences) {
    if (o.event.category === 'birthday' || o.event.category === 'holiday') continue;
    const candidates: { time?: string; kind: UpcomingEvent['kind'] }[] = [
      { time: o.departureTime, kind: 'departure' },
      { time: o.startTime, kind: 'start' },
    ];
    for (const c of candidates) {
      if (!c.time) continue;
      const at = atTime(o.date, c.time);
      if (at.getTime() <= now.getTime()) continue;
      if (!best || at < best.at) {
        best = { occurrence: o, at, kind: c.kind, minutesUntil: Math.ceil((at.getTime() - now.getTime()) / 60000) };
      }
      break; // pro Vorkommen nur der früheste zukünftige Zeitpunkt
    }
  }
  return best;
}

export interface UpcomingBirthday {
  member: Member;
  date: DateKey;
  daysUntil: number;
  turningAge: number;
}

export function upcomingBirthdays(members: Member[], today: DateKey, withinDays: number): UpcomingBirthday[] {
  const occ = expandOccurrences({ events: [], exceptions: [], members, from: today, to: addDaysKey(today, withinDays) });
  return occ
    .filter((o) => o.generated === 'birthday')
    .map((o) => {
      const member = members.find((m) => m.id === o.event.memberIds[0])!;
      return {
        member,
        date: o.date,
        daysUntil: daysBetween(today, o.date),
        turningAge: fromDateKey(o.date).getFullYear() - fromDateKey(member.birthDate!).getFullYear(),
      };
    });
}

export function isHolidayOn(occurrences: EventOccurrence[], date: DateKey): boolean {
  return occurrences.some((o) => o.date === date && o.event.category === 'holiday');
}

export { toDateKey };

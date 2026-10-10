import type { CalendarEvent, DateKey, EventException, Member, TimeOfDay, Weekday } from '../types';
import { addDaysKey, minutesOfDay } from '../utils/dates';
import { birthdayEvents, seriesDates } from './calendar';

/**
 * Termine als Kalenderdatei (.ics) für die Handys. Kein Server, keine Synchronisierung:
 * ein Schnappschuss, den man im iPhone-Kalender öffnet. Danach erinnert das Handy selbst.
 */

const BYDAY: Record<Weekday, string> = { 0: 'SU', 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA' };

const VTIMEZONE = [
  'BEGIN:VTIMEZONE', 'TZID:Europe/Berlin',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST', 'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET', 'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
  'END:VTIMEZONE',
];

export function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Zeilen nach RFC 5545 auf höchstens 75 Bytes falten. */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  const parts: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    const limit = parts.length ? 74 : 75;
    if (bytes + n > limit) { parts.push(cur); cur = ''; bytes = 0; }
    cur += ch; bytes += n;
  }
  parts.push(cur);
  return parts.join('\r\n ');
}

const d8 = (key: DateKey) => key.replace(/-/g, '');
const t6 = (time: TimeOfDay) => `${time.replace(':', '')}00`;
const plusMinutes = (time: TimeOfDay, minutes: number): { time: TimeOfDay; dayOffset: number } => {
  const total = minutesOfDay(time) + minutes;
  const m = ((total % 1440) + 1440) % 1440;
  return { time: `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`, dayOffset: Math.floor(total / 1440) };
};

function stamp(now: Date): string {
  return now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

interface Timing { start?: TimeOfDay; end?: TimeOfDay; departure?: TimeOfDay }

function timingLines(date: DateKey, endDate: DateKey | undefined, t: Timing): string[] {
  const start = t.departure && (!t.start || minutesOfDay(t.departure) < minutesOfDay(t.start)) ? t.departure : t.start;
  if (!start) {
    return [`DTSTART;VALUE=DATE:${d8(date)}`, `DTEND;VALUE=DATE:${d8(addDaysKey(endDate && endDate > date ? endDate : date, 1))}`];
  }
  let endTime = t.end && minutesOfDay(t.end) > minutesOfDay(start) ? t.end : undefined;
  let endDay = date;
  if (!endTime) {
    const p = plusMinutes(t.start && t.start !== start ? t.start : start, 60);
    endTime = p.time;
    endDay = addDaysKey(date, p.dayOffset);
  }
  return [`DTSTART;TZID=Europe/Berlin:${d8(date)}T${t6(start)}`, `DTEND;TZID=Europe/Berlin:${d8(endDay)}T${t6(endTime)}`];
}

function description(e: CalendarEvent, names: Map<string, string>, t: Timing): string {
  const lines: string[] = [];
  const who = e.memberIds.map((id) => names.get(id)).filter(Boolean);
  if (who.length) lines.push(`Für: ${who.join(', ')}`);
  if (t.departure) lines.push(`Abfahrt ${t.departure} Uhr${t.start ? `, Beginn ${t.start} Uhr` : ''}`);
  if (e.packingList.length) lines.push(`Mitnehmen: ${e.packingList.join(', ')}`);
  if (e.notes?.trim()) lines.push(e.notes.trim());
  return lines.join('\n');
}

function alarm(minutes: number | undefined): string[] {
  if (!minutes || minutes <= 0) return [];
  return ['BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Erinnerung', `TRIGGER:-PT${Math.round(minutes)}M`, 'END:VALARM'];
}

function rrule(e: CalendarEvent): string | undefined {
  const r = e.recurrence;
  if (!r) return undefined;
  const parts = [`FREQ=${r.freq === 'weekly' ? 'WEEKLY' : 'YEARLY'}`];
  if (r.interval > 1) parts.push(`INTERVAL=${Math.floor(r.interval)}`);
  if (r.freq === 'weekly') {
    parts.push('WKST=MO');
    if (r.byWeekday?.length) parts.push(`BYDAY=${r.byWeekday.map((d) => BYDAY[d]).join(',')}`);
  }
  if (r.until) parts.push(`UNTIL=${d8(r.until)}${e.startTime || e.departureTime ? 'T225959Z' : ''}`);
  return `RRULE:${parts.join(';')}`;
}

export interface IcsInput {
  events: CalendarEvent[];
  exceptions: EventException[];
  members: Member[];
  today: DateKey;
  /** Nur Termine, die seit diesem Zeitpunkt neu sind oder geändert wurden. */
  changedSince?: string;
  includeBirthdays?: boolean;
  now?: Date;
}

/** Baut die Kalenderdatei. Vergangene Einzeltermine und beendete Serien bleiben draußen. */
export function buildIcs(input: IcsInput): { content: string; count: number } {
  const { today, exceptions } = input;
  const now = stamp(input.now ?? new Date());
  const names = new Map(input.members.map((m) => [m.id, m.name]));
  const own = input.events.filter((e) => !input.changedSince || e.updatedAt > input.changedSince);
  const all = [...own, ...(input.includeBirthdays && !input.changedSince ? birthdayEvents(input.members) : [])];
  const lines: string[] = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Unsere kleine grosse Welt//Familienkompass//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:Unsere kleine große Welt', ...VTIMEZONE];
  let count = 0;

  for (const e of all) {
    const last = e.recurrence ? e.recurrence.until : (e.endDate ?? e.startDate);
    if (last && last < today) continue;
    const t: Timing = { start: e.startTime, end: e.endTime, departure: e.departureTime };
    // Die erste echte Wiederholung als Start, damit der Handykalender keinen zusätzlichen Termin erfindet.
    const first = e.recurrence ? seriesDates(e, e.startDate, addDaysKey(e.startDate, e.recurrence.freq === 'yearly' ? 400 : 7 * Math.max(1, e.recurrence.interval) + 7))[0] : e.startDate;
    if (!first) continue;
    const ex = exceptions.filter((x) => x.eventId === e.id);
    const reminder = e.reminderMinutes;
    lines.push('BEGIN:VEVENT', `UID:${e.id}@unsere-kleine-grosse-welt`, `DTSTAMP:${now}`, ...timingLines(first, e.recurrence ? undefined : e.endDate, t),
      `SUMMARY:${escapeText(e.title)}`);
    const desc = description(e, names, t);
    if (desc) lines.push(`DESCRIPTION:${escapeText(desc)}`);
    const rule = rrule(e);
    if (rule) lines.push(rule);
    for (const x of ex) {
      lines.push(t.start || t.departure
        ? `EXDATE;TZID=Europe/Berlin:${d8(x.originalDate)}T${t6((t.departure && (!t.start || minutesOfDay(t.departure) < minutesOfDay(t.start)) ? t.departure : t.start)!)}`
        : `EXDATE;VALUE=DATE:${d8(x.originalDate)}`);
    }
    lines.push(...alarm(reminder), 'END:VEVENT');
    count++;

    for (const x of ex) {
      if (x.type !== 'moved' || !x.newDate || x.newDate < today) continue;
      const mt: Timing = { start: x.newStartTime ?? t.start, end: x.newEndTime ?? t.end, departure: x.newDepartureTime ?? t.departure };
      lines.push('BEGIN:VEVENT', `UID:${e.id}-${x.originalDate}@unsere-kleine-grosse-welt`, `DTSTAMP:${now}`, ...timingLines(x.newDate, undefined, mt),
        `SUMMARY:${escapeText(e.title)}`);
      const md = description(e, names, mt);
      if (md) lines.push(`DESCRIPTION:${escapeText(md)}`);
      lines.push(...alarm(reminder), 'END:VEVENT');
      count++;
    }
  }
  lines.push('END:VCALENDAR');
  return { content: `${lines.map(foldLine).join('\r\n')}\r\n`, count };
}

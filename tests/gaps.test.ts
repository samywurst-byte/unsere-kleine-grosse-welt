import { describe, expect, it } from 'vitest';
import { expandOccurrences, isHolidayOn } from '../src/services/calendar';
import { recordMamaTime, recordPapaTime, isMamaTime, nextPapaDay, papaTimeThisWeek } from '../src/services/familyTime';
import { easterSunday, publicHolidays } from '../src/services/holidays';
import { buildIcs, foldLine } from '../src/services/ics';
import { isSchoolChildOn, prepareSchoolRoutines, routinesForChild } from '../src/services/routines';
import type { CalendarEvent, ChildProfile } from '../src/types';
import { openDb } from './helpers';

describe('Feiertage Baden-Württemberg', () => {
  it('berechnet Ostern und die beweglichen Feiertage', () => {
    expect(easterSunday(2026)).toBe('2026-04-05');
    expect(easterSunday(2027)).toBe('2027-03-28');
    const h = publicHolidays('BW', 2027);
    const by = Object.fromEntries(h.map((x) => [x.name, x.date]));
    expect(by['Karfreitag']).toBe('2027-03-26');
    expect(by['Christi Himmelfahrt']).toBe('2027-05-06');
    expect(by['Pfingstmontag']).toBe('2027-05-17');
    expect(by['Fronleichnam']).toBe('2027-05-27');
    expect(h).toHaveLength(12);
    expect(publicHolidays('none', 2027)).toEqual([]);
  });

  it('zählt im Kalender als freier Tag (kein Kindergarten)', () => {
    const occ = expandOccurrences({ events: [], exceptions: [], from: '2026-10-01', to: '2026-11-02', holidayRegion: 'BW' });
    expect(occ.map((o) => o.event.title)).toEqual(['Tag der Deutschen Einheit', 'Allerheiligen']);
    expect(occ[0].generated).toBe('public-holiday');
    expect(isHolidayOn(occ, '2026-11-01')).toBe(true);
    expect(isHolidayOn(occ, '2026-11-02')).toBe(false);
  });
});

describe('Kalenderdatei fürs Handy', () => {
  const base = { packingList: [], createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z', memberIds: ['papa'] };
  const events: CalendarEvent[] = [
    { ...base, id: 'training', title: 'Training; Halle 2', category: 'appointment', startDate: '2026-10-01', startTime: '16:30', endTime: '17:30',
      departureTime: '16:10', reminderMinutes: 15, recurrence: { freq: 'weekly', interval: 1, byWeekday: [4] } },
    { ...base, id: 'old', title: 'Vorbei', category: 'appointment', startDate: '2026-09-01' },
    { ...base, id: 'ferien', title: 'Herbstferien', category: 'holiday', startDate: '2026-10-26', endDate: '2026-10-30', updatedAt: '2026-10-09T00:00:00Z' },
  ];
  const members = [{ id: 'papa', name: 'Papa', role: 'parent', active: true, sortOrder: 1 }] as never[];

  it('enthält Serien mit Regel, Erinnerung und Ausnahmen, aber keine vergangenen Termine', () => {
    const { content, count } = buildIcs({
      events, members, today: '2026-10-10', now: new Date('2026-10-10T12:00:00Z'),
      exceptions: [{ id: 'x', eventId: 'training', originalDate: '2026-10-15', type: 'moved', newDate: '2026-10-16' }],
    });
    expect(count).toBe(3);
    expect(content).toContain('DTSTART;TZID=Europe/Berlin:20261001T161000');
    expect(content).toContain('RRULE:FREQ=WEEKLY;WKST=MO;BYDAY=TH');
    expect(content).toContain('EXDATE;TZID=Europe/Berlin:20261015T161000');
    expect(content).toContain('DTSTART;TZID=Europe/Berlin:20261016T161000');
    expect(content).toContain('TRIGGER:-PT15M');
    expect(content).toContain('SUMMARY:Training\\; Halle 2');
    expect(content).toContain('DTSTART;VALUE=DATE:20261026');
    expect(content).toContain('DTEND;VALUE=DATE:20261031');
    expect(content).not.toContain('Vorbei');
    expect(content.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
  });

  it('exportiert auf Wunsch nur Neues seit dem letzten Export', () => {
    const { count, content } = buildIcs({ events, exceptions: [], members, today: '2026-10-10', changedSince: '2026-10-05T00:00:00Z' });
    expect(count).toBe(1);
    expect(content).toContain('Herbstferien');
  });

  it('faltet lange Zeilen ohne Umlaute zu zerreißen', () => {
    const folded = foldLine(`DESCRIPTION:${'ä'.repeat(60)}`);
    expect(folded.split('\r\n ').join('')).toBe(`DESCRIPTION:${'ä'.repeat(60)}`);
  });
});

describe('Papa-Zeit', () => {
  it('wird getrennt von der Mama-Zeit gezählt, pro Woche', async () => {
    const db = await openDb();
    await recordMamaTime(db, 'child-1', '2026-10-10', 'read');
    await recordPapaTime(db, 'child-1', '2026-10-10', 'build');
    const all = await db.familyTimeSessions.toArray();
    expect(all.filter(isMamaTime)).toHaveLength(1);
    expect(papaTimeThisWeek(all, 'child-1', '2026-10-11')).toHaveLength(1);
    expect(papaTimeThisWeek(all, 'child-1', '2026-10-12')).toHaveLength(0);
    expect(nextPapaDay('2026-10-12', [6, 0])).toBe('2026-10-17');
    expect(nextPapaDay('2026-10-11', [6, 0])).toBe('2026-10-11');
  });
});

describe('Schulkind-Routinen', () => {
  it('erscheinen erst ab dem Einschulungsdatum, Kindergartenroutinen enden dann', async () => {
    const db = await openDb();
    const child = { ...(await db.members.get('child-1')), schoolEntryDate: '2027-09-14' } as ChildProfile;
    expect(await prepareSchoolRoutines(db, child)).toBe(7);
    expect(await prepareSchoolRoutines(db, child)).toBe(0);
    await db.routineDefinitions.put({ id: 'kg-bag', title: 'Kindergartentasche', icon: 'backpack', phase: 'morning', weekdays: [1, 2, 3, 4, 5],
      assignedTo: ['child-1'], order: 99, active: true, highlight: false, kindergartenOnly: true, stage: 'kindergarten', createdAt: '' });
    const defs = await db.routineDefinitions.toArray();
    const ids = (date: string) => routinesForChild(defs, 'child-1', date, { kindergartenDay: true, schoolChild: isSchoolChildOn(child, date) }).map((d) => d.id);
    expect(ids('2027-09-13')).toContain('kg-bag');
    expect(ids('2027-09-13').some((id) => id.startsWith('school-'))).toBe(false);
    expect(ids('2027-09-14')).toContain('school-homework-child-1');
    expect(ids('2027-09-14')).not.toContain('kg-bag');
  });
});

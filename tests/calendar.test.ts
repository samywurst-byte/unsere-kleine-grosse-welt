import { describe, expect, it } from 'vitest';
import { expandOccurrences, nextUpcoming, seriesDates, upcomingBirthdays } from '../src/services/calendar';
import { buildSeed } from '../src/data/seed';
import type { CalendarEvent, EventException } from '../src/types';

const base: CalendarEvent = {
  id: 'e1', title: 'Kinderturnen', category: 'appointment', startDate: '2026-10-07', startTime: '15:30',
  memberIds: [], packingList: [], recurrence: { freq: 'weekly', interval: 1, byWeekday: [3] }, createdAt: '', updatedAt: '',
};

describe('Wiederkehrende Termine', () => {
  it('funktionieren über Monats- und Jahreswechsel', () => {
    const dates = seriesDates(base, '2026-12-20', '2027-01-20');
    expect(dates).toEqual(['2026-12-23', '2026-12-30', '2027-01-06', '2027-01-13', '2027-01-20']);
    expect(seriesDates(base, '2026-10-26', '2026-11-08')).toEqual(['2026-10-28', '2026-11-04']);
  });

  it('beginnen nicht vor dem Startdatum und enden am Enddatum', () => {
    const ev = { ...base, recurrence: { ...base.recurrence!, until: '2026-10-21' } };
    expect(seriesDates(ev, '2026-09-01', '2026-12-31')).toEqual(['2026-10-07', '2026-10-14', '2026-10-21']);
  });

  it('unterstützen einen Zwei-Wochen-Rhythmus', () => {
    const ev = { ...base, recurrence: { freq: 'weekly' as const, interval: 2, byWeekday: [3 as const] } };
    expect(seriesDates(ev, '2026-10-01', '2026-11-10')).toEqual(['2026-10-07', '2026-10-21', '2026-11-04']);
  });

  it('bleiben über die Zeitumstellung auf derselben Wanduhrzeit', () => {
    // 25.10.2026: Ende der Sommerzeit in Deutschland.
    const occ = expandOccurrences({ events: [base], exceptions: [], from: '2026-10-21', to: '2026-10-28' });
    expect(occ.map((o) => [o.date, o.startTime])).toEqual([['2026-10-21', '15:30'], ['2026-10-28', '15:30']]);
  });

  it('berechnen die Restzeit über die Zeitumstellung korrekt', () => {
    const occ = expandOccurrences({ events: [base], exceptions: [], from: '2026-10-24', to: '2026-10-31' });
    const now = new Date(2026, 9, 24, 15, 30); // Samstag 15:30 MESZ
    const next = nextUpcoming(occ, now)!;
    expect(next.occurrence.date).toBe('2026-10-28');
    // 4 Tage + 1 Stunde (zurückgestellte Uhr) = 97 Stunden echter Zeit
    expect(next.minutesUntil).toBe(97 * 60);
  });

  it('berücksichtigen abgesagte und verschobene Einzeltermine', () => {
    const exceptions: EventException[] = [
      { id: 'x1', eventId: 'e1', originalDate: '2026-10-14', type: 'cancelled' },
      { id: 'x2', eventId: 'e1', originalDate: '2026-10-21', type: 'moved', newDate: '2026-10-22', newStartTime: '16:00' },
    ];
    const occ = expandOccurrences({ events: [base], exceptions, from: '2026-10-12', to: '2026-10-25' });
    expect(occ.map((o) => [o.date, o.startTime, o.isMoved])).toEqual([['2026-10-22', '16:00', true]]);
  });

  it('zeigt ein in den Bereich verschobenes Vorkommen, auch wenn der Originaltag außerhalb liegt', () => {
    const exceptions: EventException[] = [
      { id: 'x', eventId: 'e1', originalDate: '2026-10-28', type: 'moved', newDate: '2026-10-26' },
    ];
    const occ = expandOccurrences({ events: [base], exceptions, from: '2026-10-26', to: '2026-10-27' });
    expect(occ.map((o) => o.originalDate)).toEqual(['2026-10-28']);
  });

  it('mehrtägige Ferien erscheinen an jedem Tag', () => {
    const holiday: CalendarEvent = { ...base, id: 'h', category: 'holiday', startDate: '2026-12-23', endDate: '2027-01-02', recurrence: undefined };
    expect(seriesDates(holiday, '2026-12-30', '2027-01-05')).toEqual(['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02']);
  });

  it('Abfahrt hat Vorrang vor Beginn beim nächsten Termin', () => {
    const seed = buildSeed('2026-10-05');
    const occ = expandOccurrences({ events: seed.events, exceptions: [], from: '2026-10-09', to: '2026-10-10' });
    const next = nextUpcoming(occ, new Date(2026, 9, 9, 13, 0))!; // Freitag 13:00
    expect(next.occurrence.event.title).toBe('Beispiel: Sportkurs');
    expect(next.kind).toBe('departure');
    expect(next.minutesUntil).toBe(120);
  });
});

describe('Geburtstage', () => {
  it('werden aus den Profilen berechnet, mit Countdown und Alter', () => {
    const seed = buildSeed('2026-10-05');
    const members = seed.members.map((m) => (m.id === 'child-1' ? { ...m, birthDate: '2021-03-10' } : m));
    const list = upcomingBirthdays(members, '2027-03-05', 30);
    expect(list).toHaveLength(1);
    expect(list[0].member.name).toBe('Kind 1');
    expect(list[0].daysUntil).toBe(5);
    expect(list[0].turningAge).toBe(6);
  });

  it('29. Februar wird in Nicht-Schaltjahren am 28. gefeiert', () => {
    const ev: CalendarEvent = { ...base, id: 'b', startDate: '2024-02-29', recurrence: { freq: 'yearly', interval: 1 } };
    expect(seriesDates(ev, '2027-01-01', '2028-12-31')).toEqual(['2027-02-28', '2028-02-29']);
  });
});

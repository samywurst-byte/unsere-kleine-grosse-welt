import { describe, expect, it } from 'vitest';
import { DISCOVER_TOPIC_BY_ID } from '../src/data/discover';
import { EXPLORER_MODULES } from '../src/data/explorerModules';
import { exportData, validateBackup } from '../src/services/backup';
import {
  answerQuestion, childRoles, currentModule, drawQuestion, explorerTeaser, nextSunday, prepToShopping, saveEntry, setSundayDate, setSundayStatus, sundayDate, sundayToCalendar,
  yearProgress, yearsOf,
} from '../src/services/explorer';
import { fromDateKey } from '../src/utils/dates';
import { openDb } from './helpers';

describe('Handbuchdaten', () => {
  it('hat 7 Entdeckerjahre mit je 6 Themen, Sonntage im Abstand von zwei Wochen', () => {
    expect(EXPLORER_MODULES).toHaveLength(42);
    const years = yearsOf();
    expect(years).toHaveLength(7);
    expect(years.every((y) => y.modules.length === 6)).toBe(true);
    expect(years[0].title).toBe('Unsere Welt ist riesig');
    for (const m of EXPLORER_MODULES) {
      expect(fromDateKey(m.homeDate).getDay()).toBe(0);
      expect(fromDateKey(m.tripDate).getDay()).toBe(0);
      expect((fromDateKey(m.tripDate).getTime() - fromDateKey(m.homeDate).getTime()) / 86_400_000).toBeCloseTo(14, 0);
      expect(m.ideas).toHaveLength(3);
      expect(m.steps.length).toBeGreaterThanOrEqual(4);
      expect(m.prep.length).toBeGreaterThan(0);
      expect(m.trip.place).not.toBe('');
      if (m.topicId) expect(DISCOVER_TOPIC_BY_ID.has(m.topicId)).toBe(true);
      expect(m.steps.join(' ')).not.toMatch(/Familienhandbuch|ENTDECKERSONNTAGE/);
    }
  });
});

describe('Ablauf', () => {
  it('findet das aktuelle Thema und den nächsten offenen Sonntag', () => {
    expect(currentModule('2026-10-10')?.title).toBe('Unser Planet Erde');
    expect(currentModule('2027-06-01')?.id).toBe('2027-10');
    expect(nextSunday('2026-10-10', [])).toMatchObject({ kind: 'trip', date: '2026-10-18' });
    expect(nextSunday('2026-10-10', [{ id: '2026-10|trip', moduleId: '2026-10', kind: 'trip', status: 'skipped' }])).toMatchObject({ kind: 'home', date: '2026-11-01' });
    expect(currentModule('2033-05-01')).toBeUndefined();
  });

  it('ordnet die Kinder nach Alter zu', () => {
    const roles = childRoles([
      { id: 'taro', birthDate: '2021-03-01', sortOrder: 1 }, { id: 'talisa', birthDate: '2024-01-01', sortOrder: 3 }, { id: 'taavi', birthDate: '2022-05-01', sortOrder: 2 },
    ]);
    expect([...roles.entries()]).toEqual([['talisa', 'youngest'], ['taavi', 'middle'], ['taro', 'oldest']]);
    expect([...childRoles([{ id: 'a', birthDate: '2020-01-01', sortOrder: 1 }])]).toEqual([['a', 'oldest']]);
  });

  it('verschiebt, plant in den Kalender und hakt ab', async () => {
    const db = await openDb();
    const m = EXPLORER_MODULES[0];
    await sundayToCalendar(db, m, 'trip', ['child-1']);
    await sundayToCalendar(db, m, 'trip', ['child-1']);
    expect((await db.events.toArray()).filter((e) => e.title === 'Entdeckerausflug: experimenta Heilbronn')).toHaveLength(1);
    await setSundayDate(db, m, 'trip', '2026-10-25');
    const sundays = await db.explorerSundays.toArray();
    expect(sundayDate(m, 'trip', sundays)).toBe('2026-10-25');
    const ev = await db.events.get(sundays[0].eventId!);
    expect(ev?.startDate).toBe('2026-10-25');
    await setSundayStatus(db, m.id, 'home', 'done', '2026-10-04');
    expect(yearProgress(yearsOf()[0].modules, await db.explorerSundays.toArray())).toEqual({ done: 1, total: 12 });
  });

  it('bringt die Vorbereitung ohne Doppelte auf die Einkaufsliste', async () => {
    const db = await openDb();
    const m = EXPLORER_MODULES[0];
    expect(await prepToShopping(db, m)).toBe(m.prep.length);
    expect(await prepToShopping(db, m)).toBe(0);
  });
});

describe('Entdeckerbuch und Frageglas', () => {
  it('speichert die Sätze wortwörtlich, legt eine Erinnerung an und füllt das Frageglas', async () => {
    const db = await openDb();
    const m = EXPLORER_MODULES[1];
    const id = await saveEntry(db, m, {
      moduleId: m.id, kind: 'home', date: '2026-11-01', photos: [], sentences: [{ childId: 'child-1', text: ' Der T-Rex hatte kleine Arme. ' }, { childId: 'child-2', text: '' }],
      favorite: 'Dinos ausgraben', question: 'Warum sind die Dinos weg?',
    }, ['child-1', 'child-2']);
    const entry = await db.explorerEntries.get(id);
    expect(entry?.sentences).toEqual([{ childId: 'child-1', text: 'Der T-Rex hatte kleine Arme.' }]);
    const mem = await db.familyMemories.get(entry!.memoryId!);
    expect(mem?.text).toContain('„Der T-Rex hatte kleine Arme.“');
    expect(mem?.source).toEqual({ kind: 'explorer', id });
    // Erneut speichern ändert dieselbe Seite und Erinnerung, die Frage kommt nicht doppelt
    await saveEntry(db, m, { ...entry!, favorite: 'Salzteig' }, ['child-1'], id);
    expect(await db.explorerEntries.count()).toBe(1);
    expect(await db.familyMemories.where('id').equals(entry!.memoryId!).count()).toBe(1);
    expect(await db.jarQuestions.count()).toBe(1);
    const q = (await db.jarQuestions.toArray())[0];
    expect(drawQuestion([q], () => 0)?.id).toBe(q.id);
    await answerQuestion(db, q.id, 'Ein großer Meteorit', 'Museum am Löwentor', '2026-11-15');
    const answered = await db.jarQuestions.get(q.id);
    expect(answered?.answer).toBe('Ein großer Meteorit');
    expect(drawQuestion([answered!])).toBeUndefined();
    const backup = await exportData(db);
    expect(validateBackup(JSON.parse(JSON.stringify(backup))).ok).toBe(true);
  });
});

describe('Ankündigung des Entdeckersonntags', () => {
  it('erscheint ab Donnerstag vor dem nächsten offenen Sonntag und verschwindet, wenn er erledigt ist', () => {
    expect(explorerTeaser('2026-10-14', [])).toBeUndefined(); // Mittwoch
    const thu = explorerTeaser('2026-10-15', []);
    expect([thu?.module.id, thu?.kind, thu?.daysLeft]).toEqual(['2026-10', 'trip', 3]);
    expect(explorerTeaser('2026-10-17', [])?.daysLeft).toBe(1);
    expect(explorerTeaser('2026-10-18', [])?.daysLeft).toBe(0);
    expect(explorerTeaser('2026-10-18', [{ id: '2026-10|trip', moduleId: '2026-10', kind: 'trip', status: 'done' }])).toBeUndefined();
    // verschoben: die Ankündigung folgt dem neuen Datum
    expect(explorerTeaser('2026-10-22', [{ id: '2026-10|trip', moduleId: '2026-10', kind: 'trip', status: 'open', date: '2026-10-25' }])?.daysLeft).toBe(3);
  });
});

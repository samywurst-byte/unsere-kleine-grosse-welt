import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { buildArchive, byMonth, filterArchive, matchesQuery, securedOn, yearReview, type ArchiveSource } from '../src/services/archive';
import { renderArchiveBook } from '../src/services/archivePdf';
import type { LearningObservation, Member } from '../src/types';

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const member = (id: string, name: string, role: 'parent' | 'child', sortOrder: number) =>
  ({ id, name, role, sortOrder, active: true, avatar: 'fox', color: 'sky', birthDate: '2021-01-01' }) as unknown as Member;
const members = [member('mama', 'Mama', 'parent', 0), member('k1', 'Kind Eins', 'child', 1), member('k2', 'Kind Zwei', 'child', 2)];

const obs = (goalId: string, date: string, level: LearningObservation['level'] = 'independent'): LearningObservation =>
  ({ id: `${goalId}${date}${Math.random()}`, childId: 'k1', goalId, date, level, createdAt: `${date}T10:00:00Z` }) as LearningObservation;

function source(over: Partial<ArchiveSource> = {}): ArchiveSource {
  return {
    members, memories: [], projects: [], explorerEntries: [], adventures: [], rituals: [], councilNotes: [], countries: [], unlocks: [], stamps: [],
    observations: [], savingsGoals: [], questions: [], discoveries: [], sessions: [], ...over,
  };
}

const project = {
  id: 'p1', ideaId: 'lanterns', title: 'Laternen basteln', emoji: '🏮', status: 'done', childIds: ['k1', 'k2'], levels: {}, areas: [], steps: [], tasks: [], materials: [], money: [],
  entries: [{ id: 'e1', date: '2026-11-02', text: 'Kleister überall', photos: [PNG] }], startDate: '2026-10-28', doneAt: '2026-11-05', reflection: 'Papier reißt leicht.',
  memoryId: 'm-project', createdAt: '2026-10-28T10:00:00Z', updatedAt: '2026-11-05T10:00:00Z',
} as ArchiveSource['projects'][number];

describe('Familienarchiv', () => {
  it('fasst Projekt, Entdeckerbuch und Abenteuer mit ihrer Erinnerung zu je einem Eintrag zusammen', () => {
    const items = buildArchive(source({
      projects: [project, { ...project, id: 'p2', status: 'active', memoryId: undefined }],
      memories: [
        { id: 'm-project', date: '2026-11-05', title: 'Laternen', memberIds: ['k1'], photos: [PNG, 'data:image/jpeg;base64,AAAA'], source: { kind: 'project', id: 'p1' }, createdAt: 'x' },
        { id: 'm-explorer', date: '2026-10-11', title: 'Zeitreise', memberIds: ['k1', 'k2'], source: { kind: 'explorer', id: 'x1' }, createdAt: 'x' },
        { id: 'm-adv', date: '2026-10-17', title: 'Waldtag mit Picknick', memberIds: ['mama', 'k1'], source: { kind: 'adventure', id: '2026-10-16' }, createdAt: 'x' },
        { id: 'm-own', date: '2026-10-20', title: 'Erster Schnee', photo: PNG, memberIds: ['k2'], createdAt: 'x' },
      ],
      explorerEntries: [{ id: 'x1', moduleId: '2026-10', kind: 'home', date: '2026-10-11', photos: [], sentences: [{ childId: 'k1', text: 'Die Erde ist alt.' }], favorite: 'Der Zeitstrahl', memoryId: 'm-explorer', createdAt: 'x' }],
      adventures: [
        { id: '2026-10-16', weekend: '2026-10-16', status: 'done', title: 'Waldtag', emoji: '🌲', day: '2026-10-17', packing: [], updatedAt: 'x' },
        { id: '2026-10-23', weekend: '2026-10-23', status: 'cancelled', title: 'Zoo', emoji: '🦁', packing: [], updatedAt: 'x' },
      ],
    }));
    expect(items.map((i) => i.id)).toEqual(['project|p1', 'memory|m-own', 'adventure|2026-10-16', 'explorer|x1']);
    const p = items[0];
    expect(p.photos).toHaveLength(2); // Tagebuchfoto und Erinnerungsfoto ohne Doppel
    expect(p.text).toBe('Papier reißt leicht.');
    expect(p.quotes[0].text).toBe('Kleister überall');
    expect(items[2].title).toBe('Waldtag mit Picknick');
    expect(items[3].quotes).toEqual([{ memberId: 'k1', text: 'Die Erde ist alt.' }]);
    expect(items[3].link).toBe('/entdecken/sonntage/2026-10');
    expect(items[1].photos).toEqual([PNG]); // ältere Erinnerung mit nur einem Foto
  });

  it('nimmt Gelerntes erst auf, wenn es weitgehend sicher ist, und bündelt es je Monat', () => {
    const first = [obs('read.letter.M', '2026-10-01'), obs('read.letter.M', '2026-10-01'), obs('read.letter.M', '2026-10-03')];
    expect(securedOn(first)).toBe('2026-10-03');
    expect(securedOn(first.slice(0, 2))).toBeUndefined();
    const items = buildArchive(source({
      observations: [...first, obs('read.letter.A', '2026-10-05'), obs('read.letter.A', '2026-10-06'), obs('read.letter.A', '2026-10-07', 'little-help'),
        obs('read.letter.L', '2026-10-05', 'not-yet'), obs('read.letter.I', '2026-11-02'), obs('read.letter.I', '2026-11-04'), obs('read.letter.I', '2026-11-04')],
    }));
    const learned = items.filter((i) => i.kind === 'learning');
    expect(learned).toHaveLength(2);
    expect(learned[1].date).toBe('2026-10-07');
    expect(learned[1].text).toContain('M');
    expect(learned[1].text).not.toContain('L');
    expect(learned[1].title).toBe('Kind Eins kann jetzt sicher');
  });

  it('sucht ohne Rücksicht auf Umlaute und Groß- und Kleinschreibung und filtert nach Kind, Art und Jahr', () => {
    const items = buildArchive(source({
      memories: [
        { id: 'a', date: '2026-12-24', title: 'Plätzchen backen', memberIds: ['k1'], createdAt: 'x' },
        { id: 'b', date: '2027-01-02', title: 'Schlittenfahren', text: 'Kind Zwei war mutig', memberIds: ['k2'], photos: [PNG], createdAt: 'x' },
      ],
      rituals: [{ id: 'r', ritualId: 'x', title: 'Adventskranz', emoji: '🕯️', date: '2026-11-29', status: 'done', materials: [], createdAt: 'x' }],
    }));
    expect(matchesQuery(items.find((i) => i.id === 'memory|a')!, 'platzchen')).toBe(true);
    expect(filterArchive(items, { query: 'MUTIG' }).map((i) => i.id)).toEqual(['memory|b']);
    expect(filterArchive(items, { query: 'kind eins backen' }, members).map((i) => i.id)).toEqual(['memory|a']);
    expect(filterArchive(items, { memberId: 'k2' }).map((i) => i.id)).toEqual(['memory|b', 'ritual|r']);
    expect(filterArchive(items, { kinds: ['ritual'] })).toHaveLength(1);
    expect(filterArchive(items, { year: 2026 })).toHaveLength(2);
    expect(filterArchive(items, { onlyPhotos: true })).toHaveLength(1);
    expect(byMonth(items).map((g) => g.month)).toEqual(['2027-01', '2026-12', '2026-11']);
  });

  it('zählt im Jahresrückblick je Kind Mama-Zeit, Papa-Zeit, Stempel und eigene Sätze', () => {
    const src = source({
      sessions: [
        { id: '1', childId: 'k1', date: '2026-10-01', activity: 'read' }, { id: '2', childId: 'k1', date: '2026-10-02', activity: 'read' },
        { id: '3', childId: 'k1', date: '2026-10-04', activity: 'ball', parent: 'papa' }, { id: '4', childId: 'k1', date: '2025-10-01', activity: 'read' },
      ],
      stamps: [{ id: 's', childId: 'k2', countryId: 'it', stampedAt: '2026-10-09T10:00:00Z' }],
      countries: [{ id: 'it', nameDe: 'Italien', capital: 'Rom', continent: 'Europa', flagEmoji: '🇮🇹', greeting: { word: 'Ciao', language: 'Italienisch' }, order: 1, lat: 0, lng: 0 }],
      unlocks: [{ countryId: 'it', unlockedAt: '2026-10-09T10:00:00Z', starTransactionId: 't' }],
      explorerEntries: [{ id: 'x1', moduleId: '2026-10', kind: 'trip', date: '2026-10-25', photos: [PNG], sentences: [{ childId: 'k2', text: 'Riesig!' }], createdAt: 'x' }],
    });
    const items = buildArchive(src);
    const r = yearReview(items, src, 2026);
    expect(r.counts).toEqual([{ kind: 'explorer', count: 1 }, { kind: 'world', count: 1 }]);
    expect(r.photos).toBe(1);
    const [k1, k2] = r.children;
    expect([k1.mamaTimes, k1.papaTimes, k1.stamps]).toEqual([2, 1, 0]);
    expect(k2.stamps).toBe(1);
    expect(k2.quotes).toEqual([{ date: '2026-10-25', text: 'Riesig!' }]);
    expect(items.find((i) => i.kind === 'world')!.memberIds).toEqual(['k2']);
  });

  it('macht ein lesbares PDF-Buch mit Fotos und überspringt kaputte Bilder', async () => {
    const f = (n: string) => readFileSync(`public/fonts/${n}`);
    const fonts = { regular: f('andika-regular.ttf'), bold: f('andika-bold.ttf'), school: f('grundschrift.ttf') };
    const src = source({
      projects: [project],
      memories: [{ id: 'm-project', date: '2026-11-05', title: 'Laternen', memberIds: ['k1'], photos: [PNG, 'data:image/jpeg;base64,AAAA'], source: { kind: 'project', id: 'p1' }, createdAt: 'x' },
        { id: 'm2', date: '2026-12-01', title: 'Ein sehr langer Titel '.repeat(8), text: 'Text '.repeat(400), memberIds: ['k1'], createdAt: 'x' }],
    });
    const items = buildArchive(src);
    const bytes = await renderArchiveBook(items, members, { title: 'Unser Familienjahr 2026', subtitle: 'Test', review: yearReview(items, src, 2026) }, fonts);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(4); // Titel, Zahlen, November, Dezember (langer Text bricht um)
    expect(doc.getTitle()).toBe('Unser Familienjahr 2026');
    const empty = await renderArchiveBook([], members, { title: 'Leer', subtitle: '' }, fonts);
    expect((await PDFDocument.load(empty)).getPageCount()).toBe(2);
  });
});

import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { ILLUSTRATIONS } from '../src/data/illustrations';
import { LETTERS } from '../src/data/readingCurriculum';
import { addObservation, goalStates } from '../src/services/learning';
import {
  defaultLetter, defaultTrack, letterGrid, letterInfo, packForWeek, pagesForScope, planPack, recordPrint, savePack, seededRandom, syllablesFor,
} from '../src/services/learningPack';
import { renderWorksheets } from '../src/services/worksheetPdf';
import { exportData, validateBackup } from '../src/services/backup';
import type { ChildProfile, LearningPack, LearningRelease } from '../src/types';
import { openDb } from './helpers';

const today = '2026-10-12';
const kid = (id: string, name: string, birthDate: string, schoolEntryDate?: string): ChildProfile => ({
  id, role: 'child', name, color: 'sage', avatar: 'fox', sortOrder: 1, active: true, birthDate, schoolEntryDate,
  ageStage: 'large', maxVisibleTasks: 3, needsHelp: false, showLabels: true,
});
const big = kid('k1', 'Kind Eins', '2021-03-10', '2027-09-01');
const middle = kid('k2', 'Kind Zwei', '2022-05-01', '2029-09-01');
const small = kid('k3', 'Kind Drei', '2024-02-01', '2030-09-01');
const children = [big, middle, small];

const release = (childId: string, goalId: string): LearningRelease => ({ id: `${childId}|${goalId}`, childId, goalId, status: 'released', at: '2026-10-01T00:00:00Z' });
const statesFor = (releases: LearningRelease[]) => new Map([['k1', goalStates('k1', [], releases, today)]]);
const pack = (letter = 'M'): LearningPack => ({
  id: 'p1', weekStart: today, letter, createdAt: '', prints: [],
  children: [{ childId: 'k1', track: 'letters' }, { childId: 'k2', track: 'preschool' }, { childId: 'k3', track: 'toddler' }],
});
const fonts = () => {
  const f = (n: string) => readFileSync(`public/fonts/${n}`);
  return { regular: f('andika-regular.ttf'), bold: f('andika-bold.ttf'), school: f('grundschrift.ttf') };
};

describe('Lernpaket planen', () => {
  it('wählt die Blätter nach Lesepfad und Alter', () => {
    expect(defaultTrack(big, today, [])).toBe('letters');
    expect(defaultTrack(middle, today, [])).toBe('preschool');
    expect(defaultTrack(small, today, [])).toBe('toddler');
  });

  it('erzeugt das Wochenpaket aus dem Konzept: 3 + 2 + 1 Seiten, Memory und Beobachtungsbogen', () => {
    const plan = planPack({ pack: pack(), children, statesByChild: statesFor([]) });
    expect(plan.title).toBe('M wie Maus');
    expect(pagesForScope(plan, 'child:k1').map((p) => p.spec.kind)).toEqual(['letter-intro', 'letter-hunt', 'word-trace']);
    expect(pagesForScope(plan, 'child:k2').map((p) => p.spec.kind)).toEqual(['counting', 'syllable-onset']);
    expect(pagesForScope(plan, 'child:k3').map((p) => p.spec.kind)).toEqual(['coloring']);
    expect(pagesForScope(plan, 'game')).toHaveLength(1);
    expect(pagesForScope(plan, 'observation')).toHaveLength(1);
    expect(plan.pages).toHaveLength(8);
  });

  it('lässt Kinder weg, die diese Woche nicht mitmachen', () => {
    const p = { ...pack(), children: [{ childId: 'k1', track: 'letters' as const }, { childId: 'k3', track: 'skip' as const }] };
    const plan = planPack({ pack: p, children, statesByChild: statesFor([]) });
    expect(plan.pages.some((x) => x.childId === 'k3')).toBe(false);
    const obs = plan.pages.find((x) => x.spec.kind === 'observation')!.spec;
    expect(obs.kind === 'observation' && obs.rows.map((r) => r.name)).toEqual(['Kind Eins']);
  });

  it('plant beim Nachdrucken dieselben Seiten', () => {
    const a = planPack({ pack: pack(), children, statesByChild: statesFor([]) });
    const b = planPack({ pack: pack(), children, statesByChild: statesFor([]) });
    expect(JSON.stringify(a.pages)).toBe(JSON.stringify(b.pages));
  });

  it('zeigt Silben erst, wenn "Laute verbinden" freigegeben ist', () => {
    const letters = ['M', 'A', 'I', 'O'].map((l) => release('k1', `read.letter.${l}`));
    const without = planPack({ pack: pack(), children, statesByChild: statesFor(letters) });
    expect(pagesForScope(without, 'child:k1')[2].spec.kind).toBe('word-trace');
    const withBlend = planPack({ pack: pack(), children, statesByChild: statesFor([...letters, release('k1', 'read.blend')]) });
    const page = pagesForScope(withBlend, 'child:k1')[2].spec;
    expect(page.kind === 'syllables' && page.syllables).toEqual(['MA', 'MI', 'MO']);
  });

  it('bildet Silben auch bei Vokalen und Umlauten richtig herum', () => {
    expect(syllablesFor(letterInfo('Ü'), ['M', 'L'])).toEqual(['MÜ', 'LÜ']);
    expect(syllablesFor(letterInfo('L'), ['A', 'O'])).toEqual(['LA', 'LO']);
    expect(syllablesFor(letterInfo('SCH'), ['A'])).toEqual([]);
  });

  it('versteckt die richtige Zahl Zielbuchstaben im Raster, ohne I und l als Ablenker', () => {
    const { grid, targets } = letterGrid(letterInfo('M'), seededRandom('x'));
    const flat = grid.flat();
    expect(flat.filter((t) => t === 'M' || t === 'm')).toHaveLength(targets);
    expect(flat).not.toContain('I');
    expect(flat).not.toContain('l');
  });

  it('nimmt für die Anlautsuche nur Bilder mit passendem Anfangsbuchstaben als Treffer', () => {
    const plan = planPack({ pack: pack('S'), children, statesByChild: statesFor([]) });
    const hunt = pagesForScope(plan, 'child:k1')[1].spec;
    if (hunt.kind !== 'letter-hunt') throw new Error('falsche Seite');
    expect(hunt.pictures.length).toBe(6);
    for (const p of hunt.pictures) expect(ILLUSTRATIONS.get(p.id)!.initial === 'S').toBe(p.match);
  });

  it('schlägt den Buchstaben vor, an dem gerade geübt wird', () => {
    const states = goalStates('k1', [], [release('k1', 'read.letter.M'), release('k1', 'read.letter.A')], today);
    expect(defaultLetter([{ childId: 'k1', states, releases: [] }], today)).toBe('A');
    expect(defaultLetter([], today)).toBe('M');
  });
});

describe('Arbeitsblätter als PDF', () => {
  it('erzeugt für jeden Buchstaben ein A4-PDF ohne Fehler', async () => {
    const f = fonts();
    for (const l of LETTERS) {
      const plan = planPack({ pack: pack(l.upper), children, statesByChild: statesFor([release('k1', 'read.blend')]) });
      const bytes = await renderWorksheets(plan, plan.pages, f);
      const doc = await PDFDocument.load(bytes);
      expect(doc.getPageCount()).toBe(plan.pages.length);
      const { width, height } = doc.getPage(0).getSize();
      expect(Math.round(width)).toBe(595);
      expect(Math.round(height)).toBe(842);
    }
  }, 60_000);

  it('druckt nur die gewählten Seiten', async () => {
    const plan = planPack({ pack: pack(), children, statesByChild: statesFor([]) });
    const doc = await PDFDocument.load(await renderWorksheets(plan, pagesForScope(plan, 'child:k2'), fonts()));
    expect(doc.getPageCount()).toBe(2);
  });
});

describe('Lernpaket speichern', () => {
  it('merkt sich Paket, Drucke und ordnet Beobachtungen zu; alles kommt in die Sicherung', async () => {
    const db = await openDb();
    const saved = await savePack(db, '2026-10-12', 'M', [{ childId: 'child-1', track: 'letters' }]);
    await recordPrint(db, saved.id, 'all', 8);
    const updated = await savePack(db, '2026-10-12', 'A', saved.children, await db.learningPacks.get(saved.id));
    expect(updated.id).toBe(saved.id);
    expect(updated.prints).toHaveLength(1);
    expect(packForWeek(await db.learningPacks.toArray(), '2026-10-12')?.letter).toBe('A');

    const obs = await addObservation(db, 'child-1', 'read.letter.A', 'little-help', '2026-10-13', '', { mood: 'fun', packId: saved.id });
    expect((await db.learningObservations.get(obs.id))).toMatchObject({ mood: 'fun', packId: saved.id });

    const backup = await exportData(db);
    expect(backup.tables.learningPacks).toHaveLength(1);
    expect(validateBackup(JSON.parse(JSON.stringify(backup))).ok).toBe(true);
    db.close();
  });
});

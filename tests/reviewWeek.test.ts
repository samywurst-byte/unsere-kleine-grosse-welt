import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { goalStates } from '../src/services/learning';
import {
  packTitle, pagesForScope, planPack, preschoolLetter, reviewSuggestion, savePack, toddlerPicture, type PageSpec,
} from '../src/services/learningPack';
import { renderWorksheets } from '../src/services/worksheetPdf';
import type { ChildProfile, LearningPack, LearningRelease } from '../src/types';
import { openDb } from './helpers';

const kid = (id: string, name: string, birthDate: string, schoolEntryDate?: string): ChildProfile => ({
  id, role: 'child', name, color: 'sage', avatar: 'fox', sortOrder: 1, active: true, birthDate, schoolEntryDate,
  ageStage: 'large', maxVisibleTasks: 3, needsHelp: false, showLabels: true,
});
const children = [kid('k1', 'Kind Eins', '2021-03-10', '2027-09-01'), kid('k2', 'Kind Zwei', '2022-05-01', '2029-09-01'), kid('k3', 'Kind Drei', '2024-02-01', '2030-09-01')];
const release = (goalId: string): LearningRelease => ({ id: `k1|${goalId}`, childId: 'k1', goalId, status: 'released', at: '2026-10-01T00:00:00Z' });
const statesFor = (goals: string[], today = '2026-11-02') => new Map([['k1', goalStates('k1', [], goals.map(release), today)]]);
const mk = (weekStart: string, letter: string, extra: Partial<LearningPack> = {}): LearningPack => ({
  id: `p-${weekStart}`, weekStart, letter, createdAt: `${weekStart}T08:00:00Z`, prints: [],
  children: [{ childId: 'k1', track: 'letters', math: true }, { childId: 'k2', track: 'preschool', math: true }, { childId: 'k3', track: 'toddler' }],
  ...extra,
});
const fonts = () => {
  const f = (n: string) => readFileSync(`public/fonts/${n}`);
  return { regular: f('andika-regular.ttf'), bold: f('andika-bold.ttf'), school: f('grundschrift.ttf') };
};
const kinds = (specs: { spec: PageSpec }[]) => specs.map((p) => p.spec.kind);

describe('Wiederholungswoche', () => {
  it('schlägt nach zwei neuen Buchstaben eine Wiederholung vor, danach erst wieder nach zwei neuen', () => {
    const a = mk('2026-10-19', 'M');
    const b = mk('2026-10-26', 'A');
    expect(reviewSuggestion([a], '2026-11-02')).toBeNull();
    expect(reviewSuggestion([a, b], '2026-11-02')).toEqual(['M', 'A']);
    const r = mk('2026-11-02', 'A', { review: ['M', 'A'] });
    expect(reviewSuggestion([a, b, r], '2026-11-09')).toBeNull();
    const c = mk('2026-11-09', 'I');
    expect(reviewSuggestion([a, b, r, c], '2026-11-16')).toBeNull();
    expect(reviewSuggestion([a, b, r, c, mk('2026-11-16', 'O')], '2026-11-23')).toEqual(['I', 'O']);
    // Pakete ohne Lesekind zählen nicht, dasselbe Paket ändern schlägt nichts für die eigene Woche vor
    const noReader = mk('2026-10-26', 'A', { children: [{ childId: 'k2', track: 'preschool' }] });
    expect(reviewSuggestion([a, noReader], '2026-11-02')).toBeNull();
    expect(reviewSuggestion([a, b], '2026-10-26')).toBeNull();
  });

  it('gibt dem Lesekind Wiederfinden, Anlaute sortieren und kurzes Schreiben, aber keinen neuen Buchstaben', () => {
    const pack = mk('2026-11-02', 'A', { review: ['M', 'A'] });
    const plan = planPack({ pack, children, statesByChild: statesFor(['read.letter.M', 'read.letter.A']) });
    expect(plan.title).toBe('Wiederholung: M und A');
    expect(packTitle(pack)).toBe('Wiederholung: M und A');
    const k1 = pagesForScope(plan, 'child:k1');
    expect(kinds(k1).slice(0, 3)).toEqual(['review-hunt', 'onset-sort', 'review-write']);
    expect(kinds(k1)).not.toContain('letter-intro');
    const hunt = k1[0].spec as Extract<PageSpec, { kind: 'review-hunt' }>;
    const flat = hunt.grid.flat();
    expect(flat.filter((t) => ['M', 'm', 'A', 'a'].includes(t))).toHaveLength(hunt.targets);
    const sort = k1[1].spec as Extract<PageSpec, { kind: 'onset-sort' }>;
    expect(new Set(sort.pictures.map((p) => p.initial))).toEqual(new Set(['M', 'A']));
    const swing = k1.find((p) => p.spec.kind === 'swing')!.spec as Extract<PageSpec, { kind: 'swing' }>;
    expect(swing.sheet.letters).toEqual(['M', 'm']);
    const obs = plan.pages.find((p) => p.id === 'observation')!.spec as Extract<PageSpec, { kind: 'observation' }>;
    expect(obs.rows[0].goals.map((g) => g.goalId)).toContain('read.letter.M');
    expect(obs.rows[0].goals.map((g) => g.goalId)).toContain('read.letter.A');
  });

  it('nimmt aufs Schwungblatt einen Buchstaben, den das Kind schon kennt, und nur ein Paar', () => {
    const plan = planPack({ pack: mk('2026-11-09', 'I'), children, statesByChild: statesFor(['read.letter.M', 'read.letter.A', 'read.letter.I']) });
    const swing = pagesForScope(plan, 'child:k1').find((p) => p.spec.kind === 'swing')!.spec as Extract<PageSpec, { kind: 'swing' }>;
    expect(['M', 'A']).toContain(swing.sheet.letters![0]);
    expect(swing.sheet.letters).toHaveLength(2);
    expect(swing.sheet.digits).toHaveLength(1);
    expect(swing.sheet.title).toMatch(/, [MA]$/);
  });

  it('gibt den Kleinen jede Woche Neues, auch wenn der Buchstabe gleich bleibt', () => {
    const weeks = ['2026-10-19', '2026-10-26', '2026-11-02', '2026-11-09'];
    const plans = weeks.map((w, i) => planPack({ pack: mk(w, 'M', i === 2 ? { review: ['M', 'A'] } : {}), children, statesByChild: statesFor([]) }));
    const onset = plans.map((p) => (pagesForScope(p, 'child:k2').find((x) => x.spec.kind === 'syllable-onset')!.spec as Extract<PageSpec, { kind: 'syllable-onset' }>).letter.upper);
    const coloring = plans.map((p) => (pagesForScope(p, 'child:k3')[0].spec as Extract<PageSpec, { kind: 'coloring' }>).illustration);
    for (let i = 1; i < weeks.length; i++) {
      expect(onset[i]).not.toBe(onset[i - 1]);
      expect(coloring[i]).not.toBe(coloring[i - 1]);
    }
    // keine Wiederholung innerhalb von vier Wochen, auch über den Jahreswechsel
    expect(new Set(onset).size).toBe(4);
    expect(new Set(coloring).size).toBe(4);
    expect(preschoolLetter('2026-12-28').upper).not.toBe(preschoolLetter('2027-01-04').upper);
    expect(toddlerPicture('2026-12-28')).not.toBe(toddlerPicture('2027-01-04'));
  });

  it('wiederholt beim Rechnen statt Neues zu bringen', () => {
    const pack = mk('2026-11-02', 'A', { review: ['M', 'A'] });
    const plan = planPack({ pack, children, statesByChild: statesFor([]) });
    const math = pagesForScope(plan, 'child:k1').filter((p) => p.spec.kind === 'math');
    expect(math.length).toBeGreaterThan(0);
    expect(math.length).toBeLessThanOrEqual(2);
  });

  it('rendert Wiederholungswochen als PDF, auch mit Silben und Buchstaben ohne Bilder', async () => {
    const f = fonts();
    for (const review of [['M', 'A'], ['L', 'S'], ['T', 'R'], ['M'], ['SCH', 'EI']]) {
      const pack = mk('2026-11-02', review[review.length - 1], { review });
      const plan = planPack({ pack, children, statesByChild: statesFor(['read.blend', ...review.map((l) => `read.letter.${l}`)]) });
      const doc = await PDFDocument.load(await renderWorksheets(plan, plan.pages, f));
      expect(doc.getPageCount()).toBe(plan.pages.length);
    }
  }, 30_000);

  it('speichert die Wiederholung am Paket', async () => {
    const db = await openDb();
    const saved = await savePack(db, '2026-11-02', 'A', [{ childId: 'k1', track: 'letters' }], undefined, ['M', 'A']);
    expect((await db.learningPacks.get(saved.id))?.review).toEqual(['M', 'A']);
    const plain = await savePack(db, '2026-11-02', 'I', saved.children, saved);
    expect(plain.review).toBeUndefined();
    db.close();
  });
});

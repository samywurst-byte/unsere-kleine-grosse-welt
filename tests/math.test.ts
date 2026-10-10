import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { MATH_GOALS, MATH_GOALS_BY_ID } from '../src/data/mathCurriculum';
import { defaultTrack, pagesForScope, planPack, seededRandom } from '../src/services/learningPack';
import { mathPhase, mathStates, mathSuggestions } from '../src/services/math';
import { mathMemoryPairs, mathPageFor, numberWallPage, type TaskPart } from '../src/services/mathSheets';
import { goalStates } from '../src/services/learning';
import { renderWorksheets } from '../src/services/worksheetPdf';
import type { ChildProfile, LearningObservation, LearningRelease, ObservationLevel } from '../src/types';

const today = '2026-10-12';
const kid = (over: Partial<ChildProfile> = {}): ChildProfile => ({
  id: 'k1', role: 'child', name: 'Kind Eins', color: 'sage', avatar: 'fox', sortOrder: 1, active: true,
  birthDate: '2021-03-10', schoolEntryDate: '2027-09-01', ageStage: 'large', maxVisibleTasks: 3, needsHelp: false, showLabels: true, ...over,
});
const release = (goalId: string): LearningRelease => ({ id: `k1|${goalId}`, childId: 'k1', goalId, status: 'released', at: '2026-10-01T00:00:00Z' });
const obs = (goalId: string, date: string, level: ObservationLevel = 'independent'): LearningObservation => ({
  id: `${goalId}-${date}-${Math.random()}`, childId: 'k1', goalId, date, level, createdAt: `${date}T10:00:00Z`,
});
/** Ziel "sicher" machen: 4× selbstständig an 4 Tagen. */
const secure = (goalId: string) => ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'].map((d) => obs(goalId, d));

describe('Lehrplan Rechnen', () => {
  it('hat eindeutige Ids und Voraussetzungen, die es gibt und nicht später kommen', () => {
    expect(new Set(MATH_GOALS.map((g) => g.id)).size).toBe(MATH_GOALS.length);
    for (const g of MATH_GOALS) {
      for (const r of g.requires) {
        expect(MATH_GOALS_BY_ID.has(r), `${g.id} braucht ${r}`).toBe(true);
        expect(MATH_GOALS_BY_ID.get(r)!.stage).toBeLessThanOrEqual(g.stage);
      }
    }
  });
});

describe('Rechenpfad-Vorschläge', () => {
  it('beginnt bei jüngeren Kindern mit Mengen und schlägt höchstens zwei Ziele gleichzeitig vor', () => {
    const young = kid({ schoolEntryDate: '2029-09-01' });
    const states = mathStates('k1', [], [], today);
    const s = mathSuggestions(states, [], young, today).filter((x) => x.kind === 'release').map((x) => x.goal.id);
    expect(s).toEqual(['math.subitize', 'math.compare']);
  });

  it('beginnt im Jahr vor der Einschulung bei Stufe 3, für jedes Kind automatisch', () => {
    const states = mathStates('k1', [], [], today);
    const ids = (c: ChildProfile, d: string) => mathSuggestions(mathStates('k1', [], [], d), [], c, d).filter((x) => x.kind === 'release').map((x) => x.goal.id);
    expect(ids(kid(), today)).toEqual(['math.five', 'math.decompose10']);
    const younger = kid({ schoolEntryDate: '2029-09-01' });
    expect(ids(younger, today)).toEqual(['math.subitize', 'math.compare']);
    expect(ids(younger, '2028-10-02')).toEqual(['math.five', 'math.decompose10']);
    expect(states.length).toBeGreaterThan(0);
  });

  it('nimmt bewusst freigegebene leichtere Ziele trotzdem ernst', () => {
    const states = mathStates('k1', [], [release('math.subitize')], today);
    expect(mathSuggestions(states, [], kid(), today).filter((x) => x.kind === 'release').map((x) => x.goal.id)).toEqual(['math.decompose10']);
  });

  it('schlägt vor der Schule nichts über Stufe 4 vor', () => {
    const upTo4 = MATH_GOALS.filter((g) => g.stage <= 4).flatMap((g) => secure(g.id));
    const states = mathStates('k1', upTo4, [], today);
    expect(mathSuggestions(states, [], kid(), today).filter((x) => x.kind === 'release')).toEqual([]);
  });

  it('pausiert Schulkinder, außer die Übungsblätter sind eingeschaltet', () => {
    const later = '2027-10-04';
    expect(mathPhase(kid(), later)).toBe('school-paused');
    expect(mathSuggestions(mathStates('k1', [], [], later), [], kid(), later)).toEqual([]);
    const practising = kid({ schoolPractice: true });
    expect(mathPhase(practising, later)).toBe('school-practice');
    expect(defaultTrack(practising, later, [])).toBe('math');
    expect(defaultTrack(kid(), later, [])).toBe('skip');
  });

  it('zählt Rechenbeobachtungen nicht zum Lesepfad', () => {
    const states = goalStates('k1', secure('math.subitize'), [], today);
    expect(states.some((s) => s.released)).toBe(false);
  });
});

const numbers = (t: TaskPart[]) => (t[0] ?? '').match(/\d+/g)!.map(Number);

describe('Rechenblätter', () => {
  it('gibt es für jedes Ziel außer dem schriftlichen Rechnen und Zahlen bis 1000', () => {
    const missing = MATH_GOALS.filter((g) => !mathPageFor(g, seededRandom(g.id))).map((g) => g.id);
    expect(missing).toEqual(['math.place1000', 'math.written-addsub', 'math.written-mult', 'math.written-div']);
  });

  it('bleibt im Zahlenraum und ohne negative Ergebnisse', () => {
    for (let seed = 0; seed < 30; seed++) {
      const page = (id: string) => mathPageFor(MATH_GOALS_BY_ID.get(id)!, seededRandom(`${id}${seed}`))!.spec;
      const check = (id: string, ok: (a: number, b: number, minus: boolean) => boolean) => {
        const spec = page(id);
        if (spec.kind !== 'packets') throw new Error('falsche Seite');
        expect(spec.tasks.length).toBeGreaterThanOrEqual(18);
        for (const t of spec.tasks) { const [a, b] = numbers(t); expect(ok(a, b, String(t[0]).includes('−')), `${id}: ${t[0]}`).toBe(true); }
      };
      check('math.add10', (a, b) => a + b <= 10);
      check('math.sub10', (a, b) => a - b >= 0 && a <= 10);
      check('math.add20', (a, b) => a + b <= 20);
      check('math.sub20', (a, b) => a - b >= 0 && a <= 20);
      check('math.addsub100', (a, b, minus) => (minus ? a - b >= 0 : a + b <= 100));
      const rem = page('math.div-remainder');
      if (rem.kind === 'packets') for (const t of rem.tasks) { const [a, d] = numbers(t); expect(Math.floor(a / d)).toBeLessThanOrEqual(10); }
      const wall = numberWallPage(MATH_GOALS_BY_ID.get('math.add20')!, seededRandom(`w${seed}`))!.spec;
      if (wall.kind === 'number-wall') for (const w of wall.walls) {
        const top = w[2][0] ?? w[0][0]! + 2 * (w[0][1] ?? 0) + w[0][2]!;
        expect(top).toBeLessThanOrEqual(20);
      }
    }
  });

  it('wählt das Memory nach der höchsten Stufe', () => {
    const g = (id: string) => MATH_GOALS_BY_ID.get(id)!;
    expect(mathMemoryPairs([g('math.subitize')], seededRandom('x')).pairs[0][0]).toBe('dice:1');
    const times = mathMemoryPairs([g('math.times.7')], seededRandom('x')).pairs;
    expect(times).toHaveLength(6);
    for (const [task, result] of times) { const [k, n] = task.split(' · ').map(Number); expect(k * n).toBe(Number(result)); }
  });
});

describe('Rechenblätter im Lernpaket', () => {
  const children = [kid(), kid({ id: 'k2', name: 'Kind Zwei', birthDate: '2022-05-01', schoolEntryDate: '2029-09-01' })];
  const pack = {
    id: 'p', weekStart: today, letter: 'M', createdAt: '', prints: [],
    children: [{ childId: 'k1', track: 'letters' as const, math: true }, { childId: 'k2', track: 'preschool' as const, math: false }],
  };

  it('hängt ein bis zwei Rechenblätter an, mit Memory und Beobachtungsbogen', () => {
    const mathStatesByChild = new Map([['k1', mathStates('k1', [], [release('math.add10')], today)]]);
    const plan = planPack({ pack, children, statesByChild: new Map(), mathStatesByChild, today });
    const k1 = pagesForScope(plan, 'child:k1').map((p) => p.title);
    expect(k1).toEqual(['Das M', 'Finde das M', 'Wörter schreiben', 'Plus bis 10', 'Rechenmauern']);
    expect(pagesForScope(plan, 'child:k2')).toHaveLength(2);
    expect(pagesForScope(plan, 'game').map((p) => p.title)).toEqual(['Memory für alle', 'Rechen-Memory']);
    const o = pagesForScope(plan, 'observation')[0].spec;
    expect(o.kind === 'observation' && o.rows[0].goals.map((g) => g.label)).toContain('Plus bis 10');
  });

  it('nimmt ohne Freigabe das erste passende Ziel und rendert alles als PDF', async () => {
    const plan = planPack({ pack, children, statesByChild: new Map(), mathStatesByChild: new Map(), today });
    expect(pagesForScope(plan, 'child:k1').map((p) => p.title)).toEqual(['Das M', 'Finde das M', 'Wörter schreiben', 'Das Zehnerfeld', 'Zahlenhäuser']);
    const f = (n: string) => readFileSync(`public/fonts/${n}`);
    const bytes = await renderWorksheets(plan, plan.pages, { regular: f('andika-regular.ttf'), bold: f('andika-bold.ttf'), school: f('grundschrift.ttf') });
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(plan.pages.length);
  });

  it('rendert jedes Rechenblatt ohne Fehler', async () => {
    const f = (n: string) => readFileSync(`public/fonts/${n}`);
    const fonts = { regular: f('andika-regular.ttf'), bold: f('andika-bold.ttf'), school: f('grundschrift.ttf') };
    const pages = MATH_GOALS.map((g) => mathPageFor(g, seededRandom(g.id))).filter((p) => !!p)
      .map((p, i) => ({ id: String(i), section: 'child' as const, title: p!.title, spec: { kind: 'math' as const, title: p!.title, math: p!.spec } }));
    const plan = { ...planPack({ pack, children, statesByChild: new Map() }), pages };
    expect((await PDFDocument.load(await renderWorksheets(plan, pages, fonts))).getPageCount()).toBe(pages.length);
  }, 30_000);
});

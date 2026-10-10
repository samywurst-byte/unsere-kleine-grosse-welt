import { readFileSync, writeFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { MATH_GOALS } from '../src/data/mathCurriculum';
import { CHECK_SENTENCES, DRAW_SENTENCES, READ_TEXTS, READ_WORDS, SOUND_BOX_WORDS } from '../src/data/readingContent';
import { GOALS_BY_ID, LETTERS, READING_GOALS, READING_STAGES } from '../src/data/readingCurriculum';
import { ILLUSTRATIONS } from '../src/data/illustrations';
import { goalStates } from '../src/services/learning';
import { defaultTrack, pagesForScope, planPack, READING_TITLE, seededRandom, type PlannedPage } from '../src/services/learningPack';
import { extraMathPage } from '../src/services/mathSheets';
import { graphemes, plain, readingBox, readingPageFor, readingPages, readableWords, sentenceReadable, wordsOf } from '../src/services/reading';
import { renderWorksheets } from '../src/services/worksheetPdf';
import type { ChildProfile, LearningObservation, LearningRelease } from '../src/types';

const today = '2026-10-12';
const kid = (over: Partial<ChildProfile> = {}): ChildProfile => ({
  id: 'k1', role: 'child', name: 'Kind Eins', color: 'sage', avatar: 'fox', sortOrder: 1, active: true,
  birthDate: '2021-03-10', schoolEntryDate: '2027-09-01', ageStage: 'large', maxVisibleTasks: 3, needsHelp: false, showLabels: true, ...over,
});
const release = (goalId: string): LearningRelease => ({ id: `k1|${goalId}`, childId: 'k1', goalId, status: 'released', at: '2026-10-01T00:00:00Z' });
const secure = (goalId: string): LearningObservation[] => ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'].map((d, i) => ({
  id: `${goalId}-${i}`, childId: 'k1', goalId, date: d, level: 'independent', createdAt: `${d}T10:00:00Z`,
}));
const ALL = LETTERS.map((l) => l.upper);
const fonts = () => {
  const f = (n: string) => readFileSync(`public/fonts/${n}`);
  return { regular: f('andika-regular.ttf'), bold: f('andika-bold.ttf'), school: f('grundschrift.ttf') };
};

describe('Lesestoff', () => {
  it('hat Stufen 6 bis 9 mit Lernzielen, Voraussetzungen gibt es und sie liegen nicht später', () => {
    for (const st of READING_STAGES.filter((s) => s.id >= 6 && s.id <= 9)) {
      expect(st.available).toBe(true);
      expect(READING_GOALS.some((g) => g.stage === st.id), `Stufe ${st.id}`).toBe(true);
    }
    for (const g of READING_GOALS) for (const r of g.requires) {
      expect(GOALS_BY_ID.has(r), `${g.id} braucht ${r}`).toBe(true);
      expect(GOALS_BY_ID.get(r)!.stage).toBeLessThanOrEqual(g.stage);
    }
  });

  it('ist mit allen Buchstaben vollständig lesbar und sauber getrennt', () => {
    for (const w of READ_WORDS) {
      expect(w.w, w.w).toMatch(/^[\p{L}]+(-[\p{L}]+)*$/u);
      if (w.ill) expect(ILLUSTRATIONS.has(w.ill), w.ill).toBe(true);
    }
    expect(new Set(READ_WORDS.map((w) => w.w)).size).toBe(READ_WORDS.length);
    for (const s of [...CHECK_SENTENCES.map((c) => c.s), ...DRAW_SENTENCES, ...READ_TEXTS.map((t) => t.text)]) {
      expect(sentenceReadable(s, ALL), s).toBe(true);
      expect(s).not.toMatch(/-[\s.,!?]|\s-|--/);
    }
    expect(CHECK_SENTENCES.filter((c) => c.true).length).toBeGreaterThan(8);
    expect(CHECK_SENTENCES.filter((c) => !c.true).length).toBeGreaterThan(8);
    for (const t of READ_TEXTS) {
      expect(t.questions).toHaveLength(3);
      for (const q of t.questions) expect(q.options[0]).not.toBe(q.options[1]);
    }
    for (const id of SOUND_BOX_WORDS) expect(READ_WORDS.some((w) => w.ill === id), id).toBe(true);
  });

  it('zerlegt Wörter in Laute und Sätze in Wörter', () => {
    expect(graphemes('Maus')).toEqual(['M', 'AU', 'S']);
    expect(graphemes('Fisch')).toEqual(['F', 'I', 'SCH']);
    expect(graphemes('Apfel')).toEqual(['A', 'PF', 'E', 'L']);
    expect(wordsOf('Ein Ha-se hat lan-ge Oh-ren.')).toEqual(['Ein', 'Hase', 'hat', 'lange', 'Ohren']);
    expect(plain('Ra-ke-te')).toBe('Rakete');
  });

  it('gibt nur Wörter aus sicheren Buchstaben', () => {
    const words = readableWords(['M', 'A', 'O', 'L', 'I']).map(plain);
    expect(words).toEqual(expect.arrayContaining(['Mama', 'Oma', 'Lama', 'Mila', 'lila']));
    expect(words).not.toContain('Nase');
  });
});

describe('Lese- und Schreibblätter', () => {
  const letters = ['M', 'A', 'I', 'O', 'L', 'S', 'E', 'N'];
  const observations = letters.flatMap((u) => secure(`read.letter.${u}`));

  it('kommen erst mit der Freigabe ab Stufe 6 dazu, mit Zeilen im Beobachtungsbogen', () => {
    const none = goalStates('k1', observations, [release('read.syllable-reading')], today);
    expect(readingPages(none, seededRandom('x'))).toEqual([]);
    const states = goalStates('k1', observations, [release('read.words'), release('read.write-sounds')], today);
    const pages = readingPages(states, seededRandom('x'));
    expect(pages.map((p) => p.spec.kind)).toEqual(['read-draw', 'sound-boxes']);
    const spec = pages[0].spec;
    if (spec.kind === 'read-draw') for (const w of spec.words) expect(sentenceReadable(w, letters), w).toBe(true);

    const pack = { id: 'p', weekStart: today, letter: 'N', createdAt: '', prints: [], children: [{ childId: 'k1', track: 'letters' as const, math: false }] };
    const plan = planPack({ pack, children: [kid()], statesByChild: new Map([['k1', states]]), today });
    expect(pagesForScope(plan, 'child:k1').map((p) => p.title)).toEqual(['Das N', 'Finde das N', 'Wörter schreiben', 'Lesen und malen', 'Schreib, was du hörst']);
    const o = pagesForScope(plan, 'observation')[0].spec;
    expect(o.kind === 'observation' && o.rows[0].goals.map((g) => g.goalId)).toEqual(expect.arrayContaining(['read.words', 'read.write-sounds']));
  });

  it('gibt Schulkindern mit Lesefreigabe den Lese-Weg vor', () => {
    const states = goalStates('k1', [], [release('read.words')], today);
    expect(defaultTrack(kid({ schoolEntryDate: '2026-09-01', schoolPractice: true }), today, states)).toBe('reading');
    const pack = { id: 'p', weekStart: today, letter: 'M', createdAt: '', prints: [], children: [{ childId: 'k1', track: 'reading' as const, math: false }] };
    const plan = planPack({ pack, children: [kid()], statesByChild: new Map([['k1', states]]), today });
    expect(pagesForScope(plan, 'child:k1').map((p) => p.title)).toEqual(['Lesen und malen', 'Wörter abschreiben']);
  });

  it('zeigt die Lesekiste erst ab dem Silbenlesen', () => {
    expect(readingBox(goalStates('k1', observations, [], today))).toBeNull();
    const box = readingBox(goalStates('k1', observations, [release('read.syllable-reading')], today));
    expect(box?.words.map(plain)).toContain('Mama');
    expect(box?.showSentences).toBe(false);
  });

  it('rendert jedes Lese-, Schreib- und neue Rechenblatt als PDF', async () => {
    const states = goalStates('k1', LETTERS.flatMap((l) => secure(`read.letter.${l.upper}`)), [release('read.sight-words')], today);
    const ids = ['read.words', 'read.write-copy', 'read.write-sounds', 'read.write-sentence', 'read.fluency', 'read.comprehension'];
    const specs = [...ids, 'read.sentences', 'read.sentences'].map((id, i) => readingPageFor(id, states, seededRandom(`${id}${i}`))!.spec);
    // beide Satzblätter abdecken
    for (let i = 0; !specs.some((s) => s.kind === 'sentence-draw') || !specs.some((s) => s.kind === 'sentence-check'); i++) {
      specs.push(readingPageFor('read.sentences', states, seededRandom(`s${i}`))!.spec);
    }
    const reading: PlannedPage[] = specs.map((spec, i) => ({ id: `r${i}`, section: 'child', title: READING_TITLE[spec.kind], spec: { kind: 'reading', title: READING_TITLE[spec.kind], reading: spec } }));
    const math: PlannedPage[] = [];
    for (const g of MATH_GOALS) for (let k = 0; k < 6; k++) {
      const p = extraMathPage(g, seededRandom(`${g.id}${k}`));
      if (p && !math.some((m) => m.spec.kind === 'math' && m.spec.math.kind === p.spec.kind && m.title === p.title)) {
        math.push({ id: `m${math.length}`, section: 'child', title: p.title, spec: { kind: 'math', title: p.title, math: p.spec } });
      }
    }
    expect(new Set(math.map((m) => m.spec.kind === 'math' && m.spec.math.kind))).toEqual(new Set(['dot-draw', 'neighbors', 'story', 'task-family', 'number-wall', 'hundred-chart']));
    const pages = [...reading, ...math];
    const pack = { id: 'p', weekStart: today, letter: 'M', createdAt: '', prints: [], children: [] };
    const plan = { ...planPack({ pack, children: [], statesByChild: new Map() }), pages };
    const bytes = await renderWorksheets(plan, pages, fonts());
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(pages.length);
    if (process.env.SAMPLE_PDF) writeFileSync(process.env.SAMPLE_PDF, bytes);
  }, 30_000);

  it('erzählt Rechengeschichten mit Zahlen ab 2 und ohne negative Ergebnisse', () => {
    for (const g of MATH_GOALS.filter((x) => x.stage >= 4 && x.stage <= 8)) for (let k = 0; k < 20; k++) {
      const p = extraMathPage(g, seededRandom(`${g.id}-${k}`));
      if (p?.spec.kind !== 'story') continue;
      expect(p.spec.stories).toHaveLength(4);
      for (const s of p.spec.stories) {
        const nums = (s.text.match(/\d+/g) ?? []).map(Number);
        for (const n of nums) expect(n, s.text).toBeGreaterThanOrEqual(2);
        if (s.op === '−') expect(nums[0]).toBeGreaterThan(nums[1]);
        if (s.op === ':') expect(nums[0] % nums[1]).toBe(0);
      }
    }
  });
});

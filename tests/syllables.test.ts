import { describe, expect, it } from 'vitest';
import { LETTERS } from '../src/data/readingCurriculum';
import { SOUND_ANIMALS } from '../src/data/syllableMethod';
import { planPack, priorPackLetters, seededRandom, syllableKnown, type PageSpec } from '../src/services/learningPack';
import { canRead } from '../src/services/projects';
import { plain } from '../src/services/reading';
import { canBuildSyllables, openSyllables, recipe, syllableCards, syllableCarpet, syllableWords, weekWord } from '../src/services/syllables';
import { renderWorksheets } from '../src/services/worksheetPdf';
import { readFileSync } from 'node:fs';
import type { ChildProfile, LearningPack } from '../src/types';

const kid = (id: string, name: string, birthDate: string): ChildProfile => ({
  id, role: 'child', name, color: 'sage', avatar: 'fox', sortOrder: 1, active: true, birthDate,
  ageStage: 'large', maxVisibleTasks: 3, needsHelp: false, showLabels: true,
});

describe('Silbenmethode', () => {
  it('hat für jeden Laut außer ß, C, X, Y ein Lauttier mit Laut, Spruch und Gebärde', () => {
    for (const l of LETTERS.filter((x) => !['ß', 'C', 'X', 'Y'].includes(x.upper))) {
      const a = SOUND_ANIMALS[l.upper];
      expect(a, l.upper).toBeDefined();
      expect(a.sound && a.rhyme && a.sign).toBeTruthy();
      // Das Lauttier beginnt mit dem Laut oder trägt ihn sichtbar mitten im Wort
      if (!a.inside) expect(a.animal.toUpperCase().startsWith(l.upper), l.upper).toBe(true);
      else expect(a.animal.toLowerCase()).toContain(l.lower);
    }
  });

  it('baut offene Silben nur aus bekannten Lauten, den neuen Laut zuerst', () => {
    expect(openSyllables(['M', 'A', 'E', 'O'], ['O'])).toEqual(['MO', 'MA', 'ME']);
    expect(openSyllables(['M', 'A', 'L'], ['L'])).toEqual(['LA', 'MA']);
    expect(canBuildSyllables(['A', 'E'])).toBe(false);
    expect(canBuildSyllables(['M'])).toBe(false);
    expect(canBuildSyllables(['M', 'A'])).toBe(true);
  });

  it('legt einen Silbenteppich, oben groß und unten klein', () => {
    const carpet = syllableCarpet(['M', 'A', 'O'], ['O'], seededRandom('t'));
    expect(carpet).toHaveLength(4);
    expect(carpet[0].every((s) => s === s.toUpperCase())).toBe(true);
    expect(carpet[3].every((s) => s === s.toLowerCase())).toBe(true);
    expect(carpet.flat().filter((s) => s.toUpperCase() === 'MO').length).toBeGreaterThanOrEqual(4);
  });

  it('nimmt nur Wörter, die das Kind lesen kann, und kein „am“ zum Malen', () => {
    const known = ['M', 'A', 'E', 'O'];
    const words = syllableWords(known, ['O'], seededRandom('w'));
    expect(words.length).toBeGreaterThanOrEqual(2);
    for (const w of words) expect(canRead(plain(w), known), w).toBe(true);
    expect(words).not.toContain('am');
    expect(words[0]).toMatch(/o/i);
    expect(weekWord(known, ['O'], words)).toBe('O-ma');
    expect(weekWord(['M', 'A'], ['M'], [])).toBe('Ma-ma');
  });

  it('macht blaue und rote Silbenkarten, aus denen sich die Wörter legen lassen', () => {
    const cards = syllableCards(['Ma-ma', 'O-ma'], ['MO'], 12);
    expect(cards).toHaveLength(12);
    expect(cards).toContainEqual({ text: 'Ma', color: 0 });
    expect(cards).toContainEqual({ text: 'ma', color: 1 });
    expect(cards).toContainEqual({ text: 'O', color: 0 });
    expect(recipe('Ma-ma')).toBe('Ma + ma');
  });

  it('zählt Buchstaben früherer Pakete mit, auch ohne Freigabe im Lesepfad', () => {
    const mk = (weekStart: string, letter: string, extra: Partial<LearningPack> = {}): LearningPack => ({
      id: weekStart, weekStart, letter, createdAt: weekStart, prints: [], children: [{ childId: 'k1', track: 'letters' }], ...extra,
    });
    const packs = [mk('2026-10-26', 'A'), mk('2026-11-02', 'E'), mk('2026-11-09', 'M'), mk('2026-11-16', 'O'),
      mk('2026-10-19', 'S', { children: [{ childId: 'k2', track: 'preschool' }] })];
    expect(priorPackLetters(packs, '2026-11-16').sort()).toEqual(['A', 'E', 'M']);
    expect(syllableKnown([], ['A', 'E', 'M'], [LETTERS.find((l) => l.upper === 'O')!]).sort()).toEqual(['A', 'E', 'M', 'O']);
  });

  it('plant die Silbenwoche mit fünf Lernzeiten und Zielen und rendert sie als PDF', async () => {
    const children = [kid('k1', 'Kind Eins', '2021-03-10')];
    const plan = planPack({
      pack: { id: 'p', weekStart: '2026-11-16', letter: 'O', createdAt: '', prints: [], children: [{ childId: 'k1', track: 'letters', math: false }] },
      children, statesByChild: new Map(), priorLetters: ['M', 'A', 'E'],
    });
    const pages = plan.pages.filter((p) => p.childId === 'k1');
    const week = pages[0].spec as Extract<PageSpec, { kind: 'sound-week' }>;
    expect(week.days.map((d) => d.day)).toEqual(['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Wochenende']);
    expect(week.goals.join(' ')).toContain('Oma');
    const write = pages.find((p) => p.spec.kind === 'syllable-write')!.spec as Extract<PageSpec, { kind: 'syllable-write' }>;
    expect(write.syllables).toEqual(['Mo', 'ma']);
    const obs = plan.pages.find((p) => p.spec.kind === 'observation')!.spec as Extract<PageSpec, { kind: 'observation' }>;
    expect(obs.rows[0].goals.map((g) => g.goalId)).toEqual(expect.arrayContaining(['read.letter.O', 'read.syllables', 'read.syllable-reading', 'free.week-word']));
    const f = (n: string) => readFileSync(`public/fonts/${n}`);
    const bytes = await renderWorksheets(plan, plan.pages, { regular: f('andika-regular.ttf'), bold: f('andika-bold.ttf'), school: f('grundschrift.ttf') });
    expect(bytes.length).toBeGreaterThan(10_000);
  });

  it('rendert die Silbenwochen für alle Buchstaben der Reihe ohne Fehler', async () => {
    const children = [kid('k1', 'Kind Eins', '2021-03-10')];
    const f = (n: string) => readFileSync(`public/fonts/${n}`);
    const fonts = { regular: f('andika-regular.ttf'), bold: f('andika-bold.ttf'), school: f('grundschrift.ttf') };
    const order = LETTERS.map((l) => l.upper);
    for (let i = 1; i < order.length; i++) {
      const plan = planPack({
        pack: { id: 'p', weekStart: '2026-11-16', letter: order[i], createdAt: '', prints: [], children: [{ childId: 'k1', track: 'letters', math: false }] },
        children, statesByChild: new Map(), priorLetters: order.slice(0, i),
      });
      const pages = plan.pages.filter((p) => p.childId === 'k1' && p.spec.kind.startsWith('s'));
      await renderWorksheets(plan, pages, fonts);
    }
  }, 60_000);
});

import { describe, expect, it } from 'vitest';
import { goalStates } from '../src/services/learning';
import { planPack, type SheetChild } from '../src/services/learningPack';
import { mathStates } from '../src/services/math';
import { loadSheet, saveSheet } from '../src/services/observationSheet';
import type { ChildProfile, LearningPack } from '../src/types';
import { openDb } from './helpers';

const kid = (id: string, name: string, birthDate: string, schoolEntryDate: string): ChildProfile => ({
  id, role: 'child', name, color: 'sage', avatar: 'fox', sortOrder: 1, active: true, birthDate, schoolEntryDate,
  ageStage: 'large', maxVisibleTasks: 3, needsHelp: false, showLabels: true,
});
const children = [kid('k1', 'Kind Eins', '2021-03-10', '2027-09-01'), kid('k2', 'Kind Zwei', '2022-05-01', '2029-09-01'), kid('k3', 'Kind Drei', '2024-02-01', '2030-09-01')];
const pack: LearningPack = {
  id: 'p1', weekStart: '2026-10-05', letter: 'M', createdAt: '', prints: [],
  children: [{ childId: 'k1', track: 'letters', math: true }, { childId: 'k2', track: 'preschool', math: false }, { childId: 'k3', track: 'toddler' }],
};
const rows = (): SheetChild[] => {
  const plan = planPack({ pack, children, statesByChild: new Map(), today: '2026-10-10' });
  const spec = plan.pages.find((p) => p.spec.kind === 'observation')!.spec;
  return spec.kind === 'observation' ? spec.rows : [];
};

describe('Beobachtungsbogen in der App', () => {
  it('ordnet jede Zeile einem Lernziel zu', () => {
    const r = rows();
    expect(r.map((x) => x.name)).toEqual(['Kind Eins', 'Kind Zwei', 'Kind Drei']);
    expect(r[0].goals.map((g) => g.goalId)).toEqual(['read.letter.M', 'read.letter.M', 'read.letter.M', 'free.own-name', 'math.five', 'math.decompose10']);
    expect(r[1].goals.map((g) => g.goalId)).toEqual(['math.count10', 'read.syllables', 'read.onset']);
    expect(r[2].goals.map((g) => g.goalId)).toEqual(['free.craft', 'free.naming']);
  });

  it('speichert wie auf Papier, korrigiert beim zweiten Speichern statt doppelt zu zählen', async () => {
    const db = await openDb();
    const r = rows();
    const n = await saveSheet(db, 'p1', '2026-10-10', r, {
      k1: { levels: { 0: 'independent', 2: 'much-help', 3: 'independent' }, mood: 'fun' },
      k2: { levels: { 0: 'independent', 1: 'little-help', 2: 'much-help' }, mood: 'fun', note: 'Hat gleich weitergezählt' },
      k3: { levels: { 0: 'much-help', 1: 'independent' }, mood: 'fun' },
    });
    expect(n).toBe(8);
    let obs = await db.learningObservations.toArray();
    expect(obs).toHaveLength(8);
    expect(obs.every((o) => o.packId === 'p1' && o.mood === 'fun')).toBe(true);
    expect(obs.find((o) => o.childId === 'k2' && o.goalId === 'math.count10')?.note).toBe('Hat gleich weitergezählt');

    // Beobachtetes ist freigegeben, freie Zeilen nicht
    const releases = await db.learningReleases.toArray();
    expect(releases.map((x) => x.goalId).sort()).toEqual(['math.count10', 'read.letter.M', 'read.onset', 'read.syllables']);

    // Laden zeigt den Stand, erneutes Speichern ersetzt ihn
    const loaded = loadSheet(obs, 'p1', '2026-10-10', r);
    expect(loaded.k1.levels).toEqual({ 0: 'independent', 2: 'much-help', 3: 'independent' });
    await saveSheet(db, 'p1', '2026-10-10', r, { ...loaded, k1: { ...loaded.k1, levels: { 0: 'independent', 2: 'little-help' } } });
    obs = await db.learningObservations.toArray();
    expect(obs).toHaveLength(7);
    expect(obs.filter((o) => o.childId === 'k1').map((o) => o.level).sort()).toEqual(['independent', 'little-help']);

    // Zählt im Lesepfad: drei Erfolge an zwei Tagen → weitgehend sicher
    await saveSheet(db, 'p1', '2026-10-11', r, { k1: { levels: { 1: 'little-help' } } });
    obs = await db.learningObservations.toArray();
    const m = goalStates('k1', obs, await db.learningReleases.toArray(), '2026-10-11').find((s) => s.goal.id === 'read.letter.M')!;
    expect(m.status).toBe('mostly');
    expect(mathStates('k2', obs, [], '2026-10-11').find((s) => s.goal.id === 'math.count10')!.status).toBe('practising');
  });
});

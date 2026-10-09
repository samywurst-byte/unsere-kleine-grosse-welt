import { describe, expect, it } from 'vitest';
import { letterGoalId, LETTER_ORDER } from '../src/data/readingCurriculum';
import {
  addObservation, deriveStatus, goalStates, pathPhase, postponeGoal, releaseGoal, suggestions, todaysLetter, unreleaseGoal,
} from '../src/services/learning';
import { exportData, importData, validateBackup } from '../src/services/backup';
import type { ChildProfile, LearningObservation, ObservationLevel } from '../src/types';
import { openDb } from './helpers';

const obs = (date: string, level: ObservationLevel, goalId = letterGoalId('M')): LearningObservation => ({
  id: `${date}-${level}-${Math.random()}`, childId: 'c', goalId, date, level, createdAt: `${date}T10:00:00Z`,
});

describe('Lernstand je Buchstabe', () => {
  it('leitet aus einer einzelnen Beobachtung keine Sicherheit ab', () => {
    expect(deriveStatus([obs('2026-10-05', 'independent')], true, '2026-10-05').status).toBe('practising');
    expect(deriveStatus([], true, '2026-10-05').status).toBe('introducing');
    expect(deriveStatus([], false, '2026-10-05').status).toBe('not-started');
  });

  it('braucht mehrere Tage für "weitgehend sicher" und "sicher"', () => {
    const sameDay = ['independent', 'independent', 'independent'].map((l) => obs('2026-10-05', l as ObservationLevel));
    expect(deriveStatus(sameDay, true, '2026-10-05').status).toBe('practising');
    const mostly = [obs('2026-10-05', 'little-help'), obs('2026-10-06', 'independent'), obs('2026-10-06', 'little-help')];
    expect(deriveStatus(mostly, true, '2026-10-06').status).toBe('mostly');
    const mastered = [obs('2026-10-05', 'independent'), obs('2026-10-06', 'independent'), obs('2026-10-08', 'independent'), obs('2026-10-08', 'independent')];
    const res = deriveStatus(mastered, true, '2026-10-08');
    expect(res.status).toBe('mastered');
    expect(res.evidence).toBe('4× selbstständig an 3 Tagen, zuletzt am 8. Oktober.');
  });

  it('stuft nach einer einzelnen schwierigen Beobachtung nicht zurück, schlägt aber nach zwei Wiederholung vor', () => {
    const base = [obs('2026-10-05', 'independent'), obs('2026-10-06', 'independent'), obs('2026-10-07', 'independent'), obs('2026-10-08', 'independent')];
    expect(deriveStatus([...base, obs('2026-10-09', 'not-yet')], true, '2026-10-09').status).toBe('mastered');
    expect(deriveStatus([...base, obs('2026-10-09', 'not-yet'), obs('2026-10-10', 'much-help')], true, '2026-10-10').status).toBe('review');
  });

  it('schlägt nach vier Wochen ohne Übung eine Wiederholung vor', () => {
    const base = [obs('2026-10-05', 'independent'), obs('2026-10-06', 'independent'), obs('2026-10-07', 'little-help')];
    expect(deriveStatus(base, true, '2026-10-20').status).toBe('mostly');
    expect(deriveStatus(base, true, '2026-11-10').status).toBe('review');
  });

  it('ignoriert "nicht beurteilbar"', () => {
    expect(deriveStatus([obs('2026-10-05', 'not-assessable')], true, '2026-10-05').status).toBe('introducing');
  });
});

describe('Vorschläge', () => {
  it('beginnt mit M und gibt nie automatisch frei', async () => {
    const db = await openDb();
    const today = '2026-10-09';
    const states = goalStates('child-1', [], [], today);
    const s = suggestions(states, [], 'child-1', today);
    expect(s.find((x) => x.goal.kind === 'letter')?.goal.id).toBe(letterGoalId('M'));
    expect(await db.learningReleases.count()).toBe(0);
  });

  it('schlägt höchstens zwei Buchstaben gleichzeitig vor und den nächsten erst, wenn einer sitzt', async () => {
    const db = await openDb();
    const today = '2026-10-09';
    await releaseGoal(db, 'child-1', letterGoalId('M'));
    await releaseGoal(db, 'child-1', letterGoalId('A'));
    let st = goalStates('child-1', await db.learningObservations.toArray(), await db.learningReleases.toArray(), today);
    expect(suggestions(st, await db.learningReleases.toArray(), 'child-1', today).some((x) => x.goal.kind === 'letter')).toBe(false);

    for (const d of ['2026-10-06', '2026-10-07', '2026-10-08']) await addObservation(db, 'child-1', letterGoalId('M'), 'independent', d);
    st = goalStates('child-1', await db.learningObservations.toArray(), await db.learningReleases.toArray(), today);
    const next = suggestions(st, await db.learningReleases.toArray(), 'child-1', today).find((x) => x.goal.kind === 'letter');
    expect(next?.goal.id).toBe(letterGoalId('I'));
    expect(todaysLetter(st)?.goal.id).toBe(letterGoalId('A'));
  });

  it('respektiert "später" für eine Woche', async () => {
    const db = await openDb();
    await postponeGoal(db, 'child-1', letterGoalId('M'), '2026-10-09');
    const rel = await db.learningReleases.toArray();
    const first = (day: string) => suggestions(goalStates('child-1', [], rel, day), rel, 'child-1', day).find((x) => x.goal.kind === 'letter')?.goal.id;
    expect(first('2026-10-10')).toBe(letterGoalId('A'));
    expect(first('2026-10-16')).toBe(letterGoalId('M'));
  });

  it('Freigabe lässt sich nur ohne Beobachtungen zurücknehmen', async () => {
    const db = await openDb();
    await releaseGoal(db, 'child-1', letterGoalId('M'));
    expect(await unreleaseGoal(db, 'child-1', letterGoalId('M'))).toBe(true);
    await addObservation(db, 'child-1', letterGoalId('M'), 'little-help', '2026-10-09');
    expect(await unreleaseGoal(db, 'child-1', letterGoalId('M'))).toBe(false);
  });

  it('beginnt mit M, A, I, O, L, S, E, N', () => {
    expect(LETTER_ORDER.slice(0, 8).map((id) => id.split('.').pop())).toEqual(['M', 'A', 'I', 'O', 'L', 'S', 'E', 'N']);
  });
});

describe('Start des Lesepfads', () => {
  const child = (schoolEntryDate?: string) => ({ id: 'c', schoolEntryDate } as ChildProfile);
  it('startet ein Jahr vor der Einschulung', () => {
    expect(pathPhase(child(), '2026-10-09').kind).toBe('no-date');
    expect(pathPhase(child('2027-09-01'), '2026-10-09')).toMatchObject({ kind: 'active', start: '2026-09-01' });
    expect(pathPhase(child('2029-09-01'), '2026-10-09')).toMatchObject({ kind: 'upcoming', start: '2028-09-01' });
    expect(pathPhase(child('2027-09-01'), '2027-09-02').kind).toBe('in-school');
  });
});

describe('Sicherung', () => {
  it('enthält Beobachtungen und Freigaben', async () => {
    const db = await openDb();
    await addObservation(db, 'child-1', letterGoalId('M'), 'independent', '2026-10-09', 'kannte den Laut sofort');
    const data = JSON.parse(JSON.stringify(await exportData(db)));
    expect(data.tables.learningObservations).toHaveLength(1);
    const res = validateBackup(data);
    expect(res.ok).toBe(true);
    const other = await openDb();
    if (res.ok) await importData(other, res.data);
    expect((await other.learningObservations.toArray())[0].note).toBe('kannte den Laut sofort');
  });
});

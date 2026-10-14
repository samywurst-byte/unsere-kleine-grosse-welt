import { describe, expect, it } from 'vitest';
import { ABILITIES, ACADEMY_MISSIONS, ACADEMY_WEEKS, FEELINGS, partnerName, personalize, tryPlan } from '../src/data/heroAcademy';
import { HERO_MISSIONS, HERO_PLACE_BY_ID } from '../src/data/heroWorld';
import { missionStates } from '../src/services/heroWorld';

describe('Heldenakademie', () => {
  it('hat acht Missionen in vier Wochen, zwei pro Woche, und übt alle fünf Fähigkeiten', () => {
    expect(ACADEMY_MISSIONS).toHaveLength(8);
    for (const w of ACADEMY_WEEKS) expect(ACADEMY_MISSIONS.filter((m) => m.week === w.week), `Woche ${w.week}`).toHaveLength(2);
    expect(new Set(ACADEMY_MISSIONS.map((m) => m.ability))).toEqual(new Set(ABILITIES.map((a) => a.id)));
    expect(HERO_MISSIONS.map((m) => m.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(new Set(HERO_MISSIONS.map((m) => m.id)).size).toBe(HERO_MISSIONS.length);
    for (const m of ACADEMY_MISSIONS) {
      expect(HERO_PLACE_BY_ID.has(m.place), m.id).toBe(true);
      expect(m.steps[0].kind, m.id).toBe('say');
      expect(m.steps.at(-1)?.kind, m.id).toBe('reveal');
      expect(m.steps.some((s) => s.kind === 'real'), m.id).toBe(true);
    }
  });

  it('jede Entscheidung hat gute Ideen, Gefühle passen zur Liste', () => {
    const feelingIds = FEELINGS.map((f) => f.id);
    for (const m of ACADEMY_MISSIONS) {
      for (const s of m.steps) {
        if (s.kind === 'choice') {
          expect(s.options.filter((o) => o.ok !== false).length, m.id).toBeGreaterThanOrEqual(2);
          expect(new Set(s.options.map((o) => o.id)).size, m.id).toBe(s.options.length);
        }
        if (s.kind === 'feelings') for (const sc of s.scenes) for (const f of sc.feels) expect(feelingIds).toContain(f);
      }
    }
  });

  it('keine Punkte, keine Strafen: Texte loben Mühe statt Ruhigsein', () => {
    const all = JSON.stringify(ACADEMY_MISSIONS).toLowerCase();
    for (const word of ['punkt', 'strafe', 'brav', 'böse', 'leise sein', 'ruhig sein']) expect(all, word).not.toContain(word);
  });

  it('setzt das Geschwisterkind ein, das im Alter am nächsten ist', () => {
    const kids = [
      { id: 'taro', name: 'Kind A', birthDate: '2021-03-01' },
      { id: 'taavi', name: 'Kind B', birthDate: '2022-06-01' },
      { id: 'talisa', name: 'Kind C', birthDate: '2024-05-01' },
    ];
    expect(partnerName(kids[1], kids)).toBe('Kind A');
    expect(partnerName(kids[2], kids)).toBe('Kind B');
    expect(partnerName(kids[0], [kids[0]])).toBe('Mama oder Papa');
    const duck = personalize(ACADEMY_MISSIONS.find((m) => m.id === 'academy-duck')!, 'Kind A');
    expect(JSON.stringify(duck)).not.toContain('{partner}');
    expect(JSON.stringify(duck)).toContain('Kind A');
  });

  it('Mutmacher: erst abrutschen, am Ende klappt es', () => {
    for (const v of ['parcours', 'climb'] as const) {
      for (const easy of [false, true]) {
        const p = tryPlan(v, easy);
        expect(p.slips.at(-1)).toBeNull();
        expect(p.slips[0]).not.toBeNull();
        for (const s of p.slips) if (s !== null) expect(s).toBeLessThan(p.length - 1);
      }
    }
  });

  it('die Akademie öffnet sich nach dem Ninja-Pfad am nächsten Missionstag', () => {
    const done = (missionId: string, at: string) => ({ id: `k|${missionId}`, childId: 'k', missionId, runs: 1, solutions: [], helpUsed: 0, firstCompletedAt: at, updatedAt: at });
    const recs = ['welcome', 'my-hero', 'rescue-fino', 'ninja-path'].map((m) => done(m, '2026-10-14T10:00:00.000Z'));
    const states = missionStates(HERO_MISSIONS, recs, 'k', '2026-10-14', [3, 6]);
    expect(states[4]).toEqual({ status: 'waiting', opensOn: '2026-10-17' });
    expect(missionStates(HERO_MISSIONS, recs, 'k', '2026-10-17', [3, 6])[4].status).toBe('open');
    expect(states[5].status).toBe('locked');
  });
});

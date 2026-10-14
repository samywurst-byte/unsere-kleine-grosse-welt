import { describe, expect, it } from 'vitest';
import { HERO_MISSIONS, HERO_PLACE_BY_ID, OBSTACLES, RAFT_ITEMS, RAFT_NEEDED } from '../src/data/heroWorld';
import { exportData, validateBackup } from '../src/services/backup';
import {
  addOwnIdea, addPlayTime, BRIDGE_GAP, canPlacePlank, completeMission, enterMission, extendPlayTime, isOverLimit, markReal, missionStates, nextBridgeStep,
  nextMissionDay, playTimeId, resetMission, saveLook, saveProgress, setMissionRelease, snapPlank, testBridge, type Plank,
} from '../src/services/heroWorld';
import type { HeroMission } from '../src/types';
import { openDb } from './helpers';

const rec = (missionId: string, patch: Partial<HeroMission> = {}): HeroMission => ({
  id: `k|${missionId}`, childId: 'k', missionId, runs: 0, solutions: [], helpUsed: 0, updatedAt: 'x', ...patch,
});

describe('Heldenwelt: Inhalte', () => {
  it('hat vier Pilotmissionen an bestehenden Orten, jede endet mit einem Abschluss', () => {
    expect(HERO_MISSIONS.map((m) => m.id).slice(0, 4)).toEqual(['welcome', 'my-hero', 'rescue-fino', 'ninja-path']);
    for (const m of HERO_MISSIONS) {
      expect(HERO_PLACE_BY_ID.has(m.place)).toBe(true);
      expect(m.steps.at(-1)?.kind).toBe('reveal');
      expect(m.steps.filter((s) => s.kind === 'reveal')).toHaveLength(1);
    }
  });
  it('der Ninja-Pfad hat einen Sicherheitshinweis, das Floß ist baubar', () => {
    const real = HERO_MISSIONS.find((m) => m.id === 'ninja-path')!.steps.find((s) => s.kind === 'real');
    expect(real && 'safety' in real && real.safety).toMatch(/Erwachsenen/);
    expect(RAFT_ITEMS.filter((i) => i.floats).length).toBeGreaterThanOrEqual(RAFT_NEEDED);
    expect(OBSTACLES).toHaveLength(3);
  });
});

describe('Heldenwelt: Missionstage', () => {
  // 2026-10-14 ist ein Mittwoch, 2026-10-17 ein Samstag.
  it('findet den nächsten Missionstag', () => {
    expect(nextMissionDay('2026-10-12', [3, 6])).toBe('2026-10-14');
    expect(nextMissionDay('2026-10-14', [3, 6])).toBe('2026-10-17');
    expect(nextMissionDay('2026-10-14', [])).toBe('2026-10-15');
  });
  it('öffnet die nächste Mission am nächsten Missionstag und lässt sie danach offen', () => {
    const done = [rec('welcome', { firstCompletedAt: '2026-10-12T10:00:00.000Z', runs: 1 })];
    expect(missionStates(HERO_MISSIONS, done, 'k', '2026-10-13', [3, 6]).map((s) => s.status).slice(0, 4)).toEqual(['done', 'waiting', 'locked', 'locked']);
    expect(missionStates(HERO_MISSIONS, done, 'k', '2026-10-13', [3, 6])[1].opensOn).toBe('2026-10-14');
    expect(missionStates(HERO_MISSIONS, done, 'k', '2026-10-14', [3, 6])[1].status).toBe('open');
    expect(missionStates(HERO_MISSIONS, done, 'k', '2026-10-20', [3, 6])[1].status).toBe('open');
    expect(missionStates(HERO_MISSIONS, done, 'k', '2026-10-12', [])[1].status).toBe('open');
  });
  it('zeigt angefangene Missionen und Freigaben, andere Kinder zählen nicht', () => {
    const r = [rec('welcome', { current: { step: 2, data: {}, startedAt: 'x' } }), rec('ninja-path', { released: true }), { ...rec('my-hero', { firstCompletedAt: 'x' }), childId: 'other' }];
    expect(missionStates(HERO_MISSIONS, r, 'k', '2026-10-12', [3, 6]).map((s) => s.status).slice(0, 4)).toEqual(['progress', 'locked', 'locked', 'open']);
  });
});

describe('Heldenwelt: Brückenbau', () => {
  const gap = BRIDGE_GAP.normal;
  it('erkennt Loch und wackelnde Bretter', () => {
    expect(testBridge(gap, [], [])).toEqual({ ok: false, reason: 'hole', at: 0 });
    expect(testBridge(gap, [{ start: 0, len: 3 }], [])).toEqual({ ok: false, reason: 'wobble', at: 0 });
    expect(testBridge(gap, [{ start: 0, len: 3 }], [3])).toEqual({ ok: false, reason: 'hole', at: 3 });
    expect(testBridge(gap, [{ start: 0, len: 3 }, { start: 3, len: 3 }], [])).toEqual({ ok: false, reason: 'wobble', at: 0 });
    expect(testBridge(gap, [{ start: 0, len: 3 }, { start: 3, len: 3 }], [3])).toEqual({ ok: true });
    expect(testBridge(gap, [{ start: 0, len: 2 }, { start: 2, len: 2 }, { start: 4, len: 2 }], [2, 4])).toEqual({ ok: true });
    expect(testBridge(gap, [{ start: 0, len: gap }], [])).toEqual({ ok: true });
  });
  it('Bretter überlappen nicht und rasten in der Nähe ein', () => {
    const planks: Plank[] = [{ start: 0, len: 3 }];
    expect(canPlacePlank(planks, { start: 2, len: 2 }, gap)).toBe(false);
    expect(canPlacePlank(planks, { start: 4, len: 3 }, gap)).toBe(false);
    expect(snapPlank(planks, 2, 3, gap)).toBe(3);
    expect(snapPlank(planks, -3, 2, gap)).toBeNull();
  });
  it('„Gemeinsam“ führt von jedem Stand zu einer haltenden Brücke', () => {
    const starts: { planks: Plank[]; pillars: number[] }[] = [
      { planks: [], pillars: [] },
      { planks: [{ start: 1, len: 2 }], pillars: [] },
      { planks: [{ start: 0, len: 2 }, { start: 3, len: 3 }], pillars: [5] },
      { planks: [{ start: 2, len: 3 }], pillars: [1] },
    ];
    for (const g of [BRIDGE_GAP.normal, BRIDGE_GAP.easy]) {
      for (const s of starts.filter((x) => x.planks.every((p) => p.start + p.len <= g))) {
        let { planks, pillars } = s;
        for (let i = 0; i < 12 && !testBridge(g, planks, pillars).ok; i++) {
          const step = nextBridgeStep(g, planks, pillars);
          expect(step).not.toBeNull();
          if (step!.kind === 'pillar') pillars = [...pillars, step!.at];
          if (step!.kind === 'plank') { expect(canPlacePlank(planks, step!, g)).toBe(true); planks = [...planks, { start: step!.start, len: step!.len }]; }
          if (step!.kind === 'remove') planks = planks.filter((p) => p.start !== step!.start);
        }
        expect(testBridge(g, planks, pillars).ok).toBe(true);
      }
    }
  });
});

describe('Heldenwelt: Speichern', () => {
  it('merkt sich Schritt und Spielstand, zählt Orte, schließt ab und kommt in die Sicherung', async () => {
    const db = await openDb();
    const def = HERO_MISSIONS[2];
    await enterMission(db, 'child-2', def);
    await saveProgress(db, 'child-2', def.id, 1, { way: 'bridge', bridge: { planks: [{ start: 0, len: 3 }], pillars: [], gap: 6 } });
    const resumed = await enterMission(db, 'child-2', def);
    expect(resumed.current?.step).toBe(1);
    expect(resumed.current?.data.way).toBe('bridge');
    expect((await db.heroProfiles.get('child-2'))?.placeVisits.rescue).toBe(1);
    await markReal(db, 'child-2', def.id, false);
    expect((await db.heroMissions.get('child-2|rescue-fino'))?.realLater).toBe(true);
    expect(await completeMission(db, 'child-2', def.id, 'bridge')).toBe(true);
    await addOwnIdea(db, 'child-2', def.id, '  mit einem Seil  ');
    const r = (await db.heroMissions.get('child-2|rescue-fino'))!;
    expect([r.current, r.runs, r.solutions, r.ownIdeas?.[0].text]).toEqual([undefined, 1, ['bridge', 'own'], 'mit einem Seil']);
    await enterMission(db, 'child-2', def);
    expect(await completeMission(db, 'child-2', def.id, 'boat')).toBe(false);
    await saveLook(db, 'child-2', { symbol: 'moon' });
    await setMissionRelease(db, 'child-2', 'ninja-path', true);
    const backup = await exportData(db);
    expect(backup.tables.heroMissions).toHaveLength(2);
    expect(backup.tables.heroProfiles).toHaveLength(1);
    expect(validateBackup(backup).ok).toBe(true);
    await resetMission(db, 'child-2', def.id);
    expect(await db.heroMissions.get('child-2|rescue-fino')).toBeUndefined();
  });

  it('sanfte Grenze: nach 15 Minuten Pause, mit PIN wieder volle Zeit', async () => {
    const db = await openDb();
    const day = '2026-10-11';
    await addPlayTime(db, 'child-2', day, 14 * 60_000);
    expect(isOverLimit(await db.playTimes.get(playTimeId('child-2', day)), 15)).toBe(false);
    await addPlayTime(db, 'child-2', day, 60_000);
    expect(isOverLimit(await db.playTimes.get(playTimeId('child-2', day)), 15)).toBe(true);
    expect(isOverLimit(await db.playTimes.get(playTimeId('child-2', day)), 0)).toBe(false);
    await extendPlayTime(db, 'child-2', day);
    expect(isOverLimit(await db.playTimes.get(playTimeId('child-2', day)), 15)).toBe(false);
    await addPlayTime(db, 'child-2', day, 15 * 60_000);
    expect(isOverLimit(await db.playTimes.get(playTimeId('child-2', day)), 15)).toBe(true);
    const backup = await exportData(db);
    expect(validateBackup(backup).ok).toBe(true);
  });
});

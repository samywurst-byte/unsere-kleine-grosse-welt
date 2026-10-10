import { describe, expect, it } from 'vitest';
import { FamilyDatabase } from '../src/database/db';
import { exportData, validateBackup } from '../src/services/backup';
import { routinesForChild } from '../src/services/routines';
import { preparationDue, planRitual, seasonalRituals, setFavorite } from '../src/services/rituals';
import { noKindergartenForAll, setSpecialDays, tasksHiddenFor } from '../src/services/specialDay';
import {
  confirmMission, declineMission, nextCountry, requestMission, saveMission, starBalance, unlockCountry, undoConfirmation,
} from '../src/services/stars';
import { RITUAL_BY_ID } from '../src/data/rituals';
import { openDb } from './helpers';

const limit = { maxStarsPerChildPerDay: 5 };

async function withMissions() {
  const db = await openDb();
  await saveMission(db, { id: 'm1', title: 'Tisch decken', icon: 'utensils', stars: 2, assignedTo: ['child-1', 'child-2'], active: true });
  await saveMission(db, { id: 'm2', title: 'Blumen gießen', icon: 'flower', stars: 3, assignedTo: ['child-1'], active: true });
  await saveMission(db, { id: 'm3', title: 'Bild malen', icon: 'palette', stars: 3, assignedTo: ['child-1'], active: true });
  return db;
}

describe('Familiensterne', () => {
  it('bucht Sterne erst nach Bestätigung, einmal pro Mission, Kind und Tag', async () => {
    const db = await withMissions();
    const c = await requestMission(db, 'm1', 'child-1', '2026-10-10');
    await requestMission(db, 'm1', 'child-1', '2026-10-10');
    expect(await db.missionCompletions.count()).toBe(1);
    expect(starBalance(await db.starTransactions.toArray())).toBe(0);
    expect(await confirmMission(db, c.id, limit)).toBe(2);
    expect(await confirmMission(db, c.id, limit)).toBe(0);
    expect(starBalance(await db.starTransactions.toArray())).toBe(2);
  });

  it('hält die Tagesgrenze pro Kind ein und zieht nie etwas ab', async () => {
    const db = await withMissions();
    const ids = [];
    for (const m of ['m1', 'm2', 'm3']) ids.push((await requestMission(db, m, 'child-1', '2026-10-10')).id);
    expect(await confirmMission(db, ids[0], limit)).toBe(2);
    expect(await confirmMission(db, ids[1], limit)).toBe(3);
    expect(await confirmMission(db, ids[2], limit)).toBe(0);
    // anderes Kind hat eigene Grenze, Sterne landen im gemeinsamen Glas
    const other = await requestMission(db, 'm1', 'child-2', '2026-10-10');
    expect(await confirmMission(db, other.id, limit)).toBe(2);
    const declined = await requestMission(db, 'm1', 'child-1', '2026-10-11');
    await declineMission(db, declined.id);
    const tx = await db.starTransactions.toArray();
    expect(starBalance(tx)).toBe(7);
    expect(tx.every((t) => t.amount > 0)).toBe(true);
  });

  it('schaltet mit genug Sternen das nächste Land frei und stempelt den Pass', async () => {
    const db = await withMissions();
    const world = await db.countries.orderBy('order').toArray();
    expect(world.length).toBeGreaterThan(10);
    expect(nextCountry(world, [])?.id).toBe('country-italy');
    expect(await unlockCountry(db, 'country-italy', 4, ['child-1', 'child-2'])).toBe(false);
    for (const [m, d] of [['m1', '2026-10-10'], ['m1', '2026-10-11']] as const) {
      const c = await requestMission(db, m, 'child-1', d);
      await confirmMission(db, c.id, limit);
    }
    expect(await unlockCountry(db, 'country-italy', 4, ['child-1', 'child-2'])).toBe(true);
    expect(await unlockCountry(db, 'country-italy', 4, ['child-1', 'child-2'])).toBe(false);
    expect(starBalance(await db.starTransactions.toArray())).toBe(0);
    expect(await db.passportStamps.count()).toBe(2);
    expect(nextCountry(world, await db.countryUnlocks.toArray())?.id).toBe('country-france');
    // Bestätigung lässt sich nicht zurücknehmen, wenn die Sterne schon verreist sind
    expect(await undoConfirmation(db, 'm1|child-1|2026-10-10|1')).toBe(false);
  });

  it('ergänzt beim Update die Länder, ohne Vorhandenes zu ändern', async () => {
    const db = await openDb();
    await db.countries.update('country-italy', { nameDe: 'Italia' });
    db.close();
    const again = new FamilyDatabase(db.name);
    await again.open();
    expect((await again.countries.get('country-italy'))?.nameDe).toBe('Italia');
  });
});

describe('Sondermodus', () => {
  it('blendet bei Krankheit die Aufgaben des Kindes aus, andere Kinder nicht', async () => {
    const db = await openDb();
    await setSpecialDays(db, '2026-10-12', '2026-10-13', { kind: 'sick', childIds: ['child-1'], hideRoutines: true, note: ' ' });
    const day = (await db.specialDays.get('2026-10-12'))!;
    expect(day.note).toBeUndefined();
    expect(await db.specialDays.count()).toBe(2);
    const defs = await db.routineDefinitions.toArray();
    expect(routinesForChild(defs, 'child-1', '2026-10-12', { special: day })).toEqual([]);
    expect(routinesForChild(defs, 'child-2', '2026-10-12', { special: day }).length).toBeGreaterThan(0);
    expect(tasksHiddenFor(day, 'child-1')).toBe(true);
    expect(noKindergartenForAll(day, ['child-1', 'child-2'])).toBe(false);
    expect(noKindergartenForAll({ ...day, kind: 'vacation', childIds: ['child-1', 'child-2'] }, ['child-1', 'child-2'])).toBe(true);
  });

  it('streicht ohne Ausblenden nur die Kindergarten-Routinen', async () => {
    const db = await openDb();
    const defs = await db.routineDefinitions.toArray();
    const special = { date: '2026-10-12', kind: 'no-kindergarten' as const, childIds: ['child-1'], hideRoutines: false };
    const normal = routinesForChild(defs, 'child-1', '2026-10-12');
    const without = routinesForChild(defs, 'child-1', '2026-10-12', { special });
    expect(without.length).toBeLessThan(normal.length);
    expect(without.every((d) => !d.kindergartenOnly)).toBe(true);
  });
});

describe('Jahreszeitenrituale', () => {
  it('schlägt passend zur Jahreszeit vor, Favoriten zuerst, und erinnert rechtzeitig ans Material', async () => {
    const db = await openDb();
    const october = seasonalRituals('2026-10-10', []);
    expect(october.some((r) => r.id === 'lanterns')).toBe(true);
    expect(october.some((r) => r.id === 'strawberries')).toBe(false);
    await setFavorite(db, 'cookies', true, 'Omas Butterplätzchen');
    expect(seasonalRituals('2026-10-10', await db.ritualFavorites.toArray())[0].id).toBe('cookies');
    const r = await planRitual(db, RITUAL_BY_ID.get('lanterns')!, '2026-11-05');
    const lead = (id: string) => RITUAL_BY_ID.get(id)?.leadDays ?? 1;
    expect(preparationDue([r], '2026-10-20', lead)).toHaveLength(0);
    expect(preparationDue([r], '2026-10-30', lead)).toHaveLength(1);
    expect(preparationDue([{ ...r, materials: r.materials.map((m) => ({ ...m, done: true })) }], '2026-10-30', lead)).toHaveLength(0);
    const backup = await exportData(db);
    expect(backup.tables.rituals).toHaveLength(1);
    expect(validateBackup(JSON.parse(JSON.stringify(backup))).ok).toBe(true);
  });
});

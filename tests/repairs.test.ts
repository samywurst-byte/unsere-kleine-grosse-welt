import Dexie from 'dexie';
import { describe, expect, it } from 'vitest';
import { FamilyDatabase } from '../src/database/db';
import { upgradeRoutine, upgradeSettings } from '../src/database/migrations';
import { SCHEMA_V1, SCHEMA_V2 } from '../src/database/schema';
import { buildSeed } from '../src/data/seed';
import {
  backupIsDue, createSafetyCopy, exportData, importData, markBackedUp, restoreSafetyCopy, validateBackup,
} from '../src/services/backup';
import { moveChore, ensureChoreOccurrences, choresForDate } from '../src/services/chores';
import { createRecoveryCode, resetPinWithRecoveryCode, setPin, verifyPin } from '../src/services/pin';
import { routinesForChild } from '../src/services/routines';
import { readingPathStart } from '../src/services/school';
import type { AppSettings, RoutineDefinition } from '../src/types';
import { freshDbName, openDb } from './helpers';

describe('Ferien und freie Tage', () => {
  it('blenden Kindergarten-Routinen aus, alle anderen bleiben', async () => {
    const db = await openDb();
    const defs = await db.routineDefinitions.toArray();
    const normal = routinesForChild(defs, 'child-1', '2026-10-05', { kindergartenDay: true }).map((d) => d.title);
    const holiday = routinesForChild(defs, 'child-1', '2026-10-05', { kindergartenDay: false }).map((d) => d.title);
    expect(normal).toContain('Kindergarten vorbereiten');
    expect(holiday).not.toContain('Kindergarten vorbereiten');
    expect(holiday).not.toContain('Schuhe und Jacke anziehen');
    expect(holiday).toContain('Zähneputzen');
  });
});

describe('Migration auf Version 3', () => {
  it('kennzeichnet bestehende Kindergarten-Routinen und übernimmt "donnerstags ohne Papa"', async () => {
    const name = freshDbName();
    const v2 = new Dexie(name);
    v2.version(1).stores(SCHEMA_V1);
    v2.version(2).stores(SCHEMA_V2);
    await v2.open();
    const seed = buildSeed('2026-10-05');
    const { homeArrivalLabel: _a, homeArrivalDays: _b, afterKindergartenNote: _c, weekBanner: _d, ...oldSettings } = seed.settings;
    await v2.table('settings').add(oldSettings);
    await v2.table('routineDefinitions').bulkAdd(seed.routines.map(({ kindergartenOnly: _k, ...r }) => r));
    v2.close();

    const db = new FamilyDatabase(name);
    await db.open();
    const s = (await db.settings.get('app'))!;
    expect(s.homeArrivalDays).toEqual([1, 2, 3, 5]);
    expect(s.homeArrivalLabel).toBe('Papa kommt nach Hause');
    expect(s.weekBanner).toContain('15 Minuten');
    const kg = (await db.routineDefinitions.toArray()).filter((r) => r.kindergartenOnly).map((r) => r.title).sort();
    expect(kg).toEqual(['Kindergarten vorbereiten', 'Schuhe und Jacke anziehen']);
  });

  it('überschreibt keine vorhandenen Werte', () => {
    const s: Partial<AppSettings> = { homeArrivalLabel: '', homeArrivalDays: [1], weekBanner: 'x', kindergartenDays: [1, 2] };
    upgradeSettings(s, 2);
    expect(s).toMatchObject({ homeArrivalLabel: '', homeArrivalDays: [1], weekBanner: 'x' });
    const r: Partial<RoutineDefinition> = { phase: 'morning', weekdays: [1, 2], kindergartenOnly: false };
    upgradeRoutine(r, [1, 2]);
    expect(r.kindergartenOnly).toBe(false);
  });
});

describe('Datensicherung', () => {
  it('legt vor jedem Import eine Sicherheitskopie an und kann sie zurückholen', async () => {
    const db = await openDb();
    await db.members.update('child-1', { name: 'Vorher' });
    const backup = await exportData(db);
    await db.members.update('child-1', { name: 'Aktuell' });

    const safety = await importData(db, backup);
    expect((await db.members.get('child-1'))?.name).toBe('Vorher');
    expect(await db.safetyCopies.count()).toBe(1);

    await restoreSafetyCopy(db, safety.id);
    expect((await db.members.get('child-1'))?.name).toBe('Aktuell');
  });

  it('behält höchstens drei Sicherheitskopien', async () => {
    const db = await openDb();
    for (let i = 0; i < 5; i++) await createSafetyCopy(db);
    expect(await db.safetyCopies.count()).toBe(3);
  });

  it('exportiert weder PIN noch Gerätedaten oder Sicherheitskopien', async () => {
    const db = await openDb();
    await setPin(db, '2468', 1000);
    await markBackedUp(db);
    await createSafetyCopy(db);
    const data = await exportData(db);
    expect(Object.keys(data.tables)).not.toContain('parentAuth');
    expect(Object.keys(data.tables)).not.toContain('deviceMeta');
    expect(Object.keys(data.tables)).not.toContain('safetyCopies');
  });

  it('bringt ältere Sicherungen beim Einspielen auf den aktuellen Stand', async () => {
    const db = await openDb();
    const backup = await exportData(db);
    const old = JSON.parse(JSON.stringify(backup));
    old.schemaVersion = 2;
    old.tables.settings = old.tables.settings.map(({ homeArrivalDays: _a, homeArrivalLabel: _b, ...s }: Record<string, unknown>) => s);
    old.tables.routineDefinitions = old.tables.routineDefinitions.map(({ kindergartenOnly: _k, ...r }: Record<string, unknown>) => r);
    const res = validateBackup(old);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    await importData(db, res.data);
    expect((await db.settings.get('app'))?.homeArrivalDays).toEqual([1, 2, 3, 5]);
    expect((await db.routineDefinitions.toArray()).filter((r) => r.kindergartenOnly)).toHaveLength(2);
  });

  it('lehnt Datensätze ohne Kennung auch in neuen Tabellen ab', async () => {
    const db = await openDb();
    const data = JSON.parse(JSON.stringify(await exportData(db)));
    data.tables.missions = [{ title: 'ohne Id' }];
    expect(validateBackup(data).ok).toBe(false);
  });

  it('erinnert an eine Sicherung nach sieben Tagen', () => {
    const now = new Date(2026, 9, 9, 12, 0);
    expect(backupIsDue(undefined, now)).toBe(true);
    expect(backupIsDue(new Date(2026, 9, 5).toISOString(), now)).toBe(false);
    expect(backupIsDue(new Date(2026, 9, 1).toISOString(), now)).toBe(true);
  });
});

describe('PIN vergessen', () => {
  it('setzt mit dem Notfallcode eine neue PIN; der Code ist danach verbraucht', async () => {
    const db = await openDb();
    await setPin(db, '2468', 1000);
    const code = await createRecoveryCode(db, 1000);
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(JSON.stringify(await db.parentAuth.get('parent'))).not.toContain(code.replace(/-/g, ''));

    expect((await resetPinWithRecoveryCode(db, code.toLowerCase(), '1357')).ok).toBe(true);
    expect((await verifyPin(db, '1357')).ok).toBe(true);
    expect((await resetPinWithRecoveryCode(db, code, '9999')).ok).toBe(false);
  });

  it('zählt falsche Codes in die Sperre und behält den Code beim PIN-Wechsel', async () => {
    const db = await openDb();
    await setPin(db, '2468', 1000);
    const code = await createRecoveryCode(db, 1000);
    await setPin(db, '1111', 1000);
    for (let i = 0; i < 5; i++) await resetPinWithRecoveryCode(db, 'AAAA-AAAA-AAAA', '5555');
    const locked = await resetPinWithRecoveryCode(db, code, '5555');
    expect(locked.ok).toBe(false);
    expect((await verifyPin(db, '1111', Date.now() + 60 * 60_000)).ok).toBe(true);
    expect((await resetPinWithRecoveryCode(db, code, '5555', Date.now() + 60 * 60_000)).ok).toBe(true);
  });
});

describe('Haushaltsaufgaben verschieben', () => {
  it('verschiebt nicht auf einen Tag, an dem dieselbe Aufgabe ohnehin ansteht', async () => {
    const db = await openDb();
    await ensureChoreOccurrences(db, '2026-10-06'); // Dienstag
    expect(await moveChore(db, 'chore-1|2026-10-06', '2026-10-10')).toBe('conflict'); // Samstag ist Haushaltstag
    expect(await moveChore(db, 'chore-1|2026-10-06', '2026-10-07')).toBe('moved');
    expect((await choresForDate(db, '2026-10-07')).map((c) => c.definitionId)).toEqual(['chore-1']);
  });
});

describe('Einschulung', () => {
  it('Lesepfad beginnt ein Jahr vorher', () => {
    expect(readingPathStart('2027-09-01')).toBe('2026-09-01');
    expect(readingPathStart('2028-02-29')).toBe('2027-02-28');
  });
});

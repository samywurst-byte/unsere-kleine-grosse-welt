import { describe, expect, it } from 'vitest';
import { exportData, importData, validateBackup } from '../src/services/backup';
import { setPin, verifyPin } from '../src/services/pin';
import { openDb } from './helpers';

describe('Datensicherung', () => {
  it('Export und Import ergeben denselben Datenstand', async () => {
    const source = await openDb();
    await source.members.update('child-1', { name: 'Kind Testname' });
    await source.routineOccurrences.put({
      id: 'r|child-1|2026-10-05', definitionId: 'r', childId: 'child-1', date: '2026-10-05', completedAt: 'x', assisted: false,
    });
    const backup = JSON.parse(JSON.stringify(await exportData(source)));

    const target = await openDb();
    await setPin(target, '2468', 1000);
    const result = validateBackup(backup);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    await importData(target, result.data);
    expect((await target.members.get('child-1'))?.name).toBe('Kind Testname');
    expect(await target.routineOccurrences.count()).toBe(1);
    // Die PIN des Zielgeräts bleibt erhalten und wird nie exportiert
    expect(backup.tables.parentAuth).toBeUndefined();
    expect((await verifyPin(target, '2468')).ok).toBe(true);
  });

  it('lehnt fremde, beschädigte oder neuere Dateien ab', async () => {
    expect(validateBackup('hallo').ok).toBe(false);
    expect(validateBackup({ app: 'andere-app', format: 1, schemaVersion: 1, tables: {} }).ok).toBe(false);

    const good = JSON.parse(JSON.stringify(await exportData(await openDb())));
    expect(validateBackup({ ...good, schemaVersion: 99 }).ok).toBe(false);

    const badTime = structuredClone(good);
    badTime.tables.events[0].startTime = '25:99';
    const res = validateBackup(badTime);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.join(' ')).toContain('Ungültige Uhrzeit');

    const noMembers = structuredClone(good);
    noMembers.tables.members = [];
    expect(validateBackup(noMembers).ok).toBe(false);
  });

  it('ein fehlgeschlagener Import verändert nichts', async () => {
    const db = await openDb();
    const before = await db.members.count();
    const backup = JSON.parse(JSON.stringify(await exportData(db)));
    backup.tables.routineDefinitions.push(backup.tables.routineDefinitions[0]); // doppelter Schlüssel
    await expect(importData(db, backup)).rejects.toThrow();
    expect(await db.members.count()).toBe(before);
    expect(await db.routineDefinitions.count()).toBeGreaterThan(0);
  });
});

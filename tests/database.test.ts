import Dexie from 'dexie';
import { describe, expect, it } from 'vitest';
import { FamilyDatabase } from '../src/database/db';
import { SCHEMA_V1 } from '../src/database/schema';
import { buildSeed } from '../src/data/seed';
import { freshDbName, openDb } from './helpers';

describe('Datenbank', () => {
  it('legt Initialdaten nur beim ersten Start an und überschreibt bei Neustart nichts', async () => {
    const name = freshDbName();
    const db = await openDb(name);
    const members = await db.members.count();
    await db.members.update('child-2', { name: 'Kind 2 geändert' });
    await db.events.delete('event-turnen');
    db.close();

    const again = new FamilyDatabase(name);
    await again.open();
    expect(await again.members.count()).toBe(members);
    expect((await again.members.get('child-2'))?.name).toBe('Kind 2 geändert');
    expect(await again.events.get('event-turnen')).toBeUndefined();
  });

  it('Migration von Version 1 auf 2 erhält bestehende Daten und ergänzt neue Felder', async () => {
    const name = freshDbName();
    const v1 = new Dexie(name);
    v1.version(1).stores(SCHEMA_V1);
    await v1.open();
    const seed = buildSeed('2026-10-05');
    const { maxStarsPerChildPerDay: _a, starsPerCountry: _b, ...oldSettings } = seed.settings;
    await v1.table('settings').add({ ...oldSettings, bedtime: '19:15' });
    await v1.table('members').bulkAdd(seed.members);
    await v1.table('routineOccurrences').add({
      id: 'x|child-1|2026-10-01', definitionId: 'x', childId: 'child-1', date: '2026-10-01', completedAt: 'c', assisted: false,
    });
    v1.close();

    const upgraded = new FamilyDatabase(name);
    await upgraded.open();
    expect(upgraded.verno).toBe(10);
    expect(await upgraded.recipes.count()).toBeGreaterThan(20);
    const settings = await upgraded.settings.get('app');
    expect(settings?.bedtime).toBe('19:15');
    expect(settings?.maxStarsPerChildPerDay).toBe(5);
    expect(settings?.starsPerCountry).toBe(30);
    expect(await upgraded.routineOccurrences.count()).toBe(1);
    expect(await upgraded.members.count()).toBe(5);
    // populate läuft bei einem Upgrade nicht: keine zusätzlichen Startdaten
    expect(await upgraded.routineDefinitions.count()).toBe(0);
    // Ausnahme seit Version 7: die Länder der Weltreise sind Nachschlagedaten und werden ergänzt
    expect(await upgraded.countries.count()).toBe(12);
  });
});

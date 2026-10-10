import type { FamilyDatabase } from '../database/db';
import { TABLE_NAMES } from '../database/db';
import { CURRENT_SCHEMA_VERSION } from '../database/schema';
import { upgradeRoutine, upgradeSettings } from '../database/migrations';
import type { AppSettings, RoutineDefinition, SafetyCopy, Weekday } from '../types';
import { newId } from '../utils/id';
import { WORLD } from '../data/countries';
import { defaultRecipes } from '../data/meals';
import { isValidDateKey, isValidTime } from '../utils/dates';

/**
 * Datensicherung als JSON. Nicht exportiert werden die Eltern-PIN (bleibt auf dem Gerät),
 * laufende Timer (kurzlebig) sowie Gerätedaten und Sicherheitskopien.
 */
export const BACKUP_APP_ID = 'unsere-kleine-grosse-welt';
export const BACKUP_FORMAT = 1;
const EXCLUDED = new Set(['parentAuth', 'timers', 'deviceMeta', 'safetyCopies']);
export const BACKUP_TABLES = TABLE_NAMES.filter((t) => !EXCLUDED.has(t));

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  format: number;
  schemaVersion: number;
  exportedAt: string;
  tables: Record<string, Record<string, unknown>[]>;
}

export async function exportData(db: FamilyDatabase): Promise<BackupFile> {
  const tables: BackupFile['tables'] = {};
  await db.transaction('r', BACKUP_TABLES.map((t) => db.table(t)), async () => {
    for (const name of BACKUP_TABLES) tables[name] = await db.table(name).toArray();
  });
  return { app: BACKUP_APP_ID, format: BACKUP_FORMAT, schemaVersion: CURRENT_SCHEMA_VERSION, exportedAt: new Date().toISOString(), tables };
}

/** Primärschlüssel je Tabelle, damit auch Tabellen ohne eigene Prüfung keine leeren Datensätze annehmen. */
const PRIMARY_KEY: Record<string, string> = { specialDays: 'date', countryUnlocks: 'countryId' };

export type ValidationResult = { ok: true; data: BackupFile } | { ok: false; errors: string[] };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isImageData = (v: unknown) => typeof v === 'string' && v.startsWith('data:image/');

type RowCheck = (row: Record<string, unknown>) => string | null;

const ROW_CHECKS: Record<string, RowCheck> = {
  members: (r) => (!isStr(r.id) || !isStr(r.name) || (r.role !== 'parent' && r.role !== 'child') ? 'Familienmitglied unvollständig'
    : r.birthDate !== undefined && !isValidDateKey(r.birthDate) ? `Ungültiges Geburtsdatum bei ${String(r.name)}`
      : r.schoolEntryDate !== undefined && !isValidDateKey(r.schoolEntryDate) ? `Ungültiges Einschulungsdatum bei ${String(r.name)}` : null),
  routineDefinitions: (r) => (!isStr(r.id) || !isStr(r.title) || !Array.isArray(r.weekdays) || !Array.isArray(r.assignedTo)
    || !['morning', 'afternoon', 'evening'].includes(String(r.phase)) ? 'Routine unvollständig' : null),
  routineOccurrences: (r) => (!isStr(r.id) || !isStr(r.definitionId) || !isStr(r.childId) || !isValidDateKey(r.date) ? 'Routine-Erledigung ungültig' : null),
  choreDefinitions: (r) => (!isStr(r.id) || !isStr(r.title) || !isStr(r.childId) || !Array.isArray(r.weekdays) ? 'Haushaltsaufgabe unvollständig' : null),
  choreOccurrences: (r) => (!isStr(r.id) || !isValidDateKey(r.date) || !isValidDateKey(r.scheduledDate)
    || !['open', 'done', 'skipped'].includes(String(r.status)) ? 'Haushalts-Erledigung ungültig' : null),
  events: (r) => {
    if (!isStr(r.id) || !isStr(r.title) || !isValidDateKey(r.startDate)) return 'Termin unvollständig';
    for (const f of ['startTime', 'endTime', 'departureTime'] as const) {
      if (r[f] !== undefined && !isValidTime(r[f])) return `Ungültige Uhrzeit bei "${String(r.title)}"`;
    }
    return null;
  },
  eventExceptions: (r) => (!isStr(r.id) || !isStr(r.eventId) || !isValidDateKey(r.originalDate)
    || (r.type !== 'cancelled' && r.type !== 'moved') ? 'Terminausnahme ungültig' : null),
  timerPresets: (r) => (!isStr(r.id) || typeof r.minutes !== 'number' || r.minutes <= 0 ? 'Timer-Vorlage ungültig' : null),
  learningObservations: (r) => (!isStr(r.childId) || !isStr(r.goalId) || !isValidDateKey(r.date)
    || !['independent', 'little-help', 'much-help', 'not-yet', 'not-assessable'].includes(String(r.level)) ? 'Lernbeobachtung ungültig' : null),
  learningReleases: (r) => (!isStr(r.childId) || !isStr(r.goalId) || (r.status !== 'released' && r.status !== 'postponed') ? 'Lernfreigabe ungültig' : null),
  learningPacks: (r) => (!isValidDateKey(r.weekStart) || !isStr(r.letter) || !Array.isArray(r.children) || !Array.isArray(r.prints) ? 'Lernpaket ungültig' : null),
  weekendAdventures: (r) => (!isValidDateKey(r.weekend) || !isStr(r.title) || !Array.isArray(r.packing)
    || !['planned', 'done', 'postponed', 'cancelled'].includes(String(r.status)) ? 'Wochenendabenteuer ungültig' : null),
  familyMemories: (r) => (!isValidDateKey(r.date) || !isStr(r.title) || !Array.isArray(r.memberIds)
    || (r.photo !== undefined && !isImageData(r.photo))
    || (r.photos !== undefined && !(Array.isArray(r.photos) && r.photos.every(isImageData))) ? 'Erinnerung ungültig' : null),
  familyTimeSessions: (r) => (!isStr(r.childId) || !isValidDateKey(r.date) || !isStr(r.activity) ? 'Mama-Zeit ungültig' : null),
  familyCouncilNotes: (r) => (!isValidDateKey(r.date) ? 'Familienrat ungültig' : null),
  recipes: (r) => (!isStr(r.title) || !Array.isArray(r.categories) || !Array.isArray(r.ingredients) ? 'Gericht ungültig' : null),
  mealPlans: (r) => (!isValidDateKey(r.id) || !Array.isArray(r.days) || !Array.isArray(r.wishes) ? 'Essensplan ungültig' : null),
  shoppingItems: (r) => (!isStr(r.name) || typeof r.done !== 'boolean' ? 'Einkaufsliste ungültig' : null),
  rituals: (r) => (!isStr(r.title) || !Array.isArray(r.materials) || (r.status !== 'planned' && r.status !== 'done')
    || (r.date !== undefined && !isValidDateKey(r.date)) ? 'Ritual ungültig' : null),
  missions: (r) => (!isStr(r.title) || typeof r.stars !== 'number' || r.stars < 1 || !Array.isArray(r.assignedTo) ? 'Zusatzmission ungültig' : null),
  missionCompletions: (r) => (!isStr(r.missionId) || !isStr(r.childId) || !isValidDateKey(r.date)
    || !['pending', 'confirmed', 'declined'].includes(String(r.status)) ? 'Missions-Erledigung ungültig' : null),
  starTransactions: (r) => (typeof r.amount !== 'number' || !isStr(r.sourceId) || (r.kind !== 'earned' && r.kind !== 'spent')
    || (r.kind === 'earned' ? r.amount < 0 : r.amount > 0) ? 'Sternbuchung ungültig' : null),
  specialDays: (r) => (!isValidDateKey(r.date) || !Array.isArray(r.childIds) ? 'Sondertag ungültig' : null),
  settings: (r) => (r.id !== 'app' || !isValidTime(r.bedtime) || !isValidTime(r.kindergartenDeparture) ? 'Einstellungen ungültig' : null),
};

export function validateBackup(input: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isObj(input)) return { ok: false, errors: ['Die Datei enthält keine gültige Datensicherung.'] };
  if (input.app !== BACKUP_APP_ID) errors.push('Die Datei stammt nicht aus "Unsere kleine große Welt".');
  if (input.format !== BACKUP_FORMAT) errors.push('Unbekanntes Sicherungsformat.');
  if (typeof input.schemaVersion !== 'number' || input.schemaVersion > CURRENT_SCHEMA_VERSION) {
    errors.push('Die Sicherung stammt aus einer neueren App-Version.');
  }
  if (!isObj(input.tables)) {
    errors.push('Die Sicherung enthält keine Tabellen.');
    return { ok: false, errors };
  }
  const tables = input.tables;
  for (const name of Object.keys(tables)) {
    if (!BACKUP_TABLES.includes(name as never)) errors.push(`Unbekannte Tabelle "${name}".`);
  }
  for (const required of ['members', 'settings'] as const) {
    if (!Array.isArray(tables[required]) || (tables[required] as unknown[]).length === 0) {
      errors.push(`Pflichtdaten fehlen: ${required === 'members' ? 'Familienmitglieder' : 'Einstellungen'}.`);
    }
  }
  for (const name of BACKUP_TABLES) {
    const rows = tables[name];
    if (rows === undefined) continue;
    if (!Array.isArray(rows)) { errors.push(`Tabelle "${name}" ist keine Liste.`); continue; }
    const check = ROW_CHECKS[name];
    const key = PRIMARY_KEY[name] ?? 'id';
    rows.forEach((row, i) => {
      if (!isObj(row)) { errors.push(`${name}[${i}] ist kein Datensatz.`); return; }
      const msg = !isStr(row[key]) ? 'Datensatz ohne Kennung' : check?.(row);
      if (msg) errors.push(`${msg} (${name}, Eintrag ${i + 1})`);
    });
  }
  if (errors.length) return { ok: false, errors: errors.slice(0, 12) };
  return { ok: true, data: input as unknown as BackupFile };
}

/** Bringt Datensätze aus älteren Sicherungen auf den aktuellen Stand (wie das Datenbank-Upgrade). */
export function migrateBackupTables(backup: BackupFile): BackupFile['tables'] {
  const tables: BackupFile['tables'] = {};
  for (const [name, rows] of Object.entries(backup.tables)) tables[name] = rows.map((r) => ({ ...r }));
  const settings = (tables.settings ?? []) as Partial<AppSettings>[];
  settings.forEach((s) => upgradeSettings(s, backup.schemaVersion));
  const kgDays = (settings[0]?.kindergartenDays ?? [1, 2, 3, 4, 5]) as Weekday[];
  ((tables.routineDefinitions ?? []) as Partial<RoutineDefinition>[]).forEach((r) => upgradeRoutine(r, kgDays));
  // Nachschlagedaten, die mit neueren Versionen dazukamen, gehen beim Einspielen älterer Sicherungen nicht verloren
  {
    const have = new Set((tables.countries ?? []).map((c) => c.id));
    tables.countries = [...(tables.countries ?? []), ...(WORLD.map((w) => w.country).filter((c) => !have.has(c.id)) as unknown as Record<string, unknown>[])];
  }
  if (backup.schemaVersion < 8 && !tables.recipes?.length) tables.recipes = defaultRecipes() as unknown as Record<string, unknown>[];
  return tables;
}

const MAX_SAFETY_COPIES = 3;

/** Speichert den aktuellen Stand als Sicherheitskopie auf diesem Gerät (die letzten drei bleiben). */
export async function createSafetyCopy(db: FamilyDatabase, reason: SafetyCopy['reason'] = 'before-import'): Promise<SafetyCopy> {
  const copy: SafetyCopy = { id: newId(), createdAt: new Date().toISOString(), reason, json: JSON.stringify(await exportData(db)) };
  await db.transaction('rw', db.safetyCopies, async () => {
    await db.safetyCopies.add(copy);
    const all = await db.safetyCopies.orderBy('createdAt').toArray();
    const excess = all.slice(0, Math.max(0, all.length - MAX_SAFETY_COPIES));
    if (excess.length) await db.safetyCopies.bulkDelete(excess.map((c) => c.id));
  });
  return copy;
}

/**
 * Ersetzt alle exportierbaren Daten in einer einzigen Transaktion: ganz oder gar nicht.
 * Vorher wird automatisch eine Sicherheitskopie des bisherigen Stands angelegt.
 */
export async function importData(db: FamilyDatabase, backup: BackupFile): Promise<SafetyCopy> {
  const tables = migrateBackupTables(backup);
  const safety = await createSafetyCopy(db);
  await db.transaction('rw', BACKUP_TABLES.map((t) => db.table(t)), async () => {
    for (const name of BACKUP_TABLES) {
      const table = db.table(name);
      await table.clear();
      const rows = tables[name];
      if (rows?.length) await table.bulkAdd(rows);
    }
  });
  return safety;
}

/** Holt eine Sicherheitskopie zurück. Der Stand davor wird dabei ebenfalls gesichert. */
export async function restoreSafetyCopy(db: FamilyDatabase, id: string): Promise<void> {
  const copy = await db.safetyCopies.get(id);
  if (!copy) throw new Error('Diese Sicherheitskopie gibt es nicht mehr.');
  const res = validateBackup(JSON.parse(copy.json));
  if (!res.ok) throw new Error(res.errors.join(' '));
  await importData(db, res.data);
}

/** Merkt sich, wann zuletzt eine Sicherung exportiert wurde. */
export async function markBackedUp(db: FamilyDatabase, at = new Date()): Promise<void> {
  await db.deviceMeta.put({ ...(await db.deviceMeta.get('device')), id: 'device', lastBackupAt: at.toISOString() });
}

export const BACKUP_REMINDER_DAYS = 7;

/** Sanfte Erinnerung, wenn noch nie oder seit mehr als sieben Tagen keine Sicherung exportiert wurde. */
export function backupIsDue(lastBackupAt: string | undefined, now = new Date()): boolean {
  if (!lastBackupAt) return true;
  return now.getTime() - new Date(lastBackupAt).getTime() > BACKUP_REMINDER_DAYS * 24 * 60 * 60_000;
}

export function backupFileName(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `kleine-grosse-welt-sicherung-${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}.json`;
}

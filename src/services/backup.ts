import type { FamilyDatabase } from '../database/db';
import { TABLE_NAMES } from '../database/db';
import { CURRENT_SCHEMA_VERSION } from '../database/schema';
import { isValidDateKey, isValidTime } from '../utils/dates';

/**
 * Datensicherung als JSON. Nicht exportiert werden die Eltern-PIN (bleibt auf dem Gerät)
 * und laufende Timer (kurzlebig).
 */
export const BACKUP_APP_ID = 'unsere-kleine-grosse-welt';
export const BACKUP_FORMAT = 1;
const EXCLUDED = new Set(['parentAuth', 'timers']);
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

export type ValidationResult = { ok: true; data: BackupFile } | { ok: false; errors: string[] };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

type RowCheck = (row: Record<string, unknown>) => string | null;

const ROW_CHECKS: Record<string, RowCheck> = {
  members: (r) => (!isStr(r.id) || !isStr(r.name) || (r.role !== 'parent' && r.role !== 'child') ? 'Familienmitglied unvollständig'
    : r.birthDate !== undefined && !isValidDateKey(r.birthDate) ? `Ungültiges Geburtsdatum bei ${String(r.name)}` : null),
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
    rows.forEach((row, i) => {
      if (!isObj(row)) { errors.push(`${name}[${i}] ist kein Datensatz.`); return; }
      const msg = check?.(row);
      if (msg) errors.push(`${msg} (${name}, Eintrag ${i + 1})`);
    });
  }
  if (errors.length) return { ok: false, errors: errors.slice(0, 12) };
  return { ok: true, data: input as unknown as BackupFile };
}

/** Ersetzt alle exportierbaren Daten in einer einzigen Transaktion: ganz oder gar nicht. */
export async function importData(db: FamilyDatabase, backup: BackupFile): Promise<void> {
  await db.transaction('rw', BACKUP_TABLES.map((t) => db.table(t)), async () => {
    for (const name of BACKUP_TABLES) {
      const table = db.table(name);
      await table.clear();
      const rows = backup.tables[name];
      if (rows?.length) await table.bulkAdd(rows);
    }
  });
}

export function backupFileName(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `kleine-grosse-welt-sicherung-${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}.json`;
}

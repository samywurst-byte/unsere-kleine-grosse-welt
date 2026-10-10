import type { FamilyDatabase } from '../database/db';
import type { DateKey, LearningMood, LearningObservation, ObservationLevel } from '../types';
import type { SheetChild, SheetRow } from './learningPack';

/**
 * Beobachtungsbogen in der App: dieselben Zeilen wie auf Papier, ein Antippen pro Zeile.
 * Jede Zeile wird eine Beobachtung zum passenden Lernziel. Die Ids sind fest (Paket, Datum, Kind, Ziel und Zeile),
 * damit erneutes Speichern korrigiert statt doppelt zu zählen.
 */

export interface SheetEntry {
  levels: Record<string, ObservationLevel | undefined>;
  mood?: LearningMood;
  note?: string;
}

export const sheetObservationId = (packId: string, date: DateKey, childId: string, row: SheetRow) => `sheet|${packId}|${date}|${childId}|${row.goalId}|${row.label}`;

/** Bereits eingetragene Werte für dieses Paket und Datum, je Kind. */
export function loadSheet(observations: LearningObservation[], packId: string, date: DateKey, rows: SheetChild[]): Record<string, SheetEntry> {
  const out: Record<string, SheetEntry> = {};
  for (const child of rows) {
    const entry: SheetEntry = { levels: {} };
    child.goals.forEach((row, i) => {
      const o = observations.find((x) => x.id === sheetObservationId(packId, date, child.childId, row));
      if (!o) return;
      entry.levels[i] = o.level;
      entry.mood ??= o.mood;
      entry.note ??= o.note;
    });
    out[child.childId] = entry;
  }
  return out;
}

/** Speichert den Bogen. Leere Zeilen werden nicht gespeichert (und früher gespeicherte entfernt). Gibt die Zahl der Einträge zurück. */
export async function saveSheet(
  db: FamilyDatabase, packId: string, date: DateKey, rows: SheetChild[], entries: Record<string, SheetEntry>,
): Promise<number> {
  const createdAt = new Date().toISOString();
  let count = 0;
  await db.transaction('rw', db.learningObservations, db.learningReleases, async () => {
    for (const child of rows) {
      const entry = entries[child.childId];
      for (const [i, row] of child.goals.entries()) {
        const id = sheetObservationId(packId, date, child.childId, row);
        const level = entry?.levels[i];
        if (!level) { await db.learningObservations.delete(id); continue; }
        const old = await db.learningObservations.get(id);
        const note = entry.note?.trim();
        await db.learningObservations.put({
          id, childId: child.childId, goalId: row.goalId, date, level, sheetRow: row.label, packId,
          createdAt: old?.createdAt ?? createdAt,
          ...(note ? { note } : {}), ...(entry.mood ? { mood: entry.mood } : {}),
        });
        count++;
        // Wer beobachtet wird, ist automatisch freigegeben (wie beim Eintragen im Pfad)
        if (!row.goalId.startsWith('free.')) {
          const relId = `${child.childId}|${row.goalId}`;
          const rel = await db.learningReleases.get(relId);
          if (rel?.status !== 'released') await db.learningReleases.put({ id: relId, childId: child.childId, goalId: row.goalId, status: 'released', at: createdAt });
        }
      }
    }
  });
  return count;
}

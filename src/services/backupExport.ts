import type { FamilyDatabase } from '../database/db';
import { backupFileName, exportData, markBackedUp } from './backup';
import { saveFile } from './platform';

/** Sicherung als Datei übergeben (Teilen-Menü oder Download) und den Zeitpunkt merken. */
export async function exportBackupFile(db: FamilyDatabase): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const data = await exportData(db);
  const res = await saveFile(backupFileName(), JSON.stringify(data, null, 2));
  if (res !== 'cancelled') await markBackedUp(db);
  return res;
}

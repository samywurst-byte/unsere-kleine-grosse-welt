import type { FamilyDatabase } from '../database/db';
import type { AppSettings, Country, CountryUnlock, DateKey, MissionCompletion, OptionalMission, StarTransaction } from '../types';
import { newId } from '../utils/id';

/**
 * Familiensterne: ein gemeinsames Sternenglas für alle. Sterne gibt es nur für freiwillige Zusatzmissionen,
 * die Mama oder Papa bestätigen. Nie für Routinen, Haushalt, Mama-Zeit oder Wochenende, nie Strafpunkte,
 * kein Vergleich zwischen den Kindern. Sterne sind kein Geld.
 */

export const missionCompletionId = (missionId: string, childId: string, date: DateKey) => `${missionId}|${childId}|${date}|1`;

export function missionsFor(missions: OptionalMission[], childId: string): OptionalMission[] {
  return missions.filter((m) => m.active && m.assignedTo.includes(childId));
}

/** Kind meldet: geschafft. Wartet dann auf Mama oder Papa. Einmal pro Mission, Kind und Tag. */
export async function requestMission(db: FamilyDatabase, missionId: string, childId: string, date: DateKey): Promise<MissionCompletion> {
  const id = missionCompletionId(missionId, childId, date);
  const old = await db.missionCompletions.get(id);
  if (old && old.status !== 'declined') return old;
  const c: MissionCompletion = { id, missionId, childId, date, status: 'pending', requestedAt: new Date().toISOString() };
  await db.missionCompletions.put(c);
  return c;
}

/** Kind nimmt die Meldung zurück, solange noch niemand bestätigt hat. */
export async function withdrawMission(db: FamilyDatabase, completionId: string): Promise<void> {
  const c = await db.missionCompletions.get(completionId);
  if (c?.status === 'pending') await db.missionCompletions.delete(completionId);
}

export const sourceForCompletion = (completionId: string) => `mission|${completionId}`;

/** Sterne, die ein Kind an einem Tag schon ins Familienglas gebracht hat. */
export async function starsEarnedOn(db: FamilyDatabase, childId: string, date: DateKey): Promise<number> {
  const done = await db.missionCompletions.where('date').equals(date).filter((c) => c.childId === childId && c.status === 'confirmed').toArray();
  if (!done.length) return 0;
  const sources = new Set(done.map((c) => sourceForCompletion(c.id)));
  const tx = await db.starTransactions.where('kind').equals('earned').filter((t) => sources.has(t.sourceId)).toArray();
  return tx.reduce((s, t) => s + t.amount, 0);
}

/**
 * Mama oder Papa bestätigen. Die Tagesgrenze pro Kind wird eingehalten; darüber hinaus gibt es ein Danke, aber keine Sterne.
 * Gibt die gebuchten Sterne zurück.
 */
export async function confirmMission(db: FamilyDatabase, completionId: string, settings: Pick<AppSettings, 'maxStarsPerChildPerDay'>): Promise<number> {
  return db.transaction('rw', db.missionCompletions, db.missions, db.starTransactions, async () => {
    const c = await db.missionCompletions.get(completionId);
    if (!c || c.status === 'confirmed') return 0;
    const mission = await db.missions.get(c.missionId);
    const already = await starsEarnedOn(db, c.childId, c.date);
    const amount = Math.max(0, Math.min(mission?.stars ?? 0, settings.maxStarsPerChildPerDay - already));
    await db.missionCompletions.put({ ...c, status: 'confirmed', confirmedAt: new Date().toISOString() });
    if (amount > 0) {
      await db.starTransactions.add({
        id: newId('star'), amount, kind: 'earned', sourceId: sourceForCompletion(c.id), childId: c.childId, createdAt: new Date().toISOString(),
      });
    }
    return amount;
  });
}

/** Nicht bestätigt: freundlich, ohne Abzug. */
export async function declineMission(db: FamilyDatabase, completionId: string): Promise<void> {
  await db.missionCompletions.where('id').equals(completionId).modify((c) => { c.status = 'declined'; });
}

/** Versehentliche Bestätigung zurücknehmen; geht nur, solange die Sterne noch nicht für ein Land verwendet wurden. */
export async function undoConfirmation(db: FamilyDatabase, completionId: string): Promise<boolean> {
  return db.transaction('rw', db.missionCompletions, db.starTransactions, async () => {
    const tx = await db.starTransactions.where('sourceId').equals(sourceForCompletion(completionId)).first();
    const balance = starBalance(await db.starTransactions.toArray());
    if (tx && balance < tx.amount) return false;
    if (tx) await db.starTransactions.delete(tx.id);
    await db.missionCompletions.where('id').equals(completionId).modify((c) => { c.status = 'pending'; delete c.confirmedAt; });
    return true;
  });
}

export function starBalance(transactions: StarTransaction[]): number {
  return transactions.reduce((s, t) => s + t.amount, 0);
}

export function starsEarnedTotal(transactions: StarTransaction[]): number {
  return transactions.filter((t) => t.kind === 'earned').reduce((s, t) => s + t.amount, 0);
}

// ------------------------------------------------------------- Weltreise

/** Das nächste noch nicht freigeschaltete Land in der Reihenfolge. */
export function nextCountry(countries: Country[], unlocks: CountryUnlock[]): Country | undefined {
  const done = new Set(unlocks.map((u) => u.countryId));
  return [...countries].sort((a, b) => a.order - b.order).find((c) => !done.has(c.id));
}

/** Land mit Familiensternen freischalten; jedes Kind bekommt einen Stempel in den Pass. */
export async function unlockCountry(db: FamilyDatabase, countryId: string, cost: number, childIds: string[]): Promise<boolean> {
  return db.transaction('rw', [db.starTransactions, db.countryUnlocks, db.passportStamps], async () => {
    if (await db.countryUnlocks.get(countryId)) return false;
    const balance = starBalance(await db.starTransactions.toArray());
    if (balance < cost) return false;
    const at = new Date().toISOString();
    const tx: StarTransaction = { id: newId('star'), amount: -cost, kind: 'spent', sourceId: `unlock|${countryId}`, createdAt: at };
    await db.starTransactions.add(tx);
    await db.countryUnlocks.put({ countryId, unlockedAt: at, starTransactionId: tx.id });
    await db.passportStamps.bulkPut(childIds.map((childId) => ({ id: `${countryId}|${childId}`, countryId, childId, stampedAt: at })));
    return true;
  });
}

export async function saveMission(db: FamilyDatabase, mission: Omit<OptionalMission, 'id'> & { id?: string }): Promise<void> {
  await db.missions.put({ ...mission, id: mission.id ?? newId('mission'), title: mission.title.trim() });
}

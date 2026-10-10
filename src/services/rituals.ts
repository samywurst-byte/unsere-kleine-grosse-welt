import type { FamilyDatabase } from '../database/db';
import { RITUALS, type RitualIdea } from '../data/rituals';
import type { DateKey, FamilyRitual, RitualFavorite } from '../types';
import { addDaysKey, daysBetween, fromDateKey } from '../utils/dates';
import { newId } from '../utils/id';

/** Jahreszeitenrituale: Ideen zur Jahreszeit, eure Favoriten kommen jedes Jahr wieder. */

const monthOf = (date: DateKey) => fromDateKey(date).getMonth() + 1;

/** Passt jetzt oder im nächsten Monat. Favoriten zuerst. */
export function seasonalRituals(today: DateKey, favorites: RitualFavorite[]): RitualIdea[] {
  const now = monthOf(today);
  const next = monthOf(addDaysKey(today, 30));
  const fav = new Set(favorites.map((f) => f.id));
  return RITUALS
    .filter((r) => !r.months.length || r.months.includes(now) || r.months.includes(next))
    .sort((a, b) => Number(fav.has(b.id)) - Number(fav.has(a.id)));
}

export async function planRitual(db: FamilyDatabase, idea: Pick<RitualIdea, 'id' | 'title' | 'emoji' | 'materials'>, date?: DateKey, note?: string): Promise<FamilyRitual> {
  const r: FamilyRitual = {
    id: newId('ritual'), ritualId: idea.id, title: idea.title, emoji: idea.emoji, status: 'planned',
    materials: idea.materials.map((label) => ({ id: newId('mat'), label, done: false })), createdAt: new Date().toISOString(),
    ...(date ? { date } : {}), ...(note?.trim() ? { note: note.trim() } : {}),
  };
  await db.rituals.add(r);
  return r;
}

export async function saveRitual(db: FamilyDatabase, ritual: FamilyRitual): Promise<void> {
  await db.rituals.put(ritual);
}

export async function deleteRitual(db: FamilyDatabase, id: string): Promise<void> {
  await db.rituals.delete(id);
}

/** Favorit: kommt jedes Jahr wieder nach oben, mit eurer Notiz (z. B. dem Rezept). */
export async function setFavorite(db: FamilyDatabase, ritualId: string, on: boolean, note?: string): Promise<void> {
  if (!on) { await db.ritualFavorites.delete(ritualId); return; }
  await db.ritualFavorites.put({ id: ritualId, ...(note?.trim() ? { note: note.trim() } : {}) });
}

/** Geplante Rituale, bei denen jetzt die Vorbereitung ansteht (innerhalb der Vorlaufzeit, Material noch offen). */
export function preparationDue(rituals: FamilyRitual[], today: DateKey, leadDays: (ritualId: string) => number): FamilyRitual[] {
  return rituals.filter((r) => {
    if (r.status !== 'planned' || !r.date || r.date < today) return false;
    const days = daysBetween(today, r.date);
    return days <= Math.max(1, leadDays(r.ritualId)) && r.materials.some((m) => !m.done);
  });
}

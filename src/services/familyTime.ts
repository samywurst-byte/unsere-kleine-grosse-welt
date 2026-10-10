import type { FamilyDatabase } from '../database/db';
import { ADVENTURE_IDEAS, DEFAULT_COUNCIL_AGENDA, type AdventureIdea } from '../data/familyTime';
import type {
  AdventureStatus, AppSettings, CalendarEvent, CouncilDecision, DateKey, FamilyCouncilNote, FamilyMemory, FamilyTimeSession,
  TimeOfDay, WeekendAdventure,
} from '../types';
import { addDaysKey, fromDateKey, minutesOfDay, nowMinutes, toDateKey, weekStartKey, weekdayOf } from '../utils/dates';
import { newId } from '../utils/id';

/**
 * Familienzeit: Mama-Zeit, Wochenendabenteuer, Familienrat und Erinnerungen.
 * Nichts davon bringt Sterne. Es gehört zum Familienleben und muss nicht verdient werden.
 */

// ------------------------------------------------------------- Mama-Zeit

export const mamaTimeId = (childId: string, date: DateKey) => `mama|${childId}|${date}`;

/** Hält fest, dass die Mama-Zeit stattfand. Pro Kind und Tag ein Eintrag; erneutes Wählen ändert die Aktivität. */
export async function recordMamaTime(db: FamilyDatabase, childId: string, date: DateKey, activity: string, minutes?: number): Promise<FamilyTimeSession> {
  const id = mamaTimeId(childId, date);
  const old = await db.familyTimeSessions.get(id);
  const session: FamilyTimeSession = {
    id, childId, date, activity, startedAt: old?.startedAt ?? new Date().toISOString(),
    ...(minutes ?? old?.minutes ? { minutes: minutes ?? old?.minutes } : {}),
  };
  await db.familyTimeSessions.put(session);
  return session;
}

export async function removeMamaTime(db: FamilyDatabase, childId: string, date: DateKey): Promise<void> {
  await db.familyTimeSessions.delete(mamaTimeId(childId, date));
}

// ------------------------------------------------------------- Wochenendabenteuer

/** Ab Freitag 12:30 Uhr wird geplant; am Sonntag ab 16 Uhr kommt eine freundliche Erinnerung. */
export const ADVENTURE_WINDOW_START: TimeOfDay = '12:30';
export const ADVENTURE_REMINDER: TimeOfDay = '16:00';

/** Freitag des Wochenendes, zu dem dieser Tag gehört (Montag bis Donnerstag: das kommende). */
export function weekendOf(date: DateKey): DateKey {
  return addDaysKey(weekStartKey(date), 4);
}

export const weekendDays = (weekend: DateKey): DateKey[] => [weekend, addDaysKey(weekend, 1), addDaysKey(weekend, 2)];

export type AdventureView =
  /** Montag bis Freitagmittag: noch nichts zu tun. */
  | 'later'
  /** Wochenende, noch nicht geplant. */
  | 'plan'
  /** Sonntag ab 16 Uhr, noch nicht geplant. */
  | 'reminder'
  | 'planned'
  /** Geplante Zeit ist vorbei, aber noch nicht als gemacht markiert. */
  | 'confirm'
  | 'done' | 'postponed' | 'cancelled';

export function adventureView(now: Date, adventure: WeekendAdventure | undefined): AdventureView {
  const today = toDateKey(now);
  const wd = weekdayOf(today);
  const minutes = nowMinutes(now);
  if (adventure && adventure.status !== 'planned') return adventure.status;
  if (adventure) {
    const at = adventure.day ? `${adventure.day} ${adventure.time ?? '23:59'}` : null;
    const nowKey = `${today} ${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    return at && at <= nowKey ? 'confirm' : 'planned';
  }
  const inWindow = (wd === 5 && minutes >= minutesOfDay(ADVENTURE_WINDOW_START)) || wd === 6 || wd === 0;
  if (!inWindow) return 'later';
  return wd === 0 && minutes >= minutesOfDay(ADVENTURE_REMINDER) ? 'reminder' : 'plan';
}

export const ADVENTURE_STATUS_LABEL: Record<AdventureStatus | 'open', string> = {
  open: 'Noch nicht geplant',
  planned: 'Geplant',
  done: 'Gemacht',
  postponed: 'Verschoben',
  cancelled: 'Ausnahmsweise ausgefallen',
};

/** Vorbereitung offen: Es gibt noch nicht abgehakte Dinge auf der Packliste. */
export function prepOpen(adventure: WeekendAdventure): boolean {
  return adventure.status === 'planned' && adventure.packing.some((p) => !p.done);
}

/** Passende Ideen zur Jahreszeit. Eine verschobene Idee vom letzten Mal kommt zuerst, kürzlich Gemachtes nach hinten. */
export function suggestIdeas(date: DateKey, history: WeekendAdventure[], count = 6): AdventureIdea[] {
  const month = fromDateKey(date).getMonth() + 1;
  const fitting = ADVENTURE_IDEAS.filter((i) => !i.months.length || i.months.includes(month));
  const sorted = [...history].sort((a, b) => b.weekend.localeCompare(a.weekend)).filter((a) => a.weekend < weekendOf(date));
  const postponed = sorted[0]?.status === 'postponed' ? sorted[0].ideaId : undefined;
  const recent = new Set(sorted.filter((a) => a.status === 'done').slice(0, 3).map((a) => a.ideaId));
  const rank = (i: AdventureIdea) => (i.id === postponed ? -1 : recent.has(i.id) ? 1 : 0);
  return [...fitting].sort((a, b) => rank(a) - rank(b)).slice(0, count);
}

export function draftAdventure(weekend: DateKey, idea: { id?: string; title: string; emoji: string; packing: string[]; prep?: string }): WeekendAdventure {
  return {
    id: weekend, weekend, status: 'planned', ideaId: idea.id, title: idea.title, emoji: idea.emoji,
    packing: idea.packing.map((label) => ({ id: newId('pack'), label, done: false })),
    ...(idea.prep ? { prep: idea.prep } : {}), updatedAt: new Date().toISOString(),
  };
}

export async function saveAdventure(db: FamilyDatabase, adventure: WeekendAdventure): Promise<void> {
  await db.weekendAdventures.put({ ...adventure, updatedAt: new Date().toISOString() });
}

/** Status ändern. Geplant gilt nie automatisch als gemacht, das entscheidet ihr. */
export async function setAdventureStatus(db: FamilyDatabase, id: string, status: AdventureStatus, reason?: string): Promise<void> {
  await db.weekendAdventures.where('id').equals(id).modify((a) => {
    a.status = status;
    if (reason?.trim()) a.reason = reason.trim(); else delete a.reason;
    a.updatedAt = new Date().toISOString();
  });
}

/** Neu planen: das Abenteuer wird gelöscht, das Wochenende ist wieder "noch nicht geplant". */
export async function resetAdventure(db: FamilyDatabase, id: string): Promise<void> {
  await db.weekendAdventures.delete(id);
}

// ------------------------------------------------------------- Familienrat

/** Sonntag der Woche, zu der dieser Tag gehört. */
export function councilDate(date: DateKey): DateKey {
  return addDaysKey(weekStartKey(date), 6);
}

export function councilAgenda(settings: Pick<AppSettings, 'councilAgenda'> | undefined): string[] {
  return settings?.councilAgenda?.length ? settings.councilAgenda : DEFAULT_COUNCIL_AGENDA;
}

export async function saveCouncilAgenda(db: FamilyDatabase, agenda: string[]): Promise<void> {
  const clean = agenda.map((a) => a.trim()).filter(Boolean);
  await db.settings.update('app', { councilAgenda: clean.length ? clean : undefined });
}

export async function updateCouncil(db: FamilyDatabase, date: DateKey, change: (note: FamilyCouncilNote) => FamilyCouncilNote): Promise<void> {
  await db.transaction('rw', db.familyCouncilNotes, async () => {
    const note = (await db.familyCouncilNotes.get(date)) ?? { id: date, date };
    await db.familyCouncilNotes.put(change(note));
  });
}

export function addDecision(note: FamilyCouncilNote, text: string): FamilyCouncilNote {
  const t = text.trim();
  if (!t) return note;
  return { ...note, decisions: [...(note.decisions ?? []), { id: newId('dec'), text: t }] };
}

/** Beschluss als Familientermin in den Kalender eintragen. */
export async function decisionToEvent(
  db: FamilyDatabase, council: DateKey, decision: CouncilDecision, when: { date: DateKey; time?: TimeOfDay; title?: string },
): Promise<CalendarEvent> {
  const now = new Date().toISOString();
  const event: CalendarEvent = {
    id: newId('event'), title: when.title?.trim() || decision.text, category: 'family', startDate: when.date,
    ...(when.time ? { startTime: when.time } : {}), memberIds: [], packingList: [], notes: 'Beschlossen im Familienrat', createdAt: now, updatedAt: now,
  };
  await db.transaction('rw', db.events, db.familyCouncilNotes, async () => {
    await db.events.add(event);
    const note = await db.familyCouncilNotes.get(council);
    if (note) {
      await db.familyCouncilNotes.put({ ...note, decisions: (note.decisions ?? []).map((d) => (d.id === decision.id ? { ...d, eventId: event.id } : d)) });
    }
  });
  return event;
}

// ------------------------------------------------------------- Erinnerungen

export async function addMemory(db: FamilyDatabase, memory: Omit<FamilyMemory, 'id' | 'createdAt'>): Promise<FamilyMemory> {
  const m: FamilyMemory = { ...memory, title: memory.title.trim(), id: newId('memory'), createdAt: new Date().toISOString() };
  if (m.text !== undefined && !m.text.trim()) delete m.text;
  await db.familyMemories.add(m);
  return m;
}

export async function deleteMemory(db: FamilyDatabase, id: string): Promise<void> {
  await db.familyMemories.delete(id);
}

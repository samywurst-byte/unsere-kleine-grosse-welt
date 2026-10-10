import type { FamilyDatabase } from '../database/db';
import { EXPLORER_MODULES } from '../data/explorerModules';
import type { CalendarEvent, ChildProfile, DateKey, ExplorerEntry, ExplorerModule, ExplorerSunday, FamilyMemory, Id, JarQuestion } from '../types';
import { newId } from '../utils/id';

/** Entdeckersonntage: ein Themenmonat, zwei Sonntage. Nichts wird abgefragt, nichts bewertet. */

export type SundayKind = 'home' | 'trip';
export type ExplorerRole = 'youngest' | 'middle' | 'oldest';

export const sundayId = (moduleId: string, kind: SundayKind) => `${moduleId}|${kind}`;

export function sundayDate(m: ExplorerModule, kind: SundayKind, sundays: ExplorerSunday[]): DateKey {
  return sundays.find((s) => s.id === sundayId(m.id, kind))?.date ?? (kind === 'home' ? m.homeDate : m.tripDate);
}

export function sundayStatus(m: ExplorerModule, kind: SundayKind, sundays: ExplorerSunday[]): ExplorerSunday['status'] {
  return sundays.find((s) => s.id === sundayId(m.id, kind))?.status ?? 'open';
}

/** Das Thema des laufenden Monats; zwischen April und September das nächste im Herbst. */
export function currentModule(today: DateKey, modules: ExplorerModule[] = EXPLORER_MODULES): ExplorerModule | undefined {
  const month = today.slice(0, 7);
  return modules.find((m) => m.id === month) ?? modules.find((m) => m.id > month);
}

/** Der nächste offene Sonntag ab heute. */
export function nextSunday(today: DateKey, sundays: ExplorerSunday[], modules: ExplorerModule[] = EXPLORER_MODULES): { module: ExplorerModule; kind: SundayKind; date: DateKey } | undefined {
  const all = modules.flatMap((m) => (['home', 'trip'] as SundayKind[]).map((kind) => ({ module: m, kind, date: sundayDate(m, kind, sundays) })));
  return all.filter((x) => x.date >= today && sundayStatus(x.module, x.kind, sundays) === 'open').sort((a, b) => a.date.localeCompare(b.date))[0];
}

export function yearsOf(modules: ExplorerModule[] = EXPLORER_MODULES): { year: string; title: string; modules: ExplorerModule[] }[] {
  const out: { year: string; title: string; modules: ExplorerModule[] }[] = [];
  for (const m of modules) {
    let y = out.find((x) => x.year === m.year);
    if (!y) { y = { year: m.year, title: m.yearTitle, modules: [] }; out.push(y); }
    y.modules.push(m);
  }
  return out;
}

/** Ordnet die Kinder nach Alter dem jüngsten, mittleren und ältesten Kind aus dem Handbuch zu. */
export function childRoles(children: Pick<ChildProfile, 'id' | 'birthDate' | 'sortOrder'>[]): Map<Id, ExplorerRole> {
  const sorted = [...children].sort((a, b) => (b.birthDate ?? '').localeCompare(a.birthDate ?? '') || b.sortOrder - a.sortOrder);
  const map = new Map<Id, ExplorerRole>();
  sorted.forEach((c, i) => {
    const role: ExplorerRole = i === sorted.length - 1 ? 'oldest' : i === 0 ? 'youngest' : 'middle';
    map.set(c.id, role);
  });
  return map;
}

async function upsertSunday(db: FamilyDatabase, moduleId: string, kind: SundayKind, patch: Partial<ExplorerSunday>): Promise<void> {
  const id = sundayId(moduleId, kind);
  const cur = await db.explorerSundays.get(id);
  await db.explorerSundays.put({ ...(cur ?? { id, moduleId, kind, status: 'open' }), ...patch });
}

export async function setSundayStatus(db: FamilyDatabase, moduleId: string, kind: SundayKind, status: ExplorerSunday['status'], today: DateKey): Promise<void> {
  await db.transaction('rw', db.explorerSundays, async () => {
    await upsertSunday(db, moduleId, kind, status === 'done' ? { status, doneAt: today } : { status, doneAt: undefined });
  });
}

function eventTitle(m: ExplorerModule, kind: SundayKind): string {
  return kind === 'home' ? `Entdeckersonntag: ${m.title}` : `Entdeckerausflug: ${m.trip.place}`;
}

/** Termin verschieben; ein vorhandener Kalendertermin zieht mit. */
export async function setSundayDate(db: FamilyDatabase, m: ExplorerModule, kind: SundayKind, date: DateKey): Promise<void> {
  await db.transaction('rw', db.explorerSundays, db.events, async () => {
    const cur = await db.explorerSundays.get(sundayId(m.id, kind));
    await upsertSunday(db, m.id, kind, { date });
    const ev = cur?.eventId ? await db.events.get(cur.eventId) : undefined;
    if (ev) await db.events.put({ ...ev, startDate: date, updatedAt: new Date().toISOString() });
  });
}

/** Sonntag als Familientermin in den Kalender. Ein zweites Mal aktualisiert den vorhandenen Termin. */
export async function sundayToCalendar(db: FamilyDatabase, m: ExplorerModule, kind: SundayKind, memberIds: Id[]): Promise<void> {
  await db.transaction('rw', db.explorerSundays, db.events, async () => {
    const cur = await db.explorerSundays.get(sundayId(m.id, kind));
    const date = cur?.date ?? (kind === 'home' ? m.homeDate : m.tripDate);
    const now = new Date().toISOString();
    const existing = cur?.eventId ? await db.events.get(cur.eventId) : undefined;
    if (existing) {
      await db.events.put({ ...existing, startDate: date, title: eventTitle(m, kind), updatedAt: now });
      return;
    }
    const event: CalendarEvent = {
      id: newId('event'), title: eventTitle(m, kind), category: 'family', startDate: date, memberIds, packingList: kind === 'trip' ? ['Tickets', 'Snacks', 'Wasser'] : [],
      notes: kind === 'home' ? `Vorbereitung: ${m.prep.join(', ')}` : `${m.trip.description} Vorher Öffnungszeiten und Programm prüfen.`,
      createdAt: now, updatedAt: now,
    };
    await db.events.add(event);
    await upsertSunday(db, m.id, kind, { eventId: event.id });
  });
}

/** Vorbereitung auf die Einkaufsliste; was dort schon offen steht, kommt nicht doppelt. */
export async function prepToShopping(db: FamilyDatabase, m: ExplorerModule, items: string[] = m.prep): Promise<number> {
  return db.transaction('rw', db.shoppingItems, async () => {
    const open = new Set((await db.shoppingItems.toArray()).filter((i) => !i.done).map((i) => i.name.trim().toLowerCase()));
    const now = new Date().toISOString();
    const add = items.filter((p) => !open.has(p.trim().toLowerCase())).map((name, i) => ({
      id: newId('shop'), name, section: 'sonstiges' as const, done: false, source: `Entdecker: ${m.title}`, createdAt: new Date(Date.parse(now) + i).toISOString(),
    }));
    if (add.length) await db.shoppingItems.bulkAdd(add);
    return add.length;
  });
}

export type EntryDraft = Omit<ExplorerEntry, 'id' | 'createdAt' | 'memoryId'>;

/** Speichert eine Entdeckerbuch-Seite, legt eine Erinnerung an und steckt eine neue Frage ins Frageglas. */
export async function saveEntry(db: FamilyDatabase, m: ExplorerModule, draft: EntryDraft, childIds: Id[], existingId?: Id): Promise<Id> {
  return db.transaction('rw', db.explorerEntries, db.familyMemories, db.jarQuestions, async () => {
    const now = new Date().toISOString();
    const prev = existingId ? await db.explorerEntries.get(existingId) : undefined;
    const id = prev?.id ?? newId('entry');
    const sentences = draft.sentences.filter((s) => s.text.trim()).map((s) => ({ ...s, text: s.text.trim() }));
    const text = [
      ...sentences.map((s) => `„${s.text}“`),
      draft.favorite?.trim() && `Lieblingsmoment: ${draft.favorite.trim()}`,
      draft.remember?.trim() && `Das möchten wir uns merken: ${draft.remember.trim()}`,
    ].filter(Boolean).join('\n');
    const memoryId = prev?.memoryId ?? newId('memory');
    const memory: FamilyMemory = {
      id: memoryId, date: draft.date, title: `${draft.kind === 'home' ? '🔭' : '🏛️'} ${draft.kind === 'home' ? m.title : m.trip.place}`,
      ...(text ? { text } : {}), ...(draft.photos.length ? { photos: draft.photos } : {}), memberIds: childIds,
      source: { kind: 'explorer', id }, createdAt: prev ? (await db.familyMemories.get(memoryId))?.createdAt ?? now : now,
    };
    await db.familyMemories.put(memory);
    const entry: ExplorerEntry = { ...draft, sentences, id, memoryId, createdAt: prev?.createdAt ?? now };
    await db.explorerEntries.put(entry);
    const q = draft.question?.trim();
    if (q && q !== prev?.question?.trim()) {
      await db.jarQuestions.add({ id: newId('frage'), question: q, moduleId: m.id, createdAt: now });
    }
    return id;
  });
}

export async function deleteEntry(db: FamilyDatabase, entry: ExplorerEntry): Promise<void> {
  await db.transaction('rw', db.explorerEntries, db.familyMemories, async () => {
    await db.explorerEntries.delete(entry.id);
    if (entry.memoryId) await db.familyMemories.delete(entry.memoryId);
  });
}

// ------------------------------------------------------------- Frageglas

export async function addQuestion(db: FamilyDatabase, q: Pick<JarQuestion, 'question' | 'childId' | 'guess' | 'moduleId'>): Promise<void> {
  const question = q.question.trim();
  if (!question) return;
  await db.jarQuestions.add({
    id: newId('frage'), question, createdAt: new Date().toISOString(),
    ...(q.childId ? { childId: q.childId } : {}), ...(q.guess?.trim() ? { guess: q.guess.trim() } : {}), ...(q.moduleId ? { moduleId: q.moduleId } : {}),
  });
}

export async function answerQuestion(db: FamilyDatabase, id: Id, answer: string, source: string, today: DateKey): Promise<void> {
  const a = answer.trim();
  await db.jarQuestions.update(id, a ? { answer: a, source: source.trim() || undefined, answeredAt: today } : { answer: undefined, source: undefined, answeredAt: undefined });
}

/** Ein zufälliger offener Zettel aus dem Glas, z. B. für einen ruhigen Nachmittag. */
export function drawQuestion(questions: JarQuestion[], rnd = Math.random): JarQuestion | undefined {
  const open = questions.filter((q) => !q.answer);
  return open.length ? open[Math.floor(rnd() * open.length)] : undefined;
}

/** Stand eines Entdeckerjahres: wie viele der zwölf Sonntage erlebt sind. */
export function yearProgress(modules: ExplorerModule[], sundays: ExplorerSunday[]): { done: number; total: number } {
  const total = modules.length * 2;
  const done = modules.reduce((s, m) => s + (['home', 'trip'] as SundayKind[]).filter((k) => sundayStatus(m, k, sundays) === 'done').length, 0);
  return { done, total };
}

import type { FamilyDatabase } from '../database/db';
import { guessSection } from '../data/meals';
import { OWN_PROJECT_STEPS, PHASES, PROJECT_IDEAS, type ProjectIdea } from '../data/projects';
import { LETTERS } from '../data/readingCurriculum';
import type {
  CalendarEvent, ChildProfile, DateKey, FamilyProject, ProjectLevel, ProjectPhase, ProjectStep, ProjectTask, TimeOfDay,
} from '../types';
import { addDaysKey, ageInYears, fromDateKey } from '../utils/dates';
import { newId } from '../utils/id';
import { addMemory, MAX_MEMORY_PHOTOS } from './familyTime';
import { atLeastMostly, pathPhase, type GoalState } from './learning';

/**
 * Projektwerkstatt: ein Familienprojekt, fünf Schritte (Entdecken, Planen, Machen, Dokumentieren, Abschließen),
 * Teilaufgaben je Kind auf seinem Niveau. Keine Sterne, keine Bewertung.
 */

const LEVEL_ORDER: ProjectLevel[] = ['toddler', 'preschool', 'reader', 'school'];

/** Niveau eines Kindes: Schulkind, Lesekind (Lesepfad läuft), ab 3 Jahren Vorschule, sonst Bilder und Mitmachen. */
export function projectLevel(child: ChildProfile, today: DateKey, readingStates: GoalState[] = []): ProjectLevel {
  const phase = pathPhase(child, today).kind;
  if (phase === 'in-school') return 'school';
  if (phase === 'active' || readingStates.some((s) => s.released && s.goal.kind === 'letter')) return 'reader';
  const age = child.birthDate ? ageInYears(child.birthDate, today) : child.ageStage === 'small' ? 2 : 4;
  return age >= 3 ? 'preschool' : 'toddler';
}

/** Buchstaben, die weitgehend sicher sitzen (aus den Beobachtungen der Eltern). */
export function knownLetters(readingStates: GoalState[]): string[] {
  return readingStates.filter((s) => s.goal.kind === 'letter' && atLeastMostly(s.status)).map((s) => s.goal.letter!.upper);
}

/** Lautverbindungen, die als Ganzes gelernt werden; ST und SP können am Wortende auch einzeln gelesen werden. */
const COMBOS = LETTERS.filter((l) => l.combo && l.upper !== 'ST' && l.upper !== 'SP').map((l) => l.upper).sort((a, b) => b.length - a.length);

/** Kann ein Kind dieses Wort mit seinen sicheren Buchstaben lesen? */
export function canRead(word: string, known: string[]): boolean {
  const set = new Set(known);
  const w = word.toUpperCase();
  for (let i = 0; i < w.length;) {
    const combo = COMBOS.find((c) => w.startsWith(c, i));
    if (combo) {
      if (!set.has(combo)) return false;
      i += combo.length;
    } else {
      if (!set.has(w[i])) return false;
      i += 1;
    }
  }
  return w.length > 0;
}

const READ_PLACEHOLDER = 'Wörter lesen';

/** Leseaufgabe aus den Projektwörtern: was schon lesbar ist, sonst zum Nachspuren. */
export function readingTask(words: string[], known: string[]): string | null {
  if (!words.length) return null;
  const readable = words.filter((w) => canRead(w, known));
  if (readable.length) return `Lesen: ${readable.slice(0, 4).join(', ')}`;
  return `Nachspuren: ${words.slice(0, 3).join(', ')}`;
}

/** Teilaufgaben für ein Kind aus der Idee. */
export function tasksFor(idea: Pick<ProjectIdea, 'tasks' | 'words'>, level: ProjectLevel, known: string[]): string[] {
  const list = idea.tasks[level] ?? [];
  const reading = readingTask(idea.words ?? [], known);
  return list
    .map((t) => (t === READ_PLACEHOLDER ? reading : t))
    .filter((t): t is string => !!t);
}

export function levelAtLeast(level: ProjectLevel, min: ProjectLevel): boolean {
  return LEVEL_ORDER.indexOf(level) >= LEVEL_ORDER.indexOf(min);
}

const monthOf = (date: DateKey) => fromDateKey(date).getMonth() + 1;

/** Ideen, die jetzt oder im nächsten Monat passen, zuerst; Ideen ohne Jahreszeit danach. */
export function ideasForNow(today: DateKey): ProjectIdea[] {
  const now = monthOf(today);
  const next = monthOf(addDaysKey(today, 30));
  const seasonal = (i: ProjectIdea) => (i.months.includes(now) || i.months.includes(next) ? 0 : !i.months.length ? 1 : 2);
  return [...PROJECT_IDEAS].sort((a, b) => seasonal(a) - seasonal(b));
}

export const isInSeason = (idea: ProjectIdea, today: DateKey) =>
  !idea.months.length || idea.months.includes(monthOf(today)) || idea.months.includes(monthOf(addDaysKey(today, 30)));

export interface ProjectChildSetup { child: ChildProfile; level: ProjectLevel; known: string[] }

export interface NewProject {
  idea?: ProjectIdea;
  title: string;
  emoji: string;
  description?: string;
  children: ProjectChildSetup[];
  startDate: DateKey;
  targetDate?: DateKey;
  /** Eigenes Projekt noch einmal machen: Schritte und Material von damals. */
  copyFrom?: FamilyProject;
}

export async function startProject(db: FamilyDatabase, p: NewProject): Promise<FamilyProject> {
  const now = new Date().toISOString();
  const stepsSource = p.idea?.steps ?? OWN_PROJECT_STEPS;
  const steps: ProjectStep[] = p.copyFrom && !p.idea
    ? p.copyFrom.steps.map((s) => ({ id: newId('step'), phase: s.phase, label: s.label, done: false }))
    : PHASES.flatMap(({ id }) => stepsSource[id].map((label) => ({ id: newId('step'), phase: id, label, done: false })));
  const materialLabels = p.copyFrom && !p.idea ? p.copyFrom.materials.map((m) => m.label) : p.idea?.materials ?? [];
  const tasks: ProjectTask[] = p.idea
    ? p.children.flatMap(({ child, level, known }) => tasksFor(p.idea!, level, known).map((label) => ({ id: newId('task'), childId: child.id, label, done: false })))
    : [];
  const project: FamilyProject = {
    id: newId('project'), ideaId: p.idea?.id ?? 'own', title: p.title.trim() || p.idea?.title || 'Unser Projekt', emoji: p.emoji,
    status: 'active', childIds: p.children.map((c) => c.child.id),
    levels: Object.fromEntries(p.children.map((c) => [c.child.id, c.level])),
    areas: p.idea?.areas ?? [], steps, tasks,
    materials: materialLabels.map((label) => ({ id: newId('mat'), label, done: false })),
    money: [], entries: [],
    ...(p.idea?.trip ? { trip: { title: p.idea.trip } } : {}),
    ...(p.idea?.presentation ? { presentation: { title: p.idea.presentation } } : {}),
    startDate: p.startDate,
    ...(p.targetDate ? { targetDate: p.targetDate } : {}),
    ...(p.description?.trim() ? { description: p.description.trim() } : p.idea ? { description: p.idea.summary } : {}),
    createdAt: now, updatedAt: now,
  };
  await db.projects.add(project);
  return project;
}

/** Ändert ein Projekt in einem Schritt (liest den aktuellen Stand frisch aus der Datenbank). */
export async function updateProject(db: FamilyDatabase, id: string, fn: (p: FamilyProject) => FamilyProject): Promise<void> {
  await db.transaction('rw', db.projects, async () => {
    const p = await db.projects.get(id);
    if (p) await db.projects.put({ ...fn(p), updatedAt: new Date().toISOString() });
  });
}

/** Der Schritt, an dem das Projekt gerade steht: die erste Phase mit offenen Punkten. */
export function currentPhase(p: Pick<FamilyProject, 'steps'>): ProjectPhase {
  return PHASES.find((ph) => p.steps.some((s) => s.phase === ph.id && !s.done))?.id ?? 'finish';
}

export function nextStep(p: Pick<FamilyProject, 'steps'>): ProjectStep | undefined {
  for (const ph of PHASES) {
    const open = p.steps.find((s) => s.phase === ph.id && !s.done);
    if (open) return open;
  }
  return undefined;
}

export function projectProgress(p: Pick<FamilyProject, 'steps' | 'tasks'>): { done: number; total: number } {
  const all = [...p.steps, ...p.tasks];
  return { done: all.filter((x) => x.done).length, total: all.length };
}

/**
 * Teilaufgaben an den aktuellen Lernstand anpassen: offene Aufgaben aus der Idee werden neu erzeugt,
 * erledigte und selbst ergänzte bleiben.
 */
export function refreshTasks(p: FamilyProject, idea: ProjectIdea, setups: ProjectChildSetup[]): FamilyProject {
  let tasks = [...p.tasks];
  const levels = { ...p.levels };
  for (const { child, level, known } of setups) {
    const fromIdea = new Set(LEVEL_ORDER.flatMap((l) => idea.tasks[l] ?? []));
    const generated = (t: ProjectTask) => fromIdea.has(t.label) || /^(Lesen|Nachspuren): /.test(t.label);
    const keep = tasks.filter((t) => t.childId !== child.id || t.done || !!t.requestedAt || !generated(t));
    const doneLabels = new Set(tasks.filter((t) => t.childId === child.id && (t.done || t.requestedAt)).map((t) => t.label));
    const fresh = tasksFor(idea, level, known).filter((l) => !doneLabels.has(l))
      .map((label) => ({ id: newId('task'), childId: child.id, label, done: false }));
    tasks = [...keep, ...fresh];
    levels[child.id] = level;
  }
  return { ...p, tasks, levels };
}

// ------------------------------------------------------------- Aufgabenbrett der Kinder

/** Laufende Projekte, in denen das Kind Aufgaben hat. */
export function childProjects(projects: FamilyProject[], childId: string): { project: FamilyProject; tasks: ProjectTask[] }[] {
  return projects
    .filter((p) => p.status === 'active')
    .map((project) => ({ project, tasks: project.tasks.filter((t) => t.childId === childId) }))
    .filter((x) => x.tasks.length > 0)
    .sort((a, b) => a.project.startDate.localeCompare(b.project.startDate));
}

/** Gemeldete Aufgaben aller laufenden Projekte, älteste zuerst. */
export function pendingProjectTasks(projects: FamilyProject[]): { project: FamilyProject; task: ProjectTask }[] {
  return projects.filter((p) => p.status === 'active')
    .flatMap((project) => project.tasks.filter((t) => t.requestedAt && !t.done).map((task) => ({ project, task })))
    .sort((a, b) => a.task.requestedAt!.localeCompare(b.task.requestedAt!));
}

const setTask = (db: FamilyDatabase, projectId: string, taskId: string, fn: (t: ProjectTask) => ProjectTask) =>
  updateProject(db, projectId, (p) => ({ ...p, tasks: p.tasks.map((t) => (t.id === taskId ? fn(t) : t)) }));

/** Kind meldet „geschafft“. */
export const requestProjectTask = (db: FamilyDatabase, projectId: string, taskId: string) =>
  setTask(db, projectId, taskId, (t) => (t.done ? t : { ...t, requestedAt: new Date().toISOString() }));

/** Kind nimmt die Meldung zurück (vertippt). */
export const withdrawProjectTask = (db: FamilyDatabase, projectId: string, taskId: string) =>
  setTask(db, projectId, taskId, ({ requestedAt: _r, ...t }) => t);

/** Mama oder Papa bestätigen. */
export const confirmProjectTask = (db: FamilyDatabase, projectId: string, taskId: string) =>
  setTask(db, projectId, taskId, ({ requestedAt: _r, ...t }) => ({ ...t, done: true, doneAt: new Date().toISOString() }));

// ------------------------------------------------------------- Geld

export function moneySummary(p: Pick<FamilyProject, 'money'>): { costs: number; income: number; surplus: number } {
  const costs = p.money.filter((m) => m.kind === 'cost').reduce((s, m) => s + m.cents, 0);
  const income = p.money.filter((m) => m.kind === 'income').reduce((s, m) => s + m.cents, 0);
  return { costs, income, surplus: income - costs };
}

/** "3,50" oder "3.5" oder "3" → Cent. Ungültig → null. */
export function parseEuro(input: string): number | null {
  const s = input.trim().replace(/\s|€/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(parseFloat(s) * 100);
}

export function formatEuro(cents: number): string {
  return `${(cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

// ------------------------------------------------------------- Einkauf und Kalender

/** Offenes Material auf die Einkaufsliste; was dort schon offen steht, kommt nicht doppelt. */
export async function materialsToShopping(db: FamilyDatabase, projectId: string): Promise<number> {
  const p = await db.projects.get(projectId);
  if (!p) return 0;
  const open = new Set((await db.shoppingItems.toArray()).filter((i) => !i.done).map((i) => i.name.trim().toLowerCase()));
  const now = new Date().toISOString();
  const items = p.materials.filter((m) => !m.done && !open.has(m.label.trim().toLowerCase()))
    .map((m) => ({ id: newId('shop'), name: m.label, section: guessSection(m.label), done: false, source: p.title, createdAt: now }));
  if (items.length) await db.shoppingItems.bulkAdd(items);
  return items.length;
}

/** Ausflug oder Forscherabend als Familientermin; ein bestehender Termin wird verschoben statt doppelt angelegt. */
export async function projectDateToCalendar(
  db: FamilyDatabase, projectId: string, which: 'trip' | 'presentation', when: { date: DateKey; time?: TimeOfDay; title: string },
): Promise<void> {
  await db.transaction('rw', db.projects, db.events, async () => {
    const p = await db.projects.get(projectId);
    if (!p) return;
    const now = new Date().toISOString();
    const existing = p[which]?.eventId ? await db.events.get(p[which]!.eventId!) : undefined;
    let eventId: string;
    if (existing) {
      const updated: CalendarEvent = { ...existing, title: when.title, startDate: when.date, updatedAt: now };
      if (when.time) updated.startTime = when.time; else delete updated.startTime;
      await db.events.put(updated);
      eventId = existing.id;
    } else {
      const event: CalendarEvent = {
        id: newId('event'), title: when.title, category: 'family', startDate: when.date, ...(when.time ? { startTime: when.time } : {}),
        memberIds: p.childIds, packingList: [],
        notes: `Projekt: ${p.title}`, createdAt: now, updatedAt: now,
      };
      await db.events.add(event);
      eventId = event.id;
    }
    await db.projects.put({ ...p, [which]: { title: when.title, date: when.date, ...(when.time ? { time: when.time } : {}), eventId }, updatedAt: now });
  });
}

// ------------------------------------------------------------- Abschluss und Wiederholen

export function projectPhotos(p: Pick<FamilyProject, 'entries'>): string[] {
  return p.entries.flatMap((e) => e.photos);
}

/** Projekt abschließen; auf Wunsch wird daraus eine Familienerinnerung mit den Fotos aus dem Tagebuch. */
export async function finishProject(db: FamilyDatabase, id: string, opts: { date: DateKey; reflection?: string; memory: boolean }): Promise<void> {
  const p = await db.projects.get(id);
  if (!p) return;
  let memoryId = p.memoryId;
  if (opts.memory && !memoryId) {
    const photos = projectPhotos(p).slice(0, MAX_MEMORY_PHOTOS);
    const m = await addMemory(db, {
      date: opts.date, title: `${p.emoji} ${p.title}`, memberIds: p.childIds, source: { kind: 'project', id: p.id },
      ...(opts.reflection?.trim() ? { text: opts.reflection.trim() } : {}), ...(photos.length ? { photos } : {}),
    });
    memoryId = m.id;
  }
  await updateProject(db, id, (x) => ({
    ...x, status: 'done', doneAt: opts.date, ...(opts.reflection?.trim() ? { reflection: opts.reflection.trim() } : {}), ...(memoryId ? { memoryId } : {}),
  }));
}

/** Projektchronik eines Kindes: abgeschlossene Projekte, neueste zuerst. */
export function chronicle(projects: FamilyProject[], childId?: string): FamilyProject[] {
  return projects
    .filter((p) => p.status === 'done' && (!childId || p.childIds.includes(childId)))
    .sort((a, b) => (b.doneAt ?? '').localeCompare(a.doneAt ?? ''));
}

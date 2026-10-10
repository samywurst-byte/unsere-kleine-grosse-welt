import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { PROJECT_IDEA_BY_ID, PROJECT_IDEAS } from '../src/data/projects';
import { exportData, validateBackup } from '../src/services/backup';
import { goalStates } from '../src/services/learning';
import { renderProjectSheets } from '../src/services/projectPdf';
import {
  canRead, childProjects, chronicle, confirmProjectTask, currentPhase, finishProject, formatEuro, ideasForNow, knownLetters, materialsToShopping, moneySummary, nextStep, parseEuro,
  pendingProjectTasks, projectDateToCalendar, projectLevel, readingTask, refreshTasks, requestProjectTask, startProject, tasksFor, updateProject,
  withdrawProjectTask,
} from '../src/services/projects';
import type { ChildProfile, LearningObservation } from '../src/types';
import { openDb } from './helpers';

const TODAY = '2026-10-10';

const child = (over: Partial<ChildProfile>): ChildProfile => ({
  id: 'k', role: 'child', name: 'K', color: 'sky', avatar: 'fox', sortOrder: 1, active: true, ageStage: 'medium',
  maxVisibleTasks: 2, needsHelp: false, showLabels: true, ...over,
});
const taro = child({ id: 'child-1', name: 'Taro', birthDate: '2021-03-01', schoolEntryDate: '2027-09-14', ageStage: 'large' });
const taavi = child({ id: 'child-2', name: 'Taavi', birthDate: '2022-05-01', schoolEntryDate: '2029-09-11' });
const talisa = child({ id: 'child-3', name: 'Talisa', birthDate: '2024-01-01', schoolEntryDate: '2030-09-10', ageStage: 'small' });

const obs = (letter: string, date: string): LearningObservation => ({
  id: `${letter}-${date}`, childId: 'child-1', goalId: `read.letter.${letter}`, date, level: 'independent', createdAt: date,
});

describe('Niveau je Kind', () => {
  it('leitet Schulkind, Lesekind, Vorschule und Kleinkind ab', () => {
    expect(projectLevel(taro, TODAY)).toBe('reader');
    expect(projectLevel(taavi, TODAY)).toBe('preschool');
    expect(projectLevel(talisa, TODAY)).toBe('toddler');
    expect(projectLevel(taro, '2027-10-01')).toBe('school');
  });
});

describe('Lesewörter', () => {
  it('nimmt nur Wörter aus sicheren Buchstaben, Lautverbindungen müssen eigens gelernt sein', () => {
    expect(canRead('NEST', ['N', 'E', 'S', 'T'])).toBe(true);
    expect(canRead('EI', ['E', 'I'])).toBe(false);
    expect(canRead('EI', ['EI'])).toBe(true);
    expect(canRead('OMA', ['O', 'M'])).toBe(false);
    expect(readingTask(['EI', 'NEST', 'DINO'], ['N', 'E', 'S', 'T'])).toBe('Lesen: NEST');
    expect(readingTask(['EI', 'NEST', 'DINO', 'ZAHN'], [])).toBe('Nachspuren: EI, NEST, DINO');
  });

  it('nutzt den Lernstand aus den Beobachtungen', () => {
    const observations = ['N', 'E', 'S', 'T'].flatMap((l) => [obs(l, '2026-10-01'), obs(l, '2026-10-03'), obs(l, '2026-10-06')]);
    const known = knownLetters(goalStates('child-1', observations, [], TODAY));
    expect(known.sort()).toEqual(['E', 'N', 'S', 'T']);
    const dino = PROJECT_IDEA_BY_ID.get('dinosaurs')!;
    expect(tasksFor(dino, 'reader', known)).toContain('Lesen: NEST');
    expect(tasksFor(dino, 'toddler', known)).not.toContain('Lesen: NEST');
  });

  it('hat für jede Idee Aufgaben auf jedem Niveau und gültige Schritte', () => {
    for (const idea of PROJECT_IDEAS) {
      for (const level of ['toddler', 'preschool', 'reader', 'school'] as const) expect(idea.tasks[level].length, `${idea.id} ${level}`).toBeGreaterThan(0);
      expect(Object.values(idea.steps).flat().length).toBeGreaterThan(3);
    }
    expect(new Set(PROJECT_IDEAS.map((i) => i.id)).size).toBe(PROJECT_IDEAS.length);
  });

  it('zeigt im Oktober zuerst Ideen zur Jahreszeit', () => {
    const order = ideasForNow(TODAY).map((i) => i.id);
    expect(order.indexOf('lanterns')).toBeLessThan(order.indexOf('paper-planes'));
    expect(order.indexOf('lemonade')).toBeGreaterThan(order.indexOf('paper-planes'));
    expect(order.indexOf('vegetable-bed')).toBeGreaterThan(order.indexOf('bread'));
    expect(ideasForNow('2026-06-10').findIndex((i) => i.id === 'lanterns')).toBeGreaterThan(5);
  });
});

const setups = [
  { child: taro, level: 'reader' as const, known: ['N', 'E', 'S', 'T'] },
  { child: talisa, level: 'toddler' as const, known: [] },
];

describe('Projekt anlegen und führen', () => {
  it('legt Schritte, Aufgaben je Kind und Material an', async () => {
    const db = await openDb();
    const idea = PROJECT_IDEA_BY_ID.get('dinosaurs')!;
    const p = await startProject(db, { idea, title: idea.title, emoji: idea.emoji, children: setups, startDate: TODAY });
    expect(p.childIds).toEqual(['child-1', 'child-3']);
    expect(p.tasks.filter((t) => t.childId === 'child-1').map((t) => t.label)).toContain('Lesen: NEST');
    expect(p.tasks.filter((t) => t.childId === 'child-3').length).toBe(3);
    expect(p.materials.length).toBe(idea.materials.length);
    expect(p.trip?.title).toBe('Besuch im Naturkundemuseum');
    expect(currentPhase(p)).toBe('discover');
    await updateProject(db, p.id, (x) => ({ ...x, steps: x.steps.map((s) => (s.phase === 'discover' ? { ...s, done: true } : s)) }));
    const after = (await db.projects.get(p.id))!;
    expect(currentPhase(after)).toBe('plan');
    expect(nextStep(after)?.phase).toBe('plan');
  });

  it('passt offene Aufgaben an den neuen Lernstand an, erledigte und eigene bleiben', async () => {
    const db = await openDb();
    const idea = PROJECT_IDEA_BY_ID.get('dinosaurs')!;
    const p = await startProject(db, { idea, title: idea.title, emoji: idea.emoji, children: [{ child: taro, level: 'reader', known: [] }], startDate: TODAY });
    const first = p.tasks[1];
    const withOwn = { ...p, tasks: [...p.tasks.map((t) => (t.id === first.id ? { ...t, done: true } : t)), { id: 'own', childId: 'child-1', label: 'Dino-Lied singen', done: false }] };
    expect(withOwn.tasks.some((t) => t.label.startsWith('Nachspuren'))).toBe(true);
    const next = refreshTasks(withOwn, idea, [{ child: taro, level: 'reader', known: ['N', 'E', 'S', 'T'] }]);
    expect(next.tasks.some((t) => t.label === 'Lesen: NEST')).toBe(true);
    expect(next.tasks.some((t) => t.label.startsWith('Nachspuren'))).toBe(false);
    expect(next.tasks.find((t) => t.id === first.id)?.done).toBe(true);
    expect(next.tasks.some((t) => t.id === 'own')).toBe(true);
    expect(next.tasks.filter((t) => t.label === first.label).length).toBe(1);
  });

  it('bringt fehlendes Material auf die Einkaufsliste, ohne Doppelte', async () => {
    const db = await openDb();
    const idea = PROJECT_IDEA_BY_ID.get('lanterns')!;
    const p = await startProject(db, { idea, title: idea.title, emoji: idea.emoji, children: setups, startDate: TODAY });
    await db.shoppingItems.add({ id: 'x', name: 'Kleister', section: 'sonstiges', done: false, createdAt: '' });
    await updateProject(db, p.id, (x) => ({ ...x, materials: x.materials.map((m) => (m.label === 'Transparentpapier' ? { ...m, done: true } : m)) }));
    expect(await materialsToShopping(db, p.id)).toBe(2);
    expect(await materialsToShopping(db, p.id)).toBe(0);
    const items = await db.shoppingItems.toArray();
    expect(items.find((i) => i.name === 'Laternenstab mit Lampe')?.source).toBe('Laternen basteln');
  });

  it('trägt den Ausflug als Familientermin ein und verschiebt ihn statt doppelt', async () => {
    const db = await openDb();
    const idea = PROJECT_IDEA_BY_ID.get('museum')!;
    const p = await startProject(db, { idea, title: idea.title, emoji: idea.emoji, children: setups, startDate: TODAY });
    const before = await db.events.count();
    await projectDateToCalendar(db, p.id, 'trip', { title: 'Museum', date: '2026-10-24', time: '10:00' });
    await projectDateToCalendar(db, p.id, 'trip', { title: 'Museum', date: '2026-10-31' });
    expect(await db.events.count()).toBe(before + 1);
    const saved = (await db.projects.get(p.id))!;
    const ev = (await db.events.get(saved.trip!.eventId!))!;
    expect(ev.startDate).toBe('2026-10-31');
    expect(ev.startTime).toBeUndefined();
    expect(ev.memberIds).toEqual(['child-1', 'child-3']);
    expect(ev.category).toBe('family');
  });

  it('schließt ab und macht daraus eine Erinnerung mit Fotos', async () => {
    const db = await openDb();
    const idea = PROJECT_IDEA_BY_ID.get('paper-planes')!;
    const p = await startProject(db, { idea, title: idea.title, emoji: idea.emoji, children: setups, startDate: TODAY });
    await updateProject(db, p.id, (x) => ({ ...x, entries: [{ id: 'e', date: TODAY, text: 'Geflogen', photos: ['data:image/jpeg;base64,AAAA'] }] }));
    await finishProject(db, p.id, { date: '2026-10-12', reflection: 'Der schwere Flieger flog am weitesten.', memory: true });
    const done = (await db.projects.get(p.id))!;
    expect(done.status).toBe('done');
    const mem = (await db.familyMemories.get(done.memoryId!))!;
    expect(mem.photos).toEqual(['data:image/jpeg;base64,AAAA']);
    expect(mem.source).toEqual({ kind: 'project', id: p.id });
    expect(chronicle([done], 'child-2')).toEqual([]);
    expect(chronicle([done], 'child-3').length).toBe(1);
    // Sicherung enthält Projekte und bleibt gültig
    const backup = await exportData(db);
    expect(validateBackup(JSON.parse(JSON.stringify(backup))).ok).toBe(true);
    expect(backup.tables.projects?.length).toBe(1);
  });

  it('übernimmt bei eigenen Projekten Schritte und Material zum Wiederholen', async () => {
    const db = await openDb();
    const own = await startProject(db, { title: 'Vogelhaus', emoji: '🐦', children: setups, startDate: TODAY });
    expect(own.tasks).toEqual([]);
    await updateProject(db, own.id, (x) => ({ ...x, materials: [{ id: 'm', label: 'Holz', done: true }], steps: [...x.steps, { id: 's', phase: 'make', label: 'Sägen', done: true }] }));
    const again = await startProject(db, { title: 'Vogelhaus', emoji: '🐦', children: setups, startDate: '2027-03-01', copyFrom: (await db.projects.get(own.id))! });
    expect(again.steps.some((s) => s.label === 'Sägen' && !s.done)).toBe(true);
    expect(again.materials).toMatchObject([{ label: 'Holz', done: false }]);
  });
});

describe('Geld im Projekt', () => {
  it('liest Euro-Beträge und rechnet den Überschuss', () => {
    expect(parseEuro('3,50')).toBe(350);
    expect(parseEuro('3')).toBe(300);
    expect(parseEuro('3.5 €')).toBe(350);
    expect(parseEuro('drei')).toBeNull();
    const s = moneySummary({ money: [
      { id: '1', date: TODAY, label: '12 Körbchen', cents: 3600, kind: 'income' },
      { id: '2', date: TODAY, label: 'Material', cents: 600, kind: 'cost' },
    ] });
    expect(s).toEqual({ costs: 600, income: 3600, surplus: 3000 });
    expect(formatEuro(3000)).toBe('30,00 €');
  });
});

describe('Projektblätter', () => {
  it('erzeugt eine Planseite und je Kind eine Seite', async () => {
    const db = await openDb();
    const idea = PROJECT_IDEA_BY_ID.get('dinosaurs')!;
    const p = await startProject(db, { idea, title: idea.title, emoji: idea.emoji, children: setups, startDate: TODAY });
    const f = (n: string) => readFileSync(`public/fonts/${n}`);
    const bytes = await renderProjectSheets(p, [taro, talisa], { regular: f('andika-regular.ttf'), bold: f('andika-bold.ttf'), school: f('grundschrift.ttf') });
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(3);
  });

  it('zeigt Kindern ihre Projektaufgaben; gemeldet wird erst nach Bestätigung erledigt', async () => {
    const db = await openDb();
    const idea = PROJECT_IDEA_BY_ID.get('lanterns')!;
    const p = await startProject(db, { idea, title: idea.title, emoji: idea.emoji, children: setups, startDate: TODAY });
    const all = await db.projects.toArray();
    expect(childProjects(all, 'child-1')[0].project.id).toBe(p.id);
    expect(childProjects(all, 'child-2')).toHaveLength(0);
    const task = p.tasks.find((t) => t.childId === 'child-1')!;
    await requestProjectTask(db, p.id, task.id);
    expect(pendingProjectTasks(await db.projects.toArray()).map((x) => x.task.id)).toEqual([task.id]);
    await withdrawProjectTask(db, p.id, task.id);
    expect(pendingProjectTasks(await db.projects.toArray())).toHaveLength(0);
    await requestProjectTask(db, p.id, task.id);
    // Anpassen an den Lernstand wirft gemeldete Aufgaben nicht weg
    const refreshed = refreshTasks((await db.projects.get(p.id))!, idea, [{ child: taro, level: 'reader', known: ['L', 'A'] }]);
    expect(refreshed.tasks.find((t) => t.id === task.id)?.requestedAt).toBeTruthy();
    await confirmProjectTask(db, p.id, task.id);
    const done = (await db.projects.get(p.id))!.tasks.find((t) => t.id === task.id)!;
    expect([done.done, done.requestedAt, !!done.doneAt]).toEqual([true, undefined, true]);
    await updateProject(db, p.id, (x) => ({ ...x, status: 'paused' }));
    expect(childProjects(await db.projects.toArray(), 'child-1')).toHaveLength(0);
  });
});

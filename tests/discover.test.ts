import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { EXPLORER_MODULES } from '../src/data/explorerModules';
import { describe, expect, it } from 'vitest';
import { DISCOVER_TOPICS, DISCOVER_TOPIC_BY_ID, TIMELINE } from '../src/data/discover';
import { PROJECT_IDEA_BY_ID } from '../src/data/projects';
import { exportData, validateBackup } from '../src/services/backup';
import { readableWords, toggleDiscovery, topicProgress } from '../src/services/discover';
import { renderTopicSheet } from '../src/services/projectPdf';
import { openDb } from './helpers';

describe('Entdeckerbibliothek: Inhalte', () => {
  it('belegt jede Sachangabe mit einer vorhandenen Quelle', () => {
    for (const t of DISCOVER_TOPICS) {
      expect(t.sources.length, t.id).toBeGreaterThan(0);
      for (const f of t.facts) expect(t.sources[f.source], `${t.id}: ${f.text}`).toBeDefined();
      for (const s of t.sources) expect(s.url).toMatch(/^https:\/\//);
      // jede Quelle wird auch benutzt
      t.sources.forEach((_, i) => expect(t.facts.some((f) => f.source === i), `${t.id} Quelle ${i + 1}`).toBe(true));
    }
  });

  it('hat gültige Rätsel, eindeutige Ids und passende Projektverweise', () => {
    expect(new Set(DISCOVER_TOPICS.map((t) => t.id)).size).toBe(DISCOVER_TOPICS.length);
    for (const t of DISCOVER_TOPICS) {
      expect(new Set(t.missions.map((m) => m.id)).size).toBe(t.missions.length);
      for (const q of t.quiz) expect(q.options[q.answer], q.question).toBeDefined();
      if (t.projectId) expect(PROJECT_IDEA_BY_ID.has(t.projectId)).toBe(true);
    }
  });

  it('hat einen lückenlosen Zeitstrahl bis heute', () => {
    for (let i = 1; i < TIMELINE.length; i++) expect(TIMELINE[i].from).toBe(TIMELINE[i - 1].to);
    expect(TIMELINE[TIMELINE.length - 1].to).toBe(0);
  });
});

describe('Entdeckerbibliothek: Forschen', () => {
  it('hakt Forscheraufträge ab und wieder auf', async () => {
    const db = await openDb();
    const topic = DISCOVER_TOPIC_BY_ID.get('space')!;
    await toggleDiscovery(db, 'space', 'planets', '2026-10-10');
    expect(topicProgress(topic, await db.discoveries.toArray())).toEqual({ done: 1, total: 3 });
    const backup = await exportData(db);
    expect(validateBackup(JSON.parse(JSON.stringify(backup))).ok).toBe(true);
    await toggleDiscovery(db, 'space', 'planets', '2026-10-10');
    expect(await db.discoveries.count()).toBe(0);
  });

  it('zeigt nur Wörter aus sicheren Buchstaben', () => {
    expect(readableWords(['MOND', 'STERN', 'SONNE', 'ERDE', 'MARS'], ['M', 'O', 'N', 'D', 'S', 'E'])).toEqual(['MOND', 'SONNE']);
  });

  it('erzeugt für jedes Thema ein Forscherblatt, und jeder Entdeckersonntag verweist auf ein vorhandenes Thema', async () => {
    const f = (n: string) => readFileSync(`public/fonts/${n}`);
    const fonts = { regular: f('andika-regular.ttf'), bold: f('andika-bold.ttf'), school: f('grundschrift.ttf') };
    for (const t of DISCOVER_TOPICS) {
      const bytes = await renderTopicSheet(t, undefined, t.words.slice(0, 2), fonts);
      expect((await PDFDocument.load(bytes)).getPageCount(), t.id).toBeGreaterThanOrEqual(2);
    }
    for (const m of EXPLORER_MODULES) if (m.topicId) expect(DISCOVER_TOPIC_BY_ID.has(m.topicId), m.id).toBe(true);
  }, 30_000);

  it('erzeugt ein Forscherblatt mit zwei Seiten', async () => {
    const f = (n: string) => readFileSync(`public/fonts/${n}`);
    const bytes = await renderTopicSheet(DISCOVER_TOPIC_BY_ID.get('dinosaurs')!, undefined, ['DINO', 'EI'], { regular: f('andika-regular.ttf'), bold: f('andika-bold.ttf'), school: f('grundschrift.ttf') });
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(2);
  });
});

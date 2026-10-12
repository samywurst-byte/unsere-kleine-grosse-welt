import { readFileSync, writeFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { COLORING_THEMES, coloringForWeek } from '../src/data/coloringPages';
import { CRAFTS, craftForWeek, seasonOf } from '../src/data/crafts';
import { planPack, weeklyExtras, type PlannedPage } from '../src/services/learningPack';
import { renderWorksheets } from '../src/services/worksheetPdf';

const fonts = () => {
  const f = (n: string) => readFileSync(`public/fonts/${n}`);
  return { regular: f('andika-regular.ttf'), bold: f('andika-bold.ttf'), school: f('grundschrift.ttf') };
};

describe('Ausmalbild und Bastelvorlage der Woche', () => {
  it('Ausmalbilder wechseln alle 3 Wochen das Thema, Laternen und Weihnachtsmann zur passenden Zeit', () => {
    for (const t of COLORING_THEMES) expect(t.pictures, t.id).toHaveLength(3);
    expect([44, 45, 46].map((k) => coloringForWeek(k).theme.id)).toEqual(['lantern', 'lantern', 'lantern']);
    expect([49, 50, 51].map((k) => [coloringForWeek(k).theme.id, coloringForWeek(k).index])).toEqual([['santa', 0], ['santa', 1], ['santa', 2]]);
    expect([1, 2, 3].map((k) => coloringForWeek(k).index)).toEqual([0, 1, 2]);
    expect(coloringForWeek(1).theme.id).toBe(coloringForWeek(3).theme.id);
    expect(coloringForWeek(4).theme.id).not.toBe(coloringForWeek(3).theme.id);
    // Außerhalb von Martin und Weihnachten kommen Laterne und Weihnachtsmann nicht vor
    for (let k = 1; k <= 43; k++) expect(['lantern', 'santa']).not.toContain(coloringForWeek(k).theme.id);
  });

  it('Bastelideen passen zur Jahreszeit', () => {
    expect([0, 2, 3, 5, 6, 8, 10, 11].map(seasonOf)).toEqual(['winter', 'spring', 'spring', 'summer', 'summer', 'autumn', 'autumn', 'winter']);
    for (const pool of Object.values(CRAFTS)) for (const c of pool) expect(c.steps.length, c.id).toBe(3);
    expect(craftForWeek(42, 9).id).toBe('leaf-hedgehog');
    const extras = weeklyExtras('2026-10-12');
    expect(extras.map((s) => s.kind)).toEqual(['craft', 'picture']);
  });

  it('rendert alle Ausmalbilder und Bastelvorlagen als PDF', async () => {
    const pages: PlannedPage[] = [
      ...COLORING_THEMES.flatMap((t) => t.pictures.map((p, index) => ({ id: `${t.id}-${index}`, section: 'child' as const, childName: t.name, title: p.title, spec: { kind: 'picture' as const, theme: t.name, index, title: p.title, drawing: p.drawing } }))),
      ...Object.values(CRAFTS).flat().map((craft) => ({ id: craft.id, section: 'child' as const, childName: craft.id, title: craft.title, spec: { kind: 'craft' as const, craft } })),
    ];
    const pack = { id: 'p', weekStart: '2026-10-12', letter: 'M', children: [], createdAt: 'x', prints: [] };
    const plan = { ...planPack({ pack, children: [], statesByChild: new Map() }), pages };
    const bytes = await renderWorksheets(plan, pages, fonts());
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(46);
    if (process.env.EXTRAS_PDF) writeFileSync(process.env.EXTRAS_PDF, bytes);
  });
});

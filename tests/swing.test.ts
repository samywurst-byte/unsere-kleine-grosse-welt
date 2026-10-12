import { readFileSync, writeFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { SWING_SHEETS, SWING_VARIANTS, swingLevelForTrack, swingVariantForWeek, type SwingLevel } from '../src/data/swingExercises';
import { ILLUSTRATIONS } from '../src/data/illustrations';
import { planPack } from '../src/services/learningPack';
import { strokesUpTo, swingStrokes } from '../src/services/swing';
import { renderWorksheets } from '../src/services/worksheetPdf';

const fonts = () => {
  const f = (n: string) => readFileSync(`public/fonts/${n}`);
  return { regular: f('andika-regular.ttf'), bold: f('andika-bold.ttf'), school: f('grundschrift.ttf') };
};

describe('Schwungübungen', () => {
  it('hat je Stufe 8 Varianten, die sich nach 8 Wochen wiederholen', () => {
    for (const level of ['toddler', 'swing', 'letters'] as SwingLevel[]) expect(SWING_SHEETS[level]).toHaveLength(SWING_VARIANTS);
    expect([1, 2, 8, 9, 42, 53].map(swingVariantForWeek)).toEqual([0, 1, 7, 0, 1, 4]);
    expect(['toddler', 'preschool', 'letters', 'reading', 'math', 'skip'].map((t) => swingLevelForTrack(t as never))).toEqual(['toddler', 'swing', 'letters', null, null, null]);
  });

  it('Bilder gibt es, Schwünge bleiben in ihrem Feld', () => {
    for (const sheet of Object.values(SWING_SHEETS).flat()) {
      for (const row of sheet.rows) {
        for (const id of [row.from, row.to]) if (id) expect(ILLUSTRATIONS.has(id), id).toBe(true);
        const h = row.height || 20;
        const strokes = swingStrokes(row.pattern, 400, h, row.period || 400);
        expect(strokes.length).toBeGreaterThan(0);
        for (const [x, y] of strokes.flat()) {
          expect(x).toBeGreaterThanOrEqual(-0.5);
          expect(x).toBeLessThanOrEqual(400.5);
          expect(y).toBeGreaterThanOrEqual(-0.5);
          expect(y).toBeLessThanOrEqual(h + 0.5);
        }
        expect(strokesUpTo(strokes, row.period || 400)[0].length).toBeGreaterThan(1);
      }
    }
    for (const sheet of SWING_SHEETS.letters) expect([sheet.letters?.length, sheet.digits?.length]).toEqual([4, 2]);
  });

  it('rendert alle 24 Blätter als PDF', async () => {
    const pages = (Object.entries(SWING_SHEETS) as [SwingLevel, typeof SWING_SHEETS.toddler][]).flatMap(([level, sheets]) =>
      sheets.map((sheet, variant) => ({ id: `${level}-${variant}`, section: 'child' as const, childName: level, title: sheet.title, spec: { kind: 'swing' as const, level, variant, sheet } })));
    const pack = { id: 'p', weekStart: '2026-10-12', letter: 'M', children: [], createdAt: 'x', prints: [] };
    const plan = { ...planPack({ pack, children: [], statesByChild: new Map() }), pages };
    const bytes = await renderWorksheets(plan, pages, fonts());
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(24);
    if (process.env.SWING_PDF) writeFileSync(process.env.SWING_PDF, bytes);
  });
});

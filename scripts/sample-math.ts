// Erzeugt Probe-Rechenblätter für alle Lernziele (nur für die Entwicklung): npx tsx scripts/sample-math.ts out.pdf
import { readFileSync, writeFileSync } from 'node:fs';
import { MATH_GOALS } from '../src/data/mathCurriculum';
import { seededRandom, type PackPlan, type PlannedPage } from '../src/services/learningPack';
import { mathMemoryPairs, mathPageFor, numberWallPage } from '../src/services/mathSheets';
import { renderWorksheets } from '../src/services/worksheetPdf';
import { LETTERS } from '../src/data/readingCurriculum';

const out = process.argv[2] ?? 'math.pdf';
const pages: PlannedPage[] = [];
for (const g of MATH_GOALS) {
  const rnd = seededRandom(g.id);
  for (const p of [mathPageFor(g, rnd), numberWallPage(g, rnd)]) {
    if (p) pages.push({ id: `${g.id}-${pages.length}`, section: 'child', childName: g.id, title: p.title, spec: { kind: 'math', title: p.title, math: p.spec } });
  }
}
for (const g of [MATH_GOALS[0], MATH_GOALS.find((x) => x.id === 'math.pairs10')!, MATH_GOALS.find((x) => x.id === 'math.add20')!, MATH_GOALS.find((x) => x.id === 'math.times.7')!]) {
  const { heading, pairs } = mathMemoryPairs([g], seededRandom('m'));
  pages.push({ id: `mem-${g.id}`, section: 'game', title: 'Rechen-Memory', spec: { kind: 'math-memory', heading, cards: pairs.flat() } });
}
const plan: PackPlan = { pack: { id: 'x', weekStart: '2026-10-12', letter: 'M', children: [], createdAt: '', prints: [] }, letter: LETTERS[0], title: 'Probe', pages };
const f = (n: string) => readFileSync(`public/fonts/${n}`);
writeFileSync(out, await renderWorksheets(plan, pages, { regular: f('andika-regular.ttf'), bold: f('andika-bold.ttf'), school: f('grundschrift.ttf') }));
console.log(pages.map((p, i) => `${i + 1} ${p.childName}: ${p.title}`).join('\n'));

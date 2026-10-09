// Erzeugt ein Beispiel-Lernpaket als PDF (nur für die Entwicklung): npx tsx scripts/sample-pack.ts <Buchstabe> <out.pdf> [blend]
import { readFileSync, writeFileSync } from 'node:fs';
import { planPack } from '../src/services/learningPack';
import { renderWorksheets } from '../src/services/worksheetPdf';
import { goalStates } from '../src/services/learning';
import type { ChildProfile, LearningRelease } from '../src/types';

const letter = process.argv[2] ?? 'M';
const out = process.argv[3] ?? 'sample.pdf';
const blend = process.argv[4] === 'blend';
const today = '2026-10-12';
const kid = (id: string, name: string, birthDate: string): ChildProfile => ({
  id, role: 'child', name, color: 'sage', avatar: 'fox', sortOrder: 1, active: true, birthDate,
  ageStage: 'large', maxVisibleTasks: 3, needsHelp: false, showLabels: true,
});
const children = [kid('child-1', 'Kind Eins', '2021-03-10'), kid('child-2', 'Kind Zwei', '2022-05-01'), kid('child-3', 'Kind Drei', '2024-02-01')];
const releases: LearningRelease[] = ['read.letter.M', 'read.letter.A', 'read.letter.I', 'read.letter.O', ...(blend ? ['read.blend'] : [])]
  .map((goalId) => ({ id: `child-1|${goalId}`, childId: 'child-1', goalId, status: 'released', at: '2026-10-01T00:00:00Z' }));
const statesByChild = new Map([['child-1', goalStates('child-1', [], releases, today)]]);
const plan = planPack({
  pack: { id: 'p1', weekStart: today, letter, createdAt: '', prints: [],
    children: [{ childId: 'child-1', track: 'letters' }, { childId: 'child-2', track: 'preschool' }, { childId: 'child-3', track: 'toddler' }] },
  children, statesByChild,
});
const f = (n: string) => readFileSync(`public/fonts/${n}`);
const bytes = await renderWorksheets(plan, plan.pages, { regular: f('andika-regular.ttf'), bold: f('andika-bold.ttf'), school: f('grundschrift.ttf') });
writeFileSync(out, bytes);
console.log(plan.pages.map((p) => `${p.childName ?? '-'}: ${p.title}`).join('\n'), '\n', bytes.length, 'bytes');

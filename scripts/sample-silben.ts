// Beispiel-Silbenwoche als PDF (nur für die Entwicklung): npx tsx scripts/sample-silben.ts <Buchstabe> <out.pdf> [Wiederholung, z. B. M,A]
import { readFileSync, writeFileSync } from 'node:fs';
import { planPack } from '../src/services/learningPack';
import { renderWorksheets } from '../src/services/worksheetPdf';
import { goalStates } from '../src/services/learning';
import type { ChildProfile, LearningRelease } from '../src/types';

const letter = process.argv[2] ?? 'O';
const out = process.argv[3] ?? 'silben.pdf';
const review = process.argv[4]?.split(',');
const today = '2026-11-16';
const kid = (id: string, name: string, birthDate: string): ChildProfile => ({
  id, role: 'child', name, color: 'sage', avatar: 'fox', sortOrder: 1, active: true, birthDate,
  ageStage: 'large', maxVisibleTasks: 3, needsHelp: false, showLabels: true,
});
const children = [kid('child-1', 'Kind Eins', '2021-03-10'), kid('child-2', 'Kind Zwei', '2022-05-01'), kid('child-3', 'Kind Drei', '2024-02-01')];
const releases: LearningRelease[] = ['read.letter.M', 'read.letter.A', 'read.letter.E']
  .map((goalId) => ({ id: `child-1|${goalId}`, childId: 'child-1', goalId, status: 'released', at: '2026-10-01T00:00:00Z' }));
const statesByChild = new Map([['child-1', goalStates('child-1', [], releases, today)]]);
const plan = planPack({
  pack: { id: 'p1', weekStart: today, letter, createdAt: '', prints: [], ...(review ? { review } : {}),
    children: [{ childId: 'child-1', track: 'letters', math: false }, { childId: 'child-2', track: 'preschool', math: false }, { childId: 'child-3', track: 'skip' }] },
  children, statesByChild, priorLetters: ['M', 'A', 'E'],
});
const f = (n: string) => readFileSync(`public/fonts/${n}`);
const pages = plan.pages.filter((p) => p.childId === 'child-1' && p.spec.kind !== 'craft' && p.spec.kind !== 'picture' && p.spec.kind !== 'swing');
const bytes = await renderWorksheets(plan, pages, { regular: f('andika-regular.ttf'), bold: f('andika-bold.ttf'), school: f('grundschrift.ttf') });
writeFileSync(out, bytes);
console.log(plan.pages.map((p) => `${p.childName ?? '-'}: ${p.title}`).join('\n'), '\n', bytes.length, 'bytes');

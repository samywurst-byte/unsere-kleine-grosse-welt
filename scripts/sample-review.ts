// Beispiel Normal- und Wiederholungswoche (nur Entwicklung): npx tsx scripts/sample-review.ts <out-dir>
import { readFileSync, writeFileSync } from 'node:fs';
import { planPack } from '../src/services/learningPack';
import { renderWorksheets } from '../src/services/worksheetPdf';
import { goalStates } from '../src/services/learning';
import type { ChildProfile, LearningPack, LearningRelease } from '../src/types';

const out = process.argv[2] ?? '.';
const today = '2026-11-02';
const kid = (id: string, name: string, birthDate: string): ChildProfile => ({
  id, role: 'child', name, color: 'sage', avatar: 'fox', sortOrder: 1, active: true, birthDate,
  ageStage: 'large', maxVisibleTasks: 3, needsHelp: false, showLabels: true,
});
const children = [kid('child-1', 'Kind Eins', '2021-03-10'), kid('child-2', 'Kind Zwei', '2022-05-01'), kid('child-3', 'Kind Drei', '2024-02-01')];
const releases: LearningRelease[] = ['read.letter.M', 'read.letter.A', 'read.letter.I']
  .map((goalId) => ({ id: `child-1|${goalId}`, childId: 'child-1', goalId, status: 'released', at: '2026-10-01T00:00:00Z' }));
const statesByChild = new Map([['child-1', goalStates('child-1', [], releases, today)]]);
const f = (n: string) => readFileSync(`public/fonts/${n}`);
const fonts = { regular: f('andika-regular.ttf'), bold: f('andika-bold.ttf'), school: f('grundschrift.ttf') };
const base = (weekStart: string, letter: string, review?: string[]): LearningPack => ({
  id: weekStart, weekStart, letter, review, createdAt: '', prints: [],
  children: [{ childId: 'child-1', track: 'letters', math: true }, { childId: 'child-2', track: 'preschool', math: true }, { childId: 'child-3', track: 'toddler' }],
});
for (const [name, pack] of [['normal-I', base('2026-10-26', 'I')], ['wiederholung-M-A', base(today, 'A', ['M', 'A'])]] as const) {
  const plan = planPack({ pack, children, statesByChild });
  const bytes = await renderWorksheets(plan, plan.pages, fonts);
  writeFileSync(`${out}/${name}.pdf`, bytes);
  console.log(name, '\n ', plan.pages.map((p) => `${p.childName ?? '-'}: ${p.title}`).join('\n  '));
}

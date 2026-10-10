import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';
import { LEVEL_LABEL, PHASES } from '../data/projects';
import type { ChildProfile, FamilyProject } from '../types';
import { formatLong } from '../utils/dates';
import type { WorksheetFonts } from './worksheetPdf';

/**
 * Projektblätter (A4, Schwarzweiß): eine Planseite für die Familie und je Kind eine Seite mit seinen Aufgaben
 * und Platz zum Malen oder Schreiben. Lesekinder bekommen ihre Projektwörter in Grundschrift zum Nachspuren.
 */

const W = 595.28;
const H = 841.89;
const M = 44;
const CW = W - 2 * M;
const BLACK = rgb(0, 0, 0);
const MUTED = rgb(0.4, 0.4, 0.4);
const LINE = rgb(0.6, 0.6, 0.6);
const TRACE = rgb(0.68, 0.68, 0.68);

interface Ctx { page: PDFPage; regular: PDFFont; bold: PDFFont; school: PDFFont }

const Y = (top: number) => H - top;

/** Zeichen, die die Schriften nicht haben (z. B. Emojis), weglassen. */
function clean(s: string, font: PDFFont): string {
  const chars = new Set(font.getCharacterSet());
  return Array.from(s).filter((ch) => chars.has(ch.codePointAt(0)!)).join('').replace(/\s+/g, ' ').trim();
}

function text(c: Ctx, s: string, x: number, top: number, size: number, opts: { font?: PDFFont; color?: RGB } = {}) {
  const font = opts.font ?? c.regular;
  c.page.drawText(clean(s, font), { x, y: Y(top), size, font, color: opts.color ?? BLACK });
}

function wrap(s: string, font: PDFFont, size: number, width: number): string[] {
  const words = clean(s, font).split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > width && line) { lines.push(line); line = w; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Absatz; gibt die Oberkante für die nächste Zeile zurück. */
function para(c: Ctx, s: string, x: number, top: number, size: number, width: number, opts: { font?: PDFFont; color?: RGB } = {}): number {
  const lines = wrap(s, opts.font ?? c.regular, size, width);
  lines.forEach((l, i) => text(c, l, x, top + i * size * 1.35, size, opts));
  return top + lines.length * size * 1.35;
}

function checkbox(c: Ctx, x: number, top: number, size: number) {
  c.page.drawRectangle({ x, y: Y(top + size), width: size, height: size, borderColor: BLACK, borderWidth: 1.4 });
}

function hline(c: Ctx, top: number, color = LINE) {
  c.page.drawLine({ start: { x: M, y: Y(top) }, end: { x: W - M, y: Y(top) }, thickness: 0.8, color });
}

function header(c: Ctx, title: string, name?: string): number {
  let size = 22;
  const maxW = name ? CW - 190 : CW;
  const t = clean(title, c.bold);
  while (c.bold.widthOfTextAtSize(t, size) > maxW && size > 13) size -= 1;
  text(c, t, M, 62, size, { font: c.bold });
  if (name !== undefined) {
    text(c, 'Name:', W - M - 180, 62, 12, { color: MUTED });
    if (name) text(c, name, W - M - 140, 62, 16, { font: c.school });
    c.page.drawLine({ start: { x: W - M - 142, y: Y(66) }, end: { x: W - M, y: Y(66) }, thickness: 0.8, color: LINE });
  }
  return 92;
}

function footer(c: Ctx, p: FamilyProject, i: number, total: number) {
  text(c, `Projekt ${p.title} · Unsere kleine große Welt`, M, H - 24, 8.5, { color: MUTED });
  const s = `Seite ${i} von ${total}`;
  text(c, s, W - M - c.regular.widthOfTextAtSize(s, 8.5), H - 24, 8.5, { color: MUTED });
}

function framedBox(c: Ctx, label: string, top: number, height: number) {
  c.page.drawRectangle({ x: M, y: Y(top + height), width: CW, height, borderColor: BLACK, borderWidth: 1.2, borderDashArray: [5, 4] });
  text(c, label, M + 10, top + 20, 12, { color: MUTED });
}

function writingLines(c: Ctx, top: number, count: number, gap = 34) {
  for (let i = 1; i <= count; i++) hline(c, top + i * gap);
}

function familyPage(c: Ctx, p: FamilyProject) {
  let top = header(c, `${p.title}: Unser Plan`);
  if (p.description) top = para(c, p.description, M, top, 11.5, CW, { color: MUTED }) + 8;
  for (const ph of PHASES) {
    const steps = p.steps.filter((s) => s.phase === ph.id);
    if (!steps.length) continue;
    if (top > H - 140) break;
    text(c, ph.label, M, top + 14, 14, { font: c.bold });
    top += 24;
    for (const s of steps) {
      if (top > H - 110) break;
      checkbox(c, M, top, 13);
      top = Math.max(para(c, s.label, M + 22, top + 11, 11.5, CW - 22), top + 18) + 4;
    }
    top += 6;
  }
  if (p.materials.length && top < H - 130) {
    text(c, 'Material', M, top + 14, 14, { font: c.bold });
    top += 26;
    const colW = CW / 2;
    p.materials.forEach((m, i) => {
      const x = M + (i % 2) * colW;
      const t = top + Math.floor(i / 2) * 20;
      if (t > H - 70) return;
      checkbox(c, x, t, 12);
      text(c, m.label, x + 20, t + 10, 11);
    });
    top += Math.ceil(p.materials.length / 2) * 20 + 8;
  }
  const dates = [p.trip, p.presentation].filter((d) => d?.date);
  if (dates.length && top < H - 80) {
    text(c, 'Termine', M, top + 14, 14, { font: c.bold });
    top += 26;
    for (const d of dates) { text(c, `${formatLong(d!.date!)}${d!.time ? `, ${d!.time} Uhr` : ''}: ${d!.title}`, M, top + 10, 11); top += 18; }
  }
}

/** Projektwörter aus der Leseaufgabe ("Lesen: EI, NEST" oder "Nachspuren: …"). */
function wordsFrom(p: FamilyProject, childId: string): { mode: 'read' | 'trace'; words: string[] } | null {
  const t = p.tasks.find((x) => x.childId === childId && /^(Lesen|Nachspuren): /.test(x.label));
  if (!t) return null;
  const [mode, rest] = t.label.split(': ');
  return { mode: mode === 'Lesen' ? 'read' : 'trace', words: rest.split(',').map((w) => w.trim()).filter(Boolean) };
}

function childPage(c: Ctx, p: FamilyProject, child: ChildProfile) {
  const level = p.levels[child.id] ?? 'preschool';
  let top = header(c, `${p.title}: Meine Aufgaben`, child.name);
  text(c, LEVEL_LABEL[level], M, top - 6, 10, { color: MUTED });
  top += 10;
  const tasks = p.tasks.filter((t) => t.childId === child.id && !/^(Lesen|Nachspuren): /.test(t.label));
  for (const t of tasks) {
    checkbox(c, M, top, 20);
    top = Math.max(para(c, t.label, M + 32, top + 15, 14, CW - 32), top + 26) + 8;
  }
  const words = wordsFrom(p, child.id);
  if (words?.words.length) {
    top += 6;
    text(c, words.mode === 'read' ? 'Lies die Wörter. Dann spure sie nach.' : 'Spure die Wörter nach.', M, top + 14, 13, { font: c.bold });
    top += 30;
    const size = 40;
    let x = M;
    for (const w of words.words) {
      const width = c.school.widthOfTextAtSize(w, size);
      if (x + width > W - M) { x = M; top += size * 1.6; }
      if (words.mode === 'read') c.page.drawText(w, { x, y: Y(top + size * 0.9), size, font: c.school, color: BLACK });
      c.page.drawText(w, { x, y: Y(top + size * 2.1), size, font: c.school, color: TRACE });
      x += width + 34;
    }
    top += size * (words.mode === 'read' ? 2.5 : 2.5);
    c.page.drawLine({ start: { x: M, y: Y(top - size * 0.35) }, end: { x: W - M, y: Y(top - size * 0.35) }, thickness: 0.8, color: LINE });
    top += 10;
  }
  const room = H - 60 - top;
  if (room < 120) return;
  if (level === 'school') {
    text(c, 'Das habe ich herausgefunden:', M, top + 16, 13, { font: c.bold });
    writingLines(c, top + 20, Math.floor((room - 30) / 34));
  } else if (level === 'reader') {
    const boxH = Math.max(120, room - 110);
    framedBox(c, 'Das hat mir am besten gefallen (malen)', top + 6, boxH);
    text(c, 'Ein Wort dazu:', M, top + boxH + 40, 12, { color: MUTED });
    hline(c, top + boxH + 76);
  } else {
    framedBox(c, level === 'toddler' ? 'Hier darf ich malen oder kleben' : 'Das hat mir am besten gefallen (malen)', top + 6, room - 10);
  }
}

export async function renderProjectSheets(p: FamilyProject, kids: ChildProfile[], fonts: WorksheetFonts): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`Projekt ${p.title}`);
  doc.setAuthor('Unsere kleine große Welt');
  doc.setLanguage('de-DE');
  const [regular, bold, school] = await Promise.all([
    doc.embedFont(fonts.regular, { subset: true }),
    doc.embedFont(fonts.bold, { subset: true }),
    doc.embedFont(fonts.school, { subset: true }),
  ]);
  const total = 1 + kids.length;
  const ctx = (): Ctx => ({ page: doc.addPage([W, H]), regular, bold, school });
  const first = ctx();
  familyPage(first, p);
  footer(first, p, 1, total);
  kids.forEach((k, i) => {
    const c = ctx();
    childPage(c, p, k);
    footer(c, p, i + 2, total);
  });
  return doc.save();
}

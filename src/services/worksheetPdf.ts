import fontkit from '@pdf-lib/fontkit';
import { getISOWeek } from 'date-fns';
import {
  PDFDocument, popGraphicsState, pushGraphicsState, rgb, setLineWidth, setStrokingRgbColor, setTextRenderingMode,
  LineCapStyle, TextRenderingMode, type PDFFont, type PDFPage, type RGB,
} from 'pdf-lib';
import { ILLUSTRATIONS } from '../data/illustrations';
import type { LetterInfo } from '../data/readingCurriculum';
import { fromDateKey } from '../utils/dates';
import type { PackPlan, PageSpec, PlannedPage } from './learningPack';
import type { MathSpec, TaskPart } from './mathSheets';

/**
 * Echte A4-PDFs für die Lernpakete: Vektorgrafik und eingebettete Schriften, druckerfreundliches Schwarzweiß.
 * Schulschrift: Playwrite DE Grund (Grundschrift), Fließtext: Andika (für Leseanfänger gestaltet). Beide unter OFL.
 */

export interface WorksheetFonts {
  regular: ArrayBuffer | Uint8Array;
  bold: ArrayBuffer | Uint8Array;
  /** Grundschrift für Buchstaben und Wörter zum Nachspuren. */
  school: ArrayBuffer | Uint8Array;
}

const W = 595.28;
const H = 841.89;
const M = 40;
const CW = W - 2 * M;

const BLACK = rgb(0, 0, 0);
const WHITE = rgb(1, 1, 1);
const TRACE = rgb(0.68, 0.68, 0.68);
const MUTED = rgb(0.4, 0.4, 0.4);
const LINE = rgb(0.55, 0.55, 0.55);
const BAND = rgb(0.93, 0.93, 0.93);

/** Maße der Grundschrift relativ zur Schriftgröße (aus der Schriftdatei: Versalhöhe 935, x-Höhe 520, Unterlänge 440 je 1000). */
const CAP = 0.935;
const XH = 0.52;
const DESC = 0.44;

interface Ctx {
  page: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
  school: PDFFont;
}

/** y von oben gemessen in PDF-Koordinaten (von unten) umrechnen. */
const Y = (top: number) => H - top;

// ------------------------------------------------------------- Grundbausteine

function text(c: Ctx, s: string, x: number, top: number, size: number, opts: { font?: PDFFont; color?: RGB; align?: 'left' | 'center' | 'right' } = {}) {
  const font = opts.font ?? c.regular;
  const width = font.widthOfTextAtSize(s, size);
  const dx = opts.align === 'center' ? -width / 2 : opts.align === 'right' ? -width : 0;
  c.page.drawText(s, { x: x + dx, y: Y(top), size, font, color: opts.color ?? BLACK });
  return width;
}

function wrap(s: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of s.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Absatz mit Umbruch, gibt die nächste freie Zeile (von oben) zurück. */
function paragraph(c: Ctx, s: string, x: number, top: number, size: number, width: number, opts: { font?: PDFFont; color?: RGB } = {}): number {
  const lines = wrap(s, opts.font ?? c.regular, size, width);
  lines.forEach((l, i) => text(c, l, x, top + i * size * 1.3, size, opts));
  return top + lines.length * size * 1.3;
}

function hline(c: Ctx, x1: number, x2: number, top: number, opts: { thickness?: number; color?: RGB; dash?: number[] } = {}) {
  c.page.drawLine({
    start: { x: x1, y: Y(top) }, end: { x: x2, y: Y(top) },
    thickness: opts.thickness ?? 0.6, color: opts.color ?? BLACK, dashArray: opts.dash,
  });
}

function roundRect(c: Ctx, x: number, top: number, w: number, h: number, opts: { r?: number; border?: number; dash?: number[]; fill?: RGB; color?: RGB } = {}) {
  const r = opts.r ?? 10;
  c.page.drawSvgPath(
    `M ${r} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h - r} Q ${w} ${h} ${w - r} ${h} L ${r} ${h} Q 0 ${h} 0 ${h - r} L 0 ${r} Q 0 0 ${r} 0 Z`,
    { x, y: Y(top), color: opts.fill, borderColor: opts.color ?? BLACK, borderWidth: opts.border ?? 1, borderDashArray: opts.dash },
  );
}

function box(c: Ctx, x: number, top: number, size: number) {
  c.page.drawRectangle({ x, y: Y(top + size), width: size, height: size, borderColor: BLACK, borderWidth: 1 });
}

/** Strichzeichnung in ein Quadrat zeichnen (Kante `size`, linke obere Ecke x/top). */
function illustration(c: Ctx, id: string | undefined, x: number, top: number, size: number, lineWidth = 2) {
  const ill = id ? ILLUSTRATIONS.get(id) : undefined;
  if (!ill) return;
  const scale = size / 100;
  for (const s of ill.shapes) {
    const fill = s.fill ?? 'white';
    c.page.drawSvgPath(s.d, {
      x, y: Y(top), scale,
      color: fill === 'none' ? undefined : fill === 'black' ? BLACK : WHITE,
      borderColor: s.stroke === false ? undefined : BLACK,
      borderWidth: s.stroke === false ? 0 : (lineWidth * (s.weight ?? 1)) / scale,
      borderLineCap: LineCapStyle.Round,
    });
  }
}

/** Buchstaben als Umriss (weiß gefüllt, schwarz umrandet) zum Ausmalen oder Nachfahren mit dem Finger. */
function outlineText(c: Ctx, s: string, x: number, baselineTop: number, size: number, stroke = 1.6) {
  c.page.pushOperators(pushGraphicsState(), setTextRenderingMode(TextRenderingMode.FillAndOutline), setStrokingRgbColor(0, 0, 0), setLineWidth(stroke));
  c.page.drawText(s, { x, y: Y(baselineTop), size, font: c.school, color: WHITE });
  c.page.pushOperators(popGraphicsState());
}

// ------------------------------------------------------------- Lineatur

/** Vierlinien-Schreibzeile wie in der ersten Klasse: Oberlinie, Mittelband (grau), Grundlinie, Unterlinie. */
function lineature(c: Ctx, x: number, baselineTop: number, width: number, capH: number) {
  const size = capH / CAP;
  const xh = size * XH;
  const desc = size * DESC;
  c.page.drawRectangle({ x, y: Y(baselineTop), width, height: xh, color: BAND });
  hline(c, x, x + width, baselineTop - capH, { color: LINE, thickness: 0.5 });
  hline(c, x, x + width, baselineTop - xh, { color: LINE, thickness: 0.5, dash: [3, 2] });
  hline(c, x, x + width, baselineTop, { thickness: 0.9 });
  hline(c, x, x + width, baselineTop + desc, { color: LINE, thickness: 0.5 });
}

interface TraceItem { text: string; style: 'model' | 'trace' }

/** Eine Schreibzeile: Vorlage schwarz, Nachspur-Buchstaben grau, danach Platz zum Selberschreiben. */
function traceRow(c: Ctx, items: TraceItem[], x: number, baselineTop: number, width: number, capH: number) {
  lineature(c, x, baselineTop, width, capH);
  let size = capH / CAP;
  const gap = capH * 0.9;
  // Lange Wörter verkleinern, damit wenigstens eins in die Zeile passt
  const firstWidth = c.school.widthOfTextAtSize(items[0]?.text ?? '', size);
  if (firstWidth > width - 2 * gap) size *= (width - 2 * gap) / firstWidth;
  let cx = x + capH * 0.35;
  for (const item of items) {
    const w = c.school.widthOfTextAtSize(item.text, size);
    if (cx + w > x + width - 4) break;
    c.page.drawText(item.text, { x: cx, y: Y(baselineTop), size, font: c.school, color: item.style === 'model' ? BLACK : TRACE });
    cx += w + gap;
  }
}

const repeat = (s: string, n: number, style: TraceItem['style'] = 'trace'): TraceItem[] => Array.from({ length: n }, () => ({ text: s, style }));

// ------------------------------------------------------------- Kopf und Fuß

function header(c: Ctx, title: string, instruction: string | undefined, withName: boolean): number {
  const titleWidth = withName ? CW - 200 : CW;
  let size = 24;
  while (c.bold.widthOfTextAtSize(title, size) > titleWidth && size > 14) size -= 1;
  text(c, title, M, 64, size, { font: c.bold });
  if (withName) {
    text(c, 'Name:', W - M - 190, 64, 12, { color: MUTED });
    hline(c, W - M - 150, W - M, 66, { color: LINE });
  }
  return instruction ? paragraph(c, instruction, M, 90, 12.5, CW, { color: BLACK }) : 80;
}

function footer(c: Ctx, plan: PackPlan, page: PlannedPage, index: number, total: number) {
  const kw = getISOWeek(fromDateKey(plan.pack.weekStart));
  const who = page.childName ?? 'für alle';
  text(c, `${plan.title} · KW ${kw} · ${who} · Unsere kleine große Welt`, M, H - 22, 8.5, { color: MUTED });
  text(c, `Seite ${index} von ${total}`, W - M, H - 22, 8.5, { color: MUTED, align: 'right' });
}

// ------------------------------------------------------------- Seiten

function letterIntro(c: Ctx, letter: LetterInfo, ill: string | undefined) {
  const single = letter.upper === letter.lower;
  header(c, single ? `Das ${letter.upper}` : `Das ${letter.upper} und das ${letter.lower}`, 'Male die großen Buchstaben an oder fahre sie mit dem Finger nach. Spure dann die grauen Buchstaben nach und schreibe selbst.', true);
  // Große Umrissbuchstaben
  const pair = single ? letter.upper : `${letter.upper} ${letter.lower}`;
  const maxW = CW - 190;
  let size = 170;
  while (c.school.widthOfTextAtSize(pair, size) > maxW) size -= 5;
  // Umlautpunkte ragen über die Versalhöhe hinaus
  const accent = /[ÄÖÜ]/.test(letter.upper) ? 0.22 : 0;
  // Unterlängen (g, p, ß ...) dürfen nicht in die erste Schreibzeile ragen
  const descender = /[fgjpqyß]/.test(letter.lower) ? DESC : 0;
  size = Math.min(size, 175 / (CAP + accent), 205 / (CAP + accent + descender));
  outlineText(c, pair, M + 6, 128 + size * (CAP + accent), size, 1.8);
  // Bildwort
  if (ill) {
    const x = W - M - 165;
    illustration(c, ill, x + 5, 128, 150, 2.2);
    wordWithInitial(c, letter, x + 80, 312, 28);
  } else {
    wordWithInitial(c, letter, W - M - 90, 300, 28);
  }
  const capH = 30;
  const rows: TraceItem[][] = [
    ...(single ? [] : [
      [{ text: letter.upper, style: 'model' as const }, ...repeat(letter.upper, 12)],
      [{ text: letter.upper, style: 'model' as const }, ...repeat(letter.upper, 2)],
    ]),
    [{ text: letter.lower, style: 'model' }, ...repeat(letter.lower, 12)],
    [{ text: letter.lower, style: 'model' }, ...repeat(letter.lower, 2)],
    [{ text: letter.word, style: 'model' }, ...repeat(letter.word, 3)],
    [],
    ...(single ? [[{ text: letter.word, style: 'model' as const }, ...repeat(letter.word, 3)], []] : []),
  ];
  rows.forEach((items, i) => traceRow(c, items, M, 384 + i * 76, CW, capH));
}

/** ß und CH stehen fast nie am Wortanfang, dort fragen die Blätter nach dem Laut im Wort. */
const startsWords = (letter: LetterInfo) => letter.word.toUpperCase().startsWith(letter.upper);

/** Bildwort in Schulschrift, Anfangsbuchstabe unterstrichen. */
function wordWithInitial(c: Ctx, letter: LetterInfo, centerX: number, baselineTop: number, maxSize: number, maxWidth = 160) {
  const size = Math.min(maxSize, (maxSize * maxWidth) / c.school.widthOfTextAtSize(letter.word, maxSize));
  const width = c.school.widthOfTextAtSize(letter.word, size);
  const x = centerX - width / 2;
  c.page.drawText(letter.word, { x, y: Y(baselineTop), size, font: c.school, color: BLACK });
  // Den Buchstaben im Wort unterstreichen (bei Drache das ch, bei Fuß das ß)
  const at = Math.max(0, letter.word.toLowerCase().indexOf(letter.lower));
  const before = c.school.widthOfTextAtSize(letter.word.slice(0, at), size);
  const iw = c.school.widthOfTextAtSize(letter.word.slice(at, at + letter.lower.length), size);
  hline(c, x + before, x + before + iw, baselineTop + 5, { thickness: 2 });
}

function letterHunt(c: Ctx, spec: Extract<PageSpec, { kind: 'letter-hunt' }>) {
  const { letter, grid } = spec;
  header(c, `Finde das ${letter.upper}`, letter.upper === letter.lower ? `Kreise jedes ${letter.upper} ein.` : `Kreise jedes ${letter.upper} und jedes ${letter.lower} ein.`, true);
  const top = 112;
  const rows = grid.length;
  const cols = grid[0].length;
  const cellW = CW / cols;
  const cellH = 46;
  roundRect(c, M, top, CW, rows * cellH + 8, { color: LINE, border: 0.8 });
  grid.forEach((row, r) => row.forEach((token, col) => {
    const size = token.length > 2 ? 26 : 32;
    const w = c.school.widthOfTextAtSize(token, size);
    c.page.drawText(token, { x: M + col * cellW + (cellW - w) / 2, y: Y(top + 4 + r * cellH + cellH * 0.72), size, font: c.school, color: BLACK });
  }));
  const after = top + rows * cellH + 8;
  text(c, 'So viele habe ich gefunden:', M, after + 34, 13);
  hline(c, M + 175, M + 235, after + 36, { color: LINE });

  const picturesTop = after + 72;
  if (spec.pictures.length) {
    text(c, `Welche Bilder fangen mit ${letter.upper} an? Male sie an.`, M, picturesTop, 14, { font: c.bold });
    pictureGrid(c, spec.pictures.map((p) => p.id), picturesTop + 14, 3, 140);
  } else {
    text(c, startsWords(letter) ? `Male drei Dinge, die mit ${letter.upper} anfangen.` : `Male drei Dinge, in denen man ${letter.lower} hört.`, M, picturesTop, 14, { font: c.bold });
    const w = (CW - 20) / 3;
    for (let i = 0; i < 3; i++) roundRect(c, M + i * (w + 10), picturesTop + 14, w, 260, { color: LINE });
  }
}

/** Bilderraster mit Rahmen und kleinem Wort (zum Vorlesen für die Eltern). */
function pictureGrid(c: Ctx, ids: string[], top: number, cols: number, cellH: number) {
  const gap = 10;
  const w = (CW - gap * (cols - 1)) / cols;
  ids.forEach((id, i) => {
    const x = M + (i % cols) * (w + gap);
    const t = top + Math.floor(i / cols) * (cellH + gap);
    roundRect(c, x, t, w, cellH, { color: LINE, border: 0.8 });
    const size = cellH - 34;
    illustration(c, id, x + (w - size) / 2, t + 6, size, 1.8);
    text(c, ILLUSTRATIONS.get(id)?.word ?? '', x + w / 2, t + cellH - 10, 10, { color: MUTED, align: 'center' });
  });
}

function syllables(c: Ctx, spec: Extract<PageSpec, { kind: 'syllables' }>) {
  const first = spec.syllables[0];
  header(c, 'Laute verbinden', `Sprich die Laute langsam: ${first[0].toLowerCase().repeat(3)} und ${first[1].toLowerCase().repeat(3)} wird ${first}. Fahre den Bogen nach, lies die Silbe und spure sie dann nach.`, true);
  spec.syllables.forEach((syl, i) => {
    const top = 140 + i * 130;
    const base = top + 62;
    const size = 54;
    const [a, b] = [syl[0], syl.slice(1)];
    const ax = M + 6;
    const bx = M + 86;
    c.page.drawText(a, { x: ax, y: Y(base), size, font: c.school, color: BLACK });
    c.page.drawText(b, { x: bx, y: Y(base), size, font: c.school, color: BLACK });
    // Lautbogen gestrichelt zum Nachfahren
    const aw = c.school.widthOfTextAtSize(a, size);
    const bw = c.school.widthOfTextAtSize(b, size);
    const x1 = ax + aw / 2;
    const x2 = bx + bw / 2;
    c.page.drawSvgPath(`M 0 0 Q ${(x2 - x1) / 2} 34 ${x2 - x1} 0`, {
      x: x1, y: Y(base + 14), borderColor: BLACK, borderWidth: 1.6, borderDashArray: [4, 3],
    });
    traceRow(c, [{ text: syl, style: 'model' }, ...repeat(syl, 6)], M + 180, base + 4, CW - 180, 30);
  });
}

function wordTrace(c: Ctx, spec: Extract<PageSpec, { kind: 'word-trace' }>) {
  const { letter, name, illustration: ill } = spec;
  header(c, 'Wörter schreiben', 'Spure das Wort und deinen Namen nach. Danach schreibst du selbst.', true);
  if (ill) illustration(c, ill, W - M - 120, 112, 115, 2);
  text(c, letter.word, M + 4, 200, 56, { font: c.school });
  const capH = 30;
  traceRow(c, [{ text: letter.word, style: 'model' }, ...repeat(letter.word, 4)], M, 300, CW, capH);
  traceRow(c, repeat(letter.word, 4), M, 376, CW, capH);
  text(c, 'Mein Name', M, 430, 13, { font: c.bold });
  traceRow(c, [{ text: name, style: 'model' }, ...repeat(name, 4)], M, 494, CW, capH);
  traceRow(c, [], M, 570, CW, capH);
  text(c, startsWords(letter) ? `Male etwas, das mit ${letter.upper} anfängt.` : `Male etwas, in dem man ${letter.lower} hört.`, M, 628, 13, { font: c.bold });
  roundRect(c, M, 640, CW, 160, { color: LINE });
}

function counting(c: Ctx, spec: Extract<PageSpec, { kind: 'counting' }>) {
  header(c, 'Wie viele sind es?', 'Zähle die Bilder. Kreise die richtige Zahl ein.', true);
  spec.rows.forEach((row, i) => {
    const top = 116 + i * 136;
    roundRect(c, M, top, CW, 124, { color: LINE, border: 0.8 });
    const size = 56;
    for (let k = 0; k < row.count; k++) illustration(c, row.illustration, M + 12 + k * 62, top + 34, size, 1.6);
    for (let n = 1; n <= 5; n++) {
      const cx = M + 345 + (n - 1) * 36;
      c.page.drawCircle({ x: cx, y: Y(top + 62), size: 15, borderColor: LINE, borderWidth: 0.8 });
      text(c, String(n), cx, top + 69, 20, { font: c.bold, align: 'center' });
    }
  });
}

function syllableOnset(c: Ctx, spec: Extract<PageSpec, { kind: 'syllable-onset' }>) {
  const instruction = spec.onset
    ? `Sprecht jedes Wort und klatscht dazu. Male für jede Silbe einen Kreis an. Hörst du am Anfang „${spec.letter.upper}“? Dann male auch das Kästchen an.`
    : 'Sprecht jedes Wort und klatscht dazu. Male für jede Silbe einen Kreis an.';
  const top = header(c, 'Silben klatschen', instruction, true) + 12;
  const cols = 3;
  const gap = 10;
  const w = (CW - gap * 2) / cols;
  const cellH = Math.min(330, (H - 40 - top - gap) / 2);
  spec.pictures.forEach((id, i) => {
    const x = M + (i % cols) * (w + gap);
    const t = top + Math.floor(i / cols) * (cellH + gap);
    roundRect(c, x, t, w, cellH, { color: LINE, border: 0.8 });
    illustration(c, id, x + (w - 120) / 2, t + 14, 120, 1.8);
    text(c, ILLUSTRATIONS.get(id)?.word ?? '', x + w / 2, t + 158, 11, { color: MUTED, align: 'center' });
    for (let k = 0; k < 3; k++) c.page.drawCircle({ x: x + w / 2 + (k - 1) * 40, y: Y(t + 196), size: 14, borderColor: BLACK, borderWidth: 1.2 });
    if (spec.onset) {
      text(c, spec.letter.upper, x + w / 2 - 16, t + 258, 22, { font: c.bold, align: 'right' });
      box(c, x + w / 2 - 4, t + 236, 26);
    }
  });
}

function coloring(c: Ctx, spec: Extract<PageSpec, { kind: 'coloring' }>) {
  const ill = ILLUSTRATIONS.get(spec.illustration);
  header(c, `Ausmalbild: ${ill?.word ?? ''}`, 'Male mit Wachsmalstiften an oder klebe bunte Papierschnipsel auf.', true);
  const size = 470;
  illustration(c, spec.illustration, (W - size) / 2, 130, size, 4.5);
  if (ill) {
    const s = 70;
    const w = c.school.widthOfTextAtSize(ill.word, s);
    outlineText(c, ill.word, (W - w) / 2, 720, s, 1.6);
  }
}

const PLAYER_HINT: Record<string, string> = {
  toddler: 'sucht gleiche Bilder',
  preschool: 'klatscht die Silben',
  letters: 'sagt den Anfangslaut',
};

function memory(c: Ctx, spec: Extract<PageSpec, { kind: 'memory' }>) {
  const hints = spec.players.map((p) => `${p.name} ${PLAYER_HINT[p.track] ?? 'spielt mit'}.`).join(' ');
  const top = header(c, 'Memory für alle', `Karten ausschneiden, umdrehen und Paare suchen. ${hints}`, false) + 14;
  const cols = 3;
  const rows = 4;
  const cw = 165;
  const ch = Math.min(160, (H - 46 - top) / rows);
  const x0 = (W - cols * cw) / 2;
  const dash = [5, 4];
  for (let r = 0; r <= rows; r++) hline(c, x0, x0 + cols * cw, top + r * ch, { dash, color: MUTED });
  for (let col = 0; col <= cols; col++) {
    c.page.drawLine({ start: { x: x0 + col * cw, y: Y(top) }, end: { x: x0 + col * cw, y: Y(top + rows * ch) }, thickness: 0.6, color: MUTED, dashArray: dash });
  }
  spec.cards.slice(0, cols * rows).forEach((id, i) => {
    const x = x0 + (i % cols) * cw;
    const t = top + Math.floor(i / cols) * ch;
    const size = ch - 50;
    illustration(c, id, x + (cw - size) / 2, t + 8, size, 1.8);
    const word = ILLUSTRATIONS.get(id)?.word ?? '';
    const ws = 22;
    const ww = c.school.widthOfTextAtSize(word, ws);
    c.page.drawText(word, { x: x + (cw - ww) / 2, y: Y(t + ch - 14), size: ws, font: c.school, color: BLACK });
  });
}

const LEVEL_COLUMNS = [['selbst-', 'ständig'], ['mit wenig', 'Hilfe'], ['mit viel', 'Hilfe'], ['noch', 'nicht'], ['nicht', 'beurteilt']];

function observation(c: Ctx, spec: Extract<PageSpec, { kind: 'observation' }>) {
  let top = header(c, 'Beobachtungsbogen', 'Nach dem Lernen kurz ankreuzen und danach in der App eintragen: Eltern › Lesepfad oder Rechenpfad. Ein einzelnes Blatt entscheidet nichts, erst mehrere Beobachtungen an verschiedenen Tagen.', false);
  text(c, 'Datum:', M, top + 16, 12, { color: MUTED });
  hline(c, M + 44, M + 180, top + 18, { color: LINE });
  top += 40;
  const goalW = 235;
  const colW = (CW - goalW) / LEVEL_COLUMNS.length;
  for (const row of spec.rows) {
    text(c, row.name, M, top + 14, 15, { font: c.bold });
    top += 24;
    LEVEL_COLUMNS.forEach(([a, b], i) => {
      const cx = M + goalW + i * colW + colW / 2;
      text(c, a, cx, top + 10, 8.5, { color: MUTED, align: 'center' });
      text(c, b, cx, top + 20, 8.5, { color: MUTED, align: 'center' });
    });
    top += 26;
    for (const goal of row.goals) {
      hline(c, M, W - M, top, { color: LINE, thickness: 0.4 });
      const lines = wrap(goal, c.regular, 10.5, goalW - 8);
      lines.forEach((l, i) => text(c, l, M, top + 15 + i * 12, 10.5));
      const h = Math.max(24, lines.length * 12 + 10);
      LEVEL_COLUMNS.forEach((_, i) => box(c, M + goalW + i * colW + colW / 2 - 6, top + h / 2 - 6, 12));
      top += h;
    }
    hline(c, M, W - M, top, { color: LINE, thickness: 0.4 });
    top += 20;
    text(c, 'Stimmung:', M, top, 10.5, { color: MUTED });
    ['Hat Spaß gemacht', 'War okay', 'Heute keine Lust'].forEach((label, i) => {
      const x = M + 70 + i * 125;
      box(c, x, top - 10, 12);
      text(c, label, x + 18, top, 10.5);
    });
    top += 24;
    text(c, 'Notiz:', M, top, 10.5, { color: MUTED });
    hline(c, M + 40, W - M, top + 2, { color: LINE });
    top += 30;
  }
}

function renderPage(c: Ctx, spec: PageSpec) {
  switch (spec.kind) {
    case 'letter-intro': return letterIntro(c, spec.letter, spec.illustration);
    case 'letter-hunt': return letterHunt(c, spec);
    case 'syllables': return syllables(c, spec);
    case 'word-trace': return wordTrace(c, spec);
    case 'counting': return counting(c, spec);
    case 'syllable-onset': return syllableOnset(c, spec);
    case 'coloring': return coloring(c, spec);
    case 'memory': return memory(c, spec);
    case 'observation': return observation(c, spec);
    case 'math': return mathPage(c, spec.title, spec.math);
    case 'math-memory': return mathMemory(c, spec.heading, spec.cards);
  }
}

// ------------------------------------------------------------- Rechenblätter

const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
};

/** Würfelbild in einem Quadrat (linke obere Ecke x/top). */
function dice(c: Ctx, k: number, x: number, top: number, size: number) {
  roundRect(c, x, top, size, size, { r: size * 0.16, border: 1.4 });
  const step = size * 0.28;
  for (const [col, row] of PIPS[k] ?? []) {
    c.page.drawCircle({ x: x + size * 0.22 + col * step, y: Y(top + size * 0.22 + row * step), size: size * 0.085, color: BLACK });
  }
}

/** Zehnerfeld (2 × 5); die ersten `filled` Kreise sind ausgemalt. */
function tenFrame(c: Ctx, x: number, top: number, cell: number, filled = 0) {
  for (let i = 0; i < 10; i++) {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const cx = x + col * cell;
    const ct = top + row * cell;
    c.page.drawRectangle({ x: cx, y: Y(ct + cell), width: cell, height: cell, borderColor: BLACK, borderWidth: 0.9 });
    c.page.drawCircle({ x: cx + cell / 2, y: Y(ct + cell / 2), size: cell * 0.34, borderColor: BLACK, borderWidth: 0.9, color: i < filled ? BLACK : undefined });
  }
  // Fünferlinie betonen (Kraft der Fünf)
  c.page.drawLine({ start: { x: x + 5 * cell, y: Y(top) }, end: { x: x + 5 * cell, y: Y(top + 2 * cell) }, thickness: 1.6, color: BLACK });
}

/** Aufgabenzeile: Text und leere Kästchen nebeneinander. Gibt die Breite zurück. */
function taskRow(c: Ctx, parts: TaskPart[], x: number, baselineTop: number, size: number, draw = true): number {
  const boxW = size * 2;
  const boxH = size * 1.5;
  let cx = x;
  for (const p of parts) {
    if (p === null) {
      if (draw) c.page.drawRectangle({ x: cx, y: Y(baselineTop + size * 0.38), width: boxW, height: boxH, borderColor: BLACK, borderWidth: 0.9 });
      cx += boxW + size * 0.35;
    } else {
      const w = c.regular.widthOfTextAtSize(p, size);
      if (draw) c.page.drawText(p, { x: cx, y: Y(baselineTop), size, font: c.regular, color: BLACK });
      cx += w + size * 0.35;
    }
  }
  return cx - x;
}

function mathPage(c: Ctx, title: string, spec: MathSpec) {
  switch (spec.kind) {
    case 'dice-match': return diceMatch(c, title, spec);
    case 'digit-trace': return digitTrace(c, title, spec);
    case 'ten-frame': return tenFramePage(c, title, spec);
    case 'number-house': return numberHouses(c, title, spec);
    case 'packets': return packetsPage(c, spec);
    case 'number-wall': return numberWalls(c, title, spec);
    case 'times-row': return timesRow(c, title, spec);
  }
}

function diceMatch(c: Ctx, title: string, spec: Extract<MathSpec, { kind: 'dice-match' }>) {
  header(c, title, 'Verbinde jedes Würfelbild mit der passenden Zahl.', true);
  const size = 62;
  spec.dice.forEach((k, i) => {
    const top = 122 + i * 84;
    dice(c, k, M + 40, top, size);
    c.page.drawCircle({ x: M + 40 + size + 18, y: Y(top + size / 2), size: 4, color: BLACK });
    const d = String(spec.digits[i]);
    c.page.drawCircle({ x: W - M - 110, y: Y(top + size / 2), size: 4, color: BLACK });
    text(c, d, W - M - 70, top + size / 2 + 15, 42, { font: c.bold, align: 'center' });
  });
  let top = 122 + spec.dice.length * 84 + 10;
  text(c, 'Wo sind mehr Punkte? Kreise das Würfelbild ein.', M, top, 14, { font: c.bold });
  top += 16;
  const s = 52;
  spec.compare.forEach(([a, b], i) => {
    const x = M + i * (CW / 3) + (CW / 3 - (2 * s + 18)) / 2;
    dice(c, a, x, top, s);
    dice(c, b, x + s + 18, top, s);
  });
  top += s + 34;
  text(c, 'Male so viele Punkte, wie die Zahl sagt.', M, top, 14, { font: c.bold });
  top += 12;
  const w = (CW - 20) / 3;
  spec.dice.slice(0, 3).forEach((k, i) => {
    const x = M + i * (w + 10);
    roundRect(c, x, top, w, H - 46 - top, { color: LINE, border: 0.8 });
    text(c, String(k), x + 12, top + 30, 26, { font: c.bold });
  });
}

function digitTrace(c: Ctx, title: string, spec: Extract<MathSpec, { kind: 'digit-trace' }>) {
  header(c, title, 'Spure die grauen Zahlen nach und schreibe dann selbst. Links siehst du, wie viele das sind.', true);
  const box = 14.17; // 5 mm Rechenkaro
  const gridX = M + 96;
  const cols = Math.floor((W - M - gridX) / box);
  const rowH = 66;
  spec.digits.forEach((d, i) => {
    const top = 116 + i * rowH;
    tenFrame(c, M, top + 4, 15, d);
    // zwei Kästchen hohe Schreibzeile auf Rechenkaro
    for (let r = 0; r <= 3; r++) hline(c, gridX, gridX + cols * box, top + r * box, { color: LINE, thickness: 0.4 });
    for (let k = 0; k <= cols; k++) {
      c.page.drawLine({ start: { x: gridX + k * box, y: Y(top) }, end: { x: gridX + k * box, y: Y(top + 3 * box) }, thickness: 0.4, color: LINE });
    }
    // Ziffer zwei Kästchen hoch in den unteren beiden Reihen, alle drei Kästchen eine
    const size = (2 * box * 0.9) / CAP;
    const baseline = top + 3 * box - 1;
    for (let k = 0; k < 5; k++) {
      const str = String(d);
      const w = c.school.widthOfTextAtSize(str, size);
      c.page.drawText(str, { x: gridX + k * 3 * box + 1.5 * box - w / 2, y: Y(baseline), size, font: c.school, color: k === 0 ? BLACK : TRACE });
    }
  });
}

function tenFramePage(c: Ctx, title: string, spec: Extract<MathSpec, { kind: 'ten-frame' }>) {
  header(c, title, 'Male so viele Kreise an, wie die Zahl sagt. Wie viele fehlen bis 10? Das ist die verliebte Zahl.', true);
  const cell = 30;
  spec.numbers.forEach((n, i) => {
    const x = M + (i % 2) * (CW / 2);
    const top = 128 + Math.floor(i / 2) * 210;
    roundRect(c, x, top, CW / 2 - 12, 190, { color: LINE, border: 0.8 });
    text(c, String(n), x + 22, top + 52, 40, { font: c.bold });
    tenFrame(c, x + 70, top + 18, cell, 0);
    taskRow(c, [`${n} +`, null, '= 10'], x + 22, top + 130, 20);
    taskRow(c, ['10 =', null, '+', null], x + 22, top + 172, 20);
  });
}

function numberHouses(c: Ctx, title: string, spec: Extract<MathSpec, { kind: 'number-house' }>) {
  header(c, title, 'In jedem Stockwerk ergeben die zwei Zahlen zusammen die Zahl im Dach. Fülle die leeren Fenster aus.', true);
  const gap = 18;
  const w = (CW - gap * (spec.houses.length - 1)) / spec.houses.length;
  const rowH = Math.min(30, (H - 60 - 200) / Math.max(...spec.houses.map((h) => h.rows.length)));
  spec.houses.forEach((house, i) => {
    const x = M + i * (w + gap);
    const top = 130;
    c.page.drawSvgPath(`M 0 60 L ${w / 2} 0 L ${w} 60 Z`, { x, y: Y(top), borderColor: BLACK, borderWidth: 1.4, color: WHITE });
    text(c, String(house.top), x + w / 2, top + 50, 26, { font: c.bold, align: 'center' });
    house.rows.forEach((row, r) => {
      const t = top + 60 + r * rowH;
      row.forEach((v, k) => {
        c.page.drawRectangle({ x: x + k * (w / 2), y: Y(t + rowH), width: w / 2, height: rowH, borderColor: BLACK, borderWidth: 1 });
        if (v !== null) text(c, String(v), x + k * (w / 2) + w / 4, t + rowH * 0.7, rowH * 0.6, { align: 'center' });
      });
    });
  });
}

function packetsPage(c: Ctx, spec: Extract<MathSpec, { kind: 'packets' }>) {
  let top = header(c, spec.heading, spec.instruction, true) + 10;
  if (spec.help) {
    text(c, 'Zum Legen und Malen:', M, top + 14, 11, { color: MUTED });
    tenFrame(c, M + 120, top, 18, 0);
    if (spec.help === 'twenty') tenFrame(c, M + 120 + 5 * 18 + 16, top, 18, 0);
    top += 2 * 18 + 22;
  }
  const size = 17;
  const widest = Math.max(...spec.tasks.map((t) => taskRow(c, t, 0, 0, size, false)));
  const cols = widest > CW / 3 - 12 ? 2 : 3;
  const colW = CW / cols;
  const rows = Math.ceil(spec.tasks.length / cols);
  const rowH = Math.min(46, (H - 50 - top) / rows);
  spec.tasks.forEach((t, i) => {
    const col = Math.floor(i / rows);
    const row = i % rows;
    taskRow(c, t, M + col * colW, top + 26 + row * rowH, size);
  });
}

function numberWalls(c: Ctx, title: string, spec: Extract<MathSpec, { kind: 'number-wall' }>) {
  header(c, title, 'Zwei Steine nebeneinander ergeben zusammen den Stein darüber.', true);
  const bw = 66;
  const bh = 34;
  spec.walls.forEach((wall, i) => {
    const x0 = M + (i % 2) * (CW / 2) + (CW / 2 - 3 * bw) / 2;
    const base = 130 + Math.floor(i / 2) * 220 + 3 * bh;
    wall.forEach((row, level) => {
      row.forEach((v, k) => {
        const x = x0 + level * (bw / 2) + k * bw;
        const top = base - (level + 1) * bh;
        c.page.drawRectangle({ x, y: Y(top + bh), width: bw, height: bh, borderColor: BLACK, borderWidth: 1.1 });
        if (v !== null) text(c, String(v), x + bw / 2, top + bh * 0.7, 17, { align: 'center' });
      });
    });
  });
}

const CORE_ROWS = new Set([1, 2, 5, 10]);

function timesRow(c: Ctx, title: string, spec: Extract<MathSpec, { kind: 'times-row' }>) {
  const n = spec.n;
  header(c, title, spec.withDiv
    ? 'Rechne die Malaufgabe. Rechts steht die passende Geteiltaufgabe: Sie hat dieselben Zahlen.'
    : 'Rechne. Fett gedruckt sind die Kernaufgaben, aus ihnen kannst du die anderen ableiten.', true);
  let top = 122;
  text(c, `Zähle in ${n}er-Schritten:`, M, top + 6, 13, { font: c.bold });
  top += 18;
  const bw = CW / 10;
  spec.skip.forEach((v, i) => {
    c.page.drawRectangle({ x: M + i * bw, y: Y(top + 32), width: bw, height: 32, borderColor: BLACK, borderWidth: 0.9 });
    if (v !== null) text(c, String(v), M + i * bw + bw / 2, top + 23, 15, { align: 'center' });
  });
  top += 70;
  const size = 18;
  const rowH = 46;
  for (let k = 1; k <= 10; k++) {
    const t = top + (k - 1) * rowH;
    const core = CORE_ROWS.has(k);
    const label = `${k} · ${n} =`;
    c.page.drawText(label, { x: M, y: Y(t), size, font: core ? c.bold : c.regular, color: BLACK });
    taskRow(c, [null], M + c.bold.widthOfTextAtSize(label, size) + 8, t, size);
    const right = spec.withDiv ? `${k * n} : ${n} =` : `${n} · ${k} =`;
    taskRow(c, [right, null], M + CW / 2 + 10, t, size);
  }
  const tip = top + 10 * rowH + 4;
  if (tip < H - 60 && n > 2) text(c, `Tipp: 6 · ${n} ist 5 · ${n} und noch einmal ${n}. 9 · ${n} ist 10 · ${n} minus ${n}.`, M, tip, 11.5, { color: MUTED });
}

function mathMemory(c: Ctx, heading: string, cards: string[]) {
  const top = header(c, `Rechen-Memory: ${heading}`, 'Karten ausschneiden, umdrehen und Paare suchen. Wer ein Paar findet, sagt laut, warum es zusammengehört.', false) + 14;
  const cols = 3;
  const rows = 4;
  const cw = 165;
  const ch = Math.min(160, (H - 46 - top) / rows);
  const x0 = (W - cols * cw) / 2;
  const dash = [5, 4];
  for (let r = 0; r <= rows; r++) hline(c, x0, x0 + cols * cw, top + r * ch, { dash, color: MUTED });
  for (let col = 0; col <= cols; col++) {
    c.page.drawLine({ start: { x: x0 + col * cw, y: Y(top) }, end: { x: x0 + col * cw, y: Y(top + rows * ch) }, thickness: 0.6, color: MUTED, dashArray: dash });
  }
  cards.slice(0, cols * rows).forEach((card, i) => {
    const x = x0 + (i % cols) * cw;
    const t = top + Math.floor(i / cols) * ch;
    const [kind, value] = card.split(':');
    if (kind === 'dice' && value) dice(c, Number(value), x + (cw - 80) / 2, t + (ch - 80) / 2, 80);
    else if (kind === 'frame' && value) tenFrame(c, x + (cw - 125) / 2, t + (ch - 50) / 2, 25, Number(value));
    else {
      let size = 40;
      while (c.bold.widthOfTextAtSize(card, size) > cw - 24) size -= 2;
      text(c, card, x + cw / 2, t + ch / 2 + size * 0.35, size, { font: c.bold, align: 'center' });
    }
  });
}

export async function renderWorksheets(plan: PackPlan, pages: PlannedPage[], fonts: WorksheetFonts): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`Lernpaket ${plan.title}`);
  doc.setAuthor('Unsere kleine große Welt');
  doc.setLanguage('de-DE');
  const [regular, bold, school] = await Promise.all([
    doc.embedFont(fonts.regular, { subset: true }),
    doc.embedFont(fonts.bold, { subset: true }),
    doc.embedFont(fonts.school, { subset: true }),
  ]);
  pages.forEach((p, i) => {
    const page = doc.addPage([W, H]);
    const c: Ctx = { page, regular, bold, school };
    renderPage(c, p.spec);
    footer(c, plan, p, i + 1, pages.length);
  });
  return doc.save();
}

/** Schriften im Browser laden (liegen im App-Ordner fonts/ und sind offline zwischengespeichert). */
export async function loadWorksheetFonts(): Promise<WorksheetFonts> {
  const get = async (name: string) => {
    const res = await fetch(`fonts/${name}`);
    if (!res.ok) throw new Error('Die Schriften für die Arbeitsblätter konnten nicht geladen werden.');
    return res.arrayBuffer();
  };
  const [regular, bold, school] = await Promise.all([get('andika-regular.ttf'), get('andika-bold.ttf'), get('grundschrift.ttf')]);
  return { regular, bold, school };
}

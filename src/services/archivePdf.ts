import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb, type PDFFont, type PDFImage, type PDFPage, type RGB } from 'pdf-lib';
import type { Member } from '../types';
import { formatLong } from '../utils/dates';
import { ARCHIVE_KIND, byMonth, monthLabel, type ArchiveItem, type YearReview } from './archive';
import type { WorksheetFonts } from './worksheetPdf';

/**
 * Lesbarer Export des Familienarchivs: ein A4-Buch mit Titelseite, Jahresrückblick in Zahlen
 * und allen Einträgen nach Monaten, mit bis zu vier Fotos je Eintrag. Zum Ausdrucken oder Aufheben.
 */

const W = 595.28;
const H = 841.89;
const M = 48;
const CW = W - 2 * M;
const BOTTOM = H - 60;
const BLACK = rgb(0.13, 0.13, 0.13);
const MUTED = rgb(0.42, 0.42, 0.42);
const ACCENT = rgb(0.55, 0.36, 0.2);
const RULE = rgb(0.82, 0.78, 0.72);
export const PHOTOS_PER_ITEM = 4;

const Y = (top: number) => H - top;

interface Book {
  doc: PDFDocument;
  regular: PDFFont;
  bold: PDFFont;
  page: PDFPage;
  top: number;
  images: Map<string, PDFImage | null>;
}

function clean(s: string, font: PDFFont): string {
  const chars = new Set(font.getCharacterSet());
  return Array.from(s).filter((ch) => chars.has(ch.codePointAt(0)!)).join('').replace(/[ \t]+/g, ' ').trim();
}

function wrap(s: string, font: PDFFont, size: number, width: number): string[] {
  const out: string[] = [];
  for (const para of s.split('\n')) {
    let line = '';
    for (const w of clean(para, font).split(' ').filter(Boolean)) {
      const next = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(next, size) > width && line) { out.push(line); line = w; } else line = next;
    }
    if (line) out.push(line);
  }
  return out;
}

function newPage(b: Book) {
  b.page = b.doc.addPage([W, H]);
  b.top = M;
}

function ensure(b: Book, height: number) {
  if (b.top + height > BOTTOM) newPage(b);
}

function line(b: Book, s: string, size: number, opts: { font?: PDFFont; color?: RGB; x?: number } = {}) {
  const font = opts.font ?? b.regular;
  b.page.drawText(clean(s, font), { x: opts.x ?? M, y: Y(b.top + size), size, font, color: opts.color ?? BLACK });
  b.top += size * 1.4;
}

function para(b: Book, s: string, size: number, opts: { font?: PDFFont; color?: RGB; indent?: number } = {}) {
  const font = opts.font ?? b.regular;
  const indent = opts.indent ?? 0;
  for (const l of wrap(s, font, size, CW - indent)) {
    ensure(b, size * 1.4);
    line(b, l, size, { ...opts, x: M + indent });
  }
}

function centered(b: Book, s: string, size: number, top: number, font: PDFFont, color: RGB = BLACK) {
  const t = clean(s, font);
  b.page.drawText(t, { x: (W - font.widthOfTextAtSize(t, size)) / 2, y: Y(top + size), size, font, color });
}

/** Daten-URL (JPEG oder PNG) einbetten; kaputte Bilder werden still übersprungen. */
async function image(b: Book, dataUrl: string): Promise<PDFImage | null> {
  if (b.images.has(dataUrl)) return b.images.get(dataUrl)!;
  let img: PDFImage | null = null;
  try {
    const m = /^data:image\/(jpeg|jpg|png);base64,(.*)$/.exec(dataUrl);
    if (m) {
      const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
      img = m[1] === 'png' ? await b.doc.embedPng(bytes) : await b.doc.embedJpg(bytes);
    }
  } catch { img = null; }
  b.images.set(dataUrl, img);
  return img;
}

/** Fotos in einer Reihe, jedes in ein gleich großes Feld eingepasst. */
async function photoRow(b: Book, photos: string[], height: number) {
  const imgs = (await Promise.all(photos.map((p) => image(b, p)))).filter((x): x is PDFImage => !!x);
  if (!imgs.length) return;
  ensure(b, height + 10);
  const gap = 10;
  const cell = (CW - gap * (imgs.length - 1)) / imgs.length;
  imgs.forEach((img, i) => {
    const s = Math.min(cell / img.width, height / img.height);
    const w = img.width * s;
    const h = img.height * s;
    const x = M + i * (cell + gap) + (cell - w) / 2;
    b.page.drawImage(img, { x, y: Y(b.top + h), width: w, height: h });
  });
  b.top += height + 10;
}

function cover(b: Book, title: string, subtitle: string) {
  centered(b, 'Unsere kleine große Welt', 14, 120, b.regular, MUTED);
  centered(b, title, 34, 150, b.bold, ACCENT);
  centered(b, subtitle, 14, 205, b.regular, MUTED);
}

async function coverPhotos(b: Book, photos: string[]) {
  const imgs = (await Promise.all(photos.slice(0, 4).map((p) => image(b, p)))).filter((x): x is PDFImage => !!x);
  if (!imgs.length) return;
  const cols = imgs.length === 1 ? 1 : 2;
  const rows = Math.ceil(imgs.length / cols);
  const gap = 12;
  const boxW = (CW - gap * (cols - 1)) / cols;
  const boxH = Math.min(240, (470 - gap * (rows - 1)) / rows);
  imgs.forEach((img, i) => {
    const s = Math.min(boxW / img.width, boxH / img.height);
    const w = img.width * s;
    const h = img.height * s;
    const x = M + (i % cols) * (boxW + gap) + (boxW - w) / 2;
    const top = 270 + Math.floor(i / cols) * (boxH + gap) + (boxH - h) / 2;
    b.page.drawImage(img, { x, y: Y(top + h), width: w, height: h });
  });
}

function reviewPages(b: Book, r: YearReview) {
  newPage(b);
  line(b, `Unser Jahr ${r.year} in Zahlen`, 22, { font: b.bold, color: ACCENT });
  b.top += 6;
  for (const c of r.counts) line(b, `${ARCHIVE_KIND.get(c.kind)?.label ?? c.kind}: ${c.count}`, 13);
  if (r.photos) line(b, `Fotos: ${r.photos}`, 13);
  for (const cy of r.children) {
    ensure(b, 90);
    b.top += 14;
    line(b, cy.child.name, 18, { font: b.bold, color: ACCENT });
    const facts = [
      cy.mamaTimes ? `${cy.mamaTimes}× Mama-Zeit` : '',
      cy.papaTimes ? `${cy.papaTimes}× Papa-Zeit` : '',
      cy.stamps ? `${cy.stamps} Stempel im Weltentdeckerpass` : '',
    ].filter(Boolean);
    if (facts.length) para(b, facts.join(' · '), 12);
    if (cy.learned.length) para(b, `Neu gelernt: ${cy.learned.join(', ')}`, 12);
    if (cy.projects.length) para(b, `Projekte: ${cy.projects.join(', ')}`, 12);
    if (cy.savings.length) para(b, `Sparziele erreicht: ${cy.savings.join(', ')}`, 12);
    for (const q of cy.quotes.slice(0, 6)) para(b, `„${q.text}“ (${formatLong(q.date)})`, 12, { color: MUTED, indent: 12 });
  }
}

const photoHeight = (n: number) => (n === 0 ? 0 : n === 1 ? 220 : n === 2 ? 180 : 130);

async function entry(b: Book, i: ArchiveItem, members: Member[]) {
  const kind = ARCHIVE_KIND.get(i.kind)?.label ?? '';
  const quotes = i.quotes.map((q) => {
    const who = q.memberId ? members.find((m) => m.id === q.memberId)?.name : undefined;
    return `${who ? `${who}: ` : ''}„${q.text}“`;
  });
  const names = i.memberIds.map((id) => members.find((m) => m.id === id)).filter((m): m is Member => !!m);
  const kids = members.filter((m) => m.active && m.role === 'child');
  const everyKid = kids.every((k) => names.some((n) => n.id === k.id));
  const photos = i.photos.slice(0, PHOTOS_PER_ITEM);
  // Ein Eintrag bleibt möglichst zusammen: Überschrift nie allein unten, Fotos nicht ohne ihren Text auf der nächsten Seite
  const height = 14 + wrap(i.title, b.bold, 14, CW).length * 19.6 + (i.text ? wrap(i.text, b.regular, 11.5, CW).length * 16.1 : 0)
    + quotes.reduce((h, q) => h + wrap(q, b.regular, 11.5, CW - 12).length * 16.1, 0) + (photos.length ? photoHeight(photos.length) + 14 : 0) + 30;
  ensure(b, Math.min(height, BOTTOM - M));
  line(b, `${formatLong(i.date)} · ${kind}`, 10, { color: MUTED });
  para(b, i.title, 14, { font: b.bold });
  if (i.text) para(b, i.text, 11.5);
  for (const q of quotes) para(b, q, 11.5, { color: MUTED, indent: 12 });
  if (names.length && !everyKid) para(b, `Dabei: ${names.map((n) => n.name).join(', ')}`, 10, { color: MUTED });
  if (photos.length) {
    b.top += 4;
    await photoRow(b, photos, photoHeight(photos.length));
  }
  b.top += 6;
  ensure(b, 4);
  b.page.drawLine({ start: { x: M, y: Y(b.top) }, end: { x: W - M, y: Y(b.top) }, thickness: 0.6, color: RULE });
  b.top += 12;
}

export interface ArchiveBookOptions {
  title: string;
  subtitle: string;
  review?: YearReview;
}

/** Das Buch: Einträge in zeitlicher Reihenfolge (älteste zuerst). */
export async function renderArchiveBook(items: ArchiveItem[], members: Member[], opts: ArchiveBookOptions, fonts: WorksheetFonts): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(opts.title);
  doc.setAuthor('Unsere kleine große Welt');
  doc.setLanguage('de-DE');
  const [regular, bold] = await Promise.all([doc.embedFont(fonts.regular, { subset: true }), doc.embedFont(fonts.bold, { subset: true })]);
  const b: Book = { doc, regular, bold, page: doc.addPage([W, H]), top: M, images: new Map() };

  const chronological = [...items].sort((a, x) => a.date.localeCompare(x.date) || a.id.localeCompare(x.id));
  cover(b, opts.title, opts.subtitle);
  await coverPhotos(b, opts.review?.photoPicks.map((p) => p.photo) ?? chronological.filter((i) => i.photos.length).map((i) => i.photos[0]));
  if (opts.review) reviewPages(b, opts.review);

  if (!chronological.length) {
    newPage(b);
    para(b, 'Für diese Auswahl gibt es noch keine Einträge.', 13, { color: MUTED });
  }
  for (const group of byMonth(chronological)) {
    newPage(b);
    line(b, monthLabel(group.month), 22, { font: b.bold, color: ACCENT });
    b.top += 8;
    for (const i of group.items) await entry(b, i, members);
  }

  const pages = doc.getPages();
  pages.forEach((p, n) => {
    if (n === 0) return;
    const t = `${opts.title} · Seite ${n + 1} von ${pages.length}`;
    p.drawText(clean(t, regular), { x: M, y: 28, size: 9, font: regular, color: MUTED });
  });
  return doc.save();
}

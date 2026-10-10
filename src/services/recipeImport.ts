import { DEFAULT_MEAL_CATEGORIES, SIDE_LABEL, guessSection } from '../data/meals';
import type { Ingredient, MealCategory, MealSide, Recipe } from '../types';

/**
 * Rezeptsammlung importieren (PDF oder Text). Erwartetes Format, siehe Vorlage:
 *
 *   Rezept: Linsensuppe
 *   Kategorie: Gemüsegericht, Suppenküche
 *   Beilage: Brot
 *   Personen: 5
 *   Zutaten:
 *   - 250 g rote Linsen
 *   - 2 Karotten
 *   Zubereitung:
 *   Freier Text …
 *
 * Fehlt die Kategorie, wird sie aus Name und Zutaten geraten. Alles läuft nur im Browser, nichts wird hochgeladen.
 */

export interface ParsedRecipe {
  title: string;
  emoji: string;
  categories: string[];
  side?: MealSide;
  servings?: number;
  ingredients: Ingredient[];
  note?: string;
  /** Hinweise für die Vorschau, z. B. „Kategorie geraten“. */
  hints: string[];
}

const FIELD = /^(rezept|kategorie|kategorien|beilage|personen|portionen|zutaten|zubereitung|anleitung|notiz|bild)\s*:\s*(.*)$/i;
const BULLET = /^\s*(?:[-–•*·]|\d+\.)\s+/;
const UNITS = 'g|kg|mg|ml|l|cl|dl|el|tl|msp\\.?|prise|prisen|bund|stück|stk\\.?|dose|dosen|becher|päckchen|pck\\.?|würfel|glas|gläser|tasse|tassen|zehe|zehen|scheibe|scheiben|handvoll|packung|packungen|beutel|zweig|zweige|blatt|blätter|liter|gramm|kilo';
const AMOUNT = new RegExp(`^((?:ca\\.\\s*)?(?:\\d+(?:[,.]\\d+)?(?:\\s*[-–]\\s*\\d+(?:[,.]\\d+)?)?|\\d+/\\d+|[½¼¾⅓⅔])(?:\\s*(?:${UNITS})(?=\\s|$))?)\\s+(.+)$`, 'i');

/** Zusätzliche Wörter, an denen eine Kategorie erkannt wird. */
const CATEGORY_WORDS: Record<string, string[]> = {
  sweet: ['süß', 'süss', 'pfannkuchen', 'kaiserschmarrn', 'milchreis', 'waffel', 'dampfnudel', 'grießbrei', 'griessbrei', 'crêpe', 'crepe', 'apfelstrudel', 'germknödel'],
  veggie: ['gemüse', 'vegetarisch', 'ofengemüse', 'kürbis', 'spinat', 'linsen', 'zucchini', 'brokkoli', 'blumenkohl', 'ratatouille'],
  salad: ['salat'],
  beef: ['rinderhack', 'hackfleisch', 'hack', 'bolognese', 'frikadelle', 'fleischpflanzerl', 'chili con carne', 'lasagne', 'hackbällchen'],
  chicken: ['hähnchen', 'huhn', 'hühner', 'geflügel', 'pute', 'chicken'],
  dough: ['pizza', 'teig', 'flammkuchen', 'maultasche', 'quiche', 'strudel', 'pizzaschnecke', 'spätzle', 'knödel'],
  vesper: ['vesper', 'brotzeit', 'abendbrot', 'aufstrich'],
  soup: ['suppe', 'brühe', 'eintopf', 'suppenküche', 'grundsoße', 'grundsosse'],
  bread: ['brot', 'brötchen', 'backen', 'gebäck', 'kuchen', 'zopf', 'hefezopf', 'sauerteig', 'baguette', 'semmel', 'laugen', 'brezel', 'muffin', 'plätzchen', 'keks'],
};

const EMOJI_WORDS: [string, string][] = [
  ['pizza', '🍕'], ['flammkuchen', '🥧'], ['suppe', '🍲'], ['brühe', '🍲'], ['eintopf', '🍲'], ['salat', '🥗'], ['nudel', '🍝'], ['spaghetti', '🍝'],
  ['lasagne', '🍝'], ['reis', '🍚'], ['hähnchen', '🍗'], ['huhn', '🍗'], ['pfannkuchen', '🥞'], ['kaiserschmarrn', '🥞'], ['waffel', '🧇'],
  ['kuchen', '🍰'], ['zopf', '🥖'], ['baguette', '🥖'], ['brötchen', '🥐'], ['brezel', '🥨'], ['brot', '🍞'], ['muffin', '🧁'], ['plätzchen', '🍪'],
  ['keks', '🍪'], ['kartoffel', '🥔'], ['kürbis', '🎃'], ['frikadelle', '🍔'], ['burger', '🍔'], ['ei', '🍳'], ['käse', '🧀'], ['fisch', '🐟'],
];

const norm = (s: string) => s.toLowerCase().normalize('NFC');

function matchCategory(word: string, categories: MealCategory[]): string | undefined {
  const w = norm(word.trim());
  if (!w) return undefined;
  const direct = categories.find((c) => norm(c.label) === w || c.id === w);
  if (direct) return direct.id;
  const partial = categories.find((c) => norm(c.label).includes(w) || w.includes(norm(c.label)));
  if (partial) return partial.id;
  for (const [id, words] of Object.entries(CATEGORY_WORDS)) {
    if (categories.some((c) => c.id === id) && words.some((k) => w.includes(k))) return id;
  }
  return undefined;
}

/** Kategorie aus Name und Zutaten raten (nur wenn keine angegeben ist). */
export function guessCategories(title: string, ingredients: Ingredient[], categories: MealCategory[] = DEFAULT_MEAL_CATEGORIES): string[] {
  const t = ` ${norm(title)} `;
  const ing = ingredients.map((i) => norm(i.name)).join(' ');
  const out: string[] = [];
  for (const [id, words] of Object.entries(CATEGORY_WORDS)) {
    if (!categories.some((c) => c.id === id)) continue;
    if (words.some((w) => (w.length <= 4 ? new RegExp(`[\\s-]${w}`).test(t) : t.includes(w)))) out.push(id);
  }
  if (!out.length) {
    if (/hähnchen|huhn|pute/.test(ing)) out.push('chicken');
    else if (/rinderhack|hackfleisch/.test(ing)) out.push('beef');
    else if (/hefe|sauerteig/.test(ing) && /mehl/.test(ing)) out.push('bread');
  }
  // Brot schließt Hauptgerichte nicht aus, aber "Brotzeit" ist Vesper, kein Backrezept
  if (out.includes('vesper') && out.includes('bread') && /brotzeit|vesper/.test(t)) out.splice(out.indexOf('bread'), 1);
  return out;
}

export function guessEmoji(title: string, categories: string[], all: MealCategory[] = DEFAULT_MEAL_CATEGORIES): string {
  const t = norm(title);
  for (const [w, e] of EMOJI_WORDS) if (w.length <= 3 ? new RegExp(`(^|\\s)${w}`).test(t) : t.includes(w)) return e;
  return all.find((c) => c.id === categories[0])?.emoji ?? '🍽️';
}

export function parseIngredient(line: string): Ingredient {
  const text = line.replace(BULLET, '').trim();
  const m = AMOUNT.exec(text);
  const name = (m ? m[2] : text).trim();
  return { name, ...(m ? { amount: m[1].trim() } : {}), section: guessSection(name) };
}

function parseSide(v: string): MealSide | undefined {
  const w = norm(v);
  return (Object.keys(SIDE_LABEL) as MealSide[]).find((s) => w.includes(s) || w.includes(norm(SIDE_LABEL[s])));
}

/** Zerlegt den Text einer Sammlung in einzelne Rezepte. */
export function parseRecipeText(text: string, categories: MealCategory[] = DEFAULT_MEAL_CATEGORIES): ParsedRecipe[] {
  const lines = text.replace(/\r/g, '').split('\n').map((l) => l.replace(/\s+$/, ''));
  const hasMarkers = lines.some((l) => /^\s*rezept\s*:/i.test(l));
  // Ohne „Rezept:“-Zeilen: jede Seite (\f) ist ein Rezept, die erste Zeile ist der Name
  const blocks: string[][] = [];
  if (hasMarkers) {
    let cur: string[] | null = null;
    for (const l of lines) {
      if (/^\s*rezept\s*:/i.test(l)) { cur = [l.replace('\f', '')]; blocks.push(cur); } else if (cur) cur.push(l.replace('\f', ''));
    }
  } else {
    for (const page of text.split('\f')) {
      const ls = page.split('\n').map((l) => l.trim()).filter(Boolean);
      if (ls.length) blocks.push([`Rezept: ${ls[0]}`, ...ls.slice(1)]);
    }
  }

  const out: ParsedRecipe[] = [];
  for (const block of blocks) {
    let title = '';
    let catText: string | undefined;
    let side: MealSide | undefined;
    let servings: number | undefined;
    let emoji: string | undefined;
    const ingredients: Ingredient[] = [];
    const noteLines: string[] = [];
    let section: 'head' | 'ing' | 'note' = 'head';
    for (const raw of block) {
      const l = raw.trim();
      const f = FIELD.exec(l);
      if (f) {
        const key = norm(f[1]);
        const val = f[2].trim();
        if (key === 'rezept') title = val;
        else if (key.startsWith('kategorie')) catText = val;
        else if (key === 'beilage') side = parseSide(val);
        else if (key === 'personen' || key === 'portionen') { const n = parseInt(val, 10); if (n > 0 && n < 100) servings = n; }
        else if (key === 'bild') emoji = val || undefined;
        else if (key === 'zutaten') { section = 'ing'; if (val) ingredients.push(parseIngredient(val)); }
        else { section = 'note'; if (val) noteLines.push(val); }
        continue;
      }
      if (!l) { if (section === 'note' && noteLines.length) noteLines.push(''); continue; }
      if (section === 'ing') ingredients.push(parseIngredient(l));
      else if (section === 'note') noteLines.push(l);
      else if (BULLET.test(raw)) { section = 'ing'; ingredients.push(parseIngredient(l)); }
      else noteLines.push(l);
    }
    if (!title) continue;
    const hints: string[] = [];
    let cats = (catText ?? '').split(/[,;/]|\bund\b/).map((c) => matchCategory(c, categories)).filter((c): c is string => !!c);
    cats = [...new Set(cats)];
    if (!cats.length) {
      cats = guessCategories(title, ingredients, categories);
      hints.push(cats.length ? 'Kategorie geraten' : 'Keine Kategorie erkannt');
    }
    if (!ingredients.length) hints.push('Keine Zutaten gefunden');
    const note = noteLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    out.push({
      title, emoji: emoji ?? guessEmoji(title, cats, categories), categories: cats, ...(side ? { side } : {}), ...(servings ? { servings } : {}),
      ingredients, ...(note ? { note } : {}), hints,
    });
  }
  return out;
}

/** Zu jedem importierten Rezept: gibt es schon eins mit demselben Namen? */
export function findExisting(parsed: ParsedRecipe, recipes: Recipe[]): Recipe | undefined {
  const t = norm(parsed.title).replace(/\s+/g, ' ');
  return recipes.find((r) => norm(r.title).replace(/\s+/g, ' ') === t);
}

/** Text aus einer PDF-Datei lesen; Seiten werden mit \f getrennt. pdf.js wird erst bei Bedarf geladen. */
export async function extractPdfText(data: ArrayBuffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const worker = (await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
  const pages: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Textstücke nach Zeilen (y) gruppieren, innerhalb der Zeile nach x sortieren
    const rows: { y: number; parts: { x: number; w: number; s: string }[] }[] = [];
    for (const item of content.items) {
      if (!('str' in item) || !item.str) continue;
      const x = item.transform[4];
      const y = item.transform[5];
      let row = rows.find((r) => Math.abs(r.y - y) < 3);
      if (!row) { row = { y, parts: [] }; rows.push(row); }
      row.parts.push({ x, w: item.width, s: item.str });
    }
    rows.sort((a, b) => b.y - a.y);
    pages.push(rows.map((r) => {
      const parts = r.parts.sort((a, b) => a.x - b.x);
      // Leerzeichen nur dort, wo im PDF wirklich Abstand ist (Textstücke können mitten im Wort enden)
      return parts.map((part, i) => (i > 0 && part.x - (parts[i - 1].x + parts[i - 1].w) > 1.5 && !/\s$/.test(parts[i - 1].s) ? ' ' : '') + part.s)
        .join('').replace(/\s+/g, ' ').trim();
    }).join('\n'));
  }
  return pages.join('\n\f');
}

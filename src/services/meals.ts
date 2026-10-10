import type { FamilyDatabase } from '../database/db';
import { DEFAULT_MEAL_CATEGORIES, SECTION_LABEL, SECTION_ORDER } from '../data/meals';
import type { AppSettings, CookSession, DateKey, FreezerItem, SoupKitchenSettings, Weekday, Ingredient, MealCategory, MealPlan, MealPlanDay, MealSide, Recipe, ShoppingItem, ShopSection } from '../types';
import { addDaysKey, daysBetween, weekStartKey, WEEKDAY_SHORT, weekdayOf } from '../utils/dates';
import { newId } from '../utils/id';

/**
 * Essensplan: sieben Hauptgerichte pro Woche mit frei einstellbaren Wochenzielen.
 * Die App schlägt vor, ihr entscheidet. Sie behauptet nie, dass etwas im Vorrat fehlt:
 * Zutaten kommen erst nach eurer Prüfung auf die Einkaufsliste.
 */

export const mealCategories = (settings: Pick<AppSettings, 'mealCategories'>): MealCategory[] => settings.mealCategories ?? DEFAULT_MEAL_CATEGORIES;

export const emptyPlan = (weekStart: DateKey): MealPlan => ({ id: weekStart, days: [], wishes: [] });

export const weekDates = (weekStart: DateKey): DateKey[] => Array.from({ length: 7 }, (_, i) => addDaysKey(weekStart, i));

export function dayFromRecipe(recipe: Recipe, date: DateKey, wishedBy?: string): MealPlanDay {
  return {
    date, recipeId: recipe.id, title: recipe.title, emoji: recipe.emoji, categories: [...recipe.categories],
    ...(recipe.side ? { side: recipe.side } : {}), ...(wishedBy ? { wishedBy } : {}),
  };
}

async function loadPlan(db: FamilyDatabase, weekStart: DateKey): Promise<MealPlan> {
  return (await db.mealPlans.get(weekStart)) ?? emptyPlan(weekStart);
}

/** Gefriervorrat anpassen, wenn ein Tag ein Gericht aus der Truhe bekommt oder wieder verliert. */
async function moveFreezerPortion(db: FamilyDatabase, freezerId: string | undefined, delta: number): Promise<void> {
  if (!freezerId) return;
  await db.freezerItems.where('id').equals(freezerId).modify((f) => { f.portions = Math.max(0, f.portions + delta); });
}

/** Einen Tag setzen oder leeren. */
export async function setPlanDay(db: FamilyDatabase, date: DateKey, day: MealPlanDay | null): Promise<void> {
  const weekStart = weekStartKey(date);
  await db.transaction('rw', db.mealPlans, db.freezerItems, async () => {
    const plan = await loadPlan(db, weekStart);
    const old = plan.days.find((d) => d.date === date);
    if (old?.freezerId !== day?.freezerId) {
      await moveFreezerPortion(db, old?.freezerId, +1);
      await moveFreezerPortion(db, day?.freezerId, -1);
    }
    const days = plan.days.filter((d) => d.date !== date);
    if (day) days.push({ ...day, date });
    days.sort((a, b) => a.date.localeCompare(b.date));
    // Ein erfüllter Wunsch verschwindet aus der Wunschliste
    const wishes = day?.wishedBy ? plan.wishes.filter((w) => !(w.childId === day.wishedBy && w.recipeId === day.recipeId)) : plan.wishes;
    await db.mealPlans.put({ ...plan, days, wishes });
  });
}

/** Zwei Tage tauschen, z. B. wenn Reste aufgebraucht werden sollen. */
export async function swapPlanDays(db: FamilyDatabase, a: DateKey, b: DateKey): Promise<void> {
  const weekStart = weekStartKey(a);
  await db.transaction('rw', db.mealPlans, async () => {
    const plan = await loadPlan(db, weekStart);
    const da = plan.days.find((d) => d.date === a);
    const dbb = plan.days.find((d) => d.date === b);
    const days = plan.days.filter((d) => d.date !== a && d.date !== b);
    if (da) days.push({ ...da, date: b });
    if (dbb) days.push({ ...dbb, date: a });
    days.sort((x, y) => x.date.localeCompare(y.date));
    await db.mealPlans.put({ ...plan, days });
  });
}

export async function savePlanDays(db: FamilyDatabase, weekStart: DateKey, add: MealPlanDay[]): Promise<void> {
  await db.transaction('rw', db.mealPlans, db.freezerItems, async () => {
    const plan = await loadPlan(db, weekStart);
    const taken = new Set(plan.days.map((d) => d.date));
    const fresh = add.filter((d) => !taken.has(d.date));
    for (const d of fresh) await moveFreezerPortion(db, d.freezerId, -1);
    const days = [...plan.days, ...fresh].sort((a, b) => a.date.localeCompare(b.date));
    await db.mealPlans.put({ ...plan, days });
  });
}

// ------------------------------------------------------------- Wochenziele und Abwechslung

export interface CategoryProgress { category: MealCategory; have: number }

export function categoryProgress(plan: MealPlan, categories: MealCategory[]): CategoryProgress[] {
  return categories.filter((c) => c.perWeek > 0).map((category) => ({
    category, have: plan.days.filter((d) => d.categories.includes(category.id)).length,
  }));
}

/** Wie oft jede Beilage in den angegebenen Wochen vorkam. */
export function sideCounts(plans: MealPlan[]): Record<MealSide, number> {
  const out: Record<MealSide, number> = { reis: 0, nudeln: 0, kartoffeln: 0, couscous: 0, bulgur: 0, brot: 0 };
  for (const p of plans) for (const d of p.days) if (d.side) out[d.side] += 1;
  return out;
}

const isSoupSeason = (date: DateKey) => { const m = Number(date.slice(5, 7)); return m >= 10 || m <= 3; };

/**
 * Bewertet Gerichte für eine Woche: Favoriten vorn, kürzlich Gekochtes hinten, seltene Beilagen bevorzugt,
 * von Oktober bis März etwas mehr Suppe. Pausierte Gerichte werden nicht vorgeschlagen.
 */
export function rankRecipes(recipes: Recipe[], opts: { plan: MealPlan; recent: MealPlan[]; category?: string; date: DateKey }): Recipe[] {
  const recentIds = new Map<string, number>();
  for (const p of opts.recent) for (const d of p.days) if (d.recipeId) recentIds.set(d.recipeId, (recentIds.get(d.recipeId) ?? 0) + 1);
  const inPlan = new Set(opts.plan.days.map((d) => d.recipeId).filter(Boolean));
  const sides = sideCounts([opts.plan, ...opts.recent]);
  const weekSides = sideCounts([opts.plan]);
  const soup = isSoupSeason(opts.date);
  const score = (r: Recipe) => (r.favorite ? 3 : 0)
    - 4 * (recentIds.get(r.id) ?? 0)
    - (r.side ? sides[r.side] * 0.5 + weekSides[r.side] * 2 : 0)
    + (soup && r.categories.includes('soup') ? 1.5 : 0);
  return recipes
    .filter((r) => !r.paused && !inPlan.has(r.id) && (!opts.category || r.categories.includes(opts.category)))
    .sort((a, b) => score(b) - score(a) || a.title.localeCompare(b.title, 'de'));
}

/** Vorschlag für die leeren Tage: zuerst die noch offenen Wochenziele, dann Favoriten. Nur ein Vorschlag, nichts wird gespeichert. */
export function suggestEmptyDays(recipes: Recipe[], categories: MealCategory[], plan: MealPlan, recent: MealPlan[], freezer: FreezerItem[] = []): MealPlanDay[] {
  const empty = weekDates(plan.id).filter((d) => !plan.days.some((x) => x.date === d));
  const working: MealPlan = { ...plan, days: [...plan.days] };
  const out: MealPlanDay[] = [];
  // Was eingefroren ist, kommt zuerst dran: eine Mahlzeit pro Woche aus dem ältesten Vorrat
  const oldest = freezerStock(freezer)[0];
  if (oldest && empty.length && !plan.days.some((d) => d.freezerId)) {
    const day = dayFromFreezer(oldest, empty.shift()!, recipes);
    out.push(day);
    working.days.push(day);
  }
  for (const date of empty) {
    const open = categoryProgress(working, categories).filter((p) => p.have < p.category.perWeek).map((p) => p.category.id);
    let pick: Recipe | undefined;
    for (const cat of open) {
      pick = rankRecipes(recipes, { plan: working, recent, category: cat, date })[0];
      if (pick) break;
    }
    pick ??= rankRecipes(recipes, { plan: working, recent, date })[0];
    if (!pick) break;
    const day = dayFromRecipe(pick, date);
    out.push(day);
    working.days.push(day);
  }
  return out;
}

// ------------------------------------------------------------- Kinderwünsche im Familienrat

/** Drei Gerichte zur Auswahl für ein Kind, stabil pro Woche und Kind. */
export function wishOptions(recipes: Recipe[], plan: MealPlan, recent: MealPlan[], childId: string, categories: MealCategory[] = DEFAULT_MEAL_CATEGORIES): Recipe[] {
  // Nur richtige Hauptgerichte, keine Vorbereitungen wie eine große Brühe
  const goals = new Set(categories.filter((c) => c.perWeek > 0).map((c) => c.id));
  const ranked = rankRecipes(recipes.filter((r) => r.categories.some((c) => goals.has(c))), { plan, recent, date: plan.id });
  const seed = [...`${plan.id}${childId}`].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7);
  const pool = ranked.slice(0, 12);
  const out: Recipe[] = [];
  const usedCats = new Set<string>();
  for (let k = 0; out.length < 3 && k < pool.length * 2; k++) {
    const r = pool[(seed + k * 5) % pool.length];
    if (!r || out.includes(r)) continue;
    if (k < pool.length && r.categories.some((c) => usedCats.has(c))) continue;
    out.push(r);
    r.categories.forEach((c) => usedCats.add(c));
  }
  return out;
}

/** Ein Wunsch pro Kind und Woche; ein neuer ersetzt den alten. */
export async function setWish(db: FamilyDatabase, weekStart: DateKey, childId: string, recipeId: string | null): Promise<void> {
  await db.transaction('rw', db.mealPlans, async () => {
    const plan = await loadPlan(db, weekStart);
    const wishes = plan.wishes.filter((w) => w.childId !== childId);
    if (recipeId) wishes.push({ childId, recipeId });
    await db.mealPlans.put({ ...plan, wishes });
  });
}

// ------------------------------------------------------------- Einkaufsliste

export interface NeededIngredient extends Ingredient {
  key: string;
  /** Für welche Gerichte, z. B. "Pizza (Fr)". */
  sources: string[];
}

const norm = (s: string) => s.trim().toLowerCase();

/** Mengen im Gericht sind für so viele Personen gedacht. */
export const DEFAULT_SERVINGS = 5;
export const recipeServings = (r: Pick<Recipe, 'servings'>) => (r.servings && r.servings > 0 ? r.servings : DEFAULT_SERVINGS);

const fmt = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

/** Menge umrechnen, z. B. für Gäste: "500 g" × 1,4 = "700 g", "3" × 1,4 = "4,5". Unklare Angaben bekommen einen Faktor dazu. */
export function scaleAmount(amount: string, factor: number): string {
  if (Math.abs(factor - 1) < 0.01) return amount;
  const m = /^(\d+(?:,\d+)?)(\s*)(.*)$/.exec(amount.trim());
  if (!m) return `${amount} (× ${fmt(factor)})`;
  const n = Number(m[1].replace(',', '.')) * factor;
  const unit = m[3].trim();
  const fine = /^(g|ml)$/i.test(unit);
  const rounded = fine ? (n >= 100 ? Math.round(n / 10) * 10 : Math.round(n)) : Math.ceil(n * 2) / 2;
  return `${fmt(rounded)}${m[2]}${m[3]}`;
}

/** "700 g" + "500 g" = "1200 g", "1" + "1" = "2"; alles andere wird nebeneinander geschrieben. */
export function addAmounts(a: string, b: string): string {
  const parse = (x: string) => { const m = /^(\d+(?:,\d+)?)\s*([^\d\s+]*)$/.exec(x.trim()); return m ? { n: Number(m[1].replace(',', '.')), unit: m[2] } : null; };
  const pa = parse(a);
  const pb = parse(b);
  if (pa && pb && pa.unit === pb.unit) {
    const sum = String(Math.round((pa.n + pb.n) * 100) / 100).replace('.', ',');
    return pa.unit ? `${sum} ${pa.unit}` : sum;
  }
  return `${a} + ${b}`;
}

/** Alle Zutaten der geplanten Tage (ab heute), gleiche Zutaten zusammengefasst. */
export function weekIngredients(plan: MealPlan, recipes: Recipe[], fromDate: DateKey, cooking: CookSession[] = []): NeededIngredient[] {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const map = new Map<string, NeededIngredient>();
  const end = addDaysKey(plan.id, 6);
  const entries = [
    // Gerichte aus dem Gefriervorrat brauchen keine Zutaten
    ...plan.days.filter((d) => d.date >= fromDate && d.recipeId && !d.freezerId).map((d) => ({ date: d.date, recipeId: d.recipeId!, servings: d.servings })),
    ...cooking.filter((c) => c.status === 'planned' && c.date >= fromDate && c.date <= end).map((c) => ({ date: c.date, recipeId: c.recipeId, servings: undefined })),
  ];
  for (const e of entries) {
    const recipe = byId.get(e.recipeId);
    if (!recipe) continue;
    const factor = (e.servings ?? recipeServings(recipe)) / recipeServings(recipe);
    const src = `${recipe.title} (${WEEKDAY_SHORT[weekdayOf(e.date)]})`;
    for (const ing of recipe.ingredients) {
      const key = norm(ing.name);
      const amount = ing.amount ? scaleAmount(ing.amount, factor) : undefined;
      const cur = map.get(key);
      if (cur) {
        cur.sources.push(src);
        if (amount) cur.amount = cur.amount ? addAmounts(cur.amount, amount) : amount;
      } else {
        map.set(key, { ...ing, ...(amount ? { amount } : {}), key, sources: [src] });
      }
    }
  }
  return [...map.values()].sort((a, b) => SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section) || a.name.localeCompare(b.name, 'de'));
}

/** Übernimmt die bestätigten Zutaten. Was schon offen auf der Liste steht, wird nicht doppelt angelegt. */
export async function addIngredientsToList(db: FamilyDatabase, items: NeededIngredient[], weekStart?: DateKey): Promise<number> {
  return db.transaction('rw', db.shoppingItems, db.mealPlans, async () => {
    const open = new Set((await db.shoppingItems.filter((i) => !i.done).toArray()).map((i) => norm(i.name)));
    const now = new Date().toISOString();
    const fresh: ShoppingItem[] = items.filter((i) => !open.has(i.key)).map((i) => ({
      id: newId('shop'), name: i.name, ...(i.amount ? { amount: i.amount } : {}), section: i.section, done: false, source: i.sources.join(', '), createdAt: now,
    }));
    await db.shoppingItems.bulkAdd(fresh);
    if (weekStart) {
      const plan = await loadPlan(db, weekStart);
      await db.mealPlans.put({ ...plan, ingredientsCheckedAt: now });
    }
    return fresh.length;
  });
}

export async function addShoppingItem(db: FamilyDatabase, name: string, section: ShopSection, amount?: string): Promise<void> {
  const n = name.trim();
  if (!n) return;
  await db.shoppingItems.add({ id: newId('shop'), name: n, ...(amount?.trim() ? { amount: amount.trim() } : {}), section, done: false, createdAt: new Date().toISOString() });
}

export async function toggleShoppingItem(db: FamilyDatabase, id: string): Promise<void> {
  await db.shoppingItems.where('id').equals(id).modify((i) => {
    i.done = !i.done;
    if (i.done) i.doneAt = new Date().toISOString(); else delete i.doneAt;
  });
}

export async function clearDoneItems(db: FamilyDatabase): Promise<number> {
  const done = await db.shoppingItems.filter((i) => i.done).primaryKeys();
  await db.shoppingItems.bulkDelete(done);
  return done.length;
}

/** Text zum Teilen aufs Handy (Notizen, Erinnerungen, Nachricht), nach Abteilungen sortiert. */
export function shoppingListText(items: ShoppingItem[]): string {
  const open = items.filter((i) => !i.done);
  const lines: string[] = ['Einkaufsliste'];
  for (const section of SECTION_ORDER) {
    const group = open.filter((i) => i.section === section).sort((a, b) => a.name.localeCompare(b.name, 'de'));
    if (!group.length) continue;
    lines.push('', `${SECTION_LABEL[section]}:`);
    for (const i of group) lines.push(`- ${i.name}${i.amount ? ` (${i.amount})` : ''}`);
  }
  return lines.join('\n');
}

export async function saveRecipe(db: FamilyDatabase, recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Recipe, 'id' | 'createdAt'>>): Promise<string> {
  const now = new Date().toISOString();
  const id = recipe.id || newId('recipe');
  await db.recipes.put({
    ...recipe, id, title: recipe.title.trim(), createdAt: recipe.createdAt ?? now, updatedAt: now,
    ingredients: recipe.ingredients.filter((i) => i.name.trim()).map((i) => ({ ...i, name: i.name.trim(), ...(i.amount?.trim() ? { amount: i.amount.trim() } : { amount: undefined }) })),
  });
  return id;
}

// ------------------------------------------------------------- Gefriervorrat

/** Ab so vielen Tagen weist die App freundlich darauf hin, etwas bald aufzubrauchen. */
export const FREEZER_OLD_DAYS = 90;

export async function addFreezerItem(db: FamilyDatabase, item: Omit<FreezerItem, 'id'>): Promise<string> {
  const id = newId('freezer');
  await db.freezerItems.add({ ...item, id, name: item.name.trim(), portions: Math.max(0, Math.round(item.portions)) });
  return id;
}

export async function changeFreezerPortions(db: FamilyDatabase, id: string, delta: number): Promise<void> {
  await moveFreezerPortion(db, id, delta);
}

/** Was noch da ist, ältestes zuerst. */
export function freezerStock(items: FreezerItem[]): FreezerItem[] {
  return items.filter((f) => f.portions > 0).sort((a, b) => a.frozenAt.localeCompare(b.frozenAt));
}

export function dayFromFreezer(item: FreezerItem, date: DateKey, recipes: Recipe[]): MealPlanDay {
  const recipe = item.recipeId ? recipes.find((r) => r.id === item.recipeId) : undefined;
  return {
    date, title: `${item.name} aus dem Vorrat`, emoji: item.emoji ?? recipe?.emoji ?? '🧊', categories: recipe ? [...recipe.categories] : [],
    ...(recipe?.side ? { side: recipe.side } : {}), ...(recipe ? { recipeId: recipe.id } : {}), freezerId: item.id,
  };
}

// ------------------------------------------------------------- Suppenküche

export const DEFAULT_SOUP_KITCHEN: SoupKitchenSettings = { enabled: true, everyWeeks: 2, day: 0, months: [10, 11, 12, 1, 2, 3] };
export const soupKitchenSettings = (settings: Pick<AppSettings, 'soupKitchen'>): SoupKitchenSettings => settings.soupKitchen ?? DEFAULT_SOUP_KITCHEN;

/** Gerichte für die Suppenküche (Kategorie „Suppenküche“), große Brühe zuerst. */
export function soupRecipes(recipes: Recipe[]): Recipe[] {
  return recipes.filter((r) => r.categories.includes('soup') && !r.paused)
    .sort((a, b) => Number(b.id === 'recipe-rinderbruehe') - Number(a.id === 'recipe-rinderbruehe') || a.title.localeCompare(b.title, 'de'));
}

export function nextWeekday(from: DateKey, day: Weekday): DateKey {
  for (let i = 0; i < 7; i++) { const d = addDaysKey(from, i); if (weekdayOf(d) === day) return d; }
  return from;
}

/**
 * Ist wieder Zeit für die Suppenküche? Gibt den vorgeschlagenen Kochtag zurück oder null.
 * Nur in der Saison, nur wenn nichts geplant ist und das letzte Kochen (oder bewusste Auslassen) lang genug her ist.
 */
export function soupKitchenDue(today: DateKey, sessions: CookSession[], s: SoupKitchenSettings): DateKey | null {
  if (!s.enabled) return null;
  if (sessions.some((c) => c.status === 'planned' && c.date >= today)) return null;
  const date = nextWeekday(today, s.day);
  if (!s.months.includes(Number(date.slice(5, 7)))) return null;
  const last = sessions.filter((c) => c.date <= date).sort((a, b) => b.date.localeCompare(a.date))[0];
  if (last && daysBetween(last.date, date) < s.everyWeeks * 7) return null;
  return date;
}

export async function planCookSession(db: FamilyDatabase, date: DateKey, recipe: Recipe): Promise<string> {
  const id = `cook|${date}`;
  await db.cookSessions.put({ id, date, recipeId: recipe.id, title: recipe.title, emoji: recipe.emoji, status: 'planned', createdAt: new Date().toISOString() });
  return id;
}

/** Diesmal nicht: zählt wie ein Termin, damit die Erinnerung erst im nächsten Rhythmus wiederkommt. */
export async function skipCookSession(db: FamilyDatabase, date: DateKey, recipe?: Recipe): Promise<void> {
  const id = `cook|${date}`;
  const old = await db.cookSessions.get(id);
  await db.cookSessions.put({
    ...(old ?? { id, date, recipeId: recipe?.id ?? 'recipe-rinderbruehe', title: recipe?.title ?? 'Suppenküche', emoji: recipe?.emoji ?? '🍲', createdAt: new Date().toISOString() }),
    status: 'skipped',
  });
}

/** Gekocht: die eingefrorenen Portionen kommen in den Gefriervorrat. */
export async function finishCookSession(db: FamilyDatabase, id: string, portions: number, frozenAt: DateKey): Promise<void> {
  await db.transaction('rw', db.cookSessions, db.freezerItems, async () => {
    const c = await db.cookSessions.get(id);
    if (!c || c.status === 'done') return;
    await db.cookSessions.put({ ...c, status: 'done', portions });
    if (portions > 0) {
      await db.freezerItems.add({
        id: newId('freezer'), name: c.title.replace(/\s*\(große Menge\)\s*/i, '').trim(), emoji: c.emoji, recipeId: c.recipeId, portions, frozenAt,
      });
    }
  });
}

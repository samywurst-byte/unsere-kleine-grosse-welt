import type { FamilyDatabase } from '../database/db';
import { DEFAULT_MEAL_CATEGORIES, SECTION_LABEL, SECTION_ORDER } from '../data/meals';
import type { AppSettings, DateKey, Ingredient, MealCategory, MealPlan, MealPlanDay, MealSide, Recipe, ShoppingItem, ShopSection } from '../types';
import { addDaysKey, weekStartKey, WEEKDAY_SHORT, weekdayOf } from '../utils/dates';
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

/** Einen Tag setzen oder leeren. */
export async function setPlanDay(db: FamilyDatabase, date: DateKey, day: MealPlanDay | null): Promise<void> {
  const weekStart = weekStartKey(date);
  await db.transaction('rw', db.mealPlans, async () => {
    const plan = await loadPlan(db, weekStart);
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
  await db.transaction('rw', db.mealPlans, async () => {
    const plan = await loadPlan(db, weekStart);
    const taken = new Set(plan.days.map((d) => d.date));
    const days = [...plan.days, ...add.filter((d) => !taken.has(d.date))].sort((a, b) => a.date.localeCompare(b.date));
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
export function suggestEmptyDays(recipes: Recipe[], categories: MealCategory[], plan: MealPlan, recent: MealPlan[]): MealPlanDay[] {
  const empty = weekDates(plan.id).filter((d) => !plan.days.some((x) => x.date === d));
  const working: MealPlan = { ...plan, days: [...plan.days] };
  const out: MealPlanDay[] = [];
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
export function weekIngredients(plan: MealPlan, recipes: Recipe[], fromDate: DateKey): NeededIngredient[] {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const map = new Map<string, NeededIngredient>();
  for (const day of plan.days) {
    if (day.date < fromDate || !day.recipeId) continue;
    const recipe = byId.get(day.recipeId);
    if (!recipe) continue;
    const src = `${recipe.title} (${WEEKDAY_SHORT[weekdayOf(day.date)]})`;
    for (const ing of recipe.ingredients) {
      const key = norm(ing.name);
      const cur = map.get(key);
      if (cur) {
        cur.sources.push(src);
        if (ing.amount) cur.amount = cur.amount ? addAmounts(cur.amount, ing.amount) : ing.amount;
      } else {
        map.set(key, { ...ing, key, sources: [src] });
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

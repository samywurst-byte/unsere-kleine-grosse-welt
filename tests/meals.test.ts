import { describe, expect, it } from 'vitest';
import { DEFAULT_MEAL_CATEGORIES, defaultRecipes, guessSection } from '../src/data/meals';
import { exportData, importData, validateBackup } from '../src/services/backup';
import {
  addIngredientsToList, categoryProgress, emptyPlan, savePlanDays, setPlanDay, setWish, shoppingListText, suggestEmptyDays, swapPlanDays,
  weekIngredients, wishOptions, dayFromRecipe, addAmounts,
} from '../src/services/meals';
import { openDb } from './helpers';

const WEEK = '2026-10-12';

describe('Essensplan', () => {
  it('legt die Startgerichte an', async () => {
    const db = await openDb();
    expect(await db.recipes.count()).toBe(defaultRecipes().length);
  });

  it('schlägt eine abwechslungsreiche Woche vor, die alle Wochenziele erfüllt', () => {
    const recipes = defaultRecipes();
    const days = suggestEmptyDays(recipes, DEFAULT_MEAL_CATEGORIES, emptyPlan(WEEK), []);
    expect(days).toHaveLength(7);
    expect(new Set(days.map((d) => d.recipeId)).size).toBe(7);
    const plan = { ...emptyPlan(WEEK), days };
    expect(categoryProgress(plan, DEFAULT_MEAL_CATEGORIES).every((p) => p.have >= p.category.perWeek)).toBe(true);
    // Pausierte Gerichte und schon Geplantes kommen nicht noch einmal
    const paused = recipes.map((r) => (r.id === 'recipe-pizza' ? { ...r, paused: true } : r));
    const fri = { ...emptyPlan(WEEK), days: [dayFromRecipe(recipes.find((r) => r.id === 'recipe-flammkuchen')!, '2026-10-16')] };
    const rest = suggestEmptyDays(paused, DEFAULT_MEAL_CATEGORIES, fri, []);
    expect(rest).toHaveLength(6);
    expect(rest.some((d) => d.recipeId === 'recipe-pizza' || d.recipeId === 'recipe-flammkuchen')).toBe(false);
  });

  it('meidet Gerichte der letzten Wochen', () => {
    const recipes = defaultRecipes();
    const first = suggestEmptyDays(recipes, DEFAULT_MEAL_CATEGORIES, emptyPlan('2026-10-05'), []);
    const second = suggestEmptyDays(recipes, DEFAULT_MEAL_CATEGORIES, emptyPlan(WEEK), [{ ...emptyPlan('2026-10-05'), days: first }]);
    const overlap = second.filter((d) => first.some((f) => f.recipeId === d.recipeId));
    expect(overlap.length).toBeLessThanOrEqual(1);
  });

  it('Tage setzen, tauschen und Kinderwünsche', async () => {
    const db = await openDb();
    const recipes = await db.recipes.toArray();
    const pizza = recipes.find((r) => r.id === 'recipe-pizza')!;
    await setWish(db, WEEK, 'child-1', pizza.id);
    await setWish(db, WEEK, 'child-1', 'recipe-waffeln');
    expect((await db.mealPlans.get(WEEK))?.wishes).toEqual([{ childId: 'child-1', recipeId: 'recipe-waffeln' }]);
    await setPlanDay(db, '2026-10-14', dayFromRecipe(recipes.find((r) => r.id === 'recipe-waffeln')!, '2026-10-14', 'child-1'));
    expect((await db.mealPlans.get(WEEK))?.wishes).toEqual([]);
    await setPlanDay(db, '2026-10-16', dayFromRecipe(pizza, '2026-10-16'));
    await swapPlanDays(db, '2026-10-14', '2026-10-16');
    const plan = (await db.mealPlans.get(WEEK))!;
    expect(plan.days.map((d) => [d.date, d.recipeId])).toEqual([['2026-10-14', 'recipe-pizza'], ['2026-10-16', 'recipe-waffeln']]);
    const opts = wishOptions(recipes, plan, [], 'child-2');
    expect(opts).toHaveLength(3);
    expect(wishOptions(recipes, plan, [], 'child-2').map((r) => r.id)).toEqual(opts.map((r) => r.id));
    expect(opts.some((r) => r.id === 'recipe-pizza')).toBe(false);
  });

  it('Zutaten werden zusammengefasst und nur nach Prüfung übernommen, ohne Doppelte', async () => {
    const db = await openDb();
    const recipes = await db.recipes.toArray();
    const by = (id: string) => recipes.find((r) => r.id === id)!;
    await savePlanDays(db, WEEK, [dayFromRecipe(by('recipe-pizza'), '2026-10-16'), dayFromRecipe(by('recipe-bolognese'), '2026-10-13'), dayFromRecipe(by('recipe-kaiserschmarrn'), '2026-10-12')]);
    const plan = (await db.mealPlans.get(WEEK))!;
    const all = weekIngredients(plan, recipes, '2026-10-13');
    expect(all.some((i) => i.name === 'Eier')).toBe(false); // Montag ist vorbei
    const tomatoes = all.find((i) => i.name === 'Passierte Tomaten')!;
    expect(tomatoes.sources).toHaveLength(2);
    expect(tomatoes.amount).toBe('1200 g');
    const added = await addIngredientsToList(db, all.filter((i) => i.name !== 'Mehl'), WEEK);
    expect(added).toBe(all.length - 1);
    expect(await addIngredientsToList(db, all, WEEK)).toBe(1);
    expect((await db.mealPlans.get(WEEK))?.ingredientsCheckedAt).toBeTruthy();
    const text = shoppingListText(await db.shoppingItems.toArray());
    expect(text).toContain('Obst und Gemüse:');
    expect(text).toContain('- Rinderhack (500 g)');
  });

  it('rechnet gleiche Mengen zusammen', () => {
    expect(addAmounts('1', '1')).toBe('2');
    expect(addAmounts('1,5 kg', '1 kg')).toBe('2,5 kg');
    expect(addAmounts('1 Bund', '2 Stück')).toBe('1 Bund + 2 Stück');
  });

  it('ordnet frei eingetippte Sachen grob einer Abteilung zu', () => {
    expect(guessSection('Bananen')).toBe('obst-gemuese');
    expect(guessSection('Vollmilch')).toBe('kuehl');
    expect(guessSection('Klopapier')).toBe('drogerie');
    expect(guessSection('Geschenkpapier')).toBe('sonstiges');
  });

  it('eine ältere Sicherung ohne Gerichte behält die Startgerichte', async () => {
    const db = await openDb();
    const backup = await exportData(db);
    const old = { ...backup, schemaVersion: 7, tables: { ...backup.tables } };
    delete old.tables.recipes; delete old.tables.mealPlans; delete old.tables.shoppingItems;
    old.tables.countries = old.tables.countries.slice(0, 1);
    const res = validateBackup(JSON.parse(JSON.stringify(old)));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    await importData(db, res.data);
    expect(await db.recipes.count()).toBe(defaultRecipes().length);
    expect(await db.countries.count()).toBe(12);
  });
});

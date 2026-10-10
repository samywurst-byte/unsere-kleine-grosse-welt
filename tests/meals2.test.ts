import { describe, expect, it } from 'vitest';
import { DEFAULT_MEAL_CATEGORIES } from '../src/data/meals';
import {
  DEFAULT_SOUP_KITCHEN, addFreezerItem, dayFromFreezer, dayFromRecipe, emptyPlan, finishCookSession, planCookSession, savePlanDays, scaleAmount,
  setPlanDay, skipCookSession, soupKitchenDue, suggestEmptyDays, weekIngredients,
} from '../src/services/meals';
import type { CookSession } from '../src/types';
import { openDb } from './helpers';

const WEEK = '2026-10-12';

describe('Portionen', () => {
  it('rechnet Mengen für mehr oder weniger Personen um', () => {
    expect(scaleAmount('500 g', 7 / 5)).toBe('700 g');
    expect(scaleAmount('3', 7 / 5)).toBe('4,5');
    expect(scaleAmount('1 Würfel', 2)).toBe('2 Würfel');
    expect(scaleAmount('1,5 kg', 2)).toBe('3 kg');
    expect(scaleAmount('etwas', 2)).toBe('etwas (× 2)');
    expect(scaleAmount('500 g', 1)).toBe('500 g');
  });

  it('nutzt die Personenzahl des Tages für die Zutaten', async () => {
    const db = await openDb();
    const recipes = await db.recipes.toArray();
    const bolo = recipes.find((r) => r.id === 'recipe-bolognese')!;
    await setPlanDay(db, '2026-10-13', { ...dayFromRecipe(bolo, '2026-10-13'), servings: 10 });
    const items = weekIngredients((await db.mealPlans.get(WEEK))!, recipes, WEEK);
    expect(items.find((i) => i.name === 'Rinderhack')?.amount).toBe('1000 g');
  });
});

describe('Gefriervorrat', () => {
  it('bucht Portionen beim Einplanen ab und beim Ändern zurück', async () => {
    const db = await openDb();
    const recipes = await db.recipes.toArray();
    const id = await addFreezerItem(db, { name: 'Rinderbrühe', recipeId: 'recipe-rinderbruehe', portions: 3, frozenAt: '2026-10-04' });
    const item = (await db.freezerItems.get(id))!;
    await setPlanDay(db, '2026-10-14', dayFromFreezer(item, '2026-10-14', recipes));
    expect((await db.freezerItems.get(id))?.portions).toBe(2);
    // Gerichte aus dem Vorrat brauchen keine Zutaten
    expect(weekIngredients((await db.mealPlans.get(WEEK))!, recipes, WEEK)).toEqual([]);
    await setPlanDay(db, '2026-10-14', dayFromRecipe(recipes[0], '2026-10-14'));
    expect((await db.freezerItems.get(id))?.portions).toBe(3);
    await setPlanDay(db, '2026-10-14', dayFromFreezer(item, '2026-10-14', recipes));
    await setPlanDay(db, '2026-10-14', null);
    expect((await db.freezerItems.get(id))?.portions).toBe(3);
  });

  it('wird beim Vorschlag zuerst verwendet', async () => {
    const db = await openDb();
    const recipes = await db.recipes.toArray();
    await addFreezerItem(db, { name: 'Neu', portions: 2, frozenAt: '2026-10-08' });
    await addFreezerItem(db, { name: 'Alt', portions: 1, frozenAt: '2026-09-01' });
    const freezer = await db.freezerItems.toArray();
    const days = suggestEmptyDays(recipes, DEFAULT_MEAL_CATEGORIES, emptyPlan(WEEK), [], freezer);
    expect(days[0].title).toBe('Alt aus dem Vorrat');
    expect(days.filter((d) => d.freezerId)).toHaveLength(1);
    await savePlanDays(db, WEEK, days);
    expect((await db.freezerItems.toArray()).find((f) => f.name === 'Alt')?.portions).toBe(0);
  });
});

describe('Suppenküche', () => {
  const s = DEFAULT_SOUP_KITCHEN;
  const session = (date: string, status: CookSession['status']): CookSession => ({ id: `cook|${date}`, date, recipeId: 'r', title: 't', emoji: '🍲', status, createdAt: '' });

  it('schlägt nur in der Saison und im Rhythmus vor', () => {
    expect(soupKitchenDue('2026-10-12', [], s)).toBe('2026-10-18');
    expect(soupKitchenDue('2026-07-06', [], s)).toBeNull();
    expect(soupKitchenDue('2026-10-12', [session('2026-10-11', 'done')], s)).toBeNull();
    expect(soupKitchenDue('2026-10-19', [session('2026-10-11', 'done')], s)).toBe('2026-10-25');
    expect(soupKitchenDue('2026-10-12', [session('2026-10-04', 'skipped')], s)).toBe('2026-10-18');
    expect(soupKitchenDue('2026-10-12', [session('2026-10-18', 'planned')], s)).toBeNull();
    expect(soupKitchenDue('2026-10-12', [], { ...s, enabled: false })).toBeNull();
  });

  it('Zutaten kommen mit, Portionen landen im Gefriervorrat', async () => {
    const db = await openDb();
    const recipes = await db.recipes.toArray();
    const broth = recipes.find((r) => r.id === 'recipe-rinderbruehe')!;
    const id = await planCookSession(db, '2026-10-18', broth);
    const items = weekIngredients(emptyPlan(WEEK), recipes, WEEK, await db.cookSessions.toArray());
    expect(items.some((i) => i.name === 'Rinderknochen')).toBe(true);
    await finishCookSession(db, id, 4, '2026-10-18');
    const freezer = await db.freezerItems.toArray();
    expect(freezer).toHaveLength(1);
    expect(freezer[0]).toMatchObject({ name: 'Rinderknochenbrühe', portions: 4, frozenAt: '2026-10-18', recipeId: broth.id });
    await finishCookSession(db, id, 4, '2026-10-18');
    expect(await db.freezerItems.count()).toBe(1);
    await skipCookSession(db, '2026-11-01');
    expect((await db.cookSessions.get('cook|2026-11-01'))?.status).toBe('skipped');
  });
});

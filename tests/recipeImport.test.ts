import { describe, expect, it } from 'vitest';
import { guessCategories, parseIngredient, parseRecipeText } from '../src/services/recipeImport';

const SAMPLE = `Unsere Rezeptsammlung
Ein paar Worte vorab, die ignoriert werden.
\fRezept: Linsensuppe mit Karotten
Kategorie: Gemüsegericht, Suppenküche
Beilage: Brot
Personen: 4
Zutaten:
- 250 g rote Linsen
- 3 Karotten
- 1 Prise Salz
• etwas Zitrone
Zubereitung:
1. Alles schneiden.
2. Kochen.
\fRezept: Dinkel-Vollkornbrot
Zutaten:
- 500 g Dinkelvollkornmehl
- 1 Würfel Hefe
Zubereitung:
Backen.
Rezept: Hähnchen-Curry
Kategorie: Hähnchen
Zutaten:
- 600 g Hähnchenbrust
- 1,5 kg Kartoffeln`;

describe('Rezepte importieren', () => {
  it('erkennt mehrere Rezepte mit Feldern, Zutaten und Zubereitung', () => {
    const r = parseRecipeText(SAMPLE);
    expect(r.map((x) => x.title)).toEqual(['Linsensuppe mit Karotten', 'Dinkel-Vollkornbrot', 'Hähnchen-Curry']);
    expect(r[0]).toMatchObject({ categories: ['veggie', 'soup'], side: 'brot', servings: 4, hints: [] });
    expect(r[0].ingredients.map((i) => [i.amount, i.name])).toEqual([['250 g', 'rote Linsen'], ['3', 'Karotten'], ['1 Prise', 'Salz'], [undefined, 'etwas Zitrone']]);
    expect(r[0].note).toBe('1. Alles schneiden.\n2. Kochen.');
    expect(r[1].categories).toEqual(['bread']);
    expect(r[1].hints).toContain('Kategorie geraten');
    expect(r[1].emoji).toBe('🍞');
    expect(r[2].categories).toEqual(['chicken']);
    expect(r[2].ingredients[1]).toMatchObject({ amount: '1,5 kg', name: 'Kartoffeln', section: 'obst-gemuese' });
  });

  it('nimmt ohne Rezept-Zeilen jede Seite als ein Rezept', () => {
    const r = parseRecipeText('Pizza Margherita\n- 500 g Mehl\n- 1 Würfel Hefe\n\fKartoffelsalat\n- 1 kg Kartoffeln');
    expect(r.map((x) => [x.title, x.categories])).toEqual([['Pizza Margherita', ['dough']], ['Kartoffelsalat', ['salad']]]);
  });

  it('rät Kategorien vorsichtig', () => {
    expect(guessCategories('Brotzeit mit Käse', [])).toEqual(['vesper']);
    expect(guessCategories('Hefezopf', [])).toEqual(['bread']);
    expect(guessCategories('Omas Sonntagsessen', [{ name: 'Rinderhack', section: 'fleisch' }])).toEqual(['beef']);
    expect(parseIngredient('- ca. 2-3 EL Öl')).toMatchObject({ amount: 'ca. 2-3 EL', name: 'Öl' });
    expect(parseIngredient('- ½ TL Salz')).toMatchObject({ amount: '½ TL', name: 'Salz' });
    expect(parseIngredient('- Eier, 3 Stück')).toMatchObject({ name: 'Eier, 3 Stück' });
  });
});

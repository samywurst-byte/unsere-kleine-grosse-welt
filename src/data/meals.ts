import type { Ingredient, MealCategory, MealSide, Recipe, ShopSection } from '../types';

/**
 * Startsammlung für den Essensplan. Ids bleiben dauerhaft. Mengen sind für 2 Erwachsene und 3 Kinder gedacht
 * und dürfen in den Gerichten angepasst werden.
 */

export const DEFAULT_MEAL_CATEGORIES: MealCategory[] = [
  { id: 'sweet', label: 'Süßes Hauptgericht', emoji: '🥞', perWeek: 1 },
  { id: 'veggie', label: 'Gemüsegericht', emoji: '🥕', perWeek: 1 },
  { id: 'salad', label: 'Salatgericht', emoji: '🥗', perWeek: 1 },
  { id: 'beef', label: 'Rinderhack', emoji: '🍝', perWeek: 1 },
  { id: 'chicken', label: 'Hähnchen', emoji: '🍗', perWeek: 1 },
  { id: 'dough', label: 'Pizza oder Teig', emoji: '🍕', perWeek: 1 },
  { id: 'vesper', label: 'Vesper', emoji: '🥨', perWeek: 1 },
  { id: 'soup', label: 'Suppenküche', emoji: '🍲', perWeek: 0 },
  { id: 'bread', label: 'Brot und Backen', emoji: '🍞', perWeek: 0, notMeal: true },
  { id: 'side', label: 'Beilagen und Soßen', emoji: '🥣', perWeek: 0, notMeal: true },
  { id: 'breakfast', label: 'Frühstück', emoji: '🥐', perWeek: 0, notMeal: true },
];

export const SIDE_LABEL: Record<MealSide, string> = {
  reis: 'Reis', nudeln: 'Nudeln', kartoffeln: 'Kartoffeln', couscous: 'Couscous', bulgur: 'Bulgur', brot: 'Brot',
};

export const SECTION_LABEL: Record<ShopSection, string> = {
  'obst-gemuese': 'Obst und Gemüse', brot: 'Brot und Backwaren', kuehl: 'Kühlregal', fleisch: 'Fleisch und Wurst',
  vorrat: 'Vorrat', tk: 'Tiefkühl', drogerie: 'Drogerie und Haushalt', sonstiges: 'Sonstiges',
};

export const SECTION_ORDER: ShopSection[] = ['obst-gemuese', 'brot', 'kuehl', 'fleisch', 'vorrat', 'tk', 'drogerie', 'sonstiges'];

/** Grobe Zuordnung für frei eingetippte Einträge. */
const SECTION_WORDS: [ShopSection, string[]][] = [
  ['obst-gemuese', ['apfel', 'äpfel', 'banane', 'birne', 'beere', 'tomate', 'gurke', 'paprika', 'zwiebel', 'knoblauch', 'karotte', 'möhre', 'salat', 'zucchini', 'brokkoli', 'kartoffel', 'lauch', 'sellerie', 'petersilie', 'schnittlauch', 'kohl', 'zitrone', 'obst', 'gemüse', 'mais', 'pilz', 'champignon', 'kürbis', 'spinat', 'radieschen', 'trauben', 'mandarine', 'orange', 'kiwi']],
  ['brot', ['brot', 'brötchen', 'brezel', 'toast', 'baguette', 'semmel']],
  ['kuehl', ['milch', 'butter', 'käse', 'joghurt', 'quark', 'sahne', 'ei', 'eier', 'schmand', 'frischkäse', 'mozzarella', 'hefe', 'creme', 'maultasche']],
  ['fleisch', ['hack', 'hähnchen', 'huhn', 'wurst', 'schinken', 'speck', 'fleisch', 'rind', 'knochen', 'putenbrust']],
  ['tk', ['tiefkühl', 'tk ', 'erbsen', 'eis', 'fischstäbchen']],
  ['drogerie', ['spülmittel', 'zahnpasta', 'windel', 'shampoo', 'seife', 'toilettenpapier', 'klopapier', 'küchenrolle', 'waschmittel', 'tücher']],
  ['vorrat', ['mehl', 'zucker', 'reis', 'nudel', 'spaghetti', 'couscous', 'bulgur', 'öl', 'essig', 'salz', 'pfeffer', 'passierte', 'tomatenmark', 'brühe', 'honig', 'marmelade', 'kakao', 'haferflocken', 'müsli', 'apfelmus', 'linsen', 'dose', 'konserve', 'grieß', 'rosinen', 'zimt', 'vanille', 'backpulver', 'senf', 'ketchup']],
];

export function guessSection(name: string): ShopSection {
  const n = ` ${name.toLowerCase()} `;
  for (const [section, words] of SECTION_WORDS) if (words.some((w) => n.includes(w))) return section;
  return 'sonstiges';
}

const i = (name: string, amount?: string, section: ShopSection = guessSection(name)): Ingredient => ({ name, ...(amount ? { amount } : {}), section });

type Seed = Omit<Recipe, 'createdAt' | 'updatedAt'>;
const r = (id: string, title: string, emoji: string, categories: string[], side: MealSide | undefined, ingredients: Ingredient[], note?: string): Seed => ({
  id: `recipe-${id}`, title, emoji, categories, ...(side ? { side } : {}), ingredients, ...(note ? { note } : {}),
});

const SEED: Seed[] = [
  // Süß
  r('kaiserschmarrn', 'Kaiserschmarrn mit Apfelmus', '🥞', ['sweet'], undefined, [i('Mehl', '250 g'), i('Milch', '500 ml'), i('Eier', '5'), i('Apfelmus', '1 Glas'), i('Rosinen', 'nach Wunsch'), i('Puderzucker', undefined, 'vorrat')]),
  r('milchreis', 'Milchreis mit Zimt und Zucker', '🍚', ['sweet'], 'reis', [i('Milchreis', '250 g', 'vorrat'), i('Milch', '1 l'), i('Zimt'), i('Kirschen oder Apfelmus', '1 Glas', 'vorrat')]),
  r('dampfnudeln', 'Dampfnudeln mit Vanillesoße', '🥟', ['sweet', 'dough'], undefined, [i('Mehl', '500 g'), i('Hefe', '1 Würfel'), i('Milch', '700 ml'), i('Butter', '100 g'), i('Vanillesoßenpulver', '1 Päckchen', 'vorrat')]),
  r('waffeln', 'Waffeln mit Obst', '🧇', ['sweet'], undefined, [i('Mehl', '300 g'), i('Eier', '3'), i('Milch', '400 ml'), i('Butter', '125 g'), i('Obst nach Saison', undefined, 'obst-gemuese')]),
  r('griessbrei', 'Grießbrei mit Früchten', '🥣', ['sweet'], undefined, [i('Grieß', '150 g'), i('Milch', '1 l'), i('Beeren (TK)', '300 g', 'tk')]),
  // Gemüse
  r('gemuesesuppe', 'Gemüsesuppe mit Brot', '🥣', ['veggie', 'soup'], 'brot', [i('Karotten', '4'), i('Kartoffeln', '4'), i('Lauch', '1'), i('Sellerie', '1 Stück'), i('Gemüsebrühe'), i('Brot', '1 Laib')]),
  r('ofengemuese', 'Ofengemüse mit Kräuterquark', '🥔', ['veggie'], 'kartoffeln', [i('Kartoffeln', '1 kg'), i('Karotten', '4'), i('Zucchini', '2'), i('Paprika', '2'), i('Quark', '500 g'), i('Schnittlauch', '1 Bund')]),
  r('gemuesepfanne', 'Gemüsepfanne mit Reis', '🍳', ['veggie'], 'reis', [i('Reis', '300 g'), i('Brokkoli', '1'), i('Karotten', '3'), i('Paprika', '2'), i('Mais', '1 Dose', 'vorrat'), i('Sojasoße', undefined, 'vorrat')]),
  r('kuerbissuppe', 'Kürbissuppe', '🎃', ['veggie', 'soup'], 'brot', [i('Hokkaido-Kürbis', '1'), i('Karotten', '2'), i('Zwiebel', '1'), i('Gemüsebrühe'), i('Sahne', '200 ml'), i('Brot', '1 Laib')]),
  r('spinat', 'Rahmspinat mit Spiegelei und Kartoffeln', '🍳', ['veggie'], 'kartoffeln', [i('Rahmspinat (TK)', '750 g', 'tk'), i('Eier', '6'), i('Kartoffeln', '1 kg')]),
  // Salat
  r('nudelsalat', 'Nudelsalat mit Gemüse und Ei', '🥗', ['salad'], 'nudeln', [i('Nudeln', '500 g'), i('Erbsen (TK)', '300 g', 'tk'), i('Eier', '4'), i('Gurke', '1'), i('Joghurt', '300 g'), i('Fleischwurst', 'nach Wunsch', 'fleisch')]),
  r('kartoffelsalat', 'Kartoffelsalat mit Würstchen', '🥔', ['salad'], 'kartoffeln', [i('Kartoffeln (festkochend)', '1,5 kg'), i('Gemüsebrühe'), i('Zwiebel', '1'), i('Essig und Öl', undefined, 'vorrat'), i('Wiener Würstchen', '8', 'fleisch')]),
  r('couscoussalat', 'Couscoussalat', '🥙', ['salad'], 'couscous', [i('Couscous', '300 g'), i('Gurke', '1'), i('Tomaten', '4'), i('Paprika', '1'), i('Feta', '200 g', 'kuehl'), i('Zitrone', '1')]),
  r('bulgursalat', 'Bulgursalat mit Hähnchen', '🥗', ['salad', 'chicken'], 'bulgur', [i('Bulgur', '300 g'), i('Hähnchenbrust', '400 g'), i('Tomaten', '4'), i('Gurke', '1'), i('Petersilie', '1 Bund')]),
  // Rinderhack
  r('bolognese', 'Spaghetti Bolognese', '🍝', ['beef'], 'nudeln', [i('Spaghetti', '500 g'), i('Rinderhack', '500 g'), i('Passierte Tomaten', '700 g'), i('Karotten', '2'), i('Zwiebel', '1'), i('Parmesan', undefined, 'kuehl')]),
  r('frikadellen', 'Frikadellen mit Kartoffelbrei', '🍔', ['beef'], 'kartoffeln', [i('Rinderhack', '500 g'), i('Brötchen vom Vortag', '1', 'brot'), i('Eier', '1'), i('Kartoffeln', '1 kg'), i('Milch', '200 ml'), i('Gurke', '1')]),
  r('paprika', 'Gefüllte Paprika mit Reis', '🫑', ['beef'], 'reis', [i('Paprika', '6'), i('Rinderhack', '400 g'), i('Reis', '200 g'), i('Passierte Tomaten', '500 g')]),
  r('chili', 'Mildes Chili mit Brot', '🌶️', ['beef'], 'brot', [i('Rinderhack', '500 g'), i('Kidneybohnen', '1 Dose', 'vorrat'), i('Mais', '1 Dose', 'vorrat'), i('Passierte Tomaten', '700 g'), i('Brot', '1 Laib')]),
  // Hähnchen
  r('haehnchen-reis', 'Hähnchen mit Reis und Gemüse', '🍗', ['chicken'], 'reis', [i('Hähnchenbrust', '600 g'), i('Reis', '300 g'), i('Brokkoli', '1'), i('Karotten', '3')]),
  r('ofenhaehnchen', 'Ofenhähnchen mit Kartoffeln', '🍗', ['chicken'], 'kartoffeln', [i('Hähnchenschenkel', '6'), i('Kartoffeln', '1 kg'), i('Karotten', '4'), i('Paprika', '1')]),
  r('huehnersuppe', 'Hühnersuppe mit Nudeln', '🍜', ['chicken', 'soup'], 'nudeln', [i('Suppenhuhn oder Hähnchenschenkel', '1 kg', 'fleisch'), i('Suppengemüse', '1 Bund'), i('Suppennudeln', '250 g', 'vorrat')]),
  r('haehnchen-nudeln', 'Hähnchen-Sahne-Nudeln', '🍝', ['chicken'], 'nudeln', [i('Hähnchenbrust', '500 g'), i('Nudeln', '500 g'), i('Sahne', '200 ml'), i('Erbsen (TK)', '300 g', 'tk')]),
  // Pizza und Teig
  r('pizza', 'Selbst gemachte Pizza', '🍕', ['dough'], undefined, [i('Mehl', '500 g'), i('Hefe', '1 Würfel'), i('Passierte Tomaten', '500 g'), i('Mozzarella', '2'), i('Kochschinken', '200 g', 'fleisch'), i('Paprika', '1'), i('Mais', '1 Dose', 'vorrat')]),
  r('pizzaschnecken', 'Pizzaschnecken', '🌀', ['dough'], undefined, [i('Pizzateig (Kühlregal)', '2 Rollen', 'kuehl'), i('Tomatenmark'), i('Geriebener Käse', '200 g', 'kuehl'), i('Kochschinken', '150 g', 'fleisch')]),
  r('flammkuchen', 'Flammkuchen', '🥧', ['dough'], undefined, [i('Flammkuchenteig', '2 Rollen', 'kuehl'), i('Schmand', '400 g'), i('Speckwürfel', '200 g', 'fleisch'), i('Zwiebel', '2')]),
  r('maultaschen', 'Maultaschen in der Brühe', '🥟', ['dough', 'soup'], undefined, [i('Maultaschen', '2 Packungen', 'kuehl'), i('Rinderbrühe aus dem Vorrat oder Glas', '1,5 l', 'vorrat'), i('Schnittlauch', '1 Bund')]),
  // Vesper
  r('vesper', 'Vesper mit Eiern, Rohkost und Aufstrichen', '🥨', ['vesper'], 'brot', [i('Brot', '1 Laib'), i('Brezeln', '5', 'brot'), i('Eier', '6'), i('Gurke', '1'), i('Karotten', '4'), i('Paprika', '2'), i('Frischkäse', '1'), i('Käse', '200 g')]),
  r('brotzeit', 'Brotzeit mit Wurst und Käse', '🧀', ['vesper'], 'brot', [i('Bauernbrot', '1 Laib', 'brot'), i('Käse', '200 g'), i('Wurstaufschnitt', '200 g', 'fleisch'), i('Tomaten', '4'), i('Radieschen', '1 Bund')]),
  // Suppenküche
  r('rinderbruehe', 'Rinderknochenbrühe (große Menge)', '🍲', ['soup'], undefined, [i('Rinderknochen', '2 kg', 'fleisch'), i('Suppenfleisch', '500 g', 'fleisch'), i('Suppengemüse', '2 Bund'), i('Zwiebel', '2')],
    'Am Vortag ansetzen, mehrere Stunden köcheln. Portionen einfrieren.'),
  r('nudelsuppe', 'Nudelsuppe', '🍜', ['soup'], 'nudeln', [i('Brühe aus dem Vorrat', '1,5 l', 'vorrat'), i('Suppennudeln', '250 g', 'vorrat'), i('Karotten', '2')]),
];

export function defaultRecipes(now = new Date().toISOString()): Recipe[] {
  return SEED.map((s) => ({ ...s, createdAt: now, updatedAt: now }));
}

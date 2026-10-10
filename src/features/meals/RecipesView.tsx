import { FileUp, Minus, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Field, Toggle } from '../../components/FormControls';
import { Modal } from '../../components/Modal';
import { DEFAULT_MEAL_CATEGORIES, SECTION_LABEL, SECTION_ORDER, SIDE_LABEL, guessSection } from '../../data/meals';
import { db } from '../../database/db';
import { useRecipes, useSettings } from '../../hooks/useData';
import { mealCategories, saveRecipe } from '../../services/meals';
import { extractPdfText, findExisting, parseRecipeText, type ParsedRecipe } from '../../services/recipeImport';
import type { Ingredient, MealCategory, MealSide, Recipe, ShopSection } from '../../types';

type Draft = Omit<Recipe, 'createdAt' | 'updatedAt'> & { createdAt?: string };

/** Eure Gerichte: anlegen, anpassen, Favoriten markieren, pausieren. Dazu die Wochenziele. */
export function RecipesView() {
  const recipes = useRecipes();
  const settings = useSettings();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [importing, setImporting] = useState<{ parsed: ParsedRecipe[]; files: string[] } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  if (!recipes || !settings) return null;
  const cats = mealCategories(settings);
  const sorted = [...recipes].sort((a, b) => a.title.localeCompare(b.title, 'de'));
  const setCats = (next: MealCategory[]) => void db.settings.update('app', { mealCategories: next });

  return (
    <div className="stack">
      <div className="card">
        <h3 className="card__title">Wochenziele</h3>
        <p className="small muted">Wie oft pro Woche soll jede Art Gericht vorkommen? Es sind Ziele, keine Pflicht. 0 = nur zum Sortieren.</p>
        <ul className="list">
          {cats.map((c) => (
            <li key={c.id} className="list-item">
              <span className="meal-day__emoji" aria-hidden="true">{c.emoji}</span>
              <div className="list-item__main"><p className="list-item__title">{c.label}</p></div>
              <button type="button" className="btn btn--icon btn--small" aria-label={`${c.label} weniger`} disabled={c.perWeek <= 0}
                onClick={() => setCats(cats.map((x) => (x.id === c.id ? { ...x, perWeek: x.perWeek - 1 } : x)))}><Minus size={16} /></button>
              <strong className="meal-count">{c.perWeek}×</strong>
              <button type="button" className="btn btn--icon btn--small" aria-label={`${c.label} mehr`} disabled={c.perWeek >= 7}
                onClick={() => setCats(cats.map((x) => (x.id === c.id ? { ...x, perWeek: x.perWeek + 1 } : x)))}><Plus size={16} /></button>
            </li>
          ))}
        </ul>
        {settings.mealCategories && <button type="button" className="btn btn--small btn--ghost" onClick={() => void db.settings.update('app', { mealCategories: undefined })}>Auf Standard zurücksetzen</button>}
      </div>

      <div className="parent-section__head">
        <h3>Unsere Gerichte ({recipes.length})</h3>
        <div className="row row--wrap">
          <button type="button" className="btn" disabled={reading} onClick={() => fileRef.current?.click()}><FileUp size={18} aria-hidden="true" /> {reading ? 'Lese …' : 'Rezepte importieren'}</button>
          <button type="button" className="btn btn--sky" onClick={() => setEditing({ id: '', title: '', emoji: '🍽️', categories: [], ingredients: [] })}><Plus size={18} aria-hidden="true" /> Gericht</button>
        </div>
        <input ref={fileRef} type="file" accept="application/pdf,.pdf,text/plain,.txt" multiple hidden
          onChange={(e) => { const files = [...(e.target.files ?? [])]; e.target.value = ''; void readFiles(files); }} />
      </div>
      <p className="small muted">Viele Rezepte auf einmal: PDF- oder Textdateien im Format der Vorlage auswählen (mehrere gleichzeitig möglich). Vor dem Speichern seht ihr eine Vorschau.</p>
      {importError && <p className="notice notice--error">{importError}</p>}
      <ul className="list">
        {sorted.map((r) => (
          <li key={r.id} className="list-item" style={{ opacity: r.paused ? 0.5 : 1 }}>
            <span className="meal-day__emoji" aria-hidden="true">{r.emoji}</span>
            <div className="list-item__main">
              <p className="list-item__title">{r.title}{r.favorite && <Star size={16} fill="currentColor" aria-label="Favorit" className="meal-star" />}{r.paused && ' (pausiert)'}</p>
              <p className="list-item__meta">
                {r.categories.map((c) => cats.find((x) => x.id === c)?.label ?? DEFAULT_MEAL_CATEGORIES.find((x) => x.id === c)?.label).filter(Boolean).join(', ') || 'ohne Kategorie'}
                {r.side ? ` · ${SIDE_LABEL[r.side]}` : ''} · {r.ingredients.length} Zutaten
              </p>
            </div>
            <button type="button" className="btn btn--small" onClick={() => setEditing(r)}><Pencil size={16} aria-hidden="true" /> Bearbeiten</button>
          </li>
        ))}
      </ul>
      {editing && <RecipeModal recipe={editing} cats={cats} onClose={() => setEditing(null)} />}
      {importing && <ImportModal parsed={importing.parsed} files={importing.files} recipes={recipes} cats={cats} onClose={() => setImporting(null)} />}
    </div>
  );

  async function readFiles(files: File[]) {
    if (!files.length) return;
    setImportError(null); setReading(true);
    try {
      const parsed: ParsedRecipe[] = [];
      for (const f of files) {
        const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
        const text = isPdf ? await extractPdfText(await f.arrayBuffer()) : await f.text();
        parsed.push(...parseRecipeText(text, cats));
      }
      if (!parsed.length) setImportError('In den Dateien wurde kein Rezept gefunden. Jedes Rezept sollte mit einer Zeile „Rezept: Name“ beginnen, wie in der Vorlage.');
      else setImporting({ parsed, files: files.map((f) => f.name) });
    } catch (e) {
      setImportError(`Die Datei konnte nicht gelesen werden: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setReading(false);
    }
  }
}

/** Vorschau: was erkannt wurde, mit Kategorie. Abwählen, Kategorie ändern, doppelte Namen überspringen oder ersetzen. */
function ImportModal({ parsed, files, recipes, cats, onClose }: { parsed: ParsedRecipe[]; files: string[]; recipes: Recipe[]; cats: MealCategory[]; onClose: () => void }) {
  const [rows, setRows] = useState(() => parsed.map((p, i) => {
    // Steht dasselbe Rezept mehrfach in den Dateien, wird nur das erste übernommen
    const twice = parsed.findIndex((q) => findExisting(q, [{ ...p, id: '', createdAt: '', updatedAt: '' } as Recipe])) < i;
    return { p, on: !twice, replace: false, existing: findExisting(p, recipes), twice };
  }));
  const [done, setDone] = useState<number | null>(null);
  const update = (i: number, patch: Partial<(typeof rows)[number]>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const chosen = rows.filter((r) => r.on && (!r.existing || r.replace));
  const save = async () => {
    for (const { p, existing } of chosen) {
      await saveRecipe(db, {
        id: existing?.id, createdAt: existing?.createdAt, favorite: existing?.favorite, paused: existing?.paused,
        title: p.title, emoji: p.emoji, categories: p.categories, side: p.side, servings: p.servings, ingredients: p.ingredients, note: p.note,
      });
    }
    setDone(chosen.length);
  };
  return (
    <Modal title={`${parsed.length} ${parsed.length === 1 ? 'Rezept' : 'Rezepte'} gefunden`} onClose={onClose} wide
      actions={done === null
        ? <><button type="button" className="btn" onClick={onClose}>Abbrechen</button>
          <button type="button" className="btn btn--primary" disabled={!chosen.length} onClick={() => void save()}>{chosen.length} übernehmen</button></>
        : <button type="button" className="btn btn--primary" onClick={onClose}>Fertig</button>}
    >
      {done !== null ? <p className="notice notice--ok">{done} {done === 1 ? 'Rezept ist' : 'Rezepte sind'} jetzt unter „Gerichte“.</p> : (
        <div className="stack">
          <p className="small muted">Aus {files.join(', ')}. Kategorien lassen sich hier antippen und später beim Gericht ändern.</p>
          <ul className="list">
            {rows.map((r, i) => (
              <li key={i} className={`list-item meal-import ${r.on ? '' : 'is-off'}`}>
                <input type="checkbox" className="meal-import__check" checked={r.on} aria-label={`${r.p.title} übernehmen`} onChange={(e) => update(i, { on: e.target.checked })} />
                <span className="meal-day__emoji" aria-hidden="true">{r.p.emoji}</span>
                <div className="list-item__main">
                  <p className="list-item__title">{r.p.title}</p>
                  <p className="list-item__meta">{r.p.ingredients.length} Zutaten{r.p.servings ? ` · für ${r.p.servings}` : ''}{r.p.side ? ` · ${SIDE_LABEL[r.p.side]}` : ''}{r.p.hints.length ? ` · ${r.p.hints.join(', ')}` : ''}{r.twice ? ' · steht doppelt in den Dateien' : ''}</p>
                  <div className="seg meal-import__cats" role="group" aria-label={`Kategorien ${r.p.title}`}>
                    {cats.map((c) => (
                      <button key={c.id} type="button" className="seg__item seg__item--small" aria-pressed={r.p.categories.includes(c.id)}
                        onClick={() => update(i, { p: { ...r.p, categories: r.p.categories.includes(c.id) ? r.p.categories.filter((x) => x !== c.id) : [...r.p.categories, c.id] } })}>
                        {c.emoji} {c.label}
                      </button>
                    ))}
                  </div>
                  {r.existing && (
                    <label className="small meal-import__dup">
                      <input type="checkbox" checked={r.replace} onChange={(e) => update(i, { replace: e.target.checked })} /> Gibt es schon. Ersetzen?
                    </label>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}

function RecipeModal({ recipe, cats, onClose }: { recipe: Draft; cats: MealCategory[]; onClose: () => void }) {
  const [r, setR] = useState<Draft>(recipe);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (p: Partial<Draft>) => setR({ ...r, ...p });
  const setIng = (idx: number, p: Partial<Ingredient>) => set({ ingredients: r.ingredients.map((x, i) => (i === idx ? { ...x, ...p } : x)) });
  const save = async () => { await saveRecipe(db, r); onClose(); };
  return (
    <Modal title={recipe.id ? 'Gericht bearbeiten' : 'Neues Gericht'} onClose={onClose} wide
      actions={<>
        {recipe.id && !confirmDelete && <button type="button" className="btn btn--danger" onClick={() => setConfirmDelete(true)}>Löschen</button>}
        {confirmDelete && <button type="button" className="btn btn--danger" onClick={() => void db.recipes.delete(recipe.id).then(onClose)}>Wirklich löschen</button>}
        <div className="spacer" />
        <button type="button" className="btn" onClick={onClose}>Abbrechen</button>
        <button type="button" className="btn btn--primary" disabled={!r.title.trim()} onClick={() => void save()}>Speichern</button>
      </>}
    >
      <div className="stack">
        <div className="row">
          <Field label="Bild"><input className="input meal-emoji-input" value={r.emoji} maxLength={4} onChange={(e) => set({ emoji: e.target.value })} /></Field>
          <Field label="Name" className="grow"><input className="input" value={r.title} onChange={(e) => set({ title: e.target.value })} placeholder="z. B. Linsensuppe" /></Field>
        </div>
        <Field label="Kategorien (mehrere möglich)">
          <div className="seg" role="group" aria-label="Kategorien">
            {cats.map((c) => (
              <button key={c.id} type="button" className="seg__item" aria-pressed={r.categories.includes(c.id)}
                onClick={() => set({ categories: r.categories.includes(c.id) ? r.categories.filter((x) => x !== c.id) : [...r.categories, c.id] })}>{c.emoji} {c.label}</button>
            ))}
          </div>
        </Field>
        <Field label="Beilage">
          <div className="seg" role="group" aria-label="Beilage">
            <button type="button" className="seg__item" aria-pressed={!r.side} onClick={() => set({ side: undefined })}>keine</button>
            {(Object.keys(SIDE_LABEL) as MealSide[]).map((s) => <button key={s} type="button" className="seg__item" aria-pressed={r.side === s} onClick={() => set({ side: s })}>{SIDE_LABEL[s]}</button>)}
          </div>
        </Field>
        <Field label="Mengen gedacht für">
          <div className="row meal-stepper">
            <button type="button" className="btn btn--icon btn--small" aria-label="Weniger Personen" disabled={(r.servings ?? 5) <= 1} onClick={() => set({ servings: (r.servings ?? 5) - 1 })}><Minus size={16} /></button>
            <strong className="meal-count">{r.servings ?? 5}</strong>
            <button type="button" className="btn btn--icon btn--small" aria-label="Mehr Personen" onClick={() => set({ servings: (r.servings ?? 5) + 1 })}><Plus size={16} /></button>
            <span className="muted small">Personen</span>
          </div>
        </Field>
        <div>
          <h3 className="ft-sub">Zutaten</h3>
          <div className="meal-ing-rows">
            {r.ingredients.map((ing, idx) => (
              <div key={idx} className="row">
                <input className="input grow" value={ing.name} aria-label="Zutat" placeholder="Zutat"
                  onChange={(e) => setIng(idx, { name: e.target.value, ...(ing.section === 'sonstiges' ? { section: guessSection(e.target.value) } : {}) })} />
                <input className="input meal-add__amount" value={ing.amount ?? ''} aria-label="Menge" placeholder="Menge" onChange={(e) => setIng(idx, { amount: e.target.value })} />
                <select className="input meal-add__section" value={ing.section} aria-label="Abteilung" onChange={(e) => setIng(idx, { section: e.target.value as ShopSection })}>
                  {SECTION_ORDER.map((s) => <option key={s} value={s}>{SECTION_LABEL[s]}</option>)}
                </select>
                <button type="button" className="btn btn--icon btn--ghost" aria-label="Zutat entfernen" onClick={() => set({ ingredients: r.ingredients.filter((_, i) => i !== idx) })}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn--small" onClick={() => set({ ingredients: [...r.ingredients, { name: '', section: 'sonstiges' }] })}><Plus size={16} aria-hidden="true" /> Zutat</button>
        </div>
        <Field label="Notiz, z. B. Rezept oder Vorbereitung"><textarea className="input" rows={3} value={r.note ?? ''} onChange={(e) => set({ note: e.target.value || undefined })} /></Field>
        <Toggle label="Favorit (wird öfter vorgeschlagen)" checked={!!r.favorite} onChange={(favorite) => set({ favorite })} />
        <Toggle label="Pausieren (wird gerade nicht vorgeschlagen)" checked={!!r.paused} onChange={(paused) => set({ paused })} />
      </div>
    </Modal>
  );
}

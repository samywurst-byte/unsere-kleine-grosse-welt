import { ArrowLeftRight, ChevronLeft, ChevronRight, ShoppingCart, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Segmented } from '../../components/FormControls';
import { Modal } from '../../components/Modal';
import { SIDE_LABEL } from '../../data/meals';
import { db } from '../../database/db';
import { useChildren, useMealPlans, useRecipes, useSettings } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import {
  addIngredientsToList, categoryProgress, dayFromRecipe, emptyPlan, mealCategories, rankRecipes, savePlanDays, setPlanDay, sideCounts,
  suggestEmptyDays, swapPlanDays, weekDates, weekIngredients, type NeededIngredient,
} from '../../services/meals';
import type { MealCategory, MealPlan, MealPlanDay, MealSide, Recipe } from '../../types';
import { addDaysKey, formatDayMonth, formatWeekday, toDateKey, weekdayOf, weekStartKey } from '../../utils/dates';
import { RecipesView } from './RecipesView';
import { ShoppingView } from './ShoppingView';
import './meals.css';

type Tab = 'plan' | 'list' | 'recipes';

/** Essen im Elternbereich: Wochenplan, Einkaufsliste und eure Gerichte. */
export function MealsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'plan';
  return (
    <div className="parent-section">
      <div className="parent-section__head">
        <h2>Essen</h2>
        <Segmented<Tab> label="Bereich" value={tab} onChange={(t) => setParams({ tab: t }, { replace: true })}
          options={[{ value: 'plan', label: 'Wochenplan' }, { value: 'list', label: 'Einkaufsliste' }, { value: 'recipes', label: 'Gerichte' }]} />
      </div>
      {tab === 'plan' && <PlanView />}
      {tab === 'list' && <ShoppingView />}
      {tab === 'recipes' && <RecipesView />}
    </div>
  );
}

/** Ab Samstag planen die meisten schon die kommende Woche. */
export function planningWeek(today: string): string {
  const start = weekStartKey(today);
  const wd = weekdayOf(today);
  return wd === 6 || wd === 0 ? addDaysKey(start, 7) : start;
}

function PlanView() {
  const today = toDateKey(useNow(60_000));
  const [week, setWeek] = useState(() => planningWeek(today));
  const recipes = useRecipes();
  const plans = useMealPlans();
  const settings = useSettings();
  const children = useChildren();
  const [picking, setPicking] = useState<string | null>(null);
  const [swapFrom, setSwapFrom] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<MealPlanDay[] | null>(null);
  const [checking, setChecking] = useState(false);
  if (!recipes || !plans || !settings || !children) return null;

  const plan = plans.find((p) => p.id === week) ?? emptyPlan(week);
  const recent = plans.filter((p) => p.id < week && p.id >= addDaysKey(week, -21));
  const cats = mealCategories(settings);
  const catById = new Map(cats.map((c) => [c.id, c]));
  const progress = categoryProgress(plan, cats);
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const sides = sideCounts([plan, ...recent]);
  const rareSides = (Object.keys(SIDE_LABEL) as MealSide[]).filter((s) => sides[s] === 0);
  const freeDays = weekDates(week).filter((d) => !plan.days.some((x) => x.date === d));
  const kid = (id?: string) => children.find((c) => c.id === id);

  const tapDay = (date: string) => {
    if (!swapFrom) return setPicking(date);
    if (swapFrom !== date) void swapPlanDays(db, swapFrom, date);
    setSwapFrom(null);
  };

  return (
    <div className="stack">
      <div className="meal-week">
        <button type="button" className="btn btn--icon btn--ghost" aria-label="Woche davor" onClick={() => setWeek(addDaysKey(week, -7))}><ChevronLeft size={22} /></button>
        <strong>{week === weekStartKey(today) ? 'Diese Woche' : week === addDaysKey(weekStartKey(today), 7) ? 'Nächste Woche' : `Woche ab ${formatDayMonth(week)}`}</strong>
        <span className="muted small">{formatDayMonth(week)} bis {formatDayMonth(addDaysKey(week, 6))}</span>
        <button type="button" className="btn btn--icon btn--ghost" aria-label="Woche danach" onClick={() => setWeek(addDaysKey(week, 7))}><ChevronRight size={22} /></button>
      </div>

      <div className="meal-goals" aria-label="Wochenziele">
        {progress.map(({ category, have }) => (
          <span key={category.id} className={`meal-goal ${have >= category.perWeek ? 'is-done' : ''}`}>
            <span aria-hidden="true">{category.emoji}</span> {category.label} {have}/{category.perWeek}
          </span>
        ))}
      </div>
      {rareSides.length > 0 && <p className="small muted">Länger nicht dabei: {rareSides.map((s) => SIDE_LABEL[s]).join(', ')}. Nur eine Anregung.</p>}

      {plan.wishes.length > 0 && (
        <div className="card meal-wishes">
          <h3 className="card__eyebrow">Wünsche aus dem Familienrat</h3>
          <div className="row row--wrap">
            {plan.wishes.map((w) => {
              const r = byId.get(w.recipeId);
              const c = kid(w.childId);
              if (!r) return null;
              return (
                <button key={`${w.childId}-${w.recipeId}`} type="button" className="btn meal-wish" disabled={!freeDays.length}
                  onClick={() => void setPlanDay(db, freeDays[0], dayFromRecipe(r, freeDays[0], w.childId))}>
                  {c && <Avatar avatar={c.avatar} color={c.color} size={30} />} {c?.name}: {r.emoji} {r.title}
                  <span className="small muted">{freeDays.length ? `· auf ${formatWeekday(freeDays[0])}` : '· kein Tag frei'}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <ol className="meal-days">
        {weekDates(week).map((date) => {
          const d = plan.days.find((x) => x.date === date);
          const wisher = kid(d?.wishedBy);
          return (
            <li key={date} className={`meal-day ${date === today ? 'is-today' : ''} ${swapFrom === date ? 'is-swap' : ''}`}>
              <span className="meal-day__when"><strong>{formatWeekday(date).slice(0, 2)}</strong><span className="small muted">{formatDayMonth(date)}</span></span>
              <button type="button" className="meal-day__main" onClick={() => tapDay(date)}>
                {d ? (
                  <>
                    <span className="meal-day__emoji" aria-hidden="true">{d.emoji ?? '🍽️'}</span>
                    <span className="meal-day__title">{d.title}</span>
                    <span className="meal-day__tags">
                      {d.categories.map((c) => catById.get(c)).filter((c): c is MealCategory => !!c).map((c) => <span key={c.id} className="chip">{c.emoji} {c.label}</span>)}
                      {d.side && <span className="chip">{SIDE_LABEL[d.side]}</span>}
                      {wisher && <span className="chip">Wunsch von {wisher.name}</span>}
                    </span>
                  </>
                ) : <span className="muted">{swapFrom ? 'Hierher tauschen' : 'Noch frei · antippen'}</span>}
              </button>
              {d && !swapFrom && (
                <>
                  <button type="button" className="btn btn--icon btn--ghost" aria-label={`${formatWeekday(date)} tauschen`} onClick={() => setSwapFrom(date)}><ArrowLeftRight size={18} /></button>
                  <button type="button" className="btn btn--icon btn--ghost" aria-label={`${formatWeekday(date)} leeren`} onClick={() => void setPlanDay(db, date, null)}><Trash2 size={18} /></button>
                </>
              )}
            </li>
          );
        })}
      </ol>
      {swapFrom && <p className="notice notice--info">Jetzt den Tag antippen, mit dem getauscht werden soll. <button type="button" className="btn btn--small btn--ghost" onClick={() => setSwapFrom(null)}>Abbrechen</button></p>}

      <div className="row row--wrap">
        <button type="button" className="btn btn--sky" disabled={!freeDays.length} onClick={() => setSuggestion(suggestEmptyDays(recipes, cats, plan, recent))}>
          <Wand2 size={18} aria-hidden="true" /> Freie Tage vorschlagen
        </button>
        <button type="button" className="btn btn--sage" disabled={!plan.days.some((d) => d.recipeId)} onClick={() => setChecking(true)}>
          <ShoppingCart size={18} aria-hidden="true" /> Zutaten prüfen
        </button>
        {plan.ingredientsCheckedAt && <span className="small muted">Zutaten zuletzt geprüft am {formatDayMonth(toDateKey(new Date(plan.ingredientsCheckedAt)))}</span>}
      </div>

      {picking && <PickModal date={picking} recipes={recipes} cats={cats} plan={plan} recent={recent} onClose={() => setPicking(null)} />}
      {suggestion && (
        <Modal title="Vorschlag für die freien Tage" onClose={() => setSuggestion(null)}
          actions={<><button type="button" className="btn" onClick={() => setSuggestion(null)}>Lieber nicht</button>
            <button type="button" className="btn btn--primary" disabled={!suggestion.length} onClick={() => void savePlanDays(db, week, suggestion).then(() => setSuggestion(null))}>Übernehmen</button></>}
        >
          {suggestion.length ? (
            <ul className="list">
              {suggestion.map((d) => (
                <li key={d.date} className="list-item">
                  <span className="meal-day__emoji" aria-hidden="true">{d.emoji}</span>
                  <div className="list-item__main"><p className="list-item__title">{d.title}</p><p className="list-item__meta">{formatWeekday(d.date)}</p></div>
                  <button type="button" className="btn btn--small btn--ghost" onClick={() => setSuggestion(suggestion.filter((x) => x.date !== d.date))}>Weglassen</button>
                </li>
              ))}
            </ul>
          ) : <p className="muted">Keine passenden Gerichte gefunden. Unter „Gerichte“ könnt ihr weitere anlegen.</p>}
          <p className="small muted">Danach lässt sich jeder Tag einzeln ändern oder tauschen.</p>
        </Modal>
      )}
      {checking && <IngredientsModal plan={plan} recipes={recipes} today={today} onClose={() => setChecking(false)} />}
    </div>
  );
}

function PickModal({ date, recipes, cats, plan, recent, onClose }: {
  date: string; recipes: Recipe[]; cats: MealCategory[]; plan: MealPlan; recent: MealPlan[]; onClose: () => void;
}) {
  const open = categoryProgress(plan, cats).find((p) => p.have < p.category.perWeek)?.category.id ?? '';
  const [cat, setCat] = useState(open);
  const [free, setFree] = useState('');
  const list = rankRecipes(recipes, { plan, recent, category: cat || undefined, date });
  const choose = (r: Recipe) => void setPlanDay(db, date, dayFromRecipe(r, date)).then(onClose);
  return (
    <Modal title={`${formatWeekday(date)}, ${formatDayMonth(date)}: Was gibt es?`} onClose={onClose} wide>
      <div className="stack">
        <div className="seg" role="group" aria-label="Kategorie">
          <button type="button" className="seg__item" aria-pressed={!cat} onClick={() => setCat('')}>Alle</button>
          {cats.map((c) => <button key={c.id} type="button" className="seg__item" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>{c.emoji} {c.label}</button>)}
        </div>
        <div className="meal-picks">
          {list.map((r) => (
            <button key={r.id} type="button" className="meal-pick" onClick={() => choose(r)}>
              <span className="meal-pick__emoji" aria-hidden="true">{r.emoji}</span>
              <span>{r.title}</span>
              {r.favorite && <Sparkles size={14} aria-label="Favorit" className="meal-pick__fav" />}
            </button>
          ))}
          {!list.length && <p className="muted">In dieser Kategorie ist gerade nichts frei.</p>}
        </div>
        <div className="row">
          <input className="input" value={free} onChange={(e) => setFree(e.target.value)} placeholder="Etwas anderes, z. B. Reste oder Essen bei Oma" aria-label="Freier Eintrag" />
          <button type="button" className="btn" disabled={!free.trim()} onClick={() => void setPlanDay(db, date, { date, title: free.trim(), emoji: '🍽️', categories: [] }).then(onClose)}>Eintragen</button>
        </div>
      </div>
    </Modal>
  );
}

/** Zutaten prüfen: nichts wird ungefragt eingekauft. Was ihr habt, bleibt von der Liste. */
function IngredientsModal({ plan, recipes, today, onClose }: { plan: MealPlan; recipes: Recipe[]; today: string; onClose: () => void }) {
  const items = weekIngredients(plan, recipes, plan.id > today ? plan.id : today);
  const [have, setHave] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<number | null>(null);
  const toggle = (k: string) => { const n = new Set(have); if (n.has(k)) n.delete(k); else n.add(k); setHave(n); };
  const take = async () => setResult(await addIngredientsToList(db, items.filter((i) => !have.has(i.key)), plan.id));
  const need: NeededIngredient[] = items.filter((i) => !have.has(i.key));
  return (
    <Modal title="Zutaten prüfen" onClose={onClose} wide
      actions={result === null ? (
        <><button type="button" className="btn" onClick={onClose}>Abbrechen</button>
          <button type="button" className="btn btn--primary" disabled={!need.length} onClick={() => void take()}>{need.length} auf die Einkaufsliste</button></>
      ) : <button type="button" className="btn btn--primary" onClick={onClose}>Fertig</button>}
    >
      {result !== null ? (
        <p className="notice notice--ok">{result ? `${result} Sachen stehen jetzt auf der Einkaufsliste.` : 'Alles stand schon auf der Liste.'} Unter „Einkaufsliste“ könnt ihr sie aufs Handy schicken.</p>
      ) : items.length ? (
        <>
          <p className="muted">Tippt an, was ihr schon zu Hause habt. Der Rest kommt auf die Einkaufsliste.</p>
          <div className="meal-ings">
            {items.map((i) => (
              <button key={i.key} type="button" className={`meal-ing ${have.has(i.key) ? 'is-have' : ''}`} aria-pressed={have.has(i.key)} onClick={() => toggle(i.key)}>
                <span className="meal-ing__name">{i.name}{i.amount && <span className="muted"> · {i.amount}</span>}</span>
                <span className="small muted">{have.has(i.key) ? 'Haben wir' : i.sources.join(', ')}</span>
              </button>
            ))}
          </div>
        </>
      ) : <p className="muted">Für die kommenden Tage sind keine Gerichte mit Zutaten geplant.</p>}
    </Modal>
  );
}

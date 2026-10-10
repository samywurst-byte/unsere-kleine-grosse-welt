import { Minus, Plus, Snowflake } from 'lucide-react';
import { useState } from 'react';
import { Field, Toggle } from '../../components/FormControls';
import { Modal } from '../../components/Modal';
import { db } from '../../database/db';
import { useCookSessions, useFreezerItems, useRecipes, useSettings } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import {
  addFreezerItem, changeFreezerPortions, finishCookSession, FREEZER_OLD_DAYS, planCookSession, skipCookSession, soupKitchenDue, soupKitchenSettings, soupRecipes,
} from '../../services/meals';
import type { CookSession, SoupKitchenSettings, Weekday } from '../../types';
import { addDaysKey, daysBetween, formatLong, toDateKey, WEEKDAY_LONG, WEEKDAY_ORDER } from '../../utils/dates';

const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

function age(frozenAt: string, today: string): string {
  const d = daysBetween(frozenAt, today);
  if (d < 1) return 'heute eingefroren';
  if (d < 14) return `seit ${d} ${d === 1 ? 'Tag' : 'Tagen'}`;
  if (d < 60) return `seit ${Math.round(d / 7)} Wochen`;
  return `seit ${Math.round(d / 30)} Monaten`;
}

/** Gefriervorrat und Einstellungen der Suppenküche. Es steht nur drin, was ihr eingetragen habt. */
export function StockView() {
  const today = toDateKey(useNow(60_000));
  const items = useFreezerItems();
  const settings = useSettings();
  const [name, setName] = useState('');
  const [portions, setPortions] = useState(2);
  const [date, setDate] = useState(today);
  if (!items || !settings) return null;
  const sorted = [...items].sort((a, b) => Number(a.portions === 0) - Number(b.portions === 0) || a.frozenAt.localeCompare(b.frozenAt));
  const empty = items.filter((i) => i.portions === 0);
  const soup = soupKitchenSettings(settings);
  const setSoup = (p: Partial<SoupKitchenSettings>) => void db.settings.update('app', { soupKitchen: { ...soup, ...p } });

  return (
    <div className="stack">
      <div className="card">
        <h3 className="card__title"><Snowflake size={22} aria-hidden="true" /> Gefriervorrat</h3>
        <p className="small muted">Eine Portion reicht für eine Familienmahlzeit. Im Wochenplan werden vorhandene Portionen zuerst vorgeschlagen und beim Einplanen abgebucht.</p>
        {sorted.length === 0 && <p className="muted">Noch nichts eingetragen.</p>}
        <ul className="list">
          {sorted.filter((f) => f.portions > 0).map((f) => {
            const old = daysBetween(f.frozenAt, today) > FREEZER_OLD_DAYS;
            return (
              <li key={f.id} className="list-item">
                <span className="meal-day__emoji" aria-hidden="true">{f.emoji ?? '🧊'}</span>
                <div className="list-item__main">
                  <p className="list-item__title">{f.name}</p>
                  <p className={`list-item__meta ${old ? 'meal-old' : ''}`}>{formatLong(f.frozenAt)} · {age(f.frozenAt, today)}{old ? ' · bald aufbrauchen' : ''}</p>
                </div>
                <button type="button" className="btn btn--icon btn--small" aria-label={`${f.name} eine Portion weniger`} onClick={() => void changeFreezerPortions(db, f.id, -1)}><Minus size={16} /></button>
                <strong className="meal-count">{f.portions}</strong>
                <button type="button" className="btn btn--icon btn--small" aria-label={`${f.name} eine Portion mehr`} onClick={() => void changeFreezerPortions(db, f.id, 1)}><Plus size={16} /></button>
              </li>
            );
          })}
        </ul>
        {empty.length > 0 && (
          <button type="button" className="btn btn--small btn--ghost" onClick={() => void db.freezerItems.bulkDelete(empty.map((e) => e.id))}>{empty.length} aufgebrauchte entfernen</button>
        )}
        <h4 className="card__eyebrow" style={{ marginTop: 'var(--space-4)' }}>Eingefroren</h4>
        <div className="row row--wrap meal-add">
          <input className="input" value={name} placeholder="z. B. Bolognese-Soße" aria-label="Was wurde eingefroren?" onChange={(e) => setName(e.target.value)} />
          <div className="row meal-stepper">
            <button type="button" className="btn btn--icon btn--small" aria-label="Weniger Portionen" disabled={portions <= 1} onClick={() => setPortions(portions - 1)}><Minus size={16} /></button>
            <strong className="meal-count">{portions}</strong>
            <button type="button" className="btn btn--icon btn--small" aria-label="Mehr Portionen" onClick={() => setPortions(portions + 1)}><Plus size={16} /></button>
          </div>
          <input className="input meal-add__section" type="date" value={date} max={today} aria-label="Eingefroren am" onChange={(e) => e.target.value && setDate(e.target.value)} />
          <button type="button" className="btn btn--sky" disabled={!name.trim()}
            onClick={() => void addFreezerItem(db, { name, portions, frozenAt: date }).then(() => { setName(''); setPortions(2); setDate(today); })}>
            <Plus size={18} aria-hidden="true" /> Eintragen
          </button>
        </div>
      </div>

      <div className="card stack">
        <h3 className="card__title">🍲 Suppenküche</h3>
        <p className="small muted">In der kalten Zeit schlägt der Wochenplan regelmäßig vor, eine größere Menge Brühe zu kochen. Die Zutaten kommen bei „Zutaten prüfen“ mit, die Portionen danach in den Gefriervorrat.</p>
        <Toggle label="Suppenküche vorschlagen" checked={soup.enabled} onChange={(enabled) => setSoup({ enabled })} />
        {soup.enabled && (
          <>
            <Field label="Wie oft?">
              <div className="seg" role="group" aria-label="Wie oft">
                {[1, 2, 3, 4].map((n) => <button key={n} type="button" className="seg__item" aria-pressed={soup.everyWeeks === n} onClick={() => setSoup({ everyWeeks: n })}>{n === 1 ? 'jede Woche' : `alle ${n} Wochen`}</button>)}
              </div>
            </Field>
            <Field label="Kochtag">
              <div className="seg" role="group" aria-label="Kochtag">
                {WEEKDAY_ORDER.map((d: Weekday) => <button key={d} type="button" className="seg__item" aria-pressed={soup.day === d} onClick={() => setSoup({ day: d })}>{WEEKDAY_LONG[d].slice(0, 2)}</button>)}
              </div>
            </Field>
            <Field label="In diesen Monaten">
              <div className="seg" role="group" aria-label="Monate">
                {MONTHS.map((m, i) => (
                  <button key={m} type="button" className="seg__item" aria-pressed={soup.months.includes(i + 1)}
                    onClick={() => setSoup({ months: soup.months.includes(i + 1) ? soup.months.filter((x) => x !== i + 1) : [...soup.months, i + 1] })}>{m}</button>
                ))}
              </div>
            </Field>
          </>
        )}
      </div>
    </div>
  );
}

/** Im Wochenplan: Vorschlag für die Suppenküche, geplantes Kochen und „Gekocht“ mit Portionen. */
export function SoupKitchenCard({ today, week }: { today: string; week: string }) {
  const sessions = useCookSessions();
  const settings = useSettings();
  const recipes = useRecipes();
  const [recipeId, setRecipeId] = useState('');
  const [finishing, setFinishing] = useState<CookSession | null>(null);
  if (!sessions || !settings || !recipes) return null;
  const options = soupRecipes(recipes);
  const chosen = options.find((r) => r.id === recipeId) ?? options[0];
  const end = addDaysKey(week, 6);
  const inWeek = sessions.filter((c) => c.date >= week && c.date <= end && c.status !== 'skipped').sort((a, b) => a.date.localeCompare(b.date));
  const overdue = sessions.filter((c) => c.status === 'planned' && c.date < today && c.date < week);
  const due = soupKitchenDue(week > today ? week : today, sessions, soupKitchenSettings(settings));
  const dueInWeek = due && due >= week && due <= end ? due : null;
  const shown = [...overdue, ...inWeek];
  if (!shown.length && (!dueInWeek || !chosen)) return null;

  return (
    <div className="card meal-soup">
      {shown.map((c) => (
        <div key={c.id} className="meal-soup__row">
          <span className="meal-day__emoji" aria-hidden="true">{c.emoji}</span>
          <div className="grow">
            <p className="meal-day__title">{c.status === 'done' ? 'Gekocht: ' : 'Suppenküche: '}{c.title}</p>
            <p className="small muted">{formatLong(c.date)}{c.status === 'done' && c.portions ? ` · ${c.portions} Portionen eingefroren` : ''}</p>
          </div>
          {c.status === 'planned' && (
            <>
              {c.date <= today && <button type="button" className="btn btn--sage" onClick={() => setFinishing(c)}>Gekocht</button>}
              <button type="button" className="btn btn--ghost" onClick={() => void skipCookSession(db, c.date)}>Fällt aus</button>
            </>
          )}
        </div>
      ))}
      {dueInWeek && chosen && !shown.some((c) => c.status === 'planned') && (
        <div className="meal-soup__row">
          <span className="meal-day__emoji" aria-hidden="true">🍲</span>
          <div className="grow">
            <p className="meal-day__title">Zeit für die Suppenküche?</p>
            <p className="small muted">Vorschlag: {formatLong(dueInWeek)}</p>
          </div>
          {options.length > 1 && (
            <select className="input meal-add__section" value={chosen.id} aria-label="Was kochen?" onChange={(e) => setRecipeId(e.target.value)}>
              {options.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          )}
          <button type="button" className="btn btn--sky" onClick={() => void planCookSession(db, dueInWeek, chosen)}>Einplanen</button>
          <button type="button" className="btn btn--ghost" onClick={() => void skipCookSession(db, dueInWeek, chosen)}>Diesmal nicht</button>
        </div>
      )}
      {finishing && <FinishModal session={finishing} today={today} onClose={() => setFinishing(null)} />}
    </div>
  );
}

function FinishModal({ session, today, onClose }: { session: CookSession; today: string; onClose: () => void }) {
  const [n, setN] = useState(4);
  return (
    <Modal title={`${session.emoji} ${session.title}`} onClose={onClose}
      actions={<><button type="button" className="btn" onClick={onClose}>Abbrechen</button>
        <button type="button" className="btn btn--primary" onClick={() => void finishCookSession(db, session.id, n, session.date <= today ? session.date : today).then(onClose)}>Fertig</button></>}>
      <p className="muted">Wie viele Portionen habt ihr eingefroren? Eine Portion reicht für eine Familienmahlzeit.</p>
      <div className="row meal-stepper">
        <button type="button" className="btn btn--icon" aria-label="Weniger" disabled={n <= 0} onClick={() => setN(n - 1)}><Minus size={20} /></button>
        <strong className="meal-stepper__value">{n} Portionen</strong>
        <button type="button" className="btn btn--icon" aria-label="Mehr" onClick={() => setN(n + 1)}><Plus size={20} /></button>
      </div>
    </Modal>
  );
}

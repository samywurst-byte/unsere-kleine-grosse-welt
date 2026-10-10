import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Segmented } from '../../components/FormControls';
import {
  BOOK_TIP, BOOKS, CHEATSHEET, EQUIPMENT_LATER, EQUIPMENT_NOW, EXPLORER_RHYTHM, EXPLORER_RULES, GLOBE_TIP, KNOWLEDGE_WORLDS, LASTING_PROJECTS,
  MEMORY_QUESTIONS, PLACES, SAFETY_RULE, SHELF, TRIP_CHECKS, WALL_TIMELINE,
} from '../../data/explorer';
import { HANDBOOK_STAND } from '../../data/explorerModules';
import { db } from '../../database/db';
import { newId } from '../../utils/id';
import { ExploreTabs } from '../library/ExploreTabs';
import './explorer.css';

type Tab = 'idea' | 'books' | 'gear' | 'places' | 'cheat';

/** Das Familienhandbuch zum Nachlesen: Regeln, Entdeckerzentrale, Bücher, Ausstattung, Ausflugsorte, Spickzettel. */
export function HandbookPage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('teil') as Tab) || 'idea';
  return (
    <div>
      <header className="page-head">
        <Link to="/entdecken/sonntage" className="btn btn--icon btn--ghost" aria-label="Zurück zu den Entdeckersonntagen"><ArrowLeft size={22} /></Link>
        <h1>Unser Handbuch</h1>
        <span className="page-head__sub">Stand {HANDBOOK_STAND}</span>
      </header>
      <ExploreTabs />
      <Segmented<Tab> label="Teil" value={tab} onChange={(t) => setParams({ teil: t }, { replace: true })} options={[
        { value: 'idea', label: 'So geht’s' }, { value: 'books', label: 'Bücher' }, { value: 'gear', label: 'Ausstattung' },
        { value: 'places', label: 'Ausflugsorte' }, { value: 'cheat', label: 'Mama-Spickzettel' },
      ]} />
      <div style={{ marginTop: 'var(--space-4)' }}>
        {tab === 'idea' && <Idea />}
        {tab === 'books' && <Books />}
        {tab === 'gear' && <Gear />}
        {tab === 'places' && <Places />}
        {tab === 'cheat' && <Cheat />}
      </div>
    </div>
  );
}

function Idea() {
  return (
    <div className="lib-grid2">
      <div className="stack">
        <section className="card">
          <h2 className="card__title">Die sechs Regeln</h2>
          <ol className="ex-steps">{EXPLORER_RULES.map((r) => <li key={r}>{r}</li>)}</ol>
        </section>
        <section className="card">
          <h2 className="card__title">Der Monatsrhythmus</h2>
          <ul>{EXPLORER_RHYTHM.map((r) => <li key={r}>{r}</li>)}</ul>
        </section>
        <section className="card">
          <h2 className="card__title">Die Wissenswelten</h2>
          <ul className="ex-worlds">
            {KNOWLEDGE_WORLDS.map((w) => <li key={w.title}><span aria-hidden="true">{w.emoji}</span><div><strong>{w.title}</strong><p className="small" style={{ margin: 0 }}>{w.covers}</p><p className="small muted" style={{ margin: 0 }}>Ziel: {w.goal}</p></div></li>)}
          </ul>
        </section>
      </div>
      <div className="stack">
        <section className="card">
          <h2 className="card__title">Die Entdeckerzentrale</h2>
          <p className="small muted">Ein einziges ruhiges Regal reicht. Kinder sollen selbst zugreifen können.</p>
          <ul>{SHELF.map((r) => <li key={r}>{r}</li>)}</ul>
          <p className="small"><strong>Globus:</strong> {GLOBE_TIP}</p>
        </section>
        <section className="card">
          <h2 className="card__title">Die vier dauerhaften Projekte</h2>
          <ul>{LASTING_PROJECTS.map((p) => <li key={p.title}><strong>{p.title}:</strong> {p.text}</li>)}</ul>
          <p className="small muted">Zeitlinie an der Wand, acht große Epochenkarten:</p>
          <ol className="ex-epochs">{WALL_TIMELINE.map((e) => <li key={e}>{e}</li>)}</ol>
          <p className="small muted">Nicht maßstabsgerecht, wichtig ist die Reihenfolge. Gute Frage: „Gab es Ritter und Dinosaurier gleichzeitig?“</p>
        </section>
      </div>
    </div>
  );
}

function useShop() {
  const [msg, setMsg] = useState<string | null>(null);
  const add = async (name: string) => {
    const open = (await db.shoppingItems.toArray()).some((i) => !i.done && i.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (!open) await db.shoppingItems.add({ id: newId('shop'), name, section: 'sonstiges', done: false, source: 'Entdeckerzentrale', createdAt: new Date().toISOString() });
    setMsg(open ? `„${name}“ steht schon auf der Einkaufsliste.` : `„${name}“ steht jetzt auf der Einkaufsliste.`);
  };
  return [msg, add] as const;
}

function Books() {
  const [msg, add] = useShop();
  const groups = [...new Set(BOOKS.map((b) => b.when))];
  return (
    <div className="stack">
      {msg && <p className="notice notice--ok">{msg}</p>}
      {groups.map((g) => (
        <section key={g} className="card">
          <h2 className="card__title">{g === 'Jetzt' ? 'Darf jetzt ins Regal' : `Später, ${g} Jahre`}</h2>
          <ul className="list">
            {BOOKS.filter((b) => b.when === g).map((b) => (
              <li key={b.title} className="list-item">
                <div className="list-item__main"><p className="list-item__title">{b.title}</p><p className="list-item__meta">{b.area} · {b.why}</p></div>
                <button type="button" className="btn btn--icon btn--ghost btn--small" aria-label={`${b.title} auf die Einkaufsliste`} onClick={() => void add(b.title)}><ShoppingCart size={16} /></button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="small muted">{BOOK_TIP}</p>
    </div>
  );
}

function Gear() {
  const [msg, add] = useShop();
  return (
    <div className="lib-grid2">
      <section className="card">
        <h2 className="card__title">Jetzt anschaffen</h2>
        {msg && <p className="notice notice--ok">{msg}</p>}
        <ul className="ex-gear">
          {EQUIPMENT_NOW.map((e) => (
            <li key={e}><span>{e}</span><button type="button" className="btn btn--icon btn--ghost btn--small" aria-label={`${e} auf die Einkaufsliste`} onClick={() => void add(e)}><ShoppingCart size={16} /></button></li>
          ))}
        </ul>
      </section>
      <div className="stack">
        <section className="card">
          <h2 className="card__title">Später ergänzen</h2>
          <ul>{EQUIPMENT_LATER.map((e) => <li key={e.text}>{e.text}</li>)}</ul>
        </section>
        <section className="card">
          <h2 className="card__title">Sicherheitsregel</h2>
          <p>{SAFETY_RULE}</p>
        </section>
      </div>
    </div>
  );
}

function Places() {
  return (
    <div className="stack">
      <p className="small muted">Diese Orte bilden das Rückgrat des Plans. Manche besucht ihr mehrfach, mit anderem Fokus und in anderem Alter. Wiederbesuche erzeugen Tiefe.</p>
      <div className="ex-places">
        {PLACES.map((p) => (
          <section key={p.name} className="card">
            <h2 className="ex-place__name">{p.name}</h2>
            <p className="small"><span className="chip">{p.focus}</span> <span className="chip">{p.effort}</span></p>
            <p className="small" style={{ margin: '4px 0' }}>{p.strengths}</p>
            <p className="small muted" style={{ margin: 0 }}>{p.age}</p>
          </section>
        ))}
      </div>
      <section className="card">
        <h2 className="card__title">Prüfroutine, 2 bis 6 Wochen vorher</h2>
        <ul>{TRIP_CHECKS.map((x) => <li key={x}>{x}</li>)}</ul>
        <p className="small muted">Stand {HANDBOOK_STAND}. Öffnungszeiten, Programme und Preise können sich ändern.</p>
      </section>
    </div>
  );
}

function Cheat() {
  return (
    <div className="lib-grid2">
      <div className="stack">
        {CHEATSHEET.map((s) => (
          <section key={s.title} className="card">
            <h2 className="card__title">{s.title}</h2>
            <ul>{s.items.map((i) => <li key={i}>{i}</li>)}</ul>
          </section>
        ))}
      </div>
      <section className="card">
        <h2 className="card__title">Die perfekte Erinnerungsfrage</h2>
        <p className="small muted">Nicht „Was haben wir heute gelernt?“, sondern:</p>
        <ul className="ex-ideas">{MEMORY_QUESTIONS.map((q) => <li key={q}><span>„{q}“</span></li>)}</ul>
      </section>
    </div>
  );
}

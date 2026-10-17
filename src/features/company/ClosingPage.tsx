import { ArrowLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { db } from '../../database/db';
import { useChildren, useCompany, useCompanyEntries, useCompanyProducts, useMoneyTransactions } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { companyTotals, milestones, productIncome, saveClosingMemory, saveReviewAnswer, seasonPlan, tripEarnings } from '../../services/kidCompany';
import { formatEuro } from '../../services/projects';
import { toDateKey } from '../../utils/dates';
import { ProductArt } from './ProductArt';
import { Stat } from './parts';
import './company.css';

const CONFETTI = ['🎉', '✨', '🎊', '⭐', '🎄', '✨', '🎉', '⭐', '🎊', '🎄', '✨', '🎉'];

/** Jahresabschluss im Familienrat: feierlich, egal wie hoch der Gewinn ist. */
export function ClosingPage() {
  const { seasonId } = useParams();
  const today = toDateKey(useNow(60_000));
  const company = useCompany();
  const children = useChildren();
  const products = useCompanyProducts();
  const entries = useCompanyEntries();
  const txs = useMoneyTransactions();
  const [saved, setSaved] = useState(false);
  if (company === undefined || !children || !products || !entries || !txs) return null;
  const season = company?.seasons.find((s) => s.id === seasonId);
  if (!company || !season) return <p className="empty">Diese Saison gibt es nicht. <Link to="/kinderfirma">Zur Firmenzentrale</Link></p>;
  const plan = seasonPlan(season);
  const questions = plan?.phases.find((p) => p.review)?.review ?? [];
  const own = products.filter((p) => p.seasonId === season.id);
  const t = companyTotals(entries, season.id);
  const made = own.reduce((n, p) => n + p.made, 0);
  const sold = own.reduce((n, p) => n + p.sold, 0);
  const trip = company.tripId ? tripEarnings(txs, company.tripId) : undefined;
  const founders = children.filter((k) => company.founderIds.includes(k.id));
  const reached = milestones(company, products, entries.filter((e) => e.seasonId === season.id));

  return (
    <div>
      <header className="page-head">
        <Link to="/kinderfirma" className="btn btn--icon btn--ghost" aria-label="Zurück zur Firmenzentrale"><ArrowLeft size={22} /></Link>
        <h1>Unser Jahresabschluss</h1>
        <span className="muted">{season.title}</span>
      </header>
      <div className="stack">
        <section className="card kc-certificate is-party">
          <div className="kc-confetti" aria-hidden="true">{CONFETTI.map((e, i) => <span key={i} style={{ animationDelay: `${i * 0.15}s`, left: `${(i * 17) % 100}%` }}>{e}</span>)}</div>
          <p className="kc-certificate__head">Das hat {company.name || 'unsere Firma'} geschafft!</p>
          <div className="kc-founders">{founders.map((k) => <div key={k.id} className="kc-founder"><Avatar avatar={k.avatar} color={k.color} size={64} /><span>{k.name}</span></div>)}</div>
          <div className="kc-stats kc-stats--big">
            <Stat label="Stück hergestellt" value={String(made)} />
            <Stat label="Stück verkauft" value={String(sold)} />
            <Stat label="Eingenommen" value={formatEuro(t.income)} />
            <Stat label="Material und Kosten" value={formatEuro(t.materials + t.costs)} />
            <Stat label="Unser Gewinn" value={formatEuro(t.profit)} strong />
          </div>
          {trip && <p className="kc-big">🧳 In der Reisekasse: {formatEuro(trip.earned)} selbst verdient</p>}
          <p className="muted">Egal wie viel es geworden ist: Ihr habt eine eigene Firma gegründet, Sachen erfunden, hergestellt und verkauft. Darauf könnt ihr stolz sein.</p>
        </section>

        {own.length > 0 && (
          <section className="card">
            <h2 className="card__title">Was wir hergestellt haben</h2>
            <ul className="kc-closing-products">
              {own.map((p) => (
                <li key={p.id}>
                  {p.photo ? <img className="kc-item__photo" src={p.photo} alt="" /> : <ProductArt catalogId={p.catalogId} emoji={p.emoji} size={56} />}
                  <strong>{p.name}</strong>
                  <span>{p.made} hergestellt · {p.sold} verkauft · {formatEuro(productIncome(entries, p.id).cents)} eingenommen</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {reached.length > 0 && (
          <section className="card">
            <h2 className="card__title">Unsere Erfolge</h2>
            <ul className="kc-badges">{reached.map((m) => <li key={m.id} className="kc-badge"><span className="kc-badge__emoji" aria-hidden="true">{m.emoji}</span><span className="kc-badge__title">{m.title}</span></li>)}</ul>
          </section>
        )}

        <section className="card">
          <h2 className="card__title">Gemeinsam zurückschauen</h2>
          <p className="muted small">Die Zahlenfragen beantworten die Karten oben. Bei den anderen schreibt ihr auf, was die Kinder sagen.</p>
          <div className="kc-form">
            {questions.slice(5).map((q) => <ReviewField key={q} question={q} value={season.review?.[q] ?? ''} onSave={(v) => void saveReviewAnswer(db, season.id, q, v)} />)}
          </div>
          <div className="row">
            <button type="button" className="btn btn--primary" onClick={() => void saveClosingMemory(db, season.id, today).then(() => setSaved(true))}>
              {season.memoryId ? 'Erinnerung im Familienarchiv aktualisieren' : '💛 Ins Familienarchiv aufnehmen'}
            </button>
            {(saved || season.memoryId) && <Link to="/archiv" className="btn btn--ghost">Im Archiv ansehen</Link>}
          </div>
          {saved && <p className="notice notice--ok">Gespeichert. Der Jahresabschluss steht jetzt im Familienarchiv.</p>}
        </section>
      </div>
    </div>
  );
}

function ReviewField({ question, value, onSave }: { question: string; value: string; onSave: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  const dirty = useRef(false);
  useEffect(() => { if (!dirty.current) setDraft(value); }, [value]);
  return (
    <label className="field">
      <span className="field__label">{question}</span>
      <textarea className="input" rows={2} value={draft} onChange={(e) => { dirty.current = true; setDraft(e.target.value); }}
        onBlur={() => { dirty.current = false; if (draft !== value) onSave(draft); }} />
    </label>
  );
}

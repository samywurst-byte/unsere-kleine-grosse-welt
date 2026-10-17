import { Check, Pencil, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Modal } from '../../components/Modal';
import { COMPANY_PRINCIPLES, YEAR_RHYTHM, type CompanyBand } from '../../data/kidCompany';
import { db } from '../../database/db';
import { useChildren, useCompany, useCompanyEntries, useCompanyProducts, useMoneyTransactions, useTripGoals } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import {
  activeSeason, addIdea, chooseCompanyTrip, companyBand, companyTotals, currentPhase, removeIdea, seasonPlan, toggleSeasonTask, tripEarnings, updateCompany,
} from '../../services/kidCompany';
import type { ChildProfile, CompanyEntry, CompanyProduct, CompanySeason, KidCompany } from '../../types';
import { formatDayMonth, formatLong, toDateKey } from '../../utils/dates';
import { MoneyTabs, Progress, formatEuro } from '../money/parts';
import { CompanyCash } from './CompanyCash';
import { CompanyShop } from './CompanyShop';
import { Stat, Votes } from './parts';
import './company.css';

/** Unsere Firmenzentrale: Firma, Weihnachtswerkstatt, Laden, Kasse, Reisekasse und Ideen. */
export function CompanyPage() {
  const today = toDateKey(useNow(60_000));
  const company = useCompany();
  const children = useChildren();
  const products = useCompanyProducts();
  const entries = useCompanyEntries();
  if (company === undefined || !children || !products || !entries) return null;
  const season = company ? activeSeason(company, today) : undefined;

  return (
    <div>
      <header className="page-head">
        <h1>Unsere Kinderfirma</h1>
        <span className="page-head__sub">Wir verdienen uns unser nächstes Abenteuer</span>
      </header>
      <MoneyTabs />
      <div className="stack">
        {!company?.foundedAt ? (
          <section className="card kc-hero">
            <span className="kc-hero__emoji" aria-hidden="true">🏪</span>
            <div>
              <h2 className="card__title">Unsere Firma wird im Familienrat gegründet</h2>
              <p className="muted">Sechs kurze Schritte mit Bildern und Vorlesetexten, ungefähr 15 bis 20 Minuten.</p>
              <Link to="/kinderfirma/gruendung" className="btn btn--primary btn--large">🎉 Gründungsrat starten</Link>
            </div>
          </section>
        ) : <FirmCard company={company} kids={children} />}

        {company && season && <SeasonCard season={season} kids={children} today={today} entries={entries} products={products} />}

        <CompanyShop products={products} entries={entries} season={season} />

        <CompanyCash company={company ?? undefined} entries={entries} products={products} season={season} today={today} />

        <TripCard company={company ?? undefined} />

        <IdeasCard company={company ?? undefined} kids={children} />

        <section className="card">
          <h2 className="card__title">Unser Jahr in der Kinderfirma</h2>
          <ul className="kc-year">
            {YEAR_RHYTHM.map((y) => {
              const now = y.months.includes(Number(today.slice(5, 7)));
              return <li key={y.title} className={now ? 'is-now' : ''}><span aria-hidden="true">{y.emoji}</span><strong>{y.title}</strong><span>{y.text}</span>{now && <span className="chip">jetzt</span>}</li>;
            })}
          </ul>
          <p className="muted small">Welche Projekte wir machen, wählen wir jedes Jahr neu.</p>
        </section>

        <section className="card">
          <h2 className="card__title">Unsere Grundsätze</h2>
          <ul className="kc-principles">{COMPANY_PRINCIPLES.map((p) => <li key={p}>{p}</li>)}</ul>
        </section>
      </div>
    </div>
  );
}

function FirmCard({ company, kids }: { company: KidCompany; kids: ChildProfile[] }) {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(company.name);
  const founders = kids.filter((k) => company.founderIds.includes(k.id));
  return (
    <section className="card kc-hero">
      <span className="kc-hero__emoji" aria-hidden="true">🏪</span>
      <div className="kc-hero__main">
        <h2 className="kc-hero__name">{company.name || 'Unsere Firma'}</h2>
        <p className="muted">Gegründet am {formatLong(company.foundedAt!)} von</p>
        <div className="kc-founders kc-founders--small">
          {founders.map((k) => <div key={k.id} className="kc-founder"><Avatar avatar={k.avatar} color={k.color} size={48} /><span>{k.name}</span></div>)}
        </div>
      </div>
      <button type="button" className="btn btn--small" onClick={() => { setName(company.name); setEdit(true); }}><Pencil size={16} aria-hidden="true" /> Name ändern</button>
      {edit && (
        <Modal title="Firmenname" onClose={() => setEdit(false)} actions={<button type="button" className="btn btn--primary" disabled={!name.trim()} onClick={() => { void updateCompany(db, (c) => ({ ...c, name: name.trim() })); setEdit(false); }}>Speichern</button>}>
          <input className="input" value={name} aria-label="Firmenname" onChange={(e) => setName(e.target.value)} />
        </Modal>
      )}
    </section>
  );
}

function SeasonCard({ season, kids, today, entries, products }: { season: CompanySeason; kids: ChildProfile[]; today: string; entries: CompanyEntry[]; products: CompanyProduct[] }) {
  const plan = seasonPlan(season);
  const [openPhase, setOpenPhase] = useState<string | null>(null);
  if (!plan) return null;
  const now = currentPhase(plan, today);
  const totals = companyTotals(entries, season.id);
  const shown = plan.phases.find((p) => p.id === openPhase) ?? now;
  const goal = season.goalCents;
  const bands = new Map<CompanyBand, ChildProfile[]>();
  for (const k of kids) { const b = companyBand(k, today); bands.set(b, [...(bands.get(b) ?? []), k]); }

  return (
    <section className="card kc-season">
      <div className="kc-season__head">
        <h2 className="card__title"><span aria-hidden="true">{plan.emoji}</span> {season.title}</h2>
        <span className="muted">seit {formatDayMonth(season.startDate)}</span>
      </div>
      <div className="kc-goal">
        <p className="kc-goal__sum"><strong>{formatEuro(Math.max(0, totals.profit))}</strong> Gewinn von {formatEuro(goal)}</p>
        <Progress value={Math.max(0, totals.profit)} max={goal} label="Fortschritt zum ersten Ziel" />
        {totals.profit >= goal && <p className="kc-big">🎉 Ziel geschafft! Alles, was jetzt noch kommt, ist ein Extra.</p>}
      </div>

      <ol className="kc-timeline">
        {plan.phases.map((p) => (
          <li key={p.id}>
            <button type="button" className={`kc-tl ${p.id === now.id ? 'is-now' : ''} ${p.end < today ? 'is-past' : ''} ${p.id === shown.id ? 'is-open' : ''}`} onClick={() => setOpenPhase(p.id)} aria-pressed={p.id === shown.id}>
              <span className="kc-tl__emoji" aria-hidden="true">{p.emoji}</span>
              <span className="kc-tl__title">{p.title}</span>
              <span className="kc-tl__date">{p.start === p.end ? formatDayMonth(p.start) : `${formatDayMonth(p.start)} bis ${formatDayMonth(p.end)}`}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="kc-phase">
        <h3 className="kc-sub">{shown.id === now.id ? 'Gerade dran: ' : ''}{shown.title}{shown.optional ? ' (nur wenn ihr Lust habt)' : ''}</h3>
        {shown.hint && <p className="notice notice--info">{shown.hint}</p>}
        {shown.tasks.length > 0 && (
          <ul className="kc-tasks">
            {shown.tasks.map((t) => {
              const done = season.checked.includes(t.id);
              return (
                <li key={t.id}>
                  <button type="button" className={`kc-task ${done ? 'is-done' : ''}`} aria-pressed={done} onClick={() => void toggleSeasonTask(db, season.id, t.id)}>
                    <span className="kc-task__box" aria-hidden="true">{done && <Check size={18} />}</span>{t.text}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {shown.review && (
          <>
            <div className="kc-stats">
              <Stat label="Hergestellt" value={String(products.filter((p) => p.seasonId === season.id).reduce((n, p) => n + p.made, 0))} />
              <Stat label="Verkauft" value={String(sumSold(entries, season.id))} />
              <Stat label="Eingenommen" value={formatEuro(totals.income)} />
              <Stat label="Material und Kosten" value={formatEuro(totals.materials + totals.costs)} />
              <Stat label="Gewinn" value={formatEuro(totals.profit)} strong />
            </div>
            <ul className="kc-review">{shown.review.map((q) => <li key={q}>{q}</li>)}</ul>
          </>
        )}
        <div className="kc-jobs">
          {(['big', 'middle', 'little'] as CompanyBand[]).filter((b) => bands.has(b)).map((b) => (
            <div key={b} className="kc-job">
              <div className="kc-job__who">
                {bands.get(b)!.map((k) => <Avatar key={k.id} avatar={k.avatar} color={k.color} size={36} />)}
                <span className="small muted">{bands.get(b)!.map((k) => k.name).join(' und ')}</span>
              </div>
              <ul>{shown.kidJobs[b].map((j) => <li key={j}>{j}</li>)}</ul>
            </div>
          ))}
        </div>
        <p className="muted small">Jedes Kind macht mit, so viel es mag. Kurze Einheiten, und Pausen sind erlaubt.</p>
      </div>
    </section>
  );
}

function sumSold(entries: CompanyEntry[], seasonId: string): number {
  return entries.filter((e) => e.kind === 'income' && e.seasonId === seasonId).reduce((s, e) => s + (e.pieces ?? 0), 0);
}

function TripCard({ company }: { company?: KidCompany }) {
  const trips = useTripGoals();
  const txs = useMoneyTransactions();
  if (!trips || !txs) return null;
  const active = trips.filter((t) => t.status === 'active');
  const trip = trips.find((t) => t.id === company?.tripId);
  const e = trip ? tripEarnings(txs, trip.id) : undefined;
  return (
    <section className="card">
      <h2 className="card__title">🧳 Unsere Reisekasse</h2>
      <div className="seg" role="group" aria-label="Reiseziel der Firma">
        {active.map((t) => <button key={t.id} type="button" className="seg__item" aria-pressed={t.id === company?.tripId} onClick={() => void chooseCompanyTrip(db, t.id)}>{t.flag} {t.name}</button>)}
      </div>
      {trip && e ? (
        <div className="kc-trip-sum">
          <p className="kc-big">{trip.flag} {trip.name}: Sparziel {formatEuro(trip.targetCents)}</p>
          <div className="kc-bar" role="img" aria-label={`Selbst verdient ${formatEuro(e.earned)}, Elternbeitrag ${formatEuro(e.parents)}`}>
            <span className="kc-bar__earned" style={{ width: `${pct(e.earned, trip.targetCents)}%` }} />
            <span className="kc-bar__parents" style={{ width: `${pct(e.parents, trip.targetCents)}%` }} />
            <span className="kc-bar__other" style={{ width: `${pct(e.other, trip.targetCents)}%` }} />
          </div>
          <div className="kc-stats">
            <Stat label="Selbst verdient" value={formatEuro(e.earned)} strong />
            <Stat label="Beitrag von Mama und Papa" value={formatEuro(e.parents)} />
            {e.other > 0 && <Stat label="Aus eigenem Geld und Geschenken" value={formatEuro(e.other)} />}
            <Stat label="Fehlt noch" value={formatEuro(Math.max(0, trip.targetCents - e.total))} />
          </div>
          <p className="muted small">Der Urlaub findet auch statt, wenn das Geld nicht ganz reicht. Mama und Papa übernehmen dann den Rest. <Link to={`/reisekasse/${trip.id}`}>Zur Reisekasse</Link></p>
        </div>
      ) : <p className="muted">Wählt ein Reiseziel, für das unsere Firma spart. Neue Ziele legen Mama und Papa unter Eltern, Geld, Reiseziele an.</p>}
    </section>
  );
}

const pct = (v: number, max: number) => (max > 0 ? Math.min(100, (Math.max(0, v) / max) * 100) : 0);

function IdeasCard({ company, kids }: { company?: KidCompany; kids: ChildProfile[] }) {
  const [text, setText] = useState('');
  const ideas = [...(company?.ideas ?? [])].sort((a, b) => b.votes.length - a.votes.length);
  const add = () => { void addIdea(db, text, '🌟'); setText(''); };
  return (
    <section className="card">
      <h2 className="card__title">💡 Unsere Ideen</h2>
      <p className="muted small">Jedes Kind tippt auf sein Bild bei den Ideen, die es gut findet.</p>
      {ideas.length > 0 && (
        <ul className="kc-own">
          {ideas.map((i) => (
            <li key={i.id}>
              <span aria-hidden="true">{i.emoji}</span> {i.text}
              <Votes ideaId={i.id} votes={i.votes} kids={kids} />
              <button type="button" className="btn btn--icon btn--ghost btn--small" aria-label={`${i.text} entfernen`} onClick={() => void removeIdea(db, i.id)}><X size={16} /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="row">
        <input className="input" value={text} placeholder="Neue Idee" aria-label="Neue Idee" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
        <button type="button" className="btn" disabled={!text.trim()} onClick={add}><Plus size={18} aria-hidden="true" /> Aufschreiben</button>
      </div>
    </section>
  );
}

import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { DISCOVER_TOPIC_BY_ID } from '../../data/discover';
import { SOURCE_LABEL } from '../../data/money';
import { useChildren, useMoneyTransactions, useTripGoals } from '../../hooks/useData';
import { balances, reversedIds, tripBalance } from '../../services/money';
import type { ChildProfile, MoneyTransaction, TripGoal } from '../../types';
import { formatLong } from '../../utils/dates';
import { MoneyTabs, Progress, formatEuro } from './parts';

/** Die Familien-Reisekasse: mehrere Reiseziele, jedes mit eigenem Sparziel. */
export function TravelPage() {
  const trips = useTripGoals();
  const txs = useMoneyTransactions();
  if (!trips || !txs) return null;
  const map = balances(txs);
  const active = trips.filter((t) => t.status === 'active');
  const done = trips.filter((t) => t.status === 'done');
  return (
    <div>
      <header className="page-head">
        <h1>Unsere Reisekasse</h1>
        <span className="page-head__sub">Wir sparen gemeinsam für Familienabenteuer</span>
      </header>
      <MoneyTabs />
      {active.length === 0 && <p className="empty">Gerade gibt es kein Reiseziel. Mama und Papa können im Elternbereich eins anlegen.</p>}
      <div className="mw-trips">
        {active.map((t) => {
          const saved = tripBalance(map, t.id).total;
          return (
            <Link key={t.id} to={`/reisekasse/${t.id}`} className="card mw-trip">
              {t.photo ? <img className="mw-trip__photo" src={t.photo} alt="" /> : <span className="mw-trip__flag" aria-hidden="true">{t.flag}</span>}
              <h2 className="mw-trip__name">{t.name}</h2>
              <p className="mw-trip__desc">{t.description}</p>
              <Progress value={saved} max={t.targetCents} label={`Fortschritt ${t.name}`} />
              <p className="mw-trip__sum"><strong>{formatEuro(saved)} gespart</strong> · Sparziel {formatEuro(t.targetCents)}</p>
            </Link>
          );
        })}
      </div>
      <p className="small muted" style={{ marginTop: 'var(--space-4)' }}>
        Die Beträge sind Sparziele für unseren Beitrag, keine berechneten Reisekosten. Die Reise bezahlen Mama und Papa.
        Jedes Kind entscheidet selbst, ob es etwas von seinem eigenen Geld dazugeben möchte.
      </p>
      {done.length > 0 && (
        <section className="card" style={{ marginTop: 'var(--space-4)' }}>
          <h2 className="card__title">Schon erlebt</h2>
          <p>{done.map((t) => `${t.flag} ${t.name}`).join(' · ')}</p>
        </section>
      )}
    </div>
  );
}

export function TripPage() {
  const { tripId } = useParams();
  const trips = useTripGoals();
  const txs = useMoneyTransactions();
  const children = useChildren();
  if (!trips || !txs || !children) return null;
  const trip = trips.find((t) => t.id === tripId);
  if (!trip) return <p className="empty">Dieses Reiseziel gibt es nicht. <Link to="/reisekasse">Zur Reisekasse</Link></p>;
  return <Trip trip={trip} txs={txs} children={children} />;
}

function Trip({ trip, txs, children }: { trip: TripGoal; txs: MoneyTransaction[]; children: ChildProfile[] }) {
  const map = balances(txs);
  const saved = tripBalance(map, trip.id).total;
  const reversed = reversedIds(txs);
  const touches = (t: MoneyTransaction) => [t.from, t.to].some((a) => a?.kind === 'trip' && a.tripId === trip.id);
  const contributions = txs.filter((t) => touches(t) && t.to?.kind === 'trip' && !t.reverses && !reversed.has(t.id) && t.kind !== 'correction').slice().reverse();
  const byChild = new Map(children.map((c) => [c.id, c]));
  const kidTotals = children.map((c) => ({ child: c, cents: contributions.filter((t) => t.byChildId === c.id).reduce((s, t) => s + t.cents, 0) })).filter((x) => x.cents > 0);
  const topics = (trip.topicIds ?? []).map((id) => DISCOVER_TOPIC_BY_ID.get(id)).filter((t) => t !== undefined);

  return (
    <div>
      <header className="page-head">
        <Link to="/reisekasse" className="btn btn--icon btn--ghost" aria-label="Zurück zur Reisekasse"><ArrowLeft size={22} /></Link>
        <span className="lib-head-emoji" aria-hidden="true">{trip.flag}</span>
        <h1>{trip.name}</h1>
        <span className="page-head__sub">{trip.countryName}</span>
      </header>
      <MoneyTabs />
      <div className="lib-grid2">
        <div className="stack">
          <section className="card">
            {trip.photo && <img className="mw-trip__hero" src={trip.photo} alt="" />}
            <p className="lib-intro" style={{ marginBottom: 'var(--space-3)' }}>{trip.description}</p>
            <p className="mw-pot__amount">{formatEuro(saved)}</p>
            <Progress value={saved} max={trip.targetCents} label={`Fortschritt ${trip.name}`} />
            <p>{saved >= trip.targetCents ? 'Sparziel geschafft! 🎉' : `Noch ${formatEuro(trip.targetCents - saved)} bis zum Sparziel von ${formatEuro(trip.targetCents)}.`}</p>
            {trip.totalCostCents !== undefined && <p className="small muted">Die ganze Reise kostet etwa {formatEuro(trip.totalCostCents)}. Den Rest bezahlen Mama und Papa.</p>}
          </section>
          {kidTotals.length > 0 && (
            <section className="card">
              <h2 className="card__title">Das haben wir Kinder beigetragen</h2>
              <div className="mw-kidtotals">
                {kidTotals.map(({ child, cents }) => (
                  <div key={child.id} className={`mw-kidtotal tone-${child.color}`}><Avatar avatar={child.avatar} color={child.color} size={44} /><strong>{formatEuro(cents)}</strong></div>
                ))}
              </div>
            </section>
          )}
          <section className="card">
            <h2 className="card__title">Woher das Geld kommt</h2>
            {contributions.length === 0 ? <p className="small muted">Noch keine Einzahlung.</p> : (
              <ul className="list">
                {contributions.map((t) => (
                  <li key={t.id} className="list-item">
                    <div className="list-item__main">
                      <p className="list-item__title">{t.note}</p>
                      <p className="list-item__meta">
                        {formatLong(t.date)} · {t.byChildId ? `von ${byChild.get(t.byChildId)?.name ?? 'einem Kind'}` : t.source ? SOURCE_LABEL[t.source] : 'Umbuchung'}
                        {t.byChildId && t.source === 'project' ? ' (Anteil am Projekt)' : ''}
                      </p>
                    </div>
                    <strong className="pj-income">+ {formatEuro(t.cents)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <div className="stack">
          {trip.activities.length > 0 && (
            <section className="card">
              <h2 className="card__title">Was wir dort erleben möchten</h2>
              <ul className="mw-lessons">{trip.activities.map((a) => <li key={a}>{a}</li>)}</ul>
            </section>
          )}
          {trip.learning.length > 0 && (
            <section className="card">
              <h2 className="card__title">Vor der Reise entdecken</h2>
              <ul className="mw-lessons">{trip.learning.map((a) => <li key={a}>{a}</li>)}</ul>
            </section>
          )}
          {(trip.countryId || topics.length > 0) && (
            <section className="card stack">
              <h2 className="card__title">Weiterforschen</h2>
              {trip.countryId && <Link to="/weltreise" className="btn btn--sky">🌍 {trip.countryName} auf unserer Weltreise</Link>}
              {topics.map((t) => <Link key={t.id} to={`/entdecken/${t.id}`} className="btn">{t.emoji} {t.title}</Link>)}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

import { ArrowLeft, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Modal } from '../../components/Modal';
import { HOLDING_LABEL, POT_EMOJI, POT_LABEL, POT_TEXT } from '../../data/money';
import { db } from '../../database/db';
import {
  useChildren, useDepotValuations, useMoneyRequests, useMoneyTransactions, useSavingsGoals, useSimDepots, useTripGoals,
} from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import {
  REQUEST_LABEL, balances, childAge, goalProgress, investValue, latestValuation, lessonsFor, potBalance, requestFromPot, showInvest, simValues,
} from '../../services/money';
import type { ChildProfile, MoneyRequest, MoneyTransaction, SimDepot, TripGoal } from '../../types';
import { formatLong, toDateKey } from '../../utils/dates';
import { newId } from '../../utils/id';
import { AmountStepper, Coins, MoneyTabs, Progress, describeTx, formatEuro, genitive, useLookups } from './parts';

export function ChildMoneyPage() {
  const { childId } = useParams();
  const children = useChildren();
  if (!children) return null;
  const child = children.find((c) => c.id === childId);
  if (!child) return <p className="empty">Dieses Kind gibt es nicht. <Link to="/geld">Zur Geldwelt</Link></p>;
  return <Treasury child={child} children={children} />;
}

function Treasury({ child, children }: { child: ChildProfile; children: ChildProfile[] }) {
  const today = toDateKey(useNow(60_000));
  const txs = useMoneyTransactions();
  const goals = useSavingsGoals();
  const trips = useTripGoals();
  const requests = useMoneyRequests();
  const sims = useSimDepots();
  const vals = useDepotValuations();
  const { names, tripMap } = useLookups(children, trips);
  const [wish, setWish] = useState(false);
  if (!txs || !goals || !trips || !requests || !sims || !vals) return null;

  const map = balances(txs);
  const age = childAge(child, today);
  const spend = potBalance(map, child.id, 'spend');
  const save = potBalance(map, child.id, 'save');
  const val = latestValuation(vals, child.id);
  const invest = investValue(map, child.id, val);
  const sim = sims.find((s) => s.childId === child.id);
  const withInvest = showInvest(age, invest.value, !!val, !!sim?.enabled);
  const progress = goalProgress(goals.filter((g) => g.childId === child.id), save.total);
  const open = requests.filter((r) => r.childId === child.id && r.status === 'open');
  const mine = txs.filter((t) => [t.from, t.to].some((a) => a?.kind === 'child' && a.childId === child.id) || t.byChildId === child.id)
    .slice().reverse().slice(0, 8);
  const simple = age === undefined || age < 7;

  return (
    <div className={`tone-${child.color}`}>
      <header className="page-head">
        <Link to="/geld" className="btn btn--icon btn--ghost" aria-label="Zurück zur Geldwelt"><ArrowLeft size={22} /></Link>
        <Avatar avatar={child.avatar} color={child.color} size={52} />
        <h1>{genitive(child.name)} Schatzkammer</h1>
        <div className="spacer" />
        <button type="button" className="btn btn--sky" onClick={() => setWish(true)}>Ich möchte …</button>
      </header>
      <MoneyTabs />

      <div className={`mw-pots ${withInvest ? 'mw-pots--3' : ''}`}>
        <section className="card mw-pot mw-pot--spend">
          <h2 className="mw-pot__title"><span aria-hidden="true">{POT_EMOJI.spend}</span> {POT_LABEL.spend}</h2>
          <p className="mw-pot__amount">{formatEuro(spend.total)}</p>
          {simple && <Coins cents={spend.total} />}
          <p className="small muted">{POT_TEXT.spend}</p>
          <Where split={spend} />
        </section>

        <section className="card mw-pot mw-pot--save">
          <h2 className="mw-pot__title"><span aria-hidden="true">{POT_EMOJI.save}</span> {POT_LABEL.save}</h2>
          <p className="mw-pot__amount">{formatEuro(save.total)}</p>
          {simple && <Coins cents={save.total} />}
          <p className="small muted">{POT_TEXT.save}</p>
          {progress.length > 0 && (
            <ul className="mw-goals">
              {progress.map(({ goal, saved, reached }) => (
                <li key={goal.id} className={reached ? 'is-reached' : ''}>
                  <span className="mw-goal__emoji" aria-hidden="true">{goal.emoji}</span>
                  <div className="stack" style={{ flex: 1, gap: 4 }}>
                    <span><strong>{goal.title}</strong> {reached ? '· geschafft! 🎉' : `· noch ${formatEuro(goal.targetCents - saved)}`}</span>
                    <Progress value={saved} max={goal.targetCents} label={`Sparziel ${goal.title}`} />
                    <span className="small muted">{formatEuro(saved)} von {formatEuro(goal.targetCents)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {progress.length === 0 && <p className="small">Noch kein Sparziel. Mama oder Papa tragen es mit dir ein.</p>}
          <Where split={save} />
        </section>

        {withInvest && (
          <section className="card mw-pot mw-pot--invest">
            <h2 className="mw-pot__title"><span aria-hidden="true">{POT_EMOJI.invest}</span> {POT_LABEL.invest}</h2>
            <p className="mw-pot__amount">{formatEuro(invest.value)}</p>
            <p className="small muted">{POT_TEXT.invest}</p>
            {invest.savings > 0 && <p className="small">{formatEuro(invest.savings)} warten als Guthaben. Ob es in ein echtes Depot geht, entscheiden Mama und Papa mit dir.</p>}
            {invest.deposited > 0 && (
              <p className="small">
                Im echten Depot: {formatEuro(invest.depotValue)}{invest.valuedAt ? ` (Wert vom ${formatLong(invest.valuedAt)})` : ''}. Eingezahlt: {formatEuro(invest.deposited)}.
                {invest.depotValue !== invest.deposited && ` Das sind ${formatEuro(Math.abs(invest.depotValue - invest.deposited))} ${invest.depotValue > invest.deposited ? 'mehr' : 'weniger'} als eingezahlt. So ist das bei Anlagen: Der Wert steigt und fällt.`}
              </p>
            )}
          </section>
        )}
      </div>

      {sim?.enabled && <SimCard sim={sim} today={today} />}

      <div className="lib-grid2" style={{ marginTop: 'var(--space-4)' }}>
        <div className="stack">
          {open.length > 0 && (
            <section className="card">
              <h2 className="card__title">Meine Wünsche</h2>
              <ul className="list">
                {open.map((r) => (
                  <li key={r.id} className="list-item">
                    <div className="list-item__main">
                      <p className="list-item__title">{REQUEST_LABEL[r.kind]}: {formatEuro(r.cents)}{r.tripId ? ` für ${tripMap.get(r.tripId)?.name ?? ''}` : ''}</p>
                      <p className="list-item__meta">Wartet auf Mama oder Papa{r.note ? ` · ${r.note}` : ''}</p>
                    </div>
                    <button type="button" className="btn btn--icon btn--ghost btn--small" aria-label="Wunsch zurücknehmen" onClick={() => void db.moneyRequests.delete(r.id)}><Trash2 size={16} /></button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="card">
            <h2 className="card__title">Was zuletzt passiert ist</h2>
            {mine.length === 0 ? <p className="small muted">Hier steht bald, wenn Geld dazukommt oder ausgegeben wird.</p> : (
              <ul className="list">
                {mine.map((t) => <TxLine key={t.id} tx={t} childId={child.id} text={describeTx(t, names, tripMap)} />)}
              </ul>
            )}
          </section>
        </div>
        <section className="card">
          <h2 className="card__title">Geld verstehen</h2>
          <p className="small muted">Zum Ausprobieren mit Mama oder Papa</p>
          <ul className="mw-lessons">
            {lessonsFor(age).map((l) => <li key={l.id}><strong>{l.title}</strong><br />{l.idea}</li>)}
          </ul>
        </section>
      </div>

      {wish && <WishModal child={child} map={map} trips={trips.filter((t) => t.status === 'active')} withInvest={withInvest} onClose={() => setWish(false)} />}
    </div>
  );
}

function Where({ split }: { split: { cash: number; bank: number } }) {
  if (split.cash === 0 && split.bank === 0) return null;
  const parts = [split.cash > 0 && `${formatEuro(split.cash)} ${HOLDING_LABEL.cash} bei Mama und Papa`, split.bank > 0 && `${formatEuro(split.bank)} auf dem ${HOLDING_LABEL.bank}`].filter(Boolean);
  return <p className="mw-where">{parts.join(' · ')}</p>;
}

function TxLine({ tx, childId, text }: { tx: MoneyTransaction; childId: string; text: string }) {
  const out = tx.from?.kind === 'child' && tx.from.childId === childId;
  const inn = tx.to?.kind === 'child' && tx.to.childId === childId;
  const sign = out && !inn ? '−' : inn && !out ? '+' : '';
  return (
    <li className="list-item">
      <div className="list-item__main"><p className="list-item__title">{text}</p><p className="list-item__meta">{formatLong(tx.date)}</p></div>
      <strong className={sign === '+' ? 'pj-income' : sign === '−' ? 'pj-cost' : ''}>{sign} {formatEuro(tx.cents)}</strong>
    </li>
  );
}

/** Musterdepot: frei gewählte Kursänderungen ausprobieren. Ausdrücklich keine echten Kurse und kein echtes Geld. */
function SimCard({ sim, today }: { sim: SimDepot; today: string }) {
  const values = simValues(sim);
  const now = values[values.length - 1];
  const diff = now - sim.startCents;
  const change = (percent: number) => void db.simDepots.update(sim.childId, { changes: [...sim.changes, { id: newId('sim'), date: today, percent }] });
  return (
    <section className="card mw-sim" aria-label="Musterdepot">
      <p className="mw-sim__badge">MUSTERDEPOT · ZUM AUSPROBIEREN</p>
      <div className="row row--wrap" style={{ alignItems: 'flex-end', gap: 'var(--space-4)' }}>
        <div>
          <p className="small muted">Mein wachsendes Sparschwein, aktueller Wert</p>
          <p className="mw-pot__amount">{formatEuro(now)}</p>
          <p className="small">{diff === 0 ? 'Genau wie am Anfang' : `${diff > 0 ? '+' : '−'}${formatEuro(Math.abs(diff))} seit dem Start mit ${formatEuro(sim.startCents)}`}</p>
        </div>
        <SimChart values={values} />
      </div>
      <p className="small" style={{ marginTop: 'var(--space-3)' }}>Was passiert am Aktienmarkt? Wähle selbst:</p>
      <div className="row row--wrap">
        {[-10, -5, 5, 10].map((p) => (
          <button key={p} type="button" className="btn btn--small" onClick={() => change(p)}>
            {p < 0 ? <TrendingDown size={16} aria-hidden="true" /> : <TrendingUp size={16} aria-hidden="true" />} {p > 0 ? '+' : '−'}{Math.abs(p)} %
          </button>
        ))}
        {sim.changes.length > 0 && <button type="button" className="btn btn--small btn--ghost" onClick={() => void db.simDepots.update(sim.childId, { changes: [] })}>Von vorn</button>}
      </div>
      <p className="small muted">Dies ist ein Lernrechner mit frei gewählten Kursänderungen. Er zeigt keine echten Börsenkurse und kein echtes Geld.</p>
    </section>
  );
}

function SimChart({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const last = values.slice(-12);
  const min = Math.min(...last); const max = Math.max(...last);
  const span = max - min || 1;
  const w = 220; const h = 70;
  const pts = last.map((v, i) => `${(i / (last.length - 1)) * w},${h - ((v - min) / span) * (h - 8) - 4}`).join(' ');
  return (
    <svg className="mw-sim__chart" viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label="Verlauf im Musterdepot">
      <polyline points={pts} fill="none" stroke="var(--c-sky-ink)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

type WishKind = MoneyRequest['kind'];

function WishModal({ child, map, trips, withInvest, onClose }: {
  child: ChildProfile; map: Map<string, number>; trips: TripGoal[]; withInvest: boolean; onClose: () => void;
}) {
  const [kind, setKind] = useState<WishKind | null>(null);
  const [tripId, setTripId] = useState(trips[0]?.id);
  const [cents, setCents] = useState(100);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const fromPot = kind ? requestFromPot(kind) : 'spend';
  const available = kind === 'trip' ? potBalance(map, child.id, 'spend').total + potBalance(map, child.id, 'save').total : potBalance(map, child.id, fromPot).total;
  const options: { kind: WishKind; emoji: string; label: string }[] = [
    { kind: 'save', emoji: '🐷', label: 'Zum Sparen legen' },
    { kind: 'buy', emoji: '🛍️', label: 'Etwas kaufen' },
    ...(trips.length ? [{ kind: 'trip' as const, emoji: '🧳', label: 'In die Reisekasse geben' }] : []),
    ...(withInvest ? [{ kind: 'invest' as const, emoji: '🌱', label: 'Langfristig anlegen' }] : []),
  ];
  const send = async () => {
    if (!kind || cents <= 0 || busy) return;
    setBusy(true);
    await db.moneyRequests.add({
      id: newId('wish'), childId: child.id, kind, cents, status: 'open', createdAt: new Date().toISOString(),
      ...(kind === 'trip' && tripId ? { tripId } : {}), ...(note.trim() ? { note: note.trim() } : {}),
    });
    onClose();
  };
  return (
    <Modal title="Ich möchte …" onClose={onClose} actions={kind && (
      <>
        <button type="button" className="btn btn--ghost" onClick={() => setKind(null)}>Zurück</button>
        <button type="button" className="btn btn--primary" disabled={cents <= 0 || cents > available || busy} onClick={() => void send()}>Wunsch abschicken</button>
      </>
    )}>
      {!kind && (
        <div className="mw-wish-opts">
          {options.map((o) => (
            <button key={o.kind} type="button" className="mw-wish" onClick={() => { setKind(o.kind); setCents(Math.min(100, Math.max(0, o.kind === 'trip' ? available : potBalance(map, child.id, requestFromPot(o.kind)).total))); }}>
              <span className="mw-wish__emoji" aria-hidden="true">{o.emoji}</span>{o.label}
            </button>
          ))}
        </div>
      )}
      {kind && (
        <div className="stack">
          {kind === 'trip' && (
            <div className="seg" role="group" aria-label="Reiseziel">
              {trips.map((t) => <button key={t.id} type="button" className="seg__item" aria-pressed={tripId === t.id} onClick={() => setTripId(t.id)}>{t.flag} {t.name}</button>)}
            </div>
          )}
          {available <= 0 ? <p className="notice">Dafür ist gerade kein Geld da. {kind === 'invest' ? 'Anlegen geht vom Spargeld.' : ''}</p> : (
            <>
              <p>Wie viel? Du hast {formatEuro(available)} {kind === 'invest' ? 'Spargeld' : kind === 'trip' ? 'zum Ausgeben und Sparen' : 'zum Ausgeben'}.</p>
              <AmountStepper cents={cents} onChange={setCents} max={available} />
            </>
          )}
          {kind === 'buy' && <input className="input" value={note} placeholder="Was möchtest du kaufen?" aria-label="Was möchtest du kaufen?" onChange={(e) => setNote(e.target.value)} />}
          {kind === 'trip' && <p className="small muted">Das ist freiwillig. Die Reise bezahlen Mama und Papa, dein Beitrag ist ein Geschenk an die Familie.</p>}
          {kind === 'invest' && <p className="small muted">Mama und Papa besprechen das mit dir. Angelegtes Geld ist für ganz lange und nicht gleich wieder da.</p>}
          <p className="small muted">Gebucht wird erst, wenn Mama oder Papa zustimmen.</p>
        </div>
      )}
    </Modal>
  );
}

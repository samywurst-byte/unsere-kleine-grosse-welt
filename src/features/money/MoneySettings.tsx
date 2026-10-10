import { ArrowLeftRight, Minus, Plus, Scale, Undo2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Segmented } from '../../components/FormControls';
import { HOLDING_LABEL, POT_LABEL, SOURCE_LABEL } from '../../data/money';
import { db } from '../../database/db';
import {
  useChildren, useMembers, useMoneyRequests, useMoneyTransactions, useProjects, useTripGoals,
} from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import {
  REQUEST_LABEL, balances, cashOverview, confirmRequest, potBalance, requestFromPot, requestTx, reversedIds,
} from '../../services/money';
import { moneySummary } from '../../services/projects';
import type { ChildProfile, Id, MoneyAccount, MoneyHolding, MoneyPot, MoneyRequest, MoneyTransaction, TripGoal } from '../../types';
import { formatLong, toDateKey } from '../../utils/dates';
import { CorrectionModal, ExpenseModal, IncomeModal, ReverseModal, TransferModal, type MoneyCtx } from './BookingModals';
import { GoalsView, InvestView, TripsView } from './MoneyPlans';
import { ConfirmerPicker, EuroInput, accountLabel, allAccounts, formatEuro, parseEuro, useConfirmer, useLookups, FieldGroup } from './parts';

type Tab = 'book' | 'wishes' | 'goals' | 'trips' | 'cash' | 'history' | 'invest';

/** Elternbereich der Geldwelt: buchen, Wünsche bestätigen, Ziele pflegen, Kasse abgleichen. */
export function MoneySettings() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'book';
  const projectParam = params.get('projekt') ?? undefined;
  const today = toDateKey(useNow(60_000));
  const children = useChildren();
  const trips = useTripGoals();
  const txs = useMoneyTransactions();
  const requests = useMoneyRequests();
  const projects = useProjects();
  const { names, tripMap } = useLookups(children, trips);
  const map = useMemo(() => balances(txs ?? []), [txs]);
  if (!children || !trips || !txs || !requests || !projects) return null;
  const activeTrips = trips.filter((t) => t.status === 'active');
  const ctx: MoneyCtx = { children, trips: activeTrips, balances: map, names, tripMap, today };
  const accounts = allAccounts(children, activeTrips);
  const openWishes = requests.filter((r) => r.status === 'open').length;
  const setTab = (t: Tab) => setParams({ tab: t }, { replace: true });

  return (
    <div className="parent-section">
      <div className="parent-section__head">
        <h2>Geldwelt und Reisekasse</h2>
        <Segmented<Tab> label="Bereich" value={tab} onChange={setTab} options={[
          { value: 'book', label: 'Buchen' }, { value: 'wishes', label: openWishes ? `Wünsche (${openWishes})` : 'Wünsche' }, { value: 'goals', label: 'Sparziele' },
          { value: 'trips', label: 'Reiseziele' }, { value: 'cash', label: 'Kasse' }, { value: 'history', label: 'Verlauf' }, { value: 'invest', label: 'Anlegen' },
        ]} />
      </div>
      {tab === 'book' && <BookView ctx={ctx} accounts={accounts} projects={projects} projectParam={projectParam} onProjectDone={() => setParams({ tab: 'book' }, { replace: true })} txs={txs} />}
      {tab === 'wishes' && <WishesView ctx={ctx} requests={requests} />}
      {tab === 'goals' && <GoalsView ctx={ctx} accounts={accounts} />}
      {tab === 'trips' && <TripsView trips={trips} balances={map} />}
      {tab === 'cash' && <CashView ctx={ctx} accounts={accounts} txs={txs} children={children} trips={trips} projects={projects} />}
      {tab === 'history' && <HistoryView ctx={ctx} txs={txs} />}
      {tab === 'invest' && <InvestView ctx={ctx} accounts={accounts} />}
    </div>
  );
}

// ------------------------------------------------------------- Buchen

function BookView({ ctx, accounts, projects, projectParam, onProjectDone, txs }: {
  ctx: MoneyCtx; accounts: MoneyAccount[]; projects: import('../../types').FamilyProject[]; projectParam?: Id; onProjectDone: () => void; txs: MoneyTransaction[];
}) {
  const [modal, setModal] = useState<'income' | 'expense' | 'transfer' | null>(projectParam ? 'income' : null);
  const close = () => { setModal(null); if (projectParam) onProjectDone(); };
  const recent = txs.slice(-5).reverse();
  return (
    <div className="stack">
      <div className="mw-actions">
        <button type="button" className="card mw-action" onClick={() => setModal('income')}><Plus aria-hidden="true" /><strong>Geld eintragen</strong><span className="small muted">Taschengeld, Geschenke, Verkäufe, Projektüberschuss, Beitrag zur Reisekasse</span></button>
        <button type="button" className="card mw-action" onClick={() => setModal('expense')}><Minus aria-hidden="true" /><strong>Ausgabe eintragen</strong><span className="small muted">Ein Kind hat etwas gekauft, Geld aus der Reisekasse verwendet</span></button>
        <button type="button" className="card mw-action" onClick={() => setModal('transfer')}><ArrowLeftRight aria-hidden="true" /><strong>Umbuchen</strong><span className="small muted">Bargeld aufs Sparbuch, Sparen zu Anlegen, freiwilliger Beitrag</span></button>
      </div>
      <p className="notice notice--info">
        Hier wird nur echtes Geld gebucht, das ihr tatsächlich verwahrt. Nichts passiert automatisch und nichts durch Antippen einer Aufgabe.
        Persönliches Geld eines Kindes geht nur mit seiner Zustimmung in die Reisekasse.
      </p>
      {recent.length > 0 && (
        <section className="card">
          <h3 className="card__title">Zuletzt gebucht</h3>
          <ul className="list">{recent.map((t) => <HistoryLine key={t.id} tx={t} ctx={ctx} />)}</ul>
        </section>
      )}
      {modal === 'income' && <IncomeModal ctx={ctx} projects={projects} projectId={projectParam} onClose={close} />}
      {modal === 'expense' && <ExpenseModal ctx={ctx} accounts={accounts} onClose={close} />}
      {modal === 'transfer' && <TransferModal ctx={ctx} accounts={accounts} onClose={close} />}
    </div>
  );
}

// ------------------------------------------------------------- Wünsche

function WishesView({ ctx, requests }: { ctx: MoneyCtx; requests: MoneyRequest[] }) {
  const open = requests.filter((r) => r.status === 'open').sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const decided = requests.filter((r) => r.status !== 'open').sort((a, b) => (b.decidedAt ?? '').localeCompare(a.decidedAt ?? '')).slice(0, 8);
  return (
    <div className="stack">
      {open.length === 0 && <p className="empty">Gerade wartet kein Wunsch. Die Kinder können in ihrer Schatzkammer auf „Ich möchte …“ tippen.</p>}
      {open.map((r) => <WishRow key={r.id} req={r} ctx={ctx} />)}
      {decided.length > 0 && (
        <section className="card">
          <h3 className="card__title">Zuletzt entschieden</h3>
          <ul className="list">
            {decided.map((r) => (
              <li key={r.id} className="list-item">
                <div className="list-item__main">
                  <p className="list-item__title">{ctx.names.get(r.childId)}: {REQUEST_LABEL[r.kind]} · {formatEuro(r.cents)}</p>
                  <p className="list-item__meta">{r.status === 'done' ? 'Gebucht' : 'Nicht jetzt'}{r.decidedAt ? ` · ${formatLong(r.decidedAt.slice(0, 10))}` : ''}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function WishRow({ req, ctx }: { req: MoneyRequest; ctx: MoneyCtx }) {
  const child = ctx.children.find((c) => c.id === req.childId);
  const [fromPot, setFromPot] = useState<MoneyPot>(requestFromPot(req.kind));
  const pots: MoneyPot[] = req.kind === 'buy' ? ['spend', 'save'] : req.kind === 'save' ? ['spend'] : req.kind === 'invest' ? ['save', 'spend'] : ['spend', 'save'];
  const bal = potBalance(ctx.balances, req.childId, fromPot);
  const [holding, setHolding] = useState<MoneyHolding>(bal.cash >= req.cents ? 'cash' : 'bank');
  const [toHolding, setToHolding] = useState<MoneyHolding>(holding);
  const [confirmedBy, setConfirmedBy, parents] = useConfirmer();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trip = req.tripId ? ctx.tripMap.get(req.tripId) : undefined;
  const confirm = async () => {
    setBusy(true); setError(null);
    const res = await confirmRequest(db, req, requestTx(req, { fromPot, fromHolding: holding, toHolding, confirmedBy, date: ctx.today }, trip?.name));
    if (!res.ok) setError(res.error);
    setBusy(false);
  };
  const decline = () => void db.moneyRequests.update(req.id, { status: 'declined', decidedAt: new Date().toISOString() });
  if (!child) return null;
  return (
    <section className={`card mw-wishrow tone-${child.color}`}>
      <div className="row">
        <Avatar avatar={child.avatar} color={child.color} size={48} />
        <div style={{ flex: 1 }}>
          <p className="mw-wishrow__title">{child.name} möchte {formatEuro(req.cents)} {req.kind === 'buy' ? `ausgeben${req.note ? `: ${req.note}` : ''}` : req.kind === 'save' ? 'zum Sparen legen' : req.kind === 'invest' ? 'langfristig anlegen' : `in die Reisekasse für ${trip?.name ?? '…'} geben`}</p>
          <p className="small muted">Gewünscht am {formatLong(req.createdAt.slice(0, 10))}</p>
        </div>
      </div>
      {req.kind === 'invest' && <p className="small">Bitte vorher gemeinsam besprechen. Die App bucht nur ins Guthaben „Anlegen“. Eine echte Anlage führt ihr selbst außerhalb der App aus.</p>}
      {req.kind === 'trip' && <p className="small">Freiwilliger Beitrag aus dem persönlichen Geld. Mit dem Bestätigen haltet ihr fest, dass {child.name} das selbst möchte.</p>}
      <div className="form-grid">
        <FieldGroup label="Aus">
          <div className="seg" role="group" aria-label="Aus welchem Bereich">
            {pots.map((p) => <button key={p} type="button" className="seg__item" aria-pressed={fromPot === p} onClick={() => setFromPot(p)}>{POT_LABEL[p]} ({formatEuro(potBalance(ctx.balances, req.childId, p).total)})</button>)}
          </div>
        </FieldGroup>
        <FieldGroup label="Das Geld liegt als">
          <div className="seg" role="group" aria-label="Wo liegt das Geld">
            {(['cash', 'bank'] as MoneyHolding[]).map((h) => <button key={h} type="button" className="seg__item" aria-pressed={holding === h} onClick={() => { setHolding(h); setToHolding(h); }}>{HOLDING_LABEL[h]} ({formatEuro(h === 'cash' ? bal.cash : bal.bank)})</button>)}
          </div>
        </FieldGroup>
        {req.kind !== 'buy' && (
          <FieldGroup label="Kommt hin als">
            <div className="seg" role="group" aria-label="Wohin">
              {(['cash', 'bank'] as MoneyHolding[]).map((h) => <button key={h} type="button" className="seg__item" aria-pressed={toHolding === h} onClick={() => setToHolding(h)}>{HOLDING_LABEL[h]}</button>)}
            </div>
          </FieldGroup>
        )}
        <FieldGroup label="Wer bestätigt?"><ConfirmerPicker value={confirmedBy} onChange={setConfirmedBy} parents={parents} /></FieldGroup>
      </div>
      {error && <p className="notice notice--error">{error}</p>}
      <div className="row row--wrap">
        <button type="button" className="btn btn--sage" disabled={busy || !confirmedBy} onClick={() => void confirm()}>Bestätigen und buchen</button>
        <button type="button" className="btn btn--ghost" disabled={busy} onClick={decline}>Nicht jetzt</button>
      </div>
    </section>
  );
}

// ------------------------------------------------------------- Kassenabgleich

function CashView({ ctx, accounts, txs, children, trips, projects }: {
  ctx: MoneyCtx; accounts: MoneyAccount[]; txs: MoneyTransaction[]; children: ChildProfile[]; trips: TripGoal[];
  projects: import('../../types').FamilyProject[];
}) {
  const { rows, totals } = cashOverview(txs, children, trips);
  const [counted, setCounted] = useState('');
  const [correct, setCorrect] = useState<{ cents: number; up: boolean } | null>(null);
  const countedCents = parseEuro(counted);
  const diff = countedCents === null ? null : countedCents - totals.cash;
  const pending = projects.filter((p) => !p.moneyBatchId && moneySummary(p).income > 0);
  const shown = rows.filter((r) => r.split.total !== 0);
  return (
    <div className="stack">
      <div className="mw-totals">
        <div className="card mw-total"><span className="small muted">Bargeld, das ihr verwahrt</span><strong>{formatEuro(totals.cash)}</strong></div>
        <div className="card mw-total"><span className="small muted">Auf Bankkonten</span><strong>{formatEuro(totals.bank)}</strong></div>
        <div className="card mw-total"><span className="small muted">Ins echte Depot eingezahlt</span><strong>{formatEuro(totals.depot)}</strong></div>
      </div>
      <section className="card">
        <h3 className="card__title"><Scale size={18} aria-hidden="true" /> Bargeld nachzählen</h3>
        <div className="row row--wrap">
          <span>Wir haben gezählt:</span>
          <EuroInput value={counted} onChange={setCounted} label="Gezähltes Bargeld" />
          {diff !== null && (diff === 0 ? <strong className="mw-sum-ok">Stimmt genau ✓</strong> : (
            <>
              <strong className="mw-sum-bad">{diff > 0 ? `${formatEuro(diff)} mehr als gebucht` : `Es fehlen ${formatEuro(-diff)}`}</strong>
              <button type="button" className="btn btn--small" onClick={() => setCorrect({ cents: Math.abs(diff), up: diff > 0 })}>Mit Korrektur ausgleichen</button>
            </>
          ))}
        </div>
        <p className="small muted">Erst prüfen, ob eine Buchung fehlt. Eine Korrektur bucht ihr auf das Konto, bei dem die Abweichung liegt.</p>
      </section>
      <section className="card">
        <h3 className="card__title">Wo welches Geld liegt</h3>
        {shown.length === 0 ? <p className="small muted">Noch keine Buchungen.</p> : (
          <table className="mw-table">
            <thead><tr><th>Wer</th><th>Bereich</th><th>Bargeld</th><th>Bank</th><th>Depot</th></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={`${r.label}-${r.pot ?? r.tripId}`}>
                  <td>{r.tripId ? `${ctx.tripMap.get(r.tripId)?.flag ?? ''} ${r.label}` : r.label}</td>
                  <td>{r.pot ? POT_LABEL[r.pot] : 'Reisekasse'}</td>
                  <td>{formatEuro(r.split.cash)}</td><td>{formatEuro(r.split.bank)}</td><td>{r.split.depot ? formatEuro(r.split.depot) : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button type="button" className="btn btn--small btn--ghost" style={{ marginTop: 'var(--space-2)' }} onClick={() => setCorrect({ cents: 0, up: true })}>Korrekturbuchung</button>
      </section>
      {pending.length > 0 && (
        <section className="card">
          <h3 className="card__title">Projektgeld, noch nicht verteilt</h3>
          <ul className="list">
            {pending.map((p) => {
              const s = moneySummary(p);
              return (
                <li key={p.id} className="list-item">
                  <div className="list-item__main"><p className="list-item__title">{p.emoji} {p.title}</p><p className="list-item__meta">Einnahmen {formatEuro(s.income)} · Kosten {formatEuro(s.costs)}</p></div>
                  <strong>{formatEuro(s.surplus)}</strong>
                </li>
              );
            })}
          </ul>
          <p className="small muted">Dieses Geld liegt noch in der Projektkasse. Verteilen geht unter „Buchen“ → „Geld eintragen“ → „Gemeinsames Projekt“.</p>
        </section>
      )}
      {correct && <CorrectionModal ctx={ctx} accounts={accounts.filter((a) => a.holding === 'cash' || correct.cents === 0)} initial={{ cents: correct.cents || undefined, up: correct.up }} onClose={() => setCorrect(null)} />}
    </div>
  );
}

// ------------------------------------------------------------- Verlauf

function HistoryView({ ctx, txs }: { ctx: MoneyCtx; txs: MoneyTransaction[] }) {
  const [filter, setFilter] = useState('all');
  const [reverse, setReverse] = useState<MoneyTransaction | null>(null);
  const reversed = reversedIds(txs);
  const match = (a?: MoneyAccount) => a && (filter === `child:${a.kind === 'child' ? a.childId : ''}` || filter === `trip:${a.kind === 'trip' ? a.tripId : ''}`);
  const list = txs.filter((t) => filter === 'all' || match(t.from) || match(t.to)).slice().reverse();
  return (
    <div className="stack">
      <select className="input" style={{ maxWidth: 320 }} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter">
        <option value="all">Alle Buchungen</option>
        {ctx.children.map((c) => <option key={c.id} value={`child:${c.id}`}>{c.name}</option>)}
        {[...ctx.tripMap.values()].map((t) => <option key={t.id} value={`trip:${t.id}`}>Reisekasse {t.name}</option>)}
      </select>
      {list.length === 0 ? <p className="empty">Noch keine Buchungen.</p> : (
        <ul className="list card">
          {list.map((t) => <HistoryLine key={t.id} tx={t} ctx={ctx} reversed={reversed.has(t.id)} onReverse={!t.reverses && !reversed.has(t.id) ? () => setReverse(t) : undefined} />)}
        </ul>
      )}
      {reverse && <ReverseModal ctx={ctx} tx={reverse} onClose={() => setReverse(null)} />}
    </div>
  );
}

const KIND_LABEL: Record<MoneyTransaction['kind'], string> = { income: 'Einnahme', expense: 'Ausgabe', transfer: 'Umbuchung', correction: 'Korrektur' };

function HistoryLine({ tx, ctx, reversed, onReverse }: { tx: MoneyTransaction; ctx: MoneyCtx; reversed?: boolean; onReverse?: () => void }) {
  const members = useMembers();
  const who = members?.find((m) => m.id === tx.confirmedBy)?.name ?? '';
  const path = [tx.from, tx.to].filter(Boolean).map((a) => accountLabel(a!, ctx.names, ctx.tripMap)).join(' → ');
  const sign = tx.kind === 'income' || (tx.kind === 'correction' && tx.to && !tx.from) ? '+' : tx.kind === 'expense' || (tx.kind === 'correction' && tx.from && !tx.to) ? '−' : '';
  return (
    <li className={`list-item ${reversed ? 'mw-reversed' : ''}`}>
      <div className="list-item__main">
        <p className="list-item__title">{tx.note}{tx.source && tx.kind === 'income' ? ` · ${SOURCE_LABEL[tx.source]}` : ''}</p>
        <p className="list-item__meta">{formatLong(tx.date)} · {KIND_LABEL[tx.kind]} · {path}{who ? ` · bestätigt von ${who}` : ''}{reversed ? ' · storniert' : ''}</p>
      </div>
      <strong className={sign === '+' ? 'pj-income' : sign === '−' ? 'pj-cost' : ''}>{sign} {formatEuro(tx.cents)}</strong>
      {onReverse && <button type="button" className="btn btn--icon btn--ghost btn--small" aria-label="Buchung stornieren" title="Stornieren" onClick={onReverse}><Undo2 size={16} /></button>}
    </li>
  );
}


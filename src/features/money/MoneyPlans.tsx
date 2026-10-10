import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { Field, Segmented, Toggle } from '../../components/FormControls';
import { Modal } from '../../components/Modal';
import { DISCOVER_TOPICS } from '../../data/discover';
import { db } from '../../database/db';
import { useDepotValuations, useSavingsGoals, useSimDepots, useWorld } from '../../hooks/useData';
import { childAccount, goalProgress, investValue, latestValuation, potBalance, simValues, tripBalance } from '../../services/money';
import type { ChildProfile, MoneyAccount, SavingsGoal, TripGoal } from '../../types';
import { formatLong } from '../../utils/dates';
import { newId } from '../../utils/id';
import { shrinkImage } from '../../utils/image';
import { ExpenseModal, TransferModal, type MoneyCtx } from './BookingModals';
import { EuroInput, Progress, formatEuro, parseEuro, FieldGroup } from './parts';

// ------------------------------------------------------------- Sparziele

export function GoalsView({ ctx, accounts }: { ctx: MoneyCtx; accounts: MoneyAccount[] }) {
  const goals = useSavingsGoals();
  const [bought, setBought] = useState<{ goal: SavingsGoal; cents: number } | null>(null);
  if (!goals) return null;
  return (
    <div className="mw-goal-grid">
      {ctx.children.map((c) => (
        <ChildGoals key={c.id} child={c} goals={goals.filter((g) => g.childId === c.id)} saved={potBalance(ctx.balances, c.id, 'save').total}
          onBought={(goal, cents) => setBought({ goal, cents })} />
      ))}
      {bought && (
        <ExpenseModal ctx={ctx} accounts={accounts.filter((a) => a.kind === 'child' && a.childId === bought.goal.childId && a.pot === 'save')}
          initial={{ account: childAccount(bought.goal.childId, 'save', potBalance(ctx.balances, bought.goal.childId, 'save').cash >= bought.cents ? 'cash' : 'bank'), cents: bought.cents, note: `Sparziel: ${bought.goal.title}` }}
          onBooked={() => void db.savingsGoals.update(bought.goal.id, { doneAt: ctx.today })} onClose={() => setBought(null)} />
      )}
    </div>
  );
}

function ChildGoals({ child, goals, saved, onBought }: { child: ChildProfile; goals: SavingsGoal[]; saved: number; onBought: (g: SavingsGoal, cents: number) => void }) {
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎁');
  const [amount, setAmount] = useState('');
  const cents = parseEuro(amount);
  const progress = goalProgress(goals, saved);
  const done = goals.filter((g) => g.doneAt);
  const add = async () => {
    if (!title.trim() || !cents) return;
    await db.savingsGoals.add({ id: newId('goal'), childId: child.id, title: title.trim(), emoji: emoji.trim() || '🎁', targetCents: cents, order: Date.now(), createdAt: new Date().toISOString() });
    setTitle(''); setAmount('');
  };
  return (
    <section className={`card tone-${child.color}`}>
      <div className="row"><Avatar avatar={child.avatar} color={child.color} size={40} /><h3 className="card__title" style={{ margin: 0 }}>{child.name}</h3><div className="spacer" /><span className="small muted">Spargeld {formatEuro(saved)}</span></div>
      <ul className="mw-goals">
        {progress.map(({ goal, saved: s, reached }) => (
          <li key={goal.id} className={reached ? 'is-reached' : ''}>
            <span className="mw-goal__emoji" aria-hidden="true">{goal.emoji}</span>
            <div className="stack" style={{ flex: 1, gap: 4 }}>
              <span><strong>{goal.title}</strong> · {formatEuro(s)} von {formatEuro(goal.targetCents)}</span>
              <Progress value={s} max={goal.targetCents} label={`Sparziel ${goal.title}`} />
            </div>
            {s > 0 && <button type="button" className="btn btn--small btn--sage" onClick={() => onBought(goal, s)}>Gekauft</button>}
            <button type="button" className="btn btn--icon btn--ghost btn--small" aria-label="Sparziel löschen" onClick={() => void db.savingsGoals.delete(goal.id)}><Trash2 size={16} /></button>
          </li>
        ))}
      </ul>
      <div className="row row--wrap mw-goal-add">
        <input className="input mw-emoji-input" value={emoji} aria-label="Bild" onChange={(e) => setEmoji(e.target.value)} />
        <input className="input" style={{ flex: 1, minWidth: 140 }} value={title} placeholder="z. B. Laufrad" aria-label="Sparziel" onChange={(e) => setTitle(e.target.value)} />
        <EuroInput value={amount} onChange={setAmount} label="Zielbetrag" />
        <button type="button" className="btn btn--small" disabled={!title.trim() || !cents} onClick={() => void add()}><Plus size={16} aria-hidden="true" /> Ziel</button>
      </div>
      {done.length > 0 && <p className="small muted">Geschafft: {done.map((g) => `${g.emoji} ${g.title}`).join(', ')}</p>}
      <p className="small muted">„Gekauft“ bucht den Betrag als Ausgabe aus dem Spargeld und schließt das Ziel ab.</p>
    </section>
  );
}

// ------------------------------------------------------------- Reiseziele

export function TripsView({ trips, balances }: { trips: TripGoal[]; balances: Map<string, number> }) {
  const [edit, setEdit] = useState<TripGoal | 'new' | null>(null);
  return (
    <div className="stack">
      <ul className="list card">
        {trips.map((t) => (
          <li key={t.id} className="list-item">
            <span className="mw-trip-flag" aria-hidden="true">{t.flag}</span>
            <div className="list-item__main">
              <p className="list-item__title">{t.name}{t.status !== 'active' && <span className="chip">{t.status === 'done' ? 'erlebt' : 'pausiert'}</span>}</p>
              <p className="list-item__meta">{formatEuro(tripBalance(balances, t.id).total)} von {formatEuro(t.targetCents)}{t.totalCostCents ? ` · Reisekosten etwa ${formatEuro(t.totalCostCents)}` : ''}</p>
            </div>
            <button type="button" className="btn btn--icon btn--ghost btn--small" aria-label={`${t.name} bearbeiten`} onClick={() => setEdit(t)}><Pencil size={16} /></button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setEdit('new')}><Plus size={18} aria-hidden="true" /> Reiseziel anlegen</button>
      <p className="small muted">Die Beträge sind Sparziele für euren gemeinsamen Beitrag. Die geschätzten Reisekosten tragt ihr getrennt ein.</p>
      {edit && <TripEditor trip={edit === 'new' ? undefined : edit} hasMoney={edit !== 'new' && tripBalance(balances, edit.id).total !== 0} order={trips.length + 1} onClose={() => setEdit(null)} />}
    </div>
  );
}

const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

function TripEditor({ trip, hasMoney, order, onClose }: { trip?: TripGoal; hasMoney: boolean; order: number; onClose: () => void }) {
  const world = useWorld();
  const [d, setD] = useState<TripGoal>(trip ?? {
    id: newId('trip'), name: '', flag: '🧳', countryName: '', description: '', targetCents: 50000, activities: [], learning: [], topicIds: [],
    status: 'active', order, createdAt: new Date().toISOString(),
  });
  const [target, setTarget] = useState((d.targetCents / 100).toFixed(2).replace('.', ','));
  const [cost, setCost] = useState(d.totalCostCents ? (d.totalCostCents / 100).toFixed(2).replace('.', ',') : '');
  const [acts, setActs] = useState(d.activities.join('\n'));
  const [learn, setLearn] = useState(d.learning.join('\n'));
  const [err, setErr] = useState<string | null>(null);
  const set = (p: Partial<TripGoal>) => setD({ ...d, ...p });
  const targetCents = parseEuro(target);
  const costCents = cost.trim() ? parseEuro(cost) : undefined;
  const save = async () => {
    if (!d.name.trim() || !targetCents || costCents === null) return;
    const { totalCostCents: _old, ...rest } = d;
    await db.tripGoals.put({ ...rest, name: d.name.trim(), targetCents, activities: lines(acts), learning: lines(learn), ...(costCents ? { totalCostCents: costCents } : {}) });
    onClose();
  };
  const photo = async (f: File | undefined) => {
    if (!f) return;
    try { set({ photo: await shrinkImage(f, 900, 0.75) }); } catch (e) { setErr(e instanceof Error ? e.message : 'Das Foto ging nicht.'); }
  };
  const countries = world?.countries ?? [];
  return (
    <Modal title={trip ? trip.name : 'Neues Reiseziel'} onClose={onClose} wide actions={
      <>
        {trip && !hasMoney && <button type="button" className="btn btn--ghost btn--danger" onClick={() => void db.tripGoals.delete(d.id).then(onClose)}>Löschen</button>}
        <div className="spacer" />
        <button type="button" className="btn btn--ghost" onClick={onClose}>Abbrechen</button>
        <button type="button" className="btn btn--primary" disabled={!d.name.trim() || !targetCents || costCents === null} onClick={() => void save()}>Speichern</button>
      </>
    }>
      <div className="form-grid">
        <Field label="Name"><input className="input" value={d.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="Flagge oder Bild"><input className="input" value={d.flag} onChange={(e) => set({ flag: e.target.value })} /></Field>
        <Field label="Land"><input className="input" value={d.countryName} onChange={(e) => set({ countryName: e.target.value })} /></Field>
        <Field label="Land der Weltreise" hint="Verknüpft das Ziel mit eurer Weltreise">
          <select className="input" value={d.countryId ?? ''} onChange={(e) => {
            const c = countries.find((x) => x.id === e.target.value);
            setD({ ...d, countryId: c?.id, ...(c ? { countryName: c.nameDe, flag: d.flag === '🧳' ? c.flagEmoji : d.flag } : {}) });
          }}>
            <option value="">Keins</option>
            {countries.map((c) => <option key={c.id} value={c.id}>{c.flagEmoji} {c.nameDe}</option>)}
          </select>
        </Field>
        <Field label="Beschreibung" className="span-2"><input className="input" value={d.description} onChange={(e) => set({ description: e.target.value })} /></Field>
        <Field label="Sparziel" hint="Euer gemeinsamer Beitrag"><EuroInput value={target} onChange={setTarget} label="Sparziel" /></Field>
        <Field label="Geschätzte Reisekosten" hint="Optional, getrennt vom Sparziel"><EuroInput value={cost} onChange={setCost} label="Reisekosten" /></Field>
        <Field label="Was wir dort erleben möchten" hint="Eine Idee pro Zeile"><textarea className="textarea" rows={4} value={acts} onChange={(e) => setActs(e.target.value)} /></Field>
        <Field label="Vor der Reise entdecken" hint="Eine Lernaufgabe pro Zeile"><textarea className="textarea" rows={4} value={learn} onChange={(e) => setLearn(e.target.value)} /></Field>
        <FieldGroup label="Passende Themen der Entdeckerbibliothek" className="span-2">
          <div className="seg mw-seg-wrap" role="group" aria-label="Themen">
            {DISCOVER_TOPICS.map((t) => {
              const on = (d.topicIds ?? []).includes(t.id);
              return <button key={t.id} type="button" className="seg__item" aria-pressed={on} onClick={() => set({ topicIds: on ? (d.topicIds ?? []).filter((x) => x !== t.id) : [...(d.topicIds ?? []), t.id] })}>{t.emoji} {t.title}</button>;
            })}
          </div>
        </FieldGroup>
        <FieldGroup label="Foto">
          <div className="row">
            {d.photo && <img src={d.photo} alt="" className="mw-thumb" />}
            <label className="btn btn--small">Foto wählen<input type="file" accept="image/*" hidden onChange={(e) => void photo(e.target.files?.[0])} /></label>
            {d.photo && <button type="button" className="btn btn--small btn--ghost" onClick={() => { const { photo: _p, ...rest } = d; setD(rest); }}>Entfernen</button>}
          </div>
        </FieldGroup>
        <FieldGroup label="Status">
          <Segmented<TripGoal['status']> label="Status" value={d.status} onChange={(status) => set({ status })}
            options={[{ value: 'active', label: 'Wir sparen' }, { value: 'done', label: 'Erlebt' }, { value: 'archived', label: 'Pausiert' }]} />
        </FieldGroup>
      </div>
      {hasMoney && <p className="small muted">Ein Ziel mit Geld kann nicht gelöscht werden. Bucht das Geld vorher um oder setzt es auf „Erlebt“.</p>}
      {err && <p className="notice notice--error">{err}</p>}
    </Modal>
  );
}

// ------------------------------------------------------------- Anlegen

export function InvestView({ ctx, accounts }: { ctx: MoneyCtx; accounts: MoneyAccount[] }) {
  const sims = useSimDepots();
  const vals = useDepotValuations();
  const [transfer, setTransfer] = useState<ChildProfile | null>(null);
  if (!sims || !vals) return null;
  return (
    <div className="stack">
      <p className="notice notice--info">
        Die App führt keine Wertpapierorders aus. Echte Anlagen entscheidet und erledigt ihr selbst außerhalb der App und tragt hier nur Einzahlungen und Werte ein.
        Das Musterdepot ist eine Spielsimulation ohne echtes Geld und ohne echte Kurse.
      </p>
      <div className="mw-goal-grid">
        {ctx.children.map((c) => {
          const sim = sims.find((s) => s.childId === c.id);
          const val = latestValuation(vals, c.id);
          const inv = investValue(ctx.balances, c.id, val);
          return (
            <section key={c.id} className={`card stack tone-${c.color}`}>
              <div className="row"><Avatar avatar={c.avatar} color={c.color} size={40} /><h3 className="card__title" style={{ margin: 0 }}>{c.name}</h3></div>
              <div>
                <p className="card__eyebrow">Echtes Geld im Bereich Anlegen</p>
                <p>Guthaben (Bargeld oder Bank): <strong>{formatEuro(inv.savings)}</strong></p>
                <p>Ins echte Depot eingezahlt: <strong>{formatEuro(inv.deposited)}</strong>{inv.deposited > 0 && <> · Wert {formatEuro(inv.depotValue)}{inv.valuedAt ? ` vom ${formatLong(inv.valuedAt)}` : ' (noch kein Wert eingetragen)'}</>}</p>
                <div className="row row--wrap">
                  <button type="button" className="btn btn--small" disabled={inv.savings <= 0} onClick={() => setTransfer(c)}>Ins echte Depot übertragen</button>
                </div>
                {inv.deposited > 0 && <ValuationForm childId={c.id} today={ctx.today} />}
              </div>
              <SimSettings childId={c.id} sim={sim} today={ctx.today} />
            </section>
          );
        })}
      </div>
      {transfer && (
        <TransferModal ctx={ctx} title="Ins echte Depot übertragen" accounts={accounts.filter((a) => a.kind === 'child' && a.childId === transfer.id && a.pot === 'invest')}
          initial={{ from: childAccount(transfer.id, 'invest', potBalance(ctx.balances, transfer.id, 'invest').bank > 0 ? 'bank' : 'cash'), to: childAccount(transfer.id, 'invest', 'depot'), note: 'ETF-Kauf im Kinderdepot' }}
          onClose={() => setTransfer(null)} />
      )}
    </div>
  );
}

function ValuationForm({ childId, today }: { childId: string; today: string }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const cents = parseEuro(amount);
  const add = async () => {
    if (cents === null) return;
    await db.depotValuations.add({ id: newId('val'), childId, date, cents });
    setAmount('');
  };
  return (
    <div className="row row--wrap" style={{ marginTop: 'var(--space-2)' }}>
      <span className="small">Depotwert laut Bank:</span>
      <EuroInput value={amount} onChange={setAmount} label="Depotwert" />
      <input className="input" type="date" value={date} aria-label="Stand vom" onChange={(e) => e.target.value && setDate(e.target.value)} style={{ width: 170 }} />
      <button type="button" className="btn btn--small" disabled={cents === null} onClick={() => void add()}>Wert eintragen</button>
    </div>
  );
}

function SimSettings({ childId, sim, today }: { childId: string; sim: import('../../types').SimDepot | undefined; today: string }) {
  const [start, setStart] = useState(sim ? (sim.startCents / 100).toFixed(0) : '100');
  const startCents = parseEuro(start);
  const enable = (on: boolean) => void db.simDepots.put(sim ? { ...sim, enabled: on } : { childId, enabled: on, startCents: startCents ?? 10000, startDate: today, changes: [] });
  const values = sim ? simValues(sim) : [];
  return (
    <div className="card card--sunk">
      <p className="card__eyebrow">Musterdepot · Simulation</p>
      <Toggle checked={!!sim?.enabled} onChange={enable} label="In der Schatzkammer zeigen" />
      <div className="row row--wrap" style={{ marginTop: 'var(--space-2)' }}>
        <span className="small">Spielbetrag zum Start:</span>
        <EuroInput value={start} onChange={setStart} label="Spielbetrag" />
        <button type="button" className="btn btn--small btn--ghost" disabled={!startCents}
          onClick={() => void db.simDepots.put({ childId, enabled: sim?.enabled ?? true, startCents: startCents ?? 10000, startDate: today, changes: [] })}>Neu starten</button>
      </div>
      {sim && <p className="small muted">Aktueller Spielwert {formatEuro(values[values.length - 1])} nach {sim.changes.length} Änderungen. Empfohlen etwa ab 9 Jahren.</p>}
    </div>
  );
}

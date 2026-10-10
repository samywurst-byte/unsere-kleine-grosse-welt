import { useMemo, useState } from 'react';
import { Field, Segmented, Toggle } from '../../components/FormControls';
import { Modal } from '../../components/Modal';
import { PERSONAL_SPLIT, PROJECT_SPLIT, SOURCE_HINT, SOURCE_LABEL, type MoneySplit } from '../../data/money';
import { db } from '../../database/db';
import { MemberSelect } from '../parent-settings/MemberSelect';
import {
  accountKey, bookProjectDistribution, bookTransactions, distributionLines, planDistribution, reversalOf, splitIsValid, splitTotal, tripAccount,
} from '../../services/money';
import { moneySummary } from '../../services/projects';
import type { ChildProfile, FamilyProject, Id, MoneyAccount, MoneySource, MoneyTransaction, TripGoal } from '../../types';
import { newId } from '../../utils/id';
import { AccountSelect, ConfirmerPicker, EuroInput, accountLabel, formatEuro, parseEuro, useConfirmer, FieldGroup } from './parts';

interface Ctx {
  children: ChildProfile[];
  trips: TripGoal[];
  balances: Map<string, number>;
  names: Map<Id, string>;
  tripMap: Map<Id, TripGoal>;
  today: string;
}

function useSubmit(): [boolean, string | null, (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, onOk: () => void) => Promise<void>] {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, onOk: () => void) => {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const res = await fn();
      if (res.ok) onOk(); else setError(res.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Die Buchung hat nicht geklappt.');
    } finally { setBusy(false); }
  };
  return [busy, error, run];
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input className="input" type="date" value={value} aria-label="Datum" onChange={(e) => e.target.value && onChange(e.target.value)} />;
}

// ------------------------------------------------------------- Geld eintragen und verteilen

const SOURCES: MoneySource[] = ['pocket', 'gift', 'own-sale', 'project', 'parents', 'other'];

export function IncomeModal({ ctx, projects, projectId, onClose }: { ctx: Ctx; projects: FamilyProject[]; projectId?: Id; onClose: () => void }) {
  const preset = projectId ? projects.find((p) => p.id === projectId) : undefined;
  const [batchId] = useState(() => newId('batch'));
  const [target, setTarget] = useState<'kids' | 'trip'>('kids');
  const [source, setSource] = useState<MoneySource>(preset ? 'project' : 'pocket');
  const [project, setProject] = useState<FamilyProject | undefined>(preset);
  const [childIds, setChildIds] = useState<Id[]>(preset ? preset.childIds.filter((id) => ctx.children.some((c) => c.id === id)) : ctx.children[0] ? [ctx.children[0].id] : []);
  const [amount, setAmount] = useState(preset ? (moneySummary(preset).surplus / 100).toFixed(2).replace('.', ',') : '');
  const [holding, setHolding] = useState<'cash' | 'bank'>('cash');
  const [date, setDate] = useState(ctx.today);
  const [note, setNote] = useState(preset ? `${preset.emoji} ${preset.title}` : SOURCE_LABEL.pocket);
  const [split, setSplit] = useState<MoneySplit>(preset ? (preset.ideaId === 'flea-market' ? PERSONAL_SPLIT : PROJECT_SPLIT) : PERSONAL_SPLIT);
  const [tripId, setTripId] = useState(ctx.trips[0]?.id);
  const [consent, setConsent] = useState(false);
  const [confirmedBy, setConfirmedBy, parents] = useConfirmer();
  const [busy, error, run] = useSubmit();

  const shared = source === 'project';
  const cents = parseEuro(amount);
  const total = cents === null ? 0 : shared || target === 'trip' ? cents : cents * childIds.length;
  const needsConsent = target === 'kids' && !shared && source !== 'parents' && split.trip > 0;
  const lines = useMemo(() => (target === 'kids' && total > 0 && childIds.length ? distributionLines(total, childIds, split) : []), [target, total, childIds, split]);

  const pickSource = (s: MoneySource) => {
    setSource(s);
    if (!project || s !== 'project') setNote(SOURCE_LABEL[s]);
    setSplit(s === 'project' ? PROJECT_SPLIT : PERSONAL_SPLIT);
    if (s !== 'project') setProject(undefined);
  };
  const pickProject = (id: string) => {
    const p = projects.find((x) => x.id === id);
    setProject(p);
    if (p) { setChildIds(p.childIds.filter((id) => ctx.children.some((c) => c.id === id))); setNote(`${p.emoji} ${p.title}`); setAmount((Math.max(0, moneySummary(p).surplus) / 100).toFixed(2).replace('.', ',')); setSplit(p.ideaId === 'flea-market' ? PERSONAL_SPLIT : PROJECT_SPLIT); }
  };

  const valid = cents !== null && cents > 0 && !!note.trim() && !!confirmedBy
    && (target === 'trip' ? !!tripId : childIds.length > 0 && splitIsValid(split) && (split.trip === 0 || !!tripId) && (!needsConsent || consent));

  const book = () => run(async () => {
    if (target === 'trip') {
      const tx: MoneyTransaction = {
        id: batchId, kind: 'income', date, cents: total, to: tripAccount(tripId!, holding), source, note: note.trim(), confirmedBy,
        batchId, createdAt: new Date().toISOString(), ...(project ? { projectId: project.id } : {}),
      };
      return project ? bookProjectDistribution(db, project.id, [tx]) : bookTransactions(db, [tx]);
    }
    const txs = planDistribution({
      batchId, date, totalCents: total, childIds, split, holding, source, note: note.trim(), confirmedBy, tripId, childConsent: consent,
      ...(project ? { projectId: project.id } : {}),
    });
    return project ? bookProjectDistribution(db, project.id, txs) : bookTransactions(db, txs);
  }, onClose);

  const openProjects = projects.filter((p) => !p.moneyBatchId && moneySummary(p).income > 0);

  return (
    <Modal title={shared ? 'Gemeinsam erwirtschaftet' : 'Geld eintragen'} onClose={onClose} wide actions={
      <><button type="button" className="btn btn--ghost" onClick={onClose}>Abbrechen</button>
        <button type="button" className="btn btn--primary" disabled={!valid || busy} onClick={() => void book()}>{busy ? 'Buche …' : `${formatEuro(total)} buchen`}</button></>
    }>
      <div className="stack">
        <Segmented<'kids' | 'trip'> label="Für wen" value={target} onChange={(t) => { setTarget(t); if (t === 'trip' && source !== 'project') pickSource('parents'); }}
          options={[{ value: 'kids', label: 'Für die Kinder' }, { value: 'trip', label: 'Direkt in die Reisekasse' }]} />
        <FieldGroup label="Woher kommt das Geld?" hint={SOURCE_HINT[source]}>
          <div className="seg mw-seg-wrap" role="group" aria-label="Herkunft">
            {SOURCES.filter((s) => target === 'kids' || ['parents', 'project', 'other'].includes(s)).map((s) => (
              <button key={s} type="button" className="seg__item" aria-pressed={source === s} onClick={() => pickSource(s)}>{SOURCE_LABEL[s]}</button>
            ))}
          </div>
        </FieldGroup>
        {source === 'project' && (
          <Field label="Projekt" hint="Einnahmen und Kosten tragt ihr im Projekt ein. Hier wird der Überschuss verteilt.">
            <select className="input" value={project?.id ?? ''} onChange={(e) => pickProject(e.target.value)} aria-label="Projekt">
              <option value="">Ohne Projekt</option>
              {(project && !openProjects.includes(project) ? [project, ...openProjects] : openProjects).map((p) => (
                <option key={p.id} value={p.id}>{p.emoji} {p.title} (Überschuss {formatEuro(moneySummary(p).surplus)})</option>
              ))}
            </select>
          </Field>
        )}
        {project && <p className="mw-together">Wir haben zusammen {formatEuro(Math.max(0, moneySummary(project).surplus))} erwirtschaftet. Was möchten wir damit machen?</p>}
        <div className="form-grid">
          {target === 'kids' && (
            <FieldGroup label={shared ? 'Wer war dabei?' : 'Für wen?'} className="span-2">
              <MemberSelect members={ctx.children} value={childIds} onChange={setChildIds} />
            </FieldGroup>
          )}
          <Field label={target === 'kids' && !shared ? 'Betrag je Kind' : 'Betrag'}><EuroInput value={amount} onChange={setAmount} /></Field>
          <FieldGroup label="Wo liegt das Geld?">
            <Segmented<'cash' | 'bank'> label="Wo liegt das Geld" value={holding} onChange={setHolding} options={[{ value: 'cash', label: 'Bargeld' }, { value: 'bank', label: 'Bankkonto' }]} />
          </FieldGroup>
          <Field label="Wofür / Notiz"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <Field label="Datum"><DateInput value={date} onChange={setDate} /></Field>
        </div>
        {(target === 'trip' || split.trip > 0) && ctx.trips.length > 0 && (
          <FieldGroup label="Reiseziel">
            <div className="seg" role="group" aria-label="Reiseziel">
              {ctx.trips.map((t) => <button key={t.id} type="button" className="seg__item" aria-pressed={tripId === t.id} onClick={() => setTripId(t.id)}>{t.flag} {t.name}</button>)}
            </div>
          </FieldGroup>
        )}
        {target === 'kids' && <SplitEditor split={split} onChange={setSplit} suggestion={shared ? PROJECT_SPLIT : PERSONAL_SPLIT} lines={lines} names={ctx.names} />}
        {needsConsent && <Toggle checked={consent} onChange={setConsent} label="Das Kind möchte selbst etwas in die Reisekasse geben" />}
        <FieldGroup label="Wer bestätigt?"><ConfirmerPicker value={confirmedBy} onChange={setConfirmedBy} parents={parents} /></FieldGroup>
        {error && <p className="notice notice--error">{error}</p>}
      </div>
    </Modal>
  );
}

const SPLIT_FIELDS: { key: keyof MoneySplit; label: string }[] = [
  { key: 'spend', label: 'Ausgeben' }, { key: 'save', label: 'Sparen' }, { key: 'trip', label: 'Reisekasse' }, { key: 'invest', label: 'Für später anlegen' },
];

/** Der Geldverteiler: ein Vorschlag, den ihr gemeinsam ändern dürft. Muss 100 % ergeben. */
function SplitEditor({ split, onChange, suggestion, lines, names }: {
  split: MoneySplit; onChange: (s: MoneySplit) => void; suggestion: MoneySplit; lines: ReturnType<typeof distributionLines>; names: Map<Id, string>;
}) {
  const sum = splitTotal(split);
  const ok = splitIsValid(split);
  const sums = SPLIT_FIELDS.map((f) => lines.reduce((s, l) => s + l[f.key], 0));
  return (
    <div className="card card--sunk mw-split">
      <p className="card__eyebrow">Unser Geldverteiler</p>
      <div className="mw-split__grid">
        {SPLIT_FIELDS.map((f, i) => (
          <label key={f.key} className="mw-split__item">
            <span>{f.label}</span>
            <span className="row" style={{ gap: 4 }}>
              <input className="input mw-pct" type="number" inputMode="numeric" min={0} max={100} step={5} value={split[f.key]}
                onChange={(e) => onChange({ ...split, [f.key]: Math.max(0, Math.min(100, Math.round(Number(e.target.value) || 0))) })} /> %
            </span>
            <strong>{formatEuro(sums[i])}</strong>
          </label>
        ))}
      </div>
      <div className="row row--wrap" style={{ marginTop: 'var(--space-2)' }}>
        <span className={ok ? 'mw-sum-ok' : 'mw-sum-bad'}>Gesamt {sum} % {ok ? '✓' : '· bitte auf 100 % bringen'}</span>
        <div className="spacer" />
        <button type="button" className="btn btn--small btn--ghost" onClick={() => onChange(suggestion)}>Auf {suggestion.spend} / {suggestion.save} / {suggestion.trip} zurücksetzen</button>
      </div>
      {lines.length > 1 && (
        <p className="small muted">{lines.map((l) => `${names.get(l.childId)}: ${formatEuro(l.spend + l.save + l.trip + l.invest)}`).join(' · ')}</p>
      )}
      <p className="small muted">Nur ein Vorschlag. „Für später anlegen“ landet als Guthaben im Bereich Anlegen, in ein echtes Depot nur nach eurer ausdrücklichen Entscheidung.</p>
    </div>
  );
}

// ------------------------------------------------------------- Ausgabe, Umbuchung, Korrektur, Storno

export function ExpenseModal({ ctx, accounts, initial, onBooked, onClose }: {
  ctx: Ctx; accounts: MoneyAccount[]; initial?: { account?: MoneyAccount; cents?: number; note?: string }; onBooked?: () => void; onClose: () => void;
}) {
  const [id] = useState(() => newId('tx'));
  const [account, setAccount] = useState<MoneyAccount | undefined>(initial?.account);
  const [amount, setAmount] = useState(initial?.cents ? (initial.cents / 100).toFixed(2).replace('.', ',') : '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [date, setDate] = useState(ctx.today);
  const [confirmedBy, setConfirmedBy, parents] = useConfirmer();
  const [busy, error, run] = useSubmit();
  const cents = parseEuro(amount);
  const usable = accounts.filter((a) => a.holding !== 'depot' && (ctx.balances.get(accountKey(a)) ?? 0) > 0);
  const book = () => run(() => bookTransactions(db, [{ id, kind: 'expense', date, cents: cents ?? 0, from: account, note: note.trim(), confirmedBy, createdAt: new Date().toISOString() }]),
    () => { onBooked?.(); onClose(); });
  return (
    <Modal title="Ausgabe eintragen" onClose={onClose} actions={
      <><button type="button" className="btn btn--ghost" onClick={onClose}>Abbrechen</button>
        <button type="button" className="btn btn--primary" disabled={!account || !cents || !note.trim() || busy} onClick={() => void book()}>Ausgabe buchen</button></>
    }>
      <div className="stack">
        <FieldGroup label="Von welchem Geld?">
          {usable.length === 0 ? <p className="small muted">Es gibt noch kein Guthaben.</p>
            : <AccountSelect label="Konto" accounts={usable} value={account} onChange={setAccount} balances={ctx.balances} names={ctx.names} trips={ctx.tripMap} />}
        </FieldGroup>
        <div className="form-grid">
          <Field label="Betrag"><EuroInput value={amount} onChange={setAmount} /></Field>
          <Field label="Datum"><DateInput value={date} onChange={setDate} /></Field>
          <Field label="Wofür?" className="span-2"><input className="input" value={note} placeholder="z. B. Eis, Buch, Eintritt" onChange={(e) => setNote(e.target.value)} /></Field>
        </div>
        <FieldGroup label="Wer bestätigt?"><ConfirmerPicker value={confirmedBy} onChange={setConfirmedBy} parents={parents} /></FieldGroup>
        {error && <p className="notice notice--error">{error}</p>}
      </div>
    </Modal>
  );
}

export function TransferModal({ ctx, accounts, initial, title = 'Umbuchen', onClose }: {
  ctx: Ctx; accounts: MoneyAccount[]; initial?: { from?: MoneyAccount; to?: MoneyAccount; note?: string }; title?: string; onClose: () => void;
}) {
  const [id] = useState(() => newId('tx'));
  const [from, setFrom] = useState<MoneyAccount | undefined>(initial?.from);
  const [to, setTo] = useState<MoneyAccount | undefined>(initial?.to);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState(initial?.note ?? '');
  const [date, setDate] = useState(ctx.today);
  const [consent, setConsent] = useState(false);
  const [confirmedBy, setConfirmedBy, parents] = useConfirmer();
  const [busy, error, run] = useSubmit();
  const cents = parseEuro(amount);
  const leavesChild = from?.kind === 'child' && to && !(to.kind === 'child' && to.childId === from.childId);
  const toDepot = to?.holding === 'depot' && from?.holding !== 'depot';
  const [depotDone, setDepotDone] = useState(false);
  const book = () => run(() => bookTransactions(db, [{
    id, kind: 'transfer', date, cents: cents ?? 0, from, to, note: note.trim(), confirmedBy, createdAt: new Date().toISOString(),
    ...(leavesChild && from?.kind === 'child' ? { childConsent: consent, byChildId: from.childId } : {}),
  }]), onClose);
  return (
    <Modal title={title} onClose={onClose} actions={
      <><button type="button" className="btn btn--ghost" onClick={onClose}>Abbrechen</button>
        <button type="button" className="btn btn--primary" disabled={!from || !to || !cents || !note.trim() || busy || (leavesChild && !consent) || (toDepot && !depotDone)} onClick={() => void book()}>Umbuchen</button></>
    }>
      <div className="stack">
        <Field label="Von"><AccountSelect label="Von" accounts={accounts.filter((a) => (ctx.balances.get(accountKey(a)) ?? 0) > 0)} value={from} onChange={setFrom} balances={ctx.balances} names={ctx.names} trips={ctx.tripMap} /></Field>
        <Field label="Nach"><AccountSelect label="Nach" accounts={accounts} value={to} onChange={setTo} balances={ctx.balances} names={ctx.names} trips={ctx.tripMap} /></Field>
        <div className="form-grid">
          <Field label="Betrag"><EuroInput value={amount} onChange={setAmount} /></Field>
          <Field label="Datum"><DateInput value={date} onChange={setDate} /></Field>
          <Field label="Notiz" className="span-2"><input className="input" value={note} placeholder="z. B. aufs Sparbuch gebracht" onChange={(e) => setNote(e.target.value)} /></Field>
        </div>
        {leavesChild && <Toggle checked={consent} onChange={setConsent} label={`${ctx.names.get((from as { childId: Id }).childId) ?? 'Das Kind'} hat ausdrücklich zugestimmt`} />}
        {toDepot && <Toggle checked={depotDone} onChange={setDepotDone} label="Wir haben die Anlage im echten Depot selbst ausgeführt" />}
        {toDepot && <p className="small muted">Die App kauft und verkauft nichts. Danach bitte unter „Anlegen“ den aktuellen Depotwert eintragen.</p>}
        <FieldGroup label="Wer bestätigt?"><ConfirmerPicker value={confirmedBy} onChange={setConfirmedBy} parents={parents} /></FieldGroup>
        {error && <p className="notice notice--error">{error}</p>}
      </div>
    </Modal>
  );
}

export function CorrectionModal({ ctx, accounts, initial, onClose }: {
  ctx: Ctx; accounts: MoneyAccount[]; initial?: { account?: MoneyAccount; cents?: number; up?: boolean }; onClose: () => void;
}) {
  const [id] = useState(() => newId('tx'));
  const [account, setAccount] = useState<MoneyAccount | undefined>(initial?.account);
  const [up, setUp] = useState(initial?.up ?? true);
  const [amount, setAmount] = useState(initial?.cents ? (initial.cents / 100).toFixed(2).replace('.', ',') : '');
  const [reason, setReason] = useState('');
  const [confirmedBy, setConfirmedBy, parents] = useConfirmer();
  const [busy, error, run] = useSubmit();
  const cents = parseEuro(amount);
  const book = () => run(() => bookTransactions(db, [{
    id, kind: 'correction', date: ctx.today, cents: cents ?? 0, ...(up ? { to: account } : { from: account }), note: `Korrektur: ${reason.trim()}`, confirmedBy,
    createdAt: new Date().toISOString(),
  }]), onClose);
  return (
    <Modal title="Korrekturbuchung" onClose={onClose} actions={
      <><button type="button" className="btn btn--ghost" onClick={onClose}>Abbrechen</button>
        <button type="button" className="btn btn--primary" disabled={!account || !cents || !reason.trim() || busy} onClick={() => void book()}>Korrektur buchen</button></>
    }>
      <div className="stack">
        <p className="small muted">Korrekturen überschreiben nichts. Sie stehen als eigene Buchung mit Grund im Verlauf.</p>
        <Field label="Konto"><AccountSelect label="Konto" accounts={accounts} value={account} onChange={setAccount} balances={ctx.balances} names={ctx.names} trips={ctx.tripMap} /></Field>
        <Segmented<'up' | 'down'> label="Richtung" value={up ? 'up' : 'down'} onChange={(v) => setUp(v === 'up')} options={[{ value: 'up', label: 'Es ist mehr da' }, { value: 'down', label: 'Es ist weniger da' }]} />
        <div className="form-grid">
          <Field label="Betrag"><EuroInput value={amount} onChange={setAmount} /></Field>
          <Field label="Grund"><input className="input" value={reason} placeholder="z. B. Kasse gezählt" onChange={(e) => setReason(e.target.value)} /></Field>
        </div>
        <FieldGroup label="Wer bestätigt?"><ConfirmerPicker value={confirmedBy} onChange={setConfirmedBy} parents={parents} /></FieldGroup>
        {error && <p className="notice notice--error">{error}</p>}
      </div>
    </Modal>
  );
}

export function ReverseModal({ ctx, tx, onClose }: { ctx: Ctx; tx: MoneyTransaction; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [confirmedBy, setConfirmedBy, parents] = useConfirmer();
  const [busy, error, run] = useSubmit();
  const book = () => run(() => bookTransactions(db, [reversalOf(tx, confirmedBy, ctx.today, reason)]), onClose);
  return (
    <Modal title="Buchung stornieren" onClose={onClose} actions={
      <><button type="button" className="btn btn--ghost" onClick={onClose}>Abbrechen</button>
        <button type="button" className="btn btn--danger" disabled={busy || !confirmedBy} onClick={() => void book()}>Stornieren</button></>
    }>
      <div className="stack">
        <p><strong>{tx.note}</strong> · {formatEuro(tx.cents)}</p>
        <p className="small muted">{[tx.from, tx.to].filter(Boolean).map((a) => accountLabel(a!, ctx.names, ctx.tripMap)).join(' → ')}</p>
        <p className="small">Die Buchung bleibt im Verlauf sichtbar. Eine Gegenbuchung gleicht sie aus.</p>
        <Field label="Grund (optional)"><input className="input" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        <FieldGroup label="Wer bestätigt?"><ConfirmerPicker value={confirmedBy} onChange={setConfirmedBy} parents={parents} /></FieldGroup>
        {error && <p className="notice notice--error">{error}</p>}
      </div>
    </Modal>
  );
}

export type { Ctx as MoneyCtx };

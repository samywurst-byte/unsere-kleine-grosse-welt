import type React from 'react';
import { Minus, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { HOLDING_LABEL, POT_LABEL } from '../../data/money';
import { useMembers } from '../../hooks/useData';
import { accountKey, childAccount, tripAccount } from '../../services/money';
import { formatEuro, parseEuro } from '../../services/projects';
import type { ChildProfile, Id, MoneyAccount, MoneyHolding, MoneyPot, MoneyTransaction, TripGoal } from '../../types';
import '../library/library.css';
import './money.css';

export { formatEuro, parseEuro };

/** Umschalter zwischen persönlicher Geldwelt und Reisekasse. */
export function MoneyTabs() {
  const cls = ({ isActive }: { isActive: boolean }) => `seg__item lib-tab ${isActive ? 'is-on' : ''}`;
  return (
    <nav className="seg lib-tabs" aria-label="Geld">
      <NavLink to="/geld" className={cls}>🐷 Meine Geldwelt</NavLink>
      <NavLink to="/reisekasse" className={cls}>🧳 Reisekasse</NavLink>
    </nav>
  );
}

export function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="mw-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Ganze Euro als Münzen zum Zählen, für kleine Kinder. */
export function Coins({ cents, max = 20 }: { cents: number; max?: number }) {
  const euros = Math.floor(Math.max(0, cents) / 100);
  if (euros === 0) return null;
  const shown = Math.min(euros, max);
  return (
    <div className="mw-coins" aria-hidden="true">
      {Array.from({ length: shown }, (_, i) => <span key={i} className="mw-coin">1€</span>)}
      {euros > shown && <span className="mw-coins__more">und noch {euros - shown} mehr</span>}
    </div>
  );
}

/** Betrag in großen Schritten wählen, ohne Tippen. */
export function AmountStepper({ cents, onChange, max }: { cents: number; onChange: (c: number) => void; max: number }) {
  const set = (v: number) => onChange(Math.max(0, Math.min(max, v)));
  return (
    <div className="mw-stepper">
      <button type="button" className="btn btn--icon" aria-label="1 Euro weniger" disabled={cents <= 0} onClick={() => set(cents - 100)}><Minus /></button>
      <span className="mw-stepper__value">{formatEuro(cents)}</span>
      <button type="button" className="btn btn--icon" aria-label="1 Euro mehr" disabled={cents + 100 > max} onClick={() => set(cents + 100)}><Plus /></button>
      <button type="button" className="btn btn--small btn--ghost" disabled={cents + 50 > max} onClick={() => set(cents + 50)}>+ 50 ct</button>
    </div>
  );
}

/** Euro-Eingabe für Eltern. */
export function EuroInput({ value, onChange, label = 'Betrag in Euro' }: { value: string; onChange: (v: string) => void; label?: string }) {
  const invalid = value.trim() !== '' && parseEuro(value) === null;
  return <input className="input mw-euro" inputMode="decimal" value={value} placeholder="0,00 €" aria-label={label} aria-invalid={invalid} onChange={(e) => onChange(e.target.value)} />;
}

const LAST_KEY = 'ukgw.money.confirmedBy';

/** Wer bestätigt die Buchung? Die zuletzt gewählte Person ist vorausgewählt. */
export function useConfirmer(): [Id, (id: Id) => void, { id: Id; name: string }[]] {
  const members = useMembers();
  const parents = useMemo(() => (members ?? []).filter((m) => m.role === 'parent' && m.active).map((m) => ({ id: m.id, name: m.name })), [members]);
  const [picked, setPicked] = useState<Id>(() => { try { return localStorage.getItem(LAST_KEY) ?? ''; } catch { return ''; } });
  const value = parents.some((p) => p.id === picked) ? picked : parents[0]?.id ?? '';
  const set = (id: Id) => { setPicked(id); try { localStorage.setItem(LAST_KEY, id); } catch { /* egal */ } };
  return [value, set, parents];
}

export function ConfirmerPicker({ value, onChange, parents }: { value: Id; onChange: (id: Id) => void; parents: { id: Id; name: string }[] }) {
  if (parents.length === 0) return <p className="notice">Bitte zuerst unter „Familie“ einen Elternteil anlegen.</p>;
  return (
    <div className="seg" role="group" aria-label="Wer bestätigt?">
      {parents.map((p) => <button key={p.id} type="button" className="seg__item" aria-pressed={value === p.id} onClick={() => onChange(p.id)}>{p.name}</button>)}
    </div>
  );
}

export function accountLabel(a: MoneyAccount, names: Map<Id, string>, trips: Map<Id, TripGoal>): string {
  if (a.kind === 'child') return `${names.get(a.childId) ?? 'Kind'} · ${POT_LABEL[a.pot]} · ${HOLDING_LABEL[a.holding]}`;
  return `Reisekasse ${trips.get(a.tripId)?.name ?? ''} · ${HOLDING_LABEL[a.holding]}`;
}

/** Alle Konten für Auswahllisten im Elternbereich. */
export function allAccounts(children: ChildProfile[], trips: TripGoal[]): MoneyAccount[] {
  const out: MoneyAccount[] = [];
  for (const c of children) {
    for (const pot of ['spend', 'save', 'invest'] as MoneyPot[]) {
      for (const h of (pot === 'invest' ? ['cash', 'bank', 'depot'] : ['cash', 'bank']) as MoneyHolding[]) out.push(childAccount(c.id, pot, h));
    }
  }
  for (const t of trips) for (const h of ['cash', 'bank'] as MoneyHolding[]) out.push(tripAccount(t.id, h));
  return out;
}

export function AccountSelect({ accounts, value, onChange, balances, names, trips, label }: {
  accounts: MoneyAccount[]; value: MoneyAccount | undefined; onChange: (a: MoneyAccount) => void; balances: Map<string, number>;
  names: Map<Id, string>; trips: Map<Id, TripGoal>; label: string;
}) {
  return (
    <select className="input" aria-label={label} value={value ? accountKey(value) : ''}
      onChange={(e) => { const a = accounts.find((x) => accountKey(x) === e.target.value); if (a) onChange(a); }}>
      <option value="" disabled>Bitte wählen</option>
      {accounts.map((a) => (
        <option key={accountKey(a)} value={accountKey(a)}>{accountLabel(a, names, trips)} ({formatEuro(balances.get(accountKey(a)) ?? 0)})</option>
      ))}
    </select>
  );
}

/** Kurzer, kindgerechter Text zu einer Buchung aus Sicht eines Kindes oder Reiseziels. */
export function describeTx(tx: MoneyTransaction, names: Map<Id, string>, trips: Map<Id, TripGoal>): string {
  if (tx.reverses) return `Korrigiert: ${tx.note.replace(/^Storno: /, '')}`;
  if (tx.kind === 'income' && tx.to?.kind === 'trip') return `Für die Reisekasse ${trips.get(tx.to.tripId)?.name ?? ''}: ${tx.note}`;
  if (tx.kind === 'transfer' && tx.from && tx.to) {
    if (tx.to.kind === 'trip') return `In die Reisekasse ${trips.get(tx.to.tripId)?.name ?? ''}`;
    if (tx.from.kind === 'child' && tx.to.kind === 'child' && tx.from.childId === tx.to.childId) {
      return tx.from.pot === tx.to.pot ? `${tx.note} (${HOLDING_LABEL[tx.from.holding]} → ${HOLDING_LABEL[tx.to.holding]})` : `${POT_LABEL[tx.from.pot]} → ${POT_LABEL[tx.to.pot]}: ${tx.note}`;
    }
    if (tx.to.kind === 'child') return `An ${names.get(tx.to.childId) ?? 'ein Kind'}: ${tx.note}`;
  }
  return tx.note;
}

export function useLookups(children: ChildProfile[] | undefined, trips: TripGoal[] | undefined) {
  return useMemo(() => ({
    names: new Map((children ?? []).map((c) => [c.id, c.name])),
    tripMap: new Map((trips ?? []).map((t) => [t.id, t])),
  }), [children, trips]);
}

/** Wie Field, aber für Knopfgruppen: kein <label>, damit ein Tipp auf die Überschrift nicht den ersten Knopf auslöst. */
export function FieldGroup({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`field ${className ?? ''}`} role="group" aria-label={label}>
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  );
}

/** "Taros", aber "Klaus’" */
export function genitive(name: string): string {
  return /[sßxz]$/i.test(name) ? `${name}’` : `${name}s`;
}

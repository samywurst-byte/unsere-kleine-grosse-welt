import type { FamilyDatabase } from '../database/db';
import { MONEY_LESSONS, type MoneyLesson, type MoneySplit } from '../data/money';
import type {
  ChildProfile, DateKey, DepotValuation, Id, MoneyAccount, MoneyHolding, MoneyPot, MoneyRequest, MoneySource, MoneyTransaction,
  SavingsGoal, SimDepot,
} from '../types';
import { ageInYears } from '../utils/dates';

/**
 * Kassenbuch der Geldwelt. Grundsätze aus dem Konzept:
 * Beträge in Cent, jede Buchung mit eigener Id, nichts wird überschrieben (Fehler werden gegengebucht),
 * kein Konto wird negativ, persönliches Geld eines Kindes verlässt sein Konto nur mit seiner Zustimmung,
 * und jede Buchung braucht eine bestätigende erwachsene Person.
 */

export function accountKey(a: MoneyAccount): string {
  return a.kind === 'child' ? `child:${a.childId}:${a.pot}:${a.holding}` : `trip:${a.tripId}:${a.holding}`;
}

export function childAccount(childId: Id, pot: MoneyPot, holding: MoneyHolding): MoneyAccount {
  return { kind: 'child', childId, pot, holding };
}

export function tripAccount(tripId: Id, holding: MoneyHolding): MoneyAccount {
  return { kind: 'trip', tripId, holding };
}

function apply(map: Map<string, number>, tx: MoneyTransaction): void {
  if (tx.from) { const k = accountKey(tx.from); map.set(k, (map.get(k) ?? 0) - tx.cents); }
  if (tx.to) { const k = accountKey(tx.to); map.set(k, (map.get(k) ?? 0) + tx.cents); }
}

/** Kontostände aller Konten aus den Buchungen. */
export function balances(txs: MoneyTransaction[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const tx of txs) apply(map, tx);
  return map;
}

export interface HoldingSplit { cash: number; bank: number; depot: number; total: number }

const HOLDINGS: MoneyHolding[] = ['cash', 'bank', 'depot'];

function split(map: Map<string, number>, key: (h: MoneyHolding) => string): HoldingSplit {
  const [cash, bank, depot] = HOLDINGS.map((h) => map.get(key(h)) ?? 0);
  return { cash, bank, depot, total: cash + bank + depot };
}

export function potBalance(map: Map<string, number>, childId: Id, pot: MoneyPot): HoldingSplit {
  return split(map, (h) => accountKey(childAccount(childId, pot, h)));
}

export function tripBalance(map: Map<string, number>, tripId: Id): HoldingSplit {
  return split(map, (h) => accountKey(tripAccount(tripId, h)));
}

const PERSONAL_SOURCES: MoneySource[] = ['pocket', 'gift', 'own-sale', 'other'];

const sameOwner = (a: MoneyAccount, b: MoneyAccount) => a.kind === 'child' && b.kind === 'child' && a.childId === b.childId;

/** Prüft eine Buchung gegen die aktuellen Kontostände. Gibt eine Fehlermeldung oder null zurück. */
export function validateTx(tx: MoneyTransaction, map: Map<string, number>): string | null {
  if (!Number.isInteger(tx.cents) || tx.cents <= 0) return 'Der Betrag muss größer als 0 sein.';
  if (!tx.confirmedBy) return 'Bitte angeben, wer die Buchung bestätigt.';
  if (!tx.note.trim()) return 'Bitte kurz notieren, wofür das Geld ist.';
  const shape = tx.kind === 'income' ? !tx.from && !!tx.to
    : tx.kind === 'expense' ? !!tx.from && !tx.to
      : tx.kind === 'transfer' ? !!tx.from && !!tx.to
        : !!tx.from || !!tx.to;
  if (!shape) return 'Die Buchung ist unvollständig.';
  if (tx.kind === 'income' && !tx.source) return 'Bitte angeben, woher das Geld kommt.';
  for (const a of [tx.from, tx.to]) {
    if (a?.holding === 'depot' && !(a.kind === 'child' && a.pot === 'invest')) return 'Ein Depot gibt es nur beim Anlegen.';
  }
  if (tx.from && tx.to && accountKey(tx.from) === accountKey(tx.to)) return 'Von und nach sind dasselbe Konto.';
  if (tx.from) {
    const have = map.get(accountKey(tx.from)) ?? 0;
    if (have < tx.cents) return 'So viel Geld ist dort nicht vorhanden.';
  }
  // Persönliches Geld eines Kindes geht nur mit seiner ausdrücklichen Zustimmung an andere
  const leavesChild = tx.from?.kind === 'child' && tx.to && !sameOwner(tx.from, tx.to) && !tx.reverses;
  const personalToTrip = tx.kind === 'income' && tx.to?.kind === 'trip' && !!tx.byChildId && !!tx.source && PERSONAL_SOURCES.includes(tx.source);
  if ((leavesChild || personalToTrip) && !tx.childConsent) return 'Persönliches Geld eines Kindes braucht seine Zustimmung.';
  return null;
}

export type BookResult = { ok: true } | { ok: false; error: string };

/** Prüft und speichert alle Buchungen gemeinsam oder keine. Bereits vorhandene Ids gelten als Doppelbuchung. */
async function bookInside(db: FamilyDatabase, txs: MoneyTransaction[]): Promise<BookResult> {
  if (!txs.length) return { ok: false, error: 'Es gibt nichts zu buchen.' };
  const existing = await db.moneyTransactions.bulkGet(txs.map((t) => t.id));
  if (existing.some(Boolean)) return { ok: false, error: 'Diese Buchung wurde bereits gespeichert.' };
  const map = balances(await db.moneyTransactions.toArray());
  for (const tx of txs) {
    const err = validateTx(tx, map);
    if (err) return { ok: false, error: err };
    apply(map, tx);
  }
  await db.moneyTransactions.bulkAdd(txs);
  return { ok: true };
}

export async function bookTransactions(db: FamilyDatabase, txs: MoneyTransaction[]): Promise<BookResult> {
  return db.transaction('rw', db.moneyTransactions, () => bookInside(db, txs));
}

/** Gegenbuchung: hebt eine Buchung auf, ohne sie zu löschen. Feste Id, damit nicht doppelt storniert wird. */
export function reversalOf(tx: MoneyTransaction, confirmedBy: Id, date: DateKey, reason: string, now = new Date().toISOString()): MoneyTransaction {
  return {
    id: `${tx.id}-storno`, kind: 'correction', date, cents: tx.cents, from: tx.to, to: tx.from,
    note: `Storno: ${tx.note}${reason.trim() ? ` (${reason.trim()})` : ''}`, confirmedBy, reverses: tx.id,
    ...(tx.byChildId ? { byChildId: tx.byChildId } : {}), createdAt: now,
  };
}

export function reversedIds(txs: MoneyTransaction[]): Set<Id> {
  return new Set(txs.filter((t) => t.reverses).map((t) => t.reverses as Id));
}

/** Teilt einen Betrag nach Gewichten auf, ohne dass ein Cent verloren geht oder entsteht. */
export function splitCents(total: number, weights: number[]): number[] {
  const sum = weights.reduce((s, w) => s + w, 0);
  if (sum <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => (total * w) / sum);
  const out = raw.map(Math.floor);
  let rest = total - out.reduce((s, v) => s + v, 0);
  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) { if (rest <= 0) break; if (weights[i] > 0) { out[i] += 1; rest -= 1; } }
  return out;
}

export function splitTotal(s: MoneySplit): number {
  return s.spend + s.save + s.trip + s.invest;
}

export function splitIsValid(s: MoneySplit): boolean {
  return [s.spend, s.save, s.trip, s.invest].every((v) => Number.isInteger(v) && v >= 0 && v <= 100) && splitTotal(s) === 100;
}

export interface DistributionInput {
  batchId: Id;
  date: DateKey;
  totalCents: number;
  childIds: Id[];
  split: MoneySplit;
  holding: Exclude<MoneyHolding, 'depot'>;
  source: MoneySource;
  note: string;
  confirmedBy: Id;
  tripId?: Id;
  projectId?: Id;
  /** Das Kind möchte freiwillig in die Reisekasse geben (bei persönlichem Geld Pflicht). */
  childConsent?: boolean;
}

export interface DistributionLine { childId: Id; spend: number; save: number; trip: number; invest: number }

/** Betrag gleichmäßig auf die Kinder und je Kind nach Prozenten aufteilen. */
export function distributionLines(totalCents: number, childIds: Id[], s: MoneySplit): DistributionLine[] {
  const shares = splitCents(totalCents, childIds.map(() => 1));
  return childIds.map((childId, i) => {
    const [spend, save, trip, invest] = splitCents(shares[i], [s.spend, s.save, s.trip, s.invest]);
    return { childId, spend, save, trip, invest };
  });
}

/** Buchungen einer Verteilung. "Für später anlegen" landet als Guthaben im Bereich Anlegen, nie automatisch im Depot. */
export function planDistribution(input: DistributionInput, now = new Date().toISOString()): MoneyTransaction[] {
  const base = {
    kind: 'income' as const, date: input.date, source: input.source, confirmedBy: input.confirmedBy, batchId: input.batchId,
    createdAt: now, ...(input.projectId ? { projectId: input.projectId } : {}),
  };
  const out: MoneyTransaction[] = [];
  distributionLines(input.totalCents, input.childIds, input.split).forEach((line, ci) => {
    const pots: [MoneyPot, number][] = [['spend', line.spend], ['save', line.save], ['invest', line.invest]];
    for (const [pot, cents] of pots) {
      if (cents > 0) out.push({ ...base, id: `${input.batchId}-${ci}-${pot}`, cents, to: childAccount(line.childId, pot, input.holding), note: input.note });
    }
    if (line.trip > 0 && input.tripId) {
      out.push({
        ...base, id: `${input.batchId}-${ci}-trip`, cents: line.trip, to: tripAccount(input.tripId, input.holding), note: input.note,
        byChildId: line.childId, ...(input.childConsent ? { childConsent: true } : {}),
      });
    }
  });
  return out;
}

// ------------------------------------------------------------- Wünsche der Kinder

export const REQUEST_LABEL: Record<MoneyRequest['kind'], string> = {
  save: 'Zum Sparen legen', invest: 'Langfristig anlegen', trip: 'In die Reisekasse geben', buy: 'Etwas kaufen',
};

/** Aus welchem Bereich ein Wunsch standardmäßig bezahlt wird. */
export function requestFromPot(kind: MoneyRequest['kind']): MoneyPot {
  return kind === 'invest' ? 'save' : kind === 'trip' ? 'spend' : 'spend';
}

export interface RequestBooking { fromPot: MoneyPot; fromHolding: MoneyHolding; toHolding?: MoneyHolding; confirmedBy: Id; date: DateKey }

/** Die Buchung zu einem bestätigten Wunsch. Die Id hängt am Wunsch, so wird nie doppelt gebucht. */
export function requestTx(req: MoneyRequest, b: RequestBooking, tripName?: string, now = new Date().toISOString()): MoneyTransaction {
  const from = childAccount(req.childId, b.fromPot, b.fromHolding);
  const toHolding = b.toHolding ?? (b.fromHolding === 'depot' ? 'bank' : b.fromHolding);
  const base = { id: `tx_${req.id}`, date: b.date, cents: req.cents, from, confirmedBy: b.confirmedBy, requestId: req.id, createdAt: now };
  const note = req.note?.trim();
  switch (req.kind) {
    case 'buy': return { ...base, kind: 'expense', note: note || 'Etwas gekauft' };
    case 'save': return { ...base, kind: 'transfer', to: childAccount(req.childId, 'save', toHolding), note: note || 'Zum Sparen gelegt' };
    case 'invest': return { ...base, kind: 'transfer', to: childAccount(req.childId, 'invest', toHolding), note: note || 'Für später angelegt' };
    case 'trip': return {
      ...base, kind: 'transfer', to: tripAccount(req.tripId ?? '', toHolding), byChildId: req.childId, childConsent: true,
      note: note || `Beitrag für ${tripName ?? 'die Reisekasse'}`,
    };
  }
}

export async function confirmRequest(db: FamilyDatabase, req: MoneyRequest, tx: MoneyTransaction): Promise<BookResult> {
  return db.transaction('rw', db.moneyTransactions, db.moneyRequests, async () => {
    const current = await db.moneyRequests.get(req.id);
    if (!current || current.status !== 'open') return { ok: false, error: 'Dieser Wunsch ist schon erledigt.' } as BookResult;
    const res = await bookInside(db, [tx]);
    if (res.ok) await db.moneyRequests.update(req.id, { status: 'done', decidedAt: new Date().toISOString() });
    return res;
  });
}

// ------------------------------------------------------------- Sparziele

export interface GoalProgress { goal: SavingsGoal; saved: number; reached: boolean }

/** Das Spargeld füllt die offenen Ziele der Reihe nach. */
export function goalProgress(goals: SavingsGoal[], savedCents: number): GoalProgress[] {
  let left = Math.max(0, savedCents);
  return goals.filter((g) => !g.doneAt).sort((a, b) => a.order - b.order).map((goal) => {
    const saved = Math.min(left, goal.targetCents);
    left -= saved;
    return { goal, saved, reached: saved >= goal.targetCents };
  });
}

// ------------------------------------------------------------- Anlegen

/** Werte des Musterdepots nach jeder frei gewählten Kursänderung, beginnend mit dem Startbetrag. */
export function simValues(sim: Pick<SimDepot, 'startCents' | 'changes'>): number[] {
  const out = [sim.startCents];
  for (const c of sim.changes) out.push(Math.round(out[out.length - 1] * (1 + c.percent / 100)));
  return out;
}

export function latestValuation(vals: DepotValuation[], childId: Id): DepotValuation | undefined {
  return vals.filter((v) => v.childId === childId).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))[0];
}

// ------------------------------------------------------------- Kassenabgleich

export interface CashRow { label: string; childId?: Id; tripId?: Id; pot?: MoneyPot; split: HoldingSplit }

/** Wo das echte Geld liegt: je Kind und Bereich, je Reiseziel, dazu die Summen. */
export function cashOverview(txs: MoneyTransaction[], children: Pick<ChildProfile, 'id' | 'name'>[], trips: { id: Id; name: string }[]) {
  const map = balances(txs);
  const rows: CashRow[] = [];
  for (const c of children) {
    for (const pot of ['spend', 'save', 'invest'] as MoneyPot[]) rows.push({ label: c.name, childId: c.id, pot, split: potBalance(map, c.id, pot) });
  }
  for (const t of trips) rows.push({ label: t.name, tripId: t.id, split: tripBalance(map, t.id) });
  const totals = rows.reduce((s, r) => ({ cash: s.cash + r.split.cash, bank: s.bank + r.split.bank, depot: s.depot + r.split.depot, total: s.total + r.split.total }),
    { cash: 0, bank: 0, depot: 0, total: 0 });
  return { rows, totals };
}

// ------------------------------------------------------------- Alter und Lernideen

export function childAge(child: Pick<ChildProfile, 'birthDate'>, today: DateKey): number | undefined {
  return child.birthDate ? ageInYears(child.birthDate, today) : undefined;
}

/** Die zwei passendsten Lernideen fürs Alter. */
export function lessonsFor(age: number | undefined): MoneyLesson[] {
  if (age === undefined) return MONEY_LESSONS.slice(1, 3);
  return MONEY_LESSONS.filter((l) => l.fromAge <= age).slice(-2);
}

/** Anlegen zeigen, wenn es dort etwas gibt oder das Kind alt genug ist (ab 9). Keine leeren Platzhalter für Kleine. */
export function showInvest(age: number | undefined, investTotal: number, hasDepotValue: boolean, simEnabled: boolean): boolean {
  return investTotal > 0 || hasDepotValue || simEnabled || (age !== undefined && age >= 9);
}

/** Wert des Bereichs Anlegen: Guthaben plus Depot. Fürs Depot zählt der zuletzt eingetragene Wert, sonst der eingezahlte Betrag. */
export function investValue(map: Map<string, number>, childId: Id, val?: DepotValuation): { value: number; savings: number; deposited: number; depotValue: number; valuedAt?: DateKey } {
  const b = potBalance(map, childId, 'invest');
  const depotValue = val && b.depot > 0 ? val.cents : b.depot;
  return { value: b.cash + b.bank + depotValue, savings: b.cash + b.bank, deposited: b.depot, depotValue, valuedAt: val && b.depot > 0 ? val.date : undefined };
}

/** Verteilt einen Projektüberschuss genau einmal: Buchungen und Vermerk am Projekt in einem Schritt. */
export async function bookProjectDistribution(db: FamilyDatabase, projectId: Id, txs: MoneyTransaction[]): Promise<BookResult> {
  return db.transaction('rw', db.moneyTransactions, db.projects, async () => {
    const p = await db.projects.get(projectId);
    if (!p) return { ok: false, error: 'Das Projekt gibt es nicht mehr.' } as BookResult;
    if (p.moneyBatchId) return { ok: false, error: 'Der Überschuss dieses Projekts wurde schon verteilt.' } as BookResult;
    const res = await bookInside(db, txs);
    if (res.ok) await db.projects.put({ ...p, moneyBatchId: txs[0].batchId ?? txs[0].id, updatedAt: new Date().toISOString() });
    return res;
  });
}

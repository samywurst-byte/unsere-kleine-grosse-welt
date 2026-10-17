import type { FamilyDatabase } from '../database/db';
import { defaultTrips } from '../data/money';
import {
  CHRISTMAS_PRODUCTS, DEFAULT_COMPANY_SPLIT, SEASON_PLANS, XMAS_2026, holidayParkTrip, type CompanyBand, type SeasonPhase, type SeasonPlan,
} from '../data/kidCompany';
import type {
  ChildProfile, CompanyEntry, CompanyProduct, CompanySeason, DateKey, Id, KidCompany, MoneyHolding, MoneyTransaction,
} from '../types';
import { ageInYears } from '../utils/dates';
import { bookTransactions, reversedIds, tripAccount, type BookResult } from './money';

/**
 * Kinderfirma: Firma, Produkte und eine eigene kleine Firmenkasse. Erst beim Verteilen des Gewinns
 * entsteht eine Buchung im Kassenbuch der Geldwelt (Reisekasse, Herkunft „Gemeinsames Projekt“).
 */

const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function emptyCompany(now = new Date().toISOString()): KidCompany {
  return { id: 'company', name: '', founderIds: [], split: { ...DEFAULT_COMPANY_SPLIT }, ideas: [], seasons: [], createdAt: now, updatedAt: now };
}

export async function updateCompany(db: FamilyDatabase, fn: (c: KidCompany) => KidCompany): Promise<KidCompany> {
  return db.transaction('rw', db.kidCompany, async () => {
    const now = new Date().toISOString();
    const next = { ...fn((await db.kidCompany.get('company')) ?? emptyCompany(now)), updatedAt: now };
    await db.kidCompany.put(next);
    return next;
  });
}

/** Aufgaben nach Alter: ab 5 die Großen, 3 bis 4 die Mittleren, darunter die Kleinen. */
export function companyBand(child: Pick<ChildProfile, 'birthDate' | 'ageStage'>, today: DateKey): CompanyBand {
  const age = child.birthDate ? ageInYears(child.birthDate, today) : child.ageStage === 'small' ? 2 : 4;
  return age >= 5 ? 'big' : age >= 3 ? 'middle' : 'little';
}

export function seasonPlan(season: Pick<CompanySeason, 'planId'>): SeasonPlan | undefined {
  return SEASON_PLANS[season.planId];
}

/** Die Phase, in der wir gerade stecken: die letzte, die schon begonnen hat (vor dem Start die erste). */
export function currentPhase(plan: SeasonPlan, today: DateKey): SeasonPhase {
  let cur = plan.phases[0];
  for (const p of plan.phases) if (p.start <= today) cur = p;
  return cur;
}

export function seasonOver(plan: SeasonPlan, today: DateKey): boolean {
  return today > plan.phases[plan.phases.length - 1].end;
}

/** Die laufende Saison: die neueste, die schon begonnen hat und noch nicht vorbei ist, sonst die neueste. */
export function activeSeason(company: Pick<KidCompany, 'seasons'>, today: DateKey): CompanySeason | undefined {
  const list = [...company.seasons].sort((a, b) => b.startDate.localeCompare(a.startDate));
  return list.find((s) => { const p = seasonPlan(s); return s.startDate <= today && (!p || !seasonOver(p, today)); }) ?? list[0];
}

export function seasonFromPlan(plan: SeasonPlan): CompanySeason {
  return { id: plan.id, planId: plan.id, title: plan.title, startDate: plan.start, goalCents: plan.goalCents, checked: [] };
}

export interface CompanyTotals {
  income: number;
  /** Material und weitere Kosten, die den Gewinn mindern. */
  materials: number;
  costs: number;
  profit: number;
  /** Schon in die Reisekasse gebucht. */
  toTrip: number;
  /** Für neue Materialien zurückgelegt. */
  reserve: number;
  reserveSpent: number;
  reserveLeft: number;
  /** Gewinn, der noch nicht verteilt ist. */
  open: number;
}

export function companyTotals(entries: CompanyEntry[], seasonId?: Id): CompanyTotals {
  const list = seasonId ? entries.filter((e) => e.seasonId === seasonId) : entries;
  let income = 0, materials = 0, costs = 0, toTrip = 0, reserve = 0, reserveSpent = 0;
  for (const e of list) {
    if (e.kind === 'income') income += e.cents;
    else if (e.kind === 'payout') { toTrip += e.cents; reserve += e.reserveCents ?? 0; }
    else if (e.fromReserve) reserveSpent += e.cents;
    else if (e.kind === 'material') materials += e.cents;
    else costs += e.cents;
  }
  const profit = income - materials - costs;
  return { income, materials, costs, profit, toTrip, reserve, reserveSpent, reserveLeft: reserve - reserveSpent, open: Math.max(0, profit - toTrip - reserve) };
}

/** Aufteilung des offenen Gewinns, z. B. 80 % Reisekasse und 20 % neue Materialien. */
export function payoutSplit(open: number, split: KidCompany['split']): { trip: number; reserve: number } {
  const trip = Math.round((open * split.trip) / 100);
  return { trip, reserve: open - trip };
}

export function marginCents(p: Pick<CompanyProduct, 'priceCents' | 'costCents'>): number {
  return p.priceCents - p.costCents;
}

/** Wie viele Stück für dieses Gewinnziel nötig wären; null, wenn ein Stück keinen Gewinn bringt. */
export function piecesForProfit(targetCents: number, p: Pick<CompanyProduct, 'priceCents' | 'costCents'>): number | null {
  const m = marginCents(p);
  return m > 0 ? Math.ceil(targetCents / m) : null;
}

export function productIncome(entries: CompanyEntry[], productId: Id): { cents: number; pieces: number } {
  let cents = 0, pieces = 0;
  for (const e of entries) if (e.kind === 'income' && e.productId === productId) { cents += e.cents; pieces += e.pieces ?? 0; }
  return { cents, pieces };
}

export interface TripEarnings { earned: number; parents: number; other: number; total: number }

/** Reisekasse eines Ziels nach Herkunft: selbst verdient, von den Eltern, Sonstiges. Stornos zählen nicht. */
export function tripEarnings(txs: MoneyTransaction[], tripId: Id): TripEarnings {
  const reversed = reversedIds(txs);
  const isTrip = (a?: MoneyTransaction['to']) => a?.kind === 'trip' && a.tripId === tripId;
  let total = 0, earned = 0, parents = 0;
  for (const tx of txs) {
    if (isTrip(tx.to)) total += tx.cents;
    if (isTrip(tx.from)) total -= tx.cents;
    if (tx.reverses || reversed.has(tx.id) || !isTrip(tx.to) || tx.kind !== 'income') continue;
    if (tx.source === 'project' || tx.source === 'own-sale') earned += tx.cents;
    else if (tx.source === 'parents') parents += tx.cents;
  }
  return { earned, parents, other: Math.max(0, total - earned - parents), total };
}

/** Reiseziel der Firma wählen; fehlt es in der Reisekasse, wird es angelegt. */
export async function chooseCompanyTrip(db: FamilyDatabase, tripId: Id): Promise<void> {
  await db.transaction('rw', db.tripGoals, db.kidCompany, async () => {
    const trip = await db.tripGoals.get(tripId);
    const now = new Date().toISOString();
    if (!trip) {
      const template = tripId === 'trip-holiday-park' ? holidayParkTrip(now) : defaultTrips(now).find((x) => x.id === tripId);
      if (template) await db.tripGoals.put(template);
    } else if (trip.status !== 'active') {
      await db.tripGoals.put({ ...trip, status: 'active' });
    }
    await updateCompany(db, (c) => ({ ...c, tripId }));
  });
}

export async function addIdea(db: FamilyDatabase, text: string, emoji = '💡'): Promise<void> {
  const clean = text.trim();
  if (!clean) return;
  await updateCompany(db, (c) => (c.ideas.some((i) => i.text.toLowerCase() === clean.toLowerCase()) ? c
    : { ...c, ideas: [...c.ideas, { id: newId(), text: clean, emoji, votes: [], createdAt: new Date().toISOString() }] }));
}

export async function toggleVote(db: FamilyDatabase, ideaId: Id, childId: Id): Promise<void> {
  await updateCompany(db, (c) => ({
    ...c,
    ideas: c.ideas.map((i) => (i.id !== ideaId ? i : { ...i, votes: i.votes.includes(childId) ? i.votes.filter((v) => v !== childId) : [...i.votes, childId] })),
  }));
}

export async function removeIdea(db: FamilyDatabase, ideaId: Id): Promise<void> {
  await updateCompany(db, (c) => ({ ...c, ideas: c.ideas.filter((i) => i.id !== ideaId) }));
}

export function productFromCatalog(catalogId: string, order: number, seasonId?: Id, now = new Date().toISOString()): CompanyProduct | undefined {
  const c = CHRISTMAS_PRODUCTS.find((x) => x.id === catalogId);
  if (!c) return undefined;
  return {
    id: `product-${catalogId}`, name: c.name, emoji: c.emoji, materials: [...c.materials], costCents: c.costCents, priceCents: c.priceCents,
    orders: 0, made: 0, sold: 0, status: 'sample', seasonId, catalogId, order, createdAt: now,
  };
}

export const MAX_FIRST_PRODUCTS = 4;

/** Weihnachtsprodukt im Gründungsrat an- oder abwählen; höchstens vier. Gibt false zurück, wenn schon vier gewählt sind. */
export async function toggleFirstProduct(db: FamilyDatabase, catalogId: string, seasonId: Id): Promise<boolean> {
  return db.transaction('rw', db.companyProducts, async () => {
    const all = await db.companyProducts.toArray();
    const existing = all.find((p) => p.catalogId === catalogId);
    if (existing) {
      // Schon verkauft oder bestellt: nicht löschen, nur zurück auf Idee
      if (existing.sold || existing.orders || existing.made) await db.companyProducts.put({ ...existing, status: existing.status === 'idea' ? 'sample' : 'idea' });
      else await db.companyProducts.delete(existing.id);
      return true;
    }
    const chosen = all.filter((p) => p.seasonId === seasonId && p.status !== 'idea');
    if (chosen.length >= MAX_FIRST_PRODUCTS) return false;
    const p = productFromCatalog(catalogId, all.length, seasonId);
    if (p) await db.companyProducts.put(p);
    return true;
  });
}

/** Firma gründen: Name, Gründer, Datum, und die Weihnachtswerkstatt 2026 startet (solange sie noch läuft). */
export async function foundCompany(db: FamilyDatabase, input: { name: string; date: DateKey; founderIds: Id[] }): Promise<KidCompany> {
  return updateCompany(db, (c) => {
    const seasons = [...c.seasons];
    if (!seasons.some((s) => s.planId === XMAS_2026.id) && !seasonOver(XMAS_2026, input.date)) seasons.push(seasonFromPlan(XMAS_2026));
    const withFound = seasons.map((s) => (s.planId !== XMAS_2026.id ? s : { ...s, checked: [...new Set([...s.checked, ...XMAS_2026.phases[0].tasks.map((x) => x.id)])] }));
    return { ...c, name: input.name.trim() || c.name, foundedAt: c.foundedAt ?? input.date, founderIds: input.founderIds, seasons: withFound };
  });
}

/** Die Saison schon vor der Gründung anlegen, damit im Gründungsrat Produkte gewählt werden können. */
export async function ensureSeason(db: FamilyDatabase, plan: SeasonPlan = XMAS_2026): Promise<void> {
  await updateCompany(db, (c) => (c.seasons.some((s) => s.planId === plan.id) ? c : { ...c, seasons: [...c.seasons, seasonFromPlan(plan)] }));
}

export async function toggleSeasonTask(db: FamilyDatabase, seasonId: Id, taskId: string): Promise<void> {
  await updateCompany(db, (c) => ({
    ...c,
    seasons: c.seasons.map((s) => (s.id !== seasonId ? s : { ...s, checked: s.checked.includes(taskId) ? s.checked.filter((x) => x !== taskId) : [...s.checked, taskId] })),
  }));
}

/** Verkauf eintragen: Einnahme in die Firmenkasse und Stückzahl beim Produkt. */
export async function recordSale(db: FamilyDatabase, input: { productId: Id; pieces: number; cents: number; date: DateKey; note?: string; seasonId?: Id }): Promise<void> {
  await db.transaction('rw', db.companyProducts, db.companyEntries, async () => {
    const p = await db.companyProducts.get(input.productId);
    if (!p) return;
    await db.companyEntries.add({
      id: newId(), date: input.date, kind: 'income', cents: input.cents, pieces: input.pieces, productId: p.id, seasonId: input.seasonId ?? p.seasonId,
      note: input.note?.trim() || `${input.pieces} × ${p.name}`, createdAt: new Date().toISOString(),
    });
    await db.companyProducts.put({ ...p, sold: p.sold + input.pieces, made: Math.max(p.made, p.sold + input.pieces) });
  });
}

/** Einnahmen und Verkäufe wieder herausnehmen; verteilter Gewinn bleibt (der wird in der Geldwelt storniert). */
export async function removeEntry(db: FamilyDatabase, id: Id): Promise<void> {
  await db.transaction('rw', db.companyProducts, db.companyEntries, async () => {
    const e = await db.companyEntries.get(id);
    if (!e || e.kind === 'payout') return;
    if (e.kind === 'income' && e.productId && e.pieces) {
      const p = await db.companyProducts.get(e.productId);
      if (p) await db.companyProducts.put({ ...p, sold: Math.max(0, p.sold - e.pieces) });
    }
    await db.companyEntries.delete(id);
  });
}

export async function addCompanyEntry(db: FamilyDatabase, e: Omit<CompanyEntry, 'id' | 'createdAt'>): Promise<void> {
  await db.companyEntries.add({ ...e, id: newId(), createdAt: new Date().toISOString() });
}

/**
 * Offenen Gewinn verteilen: der Reiseanteil wird im Kassenbuch der Reisekasse gebucht (Herkunft „Gemeinsames Projekt“),
 * der Rest bleibt als Materialkasse in der Firma. Feste Id je Vorgang, damit nichts doppelt gebucht wird.
 */
export async function bookPayout(
  db: FamilyDatabase,
  input: { id: Id; date: DateKey; confirmedBy: Id; tripId: Id; holding: MoneyHolding; seasonId?: Id },
): Promise<BookResult> {
  return db.transaction('rw', [db.kidCompany, db.companyEntries, db.moneyTransactions], async () => {
    if (await db.companyEntries.get(input.id)) return { ok: true } as const;
    const company = (await db.kidCompany.get('company')) ?? emptyCompany();
    const totals = companyTotals(await db.companyEntries.toArray());
    if (totals.open <= 0) return { ok: false, error: 'Gerade gibt es keinen Gewinn zum Verteilen.' } as const;
    const { trip, reserve } = payoutSplit(totals.open, company.split);
    const txId = `${input.id}-trip`;
    if (trip > 0) {
      const res = await bookTransactions(db, [{
        id: txId, kind: 'income', date: input.date, cents: trip, to: tripAccount(input.tripId, input.holding), source: 'project',
        note: `Gewinn unserer Kinderfirma${company.name ? ` „${company.name}“` : ''}`, confirmedBy: input.confirmedBy, batchId: input.id, createdAt: new Date().toISOString(),
      }]);
      if (!res.ok) return res;
    }
    await db.companyEntries.add({
      id: input.id, date: input.date, kind: 'payout', cents: trip, reserveCents: reserve, tripId: input.tripId, txId: trip > 0 ? txId : undefined,
      seasonId: input.seasonId, note: 'Gewinn verteilt', createdAt: new Date().toISOString(),
    });
    return { ok: true } as const;
  });
}

export { newId as companyId };

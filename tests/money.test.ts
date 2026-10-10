import { describe, expect, it } from 'vitest';
import { PROJECT_SPLIT } from '../src/data/money';
import { exportData, validateBackup } from '../src/services/backup';
import {
  accountKey, balances, bookProjectDistribution, bookTransactions, cashOverview, childAccount, confirmRequest, distributionLines, goalProgress, lessonsFor, planDistribution,
  potBalance, requestTx, reversalOf, showInvest, simValues, splitCents, splitIsValid, tripAccount, tripBalance, validateTx,
} from '../src/services/money';
import type { MoneyRequest, MoneyTransaction, SavingsGoal } from '../src/types';
import { openDb } from './helpers';

const NOW = '2026-10-10T10:00:00.000Z';
const income = (id: string, cents: number, over: Partial<MoneyTransaction> = {}): MoneyTransaction => ({
  id, kind: 'income', date: '2026-10-10', cents, to: childAccount('child-1', 'spend', 'cash'), source: 'pocket', note: 'Taschengeld',
  confirmedBy: 'parent-1', createdAt: NOW, ...over,
});

describe('Aufteilen ohne Rundungsfehler', () => {
  it('verliert und erschafft keinen Cent', () => {
    expect(splitCents(1000, [1, 1, 1])).toEqual([334, 333, 333]);
    expect(splitCents(3000, [50, 25, 25, 0])).toEqual([1500, 750, 750, 0]);
    for (const total of [1, 7, 99, 1001, 3333]) {
      expect(splitCents(total, [50, 25, 25, 0]).reduce((s, v) => s + v, 0)).toBe(total);
      expect(splitCents(total, [1, 1, 1]).reduce((s, v) => s + v, 0)).toBe(total);
    }
    expect(splitCents(5, [0, 0])).toEqual([0, 0]);
    expect(splitCents(3, [0, 100, 0, 0])).toEqual([0, 3, 0, 0]);
  });

  it('prüft, dass die Prozente 100 ergeben', () => {
    expect(splitIsValid(PROJECT_SPLIT)).toBe(true);
    expect(splitIsValid({ spend: 50, save: 25, trip: 20, invest: 0 })).toBe(false);
    expect(splitIsValid({ spend: 110, save: -10, trip: 0, invest: 0 })).toBe(false);
  });

  it('Zwetschgenverkauf: 30 € Überschuss für zwei Kinder nach 50/25/25', () => {
    const lines = distributionLines(3000, ['child-1', 'child-2'], PROJECT_SPLIT);
    expect(lines).toEqual([
      { childId: 'child-1', spend: 750, save: 375, trip: 375, invest: 0 },
      { childId: 'child-2', spend: 750, save: 375, trip: 375, invest: 0 },
    ]);
    const txs = planDistribution({
      batchId: 'b1', date: '2026-10-10', totalCents: 3000, childIds: ['child-1', 'child-2'], split: PROJECT_SPLIT, holding: 'cash',
      source: 'project', note: 'Hoflädchen', confirmedBy: 'parent-1', tripId: 'trip-salzburg', projectId: 'p1',
    }, NOW);
    expect(txs.reduce((s, t) => s + t.cents, 0)).toBe(3000);
    expect(txs.filter((t) => t.to?.kind === 'trip').map((t) => t.byChildId)).toEqual(['child-1', 'child-2']);
    const map = balances(txs);
    expect(tripBalance(map, 'trip-salzburg').total).toBe(750);
    expect(potBalance(map, 'child-1', 'spend').cash).toBe(750);
  });
});

describe('Buchungsregeln', () => {
  it('verhindert negative Konten, fehlende Bestätigung und Depot außerhalb von Anlegen', () => {
    const map = balances([income('a', 500)]);
    const spend: MoneyTransaction = { id: 'b', kind: 'expense', date: '2026-10-10', cents: 600, from: childAccount('child-1', 'spend', 'cash'), note: 'Eis', confirmedBy: 'parent-1', createdAt: NOW };
    expect(validateTx(spend, map)).toMatch(/nicht vorhanden/);
    expect(validateTx({ ...spend, cents: 500 }, map)).toBeNull();
    expect(validateTx({ ...spend, cents: 500, confirmedBy: '' }, map)).toMatch(/bestätigt/);
    expect(validateTx({ ...spend, cents: 0 }, map)).toMatch(/größer/);
    expect(validateTx({ ...spend, cents: 1.5 }, map)).toMatch(/größer/);
    expect(validateTx(income('c', 100, { to: childAccount('child-1', 'spend', 'depot') }), map)).toMatch(/Depot/);
    expect(validateTx(income('c', 100, { source: undefined }), map)).toMatch(/woher/);
  });

  it('persönliches Geld geht nur mit Zustimmung in die Reisekasse', () => {
    const map = balances([income('a', 1000)]);
    const give: MoneyTransaction = {
      id: 'g', kind: 'transfer', date: '2026-10-10', cents: 200, from: childAccount('child-1', 'spend', 'cash'), to: tripAccount('trip-hamburg', 'cash'),
      note: 'Beitrag', confirmedBy: 'parent-1', byChildId: 'child-1', createdAt: NOW,
    };
    expect(validateTx(give, map)).toMatch(/Zustimmung/);
    expect(validateTx({ ...give, childConsent: true }, map)).toBeNull();
    // Geburtstagsgeld direkt in die Reisekasse nur mit Zustimmung
    const gift = income('h', 500, { source: 'gift', to: tripAccount('trip-hamburg', 'cash'), byChildId: 'child-1' });
    expect(validateTx(gift, map)).toMatch(/Zustimmung/);
    // Gemeinsamer Projektüberschuss nach Vereinbarung braucht keine Einzelzustimmung
    expect(validateTx({ ...gift, source: 'project' }, map)).toBeNull();
    // Geld zu einem Geschwisterkind nur mit Zustimmung
    expect(validateTx({ ...give, to: childAccount('child-2', 'spend', 'cash') }, map)).toMatch(/Zustimmung/);
    // Innerhalb der eigenen Bereiche frei
    expect(validateTx({ ...give, to: childAccount('child-1', 'save', 'bank') }, map)).toBeNull();
  });

  it('bucht ganz oder gar nicht und verhindert Doppelbuchungen', async () => {
    const db = await openDb();
    expect(await bookTransactions(db, [income('a', 500)])).toEqual({ ok: true });
    expect(await bookTransactions(db, [income('a', 500)])).toEqual({ ok: false, error: 'Diese Buchung wurde bereits gespeichert.' });
    const bad: MoneyTransaction = { id: 'x', kind: 'expense', date: '2026-10-10', cents: 900, from: childAccount('child-1', 'spend', 'cash'), note: 'zu viel', confirmedBy: 'p', createdAt: NOW };
    const res = await bookTransactions(db, [income('b', 100), bad]);
    expect(res.ok).toBe(false);
    expect(await db.moneyTransactions.count()).toBe(1);
    // Gleichzeitiges doppeltes Antippen: nur eine Buchung kommt an
    const results = await Promise.all([bookTransactions(db, [income('c', 100)]), bookTransactions(db, [income('c', 100)])]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(potBalance(balances(await db.moneyTransactions.toArray()), 'child-1', 'spend').total).toBe(600);
  });

  it('storniert per Gegenbuchung, nie doppelt', async () => {
    const db = await openDb();
    await bookTransactions(db, [income('a', 500)]);
    const orig = (await db.moneyTransactions.get('a'))!;
    expect(await bookTransactions(db, [reversalOf(orig, 'parent-1', '2026-10-11', 'Tippfehler', NOW)])).toEqual({ ok: true });
    expect(await bookTransactions(db, [reversalOf(orig, 'parent-1', '2026-10-11', '', NOW)])).toMatchObject({ ok: false });
    const all = await db.moneyTransactions.toArray();
    expect(all).toHaveLength(2);
    expect(potBalance(balances(all), 'child-1', 'spend').total).toBe(0);
    expect(all.find((t) => t.reverses === 'a')?.note).toBe('Storno: Taschengeld (Tippfehler)');
  });

  it('storniert nicht, wenn das Geld schon weg ist', async () => {
    const db = await openDb();
    await bookTransactions(db, [income('a', 500)]);
    await bookTransactions(db, [{ id: 'e', kind: 'expense', date: '2026-10-10', cents: 400, from: childAccount('child-1', 'spend', 'cash'), note: 'Buch', confirmedBy: 'p', createdAt: NOW }]);
    const res = await bookTransactions(db, [reversalOf((await db.moneyTransactions.get('a'))!, 'p', '2026-10-11', '', NOW)]);
    expect(res).toMatchObject({ ok: false });
  });
});

describe('Wünsche der Kinder', () => {
  it('bucht einen bestätigten Wunsch genau einmal', async () => {
    const db = await openDb();
    await bookTransactions(db, [income('a', 2000)]);
    const req: MoneyRequest = { id: 'r1', childId: 'child-1', kind: 'trip', cents: 500, tripId: 'trip-copenhagen', status: 'open', createdAt: NOW };
    await db.moneyRequests.add(req);
    const tx = requestTx(req, { fromPot: 'spend', fromHolding: 'cash', confirmedBy: 'parent-1', date: '2026-10-10' }, 'Kopenhagen', NOW);
    expect(tx.childConsent).toBe(true);
    expect(tx.note).toBe('Beitrag für Kopenhagen');
    expect(await confirmRequest(db, req, tx)).toEqual({ ok: true });
    expect(await confirmRequest(db, req, tx)).toMatchObject({ ok: false });
    expect((await db.moneyRequests.get('r1'))?.status).toBe('done');
    const map = balances(await db.moneyTransactions.toArray());
    expect(tripBalance(map, 'trip-copenhagen').cash).toBe(500);
    expect(potBalance(map, 'child-1', 'spend').cash).toBe(1500);
  });

  it('lässt den Wunsch offen, wenn das Geld nicht reicht', async () => {
    const db = await openDb();
    const req: MoneyRequest = { id: 'r2', childId: 'child-1', kind: 'invest', cents: 1000, status: 'open', createdAt: NOW };
    await db.moneyRequests.add(req);
    const res = await confirmRequest(db, req, requestTx(req, { fromPot: 'save', fromHolding: 'bank', confirmedBy: 'p', date: '2026-10-10' }));
    expect(res.ok).toBe(false);
    expect((await db.moneyRequests.get('r2'))?.status).toBe('open');
  });
});

describe('Sparziele, Anlegen und Kassenabgleich', () => {
  const goal = (id: string, target: number, order: number, doneAt?: string): SavingsGoal => ({ id, childId: 'child-1', title: id, emoji: '🚲', targetCents: target, order, createdAt: NOW, doneAt });

  it('füllt Sparziele der Reihe nach', () => {
    const p = goalProgress([goal('b', 5000, 2), goal('a', 2000, 1), goal('x', 100, 0, '2026-01-01')], 3000);
    expect(p.map((g) => [g.goal.id, g.saved, g.reached])).toEqual([['a', 2000, true], ['b', 1000, false]]);
  });

  it('Musterdepot steigt und fällt mit frei gewählten Änderungen', () => {
    expect(simValues({ startCents: 10000, changes: [{ id: '1', date: 'd', percent: 8 }, { id: '2', date: 'd', percent: -10 }] })).toEqual([10000, 10800, 9720]);
  });

  it('zeigt Anlegen bei kleinen Kindern nur, wenn es dort etwas gibt', () => {
    expect(showInvest(5, 0, false, false)).toBe(false);
    expect(showInvest(5, 100, false, false)).toBe(true);
    expect(showInvest(9, 0, false, false)).toBe(true);
    expect(lessonsFor(2).map((l) => l.id)).toEqual(['coins-small']);
    expect(lessonsFor(5).map((l) => l.id)).toEqual(['prices', 'goals']);
  });

  it('trennt Bargeld, Bank und Depot', () => {
    const txs = [
      income('a', 1000),
      income('b', 2000, { to: childAccount('child-1', 'save', 'bank'), source: 'gift', note: 'Oma' }),
      income('c', 500, { to: tripAccount('trip-hamburg', 'cash'), source: 'parents', note: 'Von uns' }),
      { id: 'd', kind: 'transfer', date: '2026-10-10', cents: 300, from: childAccount('child-1', 'save', 'bank'), to: childAccount('child-1', 'invest', 'depot'), note: 'ETF', confirmedBy: 'p', createdAt: NOW } as MoneyTransaction,
    ];
    const { totals, rows } = cashOverview(txs, [{ id: 'child-1', name: 'Taro' }], [{ id: 'trip-hamburg', name: 'Hamburg' }]);
    expect(totals).toEqual({ cash: 1500, bank: 1700, depot: 300, total: 3500 });
    expect(rows.find((r) => r.pot === 'invest')?.split.depot).toBe(300);
    expect(accountKey(childAccount('c', 'save', 'bank'))).toBe('child:c:save:bank');
  });
});

describe('Datenbank und Sicherung', () => {
  it('legt die drei Beispielziele an und sichert alles', async () => {
    const db = await openDb();
    expect((await db.tripGoals.orderBy('order').toArray()).map((t) => t.name)).toEqual(['Salzburg', 'Hamburg', 'Kopenhagen']);
    await bookTransactions(db, [income('a', 500)]);
    await db.simDepots.put({ childId: 'child-1', enabled: true, startCents: 10000, startDate: '2026-10-10', changes: [] });
    await db.depotValuations.add({ id: 'v', childId: 'child-1', date: '2026-10-10', cents: 0 });
    const backup = await exportData(db);
    expect(validateBackup(JSON.parse(JSON.stringify(backup))).ok).toBe(true);
    const broken = JSON.parse(JSON.stringify(backup));
    broken.tables.moneyTransactions[0].cents = -5;
    expect(validateBackup(broken).ok).toBe(false);
  });
});

describe('Projektüberschuss', () => {
  it('wird genau einmal verteilt und am Projekt vermerkt', async () => {
    const db = await openDb();
    await db.projects.add({
      id: 'p1', ideaId: 'farm-shop', title: 'Hoflädchen', emoji: '🧺', status: 'active', childIds: ['child-1', 'child-2'], levels: {}, areas: [], steps: [], tasks: [],
      materials: [], money: [{ id: 'm1', date: '2026-10-10', label: 'Zwetschgen', cents: 3600, kind: 'income' }, { id: 'm2', date: '2026-10-10', label: 'Tüten', cents: 600, kind: 'cost' }],
      entries: [], startDate: '2026-10-01', createdAt: NOW, updatedAt: NOW,
    });
    const plan = (batchId: string) => planDistribution({
      batchId, date: '2026-10-10', totalCents: 3000, childIds: ['child-1', 'child-2'], split: PROJECT_SPLIT, holding: 'cash', source: 'project',
      note: 'Hoflädchen', confirmedBy: 'parent-1', tripId: 'trip-copenhagen', projectId: 'p1',
    }, NOW);
    expect(await bookProjectDistribution(db, 'p1', plan('b1'))).toEqual({ ok: true });
    expect(await bookProjectDistribution(db, 'p1', plan('b2'))).toMatchObject({ ok: false });
    expect((await db.projects.get('p1'))?.moneyBatchId).toBe('b1');
    expect(tripBalance(balances(await db.moneyTransactions.toArray()), 'trip-copenhagen').total).toBe(750);
  });
});

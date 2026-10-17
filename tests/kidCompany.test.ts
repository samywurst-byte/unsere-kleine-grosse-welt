import { describe, expect, it } from 'vitest';
import { CHRISTMAS_PRODUCTS, COMPANY_COUNCIL_ITEM, XMAS_2026 } from '../src/data/kidCompany';
import { exportData, validateBackup } from '../src/services/backup';
import { councilAgenda } from '../src/services/familyTime';
import {
  activeSeason, addCompanyEntry, bookPayout, chooseCompanyTrip, companyBand, companyTotals, currentPhase, foundCompany, payoutSplit,
  piecesForProfit, recordSale, removeEntry, toggleFirstProduct, tripEarnings,
} from '../src/services/kidCompany';
import { openDb } from './helpers';

describe('Kinderfirma', () => {
  it('steht als fester Punkt im Familienrat', () => {
    expect(councilAgenda(undefined)).toContain(COMPANY_COUNCIL_ITEM);
    expect(councilAgenda({ councilAgenda: ['Termine'] })).toEqual(['Termine', 'Familienprojekte', COMPANY_COUNCIL_ITEM]);
  });

  it('Zeitplan der Weihnachtswerkstatt und Aufgaben nach Alter', () => {
    expect(currentPhase(XMAS_2026, '2026-10-18').id).toBe('found');
    expect(currentPhase(XMAS_2026, '2026-10-30').id).toBe('research');
    expect(currentPhase(XMAS_2026, '2026-12-20').id).toBe('closing');
    expect(companyBand({ birthDate: '2021-02-10', ageStage: 'big' } as never, '2026-10-18')).toBe('big');
    expect(companyBand({ birthDate: '2022-08-10', ageStage: 'big' } as never, '2026-10-18')).toBe('middle');
    expect(companyBand({ birthDate: '2024-03-10', ageStage: 'small' } as never, '2026-10-18')).toBe('little');
    expect(new Set(CHRISTMAS_PRODUCTS.map((p) => p.id)).size).toBe(CHRISTMAS_PRODUCTS.length);
  });

  it('rechnet Gewinn, Materialkasse und Stückzahlen', () => {
    const base = { seasonId: 's', createdAt: '' };
    const t = companyTotals([
      { ...base, id: '1', date: '2026-11-01', kind: 'income', cents: 3000, note: '' },
      { ...base, id: '2', date: '2026-11-01', kind: 'material', cents: 800, note: '' },
      { ...base, id: '3', date: '2026-11-02', kind: 'payout', cents: 1000, reserveCents: 250, note: '' },
      { ...base, id: '4', date: '2026-11-03', kind: 'material', cents: 200, fromReserve: true, note: '' },
    ]);
    expect(t).toMatchObject({ income: 3000, materials: 800, profit: 2200, toTrip: 1000, reserve: 250, reserveLeft: 50, open: 950 });
    expect(payoutSplit(950, { trip: 80, materials: 20 })).toEqual({ trip: 760, reserve: 190 });
    expect(piecesForProfit(5000, { priceCents: 500, costCents: 115 })).toBe(13);
    expect(piecesForProfit(5000, { priceCents: 100, costCents: 100 })).toBeNull();
  });

  it('Gründung, Produktwahl, Verkauf und Gewinn in die Reisekasse', async () => {
    const db = await openDb();
    const parent = (await db.members.toArray()).find((m) => m.role === 'parent')!;
    const kids = (await db.members.toArray()).filter((m) => m.role === 'child').map((m) => m.id);

    await chooseCompanyTrip(db, 'trip-holiday-park');
    expect((await db.tripGoals.get('trip-holiday-park'))?.status).toBe('active');

    const c = await foundCompany(db, { name: 'Wunderwerkstatt', date: '2026-10-18', founderIds: kids });
    expect(c).toMatchObject({ name: 'Wunderwerkstatt', foundedAt: '2026-10-18', tripId: 'trip-holiday-park' });
    const season = activeSeason(c, '2026-10-20')!;
    expect(season.planId).toBe('xmas-2026');
    expect(season.checked).toContain('found-1');

    for (const id of ['bead-trees', 'wood-gnomes', 'peg-snowflakes', 'slice-reindeer']) expect(await toggleFirstProduct(db, id, season.id)).toBe(true);
    expect(await toggleFirstProduct(db, 'thumb-snowmen', season.id)).toBe(false);
    expect(await toggleFirstProduct(db, 'slice-reindeer', season.id)).toBe(true);
    expect(await db.companyProducts.count()).toBe(3);

    await recordSale(db, { productId: 'product-bead-trees', pieces: 4, cents: 2000, date: '2026-11-25' });
    expect((await db.companyProducts.get('product-bead-trees'))?.sold).toBe(4);
    await addCompanyEntry(db, { date: '2026-10-20', kind: 'material', cents: 500, note: 'Holzperlen', seasonId: season.id });
    expect(companyTotals(await db.companyEntries.toArray(), season.id).profit).toBe(1500);

    const res = await bookPayout(db, { id: 'pay-1', date: '2026-11-29', confirmedBy: parent.id, tripId: 'trip-holiday-park', holding: 'cash', seasonId: season.id });
    expect(res.ok).toBe(true);
    expect((await bookPayout(db, { id: 'pay-1', date: '2026-11-29', confirmedBy: parent.id, tripId: 'trip-holiday-park', holding: 'cash' })).ok).toBe(true);
    const txs = await db.moneyTransactions.toArray();
    expect(txs).toHaveLength(1);
    expect(txs[0]).toMatchObject({ cents: 1200, source: 'project', kind: 'income' });
    expect(companyTotals(await db.companyEntries.toArray())).toMatchObject({ toTrip: 1200, reserveLeft: 300, open: 0 });
    expect((await bookPayout(db, { id: 'pay-2', date: '2026-11-30', confirmedBy: parent.id, tripId: 'trip-holiday-park', holding: 'cash' })).ok).toBe(false);

    await db.moneyTransactions.add({ id: 'p', kind: 'income', date: '2026-12-01', cents: 5000, to: { kind: 'trip', tripId: 'trip-holiday-park', holding: 'bank' }, source: 'parents', note: 'Elternbeitrag', confirmedBy: parent.id, createdAt: '' });
    expect(tripEarnings(await db.moneyTransactions.toArray(), 'trip-holiday-park')).toEqual({ earned: 1200, parents: 5000, other: 0, total: 6200 });

    const sale = (await db.companyEntries.toArray()).find((e) => e.kind === 'income')!;
    await removeEntry(db, sale.id);
    expect((await db.companyProducts.get('product-bead-trees'))?.sold).toBe(0);

    const backup = validateBackup(JSON.parse(JSON.stringify(await exportData(db))));
    expect(backup.ok).toBe(true);
  });
});

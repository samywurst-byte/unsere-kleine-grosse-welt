import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Field, Toggle } from '../../components/FormControls';
import { Modal } from '../../components/Modal';
import { HOLDING_LABEL } from '../../data/money';
import { db } from '../../database/db';
import { useTripGoals } from '../../hooks/useData';
import { addCompanyEntry, bookPayout, companyId, companyTotals, payoutSplit, recordSale, removeEntry, updateCompany } from '../../services/kidCompany';
import type { CompanyEntry, CompanyProduct, CompanySeason, KidCompany, MoneyHolding } from '../../types';
import { formatDayMonth } from '../../utils/dates';
import { ConfirmerPicker, EuroInput, FieldGroup, formatEuro, parseEuro, useConfirmer } from '../money/parts';
import { Stat } from './parts';

const SPLITS = [80, 70, 90, 100];

/** Unsere Firmenkasse: Einnahmen, Material, Gewinn, und was davon in die Reisekasse geht. */
export function CompanyCash({ company, entries, products, season, today }: {
  company?: KidCompany; entries: CompanyEntry[]; products: CompanyProduct[]; season?: CompanySeason; today: string;
}) {
  const [modal, setModal] = useState<'sale' | 'expense' | 'payout' | null>(null);
  const t = companyTotals(entries);
  const split = company?.split ?? { trip: 80, materials: 20 };
  const recent = [...entries].sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)).slice(0, 12);
  const names = new Map(products.map((p) => [p.id, p.name]));

  return (
    <section className="card">
      <h2 className="card__title">💶 Unsere Firmenkasse</h2>
      <div className="kc-stats">
        <Stat label="Einnahmen" value={formatEuro(t.income)} />
        <Stat label="Material" value={formatEuro(t.materials)} />
        {t.costs > 0 && <Stat label="Weitere Kosten" value={formatEuro(t.costs)} />}
        <Stat label="Gewinn" value={formatEuro(t.profit)} strong />
      </div>
      <p className="muted small">Einnahmen sind noch kein Gewinn: Erst wird das Material bezahlt, was übrig bleibt, ist unser Gewinn.</p>
      <div className="kc-stats">
        <Stat label="In die Reisekasse gebucht" value={formatEuro(t.toTrip)} />
        <Stat label="Geld für neue Materialien" value={formatEuro(t.reserveLeft)} />
        <Stat label="Noch nicht verteilt" value={formatEuro(t.open)} />
      </div>
      <div className="row row--wrap">
        <button type="button" className="btn btn--sage" disabled={products.length === 0} onClick={() => setModal('sale')}>Verkauf eintragen</button>
        <button type="button" className="btn" onClick={() => setModal('expense')}>Ausgabe eintragen</button>
        <button type="button" className="btn btn--primary" disabled={t.open <= 0 || !company?.tripId} onClick={() => setModal('payout')}>Gewinn verteilen</button>
      </div>
      {!company?.tripId && t.open > 0 && <p className="small muted">Zum Verteilen erst unten ein Reiseziel wählen.</p>}
      <div className="kc-split">
        <span className="small">Aufteilung des Gewinns:</span>
        <div className="seg" role="group" aria-label="Aufteilung des Gewinns">
          {SPLITS.map((s) => (
            <button key={s} type="button" className="seg__item" aria-pressed={split.trip === s} onClick={() => void updateCompany(db, (c) => ({ ...c, split: { trip: s, materials: 100 - s } }))}>
              {s} % Reise · {100 - s} % Material
            </button>
          ))}
        </div>
      </div>

      {recent.length > 0 && (
        <ul className="list kc-entries">
          {recent.map((e) => (
            <li key={e.id} className="list-item">
              <div className="list-item__main">
                <p className="list-item__title">{e.kind === 'payout' ? `Verteilt: ${formatEuro(e.cents)} Reisekasse, ${formatEuro(e.reserveCents ?? 0)} Material` : e.note}</p>
                <p className="list-item__meta">{formatDayMonth(e.date)} · {LABEL[e.kind]}{e.productId && names.get(e.productId) && e.kind !== 'income' ? ` · ${names.get(e.productId)}` : ''}{e.fromReserve ? ' · aus der Materialkasse' : ''}</p>
              </div>
              {e.kind !== 'payout' && <strong className={e.kind === 'income' ? 'kc-plus' : 'kc-minus'}>{e.kind === 'income' ? '+' : '−'} {formatEuro(e.cents)}</strong>}
              {e.kind !== 'payout' && <button type="button" className="btn btn--icon btn--ghost" aria-label="Eintrag löschen" onClick={() => { if (window.confirm('Diesen Eintrag löschen?')) void removeEntry(db, e.id); }}><Trash2 size={18} /></button>}
            </li>
          ))}
        </ul>
      )}
      <p className="muted small">Verteilter Gewinn steht im Kassenbuch der Reisekasse. Ein Fehler dort wird in der Geldwelt storniert.</p>

      {modal === 'sale' && <SaleModal products={products} season={season} today={today} onClose={() => setModal(null)} />}
      {modal === 'expense' && <ExpenseModal products={products} season={season} today={today} reserveLeft={t.reserveLeft} onClose={() => setModal(null)} />}
      {modal === 'payout' && company?.tripId && <PayoutModal open={t.open} split={split} tripId={company.tripId} season={season} today={today} onClose={() => setModal(null)} />}
    </section>
  );
}

const LABEL: Record<CompanyEntry['kind'], string> = { income: 'Einnahme', material: 'Material', cost: 'Kosten', payout: 'Gewinn verteilt' };

function SaleModal({ products, season, today, onClose }: { products: CompanyProduct[]; season?: CompanySeason; today: string; onClose: () => void }) {
  const [productId, setProductId] = useState(products.find((p) => p.status === 'selling')?.id ?? products[0]?.id ?? '');
  const [pieces, setPieces] = useState(1);
  const product = products.find((p) => p.id === productId);
  const [amount, setAmount] = useState('');
  const suggested = (product?.priceCents ?? 0) * pieces;
  const cents = amount.trim() ? parseEuro(amount) : suggested;
  const [date, setDate] = useState(today);
  const valid = !!product && pieces > 0 && cents !== null && cents > 0;
  const save = async () => {
    if (!valid) return;
    await recordSale(db, { productId, pieces, cents: cents!, date, seasonId: product!.seasonId ?? season?.id });
    onClose();
  };
  return (
    <Modal title="Verkauf eintragen" onClose={onClose} actions={<button type="button" className="btn btn--primary" disabled={!valid} onClick={() => void save()}>Eintragen</button>}>
      <div className="kc-form">
        <FieldGroup label="Was wurde verkauft?">
          <div className="seg" role="group" aria-label="Produkt">
            {products.map((p) => <button key={p.id} type="button" className="seg__item" aria-pressed={p.id === productId} onClick={() => setProductId(p.id)}>{p.emoji} {p.name}</button>)}
          </div>
        </FieldGroup>
        <FieldGroup label="Wie viele Stück?">
          <div className="row">
            <button type="button" className="btn btn--icon" aria-label="Eins weniger" disabled={pieces <= 1} onClick={() => setPieces(pieces - 1)}>−</button>
            <span className="kc-counter__value">{pieces}</span>
            <button type="button" className="btn btn--icon" aria-label="Eins mehr" onClick={() => setPieces(pieces + 1)}>+</button>
          </div>
        </FieldGroup>
        <FieldGroup label="Eingenommen" hint={`Leer lassen für ${formatEuro(suggested)} (Preis × Stück). Trinkgeld oder Rabatt hier eintragen.`}>
          <EuroInput value={amount} onChange={setAmount} />
        </FieldGroup>
        <Field label="Datum"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value || today)} /></Field>
      </div>
    </Modal>
  );
}

function ExpenseModal({ products, season, today, reserveLeft, onClose }: { products: CompanyProduct[]; season?: CompanySeason; today: string; reserveLeft: number; onClose: () => void }) {
  const [kind, setKind] = useState<'material' | 'cost'>('material');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [productId, setProductId] = useState<string | undefined>(undefined);
  const [fromReserve, setFromReserve] = useState(false);
  const [date, setDate] = useState(today);
  const cents = parseEuro(amount);
  const valid = cents !== null && cents > 0 && !!note.trim() && (!fromReserve || cents <= reserveLeft);
  const save = async () => {
    if (!valid) return;
    await addCompanyEntry(db, { date, kind, cents: cents!, note: note.trim(), productId, seasonId: season?.id, fromReserve: fromReserve || undefined });
    onClose();
  };
  return (
    <Modal title="Ausgabe eintragen" onClose={onClose} actions={<button type="button" className="btn btn--primary" disabled={!valid} onClick={() => void save()}>Eintragen</button>}>
      <div className="kc-form">
        <FieldGroup label="Wofür?">
          <div className="seg" role="group" aria-label="Art">
            <button type="button" className="seg__item" aria-pressed={kind === 'material'} onClick={() => setKind('material')}>Material</button>
            <button type="button" className="seg__item" aria-pressed={kind === 'cost'} onClick={() => setKind('cost')}>Weitere Kosten</button>
          </div>
        </FieldGroup>
        <FieldGroup label="Betrag"><EuroInput value={amount} onChange={setAmount} /></FieldGroup>
        <Field label="Was genau?"><input className="input" value={note} placeholder="z. B. Bienenwachsplatten und Docht" onChange={(e) => setNote(e.target.value)} /></Field>
        {products.length > 0 && (
          <FieldGroup label="Für welches Produkt? (freiwillig)">
            <div className="seg" role="group" aria-label="Produkt">
              <button type="button" className="seg__item" aria-pressed={!productId} onClick={() => setProductId(undefined)}>Allgemein</button>
              {products.map((p) => <button key={p.id} type="button" className="seg__item" aria-pressed={p.id === productId} onClick={() => setProductId(p.id)}>{p.emoji} {p.name}</button>)}
            </div>
          </FieldGroup>
        )}
        {reserveLeft > 0 && <Toggle checked={fromReserve} onChange={setFromReserve} label={`Aus der Materialkasse bezahlt (${formatEuro(reserveLeft)} übrig)`} />}
        <Field label="Datum"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value || today)} /></Field>
      </div>
    </Modal>
  );
}

function PayoutModal({ open, split, tripId, season, today, onClose }: { open: number; split: KidCompany['split']; tripId: string; season?: CompanySeason; today: string; onClose: () => void }) {
  const trips = useTripGoals();
  const [confirmedBy, setConfirmedBy, parents] = useConfirmer();
  const [holding, setHolding] = useState<MoneyHolding>('cash');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const id = useMemo(() => companyId(), []);
  const parts = payoutSplit(open, split);
  const trip = trips?.find((t) => t.id === tripId);
  const book = async () => {
    if (busy || !confirmedBy) return;
    setBusy(true);
    const res = await bookPayout(db, { id, date: today, confirmedBy, tripId, holding, seasonId: season?.id });
    setBusy(false);
    if (res.ok) onClose(); else setError(res.error);
  };
  return (
    <Modal title="Gewinn verteilen" onClose={onClose} actions={<button type="button" className="btn btn--primary" disabled={busy || !confirmedBy} onClick={() => void book()}>Verteilen</button>}>
      <p className="kc-big">{formatEuro(open)} Gewinn</p>
      <ul className="kc-payout">
        <li><span aria-hidden="true">🧳</span> {formatEuro(parts.trip)} in die Reisekasse {trip ? `${trip.flag} ${trip.name}` : ''}</li>
        <li><span aria-hidden="true">🧰</span> {formatEuro(parts.reserve)} für neue Materialien</li>
      </ul>
      <FieldGroup label="Wo liegt das Geld?">
        <div className="seg" role="group" aria-label="Wo liegt das Geld?">
          {(['cash', 'bank'] as MoneyHolding[]).map((h) => <button key={h} type="button" className="seg__item" aria-pressed={holding === h} onClick={() => setHolding(h)}>{HOLDING_LABEL[h]}</button>)}
        </div>
      </FieldGroup>
      <FieldGroup label="Wer bestätigt?"><ConfirmerPicker value={confirmedBy} onChange={setConfirmedBy} parents={parents} /></FieldGroup>
      {error && <p className="notice notice--error">{error}</p>}
    </Modal>
  );
}

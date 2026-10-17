import { Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Field } from '../../components/FormControls';
import { Modal } from '../../components/Modal';
import { CHRISTMAS_PRODUCTS, PRODUCT_STATUS_LABEL, PROFIT_TARGETS } from '../../data/kidCompany';
import { db } from '../../database/db';
import { companyId, marginCents, piecesForProfit, productFromCatalog, productIncome } from '../../services/kidCompany';
import { formatEuro, parseEuro } from '../../services/projects';
import type { CompanyEntry, CompanyProduct, CompanyProductStatus, CompanySeason } from '../../types';
import { shrinkImage } from '../../utils/image';
import { Progress } from '../money/parts';
import { ProductArt } from './ProductArt';

const STATUSES = Object.keys(PRODUCT_STATUS_LABEL) as CompanyProductStatus[];

/** Unser kleiner Laden: Produkte mit Preis, Material, Bestellungen und Stückzahlen. */
export function CompanyShop({ products, entries, season }: { products: CompanyProduct[]; entries: CompanyEntry[]; season?: CompanySeason }) {
  const [edit, setEdit] = useState<CompanyProduct | null>(null);
  const catalogLeft = CHRISTMAS_PRODUCTS.filter((c) => !products.some((p) => p.catalogId === c.id));
  const addCatalog = (id: string) => { const p = productFromCatalog(id, products.length, season?.id); if (p) void db.companyProducts.put(p); };
  const addOwn = () => setEdit({
    id: companyId(), name: '', emoji: '⭐', materials: [], costCents: 0, priceCents: 0, orders: 0, made: 0, sold: 0, status: 'idea',
    seasonId: season?.id, order: products.length, createdAt: new Date().toISOString(),
  });
  const bump = (p: CompanyProduct, field: 'orders' | 'made', by: number) => void db.companyProducts.put({ ...p, [field]: Math.max(0, p[field] + by) });

  return (
    <section className="card">
      <h2 className="card__title">🛍️ Unser kleiner Laden</h2>
      {products.length === 0 && <p className="muted">Noch keine Produkte. Wählt im Gründungsrat bis zu zwei Weihnachtsprodukte oder legt hier eins an.</p>}
      <div className="kc-shop">
        {products.map((p) => {
          const margin = marginCents(p);
          const earned = productIncome(entries, p.id);
          const toMake = Math.max(0, p.orders - p.made);
          return (
            <article key={p.id} className={`kc-item kc-item--${p.status}`}>
              <div className="kc-item__head">
                {p.photo ? <img className="kc-item__photo" src={p.photo} alt="" /> : <ProductArt catalogId={p.catalogId} emoji={p.emoji} size={64} />}
                <div className="kc-item__title">
                  <h3>{p.name}</h3>
                  <span className="chip">{PRODUCT_STATUS_LABEL[p.status]}</span>
                </div>
                <button type="button" className="btn btn--icon btn--ghost" aria-label={`${p.name} bearbeiten`} onClick={() => setEdit(p)}><Pencil size={18} /></button>
              </div>
              <p className="kc-item__price">
                Preis <strong>{formatEuro(p.priceCents)}</strong> · Material {formatEuro(p.costCents)} · Gewinn je Stück <strong className={margin > 0 ? '' : 'kc-warn'}>{formatEuro(margin)}</strong>
              </p>
              <div className="kc-counters">
                <Counter label="Bestellt" value={p.orders} onMinus={() => bump(p, 'orders', -1)} onPlus={() => bump(p, 'orders', 1)} />
                <Counter label="Hergestellt" value={p.made} onMinus={() => bump(p, 'made', -1)} onPlus={() => bump(p, 'made', 1)} />
                <div className="kc-counter"><span className="kc-counter__value">{p.sold}</span><span className="kc-counter__label">Verkauft</span></div>
              </div>
              {p.orders > 0 && (
                <>
                  <Progress value={p.made} max={p.orders} label={`${p.name} hergestellt`} />
                  <p className="small">{toMake > 0 ? `Noch ${toMake} herstellen` : 'Alle Bestellungen sind fertig 🎉'}</p>
                </>
              )}
              <p className="small muted">
                {margin > 0
                  ? `Für ${PROFIT_TARGETS.map((t) => `${formatEuro(t)} Gewinn ${piecesForProfit(t, p)} Stück`).join(', ')}.`
                  : 'Bei diesem Preis bleibt kein Gewinn übrig. Preis oder Material anpassen.'}
                {earned.cents > 0 && ` Eingenommen: ${formatEuro(earned.cents)}.`}
              </p>
            </article>
          );
        })}
      </div>
      <details className="kc-catalog">
        <summary>Produkt hinzufügen</summary>
        <div className="row row--wrap">
        {catalogLeft.map((c) => <button key={c.id} type="button" className="btn btn--small" onClick={() => addCatalog(c.id)}><Plus size={16} aria-hidden="true" /> {c.emoji} {c.name}</button>)}
        <button type="button" className="btn btn--small" onClick={addOwn}><Plus size={16} aria-hidden="true" /> Eigenes Produkt</button>
        </div>
      </details>
      {edit && <ProductModal product={edit} isNew={!products.some((p) => p.id === edit.id)} onClose={() => setEdit(null)} />}
    </section>
  );
}

function Counter({ label, value, onMinus, onPlus }: { label: string; value: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="kc-counter" role="group" aria-label={label}>
      <button type="button" className="btn btn--icon btn--small" aria-label={`${label} weniger`} disabled={value <= 0} onClick={onMinus}><Minus size={16} /></button>
      <span className="kc-counter__value">{value}</span>
      <button type="button" className="btn btn--icon btn--small" aria-label={`${label} mehr`} onClick={onPlus}><Plus size={16} /></button>
      <span className="kc-counter__label">{label}</span>
    </div>
  );
}

function ProductModal({ product, isNew, onClose }: { product: CompanyProduct; isNew: boolean; onClose: () => void }) {
  const [p, setP] = useState(product);
  const [cost, setCost] = useState(product.costCents ? formatEuro(product.costCents).replace(' €', '') : '');
  const [price, setPrice] = useState(product.priceCents ? formatEuro(product.priceCents).replace(' €', '') : '');
  const [materials, setMaterials] = useState(product.materials.join('\n'));
  const costC = cost.trim() ? parseEuro(cost) : 0;
  const priceC = price.trim() ? parseEuro(price) : 0;
  const valid = !!p.name.trim() && costC !== null && priceC !== null;
  const note = CHRISTMAS_PRODUCTS.find((c) => c.id === p.catalogId)?.note;
  const save = () => {
    if (!valid) return;
    void db.companyProducts.put({ ...p, name: p.name.trim(), costCents: costC, priceCents: priceC, materials: materials.split('\n').map((m) => m.trim()).filter(Boolean) });
    onClose();
  };
  const remove = () => {
    if (!window.confirm(`${p.name || 'Produkt'} wirklich löschen? Einträge in der Kasse bleiben erhalten.`)) return;
    void db.companyProducts.delete(p.id);
    onClose();
  };
  const onPhoto = async (f?: File) => { if (f) setP({ ...p, photo: await shrinkImage(f, 900) }); };
  return (
    <Modal wide title={isNew ? 'Neues Produkt' : p.name} onClose={onClose} actions={
      <>
        {!isNew && <button type="button" className="btn btn--ghost" onClick={remove}><Trash2 size={18} aria-hidden="true" /> Löschen</button>}
        <button type="button" className="btn btn--primary" disabled={!valid} onClick={save}>Speichern</button>
      </>
    }>
      <div className="kc-form">
        <Field label="Name"><input className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field>
        <Field label="Bild (Emoji)"><input className="input kc-emoji-input" value={p.emoji} maxLength={4} onChange={(e) => setP({ ...p, emoji: e.target.value })} /></Field>
        <Field label="Produktfoto">
          <div className="row">
            {p.photo && <img className="kc-item__photo" src={p.photo} alt="" />}
            <input type="file" accept="image/*" aria-label="Produktfoto" onChange={(e) => void onPhoto(e.target.files?.[0])} />
            {p.photo && <button type="button" className="btn btn--small btn--ghost" onClick={() => setP({ ...p, photo: undefined })}>Foto entfernen</button>}
          </div>
        </Field>
        <Field label="Materialkosten je Stück (€)"><input className="input" inputMode="decimal" value={cost} aria-invalid={costC === null} onChange={(e) => setCost(e.target.value)} /></Field>
        <Field label="Verkaufspreis (€)"><input className="input" inputMode="decimal" value={price} aria-invalid={priceC === null} onChange={(e) => setPrice(e.target.value)} /></Field>
        <Field label="Material, eine Zeile je Teil"><textarea className="input" rows={4} value={materials} onChange={(e) => setMaterials(e.target.value)} /></Field>
        <Field label="Stand">
          <div className="seg" role="group" aria-label="Stand">
            {STATUSES.map((s) => <button key={s} type="button" className="seg__item" aria-pressed={p.status === s} onClick={() => setP({ ...p, status: s })}>{PRODUCT_STATUS_LABEL[s]}</button>)}
          </div>
        </Field>
      </div>
      {note && <p className="notice notice--info">{note}</p>}
      <p className="muted small">Preise sind Vorschläge. In der Marktforschung findet ihr heraus, was passt.</p>
    </Modal>
  );
}

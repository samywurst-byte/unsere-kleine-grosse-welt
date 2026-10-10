import { Check, Plus, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { SECTION_LABEL, SECTION_ORDER, guessSection } from '../../data/meals';
import { db } from '../../database/db';
import { useShoppingItems } from '../../hooks/useData';
import { addShoppingItem, clearDoneItems, shoppingListText, toggleShoppingItem } from '../../services/meals';
import { shareText } from '../../services/platform';
import type { ShopSection } from '../../types';

/** Einkaufsliste am iPad. Aufs Handy kommt sie als Text über das Teilen-Menü, ohne Server. */
export function ShoppingView() {
  const items = useShoppingItems();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [section, setSection] = useState<ShopSection | ''>('');
  const [message, setMessage] = useState<string | null>(null);
  if (!items) return null;
  const open = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);

  const add = async () => {
    await addShoppingItem(db, name, section || guessSection(name), amount);
    setName(''); setAmount(''); setSection('');
  };
  const share = async () => {
    const res = await shareText(shoppingListText(items), 'Einkaufsliste');
    setMessage(res === 'shared' ? 'Liste übergeben.' : res === 'copied' ? 'Liste kopiert. Jetzt z. B. in Notizen oder eine Nachricht einfügen.' : res === 'failed' ? 'Teilen hat nicht geklappt.' : null);
  };

  return (
    <div className="stack">
      <div className="card stack">
        <div className="row row--wrap meal-add">
          <input className="input" value={name} placeholder="Was fehlt? z. B. Milch" aria-label="Was fehlt?"
            onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) void add(); }} />
          <input className="input meal-add__amount" value={amount} placeholder="Menge" aria-label="Menge" onChange={(e) => setAmount(e.target.value)} />
          <select className="input meal-add__section" value={section || (name.trim() ? guessSection(name) : '')} aria-label="Abteilung" onChange={(e) => setSection(e.target.value as ShopSection)}>
            <option value="" disabled>Abteilung</option>
            {SECTION_ORDER.map((s) => <option key={s} value={s}>{SECTION_LABEL[s]}</option>)}
          </select>
          <button type="button" className="btn btn--sky" disabled={!name.trim()} onClick={() => void add()}><Plus size={18} aria-hidden="true" /> Dazu</button>
        </div>
      </div>

      <div className="row row--wrap">
        <button type="button" className="btn btn--primary" disabled={!open.length} onClick={() => void share()}><Send size={18} aria-hidden="true" /> Aufs Handy schicken</button>
        {done.length > 0 && <button type="button" className="btn btn--ghost" onClick={() => void clearDoneItems(db)}><Trash2 size={16} aria-hidden="true" /> {done.length} erledigte entfernen</button>}
      </div>
      <p className="small muted">Im Teilen-Menü z. B. AirDrop an dein iPhone, Notizen oder eine Nachricht an Papa wählen. Auf dem Handy wird die Liste nicht automatisch aktualisiert.</p>
      {message && <p className="notice notice--ok">{message}</p>}

      {open.length === 0 && <p className="muted">Die Liste ist leer. Im Wochenplan „Zutaten prüfen“ tippen oder oben etwas eintragen.</p>}
      {SECTION_ORDER.map((s) => {
        const group = items.filter((i) => i.section === s).sort((a, b) => Number(a.done) - Number(b.done) || a.name.localeCompare(b.name, 'de'));
        if (!group.length) return null;
        return (
          <section key={s}>
            <h3 className="card__eyebrow">{SECTION_LABEL[s]}</h3>
            <ul className="meal-list">
              {group.map((i) => (
                <li key={i.id}>
                  <button type="button" className={`meal-item ${i.done ? 'is-done' : ''}`} aria-pressed={i.done} onClick={() => void toggleShoppingItem(db, i.id)}>
                    <span className="ft-pack-check__box meal-item__box" aria-hidden="true">{i.done && <Check size={18} strokeWidth={3} />}</span>
                    <span className="meal-item__name">{i.name}{i.amount && <span className="muted"> · {i.amount}</span>}</span>
                    {i.source && <span className="small muted meal-item__src">{i.source}</span>}
                  </button>
                  <button type="button" className="btn btn--icon btn--ghost" aria-label={`${i.name} löschen`} onClick={() => void db.shoppingItems.delete(i.id)}><Trash2 size={16} /></button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

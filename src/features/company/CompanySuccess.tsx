import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Field } from '../../components/FormControls';
import { Modal } from '../../components/Modal';
import { db } from '../../database/db';
import { useFamilyMemories } from '../../hooks/useData';
import { addMemory, memoryPhotos } from '../../services/familyTime';
import { companyMemories, milestones } from '../../services/kidCompany';
import type { CompanyEntry, CompanyProduct, KidCompany } from '../../types';
import { formatDayMonth } from '../../utils/dates';
import { shrinkImage } from '../../utils/image';

const MAX_PHOTOS = 6;

/** Unsere Erfolge: was wir geschafft haben, Fotos der Produkte und Erinnerungen. Kein Vergleich zwischen den Kindern. */
export function CompanySuccess({ company, products, entries, today }: { company?: KidCompany; products: CompanyProduct[]; entries: CompanyEntry[]; today: string }) {
  const memories = useFamilyMemories();
  const [adding, setAdding] = useState(false);
  if (!memories) return null;
  const reached = milestones(company, products, entries);
  const mine = companyMemories(memories);
  const photos = products.filter((p) => p.photo);
  return (
    <section className="card">
      <h2 className="card__title">🏆 Unsere Erfolge</h2>
      {reached.length === 0 ? <p className="muted">Hier sammeln sich unsere Erfolge, sobald es losgeht.</p> : (
        <ul className="kc-badges">
          {reached.map((m) => (
            <li key={m.id} className="kc-badge"><span className="kc-badge__emoji" aria-hidden="true">{m.emoji}</span><span className="kc-badge__title">{m.title}</span>{m.date && <span className="kc-badge__date">{formatDayMonth(m.date)}</span>}</li>
          ))}
        </ul>
      )}
      {photos.length > 0 && (
        <div className="kc-gallery">
          {photos.map((p) => <figure key={p.id}><img src={p.photo} alt={p.name} /><figcaption>{p.name}</figcaption></figure>)}
        </div>
      )}
      {mine.length > 0 && (
        <ul className="kc-memories">
          {mine.map((m) => {
            const ph = memoryPhotos(m);
            return (
              <li key={m.id} className="kc-memory">
                {ph[0] ? <img src={ph[0]} alt="" /> : <span className="kc-memory__blank" aria-hidden="true">✨</span>}
                <div><strong>{m.title}</strong><span className="small muted">{formatDayMonth(m.date)}{ph.length > 1 ? ` · ${ph.length} Fotos` : ''}</span>{m.text && <p className="small">{m.text.split('\n')[0]}</p>}</div>
              </li>
            );
          })}
        </ul>
      )}
      <div className="row row--wrap">
        <button type="button" className="btn" onClick={() => setAdding(true)}><Plus size={18} aria-hidden="true" /> Erinnerung festhalten</button>
        <Link className="btn btn--ghost btn--small" to="/archiv">Im Familienarchiv ansehen</Link>
      </div>
      {adding && <MemoryModal company={company} today={today} onClose={() => setAdding(false)} />}
    </section>
  );
}

function MemoryModal({ company, today, onClose }: { company?: KidCompany; today: string; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    setBusy(true);
    try {
      const out: string[] = [];
      for (const f of Array.from(files).slice(0, MAX_PHOTOS - photos.length)) out.push(await shrinkImage(f));
      setPhotos([...photos, ...out]);
    } finally { setBusy(false); }
  };
  const save = async () => {
    await addMemory(db, { date: today, title, text, photos, memberIds: company?.founderIds ?? [], source: { kind: 'company', id: 'company' } });
    onClose();
  };
  return (
    <Modal title="Erinnerung festhalten" onClose={onClose} actions={<button type="button" className="btn btn--primary" disabled={!title.trim() || busy} onClick={() => void save()}>Speichern</button>}>
      <div className="kc-form">
        <Field label="Was war los?"><input className="input" value={title} placeholder="z. B. Unser erster Verkauf bei Oma" onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Was haben die Kinder erzählt? (freiwillig)"><textarea className="input" rows={3} value={text} onChange={(e) => setText(e.target.value)} /></Field>
        <Field label={`Fotos (bis zu ${MAX_PHOTOS})`}>
          <input type="file" accept="image/*" multiple aria-label="Fotos" disabled={photos.length >= MAX_PHOTOS} onChange={(e) => void onFiles(e.target.files)} />
        </Field>
        {photos.length > 0 && <div className="kc-gallery">{photos.map((p, i) => <figure key={i}><img src={p} alt="" /></figure>)}</div>}
      </div>
    </Modal>
  );
}

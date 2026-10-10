import { ArrowLeft, Camera, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Field } from '../../components/FormControls';
import { Modal } from '../../components/Modal';
import { db } from '../../database/db';
import { useFamilyMemories, useMembers } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { addMemory, deleteMemory } from '../../services/familyTime';
import type { FamilyMemory } from '../../types';
import { formatLong, toDateKey } from '../../utils/dates';
import { shrinkImage } from '../../utils/image';
import './familyTime.css';

/** Unsere Erinnerungen: schöne Momente mit Foto und ein paar Worten. */
export function MemoriesPage() {
  const memories = useFamilyMemories();
  const members = useMembers();
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<FamilyMemory | null>(null);
  if (!memories || !members) return null;
  return (
    <div>
      <header className="page-head">
        <Link to="/familienzeit" className="btn btn--icon btn--ghost" aria-label="Zurück zur Familienzeit"><ArrowLeft size={22} /></Link>
        <h1>Unsere Erinnerungen</h1>
        <div className="spacer" />
        <button type="button" className="btn btn--primary" onClick={() => setAdding(true)}><Plus size={20} aria-hidden="true" /> Neue Erinnerung</button>
      </header>
      {memories.length === 0 ? (
        <p className="card muted">Noch keine Erinnerungen. Nach dem nächsten Abenteuer einfach ein Foto machen und ein paar Worte dazuschreiben.</p>
      ) : (
        <div className="ft-mem-grid">
          {memories.map((m) => (
            <button key={m.id} type="button" className="card ft-mem" onClick={() => setOpen(m)}>
              {m.photo ? <img src={m.photo} alt="" className="ft-mem__photo" /> : <span className="ft-mem__blank" aria-hidden="true">✨</span>}
              <span className="ft-mem__title">{m.title}</span>
              <span className="ft-mem__date muted">{formatLong(m.date)}</span>
            </button>
          ))}
        </div>
      )}
      {adding && <MemoryForm onClose={() => setAdding(false)} />}
      {open && (
        <Modal title={open.title} onClose={() => setOpen(null)} wide
          actions={<button type="button" className="btn btn--ghost" onClick={() => { if (window.confirm('Diese Erinnerung wirklich löschen?')) void deleteMemory(db, open.id).then(() => setOpen(null)); }}><Trash2 size={18} aria-hidden="true" /> Löschen</button>}
        >
          {open.photo && <img src={open.photo} alt="" className="ft-mem-full" />}
          <p className="muted">{formatLong(open.date)}</p>
          {open.text && <p>{open.text}</p>}
          <div className="row row--wrap">
            {open.memberIds.map((id) => members.find((x) => x.id === id)).filter(Boolean).map((x) => (
              <span key={x!.id} className="chip"><Avatar avatar={x!.avatar} color={x!.color} size={24} /> {x!.name}</span>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

/** Neue Erinnerung anlegen; auch direkt nach einem Abenteuer. */
export function MemoryForm({ initial, onClose }: { initial?: Partial<Pick<FamilyMemory, 'title' | 'date' | 'source'>>; onClose: () => void }) {
  const today = toDateKey(useNow(60_000));
  const members = useMembers();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [text, setText] = useState('');
  const [date, setDate] = useState(initial?.date ?? today);
  const [photo, setPhoto] = useState<string | undefined>();
  const [who, setWho] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const everyone = members?.filter((m) => m.active).map((m) => m.id) ?? [];
  const selected = who ?? everyone;

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true); setError(null);
    try { setPhoto(await shrinkImage(file)); } catch (e) { setError(e instanceof Error ? e.message : 'Das Foto ging nicht.'); } finally { setBusy(false); }
  };
  const save = async () => {
    await addMemory(db, { title, text, date, memberIds: selected, ...(photo ? { photo } : {}), ...(initial?.source ? { source: initial.source } : {}) });
    onClose();
  };

  return (
    <Modal title="Erinnerung festhalten" onClose={onClose} wide
      actions={<><button type="button" className="btn" onClick={onClose}>Später</button><button type="button" className="btn btn--primary" disabled={!title.trim() || busy} onClick={() => void save()}>Speichern</button></>}
    >
      <div className="stack">
        <label className={`ft-photo ${photo ? 'ft-photo--set' : ''}`}>
          {photo ? <img src={photo} alt="Ausgewähltes Foto" /> : <span><Camera size={36} aria-hidden="true" /><br />{busy ? 'Foto wird vorbereitet …' : 'Foto machen oder auswählen'}</span>}
          <input type="file" accept="image/*" onChange={(e) => void pick(e.target.files?.[0])} />
        </label>
        {error && <p className="notice notice--error">{error}</p>}
        <Field label="Was war schön?">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Laternenrunde im Park" />
        </Field>
        <Field label="Ein paar Worte (optional)">
          <textarea className="input" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Was die Kinder erzählt haben …" />
        </Field>
        <Field label="Datum">
          <input className="input" type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </Field>
        <div className="row row--wrap" role="group" aria-label="Wer war dabei?">
          {members?.filter((m) => m.active).map((m) => (
            <button key={m.id} type="button" className="seg__item ft-who" aria-pressed={selected.includes(m.id)}
              onClick={() => setWho(selected.includes(m.id) ? selected.filter((x) => x !== m.id) : [...selected, m.id])}>
              <Avatar avatar={m.avatar} color={m.color} size={28} /> {m.name}
            </button>
          ))}
        </div>
        <p className="small muted">Fotos bleiben auf diesem iPad und kommen mit in die Datensicherung.</p>
      </div>
    </Modal>
  );
}

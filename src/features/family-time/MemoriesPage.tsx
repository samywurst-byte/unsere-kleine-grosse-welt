import { ArrowLeft, Camera, ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Field } from '../../components/FormControls';
import { Modal } from '../../components/Modal';
import { db } from '../../database/db';
import { useFamilyMemories, useMembers } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { addMemory, deleteMemory, MAX_MEMORY_PHOTOS, memoryPhotos, setMemoryPhotos } from '../../services/familyTime';
import type { FamilyMemory } from '../../types';
import { formatLong, toDateKey } from '../../utils/dates';
import { shrinkImage } from '../../utils/image';
import './familyTime.css';

/** Unsere Erinnerungen: schöne Momente mit Fotos und ein paar Worten. */
export function MemoriesPage() {
  const memories = useFamilyMemories();
  const members = useMembers();
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  if (!memories || !members) return null;
  const open = memories.find((m) => m.id === openId);
  return (
    <div>
      <header className="page-head">
        <Link to="/familienzeit" className="btn btn--icon btn--ghost" aria-label="Zurück zur Familienzeit"><ArrowLeft size={22} /></Link>
        <h1>Unsere Erinnerungen</h1>
        <div className="spacer" />
        <Link to="/archiv" className="btn">🗂️ Familienarchiv</Link>
        <button type="button" className="btn btn--primary" onClick={() => setAdding(true)}><Plus size={20} aria-hidden="true" /> Neue Erinnerung</button>
      </header>
      {memories.length === 0 ? (
        <p className="card muted">Noch keine Erinnerungen. Nach dem nächsten Abenteuer einfach Fotos machen und ein paar Worte dazuschreiben.</p>
      ) : (
        <div className="ft-mem-grid">
          {memories.map((m) => {
            const photos = memoryPhotos(m);
            return (
              <button key={m.id} type="button" className="card ft-mem" onClick={() => setOpenId(m.id)}>
                <span className="ft-mem__cover">
                  {photos.length ? <img src={photos[0]} alt="" className="ft-mem__photo" /> : <span className="ft-mem__blank" aria-hidden="true">✨</span>}
                  {photos.length > 1 && <span className="ft-mem__count">{photos.length} Fotos</span>}
                </span>
                <span className="ft-mem__title">{m.title}</span>
                <span className="ft-mem__date muted">{formatLong(m.date)}</span>
              </button>
            );
          })}
        </div>
      )}
      {adding && <MemoryForm onClose={() => setAdding(false)} />}
      {open && <MemoryDetail memory={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function MemoryDetail({ memory, onClose }: { memory: FamilyMemory; onClose: () => void }) {
  const members = useMembers();
  const photos = memoryPhotos(memory);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = Math.min(index, Math.max(0, photos.length - 1));

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setError(null);
    try {
      const added = await shrinkAll(files, MAX_MEMORY_PHOTOS - photos.length);
      await setMemoryPhotos(db, memory.id, [...photos, ...added]);
      setIndex(photos.length);
    } catch (e) { setError(e instanceof Error ? e.message : 'Die Fotos gingen nicht.'); } finally { setBusy(false); }
  };
  const removeCurrent = async () => {
    if (!window.confirm('Dieses Foto aus der Erinnerung entfernen?')) return;
    await setMemoryPhotos(db, memory.id, photos.filter((_, i) => i !== current));
    setIndex(Math.max(0, current - 1));
  };

  return (
    <Modal title={memory.title} onClose={onClose} wide
      actions={<button type="button" className="btn btn--ghost" onClick={() => { if (window.confirm('Diese Erinnerung mit allen Fotos wirklich löschen?')) void deleteMemory(db, memory.id).then(onClose); }}><Trash2 size={18} aria-hidden="true" /> Erinnerung löschen</button>}
    >
      {photos.length > 0 && (
        <div className="ft-gallery">
          <img src={photos[current]} alt={`Foto ${current + 1} von ${photos.length}`} className="ft-mem-full" />
          {photos.length > 1 && (
            <>
              <button type="button" className="btn btn--icon ft-gallery__prev" aria-label="Vorheriges Foto" disabled={current === 0} onClick={() => setIndex(current - 1)}><ChevronLeft size={28} /></button>
              <button type="button" className="btn btn--icon ft-gallery__next" aria-label="Nächstes Foto" disabled={current === photos.length - 1} onClick={() => setIndex(current + 1)}><ChevronRight size={28} /></button>
            </>
          )}
          <button type="button" className="btn btn--icon btn--small ft-gallery__remove" aria-label="Dieses Foto entfernen" onClick={() => void removeCurrent()}><X size={18} /></button>
        </div>
      )}
      {photos.length > 1 && (
        <div className="ft-thumbs">
          {photos.map((p, i) => (
            <button key={i} type="button" className={`ft-thumb ${i === current ? 'is-on' : ''}`} aria-label={`Foto ${i + 1}`} onClick={() => setIndex(i)}><img src={p} alt="" /></button>
          ))}
        </div>
      )}
      <p className="muted">{formatLong(memory.date)}{photos.length ? ` · ${photos.length} ${photos.length === 1 ? 'Foto' : 'Fotos'}` : ''}</p>
      {memory.text && <p>{memory.text}</p>}
      <div className="row row--wrap">
        {memory.memberIds.map((id) => members?.find((x) => x.id === id)).filter(Boolean).map((x) => (
          <span key={x!.id} className="chip"><Avatar avatar={x!.avatar} color={x!.color} size={24} /> {x!.name}</span>
        ))}
      </div>
      {photos.length < MAX_MEMORY_PHOTOS && (
        <label className="btn ft-add-photos">
          <Camera size={18} aria-hidden="true" /> {busy ? 'Fotos werden vorbereitet …' : 'Weitere Fotos hinzufügen'}
          <input type="file" accept="image/*" multiple onChange={(e) => { void addPhotos(e.target.files); e.target.value = ''; }} />
        </label>
      )}
      {error && <p className="notice notice--error">{error}</p>}
    </Modal>
  );
}

/** Mehrere Fotos nacheinander verkleinern (nacheinander, damit das iPad nicht zu viel Speicher braucht). */
async function shrinkAll(files: FileList, room: number): Promise<string[]> {
  const out: string[] = [];
  for (const f of Array.from(files).slice(0, Math.max(0, room))) out.push(await shrinkImage(f));
  return out;
}

/** Neue Erinnerung anlegen; auch direkt nach einem Abenteuer. */
export function MemoryForm({ initial, onClose }: { initial?: Partial<Pick<FamilyMemory, 'title' | 'date' | 'source'>>; onClose: () => void }) {
  const today = toDateKey(useNow(60_000));
  const members = useMembers();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [text, setText] = useState('');
  const [date, setDate] = useState(initial?.date ?? today);
  const [photos, setPhotos] = useState<string[]>([]);
  const [who, setWho] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const everyone = members?.filter((m) => m.active).map((m) => m.id) ?? [];
  const selected = who ?? everyone;
  const room = MAX_MEMORY_PHOTOS - photos.length;

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setError(null);
    try {
      const added = await shrinkAll(files, room);
      setPhotos((p) => [...p, ...added].slice(0, MAX_MEMORY_PHOTOS));
      if (files.length > room) setError(`Es passen höchstens ${MAX_MEMORY_PHOTOS} Fotos in eine Erinnerung.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Die Fotos gingen nicht.'); } finally { setBusy(false); }
  };
  const save = async () => {
    await addMemory(db, { title, text, date, memberIds: selected, ...(photos.length ? { photos } : {}), ...(initial?.source ? { source: initial.source } : {}) });
    onClose();
  };

  return (
    <Modal title="Erinnerung festhalten" onClose={onClose} wide
      actions={<><button type="button" className="btn" onClick={onClose}>Später</button><button type="button" className="btn btn--primary" disabled={!title.trim() || busy} onClick={() => void save()}>Speichern</button></>}
    >
      <div className="stack">
        {photos.length > 0 && (
          <div className="ft-thumbs ft-thumbs--edit">
            {photos.map((p, i) => (
              <span key={i} className="ft-thumb">
                <img src={p} alt={`Foto ${i + 1}`} />
                <button type="button" className="ft-thumb__remove" aria-label={`Foto ${i + 1} entfernen`} onClick={() => setPhotos(photos.filter((_, j) => j !== i))}><X size={16} /></button>
              </span>
            ))}
          </div>
        )}
        {room > 0 && (
          <label className={`ft-photo ${photos.length ? 'ft-photo--more' : ''}`}>
            <span><Camera size={photos.length ? 24 : 36} aria-hidden="true" /><br />
              {busy ? 'Fotos werden vorbereitet …' : photos.length ? 'Weitere Fotos hinzufügen' : 'Fotos machen oder auswählen (gern mehrere)'}
            </span>
            <input type="file" accept="image/*" multiple onChange={(e) => { void pick(e.target.files); e.target.value = ''; }} />
          </label>
        )}
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
        <p className="small muted">Bis zu {MAX_MEMORY_PHOTOS} Fotos. Sie werden verkleinert, bleiben auf diesem iPad und kommen mit in die Datensicherung.</p>
      </div>
    </Modal>
  );
}

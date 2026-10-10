import { CalendarPlus, Camera, Check, X } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { Field, Toggle } from '../../components/FormControls';
import { Modal } from '../../components/Modal';
import { MEMORY_QUESTIONS } from '../../data/explorer';
import { db } from '../../database/db';
import { saveEntry, setSundayDate, setSundayStatus, sundayDate, sundayStatus, sundayToCalendar, type SundayKind } from '../../services/explorer';
import type { ChildProfile, ExplorerEntry, ExplorerModule, ExplorerSunday } from '../../types';
import { formatLong } from '../../utils/dates';
import { shrinkImage } from '../../utils/image';
import '../family-time/familyTime.css';

/** "2026-10" → "Oktober 2026" */
export function monthLabel(id: string): string {
  const [y, m] = id.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
}

/** Datum, Kalender und Erlebt für einen Sonntag. */
export function SundayControl({ m, kind, sundays, children, today }: {
  m: ExplorerModule; kind: SundayKind; sundays: ExplorerSunday[]; children: ChildProfile[]; today: string;
}) {
  const date = sundayDate(m, kind, sundays);
  const status = sundayStatus(m, kind, sundays);
  const planned = !!sundays.find((s) => s.moduleId === m.id && s.kind === kind)?.eventId;
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="ex-control">
      <div className="row row--wrap">
        <label className="ex-control__date">
          <span className="small muted">{kind === 'home' ? 'Zuhause-Sonntag' : 'Ausflugssonntag'}</span>
          <input className="input" type="date" value={date} aria-label="Datum" onChange={(e) => e.target.value && void setSundayDate(db, m, kind, e.target.value)} />
        </label>
        <button type="button" className="btn btn--small" onClick={() => void sundayToCalendar(db, m, kind, children.map((c) => c.id)).then(() => setMsg(planned ? 'Kalendertermin aktualisiert.' : 'Steht im Familienkalender.'))}>
          <CalendarPlus size={16} aria-hidden="true" /> {planned ? 'Im Kalender ✓' : 'In den Kalender'}
        </button>
      </div>
      <div className="row row--wrap">
        <button type="button" className={`btn btn--small ${status === 'done' ? 'btn--sage' : ''}`} aria-pressed={status === 'done'}
          onClick={() => void setSundayStatus(db, m.id, kind, status === 'done' ? 'open' : 'done', today)}>
          <Check size={16} aria-hidden="true" /> {status === 'done' ? 'Erlebt' : 'Haben wir erlebt'}
        </button>
        <button type="button" className={`btn btn--small btn--ghost ${status === 'skipped' ? 'is-on' : ''}`} aria-pressed={status === 'skipped'}
          onClick={() => void setSundayStatus(db, m.id, kind, status === 'skipped' ? 'open' : 'skipped', today)}>
          <X size={16} aria-hidden="true" /> {status === 'skipped' ? 'Ausgelassen' : 'Diesmal nicht'}
        </button>
        {status === 'open' && date < today && <span className="small muted">Der Termin ist vorbei. Einfach verschieben oder auslassen.</span>}
      </div>
      {msg && <p className="small">{msg}</p>}
    </div>
  );
}

const MAX_PHOTOS = 6;

/** Eine Seite im Entdeckerbuch: Foto, der Satz jedes Kindes wortwörtlich, Lieblingsmoment, neue Frage. */
export function EntryModal({ m, children, today, entry, initialKind, onClose }: {
  m: ExplorerModule; children: ChildProfile[]; today: string; entry?: ExplorerEntry; initialKind: SundayKind; onClose: () => void;
}) {
  const [kind, setKind] = useState<SundayKind>(entry?.kind ?? initialKind);
  const [date, setDate] = useState(entry?.date ?? today);
  const [photos, setPhotos] = useState<string[]>(entry?.photos ?? []);
  const [sentences, setSentences] = useState<Record<string, string>>(() => Object.fromEntries(children.map((c) => [c.id, entry?.sentences.find((s) => s.childId === c.id)?.text ?? ''])));
  const [favorite, setFavorite] = useState(entry?.favorite ?? '');
  const [remember, setRemember] = useState(entry?.remember ?? '');
  const [question, setQuestion] = useState(entry?.question ?? '');
  const [mapMarked, setMapMarked] = useState(entry?.mapMarked ?? false);
  const [timeline, setTimeline] = useState(entry?.timeline ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const room = MAX_PHOTOS - photos.length;
  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setError(null);
    try {
      const list = Array.from(files).slice(0, Math.max(0, room));
      const out: string[] = [];
      for (const f of list) out.push(await shrinkImage(f));
      setPhotos((x) => [...x, ...out]);
      if (files.length > list.length) setError(`Auf eine Seite passen höchstens ${MAX_PHOTOS} Fotos.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Die Fotos gingen nicht.'); } finally { setBusy(false); }
  };
  const hasContent = photos.length > 0 || Object.values(sentences).some((s) => s.trim()) || !!favorite.trim() || !!remember.trim() || !!question.trim();
  const save = async () => {
    setBusy(true);
    try {
      await saveEntry(db, m, {
        moduleId: m.id, kind, date, photos, sentences: children.map((c) => ({ childId: c.id, text: sentences[c.id] ?? '' })),
        ...(favorite.trim() ? { favorite: favorite.trim() } : {}), ...(remember.trim() ? { remember: remember.trim() } : {}),
        ...(question.trim() ? { question: question.trim() } : {}), mapMarked, ...(timeline.trim() ? { timeline: timeline.trim() } : {}),
      }, children.map((c) => c.id), entry?.id);
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : 'Das Speichern ging nicht.'); setBusy(false); }
  };
  return (
    <Modal title={`Entdeckerbuch: ${m.title}`} onClose={onClose} wide actions={
      <><button type="button" className="btn btn--ghost" onClick={onClose}>Abbrechen</button>
        <button type="button" className="btn btn--primary" disabled={busy || !hasContent} onClick={() => void save()}>Seite speichern</button></>
    }>
      <div className="stack">
        <p className="small muted">{m.book}</p>
        <div className="row row--wrap">
          <div className="seg" role="group" aria-label="Welcher Sonntag">
            <button type="button" className="seg__item" aria-pressed={kind === 'home'} onClick={() => setKind('home')}>🏠 Zuhause</button>
            <button type="button" className="seg__item" aria-pressed={kind === 'trip'} onClick={() => setKind('trip')}>🚗 {m.trip.place}</button>
          </div>
          <input className="input" type="date" max={today} value={date} aria-label="Datum" style={{ width: 170 }} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </div>
        <div className="ex-ask">
          <span className="small muted">Eine Erinnerungsfrage:</span>
          {MEMORY_QUESTIONS.map((q) => <span key={q} className="chip">{q}</span>)}
        </div>
        {children.map((c) => (
          <label key={c.id} className={`ex-sentence tone-${c.color}`}>
            <Avatar avatar={c.avatar} color={c.color} size={40} />
            <input className="input" value={sentences[c.id] ?? ''} placeholder={`${c.name} sagt … (wortwörtlich)`} aria-label={`Satz von ${c.name}`}
              onChange={(e) => setSentences({ ...sentences, [c.id]: e.target.value })} />
          </label>
        ))}
        <div className="form-grid">
          <Field label="Unser Lieblingsmoment"><input className="input" value={favorite} onChange={(e) => setFavorite(e.target.value)} /></Field>
          <Field label="Das möchten wir uns merken"><input className="input" value={remember} onChange={(e) => setRemember(e.target.value)} /></Field>
          <Field label="Neue Frage" hint="Kommt ins Frageglas"><input className="input" value={question} onChange={(e) => setQuestion(e.target.value)} /></Field>
          <Field label="Auf die Zeitlinie gehört es bei"><input className="input" value={timeline} placeholder="z. B. Dinosaurier" onChange={(e) => setTimeline(e.target.value)} /></Field>
        </div>
        <Toggle checked={mapMarked} onChange={setMapMarked} label="Ort auf der Karte markiert" />
        {photos.length > 0 && (
          <div className="ft-thumbs ft-thumbs--edit">
            {photos.map((ph, i) => (
              <div key={i} className="ft-thumb"><img src={ph} alt="" />
                <button type="button" className="ft-thumb__remove" aria-label="Foto entfernen" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}>×</button></div>
            ))}
          </div>
        )}
        {room > 0 && (
          <label className="btn ft-add-photos"><Camera size={18} aria-hidden="true" /> {busy ? 'Fotos werden verkleinert …' : 'Foto, Ticket oder Zeichnung'}
            <input type="file" accept="image/*" multiple onChange={(e) => { void addPhotos(e.target.files); e.target.value = ''; }} /></label>
        )}
        {error && <p className="notice notice--error">{error}</p>}
        <p className="small muted">Das Entdeckerbuch dokumentiert, es bewertet nicht. Die Seite erscheint auch bei euren Erinnerungen.</p>
      </div>
    </Modal>
  );
}

export function EntryCard({ entry, children, onEdit }: { entry: ExplorerEntry; children: ChildProfile[]; onEdit: () => void }) {
  return (
    <button type="button" className="ex-entry" onClick={onEdit}>
      {entry.photos[0] && <img src={entry.photos[0]} alt="" className="ex-entry__photo" />}
      <span className="ex-entry__text">
        <span className="small muted">{entry.kind === 'home' ? '🏠 Zuhause' : '🚗 Ausflug'} · {formatLong(entry.date)}</span>
        {entry.sentences.map((s) => {
          const c = children.find((x) => x.id === s.childId);
          return <span key={s.childId}><strong>{c?.name ?? 'Kind'}:</strong> „{s.text}“</span>;
        })}
        {entry.favorite && <span>Lieblingsmoment: {entry.favorite}</span>}
      </span>
    </button>
  );
}

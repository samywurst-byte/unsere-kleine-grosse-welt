import { ArrowLeft, Check, Heart, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Field, Toggle } from '../../components/FormControls';
import { Modal } from '../../components/Modal';
import { RITUAL_BY_ID, type RitualIdea } from '../../data/rituals';
import { db } from '../../database/db';
import { useRitualFavorites, useRituals } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { deleteRitual, planRitual, preparationDue, saveRitual, seasonalRituals, setFavorite } from '../../services/rituals';
import type { FamilyRitual } from '../../types';
import { formatLong, toDateKey } from '../../utils/dates';
import { MemoryForm } from './MemoriesPage';
import './familyTime.css';

export const ritualLeadDays = (ritualId: string) => RITUAL_BY_ID.get(ritualId)?.leadDays ?? 1;

/** Jahreszeitenrituale: schöne Ideen zur Jahreszeit, eure Favoriten kommen jedes Jahr wieder. Kein Pflichtkalender. */
export function RitualsPage() {
  const today = toDateKey(useNow(60_000));
  const rituals = useRituals();
  const favorites = useRitualFavorites();
  const [planning, setPlanning] = useState<Pick<RitualIdea, 'id' | 'title' | 'emoji' | 'materials'> | null>(null);
  const [memoryFor, setMemoryFor] = useState<FamilyRitual | null>(null);
  const [own, setOwn] = useState('');
  if (!rituals || !favorites) return null;

  const planned = rituals.filter((r) => r.status === 'planned').sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'));
  const done = rituals.filter((r) => r.status === 'done').sort((a, b) => (b.date ?? b.createdAt).localeCompare(a.date ?? a.createdAt)).slice(0, 8);
  const due = new Set(preparationDue(rituals, today, ritualLeadDays).map((r) => r.id));
  const fav = new Set(favorites.map((f) => f.id));
  const ideas = seasonalRituals(today, favorites);

  return (
    <div>
      <header className="page-head">
        <Link to="/familienzeit" className="btn btn--icon btn--ghost" aria-label="Zurück zur Familienzeit"><ArrowLeft size={22} /></Link>
        <h1>Jahreszeitenrituale</h1>
      </header>
      <div className="stack">
        {planned.length > 0 && (
          <section className="card">
            <h2 className="card__title">Das haben wir vor</h2>
            <div className="stack">
              {planned.map((r) => (
                <div key={r.id} className={`ft-ritual ${due.has(r.id) ? 'ft-ritual--due' : ''}`}>
                  <p className="ft-adv-title"><span aria-hidden="true">{r.emoji}</span> {r.title}</p>
                  <p className="muted ft-card__lead">{r.date ? formatLong(r.date) : 'Noch ohne Tag'}{due.has(r.id) ? ' · Jetzt Material besorgen' : ''}</p>
                  {r.note && <p className="small">{r.note}</p>}
                  {r.materials.length > 0 && (
                    <div className="ft-pack-checks">
                      {r.materials.map((m) => (
                        <button key={m.id} type="button" className={`ft-pack-check ${m.done ? 'is-done' : ''}`} aria-pressed={m.done}
                          onClick={() => void saveRitual(db, { ...r, materials: r.materials.map((x) => (x.id === m.id ? { ...x, done: !x.done } : x)) })}>
                          <span className="ft-pack-check__box" aria-hidden="true">{m.done && <Check size={20} strokeWidth={3} />}</span>{m.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="row row--wrap ft-actions">
                    <button type="button" className="btn btn--sage" onClick={() => void saveRitual(db, { ...r, status: 'done', date: r.date && r.date <= today ? r.date : today }).then(() => setMemoryFor(r))}>
                      <Check size={18} aria-hidden="true" /> Haben wir gemacht!
                    </button>
                    <button type="button" className="btn btn--ghost" onClick={() => void deleteRitual(db, r.id)}><Trash2 size={16} aria-hidden="true" /> Doch nicht</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="card">
          <h2 className="card__title">Passt gerade zur Jahreszeit</h2>
          <p className="muted ft-card__lead">Antippen zum Planen. Mit dem Herz wird ein Ritual euer Favorit und steht jedes Jahr wieder oben.</p>
          <div className="ft-picks">
            {ideas.map((i) => (
              <div key={i.id} className="ft-pick ft-pick--ritual">
                <button type="button" className="ft-pick__main" onClick={() => setPlanning(i)}>
                  <span className="ft-pick__emoji" aria-hidden="true">{i.emoji}</span><span>{i.title}</span>
                </button>
                <button type="button" className={`ft-fav ${fav.has(i.id) ? 'is-on' : ''}`} aria-pressed={fav.has(i.id)} aria-label={`${i.title} als Favorit`}
                  onClick={() => void setFavorite(db, i.id, !fav.has(i.id), favorites.find((f) => f.id === i.id)?.note)}>
                  <Heart size={20} fill={fav.has(i.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
            ))}
          </div>
          <div className="row ft-own">
            <input className="input" placeholder="Eigene Idee, z. B. Apfelkuchen mit Oma" value={own} onChange={(e) => setOwn(e.target.value)} aria-label="Eigene Idee" />
            <button type="button" className="btn" disabled={!own.trim()} onClick={() => { setPlanning({ id: 'own', title: own.trim(), emoji: '✨', materials: [] }); setOwn(''); }}>Planen</button>
          </div>
        </section>

        {done.length > 0 && (
          <section className="card">
            <h2 className="card__title">Schon gemacht</h2>
            <ul className="list">
              {done.map((r) => (
                <li key={r.id} className="list-item">
                  <span className="ft-hist__emoji" aria-hidden="true">{r.emoji}</span>
                  <div className="list-item__main"><p className="list-item__title">{r.title}</p><p className="list-item__meta">{r.date ? formatLong(r.date) : ''}</p></div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {planning && <PlanModal idea={planning} today={today} favoriteNote={favorites.find((f) => f.id === planning.id)?.note} isFavorite={fav.has(planning.id)} onClose={() => setPlanning(null)} />}
      {memoryFor && <MemoryForm initial={{ title: memoryFor.title, date: memoryFor.date && memoryFor.date <= today ? memoryFor.date : today }} onClose={() => setMemoryFor(null)} />}
    </div>
  );
}

function PlanModal({ idea, today, favoriteNote, isFavorite, onClose }: {
  idea: Pick<RitualIdea, 'id' | 'title' | 'emoji' | 'materials'>; today: string; favoriteNote?: string; isFavorite: boolean; onClose: () => void;
}) {
  const [date, setDate] = useState('');
  const [materials, setMaterials] = useState(idea.materials);
  const [item, setItem] = useState('');
  const [note, setNote] = useState(favoriteNote ?? '');
  const [favorite, setFav] = useState(isFavorite);
  const hint = RITUAL_BY_ID.get(idea.id)?.hint;
  const add = () => { if (item.trim()) { setMaterials([...materials, item.trim()]); setItem(''); } };
  const save = async () => {
    await planRitual(db, { ...idea, materials }, date || undefined, note);
    if (idea.id !== 'own' && (favorite || isFavorite)) await setFavorite(db, idea.id, favorite, note);
    onClose();
  };
  return (
    <Modal title={`${idea.emoji} ${idea.title}`} onClose={onClose}
      actions={<><button type="button" className="btn" onClick={onClose}>Abbrechen</button><button type="button" className="btn btn--primary" onClick={() => void save()}>Planen</button></>}
    >
      <div className="stack">
        {hint && <p className="muted">{hint}</p>}
        <Field label="Wann? (optional)"><input className="input" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <div>
          <h3 className="ft-sub">Material</h3>
          <ul className="ft-packing">
            {materials.map((m, i) => (
              <li key={`${m}-${i}`}><span>{m}</span>
                <button type="button" className="btn btn--icon btn--ghost" aria-label={`${m} entfernen`} onClick={() => setMaterials(materials.filter((_, j) => j !== i))}><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>
          <div className="row">
            <input className="input" value={item} placeholder="Noch etwas" aria-label="Material ergänzen" onChange={(e) => setItem(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
            <button type="button" className="btn btn--icon" aria-label="Hinzufügen" disabled={!item.trim()} onClick={add}><Plus size={20} /></button>
          </div>
        </div>
        <Field label="Notiz, z. B. euer Rezept"><textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        {idea.id !== 'own' && <Toggle label="Jedes Jahr wieder (Favorit, Notiz wird gemerkt)" checked={favorite} onChange={setFav} />}
      </div>
    </Modal>
  );
}

import { ArrowLeft, Check, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Field } from '../../components/FormControls';
import { Modal } from '../../components/Modal';
import { db } from '../../database/db';
import { useWeekendAdventures } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import {
  ADVENTURE_STATUS_LABEL, adventureView, draftAdventure, resetAdventure, saveAdventure, setAdventureStatus, suggestIdeas, weekendDays, weekendOf,
} from '../../services/familyTime';
import type { WeekendAdventure } from '../../types';
import { formatDayMonth, formatWeekdayShort, toDateKey } from '../../utils/dates';
import { newId } from '../../utils/id';
import { AdventureSummary } from './AdventureSummary';
import { MemoryForm } from './MemoriesPage';
import './familyTime.css';

/** Wochenendabenteuer planen und festhalten. Geplant gilt nie automatisch als gemacht. */
export function AdventurePage() {
  const now = useNow(30_000);
  const today = toDateKey(now);
  const weekend = weekendOf(today);
  const adventures = useWeekendAdventures();
  const [editing, setEditing] = useState(false);
  const [reasonFor, setReasonFor] = useState<'postponed' | 'cancelled' | null>(null);
  const [memoryOpen, setMemoryOpen] = useState(false);
  if (!adventures) return null;
  const current = adventures.find((a) => a.id === weekend);
  const view = adventureView(now, current);
  const history = adventures.filter((a) => a.id !== weekend).slice(0, 6);

  return (
    <div>
      <header className="page-head">
        <Link to="/familienzeit" className="btn btn--icon btn--ghost" aria-label="Zurück zur Familienzeit"><ArrowLeft size={22} /></Link>
        <h1>Unser Wochenendabenteuer</h1>
      </header>
      <div className="stack">
        {!current || editing ? (
          <Planner
            weekend={weekend} today={today} history={adventures} existing={current}
            onDone={() => setEditing(false)} onCancel={current ? () => setEditing(false) : undefined}
          />
        ) : (
          <section className="card tone-sage ft-adv">
            <p className="card__eyebrow">Wochenende ab {formatDayMonth(weekend)} · {ADVENTURE_STATUS_LABEL[current.status]}</p>
            <AdventureSummary now={now} adventure={current} />
            {current.status === 'planned' && <PackingList adventure={current} />}
            {current.prep && current.status === 'planned' && <p className="ft-prep">Vorbereiten: <strong>{current.prep}</strong></p>}
            <div className="row row--wrap ft-actions">
              {current.status === 'planned' && (
                <>
                  <button type="button" className="btn btn--primary btn--large" onClick={() => void setAdventureStatus(db, current.id, 'done').then(() => setMemoryOpen(true))}>
                    <Check size={22} aria-hidden="true" /> Haben wir gemacht!
                  </button>
                  <button type="button" className="btn" onClick={() => setEditing(true)}>Anders planen</button>
                  <button type="button" className="btn" onClick={() => setReasonFor('postponed')}>Verschieben</button>
                  <button type="button" className="btn btn--ghost" onClick={() => setReasonFor('cancelled')}>Fällt diesmal aus</button>
                </>
              )}
              {current.status === 'done' && (
                <button type="button" className="btn btn--sage" onClick={() => setMemoryOpen(true)}>Erinnerung festhalten</button>
              )}
              {current.status !== 'planned' && (
                <button type="button" className="btn btn--ghost" onClick={() => void setAdventureStatus(db, current.id, 'planned')}>Doch noch offen</button>
              )}
            </div>
          </section>
        )}

        {view === 'later' && !current && <p className="muted small">Ihr könnt schon unter der Woche planen. Ab Freitagmittag erscheint das Abenteuer auch auf dem Heute-Bildschirm.</p>}

        {history.length > 0 && (
          <section className="card">
            <h2 className="card__title">Die letzten Wochenenden</h2>
            <ul className="list">
              {history.map((a) => (
                <li key={a.id} className="list-item">
                  <span className="ft-hist__emoji" aria-hidden="true">{a.emoji}</span>
                  <div className="list-item__main">
                    <p className="list-item__title">{a.title}</p>
                    <p className="list-item__meta">ab {formatDayMonth(a.weekend)} · {ADVENTURE_STATUS_LABEL[a.status]}{a.reason ? ` · ${a.reason}` : ''}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {reasonFor && current && (
        <ReasonModal
          kind={reasonFor} onClose={() => setReasonFor(null)}
          onSave={(reason) => void setAdventureStatus(db, current.id, reasonFor, reason).then(() => setReasonFor(null))}
        />
      )}
      {memoryOpen && current && (
        <MemoryForm
          initial={{ title: current.title, date: current.day && current.day <= today ? current.day : today, source: { kind: 'adventure', id: current.id } }}
          onClose={() => setMemoryOpen(false)}
        />
      )}
    </div>
  );
}

function Planner({ weekend, today, history, existing, onDone, onCancel }: {
  weekend: string; today: string; history: WeekendAdventure[]; existing?: WeekendAdventure; onDone: () => void; onCancel?: () => void;
}) {
  const ideas = suggestIdeas(today, history, 8);
  const [draft, setDraft] = useState<WeekendAdventure | null>(existing ?? null);
  const [own, setOwn] = useState('');
  const [item, setItem] = useState('');
  const days = weekendDays(weekend).filter((d) => d >= today);

  const save = async () => {
    if (!draft) return;
    await saveAdventure(db, { ...draft, status: 'planned' });
    onDone();
  };

  return (
    <section className="card">
      <h2 className="card__title">Wohin geht es am Wochenende?</h2>
      <div className="ft-picks">
        {ideas.map((i) => (
          <button
            key={i.id} type="button" className={`ft-pick ${draft?.ideaId === i.id ? 'ft-pick--on' : ''}`} aria-pressed={draft?.ideaId === i.id}
            onClick={() => setDraft((d) => ({ ...draftAdventure(weekend, i), day: d?.day, time: d?.time }))}
          >
            <span className="ft-pick__emoji" aria-hidden="true">{i.emoji}</span>
            <span>{i.title}</span>
          </button>
        ))}
      </div>
      <div className="row ft-own">
        <input className="input" placeholder="Eigene Idee, z. B. Enten füttern" value={own} onChange={(e) => setOwn(e.target.value)} aria-label="Eigene Idee" />
        <button type="button" className="btn" disabled={!own.trim()} onClick={() => { setDraft((d) => ({ ...draftAdventure(weekend, { title: own.trim(), emoji: '🌿', packing: [] }), day: d?.day, time: d?.time })); setOwn(''); }}>Übernehmen</button>
      </div>

      {draft && (
        <div className="stack ft-plan">
          <p className="ft-adv-title"><span aria-hidden="true">{draft.emoji}</span> {draft.title}</p>
          <div className="row row--wrap">
            <div className="seg" role="group" aria-label="Tag">
              {days.map((d) => (
                <button key={d} type="button" className="seg__item" aria-pressed={draft.day === d} onClick={() => setDraft({ ...draft, day: draft.day === d ? undefined : d })}>
                  {formatWeekdayShort(d)} {formatDayMonth(d)}
                </button>
              ))}
            </div>
            <Field label="Uhrzeit">
              <input className="input" type="time" value={draft.time ?? ''} onChange={(e) => setDraft({ ...draft, time: e.target.value || undefined })} />
            </Field>
          </div>
          <div>
            <h3 className="ft-sub">Packliste</h3>
            <ul className="ft-packing">
              {draft.packing.map((p) => (
                <li key={p.id}>
                  <span>{p.label}</span>
                  <button type="button" className="btn btn--icon btn--ghost" aria-label={`${p.label} entfernen`} onClick={() => setDraft({ ...draft, packing: draft.packing.filter((x) => x.id !== p.id) })}><Trash2 size={18} /></button>
                </li>
              ))}
            </ul>
            <div className="row">
              <input className="input" placeholder="Noch etwas einpacken" value={item} onChange={(e) => setItem(e.target.value)} aria-label="Packliste ergänzen"
                onKeyDown={(e) => { if (e.key === 'Enter' && item.trim()) { setDraft({ ...draft, packing: [...draft.packing, { id: newId('pack'), label: item.trim(), done: false }] }); setItem(''); } }} />
              <button type="button" className="btn btn--icon" aria-label="Hinzufügen" disabled={!item.trim()}
                onClick={() => { setDraft({ ...draft, packing: [...draft.packing, { id: newId('pack'), label: item.trim(), done: false }] }); setItem(''); }}><Plus size={20} /></button>
            </div>
          </div>
          <Field label="Besondere Vorbereitung (optional)">
            <input className="input" value={draft.prep ?? ''} placeholder="z. B. Kakao kochen" onChange={(e) => setDraft({ ...draft, prep: e.target.value || undefined })} />
          </Field>
        </div>
      )}

      <div className="row" style={{ marginTop: 'var(--space-4)' }}>
        <button type="button" className="btn btn--primary" disabled={!draft} onClick={() => void save()}><Check size={18} aria-hidden="true" /> So machen wir's</button>
        {onCancel && <button type="button" className="btn" onClick={onCancel}>Abbrechen</button>}
        {existing && <button type="button" className="btn btn--ghost" onClick={() => void resetAdventure(db, existing.id).then(onDone)}>Ganz neu planen</button>}
      </div>
    </section>
  );
}

function PackingList({ adventure }: { adventure: WeekendAdventure }) {
  if (!adventure.packing.length) return null;
  const toggle = (id: string) => void saveAdventure(db, { ...adventure, packing: adventure.packing.map((p) => (p.id === id ? { ...p, done: !p.done } : p)) });
  return (
    <div>
      <h3 className="ft-sub">Das packen wir ein</h3>
      <div className="ft-pack-checks">
        {adventure.packing.map((p) => (
          <button key={p.id} type="button" className={`ft-pack-check ${p.done ? 'is-done' : ''}`} aria-pressed={p.done} onClick={() => toggle(p.id)}>
            <span className="ft-pack-check__box" aria-hidden="true">{p.done && <Check size={20} strokeWidth={3} />}</span>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReasonModal({ kind, onClose, onSave }: { kind: 'postponed' | 'cancelled'; onClose: () => void; onSave: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const presets = ['Jemand ist krank', 'Das Wetter passt gar nicht', 'Wir hatten Besuch', 'Zu viel los'];
  return (
    <Modal
      title={kind === 'postponed' ? 'Abenteuer verschieben' : 'Fällt diesmal aus'} onClose={onClose}
      actions={<><button type="button" className="btn" onClick={onClose}>Abbrechen</button><button type="button" className="btn btn--primary" onClick={() => onSave(reason)}>Speichern</button></>}
    >
      <p className="muted">Das ist in Ordnung. Niemand verliert etwas. {kind === 'postponed' ? 'Nächstes Wochenende schlagen wir die Idee wieder vor.' : ''}</p>
      <div className="row row--wrap">
        {presets.map((p) => <button key={p} type="button" className="seg__item" aria-pressed={reason === p} onClick={() => setReason(p)}>{p}</button>)}
      </div>
      <Field label="Begründung (optional)">
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
    </Modal>
  );
}


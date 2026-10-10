import { ArrowLeft, CalendarPlus, Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Field } from '../../components/FormControls';
import { Modal } from '../../components/Modal';
import { DEFAULT_COUNCIL_AGENDA } from '../../data/familyTime';
import { db } from '../../database/db';
import { useCouncilNote, useMembers, useOccurrences, useSettings, useWeekendAdventures } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import {
  addDecision, councilAgenda, councilDate, decisionToEvent, draftAdventure, saveAdventure, saveCouncilAgenda, suggestIdeas, updateCouncil, weekendOf,
} from '../../services/familyTime';
import type { CouncilDecision, FamilyCouncilNote, Member } from '../../types';
import { addDaysKey, formatDayMonth, formatWeekday, formatWeekdayShort, toDateKey } from '../../utils/dates';
import './familyTime.css';

type ItemKind = 'highlights' | 'events' | 'adventure' | 'meals' | 'notes';

/** Welche Hilfe ein Tagesordnungspunkt bekommt; erkannt am Titel, damit eigene Punkte einfach Notizen sind. */
function itemKind(title: string): ItemKind {
  const t = title.toLowerCase();
  if (t.includes('erlebnis') || t.includes('schönst')) return 'highlights';
  if (t.includes('termin')) return 'events';
  if (t.includes('abenteuer')) return 'adventure';
  if (t.includes('essen') || t.includes('einkauf')) return 'meals';
  return 'notes';
}

/** Familienrat am Sonntag: eine kurze Runde, Punkt für Punkt, ungefähr 15 Minuten. */
export function CouncilPage() {
  const today = toDateKey(useNow(60_000));
  const date = councilDate(today);
  const settings = useSettings();
  const note = useCouncilNote(date);
  const members = useMembers();
  const [editAgenda, setEditAgenda] = useState(false);
  if (!settings || note === undefined || !members) return null;
  const agenda = councilAgenda(settings);
  const current: FamilyCouncilNote = note ?? { id: date, date };
  const change = (fn: (n: FamilyCouncilNote) => FamilyCouncilNote) => void updateCouncil(db, date, fn);
  const toggleDone = (i: number) => change((n) => {
    const done = new Set(n.doneItems ?? []);
    if (done.has(i)) done.delete(i); else done.add(i);
    return { ...n, doneItems: [...done].sort((a, b) => a - b) };
  });

  return (
    <div>
      <header className="page-head">
        <Link to="/familienzeit" className="btn btn--icon btn--ghost" aria-label="Zurück zur Familienzeit"><ArrowLeft size={22} /></Link>
        <h1>Unser Familienrat</h1>
        <span className="muted">Sonntag, {formatDayMonth(date)}</span>
        <div className="spacer" />
        <button type="button" className="btn btn--small" onClick={() => setEditAgenda(true)}><Pencil size={16} aria-hidden="true" /> Tagesordnung</button>
      </header>
      <p className="muted" style={{ marginTop: 0 }}>Die Kinder müssen nicht die ganze Zeit still sitzen. Abhaken, was besprochen ist; der Rest darf auch warten.</p>

      <ol className="ft-council">
        {agenda.map((title, i) => {
          const done = current.doneItems?.includes(i) ?? false;
          return (
            <li key={`${i}-${title}`} className={`card ft-item ${done ? 'is-done' : ''}`}>
              <div className="ft-item__head">
                <span className="ft-item__num" aria-hidden="true">{i + 1}</span>
                <h2 className="ft-item__title">{title}</h2>
                <button type="button" className={`btn btn--small ${done ? 'btn--sage' : ''}`} aria-pressed={done} onClick={() => toggleDone(i)}>
                  <Check size={16} aria-hidden="true" /> {done ? 'Besprochen' : 'Abhaken'}
                </button>
              </div>
              <ItemBody kind={itemKind(title)} itemKey={String(i)} note={current} date={date} members={members} today={today} change={change} />
            </li>
          );
        })}
      </ol>

      <Decisions note={current} date={date} change={change} />

      {editAgenda && <AgendaModal agenda={agenda} onClose={() => setEditAgenda(false)} />}
    </div>
  );
}

function ItemBody({ kind, itemKey, note, date, members, today, change }: {
  kind: ItemKind; itemKey: string; note: FamilyCouncilNote; date: string; members: Member[]; today: string;
  change: (fn: (n: FamilyCouncilNote) => FamilyCouncilNote) => void;
}) {
  const notes = (
    <DraftText
      multiline label="Notizen" value={note.notes?.[itemKey] ?? ''}
      placeholder={kind === 'meals' ? 'Wünsche notieren. Der Essensplan kommt in einem späteren Paket.' : 'Notizen'}
      onSave={(v) => change((n) => ({ ...n, notes: { ...n.notes, [itemKey]: v } }))}
    />
  );
  if (kind === 'highlights') {
    return (
      <div className="ft-highlights">
        {members.filter((m) => m.active).map((m) => (
          <label key={m.id} className="ft-highlight">
            <Avatar avatar={m.avatar} color={m.color} size={40} />
            <DraftText
              label={`Schönstes Erlebnis ${m.name}`} placeholder={`Was war für ${m.name} am schönsten?`} value={note.highlights?.[m.id] ?? ''}
              onSave={(v) => change((n) => ({ ...n, highlights: { ...n.highlights, [m.id]: v } }))}
            />
          </label>
        ))}
      </div>
    );
  }
  if (kind === 'events') return <><NextWeekEvents from={addDaysKey(date, 1)} />{notes}</>;
  if (kind === 'adventure') return <><NextAdventure council={date} today={today} />{notes}</>;
  return notes;
}

/** Textfeld mit eigenem Zwischenstand: speichert nach kurzer Tipppause und beim Verlassen, damit beim schnellen Tippen nichts verloren geht. */
function DraftText({ value, onSave, label, placeholder, multiline }: { value: string; onSave: (v: string) => void; label: string; placeholder?: string; multiline?: boolean }) {
  const [draft, setDraft] = useState(value);
  const timer = useRef<number | undefined>(undefined);
  const dirty = useRef(false);
  useEffect(() => { if (!dirty.current) setDraft(value); }, [value]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const flush = (v: string) => { window.clearTimeout(timer.current); dirty.current = false; if (v !== value) onSave(v); };
  const onChange = (v: string) => {
    setDraft(v); dirty.current = true;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => flush(v), 600);
  };
  const props = { className: 'input', value: draft, placeholder, 'aria-label': label, onBlur: () => flush(draft) };
  return multiline
    ? <textarea {...props} rows={2} onChange={(e) => onChange(e.target.value)} />
    : <input {...props} onChange={(e) => onChange(e.target.value)} />;
}

function NextWeekEvents({ from }: { from: string }) {
  const to = addDaysKey(from, 6);
  const occ = useOccurrences(from, to);
  if (!occ) return null;
  const list = occ.filter((o) => o.event.category !== 'holiday' || o.date === from).sort((a, b) => (a.date + (a.startTime ?? '')).localeCompare(b.date + (b.startTime ?? '')));
  if (!list.length) return <p className="muted">Nächste Woche stehen noch keine Termine im Kalender.</p>;
  return (
    <ul className="ft-events">
      {list.map((o) => (
        <li key={o.key}><strong>{formatWeekdayShort(o.date)} {formatDayMonth(o.date)}</strong>{o.startTime ? ` · ${o.startTime}` : ''} · {o.event.title}</li>
      ))}
    </ul>
  );
}

function NextAdventure({ council, today }: { council: string; today: string }) {
  const adventures = useWeekendAdventures();
  if (!adventures) return null;
  const weekend = weekendOf(addDaysKey(council, 1));
  const planned = adventures.find((a) => a.id === weekend);
  if (planned) {
    return <p>Für das Wochenende ab {formatDayMonth(weekend)}: <strong>{planned.emoji} {planned.title}</strong>{planned.day ? `, ${formatWeekday(planned.day)}` : ''}. <Link to="/familienzeit/abenteuer">Ansehen</Link></p>;
  }
  return (
    <>
      <p className="muted">Was machen wir am nächsten Wochenende? Tippt eine Idee an; Tag und Uhrzeit könnt ihr am Freitag festlegen.</p>
      <div className="ft-picks ft-picks--small">
        {suggestIdeas(addDaysKey(council, 1), adventures, 6).map((i) => (
          <button key={i.id} type="button" className="ft-pick" onClick={() => void saveAdventure(db, draftAdventure(weekend, i))}>
            <span className="ft-pick__emoji" aria-hidden="true">{i.emoji}</span><span>{i.title}</span>
          </button>
        ))}
      </div>
      {today > council && <p className="small muted">Der Familienrat ist schon vorbei; die Wahl gilt für das kommende Wochenende.</p>}
    </>
  );
}

function Decisions({ note, date, change }: { note: FamilyCouncilNote; date: string; change: (fn: (n: FamilyCouncilNote) => FamilyCouncilNote) => void }) {
  const [text, setText] = useState('');
  const [toEvent, setToEvent] = useState<CouncilDecision | null>(null);
  const decisions = note.decisions ?? [];
  const add = () => { if (!text.trim()) return; change((n) => addDecision(n, text)); setText(''); };
  return (
    <section className="card">
      <h2 className="card__title">Das haben wir beschlossen</h2>
      {decisions.length > 0 && (
        <ul className="list">
          {decisions.map((d) => (
            <li key={d.id} className="list-item">
              <div className="list-item__main"><p className="list-item__title">{d.text}</p>{d.eventId && <p className="list-item__meta">Steht im Kalender</p>}</div>
              {!d.eventId && <button type="button" className="btn btn--small" onClick={() => setToEvent(d)}><CalendarPlus size={16} aria-hidden="true" /> Als Termin</button>}
              <button type="button" className="btn btn--icon btn--ghost" aria-label="Beschluss löschen" onClick={() => change((n) => ({ ...n, decisions: (n.decisions ?? []).filter((x) => x.id !== d.id) }))}><Trash2 size={18} /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="row ft-decide-row">
        <input className="input" value={text} placeholder="z. B. Samstag Oma besuchen" aria-label="Neuer Beschluss" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
        <button type="button" className="btn" disabled={!text.trim()} onClick={add}><Plus size={18} aria-hidden="true" /> Dazu</button>
      </div>
      {toEvent && <EventModal decision={toEvent} council={date} onClose={() => setToEvent(null)} />}
    </section>
  );
}

function EventModal({ decision, council, onClose }: { decision: CouncilDecision; council: string; onClose: () => void }) {
  const [title, setTitle] = useState(decision.text);
  const [date, setDate] = useState(addDaysKey(council, 1));
  const [time, setTime] = useState('');
  return (
    <Modal title="Als Termin eintragen" onClose={onClose}
      actions={<><button type="button" className="btn" onClick={onClose}>Abbrechen</button><button type="button" className="btn btn--primary" disabled={!title.trim()} onClick={() => void decisionToEvent(db, council, decision, { title, date, time: time || undefined }).then(onClose)}>Eintragen</button></>}
    >
      <div className="stack">
        <Field label="Titel"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <div className="row row--wrap">
          <Field label="Datum"><input className="input" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} /></Field>
          <Field label="Uhrzeit (optional)"><input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
        </div>
      </div>
    </Modal>
  );
}

function AgendaModal({ agenda, onClose }: { agenda: string[]; onClose: () => void }) {
  const [text, setText] = useState(agenda.join('\n'));
  return (
    <Modal title="Tagesordnung bearbeiten" onClose={onClose}
      actions={<>
        <button type="button" className="btn btn--ghost" onClick={() => setText(DEFAULT_COUNCIL_AGENDA.join('\n'))}>Standard</button>
        <button type="button" className="btn" onClick={onClose}>Abbrechen</button>
        <button type="button" className="btn btn--primary" onClick={() => void saveCouncilAgenda(db, text.split('\n')).then(onClose)}>Speichern</button>
      </>}
    >
      <Field label="Ein Punkt pro Zeile" hint="Punkte mit „Erlebnis“, „Termine“ oder „Abenteuer“ im Namen bekommen ihre Hilfen automatisch, alle anderen ein Notizfeld.">
        <textarea className="input" rows={8} value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
    </Modal>
  );
}

import { ArrowLeft, CalendarPlus, Camera, Check, Pause, Play, Plus, Printer, RefreshCw, ShoppingCart, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Field, Toggle } from '../../components/FormControls';
import { Modal } from '../../components/Modal';
import { AREA_LABEL, LEVEL_LABEL, PHASES, PROJECT_IDEA_BY_ID } from '../../data/projects';
import { db } from '../../database/db';
import { useAllLearning, useChildren, useProjects } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { goalStates } from '../../services/learning';
import {
  currentPhase, finishProject, formatEuro, knownLetters, materialsToShopping, moneySummary, parseEuro, projectDateToCalendar, projectPhotos,
  refreshTasks, updateProject,
} from '../../services/projects';
import type { ChildProfile, FamilyProject, ProjectDate, ProjectPhase } from '../../types';
import { formatLong, toDateKey } from '../../utils/dates';
import { newId } from '../../utils/id';
import { shrinkImage } from '../../utils/image';
import '../family-time/familyTime.css';
import './projects.css';

export const MAX_PROJECT_PHOTOS = 30;

export function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const today = toDateKey(useNow(60_000));
  const projects = useProjects();
  const children = useChildren();
  const [finishing, setFinishing] = useState(false);
  const [entry, setEntry] = useState(false);
  if (!projects || !children) return null;
  const p = projects.find((x) => x.id === projectId);
  if (!p) return <p className="empty">Dieses Projekt gibt es nicht mehr. <Link to="/projekte">Zur Projektwerkstatt</Link></p>;

  const change = (fn: (x: FamilyProject) => FamilyProject) => void updateProject(db, p.id, fn);
  const idea = PROJECT_IDEA_BY_ID.get(p.ideaId);
  const kids = p.childIds.map((id) => children.find((c) => c.id === id)).filter((c): c is ChildProfile => !!c);
  const done = p.status === 'done';
  const remove = async () => {
    if (!window.confirm(`Projekt „${p.title}“ mit Tagebuch und Fotos löschen? Termine im Kalender bleiben stehen.`)) return;
    await db.projects.delete(p.id);
    navigate('/projekte');
  };

  return (
    <div>
      <header className="page-head">
        <Link to="/projekte" className="btn btn--icon btn--ghost" aria-label="Zurück zur Projektwerkstatt"><ArrowLeft size={22} /></Link>
        <h1><span aria-hidden="true">{p.emoji}</span> {p.title}</h1>
        {p.status === 'paused' && <span className="chip">pausiert</span>}
        {done && <span className="chip">abgeschlossen{p.doneAt ? ` am ${formatLong(p.doneAt)}` : ''}</span>}
        <div className="spacer" />
        <PrintButton project={p} kids={kids} />
        {!done && (
          <button type="button" className="btn btn--small btn--ghost" onClick={() => change((x) => ({ ...x, status: x.status === 'paused' ? 'active' : 'paused' }))}>
            {p.status === 'paused' ? <><Play size={16} aria-hidden="true" /> Weitermachen</> : <><Pause size={16} aria-hidden="true" /> Pause</>}
          </button>
        )}
        {!done && <button type="button" className="btn btn--sage" onClick={() => setFinishing(true)}><Check size={18} aria-hidden="true" /> Abschließen</button>}
      </header>

      {(p.description || p.areas.length > 0) && (
        <p className="pj-desc">{p.description} {p.areas.map((a) => <span key={a} className="chip pj-area">{AREA_LABEL[a] ?? a}</span>)}</p>
      )}
      {idea?.note && <p className="notice notice--info">{idea.note}</p>}
      {done && p.reflection && <div className="card pj-reflection"><p className="card__eyebrow">Das haben wir herausgefunden</p><p>{p.reflection}</p>
        {p.memoryId && <Link to="/familienzeit/erinnerungen" className="small">Steht bei unseren Erinnerungen</Link>}</div>}

      <div className="pj-grid">
        <div className="stack">
          <KidsTasks project={p} kids={kids} today={today} />
          <Steps project={p} />
        </div>
        <div className="stack">
          <Journal project={p} onAdd={() => setEntry(true)} />
          <Dates project={p} today={today} />
          <Materials project={p} />
          {(idea?.money || p.money.length > 0) && <Money project={p} today={today} />}
          {!idea?.money && p.money.length === 0 && !done && (
            <button type="button" className="btn btn--ghost btn--small" onClick={() => change((x) => ({ ...x, money: [{ id: newId('money'), date: today, label: 'Material', cents: 0, kind: 'cost' }] }))}>
              Kosten erfassen
            </button>
          )}
          <button type="button" className="btn btn--ghost btn--small pj-delete" onClick={() => void remove()}><Trash2 size={16} aria-hidden="true" /> Projekt löschen</button>
        </div>
      </div>
      {finishing && <FinishModal project={p} today={today} onClose={() => setFinishing(false)} />}
      {entry && <EntryModal project={p} today={today} onClose={() => setEntry(false)} />}
    </div>
  );
}

// ------------------------------------------------------------- Kinder

function KidsTasks({ project: p, kids, today }: { project: FamilyProject; kids: ChildProfile[]; today: string }) {
  const learning = useAllLearning();
  const [adding, setAdding] = useState<Record<string, string>>({});
  const idea = PROJECT_IDEA_BY_ID.get(p.ideaId);
  const change = (fn: (x: FamilyProject) => FamilyProject) => void updateProject(db, p.id, fn);
  const toggle = (id: string) => change((x) => ({
    ...x, tasks: x.tasks.map((t) => (t.id === id ? (t.done ? { ...t, done: false, doneAt: undefined } : { ...t, done: true, doneAt: new Date().toISOString(), requestedAt: undefined }) : t)),
  }));
  const add = (childId: string) => {
    const label = adding[childId]?.trim();
    if (!label) return;
    change((x) => ({ ...x, tasks: [...x.tasks, { id: newId('task'), childId, label, done: false }] }));
    setAdding({ ...adding, [childId]: '' });
  };
  const refresh = () => {
    if (!idea || !learning) return;
    change((x) => refreshTasks(x, idea, kids.map((c) => {
      const states = goalStates(c.id, learning.observations, learning.releases, today);
      return { child: c, level: x.levels[c.id] ?? 'preschool', known: knownLetters(states) };
    })));
  };

  return (
    <section className="card">
      <div className="row pj-section-head">
        <h2 className="card__title" style={{ margin: 0 }}>Unsere Aufgaben</h2>
        <div className="spacer" />
        {idea && p.status !== 'done' && (
          <button type="button" className="btn btn--small btn--ghost" onClick={refresh} title="Offene Aufgaben an den aktuellen Lernstand anpassen">
            <RefreshCw size={16} aria-hidden="true" /> An Lernstand anpassen
          </button>
        )}
      </div>
      <div className="pj-kids">
        {kids.map((c) => {
          const tasks = p.tasks.filter((t) => t.childId === c.id);
          return (
            <div key={c.id} className={`pj-kid tone-${c.color}`}>
              <div className="pj-kid__head">
                <Avatar avatar={c.avatar} color={c.color} size={52} />
                <div className="grow"><p className="pj-kid__name">{c.name}</p><p className="small muted">{LEVEL_LABEL[p.levels[c.id] ?? 'preschool']}</p></div>
                <span className="small muted">{tasks.filter((t) => t.done).length}/{tasks.length}</span>
              </div>
              <div className="pj-tasks">
                {tasks.map((t) => (
                  <button key={t.id} type="button" className={`pj-task ${t.done ? 'is-done' : ''}`} aria-pressed={t.done} onClick={() => toggle(t.id)}>
                    <span className="pj-task__box" aria-hidden="true">{t.done && <Check size={20} strokeWidth={3} />}</span>
                    <span>{t.label}{t.requestedAt && !t.done && <span className="chip pj-task__asked">gemeldet</span>}</span>
                  </button>
                ))}
              </div>
              {p.status !== 'done' && (
                <div className="row pj-add">
                  <input className="input" value={adding[c.id] ?? ''} placeholder="Eigene Aufgabe" aria-label={`Aufgabe für ${c.name}`}
                    onChange={(e) => setAdding({ ...adding, [c.id]: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') add(c.id); }} />
                  <button type="button" className="btn btn--icon btn--small" aria-label="Hinzufügen" disabled={!adding[c.id]?.trim()} onClick={() => add(c.id)}><Plus size={18} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ------------------------------------------------------------- Schritte

function Steps({ project: p }: { project: FamilyProject }) {
  const now = currentPhase(p);
  const [adding, setAdding] = useState<{ phase: ProjectPhase; label: string } | null>(null);
  const change = (fn: (x: FamilyProject) => FamilyProject) => void updateProject(db, p.id, fn);
  const save = () => {
    if (!adding?.label.trim()) { setAdding(null); return; }
    const { phase, label } = adding;
    change((x) => ({ ...x, steps: [...x.steps, { id: newId('step'), phase, label: label.trim(), done: false }] }));
    setAdding({ phase, label: '' });
  };
  return (
    <section className="card">
      <h2 className="card__title">Unser Plan</h2>
      <div className="pj-steps">
        {PHASES.map((ph) => {
          const steps = p.steps.filter((s) => s.phase === ph.id);
          const allDone = steps.length > 0 && steps.every((s) => s.done);
          return (
            <div key={ph.id} className={`pj-phase ${ph.id === now && p.status !== 'done' ? 'is-now' : ''} ${allDone ? 'is-done' : ''}`}>
              <h3 className="pj-phase__title"><span aria-hidden="true">{ph.emoji}</span> {ph.label}{allDone && <Check size={18} aria-label="erledigt" />}</h3>
              <ul className="pj-step-list">
                {steps.map((s) => (
                  <li key={s.id}>
                    <button type="button" className={`pj-step ${s.done ? 'is-done' : ''}`} aria-pressed={s.done}
                      onClick={() => change((x) => ({ ...x, steps: x.steps.map((y) => (y.id === s.id ? { ...y, done: !y.done } : y)) }))}>
                      <span className="pj-step__box" aria-hidden="true">{s.done && <Check size={16} strokeWidth={3} />}</span>{s.label}
                    </button>
                    {p.status !== 'done' && (
                      <button type="button" className="btn btn--icon btn--ghost btn--small" aria-label={`${s.label} entfernen`}
                        onClick={() => change((x) => ({ ...x, steps: x.steps.filter((y) => y.id !== s.id) }))}><Trash2 size={14} /></button>
                    )}
                  </li>
                ))}
              </ul>
              {p.status !== 'done' && (adding?.phase === ph.id ? (
                <div className="row pj-add">
                  <input className="input" autoFocus value={adding.label} placeholder="Neuer Schritt" aria-label={`Schritt bei ${ph.label}`}
                    onChange={(e) => setAdding({ phase: ph.id, label: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') save(); }} />
                  <button type="button" className="btn btn--small" onClick={save}>OK</button>
                </div>
              ) : (
                <button type="button" className="btn btn--ghost btn--small pj-add-step" onClick={() => setAdding({ phase: ph.id, label: '' })}><Plus size={14} aria-hidden="true" /> Schritt</button>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ------------------------------------------------------------- Tagebuch

function Journal({ project: p, onAdd }: { project: FamilyProject; onAdd: () => void }) {
  const entries = [...p.entries].sort((a, b) => b.date.localeCompare(a.date));
  const remove = (id: string) => {
    if (window.confirm('Diesen Tagebucheintrag mit seinen Fotos löschen?')) void updateProject(db, p.id, (x) => ({ ...x, entries: x.entries.filter((e) => e.id !== id) }));
  };
  return (
    <section className="card">
      <div className="row pj-section-head">
        <h2 className="card__title" style={{ margin: 0 }}>Projekttagebuch</h2>
        <div className="spacer" />
        <button type="button" className="btn btn--small btn--sky" onClick={onAdd}><Camera size={16} aria-hidden="true" /> Eintrag</button>
      </div>
      {entries.length === 0 ? <p className="muted small">Fotos und ein paar Worte: was wir gemacht und herausgefunden haben.</p> : (
        <ul className="pj-journal">
          {entries.map((e) => (
            <li key={e.id}>
              <div className="row"><strong className="small">{formatLong(e.date)}</strong><div className="spacer" />
                <button type="button" className="btn btn--icon btn--ghost btn--small" aria-label="Eintrag löschen" onClick={() => remove(e.id)}><Trash2 size={14} /></button></div>
              {e.text && <p>{e.text}</p>}
              {e.photos.length > 0 && <div className="ft-thumbs">{e.photos.map((ph, i) => <a key={i} href={ph} target="_blank" rel="noreferrer" className="ft-thumb"><img src={ph} alt="" /></a>)}</div>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EntryModal({ project: p, today, onClose }: { project: FamilyProject; today: string; onClose: () => void }) {
  const [text, setText] = useState('');
  const [date, setDate] = useState(today);
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const room = MAX_PROJECT_PHOTOS - projectPhotos(p).length - photos.length;
  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setError(null);
    try {
      const list = Array.from(files).slice(0, Math.max(0, room));
      const out: string[] = [];
      for (const f of list) out.push(await shrinkImage(f));
      setPhotos((x) => [...x, ...out]);
      if (files.length > list.length) setError(`In ein Projekt passen höchstens ${MAX_PROJECT_PHOTOS} Fotos.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Die Fotos gingen nicht.'); } finally { setBusy(false); }
  };
  const save = async () => {
    await updateProject(db, p.id, (x) => ({ ...x, entries: [...x.entries, { id: newId('entry'), date, photos, ...(text.trim() ? { text: text.trim() } : {}) }] }));
    onClose();
  };
  return (
    <Modal title="Ins Projekttagebuch" onClose={onClose}
      actions={<><button type="button" className="btn" onClick={onClose}>Abbrechen</button>
        <button type="button" className="btn btn--primary" disabled={busy || (!text.trim() && !photos.length)} onClick={() => void save()}>Speichern</button></>}>
      <div className="stack">
        <Field label="Was haben wir gemacht oder herausgefunden?"><textarea className="input" rows={3} value={text} onChange={(e) => setText(e.target.value)} /></Field>
        <Field label="Wann?"><input className="input" type="date" max={today} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} /></Field>
        {photos.length > 0 && (
          <div className="ft-thumbs ft-thumbs--edit">
            {photos.map((ph, i) => (
              <div key={i} className="ft-thumb"><img src={ph} alt="" />
                <button type="button" className="ft-thumb__remove" aria-label="Foto entfernen" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}>×</button></div>
            ))}
          </div>
        )}
        {room > 0 && (
          <label className="btn ft-add-photos"><Camera size={18} aria-hidden="true" /> {busy ? 'Fotos werden verkleinert …' : 'Fotos hinzufügen'}
            <input type="file" accept="image/*" multiple onChange={(e) => { void addPhotos(e.target.files); e.target.value = ''; }} /></label>
        )}
        {error && <p className="notice notice--error">{error}</p>}
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------- Termine

function Dates({ project: p, today }: { project: FamilyProject; today: string }) {
  const [adding, setAdding] = useState(false);
  const rows: { which: 'trip' | 'presentation'; label: string; value?: ProjectDate }[] = [];
  if (p.trip || adding) rows.push({ which: 'trip', label: 'Ausflug', value: p.trip ?? { title: `Ausflug: ${p.title}` } });
  if (p.presentation || adding) rows.push({ which: 'presentation', label: 'Abschluss', value: p.presentation ?? { title: `${p.title}: Wir zeigen, was wir herausgefunden haben` } });
  if (!rows.length) {
    return p.status === 'done' ? null : <button type="button" className="btn btn--ghost btn--small" onClick={() => setAdding(true)}><CalendarPlus size={16} aria-hidden="true" /> Ausflug oder Abschlusstermin planen</button>;
  }
  return (
    <section className="card">
      <h2 className="card__title">Termine</h2>
      <div className="stack">{rows.map((r) => <DateRow key={r.which} project={p} which={r.which} label={r.label} value={r.value!} today={today} />)}</div>
    </section>
  );
}

function DateRow({ project: p, which, label, value, today }: { project: FamilyProject; which: 'trip' | 'presentation'; label: string; value: ProjectDate; today: string }) {
  const [title, setTitle] = useState(value.title);
  const [date, setDate] = useState(value.date ?? '');
  const [time, setTime] = useState(value.time ?? '');
  const changed = title !== value.title || date !== (value.date ?? '') || time !== (value.time ?? '');
  const inCalendar = !!value.eventId && !changed;
  return (
    <div className="pj-date">
      <p className="card__eyebrow">{label}</p>
      <input className="input" value={title} aria-label={`${label}: Titel`} onChange={(e) => setTitle(e.target.value)} />
      <div className="row row--wrap">
        <input className="input pj-date__day" type="date" min={value.date && value.date < today ? value.date : today} value={date} aria-label={`${label}: Tag`} onChange={(e) => setDate(e.target.value)} />
        <input className="input pj-date__time" type="time" value={time} aria-label={`${label}: Uhrzeit`} onChange={(e) => setTime(e.target.value)} />
        {inCalendar ? <span className="chip">Steht im Kalender</span> : (
          <button type="button" className="btn btn--small btn--sky" disabled={!date || !title.trim()}
            onClick={() => void projectDateToCalendar(db, p.id, which, { title: title.trim(), date, ...(time ? { time } : {}) })}>
            <CalendarPlus size={16} aria-hidden="true" /> {value.eventId ? 'Termin ändern' : 'In den Kalender'}
          </button>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------- Material

function Materials({ project: p }: { project: FamilyProject }) {
  const [item, setItem] = useState('');
  const [added, setAdded] = useState<number | null>(null);
  const change = (fn: (x: FamilyProject) => FamilyProject) => void updateProject(db, p.id, fn);
  const add = () => { if (item.trim()) { change((x) => ({ ...x, materials: [...x.materials, { id: newId('mat'), label: item.trim(), done: false }] })); setItem(''); } };
  const open = p.materials.filter((m) => !m.done).length;
  return (
    <section className="card">
      <h2 className="card__title">Material</h2>
      {p.materials.length === 0 && <p className="muted small">Noch nichts eingetragen.</p>}
      <div className="ft-pack-checks">
        {p.materials.map((m) => (
          <button key={m.id} type="button" className={`ft-pack-check ${m.done ? 'is-done' : ''}`} aria-pressed={m.done}
            onClick={() => change((x) => ({ ...x, materials: x.materials.map((y) => (y.id === m.id ? { ...y, done: !y.done } : y)) }))}>
            <span className="ft-pack-check__box" aria-hidden="true">{m.done && <Check size={20} strokeWidth={3} />}</span>{m.label}
          </button>
        ))}
      </div>
      {p.status !== 'done' && (
        <>
          <div className="row pj-add">
            <input className="input" value={item} placeholder="Noch etwas" aria-label="Material ergänzen" onChange={(e) => setItem(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
            <button type="button" className="btn btn--icon btn--small" aria-label="Hinzufügen" disabled={!item.trim()} onClick={add}><Plus size={18} /></button>
          </div>
          {open > 0 && (
            <button type="button" className="btn btn--small" style={{ marginTop: 'var(--space-2)' }} onClick={() => void materialsToShopping(db, p.id).then(setAdded)}>
              <ShoppingCart size={16} aria-hidden="true" /> Fehlendes auf die Einkaufsliste
            </button>
          )}
          {added !== null && <p className="small muted">{added === 0 ? 'Steht schon alles auf der Einkaufsliste.' : `${added} ${added === 1 ? 'Sache steht' : 'Sachen stehen'} jetzt auf der Einkaufsliste.`}</p>}
        </>
      )}
    </section>
  );
}

// ------------------------------------------------------------- Geld

function Money({ project: p, today }: { project: FamilyProject; today: string }) {
  const [kind, setKind] = useState<'cost' | 'income'>('income');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const cents = parseEuro(amount);
  const sum = moneySummary(p);
  const change = (fn: (x: FamilyProject) => FamilyProject) => void updateProject(db, p.id, fn);
  const rows = p.money.filter((m) => m.cents > 0);
  const add = () => {
    if (cents === null || cents <= 0 || !label.trim()) return;
    change((x) => ({ ...x, money: [...x.money.filter((m) => m.cents > 0), { id: newId('money'), date: today, label: label.trim(), cents, kind }] }));
    setLabel(''); setAmount('');
  };
  return (
    <section className="card">
      <h2 className="card__title">Kosten und Einnahmen</h2>
      <p className="small muted">Jeder Betrag einzeln. Das ist echtes Geld, keine Sterne.</p>
      {rows.length > 0 && (
        <ul className="list">
          {rows.map((m) => (
            <li key={m.id} className="list-item">
              <div className="list-item__main"><p className="list-item__title">{m.label}</p><p className="list-item__meta">{formatLong(m.date)}</p></div>
              <strong className={m.kind === 'income' ? 'pj-income' : 'pj-cost'}>{m.kind === 'income' ? '+' : '−'} {formatEuro(m.cents)}</strong>
              {p.status !== 'done' && !p.moneyBatchId && <button type="button" className="btn btn--icon btn--ghost btn--small" aria-label="Betrag löschen"
                onClick={() => change((x) => ({ ...x, money: x.money.filter((y) => y.id !== m.id) }))}><Trash2 size={14} /></button>}
            </li>
          ))}
        </ul>
      )}
      <p className="pj-sum">Einnahmen {formatEuro(sum.income)} · Kosten {formatEuro(sum.costs)} · <strong>{sum.surplus >= 0 ? 'Überschuss' : 'Minus'} {formatEuro(Math.abs(sum.surplus))}</strong></p>
      {p.moneyBatchId ? <p className="small">✓ Der Überschuss ist in der <Link to="/geld">Geldwelt</Link> verteilt.</p>
        : sum.surplus > 0 && (
          <div className="row row--wrap">
            <Link to={`/eltern/geld?tab=book&projekt=${p.id}`} className="btn btn--small btn--sage">Überschuss verteilen</Link>
            <span className="small muted">Gemeinsam entscheiden: ausgeben, sparen, Reisekasse. Mama oder Papa bestätigen im Elternbereich.</span>
          </div>
        )}
      {p.status !== 'done' && !p.moneyBatchId && (
        <div className="row row--wrap pj-add">
          <input className="input pj-money-label" value={label} placeholder={kind === 'income' ? 'z. B. 4 Körbchen' : 'z. B. Körbchen gekauft'} aria-label="Wofür" onChange={(e) => setLabel(e.target.value)} />
          <div className="seg" role="group" aria-label="Art">
            <button type="button" className="seg__item seg__item--small" aria-pressed={kind === 'income'} onClick={() => setKind('income')}>Einnahme</button>
            <button type="button" className="seg__item seg__item--small" aria-pressed={kind === 'cost'} onClick={() => setKind('cost')}>Kosten</button>
          </div>
          <input className="input pj-euro" inputMode="decimal" value={amount} placeholder="0,00 €" aria-label="Betrag in Euro" onChange={(e) => setAmount(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
          <button type="button" className="btn btn--small" disabled={cents === null || cents <= 0 || !label.trim()} onClick={add}>Eintragen</button>
        </div>
      )}
    </section>
  );
}

// ------------------------------------------------------------- Abschluss

function FinishModal({ project: p, today, onClose }: { project: FamilyProject; today: string; onClose: () => void }) {
  const [reflection, setReflection] = useState(p.reflection ?? '');
  const [memory, setMemory] = useState(true);
  const photos = projectPhotos(p).length;
  const open = p.steps.filter((s) => !s.done).length + p.tasks.filter((t) => !t.done).length;
  return (
    <Modal title={`${p.emoji} ${p.title} abschließen`} onClose={onClose}
      actions={<><button type="button" className="btn" onClick={onClose}>Abbrechen</button>
        <button type="button" className="btn btn--primary" onClick={() => void finishProject(db, p.id, { date: today, reflection, memory }).then(onClose)}>Fertig</button></>}>
      <div className="stack">
        {open > 0 && <p className="small muted">{open} Punkte sind noch offen. Das ist in Ordnung: Abschließen geht trotzdem.</p>}
        <Field label="Was haben wir herausgefunden? Was war am schönsten?"><textarea className="input" rows={4} value={reflection} onChange={(e) => setReflection(e.target.value)} /></Field>
        <Toggle label={`Als Familienerinnerung speichern${photos ? ` (mit ${Math.min(photos, 20)} Fotos)` : ''}`} checked={memory && !p.memoryId} onChange={setMemory} />
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------- Drucken

function PrintButton({ project: p, kids }: { project: FamilyProject; kids: ChildProfile[] }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const print = async () => {
    setBusy(true); setError(null);
    try {
      const { renderProjectSheets } = await import('../../services/projectPdf');
      const { loadWorksheetFonts } = await import('../../services/worksheetPdf');
      const bytes = await renderProjectSheets(p, kids, await loadWorksheetFonts());
      const name = `Projekt ${p.title}.pdf`.replace(/[\\/:*?"<>|]/g, '');
      const file = new File([bytes as BlobPart], name, { type: 'application/pdf' });
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: name }); } catch { /* abgebrochen */ }
      } else {
        const url = URL.createObjectURL(file);
        window.open(url, '_blank');
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Das PDF konnte nicht erstellt werden.');
    } finally { setBusy(false); }
  };
  return (
    <>
      <button type="button" className="btn btn--small" disabled={busy} onClick={() => void print()}><Printer size={16} aria-hidden="true" /> {busy ? 'Erstelle PDF …' : 'Projektblätter'}</button>
      {error && <p className="notice notice--error">{error}</p>}
    </>
  );
}

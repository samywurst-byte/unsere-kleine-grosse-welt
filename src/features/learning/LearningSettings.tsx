import { Check, Clock, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Field } from '../../components/FormControls';
import { Modal } from '../../components/Modal';
import { db } from '../../database/db';
import { LETTER_ORDER, READING_STAGES } from '../../data/readingCurriculum';
import { useChildren, useLearning, useLearningPacks } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import {
  addObservation, deleteObservation, goalStates, LEVEL_LABEL, MOOD_LABEL, pathPhase, postponeGoal, releaseGoal, STATUS_LABEL, suggestions,
  unreleaseGoal, type GoalState, type GoalStatus,
} from '../../services/learning';
import { formatMonthYear } from '../../services/school';
import { packForWeek } from '../../services/learningPack';
import type { ChildProfile, LearningMood, ObservationLevel } from '../../types';
import { formatLong, toDateKey, weekStartKey } from '../../utils/dates';
import './learning.css';

const LEVELS: ObservationLevel[] = ['independent', 'little-help', 'much-help', 'not-yet', 'not-assessable'];
const MOODS: LearningMood[] = ['fun', 'ok', 'reluctant'];
const STATUSES: GoalStatus[] = ['not-started', 'introducing', 'practising', 'mostly', 'mastered', 'review'];

/** Elternbereich › Lernen: Lesepfad je Kind mit Buchstabenatlas, Beobachtungen und Vorschlägen. */
export function LearningSettings() {
  const children = useChildren();
  const [childId, setChildId] = useState<string | undefined>();
  useEffect(() => { if (!childId && children?.length) setChildId(children[0].id); }, [children, childId]);
  const child = children?.find((c) => c.id === childId);

  return (
    <div className="parent-section">
      <div className="parent-section__head"><h2>Lesepfad</h2></div>
      <div className="kid-select" role="group" aria-label="Kind wählen">
        {children?.map((c) => (
          <button key={c.id} type="button" className="kid-select__item" aria-pressed={c.id === childId} onClick={() => setChildId(c.id)}>
            <Avatar avatar={c.avatar} color={c.color} size={44} /> {c.name}
          </button>
        ))}
      </div>
      {child && <ChildLearning key={child.id} child={child} />}
    </div>
  );
}

function ChildLearning({ child }: { child: ChildProfile }) {
  const today = toDateKey(useNow(60_000));
  const data = useLearning(child.id);
  const [open, setOpen] = useState<string | null>(null);
  const states = useMemo(() => (data ? goalStates(child.id, data.observations, data.releases, today) : []), [data, child.id, today]);
  if (!data) return null;

  const byId = new Map(states.map((s) => [s.goal.id, s]));
  const phase = pathPhase(child, today);
  const sugg = suggestions(states, data.releases, child.id, today);
  const nextLetter = sugg.find((s) => s.kind === 'release' && s.goal.kind === 'letter')?.goal.id;
  const letters = LETTER_ORDER.map((id) => byId.get(id)!);
  const skills = states.filter((s) => s.goal.kind === 'skill');
  const known = letters.filter((s) => s.status === 'mostly' || s.status === 'mastered').length;
  const openState = open ? byId.get(open) : undefined;

  return (
    <>
      <div className={`card tone-${child.color}`}>
        <div className="learn-head">
          <div className="learn-head__text">
            {phase.kind === 'no-date' && (
              <p>Für {child.name} ist noch kein Einschulungsdatum eingetragen. Der Lesepfad startet automatisch ein Jahr vorher.{' '}
                <Link to="/eltern/familie">Unter Familie eintragen</Link>. Freigeben lässt sich trotzdem schon jetzt.</p>
            )}
            {phase.kind === 'upcoming' && (
              <p>Der Lesepfad für {child.name} startet im {formatMonthYear(phase.start)}, ein Jahr vor der Einschulung im {formatMonthYear(phase.schoolEntry)}. Bis dahin ist alles freiwillig und spielerisch.</p>
            )}
            {phase.kind === 'active' && (
              <p>Einschulung im {formatMonthYear(phase.schoolEntry)}. Noch {phase.daysUntilSchool} Tage. Ziel bis dahin: alle Buchstaben kennenlernen und erste Silben lesen, nicht flüssig lesen.</p>
            )}
            {phase.kind === 'in-school' && <p>{child.name} geht seit dem {formatLong(phase.schoolEntry)} zur Schule. Der Lesepfad bleibt zum Wiederholen da.</p>}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="learn-head__count">{known} / {letters.length}</div>
            <div className="small muted">Buchstaben weitgehend sicher</div>
          </div>
        </div>
      </div>

      {sugg.length > 0 && (
        <div className="card">
          <h3 className="card__title">Vorschläge</h3>
          <p className="small muted" style={{ marginBottom: 'var(--space-3)' }}>Die App gibt nichts selbst frei. Ihr entscheidet.</p>
          <ul className="list">
            {sugg.map((s) => (
              <li key={`${s.kind}-${s.goal.id}`} className="list-item suggest">
                <div className="suggest__main">
                  <p className="list-item__title">{s.kind === 'review' ? `Wiederholen: ${s.goal.title}` : `Als Nächstes: ${s.goal.title}`}</p>
                  <p className="list-item__meta">{s.reason}</p>
                </div>
                {s.kind === 'release' ? (
                  <>
                    <button type="button" className="btn btn--small" onClick={() => void postponeGoal(db, child.id, s.goal.id, today)}><Clock size={16} aria-hidden="true" /> Später</button>
                    <button type="button" className="btn btn--small btn--sage" onClick={() => void releaseGoal(db, child.id, s.goal.id)}><Check size={16} aria-hidden="true" /> Freigeben</button>
                  </>
                ) : (
                  <button type="button" className="btn btn--small" onClick={() => setOpen(s.goal.id)}>Beobachtung eintragen</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <div className="parent-section__head" style={{ marginBottom: 'var(--space-3)' }}>
          <h3 className="card__title" style={{ flex: 1, margin: 0 }}>Buchstabenatlas</h3>
          <div className="status-legend">{STATUSES.map((s) => <span key={s} className={`status-dot st-${s}`}>{STATUS_LABEL[s]}</span>)}</div>
        </div>
        <div className="atlas">
          {letters.map((s) => (
            <button
              key={s.goal.id} type="button" className={`atlas__tile st-${s.status} ${s.goal.id === nextLetter ? 'atlas__tile--next' : ''}`}
              onClick={() => setOpen(s.goal.id)} aria-label={`${s.goal.title}: ${STATUS_LABEL[s.status]}`}
            >
              <span className="atlas__letter">{s.goal.letter!.upper}{s.goal.letter!.upper !== s.goal.letter!.lower ? ` ${s.goal.letter!.lower}` : ''}</span>
              <span className="atlas__status">{s.goal.id === nextLetter && s.status === 'not-started' ? 'als Nächstes' : STATUS_LABEL[s.status]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="card__title">Hören und Lesen</h3>
        <div className="skill-list">
          {skills.map((s) => (
            <button key={s.goal.id} type="button" className={`skill-tile st-${s.status}`} onClick={() => setOpen(s.goal.id)}>
              <span className="skill-tile__stage">Stufe {s.goal.stage}</span>
              <span className="skill-tile__title">{s.goal.title}</span>
              <span className="small">{STATUS_LABEL[s.status]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="card__title">Die Stufen des Lesepfads</h3>
        <ol className="stage-list">
          {READING_STAGES.map((st) => (
            <li key={st.id} className={st.available ? '' : 'stage-list__later'}>
              <span className="stage-list__nr">{st.id}</span>
              <span><strong>{st.title}</strong> · {st.description}{!st.available && ' (folgt in einem späteren Paket)'}</span>
            </li>
          ))}
        </ol>
        <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>Die Stufen sind eine Orientierung für den Aufbau, keine Entwicklungsdiagnose.</p>
      </div>

      {openState && <GoalModal state={openState} child={child} today={today} onClose={() => setOpen(null)} />}
    </>
  );
}

function GoalModal({ state, child, today, onClose }: { state: GoalState; child: ChildProfile; today: string; onClose: () => void }) {
  const [level, setLevel] = useState<ObservationLevel | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(today);
  const [mood, setMood] = useState<LearningMood | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const packs = useLearningPacks();
  const { goal } = state;
  // Beobachtung dem Lernpaket der Woche zuordnen, wenn das Kind darin vorkommt
  const pack = packs ? packForWeek(packs, weekStartKey(date)) : undefined;
  const packId = pack?.children.some((c) => c.childId === child.id && c.track !== 'skip') ? pack.id : undefined;
  const history = [...state.observations].sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));

  const save = async () => {
    if (!level) return;
    await addObservation(db, child.id, goal.id, level, date, note, { mood: mood ?? undefined, packId });
    setLevel(null); setNote(''); setMood(null); setMsg('Gespeichert.');
  };

  return (
    <Modal title={`${child.name} · ${goal.title}`} onClose={onClose} wide>
      <div className="stack">
        <p className={`notice st-${state.status}`} style={{ background: 'var(--st-bg)', color: 'var(--st-ink)' }}>
          <strong>{STATUS_LABEL[state.status]}.</strong>&nbsp;{state.evidence}
        </p>
        <div>
          <p className="small muted">Darauf achten</p>
          <p>{goal.observe}</p>
        </div>
        <div>
          <p className="small muted">Ideen für den gemeinsamen Lernblock (meist am Tisch, nicht am Tablet)</p>
          <ul style={{ margin: '4px 0 0', paddingLeft: '1.2em' }}>{goal.activities.map((a) => <li key={a}>{a}</li>)}</ul>
        </div>

        <div className="card card--sunk">
          <h3 className="card__title">Beobachtung eintragen</h3>
          <div className="obs-levels" role="group" aria-label="Wie lief es?">
            {LEVELS.map((l) => (
              <button key={l} type="button" className="obs-level" aria-pressed={level === l} onClick={() => { setLevel(l); setMsg(null); }}>{LEVEL_LABEL[l]}</button>
            ))}
          </div>
          <p className="small muted" style={{ margin: 'var(--space-3) 0 var(--space-2)' }}>Stimmung (optional)</p>
          <div className="obs-moods" role="group" aria-label="Stimmung">
            {MOODS.map((m) => (
              <button key={m} type="button" className="obs-level" aria-pressed={mood === m} onClick={() => setMood(mood === m ? null : m)}>{MOOD_LABEL[m]}</button>
            ))}
          </div>
          <div className="form-grid" style={{ marginTop: 'var(--space-3)' }}>
            <Field label="Notiz (optional)"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="z. B. kannte den Laut, verwechselt m und n" /></Field>
            <Field label="Datum"><input className="input" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value || today)} /></Field>
          </div>
          <div className="row" style={{ marginTop: 'var(--space-3)' }}>
            <button type="button" className="btn btn--primary" disabled={!level} onClick={() => void save()}>Speichern</button>
            {msg && <span className="notice notice--ok" style={{ margin: 0 }}>{msg}</span>}
          </div>
        </div>

        {!state.released && (
          <button type="button" className="btn" onClick={() => void releaseGoal(db, child.id, goal.id)}><Check size={18} aria-hidden="true" /> Ohne Beobachtung freigeben</button>
        )}
        {state.released && state.observations.length === 0 && (
          <button type="button" className="btn btn--ghost" onClick={() => void unreleaseGoal(db, child.id, goal.id)}>Freigabe zurücknehmen</button>
        )}

        {history.length > 0 && (
          <div>
            <h3 className="card__title">Bisherige Beobachtungen</h3>
            <ul className="list">
              {history.map((o) => (
                <li key={o.id} className="list-item">
                  <div className="list-item__main">
                    <p className="list-item__title">{LEVEL_LABEL[o.level]}</p>
                    <p className="list-item__meta">{formatLong(o.date)}{o.mood ? ` · ${MOOD_LABEL[o.mood]}` : ''}{o.packId ? ' · Lernpaket' : ''}{o.note ? ` · ${o.note}` : ''}</p>
                  </div>
                  <button type="button" className="btn btn--icon btn--ghost" aria-label="Beobachtung löschen" onClick={() => void deleteObservation(db, o.id)}><Trash2 size={18} /></button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}

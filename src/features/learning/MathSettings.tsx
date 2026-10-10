import { Check, Clock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Toggle } from '../../components/FormControls';
import { db } from '../../database/db';
import { MATH_STAGES } from '../../data/mathCurriculum';
import { useChildren, useLearning } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { postponeGoal, releaseGoal, STATUS_LABEL, type GoalStatus } from '../../services/learning';
import { mathPhase, mathStates, mathSuggestions } from '../../services/math';
import { formatMonthYear } from '../../services/school';
import type { ChildProfile } from '../../types';
import { toDateKey } from '../../utils/dates';
import { GoalModal } from './LearningSettings';
import './learning.css';

const STATUSES: GoalStatus[] = ['not-started', 'introducing', 'practising', 'mostly', 'mastered', 'review'];

/** Elternbereich › Rechenpfad: Stufen, Lernziele und Vorschläge je Kind, wie beim Lesepfad. */
export function MathSettings() {
  const children = useChildren();
  const [childId, setChildId] = useState<string | undefined>();
  useEffect(() => { if (!childId && children?.length) setChildId(children[0].id); }, [children, childId]);
  const child = children?.find((c) => c.id === childId);

  return (
    <div className="parent-section">
      <div className="parent-section__head"><h2>Rechenpfad</h2></div>
      <div className="kid-select" role="group" aria-label="Kind wählen">
        {children?.map((c) => (
          <button key={c.id} type="button" className="kid-select__item" aria-pressed={c.id === childId} onClick={() => setChildId(c.id)}>
            <Avatar avatar={c.avatar} color={c.color} size={44} /> {c.name}
          </button>
        ))}
      </div>
      {child && <ChildMath key={child.id} child={child} />}
    </div>
  );
}

function ChildMath({ child }: { child: ChildProfile }) {
  const today = toDateKey(useNow(60_000));
  const data = useLearning(child.id);
  const [open, setOpen] = useState<string | null>(null);
  const states = useMemo(() => (data ? mathStates(child.id, data.observations, data.releases, today) : []), [data, child.id, today]);
  if (!data) return null;

  const phase = mathPhase(child, today);
  const sugg = mathSuggestions(states, data.releases, child, today);
  const sure = states.filter((s) => s.status === 'mostly' || s.status === 'mastered').length;
  const openState = open ? states.find((s) => s.goal.id === open) : undefined;

  return (
    <>
      <div className={`card tone-${child.color}`}>
        <div className="learn-head">
          <div className="learn-head__text">
            {phase === 'before-school' && (
              <p>
                {child.schoolEntryDate ? `Vor der Einschulung im ${formatMonthYear(child.schoolEntryDate)}` : 'Vor der Schule'} geht es um Zahlverständnis:
                Mengen sehen, Zahlen bis 10, Zahlen zerlegen. Plus und Minus bis 10 nur spielerisch. Die App schlägt bis Stufe 4 vor, freigeben könnt ihr alles.
              </p>
            )}
            {phase === 'school-practice' && <p>{child.name} geht zur Schule. Der Rechenpfad begleitet, was gerade im Unterricht dran ist. Gebt am besten nur frei, was in der Klasse schon eingeführt wurde.</p>}
            {phase === 'school-paused' && <p>{child.name} geht zur Schule. Übungsblätter zum Unterricht sind aus, deshalb gibt es keine Vorschläge und keine Rechenblätter im Lernpaket.</p>}
            <Toggle
              label="Übungsblätter passend zur Schule (gilt ab der Einschulung)"
              checked={!!child.schoolPractice}
              onChange={(v) => void db.members.put({ ...child, schoolPractice: v })}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="learn-head__count">{sure} / {states.length}</div>
            <div className="small muted">Lernziele weitgehend sicher</div>
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
        <div className="status-legend" style={{ marginBottom: 'var(--space-3)' }}>{STATUSES.map((s) => <span key={s} className={`status-dot st-${s}`}>{STATUS_LABEL[s]}</span>)}</div>
        <div className="stack">
          {MATH_STAGES.map((stage) => {
            const goals = states.filter((s) => s.goal.stage === stage.id);
            return (
              <section key={stage.id}>
                <h3 className="card__title" style={{ marginBottom: 4 }}>Stufe {stage.id}: {stage.title}</h3>
                <p className="small muted" style={{ margin: '0 0 var(--space-2)' }}>
                  {stage.description} Typisch: {stage.typical}.{!stage.sheets && ' Arbeitsblätter dafür folgen, bevor es so weit ist.'}
                </p>
                <div className={goals.length > 6 ? 'atlas' : 'skill-list'}>
                  {goals.map((s) => (goals.length > 6 ? (
                    <button key={s.goal.id} type="button" className={`atlas__tile st-${s.status}`} onClick={() => setOpen(s.goal.id)} aria-label={`${s.goal.title}: ${STATUS_LABEL[s.status]}`}>
                      <span className="atlas__letter" style={{ fontSize: 22 }}>{s.goal.title.replace(/^Einmaleins: /, '').replace(/-Reihe$/, '').replace(/^Geteilt durch /, ': ')}</span>
                      <span className="atlas__status">{STATUS_LABEL[s.status]}</span>
                    </button>
                  ) : (
                    <button key={s.goal.id} type="button" className={`skill-tile st-${s.status}`} onClick={() => setOpen(s.goal.id)}>
                      <span className="skill-tile__title">{s.goal.title}{s.goal.optional ? ' (freiwillig)' : ''}</span>
                      <span className="small">{STATUS_LABEL[s.status]}</span>
                    </button>
                  )))}
                </div>
              </section>
            );
          })}
        </div>
        <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
          Die Rechenblätter kommen über das <Link to="/eltern/lernpaket">Lernpaket der Woche</Link>. Die Stufen sind eine Orientierung, keine Diagnose.
        </p>
      </div>

      {openState && <GoalModal state={openState} child={child} today={today} onClose={() => setOpen(null)} />}
    </>
  );
}

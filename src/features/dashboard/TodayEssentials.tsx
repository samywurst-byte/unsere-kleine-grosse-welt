import { Check, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { db } from '../../database/db';
import { useChildren, useChoreDefinitions, useChores, useKindergartenDay, useRoutineCompletions, useRoutineDefinitions } from '../../hooks/useData';
import { completeChore, reopenChore } from '../../services/chores';
import { routinesForChild, setRoutineDone } from '../../services/routines';
import type { ChildProfile, RoutineDefinition } from '../../types';

/** "Heute schaffen wir das!": was heute für alle dazugehört. Ohne Sterne, ohne Wertung. */
export function TodayEssentials({ date }: { date: string }) {
  const children = useChildren();
  const defs = useRoutineDefinitions();
  const completions = useRoutineCompletions(date);
  const chores = useChores(date);
  const choreDefs = useChoreDefinitions();
  const kindergartenDay = useKindergartenDay(date);
  if (!children || !defs || !completions || !chores || !choreDefs || kindergartenDay === undefined) return null;

  const highlighted = defs.filter((d) => d.highlight && children.some((c) => routinesForChild([d], c.id, date, { kindergartenDay }).length));
  const doneSet = new Set(completions.map((c) => `${c.definitionId}|${c.childId}`));
  const choreDefMap = new Map(choreDefs.map((d) => [d.id, d]));
  const visibleChores = chores.filter((c) => c.status !== 'skipped' && choreDefMap.has(c.definitionId));

  const toggleRoutine = (def: RoutineDefinition, child: ChildProfile) =>
    setRoutineDone(db, def, child, date, !doneSet.has(`${def.id}|${child.id}`));

  return (
    <div className="card">
      <h2 className="card__title">Heute schaffen wir das!</h2>
      <p className="card__eyebrow">Das gehört heute dazu</p>
      <ul className="essentials">
        {highlighted.map((def) => (
          <li key={def.id} className="essentials__row">
            <span className="essentials__icon"><Icon name={def.icon} size={28} /></span>
            <span className="essentials__title">{def.title}</span>
            {def.timerPresetId && (
              <Link to={`/timer/${def.timerPresetId}`} className="btn btn--small btn--sage"><Timer size={18} aria-hidden="true" /> Timer</Link>
            )}
            <span className="essentials__kids">
              {children.filter((c) => routinesForChild([def], c.id, date, { kindergartenDay }).length).map((c) => {
                const done = doneSet.has(`${def.id}|${c.id}`);
                return (
                  <button
                    key={c.id} type="button" className={`kid-tick ${done ? 'kid-tick--done' : ''}`}
                    onClick={() => void toggleRoutine(def, c)} aria-pressed={done} aria-label={`${def.title}: ${c.name}${done ? ', geschafft' : ''}`}
                  >
                    <Avatar avatar={c.avatar} color={c.color} size={46} />
                    {done && <span className="kid-tick__check"><Check size={16} strokeWidth={3.5} /></span>}
                  </button>
                );
              })}
            </span>
          </li>
        ))}
        {visibleChores.length > 0 && (
          <li className="essentials__row essentials__row--chores">
            <span className="essentials__icon"><Icon name="house" size={28} /></span>
            <span className="essentials__title">Haushaltstag: eigene Aufgabe</span>
            <span className="essentials__chores">
              {visibleChores.map((occ) => {
                const child = children.find((c) => c.id === occ.childId);
                const def = choreDefMap.get(occ.definitionId)!;
                if (!child) return null;
                const done = occ.status === 'done';
                return (
                  <button
                    key={occ.id} type="button" className={`chore-pill tone-${child.color} ${done ? 'chore-pill--done' : ''}`}
                    onClick={() => void (done ? reopenChore(db, occ.id) : completeChore(db, occ.id, child.needsHelp))}
                    aria-pressed={done}
                  >
                    <Avatar avatar={child.avatar} color={child.color} size={36} />
                    <span>{def.title}</span>
                    {done && <Check size={18} strokeWidth={3} aria-label="geschafft" />}
                  </button>
                );
              })}
            </span>
          </li>
        )}
      </ul>
      {highlighted.length === 0 && visibleChores.length === 0 && <p className="muted">Heute ist nichts Besonderes vorgesehen.</p>}
    </div>
  );
}

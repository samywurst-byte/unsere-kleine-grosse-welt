import { Link } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { useChildren } from '../../hooks/useData';
import { ROUTINE_PHASE_LABEL } from '../../services/dayPhase';
import type { ChildProfile, DateKey, RoutinePhase } from '../../types';
import { useChildDay } from '../children/useChildDay';

export function ChildrenOverview({ date, focusPhase }: { date: DateKey; focusPhase: RoutinePhase }) {
  const children = useChildren();
  return (
    <div className="kids">
      {children?.map((c) => <ChildSummary key={c.id} child={c} date={date} phase={focusPhase} />)}
    </div>
  );
}

function ChildSummary({ child, date, phase }: { child: ChildProfile; date: DateKey; phase: RoutinePhase }) {
  const day = useChildDay(child, date);
  const items = [...day.chores, ...day.byPhase[phase]];
  const done = items.filter((i) => i.done).length;
  return (
    <Link to={`/aufgaben/${child.id}`} className={`kid-card tone-${child.color}`}>
      <Avatar avatar={child.avatar} color={child.color} size={68} />
      <div className="kid-card__body">
        <p className="kid-card__name">{child.name}</p>
        <p className="kid-card__meta">Meine Aufgaben · {ROUTINE_PHASE_LABEL[phase]}</p>
        {items.length > 0 && (
          <div className="kid-card__dots" aria-label={`${done} von ${items.length} geschafft`}>
            {items.map((i, n) => <span key={n} className={i.done ? 'dot dot--done' : 'dot'} />)}
          </div>
        )}
      </div>
    </Link>
  );
}

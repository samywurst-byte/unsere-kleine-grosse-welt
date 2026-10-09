import { Check } from 'lucide-react';
import { Icon } from '../../components/Icon';
import { useChildren, useRoutineCompletions, useRoutineDefinitions } from '../../hooks/useData';
import { routinesForChild } from '../../services/routines';
import type { DateKey, RoutinePhase } from '../../types';

const TITLE: Record<RoutinePhase, string> = {
  morning: 'Unsere Morgenroutine', afternoon: 'Unser Nachmittag', evening: 'Unsere Abendroutine',
};

/** "Was machen wir jetzt?": die Routine der aktuellen Tagesphase auf einen Blick. */
export function CurrentRoutine({ date, phase }: { date: DateKey; phase: RoutinePhase }) {
  const children = useChildren();
  const defs = useRoutineDefinitions();
  const completions = useRoutineCompletions(date);
  if (!children || !defs || !completions) return null;

  const items = defs
    .filter((d) => d.phase === phase)
    .map((d) => ({ def: d, kids: children.filter((c) => routinesForChild([d], c.id, date).length) }))
    .filter((x) => x.kids.length);
  if (!items.length) return null;

  return (
    <div className="card">
      <p className="card__eyebrow">Was machen wir jetzt?</p>
      <h2 className="card__title">{TITLE[phase]}</h2>
      <div className="now-routine">
        {items.map(({ def, kids }) => {
          const done = kids.filter((k) => completions.some((c) => c.definitionId === def.id && c.childId === k.id)).length;
          const all = done === kids.length;
          return (
            <span key={def.id} className={`now-routine__item ${all ? 'now-routine__item--done' : ''}`}>
              <Icon name={def.icon} size={22} />
              {def.title}
              {all ? <Check size={18} strokeWidth={3} aria-label="alle geschafft" /> : <span className="now-routine__count">{done}/{kids.length}</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}

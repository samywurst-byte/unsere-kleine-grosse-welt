import { useChildren, useSpecialDay } from '../../hooks/useData';
import { SPECIAL_KIND } from '../../services/specialDay';
import type { DateKey } from '../../types';

/** „Heute ist alles anders“: freundlicher Hinweis oben auf dem Startbildschirm. */
export function SpecialDayNote({ today }: { today: DateKey }) {
  const special = useSpecialDay(today);
  const children = useChildren();
  if (!special || !children) return null;
  const kind = SPECIAL_KIND[special.kind];
  const who = children.filter((c) => special.childIds.includes(c.id)).map((c) => c.name);
  const all = who.length === children.length;
  return (
    <div className="card dash__special tone-lavender" role="status">
      <span className="dash__special-emoji" aria-hidden="true">{kind.emoji}</span>
      <div>
        <p className="dash__world-title">{kind.text}</p>
        <p className="small muted">
          {all ? 'Für alle Kinder' : `Für ${who.join(', ')}`}
          {special.hideRoutines ? ' · Routinen und Aufgaben machen heute Pause' : ''}
          {special.note ? ` · ${special.note}` : ''}
        </p>
      </div>
    </div>
  );
}

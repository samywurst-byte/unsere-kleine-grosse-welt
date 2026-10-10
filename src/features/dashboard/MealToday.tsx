import { useCookSessions, useMealPlans } from '../../hooks/useData';
import type { DateKey } from '../../types';
import { weekStartKey } from '../../utils/dates';

/** „Heute essen wir …“ auf dem Startbildschirm, wenn etwas geplant ist; dazu ein Hinweis, wenn Suppenküche ist. */
export function MealToday({ today }: { today: DateKey }) {
  const plans = useMealPlans();
  const cooking = useCookSessions();
  const day = plans?.find((p) => p.id === weekStartKey(today))?.days.find((d) => d.date === today);
  const cook = cooking?.find((c) => c.date === today && c.status === 'planned');
  if (!day && !cook) return null;
  return (
    <div className="card dash__meal">
      <span className="dash__special-emoji" aria-hidden="true">{day?.emoji ?? cook?.emoji ?? '🍽️'}</span>
      <div>
        <p className="card__eyebrow">{day ? 'Heute essen wir' : 'Heute in der Küche'}</p>
        {day && <p className="dash__world-title">{day.title}</p>}
        {cook && <p className="small muted">Suppenküche: {cook.title.replace(/\s*\(große Menge\)\s*/i, '')} für den Vorrat</p>}
      </div>
    </div>
  );
}

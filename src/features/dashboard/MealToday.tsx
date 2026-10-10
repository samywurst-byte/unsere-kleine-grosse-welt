import { useMealPlans } from '../../hooks/useData';
import type { DateKey } from '../../types';
import { weekStartKey } from '../../utils/dates';

/** „Heute essen wir …“ auf dem Startbildschirm, wenn etwas geplant ist. */
export function MealToday({ today }: { today: DateKey }) {
  const plans = useMealPlans();
  const day = plans?.find((p) => p.id === weekStartKey(today))?.days.find((d) => d.date === today);
  if (!day) return null;
  return (
    <div className="card dash__meal">
      <span className="dash__special-emoji" aria-hidden="true">{day.emoji ?? '🍽️'}</span>
      <div>
        <p className="card__eyebrow">Heute essen wir</p>
        <p className="dash__world-title">{day.title}</p>
      </div>
    </div>
  );
}

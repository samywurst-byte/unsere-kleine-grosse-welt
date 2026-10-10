import { Link } from 'react-router-dom';
import '../family-time/familyTime.css';
import { useCouncilNote, useWeekendAdventures } from '../../hooks/useData';
import { adventureView, councilDate, weekendOf } from '../../services/familyTime';
import type { DateKey } from '../../types';
import { weekdayOf } from '../../utils/dates';
import { AdventureSummary } from '../family-time/AdventureSummary';

/** Am Wochenende: das Abenteuer und sonntags der Familienrat. Unter der Woche unsichtbar. */
export function FamilyTimeNote({ now, today }: { now: Date; today: DateKey }) {
  const adventures = useWeekendAdventures();
  const council = useCouncilNote(councilDate(today));
  if (!adventures || council === undefined) return null;
  const adventure = adventures.find((a) => a.id === weekendOf(today));
  const view = adventureView(now, adventure);
  const sunday = weekdayOf(today) === 0;
  const showAdventure = view !== 'later' && view !== 'done' && view !== 'cancelled';
  const showCouncil = sunday && !(council?.doneItems?.length);
  if (!showAdventure && !showCouncil) return null;
  return (
    <Link to="/familienzeit" className="card dash__family tone-sage">
      <p className="card__eyebrow">Familienzeit</p>
      {showAdventure && <AdventureSummary now={now} adventure={adventure} />}
      {showCouncil && <p className="ft-card__lead"><strong>Heute ist Familienrat.</strong> Wann setzen wir uns zusammen?</p>}
    </Link>
  );
}

import { CalendarClock, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { nextUpcoming } from '../../services/calendar';
import type { EventOccurrence } from '../../types';
import { formatDuration, formatWeekday, toDateKey, addDaysKey } from '../../utils/dates';

export function NextEventCard({ occurrences, now }: { occurrences: EventOccurrence[]; now: Date }) {
  const next = nextUpcoming(occurrences, now);
  if (!next) {
    return (
      <div className="card dash__next">
        <p className="card__eyebrow">Als Nächstes</p>
        <p className="muted">In den nächsten Tagen steht kein Termin mit Uhrzeit an.</p>
      </div>
    );
  }
  const { occurrence: o, kind, minutesUntil, at } = next;
  const today = toDateKey(now);
  const dayLabel = o.date === today ? 'Heute' : o.date === addDaysKey(today, 1) ? 'Morgen' : formatWeekday(o.date);
  const hhmm = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;

  return (
    <Link to={`/woche/${o.date}`} className="card dash__next">
      <p className="card__eyebrow">Als Nächstes</p>
      <div className="row">
        <CalendarClock size={30} className="dash__next-icon" aria-hidden="true" />
        <div>
          <p className="dash__next-title">{o.event.title}</p>
          <p className="muted">{dayLabel}, {kind === 'departure' ? 'Abfahrt' : 'Beginn'} um {hhmm} Uhr</p>
        </div>
      </div>
      {o.event.reminderMinutes !== undefined && minutesUntil <= o.event.reminderMinutes && (
        <p className="dash__reminder">Gleich geht es los. Zeit, sich fertig zu machen.</p>
      )}
      {minutesUntil <= 24 * 60 && (
        <p className="dash__countdown">noch {formatDuration(minutesUntil)}</p>
      )}
      {o.event.packingList.length > 0 && (
        <p className="small muted row"><Package size={16} aria-hidden="true" /> Packliste: {o.event.packingList.join(', ')}</p>
      )}
    </Link>
  );
}

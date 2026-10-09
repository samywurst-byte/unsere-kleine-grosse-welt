import { Bus, Home } from 'lucide-react';
import type { AppSettings, DateKey, EventOccurrence } from '../../types';
import { formatWeekday, weekdayOf } from '../../utils/dates';
import { isKindergartenDay } from '../../services/dayPhase';
import { isHolidayOn } from '../../services/calendar';
import { EventLine } from '../calendar/EventLine';

/** Ruhige Tagesübersicht für Kindergartenzeit und Abend/Nacht. */
export function DayOverview({ title, date, occurrences, settings, note }: {
  title: string; date: DateKey; occurrences: EventOccurrence[]; settings: AppSettings; note: string;
}) {
  const list = occurrences.filter((o) => o.date === date);
  const kg = isKindergartenDay(date, settings, isHolidayOn(occurrences, date));
  const homeArrival = !!settings.homeArrivalLabel && settings.homeArrivalDays.includes(weekdayOf(date));
  return (
    <div className="card">
      <h2 className="card__title">{title}: {formatWeekday(date)}</h2>
      <p className="notice notice--info" style={{ marginBottom: 'var(--space-4)' }}>{note}</p>
      <ul className="day-list">
        {kg && (
          <li className="day-list__item day-list__item--soft">
            <span className="day-list__time">{settings.kindergartenDeparture}</span>
            <Bus size={22} aria-hidden="true" /> Kindergarten bis ca. {settings.kindergartenReturn}
          </li>
        )}
        {kg && homeArrival && (
          <li className="day-list__item day-list__item--soft">
            <span className="day-list__time">≈ {settings.papaHome}</span>
            <Home size={22} aria-hidden="true" /> {settings.homeArrivalLabel}
          </li>
        )}
        {list.map((o) => <EventLine key={o.key} occ={o} />)}
        {list.length === 0 && !kg && <li className="muted">Keine Termine. Zeit für freies Spielen.</li>}
      </ul>
    </div>
  );
}

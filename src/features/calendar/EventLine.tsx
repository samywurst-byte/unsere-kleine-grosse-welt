import { Car } from 'lucide-react';
import { Icon } from '../../components/Icon';
import type { EventOccurrence } from '../../types';
import { eventIcon, eventTone } from './eventStyle';

export function EventLine({ occ, onClick }: { occ: EventOccurrence; onClick?: () => void }) {
  const e = occ.event;
  const time = occ.startTime ?? occ.departureTime ?? '';
  const content = (
    <>
      <span className="day-list__time">{time || '–'}</span>
      <span className="day-list__icon"><Icon name={eventIcon(e)} size={22} /></span>
      <span className="day-list__title">
        {e.title}
        {occ.endTime && occ.startTime && <span className="muted"> bis {occ.endTime}</span>}
        {occ.isMoved && <span className="chip" style={{ marginLeft: 8 }}>verschoben</span>}
      </span>
      {occ.departureTime && occ.departureTime !== time && (
        <span className="chip"><Car size={14} aria-hidden="true" /> Abfahrt {occ.departureTime}</span>
      )}
    </>
  );
  return (
    <li className={`day-list__item tone-${eventTone(e)}`}>
      {onClick ? <button type="button" className="day-list__btn" onClick={onClick}>{content}</button> : content}
    </li>
  );
}

import { Bus, ChevronLeft, ChevronRight, Home, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { useChildren, useChoreDefinitions, useChores, useOccurrences, useSettings } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { isHolidayOn } from '../../services/calendar';
import { bedtimeFor, isKindergartenDay } from '../../services/dayPhase';
import type { EventOccurrence } from '../../types';
import { addDaysKey, formatLong, isValidDateKey, toDateKey, weekdayOf } from '../../utils/dates';
import { EventDetailModal } from './EventDetailModal';
import { EventLine } from './EventLine';
import './calendar.css';

export function DayPage() {
  const { date = '' } = useParams();
  const navigate = useNavigate();
  const today = toDateKey(useNow(60_000));
  const valid = isValidDateKey(date);
  const key = valid ? date : today;
  const occ = useOccurrences(key, key);
  const settings = useSettings();
  const children = useChildren();
  const choreDefs = useChoreDefinitions();
  const stored = useChores(valid ? key : null);
  const [selected, setSelected] = useState<EventOccurrence | null>(null);

  if (!valid) return <p className="empty">Unbekanntes Datum. <Link to="/woche">Zur Woche</Link></p>;
  if (!occ || !settings || !children || !choreDefs) return null;

  const kg = isKindergartenDay(key, settings, isHolidayOn(occ, key));
  const chores = (stored ?? []).map((o) => ({
    id: o.id, childId: o.childId, title: choreDefs.find((d) => d.id === o.definitionId)?.title ?? '',
    status: o.status === 'open' && key > today ? 'geplant' as const : o.status,
  }));

  return (
    <div>
      <header className="page-head">
        <button type="button" className="btn btn--icon btn--ghost" onClick={() => navigate('/woche')} aria-label="Zur Wochenansicht"><ChevronLeft /></button>
        <h1>{formatLong(key)}</h1>
        <div className="spacer" />
        <Link to={`/woche/${addDaysKey(key, -1)}`} replace className="btn btn--icon" aria-label="Vorheriger Tag"><ChevronLeft /></Link>
        <Link to={`/woche/${addDaysKey(key, 1)}`} replace className="btn btn--icon" aria-label="Nächster Tag"><ChevronRight /></Link>
        <Link to={`/eltern/kalender?new=${key}`} className="btn btn--sky"><Plus size={18} aria-hidden="true" /> Termin</Link>
      </header>

      <div className="day-grid">
        <div className="card">
          <h2 className="card__title">Ablauf</h2>
          <ul className="day-list">
            {kg && (
              <li className="day-list__item day-list__item--soft">
                <span className="day-list__time">{settings.kindergartenDeparture}</span>
                <Bus size={22} aria-hidden="true" /> Kindergarten bis ca. {settings.kindergartenReturn}
              </li>
            )}
            {kg && settings.afterKindergartenNote && (
              <li className="day-list__item day-list__item--soft">
                <span className="day-list__time">danach</span>
                <Icon name="trees" size={22} /> {settings.afterKindergartenNote}
              </li>
            )}
            {kg && settings.homeArrivalLabel && settings.homeArrivalDays.includes(weekdayOf(key)) && (
              <li className="day-list__item day-list__item--soft">
                <span className="day-list__time">≈ {settings.papaHome}</span>
                <Home size={22} aria-hidden="true" /> {settings.homeArrivalLabel}
              </li>
            )}
            {occ.map((o) => <EventLine key={o.key} occ={o} onClick={() => setSelected(o)} />)}
            <li className="day-list__item day-list__item--soft">
              <span className="day-list__time">{bedtimeFor(key, settings)}</span>
              <Icon name="bed" size={22} /> Schlafenszeit
            </li>
          </ul>
        </div>

        <div className="card">
          <h2 className="card__title">Haushalt</h2>
          {chores.length === 0 && <p className="muted">Heute ist kein Haushaltstag.</p>}
          <ul className="list">
            {chores.map((c) => {
              const child = children.find((k) => k.id === c.childId);
              return (
                <li key={c.id} className="list-item">
                  {child && <Avatar avatar={child.avatar} color={child.color} size={44} />}
                  <div className="list-item__main">
                    <p className="list-item__title">{c.title}</p>
                    <p className="list-item__meta">{child?.name}</p>
                  </div>
                  <span className="chip">{{ open: 'offen', done: 'geschafft', skipped: 'ausgesetzt', geplant: 'geplant' }[c.status]}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {selected && <EventDetailModal occ={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

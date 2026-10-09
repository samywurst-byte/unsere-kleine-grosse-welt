import { ChevronLeft, ChevronRight, Trees } from 'lucide-react';
import { getISOWeek } from 'date-fns';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { useChildren, useChoreDefinitions, useMembers, useOccurrences } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { possessive, upcomingBirthdays } from '../../services/calendar';
import { choreDefinitionsFor } from '../../services/chores';
import type { EventOccurrence } from '../../types';
import { addDaysKey, formatDayMonth, fromDateKey, toDateKey, weekKeys, weekStartKey, WEEKDAY_SHORT, weekdayOf } from '../../utils/dates';
import { EventDetailModal } from './EventDetailModal';
import { eventIcon, eventTone } from './eventStyle';
import './calendar.css';

export function WeekPage() {
  const today = toDateKey(useNow(60_000));
  const [start, setStart] = useState(() => weekStartKey(today));
  const days = weekKeys(start);
  const occ = useOccurrences(days[0], days[6]);
  const choreDefs = useChoreDefinitions();
  const children = useChildren();
  const members = useMembers();
  const [selected, setSelected] = useState<EventOccurrence | null>(null);

  const kw = getISOWeek(fromDateKey(start));
  const birthdays = members ? upcomingBirthdays(members, today, 366).slice(0, 3) : [];

  return (
    <div>
      <header className="page-head">
        <h1>Unsere Woche</h1>
        <span className="page-head__sub">KW {kw} · {formatDayMonth(days[0])} bis {formatDayMonth(days[6])}</span>
        <div className="spacer" />
        <button type="button" className="btn btn--icon" onClick={() => setStart(addDaysKey(start, -7))} aria-label="Vorherige Woche"><ChevronLeft /></button>
        <button type="button" className="btn" onClick={() => setStart(weekStartKey(today))} disabled={start === weekStartKey(today)}>Diese Woche</button>
        <button type="button" className="btn btn--icon" onClick={() => setStart(addDaysKey(start, 7))} aria-label="Nächste Woche"><ChevronRight /></button>
      </header>

      <p className="week__banner"><Trees size={22} aria-hidden="true" /> Jeden Tag mindestens 15 Minuten draußen, bei normalem Wetter auch bei Regen.</p>

      <div className="week">
        {days.map((d) => {
          const list = occ?.filter((o) => o.date === d) ?? [];
          const chores = choreDefs ? choreDefinitionsFor(choreDefs, d) : [];
          const isToday = d === today;
          return (
            <section key={d} className={`week__day ${isToday ? 'week__day--today' : ''}`}>
              <Link to={`/woche/${d}`} className="week__head">
                <span className="week__wd">{WEEKDAY_SHORT[weekdayOf(d)]}</span>
                <span className="week__date">{fromDateKey(d).getDate()}.</span>
                {isToday && <span className="week__today">Heute</span>}
              </Link>
              {chores.length > 0 && (
                <Link to={`/woche/${d}`} className="week__chores" aria-label="Haushaltstag">
                  <Icon name="house" size={16} />
                  <span>Haushalt</span>
                  <span className="week__chore-kids">
                    {chores.map((c) => {
                      const child = children?.find((k) => k.id === c.childId);
                      return child ? <Avatar key={c.id} avatar={child.avatar} color={child.color} size={22} /> : null;
                    })}
                  </span>
                </Link>
              )}
              <ul className="week__events">
                {list.map((o) => (
                  <li key={o.key}>
                    <button type="button" className={`week__event tone-${eventTone(o.event)}`} onClick={() => setSelected(o)}>
                      <span className="week__event-time">{o.startTime ?? (o.departureTime ? `ab ${o.departureTime}` : '')}</span>
                      <span className="week__event-title"><Icon name={eventIcon(o.event)} size={16} /> {o.event.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {birthdays.length > 0 && (
        <div className="week__birthdays">
          {birthdays.map((b) => (
            <span key={b.member.id} className="chip tone-gold">
              <Icon name="cake" size={16} /> {b.daysUntil === 0 ? `Heute: ${possessive(b.member.name)} Geburtstag!` : `Noch ${b.daysUntil} Tage bis ${possessive(b.member.name)} Geburtstag`}
            </span>
          ))}
        </div>
      )}

      {selected && <EventDetailModal occ={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

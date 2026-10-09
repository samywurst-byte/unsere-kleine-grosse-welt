import { useLiveQuery } from 'dexie-react-hooks';
import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../../database/db';
import { useMembers } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import type { CalendarEvent } from '../../types';
import { formatLong, toDateKey, WEEKDAY_SHORT } from '../../utils/dates';
import { EventEditor } from './EventEditor';

const CATEGORY_LABEL: Record<CalendarEvent['category'], string> = {
  appointment: 'Termin', family: 'Familie', birthday: 'Geburtstag', holiday: 'Ferien', info: 'Hinweis',
};

export function describeEvent(e: CalendarEvent): string {
  const time = [e.startTime && `${e.startTime}${e.endTime ? `–${e.endTime}` : ''}`, e.departureTime && `Abfahrt ${e.departureTime}`].filter(Boolean).join(' · ');
  let when: string;
  if (e.recurrence?.freq === 'weekly') {
    when = `${e.recurrence.interval > 1 ? `alle ${e.recurrence.interval} Wochen` : 'wöchentlich'} ${(e.recurrence.byWeekday ?? []).map((d) => WEEKDAY_SHORT[d]).join(', ')}`;
  } else if (e.recurrence?.freq === 'yearly') {
    when = 'jährlich';
  } else {
    when = e.endDate && e.endDate !== e.startDate ? `${formatLong(e.startDate)} bis ${formatLong(e.endDate)}` : formatLong(e.startDate);
  }
  return [CATEGORY_LABEL[e.category], when, time || 'ohne Uhrzeit'].join(' · ');
}

export function CalendarSettings() {
  const [params, setParams] = useSearchParams();
  const events = useLiveQuery(() => db.events.orderBy('startDate').toArray(), []);
  const members = useMembers();
  const today = toDateKey(useNow(60_000));
  const [creating, setCreating] = useState(false);

  const editId = params.get('event');
  const occurrenceDate = params.get('date') ?? undefined;
  const newDate = params.get('new');
  const editing = events?.find((e) => e.id === editId);
  const close = () => { setParams({}, { replace: true }); setCreating(false); };

  if (!events || !members) return null;
  const series = events.filter((e) => e.recurrence);
  const single = events.filter((e) => !e.recurrence && (e.endDate ?? e.startDate) >= today);
  const past = events.filter((e) => !e.recurrence && (e.endDate ?? e.startDate) < today);

  const row = (e: CalendarEvent) => (
    <li key={e.id} className="list-item">
      <div className="list-item__main">
        <p className="list-item__title">{e.title}</p>
        <p className="list-item__meta">{describeEvent(e)}</p>
      </div>
      <button type="button" className="btn btn--small" onClick={() => setParams({ event: e.id }, { replace: true })}>
        <Pencil size={16} aria-hidden="true" /> Bearbeiten
      </button>
    </li>
  );

  return (
    <div className="parent-section">
      <div className="parent-section__head">
        <h2>Kalender</h2>
        <button type="button" className="btn btn--sky" onClick={() => setCreating(true)}><Plus size={18} aria-hidden="true" /> Neuer Termin</button>
      </div>
      <p className="small muted">Geburtstage kommen automatisch aus den Profilen. Ferien als Kategorie „Ferien“ mit Enddatum anlegen: dann entfällt die Kindergartenphase.</p>
      <h3 className="card__eyebrow">Wiederkehrend</h3>
      <ul className="list">{series.map(row)}</ul>
      <h3 className="card__eyebrow">Einmalig und kommend</h3>
      {single.length ? <ul className="list">{single.map(row)}</ul> : <p className="muted small">Keine.</p>}
      {past.length > 0 && (
        <details>
          <summary className="card__eyebrow">Vergangen ({past.length})</summary>
          <ul className="list">{past.map(row)}</ul>
        </details>
      )}

      {(creating || newDate) && <EventEditor members={members} initialDate={newDate ?? today} onClose={close} />}
      {editing && <EventEditor members={members} event={editing} occurrenceDate={occurrenceDate} initialDate={today} onClose={close} />}
    </div>
  );
}

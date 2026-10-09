import { useLiveQuery } from 'dexie-react-hooks';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Field, Segmented, WeekdayPicker } from '../../components/FormControls';
import { Modal } from '../../components/Modal';
import { db } from '../../database/db';
import { seriesDates } from '../../services/calendar';
import type { CalendarEvent, EventException, Member, Weekday } from '../../types';
import { formatLong, isValidDateKey, isValidTime, weekdayOf } from '../../utils/dates';
import { newId } from '../../utils/id';
import { MemberSelect } from './MemberSelect';

type RepeatMode = 'none' | 'weekly' | 'yearly';

export function EventEditor({ event, members, initialDate, occurrenceDate, onClose }: {
  event?: CalendarEvent; members: Member[]; initialDate: string; occurrenceDate?: string; onClose: () => void;
}) {
  const now = new Date().toISOString();
  const [draft, setDraft] = useState<CalendarEvent>(() => event ?? {
    id: newId('event'), title: '', category: 'appointment', startDate: initialDate, memberIds: [], packingList: [],
    createdAt: now, updatedAt: now,
  });
  const [repeat, setRepeat] = useState<RepeatMode>(event?.recurrence?.freq ?? 'none');
  const [weekdays, setWeekdays] = useState<Weekday[]>(event?.recurrence?.byWeekday ?? [weekdayOf(draft.startDate)]);
  const [interval, setInterval] = useState(event?.recurrence?.interval ?? 1);
  const [until, setUntil] = useState(event?.recurrence?.until ?? '');
  const [packing, setPacking] = useState((event?.packingList ?? []).join('\n'));
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (patch: Partial<CalendarEvent>) => setDraft((d) => ({ ...d, ...patch }));

  const save = async () => {
    const times = [draft.startTime, draft.endTime, draft.departureTime].filter(Boolean);
    if (!draft.title.trim()) return setError('Bitte einen Titel eingeben.');
    if (!isValidDateKey(draft.startDate)) return setError('Bitte ein gültiges Datum wählen.');
    if (times.some((t) => !isValidTime(t))) return setError('Bitte gültige Uhrzeiten eingeben.');
    if (draft.startTime && draft.endTime && draft.endTime <= draft.startTime) return setError('Das Ende muss nach dem Beginn liegen.');
    if (draft.endDate && draft.endDate < draft.startDate) return setError('Das Enddatum liegt vor dem Startdatum.');
    if (repeat === 'weekly' && weekdays.length === 0) return setError('Bitte mindestens einen Wochentag wählen.');
    if (until && until < draft.startDate) return setError('Das Serienende liegt vor dem Start.');

    const result: CalendarEvent = {
      ...draft,
      title: draft.title.trim(),
      startTime: draft.startTime || undefined,
      endTime: draft.endTime || undefined,
      departureTime: draft.departureTime || undefined,
      endDate: repeat === 'none' && draft.endDate && draft.endDate !== draft.startDate ? draft.endDate : undefined,
      notes: draft.notes?.trim() || undefined,
      packingList: packing.split('\n').map((s) => s.trim()).filter(Boolean),
      recurrence: repeat === 'none' ? undefined : {
        freq: repeat, interval: Math.max(1, interval), byWeekday: repeat === 'weekly' ? weekdays : undefined, until: until || undefined,
      },
      updatedAt: new Date().toISOString(),
    };
    await db.events.put(result);
    onClose();
  };

  const remove = async () => {
    await db.transaction('rw', db.events, db.eventExceptions, async () => {
      await db.eventExceptions.where('eventId').equals(draft.id).delete();
      await db.events.delete(draft.id);
    });
    onClose();
  };

  return (
    <Modal
      title={event ? 'Termin bearbeiten' : 'Neuer Termin'}
      onClose={onClose}
      wide
      actions={(
        <>
          {event && !confirmDelete && <button type="button" className="btn btn--danger" onClick={() => setConfirmDelete(true)}><Trash2 size={18} aria-hidden="true" /> Löschen</button>}
          {confirmDelete && <button type="button" className="btn btn--danger" onClick={remove}>Wirklich {event?.recurrence ? 'die ganze Serie ' : ''}löschen</button>}
          <div className="spacer" />
          <button type="button" className="btn" onClick={onClose}>Abbrechen</button>
          <button type="button" className="btn btn--primary" onClick={save}>Speichern</button>
        </>
      )}
    >
      {event && occurrenceDate && event.recurrence && <OccurrenceActions event={event} date={occurrenceDate} />}

      <div className="form-grid">
        {error && <p className="notice notice--error span-2">{error}</p>}
        <Field label="Titel" className="span-2"><input className="input" value={draft.title} onChange={(e) => set({ title: e.target.value })} /></Field>
        <Field label="Art" className="span-2">
          <Segmented
            label="Art" value={draft.category}
            options={[{ value: 'appointment', label: 'Termin' }, { value: 'family', label: 'Familie' }, { value: 'holiday', label: 'Ferien' }, { value: 'birthday', label: 'Geburtstag' }, { value: 'info', label: 'Hinweis' }]}
            onChange={(category) => set({ category })}
          />
        </Field>
        <Field label={repeat === 'none' ? 'Datum' : 'Serie beginnt am'}>
          <input className="input" type="date" value={draft.startDate} onChange={(e) => set({ startDate: e.target.value })} />
        </Field>
        {repeat === 'none' ? (
          <Field label="Bis (optional, für mehrtägige Ereignisse)"><input className="input" type="date" value={draft.endDate ?? ''} min={draft.startDate} onChange={(e) => set({ endDate: e.target.value || undefined })} /></Field>
        ) : <div />}
        <Field label="Beginn (optional)" hint="Unbekannte Zeiten einfach leer lassen."><input className="input" type="time" value={draft.startTime ?? ''} onChange={(e) => set({ startTime: e.target.value || undefined })} /></Field>
        <Field label="Ende (optional)"><input className="input" type="time" value={draft.endTime ?? ''} onChange={(e) => set({ endTime: e.target.value || undefined })} /></Field>
        <Field label="Abfahrt von zu Hause (optional)"><input className="input" type="time" value={draft.departureTime ?? ''} onChange={(e) => set({ departureTime: e.target.value || undefined })} /></Field>
        <Field label="Erinnerung in der App (Minuten vorher, optional)">
          <input className="input" type="number" inputMode="numeric" min={0} max={240} value={draft.reminderMinutes ?? ''} onChange={(e) => set({ reminderMinutes: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)) })} />
        </Field>
        <Field label="Wiederholung" className="span-2">
          <Segmented label="Wiederholung" value={repeat} options={[{ value: 'none', label: 'Einmalig' }, { value: 'weekly', label: 'Wöchentlich' }, { value: 'yearly', label: 'Jährlich' }]} onChange={setRepeat} />
        </Field>
        {repeat === 'weekly' && (
          <>
            <Field label="Wochentage" className="span-2"><WeekdayPicker value={weekdays} onChange={setWeekdays} /></Field>
            <Field label="Rhythmus">
              <Segmented label="Rhythmus" value={String(interval)} options={[{ value: '1', label: 'Jede Woche' }, { value: '2', label: 'Alle 2 Wochen' }, { value: '3', label: 'Alle 3 Wochen' }]} onChange={(v) => setInterval(Number(v))} />
            </Field>
          </>
        )}
        {repeat !== 'none' && (
          <Field label="Serie endet am (optional)"><input className="input" type="date" value={until} min={draft.startDate} onChange={(e) => setUntil(e.target.value)} /></Field>
        )}
        <Field label="Wer ist dabei?" className="span-2"><MemberSelect members={members} value={draft.memberIds} onChange={(memberIds) => set({ memberIds })} /></Field>
        <Field label="Notizen" className="span-2"><textarea className="textarea" value={draft.notes ?? ''} onChange={(e) => set({ notes: e.target.value })} /></Field>
        <Field label="Packliste" hint="Ein Eintrag pro Zeile" className="span-2"><textarea className="textarea packing-input" value={packing} onChange={(e) => setPacking(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

/** Ausnahmen für ein einzelnes Vorkommen einer Serie: absagen oder verschieben. */
function OccurrenceActions({ event, date }: { event: CalendarEvent; date: string }) {
  const existing = useLiveQuery(() => db.eventExceptions.where('[eventId+originalDate]').equals([event.id, date]).first(), [event.id, date]);
  const [moving, setMoving] = useState(false);
  const [newDate, setNewDate] = useState(date);
  const [newStart, setNewStart] = useState(event.startTime ?? '');
  const [newEnd, setNewEnd] = useState(event.endTime ?? '');
  const [newDeparture, setNewDeparture] = useState(event.departureTime ?? '');
  const valid = seriesDates(event, date, date).length > 0;
  if (!valid) return null;

  const write = async (ex: Omit<EventException, 'id' | 'eventId' | 'originalDate'>) => {
    await db.eventExceptions.put({ id: existing?.id ?? newId('ex'), eventId: event.id, originalDate: date, ...ex });
    setMoving(false);
  };

  return (
    <div className="card card--sunk" style={{ marginBottom: 'var(--space-5)' }}>
      <p className="card__eyebrow">Nur der Termin am {formatLong(date)}</p>
      {existing && (
        <p className="notice notice--info" style={{ marginBottom: 'var(--space-3)' }}>
          {existing.type === 'cancelled' ? 'Dieser Termin ist abgesagt.' : `Verschoben auf ${formatLong(existing.newDate!)}${existing.newStartTime ? `, ${existing.newStartTime}` : ''}.`}
        </p>
      )}
      {!moving ? (
        <div className="row row--wrap">
          {existing?.type !== 'cancelled' && <button type="button" className="btn btn--small" onClick={() => write({ type: 'cancelled' })}>Diesen Termin absagen</button>}
          <button type="button" className="btn btn--small" onClick={() => setMoving(true)}>Diesen Termin verschieben</button>
          {existing && <button type="button" className="btn btn--small btn--sage" onClick={() => db.eventExceptions.delete(existing.id)}>Wie geplant stattfinden lassen</button>}
        </div>
      ) : (
        <div className="form-grid">
          <Field label="Neues Datum"><input className="input" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} /></Field>
          <Field label="Beginn"><input className="input" type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} /></Field>
          <Field label="Ende"><input className="input" type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} /></Field>
          <Field label="Abfahrt"><input className="input" type="time" value={newDeparture} onChange={(e) => setNewDeparture(e.target.value)} /></Field>
          <div className="row span-2">
            <button type="button" className="btn btn--small" onClick={() => setMoving(false)}>Abbrechen</button>
            <button
              type="button" className="btn btn--small btn--primary" disabled={!isValidDateKey(newDate)}
              onClick={() => write({ type: 'moved', newDate, newStartTime: newStart || undefined, newEndTime: newEnd || undefined, newDepartureTime: newDeparture || undefined })}
            >
              Verschieben
            </button>
          </div>
        </div>
      )}
      <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>Die Serie selbst bleibt unverändert.</p>
    </div>
  );
}

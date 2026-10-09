import { Car, Clock, Package, Pencil, Repeat, StickyNote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Modal } from '../../components/Modal';
import { useMembers } from '../../hooks/useData';
import type { EventOccurrence } from '../../types';
import { formatLong, WEEKDAY_LONG } from '../../utils/dates';
import { occurrenceTimeLabel } from './eventStyle';

export function recurrenceText(o: EventOccurrence): string | null {
  const r = o.event.recurrence;
  if (!r) return null;
  if (r.freq === 'yearly') return 'jedes Jahr';
  const days = (r.byWeekday ?? []).map((d) => WEEKDAY_LONG[d]).join(', ');
  const every = r.interval > 1 ? `alle ${r.interval} Wochen` : 'jede Woche';
  return `${every}${days ? ` am ${days}` : ''}${r.until ? ` bis ${formatLong(r.until)}` : ''}`;
}

export function EventDetailModal({ occ, onClose }: { occ: EventOccurrence; onClose: () => void }) {
  const members = useMembers();
  const navigate = useNavigate();
  const e = occ.event;
  const people = members?.filter((m) => e.memberIds.includes(m.id)) ?? [];
  const rec = recurrenceText(occ);

  return (
    <Modal
      title={e.title}
      onClose={onClose}
      actions={!occ.generated && (
        <button type="button" className="btn" onClick={() => navigate(`/eltern/kalender?event=${encodeURIComponent(e.id)}&date=${occ.originalDate}`)}>
          <Pencil size={18} aria-hidden="true" /> Im Elternbereich bearbeiten
        </button>
      )}
    >
      <div className="stack">
        <p className="row"><Clock size={20} aria-hidden="true" /> {formatLong(occ.date)} · {occurrenceTimeLabel(occ)}</p>
        {occ.departureTime && <p className="row"><Car size={20} aria-hidden="true" /> Abfahrt um {occ.departureTime} Uhr</p>}
        {occ.isMoved && <p className="notice notice--info">Dieser Termin wurde einmalig vom {formatLong(occ.originalDate)} verschoben.</p>}
        {rec && <p className="row muted"><Repeat size={20} aria-hidden="true" /> {rec}</p>}
        {people.length > 0 && (
          <div className="row row--wrap">
            {people.map((m) => (
              <span key={m.id} className="row"><Avatar avatar={m.avatar} color={m.color} size={40} /> {m.name}</span>
            ))}
          </div>
        )}
        {e.notes && <p className="row"><StickyNote size={20} aria-hidden="true" /> {e.notes}</p>}
        {e.packingList.length > 0 && (
          <div>
            <p className="row" style={{ fontWeight: 800 }}><Package size={20} aria-hidden="true" /> Packliste</p>
            <ul>{e.packingList.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        )}
        {e.reminderMinutes !== undefined && (
          <p className="small muted">Erinnerung in der App {e.reminderMinutes} Minuten vorher.</p>
        )}
      </div>
    </Modal>
  );
}

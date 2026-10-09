import { Cake } from 'lucide-react';
import { useMembers } from '../../hooks/useData';
import { possessive, upcomingBirthdays } from '../../services/calendar';
import type { DateKey } from '../../types';

export function BirthdayNote({ today }: { today: DateKey }) {
  const members = useMembers();
  if (!members) return null;
  const list = upcomingBirthdays(members, today, 30);
  if (!list.length) return null;
  return (
    <div className="card dash__birthday tone-gold">
      <p className="card__eyebrow">Geburtstage</p>
      {list.map((b) => (
        <p key={b.member.id} className="row dash__birthday-line">
          <Cake size={26} aria-hidden="true" />
          {b.daysUntil === 0
            ? <span><strong>Heute</strong> hat {b.member.name} Geburtstag und wird {b.turningAge}! 🎉</span>
            : <span>Noch <strong>{b.daysUntil} {b.daysUntil === 1 ? 'Tag' : 'Tage'}</strong> bis {possessive(b.member.name)} Geburtstag</span>}
        </p>
      ))}
    </div>
  );
}

import { Avatar } from '../../components/Avatar';
import type { Member } from '../../types';

/** Mehrfachauswahl von Familienmitgliedern mit Avataren. */
export function MemberSelect({ members, value, onChange, single }: {
  members: Member[]; value: string[]; onChange: (ids: string[]) => void; single?: boolean;
}) {
  return (
    <div className="kid-select" role="group">
      {members.map((m) => {
        const on = value.includes(m.id);
        return (
          <button
            key={m.id} type="button" className="kid-select__item" aria-pressed={on}
            onClick={() => onChange(single ? [m.id] : on ? value.filter((x) => x !== m.id) : [...value, m.id])}
          >
            <Avatar avatar={m.avatar} color={m.color} size={40} /> {m.name}
          </button>
        );
      })}
    </div>
  );
}

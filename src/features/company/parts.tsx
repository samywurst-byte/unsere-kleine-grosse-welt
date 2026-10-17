import { Avatar } from '../../components/Avatar';
import { db } from '../../database/db';
import { toggleVote } from '../../services/kidCompany';
import type { ChildProfile } from '../../types';

export function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className={`kc-stat ${strong ? 'is-strong' : ''}`}><span className="kc-stat__value">{value}</span><span className="kc-stat__label">{label}</span></div>;
}

/** Jedes Kind tippt auf sein Bild, wenn es eine Idee gut findet. */
export function Votes({ ideaId, votes, kids }: { ideaId: string; votes: string[]; kids: ChildProfile[] }) {
  return (
    <div className="kc-votes" role="group" aria-label="Wer mag diese Idee?">
      {kids.map((k) => (
        <button key={k.id} type="button" className={`kc-vote ${votes.includes(k.id) ? 'is-on' : ''}`} aria-pressed={votes.includes(k.id)} aria-label={`${k.name} mag das`} onClick={() => void toggleVote(db, ideaId, k.id)}>
          <Avatar avatar={k.avatar} color={k.color} size={34} />
        </button>
      ))}
    </div>
  );
}

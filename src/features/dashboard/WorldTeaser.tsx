import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../../database/db';

export function WorldTeaser() {
  const first = useLiveQuery(() => db.countries.orderBy('order').first(), []);
  return (
    <Link to="/weltreise" className="card dash__world">
      <p className="card__eyebrow">Unsere Weltreise</p>
      {first
        ? <p className="dash__world-title">Das erste Land wartet: {first.nameDe} <span aria-hidden="true">{first.flagEmoji}</span></p>
        : <p className="dash__world-title">Bald geht die Reise los</p>}
      <p className="small muted">Die Sternereise startet mit einer späteren Ausbaustufe.</p>
    </Link>
  );
}

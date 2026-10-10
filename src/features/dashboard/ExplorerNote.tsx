import { Link } from 'react-router-dom';
import { useExplorerSundays } from '../../hooks/useData';
import { explorerTeaser } from '../../services/explorer';
import type { DateKey } from '../../types';

/** Ab Donnerstag: Vorfreude auf den nächsten Entdeckersonntag. Sonst unsichtbar. */
export function ExplorerNote({ today }: { today: DateKey }) {
  const sundays = useExplorerSundays();
  if (!sundays) return null;
  const t = explorerTeaser(today, sundays);
  if (!t) return null;
  const when = t.daysLeft === 0 ? 'Heute ist Entdeckersonntag!' : t.daysLeft === 1 ? 'Morgen ist Entdeckersonntag!' : 'Am Sonntag ist Entdeckersonntag!';
  return (
    <Link to={`/entdecken/sonntage/${t.module.id}`} className="card dash__explorer tone-sky">
      <p className="card__eyebrow">{when}</p>
      <p className="dash__explorer-title">
        <span aria-hidden="true">{t.kind === 'home' ? '🔭' : '🏛️'}</span> {t.kind === 'home' ? t.module.title : `Ausflug: ${t.module.trip.place}`}
      </p>
      <p className="small muted">{t.kind === 'home' ? 'Wir forschen zuhause.' : `Thema: ${t.module.title}`}</p>
    </Link>
  );
}

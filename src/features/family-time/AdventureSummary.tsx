import { adventureView, prepOpen } from '../../services/familyTime';
import type { WeekendAdventure } from '../../types';
import { formatWeekday } from '../../utils/dates';

/** Kurzer Stand des Wochenendabenteuers, freundlich formuliert (für Familienzeit und Heute-Bildschirm). */
export function AdventureSummary({ now, adventure }: { now: Date; adventure: WeekendAdventure | undefined }) {
  const view = adventureView(now, adventure);
  if (view === 'later') return <p className="ft-card__lead muted">Ab Freitagmittag planen wir zusammen, wohin es am Wochenende geht.</p>;
  if (view === 'plan') return <p className="ft-card__lead"><strong>Unser Wochenendabenteuer planen:</strong> Wohin geht es dieses Wochenende?</p>;
  if (view === 'reminder') return <p className="ft-card__lead"><strong>Wollen wir heute noch unsere kleine Runde machen?</strong> Auch 20 Minuten zählen.</p>;
  if (!adventure) return null;
  const when = adventure.day ? `${formatWeekday(adventure.day)}${adventure.time ? `, ${adventure.time} Uhr` : ''}` : 'Tag noch offen';
  const head = <p className="ft-adv-title"><span aria-hidden="true">{adventure.emoji}</span> {adventure.title}</p>;
  if (view === 'done') return <>{head}<p className="ft-card__lead">Gemacht! Schön war's. 🎉</p></>;
  if (view === 'postponed') return <>{head}<p className="ft-card__lead muted">Verschoben{adventure.reason ? `: ${adventure.reason}` : ''}. Nächstes Wochenende schlagen wir es wieder vor.</p></>;
  if (view === 'cancelled') return <>{head}<p className="ft-card__lead muted">Fällt dieses Mal aus{adventure.reason ? `: ${adventure.reason}` : ''}. Das ist in Ordnung.</p></>;
  const open = adventure.packing.filter((p) => !p.done).length;
  return (
    <>
      {head}
      <p className="ft-card__lead">
        {when}
        {view === 'confirm' ? <> · <strong>Wart ihr unterwegs?</strong></> : prepOpen(adventure) ? <span className="muted"> · noch {open} {open === 1 ? 'Sache' : 'Sachen'} einpacken</span> : <span className="muted"> · alles gepackt</span>}
      </p>
    </>
  );
}

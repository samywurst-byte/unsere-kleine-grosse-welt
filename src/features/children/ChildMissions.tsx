import { Star } from 'lucide-react';
import { Icon } from '../../components/Icon';
import { db } from '../../database/db';
import { useMissionCompletions, useMissions } from '../../hooks/useData';
import { missionCompletionId, missionsFor, requestMission, withdrawMission } from '../../services/stars';
import type { ChildProfile, DateKey } from '../../types';

/** Freiwillige Zusatzmissionen. Wer mag, hilft mit; Mama oder Papa bestätigen, die Sterne kommen ins Familienglas. */
export function ChildMissions({ child, today }: { child: ChildProfile; today: DateKey }) {
  const missions = useMissions();
  const completions = useMissionCompletions(today);
  if (!missions || !completions) return null;
  const mine = missionsFor(missions, child.id);
  if (!mine.length) return null;
  return (
    <section className="board__missions" aria-label="Zusatzmissionen">
      <h2 className="card__eyebrow">Wenn du magst: Zusatzmissionen für unser Sternenglas</h2>
      <div className="missions">
        {mine.map((m) => {
          const c = completions.find((x) => x.id === missionCompletionId(m.id, child.id, today));
          const state = c?.status ?? 'open';
          return (
            <button
              key={m.id} type="button" className={`mission mission--${state}`}
              disabled={state === 'confirmed'}
              onClick={() => void (state === 'pending' ? withdrawMission(db, c!.id) : requestMission(db, m.id, child.id, today))}
              aria-label={`${m.title}: ${state === 'pending' ? 'wartet auf Mama oder Papa, zum Zurücknehmen tippen' : state === 'confirmed' ? 'geschafft, danke' : 'geschafft melden'}`}
            >
              <Icon name={m.icon} size={40} />
              {child.showLabels && <span className="mission__title">{m.title}</span>}
              <span className="mission__stars" aria-hidden="true">{Array.from({ length: m.stars }, (_, i) => <Star key={i} size={18} fill="currentColor" />)}</span>
              <span className="mission__state">
                {state === 'open' && 'Geschafft!'}
                {state === 'pending' && 'Mama oder Papa schauen gleich'}
                {state === 'confirmed' && 'Danke! Im Sternenglas'}
                {state === 'declined' && 'Nochmal probieren?'}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

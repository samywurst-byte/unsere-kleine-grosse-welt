import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../../database/db';
import { useExplorerSundays, useProjects } from '../../hooks/useData';
import { explorerTeaser } from '../../services/explorer';
import { childProjects, requestProjectTask, withdrawProjectTask } from '../../services/projects';
import type { ChildProfile, DateKey } from '../../types';

/**
 * Mein Projekt: die eigenen Aufgaben aus laufenden Familienprojekten. Das Kind meldet „geschafft“,
 * Mama oder Papa bestätigen. Dazu ab Donnerstag die Vorfreude auf den Entdeckersonntag.
 */
export function ChildProject({ child, today }: { child: ChildProfile; today: DateKey }) {
  const projects = useProjects();
  const sundays = useExplorerSundays();
  if (!projects || !sundays) return null;
  const mine = childProjects(projects, child.id);
  const teaser = explorerTeaser(today, sundays);
  if (!mine.length && !teaser) return null;
  return (
    <section className="board__project" aria-label="Mein Projekt">
      {teaser && (
        <Link to={`/entdecken/sonntage/${teaser.module.id}`} className="board__explorer">
          <span className="board__explorer-emoji" aria-hidden="true">{teaser.kind === 'home' ? '🔭' : '🏛️'}</span>
          <span>
            <strong>{teaser.daysLeft === 0 ? 'Heute' : teaser.daysLeft === 1 ? 'Morgen' : 'Am Sonntag'} ist Entdeckersonntag!</strong><br />
            {teaser.kind === 'home' ? teaser.module.title : `Ausflug: ${teaser.module.trip.place}`}
          </span>
        </Link>
      )}
      {mine.map(({ project, tasks }) => {
        const done = tasks.filter((t) => t.done).length;
        const open = tasks.filter((t) => !t.done);
        return (
          <div key={project.id} className="board__project-block">
            <h2 className="card__eyebrow">
              <span aria-hidden="true">{project.emoji}</span> Mein Projekt: {project.title}
              {done > 0 && <span className="board__project-count"> · {done} von {tasks.length} geschafft</span>}
            </h2>
            {open.length === 0 ? (
              <p className="board__hint"><Check size={20} aria-hidden="true" /> Alle deine Projektaufgaben sind geschafft. Toll!</p>
            ) : (
              <div className="missions">
                {open.map((t) => {
                  const pending = !!t.requestedAt;
                  return (
                    <button key={t.id} type="button" className={`mission mission--${pending ? 'pending' : 'open'} project-task`}
                      onClick={() => void (pending ? withdrawProjectTask(db, project.id, t.id) : requestProjectTask(db, project.id, t.id))}
                      aria-label={`${t.label}: ${pending ? 'wartet auf Mama oder Papa, zum Zurücknehmen tippen' : 'geschafft melden'}`}>
                      <span className="mission__title">{t.label}</span>
                      <span className="mission__state">{pending ? 'Mama oder Papa schauen gleich' : 'Geschafft!'}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

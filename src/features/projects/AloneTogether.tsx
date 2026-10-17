import type { ProjectIdea } from '../../data/projects';

/** Was die Kinder allein schaffen und was ihr zusammen macht. */
export function AloneTogether({ idea }: { idea: Pick<ProjectIdea, 'alone' | 'together' | 'stand'> }) {
  if (!idea.alone?.length && !idea.together?.length && !idea.stand) return null;
  return (
    <div className="pj-split">
      {idea.alone?.length ? (
        <div className="pj-split__col">
          <p className="pj-split__head">🧒 Das schaffen die Kinder allein</p>
          <ul>{idea.alone.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      ) : null}
      {idea.together?.length ? (
        <div className="pj-split__col">
          <p className="pj-split__head">👪 Das macht ihr zusammen</p>
          <ul>{idea.together.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      ) : null}
      {idea.stand && (
        <p className="pj-split__stand small">🏪 Mit Verkaufsstand: Schild, Preise, Kasse und Wechselgeld stehen in den Schritten. Unter „Projektblätter“ gibt es Verkaufsschild, Preisschilder und Kassenzettel zum Drucken.</p>
      )}
    </div>
  );
}

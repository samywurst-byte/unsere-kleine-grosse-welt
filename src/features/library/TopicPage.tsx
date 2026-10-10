import { ArrowLeft, Check, Printer, Volume2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { DISCOVER_TOPIC_BY_ID, TIMELINE, type DiscoverTopic, type QuizItem } from '../../data/discover';
import { LEVEL_LABEL, PROJECT_IDEA_BY_ID } from '../../data/projects';
import { db } from '../../database/db';
import { useAllLearning, useChildren, useDiscoveries } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { canSpeak, discoveryId, readableWords, speak, toggleDiscovery } from '../../services/discover';
import { goalStates } from '../../services/learning';
import { knownLetters, projectLevel } from '../../services/projects';
import { formatLong, toDateKey } from '../../utils/dates';
import './library.css';

export function TopicPage() {
  const { topicId } = useParams();
  const topic = topicId ? DISCOVER_TOPIC_BY_ID.get(topicId) : undefined;
  if (!topic) return <p className="empty">Dieses Thema gibt es nicht. <Link to="/entdecken">Zur Entdeckerwelt</Link></p>;
  return <Topic topic={topic} />;
}

function Topic({ topic }: { topic: DiscoverTopic }) {
  const today = toDateKey(useNow(60_000));
  const discoveries = useDiscoveries();
  const speech = canSpeak();
  const project = topic.projectId ? PROJECT_IDEA_BY_ID.get(topic.projectId) : undefined;
  if (!discoveries) return null;
  const done = new Map(discoveries.map((d) => [d.id, d]));

  return (
    <div>
      <header className="page-head">
        <Link to="/entdecken" className="btn btn--icon btn--ghost" aria-label="Zurück zur Entdeckerwelt"><ArrowLeft size={22} /></Link>
        <span className="lib-head-emoji" aria-hidden="true">{topic.emoji}</span>
        <h1>{topic.title}</h1>
        <div className="spacer" />
        <PrintSheet topic={topic} />
      </header>
      <p className="lib-intro">{topic.intro}</p>

      {topic.timeline && <Timeline />}

      <div className="lib-grid2">
        <div className="stack">
          <section className="card">
            <h2 className="card__title">Wusstest du?</h2>
            <ul className="lib-facts">
              {topic.facts.map((f, i) => (
                <li key={i} className="lib-fact">
                  <p>{f.text}<sup><a href={`#quelle-${f.source + 1}`} aria-label={`Quelle ${f.source + 1}`}>[{f.source + 1}]</a></sup></p>
                  {speech && <button type="button" className="btn btn--icon btn--small btn--ghost lib-speak" aria-label="Vorlesen" onClick={() => speak(f.text)}><Volume2 size={20} /></button>}
                </li>
              ))}
            </ul>
          </section>
          <Quiz items={topic.quiz} speech={speech} />
          <section className="card">
            <h2 className="card__title">Quellen</h2>
            <ol className="lib-sources">
              {topic.sources.map((s, i) => (
                <li key={s.url} id={`quelle-${i + 1}`}>{s.publisher}: <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a></li>
              ))}
            </ol>
            <p className="small muted">Geprüft am 10. Oktober 2026.</p>
          </section>
        </div>
        <div className="stack">
          <section className="card">
            <h2 className="card__title">Forscheraufträge</h2>
            <div className="lib-missions">
              {topic.missions.map((m) => {
                const d = done.get(discoveryId(topic.id, m.id));
                return (
                  <div key={m.id} className={`lib-mission ${d ? 'is-done' : ''}`}>
                    <h3 className="lib-mission__title">{m.title}{m.levels && <span className="chip">{m.levels.map((l) => LEVEL_LABEL[l]).join(' · ')}</span>}</h3>
                    <p>{m.how}</p>
                    {m.materials && <p className="small muted">Das brauchen wir: {m.materials.join(', ')}</p>}
                    {m.safety && <p className="small"><strong>Für Erwachsene:</strong> {m.safety}</p>}
                    <button type="button" className={`btn btn--small ${d ? 'btn--sage' : ''}`} aria-pressed={!!d} onClick={() => void toggleDiscovery(db, topic.id, m.id, today)}>
                      <Check size={16} aria-hidden="true" /> {d ? `Erforscht am ${formatLong(d.date)}` : 'Haben wir erforscht'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
          <Words topic={topic} today={today} />
          {(topic.trip || project) && (
            <section className="card stack">
              <h2 className="card__title">Weiterforschen</h2>
              {topic.trip && <p><strong>Ausflugsidee:</strong> {topic.trip}</p>}
              {project && <Link to={`/projekte?idee=${project.id}`} className="btn btn--sky">{project.emoji} Als Projekt starten: {project.title}</Link>}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/** Ein Rätsel nach dem anderen. Kein Punktestand, nur Staunen. */
function Quiz({ items, speech }: { items: QuizItem[]; speech: boolean }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const item = items[index % items.length];
  if (!item) return null;
  const next = () => { setPicked(null); setIndex(index + 1); };
  return (
    <section className="card">
      <h2 className="card__title">Rätsel {(index % items.length) + 1} von {items.length}</h2>
      <p className="lib-quiz__q">{item.question}{speech && <button type="button" className="btn btn--icon btn--small btn--ghost lib-speak" aria-label="Frage vorlesen" onClick={() => speak(`${item.question} ${item.options.join(', oder ')}?`)}><Volume2 size={18} /></button>}</p>
      <div className="lib-quiz__opts">
        {item.options.map((o, i) => (
          <button key={o} type="button" disabled={picked !== null}
            className={`lib-quiz__opt ${picked !== null && i === item.answer ? 'is-right' : ''} ${picked === i && i !== item.answer ? 'is-picked' : ''}`}
            onClick={() => { setPicked(i); if (speech) speak(i === item.answer ? `Genau! ${item.explain}` : `Fast! ${item.explain}`); }}>{o}</button>
        ))}
      </div>
      {picked !== null && (
        <>
          <p className="lib-quiz__answer"><strong>{picked === item.answer ? 'Genau!' : 'Fast!'}</strong> {item.explain}</p>
          <button type="button" className="btn btn--small" style={{ marginTop: 'var(--space-2)' }} onClick={next}>{index % items.length === items.length - 1 ? 'Nochmal von vorn' : 'Nächstes Rätsel'}</button>
        </>
      )}
    </section>
  );
}

/** Wörter zum Thema: Lesekinder sehen, was sie schon lesen können; alle anderen spuren nach. */
function Words({ topic, today }: { topic: DiscoverTopic; today: string }) {
  const children = useChildren();
  const learning = useAllLearning();
  const rows = useMemo(() => {
    if (!children || !learning) return [];
    return children.map((c) => {
      const states = goalStates(c.id, learning.observations, learning.releases, today);
      const level = projectLevel(c, today, states);
      return { child: c, level, words: level === 'school' ? topic.words : level === 'reader' ? readableWords(topic.words, knownLetters(states)) : [] };
    }).filter((r) => r.level === 'reader' || r.level === 'school');
  }, [children, learning, today, topic]);
  if (!rows.length) return null;
  return (
    <section className="card">
      <h2 className="card__title">Wörter zum Thema</h2>
      <div className="lib-words">
        {rows.map(({ child, words }) => (
          <div key={child.id} className={`lib-word-row tone-${child.color}`}>
            <Avatar avatar={child.avatar} color={child.color} size={44} />
            {words.length ? <>{words.map((w) => <span key={w} className="lib-word">{w}</span>)}</>
              : <span className="small muted">{child.name}: Noch keines dieser Wörter besteht nur aus sicheren Buchstaben. Zum Nachspuren: {topic.words.slice(0, 3).join(', ')}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

const SEG_COLORS = ['var(--c-lavender-ink)', 'var(--c-sky-ink)', 'var(--c-sage-ink)', 'var(--c-gold-ink)'];

/** Zeitstrahl ab der Trias: maßstabsgetreu, die Menschen sind nur ein Strich ganz am Ende. */
function Timeline() {
  const total = TIMELINE[0].from;
  return (
    <section className="card">
      <h2 className="card__title">Der Zeitstrahl</h2>
      <div className="lib-timeline">
        <div className="lib-timeline__bar" role="img" aria-label="Zeitstrahl: Trias, Jura, Kreide, Erdneuzeit. Die Menschen sind ein winziger Strich ganz am Ende.">
          {TIMELINE.map((s, i) => (
            <div key={s.id} className="lib-timeline__seg" style={{ flex: (s.from - s.to) / total, background: SEG_COLORS[i] }}>
              {s.label}{i < 3 ? ' 🦕' : ''}
            </div>
          ))}
        </div>
        <div className="lib-timeline__marker" aria-hidden="true" />
        <div className="lib-timeline__scale">
          {TIMELINE.map((s, i) => (
            <span key={s.id} style={{ left: `${((total - s.from) / total) * 100}%` }}>{i === 0 ? `vor ${s.from} Mio. Jahren` : `vor ${s.from} Mio.`}</span>
          ))}
          <span style={{ left: '100%', transform: 'translateX(-100%)' }}>heute</span>
        </div>
        <p className="lib-timeline__note">Hier, ganz am Ende, kommen wir Menschen: vor etwa 315.000 Jahren 👆</p>
      </div>
    </section>
  );
}

function PrintSheet({ topic }: { topic: DiscoverTopic }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const print = async () => {
    setBusy(true); setError(null);
    try {
      const { renderTopicSheet } = await import('../../services/projectPdf');
      const { loadWorksheetFonts } = await import('../../services/worksheetPdf');
      const bytes = await renderTopicSheet(topic, undefined, topic.words, await loadWorksheetFonts());
      const name = `Forscherblatt ${topic.title}.pdf`.replace(/[\\/:*?"<>|]/g, '');
      const file = new File([bytes as BlobPart], name, { type: 'application/pdf' });
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: name }); } catch { /* abgebrochen */ }
      } else {
        const url = URL.createObjectURL(file);
        window.open(url, '_blank');
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Das PDF konnte nicht erstellt werden.');
    } finally { setBusy(false); }
  };
  return (
    <>
      <button type="button" className="btn btn--small" disabled={busy} onClick={() => void print()}><Printer size={16} aria-hidden="true" /> {busy ? 'Erstelle PDF …' : 'Forscherblatt'}</button>
      {error && <p className="notice notice--error">{error}</p>}
    </>
  );
}

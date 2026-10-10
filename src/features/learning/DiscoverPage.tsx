import { ChevronLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { LETTER_ORDER } from '../../data/readingCurriculum';
import { useChildren, useLearning } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { goalStates, pathPhase, todaysLetter, type GoalState } from '../../services/learning';
import { seededRandom } from '../../services/learningPack';
import { readingBox, syllablesOf } from '../../services/reading';
import { toDateKey } from '../../utils/dates';
import '../children/children.css';
import './learning.css';

/** Kinderansicht: Wer entdeckt heute etwas? */
export function DiscoverPickerPage() {
  const children = useChildren();
  return (
    <div>
      <header className="page-head"><h1>Wir entdecken Buchstaben</h1></header>
      <div className="child-picker">
        {children?.map((c) => (
          <Link key={c.id} to={`/lernen/${c.id}`} className={`child-picker__item tone-${c.color}`}>
            <Avatar avatar={c.avatar} color={c.color} size={180} />
            <span className="child-picker__name">{c.name}</span>
          </Link>
        ))}
      </div>
      <p className="small muted" style={{ marginTop: 'var(--space-5)', textAlign: 'center' }}>
        Ein paar Minuten gemeinsam am Tablet, der Rest passiert am Tisch, mit Papier, Knete und Stiften.
      </p>
    </div>
  );
}

/**
 * Gemeinsamer Einstieg in den Lernblock: der aktuelle Buchstabe groß, vier kleine Ideen zum Mitmachen.
 * Keine Punkte, keine Bewertung. Abgehakt wird nur für heute, gespeichert wird nichts.
 * Was das Kind schon kann, tragen die Eltern im Elternbereich ein.
 */
export function DiscoverPage() {
  const { childId } = useParams();
  const children = useChildren();
  const child = children?.find((c) => c.id === childId);
  const today = toDateKey(useNow(60_000));
  const data = useLearning(childId);
  const [done, setDone] = useState<Set<string>>(new Set());
  const states = useMemo(() => (data && child ? goalStates(child.id, data.observations, data.releases, today) : []), [data, child, today]);

  if (children && !child) return <p className="empty">Dieses Profil gibt es nicht mehr. <Link to="/lernen">Zurück</Link></p>;
  if (!child || !data) return null;

  const current = todaysLetter(states);
  const found = LETTER_ORDER.map((id) => states.find((s) => s.goal.id === id)!).filter((s) => s.released);
  const phase = pathPhase(child, today);
  const toggle = (a: string) => setDone((d) => { const n = new Set(d); if (n.has(a)) n.delete(a); else n.add(a); return n; });

  return (
    <div className={`tone-${child.color}`}>
      <header className="board__head">
        <Link to="/lernen" className="btn btn--icon btn--ghost" aria-label="Zurück"><ChevronLeft /></Link>
        <Avatar avatar={child.avatar} color={child.color} size={84} />
        <div>
          <h1 className="board__name">{child.name}</h1>
          {phase.kind === 'active' && <p className="muted">Noch {phase.daysUntilSchool} Tage bis zur Schule 🎒</p>}
        </div>
      </header>

      {!current ? (
        <div className="card discover__letter-card" style={{ marginTop: 'var(--space-4)' }}>
          <div className="discover__emoji" aria-hidden="true">🔤</div>
          <h2>Bald geht es los!</h2>
          <p className="muted">Mama oder Papa suchen den ersten Buchstaben für dich aus.</p>
        </div>
      ) : (
        <div className="discover" style={{ marginTop: 'var(--space-4)' }}>
          <div className="card discover__letter-card">
            <p className="card__eyebrow">Heute entdecken wir</p>
            <div className="discover__letters" aria-label={current.goal.title}>
              {current.goal.letter!.upper}{current.goal.letter!.upper !== current.goal.letter!.lower && <> <span>{current.goal.letter!.lower}</span></>}
            </div>
            <div className="discover__emoji" aria-hidden="true">{current.goal.letter!.emoji}</div>
            <div className="discover__word">wie in {current.goal.letter!.word}</div>
          </div>
          <div className="stack">
            <div className="card">
              <h2 className="card__title">Unsere vier kleinen Aufgaben</h2>
              <div className="discover__todo">
                {current.goal.activities.map((a) => (
                  <button key={a} type="button" aria-pressed={done.has(a)} onClick={() => toggle(a)}>
                    <span aria-hidden="true">{done.has(a) ? '✅' : '⬜'}</span> {a}
                  </button>
                ))}
              </div>
              <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>{done.size} von {current.goal.activities.length} ausprobiert</p>
            </div>
            <ReadingBox states={states} seed={`${child.id}|${today}`} />
            {found.length > 0 && (
              <div className="card">
                <h2 className="card__title">Schon entdeckt</h2>
                <div className="found-letters">{found.map((s) => <span key={s.goal.id}>{s.goal.letter!.upper}{s.goal.letter!.upper !== s.goal.letter!.lower ? s.goal.letter!.lower : ''}</span>)}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Lesekiste: Wörter und Sätze, die das Kind mit seinen sicheren Buchstaben schon lesen kann.
 * Silben abwechselnd blau und rot. Das Kind liest Mama oder Papa vor, die App liest nichts vor.
 */
function ReadingBox({ states, seed }: { states: GoalState[]; seed: string }) {
  const box = useMemo(() => readingBox(states), [states]);
  const [mode, setMode] = useState<'words' | 'sentences'>('words');
  const [index, setIndex] = useState(0);
  const order = useMemo(() => {
    const list = box ? (mode === 'words' ? box.words : box.sentences) : [];
    const rnd = seededRandom(`${seed}|${mode}`);
    return list.map((x) => ({ x, k: rnd() })).sort((a, b) => a.k - b.k).map((e) => e.x);
  }, [box, mode, seed]);
  if (!box || box.words.length === 0) return null;
  const item = order[index % Math.max(1, order.length)];
  return (
    <div className="card reading-box">
      <div className="row">
        <h2 className="card__title" style={{ margin: 0, flex: 1 }}>📖 Lesekiste</h2>
        {box.showSentences && box.sentences.length > 0 && (
          <div className="seg" role="group" aria-label="Was lesen wir?">
            <button type="button" className="seg__item" aria-pressed={mode === 'words'} onClick={() => { setMode('words'); setIndex(0); }}>Wörter</button>
            <button type="button" className="seg__item" aria-pressed={mode === 'sentences'} onClick={() => { setMode('sentences'); setIndex(0); }}>Sätze</button>
          </div>
        )}
      </div>
      <p className={`reading-box__item ${mode === 'sentences' ? 'reading-box__item--sentence' : ''}`} aria-live="polite">
        {item?.split(' ').map((word, w) => (
          <span key={w} className="reading-box__word">
            {syllablesOf(word).map((syl, i) => <span key={i} className={i % 2 ? 'syl-b' : 'syl-a'}>{syl}</span>)}
          </span>
        ))}
      </p>
      <div className="row">
        <span className="small muted" style={{ flex: 1 }}>Lies es Mama oder Papa vor.</span>
        <button type="button" className="btn btn--sky" onClick={() => setIndex((i) => i + 1)}>{mode === 'words' ? 'Nächstes Wort' : 'Nächster Satz'}</button>
      </div>
    </div>
  );
}

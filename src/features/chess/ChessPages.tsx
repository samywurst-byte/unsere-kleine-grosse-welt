import { ArrowLeft, BookOpen, Lock } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { CHESS_LESSON_BY_ID, CHESS_LESSONS } from '../../data/chessLessons';
import { useChessProgress, useChildren } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { lessonStatuses, type LessonStatus } from '../../services/chessAcademy';
import type { ChessProgress, ChildProfile } from '../../types';
import { toDateKey, weekStartKey } from '../../utils/dates';
import { ExploreTabs } from '../library/ExploreTabs';
import { PieceIcon } from './ChessBoard';
import { MamaModal } from './chessParts';
import { LessonPlayer } from './LessonPlayer';
import './chess.css';

const LESSON_IDS = CHESS_LESSONS.map((l) => l.id);

export const STATUS_TEXT: Record<LessonStatus, string> = {
  secure: 'Geschafft',
  practice: 'Nochmal üben',
  open: 'Los geht’s',
  locked: 'Noch zu',
  'week-limit': 'Ab Montag',
};

export function useLessonStatuses(childId: string | undefined): { statuses: LessonStatus[]; progress: ChessProgress[] } | undefined {
  const progress = useChessProgress();
  const today = toDateKey(useNow(60_000));
  if (!progress || !childId) return undefined;
  return { statuses: lessonStatuses(LESSON_IDS, progress, childId, weekStartKey(today)), progress };
}

/** Schachakademie: Wer spielt heute? */
export function ChessHomePage() {
  const children = useChildren();
  const progress = useChessProgress();
  const [mama, setMama] = useState(false);
  if (!children || !progress) return null;
  return (
    <div>
      <header className="page-head">
        <h1>Schachakademie</h1>
        <span className="page-head__sub">Theo, Leo, Dana und Paul zeigen, wie Schach geht</span>
      </header>
      <ExploreTabs />
      <div className="stack">
        <section className="chess-castle card">
          <div className="chess-castle__figures" aria-hidden="true">
            {(['wR', 'wB', 'wQ', 'wN'] as const).map((p) => <PieceIcon key={p} piece={p} size={72} />)}
          </div>
          <p className="chess-castle__lead">Wer spielt heute? Tippe auf dein Bild.</p>
          <div className="chess-kids">
            {children.map((c) => {
              const badges = progress.filter((p) => p.childId === c.id && p.completedAt).length;
              return (
                <Link key={c.id} to={`/entdecken/schach/${c.id}`} className={`chess-kid tone-${c.color}`}>
                  <Avatar avatar={c.avatar} color={c.color} size={88} />
                  <span className="chess-kid__name">{c.name}</span>
                  <span className="chess-kid__badges">{badges ? `${badges} ${badges === 1 ? 'Abzeichen' : 'Abzeichen'}` : 'Noch kein Abzeichen'}</span>
                </Link>
              );
            })}
          </div>
        </section>
        <section className="card">
          <h2 className="card__title"><BookOpen size={22} aria-hidden="true" /> Mama und Papa lernen mit</h2>
          <p className="muted">Zu jeder Lektion gibt es eine Erklärung in einer Minute und einen Vorschlag für das echte Brett. Ihr müsst selbst noch kein Schach können.</p>
          <div className="row row--wrap">
            <button type="button" className="btn" onClick={() => setMama(true)}>Alle Erklärungen ansehen</button>
            <Link to="/eltern/schach" className="btn btn--ghost">Fortschritt und Freigaben (Eltern)</Link>
          </div>
        </section>
      </div>
      {mama && <MamaModal lessons={CHESS_LESSONS} onClose={() => setMama(false)} />}
    </div>
  );
}

/** Die Abenteuerkarte eines Kindes. */
export function ChessMapPage() {
  const { childId } = useParams();
  const children = useChildren();
  const state = useLessonStatuses(childId);
  if (!children || !state) return null;
  const child = children.find((c) => c.id === childId);
  if (!child) return <p className="card">Dieses Kind gibt es nicht.</p>;
  const { statuses, progress } = state;
  const nextIndex = statuses.findIndex((s) => s === 'open' || s === 'practice');
  const next = nextIndex >= 0 ? CHESS_LESSONS[nextIndex] : undefined;
  const badges = CHESS_LESSONS.filter((l) => progress.some((p) => p.childId === child.id && p.lessonId === l.id && p.completedAt));

  return (
    <div>
      <header className="page-head">
        <Link to="/entdecken/schach" className="btn btn--icon btn--ghost" aria-label="Zurück zur Schachakademie"><ArrowLeft size={22} /></Link>
        <Avatar avatar={child.avatar} color={child.color} size={48} />
        <h1>{child.name} in der Schachburg</h1>
      </header>
      <div className="stack">
        {next && (
          <Link to={`/entdecken/schach/${child.id}/${next.id}`} className={`card chess-next tone-${child.color}`}>
            <PieceIcon piece={next.figure.piece} size={80} />
            <span>
              <span className="chess-next__eyebrow">{statuses[nextIndex] === 'practice' ? 'Nochmal üben' : 'Weiter geht’s'}</span>
              <span className="chess-next__title">{next.title}</span>
            </span>
          </Link>
        )}
        {!next && statuses.includes('week-limit') && (
          <p className="card chess-wait">🌙 Für diese Woche hast du genug Neues gelernt. Neue Abenteuer gibt es ab Montag. Alte Abenteuer kannst du immer wiederholen!</p>
        )}
        <section className="chess-map" aria-label="Abenteuerkarte">
          {CHESS_LESSONS.map((l, i) => {
            const s = statuses[i];
            const playable = s !== 'locked' && s !== 'week-limit';
            const body = (
              <>
                <span className="chess-stop__badge" aria-hidden="true">{s === 'secure' || s === 'practice' ? l.badge.emoji : playable ? <PieceIcon piece={l.figure.piece} size={44} /> : <Lock size={28} />}</span>
                <span className="chess-stop__title">{l.title}</span>
                <span className={`chess-stop__state chess-stop__state--${s}`}>{STATUS_TEXT[s]}</span>
              </>
            );
            return playable
              ? <Link key={l.id} to={`/entdecken/schach/${child.id}/${l.id}`} className={`chess-stop chess-stop--${s}`}>{body}</Link>
              : <div key={l.id} className={`chess-stop chess-stop--${s}`} aria-disabled="true">{body}</div>;
          })}
        </section>
        <section className="card">
          <h2 className="card__title">Meine Abzeichen</h2>
          {badges.length ? (
            <div className="chess-badges">
              {badges.map((l) => <span key={l.id} className="chess-badge"><span className="chess-badge__emoji" aria-hidden="true">{l.badge.emoji}</span>{l.badge.name}</span>)}
            </div>
          ) : <p className="muted">Nach jedem Abenteuer bekommst du ein Abzeichen.</p>}
        </section>
      </div>
    </div>
  );
}

/** Eine Lektion spielen. */
export function ChessLessonPage() {
  const { childId, lessonId } = useParams();
  const children = useChildren();
  const state = useLessonStatuses(childId);
  if (!children || !state) return null;
  const child: ChildProfile | undefined = children.find((c) => c.id === childId);
  const lesson = lessonId ? CHESS_LESSON_BY_ID.get(lessonId) : undefined;
  if (!child || !lesson) return <p className="card">Diese Lektion gibt es nicht.</p>;
  const index = CHESS_LESSONS.indexOf(lesson);
  const status = state.statuses[index];
  const progress = state.progress.find((p) => p.childId === child.id && p.lessonId === lesson.id);
  if (status === 'locked' || status === 'week-limit') {
    return (
      <div className="stack">
        <Link to={`/entdecken/schach/${child.id}`} className="btn btn--ghost"><ArrowLeft size={20} aria-hidden="true" /> Zur Karte</Link>
        <p className="card chess-wait">{status === 'week-limit' ? '🌙 Neue Abenteuer gibt es ab Montag.' : '🔒 Dieses Abenteuer öffnet sich, wenn das vorige gut klappt.'}</p>
      </div>
    );
  }
  return <LessonPlayer key={`${child.id}|${lesson.id}`} child={child} lesson={lesson} mirrored={(progress?.runs ?? 0) % 2 === 1} />;
}

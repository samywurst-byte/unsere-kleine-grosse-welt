import { useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { CHESS_LESSONS } from '../../data/chessLessons';
import { db } from '../../database/db';
import { useChessProgress, useChildren } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { lessonStatuses, NEW_LESSONS_PER_WEEK, SECURE_MAX_MISTAKES, setChessRelease, type LessonStatus } from '../../services/chessAcademy';
import { formatLong, toDateKey, weekStartKey } from '../../utils/dates';
import { PieceIcon } from './ChessBoard';
import { STATUS_TEXT } from './ChessPages';
import { MamaModal } from './chessParts';
import './chess.css';

const IDS = CHESS_LESSONS.map((l) => l.id);

/** Elternbereich: was jedes Kind im Schach schon kann, was als Nächstes dran ist, vorzeitige Freigaben. */
export function ChessSettings() {
  const children = useChildren();
  const progress = useChessProgress();
  const today = toDateKey(useNow(60_000));
  const [mama, setMama] = useState(false);
  if (!children || !progress) return null;
  const week = weekStartKey(today);

  return (
    <div className="parent-section">
      <div className="parent-section__head">
        <h2>Schachakademie</h2>
        <button type="button" className="btn" onClick={() => setMama(true)}>Mama und Papa lernen mit</button>
      </div>
      <p className="small muted">
        Eine Lektion gilt als sicher, wenn eine Runde mit höchstens {SECURE_MAX_MISTAKES} Fehlern gelingt. Dann öffnet sich die nächste,
        höchstens {NEW_LESSONS_PER_WEEK} neue pro Woche. Wiederholen geht immer, beim Wiederholen sind die Aufgaben gespiegelt.
        Ihr könnt eine Lektion auch früher freigeben.
      </p>
      {children.map((c) => {
        const statuses = lessonStatuses(IDS, progress, c.id, week);
        const mine = progress.filter((p) => p.childId === c.id);
        const nextAdvice = advice(statuses);
        return (
          <section key={c.id} className="card">
            <h3 className="card__title"><Avatar avatar={c.avatar} color={c.color} size={36} /> {c.name}</h3>
            <p className="chess-advice">{nextAdvice}</p>
            <ul className="list">
              {CHESS_LESSONS.map((l, i) => {
                const p = mine.find((x) => x.lessonId === l.id);
                const s = statuses[i];
                return (
                  <li key={l.id} className="list-item">
                    <PieceIcon piece={l.figure.piece} size={32} />
                    <div className="list-item__main">
                      <p className="list-item__title">{l.title} <span className={`chess-stop__state chess-stop__state--${s}`}>{STATUS_TEXT[s]}</span></p>
                      <p className="list-item__meta">
                        Woche {l.week}
                        {p?.runs ? ` · ${p.runs}× gespielt · zuletzt ${p.lastMistakes ?? 0} ${p.lastMistakes === 1 ? 'Fehler' : 'Fehler'}` : ''}
                        {p?.completedAt ? ` · am ${formatLong(p.completedAt.slice(0, 10))}` : ''}
                        {p?.realBoard ? ` · ${p.realBoard}× am echten Brett` : ''}
                        {p?.released && !p.completedAt ? ' · von euch freigegeben' : ''}
                      </p>
                    </div>
                    {(s === 'locked' || s === 'week-limit') && (
                      <button type="button" className="btn btn--small" onClick={() => void setChessRelease(db, c.id, l.id, true)}>Freigeben</button>
                    )}
                    {p?.released && !p.completedAt && (
                      <button type="button" className="btn btn--small btn--ghost" onClick={() => void setChessRelease(db, c.id, l.id, false)}>Freigabe zurück</button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      <p className="small muted">Figurenbilder: Cburnett und Rfc1394 (Wikimedia Commons), CC BY-SA 3.0, angepasst von cm-chessboard. Zugregeln: chess.js (BSD-Lizenz).</p>
      {mama && <MamaModal lessons={CHESS_LESSONS} onClose={() => setMama(false)} />}
    </div>
  );
}

function advice(statuses: LessonStatus[]): string {
  const practice = statuses.indexOf('practice');
  if (practice >= 0) return `Sinnvoll als Nächstes: „${CHESS_LESSONS[practice].title}“ wiederholen, das sitzt noch nicht ganz.`;
  const open = statuses.indexOf('open');
  if (open >= 0) return `Als Nächstes dran: „${CHESS_LESSONS[open].title}“.`;
  const wait = statuses.indexOf('week-limit');
  if (wait >= 0) return `Diese Woche ist genug Neues gelernt. Ab Montag: „${CHESS_LESSONS[wait].title}“. Bis dahin gern am echten Brett wiederholen.`;
  return 'Welt 1 ist geschafft! Weitere Lektionen kommen mit dem nächsten Paket.';
}

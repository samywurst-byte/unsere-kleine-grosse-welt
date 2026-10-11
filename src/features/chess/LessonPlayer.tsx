import { ArrowLeft, ArrowRight, Check, Eye, Hand, Tablet } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PRAISE, type ChessLesson } from '../../data/chessLessons';
import { db } from '../../database/db';
import {
  applyMove, initialState, mirrorExercise, saveChessRun, solveCollect, tapTargets, targetsFrom, whichAnswers,
  type Board, type ChessExercise, type ExerciseState,
} from '../../services/chessAcademy';
import { speak } from '../../services/discover';
import type { ChildProfile } from '../../types';
import { ChessBoard, PieceIcon, type BoardMarks } from './ChessBoard';
import { MamaModal, RestartButton, SpeakButton } from './chessParts';

type Stage = { kind: 'intro' } | { kind: 'demo' } | { kind: 'ex'; index: number } | { kind: 'done'; newBadge: boolean; secure: boolean };
type Mode = 'tablet' | 'real';

const praise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];

/** Eine Lektion: Einführung, Vorführung, Übungen, Abzeichen. */
export function LessonPlayer({ child, lesson, mirrored }: { child: ChildProfile; lesson: ChessLesson; mirrored: boolean }) {
  const exercises = useMemo(() => lesson.exercises.map((e) => (mirrored ? mirrorExercise(e) : e)), [lesson, mirrored]);
  const [stage, setStage] = useState<Stage>({ kind: 'intro' });
  const [mode, setMode] = useState<Mode>('tablet');
  const [mistakes, setMistakes] = useState(0);
  const [realSolved, setRealSolved] = useState(0);
  const [mama, setMama] = useState(false);
  const saving = useRef(false);

  const nextAfter = async (index: number) => {
    if (index + 1 < exercises.length) { setStage({ kind: 'ex', index: index + 1 }); return; }
    if (saving.current) return;
    saving.current = true;
    const { progress, newBadge } = await saveChessRun(db, child.id, lesson.id, mistakes, realSolved);
    setStage({ kind: 'done', newBadge, secure: progress.secure });
    speak(newBadge ? `Geschafft! Du bekommst das Abzeichen ${lesson.badge.name}.` : 'Geschafft! Super gemacht.');
  };

  return (
    <div className="chess-lesson">
      <header className="page-head chess-lesson__head">
        <Link to={`/entdecken/schach/${child.id}`} className="btn btn--icon btn--ghost" aria-label="Zur Abenteuerkarte"><ArrowLeft size={22} /></Link>
        <PieceIcon piece={lesson.figure.piece} size={44} />
        <h1>{lesson.title}</h1>
        <div className="spacer" />
        <div className="seg" role="group" aria-label="Wo spielen wir?">
          <button type="button" className="seg__item" aria-pressed={mode === 'tablet'} onClick={() => setMode('tablet')}><Tablet size={16} aria-hidden="true" /> Am Tablet</button>
          <button type="button" className="seg__item" aria-pressed={mode === 'real'} onClick={() => setMode('real')}><Hand size={16} aria-hidden="true" /> Am echten Brett</button>
        </div>
        <button type="button" className="btn btn--small" onClick={() => setMama(true)}>Für Mama</button>
      </header>

      {stage.kind === 'intro' && (
        <section className="card chess-intro">
          <PieceIcon piece={lesson.figure.piece} size={150} />
          <div className="chess-intro__text">
            <p className="chess-intro__name">{lesson.figure.name}</p>
            <p className="chess-say">{lesson.intro}</p>
            <div className="row row--wrap">
              <button type="button" className="btn btn--primary btn--big" onClick={() => { speak(lesson.intro); setStage(lesson.demo ? { kind: 'demo' } : { kind: 'ex', index: 0 }); }}>
                Los geht’s <ArrowRight size={22} aria-hidden="true" />
              </button>
              <SpeakButton text={lesson.intro} />
            </div>
          </div>
        </section>
      )}

      {stage.kind === 'demo' && lesson.demo && <Demo demo={lesson.demo} intro={lesson.intro} onNext={() => setStage({ kind: 'ex', index: 0 })} />}

      {stage.kind === 'ex' && (
        <ExerciseView key={`${stage.index}|${mode}`} ex={exercises[stage.index]} index={stage.index} total={exercises.length} mode={mode}
          onMistake={() => setMistakes((m) => m + 1)}
          onSolved={(real) => { if (real) setRealSolved((n) => n + 1); }}
          onNext={() => void nextAfter(stage.index)} />
      )}

      {stage.kind === 'done' && (
        <section className="card chess-done">
          <span className="chess-done__badge" aria-hidden="true">{lesson.badge.emoji}</span>
          <h2>{stage.newBadge ? `Neues Abzeichen: ${lesson.badge.name}!` : 'Geschafft!'}</h2>
          <p className="chess-say">
            {stage.secure ? 'Das klappt schon richtig gut.' : 'Das üben wir nächstes Mal nochmal, dann sitzt es.'}
          </p>
          <div className="row row--wrap">
            <Link to={`/entdecken/schach/${child.id}`} className="btn btn--primary btn--big">Zur Abenteuerkarte</Link>
          </div>
        </section>
      )}
      {mama && <MamaModal lessons={[lesson]} onClose={() => setMama(false)} />}
    </div>
  );
}

/** Vorführung: Zielfelder aufleuchten lassen, dann den Weg ablaufen. */
function Demo({ demo, intro, onNext }: { demo: NonNullable<ChessLesson['demo']>; intro: string; onNext: () => void }) {
  const [board, setBoard] = useState<Board>(demo.board);
  const [dots, setDots] = useState<string[]>([]);
  const [round, setRound] = useState(0);
  useEffect(() => {
    void intro;
    speak(demo.say);
    setBoard(demo.board);
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setDots(targetsFrom(demo.board, demo.stones ?? [], demo.square)), 600));
    let at = demo.square;
    let b = demo.board;
    demo.path.forEach((to, i) => {
      timers.push(window.setTimeout(() => {
        const nb = { ...b };
        nb[to] = nb[at];
        delete nb[at];
        b = nb; at = to;
        setDots([]);
        setBoard(nb);
      }, 3000 + i * 1600));
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [demo, round, intro]);
  return (
    <section className="chess-play">
      <div className="chess-play__board"><ChessBoard board={board} stones={demo.stones} marks={{ dots }} label="Vorführung" /></div>
      <div className="chess-play__side">
        <p className="chess-step">Schau mal!</p>
        <p className="chess-say">{demo.say}</p>
        <div className="row row--wrap">
          <SpeakButton text={demo.say} />
          <button type="button" className="btn" onClick={() => setRound((r) => r + 1)}>Nochmal zeigen</button>
        </div>
        <button type="button" className="btn btn--primary btn--big" onClick={onNext}>Jetzt du! <ArrowRight size={22} aria-hidden="true" /></button>
      </div>
    </section>
  );
}

/** Eine Übung am Tablet oder am echten Brett. */
function ExerciseView({ ex, index, total, mode, onMistake, onSolved, onNext }: {
  ex: ChessExercise; index: number; total: number; mode: Mode;
  onMistake: () => void; onSolved: (real: boolean) => void; onNext: () => void;
}) {
  const [state, setState] = useState<ExerciseState>(() => initialState(ex));
  const [selected, setSelected] = useState<string | undefined>();
  const [found, setFound] = useState<string[]>([]);
  const [bad, setBad] = useState<string | undefined>();
  const [message, setMessage] = useState<string>(ex.say);
  const [solved, setSolved] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const solution = useMemo(() => (ex.kind === 'collect' ? solveCollect(ex) : null), [ex]);
  const stones = ex.kind === 'tap' ? [] : ex.stones ?? [];
  const last = index === total - 1;

  useEffect(() => { speak(ex.say); }, [ex]);

  const finish = (text: string, real = false) => {
    setSolved(true);
    setSelected(undefined);
    setMessage(text);
    speak(text);
    onSolved(real);
  };
  const wrong = (sq: string | undefined, hint: string) => {
    onMistake();
    setWrongCount((n) => n + 1);
    setBad(sq);
    window.setTimeout(() => setBad(undefined), 700);
    setMessage(hint);
    speak(hint);
  };
  const reset = () => {
    setState(initialState(ex)); setSelected(undefined); setFound([]); setSolved(false); setShowSolution(false); setMessage(ex.say); speak(ex.say);
  };

  const tryMove = (from: string, to: string) => {
    const legal = targetsFrom(state.board, stones, from);
    if (!legal.includes(to)) { wrong(to, ex.hint); return; }
    const next = applyMove(state, from, to);
    setState(next);
    setSelected(undefined);
    if (ex.kind === 'collect' && next.stars.length === 0) {
      const par = solution?.par ?? next.moves;
      finish(next.moves <= par
        ? `${praise()} Mit nur ${next.moves} ${next.moves === 1 ? 'Zug' : 'Zügen'}. Besser geht es nicht!`
        : `${praise()} Geschafft mit ${next.moves} Zügen. Es geht sogar mit ${par}. Probier es nochmal, wenn du magst.`);
    } else if (ex.kind === 'collect' && next.stars.length < state.stars.length) {
      setMessage(`${praise()} Noch ${next.stars.length} ${ex.flag ? '' : next.stars.length === 1 ? 'Stern' : 'Sterne'}.`.replace('  ', ' '));
    }
  };

  const onTap = (sq: string) => {
    if (solved || mode === 'real') return;
    switch (ex.kind) {
      case 'tap': {
        const targets = tapTargets(ex);
        if (!targets.includes(sq)) { wrong(sq, ex.hint); return; }
        if (!ex.all) { finish(praise()); setFound([sq]); return; }
        const f = found.includes(sq) ? found : [...found, sq];
        setFound(f);
        if (targets.every((t) => f.includes(t))) finish(praise());
        else speak(praise());
        return;
      }
      case 'moves': {
        if (sq === ex.square) return;
        const legal = targetsFrom(state.board, stones, ex.square);
        if (!legal.includes(sq)) { wrong(sq, ex.hint); return; }
        const f = found.includes(sq) ? found : [...found, sq];
        setFound(f);
        if (f.length >= ex.count) finish(`${praise()} Und schau: Auf alle grünen Punkte kann die Figur auch noch.`);
        else speak(`${f.length}`);
        return;
      }
      case 'which': {
        if (!state.board[sq]) return;
        if (whichAnswers(ex).includes(sq)) { setFound([sq]); finish(`${praise()} Genau die kommt zum Stern.`); }
        else { setSelected(sq); wrong(sq, ex.hint); }
        return;
      }
      case 'collect': {
        if (state.board[sq]) { setSelected(selected === sq ? undefined : sq); return; }
        if (!selected) { const t = 'Tippe zuerst auf eine Figur.'; setMessage(t); speak(t); return; }
        tryMove(selected, sq);
        return;
      }
    }
  };
  const onDrop = (from: string, to: string) => {
    if (solved || mode === 'real' || ex.kind !== 'collect') { onTap(to); return; }
    tryMove(from, to);
  };

  // Markierungen
  const marks: BoardMarks = { good: found, bad, selected };
  if (ex.kind === 'collect' && selected) marks.dots = targetsFrom(state.board, stones, selected);
  if (ex.kind === 'which' && selected) marks.dots = targetsFrom(state.board, stones, selected);
  if (ex.kind === 'moves' && (solved || wrongCount >= 2 || showSolution)) marks.dots = targetsFrom(state.board, stones, ex.square).filter((q) => !found.includes(q));
  if (showSolution) {
    if (ex.kind === 'tap') marks.good = tapTargets(ex);
    if (ex.kind === 'which') marks.good = whichAnswers(ex);
    if (ex.kind === 'collect' && solution) marks.numbers = Object.fromEntries(solution.path.map(([, to], i) => [to, i + 1]));
  }

  return (
    <section className="chess-play">
      <div className="chess-play__board">
        <ChessBoard board={state.board} stones={stones} stars={state.stars} flag={ex.kind === 'collect' && ex.flag} marks={marks}
          onTap={onTap} onDrop={onDrop} label={`Aufgabe ${index + 1}`} />
      </div>
      <div className="chess-play__side">
        <div className="chess-dots" aria-label={`Aufgabe ${index + 1} von ${total}`}>
          {Array.from({ length: total }, (_, i) => <span key={i} className={`chess-dots__dot ${i < index ? 'is-done' : i === index ? 'is-now' : ''}`} />)}
        </div>
        <p className="chess-step">{last ? 'Abschlussaufgabe' : `Aufgabe ${index + 1} von ${total}`}</p>
        <p className={`chess-say ${solved ? 'chess-say--good' : ''}`}>{message}</p>
        {ex.kind === 'collect' && !solved && mode === 'tablet' && <p className="small muted">Züge: {state.moves}</p>}
        <div className="row row--wrap">
          <SpeakButton text={message} />
          {mode === 'tablet' && !solved && (ex.kind === 'collect' && state.moves > 0) && <RestartButton onClick={reset} />}
          {mode === 'tablet' && solved && ex.kind === 'collect' && <RestartButton onClick={reset} />}
        </div>
        {mode === 'real' && !solved && (
          <div className="chess-real">
            <p className="small">Stellt die Figuren wie auf dem Bild auf das echte Brett und löst die Aufgabe dort.</p>
            <div className="row row--wrap">
              <button type="button" className="btn" onClick={() => setShowSolution(!showSolution)}><Eye size={18} aria-hidden="true" /> {showSolution ? 'Lösung ausblenden' : 'Lösung zeigen'}</button>
              <button type="button" className="btn btn--sage" onClick={() => finish(`${praise()} Am echten Brett geschafft!`, true)}><Check size={18} aria-hidden="true" /> Geschafft</button>
            </div>
          </div>
        )}
        {solved && (
          <button type="button" className="btn btn--primary btn--big" onClick={onNext}>
            {last ? 'Zum Abzeichen' : 'Weiter'} <ArrowRight size={22} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}

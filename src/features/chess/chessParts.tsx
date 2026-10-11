import { RotateCcw, Volume2 } from 'lucide-react';
import { Modal } from '../../components/Modal';
import type { ChessLesson } from '../../data/chessLessons';
import { canSpeak, speak } from '../../services/discover';
import { PieceIcon } from './ChessBoard';

/** „Mama lernt mit“: die Regeln einer oder aller Lektionen. */
export function MamaModal({ lessons, onClose }: { lessons: ChessLesson[]; onClose: () => void }) {
  return (
    <Modal title="Mama und Papa lernen mit" onClose={onClose} wide>
      <div className="stack">
        {lessons.map((l) => (
          <section key={l.id} className="chess-mama">
            <h3 className="chess-mama__title"><PieceIcon piece={l.figure.piece} size={36} /> {l.title}</h3>
            {l.mama.map((m, i) => <p key={i}>{m}</p>)}
            <p className="chess-mama__real"><strong>Am echten Brett:</strong> {l.realBoard}</p>
          </section>
        ))}
      </div>
    </Modal>
  );
}

export function SpeakButton({ text }: { text: string }) {
  if (!canSpeak()) return null;
  return <button type="button" className="btn btn--icon chess-speak" aria-label="Nochmal vorlesen" onClick={() => speak(text)}><Volume2 size={26} /></button>;
}

export function RestartButton({ onClick }: { onClick: () => void }) {
  return <button type="button" className="btn btn--ghost btn--small" onClick={onClick}><RotateCcw size={16} aria-hidden="true" /> Nochmal von vorn</button>;
}

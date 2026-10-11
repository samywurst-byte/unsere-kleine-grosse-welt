import { useRef } from 'react';
import { ALL_SQUARES, FILES, isLight, type Board, type PieceCode } from '../../services/chessAcademy';

export interface BoardMarks {
  /** Erlaubte Zielfelder (Punkte). */
  dots?: string[];
  /** Richtig gefundene Felder. */
  good?: string[];
  /** Kurz rot: falsch getippt. */
  bad?: string;
  /** Ausgewählte Figur. */
  selected?: string;
  /** Zahlen auf Feldern, z. B. der Lösungsweg. */
  numbers?: Record<string, number>;
}

const pieceHref = (p: PieceCode) => `chess/pieces.svg#${p.toLowerCase()}`;
const pos = (sq: string) => ({ x: FILES.indexOf(sq[0] as (typeof FILES)[number]), y: 8 - Number(sq[1]) });

export function PieceIcon({ piece, size }: { piece: PieceCode; size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className="cb-piece-svg" aria-hidden="true">
      <use href={pieceHref(piece)} />
    </svg>
  );
}

/**
 * Großes Schachbrett für das Wand-iPad. Figuren behalten ihre Identität, damit Züge sanft gleiten.
 * Bedienung: antippen oder ziehen. Steine und Sterne liegen auf den Feldern.
 */
export function ChessBoard({ board, stones = [], stars = [], flag, marks = {}, onTap, onDrop, label }: {
  board: Board; stones?: string[]; stars?: string[]; flag?: boolean; marks?: BoardMarks;
  onTap?: (sq: string) => void; onDrop?: (from: string, to: string) => void; label: string;
}) {
  const keys = useRef<{ board: Board; ids: Map<string, string>; n: number }>({ board: {}, ids: new Map(), n: 0 });
  // Figuren-Ids weitertragen: Ist eine Figur weg und dieselbe Art steht woanders neu, ist es dieselbe Figur.
  const prev = keys.current;
  if (prev.board !== board) {
    const ids = new Map<string, string>();
    const vacated = Object.keys(prev.board).filter((sq) => board[sq] !== prev.board[sq]);
    for (const [sq, p] of Object.entries(board)) {
      if (prev.board[sq] === p && prev.ids.has(sq)) { ids.set(sq, prev.ids.get(sq)!); continue; }
      const from = vacated.find((v) => prev.board[v] === p && prev.ids.has(v) && ![...ids.values()].includes(prev.ids.get(v)!));
      ids.set(sq, from ? prev.ids.get(from)! : `p${++prev.n}`);
    }
    keys.current = { board, ids, n: prev.n };
  }
  const ids = keys.current.ids;
  const down = useRef<string | null>(null);

  const squareAt = (x: number, y: number) => (document.elementFromPoint(x, y)?.closest('[data-sq]') as HTMLElement | null)?.dataset.sq;

  return (
    <div className="cb" role="grid" aria-label={label}
      onPointerDown={(e) => { down.current = squareAt(e.clientX, e.clientY) ?? null; }}
      onPointerUp={(e) => {
        const from = down.current;
        down.current = null;
        const to = squareAt(e.clientX, e.clientY);
        if (!from || !to) return;
        if (from !== to && board[from] && onDrop) onDrop(from, to);
        else onTap?.(to);
      }}>
      {ALL_SQUARES.map((sq) => {
        const cls = [
          'cb-sq', isLight(sq) ? 'cb-sq--light' : 'cb-sq--dark',
          marks.selected === sq ? 'is-selected' : '', marks.good?.includes(sq) ? 'is-good' : '', marks.bad === sq ? 'is-bad' : '',
        ].join(' ');
        return (
          <div key={sq} className={cls} data-sq={sq} role="gridcell" aria-label={sq}>
            {sq[1] === '1' && <span className="cb-coord cb-coord--file">{sq[0]}</span>}
            {sq[0] === 'a' && <span className="cb-coord cb-coord--rank">{sq[1]}</span>}
            {stones.includes(sq) && <span className="cb-stone" aria-label="Stein">🪨</span>}
            {stars.includes(sq) && <span className="cb-star" aria-label={flag ? 'Fahne' : 'Stern'}>{flag ? '🚩' : '⭐'}</span>}
            {marks.dots?.includes(sq) && <span className={`cb-dot ${board[sq] ? 'cb-dot--ring' : ''}`} aria-hidden="true" />}
            {marks.numbers?.[sq] !== undefined && <span className="cb-num">{marks.numbers[sq]}</span>}
          </div>
        );
      })}
      {Object.entries(board).map(([sq, p]) => {
        const { x, y } = pos(sq);
        return (
          <span key={ids.get(sq)} className={`cb-piece ${marks.selected === sq ? 'is-lifted' : ''}`}
            style={{ transform: `translate(${x * 100}%, ${y * 100}%)` }} aria-hidden="true">
            <PieceIcon piece={p} />
          </span>
        );
      })}
    </div>
  );
}

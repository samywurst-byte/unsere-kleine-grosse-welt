import { useEffect, useRef, useState } from 'react';
import { OBSTACLES, type ObstacleId } from '../../data/heroWorld';
import { speak } from '../../services/discover';
import { MomoSays } from './HeroArt';
import type { StepProps } from './stepTypes';
import { useDrag } from './useDrag';

type Order = (ObstacleId | null)[];
const SLOT_LEFT = [27, 50, 73];
const emojiOf = (id: ObstacleId) => OBSTACLES.find((o) => o.id === id)!.emoji;

/** Mission 4: Balus Ninja-Pfad. Das Kind bestimmt die Reihenfolge und darf sie ändern. */
export function NinjaPathStep({ data, setData, onDone, help }: StepProps) {
  const order: Order = (data.order as Order | undefined) ?? [null, null, null];
  const ran = data.ran === true;
  const [running, setRunning] = useState(false);
  const [balu, setBalu] = useState<{ at: number; action?: ObstacleId }>({ at: -1 });
  const slots = useRef<(HTMLDivElement | null)[]>([]);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const intro = 'Zieh den Baumstamm, den Tunnel und die Trittsteine auf den Weg. Du bestimmst die Reihenfolge.';
  useEffect(() => { speak(intro); }, []);
  const free = OBSTACLES.filter((o) => !order.includes(o.id));
  const full = order.every(Boolean);
  const setOrder = (o: Order) => setData({ order: o, ran: false });

  const putAt = (id: ObstacleId, slot: number) => {
    const next = [...order];
    const from = next.indexOf(id);
    if (from >= 0) next[from] = next[slot];
    else if (next[slot]) { /* Platz belegt: das alte Hindernis geht zurück. */ }
    next[slot] = id;
    setOrder(next);
  };
  const putFirstFree = (id: ObstacleId) => {
    const slot = order.indexOf(null);
    if (slot >= 0) putAt(id, slot);
  };
  const slotAt = (x: number, y: number) => slots.current.findIndex((el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return x >= r.left - 20 && x <= r.right + 20 && y >= r.top - 30 && y <= r.bottom + 30;
  });
  const { drag, start } = useDrag<{ id: ObstacleId; from: number }>(({ id, from }, x, y, moved) => {
    if (running) return;
    if (!moved) {
      if (from >= 0) { const next = [...order]; next[from] = null; setOrder(next); } else putFirstFree(id);
      return;
    }
    const slot = slotAt(x, y);
    if (slot >= 0) putAt(id, slot);
    else if (from >= 0) { const next = [...order]; next[from] = null; setOrder(next); }
  });

  useEffect(() => {
    if (!help.tick || full) return;
    const next = free[0];
    if (next) { putFirstFree(next.id); speak(`Ich lege ${next.name === 'Tunnel' ? 'den Tunnel' : next.name === 'Baumstamm' ? 'den Baumstamm' : 'die Trittsteine'} hin.`); }
  }, [help.tick]);

  const go = () => {
    if (!full || running) return;
    setRunning(true);
    speak('Achtung, fertig, los!');
    const seq = order as ObstacleId[];
    seq.forEach((id, i) => {
      timers.current.push(window.setTimeout(() => { setBalu({ at: i, action: id }); speak(OBSTACLES.find((o) => o.id === id)!.say); }, 1200 + i * 2600));
    });
    timers.current.push(window.setTimeout(() => { setBalu({ at: 3 }); speak('Ziel! Balu ist ein Ninja-Bär! Willst du die Reihenfolge ändern, oder bist du fertig?'); }, 1200 + 3 * 2600));
    timers.current.push(window.setTimeout(() => { setRunning(false); setData({ order, ran: true }); }, 2400 + 3 * 2600));
  };
  const reset = () => { setBalu({ at: -1 }); setData({ order, ran: false }); };
  const baluLeft = balu.at < 0 ? 6 : balu.at >= 3 ? 93 : SLOT_LEFT[balu.at];

  return (
    <section className="card hero-activity hero-ninja">
      <MomoSays text={intro} size={80} />
      <div className="hero-ninja__path">
        <span className="hero-ninja__flag" style={{ left: '6%' }} aria-label="Start">🚩</span>
        <span className="hero-ninja__flag" style={{ left: '93%' }} aria-label="Ziel">🏁</span>
        {order.map((id, i) => (
          <div key={i} ref={(el) => { slots.current[i] = el; }} className={`hero-ninja__slot ${!id && help.level >= 1 && order.indexOf(null) === i ? 'is-hint' : ''}`} style={{ left: `${SLOT_LEFT[i]}%` }}>
            {id ? (
              <button type="button" className="hero-obstacle" onPointerDown={start({ id, from: i })} aria-label={`${OBSTACLES.find((o) => o.id === id)!.name}, Platz ${i + 1}`}>{emojiOf(id)}</button>
            ) : <span className="hero-ninja__num" aria-label={`Platz ${i + 1} frei`}>{i + 1}</span>}
          </div>
        ))}
        <span className={`hero-balu ${balu.action ? `hero-balu--${balu.action}` : ''}`} style={{ left: `${baluLeft}%` }} key={`${balu.at}`} aria-label="Balu">🐻</span>
      </div>
      {free.length > 0 && (
        <div className="hero-parts">
          {free.map((o) => (
            <button key={o.id} type="button" className="hero-item" onPointerDown={start({ id: o.id, from: -1 })} aria-label={o.name}>
              <span aria-hidden="true">{o.emoji}</span><span className="hero-part__label">{o.name}</span>
            </button>
          ))}
        </div>
      )}
      <div className="row row--wrap hero-ninja__actions">
        {full && !ran && <button type="button" className="btn btn--primary btn--big" onClick={go} disabled={running}>🐻 Balu, los!</button>}
        {ran && !running && (
          <>
            <button type="button" className="btn btn--big" onClick={reset}>Reihenfolge ändern</button>
            <button type="button" className="btn btn--primary btn--big" onClick={() => onDone()}>Fertig, so bleibt es!</button>
          </>
        )}
      </div>
      {!full && <p className="small muted">Tippe ein Hindernis an oder zieh es auf einen Platz. Tippe es auf dem Weg nochmal an, dann kommt es zurück.</p>}
      {drag?.moved && <span className="hero-ghost hero-obstacle" style={{ left: drag.x, top: drag.y }} aria-hidden="true">{emojiOf(drag.item.id)}</span>}
    </section>
  );
}

export const orderEmojis = (data: Record<string, unknown>) => ((data.order as Order | undefined) ?? []).filter(Boolean).map((id) => emojiOf(id as ObstacleId)).join(' → ');

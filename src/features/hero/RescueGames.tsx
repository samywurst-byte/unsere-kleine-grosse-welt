import { useEffect, useRef, useState } from 'react';
import { HELPER_ANIMALS, RAFT_ITEMS, RAFT_NEEDED, RESCUE_WAYS } from '../../data/heroWorld';
import { speak } from '../../services/discover';
import { BRIDGE_GAP, canPlacePlank, nextBridgeStep, snapPlank, testBridge, type BridgeResult, type Plank } from '../../services/heroWorld';
import { MomoSays } from './HeroArt';
import type { StepProps } from './stepTypes';
import { relativePos, useDrag } from './useDrag';

/** Mission 3: Fino retten. Erst einen Weg wählen, dann bauen. Umentscheiden geht immer. */
export function RescueStep(props: StepProps) {
  const { data, setData } = props;
  const way = RESCUE_WAYS.find((w) => w.id === data.way);
  useEffect(() => { speak(way ? way.say : 'Wie wollen wir Fino helfen? Mit einer Brücke, mit einem Floß, oder fragen wir ein anderes Tier?'); }, [way]);
  if (!way) {
    return (
      <section className="card hero-activity">
        <MomoSays text="Wie wollen wir Fino helfen? Mit einer Brücke, mit einem Floß, oder fragen wir ein anderes Tier?" />
        <div className="hero-choices">
          {RESCUE_WAYS.map((w) => (
            <button key={w.id} type="button" className="hero-choice" onClick={() => setData({ way: w.id })}>
              <span className="hero-choice__emoji" aria-hidden="true">{w.emoji}</span>
              <span className="hero-choice__name">{w.name}</span>
            </button>
          ))}
        </div>
      </section>
    );
  }
  return (
    <section className="card hero-activity">
      <MomoSays text={way.say} />
      {way.id === 'bridge' && <BridgeGame {...props} />}
      {way.id === 'boat' && <RaftGame {...props} />}
      {way.id === 'animal' && <AnimalGame {...props} />}
      <button type="button" className="btn btn--ghost" onClick={() => setData({ way: undefined })}>Anderen Weg wählen</button>
    </section>
  );
}

// ------------------------------------------------------------ Brücke

type Part = { kind: 'plank'; len: number } | { kind: 'pillar' };
interface BridgeData { planks: Plank[]; pillars: number[] }

const X0 = 18;
const X1 = 82;

function BridgeGame({ data, setData, onDone, onFail, help, profile }: StepProps) {
  const gap = profile.easy ? BRIDGE_GAP.easy : BRIDGE_GAP.normal;
  const stored = data.bridge as (BridgeData & { gap: number }) | undefined;
  const bridge: BridgeData = stored && stored.gap === gap ? stored : { planks: [], pillars: [] };
  const cell = (X1 - X0) / gap;
  const scene = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Part | null>(null);
  const [fino, setFino] = useState<{ left: number; mood: 'wait' | 'walk' | 'oops' | 'happy' }>({ left: 7, mood: 'wait' });
  const [result, setResult] = useState<BridgeResult | null>(null);
  const [testing, setTesting] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const later = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };

  const save = (b: BridgeData) => { setResult(null); setData({ bridge: { ...b, gap } }); };
  const place = (part: Part, px: number) => {
    if (part.kind === 'pillar') {
      const at = Math.round((px - X0) / cell);
      if (at < 1 || at > gap - 1 || bridge.pillars.includes(at)) return false;
      save({ ...bridge, pillars: [...bridge.pillars, at] });
      return true;
    }
    const start = snapPlank(bridge.planks, Math.round((px - X0) / cell - part.len / 2), part.len, gap);
    if (start === null) { speak('Da ist kein Platz für dieses Brett.'); return false; }
    save({ ...bridge, planks: [...bridge.planks, { start, len: part.len }] });
    return true;
  };
  const { drag, start } = useDrag<Part>((part, x, y, moved) => {
    if (!moved) { setSelected((s) => (s && JSON.stringify(s) === JSON.stringify(part) ? null : part)); return; }
    const pos = relativePos(scene.current, x, y);
    if (pos) place(part, pos.px);
  });
  const tapScene = (e: React.MouseEvent) => {
    if (!selected || testing) return;
    const pos = relativePos(scene.current, e.clientX, e.clientY);
    if (pos && place(selected, pos.px)) setSelected(null);
  };

  // „Gemeinsam“: Momo macht den nächsten Bauschritt.
  useEffect(() => {
    if (!help.tick) return;
    const step = nextBridgeStep(gap, bridge.planks, bridge.pillars);
    if (!step) return;
    if (step.kind === 'pillar') save({ ...bridge, pillars: [...bridge.pillars, step.at] });
    if (step.kind === 'plank') save({ ...bridge, planks: [...bridge.planks, { start: step.start, len: step.len }] });
    if (step.kind === 'remove') save({ ...bridge, planks: bridge.planks.filter((p) => p.start !== step.start) });
    speak('Ich helfe dir. Schau, so!');
  }, [help.tick]);

  const test = () => {
    if (testing) return;
    const r = testBridge(gap, bridge.planks, bridge.pillars);
    setTesting(true);
    setResult(null);
    if (r.ok) {
      setFino({ left: 92, mood: 'walk' });
      later(2200, () => { setFino({ left: 92, mood: 'happy' }); speak('Fino ist drüben! Die Brücke hält!'); });
      later(4200, () => onDone('bridge'));
      return;
    }
    setFino({ left: X0 + r.at * cell + (r.reason === 'hole' ? -2 : cell / 2), mood: 'walk' });
    later(1700, () => {
      setResult(r);
      setFino((f) => ({ ...f, mood: 'oops' }));
      speak(r.reason === 'hole' ? 'Huch! Hier ist noch ein Loch. Fino geht lieber zurück.' : 'Huch! Das Brett wackelt. Es braucht einen Pfeiler darunter.');
    });
    later(3400, () => { setFino({ left: 7, mood: 'wait' }); setTesting(false); onFail(); });
  };

  const hint = help.level >= 1 && !testing ? nextBridgeStep(gap, bridge.planks, bridge.pillars) : null;
  const giant = help.level >= 3;
  const parts: { part: Part; label: string; cls: string }[] = [
    { part: { kind: 'plank', len: 2 }, label: 'Kurzes Brett', cls: 'hero-part--plank2' },
    { part: { kind: 'plank', len: 3 }, label: 'Langes Brett', cls: 'hero-part--plank3' },
    { part: { kind: 'pillar' }, label: 'Pfeiler', cls: 'hero-part--pillar' },
    ...(giant ? [{ part: { kind: 'plank', len: gap } as Part, label: 'Riesenbrett von Momo', cls: 'hero-part--giant' }] : []),
  ];
  const isSel = (p: Part) => selected !== null && JSON.stringify(selected) === JSON.stringify(p);

  return (
    <div className="hero-bridge">
      <div ref={scene} className={`hero-bridge__scene ${selected ? 'is-placing' : ''}`} onClick={tapScene}>
        <div className="hero-bridge__island" aria-hidden="true"><span>🌴</span></div>
        <div className="hero-bridge__water" aria-hidden="true" />
        <div className="hero-bridge__bank" aria-hidden="true"><span>🏡</span></div>
        {Array.from({ length: gap - 1 }, (_, i) => i + 1).map((at) => (
          <span key={at} className={`hero-slot ${hint?.kind === 'pillar' && hint.at === at ? 'is-hint' : ''}`} style={{ left: `${X0 + at * cell}%` }} aria-hidden="true" />
        ))}
        {bridge.pillars.map((at) => (
          <button key={`p${at}`} type="button" className="hero-pillar" style={{ left: `${X0 + at * cell}%` }} aria-label="Pfeiler entfernen"
            onClick={(e) => { e.stopPropagation(); if (!testing) save({ ...bridge, pillars: bridge.pillars.filter((p) => p !== at) }); }} />
        ))}
        {bridge.planks.map((p) => (
          <button key={`b${p.start}`} type="button"
            className={`hero-plank ${result && !result.ok && result.reason === 'wobble' && result.at === p.start ? 'is-wobble' : ''} ${hint?.kind === 'remove' && hint.start === p.start ? 'is-hint-remove' : ''}`}
            style={{ left: `${X0 + p.start * cell}%`, width: `${p.len * cell}%` }} aria-label="Brett entfernen"
            onClick={(e) => { e.stopPropagation(); if (!testing) save({ ...bridge, planks: bridge.planks.filter((q) => q !== p) }); }} />
        ))}
        {hint?.kind === 'plank' && canPlacePlank(bridge.planks, hint, gap) && (
          <span className="hero-plank hero-plank--ghost" style={{ left: `${X0 + hint.start * cell}%`, width: `${hint.len * cell}%` }} aria-hidden="true" />
        )}
        {result && !result.ok && result.reason === 'hole' && <span className="hero-hole" style={{ left: `${X0 + result.at * cell}%`, width: `${cell}%` }} aria-hidden="true" />}
        <span className={`hero-fino hero-fino--${fino.mood}`} style={{ left: `${fino.left}%` }} aria-label="Fino">🦊</span>
      </div>
      <div className="hero-parts">
        {parts.map(({ part, label, cls }) => (
          <button key={label} type="button" className={`hero-part ${cls} ${isSel(part) ? 'is-on' : ''}`} onPointerDown={start(part)} aria-label={label} aria-pressed={isSel(part)}>
            <span className="hero-part__shape" aria-hidden="true" />
            <span className="hero-part__label">{label}</span>
          </button>
        ))}
        <button type="button" className="btn btn--primary btn--big hero-test" onClick={test} disabled={testing || !bridge.planks.length}>🦊 Fino, probier mal!</button>
      </div>
      {selected && <p className="small muted">Tippe auf die Stelle über dem Wasser, wo das Teil hin soll. Oder zieh es mit dem Finger hin.</p>}
      {drag?.moved && <span className={`hero-ghost hero-part ${parts.find((p) => JSON.stringify(p.part) === JSON.stringify(drag.item))?.cls ?? ''}`} style={{ left: drag.x, top: drag.y }} aria-hidden="true"><span className="hero-part__shape" /></span>}
    </div>
  );
}

// ------------------------------------------------------------ Floß

function RaftGame({ data, setData, onDone, onFail, help }: StepProps) {
  const raft = (data.raft as string[] | undefined) ?? [];
  const [sinking, setSinking] = useState<string | null>(null);
  const [sailing, setSailing] = useState(false);
  const ready = raft.length >= RAFT_NEEDED;
  const items = RAFT_ITEMS.filter((i) => !raft.includes(i.id) && (help.level < 3 || i.floats));
  useEffect(() => {
    if (!help.tick || ready) return;
    const next = RAFT_ITEMS.find((i) => i.floats && !raft.includes(i.id));
    if (next) { setData({ raft: [...raft, next.id] }); speak(`Ich nehme ${next.name === 'Holz' ? 'das Holz' : `den ${next.name}`}. Das schwimmt!`); }
  }, [help.tick]);
  const drop = (id: string) => {
    if (sinking || ready) return;
    const item = RAFT_ITEMS.find((i) => i.id === id)!;
    if (item.floats) {
      const next = [...raft, id];
      setData({ raft: next });
      speak(next.length >= RAFT_NEEDED ? 'Das Floß ist fertig! Jetzt holen wir Fino.' : `${item.name} schwimmt! Super.`);
      return;
    }
    setSinking(id);
    speak(`Blubb! ${item.name} geht unter. Probier etwas anderes.`);
    window.setTimeout(() => setSinking(null), 1500);
    onFail();
  };
  const sail = () => {
    setSailing(true);
    speak('Los geht es! Wir paddeln zu Fino.');
    window.setTimeout(() => speak('Fino springt aufs Floß. Er ist gerettet!'), 2600);
    window.setTimeout(() => onDone('boat'), 5200);
  };
  return (
    <div className="hero-raft">
      <div className="hero-raft__scene">
        <div className="hero-bridge__island" aria-hidden="true"><span>🌴</span></div>
        <div className="hero-bridge__water" aria-hidden="true" />
        <div className="hero-bridge__bank" aria-hidden="true"><span>🏡</span></div>
        <div className={`hero-raft__boat ${sailing ? 'is-sailing' : ''}`}>
          {raft.map((id) => <span key={id}>{RAFT_ITEMS.find((i) => i.id === id)?.emoji}</span>)}
          {Array.from({ length: Math.max(0, RAFT_NEEDED - raft.length) }, (_, i) => <span key={`e${i}`} className="hero-raft__empty" />)}
        </div>
        <span className={`hero-fino ${sailing ? 'hero-fino--ride' : ''}`} style={{ left: '7%' }} aria-label="Fino">🦊</span>
        {sinking && <span className="hero-sink" aria-hidden="true">{RAFT_ITEMS.find((i) => i.id === sinking)?.emoji}</span>}
      </div>
      {!ready ? (
        <div className="hero-parts">
          {items.map((i) => (
            <button key={i.id} type="button" className={`hero-item ${help.level >= 1 && i.floats ? 'is-hint' : ''}`} onClick={() => drop(i.id)} disabled={sinking === i.id} aria-label={i.name}>
              <span aria-hidden="true">{i.emoji}</span><span className="hero-part__label">{i.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <button type="button" className="btn btn--primary btn--big" onClick={sail} disabled={sailing}>🛶 Fino holen</button>
      )}
    </div>
  );
}

// ------------------------------------------------------------ Tierhilfe

function AnimalGame({ onDone, onFail, help }: StepProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const [tried, setTried] = useState<string[]>([]);
  const animals = HELPER_ANIMALS.filter((a) => help.level < 3 || a.helps);
  const pick = (id: string) => {
    if (picked) return;
    const a = HELPER_ANIMALS.find((x) => x.id === id)!;
    speak(a.say);
    if (a.helps) { setPicked(id); window.setTimeout(() => onDone('animal'), 5000); return; }
    setTried((t) => [...t, id]);
    onFail();
  };
  useEffect(() => { if (help.tick) pick('swan'); }, [help.tick]);
  const helper = HELPER_ANIMALS.find((a) => a.id === picked);
  return (
    <div className="hero-animals">
      {helper ? (
        <div className="hero-raft__scene">
          <div className="hero-bridge__island" aria-hidden="true"><span>🌴</span></div>
          <div className="hero-bridge__water" aria-hidden="true" />
          <div className="hero-bridge__bank" aria-hidden="true"><span>🏡</span></div>
          {helper.id === 'beaver' && <span className="hero-tree" aria-hidden="true">🌳</span>}
          <span className={`hero-helper hero-helper--${helper.id}`} aria-hidden="true">{helper.emoji}</span>
          <span className={`hero-fino hero-fino--${helper.id === 'swan' ? 'ride' : 'cross'}`} style={{ left: '7%' }} aria-label="Fino">🦊</span>
        </div>
      ) : (
        <div className="hero-choices">
          {animals.map((a) => (
            <button key={a.id} type="button" className={`hero-choice ${tried.includes(a.id) ? 'is-tried' : ''} ${help.level >= 1 && a.helps ? 'is-hint' : ''}`} onClick={() => pick(a.id)}>
              <span className="hero-choice__emoji" aria-hidden="true">{a.emoji}</span>
              <span className="hero-choice__name">{a.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

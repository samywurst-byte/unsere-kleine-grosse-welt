import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { COURAGE_HELPERS, FEELINGS, tryPlan, type ChoiceOption, type FeelingId, type FeelingScene } from '../../data/heroAcademy';
import { speak } from '../../services/discover';
import { Momo, MomoSays } from './HeroArt';
import type { StepProps } from './stepTypes';

/** Daten eines Schritts liegen unter einem eigenen Schlüssel, weil eine Mission mehrere Entscheidungen haben kann. */
type AcademyProps = StepProps & { k: string };

function useStepData<T extends object>({ data, setData, k }: AcademyProps): [T, (patch: Partial<T>) => void] {
  const mine = ((data[k] as T | undefined) ?? {}) as T;
  return [mine, (patch) => setData({ [k]: { ...mine, ...patch } })];
}

// ------------------------------------------------------------ Gefühledetektiv

export function FeelingsStep(props: AcademyProps & { scenes: FeelingScene[] }) {
  const { scenes, onDone, onFail, help } = props;
  const [state, setState] = useStepData<{ index?: number; found?: boolean }>(props);
  const index = Math.min(state.index ?? 0, scenes.length - 1);
  const scene = scenes[index];
  const [tried, setTried] = useState<FeelingId[]>([]);
  const [text, setText] = useState(scene.say);
  useEffect(() => { setText(scene.say); setTried([]); speak(scene.say); }, [index]);

  const pick = (id: FeelingId) => {
    if (state.found) return;
    if (scene.feels.includes(id)) {
      setState({ found: true });
      setText(scene.then);
      speak(scene.then);
    } else {
      setTried((t) => [...t, id]);
      setText(scene.hint);
      speak(scene.hint);
      onFail();
    }
  };
  const next = () => (index + 1 < scenes.length ? setState({ index: index + 1, found: false }) : onDone());

  return (
    <section className="card hero-activity hero-scene-step">
      <p className="hero-scene" aria-hidden="true">{scene.scene}</p>
      <MomoSays text={text} size={80} mood={state.found ? 'happy' : 'talk'} />
      <div className="hero-choices hero-feelings" role="group" aria-label="Gefühle">
        {FEELINGS.map((f) => {
          const right = scene.feels.includes(f.id);
          return (
            <button key={f.id} type="button"
              className={`hero-choice hero-feeling ${state.found && right ? 'is-done' : ''} ${tried.includes(f.id) ? 'is-tried' : ''} ${!state.found && help.level >= 1 && right ? 'is-hint' : ''}`}
              onClick={() => pick(f.id)} aria-pressed={state.found && right}>
              <span className="hero-choice__emoji" aria-hidden="true">{f.emoji}</span>
              <span className="hero-choice__name">{f.name}</span>
            </button>
          );
        })}
      </div>
      {state.found && <button type="button" className="btn btn--primary btn--big" onClick={next}>Weiter</button>}
    </section>
  );
}

// ------------------------------------------------------------ Entscheidung

export function ChoiceStep(props: AcademyProps & { say: string; scene: string; options: ChoiceOption[] }) {
  const { say, scene, options, onDone, onFail, help } = props;
  const [state, setState] = useStepData<{ picked?: string; tried?: string[] }>(props);
  const picked = options.find((o) => o.id === state.picked);
  // Die Frage liest der Missionsspieler vor
  const [text, setText] = useState(picked?.say ?? say);

  const pick = (o: ChoiceOption) => {
    setText(o.say);
    speak(o.say);
    if (o.ok === false) {
      setState({ tried: [...new Set([...(state.tried ?? []), o.id])], picked: undefined });
      onFail();
    } else setState({ picked: o.id });
  };

  return (
    <section className="card hero-activity hero-scene-step">
      <p className="hero-scene hero-scene--small" aria-hidden="true">{scene}</p>
      <MomoSays text={text} size={80} mood={picked ? 'happy' : 'talk'} />
      <div className="hero-choices hero-options">
        {options.map((o) => (
          <button key={o.id} type="button"
            className={`hero-choice hero-option ${state.picked === o.id ? 'is-on' : ''} ${state.tried?.includes(o.id) ? 'is-tried' : ''} ${!picked && help.level >= 1 && o.ok !== false ? 'is-hint' : ''}`}
            onClick={() => pick(o)} aria-pressed={state.picked === o.id}>
            <span className="hero-choice__emoji" aria-hidden="true">{o.emoji}</span>
            <span className="hero-choice__name">{o.name}</span>
            {state.picked === o.id && <span className="hero-choice__check" aria-hidden="true"><Check size={22} /></span>}
          </button>
        ))}
      </div>
      {picked && <button type="button" className="btn btn--primary btn--big" onClick={() => onDone(picked.id)}>Weiter</button>}
    </section>
  );
}

// ------------------------------------------------------------ Pausenknopf: Stoppzeichen und Drachenatem

const BREATHS = 3;
const IN_MS = 2500;

export function CalmStep(props: AcademyProps) {
  const { onDone } = props;
  const [state, setState] = useStepData<{ stopped?: boolean; breaths?: number }>(props);
  const breaths = state.breaths ?? 0;
  const [phase, setPhase] = useState<'idle' | 'in' | 'out'>('idle');
  const [fill, setFill] = useState(0);
  const started = useRef(0);
  const raf = useRef(0);

  useEffect(() => {
    speak(state.stopped ? 'Jetzt der Drachenatem. Halte den Kreis gedrückt und atme tief ein. Wenn er groß ist, loslassen und ausatmen.' : 'Wenn die Wut ganz groß wird: Hand hoch und Stopp! Drück auf das Stoppschild.');
  }, [state.stopped]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  useEffect(() => {
    if (breaths < BREATHS) return;
    speak('Momo ist wieder ruhig. Die Wut ist kleiner geworden. Du hast den Pausenknopf gedrückt!');
  }, [breaths]);

  const stop = () => { setState({ stopped: true }); };
  const down = () => {
    if (breaths >= BREATHS) return;
    setPhase('in');
    started.current = performance.now();
    const tick = () => {
      const f = Math.min(1, (performance.now() - started.current) / IN_MS);
      setFill(f);
      if (f < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };
  const up = () => {
    if (phase !== 'in') return;
    cancelAnimationFrame(raf.current);
    if (fill < 0.6) { setPhase('idle'); setFill(0); speak('Noch ein bisschen länger einatmen. Halte gedrückt, bis der Kreis groß ist.'); return; }
    setPhase('out');
    speak('Und ausatmen. Pffff.');
    window.setTimeout(() => { setPhase('idle'); setFill(0); setState({ breaths: breaths + 1 }); }, 1600);
  };

  const fire = Math.max(0, BREATHS - breaths);
  return (
    <section className="card hero-activity hero-scene-step">
      <div className="hero-calm-momo" aria-hidden="true">
        <Momo mood={breaths >= BREATHS ? 'happy' : 'think'} size={130} />
        <span className="hero-calm-fire" style={{ fontSize: `${24 + fire * 22}px` }}>{fire ? '🔥' : '🌿'}</span>
      </div>
      {!state.stopped ? (
        <>
          <MomoSays text="Wenn die Wut ganz groß wird: Hand hoch und Stopp! Drück auf das Stoppschild." size={70} />
          <button type="button" className="hero-stop" onClick={stop} aria-label="Stopp">
            <span className="hero-stop__hand" aria-hidden="true">✋</span>
            <span className="hero-stop__word">STOPP</span>
          </button>
        </>
      ) : breaths < BREATHS ? (
        <>
          <MomoSays text={phase === 'out' ? 'Und ausatmen. Pffff.' : 'Drachenatem: Halte den Kreis gedrückt und atme ein. Wenn er groß ist, loslassen und ausatmen.'} size={70} />
          <button type="button" className={`hero-breath hero-breath--${phase}`}
            style={{ transform: `scale(${phase === 'out' ? 0.45 : 0.45 + fill * 0.55})` }}
            onPointerDown={down} onPointerUp={up} onPointerLeave={up} onPointerCancel={up} onContextMenu={(e) => e.preventDefault()}
            aria-label="Gedrückt halten zum Einatmen">
            {phase === 'out' ? 'aus' : 'ein'}
          </button>
          <div className="hero-dots" aria-label={`${breaths} von ${BREATHS} Atemzügen`}>
            {Array.from({ length: BREATHS }, (_, i) => <span key={i} className={`hero-dots__dot ${i < breaths ? 'is-done' : ''}`} />)}
          </div>
        </>
      ) : (
        <>
          <MomoSays text="Momo ist wieder ruhig. Die Wut ist kleiner geworden. Du hast den Pausenknopf gedrückt!" mood="happy" size={70} />
          <button type="button" className="btn btn--primary btn--big" onClick={() => onDone()}>Weiter</button>
        </>
      )}
    </section>
  );
}

// ------------------------------------------------------------ Mutmacher: mehrere Versuche

const TRACK: Record<'parcours' | 'climb', { items: string[]; figure: string; slip: string; win: string }> = {
  parcours: {
    items: ['🪵', '🕳️', '🪨', '🪨', '🪵', '🏁'],
    figure: '🐉',
    slip: 'Huch! Momo ist abgerutscht. Er ist enttäuscht und sagt: Das ist doof! Das darf man auch sagen. Was hilft jetzt?',
    win: 'Geschafft! Momo ist durch den ganzen Parcours gekommen. Weil er es nochmal probiert hat!',
  },
  climb: {
    items: ['🟤', '🟠', '🟤', '🟡', '🟤', '🟠', '🟤', '🟡', '🏔️'],
    figure: '🐻',
    slip: 'Hoppla! Balu ist abgerutscht und sitzt wieder unten. Aber schau: Das Fähnchen zeigt, wie hoch er schon war! Was hilft jetzt?',
    win: 'Ganz oben! Balu winkt vom Gipfel. Jeder Versuch hat ihn ein Stück höher gebracht.',
  },
};

export function TryAgainStep(props: AcademyProps & { variant: 'parcours' | 'climb' }) {
  const { variant, onDone, profile, help } = props;
  const [state, setState] = useStepData<{ attempt?: number; best?: number; helpers?: string[] }>(props);
  const plan = tryPlan(variant, profile.easy || help.level >= 3);
  const track = TRACK[variant];
  const attempt = Math.min(state.attempt ?? 0, plan.slips.length - 1);
  const slipAt = plan.slips[attempt];
  const [pos, setPos] = useState(-1);
  const [mode, setMode] = useState<'go' | 'slip' | 'choose' | 'win'>('go');
  const [text, setText] = useState(variant === 'climb' ? 'Tippe auf den ersten Griff!' : 'Tippe auf das erste Hindernis!');
  const best = state.best ?? -1;

  const tap = (i: number) => {
    if (mode !== 'go' || i !== pos + 1) return;
    if (slipAt !== null && i === slipAt) {
      setMode('slip');
      setPos(i);
      setText(track.slip);
      speak(track.slip);
      setState({ best: Math.max(best, i - 1) });
      window.setTimeout(() => setMode('choose'), 1200);
      return;
    }
    setPos(i);
    if (i === plan.length - 1) {
      setMode('win');
      setText(track.win);
      speak(track.win);
      return;
    }
    if (i === best && best >= 0) speak('Bis hierhin warst du schon. Jetzt geht es weiter!');
  };
  const helper = (id: string) => {
    const h = COURAGE_HELPERS.find((x) => x.id === id)!;
    speak(h.say);
    setText(h.say);
    setState({ attempt: attempt + 1, helpers: [...new Set([...(state.helpers ?? []), id])] });
    setPos(-1);
    setMode('go');
  };

  return (
    <section className="card hero-activity">
      <MomoSays text={text} size={70} mood={mode === 'win' ? 'happy' : mode === 'slip' || mode === 'choose' ? 'think' : 'talk'} />
      <div className={`hero-try hero-try--${variant}`} aria-label={variant === 'climb' ? 'Kletterwand' : 'Parcours'}>
        {track.items.map((item, i) => (
          <button key={i} type="button" className={`hero-try__item ${i <= pos && !(mode === 'slip' && i === pos) ? 'is-done' : ''} ${mode === 'go' && i === pos + 1 ? 'is-hint' : ''}`}
            onClick={() => tap(i)} aria-label={`${i + 1}. ${variant === 'climb' ? 'Griff' : 'Hindernis'}`}>
            <span aria-hidden="true">{item}</span>
            {i === pos && <span className={`hero-try__figure ${mode === 'slip' ? 'is-slip' : ''}`} aria-hidden="true">{track.figure}</span>}
            {i === best && best >= 0 && mode !== 'win' && <span className="hero-try__flag" aria-label="Bis hier geschafft">🚩</span>}
          </button>
        ))}
        {pos < 0 && <span className="hero-try__start" aria-hidden="true">{track.figure}</span>}
      </div>
      {mode === 'choose' && (
        <div className="hero-choices" ref={(el) => el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}>
          {COURAGE_HELPERS.map((h) => (
            <button key={h.id} type="button" className="hero-choice" onClick={() => helper(h.id)}>
              <span className="hero-choice__emoji" aria-hidden="true">{h.emoji}</span>
              <span className="hero-choice__name">{h.name}</span>
            </button>
          ))}
        </div>
      )}
      {mode === 'win' && <button type="button" className="btn btn--primary btn--big" onClick={() => onDone(state.helpers?.join('+'))}>Weiter</button>}
    </section>
  );
}

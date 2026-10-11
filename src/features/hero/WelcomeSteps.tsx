import { Check } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { HERO_CAPES, HERO_COLORS, HERO_GREETINGS, HERO_POWERS, HERO_SYMBOLS, MOMO_CHEERS, WELCOME_PATHS } from '../../data/heroWorld';
import { db } from '../../database/db';
import { speak } from '../../services/discover';
import { saveLook } from '../../services/heroWorld';
import { HeroFigure, Momo, MomoSays } from './HeroArt';
import type { HelpState, StepProps } from './stepTypes';

const cheer = () => MOMO_CHEERS[Math.floor(Math.random() * MOMO_CHEERS.length)];

/** Mission 1: drei Wege durch den Wunderwald. */
export function PathsStep({ data, setData, onDone, onFail, help }: StepProps) {
  const done = (data.paths as string[] | undefined) ?? [];
  const [open, setOpen] = useState<string | null>(null);
  const intro = 'Drei Wege führen durch den Wunderwald. Tippe auf einen Weg!';
  useEffect(() => { if (!open) speak(done.length === 3 ? 'Du warst überall! Jetzt suchen wir dein Heldenzeichen.' : done.length ? 'Magst du noch einen Weg ausprobieren?' : intro); }, [open, done.length]);
  const finish = (id: string) => {
    if (!done.includes(id)) setData({ paths: [...done, id] });
    setOpen(null);
  };
  const path = WELCOME_PATHS.find((p) => p.id === open);
  if (path) {
    return (
      <section className="card hero-activity">
        <MomoSays text={path.say} />
        {path.id === 'pet' && <PetGame help={help} onDone={() => finish('pet')} />}
        {path.id === 'gear' && <GearGame help={help} onDone={() => finish('gear')} />}
        {path.id === 'stones' && <StonesGame help={help} onFail={onFail} onDone={() => finish('stones')} />}
        <button type="button" className="btn btn--ghost" onClick={() => setOpen(null)}>Anderen Weg wählen</button>
      </section>
    );
  }
  return (
    <section className="card hero-activity">
      <MomoSays text={done.length === 3 ? 'Du warst überall! Jetzt suchen wir dein Heldenzeichen.' : done.length ? 'Magst du noch einen Weg ausprobieren?' : intro} />
      <div className="hero-choices">
        {WELCOME_PATHS.map((p) => (
          <button key={p.id} type="button" className={`hero-choice ${done.includes(p.id) ? 'is-done' : ''}`} onClick={() => setOpen(p.id)}>
            <span className="hero-choice__emoji" aria-hidden="true">{p.emoji}</span>
            <span className="hero-choice__name">{p.title}</span>
            {done.includes(p.id) && <span className="hero-choice__check" aria-label="geschafft"><Check size={22} /></span>}
          </button>
        ))}
      </div>
      {done.length > 0 && (
        <button type="button" className={`btn btn--big ${done.length === 3 ? 'btn--primary' : ''}`} onClick={() => onDone()}>Weiter</button>
      )}
    </section>
  );
}

/** Streicheln: mit dem Finger über das Tier wischen. */
function PetGame({ help, onDone }: { help: HelpState; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [dist, setDist] = useState(0);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const goal = help.level >= 3 ? 1.2 : 3;
  const width = () => ref.current?.getBoundingClientRect().width ?? 400;
  const progress = Math.min(1, dist / (goal * width()));
  const finished = progress >= 1;
  useEffect(() => { if (help.tick) setDist((d) => d + width()); }, [help.tick]);
  useEffect(() => {
    if (!finished) return;
    speak('Hoppel freut sich! Er ist gar nicht mehr ängstlich.');
    const t = window.setTimeout(onDone, 2200);
    return () => window.clearTimeout(t);
  }, [finished]);
  const move = (e: React.PointerEvent) => {
    if (finished || (e.pointerType === 'mouse' && e.buttons !== 1)) { last.current = null; return; }
    const p = { x: e.clientX, y: e.clientY };
    if (last.current) {
      const d = Math.hypot(p.x - last.current.x, p.y - last.current.y);
      setDist((v) => {
        const nv = v + Math.min(d, 60);
        if (Math.floor(nv / 140) > Math.floor(v / 140)) {
          const r = ref.current!.getBoundingClientRect();
          setHearts((h) => [...h.slice(-8), { id: Date.now(), x: ((p.x - r.left) / r.width) * 100, y: ((p.y - r.top) / r.height) * 100 }]);
        }
        return nv;
      });
    }
    last.current = p;
  };
  return (
    <div ref={ref} className="hero-meadow" onPointerMove={move} onPointerDown={(e) => { last.current = { x: e.clientX, y: e.clientY }; }}
      onPointerUp={() => { last.current = null; }} onPointerLeave={() => { last.current = null; }}>
      <span className={`hero-pet ${finished ? 'is-happy' : ''}`} aria-label="Hase Hoppel">🐰</span>
      {hearts.map((h) => <span key={h.id} className="hero-heart" style={{ left: `${h.x}%`, top: `${h.y}%` }}>💗</span>)}
      {help.level >= 1 && !finished && <span className="hero-hand hero-hand--stroke" aria-hidden="true">👆</span>}
      <div className="hero-meter" aria-hidden="true"><span style={{ width: `${progress * 100}%` }} /></div>
      {finished && <span className="hero-big-cheer">💕</span>}
    </div>
  );
}

/** Zahnrad drehen: mit dem Finger im Kreis fahren. */
function GearGame({ help, onDone }: { help: HelpState; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const lastAngle = useRef<number | null>(null);
  const [angle, setAngle] = useState(0);
  const [turned, setTurned] = useState(0);
  const goal = help.level >= 3 ? Math.PI : 2 * Math.PI;
  const finished = turned >= goal;
  useEffect(() => { if (help.tick) { setTurned((t) => t + Math.PI); setAngle((a) => a + Math.PI); } }, [help.tick]);
  useEffect(() => {
    if (!finished) return;
    speak('Das Licht geht an! Du bist ein echter Erfinder.');
    const t = window.setTimeout(onDone, 2200);
    return () => window.clearTimeout(t);
  }, [finished]);
  const angleAt = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
  };
  const move = (e: React.PointerEvent) => {
    if (finished || (e.pointerType === 'mouse' && e.buttons !== 1)) { lastAngle.current = null; return; }
    const a = angleAt(e);
    if (lastAngle.current !== null) {
      let d = a - lastAngle.current;
      if (d > Math.PI) d -= 2 * Math.PI;
      if (d < -Math.PI) d += 2 * Math.PI;
      d = Math.max(-0.6, Math.min(0.6, d));
      setAngle((v) => v + d);
      setTurned((t) => t + Math.abs(d));
    }
    lastAngle.current = a;
  };
  return (
    <div className="hero-cave">
      <span className={`hero-lamp ${finished ? 'is-on' : ''}`} aria-hidden="true">💡</span>
      <div ref={ref} className="hero-gear-wrap" onPointerMove={move} onPointerDown={(e) => { lastAngle.current = angleAt(e); }}
        onPointerUp={() => { lastAngle.current = null; }} onPointerLeave={() => { lastAngle.current = null; }} aria-label="Zahnrad">
        <span className="hero-gear" style={{ transform: `rotate(${angle}rad)` }}>⚙️</span>
        {help.level >= 1 && !finished && <span className="hero-hand hero-hand--circle" aria-hidden="true">👆</span>}
      </div>
      <div className="hero-meter" aria-hidden="true"><span style={{ width: `${Math.min(1, turned / goal) * 100}%` }} /></div>
    </div>
  );
}

const STONES = 5;

/** Über den Bach: den nächsten Stein antippen. */
function StonesGame({ help, onFail, onDone }: { help: HelpState; onFail: () => void; onDone: () => void }) {
  const [pos, setPos] = useState(-1);
  const [wiggle, setWiggle] = useState<number | null>(null);
  const finished = pos >= STONES;
  useEffect(() => { if (help.tick) setPos((p) => Math.min(STONES, p + 1)); }, [help.tick]);
  useEffect(() => {
    if (!finished) return;
    speak('Geschafft! Wir sind drüben. Du bist ein echter Ninja.');
    const t = window.setTimeout(onDone, 2000);
    return () => window.clearTimeout(t);
  }, [finished]);
  const tap = (i: number) => {
    if (finished) return;
    if (i === pos + 1) { setPos(i); if (i === STONES - 1) window.setTimeout(() => setPos(STONES), 700); return; }
    if (i <= pos) return;
    setWiggle(i);
    window.setTimeout(() => setWiggle(null), 600);
    speak('Der ist zu weit weg für mich. Nimm den Stein direkt vor mir.');
    onFail();
  };
  const left = pos < 0 ? 5 : pos >= STONES ? 92 : 18 + pos * 16;
  return (
    <div className="hero-river">
      {Array.from({ length: STONES }, (_, i) => (
        <button key={i} type="button" className={`hero-stone ${i === pos + 1 && help.level >= 1 ? 'is-hint' : ''} ${wiggle === i ? 'is-wiggle' : ''}`}
          style={{ left: `${18 + i * 16}%` }} onClick={() => tap(i)} aria-label={`Stein ${i + 1}`}>🪨</button>
      ))}
      <span className="hero-river__momo" style={{ left: `${left}%` }}><Momo mood="happy" size={74} /></span>
    </div>
  );
}

/** Heldenzeichen wählen. Es gibt kein Richtig oder Falsch. */
export function SymbolStep({ childId, look, onDone }: StepProps) {
  const chosen = look?.symbol;
  const pick = (id: string, name: string) => { void saveLook(db, childId, { symbol: id }); speak(`Der ${name}! ${cheer()}`); };
  return (
    <section className="card hero-activity">
      <div className="hero-symbol-row">
        <HeroFigure look={look} size={200} className={look ? 'hero-figure--in' : 'hero-figure--shadow'} />
        <div className="hero-symbols">
          {HERO_SYMBOLS.map((s) => (
            <button key={s.id} type="button" className={`hero-symbol ${chosen === s.id ? 'is-on' : ''}`} onClick={() => pick(s.id, s.name)} aria-label={s.name} aria-pressed={chosen === s.id}>
              {s.emoji}
            </button>
          ))}
        </div>
      </div>
      {chosen && <button type="button" className="btn btn--primary btn--big" onClick={() => onDone()}>Das ist mein Zeichen</button>}
    </section>
  );
}

/** Mission 2: Heldenfigur gestalten. */
export function DesignStep({ childId, look, onDone }: StepProps) {
  const set = (patch: Parameters<typeof saveLook>[2]) => void saveLook(db, childId, patch);
  useEffect(() => { speak('Tippe auf die Farben und Zeichen. Dein Held verändert sich sofort.'); }, []);
  return (
    <section className="card hero-activity">
      <div className="hero-design">
        <div className="hero-design__preview"><HeroFigure look={look} size={300} /></div>
        <div className="hero-design__options">
          <OptionRow label="🎨 Farbe" say="Welche Farbe hat dein Anzug?">
            {HERO_COLORS.map((c) => <button key={c.id} type="button" className={`hero-swatch ${look?.color === c.id ? 'is-on' : ''}`} style={{ background: c.hex }} aria-label={c.name} aria-pressed={look?.color === c.id} onClick={() => set({ color: c.id })} />)}
          </OptionRow>
          <OptionRow label="🧣 Umhang" say="Möchtest du einen Umhang?">
            {HERO_CAPES.map((c) => (
              <button key={c.id} type="button" className={`hero-swatch ${look?.cape === c.id ? 'is-on' : ''} ${c.hex ? '' : 'hero-swatch--none'}`} style={c.hex ? { background: c.hex } : undefined}
                aria-label={c.name} aria-pressed={look?.cape === c.id} onClick={() => set({ cape: c.id })}>{c.hex ? '' : '✕'}</button>
            ))}
          </OptionRow>
          <OptionRow label="🥷 Maske" say="Trägt dein Held eine Maske?">
            <button type="button" className={`hero-pill ${look && !look.mask ? 'is-on' : ''}`} onClick={() => set({ mask: false })}>Ohne</button>
            <button type="button" className={`hero-pill ${look?.mask ? 'is-on' : ''}`} onClick={() => set({ mask: true })}>Mit Maske</button>
          </OptionRow>
          <OptionRow label="⭐ Zeichen" say="Welches Zeichen trägt dein Held?">
            {HERO_SYMBOLS.map((s) => <button key={s.id} type="button" className={`hero-symbol hero-symbol--small ${look?.symbol === s.id ? 'is-on' : ''}`} aria-label={s.name} aria-pressed={look?.symbol === s.id} onClick={() => set({ symbol: s.id })}>{s.emoji}</button>)}
          </OptionRow>
          <OptionRow label="💪 Heldenkraft" say="Was kann dein Held besonders gut? Tiere retten, erfinden, geschickt sein oder trösten?">
            {HERO_POWERS.map((p) => (
              <button key={p.id} type="button" className={`hero-pill ${look?.power === p.id ? 'is-on' : ''}`} onClick={() => { set({ power: p.id }); speak(p.name); }}>
                <span aria-hidden="true">{p.emoji}</span> {p.name}
              </button>
            ))}
          </OptionRow>
        </div>
      </div>
      <button type="button" className="btn btn--primary btn--big" onClick={() => onDone()}>Mein Held ist fertig</button>
    </section>
  );
}

function OptionRow({ label, say, children }: { label: string; say: string; children: ReactNode }) {
  return (
    <div className="hero-option">
      <button type="button" className="hero-option__label" onClick={() => speak(say)}>{label}</button>
      <div className="hero-option__items">{children}</div>
    </div>
  );
}

/** Heldengruß wählen oder einen eigenen aufschreiben lassen. */
export function GreetingStep({ childId, look, onDone }: StepProps) {
  const [text, setText] = useState(look?.greetingText ?? '');
  const chosen = look?.greeting;
  return (
    <section className="card hero-activity">
      <div className="hero-choices">
        {HERO_GREETINGS.map((g) => (
          <button key={g.id} type="button" className={`hero-choice ${chosen === g.id ? 'is-on' : ''}`} aria-pressed={chosen === g.id}
            onClick={() => { void saveLook(db, childId, { greeting: g.id }); speak(g.name); }}>
            <span className="hero-choice__emoji" aria-hidden="true">{g.emoji}</span>
            <span className="hero-choice__name">{g.name}</span>
          </button>
        ))}
      </div>
      {chosen === 'own' && (
        <label className="field">
          <span className="field__label">Für Mama oder Papa: Wie geht der eigene Gruß? (freiwillig)</span>
          <input className="input" value={text} maxLength={120} onChange={(e) => setText(e.target.value)} onBlur={() => void saveLook(db, childId, { greetingText: text.trim() || undefined })} />
        </label>
      )}
      {chosen && <button type="button" className="btn btn--primary btn--big" onClick={() => { void saveLook(db, childId, { greetingText: text.trim() || undefined }); onDone(); }}>Das ist unser Gruß</button>}
    </section>
  );
}

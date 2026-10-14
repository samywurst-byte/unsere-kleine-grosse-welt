import { ArrowLeft, LifeBuoy, Pause, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FRIENDS, HERO_PLACE_BY_ID, MOMO_PAUSE, MOMO_STUCK, type HeroMissionDef, type HeroStep } from '../../data/heroWorld';
import { db } from '../../database/db';
import { canSpeak, speak } from '../../services/discover';
import { completeMission, countHelp, enterMission, HELP_AFTER, markReal, restartMission, saveProgress } from '../../services/heroWorld';
import type { ChildProfile, HeroProfile } from '../../types';
import { HeroFigure, Momo, MomoSays } from './HeroArt';
import { NinjaPathStep, orderEmojis } from './NinjaPath';
import { PauseGate, useCheckpoint, usePlayClock } from './playTime';
import { RescueStep } from './RescueGames';
import type { HelpState, StepProps } from './stepTypes';
import { CalmStep, ChoiceStep, FeelingsStep, TryAgainStep } from './AcademySteps';
import { DesignStep, GreetingStep, PathsStep, SymbolStep } from './WelcomeSteps';

const AT_REST: HeroStep['kind'][] = ['say', 'real', 'reveal', 'symbol', 'greeting', 'feelings', 'choice', 'calm'];
const WITH_HELP: HeroStep['kind'][] = ['paths', 'rescue', 'parcours', 'feelings', 'choice', 'tryagain'];

const sayOf = (s: HeroStep): string | undefined => ('say' in s ? s.say : undefined);

/** Eine Mission spielen. Jeder Schritt wird sofort gespeichert, damit man jederzeit aufhören und später weitermachen kann. */
export function MissionPlayer({ child, def, profile }: { child: ChildProfile; def: HeroMissionDef; profile: HeroProfile }) {
  const [step, setStep] = useState<number | null>(null);
  const [data, setDataState] = useState<Record<string, unknown>>({});
  const [help, setHelp] = useState<HelpState>({ level: 0, tick: 0 });
  const [fails, setFails] = useState(0);
  const [stuck, setStuck] = useState<{ count: number; open: boolean }>({ count: 0, open: false });
  const [paused, setPaused] = useState(false);
  const [newBadge, setNewBadge] = useState(false);
  const completing = useRef(false);
  const { over } = usePlayClock(child.id);

  useEffect(() => {
    let alive = true;
    void enterMission(db, child.id, def).then((r) => {
      if (!alive) return;
      setStep(Math.min(r.current?.step ?? 0, def.steps.length - 2));
      setDataState(r.current?.data ?? {});
    });
    return () => { alive = false; };
    // Nur bei einer anderen Mission neu betreten (def wird mit dem Namen des Partners neu erzeugt)
  }, [child.id, def.id]);

  const current = step === null ? undefined : def.steps[step];
  useEffect(() => { const s = current && sayOf(current); if (s) speak(s); }, [step]);
  const gate = useCheckpoint(over, String(step), !current || AT_REST.includes(current.kind) || paused);

  if (step === null || !current) return null;
  const look = profile.look;
  const map = `/entdecken/helden/${child.id}`;

  const setData = (patch: Record<string, unknown>) => {
    const next = { ...data, ...patch };
    setDataState(next);
    void saveProgress(db, child.id, def.id, step, next);
  };
  const goNext = (solution?: string) => {
    const nextData = solution ? { ...data, solution } : data;
    const next = step + 1;
    setDataState(nextData);
    setHelp({ level: 0, tick: 0 });
    setFails(0);
    setStuck({ count: 0, open: false });
    setStep(next);
    if (def.steps[next]?.kind === 'reveal') {
      if (completing.current) return;
      completing.current = true;
      void completeMission(db, child.id, def.id, nextData.solution as string | undefined).then(setNewBadge);
    } else void saveProgress(db, child.id, def.id, next, nextData);
  };
  const onFail = () => {
    const n = fails + 1;
    if (n >= HELP_AFTER[profile.helpLevel]) {
      setFails(0);
      setStuck((s) => ({ count: s.count + 1, open: true }));
      speak(MOMO_STUCK);
    } else setFails(n);
  };
  const choose = (kind: 'tip' | 'together' | 'easier' | 'pause') => {
    setStuck((s) => ({ ...s, open: false }));
    if (kind === 'pause') { setPaused(true); speak(MOMO_PAUSE); return; }
    void countHelp(db, child.id, def.id);
    if (kind === 'tip') { setHelp((h) => ({ ...h, level: Math.max(h.level, 1) as HelpState['level'] })); speak('Schau mal, wo es leuchtet!'); }
    if (kind === 'together') setHelp((h) => ({ level: Math.max(h.level, 2) as HelpState['level'], tick: h.tick + 1 }));
    if (kind === 'easier') { setHelp((h) => ({ ...h, level: 3 })); speak('Ich mache es ein bisschen leichter.'); }
  };

  const props: StepProps = { childId: child.id, data, setData, onDone: goNext, onFail, help, profile, look };
  const repeatText = sayOf(current);

  return (
    <div className="hero-mission">
      <header className="page-head hero-mission__head">
        <Link to={map} className="btn btn--icon btn--ghost" aria-label="Zur Weltkarte"><ArrowLeft size={22} /></Link>
        <span className="hero-mission__emoji" aria-hidden="true">{def.emoji}</span>
        <h1>{def.title}</h1>
        <div className="spacer" />
        <div className="hero-dots" aria-label={`Schritt ${step + 1} von ${def.steps.length}`}>
          {def.steps.map((_, i) => <span key={i} className={`hero-dots__dot ${i < step ? 'is-done' : i === step ? 'is-now' : ''}`} />)}
        </div>
        {repeatText && canSpeak() && <button type="button" className="btn btn--icon" aria-label="Nochmal vorlesen" onClick={() => speak(repeatText)}><Volume2 size={22} /></button>}
        {WITH_HELP.includes(current.kind) && !paused && (
          <button type="button" className="btn btn--small hero-help-btn" onClick={() => { setStuck((s) => ({ ...s, open: true })); speak('Wie soll ich dir helfen?'); }}>
            <LifeBuoy size={18} aria-hidden="true" /> Momo, hilf mir
          </button>
        )}
        {current.kind !== 'reveal' && <button type="button" className="btn btn--small btn--ghost" onClick={() => choose('pause')}><Pause size={16} aria-hidden="true" /> Pause</button>}
      </header>

      {paused ? (
        <section className="card hero-pause">
          <Momo mood="sleep" size={150} />
          <p className="hero-say">{MOMO_PAUSE}</p>
          <div className="row row--wrap">
            <button type="button" className="btn btn--primary btn--big" onClick={() => setPaused(false)}>Weiterspielen</button>
            {current.kind === 'rescue' && Boolean(data.way) && (
              <button type="button" className="btn btn--big" onClick={() => { setData({ way: undefined }); setPaused(false); }}>Etwas anderes ausprobieren</button>
            )}
            <Link to={map} className="btn btn--big btn--ghost">Zur Weltkarte</Link>
          </div>
        </section>
      ) : (
        <>
          {current.kind === 'say' && (
            <section className="card hero-activity hero-scene-step">
              <p className="hero-scene" aria-hidden="true">{current.scene}</p>
              <MomoSays text={current.say} />
              <button type="button" className="btn btn--primary btn--big" onClick={() => goNext()}>Los geht’s!</button>
            </section>
          )}
          {current.kind === 'paths' && <PathsStep {...props} />}
          {current.kind === 'symbol' && (<><MomoSays text={current.say} size={80} /><SymbolStep {...props} /></>)}
          {current.kind === 'design' && <DesignStep {...props} />}
          {current.kind === 'greeting' && (<><MomoSays text={current.say} size={80} /><GreetingStep {...props} /></>)}
          {current.kind === 'rescue' && <RescueStep {...props} />}
          {current.kind === 'parcours' && <NinjaPathStep {...props} />}
          {current.kind === 'feelings' && <FeelingsStep key={step} {...props} k={`s${step}`} scenes={current.scenes} />}
          {current.kind === 'choice' && <ChoiceStep key={step} {...props} k={`s${step}`} say={current.say} scene={current.scene} options={current.options} />}
          {current.kind === 'calm' && <CalmStep key={step} {...props} k={`s${step}`} />}
          {current.kind === 'tryagain' && <TryAgainStep key={step} {...props} k={`s${step}`} variant={current.variant} />}
          {current.kind === 'real' && (
            <section className="card hero-activity">
              <MomoSays text={current.say} />
              {def.id === 'ninja-path' && orderEmojis(data) && <p className="hero-order" aria-label="Deine Reihenfolge">{orderEmojis(data)}</p>}
              <div className="hero-real">
                <p><strong>Für Mama und Papa:</strong> {current.task}</p>
                {current.safety && <p className="hero-safety">⚠️ <strong>Nur mit Aufsicht:</strong> {current.safety}</p>}
              </div>
              <div className="row row--wrap">
                <button type="button" className="btn btn--primary btn--big" onClick={() => { void markReal(db, child.id, def.id, true); goNext(); }}>✅ Haben wir gemacht</button>
                <button type="button" className="btn btn--big" onClick={() => { void markReal(db, child.id, def.id, false); goNext(); }}>⏰ Machen wir später</button>
              </div>
            </section>
          )}
          {current.kind === 'reveal' && (
            <section className="card hero-reveal">
              <div className="hero-reveal__stage">
                <HeroFigure look={look} size={260} className="hero-figure--in" />
                {def.place !== 'village' && <span className="hero-reveal__friend" aria-hidden="true">{FRIENDS[HERO_PLACE_BY_ID.get(def.place)!.friend].emoji}</span>}
              </div>
              <p className="hero-say">{current.say}</p>
              <p className="hero-badge"><span aria-hidden="true">{def.badge.emoji}</span> {newBadge ? 'Neues Abzeichen: ' : ''}{def.badge.name}</p>
              <div className="row row--wrap">
                <Link to={map} className="btn btn--primary btn--big">Zur Weltkarte</Link>
                <button type="button" className="btn btn--big btn--ghost" onClick={() => {
                  void restartMission(db, child.id, def.id).then(() => { completing.current = false; setDataState({}); setStep(0); });
                }}>Nochmal spielen</button>
              </div>
            </section>
          )}
        </>
      )}

      {stuck.open && (
        <div className="hero-gate" role="dialog" aria-modal="true" aria-label="Momo hilft">
          <div className="hero-gate__card card">
            <MomoSays text={MOMO_STUCK} mood="think" />
            <div className="hero-help-choices">
              <button type="button" className="hero-choice" onClick={() => choose('tip')}><span className="hero-choice__emoji">💡</span><span className="hero-choice__name">Tipp</span></button>
              <button type="button" className="hero-choice" onClick={() => choose('together')}><span className="hero-choice__emoji">🤝</span><span className="hero-choice__name">Gemeinsam</span></button>
              {(stuck.count >= 2 || help.level >= 2) && (
                <button type="button" className="hero-choice" onClick={() => choose('easier')}><span className="hero-choice__emoji">🪄</span><span className="hero-choice__name">Leichter</span></button>
              )}
              <button type="button" className="hero-choice" onClick={() => choose('pause')}><span className="hero-choice__emoji">🌿</span><span className="hero-choice__name">Pause</span></button>
            </div>
            <button type="button" className="btn btn--ghost" onClick={() => setStuck((s) => ({ ...s, open: false }))}>Ich probiere es selbst weiter</button>
          </div>
        </div>
      )}
      {gate && <PauseGate childId={child.id} name={child.name} />}
    </div>
  );
}

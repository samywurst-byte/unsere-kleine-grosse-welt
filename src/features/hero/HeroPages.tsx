import { ArrowLeft, Lock } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { FRIENDS, HERO_MISSION_BY_ID, HERO_MISSIONS, HERO_PLACES, type HeroPlace } from '../../data/heroWorld';
import { db } from '../../database/db';
import { useChildren, useHeroData, useSettings } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { defaultProfile, heroMissionDays, isPlayable, missionStates, restartMission, type MissionState } from '../../services/heroWorld';
import type { HeroMission } from '../../types';
import { formatWeekday, toDateKey } from '../../utils/dates';
import { ExploreTabs } from '../library/ExploreTabs';
import { HeroFigure, Momo, MomoSays } from './HeroArt';
import { MissionPlayer } from './MissionPlayer';
import { PauseGate, useCheckpoint, usePlayClock } from './playTime';
import '../chess/chess.css';
import './hero.css';

export const MISSION_STATUS_TEXT: Record<MissionState['status'], string> = {
  done: 'Geschafft',
  progress: 'Angefangen',
  open: 'Los geht’s',
  waiting: 'Bald',
  locked: 'Noch zu',
};

function useHeroState(childId: string | undefined) {
  const hero = useHeroData();
  const settings = useSettings();
  const today = toDateKey(useNow(60_000));
  if (!hero || !settings || !childId) return undefined;
  const profile = hero.profiles.find((p) => p.childId === childId) ?? defaultProfile(childId);
  const states = missionStates(HERO_MISSIONS, hero.missions, childId, today, heroMissionDays(settings));
  return { profile, states, records: hero.missions.filter((m) => m.childId === childId) };
}

/** Heldenwelt: Wer spielt heute? */
export function HeroHomePage() {
  const children = useChildren();
  const hero = useHeroData();
  if (!children || !hero) return null;
  return (
    <div>
      <header className="page-head">
        <h1>Heldenwelt</h1>
        <span className="page-head__sub">Die Hüter des Wunderwaldes</span>
      </header>
      <ExploreTabs />
      <div className="stack">
        <section className="card hero-home">
          <MomoSays text="Hallo, ich bin Momo! Wer kommt heute mit in den Wunderwald? Tippe auf dein Bild." mood="happy" />
          <div className="chess-kids">
            {children.map((c) => {
              const look = hero.profiles.find((p) => p.childId === c.id)?.look;
              const badges = hero.missions.filter((m) => m.childId === c.id && m.firstCompletedAt).length;
              return (
                <Link key={c.id} to={`/entdecken/helden/${c.id}`} className={`chess-kid tone-${c.color}`}>
                  {look ? <HeroFigure look={look} size={110} /> : <Avatar avatar={c.avatar} color={c.color} size={88} />}
                  <span className="chess-kid__name">{c.name}</span>
                  <span className="chess-kid__badges">{badges ? `${badges} Abzeichen` : 'Noch kein Abzeichen'}</span>
                </Link>
              );
            })}
          </div>
        </section>
        <section className="card">
          <h2 className="card__title">Für Mama und Papa</h2>
          <p className="muted">
            Momo liest alles vor. Es gibt keine Zeitanzeige und keine Strafen, Hilfe ist nie falsch. Manche Missionen haben eine Aufgabe für die echte Welt,
            die ihr gemeinsam macht. Neue Missionen öffnen sich an euren Missionstagen.
          </p>
          <Link to="/eltern/heldenwelt" className="btn btn--ghost">Fortschritt und Einstellungen (Eltern)</Link>
        </section>
      </div>
    </div>
  );
}

/** Die Weltkarte eines Kindes. */
export function HeroMapPage() {
  const { childId } = useParams();
  const children = useChildren();
  const state = useHeroState(childId);
  const navigate = useNavigate();
  const [place, setPlace] = useState<HeroPlace | null>(null);
  const { over } = usePlayClock(childId);
  const gate = useCheckpoint(over, 'map', true);
  if (!children || !state) return null;
  const child = children.find((c) => c.id === childId);
  if (!child) return <p className="card">Dieses Kind gibt es nicht.</p>;
  const { profile, states, records } = state;
  const nextIndex = states.findIndex((s) => s.status === 'progress') >= 0 ? states.findIndex((s) => s.status === 'progress') : states.findIndex((s) => s.status === 'open');
  const next = nextIndex >= 0 ? HERO_MISSIONS[nextIndex] : undefined;
  const waiting = states.find((s) => s.status === 'waiting');
  const momoText = next
    ? states[nextIndex].status === 'progress' ? `Weiter geht’s mit „${next.title}“! Ich habe mir gemerkt, wo wir waren.` : `Heute wartet ein Abenteuer auf dich: „${next.title}“.`
    : waiting?.opensOn ? `Die nächste Mission öffnet sich am ${formatWeekday(waiting.opensOn)}. Alte Abenteuer kannst du immer nochmal spielen!`
      : 'Du hast alle Missionen geschafft! Bald gibt es neue Abenteuer.';
  const start = async (missionId: string, fresh: boolean) => {
    if (fresh) await restartMission(db, child.id, missionId);
    navigate(`/entdecken/helden/${child.id}/${missionId}`);
  };
  const badges = HERO_MISSIONS.filter((m) => records.some((r) => r.missionId === m.id && r.firstCompletedAt));

  return (
    <div>
      <header className="page-head">
        <Link to="/entdecken/helden" className="btn btn--icon btn--ghost" aria-label="Zurück zur Heldenwelt"><ArrowLeft size={22} /></Link>
        <Avatar avatar={child.avatar} color={child.color} size={48} />
        <h1>{child.name} im Wunderwald</h1>
      </header>
      <div className="stack">
        <section className="hero-map" aria-label="Weltkarte">
          <svg className="hero-map__paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M22 70 Q35 45 48 30" /><path d="M22 70 Q50 82 76 70" /><path d="M48 30 Q66 18 82 24" /><path d="M22 70 Q12 48 15 25" />
            <path className="hero-map__river" d="M58 100 Q62 80 70 62 Q80 45 100 42" />
          </svg>
          {HERO_PLACES.map((p) => {
            const here = HERO_MISSIONS.map((m, i) => ({ m, s: states[i] })).filter((x) => x.m.place === p.id);
            const hot = here.some((x) => x.s.status === 'open' || x.s.status === 'progress');
            return (
              <button key={p.id} type="button" className={`hero-place ${p.soon ? 'is-soon' : ''} ${hot ? 'is-hot' : ''}`} style={{ left: `${p.x}%`, top: `${p.y}%` }} onClick={() => setPlace(p)}>
                <span className="hero-place__emoji" aria-hidden="true">{p.emoji}</span>
                <span className="hero-place__name">{p.name}</span>
                {here.length > 0 && <span className="hero-place__marks" aria-hidden="true">{here.map((x) => (x.s.status === 'done' ? x.m.badge.emoji : x.s.status === 'locked' || x.s.status === 'waiting' ? '🔒' : '✨')).join(' ')}</span>}
              </button>
            );
          })}
          {profile.look && <span className="hero-map__hero" aria-label="Dein Held"><HeroFigure look={profile.look} size={84} /></span>}
          <span className="hero-map__momo" aria-hidden="true"><Momo mood="happy" size={70} className="momo--bob" /></span>
        </section>

        <section className="card hero-next">
          <MomoSays text={momoText} size={80}>
            {next && (
              <button type="button" className="btn btn--primary btn--big" onClick={() => void start(next.id, false)}>
                {states[nextIndex].status === 'progress' ? 'Weitermachen' : 'Los geht’s'}
              </button>
            )}
          </MomoSays>
        </section>

        <section className="card">
          <h2 className="card__title">Mein Heldenbuch</h2>
          {badges.length ? (
            <div className="chess-badges">
              {badges.map((m) => <span key={m.id} className="chess-badge"><span className="chess-badge__emoji" aria-hidden="true">{m.badge.emoji}</span>{m.badge.name}</span>)}
            </div>
          ) : <p className="muted">Nach jeder Mission bekommst du ein Abzeichen.</p>}
        </section>
      </div>

      {place && (
        <div className="hero-gate" role="dialog" aria-modal="true" aria-label={place.name} onClick={() => setPlace(null)}>
          <div className="hero-gate__card card hero-place-panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="hero-place-panel__title"><span aria-hidden="true">{place.emoji}</span> {place.name}</h2>
            {place.soon ? (
              <MomoSays text={place.soon} mood="think" size={80} />
            ) : (
              <>
                <p className="muted">Hier wohnt {place.friend === 'Momo' ? 'Momo' : `${place.friend}, ${FRIENDS[place.friend].text}`} {FRIENDS[place.friend].emoji}</p>
                <ul className="hero-place-panel__list">
                  {HERO_MISSIONS.map((m, i) => ({ m, s: states[i], r: records.find((r) => r.missionId === m.id) })).filter((x) => x.m.place === place.id).map(({ m, s, r }) => (
                    <MissionRow key={m.id} title={m.title} emoji={m.emoji} state={s} record={r} onStart={(fresh) => void start(m.id, fresh)} />
                  ))}
                </ul>
              </>
            )}
            <button type="button" className="btn btn--ghost" onClick={() => setPlace(null)}>Zurück zur Karte</button>
          </div>
        </div>
      )}
      {gate && <PauseGate childId={child.id} name={child.name} />}
    </div>
  );
}

function MissionRow({ title, emoji, state, record, onStart }: { title: string; emoji: string; state: MissionState; record?: HeroMission; onStart: (fresh: boolean) => void }) {
  const playable = isPlayable(state.status);
  return (
    <li className={`hero-mission-row hero-mission-row--${state.status}`}>
      <span className="hero-mission-row__emoji" aria-hidden="true">{playable ? emoji : <Lock size={26} />}</span>
      <span className="hero-mission-row__main">
        <span className="hero-mission-row__title">{title}</span>
        <span className={`chess-stop__state hero-state--${state.status}`}>
          {state.status === 'waiting' && state.opensOn ? `Ab ${formatWeekday(state.opensOn)}` : MISSION_STATUS_TEXT[state.status]}
        </span>
      </span>
      {state.status === 'progress' && (
        <>
          <button type="button" className="btn btn--primary" onClick={() => onStart(false)}>Weitermachen</button>
          <button type="button" className="btn btn--ghost btn--small" onClick={() => onStart(true)}>Von vorn</button>
        </>
      )}
      {state.status === 'open' && <button type="button" className="btn btn--primary" onClick={() => onStart(false)}>Los geht’s</button>}
      {state.status === 'done' && <button type="button" className="btn" onClick={() => onStart(false)}>{record && record.runs > 0 ? 'Nochmal spielen' : 'Spielen'}</button>}
    </li>
  );
}

/** Eine Mission spielen. */
export function HeroMissionPage() {
  const { childId, missionId } = useParams();
  const children = useChildren();
  const state = useHeroState(childId);
  if (!children || !state) return null;
  const child = children.find((c) => c.id === childId);
  const def = missionId ? HERO_MISSION_BY_ID.get(missionId) : undefined;
  if (!child || !def) return <p className="card">Diese Mission gibt es nicht.</p>;
  const s = state.states[HERO_MISSIONS.indexOf(def)];
  if (!isPlayable(s.status)) {
    return (
      <div className="stack">
        <Link to={`/entdecken/helden/${child.id}`} className="btn btn--ghost"><ArrowLeft size={20} aria-hidden="true" /> Zur Weltkarte</Link>
        <p className="card chess-wait">{s.status === 'waiting' && s.opensOn ? `🌙 Diese Mission öffnet sich am ${formatWeekday(s.opensOn)}.` : '🔒 Diese Mission öffnet sich nach der vorigen.'}</p>
      </div>
    );
  }
  return <MissionPlayer key={`${child.id}|${def.id}`} child={child} def={def} profile={state.profile} />;
}

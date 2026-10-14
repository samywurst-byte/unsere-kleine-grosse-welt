import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { Field, Segmented, Toggle, WeekdayPicker } from '../../components/FormControls';
import { Link } from 'react-router-dom';
import { ABILITIES, ACADEMY_PRINCIPLES, ACADEMY_WEEKS, COURAGE_HELPERS } from '../../data/heroAcademy';
import { HERO_MISSIONS, HERO_PLACE_BY_ID, RESCUE_WAYS, type HeroPlaceId } from '../../data/heroWorld';
import { mamaTimeId } from '../../services/familyTime';
import { db } from '../../database/db';
import { useChildren, useHeroData, useSettings } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import {
  addOwnIdea, defaultProfile, heroMissionDays, HELP_LEVEL_TEXT, markReal, missionStates, playLimitMinutes, resetMission, setMissionRelease, updateProfile,
} from '../../services/heroWorld';
import type { ChildProfile, HeroMission, HeroProfile } from '../../types';
import { formatLong, formatWeekday, toDateKey } from '../../utils/dates';
import { HeroFigure } from './HeroArt';
import { MISSION_STATUS_TEXT } from './HeroPages';
import '../chess/chess.css';
import './hero.css';

const SOLUTION_TEXT: Record<string, string> = {
  ...Object.fromEntries(RESCUE_WAYS.map((w) => [w.id, w.name])),
  ...Object.fromEntries(HERO_MISSIONS.flatMap((m) => m.steps.flatMap((st) => (st.kind === 'choice' ? st.options.map((o) => [o.id, o.name]) : [])))),
  ...Object.fromEntries(COURAGE_HELPERS.map((h) => [h.id, h.name])),
  own: 'Eigene Idee',
};

const solutionText = (s: string) => s.split('+').map((x) => SOLUTION_TEXT[x] ?? x).join(' und ');

/** Elternbereich der Heldenwelt: was gespielt wurde, Missionstage, Hilfe, Spielzeit, Freigaben. Keine Bewertung. */
export function HeroSettings() {
  const children = useChildren();
  const hero = useHeroData();
  const settings = useSettings();
  const today = toDateKey(useNow(60_000));
  const times = useLiveQuery(() => db.playTimes.where('date').equals(today).toArray(), [today]);
  const mama = useLiveQuery(async () => (children ? (await db.familyTimeSessions.bulkGet(children.map((c) => mamaTimeId(c.id, today)))).filter(Boolean).map((x) => x!.childId) : []), [children, today]);
  if (!children || !hero || !settings || !times || !mama) return null;
  const days = heroMissionDays(settings);
  const limit = playLimitMinutes(settings);

  return (
    <div className="parent-section">
      <div className="parent-section__head"><h2>Heldenwelt</h2></div>
      <p className="small muted">
        Hier steht nur, was gespielt wurde: keine Bewertung und keine Diagnose. Hilfe zu nutzen ist nie ein Fehler.
        Aufgaben für die echte Welt sind freiwillig und immer mit euch.
      </p>

      <section className="card">
        <h3 className="card__title">Missionstage und Spielzeit</h3>
        <div className="form-grid">
          <Field label="Neue Missionen an" hint={days.length ? 'Eine verpasste Mission bleibt offen. Wiederholen geht jeden Tag.' : 'Keine Tage gewählt: Die nächste Mission öffnet sich sofort.'}>
            <WeekdayPicker value={days} onChange={(v) => void db.settings.update('app', { heroMissionDays: v.length > 2 ? v.filter((d) => d !== days[0]) : v })} />
          </Field>
          <Field label="Sanfte Grenze pro Kind und Tag (Heldenwelt und Schach zusammen)" hint="Ist die Zeit um, schlägt Momo nach dem laufenden Schritt eine Pause vor. Mit eurer PIN geht es weiter.">
            <Segmented label="Minuten" value={String(limit)} onChange={(v) => void db.settings.update('app', { playLimitMinutes: Number(v) })}
              options={[{ value: '0', label: 'aus' }, { value: '10', label: '10' }, { value: '15', label: '15' }, { value: '20', label: '20' }, { value: '30', label: '30' }]} />
          </Field>
        </div>
        <p className="small muted">
          Heute gespielt: {children.map((c) => `${c.name} ${Math.round((times.find((t) => t.childId === c.id)?.ms ?? 0) / 60_000)} Min.`).join(' · ')}.
          Die Zeit zählt nur auf diesem iPad.
        </p>
      </section>

      <section className="card">
        <h3 className="card__title">🏰 Heldenakademie</h3>
        <p className="small">Mutig sein. Gefühle verstehen. Gemeinsam stark werden. Acht Missionen in vier Wochen, weiter zwei pro Woche an euren Missionstagen. Sie beginnt nach dem Ninja-Pfad. Wollt ihr früher starten, gebt „Brummi ist wütend“ unten beim Kind frei.</p>
        <ul className="hero-principles">
          {ACADEMY_PRINCIPLES.map((p) => <li key={p}>{p}</li>)}
        </ul>
        <div className="hero-abilities hero-abilities--parents">
          {ABILITIES.map((a) => (
            <div key={a.id} className="hero-ability is-on">
              <span className="hero-ability__emoji" aria-hidden="true">{a.emoji}</span>
              <span className="hero-ability__name">{a.name}</span>
              <span className="hero-ability__text">{a.learns}</span>
            </div>
          ))}
        </div>
        <h4 className="hero-sub">Für den Alltag</h4>
        {ACADEMY_WEEKS.map((w) => (
          <details key={w.week} className="hero-week">
            <summary>Woche {w.week}: {w.title}</summary>
            <ul>{w.everyday.map((t) => <li key={t}>{t}</li>)}</ul>
          </details>
        ))}
        <p className="small">
          <strong>Mama-Zeit heute:</strong> {children.map((c) => `${c.name} ${mama.includes(c.id) ? '✓' : 'noch nicht'}`).join(' · ')}.
          Jeden Tag 10 Minuten nur für ein Kind, egal wie der Tag lief. <Link to="/familienzeit">Zur Familienzeit</Link>
        </p>
      </section>

      {children.map((c) => (
        <ChildCard key={c.id} child={c} today={today} days={days}
          profile={hero.profiles.find((p) => p.childId === c.id) ?? defaultProfile(c.id)} records={hero.missions.filter((m) => m.childId === c.id)} />
      ))}
    </div>
  );
}

function ChildCard({ child, profile, records, today, days }: { child: ChildProfile; profile: HeroProfile; records: HeroMission[]; today: string; days: Parameters<typeof missionStates>[4] }) {
  const states = missionStates(HERO_MISSIONS, records, child.id, today, days);
  const favourites = Object.entries(profile.placeVisits).sort((a, b) => b[1] - a[1]).slice(0, 2)
    .map(([id, n]) => `${HERO_PLACE_BY_ID.get(id as HeroPlaceId)?.name ?? id} (${n}×)`);
  const repeats = records.reduce((n, r) => n + Math.max(0, r.runs - 1), 0);
  return (
    <section className="card">
      <h3 className="card__title"><Avatar avatar={child.avatar} color={child.color} size={36} /> {child.name}</h3>
      <div className="hero-parent-head">
        {profile.look && <HeroFigure look={profile.look} size={110} />}
        <div className="stack">
          <p className="small">
            {favourites.length ? `Am liebsten: ${favourites.join(', ')}.` : 'Noch keine Orte besucht.'}
            {repeats ? ` Freiwillig wiederholt: ${repeats}×.` : ''}
          </p>
          <Field label="Momo bietet Hilfe an">
            <Segmented label="Hilfe" value={profile.helpLevel} onChange={(v) => void updateProfile(db, child.id, { helpLevel: v })}
              options={(['early', 'normal', 'late'] as const).map((v) => ({ value: v, label: HELP_LEVEL_TEXT[v] }))} />
          </Field>
          <Toggle checked={profile.easy} onChange={(v) => void updateProfile(db, child.id, { easy: v })} label="Leichtere Aufgaben (z. B. kürzere Brücke)" />
        </div>
      </div>
      <ul className="list">
        {HERO_MISSIONS.map((m, i) => (
          <MissionItem key={m.id} child={child} def={m} state={states[i]} record={records.find((r) => r.missionId === m.id)} />
        ))}
      </ul>
    </section>
  );
}

function MissionItem({ child, def, state, record }: { child: ChildProfile; def: (typeof HERO_MISSIONS)[number]; state: ReturnType<typeof missionStates>[number]; record?: HeroMission }) {
  const [idea, setIdea] = useState('');
  const [open, setOpen] = useState(false);
  const meta = [
    record?.firstCompletedAt ? `geschafft am ${formatLong(record.firstCompletedAt.slice(0, 10))}` : '',
    record && record.runs > 1 ? `${record.runs}× gespielt` : '',
    record?.current ? `gerade bei Schritt ${record.current.step + 1} von ${def.steps.length}` : '',
    record?.solutions.length ? `Lösung: ${record.solutions.map(solutionText).join(', ')}` : '',
    record?.helpUsed ? `Momo hat ${record.helpUsed}× geholfen` : '',
    record?.realDoneAt ? `echte Welt: gemacht am ${formatLong(record.realDoneAt.slice(0, 10))}` : record?.realLater ? 'echte Welt: noch offen' : '',
    state.status === 'waiting' && state.opensOn ? `öffnet sich am ${formatWeekday(state.opensOn)}` : '',
    record?.released && !record.firstCompletedAt ? 'von euch freigegeben' : '',
  ].filter(Boolean);
  return (
    <li className="list-item hero-parent-mission">
      <span className="hero-parent-mission__emoji" aria-hidden="true">{def.emoji}</span>
      <div className="list-item__main">
        <p className="list-item__title">{def.number}. {def.title} <span className={`chess-stop__state hero-state--${state.status}`}>{MISSION_STATUS_TEXT[state.status]}</span></p>
        <p className="list-item__meta">{meta.join(' · ') || def.parents}</p>
        {record?.ownIdeas?.map((o) => <p key={o.confirmedAt} className="small">💡 Eigene Idee: {o.text}</p>)}
        {open && (
          <div className="stack hero-parent-mission__more">
            <p className="small muted">{def.parents}</p>
            <Field label={`Eigene Idee von ${child.name} als Lösung bestätigen`}>
              <div className="row">
                <input className="input" value={idea} maxLength={200} placeholder="z. B. mit einem Seil rüberziehen" onChange={(e) => setIdea(e.target.value)} />
                <button type="button" className="btn" disabled={!idea.trim()} onClick={() => { void addOwnIdea(db, child.id, def.id, idea); setIdea(''); }}>Bestätigen</button>
              </div>
            </Field>
            <div className="row row--wrap">
              {record?.realLater && !record.realDoneAt && <button type="button" className="btn btn--small" onClick={() => void markReal(db, child.id, def.id, true)}>Echte Aufgabe gemacht</button>}
              {(state.status === 'locked' || state.status === 'waiting') && <button type="button" className="btn btn--small" onClick={() => void setMissionRelease(db, child.id, def.id, true)}>Jetzt freigeben</button>}
              {record?.released && !record.firstCompletedAt && <button type="button" className="btn btn--small btn--ghost" onClick={() => void setMissionRelease(db, child.id, def.id, false)}>Freigabe zurück</button>}
              {record && (
                <button type="button" className="btn btn--small btn--ghost" onClick={() => {
                  if (window.confirm(`„${def.title}“ für ${child.name} ganz zurücksetzen? Abzeichen und Stand gehen verloren.`)) void resetMission(db, child.id, def.id);
                }}>Zurücksetzen</button>
              )}
            </div>
          </div>
        )}
      </div>
      <button type="button" className="btn btn--small btn--ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>{open ? 'Weniger' : 'Mehr'}</button>
    </li>
  );
}

import { BookHeart, CalendarHeart, ChevronRight, Heart, Leaf, Star, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Modal } from '../../components/Modal';
import { IDS } from '../../data/seed';
import { MAMA_ACTIVITIES, MAMA_ACTIVITY_BY_ID, type MamaActivity } from '../../data/familyTime';
import { db } from '../../database/db';
import { useChildren, useCouncilNote, useFamilyMemories, useFamilyTimeSessions, useFamilyTimeSessionsBetween, useRitualFavorites, useRituals, useSettings, useStarTransactions, useTimerPresets, useWeekendAdventures, useWorld } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import {
  councilAgenda, councilDate, isMamaTime, memoryPhotos, nextPapaDay, papaTimeSettings, papaTimeThisWeek, recordMamaTime, recordPapaTime, removeMamaTime, removePapaTime, weekendOf,
} from '../../services/familyTime';
import type { ChildProfile } from '../../types';
import { addDaysKey, formatDayMonth, formatWeekday, toDateKey, weekStartKey, weekdayOf } from '../../utils/dates';
import { VisualTimer } from '../timers/VisualTimer';
import { preparationDue, seasonalRituals } from '../../services/rituals';
import { nextCountry, starBalance } from '../../services/stars';
import { AdventureSummary } from './AdventureSummary';
import { ritualLeadDays } from './RitualsPage';
import './familyTime.css';

/**
 * Familienzeit ist das Herzstück für alles Gemeinsame: Mama-Zeit, Wochenendabenteuer, Familienrat und Erinnerungen.
 * Nichts davon bringt Sterne. Es gehört zum Familienleben und muss nicht verdient werden.
 */
export function FamilyTimePage() {
  const now = useNow(30_000);
  const today = toDateKey(now);
  return (
    <div>
      <header className="page-head"><h1>Familienzeit</h1></header>
      <div className="ft-hub">
        <MamaTimeCard today={today} />
        <PapaTimeCard today={today} />
        <AdventureCard now={now} />
        <CouncilCard today={today} />
        <MemoriesCard />
        <StarsCard />
        <RitualsCard today={today} />
      </div>
    </div>
  );
}

function MamaTimeCard({ today }: { today: string }) {
  const children = useChildren();
  const all = useFamilyTimeSessions(today);
  const [child, setChild] = useState<ChildProfile | null>(null);
  if (!children || !all) return null;
  const sessions = all.filter(isMamaTime);
  return (
    <section className="card ft-card tone-rose">
      <h2 className="card__title"><Heart size={26} aria-hidden="true" /> Meine Zeit mit Mama</h2>
      <p className="muted ft-card__lead">Zehn Minuten gehören jedem Kind, jeden Tag, ganz egal, wie der Tag gelaufen ist.</p>
      <div className="ft-kids">
        {children.map((c) => {
          const s = sessions.find((x) => x.childId === c.id);
          const act = s ? MAMA_ACTIVITY_BY_ID.get(s.activity) : undefined;
          return (
            <button key={c.id} type="button" className={`ft-kid tone-${c.color} ${s ? 'ft-kid--done' : ''}`} onClick={() => setChild(c)}>
              <Avatar avatar={c.avatar} color={c.color} size={88} />
              <span className="ft-kid__name">{c.name}</span>
              <span className="ft-kid__state">{act ? <><span aria-hidden="true">{act.emoji}</span> {act.label}</> : 'Heute noch offen'}</span>
            </button>
          );
        })}
      </div>
      {child && <TogetherModal who="mama" child={child} today={today} onClose={() => setChild(null)} />}
    </section>
  );
}

function PapaTimeCard({ today }: { today: string }) {
  const children = useChildren();
  const settings = useSettings();
  const from = weekStartKey(today);
  const sessions = useFamilyTimeSessionsBetween(from, addDaysKey(from, 6));
  const [child, setChild] = useState<ChildProfile | null>(null);
  if (!children || !settings || !sessions) return null;
  const papa = papaTimeSettings(settings);
  if (papa.perWeek <= 0) return null;
  const next = nextPapaDay(today, papa.days);
  const isDay = next === today;
  return (
    <section className="card ft-card tone-sky">
      <h2 className="card__title"><Heart size={26} aria-hidden="true" /> Meine Zeit mit Papa</h2>
      <p className="muted ft-card__lead">
        {papa.perWeek === 1 ? 'Einmal pro Woche' : `${papa.perWeek}-mal pro Woche`} gehört Papa jedem Kind allein.
        {isDay ? ' Heute ist ein guter Tag dafür.' : next ? ` Nächster Papa-Tag: ${formatWeekday(next)}.` : ''}
      </p>
      <div className="ft-kids">
        {children.map((c) => {
          const week = papaTimeThisWeek(sessions, c.id, today);
          const todays = week.find((s) => s.date === today);
          const act = todays ? MAMA_ACTIVITY_BY_ID.get(todays.activity) : undefined;
          const done = week.length >= papa.perWeek;
          return (
            <button key={c.id} type="button" className={`ft-kid tone-${c.color} ${done ? 'ft-kid--done' : ''}`} onClick={() => setChild(c)}>
              <Avatar avatar={c.avatar} color={c.color} size={88} />
              <span className="ft-kid__name">{c.name}</span>
              <span className="ft-kid__state">
                {act ? <><span aria-hidden="true">{act.emoji}</span> {act.label}</> : done ? 'Diese Woche geschafft' : week.length ? `${week.length} von ${papa.perWeek} diese Woche` : 'Diese Woche noch offen'}
              </span>
            </button>
          );
        })}
      </div>
      {child && <TogetherModal who="papa" child={child} today={today} onClose={() => setChild(null)} />}
    </section>
  );
}

/** Exklusive Zeit mit Mama oder Papa: Aktivität wählen, optional Timer, fertig. Keine Sterne. */
function TogetherModal({ who, child, today, onClose }: { who: 'mama' | 'papa'; child: ChildProfile; today: string; onClose: () => void }) {
  const presets = useTimerPresets();
  const sessions = useFamilyTimeSessions(today);
  const done = sessions?.find((s) => s.childId === child.id && (who === 'papa' ? s.parent === 'papa' : isMamaTime(s)));
  const [activity, setActivity] = useState<MamaActivity | null>(null);
  const name = who === 'papa' ? 'Papa' : 'Mama';
  const timer = who === 'mama'
    ? presets?.find((p) => p.id === IDS.timerMamaTime) ?? presets?.find((p) => p.label.includes('Mama'))
    : presets?.find((p) => p.label.includes('Papa'));

  const finish = async () => {
    if (!activity) return;
    await (who === 'papa' ? recordPapaTime : recordMamaTime)(db, child.id, today, activity.id, timer?.minutes);
    onClose();
  };

  return (
    <Modal title={activity ? `${activity.emoji} ${activity.label} mit ${name}` : `Was möchtest du mit ${name} machen, ${child.name}?`} onClose={onClose} wide
      actions={activity ? (
        <>
          <button type="button" className="btn" onClick={() => setActivity(null)}>Etwas anderes</button>
          <button type="button" className="btn btn--primary" onClick={() => void finish()}><Heart size={18} aria-hidden="true" /> Fertig, war schön</button>
        </>
      ) : done ? (
        <button type="button" className="btn btn--ghost" onClick={() => void (who === 'papa' ? removePapaTime : removeMamaTime)(db, child.id, today).then(onClose)}>Doch noch nicht gemacht</button>
      ) : undefined}
    >
      {activity ? (
        <div className="ft-timer">
          {timer ? <VisualTimer preset={timer} size={260} />
            : who === 'mama' ? <p className="muted">Kein Mama-Zeit-Timer vorhanden. Im Elternbereich unter Timer anlegen.</p>
            : <p className="muted">Viel Spaß zusammen! (Wer mag, legt im Elternbereich einen Timer „Papa-Zeit“ an.)</p>}
          <p className="muted">Die Zeit darf gern länger dauern.</p>
        </div>
      ) : (
        <>
          {done && <p className="notice notice--ok">Heute schon gemacht: {MAMA_ACTIVITY_BY_ID.get(done.activity)?.label ?? done.activity}. Ihr könnt gern noch mehr Zeit zusammen verbringen.</p>}
          <div className="ft-picks">
            {MAMA_ACTIVITIES.map((a) => (
              <button key={a.id} type="button" className="ft-pick" onClick={() => setActivity(a)}>
                <span className="ft-pick__emoji" aria-hidden="true">{a.emoji}</span>
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}

function AdventureCard({ now }: { now: Date }) {
  const adventures = useWeekendAdventures();
  if (!adventures) return null;
  const weekend = weekendOf(toDateKey(now));
  return (
    <section className="card ft-card tone-sage">
      <h2 className="card__title"><CalendarHeart size={26} aria-hidden="true" /> Unser Wochenendabenteuer</h2>
      <AdventureSummary now={now} adventure={adventures.find((a) => a.id === weekend)} />
      <Link to="/familienzeit/abenteuer" className="btn btn--sage ft-card__more">Zum Abenteuer <ChevronRight size={18} aria-hidden="true" /></Link>
    </section>
  );
}

function CouncilCard({ today }: { today: string }) {
  const settings = useSettings();
  const date = councilDate(today);
  const note = useCouncilNote(date);
  if (!settings || note === undefined) return null;
  const agenda = councilAgenda(settings);
  const done = note?.doneItems?.length ?? 0;
  const isSunday = weekdayOf(today) === 0;
  return (
    <section className="card ft-card tone-sky">
      <h2 className="card__title"><Users size={26} aria-hidden="true" /> Unser Familienrat</h2>
      <p className="ft-card__lead">
        {isSunday ? <strong>Heute ist Familienrat!</strong> : <>Am Sonntag, {formatDayMonth(date)}</>}
        {' '}<span className="muted">{done ? `${done} von ${agenda.length} Punkten besprochen` : `${agenda.length} Punkte, etwa 15 Minuten`}</span>
      </p>
      <ol className="ft-agenda-preview">
        {agenda.slice(0, 6).map((a, i) => <li key={i} className={note?.doneItems?.includes(i) ? 'is-done' : ''}>{a}</li>)}
      </ol>
      <Link to="/familienzeit/familienrat" className="btn btn--sky ft-card__more">Familienrat öffnen <ChevronRight size={18} aria-hidden="true" /></Link>
    </section>
  );
}

function MemoriesCard() {
  const memories = useFamilyMemories();
  if (!memories) return null;
  const latest = memories.slice(0, 3);
  return (
    <section className="card ft-card tone-gold">
      <h2 className="card__title"><BookHeart size={26} aria-hidden="true" /> Unsere Erinnerungen</h2>
      {latest.length ? (
        <div className="ft-mem-strip">
          {latest.map((m) => (
            <figure key={m.id} className="ft-mem-mini">
              {memoryPhotos(m)[0] ? <img src={memoryPhotos(m)[0]} alt="" /> : <span className="ft-mem-mini__blank" aria-hidden="true">✨</span>}
              <figcaption>{m.title}</figcaption>
            </figure>
          ))}
        </div>
      ) : <p className="muted ft-card__lead">Hier sammeln wir schöne Momente, zum Beispiel nach einem Abenteuer.</p>}
      <div className="row row--wrap ft-card__more">
        <Link to="/familienzeit/erinnerungen" className="btn">Alle Erinnerungen <ChevronRight size={18} aria-hidden="true" /></Link>
        <Link to="/archiv" className="btn">🗂️ Familienarchiv und Jahresrückblick <ChevronRight size={18} aria-hidden="true" /></Link>
      </div>
    </section>
  );
}

/** Familiensterne: nur aus freiwilligen Zusatzmissionen, ein gemeinsames Glas für die Weltreise. */
function StarsCard() {
  const stars = useStarTransactions();
  const world = useWorld();
  const settings = useSettings();
  if (!stars || !world || !settings) return null;
  const balance = starBalance(stars);
  const next = nextCountry(world.countries, world.unlocks);
  const cost = settings.starsPerCountry;
  return (
    <section className="card ft-card tone-sky">
      <h2 className="card__title"><Star size={26} aria-hidden="true" /> Unsere Familiensterne</h2>
      <div className="ft-jar-mini">
        <strong>{balance}</strong>
        <span className="ft-jar-mini__bar" aria-hidden="true"><span style={{ width: `${Math.min(100, (balance / cost) * 100)}%` }} /></span>
        {next && <span aria-hidden="true">{next.flagEmoji}</span>}
      </div>
      <p className="muted ft-card__lead">
        {next ? (balance >= cost ? `Genug Sterne für ${next.nameDe}! Zusammen freischalten.` : `Noch ${cost - balance} bis ${next.nameDe}. Sterne gibt es für freiwillige Zusatzmissionen.`) : 'Alle Länder sind besucht.'}
      </p>
      <Link to="/weltreise" className="btn btn--sky ft-card__more">Zur Weltreise <ChevronRight size={18} aria-hidden="true" /></Link>
    </section>
  );
}

function RitualsCard({ today }: { today: string }) {
  const rituals = useRituals();
  const favorites = useRitualFavorites();
  if (!rituals || !favorites) return null;
  const planned = rituals.filter((r) => r.status === 'planned');
  const due = preparationDue(rituals, today, ritualLeadDays);
  const ideas = seasonalRituals(today, favorites).slice(0, 3);
  return (
    <section className="card ft-card tone-sage">
      <h2 className="card__title"><Leaf size={26} aria-hidden="true" /> Jahreszeitenrituale</h2>
      {due.length > 0 && <p className="notice notice--info">Material besorgen für: {due.map((r) => `${r.emoji} ${r.title}`).join(', ')}</p>}
      {planned.length > 0
        ? <p className="ft-card__lead">Vorgemerkt: {planned.map((r) => `${r.emoji} ${r.title}`).join(', ')}</p>
        : <p className="muted ft-card__lead">Passt gerade: {ideas.map((i) => `${i.emoji} ${i.title}`).join(', ')}</p>}
      <Link to="/familienzeit/rituale" className="btn btn--sage ft-card__more">Rituale ansehen <ChevronRight size={18} aria-hidden="true" /></Link>
    </section>
  );
}

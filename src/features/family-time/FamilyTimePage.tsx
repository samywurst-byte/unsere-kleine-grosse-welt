import { BookHeart, CalendarHeart, ChevronRight, Heart, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Modal } from '../../components/Modal';
import { IDS } from '../../data/seed';
import { MAMA_ACTIVITIES, MAMA_ACTIVITY_BY_ID, type MamaActivity } from '../../data/familyTime';
import { db } from '../../database/db';
import { useChildren, useCouncilNote, useFamilyMemories, useFamilyTimeSessions, useSettings, useTimerPresets, useWeekendAdventures } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { councilAgenda, councilDate, memoryPhotos, recordMamaTime, removeMamaTime, weekendOf } from '../../services/familyTime';
import type { ChildProfile } from '../../types';
import { formatDayMonth, toDateKey, weekdayOf } from '../../utils/dates';
import { VisualTimer } from '../timers/VisualTimer';
import { AdventureSummary } from './AdventureSummary';
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
        <AdventureCard now={now} />
        <CouncilCard today={today} />
        <MemoriesCard />
      </div>
    </div>
  );
}

function MamaTimeCard({ today }: { today: string }) {
  const children = useChildren();
  const sessions = useFamilyTimeSessions(today);
  const [child, setChild] = useState<ChildProfile | null>(null);
  if (!children || !sessions) return null;
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
      {child && <MamaTimeModal child={child} today={today} onClose={() => setChild(null)} />}
    </section>
  );
}

function MamaTimeModal({ child, today, onClose }: { child: ChildProfile; today: string; onClose: () => void }) {
  const presets = useTimerPresets();
  const sessions = useFamilyTimeSessions(today);
  const done = sessions?.find((s) => s.childId === child.id);
  const [activity, setActivity] = useState<MamaActivity | null>(null);
  const mama = presets?.find((p) => p.id === IDS.timerMamaTime) ?? presets?.find((p) => p.label.includes('Mama'));

  const finish = async () => {
    if (!activity) return;
    await recordMamaTime(db, child.id, today, activity.id, mama?.minutes);
    onClose();
  };

  return (
    <Modal title={activity ? `${activity.emoji} ${activity.label} mit Mama` : `Was möchtest du mit Mama machen, ${child.name}?`} onClose={onClose} wide
      actions={activity ? (
        <>
          <button type="button" className="btn" onClick={() => setActivity(null)}>Etwas anderes</button>
          <button type="button" className="btn btn--primary" onClick={() => void finish()}><Heart size={18} aria-hidden="true" /> Fertig, war schön</button>
        </>
      ) : done ? (
        <button type="button" className="btn btn--ghost" onClick={() => void removeMamaTime(db, child.id, today).then(onClose)}>Doch noch nicht gemacht</button>
      ) : undefined}
    >
      {activity ? (
        <div className="ft-timer">
          {mama ? <VisualTimer preset={mama} size={260} /> : <p className="muted">Kein Mama-Zeit-Timer vorhanden. Im Elternbereich unter Timer anlegen.</p>}
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
      <Link to="/familienzeit/erinnerungen" className="btn ft-card__more">Alle Erinnerungen <ChevronRight size={18} aria-hidden="true" /></Link>
    </section>
  );
}

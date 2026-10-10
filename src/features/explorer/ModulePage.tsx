import { ArrowLeft, ChevronLeft, ChevronRight, Plus, ShoppingCart, Volume2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { DISCOVER_TOPIC_BY_ID } from '../../data/discover';
import { TRIP_CHECKS, YEAR_END } from '../../data/explorer';
import { EXPLORER_LEVELS, EXPLORER_MEDIA, EXPLORER_MODULE_BY_ID, EXPLORER_MODULES, TRIP_AFTER, TRIP_BEFORE, TRIP_DURING, TRIP_NOTE } from '../../data/explorerModules';
import { db } from '../../database/db';
import { useChildren, useExplorerEntries, useExplorerSundays } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { canSpeak, speak } from '../../services/discover';
import { childRoles, prepToShopping, type SundayKind } from '../../services/explorer';
import type { ChildProfile, ExplorerEntry, ExplorerModule } from '../../types';
import { ageInYears, toDateKey } from '../../utils/dates';
import { ExploreTabs } from '../library/ExploreTabs';
import { EntryCard, EntryModal, SundayControl, monthLabel } from './explorerParts';
import './explorer.css';

export function ModulePage() {
  const { moduleId } = useParams();
  const m = moduleId ? EXPLORER_MODULE_BY_ID.get(moduleId) : undefined;
  if (!m) return <p className="empty">Dieses Thema gibt es nicht. <Link to="/entdecken/sonntage">Zu den Entdeckersonntagen</Link></p>;
  return <Module m={m} key={m.id} />;
}

const ROLE_LABEL = { youngest: 'Jüngstes Kind', middle: 'Mittleres Kind', oldest: 'Ältestes Kind' } as const;

function Module({ m }: { m: ExplorerModule }) {
  const today = toDateKey(useNow(60_000));
  const children = useChildren();
  const sundays = useExplorerSundays();
  const entries = useExplorerEntries();
  const [edit, setEdit] = useState<{ entry?: ExplorerEntry; kind: SundayKind } | null>(null);
  const [shopMsg, setShopMsg] = useState<string | null>(null);
  const roles = useMemo(() => childRoles(children ?? []), [children]);
  if (!children || !sundays || !entries) return null;
  const idx = EXPLORER_MODULES.findIndex((x) => x.id === m.id);
  const prev = EXPLORER_MODULES[idx - 1];
  const next = EXPLORER_MODULES[idx + 1];
  const mine = entries.filter((e) => e.moduleId === m.id);
  const topic = m.topicId ? DISCOVER_TOPIC_BY_ID.get(m.topicId) : undefined;
  const speech = canSpeak();
  const yearMods = EXPLORER_MODULES.filter((x) => x.year === m.year);
  const lastOfYear = yearMods[yearMods.length - 1]?.id === m.id;
  const yearEntries = entries.filter((e) => yearMods.some((x) => x.id === e.moduleId));
  const ordered = [...children].sort((a, b) => ['youngest', 'middle', 'oldest'].indexOf(roles.get(a.id) ?? '') - ['youngest', 'middle', 'oldest'].indexOf(roles.get(b.id) ?? ''));

  return (
    <div>
      <header className="page-head">
        <Link to="/entdecken/sonntage" className="btn btn--icon btn--ghost" aria-label="Zurück zu den Entdeckersonntagen"><ArrowLeft size={22} /></Link>
        <div>
          <p className="card__eyebrow" style={{ margin: 0 }}>{monthLabel(m.id)} · Entdeckerjahr {m.year}: {m.yearTitle}</p>
          <h1>{m.title}</h1>
        </div>
        <div className="spacer" />
        {prev && <Link to={`/entdecken/sonntage/${prev.id}`} className="btn btn--icon btn--ghost" aria-label={`Vorheriges Thema: ${prev.title}`}><ChevronLeft /></Link>}
        {next && <Link to={`/entdecken/sonntage/${next.id}`} className="btn btn--icon btn--ghost" aria-label={`Nächstes Thema: ${next.title}`}><ChevronRight /></Link>}
      </header>
      <ExploreTabs />

      <div className="lib-grid2">
        <div className="stack">
          <section className="card stack ex-home">
            <h2 className="card__title">🏠 Zuhause-Erlebnis</h2>
            <SundayControl m={m} kind="home" sundays={sundays} children={children} today={today} />
            <div>
              <h3 className="ex-h3">Vorbereitung</h3>
              <ul className="ex-prep">{m.prep.map((p) => <li key={p}>{p}</li>)}</ul>
              <button type="button" className="btn btn--small btn--ghost" onClick={() => void prepToShopping(db, m).then((n) => setShopMsg(n ? `${n} ${n === 1 ? 'Sache steht' : 'Sachen stehen'} jetzt auf der Einkaufsliste.` : 'Steht schon alles auf der Einkaufsliste.'))}>
                <ShoppingCart size={16} aria-hidden="true" /> Auf die Einkaufsliste
              </button>
              {shopMsg && <p className="small">{shopMsg}</p>}
            </div>
            <div>
              <h3 className="ex-h3">So läuft es ab</h3>
              <ol className="ex-steps">{m.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            </div>
            <div>
              <h3 className="ex-h3">Die drei Kernideen</h3>
              <ul className="ex-ideas">
                {m.ideas.map((i) => (
                  <li key={i}><span>{i}</span>{speech && <button type="button" className="btn btn--icon btn--small btn--ghost" aria-label="Vorlesen" onClick={() => speak(i)}><Volume2 size={18} /></button>}</li>
                ))}
              </ul>
              <p className="small muted">Pro Sonntag reichen diese drei. Alles Weitere ist Bonus, nichts wird abgefragt.</p>
            </div>
          </section>
          <section className="card">
            <h2 className="card__title">Jedes Kind auf seinem Niveau</h2>
            <ul className="ex-levels">
              {ordered.map((c) => <LevelRow key={c.id} child={c} role={roles.get(c.id) ?? 'oldest'} today={today} />)}
            </ul>
            <p className="small muted" style={{ marginTop: 'var(--space-2)' }}>Medien-Idee: {EXPLORER_MEDIA}</p>
          </section>
        </div>

        <div className="stack">
          <section className="card stack ex-trip">
            <h2 className="card__title">🚗 Ausflug: {m.trip.place}</h2>
            <p>{m.trip.description}</p>
            <SundayControl m={m} kind="trip" sundays={sundays} children={children} today={today} />
            <details className="ex-details">
              <summary>Vorher, im Museum, danach</summary>
              <h3 className="ex-h3">Vor dem Losfahren</h3><ul>{TRIP_BEFORE.map((x) => <li key={x}>{x}</li>)}</ul>
              <h3 className="ex-h3">Im Museum</h3><ul>{TRIP_DURING.map((x) => <li key={x}>{x}</li>)}</ul>
              <h3 className="ex-h3">Danach</h3><ul>{TRIP_AFTER.map((x) => <li key={x}>{x}</li>)}</ul>
            </details>
            <details className="ex-details">
              <summary>Vorher prüfen</summary>
              <ul>{TRIP_CHECKS.map((x) => <li key={x}>{x}</li>)}</ul>
              <p className="small muted">{TRIP_NOTE}</p>
            </details>
          </section>

          <section className="card stack">
            <div className="row">
              <h2 className="card__title" style={{ margin: 0, flex: 1 }}>📔 Entdeckerbuch</h2>
              <button type="button" className="btn btn--small btn--sky" onClick={() => setEdit({ kind: today >= m.tripDate ? 'trip' : 'home' })}><Plus size={16} aria-hidden="true" /> Seite</button>
            </div>
            <p className="small muted">{m.book}</p>
            {mine.length === 0 ? <p className="small">Noch keine Seite. Ein Foto und ein Satz jedes Kindes reichen.</p>
              : <div className="ex-entries">{mine.map((e) => <EntryCard key={e.id} entry={e} children={children} onEdit={() => setEdit({ entry: e, kind: e.kind })} />)}</div>}
          </section>

          {topic && (
            <section className="card stack">
              <h2 className="card__title">Weiterforschen</h2>
              <Link to={`/entdecken/${topic.id}`} className="btn">{topic.emoji} {topic.title} in unserer Bibliothek</Link>
            </section>
          )}

          {lastOfYear && (
            <section className="card ex-yearend">
              <h2 className="card__title">🎉 Jahresabschluss</h2>
              <p className="small muted">Am letzten März-Sonntag, etwa 15 Minuten.</p>
              <ul>{YEAR_END.map((x) => <li key={x}>{x}</li>)}</ul>
              {yearEntries.length > 0 && (
                <div className="ex-yearphotos">
                  {yearEntries.flatMap((e) => e.photos.slice(0, 1).map((p) => ({ p, id: e.id }))).map(({ p, id }) => <img key={id} src={p} alt="" />)}
                </div>
              )}
              <p className="small">{yearEntries.length} Entdeckerbuch-{yearEntries.length === 1 ? 'Seite' : 'Seiten'} in diesem Entdeckerjahr.</p>
            </section>
          )}
        </div>
      </div>
      {edit && <EntryModal m={m} children={children} today={today} entry={edit.entry} initialKind={edit.kind} onClose={() => setEdit(null)} />}
    </div>
  );
}

function LevelRow({ child, role, today }: { child: ChildProfile; role: keyof typeof EXPLORER_LEVELS; today: string }) {
  const age = child.birthDate ? ageInYears(child.birthDate, today) : undefined;
  return (
    <li className={`ex-level tone-${child.color}`}>
      <Avatar avatar={child.avatar} color={child.color} size={44} />
      <div>
        <strong>{child.name}</strong>{age !== undefined && <span className="small muted"> · {age} Jahre</span>}
        <p className="small" style={{ margin: 0 }}>{ROLE_LABEL[role]}: {EXPLORER_LEVELS[role]}</p>
      </div>
    </li>
  );
}

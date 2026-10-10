import { BookOpenText, Check, ChevronRight, Shuffle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HANDBOOK_STAND } from '../../data/explorerModules';
import { useExplorerEntries, useExplorerSundays, useJarQuestions } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { currentModule, drawQuestion, nextSunday, sundayDate, sundayStatus, yearProgress, yearsOf } from '../../services/explorer';
import type { ExplorerModule, ExplorerSunday } from '../../types';
import { formatLong, toDateKey } from '../../utils/dates';
import { ExploreTabs } from '../library/ExploreTabs';
import { monthLabel } from './explorerParts';
import './explorer.css';

/** Entdeckersonntage: Fahrplan 2026 bis 2033, das aktuelle Thema und das Frageglas. */
export function SundaysPage() {
  const today = toDateKey(useNow(60_000));
  const sundays = useExplorerSundays();
  const entries = useExplorerEntries();
  const questions = useJarQuestions();
  const [drawn, setDrawn] = useState<string | null>(null);
  if (!sundays || !entries || !questions) return null;
  const now = currentModule(today);
  const next = nextSunday(today, sundays);
  const years = yearsOf();
  const openYear = now?.year ?? years[years.length - 1].year;
  const open = questions.filter((q) => !q.answer);

  return (
    <div>
      <header className="page-head">
        <h1>Unsere Entdeckersonntage</h1>
        <span className="page-head__sub">Zuerst staunen, dann benennen, später verstehen</span>
      </header>
      <ExploreTabs />

      <div className="lib-grid2">
        <div className="stack">
          {now ? (
            <Link to={`/entdecken/sonntage/${now.id}`} className="card ex-now">
              <p className="card__eyebrow">{now.id === today.slice(0, 7) ? 'Diesen Monat' : 'Als Nächstes'} · Entdeckerjahr {now.year}</p>
              <h2 className="ex-now__title">{now.title}</h2>
              <div className="ex-now__days">
                <SundayChip m={now} kind="home" sundays={sundays} today={today} />
                <SundayChip m={now} kind="trip" sundays={sundays} today={today} />
              </div>
              <span className="ex-now__more">Zum Thema <ChevronRight size={18} aria-hidden="true" /></span>
            </Link>
          ) : <p className="empty">Alle sieben Entdeckerjahre sind geschafft. 🎉</p>}
          {next && (next.module.id !== now?.id) && (
            <p className="small">Nächster offener Sonntag: <Link to={`/entdecken/sonntage/${next.module.id}`}>{next.kind === 'home' ? next.module.title : next.module.trip.place}</Link> am {formatLong(next.date)}</p>
          )}
          <section className="card">
            <h2 className="card__title">Unser Fahrplan</h2>
            {years.map((y) => <YearBlock key={y.year} year={y} sundays={sundays} defaultOpen={y.year === openYear} entryCount={entries.filter((e) => y.modules.some((m) => m.id === e.moduleId)).length} />)}
          </section>
        </div>
        <div className="stack">
          <section className="card ex-jar">
            <h2 className="card__title">🫙 Das weiß ich noch nicht</h2>
            <p className="small muted">Unser Frageglas: {open.length} {open.length === 1 ? 'offene Frage' : 'offene Fragen'}, {questions.length - open.length} herausgefunden</p>
            {drawn && <p className="ex-jar__drawn">„{questions.find((q) => q.id === drawn)?.question}“</p>}
            <div className="row row--wrap">
              <Link to="/entdecken/frageglas" className="btn btn--sky">Zum Frageglas</Link>
              {open.length > 0 && <button type="button" className="btn btn--ghost" onClick={() => setDrawn(drawQuestion(questions)?.id ?? null)}><Shuffle size={18} aria-hidden="true" /> Einen Zettel ziehen</button>}
            </div>
          </section>
          <Link to="/entdecken/handbuch" className="card ex-handbook-link">
            <BookOpenText size={28} aria-hidden="true" />
            <div>
              <strong>Unser Handbuch</strong>
              <p className="small muted">Regeln, Entdeckerzentrale, Bücher, Ausstattung, Ausflugsorte und Mama-Spickzettel</p>
            </div>
          </Link>
          <p className="small muted">Termine sind Vorschläge und dürfen getauscht werden. Ausflugsziele mit Stand {HANDBOOK_STAND}: Öffnungszeiten und Programme bitte 2 bis 6 Wochen vorher prüfen.</p>
        </div>
      </div>
    </div>
  );
}

function SundayChip({ m, kind, sundays, today }: { m: ExplorerModule; kind: 'home' | 'trip'; sundays: ExplorerSunday[]; today: string }) {
  const date = sundayDate(m, kind, sundays);
  const status = sundayStatus(m, kind, sundays);
  const past = date < today && status === 'open';
  return (
    <span className={`ex-chip ex-chip--${status} ${past ? 'is-past' : ''}`}>
      <span aria-hidden="true">{kind === 'home' ? '🏠' : '🚗'}</span>
      <span>
        <strong>{kind === 'home' ? 'Zuhause' : m.trip.place}</strong>
        <span className="small">{formatLong(date)}{status === 'done' ? ' · erlebt' : status === 'skipped' ? ' · ausgelassen' : past ? ' · noch offen' : ''}</span>
      </span>
    </span>
  );
}

function YearBlock({ year, sundays, defaultOpen, entryCount }: {
  year: { year: string; title: string; modules: ExplorerModule[] }; sundays: ExplorerSunday[]; defaultOpen: boolean; entryCount: number;
}) {
  const { done, total } = yearProgress(year.modules, sundays);
  return (
    <details className="ex-year" open={defaultOpen}>
      <summary>
        <span className="ex-year__label">{year.year}</span>
        <span className="ex-year__title">{year.title}</span>
        <span className="small muted">{done} von {total}{entryCount ? ` · ${entryCount} Seiten` : ''}</span>
      </summary>
      <ul className="ex-modules">
        {year.modules.map((m) => {
          const h = sundayStatus(m, 'home', sundays); const t = sundayStatus(m, 'trip', sundays);
          return (
            <li key={m.id}>
              <Link to={`/entdecken/sonntage/${m.id}`} className="ex-module">
                <span className="ex-module__month">{monthLabel(m.id)}</span>
                <span className="ex-module__main"><strong>{m.title}</strong><span className="small muted">{m.trip.place}</span></span>
                <span className="ex-module__marks" aria-label={`Zuhause ${h === 'done' ? 'erlebt' : 'offen'}, Ausflug ${t === 'done' ? 'erlebt' : 'offen'}`}>
                  <span className={h === 'done' ? 'is-on' : ''}>{h === 'done' ? <Check size={14} /> : '🏠'}</span>
                  <span className={t === 'done' ? 'is-on' : ''}>{t === 'done' ? <Check size={14} /> : '🚗'}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}


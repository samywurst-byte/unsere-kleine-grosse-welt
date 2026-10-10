import { Link } from 'react-router-dom';
import { DISCOVER_TOPICS } from '../../data/discover';
import { useDiscoveries } from '../../hooks/useData';
import { topicProgress } from '../../services/discover';
import { ExploreTabs } from './ExploreTabs';
import './library.css';

/** Entdeckerbibliothek: Themen mit geprüften Fakten, Rätseln und Forscheraufträgen. */
export function LibraryPage() {
  const discoveries = useDiscoveries();
  if (!discoveries) return null;
  return (
    <div>
      <header className="page-head">
        <h1>Unsere Entdeckerwelt</h1>
        <span className="page-head__sub">Ein Thema aussuchen, staunen, dann selbst forschen</span>
      </header>
      <ExploreTabs />
      <div className="lib-grid">
        {DISCOVER_TOPICS.map((t) => {
          const { done, total } = topicProgress(t, discoveries);
          return (
            <Link key={t.id} to={`/entdecken/${t.id}`} className="card lib-topic">
              <span className="lib-topic__emoji" aria-hidden="true">{t.emoji}</span>
              <span className="lib-topic__title">{t.title}</span>
              <span className="lib-dots" aria-label={`${done} von ${total} Forscheraufträgen erledigt`}>
                {t.missions.map((m, i) => <span key={m.id} className={i < done ? 'is-on' : ''} />)}
              </span>
            </Link>
          );
        })}
        <Link to="/weltreise" className="card lib-topic lib-topic--world">
          <span className="lib-topic__emoji" aria-hidden="true">🌍</span>
          <span className="lib-topic__title">Länder und Kulturen</span>
          <span className="small muted">auf unserer Weltreise</span>
        </Link>
      </div>
      <p className="small muted" style={{ marginTop: 'var(--space-4)' }}>
        Alle Sachangaben stammen aus angegebenen Quellen (Klexikon, Wikipedia, NASA) und wurden am 10. Oktober 2026 geprüft. Die Quellen stehen auf jeder Themenseite.
      </p>
    </div>
  );
}

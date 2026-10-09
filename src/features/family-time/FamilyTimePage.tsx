import { Link } from 'react-router-dom';
import { useTimerPresets } from '../../hooks/useData';
import { IDS } from '../../data/seed';
import { VisualTimer } from '../timers/VisualTimer';

/**
 * Mama-Zeit und Familienrat werden in Phase C vollständig umgesetzt (Aktivitätsauswahl pro Kind, Notizen).
 * Bereits jetzt funktioniert der 10-Minuten-Timer.
 */
export function FamilyTimePage() {
  const presets = useTimerPresets();
  const mama = presets?.find((p) => p.id === IDS.timerMamaTime) ?? presets?.find((p) => p.label.includes('Mama'));
  return (
    <div>
      <header className="page-head"><h1>Familienzeit</h1></header>
      <div className="stack">
        <div className="card">
          <h2 className="card__title">Meine Zeit mit Mama <span aria-hidden="true">❤️</span></h2>
          <p className="muted" style={{ marginBottom: 'var(--space-5)' }}>
            Zehn Minuten gehören jedem Kind, jeden Tag, ganz unabhängig davon, wie der Tag gelaufen ist. Die Zeit darf gern länger dauern.
          </p>
          {mama ? <VisualTimer preset={mama} size={260} /> : <p className="muted">Kein Mama-Zeit-Timer vorhanden. <Link to="/eltern/timer">Timer im Elternbereich anlegen</Link></p>}
        </div>
        <p className="notice notice--info">
          Die Auswahl der Aktivität pro Kind und der sonntägliche Familienrat kommen in der nächsten Ausbaustufe (Phase C).
        </p>
      </div>
    </div>
  );
}

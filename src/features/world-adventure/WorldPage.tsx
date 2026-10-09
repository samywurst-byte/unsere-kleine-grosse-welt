import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../database/db';
import './world.css';

/**
 * Weltentdecker Akademie: Datenmodelle und Beispielland sind angelegt.
 * Sterne, Freischaltung und Lernmodule folgen in Phase C und D. Hier gibt es deshalb bewusst keine Spiel-Buttons.
 */
export function WorldPage() {
  const countries = useLiveQuery(() => db.countries.orderBy('order').toArray(), []);
  const italy = countries?.[0];
  return (
    <div>
      <header className="page-head"><h1>Unsere Weltreise</h1></header>
      <div className="world">
        <svg viewBox="0 0 400 220" className="world__map" aria-hidden="true">
          <rect width="400" height="220" rx="28" fill="var(--c-sky-soft)" />
          <path d="M40 120 Q70 70 120 90 T200 80 Q230 120 200 150 Q150 180 100 160 Q50 160 40 120Z" fill="var(--c-sage-soft)" />
          <path d="M230 60 Q280 40 330 70 Q360 110 330 150 Q290 170 260 140 Q230 110 230 60Z" fill="var(--c-sage-soft)" />
          <path d="M90 120 l12 -22 l12 22 Z M110 124 l10 -18 l10 18 Z" fill="var(--sage)" />
          <circle cx="300" cy="100" r="7" fill="var(--terracotta)" />
          <path d="M140 120 Q200 40 300 100" stroke="var(--terracotta)" strokeWidth="3" strokeDasharray="6 8" fill="none" />
          <circle cx="140" cy="120" r="7" fill="var(--c-sky-ink)" />
        </svg>
        <div className="card world__info">
          <p className="card__eyebrow">Weltentdecker · Land 02</p>
          {italy ? (
            <>
              <h2 className="world__country">{italy.nameDe} <span aria-hidden="true">{italy.flagEmoji}</span></h2>
              <p>Hauptstadt: <strong>{italy.capital}</strong> · So sagt man Hallo: <strong>{italy.greeting.word}!</strong></p>
            </>
          ) : <p className="muted">Länderdaten werden geladen.</p>}
          <p className="notice notice--info" style={{ marginTop: 'var(--space-4)' }}>
            Die Weltreise ist vorbereitet, aber noch nicht spielbar. Gemeinsame Abenteuersterne kommen in der nächsten Ausbaustufe (Phase C),
            die Länderfreischaltung und Entdeckeraufgaben danach (Phase D).
          </p>
        </div>
      </div>
    </div>
  );
}

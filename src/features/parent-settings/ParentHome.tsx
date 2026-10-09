import { Link } from 'react-router-dom';

const TILES = [
  { to: '/eltern/familie', title: 'Familie', text: 'Namen, Geburtstage, Avatare, Farben, Altersstufen' },
  { to: '/eltern/kalender', title: 'Kalender', text: 'Termine, Serien, Ausnahmen, Ferien, Packlisten' },
  { to: '/eltern/routinen', title: 'Routinen', text: 'Morgen, Nachmittag, Abend: Aufgaben und Zuordnung' },
  { to: '/eltern/haushalt', title: 'Haushalt', text: 'Haushaltstage, Aufgaben verschieben oder aussetzen' },
  { to: '/eltern/zeiten', title: 'Uhrzeiten', text: 'Kindergarten, Tagesphasen, Schlafenszeiten, Uhr' },
  { to: '/eltern/timer', title: 'Timer', text: 'Timer-Vorlagen und Dauer' },
  { to: '/eltern/daten', title: 'Daten', text: 'Sicherung exportieren und wiederherstellen' },
  { to: '/eltern/pin', title: 'PIN', text: 'Eltern-PIN ändern' },
];

const LATER = [
  { title: 'Missionen und Sterne', text: 'Phase C' },
  { title: 'Mama-Zeit und Familienrat', text: 'Phase C' },
  { title: 'Sondermodus „Heute ist alles anders“', text: 'Phase C' },
  { title: 'Weltreise und Länder', text: 'Phase D' },
];

export function ParentHome() {
  return (
    <div className="parent-section">
      <div className="parent-tiles">
        {TILES.map((t) => (
          <Link key={t.to} to={t.to} className="card parent-tile">
            <span className="parent-tile__title">{t.title}</span>
            <span className="small muted">{t.text}</span>
          </Link>
        ))}
      </div>
      <h2 className="card__eyebrow" style={{ marginTop: 'var(--space-4)' }}>Folgt in den nächsten Ausbaustufen</h2>
      <div className="parent-tiles">
        {LATER.map((t) => (
          <div key={t.title} className="card card--sunk parent-tile parent-tile--later">
            <span className="parent-tile__title">{t.title}</span>
            <span className="small muted">{t.text}</span>
          </div>
        ))}
      </div>
      <p className="notice">
        Alle Daten liegen nur auf diesem iPad im Browser-Speicher. Löschen von Website-Daten, das Entfernen der App vom Home-Bildschirm
        oder ein Gerätewechsel können sie entfernen. Bitte regelmäßig unter „Daten“ eine Sicherung exportieren.
      </p>
    </div>
  );
}

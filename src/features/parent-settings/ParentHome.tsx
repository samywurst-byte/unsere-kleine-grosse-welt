import { Link } from 'react-router-dom';
import { useDeviceMeta, useMissionCompletions } from '../../hooks/useData';
import { backupIsDue } from '../../services/backup';

const TILES = [
  { to: '/eltern/familie', title: 'Familie', text: 'Namen, Geburtstage, Avatare, Farben, Altersstufen' },
  { to: '/eltern/lernen', title: 'Lesepfad', text: 'Buchstabenatlas, Beobachtungen, nächste Schritte je Kind' },
  { to: '/eltern/rechnen', title: 'Rechenpfad', text: 'Mengen, Plus und Minus, Einmaleins: Stufen und nächste Schritte je Kind' },
  { to: '/eltern/lernpaket', title: 'Lernpaket der Woche', text: 'Ein Thema für alle, A4-Arbeitsblätter je Kind zum Drucken' },
  { to: '/eltern/missionen', title: 'Zusatzmissionen und Sterne', text: 'Missionen bestätigen und pflegen, Familienglas, Grenzen' },
  { to: '/eltern/sondertag', title: 'Heute ist alles anders', text: 'Krank, Urlaub, Besuch: Aufgaben für einzelne Kinder ausblenden' },
  { to: '/eltern/kalender', title: 'Kalender', text: 'Termine, Serien, Ausnahmen, Ferien, Packlisten' },
  { to: '/eltern/routinen', title: 'Routinen', text: 'Morgen, Nachmittag, Abend: Aufgaben und Zuordnung' },
  { to: '/eltern/haushalt', title: 'Haushalt', text: 'Haushaltstage, Aufgaben verschieben oder aussetzen' },
  { to: '/eltern/zeiten', title: 'Uhrzeiten', text: 'Kindergarten, Tagesphasen, Schlafenszeiten, Uhr' },
  { to: '/eltern/timer', title: 'Timer', text: 'Timer-Vorlagen und Dauer' },
  { to: '/eltern/daten', title: 'Daten', text: 'Sicherung exportieren und wiederherstellen' },
  { to: '/eltern/pin', title: 'PIN', text: 'Eltern-PIN ändern, Notfallcode für eine vergessene PIN' },
];

const LATER = [
  { title: 'Essensplan und Einkaufsliste', text: 'Nach der Entscheidung, wie ihr vom Handy auf die Daten kommt' },
  { title: 'Entdeckerwelt und Projekte', text: 'Projektwerkstatt, Bibliothek, Zeitstrahl' },
  { title: 'Geldwelt und Reisekasse', text: 'Taschengeld, Sparziele, gemeinsame Reisekasse' },
  { title: 'Familienarchiv', text: 'Jahresrückblick aus Erinnerungen und Lernstand' },
];

export function ParentHome() {
  const meta = useDeviceMeta();
  const completions = useMissionCompletions();
  const waiting = completions?.filter((c) => c.status === 'pending').length ?? 0;
  return (
    <div className="parent-section">
      {meta && backupIsDue(meta.lastBackupAt) && (
        <p className="notice">
          {meta.lastBackupAt ? 'Die letzte Sicherung ist über eine Woche her.' : 'Von diesem iPad gibt es noch keine Sicherung.'}{' '}
          <Link to="/eltern/daten">Jetzt sichern</Link>
        </p>
      )}
      <div className="parent-tiles">
        {TILES.map((t) => (
          <Link key={t.to} to={t.to} className="card parent-tile">
            <span className="parent-tile__title">{t.title}{t.to === '/eltern/missionen' && waiting > 0 && <span className="chip">{waiting} warten</span>}</span>
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

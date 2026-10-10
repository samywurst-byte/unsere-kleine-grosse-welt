import { BookOpen, CalendarDays, Earth, Heart, LayoutGrid, Lightbulb, Lock, Sun } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import './AppShell.css';

const NAV = [
  { to: '/', label: 'Heute', icon: Sun, end: true },
  { to: '/aufgaben', label: 'Meine Aufgaben', icon: LayoutGrid },
  { to: '/lernen', label: 'Buchstaben', icon: BookOpen },
  { to: '/woche', label: 'Unsere Woche', icon: CalendarDays },
  { to: '/projekte', label: 'Projekte', icon: Lightbulb },
  { to: '/weltreise', label: 'Weltreise', icon: Earth },
  { to: '/familienzeit', label: 'Familienzeit', icon: Heart },
];

export function AppShell() {
  const { pathname } = useLocation();
  return (
    <div className="shell">
      <nav className="shell__nav" aria-label="Hauptnavigation">
        <div className="shell__brand" aria-hidden="true">
          <svg viewBox="0 0 48 48" width="44" height="44">
            <circle cx="24" cy="24" r="22" fill="var(--c-sky-soft)" />
            <path d="M6 28 Q16 20 24 26 T42 24 L42 30 Q32 42 24 44 Q10 40 6 28Z" fill="var(--sage)" />
            <circle cx="33" cy="15" r="5" fill="var(--gold)" />
          </svg>
        </div>
        <ul className="shell__links">
          {NAV.map(({ to, label, icon: Ico, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={({ isActive }) => (isActive ? 'nav-item nav-item--active' : 'nav-item')}>
                <Ico size={30} strokeWidth={2} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <NavLink to="/eltern" className={({ isActive }) => (isActive ? 'nav-item nav-item--parent nav-item--active' : 'nav-item nav-item--parent')}>
          <Lock size={22} aria-hidden="true" />
          <span>Eltern</span>
        </NavLink>
      </nav>
      <main className="shell__main">
        {/* Nach einem Fehler bringt der Wechsel in einen anderen Bereich die Seite zurück.
            Schlüssel ist nur der Bereich, damit z. B. der Elternbereich beim Tab-Wechsel nicht neu startet (und sich sperrt). */}
        <ErrorBoundary key={pathname.split('/')[1] ?? ''} scope="page">
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}

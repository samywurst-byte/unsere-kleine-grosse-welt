import { NavLink, useLocation } from 'react-router-dom';
import './library.css';

const EXPLORER_PATHS = ['/entdecken/sonntage', '/entdecken/handbuch', '/entdecken/frageglas'];

/** Umschalter zwischen Entdeckerbibliothek, Entdeckersonntagen und Projektwerkstatt. */
export function ExploreTabs() {
  const { pathname } = useLocation();
  const sundays = EXPLORER_PATHS.some((p) => pathname.startsWith(p));
  const cls = (on: boolean) => `seg__item lib-tab ${on ? 'is-on' : ''}`;
  return (
    <nav className="seg lib-tabs" aria-label="Entdecken">
      <NavLink to="/entdecken" end className={({ isActive }) => cls(isActive)}>📚 Bibliothek</NavLink>
      <NavLink to="/entdecken/sonntage" className={() => cls(sundays)}>🗓️ Entdeckersonntage</NavLink>
      <NavLink to="/projekte" className={({ isActive }) => cls(isActive)}>🛠️ Projektwerkstatt</NavLink>
    </nav>
  );
}

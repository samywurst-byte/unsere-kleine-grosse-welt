import { NavLink } from 'react-router-dom';
import './library.css';

/** Umschalter zwischen Entdeckerbibliothek und Projektwerkstatt. */
export function ExploreTabs() {
  const cls = ({ isActive }: { isActive: boolean }) => `seg__item lib-tab ${isActive ? 'is-on' : ''}`;
  return (
    <nav className="seg lib-tabs" aria-label="Entdecken">
      <NavLink to="/entdecken" end className={cls}>📚 Bibliothek</NavLink>
      <NavLink to="/projekte" className={cls}>🛠️ Projektwerkstatt</NavLink>
    </nav>
  );
}

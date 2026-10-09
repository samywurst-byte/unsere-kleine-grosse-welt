import { Link } from 'react-router-dom';

export function WorldTeaser() {
  return (
    <Link to="/weltreise" className="card dash__world">
      <p className="card__eyebrow">Unsere Weltreise</p>
      <p className="dash__world-title">Das erste Land wartet: Italien <span aria-hidden="true">🇮🇹</span></p>
      <p className="small muted">Die Sternereise startet mit der nächsten Ausbaustufe.</p>
    </Link>
  );
}

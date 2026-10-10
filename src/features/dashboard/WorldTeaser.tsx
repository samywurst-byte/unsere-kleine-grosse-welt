import { Link } from 'react-router-dom';
import { useSettings, useStarTransactions, useWorld } from '../../hooks/useData';
import { nextCountry, starBalance } from '../../services/stars';

export function WorldTeaser() {
  const world = useWorld();
  const stars = useStarTransactions();
  const settings = useSettings();
  if (!world || !stars || !settings) return null;
  const next = nextCountry(world.countries, world.unlocks);
  const balance = starBalance(stars);
  const cost = settings.starsPerCountry;
  return (
    <Link to="/weltreise" className="card dash__world">
      <p className="card__eyebrow">Unsere Weltreise</p>
      {next
        ? <p className="dash__world-title">Nächstes Land: {next.nameDe} <span aria-hidden="true">{next.flagEmoji}</span></p>
        : <p className="dash__world-title">Alle Länder besucht!</p>}
      <p className="small muted">{next ? (balance >= cost ? 'Das Sternenglas ist voll genug!' : `${balance} von ${cost} Sternen im Glas`) : `${world.unlocks.length} Stempel im Pass`}</p>
    </Link>
  );
}

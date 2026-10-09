import { ChevronLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTimerPresets } from '../../hooks/useData';
import { VisualTimer } from './VisualTimer';

export function TimerPage() {
  const { presetId } = useParams();
  const presets = useTimerPresets();
  const navigate = useNavigate();
  const preset = presets?.find((p) => p.id === presetId);
  if (!presets) return null;
  if (!preset) return <p className="empty">Diesen Timer gibt es nicht mehr. <Link to="/">Zur Startseite</Link></p>;

  return (
    <div>
      <header className="page-head">
        <button type="button" className="btn btn--icon btn--ghost" onClick={() => navigate(-1)} aria-label="Zurück"><ChevronLeft /></button>
        <h1>Timer</h1>
        <div className="spacer" />
        <div className="seg" role="group" aria-label="Timer wählen">
          {presets.map((p) => (
            <Link key={p.id} to={`/timer/${p.id}`} replace className="seg__item" aria-pressed={p.id === preset.id} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
              {p.label}
            </Link>
          ))}
        </div>
      </header>
      <div className="card" style={{ display: 'grid', placeItems: 'center', padding: 'var(--space-7) var(--space-5)' }}>
        <VisualTimer preset={preset} size={380} />
      </div>
    </div>
  );
}

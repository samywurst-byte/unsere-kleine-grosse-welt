import { Check, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import './TaskCard.css';

/** Große Bildkarte zum selbst Abhaken. Erledigt-Zustand ist über Häkchen und Text erkennbar, nicht nur über Farbe. */
export function TaskCard({ title, icon, done, onToggle, showLabel = true, size = 'm', badge, timerPresetId, helpNote }: {
  title: string;
  icon: string;
  done: boolean;
  onToggle: () => void;
  showLabel?: boolean;
  size?: 's' | 'm' | 'l' | 'xl';
  badge?: string;
  timerPresetId?: string;
  helpNote?: string;
}) {
  return (
    <div className={`task task--${size} ${done ? 'task--done' : ''}`}>
      <button type="button" className="task__main" onClick={onToggle} aria-pressed={done} aria-label={`${title}${done ? ', geschafft' : ''}`}>
        {badge && <span className="task__badge">{badge}</span>}
        <span className="task__icon"><Icon name={icon} size={size === 'xl' ? 120 : size === 'l' ? 76 : size === 's' ? 34 : 56} strokeWidth={1.6} /></span>
        {showLabel && <span className="task__title">{title}</span>}
        {helpNote && showLabel && <span className="task__help">{helpNote}</span>}
        <span className="task__check" aria-hidden="true">{done && <Check size={size === 's' ? 20 : 30} strokeWidth={3} />}</span>
        {done && <span className="task__done-label">Geschafft</span>}
      </button>
      {timerPresetId && !done && (
        <Link to={`/timer/${timerPresetId}`} className="task__timer btn btn--small btn--sage">
          <Timer size={18} aria-hidden="true" /> Timer
        </Link>
      )}
    </div>
  );
}

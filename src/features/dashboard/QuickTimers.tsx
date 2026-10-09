import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { db } from '../../database/db';
import { useTimerPresets } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { formatClock, isGoalReached, isStale, remainingMs } from '../../services/timer';

export function QuickTimers() {
  const presets = useTimerPresets();
  const states = useLiveQuery(() => db.timers.toArray(), []);
  const now = useNow(1000).getTime();
  if (!presets) return null;
  return (
    <div className="card dash__timers">
      <p className="card__eyebrow">Timer</p>
      <div className="dash__timer-grid">
        {presets.map((p) => {
          const st = states?.find((s) => s.id === p.id && s.status !== 'idle' && !isStale(s, now));
          const status = st ? (isGoalReached(st, now) ? 'geschafft' : st.status === 'paused' ? 'Pause' : formatClock(remainingMs(st, now))) : `${p.minutes} Min.`;
          return (
            <Link key={p.id} to={`/timer/${p.id}`} className={`timer-tile tone-${p.color} ${st ? 'timer-tile--active' : ''}`}>
              <Icon name={p.icon} size={26} />
              <span className="timer-tile__label">{p.label}</span>
              <span className="timer-tile__status">{status}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

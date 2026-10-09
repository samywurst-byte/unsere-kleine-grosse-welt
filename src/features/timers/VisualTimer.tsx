import { Minus, Pause, Play, Plus, RotateCcw } from 'lucide-react';
import { Icon } from '../../components/Icon';
import { elapsedMs, formatClock, isGoalReached, overtimeMs, remainingMs } from '../../services/timer';
import type { TimerPreset } from '../../types';
import { useTimer } from './useTimer';
import './VisualTimer.css';

/** Sektor-Pfad für die verbleibende Zeit (wie eine schrumpfende Tortenscheibe). */
function sectorPath(fraction: number, r: number, cx = 100, cy = 100): string {
  if (fraction <= 0) return '';
  if (fraction >= 1) return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  const angle = fraction * 2 * Math.PI;
  const x = cx + r * Math.sin(angle);
  const y = cy - r * Math.cos(angle);
  const large = fraction > 0.5 ? 1 : 0;
  // Die Restzeit wird gegen den Uhrzeigersinn von 12 Uhr aus gezeichnet und schrumpft im Uhrzeigersinn.
  return `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${large} 0 ${cx - (x - cx)} ${y} Z`;
}

export function VisualTimer({ preset, size = 320, compact = false }: { preset: TimerPreset; size?: number; compact?: boolean }) {
  const { state, now, start, pause, reset, setMinutes } = useTimer(preset);
  if (!state) return null;

  const remaining = remainingMs(state, now);
  const fraction = state.durationMs > 0 ? remaining / state.durationMs : 0;
  const goal = isGoalReached(state, now);
  const minutes = Math.round(state.durationMs / 60_000);
  const isMinimum = state.mode === 'minimum';

  let headline: string;
  if (state.status === 'idle') headline = `${minutes} Minuten`;
  else if (goal && isMinimum) headline = 'Geschafft!';
  else if (goal) headline = 'Die Zeit ist um';
  else headline = formatClock(remaining);

  return (
    <div className={`vtimer tone-${preset.color} ${goal ? 'vtimer--goal' : ''} ${compact ? 'vtimer--compact' : ''}`}>
      <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={`${preset.label}: ${headline}`}>
        <circle cx={100} cy={100} r={96} className="vtimer__rim" />
        <circle cx={100} cy={100} r={86} className="vtimer__face" />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1={100} y1={6} x2={100} y2={14} className="vtimer__tick" transform={`rotate(${i * 30} 100 100)`} />
        ))}
        {!goal && <path d={sectorPath(state.status === 'idle' ? 1 : fraction, 84)} className="vtimer__sector" />}
        {goal && <circle cx={100} cy={100} r={84} className="vtimer__goal" />}
        <circle cx={100} cy={100} r={44} className="vtimer__center" />
        <foreignObject x={60} y={60} width={80} height={80}>
          <div className="vtimer__icon"><Icon name={preset.icon} size={44} strokeWidth={1.8} /></div>
        </foreignObject>
      </svg>

      <div className="vtimer__info">
        <p className="vtimer__label">{preset.label}</p>
        <p className="vtimer__headline" aria-live="polite">{headline}</p>
        {goal && isMinimum && (
          <p className="vtimer__note">
            Das war das Minimum. Ihr dürft gern weitermachen.
            {overtimeMs(state, now) >= 60_000 && <> Schon {Math.floor(elapsedMs(state, now) / 60_000)} Minuten.</>}
          </p>
        )}
        {state.status === 'paused' && <p className="vtimer__note">Pausiert</p>}

        <div className="vtimer__controls">
          {state.status === 'idle' && (
            <>
              <button type="button" className="btn btn--icon" onClick={() => setMinutes(minutes - 1)} aria-label="Eine Minute weniger" disabled={minutes <= 1}><Minus /></button>
              <button type="button" className="btn btn--icon" onClick={() => setMinutes(minutes + 1)} aria-label="Eine Minute mehr"><Plus /></button>
              <button type="button" className="btn btn--primary btn--large" onClick={start}><Play size={22} /> Start</button>
            </>
          )}
          {state.status === 'running' && (
            <button type="button" className="btn btn--large" onClick={pause}><Pause size={22} /> Pause</button>
          )}
          {state.status === 'paused' && (
            <button type="button" className="btn btn--primary btn--large" onClick={start}><Play size={22} /> Weiter</button>
          )}
          {state.status !== 'idle' && (
            <button type="button" className="btn btn--large btn--ghost" onClick={reset}><RotateCcw size={20} /> {goal ? 'Fertig' : 'Zurücksetzen'}</button>
          )}
        </div>
      </div>
    </div>
  );
}

import type { TimerPreset, TimerState } from '../types';

/**
 * Timerlogik auf Basis echter Zeitstempel. Es wird nie heruntergezählt;
 * die Restzeit wird bei jedem Anzeigen aus Startzeit und bereits abgelaufener Zeit berechnet.
 * Dadurch stimmt sie auch nach Sperren, Hintergrund oder Neustart des iPads.
 */

export function timerFromPreset(preset: TimerPreset): TimerState {
  return {
    id: preset.id, label: preset.label, durationMs: preset.minutes * 60_000,
    mode: preset.mode, status: 'idle', accumulatedMs: 0,
  };
}

export function elapsedMs(t: TimerState, now: number): number {
  const running = t.status === 'running' && t.startedAt !== undefined ? Math.max(0, now - t.startedAt) : 0;
  return t.accumulatedMs + running;
}

export function remainingMs(t: TimerState, now: number): number {
  return Math.max(0, t.durationMs - elapsedMs(t, now));
}

/** Bei "minimum" läuft die Zeit nach dem Ziel ruhig weiter. */
export function overtimeMs(t: TimerState, now: number): number {
  return Math.max(0, elapsedMs(t, now) - t.durationMs);
}

export function isGoalReached(t: TimerState, now: number): boolean {
  return t.status !== 'idle' && elapsedMs(t, now) >= t.durationMs;
}

export function progress(t: TimerState, now: number): number {
  if (t.durationMs <= 0) return 1;
  return Math.min(1, elapsedMs(t, now) / t.durationMs);
}

export function startTimer(t: TimerState, now: number): TimerState {
  if (t.status === 'running') return t;
  return { ...t, status: 'running', startedAt: now, lastChangedAt: now };
}

export function pauseTimer(t: TimerState, now: number): TimerState {
  if (t.status !== 'running') return t;
  return { ...t, status: 'paused', accumulatedMs: elapsedMs(t, now), startedAt: undefined, lastChangedAt: now };
}

export function resetTimer(t: TimerState): TimerState {
  return { ...t, status: 'idle', accumulatedMs: 0, startedAt: undefined };
}

/** Ein Timer, der zuletzt an einem früheren Tag bedient wurde, beginnt heute frisch. */
export function isStale(t: TimerState, now: number): boolean {
  if (t.status === 'idle') return false;
  const changed = t.lastChangedAt ?? t.startedAt;
  if (changed === undefined) return true;
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  return changed < midnight.getTime();
}

/** Anzuzeigender Zustand: gespeichert, sofern nicht veraltet. */
export function effectiveTimer(stored: TimerState | undefined, preset: TimerPreset, now: number): TimerState {
  if (!stored || isStale(stored, now)) return timerFromPreset(preset);
  return stored;
}

export function setTimerDuration(t: TimerState, minutes: number): TimerState {
  const clamped = Math.min(180, Math.max(1, Math.round(minutes)));
  return { ...t, durationMs: clamped * 60_000 };
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

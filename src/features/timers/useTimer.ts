import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import { db } from '../../database/db';
import { useNow } from '../../hooks/useNow';
import { effectiveTimer, pauseTimer, resetTimer, setTimerDuration, startTimer } from '../../services/timer';
import { saveTimer } from '../../services/timerStore';
import type { TimerPreset, TimerState } from '../../types';

/** Persistierter Timer: übersteht Sperren, Hintergrund und Neustart. */
export function useTimer(preset: TimerPreset | undefined) {
  const stored = useLiveQuery(() => (preset ? db.timers.get(preset.id) : undefined), [preset?.id]);
  const now = useNow(stored?.status === 'running' ? 250 : 5000).getTime();
  const state: TimerState | undefined = preset ? effectiveTimer(stored, preset, now) : undefined;

  const update = useCallback(async (fn: (t: TimerState) => TimerState) => {
    if (!preset) return;
    const current = effectiveTimer(await db.timers.get(preset.id), preset, Date.now());
    await saveTimer(db, fn(current));
  }, [preset]);

  return {
    state,
    now,
    start: () => update((t) => startTimer(t, Date.now())),
    pause: () => update((t) => pauseTimer(t, Date.now())),
    reset: () => update((t) => resetTimer({ ...t, durationMs: preset!.minutes * 60_000, label: preset!.label, mode: preset!.mode })),
    setMinutes: (m: number) => update((t) => setTimerDuration(t, m)),
  };
}

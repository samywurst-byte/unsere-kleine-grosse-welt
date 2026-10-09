import type { FamilyDatabase } from '../database/db';
import type { TimerPreset, TimerState } from '../types';
import { timerFromPreset } from './timer';

/** Timerzustand liegt in IndexedDB und überlebt damit Sperren und Neustarts. */
export async function loadTimer(db: FamilyDatabase, preset: TimerPreset): Promise<TimerState> {
  return (await db.timers.get(preset.id)) ?? timerFromPreset(preset);
}

export async function saveTimer(db: FamilyDatabase, state: TimerState): Promise<void> {
  await db.timers.put(state);
}

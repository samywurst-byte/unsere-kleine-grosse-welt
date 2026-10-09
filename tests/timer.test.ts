import { describe, expect, it } from 'vitest';
import {
  elapsedMs, isGoalReached, overtimeMs, pauseTimer, remainingMs, resetTimer, startTimer, timerFromPreset,
} from '../src/services/timer';
import type { TimerPreset } from '../src/types';

const preset: TimerPreset = { id: 't', label: 'Draußen', minutes: 15, icon: 'trees', color: 'sage', mode: 'minimum', order: 0 };
const MIN = 60_000;

describe('Timer', () => {
  it('berechnet die Restzeit aus Zeitstempeln, auch nach langer Unterbrechung', () => {
    const t0 = 1_000_000;
    const t = startTimer(timerFromPreset(preset), t0);
    // App lag 6 Minuten im Hintergrund, kein einziger Tick dazwischen
    expect(remainingMs(t, t0 + 6 * MIN)).toBe(9 * MIN);
  });

  it('pausiert, setzt fort und setzt zurück', () => {
    const t0 = 0;
    let t = startTimer(timerFromPreset(preset), t0);
    t = pauseTimer(t, t0 + 4 * MIN);
    expect(remainingMs(t, t0 + 60 * MIN)).toBe(11 * MIN); // Pause friert ein
    t = startTimer(t, t0 + 60 * MIN);
    expect(remainingMs(t, t0 + 62 * MIN)).toBe(9 * MIN);
    t = resetTimer(t);
    expect(elapsedMs(t, t0 + 99 * MIN)).toBe(0);
    expect(t.status).toBe('idle');
  });

  it('ein Mindest-Timer läuft nach dem Ziel ruhig weiter', () => {
    const t = startTimer(timerFromPreset(preset), 0);
    expect(isGoalReached(t, 20 * MIN)).toBe(true);
    expect(overtimeMs(t, 20 * MIN)).toBe(5 * MIN);
    expect(t.status).toBe('running');
  });

  it('doppeltes Starten verändert den Startzeitpunkt nicht', () => {
    const t = startTimer(timerFromPreset(preset), 0);
    expect(startTimer(t, 5 * MIN)).toBe(t);
  });
});

describe('Timer über Tagesgrenzen', () => {
  it('ein gestern gestarteter Timer gilt heute als zurückgesetzt', async () => {
    const { effectiveTimer, isStale } = await import('../src/services/timer');
    const yesterday = new Date(2026, 9, 6, 15, 0).getTime();
    const today = new Date(2026, 9, 7, 10, 0).getTime();
    const t = startTimer(timerFromPreset(preset), yesterday);
    expect(isStale(t, yesterday + 60 * MIN)).toBe(false);
    expect(isStale(t, today)).toBe(true);
    expect(effectiveTimer(t, preset, today).status).toBe('idle');
  });
});

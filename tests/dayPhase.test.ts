import { describe, expect, it } from 'vitest';
import { getDayPhase } from '../src/services/dayPhase';
import { buildSeed } from '../src/data/seed';

const { settings } = buildSeed('2026-10-05');
const at = (h: number, m: number, day = 5) => new Date(2026, 9, day, h, m);

describe('Tagesphasen', () => {
  it('folgen dem Kindergartentag', () => {
    expect(getDayPhase(at(7, 15), '2026-10-05', settings).phase).toBe('morning');
    expect(getDayPhase(at(10, 0), '2026-10-05', settings).phase).toBe('kindergarten');
    expect(getDayPhase(at(13, 0), '2026-10-05', settings).phase).toBe('afternoon');
    expect(getDayPhase(at(18, 0), '2026-10-05', settings).phase).toBe('evening');
    expect(getDayPhase(at(19, 10), '2026-10-05', settings).phase).toBe('night');
  });

  it('freitags gilt die spätere Schlafenszeit', () => {
    const withFriday = { ...settings, bedtimeOverrides: { 5: '19:30' } };
    expect(getDayPhase(at(19, 10, 9), '2026-10-09', withFriday).phase).toBe('evening');
  });

  it('am Wochenende und in den Ferien gibt es keine Kindergartenphase', () => {
    expect(getDayPhase(at(10, 0, 10), '2026-10-10', settings).phase).toBe('afternoon');
    expect(getDayPhase(at(10, 0), '2026-10-05', settings, true).kindergartenDay).toBe(false);
  });
});

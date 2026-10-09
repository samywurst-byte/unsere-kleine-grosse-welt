import type { AppSettings, DateKey, RoutinePhase, TimeOfDay } from '../types';
import { minutesOfDay, nowMinutes, weekdayOf } from '../utils/dates';

export type DayPhase = 'night' | 'morning' | 'kindergarten' | 'afternoon' | 'evening';

export interface DayPhaseInfo {
  phase: DayPhase;
  /** Welche Routinegruppe gerade im Mittelpunkt steht. */
  routinePhase: RoutinePhase;
  greeting: string;
  title: string;
  bedtime: TimeOfDay;
  kindergartenDay: boolean;
}

export function bedtimeFor(date: DateKey, settings: AppSettings): TimeOfDay {
  return settings.bedtimeOverrides?.[weekdayOf(date)] ?? settings.bedtime;
}

export function isKindergartenDay(date: DateKey, settings: AppSettings, isHoliday: boolean): boolean {
  return !isHoliday && settings.kindergartenDays.includes(weekdayOf(date));
}

/**
 * Tagesphasen sind Orientierung, keine Sperre: sie bestimmen nur, was hervorgehoben wird.
 */
export function getDayPhase(now: Date, date: DateKey, settings: AppSettings, isHoliday = false): DayPhaseInfo {
  const m = nowMinutes(now);
  const kg = isKindergartenDay(date, settings, isHoliday);
  const bedtime = bedtimeFor(date, settings);
  const t = (x: TimeOfDay) => minutesOfDay(x);

  let phase: DayPhase;
  if (m < t(settings.morningStart)) phase = 'night';
  else if (kg && m < t(settings.kindergartenDeparture)) phase = 'morning';
  else if (kg && m < t(settings.kindergartenReturn)) phase = 'kindergarten';
  else if (!kg && m < t(settings.freeDayMorningEnd)) phase = 'morning';
  else if (m < t(settings.eveningStart)) phase = 'afternoon';
  else if (m < t(bedtime)) phase = 'evening';
  else phase = 'night';

  const map: Record<DayPhase, Omit<DayPhaseInfo, 'phase' | 'bedtime' | 'kindergartenDay'>> = {
    night: { routinePhase: m < t(settings.morningStart) ? 'morning' : 'evening', greeting: 'Gute Nacht', title: 'Schlafenszeit' },
    morning: { routinePhase: 'morning', greeting: 'Guten Morgen', title: 'Unser Morgen' },
    kindergarten: { routinePhase: 'afternoon', greeting: 'Hallo', title: 'Kindergartenzeit' },
    afternoon: { routinePhase: 'afternoon', greeting: 'Hallo', title: kg ? 'Unser Nachmittag' : 'Unser Tag' },
    evening: { routinePhase: 'evening', greeting: 'Guten Abend', title: 'Unser Abend' },
  };
  return { phase, bedtime, kindergartenDay: kg, ...map[phase] };
}

export const ROUTINE_PHASE_LABEL: Record<RoutinePhase, string> = {
  morning: 'Morgen',
  afternoon: 'Nachmittag',
  evening: 'Abend',
};

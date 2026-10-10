import type { RoutinePhase, Weekday } from '../types';

/** Vorlagen für Schulkinder: Schulweg, Ranzen packen, Hausaufgaben. Werden pro Kind angelegt und sind danach frei änderbar. */
export interface SchoolRoutineTemplate {
  id: string;
  title: string;
  icon: string;
  phase: RoutinePhase;
  weekdays: Weekday[];
  /** Nur an Schultagen (nicht in Ferien, nicht an Feiertagen). */
  schoolDaysOnly: boolean;
}

const SCHOOL_DAYS: Weekday[] = [1, 2, 3, 4, 5];
const EVENING_BEFORE_SCHOOL: Weekday[] = [0, 1, 2, 3, 4];

export const SCHOOL_ROUTINES: SchoolRoutineTemplate[] = [
  { id: 'lunchbox', title: 'Brotdose und Trinkflasche einpacken', icon: 'apple', phase: 'morning', weekdays: SCHOOL_DAYS, schoolDaysOnly: true },
  { id: 'schoolbag-on', title: 'Ranzen auf, Schuhe an', icon: 'backpack', phase: 'morning', weekdays: SCHOOL_DAYS, schoolDaysOnly: true },
  { id: 'way', title: 'Schulweg', icon: 'footprints', phase: 'morning', weekdays: SCHOOL_DAYS, schoolDaysOnly: true },
  { id: 'homework', title: 'Hausaufgaben', icon: 'book', phase: 'afternoon', weekdays: SCHOOL_DAYS, schoolDaysOnly: true },
  { id: 'unpack', title: 'Ranzen ausräumen, Zettel für Mama', icon: 'backpack', phase: 'afternoon', weekdays: SCHOOL_DAYS, schoolDaysOnly: true },
  { id: 'pack', title: 'Ranzen packen für morgen', icon: 'backpack', phase: 'evening', weekdays: EVENING_BEFORE_SCHOOL, schoolDaysOnly: false },
  { id: 'clothes', title: 'Kleidung für morgen rauslegen', icon: 'shirt', phase: 'evening', weekdays: EVENING_BEFORE_SCHOOL, schoolDaysOnly: false },
];

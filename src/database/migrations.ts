import type { AppSettings, RoutineDefinition, Weekday } from '../types';

/**
 * Ergänzungen für Daten aus älteren Versionen. Wird sowohl beim Datenbank-Upgrade
 * als auch beim Einspielen älterer Sicherungen verwendet, damit beide Wege gleich enden.
 */

export const DEFAULT_HOME_ARRIVAL_LABEL = 'Papa kommt nach Hause';
export const DEFAULT_AFTER_KINDERGARTEN_NOTE = 'Mittagessen und mindestens 15 Minuten draußen, flexibel';
export const DEFAULT_WEEK_BANNER = 'Jeden Tag mindestens 15 Minuten draußen, bei normalem Wetter auch bei Regen.';

/**
 * Fehlende Einstellungen ergänzen, vorhandene Werte nie überschreiben.
 * `fromVersion < 3`: Bis Version 2 war "donnerstags kommt Papa nicht nach Hause" fest im Code.
 * Dieses Verhalten bleibt für bestehende Daten erhalten, ist ab jetzt aber eine Einstellung.
 */
export function upgradeSettings(s: Partial<AppSettings>, fromVersion: number): void {
  if (s.maxStarsPerChildPerDay === undefined) s.maxStarsPerChildPerDay = 5;
  if (s.starsPerCountry === undefined) s.starsPerCountry = 30;
  if (s.homeArrivalLabel === undefined) s.homeArrivalLabel = DEFAULT_HOME_ARRIVAL_LABEL;
  if (s.homeArrivalDays === undefined) {
    const kg = (s.kindergartenDays ?? [1, 2, 3, 4, 5]) as Weekday[];
    s.homeArrivalDays = fromVersion < 3 ? kg.filter((d) => d !== 4) : [...kg];
  }
  if (s.afterKindergartenNote === undefined) s.afterKindergartenNote = DEFAULT_AFTER_KINDERGARTEN_NOTE;
  if (s.weekBanner === undefined) s.weekBanner = DEFAULT_WEEK_BANNER;
}

/**
 * Bis Version 2 gab es kein Kennzeichen für Kindergarten-Routinen. Als solche gelten
 * Morgenroutinen, die genau an den Kindergartentagen stattfinden.
 */
export function upgradeRoutine(r: Partial<RoutineDefinition>, kindergartenDays: Weekday[]): void {
  if (r.kindergartenOnly !== undefined) return;
  const days = [...(r.weekdays ?? [])].sort().join(',');
  const kg = [...kindergartenDays].sort().join(',');
  r.kindergartenOnly = r.phase === 'morning' && days.length > 0 && days === kg;
}

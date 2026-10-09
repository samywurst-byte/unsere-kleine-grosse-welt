/**
 * Datenbankschema mit Versionierung.
 * Neue Versionen werden NUR angehängt, bestehende nie verändert.
 * Jede Version kann eine upgrade-Funktion haben, die vorhandene Daten erhält und ergänzt.
 */
export const DB_NAME = 'unsere-kleine-grosse-welt';

export const SCHEMA_V1 = {
  members: 'id, role, sortOrder',
  routineDefinitions: 'id, phase, order',
  routineOccurrences: 'id, date, childId, definitionId, [childId+date]',
  choreDefinitions: 'id, childId',
  choreOccurrences: 'id, date, scheduledDate, childId, definitionId',
  events: 'id, category, startDate',
  eventExceptions: 'id, eventId, originalDate, newDate, &[eventId+originalDate]',
  timerPresets: 'id, order',
  timers: 'id',
  settings: 'id',
  parentAuth: 'id',
} as const;

/** Version 2: Tabellen für Phase C (Missionen, Sterne, Familienzeit) und Phase D (Weltreise). */
export const SCHEMA_V2 = {
  missions: 'id',
  missionCompletions: 'id, date, childId, missionId, status',
  starTransactions: 'id, &sourceId, kind, createdAt',
  familyTimeSessions: 'id, date, childId',
  familyCouncilNotes: 'id, date',
  specialDays: 'date',
  countries: 'id, order',
  countryUnlocks: 'countryId',
  learningActivities: 'id, countryId',
  learningProgress: 'id, childId, activityId',
  passportStamps: 'id, childId, countryId',
} as const;

export const CURRENT_SCHEMA_VERSION = 2;

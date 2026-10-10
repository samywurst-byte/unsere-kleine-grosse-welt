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

/** Version 3: Gerätedaten (letzte Sicherung) und automatische Sicherheitskopien. */
export const SCHEMA_V3 = {
  deviceMeta: 'id',
  safetyCopies: 'id, createdAt',
} as const;

/** Version 4: Lesepfad mit Elternbeobachtungen und Freigaben. */
export const SCHEMA_V4 = {
  learningObservations: 'id, childId, goalId, date, [childId+goalId]',
  learningReleases: 'id, childId, goalId',
} as const;

/** Version 5: Lernpakete der Woche (Arbeitsblätter). */
export const SCHEMA_V5 = {
  learningPacks: 'id, weekStart',
} as const;

/** Version 6: Familienzeit (Wochenendabenteuer, Erinnerungen). */
export const SCHEMA_V6 = {
  weekendAdventures: 'id, weekend, status',
  familyMemories: 'id, date',
} as const;

/** Version 7: Jahreszeitenrituale; Weltreise bekommt alle Länder. */
export const SCHEMA_V7 = {
  rituals: 'id, ritualId, date, status',
  ritualFavorites: 'id',
} as const;

/** Version 8: Essensplan, Gerichte und Einkaufsliste. */
export const SCHEMA_V8 = {
  recipes: 'id, title',
  mealPlans: 'id',
  shoppingItems: 'id, section, done, createdAt',
} as const;

/** Version 9: Suppenküche und Gefriervorrat. */
export const SCHEMA_V9 = {
  cookSessions: 'id, date, status',
  freezerItems: 'id, frozenAt',
} as const;

/** Version 10: Projektwerkstatt. */
export const SCHEMA_V10 = {
  projects: 'id, status, ideaId',
} as const;

/** Version 11: Entdeckerbibliothek (erledigte Forscheraufträge). */
export const SCHEMA_V11 = {
  discoveries: 'id, topicId',
} as const;

export const CURRENT_SCHEMA_VERSION = 11;

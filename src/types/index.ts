/**
 * Zentrales Datenmodell.
 *
 * Konventionen:
 * - Datum ohne Uhrzeit immer als lokaler DateKey "yyyy-MM-dd".
 * - Uhrzeiten immer als lokale Wanduhrzeit "HH:mm".
 * - Wochentage nach JavaScript-Konvention: 0 = Sonntag ... 6 = Samstag.
 * Dadurch bleiben wiederkehrende Termine über Sommerzeit und Zeitzonen stabil.
 */

export type DateKey = string;
export type TimeOfDay = string;
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type Id = string;

// ---------------------------------------------------------------- Familie

export type AvatarKey = 'fox' | 'rabbit' | 'hedgehog' | 'flower' | 'bear' | 'owl' | 'parent-a' | 'parent-b';
export type ColorKey = 'sky' | 'sage' | 'rose' | 'terracotta' | 'gold' | 'lavender';

/** Altersstufe steuert, wie viel die Oberfläche gleichzeitig zeigt. */
export type AgeStage = 'small' | 'medium' | 'large';

export interface FamilyMember {
  id: Id;
  role: 'parent' | 'child';
  name: string;
  /** Optional: unbekannte Geburtstage werden nicht erfunden. */
  birthDate?: DateKey;
  color: ColorKey;
  avatar: AvatarKey;
  sortOrder: number;
  active: boolean;
}

export interface ChildProfile extends FamilyMember {
  role: 'child';
  ageStage: AgeStage;
  /** Wie viele offene Aufgabenkarten gleichzeitig sichtbar sind. */
  maxVisibleTasks: number;
  /** Erledigen wird als "mit Hilfe" gespeichert und bestätigt. */
  needsHelp: boolean;
  /** Kurze Texte unter den Bildkarten anzeigen. */
  showLabels: boolean;
  /** Geplanter Schulbeginn. Grundlage für den späteren Lesepfad (Start ein Jahr vorher). */
  schoolEntryDate?: DateKey;
}

export type Member = FamilyMember | ChildProfile;

// ---------------------------------------------------------------- Routinen

export type RoutinePhase = 'morning' | 'afternoon' | 'evening';

export interface RoutineDefinition {
  id: Id;
  title: string;
  icon: string;
  phase: RoutinePhase;
  /** An welchen Wochentagen die Routine vorkommt. */
  weekdays: Weekday[];
  /** Kinder, denen die Routine gehört. */
  assignedTo: Id[];
  order: number;
  active: boolean;
  /** Erscheint auf der Startseite unter "Das gehört heute dazu". */
  highlight: boolean;
  /** Optionaler Timer, z. B. 15 Minuten draußen. */
  timerPresetId?: Id;
  /** Nur an echten Kindergartentagen zeigen (nicht in Ferien, nicht an freien Tagen). */
  kindergartenOnly?: boolean;
  createdAt: string;
}

/**
 * Eine Erledigung. Der Primärschlüssel ist deterministisch
 * `${definitionId}|${childId}|${date}`, sodass dieselbe Instanz nie doppelt existiert
 * und historische Tage beim Wochenwechsel unberührt bleiben.
 */
export interface RoutineOccurrence {
  id: string;
  definitionId: Id;
  childId: Id;
  date: DateKey;
  completedAt: string;
  assisted: boolean;
}

// ---------------------------------------------------------------- Haushalt

export interface ChoreDefinition {
  id: Id;
  title: string;
  icon: string;
  childId: Id;
  weekdays: Weekday[];
  /** Hinweis für Erwachsene, z. B. "gemeinsam mit Mama oder Papa". */
  helpNote?: string;
  active: boolean;
  createdAt: string;
}

export type ChoreStatus = 'open' | 'done' | 'skipped';

/**
 * Jede Haushaltsaufgabe wird pro Termin als eigene Instanz gespeichert.
 * `scheduledDate` ist der ursprüngliche Plantag (Teil des Schlüssels),
 * `date` der aktuelle Tag (nach Verschieben).
 */
export interface ChoreOccurrence {
  id: string;
  definitionId: Id;
  childId: Id;
  scheduledDate: DateKey;
  date: DateKey;
  status: ChoreStatus;
  completedAt?: string;
  doneTogether: boolean;
  note?: string;
}

// ---------------------------------------------------------------- Kalender

export type EventCategory = 'appointment' | 'family' | 'birthday' | 'holiday' | 'info';

export interface EventRecurrence {
  freq: 'weekly' | 'yearly';
  /** Alle n Wochen bzw. Jahre. */
  interval: number;
  byWeekday?: Weekday[];
  until?: DateKey;
}

export interface CalendarEvent {
  id: Id;
  title: string;
  category: EventCategory;
  /** Erster Tag (bei Wiederholung: Beginn der Serie). */
  startDate: DateKey;
  /** Letzter Tag bei mehrtägigen Ereignissen wie Ferien. */
  endDate?: DateKey;
  startTime?: TimeOfDay;
  endTime?: TimeOfDay;
  departureTime?: TimeOfDay;
  memberIds: Id[];
  notes?: string;
  packingList: string[];
  /** Erinnerung innerhalb der App, Minuten vor Abfahrt bzw. Beginn. */
  reminderMinutes?: number;
  recurrence?: EventRecurrence;
  createdAt: string;
  updatedAt: string;
}

export interface EventException {
  id: Id;
  eventId: Id;
  /** Der ursprüngliche Termin der Serie, der betroffen ist. */
  originalDate: DateKey;
  type: 'cancelled' | 'moved';
  newDate?: DateKey;
  newStartTime?: TimeOfDay;
  newEndTime?: TimeOfDay;
  newDepartureTime?: TimeOfDay;
  note?: string;
}

/** Ein konkretes Vorkommen eines Termins an einem Tag (berechnet, nicht gespeichert). */
export interface EventOccurrence {
  key: string;
  event: CalendarEvent;
  date: DateKey;
  originalDate: DateKey;
  startTime?: TimeOfDay;
  endTime?: TimeOfDay;
  departureTime?: TimeOfDay;
  isMoved: boolean;
  exception?: EventException;
  /** Automatisch aus Profilen erzeugte Geburtstage. */
  generated?: 'birthday';
}

// ---------------------------------------------------------------- Timer

export type TimerMode = 'countdown' | 'minimum';

export interface TimerPreset {
  id: Id;
  label: string;
  minutes: number;
  icon: string;
  color: ColorKey;
  /** "minimum": nach Ablauf geht es ruhig weiter, keine Aufforderung zum Aufhören. */
  mode: TimerMode;
  order: number;
}

export type TimerStatus = 'idle' | 'running' | 'paused';

/** Persistierter Timerzustand auf Basis echter Zeitstempel. */
export interface TimerState {
  id: Id;
  label: string;
  durationMs: number;
  mode: TimerMode;
  status: TimerStatus;
  /** Zeitpunkt (ms) des letzten Starts bzw. Fortsetzens. */
  startedAt?: number;
  /** Bereits abgelaufene Zeit vor dem letzten Start. */
  accumulatedMs: number;
  /** Letzte Bedienung (ms). Timer von früheren Tagen gelten als zurückgesetzt. */
  lastChangedAt?: number;
}

// ---------------------------------------------------------------- Einstellungen

export interface AppSettings {
  id: 'app';
  morningStart: TimeOfDay;
  kindergartenDays: Weekday[];
  kindergartenDeparture: TimeOfDay;
  kindergartenReturn: TimeOfDay;
  /** An Tagen ohne Kindergarten endet der Morgen hier. */
  freeDayMorningEnd: TimeOfDay;
  papaHome: TimeOfDay;
  /** Text der Heimkehr-Zeile im Tagesablauf, z. B. "Papa kommt nach Hause". Leer = ausblenden. */
  homeArrivalLabel: string;
  /** An welchen Tagen die Heimkehr-Zeile erscheint. */
  homeArrivalDays: Weekday[];
  /** Hinweis nach dem Kindergarten im Tagesablauf. Leer = ausblenden. */
  afterKindergartenNote: string;
  /** Hinweis oben in der Wochenansicht. Leer = ausblenden. */
  weekBanner: string;
  eveningStart: TimeOfDay;
  bedtime: TimeOfDay;
  /** Abweichende Schlafenszeiten, z. B. freitags später. */
  bedtimeOverrides: Partial<Record<Weekday, TimeOfDay>>;
  showSeconds: boolean;
  clockLearningMode: boolean;
  /** Phase C/D: werden schon gespeichert, damit keine Migration nötig wird. */
  maxStarsPerChildPerDay: number;
  starsPerCountry: number;
  createdAt: string;
}

export interface ParentAuth {
  id: 'parent';
  /** PBKDF2-SHA-256, Base64. Niemals Klartext. */
  hash: string;
  salt: string;
  iterations: number;
  failedAttempts: number;
  lockedUntil?: number;
  /** Notfallcode zum Zurücksetzen der PIN, ebenfalls nur als PBKDF2-Hash. */
  recoveryHash?: string;
  recoverySalt?: string;
  recoveryCreatedAt?: string;
  updatedAt: string;
}

/** Gerätebezogene Angaben, die nicht in Sicherungen wandern. */
export interface DeviceMeta {
  id: 'device';
  lastBackupAt?: string;
}

/** Automatische Sicherheitskopie, z. B. vor einem Import. Nur auf diesem Gerät. */
export interface SafetyCopy {
  id: Id;
  createdAt: string;
  reason: 'before-import';
  /** Vollständige Sicherung als JSON-Text. */
  json: string;
}

// ------------------------------------------------- Phase C/D (Datenmodell vorbereitet)

export interface OptionalMission {
  id: Id;
  title: string;
  icon: string;
  stars: number;
  assignedTo: Id[];
  active: boolean;
}

export interface MissionCompletion {
  /** `${missionId}|${childId}|${date}|${n}` */
  id: string;
  missionId: Id;
  childId: Id;
  date: DateKey;
  status: 'pending' | 'confirmed' | 'declined';
  requestedAt: string;
  confirmedAt?: string;
}

export interface StarTransaction {
  id: Id;
  /** Positiv: verdient. Negativ: für Freischaltung verwendet. Nie Strafe. */
  amount: number;
  kind: 'earned' | 'spent';
  /** Eindeutige Quelle, verhindert Doppelbuchung (z. B. MissionCompletion-Id). */
  sourceId: string;
  childId?: Id;
  createdAt: string;
}

export interface FamilyTimeSession {
  id: Id;
  childId: Id;
  date: DateKey;
  activity: string;
  startedAt?: string;
  minutes?: number;
}

export interface FamilyCouncilNote {
  id: Id;
  date: DateKey;
  beautiful?: string;
  difficult?: string;
  lookingForward?: string;
}

export type SpecialDayKind = 'sick' | 'vacation' | 'trip' | 'visit' | 'no-kindergarten' | 'free-day';

export interface SpecialDayMode {
  date: DateKey;
  kind: SpecialDayKind;
  childIds: Id[];
  hideRoutines: boolean;
  note?: string;
}

export interface Country {
  id: Id;
  nameDe: string;
  capital: string;
  continent: string;
  flagEmoji: string;
  greeting: { word: string; language: string };
  order: number;
  /** Position für Globus/Karte. */
  lat: number;
  lng: number;
}

export interface CountryUnlock {
  countryId: Id;
  unlockedAt: string;
  starTransactionId: Id;
}

export type LearningArea = 'geography' | 'language' | 'writing' | 'math' | 'nature' | 'culture' | 'creativity';

export interface LearningActivity {
  id: Id;
  countryId: Id;
  area: LearningArea;
  title: string;
  ageStages: AgeStage[] | 'all';
  kind: 'digital' | 'analog' | 'family';
}

export interface LearningProgress {
  /** `${activityId}|${childId}` */
  id: string;
  activityId: Id;
  childId: Id;
  completedAt: string;
}

export interface PassportStamp {
  id: string;
  countryId: Id;
  childId: Id;
  stampedAt: string;
}

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
  /** Schulkind bekommt Übungsblätter passend zum Unterricht (Rechenpfad). Standard: aus. */
  schoolPractice?: boolean;
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
  /** Nur für Kindergartenkinder bzw. nur für Schulkinder (ab Einschulungsdatum). Fehlt = für alle. */
  stage?: RoutineStage;
  createdAt: string;
}

export type RoutineStage = 'kindergarten' | 'school';

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
  generated?: 'birthday' | 'public-holiday';
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
  /** Tagesordnung des Familienrats. Fehlt = Standard. */
  councilAgenda?: string[];
  /** Gesetzliche Feiertage. Fehlt = Baden-Württemberg. */
  holidayRegion?: HolidayRegion;
  /** Papa-Zeit: wie oft pro Woche und Kind, an welchen Tagen, wie lange. Fehlt = einmal pro Woche am Wochenende. */
  papaTime?: PapaTimeSettings;
  /** Letzter Kalenderexport fürs Handy. */
  icsExportedAt?: string;
  /** Wochenziele des Essensplans. Fehlt = die sieben Standardkategorien. */
  mealCategories?: MealCategory[];
  /** Suppenküche im Winter. Fehlt = an, alle 2 Wochen sonntags, Oktober bis März. */
  soupKitchen?: SoupKitchenSettings;
  createdAt: string;
}

export type HolidayRegion = 'BW' | 'none';

export interface PapaTimeSettings {
  /** Wie oft pro Woche und Kind. 0 = Papa-Zeit ausgeblendet. */
  perWeek: number;
  /** An diesen Tagen wird Papa-Zeit vorgeschlagen. */
  days: Weekday[];
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

/** Mama-Zeit: festgehalten wird nur, dass sie stattfand, und was das Kind sich ausgesucht hat. Keine Sterne. */
export interface FamilyTimeSession {
  id: Id;
  childId: Id;
  date: DateKey;
  /** Id aus der Aktivitätsliste, z. B. "read". */
  activity: string;
  startedAt?: string;
  minutes?: number;
  /** Mit wem. Fehlt = Mama. */
  parent?: 'papa';
}

/** Familienrat am Sonntag. Id = Datum des Sonntags. */
export interface FamilyCouncilNote {
  id: Id;
  date: DateKey;
  /** Abgehakte Tagesordnungspunkte (Index in der Tagesordnung). */
  doneItems?: number[];
  /** Schönstes Erlebnis je Familienmitglied. */
  highlights?: Record<Id, string>;
  /** Notizen je Tagesordnungspunkt. */
  notes?: Record<string, string>;
  decisions?: CouncilDecision[];
  /** Ältere Felder aus Phase B. */
  beautiful?: string;
  difficult?: string;
  lookingForward?: string;
}

export interface CouncilDecision {
  id: Id;
  text: string;
  /** Als Termin im Kalender eingetragen. */
  eventId?: Id;
}

export type AdventureStatus = 'planned' | 'done' | 'postponed' | 'cancelled';

export interface PackingItem { id: Id; label: string; done: boolean }

/** Wochenendabenteuer. Id = Datum des Freitags. Kein Eintrag = noch nicht geplant. Keine Sterne. */
export interface WeekendAdventure {
  id: Id;
  /** Freitag des Wochenendes. */
  weekend: DateKey;
  status: AdventureStatus;
  ideaId?: string;
  title: string;
  emoji: string;
  day?: DateKey;
  time?: TimeOfDay;
  packing: PackingItem[];
  /** Besondere Vorbereitung, z. B. "Kakao kochen". */
  prep?: string;
  /** Begründung beim Verschieben oder Ausfallen. */
  reason?: string;
  updatedAt: string;
}

/** Eine Familienerinnerung, z. B. nach einem Abenteuer. Fotos als verkleinertes JPEG (Daten-URL). */
export interface FamilyMemory {
  id: Id;
  date: DateKey;
  title: string;
  text?: string;
  photos?: string[];
  /** Ältere Erinnerungen (Version 0.7.0) hatten nur ein Foto. */
  photo?: string;
  memberIds: Id[];
  source?: { kind: 'adventure' | 'council' | 'mama-time' | 'project'; id: Id };
  createdAt: string;
}

export type SpecialDayKind = 'sick' | 'vacation' | 'trip' | 'visit' | 'no-kindergarten' | 'free-day';

export interface SpecialDayMode {
  date: DateKey;
  kind: SpecialDayKind;
  childIds: Id[];
  hideRoutines: boolean;
  note?: string;
}

/** Ein geplantes Jahreszeitenritual. */
export interface FamilyRitual {
  id: Id;
  /** Id aus der Ritualbibliothek oder "own". */
  ritualId: string;
  title: string;
  emoji: string;
  date?: DateKey;
  status: 'planned' | 'done';
  materials: PackingItem[];
  note?: string;
  createdAt: string;
}

/** Ritual, das jedes Jahr wiederkommt; mit eurer Notiz, z. B. dem Lieblingsrezept. Id = Ritual-Id. */
export interface RitualFavorite {
  id: string;
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

// ------------------------------------------------------------- Lernwelt (Lesepfad)

/** Elternbeobachtung in fünf Stufen, wie im Konzept festgelegt. */
export type ObservationLevel = 'independent' | 'little-help' | 'much-help' | 'not-yet' | 'not-assessable';

export interface LearningObservation {
  id: Id;
  childId: Id;
  /** Id aus dem Lehrplan, z. B. "read.letter.M". */
  goalId: string;
  date: DateKey;
  level: ObservationLevel;
  note?: string;
  /** Stimmung beim Lernen (Interesse und Motivation). */
  mood?: LearningMood;
  /** Zeile aus dem Beobachtungsbogen, z. B. "M und m nachspuren und schreiben". */
  sheetRow?: string;
  /** Lernpaket der Woche, zu dem die Beobachtung gehört. */
  packId?: Id;
  createdAt: string;
}

export type LearningMood = 'fun' | 'ok' | 'reluctant';

/** Was ein Kind im Wochenpaket bekommt. */
export type PackTrack = 'letters' | 'preschool' | 'toddler' | 'math' | 'skip';

/** Lernpaket einer Woche: ein gemeinsames Thema, passende Blätter je Kind. */
export interface LearningPack {
  id: Id;
  weekStart: DateKey;
  /** Buchstabe aus dem Lehrplan (LETTERS.upper), z. B. "M". */
  letter: string;
  /** math: zusätzlich Rechenblätter (fehlt bei älteren Paketen = nein). */
  children: { childId: Id; track: PackTrack; math?: boolean }[];
  createdAt: string;
  /** Wann was gedruckt beziehungsweise als PDF erzeugt wurde. */
  prints: { at: string; scope: string; pages: number }[];
}

/** Freigabe oder Zurückstellen eines Lernziels durch die Eltern. Id: `${childId}|${goalId}`. */
export interface LearningRelease {
  id: string;
  childId: Id;
  goalId: string;
  status: 'released' | 'postponed';
  at: string;
  /** Bei "postponed": bis wann der Vorschlag ruht. */
  until?: DateKey;
}

// ---------------------------------------------------------------- Essen

/** Abteilung im Laden, damit die Einkaufsliste sortiert ist. */
export type ShopSection = 'obst-gemuese' | 'brot' | 'kuehl' | 'fleisch' | 'vorrat' | 'tk' | 'drogerie' | 'sonstiges';

/** Beilage für die Abwechslung über mehrere Wochen. */
export type MealSide = 'reis' | 'nudeln' | 'kartoffeln' | 'couscous' | 'bulgur' | 'brot';

/** Wochenziel, z. B. einmal pro Woche ein süßes Hauptgericht. Frei änderbar in den Einstellungen. */
export interface MealCategory {
  id: string;
  label: string;
  emoji: string;
  perWeek: number;
  /** Kein Hauptgericht (z. B. Brot und Backen): wird im Wochenplan nicht von allein vorgeschlagen. */
  notMeal?: boolean;
}

export interface Ingredient {
  name: string;
  /** Freitext, z. B. "500 g" oder "1 Bund". */
  amount?: string;
  section: ShopSection;
}

/** Ein Gericht aus eurer Sammlung. Kategorien dürfen sich überschneiden (Hühnersuppe = Hähnchen und Suppe). */
export interface Recipe {
  id: Id;
  title: string;
  emoji: string;
  categories: string[];
  side?: MealSide;
  ingredients: Ingredient[];
  note?: string;
  /** Für wie viele Personen die Mengen gedacht sind. Fehlt = 5 (2 Erwachsene, 3 Kinder). */
  servings?: number;
  favorite?: boolean;
  /** Mag die Familie gerade nicht: wird nicht vorgeschlagen. */
  paused?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlanDay {
  date: DateKey;
  recipeId?: Id;
  /** Titel bleibt erhalten, auch wenn das Gericht später gelöscht wird; freie Einträge wie "Reste" gehen auch. */
  title: string;
  emoji?: string;
  categories: string[];
  side?: MealSide;
  /** Wunsch eines Kindes aus dem Familienrat. */
  wishedBy?: Id;
  /** Für wie viele Personen gekocht wird (z. B. mit Gästen). Fehlt = wie im Gericht. */
  servings?: number;
  /** Kommt aus dem Gefriervorrat: eine Portion wurde dafür abgebucht. */
  freezerId?: Id;
}

/** Wochenplan. Id = Montag der Woche. */
export interface MealPlan {
  id: DateKey;
  days: MealPlanDay[];
  /** Essenswünsche der Kinder aus dem Familienrat, noch keinem Tag zugeordnet. */
  wishes: { childId: Id; recipeId: Id }[];
  /** Zutaten wurden geprüft und übernommen. */
  ingredientsCheckedAt?: string;
}

export interface ShoppingItem {
  id: Id;
  name: string;
  amount?: string;
  section: ShopSection;
  done: boolean;
  /** Woher der Eintrag kommt, z. B. "Pizza (Fr)". */
  source?: string;
  createdAt: string;
  doneAt?: string;
}

export interface SoupKitchenSettings {
  enabled: boolean;
  /** Alle n Wochen eine größere Menge kochen. */
  everyWeeks: number;
  /** Bevorzugter Kochtag. */
  day: Weekday;
  /** Monate (1 bis 12), in denen die Suppenküche vorschlägt. */
  months: number[];
}

/** Großes Kochen für den Vorrat, z. B. Rinderknochenbrühe. Elternaufgabe, keine Sterne. */
export interface CookSession {
  id: Id;
  date: DateKey;
  recipeId: Id;
  title: string;
  emoji: string;
  status: 'planned' | 'done' | 'skipped';
  /** Eingefrorene Portionen nach dem Kochen. */
  portions?: number;
  createdAt: string;
}

/** Gefriervorrat: was ihr wirklich eingefroren habt, mit Datum und Menge. Nichts wird geschätzt. */
export interface FreezerItem {
  id: Id;
  name: string;
  emoji?: string;
  recipeId?: Id;
  /** Portionen; eine Portion reicht für eine Familienmahlzeit. */
  portions: number;
  frozenAt: DateKey;
  note?: string;
}

// ---------------------------------------------------------------- Projektwerkstatt

/** Jedes Projekt hat dieselbe Grundstruktur (aus dem Konzept). */
export type ProjectPhase = 'discover' | 'plan' | 'make' | 'document' | 'finish';

/** Auf welchem Niveau ein Kind im Projekt mitmacht: Bild- und Mitmachaufgaben, Vorschule, Lesekind, Schulkind. */
export type ProjectLevel = 'toddler' | 'preschool' | 'reader' | 'school';

export interface ProjectStep { id: Id; phase: ProjectPhase; label: string; done: boolean }

/** Eine Teilaufgabe für ein bestimmtes Kind, passend zu seinem Niveau. Keine Sterne. */
export interface ProjectTask { id: Id; childId: Id; label: string; done: boolean; doneAt?: string }

export interface ProjectMaterial { id: Id; label: string; done: boolean }

/** Kosten und Einnahmen in Cent, einzeln erfasst. */
export interface ProjectMoney { id: Id; date: DateKey; label: string; cents: number; kind: 'cost' | 'income' }

/** Eintrag im Projekttagebuch: was wir gemacht oder herausgefunden haben, mit Fotos. */
export interface ProjectEntry { id: Id; date: DateKey; text?: string; photos: string[] }

/** Ausflug oder Forscherabend, auf Wunsch als Familientermin im Kalender. */
export interface ProjectDate { title: string; date?: DateKey; time?: TimeOfDay; eventId?: Id }

export interface FamilyProject {
  id: Id;
  /** Id aus der Ideensammlung oder "own". */
  ideaId: string;
  title: string;
  emoji: string;
  description?: string;
  status: 'active' | 'paused' | 'done';
  childIds: Id[];
  /** Niveau je Kind beim Start (änderbar). */
  levels: Record<Id, ProjectLevel>;
  /** Lernbereiche, z. B. "math", "nature". */
  areas: string[];
  steps: ProjectStep[];
  tasks: ProjectTask[];
  materials: ProjectMaterial[];
  money: ProjectMoney[];
  entries: ProjectEntry[];
  trip?: ProjectDate;
  presentation?: ProjectDate;
  startDate: DateKey;
  targetDate?: DateKey;
  doneAt?: DateKey;
  /** Was wir herausgefunden haben (beim Abschluss). */
  reflection?: string;
  memoryId?: Id;
  createdAt: string;
  updatedAt: string;
}

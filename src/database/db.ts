import Dexie, { type Table } from 'dexie';
import type {
  AppSettings, CalendarEvent, ChoreDefinition, ChoreOccurrence, Country, CountryUnlock, EventException,
  FamilyCouncilNote, FamilyTimeSession, LearningActivity, LearningProgress, Member, MissionCompletion,
  OptionalMission, ParentAuth, PassportStamp, RoutineDefinition, RoutineOccurrence, SpecialDayMode,
  StarTransaction, TimerPreset, TimerState,
} from '../types';
import { buildSeed } from '../data/seed';
import { toDateKey } from '../utils/dates';
import { DB_NAME, SCHEMA_V1, SCHEMA_V2 } from './schema';

export class FamilyDatabase extends Dexie {
  members!: Table<Member, string>;
  routineDefinitions!: Table<RoutineDefinition, string>;
  routineOccurrences!: Table<RoutineOccurrence, string>;
  choreDefinitions!: Table<ChoreDefinition, string>;
  choreOccurrences!: Table<ChoreOccurrence, string>;
  events!: Table<CalendarEvent, string>;
  eventExceptions!: Table<EventException, string>;
  timerPresets!: Table<TimerPreset, string>;
  timers!: Table<TimerState, string>;
  settings!: Table<AppSettings, string>;
  parentAuth!: Table<ParentAuth, string>;
  missions!: Table<OptionalMission, string>;
  missionCompletions!: Table<MissionCompletion, string>;
  starTransactions!: Table<StarTransaction, string>;
  familyTimeSessions!: Table<FamilyTimeSession, string>;
  familyCouncilNotes!: Table<FamilyCouncilNote, string>;
  specialDays!: Table<SpecialDayMode, string>;
  countries!: Table<Country, string>;
  countryUnlocks!: Table<CountryUnlock, string>;
  learningActivities!: Table<LearningActivity, string>;
  learningProgress!: Table<LearningProgress, string>;
  passportStamps!: Table<PassportStamp, string>;

  constructor(name: string = DB_NAME, options?: { seedDate?: Date }) {
    super(name);

    this.version(1).stores(SCHEMA_V1);

    this.version(2).stores(SCHEMA_V2).upgrade(async (tx) => {
      // Bestehende Einstellungen um die Sternwerte ergänzen, ohne andere Werte anzutasten.
      await tx.table('settings').toCollection().modify((s: Partial<AppSettings>) => {
        if (s.maxStarsPerChildPerDay === undefined) s.maxStarsPerChildPerDay = 5;
        if (s.starsPerCountry === undefined) s.starsPerCountry = 30;
      });
    });

    // Läuft ausschließlich, wenn die Datenbank zum allerersten Mal angelegt wird.
    this.on('populate', async (tx) => {
      const seed = buildSeed(toDateKey(options?.seedDate ?? new Date()));
      await tx.table('members').bulkAdd(seed.members);
      await tx.table('routineDefinitions').bulkAdd(seed.routines);
      await tx.table('choreDefinitions').bulkAdd(seed.chores);
      await tx.table('events').bulkAdd(seed.events);
      await tx.table('timerPresets').bulkAdd(seed.timerPresets);
      await tx.table('settings').add(seed.settings);
      await tx.table('countries').bulkAdd(seed.countries);
    });
  }
}

export const db = new FamilyDatabase();

/** Alle Tabellen in fester Reihenfolge, z. B. für Export und Import. */
export const TABLE_NAMES = [...Object.keys(SCHEMA_V1), ...Object.keys(SCHEMA_V2)] as const;

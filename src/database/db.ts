import Dexie, { type Table } from 'dexie';
import type {
  AppSettings, CalendarEvent, ChoreDefinition, ChoreOccurrence, Country, CountryUnlock, DeviceMeta, EventException,
  FamilyCouncilNote, FamilyMemory, FamilyRitual, RitualFavorite, FamilyTimeSession, WeekendAdventure, LearningObservation, LearningPack, LearningRelease, LearningActivity, LearningProgress, Member, MissionCompletion,
  OptionalMission, ParentAuth, PassportStamp, RoutineDefinition, RoutineOccurrence, SpecialDayMode,
  RoutineDefinition as RoutineDef, SafetyCopy, StarTransaction, TimerPreset, TimerState, Weekday,
} from '../types';
import { buildSeed } from '../data/seed';
import { toDateKey } from '../utils/dates';
import { DB_NAME, SCHEMA_V1, SCHEMA_V2, SCHEMA_V3, SCHEMA_V4, SCHEMA_V5, SCHEMA_V6, SCHEMA_V7 } from './schema';
import { WORLD } from '../data/countries';
import { upgradeRoutine, upgradeSettings } from './migrations';

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
  deviceMeta!: Table<DeviceMeta, string>;
  safetyCopies!: Table<SafetyCopy, string>;
  learningObservations!: Table<LearningObservation, string>;
  learningReleases!: Table<LearningRelease, string>;
  learningPacks!: Table<LearningPack, string>;
  weekendAdventures!: Table<WeekendAdventure, string>;
  familyMemories!: Table<FamilyMemory, string>;
  rituals!: Table<FamilyRitual, string>;
  ritualFavorites!: Table<RitualFavorite, string>;

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

    this.version(3).stores(SCHEMA_V3).upgrade(async (tx) => {
      let kgDays: Weekday[] = [1, 2, 3, 4, 5];
      await tx.table('settings').toCollection().modify((s: Partial<AppSettings>) => {
        upgradeSettings(s, 2);
        if (s.kindergartenDays) kgDays = s.kindergartenDays;
      });
      await tx.table('routineDefinitions').toCollection().modify((r: Partial<RoutineDef>) => upgradeRoutine(r, kgDays));
    });

    this.version(4).stores(SCHEMA_V4);

    this.version(5).stores(SCHEMA_V5);

    this.version(6).stores(SCHEMA_V6);

    this.version(7).stores(SCHEMA_V7).upgrade(async (tx) => {
      // Fehlende Länder der Weltreise ergänzen, vorhandene bleiben unangetastet
      const table = tx.table('countries');
      const have = new Set((await table.toArray()).map((c: { id: string }) => c.id));
      await table.bulkAdd(WORLD.map((w) => w.country).filter((c) => !have.has(c.id)));
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
export const TABLE_NAMES = [...Object.keys(SCHEMA_V1), ...Object.keys(SCHEMA_V2), ...Object.keys(SCHEMA_V3), ...Object.keys(SCHEMA_V4), ...Object.keys(SCHEMA_V5), ...Object.keys(SCHEMA_V6), ...Object.keys(SCHEMA_V7)] as const;

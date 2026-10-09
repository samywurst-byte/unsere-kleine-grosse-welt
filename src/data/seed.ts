import type {
  AppSettings, CalendarEvent, ChildProfile, ChoreDefinition, Country, FamilyMember, RoutineDefinition,
  TimerPreset, Weekday,
} from '../types';
import { weekStartKey } from '../utils/dates';

/**
 * Neutrale Beispielwerte für den allerersten Start (Dexie "populate").
 * Bewusst ohne echte Namen, Geburtstage oder Termine, weil der Code öffentlich ist.
 * Die eigene Familie kommt per Datensicherung (Eltern > Daten > Importieren) oder
 * wird im Elternbereich eingetragen.
 */
export const IDS = {
  mama: 'member-mama',
  papa: 'member-papa',
  childLarge: 'child-1',
  childMedium: 'child-2',
  childSmall: 'child-3',
  timerOutdoor: 'timer-outdoor',
  timerMamaTime: 'timer-mama-time',
  timerTidy: 'timer-tidy',
  timerDeparture: 'timer-departure',
  timerFreePlay: 'timer-free-play',
} as const;

const ALL_DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
const KG_DAYS: Weekday[] = [1, 2, 3, 4, 5];
const KIDS = [IDS.childLarge, IDS.childMedium, IDS.childSmall];

export function buildSeed(todayKey: string) {
  const now = new Date().toISOString();
  const seriesStart = weekStartKey(todayKey);

  const parents: FamilyMember[] = [
    { id: IDS.mama, role: 'parent', name: 'Mama', color: 'terracotta', avatar: 'parent-a', sortOrder: 0, active: true },
    { id: IDS.papa, role: 'parent', name: 'Papa', color: 'sage', avatar: 'parent-b', sortOrder: 1, active: true },
  ];

  const children: ChildProfile[] = [
    {
      id: IDS.childLarge, role: 'child', name: 'Kind 1', color: 'sky', avatar: 'fox',
      sortOrder: 2, active: true, ageStage: 'large', maxVisibleTasks: 4, needsHelp: false, showLabels: true,
    },
    {
      id: IDS.childMedium, role: 'child', name: 'Kind 2', color: 'sage', avatar: 'rabbit',
      sortOrder: 3, active: true, ageStage: 'medium', maxVisibleTasks: 2, needsHelp: false, showLabels: true,
    },
    {
      id: IDS.childSmall, role: 'child', name: 'Kind 3', color: 'rose', avatar: 'hedgehog',
      sortOrder: 4, active: true, ageStage: 'small', maxVisibleTasks: 1, needsHelp: true, showLabels: false,
    },
  ];

  let order = 0;
  const routine = (
    phase: RoutineDefinition['phase'], title: string, icon: string,
    extra: Partial<RoutineDefinition> = {},
  ): RoutineDefinition => ({
    id: `routine-${phase}-${order}`, title, icon, phase, weekdays: ALL_DAYS, assignedTo: KIDS,
    order: order++, active: true, highlight: false, createdAt: now, ...extra,
  });

  const routines: RoutineDefinition[] = [
    routine('morning', 'Aufstehen', 'sunrise'),
    routine('morning', 'Frühstücken', 'utensils'),
    routine('morning', 'Anziehen', 'shirt'),
    routine('morning', 'Zähneputzen', 'brush'),
    routine('morning', 'Kindergarten vorbereiten', 'backpack', { weekdays: KG_DAYS }),
    routine('morning', 'Schuhe und Jacke anziehen', 'footprints', { weekdays: KG_DAYS }),
    routine('afternoon', 'Mittagessen', 'soup'),
    routine('afternoon', 'Mindestens 15 Minuten draußen', 'trees', { highlight: true, timerPresetId: IDS.timerOutdoor }),
    routine('afternoon', 'Freies Spielen', 'toy-brick'),
    routine('evening', 'Spielsachen aufräumen', 'puzzle', { highlight: true, timerPresetId: IDS.timerTidy }),
    routine('evening', 'Schuhe ordentlich hinstellen', 'footprints', { highlight: true }),
    routine('evening', 'Waschen', 'droplets'),
    routine('evening', 'Zähneputzen', 'brush'),
    routine('evening', 'Schlafenszeit vorbereiten', 'bed'),
  ];

  const chores: ChoreDefinition[] = [
    { id: 'chore-1', title: 'Treppe kehren', icon: 'brush', childId: IDS.childLarge, weekdays: [2, 6], active: true, createdAt: now },
    { id: 'chore-2', title: 'Staubsaugen', icon: 'wind', childId: IDS.childMedium, weekdays: [2, 6], active: true, createdAt: now },
    {
      id: 'chore-3', title: 'Schuhe im Eingang sortieren', icon: 'footprints', childId: IDS.childSmall,
      weekdays: [2, 6], helpNote: 'Gemeinsam mit Mama oder Papa', active: true, createdAt: now,
    },
  ];

  const weekly = (
    id: string, title: string, weekday: Weekday, fields: Partial<CalendarEvent>,
  ): CalendarEvent => ({
    id, title, category: 'appointment', startDate: seriesStart, memberIds: [], packingList: [],
    recurrence: { freq: 'weekly', interval: 1, byWeekday: [weekday] }, createdAt: now, updatedAt: now, ...fields,
  });

  // Zwei Beispiele, damit Woche und "Nächster Termin" nicht leer starten.
  const events: CalendarEvent[] = [
    weekly('event-example-sport', 'Beispiel: Sportkurs', 5, {
      startTime: '16:00', endTime: '16:30', departureTime: '15:00', memberIds: KIDS,
      notes: 'Beispieltermin. Im Elternbereich unter Kalender ändern oder löschen.',
    }),
    weekly('event-sunday', 'Familienzeit und Wochenplanung', 0, {
      category: 'family', notes: 'Optional: kleiner Familienrat.',
    }),
  ];

  const timerPresets: TimerPreset[] = [
    { id: IDS.timerOutdoor, label: 'Draußen', minutes: 15, icon: 'trees', color: 'sage', mode: 'minimum', order: 0 },
    { id: IDS.timerMamaTime, label: 'Mama-Zeit', minutes: 10, icon: 'heart', color: 'rose', mode: 'minimum', order: 1 },
    { id: IDS.timerTidy, label: 'Aufräumen', minutes: 5, icon: 'puzzle', color: 'terracotta', mode: 'countdown', order: 2 },
    { id: IDS.timerDeparture, label: 'Fertig machen', minutes: 10, icon: 'footprints', color: 'sky', mode: 'countdown', order: 3 },
    { id: IDS.timerFreePlay, label: 'Freies Spielen', minutes: 30, icon: 'toy-brick', color: 'gold', mode: 'countdown', order: 4 },
  ];

  const settings: AppSettings = {
    id: 'app',
    morningStart: '06:00',
    kindergartenDays: KG_DAYS,
    kindergartenDeparture: '08:00',
    kindergartenReturn: '12:30',
    freeDayMorningEnd: '09:30',
    papaHome: '15:30',
    eveningStart: '17:30',
    bedtime: '19:00',
    bedtimeOverrides: {},
    showSeconds: true,
    clockLearningMode: false,
    maxStarsPerChildPerDay: 5,
    starsPerCountry: 30,
    createdAt: now,
  };

  const countries: Country[] = [
    {
      id: 'country-italy', nameDe: 'Italien', capital: 'Rom', continent: 'Europa', flagEmoji: '🇮🇹',
      greeting: { word: 'Ciao', language: 'Italienisch' }, order: 2, lat: 41.9, lng: 12.5,
    },
  ];

  return { members: [...parents, ...children], routines, chores, events, timerPresets, settings, countries };
}

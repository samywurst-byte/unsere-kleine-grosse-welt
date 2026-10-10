import type { FamilyDatabase } from '../database/db';
import { GOALS_BY_ID, LETTER_ORDER, READING_GOALS, type LearningGoal } from '../data/readingCurriculum';
import { MATH_GOALS_BY_ID } from '../data/mathCurriculum';
import type { ChildProfile, DateKey, LearningMood, LearningObservation, LearningRelease, ObservationLevel } from '../types';
import { addDaysKey, daysBetween, isValidDateKey } from '../utils/dates';
import { newId } from '../utils/id';
import { readingPathStart } from './school';

/**
 * Lernstand je Lernziel. Grundsätze aus dem Konzept:
 * - keine Kompetenz aus einer einzigen Übung, mehrere Tage nötig
 * - eine einzelne schwierige Beobachtung stuft nicht zurück
 * - Wiederholung wird vorgeschlagen, nicht erzwungen
 * - keine Prozentwerte ohne ausreichende Daten, stattdessen nachvollziehbare Begründung
 */
export type GoalStatus = 'not-started' | 'introducing' | 'practising' | 'mostly' | 'mastered' | 'review';

export const STATUS_LABEL: Record<GoalStatus, string> = {
  'not-started': 'Noch nicht begonnen',
  introducing: 'Kennenlernen',
  practising: 'In Übung',
  mostly: 'Weitgehend sicher',
  mastered: 'Sicher',
  review: 'Wiederholung empfohlen',
};

export const MOOD_LABEL: Record<LearningMood, string> = {
  fun: 'Hat Spaß gemacht',
  ok: 'War okay',
  reluctant: 'Heute keine Lust',
};

export const LEVEL_LABEL: Record<ObservationLevel, string> = {
  independent: 'Selbstständig geschafft',
  'little-help': 'Mit wenig Hilfe',
  'much-help': 'Mit viel Hilfe',
  'not-yet': 'Noch nicht geschafft',
  'not-assessable': 'Nicht beurteilbar',
};

/** Regeln an einer Stelle, damit sie nachvollziehbar und später anpassbar sind. */
export const RULES = {
  mostly: { successes: 3, days: 2 },
  mastered: { independent: 4, days: 3 },
  /** Nach so vielen Tagen ohne Beobachtung wird Wiederholung vorgeschlagen. */
  reviewAfterDays: 28,
  /** Höchstens so viele Buchstaben gleichzeitig im Kennenlernen oder in Übung. */
  maxParallelLetters: 2,
  postponeDays: 7,
} as const;

const isSuccess = (l: ObservationLevel) => l === 'independent' || l === 'little-help';
const isStruggle = (l: ObservationLevel) => l === 'much-help' || l === 'not-yet';

export interface GoalState {
  goal: LearningGoal;
  status: GoalStatus;
  released: boolean;
  /** Begründung in Alltagssprache, z. B. "4× selbstständig an 3 Tagen, zuletzt am 12. Oktober". */
  evidence: string;
  lastDate?: DateKey;
  observations: LearningObservation[];
}

function formatShort(date: DateKey): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
}

export function deriveStatus(observations: LearningObservation[], released: boolean, today: DateKey): { status: GoalStatus; evidence: string; lastDate?: DateKey } {
  const relevant = observations.filter((o) => o.level !== 'not-assessable').sort((a, b) => (a.date + a.createdAt).localeCompare(b.date + b.createdAt));
  if (!relevant.length) {
    return { status: released ? 'introducing' : 'not-started', evidence: released ? 'Freigegeben, noch keine Beobachtung.' : 'Noch nicht freigegeben.' };
  }

  const successes = relevant.filter((o) => isSuccess(o.level));
  const independent = relevant.filter((o) => o.level === 'independent');
  const successDays = new Set(successes.map((o) => o.date)).size;
  const independentDays = new Set(independent.map((o) => o.date)).size;
  const lastTwo = relevant.slice(-2);
  const recentStruggle = lastTwo.length === 2 && lastTwo.every((o) => isStruggle(o.level));
  const lastDate = relevant[relevant.length - 1].date;

  let status: GoalStatus = 'practising';
  if (independent.length >= RULES.mastered.independent && independentDays >= RULES.mastered.days) status = 'mastered';
  else if (successes.length >= RULES.mostly.successes && successDays >= RULES.mostly.days) status = 'mostly';

  const lastSuccess = successes[successes.length - 1]?.date;
  if (status === 'mostly' || status === 'mastered') {
    if (recentStruggle) status = 'review';
    else if (lastSuccess && daysBetween(lastSuccess, today) > RULES.reviewAfterDays) status = 'review';
  }

  const counts: string[] = [];
  const c = (lvl: ObservationLevel) => relevant.filter((o) => o.level === lvl).length;
  if (c('independent')) counts.push(`${c('independent')}× selbstständig`);
  if (c('little-help')) counts.push(`${c('little-help')}× mit wenig Hilfe`);
  if (c('much-help')) counts.push(`${c('much-help')}× mit viel Hilfe`);
  if (c('not-yet')) counts.push(`${c('not-yet')}× noch nicht`);
  const days = new Set(relevant.map((o) => o.date)).size;
  let evidence = `${counts.join(', ')} an ${days} ${days === 1 ? 'Tag' : 'Tagen'}, zuletzt am ${formatShort(lastDate)}.`;
  if (status === 'review') {
    evidence += recentStruggle ? ' Die letzten beiden Male ging es schwerer.' : ` Seit über ${RULES.reviewAfterDays} Tagen nicht mehr geübt.`;
  }
  return { status, evidence, lastDate };
}

export function goalStates(
  childId: string, observations: LearningObservation[], releases: LearningRelease[], today: DateKey, goals: LearningGoal[] = READING_GOALS,
): GoalState[] {
  const released = new Set(releases.filter((r) => r.childId === childId && r.status === 'released').map((r) => r.goalId));
  return goals.map((goal) => {
    const obs = observations.filter((o) => o.childId === childId && o.goalId === goal.id);
    const isReleased = released.has(goal.id) || obs.length > 0;
    return { goal, released: isReleased, observations: obs, ...deriveStatus(obs, isReleased, today) };
  });
}

export const atLeastMostly = (s: GoalStatus) => s === 'mostly' || s === 'mastered' || s === 'review';

export interface Suggestion {
  kind: 'release' | 'review';
  goal: LearningGoal;
  reason: string;
}

/** Vorschläge für die Eltern. Nichts wird automatisch freigegeben. */
export function suggestions(states: GoalState[], releases: LearningRelease[], childId: string, today: DateKey): Suggestion[] {
  const byId = new Map(states.map((s) => [s.goal.id, s]));
  const postponed = new Set(releases
    .filter((r) => r.childId === childId && r.status === 'postponed' && (!r.until || r.until > today))
    .map((r) => r.goalId));
  const out: Suggestion[] = [];

  // Nächster Buchstabe in der festgelegten Reihenfolge
  const letters = LETTER_ORDER.map((id) => byId.get(id)!);
  const active = letters.filter((s) => s.status === 'introducing' || s.status === 'practising');
  const next = letters.find((s) => !s.released && !postponed.has(s.goal.id));
  if (next && active.length < RULES.maxParallelLetters) {
    const learned = letters.filter((s) => atLeastMostly(s.status)).map((s) => s.goal.letter!.upper);
    const reason = active.length === 0 && learned.length === 0
      ? 'Der erste Buchstabe im Lesepfad.'
      : active.length === 0
        ? `${listDe(learned.slice(-3))} ${learned.length === 1 ? 'sitzt' : 'sitzen'} schon weitgehend sicher.`
        : `Gerade wird nur ${active[0].goal.letter!.upper} geübt, ein zweiter Buchstabe passt dazu.`;
    out.push({ kind: 'release', goal: next.goal, reason });
  }

  // Fertigkeiten, deren Voraussetzungen erfüllt sind
  for (const s of states) {
    if (s.goal.kind !== 'skill' || s.released || postponed.has(s.goal.id)) continue;
    const reqs = s.goal.requires.map((id) => byId.get(id)!);
    if (reqs.every((r) => atLeastMostly(r.status))) {
      out.push({
        kind: 'release', goal: s.goal,
        reason: reqs.length ? `Voraussetzungen sitzen: ${listDe(reqs.map((r) => r.goal.title))}.` : 'Gehört zum Anfang des Lesepfads.',
      });
    }
  }

  for (const s of states) if (s.status === 'review') out.push({ kind: 'review', goal: s.goal, reason: s.evidence });
  return out;
}

function listDe(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} und ${items[items.length - 1]}`;
}

/** Was das Kind heute im gemeinsamen Lernblock entdecken könnte: der jüngste noch nicht sichere Buchstabe. */
export function todaysLetter(states: GoalState[]): GoalState | undefined {
  const letters = LETTER_ORDER.map((id) => states.find((s) => s.goal.id === id)!).filter((s) => s.released);
  return [...letters].reverse().find((s) => s.status === 'introducing' || s.status === 'practising')
    ?? letters.find((s) => s.status === 'review')
    ?? letters[letters.length - 1];
}

// ---------------------------------------------------------------- Lesepfad-Start

export type PathPhase =
  | { kind: 'no-date' }
  | { kind: 'upcoming'; start: DateKey; schoolEntry: DateKey; daysUntilStart: number }
  | { kind: 'active'; start: DateKey; schoolEntry: DateKey; daysUntilSchool: number }
  | { kind: 'in-school'; schoolEntry: DateKey };

/** Der Lesepfad startet je Kind ein Jahr vor dem eingetragenen Schulbeginn. */
export function pathPhase(child: ChildProfile, today: DateKey): PathPhase {
  const entry = child.schoolEntryDate;
  if (!entry || !isValidDateKey(entry)) return { kind: 'no-date' };
  const start = readingPathStart(entry);
  if (today < start) return { kind: 'upcoming', start, schoolEntry: entry, daysUntilStart: daysBetween(today, start) };
  if (today < entry) return { kind: 'active', start, schoolEntry: entry, daysUntilSchool: daysBetween(today, entry) };
  return { kind: 'in-school', schoolEntry: entry };
}

// ---------------------------------------------------------------- Schreiben

export async function addObservation(
  db: FamilyDatabase, childId: string, goalId: string, level: ObservationLevel, date: DateKey, note?: string,
  extra: { mood?: LearningMood; packId?: string } = {},
): Promise<LearningObservation> {
  if (!GOALS_BY_ID.has(goalId) && !MATH_GOALS_BY_ID.has(goalId)) throw new Error('Unbekanntes Lernziel.');
  const obs: LearningObservation = {
    id: newId('obs'), childId, goalId, date, level, note: note?.trim() || undefined, createdAt: new Date().toISOString(),
    ...(extra.mood ? { mood: extra.mood } : {}), ...(extra.packId ? { packId: extra.packId } : {}),
  };
  await db.transaction('rw', db.learningObservations, db.learningReleases, async () => {
    await db.learningObservations.add(obs);
    // Wer beobachtet wird, ist automatisch freigegeben
    const id = `${childId}|${goalId}`;
    const rel = await db.learningReleases.get(id);
    if (rel?.status !== 'released') await db.learningReleases.put({ id, childId, goalId, status: 'released', at: obs.createdAt });
  });
  return obs;
}

export async function releaseGoal(db: FamilyDatabase, childId: string, goalId: string): Promise<void> {
  await db.learningReleases.put({ id: `${childId}|${goalId}`, childId, goalId, status: 'released', at: new Date().toISOString() });
}

export async function postponeGoal(db: FamilyDatabase, childId: string, goalId: string, today: DateKey): Promise<void> {
  await db.learningReleases.put({
    id: `${childId}|${goalId}`, childId, goalId, status: 'postponed', at: new Date().toISOString(), until: addDaysKey(today, RULES.postponeDays),
  });
}

/** Freigabe zurücknehmen, solange noch nichts beobachtet wurde. Beobachtungen bleiben immer erhalten. */
export async function unreleaseGoal(db: FamilyDatabase, childId: string, goalId: string): Promise<boolean> {
  const count = await db.learningObservations.where('[childId+goalId]').equals([childId, goalId]).count();
  if (count) return false;
  await db.learningReleases.delete(`${childId}|${goalId}`);
  return true;
}

export async function deleteObservation(db: FamilyDatabase, id: string): Promise<void> {
  await db.learningObservations.delete(id);
}

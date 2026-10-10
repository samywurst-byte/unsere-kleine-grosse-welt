import { MATH_GOALS, MATH_MAX_STAGE_BEFORE_SCHOOL } from '../data/mathCurriculum';
import type { ChildProfile, DateKey, LearningObservation, LearningRelease } from '../types';
import { atLeastMostly, goalStates, pathPhase, RULES, type GoalState, type Suggestion } from './learning';

/**
 * Rechenpfad: dieselben Regeln wie beim Lesepfad (mehrere Tage, keine Automatik, Wiederholung als Vorschlag).
 * Vor der Schule nur Zahlverständnis bis Stufe 4, ab der Schule nur, wenn die Übungsblätter eingeschaltet sind.
 */

export function mathStates(childId: string, observations: LearningObservation[], releases: LearningRelease[], today: DateKey): GoalState[] {
  return goalStates(childId, observations, releases, today, MATH_GOALS);
}

export type MathPhase = 'before-school' | 'school-practice' | 'school-paused';

export function mathPhase(child: ChildProfile, today: DateKey): MathPhase {
  if (pathPhase(child, today).kind !== 'in-school') return 'before-school';
  return child.schoolPractice ? 'school-practice' : 'school-paused';
}

/** Bis zu welcher Stufe die App Vorschläge macht. */
export function mathMaxStage(child: ChildProfile, today: DateKey): number {
  const phase = mathPhase(child, today);
  return phase === 'before-school' ? MATH_MAX_STAGE_BEFORE_SCHOOL : phase === 'school-practice' ? 99 : 0;
}

const isActive = (s: GoalState) => s.status === 'introducing' || s.status === 'practising';

export function mathSuggestions(states: GoalState[], releases: LearningRelease[], child: ChildProfile, today: DateKey): Suggestion[] {
  const byId = new Map(states.map((s) => [s.goal.id, s]));
  const postponed = new Set(releases
    .filter((r) => r.childId === child.id && r.status === 'postponed' && (!r.until || r.until > today))
    .map((r) => r.goalId));
  const maxStage = mathMaxStage(child, today);
  const out: Suggestion[] = [];

  const active = states.filter(isActive);
  if (active.length < RULES.maxParallelLetters) {
    const ready = states.filter((s) => !s.released && !postponed.has(s.goal.id) && s.goal.stage <= maxStage
      && s.goal.requires.every((id) => atLeastMostly(byId.get(id)!.status)));
    for (const s of ready.slice(0, RULES.maxParallelLetters - active.length)) {
      const reqs = s.goal.requires.map((id) => byId.get(id)!.goal.title);
      const reason = s.goal.optional
        ? 'Freiwilliger Zusatz nach dem kleinen Einmaleins.'
        : reqs.length ? `Voraussetzung sitzt: ${reqs.join(', ')}.` : 'Gehört zum Anfang des Rechenpfads.';
      out.push({ kind: 'release', goal: s.goal, reason });
    }
  }
  for (const s of states) if (s.status === 'review') out.push({ kind: 'review', goal: s.goal, reason: s.evidence });
  return out;
}

/**
 * Woran das Kind gerade rechnet: freigegebene, noch nicht sichere Ziele (höchstens zwei).
 * Ist noch nichts freigegeben, das erste Ziel, das als Nächstes passt.
 */
export function currentMathGoals(states: GoalState[], child: ChildProfile, today: DateKey): GoalState[] {
  const current = states.filter((s) => s.released && (isActive(s) || s.status === 'review'));
  if (current.length) return current.slice(0, 2);
  const byId = new Map(states.map((s) => [s.goal.id, s]));
  const maxStage = Math.max(1, mathMaxStage(child, today));
  const next = states.find((s) => !atLeastMostly(s.status) && s.goal.stage <= maxStage
    && s.goal.requires.every((id) => atLeastMostly(byId.get(id)!.status)));
  return next ? [next] : [];
}

import type { FamilyDatabase } from '../database/db';
import type { HeroMissionDef } from '../data/heroWorld';
import type { AppSettings, DateKey, HeroLook, HeroMission, HeroProfile, PlayTime, Weekday } from '../types';
import { addDaysKey, weekdayOf } from '../utils/dates';

// ------------------------------------------------------------ Missionstage und Freischalten

export const DEFAULT_MISSION_DAYS: Weekday[] = [3, 6];

export const heroMissionDays = (s: Pick<AppSettings, 'heroMissionDays'> | undefined): Weekday[] => s?.heroMissionDays ?? DEFAULT_MISSION_DAYS;

export type MissionStatus = 'done' | 'progress' | 'open' | 'waiting' | 'locked';

export interface MissionState {
  status: MissionStatus;
  /** Bei 'waiting': nächster Missionstag. */
  opensOn?: DateKey;
}

export const missionId = (childId: string, mission: string) => `${childId}|${mission}`;

/** Erster Missionstag nach `after` (ausschließlich). */
export function nextMissionDay(after: DateKey, days: Weekday[]): DateKey {
  if (!days.length) return addDaysKey(after, 1);
  for (let i = 1; i <= 7; i++) {
    const d = addDaysKey(after, i);
    if (days.includes(weekdayOf(d))) return d;
  }
  return addDaysKey(after, 1);
}

/**
 * Die erste Mission ist immer offen. Jede weitere öffnet sich am nächsten Missionstag, nachdem die vorige geschafft ist,
 * und bleibt dann offen, auch wenn der Tag verpasst wurde. Ohne Missionstage öffnet sie sich sofort. Eltern können vorzeitig freigeben.
 */
export function missionStates(defs: HeroMissionDef[], records: HeroMission[], childId: string, today: DateKey, days: Weekday[]): MissionState[] {
  const mine = new Map(records.filter((r) => r.childId === childId).map((r) => [r.missionId, r]));
  return defs.map((def, i) => {
    const rec = mine.get(def.id);
    if (rec?.current) return { status: 'progress' };
    if (rec?.firstCompletedAt) return { status: 'done' };
    if (i === 0 || rec?.released) return { status: 'open' };
    const prev = mine.get(defs[i - 1].id);
    if (!prev?.firstCompletedAt) return { status: 'locked' };
    if (!days.length) return { status: 'open' };
    const opens = nextMissionDay(prev.firstCompletedAt.slice(0, 10), days);
    return opens <= today ? { status: 'open' } : { status: 'waiting', opensOn: opens };
  });
}

export const isPlayable = (s: MissionStatus) => s !== 'locked' && s !== 'waiting';

// ------------------------------------------------------------ Hilfe

/** Nach so vielen erfolglosen Versuchen fragt Momo, ob er helfen soll. */
export const HELP_AFTER: Record<HeroProfile['helpLevel'], number> = { early: 2, normal: 3, late: 5 };

export const HELP_LEVEL_TEXT: Record<HeroProfile['helpLevel'], string> = {
  early: 'Früh (nach 2 Versuchen)',
  normal: 'Normal (nach 3 Versuchen)',
  late: 'Spät (nach 5 Versuchen)',
};

export function defaultProfile(childId: string, now = new Date()): HeroProfile {
  return { childId, helpLevel: 'normal', easy: false, placeVisits: {}, updatedAt: now.toISOString() };
}

// ------------------------------------------------------------ Brückenbau

export interface Plank { start: number; len: number }

export const BRIDGE_GAP = { normal: 6, easy: 4 } as const;

export function canPlacePlank(planks: Plank[], p: Plank, gap: number): boolean {
  if (p.start < 0 || p.start + p.len > gap) return false;
  return planks.every((q) => p.start + p.len <= q.start || q.start + q.len <= p.start);
}

/** Stellt ein Brett so nah wie möglich an die gewünschte Stelle. */
export function snapPlank(planks: Plank[], wanted: number, len: number, gap: number): number | null {
  const options = Array.from({ length: gap - len + 1 }, (_, i) => i)
    .filter((s) => canPlacePlank(planks, { start: s, len }, gap))
    .sort((a, b) => Math.abs(a - wanted) - Math.abs(b - wanted));
  return options.length && Math.abs(options[0] - wanted) <= 1 ? options[0] : null;
}

export type BridgeResult = { ok: true } | { ok: false; reason: 'hole' | 'wobble'; at: number };

const supported = (x: number, gap: number, pillars: number[]) => x === 0 || x === gap || pillars.includes(x);

/** Fino läuft von links los. Er bleibt am ersten Loch stehen oder dort, wo ein Brett ohne Stütze wackelt. */
export function testBridge(gap: number, planks: Plank[], pillars: number[]): BridgeResult {
  for (let c = 0; c < gap; c++) {
    const p = planks.find((q) => q.start <= c && c < q.start + q.len);
    if (!p) return { ok: false, reason: 'hole', at: c };
    if (!supported(p.start, gap, pillars) || !supported(p.start + p.len, gap, pillars)) return { ok: false, reason: 'wobble', at: p.start };
  }
  return { ok: true };
}

export type BridgeStep = { kind: 'pillar'; at: number } | { kind: 'plank'; start: number; len: number } | { kind: 'remove'; start: number };

/** „Momo zeigt den nächsten Schritt“: ein sinnvoller nächster Bauschritt. */
export function nextBridgeStep(gap: number, planks: Plank[], pillars: number[]): BridgeStep | null {
  for (const p of [...planks].sort((a, b) => a.start - b.start)) {
    for (const x of [p.start, p.start + p.len]) if (!supported(x, gap, pillars)) return { kind: 'pillar', at: x };
  }
  for (let c = 0; c < gap; c++) {
    if (planks.some((q) => q.start <= c && c < q.start + q.len)) continue;
    let end = c;
    while (end < gap && !planks.some((q) => q.start === end)) end++;
    const width = end - c;
    if (width === 1) {
      const neighbour = planks.find((q) => q.start === end) ?? planks.find((q) => q.start + q.len === c);
      return neighbour ? { kind: 'remove', start: neighbour.start } : null;
    }
    return { kind: 'plank', start: c, len: width === 4 ? 2 : Math.min(3, width) };
  }
  return null;
}

// ------------------------------------------------------------ Speichern

async function getMission(db: FamilyDatabase, childId: string, mission: string, now: Date): Promise<HeroMission> {
  return (await db.heroMissions.get(missionId(childId, mission)))
    ?? { id: missionId(childId, mission), childId, missionId: mission, runs: 0, solutions: [], helpUsed: 0, updatedAt: now.toISOString() };
}

export async function getProfile(db: FamilyDatabase, childId: string, now = new Date()): Promise<HeroProfile> {
  return (await db.heroProfiles.get(childId)) ?? defaultProfile(childId, now);
}

export async function updateProfile(db: FamilyDatabase, childId: string, patch: Partial<Omit<HeroProfile, 'childId'>>, now = new Date()) {
  const p = await getProfile(db, childId, now);
  await db.heroProfiles.put({ ...p, ...patch, updatedAt: now.toISOString() });
}

export async function saveLook(db: FamilyDatabase, childId: string, look: Partial<HeroLook>, now = new Date()) {
  const p = await getProfile(db, childId, now);
  const base: HeroLook = p.look ?? { color: 'blue', cape: 'gold', mask: false, symbol: 'star' };
  await db.heroProfiles.put({ ...p, look: { ...base, ...look }, updatedAt: now.toISOString() });
}

/** Mission betreten: laufenden Stand behalten oder neu beginnen. Zählt den Ort für die Lieblingsorte. */
export async function enterMission(db: FamilyDatabase, childId: string, def: HeroMissionDef, now = new Date()): Promise<HeroMission> {
  return db.transaction('rw', db.heroMissions, db.heroProfiles, async () => {
    const rec = await getMission(db, childId, def.id, now);
    if (rec.current) return rec;
    const next: HeroMission = { ...rec, current: { step: 0, data: {}, startedAt: now.toISOString() }, updatedAt: now.toISOString() };
    await db.heroMissions.put(next);
    const p = await getProfile(db, childId, now);
    await db.heroProfiles.put({ ...p, placeVisits: { ...p.placeVisits, [def.place]: (p.placeVisits[def.place] ?? 0) + 1 }, updatedAt: now.toISOString() });
    return next;
  });
}

export async function saveProgress(db: FamilyDatabase, childId: string, mission: string, step: number, data: Record<string, unknown>, now = new Date()) {
  await db.transaction('rw', db.heroMissions, async () => {
    const rec = await getMission(db, childId, mission, now);
    const startedAt = rec.current?.startedAt ?? now.toISOString();
    await db.heroMissions.put({ ...rec, current: { step, data, startedAt }, updatedAt: now.toISOString() });
  });
}

export async function countHelp(db: FamilyDatabase, childId: string, mission: string, now = new Date()) {
  await db.transaction('rw', db.heroMissions, async () => {
    const rec = await getMission(db, childId, mission, now);
    await db.heroMissions.put({ ...rec, helpUsed: rec.helpUsed + 1, updatedAt: now.toISOString() });
  });
}

/** Aufgabe in der echten Welt: gemacht oder auf später. */
export async function markReal(db: FamilyDatabase, childId: string, mission: string, done: boolean, now = new Date()) {
  await db.transaction('rw', db.heroMissions, async () => {
    const rec = await getMission(db, childId, mission, now);
    await db.heroMissions.put(done
      ? { ...rec, realDoneAt: now.toISOString(), realLater: false, updatedAt: now.toISOString() }
      : { ...rec, realLater: !rec.realDoneAt, updatedAt: now.toISOString() });
  });
}

/** Mission abschließen. Gibt zurück, ob das Abzeichen neu ist. */
export async function completeMission(db: FamilyDatabase, childId: string, mission: string, solution: string | undefined, now = new Date()): Promise<boolean> {
  return db.transaction('rw', db.heroMissions, async () => {
    const rec = await getMission(db, childId, mission, now);
    const iso = now.toISOString();
    const solutions = solution && !rec.solutions.includes(solution) ? [...rec.solutions, solution] : rec.solutions;
    await db.heroMissions.put({ ...rec, current: undefined, runs: rec.runs + 1, solutions, firstCompletedAt: rec.firstCompletedAt ?? iso, completedAt: iso, updatedAt: iso });
    return !rec.firstCompletedAt;
  });
}

/** Laufenden Durchgang verwerfen und von vorn beginnen (Erfolge bleiben). */
export async function restartMission(db: FamilyDatabase, childId: string, mission: string, now = new Date()) {
  const rec = await getMission(db, childId, mission, now);
  await db.heroMissions.put({ ...rec, current: { step: 0, data: {}, startedAt: now.toISOString() }, updatedAt: now.toISOString() });
}

/** Elternbereich: Mission ganz zurücksetzen. */
export async function resetMission(db: FamilyDatabase, childId: string, mission: string) {
  await db.heroMissions.delete(missionId(childId, mission));
}

export async function setMissionRelease(db: FamilyDatabase, childId: string, mission: string, released: boolean, now = new Date()) {
  const rec = await getMission(db, childId, mission, now);
  await db.heroMissions.put({ ...rec, released, updatedAt: now.toISOString() });
}

/** Elternbereich: eigene Idee des Kindes als Lösung bestätigen. */
export async function addOwnIdea(db: FamilyDatabase, childId: string, mission: string, text: string, now = new Date()) {
  const t = text.trim();
  if (!t) return;
  const rec = await getMission(db, childId, mission, now);
  const iso = now.toISOString();
  await db.heroMissions.put({
    ...rec, ownIdeas: [...(rec.ownIdeas ?? []), { text: t, confirmedAt: iso }],
    solutions: rec.solutions.includes('own') ? rec.solutions : [...rec.solutions, 'own'], updatedAt: iso,
  });
}

// ------------------------------------------------------------ Sanfte Spielzeitgrenze

export const DEFAULT_PLAY_LIMIT = 15;

export const playLimitMinutes = (s: Pick<AppSettings, 'playLimitMinutes'> | undefined) => s?.playLimitMinutes ?? DEFAULT_PLAY_LIMIT;

export const playTimeId = (childId: string, date: DateKey) => `${childId}|${date}`;

export function isOverLimit(rec: PlayTime | undefined, limitMinutes: number): boolean {
  if (!limitMinutes || !rec) return false;
  return rec.ms >= limitMinutes * 60_000 + rec.extraMs;
}

export async function addPlayTime(db: FamilyDatabase, childId: string, date: DateKey, ms: number, now = new Date()) {
  await db.transaction('rw', db.playTimes, async () => {
    const id = playTimeId(childId, date);
    const rec = await db.playTimes.get(id);
    await db.playTimes.put({ id, childId, date, ms: (rec?.ms ?? 0) + ms, extraMs: rec?.extraMs ?? 0, updatedAt: now.toISOString() });
  });
}

/** Mama oder Papa verlängern mit PIN: ab jetzt noch einmal so lange wie die Grenze. */
export async function extendPlayTime(db: FamilyDatabase, childId: string, date: DateKey, now = new Date()) {
  await db.transaction('rw', db.playTimes, async () => {
    const id = playTimeId(childId, date);
    const rec = await db.playTimes.get(id);
    const ms = rec?.ms ?? 0;
    // Grenze liegt bei limit + extraMs. Mit extraMs = ms gibt es ab jetzt wieder die volle Zeit.
    await db.playTimes.put({ id, childId, date, ms, extraMs: Math.max(rec?.extraMs ?? 0, ms), updatedAt: now.toISOString() });
  });
}

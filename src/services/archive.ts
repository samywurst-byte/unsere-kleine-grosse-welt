import { DISCOVER_TOPICS } from '../data/discover';
import { EXPLORER_MODULE_BY_ID } from '../data/explorerModules';
import { MATH_GOALS_BY_ID } from '../data/mathCurriculum';
import { GOALS_BY_ID } from '../data/readingCurriculum';
import type {
  ChildProfile, Country, CountryUnlock, DateKey, ExplorerEntry, FamilyCouncilNote, FamilyMemory, FamilyProject, FamilyRitual, FamilyTimeSession,
  Id, JarQuestion, LearningObservation, Member, PassportStamp, SavingsGoal, WeekendAdventure, Discovery,
} from '../types';
import { atLeastMostly, deriveStatus } from './learning';
import { isMamaTime, memoryPhotos } from './familyTime';

/**
 * Familienarchiv: sammelt, was schon an anderen Stellen der App festgehalten ist, in einer Zeitleiste.
 * Es legt nichts Neues an und verändert nichts. Rein und deterministisch, damit es gut testbar bleibt.
 */

export type ArchiveKind = 'memory' | 'adventure' | 'project' | 'explorer' | 'ritual' | 'council' | 'world' | 'learning' | 'money' | 'question' | 'discovery';

export const ARCHIVE_KINDS: { id: ArchiveKind; label: string; emoji: string }[] = [
  { id: 'memory', label: 'Erinnerungen', emoji: '💛' },
  { id: 'adventure', label: 'Abenteuer', emoji: '🥾' },
  { id: 'project', label: 'Projekte', emoji: '🛠️' },
  { id: 'explorer', label: 'Entdeckerbuch', emoji: '🔭' },
  { id: 'ritual', label: 'Rituale', emoji: '🍂' },
  { id: 'council', label: 'Familienrat', emoji: '🗣️' },
  { id: 'world', label: 'Weltreise', emoji: '🌍' },
  { id: 'learning', label: 'Gelernt', emoji: '✏️' },
  { id: 'money', label: 'Sparziele', emoji: '🐷' },
  { id: 'question', label: 'Frageglas', emoji: '❓' },
  { id: 'discovery', label: 'Forscheraufträge', emoji: '🔍' },
];
export const ARCHIVE_KIND = new Map(ARCHIVE_KINDS.map((k) => [k.id, k]));

export interface ArchiveItem {
  id: string;
  date: DateKey;
  kind: ArchiveKind;
  title: string;
  emoji: string;
  text?: string;
  /** Wortwörtliche Sätze, z. B. aus dem Entdeckerbuch oder dem Familienrat. */
  quotes: { memberId?: Id; text: string }[];
  photos: string[];
  /** Beteiligte Familienmitglieder (für den Filter je Kind). */
  memberIds: Id[];
  /** Wo es in der App weitergeht. */
  link?: string;
}

export interface ArchiveSource {
  members: Member[];
  memories: FamilyMemory[];
  projects: FamilyProject[];
  explorerEntries: ExplorerEntry[];
  adventures: WeekendAdventure[];
  rituals: FamilyRitual[];
  councilNotes: FamilyCouncilNote[];
  countries: Country[];
  unlocks: CountryUnlock[];
  stamps: PassportStamp[];
  observations: LearningObservation[];
  savingsGoals: SavingsGoal[];
  questions: JarQuestion[];
  discoveries: Discovery[];
  sessions: FamilyTimeSession[];
}

const dateOf = (iso: string) => iso.slice(0, 10);
const uniq = <T>(xs: T[]) => [...new Set(xs)];
const childIdsOf = (members: Member[]) => members.filter((m) => m.role === 'child').map((m) => m.id);

/** Datum, an dem ein Ziel zum ersten Mal „weitgehend sicher“ war (Beobachtungen nacheinander nachgespielt). */
export function securedOn(observations: LearningObservation[]): DateKey | undefined {
  const sorted = [...observations].sort((a, b) => (a.date + a.createdAt).localeCompare(b.date + b.createdAt));
  for (const date of uniq(sorted.map((o) => o.date))) {
    const upTo = sorted.filter((o) => o.date <= date);
    if (atLeastMostly(deriveStatus(upTo, true, date).status)) return date;
  }
  return undefined;
}

const goalTitle = (id: string) => (GOALS_BY_ID.get(id) ?? MATH_GOALS_BY_ID.get(id))?.title;

/** Alles Festgehaltene als Einträge, neueste zuerst. */
export function buildArchive(src: ArchiveSource): ArchiveItem[] {
  const items: ArchiveItem[] = [];
  const memoryById = new Map(src.memories.map((m) => [m.id, m]));
  const used = new Set<Id>();
  const kids = childIdsOf(src.members);
  const memoryFor = (id?: Id) => {
    const m = id ? memoryById.get(id) : undefined;
    if (m) used.add(m.id);
    return m;
  };
  const memoryBySource = (kind: NonNullable<FamilyMemory['source']>['kind'], id: Id) => {
    const m = src.memories.find((x) => x.source?.kind === kind && x.source.id === id);
    if (m) used.add(m.id);
    return m;
  };

  // Projekte
  for (const p of src.projects) {
    if (p.status !== 'done') continue;
    const mem = memoryFor(p.memoryId) ?? memoryBySource('project', p.id);
    const photos = uniq([...p.entries.flatMap((e) => e.photos), ...(mem ? memoryPhotos(mem) : [])]);
    const notes = p.entries.map((e) => e.text?.trim()).filter((t): t is string => !!t);
    items.push({
      id: `project|${p.id}`, date: p.doneAt ?? p.updatedAt.slice(0, 10), kind: 'project', emoji: p.emoji,
      title: p.title, text: p.reflection ?? mem?.text, quotes: notes.slice(0, 3).map((text) => ({ text })),
      photos, memberIds: p.childIds, link: `/projekte/${p.id}`,
    });
  }

  // Entdeckerbuch
  for (const e of src.explorerEntries) {
    const m = EXPLORER_MODULE_BY_ID.get(e.moduleId);
    const mem = memoryFor(e.memoryId) ?? memoryBySource('explorer', e.id);
    const text = [e.favorite?.trim() && `Lieblingsmoment: ${e.favorite.trim()}`, e.remember?.trim() && `Das möchten wir uns merken: ${e.remember.trim()}`].filter(Boolean).join('\n');
    items.push({
      id: `explorer|${e.id}`, date: e.date, kind: 'explorer', emoji: e.kind === 'home' ? '🔭' : '🏛️',
      title: m ? (e.kind === 'home' ? m.title : `Ausflug: ${m.trip.place}`) : 'Entdeckersonntag',
      ...(text ? { text } : {}), quotes: e.sentences.map((s) => ({ memberId: s.childId, text: s.text })),
      photos: uniq([...e.photos, ...(mem ? memoryPhotos(mem) : [])]),
      memberIds: uniq([...e.sentences.map((s) => s.childId), ...(mem?.memberIds ?? [])]), link: `/entdecken/sonntage/${e.moduleId}`,
    });
  }

  // Wochenendabenteuer
  for (const a of src.adventures) {
    if (a.status !== 'done') continue;
    const mem = memoryBySource('adventure', a.id);
    items.push({
      id: `adventure|${a.id}`, date: a.day ?? a.weekend, kind: 'adventure', emoji: a.emoji, title: mem?.title ?? a.title,
      ...(mem?.text ? { text: mem.text } : {}), quotes: [], photos: mem ? memoryPhotos(mem) : [],
      memberIds: mem?.memberIds ?? src.members.filter((m) => m.active).map((m) => m.id), link: '/familienzeit/abenteuer',
    });
  }

  // Übrige Erinnerungen
  for (const m of src.memories) {
    if (used.has(m.id)) continue;
    items.push({
      id: `memory|${m.id}`, date: m.date, kind: 'memory', emoji: '💛', title: m.title, ...(m.text ? { text: m.text } : {}),
      quotes: [], photos: memoryPhotos(m), memberIds: m.memberIds, link: '/familienzeit/erinnerungen',
    });
  }

  // Jahreszeitenrituale
  for (const r of src.rituals) {
    if (r.status !== 'done' || !r.date) continue;
    items.push({
      id: `ritual|${r.id}`, date: r.date, kind: 'ritual', emoji: r.emoji, title: r.title, ...(r.note ? { text: r.note } : {}),
      quotes: [], photos: [], memberIds: src.members.filter((m) => m.active).map((m) => m.id), link: '/familienzeit/rituale',
    });
  }

  // Familienrat: nur, wenn etwas festgehalten wurde
  for (const n of src.councilNotes) {
    const highlights = Object.entries(n.highlights ?? {}).filter(([, t]) => t.trim()).map(([memberId, t]) => ({ memberId, text: t.trim() }));
    const decisions = (n.decisions ?? []).map((d) => d.text.trim()).filter(Boolean);
    const older = [n.beautiful && `Schön: ${n.beautiful}`, n.difficult && `Schwierig: ${n.difficult}`, n.lookingForward && `Vorfreude: ${n.lookingForward}`].filter(Boolean);
    if (!highlights.length && !decisions.length && !older.length) continue;
    const text = [...older, ...(decisions.length ? [`Beschlossen: ${decisions.join(' · ')}`] : [])].join('\n');
    items.push({
      id: `council|${n.id}`, date: n.date, kind: 'council', emoji: '🗣️', title: 'Familienrat', ...(text ? { text } : {}),
      quotes: highlights, photos: [], memberIds: uniq(highlights.map((h) => h.memberId)), link: '/familienzeit/familienrat',
    });
  }

  // Weltreise
  const countryById = new Map(src.countries.map((c) => [c.id, c]));
  for (const u of src.unlocks) {
    const c = countryById.get(u.countryId);
    if (!c) continue;
    const stamped = src.stamps.filter((s) => s.countryId === c.id).map((s) => s.childId);
    items.push({
      id: `world|${c.id}`, date: dateOf(u.unlockedAt), kind: 'world', emoji: c.flagEmoji, title: `Weltreise: ${c.nameDe}`,
      text: `${c.greeting.word} heißt Hallo auf ${c.greeting.language}. Hauptstadt: ${c.capital}.`,
      quotes: [], photos: [], memberIds: stamped.length ? uniq(stamped) : kids, link: '/weltreise',
    });
  }

  // Gelernt: je Kind und Monat ein Eintrag mit allem, was neu „weitgehend sicher“ ist
  const byChildGoal = new Map<string, LearningObservation[]>();
  for (const o of src.observations) {
    const k = `${o.childId}|${o.goalId}`;
    byChildGoal.set(k, [...(byChildGoal.get(k) ?? []), o]);
  }
  const learned = new Map<string, { childId: Id; date: DateKey; titles: string[] }>();
  for (const [k, obs] of byChildGoal) {
    const [childId, goalId] = k.split('|');
    const title = goalTitle(goalId);
    const date = securedOn(obs);
    if (!title || !date) continue;
    const key = `${childId}|${date.slice(0, 7)}`;
    const g = learned.get(key) ?? { childId, date, titles: [] };
    g.titles.push(title);
    if (date > g.date) g.date = date;
    learned.set(key, g);
  }
  const memberById = new Map(src.members.map((m) => [m.id, m]));
  for (const [key, g] of learned) {
    const name = memberById.get(g.childId)?.name ?? 'Kind';
    items.push({
      id: `learning|${key}`, date: g.date, kind: 'learning', emoji: '✏️', title: `${name} kann jetzt sicher`,
      text: g.titles.join(' · '), quotes: [], photos: [], memberIds: [g.childId], link: `/lernen/${g.childId}`,
    });
  }

  // Sparziele
  for (const s of src.savingsGoals) {
    if (!s.doneAt) continue;
    items.push({
      id: `money|${s.id}`, date: s.doneAt, kind: 'money', emoji: s.emoji, title: `Sparziel erreicht: ${s.title}`,
      quotes: [], photos: [], memberIds: [s.childId], link: `/geld/${s.childId}`,
    });
  }

  // Frageglas: beantwortete Fragen
  for (const q of src.questions) {
    if (!q.answer?.trim() || !q.answeredAt) continue;
    items.push({
      id: `question|${q.id}`, date: q.answeredAt, kind: 'question', emoji: '❓', title: q.question,
      text: `Antwort: ${q.answer.trim()}${q.source?.trim() ? ` (Quelle: ${q.source.trim()})` : ''}`,
      quotes: [], photos: [], memberIds: q.childId ? [q.childId] : [], link: '/entdecken/frageglas',
    });
  }

  // Forscheraufträge: je Thema und Tag einer
  const topicById = new Map(DISCOVER_TOPICS.map((t) => [t.id, t]));
  const byTopicDay = new Map<string, Discovery[]>();
  for (const d of src.discoveries) {
    const k = `${d.topicId}|${d.date}`;
    byTopicDay.set(k, [...(byTopicDay.get(k) ?? []), d]);
  }
  for (const [k, ds] of byTopicDay) {
    const t = topicById.get(ds[0].topicId);
    if (!t) continue;
    const titles = ds.map((d) => t.missions.find((m) => m.id === d.missionId)?.title).filter((x): x is string => !!x);
    items.push({
      id: `discovery|${k}`, date: ds[0].date, kind: 'discovery', emoji: t.emoji, title: `Forscherauftrag: ${t.title}`,
      ...(titles.length ? { text: titles.join(' · ') } : {}), quotes: [], photos: [], memberIds: kids, link: `/entdecken/${t.id}`,
    });
  }

  return items.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

// ------------------------------------------------------------- Suchen und Filtern

export interface ArchiveFilter {
  memberId?: Id;
  kinds?: ArchiveKind[];
  year?: number;
  query?: string;
  onlyPhotos?: boolean;
}

const norm = (s: string) => s.toLocaleLowerCase('de-DE').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');

/** Volltextsuche: alle Wörter müssen irgendwo vorkommen (Titel, Text, Sätze, Namen). */
export function matchesQuery(item: ArchiveItem, query: string, members: Pick<Member, 'id' | 'name'>[] = []): boolean {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const names = item.memberIds.map((id) => members.find((m) => m.id === id)?.name ?? '');
  const hay = norm([item.title, item.text ?? '', ...item.quotes.map((q) => q.text), ARCHIVE_KIND.get(item.kind)?.label ?? '', ...names].join(' '));
  return words.every((w) => hay.includes(w));
}

export function filterArchive(items: ArchiveItem[], f: ArchiveFilter, members: Pick<Member, 'id' | 'name'>[] = []): ArchiveItem[] {
  return items.filter((i) =>
    (!f.memberId || i.memberIds.includes(f.memberId)) &&
    (!f.kinds?.length || f.kinds.includes(i.kind)) &&
    (!f.year || i.date.startsWith(`${f.year}-`)) &&
    (!f.onlyPhotos || i.photos.length > 0) &&
    (!f.query || matchesQuery(i, f.query, members)));
}

export const archiveYears = (items: ArchiveItem[]): number[] => uniq(items.map((i) => Number(i.date.slice(0, 4)))).sort((a, b) => b - a);

/** Nach Monaten gruppiert, z. B. "2026-10". */
export function byMonth(items: ArchiveItem[]): { month: string; items: ArchiveItem[] }[] {
  const out: { month: string; items: ArchiveItem[] }[] = [];
  for (const i of items) {
    const month = i.date.slice(0, 7);
    const last = out[out.length - 1];
    if (last?.month === month) last.items.push(i); else out.push({ month, items: [i] });
  }
  return out;
}

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
export const monthLabel = (month: string) => `${MONTHS[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;

// ------------------------------------------------------------- Jahresrückblick

export interface ChildYear {
  child: ChildProfile;
  mamaTimes: number;
  papaTimes: number;
  learned: string[];
  projects: string[];
  stamps: number;
  quotes: { date: DateKey; text: string }[];
  savings: string[];
}

export interface YearReview {
  year: number;
  counts: { kind: ArchiveKind; count: number }[];
  photos: number;
  /** Bis zu 12 Fotos, über das Jahr verteilt. */
  photoPicks: { photo: string; title: string; date: DateKey }[];
  highlights: ArchiveItem[];
  children: ChildYear[];
}

/** Gleichmäßig verteilt auswählen, damit nicht alle Fotos vom selben Tag stammen. */
function spread<T>(xs: T[], n: number): T[] {
  if (xs.length <= n) return xs;
  return Array.from({ length: n }, (_, i) => xs[Math.floor((i * xs.length) / n)]);
}

export function yearReview(items: ArchiveItem[], src: Pick<ArchiveSource, 'sessions' | 'stamps' | 'members'>, year: number): YearReview {
  const inYear = items.filter((i) => i.date.startsWith(`${year}-`)).sort((a, b) => a.date.localeCompare(b.date));
  const counts = ARCHIVE_KINDS.map((k) => ({ kind: k.id, count: inYear.filter((i) => i.kind === k.id).length })).filter((c) => c.count > 0);
  const withPhotos = inYear.filter((i) => i.photos.length);
  const photoPicks = spread(withPhotos, 12).map((i) => ({ photo: i.photos[0], title: i.title, date: i.date }));
  const highlights = inYear.filter((i) => ['project', 'explorer', 'adventure', 'world', 'memory'].includes(i.kind) && (i.photos.length || i.quotes.length || i.kind === 'world'));
  const sessions = src.sessions.filter((s) => s.date.startsWith(`${year}-`));
  const children = src.members.filter((m): m is ChildProfile => m.role === 'child' && m.active).map((child) => ({
    child,
    mamaTimes: sessions.filter((s) => s.childId === child.id && isMamaTime(s)).length,
    papaTimes: sessions.filter((s) => s.childId === child.id && !isMamaTime(s)).length,
    learned: inYear.filter((i) => i.kind === 'learning' && i.memberIds.includes(child.id)).flatMap((i) => (i.text ?? '').split(' · ')).filter(Boolean),
    projects: inYear.filter((i) => i.kind === 'project' && i.memberIds.includes(child.id)).map((i) => i.title),
    stamps: src.stamps.filter((s) => s.childId === child.id && s.stampedAt.startsWith(`${year}-`)).length,
    quotes: inYear.flatMap((i) => i.quotes.filter((q) => q.memberId === child.id).map((q) => ({ date: i.date, text: q.text }))),
    savings: inYear.filter((i) => i.kind === 'money' && i.memberIds.includes(child.id)).map((i) => i.title.replace('Sparziel erreicht: ', '')),
  }));
  return { year, counts, photos: withPhotos.reduce((n, i) => n + i.photos.length, 0), photoPicks, highlights, children };
}

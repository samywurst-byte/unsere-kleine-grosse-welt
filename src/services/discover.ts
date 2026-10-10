import type { FamilyDatabase } from '../database/db';
import type { DiscoverTopic } from '../data/discover';
import type { DateKey, Discovery } from '../types';
import { canRead } from './projects';

/** Entdeckerbibliothek: Forscheraufträge abhaken, Lesewörter je Kind, Vorlesen. */

export const discoveryId = (topicId: string, missionId: string) => `${topicId}|${missionId}`;

export async function toggleDiscovery(db: FamilyDatabase, topicId: string, missionId: string, date: DateKey): Promise<void> {
  const id = discoveryId(topicId, missionId);
  if (await db.discoveries.get(id)) await db.discoveries.delete(id);
  else await db.discoveries.put({ id, topicId, missionId, date });
}

export function topicProgress(topic: DiscoverTopic, discoveries: Discovery[]): { done: number; total: number } {
  const done = new Set(discoveries.filter((d) => d.topicId === topic.id).map((d) => d.missionId));
  return { done: topic.missions.filter((m) => done.has(m.id)).length, total: topic.missions.length };
}

/** Wörter zum Thema, die ein Kind mit seinen sicheren Buchstaben schon lesen kann. */
export function readableWords(words: string[], known: string[]): string[] {
  return words.filter((w) => canRead(w, known));
}

/** Vorlesen mit der deutschen Stimme des iPads (geht auch offline). */
export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

export function speak(text: string): void {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  u.rate = 0.9;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('de'));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

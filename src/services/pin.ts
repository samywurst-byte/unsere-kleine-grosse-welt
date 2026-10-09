import type { FamilyDatabase } from '../database/db';
import type { ParentAuth } from '../types';

/**
 * Lokale Eltern-PIN. Gespeichert wird nur ein PBKDF2-Hash mit zufälligem Salt.
 * Die PIN ist eine Zugangshürde für Kinderhände, kein Ersatz für Gerätesicherheit.
 */
export const PIN_ITERATIONS = 150_000;
export const MAX_FREE_ATTEMPTS = 4;

export function isValidPinFormat(pin: string): boolean {
  return /^\d{4,8}$/.test(pin);
}

function toBase64(bytes: Uint8Array): string {
  let s = '';
  bytes.forEach((b) => { s += String.fromCharCode(b); });
  return btoa(s);
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export async function hashPin(pin: string, salt: Uint8Array, iterations = PIN_ITERATIONS): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations }, key, 256,
  );
  return toBase64(new Uint8Array(bits));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isPinSet(db: FamilyDatabase): Promise<boolean> {
  return !!(await db.parentAuth.get('parent'));
}

export async function setPin(db: FamilyDatabase, pin: string, iterations = PIN_ITERATIONS): Promise<void> {
  if (!isValidPinFormat(pin)) throw new Error('Die PIN muss aus 4 bis 8 Ziffern bestehen.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const auth: ParentAuth = {
    id: 'parent', hash: await hashPin(pin, salt, iterations), salt: toBase64(salt), iterations,
    failedAttempts: 0, updatedAt: new Date().toISOString(),
  };
  await db.parentAuth.put(auth);
}

/** Wartezeit nach wiederholten Fehlversuchen: 30 s, 60 s, 120 s ... höchstens 15 Minuten. */
export function lockoutMs(failedAttempts: number): number {
  if (failedAttempts <= MAX_FREE_ATTEMPTS) return 0;
  return Math.min(15 * 60_000, 30_000 * 2 ** (failedAttempts - MAX_FREE_ATTEMPTS - 1));
}

export type PinCheck =
  | { ok: true }
  | { ok: false; reason: 'locked'; lockedUntil: number }
  | { ok: false; reason: 'wrong'; lockedUntil?: number }
  | { ok: false; reason: 'not-set' };

export async function verifyPin(db: FamilyDatabase, pin: string, now = Date.now()): Promise<PinCheck> {
  const auth = await db.parentAuth.get('parent');
  if (!auth) return { ok: false, reason: 'not-set' };
  if (auth.lockedUntil && auth.lockedUntil > now) return { ok: false, reason: 'locked', lockedUntil: auth.lockedUntil };

  const hash = await hashPin(pin, fromBase64(auth.salt), auth.iterations);
  if (constantTimeEqual(hash, auth.hash)) {
    await db.parentAuth.update('parent', { failedAttempts: 0, lockedUntil: undefined });
    return { ok: true };
  }
  const failedAttempts = auth.failedAttempts + 1;
  const wait = lockoutMs(failedAttempts);
  const lockedUntil = wait ? now + wait : undefined;
  await db.parentAuth.update('parent', { failedAttempts, lockedUntil });
  return { ok: false, reason: 'wrong', lockedUntil };
}

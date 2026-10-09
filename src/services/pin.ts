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
  const previous = await db.parentAuth.get('parent');
  const auth: ParentAuth = {
    id: 'parent', hash: await hashPin(pin, salt, iterations), salt: toBase64(salt), iterations,
    failedAttempts: 0, updatedAt: new Date().toISOString(),
    // Ein vorhandener Notfallcode bleibt beim PIN-Wechsel gültig.
    recoveryHash: previous?.recoveryHash, recoverySalt: previous?.recoverySalt, recoveryCreatedAt: previous?.recoveryCreatedAt,
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

// ---------------------------------------------------------------- Notfallcode

/** Ohne leicht verwechselbare Zeichen (0/O, 1/I/L). */
const RECOVERY_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const RECOVERY_LENGTH = 12;

export function normalizeRecoveryCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function formatRecoveryCode(code: string): string {
  return normalizeRecoveryCode(code).match(/.{1,4}/g)?.join('-') ?? '';
}

/**
 * Erzeugt einen neuen Notfallcode und ersetzt einen alten. Der Code wird nur einmal angezeigt;
 * gespeichert wird lediglich sein Hash. Mit ihm lässt sich eine vergessene PIN neu setzen.
 */
export async function createRecoveryCode(db: FamilyDatabase, iterations = PIN_ITERATIONS): Promise<string> {
  const auth = await db.parentAuth.get('parent');
  if (!auth) throw new Error('Bitte zuerst eine PIN festlegen.');
  const bytes = crypto.getRandomValues(new Uint8Array(RECOVERY_LENGTH));
  const code = Array.from(bytes, (b) => RECOVERY_ALPHABET[b % RECOVERY_ALPHABET.length]).join('');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  await db.parentAuth.update('parent', {
    recoveryHash: await hashPin(code, salt, iterations), recoverySalt: toBase64(salt), recoveryCreatedAt: new Date().toISOString(),
  });
  return formatRecoveryCode(code);
}

export type RecoveryCheck =
  | { ok: true }
  | { ok: false; reason: 'no-code' | 'not-set' }
  | { ok: false; reason: 'locked' | 'wrong'; lockedUntil?: number };

/**
 * Setzt mit dem Notfallcode eine neue PIN. Fehlversuche zählen in dieselbe Sperre wie bei der PIN.
 * Nach erfolgreicher Verwendung ist der Code verbraucht und sollte neu erstellt werden.
 */
export async function resetPinWithRecoveryCode(
  db: FamilyDatabase, code: string, newPin: string, now = Date.now(),
): Promise<RecoveryCheck> {
  if (!isValidPinFormat(newPin)) throw new Error('Die PIN muss aus 4 bis 8 Ziffern bestehen.');
  const auth = await db.parentAuth.get('parent');
  if (!auth) return { ok: false, reason: 'not-set' };
  if (!auth.recoveryHash || !auth.recoverySalt) return { ok: false, reason: 'no-code' };
  if (auth.lockedUntil && auth.lockedUntil > now) return { ok: false, reason: 'locked', lockedUntil: auth.lockedUntil };

  const hash = await hashPin(normalizeRecoveryCode(code), fromBase64(auth.recoverySalt), auth.iterations);
  if (!constantTimeEqual(hash, auth.recoveryHash)) {
    const failedAttempts = auth.failedAttempts + 1;
    const wait = lockoutMs(failedAttempts);
    const lockedUntil = wait ? now + wait : undefined;
    await db.parentAuth.update('parent', { failedAttempts, lockedUntil });
    return { ok: false, reason: 'wrong', lockedUntil };
  }
  await setPin(db, newPin, auth.iterations);
  await db.parentAuth.update('parent', { recoveryHash: undefined, recoverySalt: undefined, recoveryCreatedAt: undefined });
  return { ok: true };
}

import { describe, expect, it } from 'vitest';
import { isPinSet, isValidPinFormat, lockoutMs, setPin, verifyPin } from '../src/services/pin';
import { openDb } from './helpers';

describe('Eltern-PIN', () => {
  it('gibt es nach dem ersten Start nicht und wird nie im Klartext gespeichert', async () => {
    const db = await openDb();
    expect(await isPinSet(db)).toBe(false);
    await setPin(db, '4711', 1000);
    const stored = JSON.stringify(await db.parentAuth.get('parent'));
    expect(stored).not.toContain('4711');
    expect((await verifyPin(db, '4711')).ok).toBe(true);
    expect((await verifyPin(db, '1234')).ok).toBe(false);
  });

  it('lässt nur 4 bis 8 Ziffern zu', () => {
    expect(isValidPinFormat('123')).toBe(false);
    expect(isValidPinFormat('12a4')).toBe(false);
    expect(isValidPinFormat('123456')).toBe(true);
  });

  it('sperrt nach wiederholten Fehlversuchen, auch für die richtige PIN', async () => {
    const db = await openDb();
    await setPin(db, '2580', 1000);
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) await verifyPin(db, '0000', now);
    const locked = await verifyPin(db, '2580', now + 1000);
    expect(locked).toMatchObject({ ok: false, reason: 'locked' });
    expect((await verifyPin(db, '2580', now + 31_000)).ok).toBe(true);
    expect((await db.parentAuth.get('parent'))?.failedAttempts).toBe(0);
  });

  it('verlängert die Wartezeit schrittweise bis höchstens 15 Minuten', () => {
    expect(lockoutMs(4)).toBe(0);
    expect(lockoutMs(5)).toBe(30_000);
    expect(lockoutMs(6)).toBe(60_000);
    expect(lockoutMs(30)).toBe(15 * 60_000);
  });
});

import { describe, expect, it } from 'vitest';
import { timeInWords } from '../src/utils/timePhrase';

describe('Uhrzeit in Worten', () => {
  it('erklärt volle, halbe und Viertelstunden', () => {
    expect(timeInWords(15, 0)).toBe('drei Uhr');
    expect(timeInWords(13, 1)).toBe('ein Uhr');
    expect(timeInWords(15, 15)).toBe('Viertel nach drei');
    expect(timeInWords(15, 30)).toBe('halb vier');
    expect(timeInWords(15, 45)).toBe('Viertel vor vier');
    expect(timeInWords(11, 58)).toBe('zwölf Uhr');
    expect(timeInWords(23, 30)).toBe('halb zwölf');
  });
});

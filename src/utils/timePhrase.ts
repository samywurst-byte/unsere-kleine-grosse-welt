/** Deutsche Uhrzeit in Worten für den Lernmodus der Uhr, auf 5 Minuten gerundet. */
const HOURS = ['zwölf', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf'];

export function timeInWords(hours: number, minutes: number): string {
  let m = Math.round(minutes / 5) * 5;
  let h = hours;
  if (m === 60) { m = 0; h += 1; }
  const cur = HOURS[h % 12];
  const next = HOURS[(h + 1) % 12];
  switch (m) {
    case 0: return `${cur === 'eins' ? 'ein' : cur} Uhr`;
    case 5: return `fünf nach ${cur}`;
    case 10: return `zehn nach ${cur}`;
    case 15: return `Viertel nach ${cur}`;
    case 20: return `zwanzig nach ${cur}`;
    case 25: return `fünf vor halb ${next}`;
    case 30: return `halb ${next}`;
    case 35: return `fünf nach halb ${next}`;
    case 40: return `zwanzig vor ${next}`;
    case 45: return `Viertel vor ${next}`;
    case 50: return `zehn vor ${next}`;
    default: return `fünf vor ${next}`;
  }
}

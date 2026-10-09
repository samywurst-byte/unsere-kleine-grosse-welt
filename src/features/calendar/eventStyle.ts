import type { CalendarEvent, EventOccurrence } from '../../types';

export function eventIcon(e: CalendarEvent): string {
  const t = e.title.toLowerCase();
  if (e.category === 'birthday') return 'cake';
  if (t.includes('oma')) return 'car';
  if (t.includes('turnen')) return 'dumbbell';
  if (t.includes('fußball') || t.includes('fussball')) return 'ball';
  if (t.includes('krav')) return 'shield';
  if (t.includes('robin')) return 'tv';
  if (t.includes('haushalt')) return 'house';
  if (e.category === 'holiday') return 'sun';
  if (e.category === 'family') return 'users';
  return 'star';
}

export function eventTone(e: CalendarEvent): string {
  switch (e.category) {
    case 'birthday': return 'gold';
    case 'holiday': return 'sky';
    case 'family': return 'sage';
    case 'info': return 'lavender';
    default: return 'terracotta';
  }
}

export function occurrenceTimeLabel(o: EventOccurrence): string {
  if (o.startTime && o.endTime) return `${o.startTime}–${o.endTime}`;
  if (o.startTime) return o.startTime;
  if (o.departureTime) return `Abfahrt ${o.departureTime}`;
  return 'ganztägig';
}

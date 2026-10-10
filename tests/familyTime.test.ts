import { describe, expect, it } from 'vitest';
import { ADVENTURE_IDEA_BY_ID } from '../src/data/familyTime';
import { exportData, validateBackup } from '../src/services/backup';
import {
  addDecision, addMemory, adventureView, councilAgenda, councilDate, decisionToEvent, draftAdventure, prepOpen, recordMamaTime,
  saveAdventure, saveCouncilAgenda, setAdventureStatus, suggestIdeas, updateCouncil, weekendOf,
} from '../src/services/familyTime';
import type { WeekendAdventure } from '../src/types';
import { openDb } from './helpers';

const at = (s: string) => new Date(s);

describe('Wochenendabenteuer', () => {
  it('gehört zum Wochenende ab Freitag', () => {
    expect(weekendOf('2026-10-07')).toBe('2026-10-09'); // Mittwoch
    expect(weekendOf('2026-10-09')).toBe('2026-10-09'); // Freitag
    expect(weekendOf('2026-10-11')).toBe('2026-10-09'); // Sonntag
  });

  it('erscheint ab Freitag 12:30 und erinnert sonntags ab 16 Uhr freundlich', () => {
    expect(adventureView(at('2026-10-09T12:00'), undefined)).toBe('later');
    expect(adventureView(at('2026-10-09T12:30'), undefined)).toBe('plan');
    expect(adventureView(at('2026-10-11T15:59'), undefined)).toBe('plan');
    expect(adventureView(at('2026-10-11T16:00'), undefined)).toBe('reminder');
  });

  it('gilt nach der geplanten Zeit nicht automatisch als gemacht', () => {
    const adv = { ...draftAdventure('2026-10-09', ADVENTURE_IDEA_BY_ID.get('forest')!), day: '2026-10-10', time: '15:00' };
    expect(adventureView(at('2026-10-10T14:00'), adv)).toBe('planned');
    expect(adventureView(at('2026-10-10T15:30'), adv)).toBe('confirm');
    expect(prepOpen(adv)).toBe(true);
    expect(prepOpen({ ...adv, packing: adv.packing.map((p) => ({ ...p, done: true })) })).toBe(false);
  });

  it('speichert Status mit Begründung und schlägt Verschobenes wieder vor', async () => {
    const db = await openDb();
    await saveAdventure(db, { ...draftAdventure('2026-10-09', ADVENTURE_IDEA_BY_ID.get('lantern')!), day: '2026-10-10' });
    await setAdventureStatus(db, '2026-10-09', 'postponed', 'Talisa ist erkältet');
    const saved = (await db.weekendAdventures.get('2026-10-09'))!;
    expect(saved.status).toBe('postponed');
    expect(saved.reason).toBe('Talisa ist erkältet');
    expect(adventureView(at('2026-10-10T10:00'), saved)).toBe('postponed');
    const ideas = suggestIdeas('2026-10-14', [saved]);
    expect(ideas[0].id).toBe('lantern');
    expect(ideas.every((i) => !i.months.length || i.months.includes(10))).toBe(true);
  });

  it('schiebt kürzlich gemachte Ideen nach hinten', () => {
    const done = (weekend: string, ideaId: string): WeekendAdventure => ({ ...draftAdventure(weekend, ADVENTURE_IDEA_BY_ID.get(ideaId)!), status: 'done' });
    const ideas = suggestIdeas('2026-10-14', [done('2026-10-09', 'forest')], 20);
    expect(ideas[ideas.length - 1].id).toBe('forest');
  });
});

describe('Mama-Zeit, Familienrat und Erinnerungen', () => {
  it('hält Mama-Zeit einmal pro Kind und Tag fest', async () => {
    const db = await openDb();
    await recordMamaTime(db, 'child-1', '2026-10-10', 'read', 10);
    await recordMamaTime(db, 'child-1', '2026-10-10', 'draw');
    const all = await db.familyTimeSessions.toArray();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ activity: 'draw', minutes: 10 });
  });

  it('Familienrat: Tagesordnung änderbar, Beschluss wird Termin', async () => {
    const db = await openDb();
    expect(councilDate('2026-10-10')).toBe('2026-10-11');
    expect(councilAgenda(await db.settings.get('app'))).toHaveLength(6);
    await saveCouncilAgenda(db, ['Schönstes Erlebnis', ' ', 'Wünsche']);
    expect(councilAgenda(await db.settings.get('app'))).toEqual(['Schönstes Erlebnis', 'Wünsche']);

    await updateCouncil(db, '2026-10-11', (n) => addDecision({ ...n, highlights: { 'child-1': 'Laternenumzug' } }, 'Samstag Zoo'));
    const note = (await db.familyCouncilNotes.get('2026-10-11'))!;
    const event = await decisionToEvent(db, '2026-10-11', note.decisions![0], { date: '2026-10-17', time: '10:00' });
    expect(event).toMatchObject({ title: 'Samstag Zoo', category: 'family', startDate: '2026-10-17', startTime: '10:00' });
    expect((await db.familyCouncilNotes.get('2026-10-11'))!.decisions![0].eventId).toBe(event.id);
  });

  it('Erinnerungen und alles Neue kommen in die Datensicherung', async () => {
    const db = await openDb();
    await addMemory(db, { date: '2026-10-10', title: 'Laternenrunde', text: ' ', photo: 'data:image/jpeg;base64,AAAA', memberIds: ['child-1'] });
    await saveAdventure(db, draftAdventure('2026-10-09', ADVENTURE_IDEA_BY_ID.get('forest')!));
    await recordMamaTime(db, 'child-1', '2026-10-10', 'read');
    await updateCouncil(db, '2026-10-11', (n) => ({ ...n, doneItems: [0] }));
    const backup = await exportData(db);
    expect(backup.tables.familyMemories).toHaveLength(1);
    expect(backup.tables.familyMemories[0].text).toBeUndefined();
    expect(backup.tables.weekendAdventures).toHaveLength(1);
    expect(validateBackup(JSON.parse(JSON.stringify(backup))).ok).toBe(true);
    const broken = JSON.parse(JSON.stringify(backup));
    broken.tables.familyMemories[0].photo = 'javascript:alert(1)';
    expect(validateBackup(broken).ok).toBe(false);
  });
});

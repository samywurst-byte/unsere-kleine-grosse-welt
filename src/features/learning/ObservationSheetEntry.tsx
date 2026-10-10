import { Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { Field } from '../../components/FormControls';
import { db } from '../../database/db';
import { MOOD_LABEL } from '../../services/learning';
import type { SheetChild } from '../../services/learningPack';
import { loadSheet, saveSheet, type SheetEntry } from '../../services/observationSheet';
import type { ChildProfile, DateKey, LearningMood, LearningObservation, ObservationLevel } from '../../types';
import { formatDayMonth } from '../../utils/dates';

/** Dieselben Spalten wie auf dem Papierbogen. */
const COLUMNS: { level: ObservationLevel; label: string }[] = [
  { level: 'independent', label: 'selbst\u00adständig' },
  { level: 'little-help', label: 'mit wenig Hilfe' },
  { level: 'much-help', label: 'mit viel Hilfe' },
  { level: 'not-yet', label: 'noch nicht' },
  { level: 'not-assessable', label: 'nicht beurteilt' },
];
const MOODS: LearningMood[] = ['fun', 'ok', 'reluctant'];

/**
 * Beobachtungsbogen eintragen: sieht aus wie das Papier, ein Antippen pro Zeile.
 * Die Zeilen landen als Beobachtungen im Lesepfad und Rechenpfad.
 */
export function ObservationSheetEntry({ packId, rows, children, observations, today, onClose }: {
  packId: string; rows: SheetChild[]; children: ChildProfile[]; observations: LearningObservation[]; today: DateKey; onClose: () => void;
}) {
  const [date, setDate] = useState(today);
  const saved = useMemo(() => loadSheet(observations, packId, date, rows), [observations, packId, date, rows]);
  const [edits, setEdits] = useState<Record<DateKey, Record<string, SheetEntry>>>({});
  const entries = edits[date] ?? saved;
  const [done, setDone] = useState<string | null>(null);
  const alreadySaved = Object.values(saved).some((e) => Object.values(e.levels).some(Boolean));

  const change = (childId: string, fn: (e: SheetEntry) => SheetEntry) => {
    setDone(null);
    setEdits((all) => {
      const current = all[date] ?? saved;
      return { ...all, [date]: { ...current, [childId]: fn(current[childId] ?? { levels: {} }) } };
    });
  };

  const save = async () => {
    const count = await saveSheet(db, packId, date, rows, entries);
    setEdits((all) => { const { [date]: _, ...rest } = all; return rest; });
    setDone(count ? `Gespeichert: ${count} ${count === 1 ? 'Eintrag' : 'Einträge'} vom ${formatDayMonth(date)}. Sie zählen jetzt im Lesepfad und Rechenpfad mit.` : 'Nichts angekreuzt, nichts gespeichert.');
  };

  return (
    <div className="card sheet">
      <div className="parent-section__head" style={{ marginBottom: 'var(--space-3)' }}>
        <h3 className="card__title" style={{ flex: 1, margin: 0 }}>Beobachtungsbogen eintragen</h3>
        <button type="button" className="btn btn--small" onClick={onClose}>Schließen</button>
      </div>
      <p className="small muted" style={{ marginTop: 0 }}>
        Einfach so ankreuzen wie auf dem Papier. Leere Zeilen werden nicht gespeichert. Ein einzelner Tag entscheidet nichts, erst mehrere Tage zusammen.
      </p>
      <Field label="Datum">
        <input className="input" type="date" value={date} max={today} onChange={(e) => { if (e.target.value) { setDate(e.target.value); setDone(null); } }} />
      </Field>
      {alreadySaved && !edits[date] && <p className="small muted">Für diesen Tag ist schon etwas eingetragen. Änderungen ersetzen den alten Stand.</p>}

      {rows.map((row) => {
        const child = children.find((c) => c.id === row.childId);
        const entry = entries[row.childId] ?? { levels: {} };
        return (
          <section key={row.childId} className="sheet__child">
            <h4 className="sheet__name">{child && <Avatar avatar={child.avatar} color={child.color} size={32} />} {row.name}</h4>
            <div className="sheet__grid" role="table" aria-label={`Beobachtungen ${row.name}`}>
              <div className="sheet__row sheet__row--head" role="row">
                <span role="columnheader" />
                {COLUMNS.map((c) => <span key={c.level} role="columnheader" className="sheet__col">{c.label}</span>)}
              </div>
              {row.goals.map((g, i) => (
                <div key={g.label} className="sheet__row" role="row">
                  <span role="rowheader" className="sheet__label">{g.label}</span>
                  {COLUMNS.map((c) => {
                    const on = entry.levels[i] === c.level;
                    return (
                      <span key={c.level} role="cell" className="sheet__cell">
                        <button
                          type="button" className={`sheet__box ${on ? 'sheet__box--on' : ''}`} aria-pressed={on} aria-label={`${g.label}: ${c.label}`}
                          onClick={() => change(row.childId, (e) => ({ ...e, levels: { ...e.levels, [i]: on ? undefined : c.level } }))}
                        >
                          {on && <Check size={22} strokeWidth={3} aria-hidden="true" />}
                        </button>
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="sheet__mood" role="group" aria-label={`Stimmung ${row.name}`}>
              <span className="muted">Stimmung:</span>
              {MOODS.map((m) => (
                <button
                  key={m} type="button" className="seg__item" aria-pressed={entry.mood === m}
                  onClick={() => change(row.childId, (e) => ({ ...e, mood: e.mood === m ? undefined : m }))}
                >
                  {MOOD_LABEL[m]}
                </button>
              ))}
            </div>
            <input
              className="input" placeholder="Notiz (optional)" value={entry.note ?? ''} aria-label={`Notiz ${row.name}`}
              onChange={(e) => change(row.childId, (x) => ({ ...x, note: e.target.value }))}
            />
          </section>
        );
      })}

      <div className="row" style={{ marginTop: 'var(--space-3)' }}>
        <button type="button" className="btn btn--primary" onClick={() => void save()}><Check size={18} aria-hidden="true" /> Speichern</button>
      </div>
      {done && <p className="notice notice--ok">{done}</p>}
    </div>
  );
}

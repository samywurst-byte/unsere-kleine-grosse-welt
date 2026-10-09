import { useEffect, useState } from 'react';
import { Field, Toggle, WeekdayPicker } from '../../components/FormControls';
import { db } from '../../database/db';
import { useSettings } from '../../hooks/useData';
import type { AppSettings, Weekday } from '../../types';
import { isValidTime, WEEKDAY_LONG, WEEKDAY_ORDER } from '../../utils/dates';

const TIME_FIELDS: { key: keyof AppSettings; label: string; hint?: string }[] = [
  { key: 'morningStart', label: 'Morgen beginnt' },
  { key: 'kindergartenDeparture', label: 'Abfahrt Kindergarten' },
  { key: 'kindergartenReturn', label: 'Rückkehr vom Kindergarten' },
  { key: 'freeDayMorningEnd', label: 'Morgen endet an freien Tagen' },
  { key: 'papaHome', label: 'Papa kommt ungefähr nach Hause' },
  { key: 'eveningStart', label: 'Abend beginnt' },
  { key: 'bedtime', label: 'Schlafenszeit (normal)' },
];

export function TimeSettings() {
  const settings = useSettings();
  const [draft, setDraft] = useState<AppSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (settings && !draft) setDraft(settings); }, [settings, draft]);
  if (!draft) return null;

  const set = (p: Partial<AppSettings>) => { setDraft({ ...draft, ...p }); setSaved(false); };
  const setOverride = (d: Weekday, v: string) => {
    const next = { ...draft.bedtimeOverrides };
    if (v) next[d] = v; else delete next[d];
    set({ bedtimeOverrides: next });
  };

  const save = async () => {
    const times = TIME_FIELDS.map((f) => draft[f.key]);
    if (!times.every(isValidTime) || !Object.values(draft.bedtimeOverrides).every(isValidTime)) return setError('Bitte alle Uhrzeiten vollständig ausfüllen.');
    if (!(draft.morningStart < draft.kindergartenDeparture && draft.kindergartenDeparture < draft.kindergartenReturn && draft.kindergartenReturn < draft.eveningStart)) {
      return setError('Die Reihenfolge stimmt nicht: Morgen, Abfahrt, Rückkehr und Abend müssen nacheinander liegen.');
    }
    setError(null);
    await db.settings.put(draft);
    setSaved(true);
  };

  return (
    <div className="parent-section">
      <div className="parent-section__head"><h2>Uhrzeiten und Tagesphasen</h2></div>
      <p className="small muted">Tagesphasen sind Orientierung: Sie bestimmen, was auf der Startseite hervorgehoben wird. Nichts wird gesperrt oder als „nicht geschafft“ gewertet.</p>
      <div className="card">
        <div className="form-grid">
          {TIME_FIELDS.map((f) => (
            <Field key={f.key} label={f.label}>
              <input className="input" type="time" value={draft[f.key] as string} onChange={(e) => set({ [f.key]: e.target.value } as Partial<AppSettings>)} />
            </Field>
          ))}
          <Field label="Kindergartentage" className="span-2"><WeekdayPicker value={draft.kindergartenDays} onChange={(kindergartenDays) => set({ kindergartenDays })} /></Field>
        </div>
      </div>
      <div className="card">
        <h3 className="card__title">Abweichende Schlafenszeiten</h3>
        <div className="form-grid">
          {WEEKDAY_ORDER.map((d) => (
            <Field key={d} label={WEEKDAY_LONG[d]} hint={draft.bedtimeOverrides[d] ? undefined : `Standard ${draft.bedtime}`}>
              <input className="input" type="time" value={draft.bedtimeOverrides[d] ?? ''} onChange={(e) => setOverride(d, e.target.value)} />
            </Field>
          ))}
        </div>
      </div>
      <div className="card">
        <h3 className="card__title">Uhr</h3>
        <Toggle label="Sekundenzeiger zeigen" checked={draft.showSeconds} onChange={(showSeconds) => set({ showSeconds })} />
        <Toggle label="Lernmodus: Minuten, Viertelstunden und Uhrzeit in Worten" checked={draft.clockLearningMode} onChange={(clockLearningMode) => set({ clockLearningMode })} />
      </div>
      {error && <p className="notice notice--error">{error}</p>}
      {saved && <p className="notice notice--ok">Gespeichert.</p>}
      <div><button type="button" className="btn btn--primary" onClick={save}>Speichern</button></div>
    </div>
  );
}

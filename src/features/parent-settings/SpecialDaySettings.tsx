import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { Field, Toggle } from '../../components/FormControls';
import { db } from '../../database/db';
import { useChildren, useSpecialDays } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { clearSpecialDay, setSpecialDays, SPECIAL_KIND, SPECIAL_KINDS } from '../../services/specialDay';
import type { SpecialDayKind } from '../../types';
import { formatLong, toDateKey } from '../../utils/dates';

/** Sondermodus „Heute ist alles anders“: für einen Tag oder mehrere, für einzelne Kinder oder alle. */
export function SpecialDaySettings() {
  const today = toDateKey(useNow(60_000));
  const children = useChildren();
  const upcoming = useSpecialDays(today);
  const [kind, setKind] = useState<SpecialDayKind>('sick');
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [who, setWho] = useState<string[] | null>(null);
  const [hide, setHide] = useState<boolean | null>(null);
  const [note, setNote] = useState('');
  const [done, setDone] = useState<string | null>(null);
  if (!children || !upcoming) return null;
  const selected = who ?? children.map((c) => c.id);
  const hideRoutines = hide ?? SPECIAL_KIND[kind].hideByDefault;
  const end = to < from ? from : to;

  const save = async () => {
    const n = await setSpecialDays(db, from, end, { kind, childIds: selected, hideRoutines, note });
    setDone(`Eingetragen für ${n} ${n === 1 ? 'Tag' : 'Tage'}.`);
    setNote('');
  };

  return (
    <div className="parent-section">
      <div className="parent-section__head"><h2>Heute ist alles anders</h2></div>
      <p className="small muted">Wenn jemand krank ist, Urlaub ist oder Besuch kommt: Aufgaben werden für die betroffenen Kinder ausgeblendet. Niemand verliert etwas, nichts gilt als vergessen.</p>

      <div className="card stack">
        <div className="row row--wrap" role="group" aria-label="Was ist anders?">
          {SPECIAL_KINDS.map((k) => (
            <button key={k} type="button" className="seg__item" aria-pressed={kind === k} onClick={() => { setKind(k); setHide(null); }}>
              <span aria-hidden="true">{SPECIAL_KIND[k].emoji}</span> {SPECIAL_KIND[k].label}
            </button>
          ))}
        </div>
        <div className="row row--wrap">
          <Field label="Von"><input className="input" type="date" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} /></Field>
          <Field label="Bis"><input className="input" type="date" value={end} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} /></Field>
        </div>
        <div className="row row--wrap" role="group" aria-label="Für wen?">
          {children.map((c) => (
            <button key={c.id} type="button" className="seg__item" aria-pressed={selected.includes(c.id)}
              onClick={() => setWho(selected.includes(c.id) ? selected.filter((x) => x !== c.id) : [...selected, c.id])}>
              <Avatar avatar={c.avatar} color={c.color} size={26} /> {c.name}
            </button>
          ))}
        </div>
        <Toggle label="Routinen und Haushaltsaufgaben ausblenden" checked={hideRoutines} onChange={setHide} />
        {!hideRoutines && kind !== 'visit' && <p className="small muted">Ohne Ausblenden fallen nur die Kindergarten-Routinen weg.</p>}
        <Field label="Was die Kinder lesen (optional)">
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder={SPECIAL_KIND[kind].text} />
        </Field>
        <div className="row">
          <button type="button" className="btn btn--primary" disabled={!selected.length} onClick={() => void save()}>Eintragen</button>
        </div>
        {done && <p className="notice notice--ok">{done}</p>}
      </div>

      <div className="card">
        <h3 className="card__title">Eingetragene Tage</h3>
        {upcoming.length === 0 ? <p className="muted">Keine besonderen Tage eingetragen.</p> : (
          <ul className="list">
            {upcoming.map((d) => (
              <li key={d.date} className="list-item">
                <span aria-hidden="true" style={{ fontSize: '1.6rem' }}>{SPECIAL_KIND[d.kind].emoji}</span>
                <div className="list-item__main">
                  <p className="list-item__title">{formatLong(d.date)} · {SPECIAL_KIND[d.kind].label}</p>
                  <p className="list-item__meta">{d.childIds.map((id) => children.find((c) => c.id === id)?.name).filter(Boolean).join(', ')}{d.hideRoutines ? ' · Aufgaben ausgeblendet' : ''}{d.note ? ` · ${d.note}` : ''}</p>
                </div>
                <button type="button" className="btn btn--icon btn--ghost" aria-label="Sondertag entfernen" onClick={() => void clearSpecialDay(db, d.date)}><Trash2 size={18} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

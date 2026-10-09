import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { ColorPicker, Field, Segmented } from '../../components/FormControls';
import { Icon } from '../../components/Icon';
import { IconPicker } from '../../components/IconPicker';
import { Modal } from '../../components/Modal';
import { db } from '../../database/db';
import { useTimerPresets } from '../../hooks/useData';
import type { TimerPreset } from '../../types';
import { newId } from '../../utils/id';

export function TimerSettings() {
  const presets = useTimerPresets();
  const [editing, setEditing] = useState<TimerPreset | null>(null);
  if (!presets) return null;
  const create = () => setEditing({ id: newId('timer'), label: '', minutes: 10, icon: 'sparkles', color: 'sky', mode: 'countdown', order: presets.length });
  return (
    <div className="parent-section">
      <div className="parent-section__head">
        <h2>Timer</h2>
        <button type="button" className="btn btn--sky" onClick={create}><Plus size={18} aria-hidden="true" /> Timer</button>
      </div>
      <p className="small muted">„Mindestzeit“ läuft nach dem Ziel ruhig weiter und fordert nicht zum Aufhören auf, ideal für Draußenzeit und Mama-Zeit. Es gibt keine Alarmtöne.</p>
      <ul className="list">
        {presets.map((p) => (
          <li key={p.id} className="list-item">
            <Icon name={p.icon} size={26} />
            <div className="list-item__main">
              <p className="list-item__title">{p.label}</p>
              <p className="list-item__meta">{p.minutes} Minuten · {p.mode === 'minimum' ? 'Mindestzeit' : 'Countdown'}</p>
            </div>
            <button type="button" className="btn btn--small" onClick={() => setEditing(p)}><Pencil size={16} aria-hidden="true" /> Bearbeiten</button>
          </li>
        ))}
      </ul>
      {editing && <TimerEditor preset={editing} isNew={!presets.some((p) => p.id === editing.id)} onClose={() => setEditing(null)} />}
    </div>
  );
}

function TimerEditor({ preset, isNew, onClose }: { preset: TimerPreset; isNew: boolean; onClose: () => void }) {
  const [p, setP] = useState(preset);
  const [error, setError] = useState<string | null>(null);
  const set = (x: Partial<TimerPreset>) => setP((v) => ({ ...v, ...x }));
  const save = async () => {
    if (!p.label.trim()) return setError('Bitte einen Namen eingeben.');
    if (!(p.minutes >= 1 && p.minutes <= 180)) return setError('Die Dauer muss zwischen 1 und 180 Minuten liegen.');
    await db.transaction('rw', db.timerPresets, db.timers, async () => {
      await db.timerPresets.put({ ...p, label: p.label.trim() });
      // Ein nicht laufender gespeicherter Timer übernimmt die neue Dauer
      const st = await db.timers.get(p.id);
      if (st && st.status === 'idle') await db.timers.delete(p.id);
    });
    onClose();
  };
  const remove = async () => {
    await db.transaction('rw', db.timerPresets, db.timers, db.routineDefinitions, async () => {
      await db.timerPresets.delete(p.id);
      await db.timers.delete(p.id);
      await db.routineDefinitions.where('id').notEqual('').modify((r) => { if (r.timerPresetId === p.id) delete r.timerPresetId; });
    });
    onClose();
  };
  return (
    <Modal
      title={isNew ? 'Neuer Timer' : 'Timer bearbeiten'} onClose={onClose} wide
      actions={(
        <>
          {!isNew && <button type="button" className="btn btn--danger" onClick={remove}>Löschen</button>}
          <div className="spacer" />
          <button type="button" className="btn" onClick={onClose}>Abbrechen</button>
          <button type="button" className="btn btn--primary" onClick={save}>Speichern</button>
        </>
      )}
    >
      <div className="form-grid">
        {error && <p className="notice notice--error span-2">{error}</p>}
        <Field label="Name"><input className="input" value={p.label} onChange={(e) => set({ label: e.target.value })} /></Field>
        <Field label="Minuten"><input className="input" type="number" inputMode="numeric" min={1} max={180} value={p.minutes} onChange={(e) => set({ minutes: Number(e.target.value) })} /></Field>
        <Field label="Art" className="span-2">
          <Segmented label="Art" value={p.mode} options={[{ value: 'countdown', label: 'Countdown' }, { value: 'minimum', label: 'Mindestzeit (läuft weiter)' }]} onChange={(mode) => set({ mode })} />
        </Field>
        <Field label="Farbe" className="span-2"><ColorPicker value={p.color} onChange={(color) => set({ color })} /></Field>
        <Field label="Symbol" className="span-2"><IconPicker value={p.icon} onChange={(icon) => set({ icon })} /></Field>
      </div>
    </Modal>
  );
}

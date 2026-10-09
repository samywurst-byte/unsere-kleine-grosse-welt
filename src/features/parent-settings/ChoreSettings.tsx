import { useLiveQuery } from 'dexie-react-hooks';
import { Pencil, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { Field, Toggle, WeekdayPicker } from '../../components/FormControls';
import { Icon } from '../../components/Icon';
import { IconPicker } from '../../components/IconPicker';
import { Modal } from '../../components/Modal';
import { db } from '../../database/db';
import { useChildren, useChoreDefinitions } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { choreDefinitionsFor, completeChore, ensureChoreOccurrences, moveChore, reopenChore, skipChore } from '../../services/chores';
import type { ChoreDefinition, ChoreOccurrence } from '../../types';
import { formatLong, isValidDateKey, toDateKey, weekKeys, weekStartKey, WEEKDAY_ORDER, WEEKDAY_SHORT } from '../../utils/dates';
import { newId } from '../../utils/id';
import { MemberSelect } from './MemberSelect';

const STATUS: Record<ChoreOccurrence['status'], string> = { open: 'offen', done: 'geschafft', skipped: 'ausgesetzt' };

export function ChoreSettings() {
  const defs = useChoreDefinitions();
  const children = useChildren();
  const today = toDateKey(useNow(60_000));
  const days = weekKeys(weekStartKey(today));
  const [editing, setEditing] = useState<ChoreDefinition | null>(null);
  const [moving, setMoving] = useState<ChoreOccurrence | null>(null);

  // Instanzen der laufenden Woche bereitstellen, damit sie im Voraus verschoben oder ausgesetzt werden können.
  useEffect(() => {
    if (!defs) return;
    void (async () => { for (const d of days) if (choreDefinitionsFor(defs, d).length) await ensureChoreOccurrences(db, d); })();
  }, [defs, days[0]]);

  const weekOcc = useLiveQuery(() => db.choreOccurrences.where('date').between(days[0], days[6], true, true).toArray(), [days[0]]);
  if (!defs || !children) return null;

  const create = () => setEditing({
    id: newId('chore'), title: '', icon: 'sparkles', childId: children[0]?.id ?? '', weekdays: [2, 6], active: true, createdAt: new Date().toISOString(),
  });
  const defMap = new Map(defs.map((d) => [d.id, d]));

  return (
    <div className="parent-section">
      <div className="parent-section__head">
        <h2>Haushaltsaufgaben</h2>
        <button type="button" className="btn btn--sky" onClick={create}><Plus size={18} aria-hidden="true" /> Aufgabe</button>
      </div>
      <p className="small muted">Familienaufgaben bringen keine Sterne. Fällt eine aus, hat das keine Folgen. Jede Woche entstehen neue Instanzen, Erledigtes bleibt gespeichert.</p>
      <ul className="list">
        {defs.map((d) => {
          const child = children.find((c) => c.id === d.childId);
          return (
            <li key={d.id} className="list-item" style={{ opacity: d.active ? 1 : 0.5 }}>
              {child && <Avatar avatar={child.avatar} color={child.color} size={44} />}
              <Icon name={d.icon} size={26} />
              <div className="list-item__main">
                <p className="list-item__title">{d.title}{!d.active && ' (pausiert)'}</p>
                <p className="list-item__meta">{child?.name} · {WEEKDAY_ORDER.filter((w) => d.weekdays.includes(w)).map((w) => WEEKDAY_SHORT[w]).join(', ')}{d.helpNote && ` · ${d.helpNote}`}</p>
              </div>
              <button type="button" className="btn btn--small" onClick={() => setEditing(d)}><Pencil size={16} aria-hidden="true" /> Bearbeiten</button>
            </li>
          );
        })}
      </ul>

      <h3 className="card__eyebrow" style={{ marginTop: 'var(--space-4)' }}>Diese Woche</h3>
      <ul className="list">
        {(weekOcc ?? []).filter((o) => defMap.has(o.definitionId)).sort((a, b) => a.date.localeCompare(b.date)).map((o) => {
          const child = children.find((c) => c.id === o.childId);
          return (
            <li key={o.id} className="list-item">
              {child && <Avatar avatar={child.avatar} color={child.color} size={40} />}
              <div className="list-item__main">
                <p className="list-item__title">{defMap.get(o.definitionId)!.title}</p>
                <p className="list-item__meta">
                  {formatLong(o.date)}{o.date !== o.scheduledDate && ` (verschoben vom ${formatLong(o.scheduledDate)})`} · {STATUS[o.status]}{o.doneTogether && ' · gemeinsam'}
                </p>
              </div>
              {o.status !== 'done' && <button type="button" className="btn btn--small btn--sage" onClick={() => completeChore(db, o.id, true)}>Gemeinsam erledigt</button>}
              {o.status === 'open' && <button type="button" className="btn btn--small" onClick={() => skipChore(db, o.id)}>Aussetzen</button>}
              {o.status !== 'done' && <button type="button" className="btn btn--small" onClick={() => setMoving(o)}>Verschieben</button>}
              {o.status !== 'open' && <button type="button" className="btn btn--small" onClick={() => reopenChore(db, o.id)}>Wieder öffnen</button>}
            </li>
          );
        })}
      </ul>

      {editing && <ChoreEditor def={editing} isNew={!defMap.has(editing.id)} onClose={() => setEditing(null)} />}
      {moving && <MoveDialog occ={moving} onClose={() => setMoving(null)} />}
    </div>
  );
}

function MoveDialog({ occ, onClose }: { occ: ChoreOccurrence; onClose: () => void }) {
  const [date, setDate] = useState(occ.date);
  return (
    <Modal
      title="Aufgabe verschieben" onClose={onClose}
      actions={(<><button type="button" className="btn" onClick={onClose}>Abbrechen</button><button type="button" className="btn btn--primary" disabled={!isValidDateKey(date)} onClick={async () => { await moveChore(db, occ.id, date); onClose(); }}>Verschieben</button></>)}
    >
      <Field label="Neuer Tag"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
    </Modal>
  );
}

function ChoreEditor({ def, isNew, onClose }: { def: ChoreDefinition; isNew: boolean; onClose: () => void }) {
  const children = useChildren() ?? [];
  const [d, setD] = useState(def);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (p: Partial<ChoreDefinition>) => setD((x) => ({ ...x, ...p }));

  const save = async () => {
    if (!d.title.trim()) return setError('Bitte einen Titel eingeben.');
    if (!d.childId) return setError('Bitte ein Kind wählen.');
    if (!d.weekdays.length) return setError('Bitte mindestens einen Wochentag wählen.');
    await db.choreDefinitions.put({ ...d, title: d.title.trim(), helpNote: d.helpNote?.trim() || undefined });
    onClose();
  };
  const remove = async () => {
    // Offene Instanzen entfernen, Erledigtes bleibt als Historie.
    await db.transaction('rw', db.choreDefinitions, db.choreOccurrences, async () => {
      await db.choreOccurrences.where('definitionId').equals(d.id).and((o) => o.status === 'open').delete();
      await db.choreDefinitions.delete(d.id);
    });
    onClose();
  };

  return (
    <Modal
      title={isNew ? 'Neue Haushaltsaufgabe' : 'Haushaltsaufgabe bearbeiten'} onClose={onClose} wide
      actions={(
        <>
          {!isNew && !confirmDelete && <button type="button" className="btn btn--danger" onClick={() => setConfirmDelete(true)}>Löschen</button>}
          {confirmDelete && <button type="button" className="btn btn--danger" onClick={remove}>Wirklich löschen</button>}
          <div className="spacer" />
          <button type="button" className="btn" onClick={onClose}>Abbrechen</button>
          <button type="button" className="btn btn--primary" onClick={save}>Speichern</button>
        </>
      )}
    >
      <div className="form-grid">
        {error && <p className="notice notice--error span-2">{error}</p>}
        <Field label="Titel" className="span-2"><input className="input" value={d.title} onChange={(e) => set({ title: e.target.value })} /></Field>
        <Field label="Für wen?" className="span-2"><MemberSelect single members={children} value={[d.childId]} onChange={([childId]) => set({ childId })} /></Field>
        <Field label="Tage" className="span-2"><WeekdayPicker value={d.weekdays} onChange={(weekdays) => set({ weekdays })} /></Field>
        <Field label="Symbol" className="span-2"><IconPicker value={d.icon} onChange={(icon) => set({ icon })} /></Field>
        <Field label="Hinweis für Erwachsene (optional)" className="span-2"><input className="input" value={d.helpNote ?? ''} onChange={(e) => set({ helpNote: e.target.value })} /></Field>
        <Toggle label="Aktiv" checked={d.active} onChange={(active) => set({ active })} />
      </div>
    </Modal>
  );
}

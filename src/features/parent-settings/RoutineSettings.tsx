import { ArrowDown, ArrowUp, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { Field, Segmented, Toggle, WeekdayPicker } from '../../components/FormControls';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { IconPicker } from '../../components/IconPicker';
import { Modal } from '../../components/Modal';
import { SCHOOL_ROUTINES } from '../../data/schoolRoutines';
import { db } from '../../database/db';
import { useChildren, useRoutineDefinitions, useTimerPresets } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { prepareSchoolRoutines, schoolRoutineId } from '../../services/routines';
import { ROUTINE_PHASE_LABEL } from '../../services/dayPhase';
import type { ChildProfile, RoutineDefinition, RoutinePhase, RoutineStage } from '../../types';
import { formatLong, toDateKey, WEEKDAY_ORDER, WEEKDAY_SHORT } from '../../utils/dates';
import { newId } from '../../utils/id';
import { MemberSelect } from './MemberSelect';

const PHASES: RoutinePhase[] = ['morning', 'afternoon', 'evening'];

export function RoutineSettings() {
  const defs = useRoutineDefinitions();
  const children = useChildren();
  const [editing, setEditing] = useState<RoutineDefinition | null>(null);
  if (!defs || !children) return null;

  const move = async (def: RoutineDefinition, dir: -1 | 1) => {
    const group = defs.filter((d) => d.phase === def.phase);
    const i = group.findIndex((d) => d.id === def.id);
    const other = group[i + dir];
    if (!other) return;
    await db.transaction('rw', db.routineDefinitions, async () => {
      await db.routineDefinitions.update(def.id, { order: other.order });
      await db.routineDefinitions.update(other.id, { order: def.order });
    });
  };

  const create = (phase: RoutinePhase) => setEditing({
    id: newId('routine'), title: '', icon: 'sparkles', phase, weekdays: [...WEEKDAY_ORDER], assignedTo: children.map((c) => c.id),
    order: Math.max(0, ...defs.map((d) => d.order)) + 1, active: true, highlight: false, createdAt: new Date().toISOString(),
  });

  return (
    <div className="parent-section">
      <div className="parent-section__head"><h2>Tagesroutinen</h2></div>
      <p className="small muted">Routinen gehören zum Alltag und bringen keine Sterne. Mit „Startseite“ markierte Routinen erscheinen unter „Das gehört heute dazu“.</p>
      {PHASES.map((phase) => (
        <section key={phase} className="phase-group">
          <div className="parent-section__head">
            <h3>{ROUTINE_PHASE_LABEL[phase]}</h3>
            <button type="button" className="btn btn--small btn--sky" onClick={() => create(phase)}><Plus size={16} aria-hidden="true" /> Routine</button>
          </div>
          <ul className="list">
            {defs.filter((d) => d.phase === phase).map((d, i, arr) => (
              <li key={d.id} className="list-item" style={{ opacity: d.active ? 1 : 0.5 }}>
                <Icon name={d.icon} size={28} />
                <div className="list-item__main">
                  <p className="list-item__title">{d.title}{d.highlight && <span className="chip" style={{ marginLeft: 8 }}>Startseite</span>}{d.kindergartenOnly && <span className="chip" style={{ marginLeft: 8 }}>{d.stage === 'school' ? 'Schultage' : 'Kindergarten'}</span>}{d.stage && <span className="chip" style={{ marginLeft: 8 }}>{d.stage === 'school' ? 'ab Schulbeginn' : 'bis Schulbeginn'}</span>}{!d.active && ' (pausiert)'}</p>
                  <p className="list-item__meta">
                    {d.weekdays.length === 7 ? 'täglich' : WEEKDAY_ORDER.filter((w) => d.weekdays.includes(w)).map((w) => WEEKDAY_SHORT[w]).join(', ')}
                    {' · '}{children.filter((c) => d.assignedTo.includes(c.id)).map((c) => c.name).join(', ') || 'niemand'}
                  </p>
                </div>
                <button type="button" className="btn btn--icon btn--small" onClick={() => move(d, -1)} disabled={i === 0} aria-label="Nach oben"><ArrowUp size={18} /></button>
                <button type="button" className="btn btn--icon btn--small" onClick={() => move(d, 1)} disabled={i === arr.length - 1} aria-label="Nach unten"><ArrowDown size={18} /></button>
                <button type="button" className="btn btn--small" onClick={() => setEditing(d)}><Pencil size={16} aria-hidden="true" /> Bearbeiten</button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <SchoolPrep children={children} defs={defs} />
      {editing && <RoutineEditor def={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

/** Schulkind-Routinen rechtzeitig vorbereiten. Sie erscheinen automatisch ab dem Einschulungsdatum aus dem Profil. */
function SchoolPrep({ children, defs }: { children: ChildProfile[]; defs: RoutineDefinition[] }) {
  const today = toDateKey(useNow(60_000));
  const upcoming = children.filter((c) => c.schoolEntryDate && c.schoolEntryDate > today).sort((a, b) => a.schoolEntryDate!.localeCompare(b.schoolEntryDate!));
  if (!upcoming.length) return null;
  return (
    <section className="phase-group">
      <div className="parent-section__head"><h3>Bald Schulkind</h3></div>
      <p className="small muted">
        Schulweg, Ranzen packen, Hausaufgaben: Diese Routinen lassen sich jetzt anlegen und erscheinen erst ab dem Einschulungsdatum.
        Routinen, die nur in den Kindergarten gehören, beim Bearbeiten auf „Nur Kindergartenkinder“ stellen; sie verschwinden dann am ersten Schultag.
      </p>
      <ul className="list">
        {upcoming.map((c) => {
          const prepared = SCHOOL_ROUTINES.filter((t) => defs.some((d) => d.id === schoolRoutineId(t.id, c.id))).length;
          return (
            <li key={c.id} className="list-item">
              <Avatar avatar={c.avatar} color={c.color} size={40} />
              <div className="list-item__main">
                <p className="list-item__title">{c.name}</p>
                <p className="list-item__meta">Schulbeginn {formatLong(c.schoolEntryDate!)}{prepared ? ` · ${prepared} Schulroutinen vorbereitet` : ''}</p>
              </div>
              {prepared < SCHOOL_ROUTINES.length && (
                <button type="button" className="btn btn--small btn--sky" onClick={() => void prepareSchoolRoutines(db, c)}>
                  <Plus size={16} aria-hidden="true" /> Schulroutinen vorbereiten
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function RoutineEditor({ def, onClose }: { def: RoutineDefinition; onClose: () => void }) {
  const children = useChildren() ?? [];
  const presets = useTimerPresets() ?? [];
  const [d, setD] = useState(def);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (p: Partial<RoutineDefinition>) => setD((x) => ({ ...x, ...p }));
  const exists = useRoutineDefinitions()?.some((x) => x.id === def.id);

  const save = async () => {
    if (!d.title.trim()) return setError('Bitte einen Titel eingeben.');
    if (!d.weekdays.length) return setError('Bitte mindestens einen Wochentag wählen.');
    await db.routineDefinitions.put({ ...d, title: d.title.trim() });
    onClose();
  };
  // Erledigungen vergangener Tage bleiben als Historie erhalten.
  const remove = async () => { await db.routineDefinitions.delete(d.id); onClose(); };

  return (
    <Modal
      title={exists ? 'Routine bearbeiten' : 'Neue Routine'} onClose={onClose} wide
      actions={(
        <>
          {exists && !confirmDelete && <button type="button" className="btn btn--danger" onClick={() => setConfirmDelete(true)}>Löschen</button>}
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
        <Field label="Tageszeit" className="span-2">
          <Segmented label="Tageszeit" value={d.phase} options={PHASES.map((p) => ({ value: p, label: ROUTINE_PHASE_LABEL[p] }))} onChange={(phase) => set({ phase })} />
        </Field>
        <Field label="Symbol" className="span-2"><IconPicker value={d.icon} onChange={(icon) => set({ icon })} /></Field>
        <Field label="Wochentage" className="span-2"><WeekdayPicker value={d.weekdays} onChange={(weekdays) => set({ weekdays })} /></Field>
        <Field label="Für wen?" className="span-2"><MemberSelect members={children} value={d.assignedTo} onChange={(assignedTo) => set({ assignedTo })} /></Field>
        <Field label="Timer (optional)" className="span-2">
          <Segmented
            label="Timer" value={d.timerPresetId ?? ''}
            options={[{ value: '', label: 'Kein Timer' }, ...presets.map((p) => ({ value: p.id, label: `${p.label} (${p.minutes} Min.)` }))]}
            onChange={(v) => set({ timerPresetId: v || undefined })}
          />
        </Field>
        <Toggle label="Auf der Startseite zeigen" checked={d.highlight} onChange={(highlight) => set({ highlight })} />
        <Toggle
          label="Nur an Kindergarten- bzw. Schultagen (nicht in Ferien, an Feiertagen und freien Tagen)"
          checked={!!d.kindergartenOnly} onChange={(kindergartenOnly) => set({ kindergartenOnly })}
        />
        <Field label="Für Kindergarten- oder Schulkinder?" className="span-2">
          <Segmented
            label="Kindergarten oder Schule" value={d.stage ?? ''}
            options={[{ value: '', label: 'Für alle' }, { value: 'kindergarten', label: 'Nur Kindergartenkinder' }, { value: 'school', label: 'Nur Schulkinder' }]}
            onChange={(v) => set({ stage: (v || undefined) as RoutineStage | undefined })}
          />
        </Field>
        <Toggle label="Aktiv" checked={d.active} onChange={(active) => set({ active })} />
      </div>
    </Modal>
  );
}

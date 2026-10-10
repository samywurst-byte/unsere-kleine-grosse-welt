import { Check, Pencil, Plus, Star, Trash2, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { Field, Toggle } from '../../components/FormControls';
import { Icon } from '../../components/Icon';
import { IconPicker } from '../../components/IconPicker';
import { Modal } from '../../components/Modal';
import { MISSION_SUGGESTIONS } from '../../data/missions';
import { db } from '../../database/db';
import { useChildren, useMissionCompletions, useMissions, useProjects, useSettings, useStarTransactions } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { confirmProjectTask, pendingProjectTasks, withdrawProjectTask } from '../../services/projects';
import { confirmMission, declineMission, saveMission, starBalance, undoConfirmation } from '../../services/stars';
import type { OptionalMission } from '../../types';
import { formatLong, toDateKey } from '../../utils/dates';

/** Zusatzmissionen und Familiensterne im Elternbereich: bestätigen, Missionen pflegen, Grenzen einstellen. */
export function MissionSettings() {
  const today = toDateKey(useNow(60_000));
  const missions = useMissions();
  const completions = useMissionCompletions();
  const children = useChildren();
  const settings = useSettings();
  const stars = useStarTransactions();
  const projects = useProjects();
  const [editing, setEditing] = useState<OptionalMission | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  if (!missions || !completions || !children || !settings || !stars || !projects) return null;

  const byId = new Map(missions.map((m) => [m.id, m]));
  const pending = completions.filter((c) => c.status === 'pending').sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  const projectTasks = pendingProjectTasks(projects);
  const confirmedToday = completions.filter((c) => c.status === 'confirmed' && !!c.confirmedAt && toDateKey(new Date(c.confirmedAt)) === today);
  const kid = (id: string) => children.find((c) => c.id === id);
  const create = () => setEditing({ id: '', title: '', icon: 'star', stars: 1, assignedTo: children.map((c) => c.id), active: true });

  const confirm = async (id: string) => {
    const c = completions.find((x) => x.id === id)!;
    const n = await confirmMission(db, id, settings);
    setMessage(n > 0
      ? `Danke, ${kid(c.childId)?.name}! ${n} ${n === 1 ? 'Stern kommt' : 'Sterne kommen'} ins Familienglas.`
      : `Danke, ${kid(c.childId)?.name}! Für heute ist die Sternengrenze erreicht, das Danke zählt trotzdem.`);
  };

  return (
    <div className="parent-section">
      <div className="parent-section__head">
        <h2>Zusatzmissionen und Familiensterne</h2>
        <button type="button" className="btn btn--sky" onClick={create}><Plus size={18} aria-hidden="true" /> Mission</button>
      </div>
      <p className="small muted">
        Sterne gibt es nur für freiwillige Zusatzmissionen, nie für Routinen, Haushalt, Mama-Zeit oder das Wochenende.
        Alle Sterne kommen in ein gemeinsames Familienglas; es gibt keine Strafpunkte und keinen Vergleich zwischen den Kindern. Im Glas sind gerade <strong>{starBalance(stars)} Sterne</strong>.
      </p>

      <div className="card">
        <h3 className="card__title">Warten auf euch {pending.length + projectTasks.length > 0 && <span className="chip">{pending.length + projectTasks.length}</span>}</h3>
        {projectTasks.length > 0 && (
          <ul className="list">
            {projectTasks.map(({ project, task }) => {
              const child = kid(task.childId);
              return (
                <li key={task.id} className="list-item">
                  {child && <Avatar avatar={child.avatar} color={child.color} size={44} />}
                  <span className="ft-hist__emoji" aria-hidden="true">{project.emoji}</span>
                  <div className="list-item__main">
                    <p className="list-item__title">{task.label}</p>
                    <p className="list-item__meta">{child?.name} · Projekt {project.title} · ohne Sterne</p>
                  </div>
                  <button type="button" className="btn btn--sage" onClick={() => void confirmProjectTask(db, project.id, task.id).then(() => setMessage(`Super, ${child?.name}! Die Projektaufgabe ist abgehakt.`))}><Check size={18} aria-hidden="true" /> Bestätigen</button>
                  <button type="button" className="btn btn--ghost" onClick={() => void withdrawProjectTask(db, project.id, task.id)}>Noch nicht</button>
                </li>
              );
            })}
          </ul>
        )}
        {pending.length === 0 ? (projectTasks.length === 0 && <p className="muted">Gerade wartet nichts.</p>) : (
          <ul className="list">
            {pending.map((c) => {
              const m = byId.get(c.missionId);
              const child = kid(c.childId);
              return (
                <li key={c.id} className="list-item">
                  {child && <Avatar avatar={child.avatar} color={child.color} size={44} />}
                  {m && <Icon name={m.icon} size={26} />}
                  <div className="list-item__main">
                    <p className="list-item__title">{m?.title ?? 'Mission gelöscht'}</p>
                    <p className="list-item__meta">{child?.name} · {c.date === today ? 'heute' : formatLong(c.date)} · {m?.stars ?? 0} {m?.stars === 1 ? 'Stern' : 'Sterne'}</p>
                  </div>
                  <button type="button" className="btn btn--sage" onClick={() => void confirm(c.id)}><Check size={18} aria-hidden="true" /> Bestätigen</button>
                  <button type="button" className="btn btn--ghost" onClick={() => void declineMission(db, c.id)}>Heute nicht</button>
                </li>
              );
            })}
          </ul>
        )}
        {message && <p className="notice notice--ok">{message}</p>}
        {confirmedToday.length > 0 && (
          <details className="small">
            <summary>Heute bestätigt ({confirmedToday.length})</summary>
            <ul className="list">
              {confirmedToday.map((c) => (
                <li key={c.id} className="list-item">
                  <div className="list-item__main"><p className="list-item__title">{byId.get(c.missionId)?.title} · {kid(c.childId)?.name}</p></div>
                  <button type="button" className="btn btn--small btn--ghost" onClick={() => void undoConfirmation(db, c.id).then((ok) => setMessage(ok ? 'Bestätigung zurückgenommen.' : 'Geht nicht mehr: Die Sterne wurden schon für ein Land verwendet.'))}>
                    <Undo2 size={16} aria-hidden="true" /> Versehen, zurücknehmen
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      <div className="card">
        <h3 className="card__title">Unsere Missionen</h3>
        {missions.length === 0 && <p className="muted">Noch keine Missionen. Unten gibt es Vorschläge zum Übernehmen.</p>}
        <ul className="list">
          {missions.map((m) => (
            <li key={m.id} className="list-item" style={{ opacity: m.active ? 1 : 0.5 }}>
              <Icon name={m.icon} size={28} />
              <div className="list-item__main">
                <p className="list-item__title">{m.title}{!m.active && ' (pausiert)'}</p>
                <p className="list-item__meta">{'★'.repeat(m.stars)} · {m.assignedTo.map((id) => kid(id)?.name).filter(Boolean).join(', ') || 'niemand'}</p>
              </div>
              <button type="button" className="btn btn--small" onClick={() => setEditing(m)}><Pencil size={16} aria-hidden="true" /> Bearbeiten</button>
            </li>
          ))}
        </ul>
        <h4 className="card__eyebrow" style={{ marginTop: 'var(--space-4)' }}>Vorschläge</h4>
        <div className="row row--wrap">
          {MISSION_SUGGESTIONS.filter((s) => !missions.some((m) => m.title === s.title)).map((s) => (
            <button key={s.title} type="button" className="btn btn--small"
              onClick={() => void saveMission(db, { ...s, assignedTo: children.map((c) => c.id), active: true })}>
              <Plus size={14} aria-hidden="true" /> {s.title} {'★'.repeat(s.stars)}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="card__title">Grenzen</h3>
        <div className="row row--wrap">
          <Field label="Höchstens Sterne pro Kind und Tag">
            <input className="input" type="number" min={1} max={20} value={settings.maxStarsPerChildPerDay}
              onChange={(e) => { const v = Number(e.target.value); if (v >= 1 && v <= 20) void db.settings.update('app', { maxStarsPerChildPerDay: v }); }} />
          </Field>
          <Field label="Sterne für ein neues Land">
            <input className="input" type="number" min={5} max={200} value={settings.starsPerCountry}
              onChange={(e) => { const v = Number(e.target.value); if (v >= 5 && v <= 200) void db.settings.update('app', { starsPerCountry: v }); }} />
          </Field>
        </div>
      </div>

      {editing && <MissionModal mission={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function MissionModal({ mission, onClose }: { mission: OptionalMission; onClose: () => void }) {
  const children = useChildren() ?? [];
  const [m, setM] = useState(mission);
  const isNew = !mission.id;
  const save = async () => { await saveMission(db, { ...m, id: m.id || undefined }); onClose(); };
  const remove = async () => { if (window.confirm('Diese Mission löschen? Bereits gesammelte Sterne bleiben im Glas.')) { await db.missions.delete(m.id); onClose(); } };
  return (
    <Modal title={isNew ? 'Neue Zusatzmission' : 'Mission bearbeiten'} onClose={onClose}
      actions={<>
        {!isNew && <button type="button" className="btn btn--ghost" onClick={() => void remove()}><Trash2 size={16} aria-hidden="true" /> Löschen</button>}
        <button type="button" className="btn" onClick={onClose}>Abbrechen</button>
        <button type="button" className="btn btn--primary" disabled={!m.title.trim() || !m.assignedTo.length} onClick={() => void save()}>Speichern</button>
      </>}
    >
      <div className="stack">
        <Field label="Was ist die Mission?"><input className="input" value={m.title} onChange={(e) => setM({ ...m, title: e.target.value })} placeholder="z. B. Den Tisch für alle decken" /></Field>
        <Field label="Sterne">
          <div className="seg" role="group" aria-label="Sterne">
            {[1, 2, 3].map((n) => (
              <button key={n} type="button" className="seg__item" aria-pressed={m.stars === n} onClick={() => setM({ ...m, stars: n })}>
                {Array.from({ length: n }, (_, i) => <Star key={i} size={16} fill="currentColor" aria-hidden="true" />)} {n}
              </button>
            ))}
          </div>
        </Field>
        <div className="row row--wrap" role="group" aria-label="Für wen?">
          {children.map((c) => (
            <button key={c.id} type="button" className="seg__item" aria-pressed={m.assignedTo.includes(c.id)}
              onClick={() => setM({ ...m, assignedTo: m.assignedTo.includes(c.id) ? m.assignedTo.filter((x) => x !== c.id) : [...m.assignedTo, c.id] })}>
              <Avatar avatar={c.avatar} color={c.color} size={26} /> {c.name}
            </button>
          ))}
        </div>
        <Toggle label="Aktiv" checked={m.active} onChange={(v) => setM({ ...m, active: v })} />
        <IconPicker value={m.icon} onChange={(icon) => setM({ ...m, icon })} />
      </div>
    </Modal>
  );
}

import { Plus, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Field } from '../../components/FormControls';
import { Modal } from '../../components/Modal';
import { AREA_LABEL, LEVEL_LABEL, PHASES, PROJECT_IDEA_BY_ID, type ProjectIdea } from '../../data/projects';
import { db } from '../../database/db';
import { useAllLearning, useChildren, useProjects } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { goalStates } from '../../services/learning';
import {
  chronicle, currentPhase, ideasForNow, isInSeason, knownLetters, levelAtLeast, nextStep, projectLevel, projectPhotos, projectProgress, startProject, tasksFor,
  type ProjectChildSetup,
} from '../../services/projects';
import type { ChildProfile, FamilyProject, ProjectLevel } from '../../types';
import { formatLong, toDateKey } from '../../utils/dates';
import './projects.css';

/** Unsere Projektwerkstatt: laufende Projekte, Ideensammlung und die Projektchronik. */
export function ProjectsPage() {
  const today = toDateKey(useNow(60_000));
  const projects = useProjects();
  const children = useChildren();
  const [starting, setStarting] = useState<{ idea?: ProjectIdea; title?: string; copyFrom?: FamilyProject } | null>(null);
  const [own, setOwn] = useState('');
  const [chronicleChild, setChronicleChild] = useState<string | undefined>(undefined);
  if (!projects || !children) return null;

  const active = projects.filter((p) => p.status === 'active').sort((a, b) => a.startDate.localeCompare(b.startDate));
  const paused = projects.filter((p) => p.status === 'paused');
  const done = chronicle(projects, chronicleChild);
  const ideas = ideasForNow(today);
  const running = new Set(active.map((p) => p.ideaId));

  return (
    <div>
      <header className="page-head">
        <h1>Unsere Projektwerkstatt</h1>
        <span className="page-head__sub">Entdecken, Planen, Machen, Dokumentieren, Abschließen</span>
      </header>
      <div className="stack">
        {active.length > 0 && (
          <section className="pj-active">
            {active.map((p) => <ProjectCard key={p.id} project={p} kids={children} />)}
          </section>
        )}

        <section className="card">
          <h2 className="card__title">Ideen für unser nächstes Projekt</h2>
          <p className="muted pj-lead">Jedes Kind bekommt im selben Projekt eigene Aufgaben, passend zu dem, was es gerade lernt.</p>
          <div className="pj-ideas">
            {ideas.map((i) => (
              <button key={i.id} type="button" className={`pj-idea ${isInSeason(i, today) && i.months.length ? 'pj-idea--season' : ''}`} onClick={() => setStarting({ idea: i })}>
                <span className="pj-idea__emoji" aria-hidden="true">{i.emoji}</span>
                <span className="pj-idea__title">{i.title}</span>
                <span className="pj-idea__meta">
                  {running.has(i.id) ? 'läuft gerade' : i.months.length && isInSeason(i, today) ? 'passt jetzt' : i.weeks === 1 ? 'etwa 1 Woche' : `etwa ${i.weeks} Wochen`}
                </span>
              </button>
            ))}
          </div>
          <div className="row pj-own">
            <input className="input" placeholder="Eigenes Projekt, z. B. Vogelhaus bauen" value={own} aria-label="Eigenes Projekt" onChange={(e) => setOwn(e.target.value)} />
            <button type="button" className="btn" disabled={!own.trim()} onClick={() => { setStarting({ title: own.trim() }); setOwn(''); }}><Plus size={18} aria-hidden="true" /> Starten</button>
          </div>
        </section>

        {paused.length > 0 && (
          <section className="card">
            <h2 className="card__title">Pausiert</h2>
            <ul className="list">
              {paused.map((p) => (
                <li key={p.id} className="list-item">
                  <span className="pj-emoji" aria-hidden="true">{p.emoji}</span>
                  <Link to={`/projekte/${p.id}`} className="list-item__main"><p className="list-item__title">{p.title}</p><p className="list-item__meta">seit {formatLong(p.startDate)}</p></Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="card">
          <div className="row row--wrap pj-chron-head">
            <h2 className="card__title" style={{ margin: 0 }}>Projektchronik</h2>
            <div className="spacer" />
            <div className="seg" role="group" aria-label="Chronik für">
              <button type="button" className="seg__item" aria-pressed={!chronicleChild} onClick={() => setChronicleChild(undefined)}>Alle</button>
              {children.map((c) => <button key={c.id} type="button" className="seg__item" aria-pressed={chronicleChild === c.id} onClick={() => setChronicleChild(c.id)}>{c.name}</button>)}
            </div>
          </div>
          {done.length === 0 ? <p className="muted">Hier sammeln sich eure abgeschlossenen Projekte mit Fotos.</p> : (
            <div className="pj-chron">
              {done.map((p) => {
                const photo = projectPhotos(p)[0];
                const idea = PROJECT_IDEA_BY_ID.get(p.ideaId);
                return (
                  <div key={p.id} className="pj-chron__item">
                    <Link to={`/projekte/${p.id}`} className="pj-chron__cover">
                      {photo ? <img src={photo} alt="" /> : <span aria-hidden="true">{p.emoji}</span>}
                    </Link>
                    <div className="pj-chron__text">
                      <Link to={`/projekte/${p.id}`} className="pj-chron__title">{p.title}</Link>
                      <span className="small muted">{p.doneAt ? formatLong(p.doneAt) : ''} · {p.childIds.map((id) => children.find((c) => c.id === id)?.name).filter(Boolean).join(', ')}</span>
                      {p.reflection && <span className="small">{p.reflection}</span>}
                    </div>
                    <button type="button" className="btn btn--small btn--ghost" onClick={() => setStarting(idea ? { idea } : { title: p.title, copyFrom: p })}>
                      <RotateCcw size={16} aria-hidden="true" /> Nochmal
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
      {starting && <StartModal {...starting} kids={children} today={today} onClose={() => setStarting(null)} />}
    </div>
  );
}

function ProjectCard({ project: p, kids: children }: { project: FamilyProject; kids: ChildProfile[] }) {
  const phase = currentPhase(p);
  const step = nextStep(p);
  const { done, total } = projectProgress(p);
  const phaseIndex = PHASES.findIndex((x) => x.id === phase);
  return (
    <Link to={`/projekte/${p.id}`} className="card pj-card">
      <div className="pj-card__head">
        <span className="pj-card__emoji" aria-hidden="true">{p.emoji}</span>
        <div className="grow">
          <p className="pj-card__title">{p.title}</p>
          <p className="small muted">{done} von {total} erledigt{p.targetDate ? ` · Ziel: ${formatLong(p.targetDate)}` : ''}</p>
        </div>
        <div className="pj-avatars">
          {p.childIds.map((id) => { const c = children.find((k) => k.id === id); return c ? <Avatar key={id} avatar={c.avatar} color={c.color} size={44} label={c.name} /> : null; })}
        </div>
      </div>
      <ol className="pj-phases" aria-label="Projektschritte">
        {PHASES.map((ph, i) => (
          <li key={ph.id} className={i < phaseIndex ? 'is-done' : i === phaseIndex ? 'is-now' : ''}><span aria-hidden="true">{ph.emoji}</span> {ph.label}</li>
        ))}
      </ol>
      {step && <p className="pj-card__next"><strong>Als Nächstes:</strong> {step.label}</p>}
    </Link>
  );
}

/** Kinder auswählen, Niveau prüfen, Projekt starten. */
function StartModal({ idea, title: initialTitle, copyFrom, kids: children, today, onClose }: {
  idea?: ProjectIdea; title?: string; copyFrom?: FamilyProject; kids: ChildProfile[]; today: string; onClose: () => void;
}) {
  const navigate = useNavigate();
  const learning = useAllLearning();
  const setups = useMemo(() => {
    const out: Record<string, { level: ProjectLevel; known: string[] }> = {};
    for (const c of children) {
      const states = learning ? goalStates(c.id, learning.observations, learning.releases, today) : [];
      out[c.id] = { level: projectLevel(c, today, states), known: knownLetters(states) };
    }
    return out;
  }, [children, learning, today]);
  const [selected, setSelected] = useState<string[]>(() => idea?.minLevel ? [] : copyFrom?.childIds ?? children.map((c) => c.id));
  const [levels, setLevels] = useState<Record<string, ProjectLevel>>({});
  const [title, setTitle] = useState(initialTitle ?? idea?.title ?? '');
  const [emoji, setEmoji] = useState(idea?.emoji ?? copyFrom?.emoji ?? '✨');
  const [description, setDescription] = useState(copyFrom?.description ?? '');
  const [targetDate, setTargetDate] = useState('');
  const [busy, setBusy] = useState(false);
  if (!learning) return null;

  const levelOf = (id: string) => levels[id] ?? setups[id].level;
  const chosen: ProjectChildSetup[] = children.filter((c) => selected.includes(c.id)).map((c) => ({ child: c, level: levelOf(c.id), known: setups[c.id].known }));
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const start = async () => {
    setBusy(true);
    const p = await startProject(db, { idea, title, emoji, description, children: chosen, startDate: today, ...(targetDate ? { targetDate } : {}), ...(copyFrom ? { copyFrom } : {}) });
    onClose();
    navigate(`/projekte/${p.id}`);
  };

  return (
    <Modal title={`${emoji} ${title || 'Neues Projekt'}`} onClose={onClose} wide
      actions={<><button type="button" className="btn" onClick={onClose}>Abbrechen</button>
        <button type="button" className="btn btn--primary" disabled={!selected.length || !title.trim() || busy} onClick={() => void start()}>Projekt starten</button></>}>
      <div className="stack">
        {idea && <p className="muted">{idea.summary}</p>}
        {idea?.note && <p className="notice notice--info">{idea.note}</p>}
        {idea && <p className="small">{idea.areas.map((a) => <span key={a} className="chip pj-area">{AREA_LABEL[a] ?? a}</span>)}</p>}
        {!idea && (
          <div className="row row--wrap">
            <Field label="Zeichen" className="pj-emoji-field"><input className="input" value={emoji} maxLength={4} onChange={(e) => setEmoji(e.target.value)} /></Field>
            <Field label="Projektname" className="grow"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          </div>
        )}
        {!idea && <Field label="Worum geht es? (optional)"><textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>}

        <div>
          <h3 className="ft-sub">Wer macht mit?</h3>
          <div className="pj-who">
            {children.map((c) => {
              const on = selected.includes(c.id);
              const level = levelOf(c.id);
              const tooYoung = idea?.minLevel && !levelAtLeast(level, idea.minLevel);
              const preview = idea && on ? tasksFor(idea, level, setups[c.id].known) : [];
              return (
                <div key={c.id} className={`pj-who__child tone-${c.color} ${on ? 'is-on' : ''}`}>
                  <button type="button" className="pj-who__toggle" aria-pressed={on} onClick={() => toggle(c.id)}>
                    <Avatar avatar={c.avatar} color={c.color} size={56} />
                    <span className="pj-who__name">{c.name}</span>
                    <span className="small muted">{on ? 'macht mit' : 'diesmal nicht'}</span>
                  </button>
                  {on && (
                    <>
                      <select className="input pj-who__level" value={level} aria-label={`Niveau für ${c.name}`}
                        onChange={(e) => setLevels({ ...levels, [c.id]: e.target.value as ProjectLevel })}>
                        {(Object.keys(LEVEL_LABEL) as ProjectLevel[]).map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
                      </select>
                      {tooYoung && <p className="small muted">Dieses Projekt ist eher etwas für Schulkinder; {c.name} kann trotzdem kleine Aufgaben übernehmen.</p>}
                      {preview.length > 0 && <ul className="pj-who__tasks">{preview.map((t) => <li key={t}>{t}</li>)}</ul>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {idea && <p className="small muted">Das Niveau kommt aus Alter und Lesepfad. Leseaufgaben nehmen nur Wörter, deren Buchstaben schon sicher sitzen; sonst wird nachgespurt.</p>}
        </div>
        <Field label="Bis wann ungefähr? (optional)"><input className="input" type="date" min={today} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

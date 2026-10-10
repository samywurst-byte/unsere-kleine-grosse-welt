import { ClipboardCheck, Download, FileText, Pencil, Printer, Share2 } from 'lucide-react';
import { getISOWeek } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Field, Segmented, Toggle } from '../../components/FormControls';
import { db } from '../../database/db';
import { LETTERS } from '../../data/readingCurriculum';
import { useAllLearning, useChildren, useLearningPacks } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { goalStates, type GoalState } from '../../services/learning';
import { mathStates } from '../../services/math';
import {
  defaultLetter, defaultTrack, packForWeek, pagesForScope, planPack, recordPrint, savePack, themeTitle, TRACK_LABEL,
  type PackPlan, type PrintScope,
} from '../../services/learningPack';
import type { ChildProfile, LearningObservation, LearningPack, PackTrack } from '../../types';
import { formatDayMonth, fromDateKey, toDateKey, weekStartKey } from '../../utils/dates';
import { ObservationSheetEntry } from './ObservationSheetEntry';
import './learning.css';

const TRACKS: PackTrack[] = ['letters', 'preschool', 'toddler', 'math', 'skip'];

/** Elternbereich › Lernpaket: ein Thema für alle, passende A4-Blätter je Kind, als PDF zum Drucken. */
export function LearningPackPage() {
  const today = toDateKey(useNow(60_000));
  const week = weekStartKey(today);
  const children = useChildren();
  const learning = useAllLearning();
  const packs = useLearningPacks();
  const [editing, setEditing] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);

  const statesByChild = useMemo(() => {
    const map = new Map<string, GoalState[]>();
    if (learning && children) for (const c of children) map.set(c.id, goalStates(c.id, learning.observations, learning.releases, today));
    return map;
  }, [learning, children, today]);
  const mathStatesByChild = useMemo(() => {
    const map = new Map<string, GoalState[]>();
    if (learning && children) for (const c of children) map.set(c.id, mathStates(c.id, learning.observations, learning.releases, today));
    return map;
  }, [learning, children, today]);

  if (!children || !learning || !packs) return null;
  const current = packForWeek(packs, week);
  const viewed = viewId ? packs.find((p) => p.id === viewId) : current;
  const older = packs.filter((p) => p.id !== current?.id);

  return (
    <div className="parent-section">
      <div className="parent-section__head">
        <h2>Unser Lernpaket für diese Woche</h2>
        <span className="muted">KW {getISOWeek(fromDateKey(week))} · ab {formatDayMonth(week)}</span>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Ein Thema für alle am Tisch, für jedes Kind passende Blätter. Gelernt wird auf Papier, das Tablet bereitet nur vor.
        Danach tragt ihr im <Link to="/eltern/lernen">Lesepfad</Link> oder <Link to="/eltern/rechnen">Rechenpfad</Link> ein, wie es lief.
      </p>

      {(!current || editing) && (
        <PackForm
          key={current?.id ?? 'new'} week={week} today={today} children={children} statesByChild={statesByChild}
          existing={editing ? current : undefined}
          onDone={() => { setEditing(false); setViewId(null); }}
          onCancel={current ? () => setEditing(false) : undefined}
        />
      )}

      {viewed && !(editing && viewed.id === current?.id) && (
        <PackView
          key={viewed.id} pack={viewed} children={children} statesByChild={statesByChild} mathStatesByChild={mathStatesByChild} today={today} observations={learning.observations}
          isCurrent={viewed.id === current?.id}
          onEdit={() => { setViewId(null); setEditing(true); }}
          onBack={viewId ? () => setViewId(null) : undefined}
        />
      )}

      {older.length > 0 && (
        <div className="card">
          <h3 className="card__title">Frühere Lernpakete</h3>
          <ul className="list">
            {older.map((p) => (
              <li key={p.id} className="list-item">
                <FileText size={22} aria-hidden="true" />
                <div className="list-item__main">
                  <p className="list-item__title">{themeTitle(LETTERS.find((l) => l.upper === p.letter) ?? LETTERS[0])}</p>
                  <p className="list-item__meta">KW {getISOWeek(fromDateKey(p.weekStart))} · {p.prints.length ? `${p.prints.length}× gedruckt` : 'noch nicht gedruckt'}</p>
                </div>
                <button type="button" className="btn btn--small" onClick={() => { setEditing(false); setViewId(p.id); }}>Ansehen und drucken</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PackForm({ week, today, children, statesByChild, existing, onDone, onCancel }: {
  week: string; today: string; children: ChildProfile[]; statesByChild: Map<string, GoalState[]>;
  existing?: LearningPack; onDone: () => void; onCancel?: () => void;
}) {
  const [letter, setLetter] = useState(() => existing?.letter ?? defaultLetter(
    children.filter((c) => defaultTrack(c, today, statesByChild.get(c.id) ?? []) === 'letters')
      .map((c) => ({ childId: c.id, states: statesByChild.get(c.id) ?? [], releases: [] })),
    today,
  ));
  const [tracks, setTracks] = useState<Record<string, PackTrack>>(() => Object.fromEntries(children.map((c) => [
    c.id, existing?.children.find((x) => x.childId === c.id)?.track ?? defaultTrack(c, today, statesByChild.get(c.id) ?? []),
  ])));
  const [math, setMath] = useState<Record<string, boolean>>(() => Object.fromEntries(children.map((c) => [
    c.id, existing?.children.find((x) => x.childId === c.id)?.math ?? true,
  ])));
  const anyone = Object.values(tracks).some((t) => t !== 'skip');

  const save = async () => {
    await savePack(db, week, letter, children.map((c) => ({ childId: c.id, track: tracks[c.id] ?? 'skip', math: math[c.id] ?? false })), existing);
    onDone();
  };

  return (
    <div className="card">
      <h3 className="card__title">{existing ? 'Lernpaket ändern' : 'Lernpaket zusammenstellen'}</h3>
      <div className="stack">
        <Field label="Thema der Woche" hint="Vorgeschlagen ist der Buchstabe, an dem gerade geübt wird. Bilder gibt es bisher für M, A, I, O, L, S, E und N; bei den anderen malen die Kinder selbst.">
          <select className="input" value={letter} onChange={(e) => setLetter(e.target.value)}>
            {LETTERS.map((l) => <option key={l.upper} value={l.upper}>{themeTitle(l)}</option>)}
          </select>
        </Field>
        {children.map((c) => (
          <div key={c.id} className="pack-child">
            <span className="pack-child__name"><Avatar avatar={c.avatar} color={c.color} size={40} /> {c.name}</span>
            <Segmented label={`Blätter für ${c.name}`} value={tracks[c.id]} options={TRACKS.map((t) => ({ value: t, label: TRACK_LABEL[t] }))}
              onChange={(t) => setTracks((s) => ({ ...s, [c.id]: t }))} />
            {(tracks[c.id] === 'letters' || tracks[c.id] === 'preschool') && (
              <Toggle label="Rechenblätter dazu" checked={math[c.id] ?? false} onChange={(v) => setMath((s) => ({ ...s, [c.id]: v }))} />
            )}
          </div>
        ))}
        <div className="row">
          <button type="button" className="btn btn--primary" disabled={!anyone} onClick={() => void save()}>{existing ? 'Speichern' : 'Lernpaket erstellen'}</button>
          {onCancel && <button type="button" className="btn" onClick={onCancel}>Abbrechen</button>}
        </div>
      </div>
    </div>
  );
}

interface PdfResult { scope: PrintScope; url: string; file: File; pages: number }

function PackView({ pack, children, statesByChild, mathStatesByChild, today, observations, isCurrent, onEdit, onBack }: {
  pack: LearningPack; children: ChildProfile[]; statesByChild: Map<string, GoalState[]>; mathStatesByChild: Map<string, GoalState[]>; today: string;
  observations: LearningObservation[];
  isCurrent: boolean; onEdit: () => void; onBack?: () => void;
}) {
  const plan = useMemo(
    () => planPack({ pack, children, statesByChild, mathStatesByChild, today }),
    [pack, children, statesByChild, mathStatesByChild, today],
  );
  const [busy, setBusy] = useState<PrintScope | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRows = useMemo(() => {
    const page = plan.pages.find((p) => p.spec.kind === 'observation');
    return page?.spec.kind === 'observation' ? page.spec.rows : [];
  }, [plan]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PdfResult | null>(null);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);

  const scopes: { scope: PrintScope; label: string }[] = [
    { scope: 'all', label: 'Alles' },
    ...pack.children.filter((c) => c.track !== 'skip').map((c) => ({
      scope: `child:${c.childId}` as PrintScope, label: `Nur ${children.find((k) => k.id === c.childId)?.name ?? 'Kind'}`,
    })),
    { scope: 'game', label: 'Nur Memory' },
    { scope: 'observation', label: 'Nur Beobachtungsbogen' },
  ];

  const create = async (scope: PrintScope) => {
    setBusy(scope); setError(null);
    try {
      const pages = pagesForScope(plan, scope);
      const { renderWorksheets, loadWorksheetFonts } = await import('../../services/worksheetPdf');
      const bytes = await renderWorksheets(plan, pages, await loadWorksheetFonts());
      const name = fileName(plan, scope, children);
      const file = new File([bytes as BlobPart], name, { type: 'application/pdf' });
      setResult((old) => { if (old) URL.revokeObjectURL(old.url); return { scope, url: URL.createObjectURL(file), file, pages: pages.length }; });
      await recordPrint(db, pack.id, scope, pages.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Das PDF konnte nicht erstellt werden.');
    } finally {
      setBusy(null);
    }
  };

  const canShare = result && typeof navigator.canShare === 'function' && navigator.canShare({ files: [result.file] });
  const share = async () => {
    if (!result) return;
    try { await navigator.share({ files: [result.file], title: result.file.name }); } catch { /* abgebrochen */ }
  };

  const sections = groupPages(plan);
  const withoutMath = pack.children
    .filter((c) => c.math === false && (c.track === 'letters' || c.track === 'preschool'))
    .map((c) => children.find((k) => k.id === c.childId)?.name).filter(Boolean);
  const lastPrint = pack.prints[pack.prints.length - 1];

  return (
    <div className="card">
      <div className="parent-section__head" style={{ marginBottom: 'var(--space-3)' }}>
        <h3 className="card__title" style={{ flex: 1, margin: 0 }}>
          {plan.title}{!isCurrent && ` · KW ${getISOWeek(fromDateKey(pack.weekStart))}`}
        </h3>
        {onBack && <button type="button" className="btn btn--small" onClick={onBack}>Zurück zu dieser Woche</button>}
        {isCurrent && <button type="button" className="btn btn--small" onClick={onEdit}><Pencil size={16} aria-hidden="true" /> Ändern</button>}
      </div>

      <ul className="pack-pages">
        {sections.map((s) => (
          <li key={s.key}>
            <strong>{s.label}</strong> <span className="muted">({s.pages.length} {s.pages.length === 1 ? 'Seite' : 'Seiten'})</span>
            <span className="pack-pages__titles">{s.pages.map((p) => p.title).join(' · ')}</span>
          </li>
        ))}
      </ul>
      {withoutMath.length > 0 && (
        <p className="small muted">Ohne Rechenblätter: {withoutMath.join(', ')}. Einschalten unter „Ändern“.</p>
      )}
      <p className="small muted">
        {plan.pages.length} Seiten insgesamt, A4 in Schwarzweiß. Nicht jedes Blatt muss fertig werden.
        {lastPrint && ` Zuletzt als PDF erstellt am ${new Date(lastPrint.at).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}.`}
      </p>

      <div className="pack-print">
        {scopes.map(({ scope, label }) => (
          <button key={scope} type="button" className={`btn ${scope === 'all' ? 'btn--primary' : ''}`} disabled={!!busy} onClick={() => void create(scope)}>
            <Printer size={18} aria-hidden="true" /> {busy === scope ? 'Wird erstellt …' : `${label} (${pagesForScope(plan, scope).length})`}
          </button>
        ))}
      </div>

      {sheetRows.length > 0 && !sheetOpen && (
        <div className="notice pack-sheet">
          <span>Nach dem Lernen: den angekreuzten Beobachtungsbogen hier übertragen.</span>
          <button type="button" className="btn btn--sage" onClick={() => setSheetOpen(true)}><ClipboardCheck size={18} aria-hidden="true" /> Bogen eintragen</button>
        </div>
      )}
      {sheetOpen && (
        <ObservationSheetEntry
          packId={pack.id} rows={sheetRows} children={children} observations={observations}
          today={today < pack.weekStart ? pack.weekStart : today} onClose={() => setSheetOpen(false)}
        />
      )}

      {error && <p className="notice notice--error">{error}</p>}
      {result && (
        <div className="notice notice--ok pack-result">
          <span>PDF ist fertig: {result.pages} {result.pages === 1 ? 'Seite' : 'Seiten'}.</span>
          {canShare && <button type="button" className="btn btn--sage" onClick={() => void share()}><Share2 size={18} aria-hidden="true" /> Drucken oder teilen</button>}
          <a className="btn" href={result.url} target="_blank" rel="noopener">Öffnen</a>
          <a className="btn" href={result.url} download={result.file.name}><Download size={18} aria-hidden="true" /> Speichern</a>
        </div>
      )}
      {result && canShare && <p className="small muted">Im Teilen-Menü auf „Drucken“ tippen. Dort lässt sich auch „In Dateien sichern“ wählen.</p>}
    </div>
  );
}

function groupPages(plan: PackPlan) {
  const groups: { key: string; label: string; pages: PackPlan['pages'] }[] = [];
  for (const p of plan.pages) {
    const key = p.childId ?? p.section;
    let g = groups.find((x) => x.key === key);
    if (!g) {
      g = { key, label: p.childName ?? (p.section === 'game' ? 'Gemeinsames Spiel' : 'Für euch Eltern'), pages: [] };
      groups.push(g);
    }
    g.pages.push(p);
  }
  return groups;
}

function fileName(plan: PackPlan, scope: PrintScope, children: ChildProfile[]): string {
  const kw = getISOWeek(fromDateKey(plan.pack.weekStart));
  const who = scope === 'all' ? 'alle' : scope === 'game' ? 'Memory' : scope === 'observation' ? 'Beobachtungsbogen'
    : children.find((c) => `child:${c.id}` === scope)?.name ?? 'Kind';
  const safe = (s: string) => s.replace(/[^A-Za-z0-9ÄÖÜäöüß-]+/g, '-');
  return `Lernpaket-KW${kw}-${safe(plan.letter.upper)}-${safe(who)}.pdf`;
}

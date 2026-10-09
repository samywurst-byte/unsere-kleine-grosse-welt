import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AVATAR_LABELS } from '../../components/Avatar';
import { ColorPicker, Field, Segmented, Toggle } from '../../components/FormControls';
import { Modal } from '../../components/Modal';
import { formatMonthYear, isValidSchoolEntry, readingPathStart } from '../../services/school';
import { db } from '../../database/db';
import { useMembers } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import type { AgeStage, AvatarKey, ChildProfile, Member } from '../../types';
import { ageInYears, isValidDateKey, toDateKey } from '../../utils/dates';
import { newId } from '../../utils/id';

const STAGES: { value: AgeStage; label: string; max: number; help: boolean; labels: boolean }[] = [
  { value: 'small', label: 'Klein (1–2 Karten, mit Hilfe)', max: 1, help: true, labels: false },
  { value: 'medium', label: 'Mittel (2 Karten)', max: 2, help: false, labels: true },
  { value: 'large', label: 'Groß (bis 4 Karten)', max: 4, help: false, labels: true },
];

export function FamilySettings() {
  const members = useMembers();
  const today = toDateKey(useNow(60_000));
  const [editing, setEditing] = useState<Member | null>(null);

  const addChild = () => {
    const sortOrder = (members?.length ?? 0) + 1;
    const child: ChildProfile = {
      id: newId('child'), role: 'child', name: '', color: 'gold', avatar: 'bear', sortOrder, active: true,
      ageStage: 'medium', maxVisibleTasks: 2, needsHelp: false, showLabels: true,
    };
    setEditing(child);
  };

  return (
    <div className="parent-section">
      <div className="parent-section__head">
        <h2>Familienmitglieder</h2>
        <button type="button" className="btn btn--sky" onClick={addChild}><Plus size={18} aria-hidden="true" /> Kind hinzufügen</button>
      </div>
      <ul className="list">
        {members?.map((m) => (
          <li key={m.id} className="list-item" style={{ opacity: m.active ? 1 : 0.55 }}>
            <Avatar avatar={m.avatar} color={m.color} size={52} />
            <div className="list-item__main">
              <p className="list-item__title">{m.name}{!m.active && ' (ausgeblendet)'}</p>
              <p className="list-item__meta">
                {m.role === 'parent' ? 'Elternteil' : 'Kind'}
                {m.birthDate && ` · ${ageInYears(m.birthDate, today)} Jahre · Geburtstag ${m.birthDate.split('-').reverse().join('.')}`}
                {m.role === 'child' && (m as ChildProfile).schoolEntryDate && ` · Einschulung ${formatMonthYear((m as ChildProfile).schoolEntryDate!)}`}
              </p>
            </div>
            <button type="button" className="btn btn--small" onClick={() => setEditing(m)}><Pencil size={16} aria-hidden="true" /> Bearbeiten</button>
          </li>
        ))}
      </ul>
      {editing && <MemberEditor member={editing} onClose={() => setEditing(null)} today={today} />}
    </div>
  );
}

function MemberEditor({ member, onClose, today }: { member: Member; onClose: () => void; today: string }) {
  const [draft, setDraft] = useState<Member>(member);
  const [error, setError] = useState<string | null>(null);
  const isChild = draft.role === 'child';
  const child = draft as ChildProfile;
  const set = (patch: Partial<ChildProfile>) => setDraft((d) => ({ ...d, ...patch }) as Member);

  const save = async () => {
    if (!draft.name.trim()) { setError('Bitte einen Namen eingeben.'); return; }
    if (draft.birthDate && (!isValidDateKey(draft.birthDate) || draft.birthDate > today)) { setError('Bitte ein gültiges Geburtsdatum wählen.'); return; }
    if (isChild && !isValidSchoolEntry(child.schoolEntryDate, draft.birthDate)) { setError('Bitte ein gültiges Einschulungsdatum wählen.'); return; }
    await db.members.put({
      ...draft, name: draft.name.trim(), birthDate: draft.birthDate || undefined,
      ...(isChild ? { schoolEntryDate: child.schoolEntryDate || undefined } : {}),
    });
    onClose();
  };

  const avatars: AvatarKey[] = isChild ? ['fox', 'rabbit', 'hedgehog', 'flower', 'bear', 'owl'] : ['parent-a', 'parent-b', 'fox', 'rabbit', 'hedgehog', 'flower', 'bear', 'owl'];

  return (
    <Modal
      title={member.name ? `${member.name} bearbeiten` : 'Neues Kind'}
      onClose={onClose}
      wide
      actions={(<><button type="button" className="btn" onClick={onClose}>Abbrechen</button><button type="button" className="btn btn--primary" onClick={save}>Speichern</button></>)}
    >
      <div className="form-grid">
        {error && <p className="notice notice--error span-2">{error}</p>}
        <Field label="Name"><input className="input" value={draft.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="Geburtsdatum" hint={draft.birthDate && isValidDateKey(draft.birthDate) ? `Alter: ${ageInYears(draft.birthDate, today)} Jahre (automatisch berechnet)` : 'Optional'}>
          <input className="input" type="date" value={draft.birthDate ?? ''} max={today} onChange={(e) => set({ birthDate: e.target.value || undefined })} />
        </Field>
        <Field label="Avatar" className="span-2">
          <div className="row row--wrap">
            {avatars.map((a) => (
              <button key={a} type="button" className="kid-select__item" style={{ padding: 4 }} aria-pressed={draft.avatar === a} onClick={() => set({ avatar: a })} aria-label={AVATAR_LABELS[a]}>
                <Avatar avatar={a} color={draft.color} size={56} />
              </button>
            ))}
          </div>
        </Field>
        <Field label="Profilfarbe" className="span-2"><ColorPicker value={draft.color} onChange={(color) => set({ color })} /></Field>
        {isChild && (
          <>
            <Field
              label="Einschulung (geplant)"
              hint={child.schoolEntryDate && isValidDateKey(child.schoolEntryDate)
                ? `Der Lesepfad startet ein Jahr vorher, ab ${formatMonthYear(readingPathStart(child.schoolEntryDate))}.`
                : 'Optional. Grundlage für den späteren Lesepfad.'}
            >
              <input className="input" type="date" value={child.schoolEntryDate ?? ''} onChange={(e) => set({ schoolEntryDate: e.target.value || undefined })} />
            </Field>
            <Field label="Altersstufe" className="span-2" hint="Steuert, wie viele Karten gleichzeitig zu sehen sind. Einzelwerte lassen sich darunter anpassen.">
              <Segmented
                label="Altersstufe" value={child.ageStage}
                options={STAGES.map((s) => ({ value: s.value, label: s.label }))}
                onChange={(v) => { const s = STAGES.find((x) => x.value === v)!; set({ ageStage: v, maxVisibleTasks: s.max, needsHelp: s.help, showLabels: s.labels }); }}
              />
            </Field>
            <Field label="Gleichzeitig sichtbare Aufgabenkarten">
              <Segmented label="Karten" value={String(child.maxVisibleTasks)} options={['1', '2', '3', '4'].map((v) => ({ value: v, label: v }))} onChange={(v) => set({ maxVisibleTasks: Number(v) })} />
            </Field>
            <div className="stack" style={{ gap: 0 }}>
              <Toggle label="Erledigen mit Hilfe eines Erwachsenen bestätigen" checked={child.needsHelp} onChange={(needsHelp) => set({ needsHelp })} />
              <Toggle label="Text unter den Bildkarten zeigen" checked={child.showLabels} onChange={(showLabels) => set({ showLabels })} />
            </div>
          </>
        )}
        <div className="span-2"><Toggle label="Profil aktiv (ausgeblendete Profile bleiben gespeichert)" checked={draft.active} onChange={(active) => set({ active })} /></div>
      </div>
    </Modal>
  );
}

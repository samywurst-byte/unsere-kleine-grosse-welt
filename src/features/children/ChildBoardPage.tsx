import { ChevronLeft, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { Modal } from '../../components/Modal';
import { db } from '../../database/db';
import { useChildren, useIsHoliday, useSettings } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { completeChore, reopenChore } from '../../services/chores';
import { getDayPhase, ROUTINE_PHASE_LABEL } from '../../services/dayPhase';
import { setRoutineDone } from '../../services/routines';
import type { ChildProfile, RoutinePhase } from '../../types';
import { formatWeekday, toDateKey } from '../../utils/dates';
import { TaskCard } from '../routines/TaskCard';
import { useChildDay, type ChoreItem, type RoutineItem } from './useChildDay';
import './children.css';

type Item = RoutineItem | ChoreItem;
const PHASES: RoutinePhase[] = ['morning', 'afternoon', 'evening'];

function itemKey(i: Item) { return i.kind === 'routine' ? `r-${i.def.id}` : `c-${i.occ.id}`; }

export function ChildBoardPage() {
  const { childId } = useParams();
  const children = useChildren();
  const child = children?.find((c) => c.id === childId);
  const now = useNow(30_000);
  const today = toDateKey(now);
  const settings = useSettings();
  const holiday = useIsHoliday(today);
  const day = useChildDay(child, today);
  const currentPhase = settings ? getDayPhase(now, today, settings, holiday).routinePhase : 'morning';
  const [phase, setPhase] = useState<RoutinePhase | null>(null);
  const [confirm, setConfirm] = useState<Item | null>(null);

  // Beim Wechsel des Kindes zur aktuellen Tagesphase zurückkehren
  useEffect(() => { setPhase(null); }, [childId]);

  if (children && !child) return <p className="empty">Dieses Profil gibt es nicht mehr. <Link to="/aufgaben">Zurück</Link></p>;
  if (!child || !day.loaded) return null;

  const shownPhase = phase ?? currentPhase;
  const openChores = day.chores.filter((c) => c.occ.status === 'open');
  const routines = day.byPhase[shownPhase];
  const items: Item[] = [...openChores, ...routines];
  const open = items.filter((i) => !i.done);
  const done = [...day.chores.filter((c) => c.done), ...routines.filter((r) => r.done)];
  const visible = open.slice(0, child.maxVisibleTasks);
  const hiddenCount = open.length - visible.length;

  const apply = async (item: Item, value: boolean, together = false) => {
    if (item.kind === 'routine') await setRoutineDone(db, item.def, child, today, value);
    else if (value) await completeChore(db, item.occ.id, together || child.needsHelp);
    else await reopenChore(db, item.occ.id);
  };

  const onTap = (item: Item) => {
    if (child.needsHelp && !item.done) setConfirm(item);
    else void apply(item, !item.done);
  };

  const size = cardSize(child, visible.length);

  return (
    <div className={`board tone-${child.color}`}>
      <header className="board__head">
        <Link to="/aufgaben" className="btn btn--icon btn--ghost" aria-label="Zurück zur Kinderauswahl"><ChevronLeft /></Link>
        <Avatar avatar={child.avatar} color={child.color} size={84} />
        <div>
          <h1 className="board__name">{child.name}</h1>
          <p className="muted">Heute ist {formatWeekday(today)}</p>
        </div>
        <div className="spacer" />
        <div className="seg board__phases" role="group" aria-label="Tageszeit">
          {PHASES.map((p) => (
            <button key={p} type="button" className="seg__item" aria-pressed={shownPhase === p} onClick={() => setPhase(p)}>
              {ROUTINE_PHASE_LABEL[p]}
            </button>
          ))}
        </div>
      </header>

      {openChores.length > 0 && (
        <p className="board__hint"><Icon name="house" size={20} /> Heute ist Haushaltstag. Deine Familienaufgabe wartet auf dich.</p>
      )}

      {visible.length > 0 ? (
        <section className={`board__cards board__cards--${visible.length}`} aria-label="Meine nächsten Aufgaben">
          {visible.map((item) => (
            <TaskCard
              key={itemKey(item)}
              title={item.def.title}
              icon={item.def.icon}
              done={item.done}
              size={size}
              showLabel={child.showLabels}
              badge={item.kind === 'chore' ? 'Haushaltstag' : undefined}
              helpNote={item.kind === 'chore' ? item.def.helpNote : undefined}
              timerPresetId={item.kind === 'routine' ? item.def.timerPresetId : undefined}
              onToggle={() => onTap(item)}
            />
          ))}
        </section>
      ) : (
        <section className="board__all-done">
          <svg viewBox="0 0 120 80" width="160" aria-hidden="true">
            <path d="M10 70 Q60 10 110 70 Z" fill="var(--c-sage-soft)" />
            <path d="M60 68 C60 40 40 30 30 34 C34 50 46 60 60 68 Z" fill="var(--sage)" />
            <path d="M60 68 C60 36 80 24 92 28 C88 46 74 60 60 68 Z" fill="var(--done)" />
          </svg>
          <h2>Alles geschafft für {shownPhase === 'morning' ? 'den Morgen' : shownPhase === 'afternoon' ? 'den Nachmittag' : 'den Abend'}!</h2>
          <p className="muted">Schön, dass du mitgeholfen hast.</p>
        </section>
      )}

      {hiddenCount > 0 && <p className="board__more">Danach {hiddenCount === 1 ? 'kommt noch 1 Aufgabe' : `kommen noch ${hiddenCount} Aufgaben`}.</p>}

      {done.length > 0 && (
        <section className="board__done" aria-label="Schon geschafft">
          <h2 className="card__eyebrow">Schon geschafft</h2>
          <div className="board__done-list">
            {done.map((item) => (
              <button key={itemKey(item)} type="button" className="done-chip" onClick={() => void apply(item, false)} aria-label={`${item.def.title} wieder öffnen`}>
                <Icon name={item.def.icon} size={22} />
                {child.showLabels && <span>{item.def.title}</span>}
                <Undo2 size={16} className="faint" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      )}

      {confirm && (
        <Modal
          title="Gemeinsam geschafft?"
          onClose={() => setConfirm(null)}
          actions={(
            <>
              <button type="button" className="btn btn--large" onClick={() => setConfirm(null)}>Noch nicht</button>
              <button
                type="button" className="btn btn--large btn--sage"
                onClick={() => { void apply(confirm, true, true); setConfirm(null); }}
              >
                Ja, mit Hilfe geschafft
              </button>
            </>
          )}
        >
          <div className="confirm-help">
            <Icon name={confirm.def.icon} size={96} strokeWidth={1.5} />
            <p className="board__name">{confirm.def.title}</p>
            <p className="muted">Ein Erwachsener bestätigt zusammen mit {child.name}.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}

function cardSize(child: ChildProfile, count: number): 's' | 'm' | 'l' | 'xl' {
  if (count <= 1) return 'xl';
  if (child.ageStage === 'small' || count === 2) return 'l';
  return 'm';
}

import { ArrowLeft, ChevronLeft, ChevronRight, FileDown, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Segmented } from '../../components/FormControls';
import { Modal } from '../../components/Modal';
import { useArchiveSource } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import {
  ARCHIVE_KIND, ARCHIVE_KINDS, archiveYears, buildArchive, byMonth, filterArchive, monthLabel, yearReview,
  type ArchiveItem, type ArchiveKind, type YearReview,
} from '../../services/archive';
import type { ChildProfile, Member } from '../../types';
import { formatLong } from '../../utils/dates';
import './archive.css';

type View = 'timeline' | 'year';

/** „Taros“, aber „Jonas’“. */
const genitive = (name: string) => (/[sßxz]$/i.test(name) ? `${name}’` : `${name}s`);

/**
 * Unser Familienarchiv: alles, was wir festgehalten haben, an einem Ort.
 * Zeitleiste mit Suche und Filtern, Jahresrückblick und ein Buch als PDF zum Aufheben.
 */
export function ArchivePage() {
  const src = useArchiveSource();
  const thisYear = useNow(60_000).getFullYear();
  const [params, setParams] = useSearchParams();
  const view: View = params.get('ansicht') === 'jahr' ? 'year' : 'timeline';
  const [query, setQuery] = useState('');
  const [memberId, setMemberId] = useState<string | undefined>();
  const [kinds, setKinds] = useState<ArchiveKind[]>([]);
  const [onlyPhotos, setOnlyPhotos] = useState(false);
  const [yearChoice, setYear] = useState<number | undefined>();
  const [openId, setOpenId] = useState<string | null>(null);

  const items = useMemo(() => (src ? buildArchive(src) : []), [src]);
  if (!src) return null;
  const members = src.members.filter((m) => m.active);
  const years = archiveYears(items);
  if (!years.includes(thisYear)) years.unshift(thisYear);
  const year = view === 'year' ? (yearChoice ?? thisYear) : yearChoice;
  const open = items.find((i) => i.id === openId);
  const setView = (v: View) => setParams(v === 'year' ? { ansicht: 'jahr' } : {}, { replace: true });

  return (
    <div>
      <header className="page-head">
        <Link to="/familienzeit" className="btn btn--icon btn--ghost" aria-label="Zurück zur Familienzeit"><ArrowLeft size={22} /></Link>
        <h1>Unser Familienarchiv</h1>
        <span className="page-head__sub">Alles, was wir erlebt und festgehalten haben</span>
      </header>
      <div className="ar-bar">
        <Segmented<View> label="Ansicht" value={view} onChange={setView}
          options={[{ value: 'timeline', label: '🗂️ Zeitleiste' }, { value: 'year', label: '📖 Jahresrückblick' }]} />
        <select className="select ar-year" aria-label="Jahr" value={year ?? ''} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : undefined)}>
          {view === 'timeline' && <option value="">Alle Jahre</option>}
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {view === 'timeline' ? (
        <Timeline items={items} members={members} filter={{ query, memberId, kinds, onlyPhotos, year }}
          set={{ setQuery, setMemberId, setKinds, setOnlyPhotos }} onOpen={setOpenId} />
      ) : (
        <YearView review={yearReview(items, src, year!)} items={items} members={members} onOpen={setOpenId} />
      )}
      {open && <ItemDetail item={open} members={members} onClose={() => setOpenId(null)} />}
    </div>
  );
}

// ------------------------------------------------------------- Zeitleiste

interface FilterState { query: string; memberId?: string; kinds: ArchiveKind[]; onlyPhotos: boolean; year?: number }
interface FilterSetters {
  setQuery: (v: string) => void; setMemberId: (v: string | undefined) => void; setKinds: (v: ArchiveKind[]) => void; setOnlyPhotos: (v: boolean) => void;
}

function Timeline({ items, members, filter, set, onOpen }: {
  items: ArchiveItem[]; members: Member[]; filter: FilterState; set: FilterSetters; onOpen: (id: string) => void;
}) {
  const shown = filterArchive(items, filter, members);
  const present = ARCHIVE_KINDS.filter((k) => items.some((i) => i.kind === k.id));
  const toggleKind = (k: ArchiveKind) => set.setKinds(filter.kinds.includes(k) ? filter.kinds.filter((x) => x !== k) : [...filter.kinds, k]);
  const who = members.find((m) => m.id === filter.memberId);
  const title = `${who ? `${genitive(who.name)} Archiv` : 'Unser Familienarchiv'}${filter.year ? ` ${filter.year}` : ''}`;

  return (
    <div className="stack">
      <section className="card ar-filters">
        <label className="ar-search">
          <Search size={20} aria-hidden="true" />
          <input className="input" type="search" value={filter.query} onChange={(e) => set.setQuery(e.target.value)} placeholder="Suchen, z. B. Laterne, Wald oder Oma" aria-label="Im Archiv suchen" />
          {filter.query && <button type="button" className="btn btn--icon btn--ghost btn--small" aria-label="Suche löschen" onClick={() => set.setQuery('')}><X size={18} /></button>}
        </label>
        <div className="seg" role="group" aria-label="Wer?">
          <button type="button" className="seg__item" aria-pressed={!filter.memberId} onClick={() => set.setMemberId(undefined)}>Alle</button>
          {members.map((m) => (
            <button key={m.id} type="button" className="seg__item ar-who" aria-pressed={filter.memberId === m.id} onClick={() => set.setMemberId(filter.memberId === m.id ? undefined : m.id)}>
              <Avatar avatar={m.avatar} color={m.color} size={26} /> {m.name}
            </button>
          ))}
        </div>
        {present.length > 1 && (
          <div className="seg" role="group" aria-label="Was?">
            {present.map((k) => (
              <button key={k.id} type="button" className="seg__item" aria-pressed={filter.kinds.includes(k.id)} onClick={() => toggleKind(k.id)}>{k.emoji} {k.label}</button>
            ))}
            <button type="button" className="seg__item" aria-pressed={filter.onlyPhotos} onClick={() => set.setOnlyPhotos(!filter.onlyPhotos)}>📷 Nur mit Fotos</button>
          </div>
        )}
        <div className="row row--wrap ar-filters__foot">
          <span className="muted">{shown.length} {shown.length === 1 ? 'Eintrag' : 'Einträge'}</span>
          <div className="spacer" />
          {shown.length > 0 && <PdfButton label="Diese Auswahl als Buch (PDF)" items={shown} members={members} title={title} subtitle={subtitleFor(shown)} />}
        </div>
      </section>

      {items.length === 0 ? (
        <p className="card muted">Noch ist das Archiv leer. Es füllt sich von selbst: mit Erinnerungen, Abenteuern, Projekten, Entdeckersonntagen, neuen Ländern auf der Weltreise und allem, was die Kinder sicher gelernt haben.</p>
      ) : shown.length === 0 ? (
        <p className="card muted">Dazu haben wir nichts gefunden.</p>
      ) : (
        byMonth(shown).map((g) => (
          <section key={g.month} className="ar-month">
            <h2 className="ar-month__title">{monthLabel(g.month)}</h2>
            <div className="ar-grid">
              {g.items.map((i) => <ItemCard key={i.id} item={i} onOpen={onOpen} />)}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function subtitleFor(items: ArchiveItem[]): string {
  if (!items.length) return '';
  const dates = items.map((i) => i.date).sort();
  const from = formatLong(dates[0]);
  const to = formatLong(dates[dates.length - 1]);
  return from === to ? from : `${from} bis ${to}`;
}

function ItemCard({ item, onOpen }: { item: ArchiveItem; onOpen: (id: string) => void }) {
  const kind = ARCHIVE_KIND.get(item.kind)!;
  return (
    <button type="button" className={`card ar-item ar-item--${item.kind}`} onClick={() => onOpen(item.id)}>
      {item.photos.length > 0 ? (
        <span className="ar-item__cover">
          <img src={item.photos[0]} alt="" />
          {item.photos.length > 1 && <span className="ar-item__count">{item.photos.length} Fotos</span>}
        </span>
      ) : <span className="ar-item__emoji" aria-hidden="true">{item.emoji}</span>}
      <span className="ar-item__kind">{kind.emoji} {kind.label} · {formatLong(item.date)}</span>
      <span className="ar-item__title">{item.title}</span>
      {(item.text || item.quotes[0]) && <span className="ar-item__text">{item.quotes[0] ? `„${item.quotes[0].text}“` : item.text}</span>}
    </button>
  );
}

function ItemDetail({ item, members, onClose }: { item: ArchiveItem; members: Member[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const kind = ARCHIVE_KIND.get(item.kind)!;
  const photos = item.photos;
  const current = Math.min(index, Math.max(0, photos.length - 1));
  return (
    <Modal title={item.title} onClose={onClose} wide
      actions={item.link ? <Link to={item.link} className="btn btn--primary">Dort ansehen <ChevronRight size={18} aria-hidden="true" /></Link> : undefined}>
      {photos.length > 0 && (
        <div className="ar-gallery">
          <img src={photos[current]} alt={`Foto ${current + 1} von ${photos.length}`} />
          {photos.length > 1 && (
            <>
              <button type="button" className="btn btn--icon ar-gallery__prev" aria-label="Vorheriges Foto" disabled={current === 0} onClick={() => setIndex(current - 1)}><ChevronLeft size={28} /></button>
              <button type="button" className="btn btn--icon ar-gallery__next" aria-label="Nächstes Foto" disabled={current === photos.length - 1} onClick={() => setIndex(current + 1)}><ChevronRight size={28} /></button>
            </>
          )}
        </div>
      )}
      <p className="muted">{kind.emoji} {kind.label} · {formatLong(item.date)}{photos.length ? ` · ${photos.length} ${photos.length === 1 ? 'Foto' : 'Fotos'}` : ''}</p>
      {item.text && <p className="ar-text">{item.text}</p>}
      {item.quotes.map((q, n) => {
        const m = members.find((x) => x.id === q.memberId);
        return (
          <blockquote key={n} className="ar-quote">
            {m && <Avatar avatar={m.avatar} color={m.color} size={32} />}
            <span>{m && <strong>{m.name}: </strong>}„{q.text}“</span>
          </blockquote>
        );
      })}
      <div className="row row--wrap">
        {item.memberIds.map((id) => members.find((x) => x.id === id)).filter((x): x is Member => !!x).map((x) => (
          <span key={x.id} className="chip"><Avatar avatar={x.avatar} color={x.color} size={24} /> {x.name}</span>
        ))}
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------- Jahresrückblick

function YearView({ review, items, members, onOpen }: { review: YearReview; items: ArchiveItem[]; members: Member[]; onOpen: (id: string) => void }) {
  const inYear = items.filter((i) => i.date.startsWith(`${review.year}-`));
  if (!inYear.length) {
    return <p className="card muted">Für {review.year} gibt es noch keine Einträge im Archiv.</p>;
  }
  return (
    <div className="stack">
      <section className="card ar-year-head">
        <div>
          <h2 className="card__title">Unser Jahr {review.year}</h2>
          <div className="ar-counts">
            {review.counts.map((c) => {
              const k = ARCHIVE_KIND.get(c.kind)!;
              return <span key={c.kind} className="ar-count"><span className="ar-count__n">{c.count}</span> {k.emoji} {k.label}</span>;
            })}
            {review.photos > 0 && <span className="ar-count"><span className="ar-count__n">{review.photos}</span> 📷 Fotos</span>}
          </div>
        </div>
        <PdfButton label="Jahrbuch als PDF" items={inYear} members={members} title={`Unser Familienjahr ${review.year}`} subtitle={subtitleFor(inYear)} review={review} primary />
      </section>

      {review.photoPicks.length > 0 && (
        <section className="ar-collage" aria-label="Fotos des Jahres">
          {review.photoPicks.map((p, n) => (
            <figure key={n} className="ar-collage__item"><img src={p.photo} alt={p.title} /><figcaption>{p.title}</figcaption></figure>
          ))}
        </section>
      )}

      <div className="ar-kids">
        {review.children.map((cy) => <ChildYearCard key={cy.child.id} review={review} cy={cy} items={inYear} members={members} />)}
      </div>

      {review.highlights.length > 0 && (
        <section className="card">
          <h2 className="card__title">Höhepunkte</h2>
          <div className="ar-grid">
            {review.highlights.slice().reverse().map((i) => <ItemCard key={i.id} item={i} onOpen={onOpen} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function ChildYearCard({ review, cy, items, members }: { review: YearReview; cy: YearReview['children'][number]; items: ArchiveItem[]; members: Member[] }) {
  const c: ChildProfile = cy.child;
  const mine = items.filter((i) => i.memberIds.includes(c.id));
  const own: YearReview = { ...review, children: [cy], counts: ARCHIVE_KINDS.map((k) => ({ kind: k.id, count: mine.filter((i) => i.kind === k.id).length })).filter((x) => x.count > 0),
    photos: mine.reduce((n, i) => n + i.photos.length, 0), photoPicks: review.photoPicks.filter((p) => mine.some((i) => i.photos[0] === p.photo)) };
  return (
    <section className={`card ar-kid tone-${c.color}`}>
      <h3 className="ar-kid__head"><Avatar avatar={c.avatar} color={c.color} size={48} /> {c.name}</h3>
      <ul className="ar-kid__facts">
        {cy.mamaTimes > 0 && <li>💛 {cy.mamaTimes}× Mama-Zeit</li>}
        {cy.papaTimes > 0 && <li>💙 {cy.papaTimes}× Papa-Zeit</li>}
        {cy.stamps > 0 && <li>🛂 {cy.stamps} Stempel im Weltentdeckerpass</li>}
        {cy.projects.length > 0 && <li>🛠️ {cy.projects.join(', ')}</li>}
        {cy.savings.length > 0 && <li>🐷 Gespart für: {cy.savings.join(', ')}</li>}
      </ul>
      {cy.learned.length > 0 && (
        <>
          <p className="ar-kid__label">Neu gelernt</p>
          <div className="row row--wrap">{cy.learned.map((l) => <span key={l} className="chip">{l}</span>)}</div>
        </>
      )}
      {cy.quotes.length > 0 && (
        <>
          <p className="ar-kid__label">Gesagt</p>
          {cy.quotes.slice(0, 4).map((q, n) => <blockquote key={n} className="ar-quote"><span>„{q.text}“ <span className="muted small">({formatLong(q.date)})</span></span></blockquote>)}
        </>
      )}
      {mine.length > 0 && <PdfButton label={`${genitive(c.name)} Jahr als PDF`} items={mine} members={members} title={`${genitive(c.name)} Jahr ${review.year}`} subtitle={subtitleFor(mine)} review={own} />}
    </section>
  );
}

// ------------------------------------------------------------- PDF

function PdfButton({ label, items, members, title, subtitle, review, primary }: {
  label: string; items: ArchiveItem[]; members: Member[]; title: string; subtitle: string; review?: YearReview; primary?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const make = async () => {
    setBusy(true); setError(null);
    try {
      const { renderArchiveBook } = await import('../../services/archivePdf');
      const { loadWorksheetFonts } = await import('../../services/worksheetPdf');
      const bytes = await renderArchiveBook(items, members, { title, subtitle, review }, await loadWorksheetFonts());
      const name = `${title}.pdf`.replace(/[\\/:*?"<>|]/g, '');
      const file = new File([bytes as BlobPart], name, { type: 'application/pdf' });
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: name }); } catch { /* abgebrochen */ }
      } else {
        const url = URL.createObjectURL(file);
        window.open(url, '_blank');
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Das PDF konnte nicht erstellt werden.');
    } finally { setBusy(false); }
  };
  return (
    <span className="ar-pdf">
      <button type="button" className={`btn ${primary ? 'btn--primary' : ''}`} disabled={busy} onClick={() => void make()}>
        <FileDown size={18} aria-hidden="true" /> {busy ? 'Buch wird erstellt …' : label}
      </button>
      {error && <span className="notice notice--error">{error}</span>}
    </span>
  );
}

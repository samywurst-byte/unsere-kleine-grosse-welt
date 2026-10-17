import { ArrowLeft, Plus, Trash2, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Modal } from '../../components/Modal';
import { WHO_EMOJI, WHO_LABEL, WORK_UNIT_MINUTES } from '../../data/kidCompany';
import { db } from '../../database/db';
import { useCompanyProducts } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { canSpeak, speak } from '../../services/discover';
import { addJob, jobPiece, openJobs, removeJob, stepsFor } from '../../services/kidCompany';
import type { ChildProfile, CompanyProduct, ProductionJob } from '../../types';
import { FieldGroup } from '../money/parts';
import { ProductArt } from './ProductArt';
import './company.css';

/** Unsere Werkstatt: offene Aufträge mit Stück-Kreisen zum Antippen. */
export function CompanyWorkshop({ products, kids }: { products: CompanyProduct[]; kids: ChildProfile[] }) {
  const [adding, setAdding] = useState(false);
  const jobs = openJobs(products);
  const usable = products.filter((p) => p.status !== 'paused');
  return (
    <section className="card">
      <h2 className="card__title">🔨 Unsere Werkstatt</h2>
      <p className="muted small">Kurze Einheiten von 10 bis 20 Minuten. Wer keine Lust mehr hat, darf aufhören.</p>
      {jobs.length === 0 && <p className="muted">Gerade gibt es keinen offenen Auftrag.</p>}
      <div className="kc-jobs-list">
        {jobs.map(({ product, job }) => <JobCard key={job.id} product={product} job={job} kids={kids} />)}
      </div>
      <div className="row row--wrap">
        <button type="button" className="btn" disabled={usable.length === 0} onClick={() => setAdding(true)}><Plus size={18} aria-hidden="true" /> Neuer Auftrag</button>
        {usable.map((p) => <Link key={p.id} className="btn btn--small btn--ghost" to={`/kinderfirma/werkstatt/${p.id}`}>{p.emoji} So geht {p.name}</Link>)}
      </div>
      {adding && <JobModal products={usable} kids={kids} onClose={() => setAdding(false)} />}
    </section>
  );
}

function JobCard({ product, job, kids }: { product: CompanyProduct; job: ProductionJob; kids: ChildProfile[] }) {
  const who = kids.filter((k) => job.childIds.includes(k.id));
  return (
    <article className="kc-jobcard">
      <ProductArt catalogId={product.catalogId} emoji={product.emoji} size={56} />
      <div className="kc-jobcard__main">
        <h3>{job.count} × {product.name}</h3>
        <div className="kc-job__who">
          {who.length ? who.map((k) => <Avatar key={k.id} avatar={k.avatar} color={k.color} size={30} />) : <span className="small muted">Alle zusammen</span>}
        </div>
        <Pieces product={product} job={job} />
      </div>
      <div className="kc-jobcard__actions">
        <Link className="btn btn--small btn--sage" to={`/kinderfirma/werkstatt/${product.id}`}>Werkstatt öffnen</Link>
        <button type="button" className="btn btn--icon btn--ghost btn--small" aria-label="Auftrag löschen" onClick={() => { if (window.confirm('Diesen Auftrag löschen? Fertige Stücke bleiben gezählt.')) void removeJob(db, product.id, job.id); }}><Trash2 size={16} /></button>
      </div>
    </article>
  );
}

/** Ein Kreis je Stück: antippen = fertig, letzten fertigen nochmal antippen = zurück. */
function Pieces({ product, job, big }: { product: CompanyProduct; job: ProductionJob; big?: boolean }) {
  return (
    <div className={`kc-pieces ${big ? 'kc-pieces--big' : ''}`} role="group" aria-label={`${job.done} von ${job.count} fertig`}>
      {Array.from({ length: job.count }, (_, i) => {
        const done = i < job.done;
        return (
          <button key={i} type="button" className={`kc-piece ${done ? 'is-done' : ''}`} aria-label={done ? `Stück ${i + 1} fertig` : `Stück ${i + 1} fertig machen`}
            onClick={() => void jobPiece(db, product.id, job.id, done && i === job.done - 1 ? -1 : 1)}>
            {done ? product.emoji : ''}
          </button>
        );
      })}
    </div>
  );
}

function JobModal({ products, kids, onClose }: { products: CompanyProduct[]; kids: ChildProfile[]; onClose: () => void }) {
  const [productId, setProductId] = useState(products[0]?.id ?? '');
  const product = products.find((p) => p.id === productId);
  const missing = product ? Math.max(0, product.orders - product.made - openJobs([product]).reduce((n, x) => n + x.job.count - x.job.done, 0)) : 0;
  const [count, setCount] = useState(Math.max(1, Math.min(10, missing || 5)));
  const [childIds, setChildIds] = useState<string[]>([]);
  const toggle = (id: string) => setChildIds((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  return (
    <Modal title="Neuer Werkstattauftrag" onClose={onClose} actions={<button type="button" className="btn btn--primary" disabled={!product} onClick={() => { void addJob(db, productId, { count, childIds }); onClose(); }}>Auftrag anlegen</button>}>
      <div className="kc-form">
        <FieldGroup label="Was stellen wir her?">
          <div className="seg" role="group" aria-label="Produkt">
            {products.map((p) => <button key={p.id} type="button" className="seg__item" aria-pressed={p.id === productId} onClick={() => setProductId(p.id)}>{p.emoji} {p.name}</button>)}
          </div>
        </FieldGroup>
        <FieldGroup label="Wie viele Stück?" hint={missing ? `Für die Bestellungen fehlen noch ${missing}.` : 'Lieber wenige, dafür schön. Mehr geht später.'}>
          <div className="row">
            <button type="button" className="btn btn--icon" aria-label="Eins weniger" disabled={count <= 1} onClick={() => setCount(count - 1)}>−</button>
            <span className="kc-counter__value">{count}</span>
            <button type="button" className="btn btn--icon" aria-label="Eins mehr" disabled={count >= 30} onClick={() => setCount(count + 1)}>+</button>
          </div>
        </FieldGroup>
        <FieldGroup label="Wer macht mit?" hint="Niemand ausgewählt heißt: alle zusammen.">
          <div className="row">
            {kids.map((k) => (
              <button key={k.id} type="button" className={`kc-vote ${childIds.includes(k.id) ? 'is-on' : ''}`} aria-pressed={childIds.includes(k.id)} aria-label={k.name} onClick={() => toggle(k.id)}>
                <Avatar avatar={k.avatar} color={k.color} size={44} />
              </button>
            ))}
          </div>
        </FieldGroup>
      </div>
    </Modal>
  );
}

/** Werkstatt für Kinder: große Bildschritte zum Vorlesen, Stück-Kreise und eine kurze Werkstattzeit. */
export function WorkshopPage() {
  const { productId } = useParams();
  const products = useCompanyProducts();
  const now = useNow(1000).getTime();
  const [current, setCurrent] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  if (!products) return null;
  const product = products.find((p) => p.id === productId);
  if (!product) return <p className="empty">Dieses Produkt gibt es nicht mehr. <Link to="/kinderfirma">Zur Firmenzentrale</Link></p>;
  const steps = stepsFor(product);
  // Gerade fertige Aufträge bleiben eine Stunde sichtbar, damit gefeiert werden kann
  const jobs = (product.jobs ?? []).filter((j) => j.done < j.count || (j.doneAt && now - Date.parse(j.doneAt) < 3_600_000)).map((job) => ({ job }));
  const speech = canSpeak();
  const left = startedAt ? Math.max(0, WORK_UNIT_MINUTES * 60_000 - (now - startedAt)) : null;
  const pick = (i: number) => { setCurrent(i); if (speech) speak(steps[i].text); };

  return (
    <div>
      <header className="page-head">
        <Link to="/kinderfirma" className="btn btn--icon btn--ghost" aria-label="Zurück zur Firmenzentrale"><ArrowLeft size={22} /></Link>
        <h1>Werkstatt: {product.name}</h1>
      </header>
      <div className="stack">
        <section className="card kc-ws-head">
          {product.photo ? <img className="kc-ws-photo" src={product.photo} alt="" /> : <ProductArt catalogId={product.catalogId} emoji={product.emoji} size={120} />}
          <div className="kc-ws-timer">
            {left === null && <button type="button" className="btn btn--large btn--sage" onClick={() => setStartedAt(now)}>⏱️ {WORK_UNIT_MINUTES} Minuten Werkstatt</button>}
            {left !== null && left > 0 && <p className="kc-big">⏱️ Noch {Math.ceil(left / 60_000)} {Math.ceil(left / 60_000) === 1 ? 'Minute' : 'Minuten'}</p>}
            {left === 0 && <p className="kc-big">🌿 Super gearbeitet! Zeit für eine Pause.</p>}
            {left !== null && <button type="button" className="btn btn--small btn--ghost" onClick={() => setStartedAt(null)}>Werkstattzeit beenden</button>}
          </div>
        </section>

        <section className="card">
          <h2 className="card__title">So geht's</h2>
          <ol className="kc-steps">
            {steps.map((s, i) => (
              <li key={s.text}>
                <button type="button" className={`kc-step ${i === current ? 'is-on' : ''} ${i < current ? 'is-past' : ''}`} onClick={() => pick(i)}>
                  <span className="kc-step__num">{i + 1}</span>
                  <span className="kc-step__emoji" aria-hidden="true">{s.emoji}</span>
                  <span className="kc-step__text">{s.text}</span>
                  <span className={`kc-step__who kc-step__who--${s.who}`}>{WHO_EMOJI[s.who]} {WHO_LABEL[s.who]}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="row">
            <button type="button" className="btn" disabled={current === 0} onClick={() => pick(current - 1)}>Zurück</button>
            <button type="button" className="btn btn--primary" disabled={current >= steps.length - 1} onClick={() => pick(current + 1)}>Nächster Schritt</button>
            {speech && <button type="button" className="btn btn--ghost" onClick={() => speak(steps[current].text)}><Volume2 size={18} aria-hidden="true" /> Vorlesen</button>}
          </div>
        </section>

        <section className="card">
          <h2 className="card__title">Unsere Stücke</h2>
          {jobs.length === 0 && <p className="muted">Kein offener Auftrag. Mama oder Papa können in der Firmenzentrale einen anlegen. Bisher hergestellt: {product.made}.</p>}
          {jobs.map(({ job }) => (
            <div key={job.id} className="kc-ws-job">
              <p className="kc-big">{job.done} von {job.count} fertig{job.done === job.count ? ' 🎉' : ''}</p>
              <Pieces product={product} job={job} big />
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

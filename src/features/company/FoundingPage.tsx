import { ArrowLeft, ArrowRight, Plus, Volume2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import {
  CHRISTMAS_PRODUCTS, COMPANY_FLOW, FIRST_GOAL_CENTS, FOUNDING_STEPS, FOUNDING_TRIPS, NAME_IDEAS, STARTER_IDEAS, XMAS_2026,
} from '../../data/kidCompany';
import { db } from '../../database/db';
import { useChildren, useCompany, useCompanyProducts } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { canSpeak, speak } from '../../services/discover';
import {
  addIdea, chooseCompanyTrip, ensureSeason, foundCompany, MAX_FIRST_PRODUCTS, removeIdea, toggleFirstProduct,
} from '../../services/kidCompany';
import { formatEuro } from '../../services/projects';
import type { ChildProfile, KidCompany } from '../../types';
import { formatDayMonth, formatLong, toDateKey } from '../../utils/dates';
import { ProductArt } from './ProductArt';
import { Votes } from './parts';
import './company.css';

const CONFETTI = ['🎉', '✨', '🎊', '⭐', '🎉', '✨', '🎊', '⭐', '🎉', '✨', '🎊', '⭐'];

/** Gründungsrat der Kinderfirma: sechs Schritte mit Bildern und Vorlesetexten, ungefähr 15 bis 20 Minuten. */
export function FoundingPage() {
  const today = toDateKey(useNow(60_000));
  const company = useCompany();
  const children = useChildren();
  const [step, setStep] = useState(0);
  useEffect(() => { void ensureSeason(db); }, []);
  useEffect(() => { window.speechSynthesis?.cancel(); document.querySelector('.shell__main')?.scrollTo({ top: 0 }); }, [step]);
  if (company === undefined || !children) return null;
  const c = company ?? undefined;
  const s = FOUNDING_STEPS[step];
  const last = step === FOUNDING_STEPS.length - 1;

  return (
    <div className="kc-found">
      <header className="page-head">
        <Link to="/familienzeit/familienrat" className="btn btn--icon btn--ghost" aria-label="Zurück zum Familienrat"><ArrowLeft size={22} /></Link>
        <h1>Unsere Kinderfirma</h1>
        <span className="muted">Gründungsrat</span>
        <div className="spacer" />
        <ol className="kc-dots" aria-label="Schritte">
          {FOUNDING_STEPS.map((x, i) => (
            <li key={x.id}>
              <button type="button" className={`kc-dot ${i === step ? 'is-on' : ''} ${i < step ? 'is-done' : ''}`} aria-label={`Schritt ${i + 1}: ${x.title}`} aria-current={i === step ? 'step' : undefined} onClick={() => setStep(i)}>
                {x.emoji}
              </button>
            </li>
          ))}
        </ol>
      </header>

      <section className="card kc-stage">
        <p className="kc-stage__count">Schritt {step + 1} von {FOUNDING_STEPS.length}</p>
        <h2 className="kc-stage__title"><span aria-hidden="true">{s.emoji}</span> {s.title}</h2>
        <ParentText text={s.parentText} />
        {s.id === 'surprise' && <Surprise company={c} />}
        {s.id === 'company' && <WhatIsCompany />}
        {s.id === 'ideas' && <IdeaRound company={c} kids={children} />}
        {s.id === 'christmas' && <ChristmasPick />}
        {s.id === 'mission' && <Mission />}
        {s.id === 'founding' && <Founding company={c} kids={children} today={today} />}
      </section>

      <div className="kc-nav">
        <button type="button" className="btn btn--large" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft aria-hidden="true" /> Zurück</button>
        {!last && <button type="button" className="btn btn--large btn--primary" onClick={() => setStep(step + 1)}>Weiter <ArrowRight aria-hidden="true" /></button>}
      </div>
    </div>
  );
}

/** Text für Mama und Papa, zum Vorlesen oder frei Erzählen. */
function ParentText({ text }: { text: string }) {
  const speech = canSpeak();
  return (
    <div className="kc-parent">
      <p className="kc-parent__label">Für Mama und Papa zum Vorlesen</p>
      <p className="kc-parent__text">{text}</p>
      {speech && <button type="button" className="btn btn--small" onClick={() => speak(text)}><Volume2 size={18} aria-hidden="true" /> Vorlesen lassen</button>}
    </div>
  );
}

function Surprise({ company }: { company?: KidCompany }) {
  const [open, setOpen] = useState(!!company?.tripId);
  if (!open) {
    return (
      <div className="kc-gift">
        <button type="button" className="kc-gift__box" onClick={() => setOpen(true)} aria-label="Geschenk aufmachen">🎁</button>
        <p className="kc-big">Tippt auf das Geschenk!</p>
      </div>
    );
  }
  return (
    <>
      <p className="kc-big">Wohin möchten wir am liebsten?</p>
      <div className="kc-trips">
        {FOUNDING_TRIPS.map((t) => (
          <button key={t.id} type="button" className={`kc-trip ${company?.tripId === t.id ? 'is-on' : ''}`} aria-pressed={company?.tripId === t.id} onClick={() => void chooseCompanyTrip(db, t.id)}>
            <span className="kc-trip__emoji" aria-hidden="true">{t.emoji}</span>
            <span className="kc-trip__title">{t.title}</span>
            <span className="kc-trip__text">{t.text}</span>
          </button>
        ))}
      </div>
      <p className="muted small">Das ist erst ein Lieblingsziel. Im Januar entscheiden wir endgültig, und es geht später auch noch ein anderes.</p>
    </>
  );
}

function WhatIsCompany() {
  const [shown, setShown] = useState(1);
  return (
    <>
      <div className="kc-firms" aria-label="Was Firmen machen">
        <span><b aria-hidden="true">🏠</b>Häuser bauen</span>
        <span><b aria-hidden="true">🥖</b>Brot backen</span>
        <span><b aria-hidden="true">💐</b>Blumen verkaufen</span>
        <span><b aria-hidden="true">🧒</b>Und wir?</span>
      </div>
      <ol className="kc-flow">
        {COMPANY_FLOW.slice(0, shown).map((f, i) => (
          <li key={f.label} className={`kc-flow__step ${i === COMPANY_FLOW.length - 1 ? 'is-goal' : ''}`}>
            <span className="kc-flow__emoji" aria-hidden="true">{f.emoji}</span>
            <span className="kc-flow__label">{f.label}</span>
          </li>
        ))}
      </ol>
      {shown < COMPANY_FLOW.length
        ? <button type="button" className="btn btn--large btn--sage kc-center" onClick={() => setShown(shown + 1)}>Und dann? <span aria-hidden="true">{COMPANY_FLOW[shown].emoji}</span></button>
        : <p className="kc-big kc-center">Einnahmen sind noch kein Gewinn: Zuerst bezahlen wir das Material.</p>}
    </>
  );
}

function IdeaRound({ company, kids }: { company?: KidCompany; kids: ChildProfile[] }) {
  const [text, setText] = useState('');
  const ideas = company?.ideas ?? [];
  const byText = new Map(ideas.map((i) => [i.text, i]));
  const own = ideas.filter((i) => !STARTER_IDEAS.some((s) => s.text === i.text));
  const add = () => { void addIdea(db, text, '🌟'); setText(''); };
  return (
    <>
      <p className="kc-big">Tippt an, was euch gefällt. Wer mag, tippt auch auf sein Bild.</p>
      <div className="kc-ideas">
        {STARTER_IDEAS.map((s) => {
          const idea = byText.get(s.text);
          return (
            <div key={s.text} className={`kc-idea ${idea ? 'is-on' : ''}`}>
              <button type="button" className="kc-idea__main" aria-pressed={!!idea} onClick={() => void (idea ? removeIdea(db, idea.id) : addIdea(db, s.text, s.emoji))}>
                <span className="kc-idea__emoji" aria-hidden="true">{s.emoji}</span>
                <span className="kc-idea__text">{s.text}</span>
              </button>
              {idea && <Votes ideaId={idea.id} votes={idea.votes} kids={kids} />}
            </div>
          );
        })}
      </div>
      <h3 className="kc-sub">Eure eigenen Ideen</h3>
      {own.length > 0 && (
        <ul className="kc-own">
          {own.map((i) => (
            <li key={i.id}>
              <span aria-hidden="true">{i.emoji}</span> {i.text}
              <Votes ideaId={i.id} votes={i.votes} kids={kids} />
              <button type="button" className="btn btn--icon btn--ghost btn--small" aria-label={`${i.text} entfernen`} onClick={() => void removeIdea(db, i.id)}><X size={16} /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="row">
        <input className="input" value={text} placeholder="z. B. Steine bemalen und verkaufen" aria-label="Eigene Idee" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
        <button type="button" className="btn" disabled={!text.trim()} onClick={add}><Plus size={18} aria-hidden="true" /> Aufschreiben</button>
      </div>
    </>
  );
}

function ChristmasPick() {
  const products = useCompanyProducts();
  const [full, setFull] = useState(false);
  if (!products) return null;
  const chosen = new Set(products.filter((p) => p.seasonId === XMAS_2026.id && p.status !== 'idea').map((p) => p.catalogId));
  const toggle = async (id: string) => setFull(!(await toggleFirstProduct(db, id, XMAS_2026.id)));
  return (
    <>
      <p className="kc-big">Was probieren wir zuerst aus? Sucht euch drei oder vier Sachen aus.</p>
      <div className="kc-products">
        {CHRISTMAS_PRODUCTS.map((p) => (
          <button key={p.id} type="button" className={`kc-product ${chosen.has(p.id) ? 'is-on' : ''}`} aria-pressed={chosen.has(p.id)} onClick={() => void toggle(p.id)}>
            <ProductArt catalogId={p.id} emoji={p.emoji} size={88} />
            <span className="kc-product__name">{p.name}</span>
            <span className="kc-product__text">{p.text}</span>
            <span className="kc-product__meta">⏱️ {p.minutes} · 🧒 Kinder: {p.kidShare}</span>
            {p.parentPrep && <span className="kc-product__meta">👪 Vorher: {p.parentPrep}</span>}
            {chosen.has(p.id) && <span className="kc-product__badge">Ausgewählt</span>}
          </button>
        ))}
      </div>
      <p className="kc-center small"><strong>{chosen.size} von {MAX_FIRST_PRODUCTS}</strong> ausgewählt</p>
      {full && <p className="notice">Vier sind schon ausgewählt. Tippt erst eins davon an, um zu tauschen.</p>}
      <p className="muted small">Ihr müsst euch heute nicht festlegen. In der Ideenwerkstatt macht ihr erst Muster, danach entscheidet ihr.</p>
    </>
  );
}

function Mission() {
  return (
    <>
      <div className="kc-mission">
        <span className="kc-mission__emoji" aria-hidden="true">🎄🔨🎁</span>
        <p className="kc-mission__title">Wir eröffnen unsere Weihnachtswerkstatt!</p>
        <p className="kc-mission__goal">Erstes Ziel: <strong>{formatEuro(FIRST_GOAL_CENTS)} Gewinn</strong></p>
        <div className="kc-coins" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <span key={i}>10 €</span>)}</div>
        <p className="muted">Wenn es mehr wird, freuen wir uns. Wenn es weniger wird, ist das auch in Ordnung.</p>
      </div>
      <ol className="kc-plan">
        {XMAS_2026.phases.map((p) => (
          <li key={p.id}><span className="kc-plan__emoji" aria-hidden="true">{p.emoji}</span><span className="kc-plan__title">{p.title}</span><span className="kc-plan__date">{p.start === p.end ? formatDayMonth(p.start) : `${formatDayMonth(p.start)} bis ${formatDayMonth(p.end)}`}</span></li>
        ))}
      </ol>
    </>
  );
}

function Founding({ company, kids, today }: { company?: KidCompany; kids: ChildProfile[]; today: string }) {
  const [name, setName] = useState(company?.name ?? '');
  const navigate = useNavigate();
  const founded = !!company?.foundedAt;
  const [party, setPartyState] = useState(false);
  const found = async () => {
    await foundCompany(db, { name, date: company?.foundedAt ?? today, founderIds: kids.map((k) => k.id) });
    setPartyState(true);
  };
  return (
    <div className={`kc-certificate ${party ? 'is-party' : ''}`}>
      {party && <div className="kc-confetti" aria-hidden="true">{CONFETTI.map((e, i) => <span key={i} style={{ animationDelay: `${i * 0.12}s`, left: `${(i * 13) % 100}%` }}>{e}</span>)}</div>}
      <p className="kc-certificate__head">Wir gründen unsere Kinderfirma!</p>
      <div className="kc-founders">
        {kids.map((k) => (
          <div key={k.id} className="kc-founder"><Avatar avatar={k.avatar} color={k.color} size={72} /><span>{k.name}</span></div>
        ))}
      </div>
      <p className="kc-certificate__date">Gegründet am {formatLong(company?.foundedAt ?? today)}</p>
      <label className="kc-name">
        <span>Unsere Firma heißt</span>
        <input className="input kc-name__input" value={name} placeholder="Firmenname" onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="kc-name-ideas">
        {NAME_IDEAS.map((n) => <button key={n} type="button" className="chip" onClick={() => setName(n)}>{n}</button>)}
      </div>
      <p className="muted small">Der Name lässt sich später jederzeit in der Firmenzentrale ändern.</p>
      {party ? (
        <>
          <p className="kc-big">Herzlichen Glückwunsch, {company?.name || name}! 🎉</p>
          <div className="row kc-center">
            <button type="button" className="btn btn--large btn--primary" onClick={() => navigate('/kinderfirma')}>Zur Firmenzentrale</button>
            <button type="button" className="btn btn--large" onClick={() => navigate('/familienzeit/familienrat')}>Zurück zum Familienrat</button>
          </div>
        </>
      ) : (
        <button type="button" className="btn btn--large btn--primary kc-center" disabled={!name.trim()} onClick={() => void found()}>
          {founded ? 'Namen speichern' : '🎉 Firma gründen'}
        </button>
      )}
    </div>
  );
}

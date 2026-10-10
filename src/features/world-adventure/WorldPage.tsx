import { Lock, Plane, Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Modal } from '../../components/Modal';
import { WORLD_BY_ID } from '../../data/countries';
import { db } from '../../database/db';
import { useChildren, useSettings, useStarTransactions, useWorld } from '../../hooks/useData';
import { nextCountry, starBalance, unlockCountry } from '../../services/stars';
import type { Country } from '../../types';
import { formatLong, toDateKey } from '../../utils/dates';
import './world.css';

/**
 * Unsere Weltreise: Familiensterne aus den Zusatzmissionen sammeln sich in einem gemeinsamen Glas.
 * Ist das Glas voll genug, schaltet die ganze Familie zusammen das nächste Land frei. Sterne sind kein Geld.
 */
export function WorldPage() {
  const world = useWorld();
  const stars = useStarTransactions();
  const settings = useSettings();
  const children = useChildren();
  const [open, setOpen] = useState<Country | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [celebrate, setCelebrate] = useState<Country | null>(null);
  if (!world || !stars || !settings || !children) return null;

  const balance = starBalance(stars);
  const cost = settings.starsPerCountry;
  const next = nextCountry(world.countries, world.unlocks);
  const unlocked = new Map(world.unlocks.map((u) => [u.countryId, u]));
  const ready = !!next && balance >= cost;
  const fill = Math.min(1, balance / cost);

  const doUnlock = async () => {
    if (!next) return;
    if (await unlockCountry(db, next.id, cost, children.map((c) => c.id))) setCelebrate(next);
    setConfirm(false);
  };

  return (
    <div>
      <header className="page-head"><h1>Unsere Weltreise</h1></header>
      <div className="world">
        <section className="card world__jar-card">
          <p className="card__eyebrow">Unser Familienglas</p>
          <div className="world__jar-row">
            <div className="world__jar" aria-hidden="true">
              <div className="world__jar-fill" style={{ height: `${fill * 100}%` }} />
              <span className="world__jar-count">{balance}</span>
            </div>
            <div className="stack">
              <p className="world__jar-text"><Star size={22} fill="currentColor" aria-hidden="true" /> {balance} {balance === 1 ? 'Stern' : 'Sterne'} im Glas</p>
              {next ? (
                ready
                  ? <p>Das Glas ist voll genug! Zusammen können wir nach <strong>{next.nameDe}</strong> reisen.</p>
                  : <p>Noch <strong>{cost - balance}</strong> {cost - balance === 1 ? 'Stern' : 'Sterne'} bis {next.nameDe} <span aria-hidden="true">{next.flagEmoji}</span>.</p>
              ) : <p>Wir haben alle Länder besucht. Was für eine Reise!</p>}
              {ready && (
                <button type="button" className="btn btn--primary btn--large" onClick={() => setConfirm(true)}>
                  <Plane size={22} aria-hidden="true" /> Zusammen nach {next.nameDe} reisen
                </button>
              )}
              <p className="small muted">Sterne gibt es für freiwillige Zusatzmissionen. Alle sammeln zusammen in ein Glas.</p>
            </div>
          </div>
        </section>

        <section className="card">
          <p className="card__eyebrow">Unser Reisepass</p>
          <div className="world__passport">
            {world.countries.map((c) => {
              const done = unlocked.get(c.id);
              const isNext = next?.id === c.id;
              const tone = WORLD_BY_ID.get(c.id)?.tone ?? 'sky';
              return done ? (
                <button key={c.id} type="button" className={`world__stamp tone-${tone}`} onClick={() => setOpen(c)}>
                  <span className="world__flag" aria-hidden="true">{c.flagEmoji}</span>
                  <span className="world__stamp-name">{c.nameDe}</span>
                  <span className="small">{formatLong(toDateKey(new Date(done.unlockedAt)))}</span>
                </button>
              ) : (
                <div key={c.id} className={`world__stamp world__stamp--locked ${isNext ? 'world__stamp--next' : ''}`}>
                  <span className="world__flag" aria-hidden="true">{isNext ? c.flagEmoji : <Lock size={28} />}</span>
                  <span className="world__stamp-name">{isNext ? c.nameDe : 'Geheim'}</span>
                  {isNext && <span className="small">als Nächstes</span>}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {confirm && next && (
        <Modal title={`Nach ${next.nameDe} reisen?`} onClose={() => setConfirm(false)}
          actions={<><button type="button" className="btn" onClick={() => setConfirm(false)}>Noch nicht</button>
            <button type="button" className="btn btn--primary" onClick={() => void doUnlock()}>Los geht's!</button></>}
        >
          <p>Seid ihr alle da? {cost} Sterne aus dem Glas bringen uns nach {next.nameDe} {next.flagEmoji}, und jedes Kind bekommt einen Stempel in den Pass.</p>
        </Modal>
      )}
      {(open || celebrate) && <CountryModal country={(open ?? celebrate)!} celebrate={!!celebrate} onClose={() => { setOpen(null); setCelebrate(null); }} />}
    </div>
  );
}

function CountryModal({ country, celebrate, onClose }: { country: Country; celebrate: boolean; onClose: () => void }) {
  const info = WORLD_BY_ID.get(country.id);
  const world = useWorld();
  const children = useChildren() ?? [];
  const stamped = new Set(world?.stamps.filter((s) => s.countryId === country.id).map((s) => s.childId));
  return (
    <Modal title={`${country.flagEmoji} ${country.nameDe}`} onClose={onClose} wide
      actions={<button type="button" className="btn btn--primary" onClick={onClose}>Schön!</button>}
    >
      <div className="stack">
        {celebrate && <p className="notice notice--ok">Willkommen in {country.nameDe}! Ihr habt das zusammen geschafft.</p>}
        <p className="world__hello">Hier sagt man <strong>{country.greeting.word}!</strong> <span className="muted">({country.greeting.language})</span></p>
        <p>Hauptstadt: <strong>{country.capital}</strong> · Kontinent: {country.continent}</p>
        {info && (
          <>
            <h3 className="ft-sub">Zum Staunen</h3>
            <ul className="world__list">{info.facts.map((f) => <li key={f}>{f}</li>)}</ul>
            <h3 className="ft-sub">Das können wir zusammen machen</h3>
            <ul className="world__list">{info.ideas.map((f) => <li key={f}>{f}</li>)}</ul>
          </>
        )}
        <div className="row row--wrap">
          {children.filter((c) => stamped.has(c.id)).map((c) => (
            <span key={c.id} className="chip"><Avatar avatar={c.avatar} color={c.color} size={26} /> {c.name} hat den Stempel</span>
          ))}
        </div>
        <p className="small muted">Eine Idee ausprobiert? Haltet sie als <Link to="/familienzeit/erinnerungen">Erinnerung</Link> fest.</p>
      </div>
    </Modal>
  );
}

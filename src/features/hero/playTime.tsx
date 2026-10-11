import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PinPad } from '../../components/PinPad';
import { MOMO_TIRED } from '../../data/heroWorld';
import { db } from '../../database/db';
import { useSettings } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { speak } from '../../services/discover';
import { addPlayTime, extendPlayTime, isOverLimit, playLimitMinutes, playTimeId } from '../../services/heroWorld';
import { verifyPin } from '../../services/pin';
import { toDateKey } from '../../utils/dates';
import { Momo } from './HeroArt';
import './hero.css';

const TICK_MS = 15_000;

/** Zählt die Spielzeit eines Kindes in Heldenwelt und Schach, solange die Seite sichtbar ist. */
export function usePlayClock(childId: string | undefined) {
  const settings = useSettings();
  const today = toDateKey(useNow(60_000));
  const rec = useLiveQuery(() => (childId ? db.playTimes.get(playTimeId(childId, today)) : undefined), [childId, today]);
  const limit = playLimitMinutes(settings);
  useEffect(() => {
    if (!childId) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void addPlayTime(db, childId, toDateKey(new Date()), TICK_MS);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [childId]);
  return { over: settings !== undefined && isOverLimit(rec, limit), limit };
}

/**
 * Sanfte Grenze: Ist die Zeit um, kommt die Pause erst, wenn das Kind an einer Ruhestelle ist
 * (anderer Schritt als beim Erreichen der Grenze, oder eine Seite ohne laufendes Spiel).
 */
export function useCheckpoint(over: boolean, position: string, atRest: boolean): boolean {
  const at = useRef<string | null>(null);
  if (!over) { at.current = null; return false; }
  if (at.current === null) at.current = position;
  return atRest || at.current !== position;
}

/** Momo schlägt freundlich eine Pause vor. Mit der Eltern-PIN geht es weiter. */
export function PauseGate({ childId, name }: { childId: string; name: string }) {
  const [pin, setPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { speak(MOMO_TIRED); }, []);
  const unlock = async (value: string) => {
    const res = await verifyPin(db, value);
    if (!res.ok) { setError('Die PIN passt nicht.'); return; }
    await extendPlayTime(db, childId, toDateKey(new Date()));
  };
  return (
    <div className="hero-gate" role="dialog" aria-modal="true" aria-label="Pause">
      <div className="hero-gate__card card">
        <Momo mood="sleep" size={150} />
        <p className="hero-say">{MOMO_TIRED}</p>
        {!pin ? (
          <div className="row row--wrap hero-gate__actions">
            <Link to="/" className="btn btn--primary btn--big">Tschüss, Momo!</Link>
            <button type="button" className="btn btn--ghost" onClick={() => setPin(true)}>Mama oder Papa: {name} darf weiterspielen</button>
          </div>
        ) : (
          <div className="hero-gate__pin">
            <p className="small muted">Eltern-PIN eingeben. Dann gibt es heute noch einmal die gleiche Zeit.</p>
            {error && <p className="notice notice--error">{error}</p>}
            <PinPad onSubmit={unlock} submitLabel="Weiterspielen" />
            <button type="button" className="btn btn--ghost" onClick={() => setPin(false)}>Zurück</button>
          </div>
        )}
      </div>
    </div>
  );
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Entsperrter Zustand des Elternbereichs. Liegt nur im Arbeitsspeicher:
 * nach Neustart, nach Verlassen des Elternbereichs oder nach 10 Minuten ohne Bedienung ist er wieder gesperrt.
 */
const IDLE_LOCK_MS = 10 * 60_000;

interface ParentSessionValue {
  unlocked: boolean;
  unlock: () => void;
  lock: () => void;
}

const Ctx = createContext<ParentSessionValue | null>(null);

export function ParentSessionProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const unlock = useCallback(() => setUnlocked(true), []);
  const lock = useCallback(() => setUnlocked(false), []);

  useEffect(() => {
    if (!unlocked) return;
    let timer = window.setTimeout(lock, IDLE_LOCK_MS);
    const activity = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(lock, IDLE_LOCK_MS);
    };
    const onHidden = () => { if (document.visibilityState === 'hidden') lock(); };
    window.addEventListener('pointerdown', activity);
    window.addEventListener('keydown', activity);
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', activity);
      window.removeEventListener('keydown', activity);
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, [unlocked, lock]);

  const value = useMemo(() => ({ unlocked, unlock, lock }), [unlocked, unlock, lock]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useParentSession(): ParentSessionValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('ParentSessionProvider fehlt');
  return v;
}

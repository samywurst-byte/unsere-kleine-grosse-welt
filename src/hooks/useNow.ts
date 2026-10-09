import { useEffect, useState } from 'react';

/**
 * Aktuelle Uhrzeit, regelmäßig aktualisiert. Nach Sperren oder Rückkehr aus dem
 * Hintergrund wird sofort neu berechnet, statt auf den nächsten Tick zu warten.
 */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const update = () => setNow(new Date());
    const id = window.setInterval(update, intervalMs);
    const onVisible = () => { if (document.visibilityState === 'visible') update(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', update);
    window.addEventListener('pageshow', update);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', update);
      window.removeEventListener('pageshow', update);
    };
  }, [intervalMs]);
  return now;
}

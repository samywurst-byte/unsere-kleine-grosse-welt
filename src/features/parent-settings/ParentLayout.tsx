import { Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { PinPad } from '../../components/PinPad';
import { db } from '../../database/db';
import { useNow } from '../../hooks/useNow';
import { verifyPin } from '../../services/pin';
import { useParentSession } from '../../app/ParentSession';
import { ForgotPin } from './ForgotPin';
import './parent.css';

const SECTIONS = [
  { to: '/eltern', label: 'Übersicht', end: true },
  { to: '/eltern/familie', label: 'Familie' },
  { to: '/eltern/lernen', label: 'Lesepfad' },
  { to: '/eltern/rechnen', label: 'Rechenpfad' },
  { to: '/eltern/lernpaket', label: 'Lernpaket' },
  { to: '/eltern/essen', label: 'Essen' },
  { to: '/eltern/geld', label: 'Geld' },
  { to: '/eltern/missionen', label: 'Missionen' },
  { to: '/eltern/sondertag', label: 'Sondertag' },
  { to: '/eltern/kalender', label: 'Kalender' },
  { to: '/eltern/routinen', label: 'Routinen' },
  { to: '/eltern/haushalt', label: 'Haushalt' },
  { to: '/eltern/zeiten', label: 'Uhrzeiten' },
  { to: '/eltern/timer', label: 'Timer' },
  { to: '/eltern/daten', label: 'Daten' },
  { to: '/eltern/pin', label: 'PIN' },
];

export function ParentLayout() {
  const { unlocked, unlock, lock } = useParentSession();

  // Beim Verlassen des Elternbereichs wieder sperren
  useEffect(() => () => lock(), [lock]);

  if (!unlocked) return <PinGate onUnlock={unlock} />;

  return (
    <div className="parent">
      <header className="page-head">
        <h1>Elternbereich</h1>
        <div className="spacer" />
        <button type="button" className="btn" onClick={lock}><Lock size={18} aria-hidden="true" /> Sperren</button>
      </header>
      <nav className="parent__tabs" aria-label="Elternbereich">
        {SECTIONS.map((s) => (
          <NavLink key={s.to} to={s.to} end={s.end} className={({ isActive }) => (isActive ? 'parent__tab parent__tab--active' : 'parent__tab')}>
            {s.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
      <p className="small muted" style={{ textAlign: 'right' }}>Version {__APP_VERSION__}</p>
    </div>
  );
}

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [message, setMessage] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [forgot, setForgot] = useState(false);
  const now = useNow(1000).getTime();
  const locked = lockedUntil !== null && lockedUntil > now;

  const submit = async (pin: string) => {
    const res = await verifyPin(db, pin);
    if (res.ok) { onUnlock(); return; }
    const until = res.reason === 'locked' || res.reason === 'wrong' ? res.lockedUntil : undefined;
    if (until) {
      setLockedUntil(until);
      setMessage('Zu viele Versuche. Bitte kurz warten.');
    } else {
      setMessage(res.reason === 'not-set' ? 'Es ist noch keine PIN festgelegt.' : 'Diese PIN stimmt nicht.');
    }
  };

  if (forgot) return <ForgotPin onBack={() => setForgot(false)} />;

  return (
    <div className="pin-gate">
      <div className="card pin-gate__card">
        <Lock size={32} aria-hidden="true" />
        <h1>Elternbereich</h1>
        <p className="muted">Bitte die Eltern-PIN eingeben.</p>
        {message && <p className="notice notice--error">{message}{locked && ` Noch ${Math.ceil((lockedUntil! - now) / 1000)} Sekunden.`}</p>}
        <PinPad onSubmit={submit} disabled={locked} submitLabel="Öffnen" />
        <button type="button" className="btn btn--ghost btn--small" onClick={() => setForgot(true)}>PIN vergessen?</button>
      </div>
    </div>
  );
}

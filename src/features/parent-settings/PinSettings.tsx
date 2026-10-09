import { useState } from 'react';
import { PinPad } from '../../components/PinPad';
import { db } from '../../database/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { createRecoveryCode, setPin, verifyPin } from '../../services/pin';

type Step = 'old' | 'new' | 'repeat' | 'done';

export function PinSettings() {
  const [step, setStep] = useState<Step>('old');
  const [first, setFirst] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (pin: string) => {
    setError(null);
    if (step === 'old') {
      const res = await verifyPin(db, pin);
      if (res.ok) setStep('new'); else setError(res.reason === 'locked' ? 'Zu viele Versuche. Bitte später erneut.' : 'Die bisherige PIN stimmt nicht.');
    } else if (step === 'new') {
      setFirst(pin); setStep('repeat');
    } else if (step === 'repeat') {
      if (pin !== first) { setError('Die beiden PINs waren unterschiedlich.'); setStep('new'); return; }
      await setPin(db, pin);
      setStep('done');
    }
  };

  const title = { old: 'Bisherige PIN eingeben', new: 'Neue PIN (4 bis 8 Ziffern)', repeat: 'Neue PIN wiederholen', done: 'PIN geändert' }[step];
  return (
    <div className="parent-section" style={{ alignItems: 'center' }}>
      <div className="card pin-gate__card">
        <h2>{title}</h2>
        {error && <p className="notice notice--error">{error}</p>}
        {step === 'done'
          ? <><p className="notice notice--ok">Die neue PIN ist gespeichert.</p><button type="button" className="btn" onClick={() => setStep('old')}>Erneut ändern</button></>
          : <PinPad key={step} onSubmit={submit} submitLabel={step === 'repeat' ? 'Speichern' : 'Weiter'} />}
      </div>
      <p className="small muted">Die PIN ist eine Hürde für Kinderhände, kein Ersatz für die Gerätesperre des iPads.</p>
      <RecoveryCodeCard />
    </div>
  );
}

function RecoveryCodeCard() {
  const auth = useLiveQuery(() => db.parentAuth.get('parent'), []);
  const [code, setCode] = useState<string | null>(null);
  const created = auth?.recoveryCreatedAt;
  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h3 className="card__title">Notfallcode für eine vergessene PIN</h3>
      <p className="small muted" style={{ marginBottom: 'var(--space-3)' }}>
        Mit diesem Code lässt sich über „PIN vergessen?“ eine neue PIN festlegen, ohne Daten zu verlieren.
        Der Code wird nur jetzt angezeigt. Bitte aufschreiben und nicht am iPad aufbewahren.
      </p>
      {code ? (
        <p className="notice notice--ok" style={{ fontSize: 'var(--fs-l)', fontWeight: 800, letterSpacing: '0.08em' }}>{code}</p>
      ) : (
        <p className="small">{created ? `Ein Notfallcode existiert seit ${new Date(created).toLocaleDateString('de-DE')}.` : 'Es gibt noch keinen Notfallcode.'}</p>
      )}
      <button type="button" className="btn" onClick={async () => setCode(await createRecoveryCode(db))}>
        {created || code ? 'Neuen Notfallcode erstellen (der alte wird ungültig)' : 'Notfallcode erstellen'}
      </button>
    </div>
  );
}

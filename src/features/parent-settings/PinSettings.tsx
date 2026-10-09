import { useState } from 'react';
import { PinPad } from '../../components/PinPad';
import { db } from '../../database/db';
import { setPin, verifyPin } from '../../services/pin';

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
    </div>
  );
}

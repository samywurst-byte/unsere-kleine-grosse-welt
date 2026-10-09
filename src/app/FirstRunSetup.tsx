import { useState } from 'react';
import { PinPad } from '../components/PinPad';
import { Avatar } from '../components/Avatar';
import { db } from '../database/db';
import { setPin } from '../services/pin';
import './FirstRunSetup.css';

/** Beim allerersten Start legen die Eltern ihre PIN fest. Es gibt keine Standard-PIN. */
export function FirstRunSetup({ onDone }: { onDone: () => void }) {
  const [first, setFirst] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (pin: string) => {
    setError(null);
    if (first === null) { setFirst(pin); return; }
    if (pin !== first) {
      setFirst(null);
      setError('Die beiden PINs waren unterschiedlich. Bitte noch einmal.');
      return;
    }
    setBusy(true);
    try {
      await setPin(db, pin);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Die PIN konnte nicht gespeichert werden.');
      setFirst(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="first-run">
      <div className="first-run__intro">
        <div className="first-run__avatars">
          <Avatar avatar="fox" color="sky" size={76} />
          <Avatar avatar="rabbit" color="sage" size={76} />
          <Avatar avatar="hedgehog" color="rose" size={76} />
        </div>
        <p className="first-run__eyebrow">Unser Familienkompass</p>
        <h1>Willkommen in unserer kleinen großen Welt</h1>
        <p className="muted">
          Bevor es losgeht, legt bitte eine Eltern-PIN mit 4 bis 8 Ziffern fest. Sie schützt den Elternbereich vor kleinen Händen.
          Die PIN wird nur als verschlüsselter Prüfwert auf diesem Gerät gespeichert.
        </p>
        <p className="muted">
          Danach startet die App mit Beispielwerten. Eure eigene Familie holt ihr unter Eltern › Daten mit einer
          Datensicherung herein, oder ihr tragt alles im Elternbereich ein.
        </p>
      </div>
      <div className="card first-run__pad">
        <h2>{first === null ? 'Eltern-PIN festlegen' : 'PIN wiederholen'}</h2>
        {error && <p className="notice notice--error">{error}</p>}
        <PinPad onSubmit={handle} disabled={busy} submitLabel={first === null ? 'Weiter' : 'Speichern'} />
      </div>
    </div>
  );
}

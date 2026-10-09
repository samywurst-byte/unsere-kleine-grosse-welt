import { Download } from 'lucide-react';
import { useState } from 'react';
import { PinPad } from '../../components/PinPad';
import { db } from '../../database/db';
import { backupFileName, exportData, markBackedUp } from '../../services/backup';
import { normalizeRecoveryCode, resetPinWithRecoveryCode } from '../../services/pin';
import { saveFile } from '../../services/platform';

type Step = 'code' | 'new' | 'repeat' | 'done';

/**
 * Notfallweg bei vergessener PIN.
 * Mit Notfallcode: neue PIN festlegen. Ohne: Sicherung exportieren, App neu installieren, Sicherung einspielen.
 */
export function ForgotPin({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<Step>('code');
  const [code, setCode] = useState('');
  const [first, setFirst] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exported, setExported] = useState(false);

  const submitPin = async (pin: string) => {
    setError(null);
    if (step === 'new') { setFirst(pin); setStep('repeat'); return; }
    if (pin !== first) { setError('Die beiden PINs waren unterschiedlich.'); setStep('new'); return; }
    const res = await resetPinWithRecoveryCode(db, code, pin);
    if (res.ok) { setStep('done'); return; }
    setStep('code');
    setError(
      res.reason === 'no-code' ? 'Auf diesem iPad wurde noch kein Notfallcode erstellt.'
        : res.reason === 'locked' ? 'Zu viele Versuche. Bitte etwas warten.'
          : res.reason === 'not-set' ? 'Es ist noch keine PIN festgelegt.'
            : 'Dieser Notfallcode stimmt nicht.',
    );
  };

  const doExport = async () => {
    const res = await saveFile(backupFileName(), JSON.stringify(await exportData(db), null, 2));
    if (res !== 'cancelled') { await markBackedUp(db); setExported(true); }
  };

  return (
    <div className="pin-gate">
      <div className="card pin-gate__card">
        <h1>PIN vergessen</h1>
        {error && <p className="notice notice--error">{error}</p>}
        {step === 'code' && (
          <>
            <p className="muted">Mit dem Notfallcode, den ihr unter Eltern › PIN erstellt habt, lässt sich eine neue PIN festlegen.</p>
            <input
              className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="XXXX-XXXX-XXXX"
              autoCapitalize="characters" autoComplete="off" spellCheck={false} aria-label="Notfallcode"
            />
            <button type="button" className="btn btn--primary" disabled={normalizeRecoveryCode(code).length < 12} onClick={() => setStep('new')}>Weiter</button>
          </>
        )}
        {(step === 'new' || step === 'repeat') && (
          <>
            <h2>{step === 'new' ? 'Neue PIN (4 bis 8 Ziffern)' : 'Neue PIN wiederholen'}</h2>
            <PinPad key={step} onSubmit={submitPin} submitLabel={step === 'repeat' ? 'Speichern' : 'Weiter'} />
          </>
        )}
        {step === 'done' && (
          <p className="notice notice--ok">Die neue PIN ist gespeichert. Der Notfallcode ist damit verbraucht; bitte unter Eltern › PIN einen neuen erstellen.</p>
        )}
        <button type="button" className="btn btn--ghost" onClick={onBack}>Zurück zur PIN-Eingabe</button>
      </div>

      {step === 'code' && (
        <div className="card pin-gate__card">
          <h2>Kein Notfallcode?</h2>
          <ol className="small" style={{ textAlign: 'left', paddingLeft: '1.2em' }}>
            <li>Hier eine Sicherung exportieren und in „Dateien“ ablegen.</li>
            <li>Die App vom Home-Bildschirm löschen und über Safari neu hinzufügen.</li>
            <li>Eine neue PIN festlegen und unter Eltern › Daten die Sicherung wiederherstellen.</li>
          </ol>
          <button type="button" className="btn" onClick={() => void doExport()}><Download size={18} aria-hidden="true" /> Sicherung exportieren</button>
          {exported && <p className="notice notice--ok">Sicherung gespeichert.</p>}
        </div>
      )}
    </div>
  );
}

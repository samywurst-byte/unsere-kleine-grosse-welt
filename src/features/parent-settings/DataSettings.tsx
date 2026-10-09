import { Download, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Modal } from '../../components/Modal';
import { PinPad } from '../../components/PinPad';
import { db } from '../../database/db';
import { backupFileName, exportData, importData, validateBackup, type BackupFile } from '../../services/backup';
import { verifyPin } from '../../services/pin';
import { isStandalone, isStoragePersisted, requestPersistentStorage, saveFile } from '../../services/platform';

export function DataSettings() {
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [persisted, setPersisted] = useState<boolean | undefined>();
  const [resetOpen, setResetOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { void isStoragePersisted().then(setPersisted); }, []);

  const doExport = async () => {
    try {
      const data = await exportData(db);
      const res = await saveFile(backupFileName(), JSON.stringify(data, null, 2));
      if (res !== 'cancelled') setMessage({ kind: 'ok', text: res === 'shared' ? 'Sicherung übergeben. Am besten „In Dateien sichern“ wählen.' : 'Sicherung wurde heruntergeladen.' });
    } catch (e) {
      setMessage({ kind: 'error', text: `Export fehlgeschlagen: ${e instanceof Error ? e.message : String(e)}` });
    }
  };

  const onFile = async (file: File | undefined) => {
    setErrors([]); setMessage(null);
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const res = validateBackup(parsed);
      if (res.ok) setPending(res.data); else setErrors(res.errors);
    } catch {
      setErrors(['Die Datei ist keine gültige JSON-Datei.']);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const doImport = async () => {
    if (!pending) return;
    try {
      await importData(db, pending);
      setMessage({ kind: 'ok', text: 'Die Sicherung wurde wiederhergestellt.' });
    } catch (e) {
      setMessage({ kind: 'error', text: `Wiederherstellen fehlgeschlagen, es wurde nichts verändert. ${e instanceof Error ? e.message : ''}` });
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="parent-section">
      <div className="parent-section__head"><h2>Daten und Sicherung</h2></div>
      <p className="notice">
        Alle Daten liegen nur lokal auf diesem iPad. Sie können verloren gehen, wenn Website-Daten gelöscht werden, die App vom Home-Bildschirm
        entfernt wird oder das Gerät zurückgesetzt wird. Bitte regelmäßig eine Sicherung exportieren und z. B. in „Dateien“ ablegen.
      </p>
      <p className="small muted">
        Dauerhafter Speicher: {persisted === undefined ? 'unbekannt' : persisted ? 'vom Browser bestätigt' : 'nicht bestätigt'}
        {' · '}Als App installiert: {isStandalone() ? 'ja' : 'nein'}
        {persisted === false && (
          <button type="button" className="btn btn--small btn--ghost" onClick={() => void requestPersistentStorage().then(setPersisted)}>Erneut anfragen</button>
        )}
      </p>

      {message && <p className={`notice ${message.kind === 'ok' ? 'notice--ok' : 'notice--error'}`}>{message.text}</p>}

      <div className="row row--wrap">
        <button type="button" className="btn btn--primary" onClick={doExport}><Download size={18} aria-hidden="true" /> Sicherung exportieren</button>
        <button type="button" className="btn" onClick={() => fileRef.current?.click()}><Upload size={18} aria-hidden="true" /> Sicherung wiederherstellen</button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
      </div>
      <p className="small muted">Die Eltern-PIN wird nicht exportiert und bleibt beim Wiederherstellen unverändert.</p>

      {errors.length > 0 && (
        <div className="notice notice--error">
          <div>
            <strong>Diese Datei kann nicht wiederhergestellt werden:</strong>
            <ul>{errors.map((e) => <li key={e}>{e}</li>)}</ul>
          </div>
        </div>
      )}

      <div className="card card--sunk" style={{ marginTop: 'var(--space-5)' }}>
        <h3 className="card__title">Alles zurücksetzen</h3>
        <p className="small muted" style={{ marginBottom: 'var(--space-3)' }}>Löscht alle Daten auf diesem Gerät, auch die PIN, und startet mit den Ausgangswerten neu.</p>
        <button type="button" className="btn btn--danger" onClick={() => setResetOpen(true)}>Zurücksetzen …</button>
      </div>

      {pending && (
        <Modal
          title="Sicherung wiederherstellen?" onClose={() => setPending(null)}
          actions={(<><button type="button" className="btn" onClick={() => setPending(null)}>Abbrechen</button><button type="button" className="btn btn--danger" onClick={doImport}>Ersetzen</button></>)}
        >
          <p>Sicherung vom {new Date(pending.exportedAt).toLocaleString('de-DE')}.</p>
          <p className="muted small">
            {pending.tables.members?.length ?? 0} Familienmitglieder · {pending.tables.events?.length ?? 0} Termine ·{' '}
            {pending.tables.routineOccurrences?.length ?? 0} Routine-Erledigungen · {pending.tables.choreOccurrences?.length ?? 0} Haushalts-Einträge
          </p>
          <p className="notice" style={{ marginTop: 'var(--space-4)' }}>Alle aktuellen Daten auf diesem iPad werden durch die Sicherung ersetzt.</p>
        </Modal>
      )}
      {resetOpen && <ResetDialog onClose={() => setResetOpen(false)} />}
    </div>
  );
}

function ResetDialog({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const confirm = async (pin: string) => {
    const res = await verifyPin(db, pin);
    if (!res.ok) { setError('PIN falsch. Es wurde nichts gelöscht.'); return; }
    db.close();
    await db.delete();
    window.location.reload();
  };
  return (
    <Modal title="Wirklich alles löschen?" onClose={onClose}>
      <p style={{ marginBottom: 'var(--space-4)' }}>Zur Bestätigung bitte die Eltern-PIN eingeben. Dieser Schritt lässt sich nicht rückgängig machen.</p>
      {error && <p className="notice notice--error">{error}</p>}
      <PinPad onSubmit={confirm} submitLabel="Löschen" />
    </Modal>
  );
}

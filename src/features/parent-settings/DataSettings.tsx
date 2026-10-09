import { Download, History, Upload } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef, useState } from 'react';
import { Modal } from '../../components/Modal';
import { PinPad } from '../../components/PinPad';
import { db } from '../../database/db';
import { useDeviceMeta } from '../../hooks/useData';
import {
  backupFileName, backupIsDue, exportData, importData, markBackedUp, restoreSafetyCopy, validateBackup, type BackupFile,
} from '../../services/backup';
import type { SafetyCopy } from '../../types';
import { verifyPin } from '../../services/pin';
import { isStandalone, isStoragePersisted, requestPersistentStorage, saveFile } from '../../services/platform';

export function DataSettings() {
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [persisted, setPersisted] = useState<boolean | undefined>();
  const [resetOpen, setResetOpen] = useState(false);
  const [restoring, setRestoring] = useState<SafetyCopy | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const meta = useDeviceMeta();
  const copies = useLiveQuery(() => db.safetyCopies.orderBy('createdAt').reverse().toArray(), []);

  useEffect(() => { void isStoragePersisted().then(setPersisted); }, []);

  const doExport = async () => {
    try {
      const data = await exportData(db);
      const res = await saveFile(backupFileName(), JSON.stringify(data, null, 2));
      if (res !== 'cancelled') await markBackedUp(db);
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
      setMessage({ kind: 'ok', text: 'Die Sicherung wurde wiederhergestellt. Der Stand davor liegt unten als Sicherheitskopie bereit.' });
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

      {meta && (
        <p className={`notice ${backupIsDue(meta.lastBackupAt) ? '' : 'notice--ok'}`}>
          {meta.lastBackupAt
            ? `Letzte Sicherung: ${formatDateTime(meta.lastBackupAt)}.`
            : 'Von diesem iPad wurde noch keine Sicherung exportiert.'}
          {backupIsDue(meta.lastBackupAt) && ' Jetzt wäre ein guter Moment für eine neue Sicherung.'}
        </p>
      )}

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

      {copies && copies.length > 0 && (
        <div className="card" style={{ marginTop: 'var(--space-5)' }}>
          <h3 className="card__title">Automatische Sicherheitskopien</h3>
          <p className="small muted" style={{ marginBottom: 'var(--space-3)' }}>
            Vor jedem Wiederherstellen speichert die App den bisherigen Stand auf diesem iPad. Die letzten drei bleiben erhalten.
          </p>
          <ul className="list">
            {copies.map((c) => (
              <li key={c.id} className="list-item">
                <History size={22} aria-hidden="true" />
                <div className="list-item__main">
                  <p className="list-item__title">Stand vom {formatDateTime(c.createdAt)}</p>
                  <p className="list-item__meta">vor einem Wiederherstellen gespeichert</p>
                </div>
                <button type="button" className="btn btn--small" onClick={() => void saveFile(backupFileName(new Date(c.createdAt)), c.json)}>Herunterladen</button>
                <button type="button" className="btn btn--small" onClick={() => setRestoring(c)}>Zurückholen</button>
              </li>
            ))}
          </ul>
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
      {restoring && (
        <Modal
          title="Diesen Stand zurückholen?" onClose={() => setRestoring(null)}
          actions={(
            <>
              <button type="button" className="btn" onClick={() => setRestoring(null)}>Abbrechen</button>
              <button
                type="button" className="btn btn--danger"
                onClick={async () => {
                  const copy = restoring;
                  setRestoring(null);
                  try {
                    await restoreSafetyCopy(db, copy.id);
                    setMessage({ kind: 'ok', text: `Der Stand vom ${formatDateTime(copy.createdAt)} ist wieder da.` });
                  } catch (e) {
                    setMessage({ kind: 'error', text: `Zurückholen fehlgeschlagen, es wurde nichts verändert. ${e instanceof Error ? e.message : ''}` });
                  }
                }}
              >
                Zurückholen
              </button>
            </>
          )}
        >
          <p>Die aktuellen Daten werden durch den Stand vom {formatDateTime(restoring.createdAt)} ersetzt. Der jetzige Stand wird vorher ebenfalls als Sicherheitskopie gespeichert.</p>
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

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

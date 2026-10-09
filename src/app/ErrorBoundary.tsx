import { Component, type ErrorInfo, type ReactNode } from 'react';
import { db } from '../database/db';
import { backupFileName, exportData, markBackedUp } from '../services/backup';
import { saveFile } from '../services/platform';

interface Props { children: ReactNode; scope: 'app' | 'page' }
interface State { error: Error | null; exportState: 'idle' | 'ok' | 'failed' }

/**
 * Fängt Abstürze ab, damit statt einer leeren Seite ein ruhiger Hinweis erscheint.
 * Auf App-Ebene bietet sie zusätzlich an, die Daten zu sichern, bevor jemand etwas anderes versucht.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, exportState: 'idle' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unerwarteter Fehler', error, info.componentStack);
  }

  private exportNow = async () => {
    try {
      const res = await saveFile(backupFileName(), JSON.stringify(await exportData(db), null, 2));
      if (res !== 'cancelled') await markBackedUp(db);
      this.setState({ exportState: res === 'cancelled' ? 'idle' : 'ok' });
    } catch {
      this.setState({ exportState: 'failed' });
    }
  };

  render() {
    const { error, exportState } = this.state;
    if (!error) return this.props.children;

    if (this.props.scope === 'page') {
      return (
        <div className="card" role="alert" style={{ maxWidth: 620 }}>
          <h1 className="card__title">Hier ist etwas schiefgelaufen</h1>
          <p className="muted">Diese Seite konnte nicht angezeigt werden. Alle anderen Bereiche funktionieren weiter, eure Daten sind nicht betroffen.</p>
          <p className="small faint" style={{ margin: 'var(--space-3) 0' }}>{error.message}</p>
          <button type="button" className="btn btn--primary" onClick={() => this.setState({ error: null })}>Noch einmal versuchen</button>
        </div>
      );
    }

    return (
      <div className="pin-gate" role="alert">
        <div className="card pin-gate__card">
          <h1>Die App braucht einen Neustart</h1>
          <p className="muted">
            Beim Laden ist ein Fehler aufgetreten. Meist hilft es, die App neu zu laden. Wenn der Fehler bleibt,
            bitte zuerst eine Sicherung exportieren.
          </p>
          <p className="small faint">{error.message}</p>
          <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>Neu laden</button>
          <button type="button" className="btn" onClick={() => void this.exportNow()}>Sicherung exportieren</button>
          {exportState === 'ok' && <p className="notice notice--ok">Sicherung gespeichert.</p>}
          {exportState === 'failed' && <p className="notice notice--error">Die Daten konnten gerade nicht gelesen werden. Bitte die App neu laden und es erneut versuchen.</p>}
        </div>
      </div>
    );
  }
}

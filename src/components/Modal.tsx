import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

export function Modal({ title, onClose, children, actions, wide }: {
  title: string; onClose: () => void; children: ReactNode; actions?: ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={wide ? 'modal modal--wide' : 'modal'} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2>{title}</h2>
          <button type="button" className="btn btn--icon btn--ghost" onClick={onClose} aria-label="Schließen"><X /></button>
        </div>
        {children}
        {actions && <div className="modal__actions">{actions}</div>}
      </div>
    </div>
  );
}

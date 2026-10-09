import { Delete } from 'lucide-react';
import { useState } from 'react';
import './PinPad.css';

/** Großes Ziffernfeld für die Eltern-PIN. */
export function PinPad({ onSubmit, disabled, submitLabel = 'Weiter', maxLength = 8 }: {
  onSubmit: (pin: string) => void | Promise<void>;
  disabled?: boolean;
  submitLabel?: string;
  maxLength?: number;
}) {
  const [pin, setPin] = useState('');
  const press = (d: string) => setPin((p) => (p.length < maxLength ? p + d : p));
  const submit = async () => {
    if (pin.length < 4 || disabled) return;
    const value = pin;
    setPin('');
    await onSubmit(value);
  };

  return (
    <div className="pinpad">
      <div className="pinpad__dots" aria-live="polite" aria-label={`${pin.length} Ziffern eingegeben`}>
        {Array.from({ length: Math.max(4, pin.length) }, (_, i) => (
          <span key={i} className={i < pin.length ? 'pinpad__dot pinpad__dot--on' : 'pinpad__dot'} />
        ))}
      </div>
      <div className="pinpad__grid">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} type="button" className="pinpad__key" onClick={() => press(d)} disabled={disabled}>{d}</button>
        ))}
        <button type="button" className="pinpad__key pinpad__key--soft" onClick={() => setPin((p) => p.slice(0, -1))} aria-label="Letzte Ziffer löschen" disabled={disabled}>
          <Delete />
        </button>
        <button type="button" className="pinpad__key" onClick={() => press('0')} disabled={disabled}>0</button>
        <button type="button" className="pinpad__key pinpad__key--ok" onClick={submit} disabled={disabled || pin.length < 4}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

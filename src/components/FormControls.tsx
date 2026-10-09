import type { ReactNode } from 'react';
import type { ColorKey, Weekday } from '../types';
import { WEEKDAY_ORDER, WEEKDAY_SHORT } from '../utils/dates';

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`field ${className ?? ''}`}>
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle__track" />
      <span>{label}</span>
    </label>
  );
}

export function WeekdayPicker({ value, onChange }: { value: Weekday[]; onChange: (v: Weekday[]) => void }) {
  return (
    <div className="seg" role="group" aria-label="Wochentage">
      {WEEKDAY_ORDER.map((d) => {
        const on = value.includes(d);
        return (
          <button
            key={d} type="button" className="seg__item" aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== d) : [...value, d].sort())}
          >
            {WEEKDAY_SHORT[d]}
          </button>
        );
      })}
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className="seg__item" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const COLOR_OPTIONS: { value: ColorKey; label: string }[] = [
  { value: 'sky', label: 'Himmelblau' },
  { value: 'sage', label: 'Salbeigrün' },
  { value: 'rose', label: 'Altrosa' },
  { value: 'terracotta', label: 'Terrakotta' },
  { value: 'gold', label: 'Gold' },
  { value: 'lavender', label: 'Lavendel' },
];

export function ColorPicker({ value, onChange }: { value: ColorKey; onChange: (v: ColorKey) => void }) {
  return (
    <div className="seg" role="group" aria-label="Farbe">
      {COLOR_OPTIONS.map((c) => (
        <button
          key={c.value} type="button" aria-pressed={value === c.value} aria-label={c.label} title={c.label}
          className={`color-swatch tone-${c.value}`} onClick={() => onChange(c.value)}
        />
      ))}
    </div>
  );
}

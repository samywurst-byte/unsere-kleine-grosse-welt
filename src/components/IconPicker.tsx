import { ICONS, Icon } from './Icon';

export function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="icon-picker" role="group" aria-label="Symbol wählen">
      {Object.entries(ICONS).map(([key, { label }]) => (
        <button
          key={key} type="button" className="icon-picker__item" aria-pressed={value === key}
          onClick={() => onChange(key)} title={label} aria-label={label}
        >
          <Icon name={key} size={24} />
        </button>
      ))}
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { useChildren } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { ageInYears, toDateKey } from '../../utils/dates';
import './children.css';

export function ChildPickerPage() {
  const children = useChildren();
  const today = toDateKey(useNow(60_000));
  return (
    <div>
      <header className="page-head"><h1>Wer bist du?</h1></header>
      <div className="child-picker">
        {children?.map((c) => (
          <Link key={c.id} to={`/aufgaben/${c.id}`} className={`child-picker__item tone-${c.color}`}>
            <Avatar avatar={c.avatar} color={c.color} size={180} />
            <span className="child-picker__name">{c.name}</span>
            {c.birthDate && <span className="child-picker__age">{ageInYears(c.birthDate, today)} Jahre</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}

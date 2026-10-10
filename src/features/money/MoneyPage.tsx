import { Link } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { POT_EMOJI, POT_LABEL } from '../../data/money';
import { useChildren, useDepotValuations, useMoneyRequests, useMoneyTransactions, useSimDepots, useTripGoals } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { balances, childAge, investValue, latestValuation, potBalance, showInvest, tripBalance } from '../../services/money';
import type { MoneyPot } from '../../types';
import { toDateKey } from '../../utils/dates';
import { MoneyTabs, Progress, formatEuro, genitive } from './parts';

/** Übersicht: jedes Kind mit seinen drei Geldbereichen, daneben die gemeinsame Reisekasse. */
export function MoneyPage() {
  const today = toDateKey(useNow(60_000));
  const children = useChildren();
  const txs = useMoneyTransactions();
  const trips = useTripGoals();
  const requests = useMoneyRequests();
  const sims = useSimDepots();
  const vals = useDepotValuations();
  if (!children || !txs || !trips || !requests || !sims || !vals) return null;
  const map = balances(txs);
  const active = trips.filter((t) => t.status === 'active');
  const tripSaved = active.reduce((s, t) => s + tripBalance(map, t.id).total, 0);
  const tripGoal = active.reduce((s, t) => s + t.targetCents, 0);

  return (
    <div>
      <header className="page-head">
        <h1>Unsere Geldwelt</h1>
        <span className="page-head__sub">Echtes Geld, das bei Mama und Papa oder auf der Bank liegt</span>
      </header>
      <MoneyTabs />
      <div className="mw-kids">
        {children.map((c) => {
          const invest = potBalance(map, c.id, 'invest').total;
          const val = latestValuation(vals, c.id);
          const sim = sims.find((s) => s.childId === c.id);
          const pots: MoneyPot[] = showInvest(childAge(c, today), invest, !!val, !!sim?.enabled) ? ['spend', 'save', 'invest'] : ['spend', 'save'];
          const open = requests.filter((r) => r.childId === c.id && r.status === 'open').length;
          return (
            <Link key={c.id} to={`/geld/${c.id}`} className={`card mw-kid tone-${c.color}`}>
              <div className="mw-kid__head">
                <Avatar avatar={c.avatar} color={c.color} size={56} />
                <span className="mw-kid__name">{genitive(c.name)} Schatzkammer</span>
                {open > 0 && <span className="chip">{open} {open === 1 ? 'Wunsch wartet' : 'Wünsche warten'}</span>}
              </div>
              <div className="mw-kid__pots">
                {pots.map((p) => (
                  <div key={p} className={`mw-mini mw-mini--${p}`}>
                    <span className="mw-mini__emoji" aria-hidden="true">{POT_EMOJI[p]}</span>
                    <span className="mw-mini__label">{POT_LABEL[p]}</span>
                    <strong>{formatEuro(p === 'invest' ? investValue(map, c.id, val).value : potBalance(map, c.id, p).total)}</strong>
                  </div>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
      {active.length > 0 && (
        <Link to="/reisekasse" className="card mw-trip-teaser">
          <span className="mw-trip-teaser__flags" aria-hidden="true">{active.map((t) => t.flag).join(' ')}</span>
          <div className="stack" style={{ flex: 1 }}>
            <strong>Unsere Reisekasse: {formatEuro(tripSaved)} gespart</strong>
            <Progress value={tripSaved} max={tripGoal} label="Fortschritt der Reisekasse" />
            <span className="small muted">Gemeinsames Sparziel {formatEuro(tripGoal)}. Die Reise bezahlen Mama und Papa, jeder Beitrag ist freiwillig.</span>
          </div>
        </Link>
      )}
    </div>
  );
}

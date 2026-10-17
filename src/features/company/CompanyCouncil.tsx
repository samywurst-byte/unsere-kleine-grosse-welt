import { Link } from 'react-router-dom';
import { COUNCIL_QUESTIONS } from '../../data/kidCompany';
import { useCompany, useCompanyEntries, useCompanyProducts, useMoneyTransactions, useTripGoals } from '../../hooks/useData';
import { activeSeason, companyTotals, currentPhase, openJobs, seasonPlan, tripEarnings } from '../../services/kidCompany';
import { formatEuro } from '../../services/projects';
import { Progress } from '../money/parts';
import { ProductArt } from './ProductArt';
import './company.css';

/** Punkt im Familienrat: vor der Gründung der Gründungsrat, danach eine kurze Wochenrunde. */
export function CompanyCouncil({ today }: { today: string }) {
  const company = useCompany();
  const products = useCompanyProducts();
  const entries = useCompanyEntries();
  const trips = useTripGoals();
  const txs = useMoneyTransactions();
  if (company === undefined || !products || !entries || !trips || !txs) return null;

  if (!company?.foundedAt) {
    return (
      <div className="kc-council kc-council--found">
        <span className="kc-council__emoji" aria-hidden="true">🏪🎉</span>
        <div>
          <p>Heute gründen wir unsere eigene Kinderfirma! Sechs Schritte mit Bildern und Texten zum Vorlesen, ungefähr 15 bis 20 Minuten.</p>
          <Link to="/kinderfirma/gruendung" className="btn btn--primary btn--large">Gründungsrat starten</Link>
        </div>
      </div>
    );
  }

  const season = activeSeason(company, today);
  const plan = season ? seasonPlan(season) : undefined;
  const phase = plan ? currentPhase(plan, today) : undefined;
  const totals = companyTotals(entries, season?.id);
  const trip = trips.find((t) => t.id === company.tripId);
  const earned = trip ? tripEarnings(txs, trip.id) : undefined;
  const selling = products.filter((p) => p.status !== 'idea' && p.status !== 'paused');

  return (
    <div className="kc-council">
      <ul className="kc-questions">
        {COUNCIL_QUESTIONS.map((q) => <li key={q.text}><span aria-hidden="true">{q.emoji}</span> {q.text}</li>)}
      </ul>
      {season && phase && (
        <p><strong>{phase.emoji} Diese Woche: {phase.title}.</strong> {phase.tasks.filter((t) => !season.checked.includes(t.id)).slice(0, 3).map((t) => t.text).join(', ')}</p>
      )}
      {phase?.review && season && <p className="notice notice--ok">Heute feiern wir unseren Jahresabschluss! <Link to={`/kinderfirma/abschluss/${season.id}`}>🏆 Jahresabschluss öffnen</Link></p>}
      {openJobs(products).length > 0 && <p className="small">🔨 Offene Werkstattaufträge: {openJobs(products).map(({ product, job }) => `${job.count - job.done} × ${product.name}`).join(', ')}</p>}
      {selling.length > 0 && (
        <div className="kc-council__products">
          {selling.map((p) => (
            <span key={p.id} className="kc-council__product">
              <ProductArt catalogId={p.catalogId} emoji={p.emoji} size={36} />
              <span>{p.name}: {p.orders} bestellt, {p.made} fertig, {p.sold} verkauft</span>
            </span>
          ))}
        </div>
      )}
      {season && (
        <div>
          <p className="small">Gewinn {season.title}: <strong>{formatEuro(Math.max(0, totals.profit))}</strong> von {formatEuro(season.goalCents)}</p>
          <Progress value={Math.max(0, totals.profit)} max={season.goalCents} label="Gewinnziel" />
        </div>
      )}
      {trip && earned && <p className="small">🧳 Reisekasse {trip.name}: {formatEuro(earned.earned)} selbst verdient{earned.parents ? `, ${formatEuro(earned.parents)} von Mama und Papa` : ''}.</p>}
      <p className="muted small">Ungefähr fünf Minuten. Wenn die Kinder eine Pause möchten, ist das in Ordnung. <Link to="/kinderfirma">Zur Firmenzentrale</Link></p>
    </div>
  );
}

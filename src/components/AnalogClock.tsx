import './AnalogClock.css';

/** Echte Analoguhr. Stundenzeiger Terrakotta, Minutenzeiger Himmelblau, optional Sekundenzeiger. */
export function AnalogClock({ now, size = 260, showSeconds = true, learningMode = false }: {
  now: Date; size?: number; showSeconds?: boolean; learningMode?: boolean;
}) {
  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();
  const minuteAngle = (m + s / 60) * 6;
  const hourAngle = (h + m / 60) * 30;
  const secondAngle = s * 6;

  const numbers = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const a = (n * 30 * Math.PI) / 180;
    return (
      <text key={n} x={100 + 66 * Math.sin(a)} y={100 - 66 * Math.cos(a)} className="clock__num" textAnchor="middle" dominantBaseline="central">
        {n}
      </text>
    );
  });

  const ticks = Array.from({ length: 60 }, (_, i) => {
    const major = i % 5 === 0;
    return (
      <line
        key={i} x1={100} y1={major ? 10 : 11} x2={100} y2={major ? 20 : 15}
        className={major ? 'clock__tick clock__tick--major' : 'clock__tick'} transform={`rotate(${i * 6} 100 100)`}
      />
    );
  });

  const minuteLabels = learningMode
    ? Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return (
          <text key={i} x={100 + 97 * Math.sin(a)} y={100 - 97 * Math.cos(a)} className="clock__minute" textAnchor="middle" dominantBaseline="central">
            {i * 5}
          </text>
        );
      })
    : null;

  const view = learningMode ? '-12 -12 224 224' : '0 0 200 200';
  const label = `Es ist ${String(now.getHours()).padStart(2, '0')}:${String(m).padStart(2, '0')} Uhr`;

  return (
    <svg viewBox={view} width={size} height={size} className="clock" role="img" aria-label={label}>
      {learningMode && (
        <g className="clock__quarters">
          <path d="M100 100 L100 -6 A106 106 0 0 1 206 100 Z" className="clock__quarter clock__quarter--1" />
          <path d="M100 100 L206 100 A106 106 0 0 1 100 206 Z" className="clock__quarter clock__quarter--2" />
          <path d="M100 100 L100 206 A106 106 0 0 1 -6 100 Z" className="clock__quarter clock__quarter--3" />
          <path d="M100 100 L-6 100 A106 106 0 0 1 100 -6 Z" className="clock__quarter clock__quarter--4" />
        </g>
      )}
      <circle cx={100} cy={100} r={96} className="clock__rim" />
      <circle cx={100} cy={100} r={90} className="clock__face" />
      {ticks}
      {numbers}
      {minuteLabels}
      <line x1={100} y1={108} x2={100} y2={52} className="clock__hand clock__hand--hour" transform={`rotate(${hourAngle} 100 100)`} />
      <line x1={100} y1={112} x2={100} y2={28} className="clock__hand clock__hand--minute" transform={`rotate(${minuteAngle} 100 100)`} />
      {showSeconds && (
        <line x1={100} y1={116} x2={100} y2={24} className="clock__hand clock__hand--second" transform={`rotate(${secondAngle} 100 100)`} />
      )}
      <circle cx={100} cy={100} r={6} className="clock__pin" />
    </svg>
  );
}

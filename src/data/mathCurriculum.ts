import type { LearningGoal } from './readingCurriculum';

/**
 * Lehrplan Rechnen (Version 1), freigegeben im Dokument "Rechenpfad: Plan".
 * Vor der Schule: Zahlverständnis (Stufen 1 bis 3, Stufe 4 spielerisch). Ab der Schule begleitend zum Unterricht.
 * Ids sind dauerhaft: einmal vergeben, nie umbenennen, sonst passen gespeicherte Beobachtungen nicht mehr.
 */

export interface MathStage {
  id: number;
  title: string;
  description: string;
  /** Wann das in Deutschland meist dran ist (Orientierung, kein Maßstab). */
  typical: string;
  /** Arbeitsblätter gibt es in dieser Version. */
  sheets: boolean;
}

export const MATH_STAGES: MathStage[] = [
  { id: 1, title: 'Mengen sehen', description: 'Würfelbilder, bis 5 auf einen Blick, mehr und weniger.', typical: 'Vorschule', sheets: true },
  { id: 2, title: 'Zählen und Zahlen bis 10', description: 'Zählen, Ziffern schreiben, Zahl und Menge.', typical: 'Vorschule', sheets: true },
  { id: 3, title: 'Zahlen zerlegen bis 10', description: 'Zahlenhäuser, Kraft der Fünf, verliebte Zahlen.', typical: 'letztes Kindergartenjahr, Klasse 1', sheets: true },
  { id: 4, title: 'Plus und Minus bis 10', description: 'Aufgaben mit Plättchen und Zehnerfeld.', typical: 'Klasse 1', sheets: true },
  { id: 5, title: 'Plus und Minus bis 20', description: 'Verdoppeln, Halbieren, Zehnerübergang.', typical: 'Klasse 1', sheets: true },
  { id: 6, title: 'Zahlen bis 100', description: 'Zehner und Einer, Plus und Minus bis 100.', typical: 'Klasse 2', sheets: true },
  { id: 7, title: 'Kleines Einmaleins', description: 'Malreihen, zuerst die Kernaufgaben.', typical: 'Klasse 2', sheets: true },
  { id: 8, title: 'Geteilt', description: 'Umkehraufgaben zum Einmaleins, Teilen mit Rest.', typical: 'Klasse 2 und 3', sheets: true },
  { id: 9, title: 'Zahlen bis 1000', description: 'Stellenwerte, schriftliches Plus und Minus.', typical: 'Klasse 3', sheets: false },
  { id: 10, title: 'Großes Einmaleins', description: '11 bis 20 mal 1 bis 10, Quadratzahlen. Freiwillig.', typical: 'Klasse 3 und 4, nicht überall Pflicht', sheets: true },
  { id: 11, title: 'Schriftlich mal und geteilt', description: 'Schriftliches Malnehmen und Teilen.', typical: 'Klasse 4', sheets: false },
];

/** Vor der Einschulung schlägt die App höchstens bis zu dieser Stufe vor. */
export const MATH_MAX_STAGE_BEFORE_SCHOOL = 4;

/** Reihenfolge der Malreihen: Kernaufgaben zuerst, dann abgeleitete Reihen. */
export const TIMES_ROW_ORDER = [1, 2, 10, 5, 4, 8, 3, 6, 9, 7];

const g = (
  id: string, stage: number, title: string, observe: string, activities: string[], requires: string[] = [], optional = false,
): LearningGoal => ({ id, area: 'math', stage, kind: 'skill', title, observe, activities, requires, ...(optional ? { optional } : {}) });

export const timesGoalId = (n: number) => `math.times.${n}`;
export const divGoalId = (n: number) => `math.div.${n}`;

function timesGoals(): LearningGoal[] {
  const out: LearningGoal[] = [];
  let previous = 'math.addsub100';
  for (const n of TIMES_ROW_ORDER) {
    const core = [1, 2, 5, 10].includes(n);
    out.push(g(
      timesGoalId(n), 7, `Einmaleins: ${n}er-Reihe`,
      `Kennt die Aufgaben der ${n}er-Reihe, ohne zu zählen.${core ? ' Kernaufgabe: aus ihr lassen sich andere ableiten.' : ' Darf sie aus Kernaufgaben ableiten (z. B. 6 · 7 aus 5 · 7 + 7).'}`,
      [`Die ${n}er-Reihe laut zählen und dabei klatschen oder hüpfen`, `Aufgaben-Memory: ${n} · 3 findet 3 · ${n} und das Ergebnis`, 'Alltagsaufgaben: Wie viele Räder haben 4 Fahrräder?'],
      [previous],
    ));
    previous = timesGoalId(n);
  }
  return out;
}

function divGoals(): LearningGoal[] {
  return TIMES_ROW_ORDER.map((n) => g(
    divGoalId(n), 8, `Geteilt durch ${n}`,
    `Löst Geteiltaufgaben zur ${n}er-Reihe über die Umkehraufgabe (${3 * n} : ${n} = 3, weil 3 · ${n} = ${3 * n}).`,
    [`Gegenstände in Gruppen zu ${n} aufteilen`, `Zu jeder Malaufgabe die Geteiltaufgabe finden`, 'Gerecht verteilen: Gummibärchen, Murmeln, Karten'],
    [timesGoalId(n)],
  ));
}

export const MATH_GOALS: LearningGoal[] = [
  g('math.subitize', 1, 'Würfelbilder erkennen',
    'Erkennt Würfelbilder und kleine Mengen bis 5 auf einen Blick, ohne zu zählen.',
    ['Würfelspiele wie Mensch ärgere dich nicht', 'Blitzblick: Plättchen kurz zeigen, wie viele waren es?', 'Würfelbild-Memory']),
  g('math.compare', 1, 'Mehr, weniger, gleich viel',
    'Vergleicht zwei Mengen und sagt, wo mehr, weniger oder gleich viele sind.',
    ['Gummibärchen verteilen: Wer hat mehr?', 'Turmbau: Welcher Turm hat mehr Steine?', 'Gleich viele Teller wie Personen decken']),
  g('math.count10', 2, 'Zählen bis 10 und zurück',
    'Zählt sicher vorwärts bis 10 (oder weiter) und rückwärts von 10, auch ab einer beliebigen Zahl.',
    ['Treppenstufen zählen', 'Countdown wie bei einer Rakete', 'Weiterzählen: Ich sage 4, du zählst weiter']),
  g('math.number-quantity', 2, 'Zahl und Menge',
    'Legt zu einer Zahl die passende Menge und findet zu einer Menge die Zahl, ohne jedes Mal neu zu zählen.',
    ['Zahlenkarten und Plättchen zuordnen', 'Hausnummern lesen', 'Bring mir 6 Löffel'], ['math.count10']),
  g('math.digits', 2, 'Ziffern schreiben',
    'Schreibt die Ziffern 0 bis 9 in der richtigen Richtung und mit dem richtigen Startpunkt.',
    ['Ziffern in Sand oder auf den Rücken malen', 'Ziffern nachspuren', 'Zahlen in den Kalender schreiben'], ['math.count10']),
  g('math.five', 3, 'Kraft der Fünf',
    'Sieht Mengen bis 10 als „fünf und noch …“ (7 ist 5 und 2), zum Beispiel an den Fingern oder am Zehnerfeld.',
    ['Mengen mit beiden Händen zeigen', 'Zehnerfeld legen und benennen', 'Blitzblick mit dem Zehnerfeld'], ['math.subitize', 'math.number-quantity']),
  g('math.decompose10', 3, 'Zahlen zerlegen bis 10',
    'Zerlegt Zahlen bis 10 auf verschiedene Weise (6 ist 4 und 2, oder 5 und 1).',
    ['Schüttelbox: Plättchen in einer Schachtel mit Trennwand schütteln', 'Zahlenhäuser ausfüllen', 'Muggelsteine in beide Hände verteilen'], ['math.number-quantity']),
  g('math.pairs10', 3, 'Verliebte Zahlen',
    'Kennt die Partner zur 10 (3 und 7, 4 und 6 …) schnell und ohne zu zählen.',
    ['Verliebte-Zahlen-Memory', 'Zehnerfeld: Wie viele fehlen bis 10?', 'Finger-Blitz: Ich zeige 3, du zeigst den Partner'], ['math.five']),
  g('math.add10', 4, 'Plus bis 10',
    'Löst Plusaufgaben bis 10, am Anfang mit Plättchen oder Zehnerfeld, später im Kopf.',
    ['Rechengeschichten erzählen', 'Aufgaben mit Plättchen legen', 'Tauschaufgaben entdecken: 2 + 5 und 5 + 2'], ['math.decompose10']),
  g('math.sub10', 4, 'Minus bis 10',
    'Löst Minusaufgaben bis 10 und versteht sie als Wegnehmen oder Ergänzen.',
    ['Kekse wegessen und rechnen', 'Kegeln: Wie viele stehen noch?', 'Umkehraufgaben zu Plusaufgaben'], ['math.add10']),
  g('math.add20', 5, 'Plus bis 20',
    'Löst Plusaufgaben bis 20, auch mit Zehnerübergang (8 + 5 über 8 + 2 + 3).',
    ['Zwanzigerfeld mit zwei Farben legen', 'Erst bis 10, dann weiter', 'Analogieaufgaben: 3 + 4 und 13 + 4'], ['math.sub10', 'math.pairs10']),
  g('math.sub20', 5, 'Minus bis 20',
    'Löst Minusaufgaben bis 20, auch mit Zehnerübergang (13 − 5 über 13 − 3 − 2).',
    ['Rückwärts über die 10 springen', 'Ergänzen: Von 8 bis 13 sind es?', 'Rechenstrich'], ['math.add20']),
  g('math.double-half', 5, 'Verdoppeln und Halbieren',
    'Verdoppelt Zahlen bis 10 und halbiert gerade Zahlen bis 20 sicher.',
    ['Spiegel-Spiel mit Plättchen', 'Doppel-Würfel', 'Gerecht teilen'], ['math.add10']),
  g('math.place100', 6, 'Zehner und Einer',
    'Weiß, dass 34 aus 3 Zehnern und 4 Einern besteht, und kann Zahlen bis 100 legen und lesen.',
    ['Zehnerstangen und Einerwürfel legen', 'Hunderterfeld', 'Geld: Zehncentstücke und Cents'], ['math.sub20']),
  g('math.addsub100', 6, 'Plus und Minus bis 100',
    'Rechnet Plus- und Minusaufgaben bis 100 in Schritten (45 + 23 über 45 + 20 + 3).',
    ['Rechenstrich mit Zehnersprüngen', 'Einkaufen spielen', 'Rechenmauern bis 100'], ['math.place100']),
  ...timesGoals(),
  ...divGoals(),
  g('math.div-remainder', 8, 'Teilen mit Rest',
    'Teilt mit Rest und erklärt, was übrig bleibt (17 : 5 = 3 Rest 2).',
    ['Kekse auf Teller verteilen, was bleibt übrig?', 'Teams bilden', 'Restaufgaben mit Plättchen'], [divGoalId(5)]),
  g('math.place1000', 9, 'Zahlen bis 1000',
    'Liest, schreibt und ordnet Zahlen bis 1000 nach Hundertern, Zehnern und Einern.',
    ['Stellenwerttafel', 'Zahlenstrahl bis 1000', 'Preise vergleichen'], [timesGoalId(7)]),
  g('math.written-addsub', 9, 'Schriftlich Plus und Minus',
    'Rechnet schriftlich untereinander mit Übertrag, so wie es in der Schule gezeigt wurde.',
    ['Aufgaben auf Rechenkaro', 'Überschlag zuerst', 'Ergebnis mit Umkehraufgabe prüfen'], ['math.place1000']),
  g('math.big-times', 10, 'Großes Einmaleins',
    'Kennt Aufgaben von 11 bis 20 mal 1 bis 10, darf sie zerlegen (14 · 6 = 10 · 6 + 4 · 6).',
    ['Zerlegen mit dem Malkreuz', 'Reihen laut zählen', 'Alltagsaufgaben mit Preisen'], [timesGoalId(7), divGoalId(7)], true),
  g('math.squares20', 10, 'Quadratzahlen bis 20 · 20',
    'Kennt die Quadratzahlen bis 20 · 20 (11 · 11 = 121 …).',
    ['Quadrate aus Plättchen legen', 'Quadratzahlen-Memory', 'Muster in der Einmaleins-Tafel suchen'], ['math.big-times'], true),
  g('math.written-mult', 11, 'Schriftlich malnehmen',
    'Nimmt schriftlich mal, so wie es in der Schule gezeigt wurde.',
    ['Überschlag zuerst', 'Aufgaben auf Rechenkaro', 'Probe mit dem Taschenrechner'], ['math.written-addsub']),
  g('math.written-div', 11, 'Schriftlich teilen',
    'Teilt schriftlich, so wie es in der Schule gezeigt wurde.',
    ['Überschlag zuerst', 'Aufgaben auf Rechenkaro', 'Probe durch Malnehmen'], ['math.written-mult']),
];

export const MATH_GOALS_BY_ID = new Map(MATH_GOALS.map((x) => [x.id, x]));

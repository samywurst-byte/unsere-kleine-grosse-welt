import type { MoneyHolding, MoneyPot, MoneySource, TripGoal } from '../types';

export const POT_LABEL: Record<MoneyPot, string> = { spend: 'Ausgeben', save: 'Sparen', invest: 'Anlegen' };
export const POT_EMOJI: Record<MoneyPot, string> = { spend: '👛', save: '🐷', invest: '🌱' };
export const POT_TEXT: Record<MoneyPot, string> = {
  spend: 'Mein Geld. Darüber darf ich selbst bestimmen.',
  save: 'Für mein Sparziel. Es bleibt mein Geld.',
  invest: 'Für ganz lange. Der Wert kann steigen und fallen.',
};

export const HOLDING_LABEL: Record<MoneyHolding, string> = { cash: 'Bargeld', bank: 'Bankkonto', depot: 'Echtes Depot' };

/** Die fünf Arten von Geldeingängen aus dem Konzept, mit Standardverwendung. */
export const SOURCE_LABEL: Record<MoneySource, string> = {
  pocket: 'Taschengeld',
  gift: 'Geldgeschenk',
  'own-sale': 'Verkauf eigener Sachen',
  project: 'Gemeinsames Projekt',
  parents: 'Beitrag von Mama und Papa',
  other: 'Sonstiges',
};

export const SOURCE_HINT: Record<MoneySource, string> = {
  pocket: 'Persönliches Geld des Kindes.',
  gift: 'Persönliches Geld, frei aufteilbar. Nichts geht automatisch in die Reisekasse.',
  'own-sale': 'Gehört dem Kind, dem die Sachen gehört haben.',
  project: 'Der Überschuss nach Materialkosten wird nach eurer Vereinbarung verteilt.',
  parents: 'Je nach Zweck persönliches Sparen oder Reisekasse.',
  other: 'Bitte kurz notieren, woher das Geld kommt.',
};

/** Verteilung in Prozent. Ein Vorschlag, Eltern und Kinder dürfen jedes Mal anders entscheiden. */
export interface MoneySplit { spend: number; save: number; trip: number; invest: number }

/** Vorschlag für gemeinsame Projektüberschüsse. */
export const PROJECT_SPLIT: MoneySplit = { spend: 50, save: 25, trip: 25, invest: 0 };
/** Persönliches Geld: alles zum Ausgeben, nichts automatisch in die Reisekasse. */
export const PERSONAL_SPLIT: MoneySplit = { spend: 100, save: 0, trip: 0, invest: 0 };

/** Finanzbildung nach Alter. Nur Orientierung, jedes Kind in seinem Tempo. */
export interface MoneyLesson { id: string; title: string; fromAge: number; idea: string }

export const MONEY_LESSONS: MoneyLesson[] = [
  { id: 'coins-small', title: 'Münzen entdecken', fromAge: 2, idea: 'Münzen gemeinsam ins Sparschwein werfen und das Klimpern hören. Nur mit Aufsicht: Münzen gehören nicht in den Mund.' },
  { id: 'coins', title: 'Münzen und Scheine', fromAge: 4, idea: 'Münzen nach Farbe und Größe sortieren und Türmchen bauen. Wer findet die 2-Euro-Münze?' },
  { id: 'prices', title: 'Preise und Einkaufen', fromAge: 5, idea: 'Kaufladen mit echten Münzen spielen. Beim Bäcker selbst bezahlen und das Wechselgeld zählen.' },
  { id: 'goals', title: 'Sparziele', fromAge: 5, idea: 'Ein Bild vom Sparziel malen und neben das Sparschwein hängen. Wie viele Wochen Taschengeld fehlen noch?' },
  { id: 'inout', title: 'Einnahmen und Ausgaben', fromAge: 7, idea: 'Eine Woche lang aufschreiben, welches Geld dazukommt und welches weggeht.' },
  { id: 'profit', title: 'Gewinn und Kosten', fromAge: 7, idea: 'Nach einem Verkaufsprojekt rechnen: Was hat das Material gekostet, was ist übrig geblieben?' },
  { id: 'budget', title: 'Budget planen', fromAge: 8, idea: 'Für einen Ausflug 10 € einteilen: Eintritt, Getränk, Eis. Reicht es?' },
  { id: 'interest', title: 'Zinsen und Zinseszins', fromAge: 9, idea: 'Mit Bohnen spielen: Für je 10 Bohnen kommt jedes Jahr eine dazu. Wie viele sind es nach fünf Jahren?' },
  { id: 'stocks', title: 'Aktien und ETFs', fromAge: 9, idea: 'Eine Aktie ist ein kleines Stück einer Firma. Ein ETF ist wie ein Obstkorb mit Stücken von sehr vielen Firmen.' },
  { id: 'risk', title: 'Chancen und Risiken', fromAge: 10, idea: 'Im Musterdepot ausprobieren: Der Wert fällt. Was passiert, wenn wir einfach abwarten?' },
  { id: 'longterm', title: 'Langfristig anlegen', fromAge: 10, idea: 'Geld für nächste Woche und Geld für in zehn Jahren: Warum gehört nur das zweite in eine Anlage?' },
];

/** Beispielziele der Reisekasse. Beträge sind Sparziele, keine berechneten Reisekosten. */
export function defaultTrips(now: string): TripGoal[] {
  return [
    {
      id: 'trip-salzburg', name: 'Salzburg', flag: '🇦🇹', countryId: 'country-austria', countryName: 'Österreich',
      description: 'Burgen, Berge und Altstadt entdecken', targetCents: 40000,
      activities: ['Festung Hohensalzburg', 'Wasserspiele im Schloss Hellbrunn', 'Spaziergang durch die Altstadt'],
      learning: ['Österreich auf der Landkarte finden', 'Die Flagge malen', 'Österreichische Wörter raten: Was ist ein „Paradeiser“?'],
      topicIds: ['middle-ages'], status: 'active', order: 1, createdAt: now,
    },
    {
      id: 'trip-hamburg', name: 'Hamburg', flag: '🇩🇪', countryName: 'Deutschland',
      description: 'Hafen, Schiffe und Miniaturwelten', targetCents: 60000,
      activities: ['Hafenrundfahrt', 'Miniatur Wunderland', 'Durch den alten Elbtunnel laufen'],
      learning: ['Hamburg auf der Deutschlandkarte suchen', 'Warum schwimmt ein großes Schiff?', 'Ein Containerschiff aus Kartons bauen'],
      topicIds: ['water', 'technology'], status: 'active', order: 2, createdAt: now,
    },
    {
      id: 'trip-copenhagen', name: 'Kopenhagen', flag: '🇩🇰', countryId: 'country-denmark', countryName: 'Dänemark',
      description: 'Dänemark, Kanäle und neue Entdeckungen', targetCents: 80000,
      activities: ['Tivoli', 'Bootsfahrt durch die Kanäle', 'Die kleine Meerjungfrau besuchen'],
      learning: ['Dänemark auf dem Globus suchen', 'Die Flagge malen', 'Erste dänische Wörter: Hej und Tak', 'Gemeinsam aussuchen, was wir sehen möchten'],
      status: 'active', order: 3, createdAt: now,
    },
  ];
}

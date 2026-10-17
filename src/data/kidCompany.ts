import type { TripGoal } from '../types';

/** Fester Punkt im Familienrat; jeder Punkt mit „kinderfirma“ im Titel zählt. */
export const COMPANY_COUNCIL_ITEM = 'Was gibt es Neues aus unserer Kinderfirma?';
/** So heißt der Punkt, solange die Firma noch nicht gegründet ist. */
export const FOUNDING_TITLE = 'Unsere eigene Kinderfirma: Wir verdienen uns ein Abenteuer!';

export const DEFAULT_COMPANY_SPLIT = { trip: 80, materials: 20 };
export const FIRST_GOAL_CENTS = 5000;

/** Kurze Fragen für die Wochenrunde, ungefähr fünf Minuten. */
export const COUNCIL_QUESTIONS: { emoji: string; text: string }[] = [
  { emoji: '💪', text: 'Was haben wir diese Woche geschafft?' },
  { emoji: '📬', text: 'Gibt es neue Bestellungen?' },
  { emoji: '🔨', text: 'Müssen wir noch etwas herstellen?' },
  { emoji: '💡', text: 'Welche Idee möchten wir ausprobieren?' },
  { emoji: '🧳', text: 'Wie viel ist in unserer Reisekasse?' },
];

export const COMPANY_PRINCIPLES = [
  'Keine Umsatzpflicht, keine Strafe, wenn nichts verkauft wird.',
  'Kein Vergleich zwischen den Geschwistern: Wir sind ein Team.',
  'Der Urlaub ist ein Familienziel und keine Belohnung. Er findet auch statt, wenn das Geld nicht ganz reicht.',
  'Der selbst verdiente Betrag bleibt immer sichtbar und wird nicht künstlich erhöht. Elternbeiträge stehen getrennt daneben.',
  'Pause ist erlaubt. Nicht jede Woche muss etwas passieren.',
  'Alles Geschäftliche, Rechtliche und alle Sicherheitsfragen übernehmen Mama und Papa.',
];

// ---------------------------------------------------------------- Gründungsrat

/** Reiseziele zur Auswahl im ersten Schritt. Fehlt eines in der Reisekasse, wird es beim Antippen angelegt. */
export const FOUNDING_TRIPS: { id: string; emoji: string; title: string; text: string }[] = [
  { id: 'trip-holiday-park', emoji: '🏊', title: 'Ferienpark', text: 'Ferienhaus und großes Schwimmbad' },
  { id: 'trip-salzburg', emoji: '🏰', title: 'Salzburg', text: 'Burgen, Berge und Altstadt' },
  { id: 'trip-hamburg', emoji: '🚢', title: 'Hamburg', text: 'Hafen, Schiffe und Miniaturwelten' },
];

export function holidayParkTrip(now: string): TripGoal {
  return {
    id: 'trip-holiday-park', name: 'Ferienpark-Wochenende', flag: '🏊', countryName: 'Deutschland',
    description: 'Ein Wochenende im Ferienhaus mit großem Schwimmbad', targetCents: 50000,
    activities: ['Im Badeparadies rutschen', 'Im Wald spazieren und Tiere suchen', 'Abends gemeinsam im Ferienhaus spielen'],
    learning: ['Packliste malen', 'Zählen, wie viele Nächte wir schlafen', 'Den Weg auf der Karte suchen'],
    status: 'active', order: 0, createdAt: now,
  };
}

/** Idee → … → Familienabenteuer, als Bilderkette. */
export const COMPANY_FLOW: { emoji: string; label: string }[] = [
  { emoji: '💡', label: 'Idee' },
  { emoji: '🔨', label: 'Herstellen' },
  { emoji: '🛍️', label: 'Verkaufen' },
  { emoji: '💶', label: 'Geld bekommen' },
  { emoji: '🧾', label: 'Material bezahlen' },
  { emoji: '🐷', label: 'Gewinn sparen' },
  { emoji: '🏖️', label: 'Familienabenteuer' },
];

/** Sechs Möglichkeiten aus dem dritten Schritt; sie landen als Ideen in der Firma. */
export const STARTER_IDEAS: { emoji: string; text: string }[] = [
  { emoji: '🎄', text: 'Weihnachtsdekoration herstellen' },
  { emoji: '🕯️', text: 'Kerzen gestalten' },
  { emoji: '🐦', text: 'Vogelfutteranhänger herstellen' },
  { emoji: '🌱', text: 'Im Frühjahr Pflanzen großziehen' },
  { emoji: '🍋', text: 'Im Sommer einen Verkaufsstand betreiben' },
  { emoji: '🎲', text: 'Spiele bauen und später vermieten' },
];

export interface FoundingStep {
  id: 'surprise' | 'company' | 'ideas' | 'christmas' | 'mission' | 'founding';
  title: string;
  emoji: string;
  /** Text zum Vorlesen; Mama oder Papa können ihn auch frei erzählen. */
  parentText: string;
}

export const FOUNDING_STEPS: FoundingStep[] = [
  {
    id: 'surprise', emoji: '🎁', title: 'Die Überraschung',
    parentText: 'Wir haben eine ganz besondere Idee. Was wäre, wenn wir nächstes Jahr einen richtig tollen Ausflug machen? Vielleicht in ein großes Schwimmbad mit Ferienhaus, vielleicht nach Salzburg oder an einen anderen spannenden Ort. Und wisst ihr, was noch viel toller wäre? Wenn wir gemeinsam etwas erfinden, bauen, basteln oder pflanzen, das andere Menschen kaufen möchten. Das Geld, das wir damit verdienen, sammeln wir für unseren Ausflug!',
  },
  {
    id: 'company', emoji: '🏭', title: 'Was ist eine Firma?',
    parentText: 'Eine Firma macht etwas, das andere Menschen brauchen oder schön finden. Manche Firmen bauen Häuser. Andere backen Brot oder verkaufen Blumen. Wir können auch eine kleine Firma haben! Zuerst haben wir eine Idee. Dann stellen wir etwas her und verkaufen es. Dann bekommen wir Geld. Davon bezahlen wir zuerst unser Material. Was übrig bleibt, ist unser Gewinn. Den sparen wir für unser Familienabenteuer.',
  },
  {
    id: 'ideas', emoji: '💡', title: 'Was könnten wir machen?',
    parentText: 'Was könnten wir machen? Hier sind sechs Ideen. Welche gefällt euch? Habt ihr noch eigene Ideen? Wir schreiben alles auf.',
  },
  {
    id: 'christmas', emoji: '🎄', title: 'Unser erstes Weihnachtsprojekt',
    parentText: 'Bald ist Weihnachten. Viele Menschen suchen schöne Geschenke und Dekoration. Vielleicht können wir schon jetzt etwas herstellen, das sie gerne kaufen möchten. Sucht euch drei oder vier Sachen aus, die wir zuerst ausprobieren.',
  },
  {
    id: 'mission', emoji: '🚀', title: 'Unsere erste Mission',
    parentText: 'Unsere erste Mission heißt: Wir eröffnen unsere Weihnachtswerkstatt! Zuerst machen wir Muster und zeigen sie anderen. Dann sammeln wir Bestellungen und stellen her. Unser erstes Ziel sind 50 Euro Gewinn. Wenn es mehr wird, freuen wir uns. Wenn es weniger wird, ist das auch in Ordnung. Wir lernen dabei ganz viel.',
  },
  {
    id: 'founding', emoji: '🎉', title: 'Wir gründen unsere Kinderfirma!',
    parentText: 'Jetzt ist es so weit: Wir gründen unsere eigene Kinderfirma! Wie soll unsere Firma heißen?',
  },
];

/** Namensvorschläge für den Firmennamen; jederzeit änderbar. */
export const NAME_IDEAS = ['Wunderwerkstatt', 'Die kleinen Macher', 'Sternenfabrik', 'Abenteuerwerkstatt', 'Waldwichtel & Co.'];

// ---------------------------------------------------------------- Produkte

export interface CatalogProduct {
  id: string;
  name: string;
  emoji: string;
  text: string;
  materials: string[];
  /** Vorschläge, die ihr bei der Marktforschung anpasst. */
  costCents: number;
  priceCents: number;
  /** Ungefähre Zeit je Stück. */
  minutes: string;
  /** Wie viel die Kinder selbst machen können. */
  kidShare: string;
  /** Was nur Mama oder Papa vorbereiten. */
  parentPrep?: string;
  note?: string;
}

export const CHRISTMAS_PRODUCTS: CatalogProduct[] = [
  {
    id: 'bead-trees', name: 'Weihnachtsbäume aus Holzperlen', emoji: '🎄',
    text: 'Grüne Holzperlen sortieren und auf Draht fädeln, oben ein kleiner Stern.',
    materials: ['Grüne und bunte Holzperlen', 'Biegsamer Draht oder Pfeifenputzer', 'Kleiner Holzstern', 'Band zum Aufhängen'],
    costCents: 115, priceCents: 500, minutes: '10 bis 15 Minuten', kidShare: 'sehr hoch',
    note: 'Gut für Taavi: Er muss nicht lange stillsitzen und hat schnell ein fertiges Stück.',
  },
  {
    id: 'wood-gnomes', name: 'Weihnachtswichtel aus Holzklötzen', emoji: '🎅',
    text: 'Holzklötze schleifen, Filzmütze und Bart ankleben, eine Holzkugel als Nase.',
    materials: ['Holzklötze, etwa 4 × 4 × 8 cm', 'Schleifpapier', 'Filz für die Mütze', 'Kunstfell oder Wolle für den Bart', 'Kleine Holzkugeln', 'Bastelkleber'],
    costCents: 150, priceCents: 750, minutes: '15 bis 20 Minuten', kidShare: 'hoch', parentPrep: 'Holzklötze zusägen',
    note: 'Jedes Kind kann seine eigene Wichtelkollektion entwerfen.',
  },
  {
    id: 'wood-village', name: 'Holzhäuser-Dreierset zum Bemalen', emoji: '🏘️',
    text: 'Drei kleine Holzhäuser bemalen, mit Schwämmchen tupfen und Fenster stempeln.',
    materials: ['Holzreste als Häuser-Rohlinge', 'Kindgerechte Acrylfarben', 'Schwämmchen', 'Kleine Stempel'],
    costCents: 300, priceCents: 1500, minutes: '20 bis 30 Minuten je Set', kidShare: 'hoch, wenn die Rohlinge vorbereitet sind', parentPrep: 'Rohlinge zusägen',
  },
  {
    id: 'peg-snowflakes', name: 'Holzschneeflocken aus Wäscheklammern', emoji: '❄️',
    text: 'Acht Klammerhälften zu einem Stern zusammenkleben, mit Band zum Aufhängen.',
    materials: ['8 Holzwäscheklammern je Stern', 'Bastelkleber', 'Weißes Band', 'Eventuell weiße Farbe'],
    costCents: 85, priceCents: 650, minutes: '20 bis 35 Minuten je Stern', kidShare: 'hoch', parentPrep: 'Metallfedern aus den Klammern nehmen',
  },
  {
    id: 'slice-reindeer', name: 'Rentiere aus Baumscheiben', emoji: '🦌',
    text: 'Augen, eine rote Pompon-Nase und ein Geweih auf eine kleine Baumscheibe.',
    materials: ['Baumscheiben, 6 bis 8 cm', 'Wackelaugen oder Stift', 'Rote Pompons', 'Zweige oder Pfeifenputzer als Geweih', 'Band und Kleber'],
    costCents: 65, priceCents: 400, minutes: '10 bis 15 Minuten', kidShare: 'hoch',
  },
  {
    id: 'thumb-snowmen', name: 'Schneemänner aus Fingerabdrücken', emoji: '⛄',
    text: 'Mit weißer Farbe Fingerabdrücke auf Holzscheiben stempeln und Gesichter malen.',
    materials: ['Kleine Holzscheiben', 'Weiße und bunte Farbe', 'Feiner Stift', 'Band zum Aufhängen'],
    costCents: 55, priceCents: 400, minutes: '10 Minuten und Trockenzeit', kidShare: 'sehr hoch',
    note: 'Hier kann auch Talisa mitmachen.',
  },
  {
    id: 'nature-ornaments', name: 'Weihnachtsanhänger aus Naturmaterialien', emoji: '🌟',
    text: 'Holzscheiben, Tannenzapfen und andere Schätze aus der Natur, bemalt und mit Band.',
    materials: ['Holzscheiben mit Loch', 'Tannenzapfen, Zimtstangen, Sternanis', 'Juteband oder Schnur', 'Farbe oder Holzstifte'],
    costCents: 80, priceCents: 300, minutes: '10 bis 15 Minuten', kidShare: 'hoch',
  },
  {
    id: 'beeswax-candles', name: 'Gerollte Bienenwachskerzen', emoji: '🕯️',
    text: 'Bienenwachsplatten um einen Docht rollen, mit Band und kleiner Banderole.',
    materials: ['Bienenwachsplatten', 'Kerzendocht', 'Geschenkband', 'Banderole mit Brennhinweis'],
    costCents: 200, priceCents: 500, minutes: '10 Minuten', kidShare: 'hoch',
    note: 'Auf die Banderole gehört ein Hinweis: „Brennende Kerzen nie unbeaufsichtigt lassen.“ Bei regelmäßigem Verkauf prüfen Mama und Papa vorher, was für Kerzen vorgeschrieben ist.',
  },
  {
    id: 'bird-food', name: 'Vogelfutteranhänger', emoji: '🐦',
    text: 'Zapfen oder Förmchen mit Fett und Körnern, mit fester Schnur zum Aufhängen im Garten.',
    materials: ['Ungesalzenes Kokosfett', 'Wildvogelfutter', 'Zapfen oder Ausstechförmchen', 'Naturschnur'],
    costCents: 70, priceCents: 300, minutes: '15 Minuten und Kühlzeit', kidShare: 'mittel', parentPrep: 'Fett schmelzen',
    note: 'Heißes Fett macht nur ein Erwachsener. Keine gesalzenen Zutaten, Schnur aus Naturfaser.',
  },
  {
    id: 'gift-set', name: 'Kleines Weihnachtsgeschenkset', emoji: '🎁',
    text: 'Zwei selbst gemachte Stücke und eine gemalte Dankeskarte zusammen verpackt.',
    materials: ['2 eigene Produkte', 'Dankeskarte', 'Geschenktüte und Band'],
    costCents: 320, priceCents: 1000, minutes: '5 Minuten zum Packen', kidShare: 'hoch',
  },
];

export const PRODUCT_STATUS_LABEL = { idea: 'Idee', sample: 'Muster', selling: 'Im Verkauf', paused: 'Pause' } as const;

/** Gewinnziele, für die der Laden ausrechnet, wie viele Stück nötig wären. */
export const PROFIT_TARGETS = [5000, 10000, 20000];

// ---------------------------------------------------------------- Weihnachtswerkstatt 2026

export type CompanyBand = 'big' | 'middle' | 'little';
export const BAND_LABEL: Record<CompanyBand, string> = { big: 'Die Großen', middle: 'Die Mittleren', little: 'Die Kleinen' };

export interface SeasonPhase {
  id: string;
  title: string;
  emoji: string;
  start: string;
  end: string;
  tasks: { id: string; text: string }[];
  /** Kinderaufgaben nach Alter: ab 5, 3 bis 4, unter 3. */
  kidJobs: Record<CompanyBand, string[]>;
  hint?: string;
  optional?: boolean;
  /** Abschluss: Rückblicksfragen statt Aufgaben. */
  review?: string[];
}

export interface SeasonPlan {
  id: string;
  title: string;
  emoji: string;
  start: string;
  goalCents: number;
  phases: SeasonPhase[];
}

const t = (phase: string, texts: string[]) => texts.map((text, i) => ({ id: `${phase}-${i + 1}`, text }));

export const XMAS_2026: SeasonPlan = {
  id: 'xmas-2026', title: 'Weihnachtswerkstatt 2026', emoji: '🎄', start: '2026-10-18', goalCents: FIRST_GOAL_CENTS,
  phases: [
    {
      id: 'found', title: 'Firmenrat und Gründung', emoji: '🎉', start: '2026-10-18', end: '2026-10-18',
      tasks: t('found', ['Kinderfirma vorstellen', 'Ideen sammeln', 'Erste Weihnachtsprodukte auswählen', 'Firmennamen überlegen', 'Erste Mission freischalten']),
      kidJobs: { big: ['Eigene Ideen erzählen', 'Mitentscheiden'], middle: ['Eigene Ideen erzählen', 'Für eine Idee stimmen'], little: ['Mitfeiern'] },
    },
    {
      id: 'ideas', title: 'Unsere Ideenwerkstatt', emoji: '🧪', start: '2026-10-19', end: '2026-10-25',
      tasks: t('ideas', ['Material anschauen', 'Zwei bis drei Produktmuster herstellen', 'Gemeinsam überlegen, was besonders schön geworden ist', 'Erste Materialkosten notieren', 'Produkte fotografieren']),
      kidJobs: {
        big: ['Ein Muster selbst gestalten', 'Material zählen: Wie viele Holzscheiben haben wir?'],
        middle: ['Naturmaterial sammeln und sortieren', 'Ein Muster bauen und testen: Hält das Band?'],
        little: ['Zapfen in die Kiste legen', 'Mit Farbe tupfen'],
      },
    },
    {
      id: 'research', title: 'Unsere Marktforschung', emoji: '🔍', start: '2026-10-26', end: '2026-11-01',
      tasks: t('research', ['Muster der Familie und einigen Bekannten zeigen', 'Herausfinden, welche Produkte gefragt sind', 'Realistische Preise ermitteln', 'Drei bis vier Produkte für die erste Verkaufsrunde auswählen']),
      kidJobs: {
        big: ['Fragen: „Was gefällt dir am besten?“', 'Mit Münzen legen, was ein Stück kosten könnte'],
        middle: ['Muster zeigen und vorführen', 'Striche machen: Wer mag welches?'],
        little: ['Muster mit zu Oma tragen'],
      },
      hint: 'Nicht jede Idee wird gekauft. Das ist ganz normal und keine Ablehnung. Dann verbessern wir die Idee oder nehmen eine andere.',
    },
    {
      id: 'open', title: 'Wir eröffnen den Verkauf', emoji: '🛍️', start: '2026-11-02', end: '2026-11-08',
      tasks: t('open', ['Produktfotos vorbereiten', 'Kleine Bestellübersicht erstellen', 'Eltern fragen in ihrem Umfeld nach Interessenten', 'Vorbestellungen sammeln', 'Materialbedarf berechnen']),
      kidJobs: {
        big: ['Ein Bild für die Bestellübersicht malen', 'Üben: „Möchtest du einen Anhänger bestellen?“'],
        middle: ['Produkte für das Foto aufbauen', 'Bestellungen auf dem Plakat mit Strichen zählen'],
        little: ['Aufkleber auf die Bestellliste kleben'],
      },
    },
    {
      id: 'production', title: 'Unsere Produktionswerkstatt', emoji: '🔨', start: '2026-11-09', end: '2026-11-22',
      tasks: t('production', ['Bestellungen herstellen', 'Produkte kontrollieren', 'Verpacken', 'Kleine Dankeskarten gestalten', 'Fertige Produkte zählen']),
      kidJobs: {
        big: ['Stücke herstellen', 'Fertige Produkte zählen'],
        middle: ['Kleine Produktionsaufträge: 5 Anhänger fertig machen', 'Verpacken und Band anknoten'],
        little: ['Dankeskarten bemalen', 'Tütchen in die Kiste legen'],
      },
      hint: 'Kurze Einheiten von 10 bis 20 Minuten. Wer keine Lust mehr hat, darf aufhören.',
    },
    {
      id: 'sale1', title: 'Unsere erste Verkaufsrunde', emoji: '🎁', start: '2026-11-23', end: '2026-12-06',
      tasks: t('sale1', ['Bestellte Produkte übergeben', 'Einnahmen erfassen', 'Materialkosten abziehen', 'Ersten echten Gewinn berechnen', 'Reisekasse aktualisieren']),
      kidJobs: {
        big: ['Produkt mit Mama oder Papa übergeben und Danke sagen', 'Münzen zählen'],
        middle: ['Päckchen tragen und übergeben', 'Geld in die Kasse legen'],
        little: ['Mitkommen und winken'],
      },
    },
    {
      id: 'sale2', title: 'Zweite Verkaufsrunde', emoji: '✨', start: '2026-12-07', end: '2026-12-20', optional: true,
      tasks: t('sale2', ['Weitere Bestellungen annehmen', 'Kleine Geschenksets zusammenstellen', 'Eventuell eine zweite Verkaufsaktion organisieren']),
      kidJobs: {
        big: ['Ein Geschenkset zusammenstellen'],
        middle: ['Sets verpacken'],
        little: ['Sterne auf die Tüten kleben'],
      },
      hint: 'Nur, wenn die Kinder weiter Lust haben und es Nachfrage gibt.',
    },
    {
      id: 'closing', title: 'Unser erster Jahresabschluss', emoji: '🏆', start: '2026-12-20', end: '2026-12-20',
      tasks: [],
      kidJobs: { big: ['Erzählen, was am meisten Spaß gemacht hat'], middle: ['Lieblingsprodukt zeigen'], little: ['Mitfeiern'] },
      review: [
        'Was haben wir hergestellt?', 'Wie viele Produkte wurden verkauft?', 'Wie viel Geld haben wir eingenommen?', 'Wie hoch waren unsere Materialkosten?',
        'Wie viel Gewinn haben wir erwirtschaftet?', 'Was hat uns besonders viel Spaß gemacht?', 'Was möchten wir nächstes Jahr wieder machen?',
      ],
      hint: 'Feiern, egal wie hoch der Gewinn ist. Ihr habt eine Firma gegründet!',
    },
  ],
};

export const SEASON_PLANS: Record<string, SeasonPlan> = { [XMAS_2026.id]: XMAS_2026 };

/** Wiederkehrender Jahresrhythmus ab 2027; die Projekte wählt ihr jedes Jahr neu. */
export const YEAR_RHYTHM: { months: number[]; emoji: string; title: string; text: string }[] = [
  { months: [1], emoji: '🧭', title: 'Januar', text: 'Reiseziel wählen, Sparziel festlegen, Projekte planen' },
  { months: [2, 3, 4], emoji: '🌱', title: 'Februar bis April', text: 'Frühlingsgärtnerei: Pflanzen vorziehen und verkaufen' },
  { months: [5, 6, 7, 8], emoji: '☀️', title: 'Mai bis August', text: 'Sommerprojekte, Verkaufsaktionen oder Spielevermietung' },
  { months: [9, 10], emoji: '🍂', title: 'September und Oktober', text: 'Herbstprodukte und die Weihnachtswerkstatt planen' },
  { months: [11, 12], emoji: '🎄', title: 'November und Dezember', text: 'Weihnachtsverkauf, Jahresabschluss und gemeinsam feiern' },
];

// ---------------------------------------------------------------- Werkstatt

export type StepWho = 'kids' | 'parents' | 'together';
export const WHO_LABEL: Record<StepWho, string> = { kids: 'Das schafft ihr allein', parents: 'Mama oder Papa', together: 'Zusammen' };
export const WHO_EMOJI: Record<StepWho, string> = { kids: '🧒', parents: '👩', together: '👪' };

export interface WorkStep { emoji: string; text: string; who: StepWho }

/** Bebilderte Arbeitsschritte je Produkt; kurz genug zum Vorlesen. */
export const PRODUCT_STEPS: Record<string, WorkStep[]> = {
  'bead-trees': [
    { emoji: '🧺', text: 'Perlen nach Farben sortieren', who: 'kids' },
    { emoji: '🪡', text: 'Draht zu einem Baum biegen', who: 'parents' },
    { emoji: '🟢', text: 'Grüne Perlen auffädeln, ab und zu eine bunte', who: 'kids' },
    { emoji: '⭐', text: 'Den Stern oben aufstecken', who: 'kids' },
    { emoji: '🎀', text: 'Band zum Aufhängen anknoten', who: 'together' },
  ],
  'wood-gnomes': [
    { emoji: '🪚', text: 'Holzklötze zusägen', who: 'parents' },
    { emoji: '🧽', text: 'Kanten mit Schleifpapier glatt reiben', who: 'kids' },
    { emoji: '🎩', text: 'Filzmütze aufkleben', who: 'kids' },
    { emoji: '🧔', text: 'Bart aus Fell oder Wolle ankleben', who: 'kids' },
    { emoji: '🔴', text: 'Holzkugel als Nase aussuchen und ankleben', who: 'kids' },
  ],
  'wood-village': [
    { emoji: '🪚', text: 'Häuser-Rohlinge zusägen', who: 'parents' },
    { emoji: '🎨', text: 'Häuser mit Farbe anmalen', who: 'kids' },
    { emoji: '🧽', text: 'Mit dem Schwamm Schnee auf das Dach tupfen', who: 'kids' },
    { emoji: '🪟', text: 'Fenster und Türen stempeln', who: 'kids' },
    { emoji: '📦', text: 'Drei Häuser zu einem Set zusammenlegen', who: 'together' },
  ],
  'peg-snowflakes': [
    { emoji: '🔧', text: 'Federn aus den Klammern nehmen', who: 'parents' },
    { emoji: '🧩', text: 'Je zwei Hälften mit dem Rücken zusammenkleben', who: 'kids' },
    { emoji: '❄️', text: 'Acht Teile zu einem Stern legen', who: 'kids' },
    { emoji: '🫙', text: 'In der Mitte festkleben und trocknen lassen', who: 'together' },
    { emoji: '🎀', text: 'Band zum Aufhängen anknoten', who: 'together' },
  ],
  'slice-reindeer': [
    { emoji: '🪵', text: 'Baumscheiben aussuchen', who: 'kids' },
    { emoji: '👀', text: 'Augen aufkleben oder malen', who: 'kids' },
    { emoji: '🔴', text: 'Die rote Nase aufkleben', who: 'kids' },
    { emoji: '🌿', text: 'Geweih aus Zweigen ankleben', who: 'together' },
    { emoji: '🎀', text: 'Band zum Aufhängen befestigen', who: 'together' },
  ],
  'thumb-snowmen': [
    { emoji: '🪵', text: 'Holzscheibe hinlegen', who: 'kids' },
    { emoji: '👍', text: 'Finger in weiße Farbe tupfen und zwei Abdrücke machen', who: 'kids' },
    { emoji: '⏳', text: 'Gut trocknen lassen', who: 'kids' },
    { emoji: '✏️', text: 'Gesicht, Knöpfe und Schal malen', who: 'together' },
    { emoji: '🎀', text: 'Band zum Aufhängen anknoten', who: 'together' },
  ],
  'nature-ornaments': [
    { emoji: '🌲', text: 'Zapfen, Zimt und Sternanis sammeln und sortieren', who: 'kids' },
    { emoji: '🎨', text: 'Holzscheiben bemalen', who: 'kids' },
    { emoji: '🧷', text: 'Naturschätze aufkleben', who: 'together' },
    { emoji: '🎀', text: 'Band durch das Loch fädeln', who: 'kids' },
  ],
  'beeswax-candles': [
    { emoji: '📏', text: 'Wachsplatte und Docht zuschneiden', who: 'parents' },
    { emoji: '✋', text: 'Wachsplatte mit warmen Händen weich machen', who: 'kids' },
    { emoji: '🕯️', text: 'Fest um den Docht rollen', who: 'together' },
    { emoji: '🏷️', text: 'Banderole mit Brennhinweis umlegen', who: 'together' },
  ],
  'bird-food': [
    { emoji: '🔥', text: 'Fett schmelzen', who: 'parents' },
    { emoji: '🥄', text: 'Körner einrühren', who: 'together' },
    { emoji: '🌲', text: 'Zapfen oder Förmchen füllen', who: 'kids' },
    { emoji: '❄️', text: 'Kalt werden lassen', who: 'kids' },
    { emoji: '🎀', text: 'Schnur anknoten und in Tütchen packen', who: 'together' },
  ],
  'gift-set': [
    { emoji: '🧺', text: 'Zwei fertige Stücke aussuchen', who: 'kids' },
    { emoji: '💌', text: 'Dankeskarte malen', who: 'kids' },
    { emoji: '🛍️', text: 'Alles in die Tüte legen', who: 'kids' },
    { emoji: '🎀', text: 'Band zubinden', who: 'together' },
  ],
};

export const GENERIC_STEPS: WorkStep[] = [
  { emoji: '🧺', text: 'Material holen und bereitlegen', who: 'kids' },
  { emoji: '🔨', text: 'Ein Stück herstellen', who: 'together' },
  { emoji: '🔍', text: 'Anschauen: Ist es schön geworden?', who: 'kids' },
  { emoji: '🎁', text: 'Verpacken', who: 'kids' },
];

/** Dauer einer Werkstatt-Einheit in Minuten; danach darf Pause sein. */
export const WORK_UNIT_MINUTES = 15;

// ---------------------------------------------------------------- Erfolge

export interface Milestone { id: string; emoji: string; title: string }

export const PROFIT_MILESTONES = [1000, 2500, 5000, 10000, 15000, 20000];

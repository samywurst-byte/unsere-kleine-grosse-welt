import type { ProjectLevel, ProjectPhase } from '../types';

/**
 * Ideensammlung der Projektwerkstatt. Ids bleiben dauerhaft.
 * Inhalte sind Tätigkeiten, keine Sachtexte: Fakten zu Themen kommen später mit Quellen in die Entdeckerbibliothek.
 * Jede Idee hat Teilaufgaben je Niveau, damit alle Kinder dasselbe Projekt auf ihrem Stand erleben.
 */

export const PHASES: { id: ProjectPhase; label: string; emoji: string }[] = [
  { id: 'discover', label: 'Entdecken', emoji: '🔍' },
  { id: 'plan', label: 'Planen', emoji: '📝' },
  { id: 'make', label: 'Machen', emoji: '✂️' },
  { id: 'document', label: 'Dokumentieren', emoji: '📷' },
  { id: 'finish', label: 'Abschließen', emoji: '🎉' },
];

export const LEVEL_LABEL: Record<ProjectLevel, string> = {
  toddler: 'Bilder und Mitmachen',
  preschool: 'Laute, Mengen, Sortieren',
  reader: 'Erste Wörter lesen und schreiben',
  school: 'Schulkind',
};

export const AREA_LABEL: Record<string, string> = {
  math: 'Mathe',
  language: 'Sprache',
  nature: 'Natur',
  time: 'Zeit',
  planning: 'Planen',
  creativity: 'Gestalten',
  money: 'Geld',
};

export interface ProjectIdea {
  id: string;
  title: string;
  emoji: string;
  summary: string;
  /** Ungefähre Dauer in Wochen. */
  weeks: number;
  /** Passende Monate (1 bis 12); leer = immer. */
  months: number[];
  areas: string[];
  steps: Record<ProjectPhase, string[]>;
  tasks: Record<ProjectLevel, string[]>;
  /** Wörter zum Lesen für Lesekinder; die App nimmt nur die, deren Buchstaben schon sitzen. */
  words?: string[];
  materials: string[];
  trip?: string;
  presentation?: string;
  /** Wichtiger Hinweis, z. B. zu Verkauf oder Hygiene. */
  note?: string;
  /** Projekt mit Einnahmen und Ausgaben. */
  money?: boolean;
  /** Mit Verkaufsstand: bekommt den Baustein SALE_STAND (Schild, Preise, Kasse, Wechselgeld). */
  stand?: boolean;
  /** Ab welchem Niveau sinnvoll, z. B. Referat erst für Schulkinder. */
  minLevel?: ProjectLevel;
  /** Was die Kinder allein schaffen. */
  alone?: string[];
  /** Was ihr zusammen macht (Erwachsene dabei). */
  together?: string[];
}

const SALE_NOTE = 'Verkauf nur gelegentlich, beaufsichtigt und auf eigenem Grundstück. Vorher bei der Gemeinde klären, was erlaubt ist; '
  + 'bei Lebensmitteln auch die Lebensmittelüberwachung fragen. Die Kinder verkaufen nie allein an Fremde.';

const FOOD_SALE_NOTE = 'Bei Selbstgebackenem: Zutatenliste auf das Schild (Allergene wie Nüsse, Ei, Milch, Weizen), Hände waschen, Ware abgedeckt. ' + SALE_NOTE;

/**
 * Baustein „Unser Verkaufsstand“: steckt in jedem Projekt mit Verkaufsstand (stand: true).
 * Gleiche Texte wie in den Ideen werden nicht doppelt übernommen.
 */
export const SALE_STAND: { steps: Partial<Record<ProjectPhase, string[]>>; materials: string[] } = {
  steps: {
    plan: [
      'Verkaufsstand planen: Was verkaufen wir, wann und wo?',
      'Preise gemeinsam festlegen: runde Beträge wie 50 ct, 1 € oder 2 €',
      'Wechselgeld vorbereiten und zählen, z. B. 10 × 50 ct, 6 × 1 €, 2 × 2 € (zusammen 15 €)',
      'Vorher vereinbaren, wofür das Geld ist und wer wie viel bekommt',
    ],
    make: [
      'Verkaufsschild malen (Druckvorlage unter „Projektblätter“)',
      'Preisschilder malen',
      'Kasse basteln: Schuhkarton mit Schlitz oder Dose',
      'Tisch mit Tischdecke aufbauen, Schild gut sichtbar aufhängen',
      'Verkaufen üben: „Möchten Sie etwas kaufen?“, Münzen hinlegen, „Danke!“',
      'Verkauf mit Mama oder Papa',
    ],
    document: ['Kassenzettel führen: für jedes verkaufte Stück ein Strich'],
    finish: ['Kasse zählen, Wechselgeld abziehen, dann die Kosten: Was ist übrig geblieben?'],
  },
  materials: ['Tisch und Tischdecke', 'Pappe und Stifte für das Verkaufsschild', 'Schuhkarton oder Dose als Kasse', 'Wechselgeld'],
};

/** Schritte einer Idee, bei Verkaufsprojekten mit dem Verkaufsstand. */
export function ideaSteps(idea: Pick<ProjectIdea, 'steps' | 'stand'>): Record<ProjectPhase, string[]> {
  if (!idea.stand) return idea.steps;
  const out = { ...idea.steps };
  for (const { id } of PHASES) {
    const extra = (SALE_STAND.steps[id] ?? []).filter((l) => !out[id].some((x) => x.split(':')[0] === l.split(':')[0]));
    // Der Verkauf selbst bleibt am Ende von „Machen“, die Vorbereitung davor
    out[id] = id === 'make' ? [...out[id].filter((x) => !x.startsWith('Verkauf mit')), ...extra.filter((x) => !x.startsWith('Verkauf mit')), 'Verkauf mit Mama oder Papa'] : [...out[id], ...extra];
  }
  return out;
}

export function ideaMaterials(idea: Pick<ProjectIdea, 'materials' | 'stand'>): string[] {
  if (!idea.stand) return idea.materials;
  return [...idea.materials, ...SALE_STAND.materials.filter((m) => !idea.materials.some((x) => x.toLowerCase().includes(m.split(' ')[0].toLowerCase())))];
}

export const PROJECT_IDEAS: ProjectIdea[] = [
  {
    id: 'paper-planes', title: 'Papierflieger-Labor', emoji: '✈️', weeks: 1, months: [],
    summary: 'Verschiedene Flieger falten, Flugweiten messen, vergleichen und aufschreiben.',
    areas: ['math', 'nature', 'planning'],
    steps: {
      discover: ['Papierflieger aus Büchern oder Videos anschauen', 'Vermuten: Welcher fliegt am weitesten?'],
      plan: ['Drei Fliegermodelle aussuchen', 'Startlinie und Messstrecke festlegen'],
      make: ['Flieger falten und bemalen', 'Jeder Flieger fliegt dreimal', 'Weiten mit Schritten oder Maßband messen'],
      document: ['Ergebnisse in eine Tabelle eintragen', 'Fotos von den Fliegern machen'],
      finish: ['Siegerflieger küren und erklären, warum er gewinnt'],
    },
    tasks: {
      toddler: ['Flieger anmalen', 'Flieger werfen und hinterherlaufen', 'Zeigen: Welcher ist weiter weg?'],
      preschool: ['Schritte bis zum Flieger zählen', 'Flieger nach Weite sortieren: nah, mittel, weit', 'Eigenen Flieger mit Hilfe falten'],
      reader: ['Flugweiten in Schritten zählen und aufschreiben', 'Den eigenen Flieger benennen und den Namen schreiben', 'Vergleichen: weiter oder kürzer?'],
      school: ['Weiten in Metern messen und in eine Tabelle schreiben', 'Mittelwert aus drei Würfen überlegen (mit Hilfe)', 'Einen Satz schreiben: Mein Flieger fliegt am weitesten, weil …'],
    },
    words: ['LOS', 'MEIN', 'WEIT', 'FLUG', 'NASE'],
    materials: ['Papier (A4)', 'Buntstifte', 'Maßband', 'Kreide oder Klebeband für die Startlinie'],
    presentation: 'Flugschau für die Familie',
  },
  {
    id: 'tree', title: 'Unser eigener Baum', emoji: '🌳', weeks: 4, months: [3, 4, 10, 11],
    summary: 'Einen Baum auswählen und pflanzen, dann Wachstum über Jahre messen und fotografieren.',
    areas: ['nature', 'time', 'math'],
    steps: {
      discover: ['Bäume in der Umgebung anschauen: Blätter, Rinde, Früchte', 'Überlegen, welcher Baum zu uns passt'],
      plan: ['Platz im Garten aussuchen', 'Setzling in der Baumschule besorgen'],
      make: ['Loch graben und pflanzen', 'Gießplan aufstellen', 'Baum mit einem Stab messen und markieren'],
      document: ['Foto der Kinder neben dem Baum', 'Größe aufschreiben'],
      finish: ['Baumtaufe: einen Namen geben', 'Jedes Jahr am selben Tag wieder messen und fotografieren'],
    },
    tasks: {
      toddler: ['Erde schaufeln', 'Den Baum gießen', 'Blätter sammeln und aufkleben'],
      preschool: ['Blätter nach Form und Farbe sortieren', 'Gießkannen zählen', 'Den Baum malen'],
      reader: ['Ein Namensschild für den Baum schreiben', 'Größe mit Stab und Schnur messen', 'Wörter lesen'],
      school: ['Wachstum in Zentimetern messen und eintragen', 'Steckbrief über die Baumart schreiben', 'Einen Gießplan als Tabelle anlegen'],
    },
    words: ['BAUM', 'ERDE', 'NAME', 'AST', 'LAUB'],
    materials: ['Setzling', 'Spaten', 'Gießkanne', 'Stützpfahl', 'Schild und wasserfester Stift'],
    presentation: 'Baumtaufe mit der ganzen Familie',
  },
  {
    id: 'dinosaurs', title: 'Dinosaurier-Forscher', emoji: '🦕', weeks: 4, months: [],
    summary: 'Ein mehrwöchiges Forscherprojekt: Zeitstrahl, Fußabdrücke, Fossilien, Museum und eigenes Plakat.',
    areas: ['nature', 'time', 'language', 'creativity'],
    steps: {
      discover: ['Bücher über Dinosaurier aus der Bücherei holen', 'Fragen sammeln: Was wollen wir herausfinden?', 'Fleischfresser und Pflanzenfresser unterscheiden'],
      plan: ['Naturkundemuseum aussuchen, Öffnungszeiten und Eintritt selbst prüfen', 'Fragen für den Museumsbesuch aufschreiben'],
      make: ['Zeitstrahl auf einer langen Papierrolle durch die Wohnung legen: Trias, Jura, Kreidezeit', 'Fußabdrücke basteln und Größen mit einer Schnur vergleichen', 'Fossilien aus Salzteig formen'],
      document: ['Fotos vom Zeitstrahl und den Fossilien', 'Forscherplakat gestalten'],
      finish: ['Forscherabend: Die Kinder zeigen der Familie, was sie herausgefunden haben'],
    },
    tasks: {
      toddler: ['Dinosaurier auf Bildkarten finden', 'Fußabdrücke in Knete drücken', 'Bilder fürs Plakat aufkleben'],
      preschool: ['Dinosaurier nach Größe sortieren', 'Anfangslaute hören: D wie Dino', 'Fußabdrücke zählen'],
      reader: ['Wörter lesen', 'Dinosauriernamen nachspuren oder selbst schreiben', 'Fußabdrücke zählen und Größen vergleichen', 'Im Museum drei Dinge finden, die dich besonders interessieren'],
      school: ['Einen Steckbrief zu einem Dinosaurier schreiben', 'Zeitstrahl beschriften', 'Im Museum zwei Fragen beantworten'],
    },
    words: ['EI', 'NEST', 'DINO', 'ZAHN', 'SAND', 'NASE'],
    materials: ['Lange Papierrolle', 'Salzteig: Mehl, Salz, Wasser', 'Schnur', 'Plakatkarton', 'Kleber und Stifte'],
    trip: 'Besuch im Naturkundemuseum',
    presentation: 'Forscherabend',
  },
  {
    id: 'timeline', title: 'Unser Zeitstrahl', emoji: '📏', weeks: 2, months: [],
    summary: 'Ein eigener Zeitstrahl: zuerst die Familie mit Geburtstagen, später Großeltern und andere Zeiten.',
    areas: ['time', 'math', 'creativity'],
    steps: {
      discover: ['Alte Fotos anschauen: Wie sahen wir als Babys aus?', 'Über früher und heute sprechen'],
      plan: ['Festlegen: ein Schritt oder eine Handbreit für jedes Jahr', 'Fotos aussuchen und ausdrucken'],
      make: ['Papierrolle ausrollen und Jahre markieren', 'Geburtstage der Familie eintragen', 'Fotos aufkleben'],
      document: ['Foto vom fertigen Zeitstrahl'],
      finish: ['Zeitstrahl aufhängen und jedes Jahr ergänzen'],
    },
    tasks: {
      toddler: ['Das eigene Babyfoto finden', 'Fotos aufkleben'],
      preschool: ['Geschwister nach Alter ordnen', 'Jahre mit Schritten abgehen und zählen'],
      reader: ['Die Namen der Familie schreiben', 'Jahre zählen: Wie alt ist wer?', 'Wörter lesen'],
      school: ['Jahreszahlen eintragen', 'Ausrechnen, wie viele Jahre zwischen zwei Ereignissen liegen'],
    },
    words: ['MAMA', 'PAPA', 'OMA', 'OPA', 'JAHR'],
    materials: ['Lange Papierrolle', 'Fotos', 'Klebestift', 'Lineal', 'Stifte'],
  },
  {
    id: 'fossils', title: 'Fossilien selbst machen', emoji: '🐚', weeks: 1, months: [],
    summary: 'Abdrücke von Muscheln, Blättern und Spielzeugtieren in Salzteig oder Gips und daraus eine kleine Ausstellung.',
    areas: ['nature', 'creativity'],
    steps: {
      discover: ['Echte Abdrücke suchen: Spuren im Sand oder Matsch', 'Bilder von Fossilien anschauen'],
      plan: ['Gegenstände für die Abdrücke sammeln'],
      make: ['Salzteig kneten', 'Abdrücke machen und trocknen lassen', 'Fossilien anmalen'],
      document: ['Fotos von der Ausstellung'],
      finish: ['Ausstellung mit Schildern für die Familie'],
    },
    tasks: {
      toddler: ['Teig kneten', 'Muscheln in den Teig drücken'],
      preschool: ['Abdruck und Gegenstand richtig zuordnen', 'Fossilien zählen und sortieren'],
      reader: ['Schilder für die Ausstellung schreiben', 'Wörter lesen'],
      school: ['Ein Ausstellungsschild mit zwei Sätzen schreiben'],
    },
    words: ['SAND', 'TEIG', 'MUSCHEL', 'ALT'],
    materials: ['Mehl', 'Salz', 'Muscheln, Blätter oder Spielzeugtiere', 'Farben und Pinsel'],
    presentation: 'Kleine Fossilien-Ausstellung',
  },
  {
    id: 'museum', title: 'Museumsbesuch', emoji: '🏛️', weeks: 2, months: [],
    summary: 'Gemeinsam ein Museum aussuchen, Fragen vorbereiten, hingehen und danach erzählen.',
    areas: ['planning', 'language', 'nature'],
    steps: {
      discover: ['Überlegen: Was möchten wir sehen? Tiere, Technik, Dinosaurier, Kunst?'],
      plan: ['Museum aussuchen, Öffnungszeiten, Eintritt und Anfahrt selbst prüfen', 'Fragen sammeln, die wir beantworten wollen', 'Proviant und Pausen planen'],
      make: ['Museumsbesuch', 'Fragen beantworten und ein Lieblingsstück aussuchen'],
      document: ['Fotos und Eintrittskarten aufheben', 'Jedes Kind malt sein Lieblingsstück'],
      finish: ['Zuhause erzählen: Was war das Beste?'],
    },
    tasks: {
      toddler: ['Im Museum ein Tier zeigen', 'Lieblingsstück malen'],
      preschool: ['Fünf Dinge im Museum zählen', 'Das Lieblingsstück malen und erzählen'],
      reader: ['Drei Dinge finden, die dich besonders interessieren', 'Ein Wort von einem Schild abschreiben', 'Wörter lesen'],
      school: ['Zwei vorbereitete Fragen beantworten', 'Drei Sätze über den Besuch schreiben'],
    },
    words: ['TIER', 'BILD', 'ALT', 'SAAL'],
    materials: ['Proviant', 'Trinkflaschen', 'Klemmbrett und Stift', 'Fragenzettel'],
    trip: 'Museumsbesuch',
  },
  {
    id: 'farm-shop', title: 'Obsternte und Hoflädchen', emoji: '🧺', weeks: 3, months: [8, 9, 10], money: true, stand: true,
    summary: 'Ernten, sortieren, wiegen, Preise überlegen und Einnahmen und Kosten einzeln aufschreiben.',
    areas: ['math', 'money', 'nature', 'planning'],
    steps: {
      discover: ['Schauen, welches Obst reif ist', 'Überlegen: Was brauchen wir für einen kleinen Verkauf?'],
      plan: ['Mit der Gemeinde klären, was erlaubt ist', 'Preise gemeinsam festlegen', 'Aufteilung der Einnahmen vorher vereinbaren'],
      make: ['Ernten und sortieren', 'Körbchen abwiegen und befüllen', 'Preisschilder malen', 'Verkauf mit Mama oder Papa'],
      document: ['Verkäufe und Kosten eintragen', 'Fotos vom Stand'],
      finish: ['Überschuss ausrechnen und gemeinsam entscheiden, wofür er ist'],
    },
    tasks: {
      toddler: ['Obst in Körbchen legen', 'Kunden zuwinken'],
      preschool: ['Obst nach Größe sortieren', 'Körbchen zählen', 'Münzen nach Größe sortieren'],
      reader: ['Preisschilder schreiben', 'Verkaufte Körbchen zählen', 'Wörter lesen'],
      school: ['Einnahmen und Kosten zusammenrechnen', 'Wiegen und Gewichte aufschreiben', 'Überschuss ausrechnen'],
    },
    words: ['OBST', 'KORB', 'EURO', 'PREIS'],
    materials: ['Körbchen oder Schalen', 'Küchenwaage', 'Tisch', 'Karton für Schilder', 'Wechselgeld'],
    note: SALE_NOTE,
  },
  {
    id: 'lemonade', title: 'Limonadenprojekt', emoji: '🍋', weeks: 1, months: [5, 6, 7, 8], money: true, stand: true,
    summary: 'Rezept ausprobieren, abmessen, abschmecken und vielleicht in kleinem Rahmen anbieten.',
    areas: ['math', 'money', 'planning'],
    steps: {
      discover: ['Verschiedene Rezepte anschauen', 'Probieren: süß, sauer, mit Minze?'],
      plan: ['Rezept auswählen und Zutaten besorgen', 'Wenn verkauft werden soll: vorher klären, was erlaubt ist'],
      make: ['Zitronen auspressen', 'Abmessen und mischen', 'Abschmecken'],
      document: ['Rezept aufschreiben', 'Kosten eintragen'],
      finish: ['Limonadenfest für Familie und Freunde'],
    },
    tasks: {
      toddler: ['Zitronen in die Presse legen', 'Probieren und sagen: sauer oder süß?'],
      preschool: ['Löffel Zucker oder Honig zählen', 'Becher verteilen: einer für jeden'],
      reader: ['Das Rezept abschreiben', 'Messbecher ablesen', 'Wörter lesen'],
      school: ['Rezept für doppelte Menge ausrechnen', 'Kosten pro Becher überlegen'],
    },
    words: ['EIS', 'SAFT', 'MINZE', 'SAUER'],
    materials: ['Zitronen', 'Minze', 'Honig oder Zucker', 'Wasser', 'Krug', 'Becher'],
    note: 'Für den Verkauf gelten bei Getränken Hygieneregeln. ' + SALE_NOTE,
  },
  {
    id: 'flea-market', title: 'Flohmarkt', emoji: '🧸', weeks: 2, months: [3, 4, 5, 6, 7, 8, 9, 10], money: true, stand: true,
    summary: 'Aussortieren, Preise überlegen, verkaufen und gemeinsam zählen, was zusammengekommen ist.',
    areas: ['money', 'planning', 'language', 'math'],
    steps: {
      discover: ['Spielsachen und Kleidung anschauen: Was brauche ich nicht mehr?'],
      plan: ['Flohmarkt aussuchen und anmelden', 'Preise gemeinsam festlegen'],
      make: ['Sachen sortieren und auszeichnen', 'Flohmarkt mit Mama oder Papa'],
      document: ['Einnahmen eintragen', 'Fotos vom Stand'],
      finish: ['Geld zählen und entscheiden, wofür es ist'],
    },
    tasks: {
      toddler: ['Ein Kuscheltier zum Verkaufen aussuchen', 'Sachen in die Kiste legen'],
      preschool: ['Sachen nach Art sortieren', 'Münzen zählen'],
      reader: ['Preisschilder schreiben', 'Verkaufte Sachen zählen', 'Wörter lesen'],
      school: ['Einnahmen zusammenrechnen', 'Wechselgeld üben'],
    },
    words: ['AUTO', 'BALL', 'EURO', 'PUPPE'],
    materials: ['Decke oder Tisch', 'Preisaufkleber', 'Wechselgeld', 'Kisten'],
    note: 'Geld aus dem Verkauf eigener Spielsachen oder Kleidung gehört dem Kind. Es entscheidet freiwillig, ob es etwas in eine gemeinsame Kasse gibt.',
  },
  {
    id: 'lanterns', title: 'Laternen basteln', emoji: '🏮', weeks: 1, months: [10, 11],
    summary: 'Jedes Kind gestaltet seine eigene Laterne für den Martinsumzug.',
    areas: ['creativity', 'language'],
    steps: {
      discover: ['Laternen anschauen und ein Motiv aussuchen', 'Laternenlieder singen'],
      plan: ['Material besorgen', 'Termin des Martinsumzugs eintragen'],
      make: ['Laternen basteln', 'Lichterkette oder Lampe einsetzen'],
      document: ['Foto mit den Laternen'],
      finish: ['Martinsumzug'],
    },
    tasks: {
      toddler: ['Transparentpapier aufkleben', 'Ein Laternenlied mitsingen'],
      preschool: ['Formen ausschneiden', 'Ein Lied auswendig singen'],
      reader: ['Den eigenen Namen auf die Laterne schreiben', 'Wörter lesen'],
      school: ['Eine Bastelanleitung für die Geschwister aufschreiben'],
    },
    words: ['LICHT', 'SONNE', 'MOND', 'STERN'],
    materials: ['Transparentpapier', 'Kleister', 'Laternenstab mit Lampe', 'Pappe für den Rahmen'],
    trip: 'Martinsumzug',
  },
  {
    id: 'cookies', title: 'Weihnachtsplätzchen', emoji: '🍪', weeks: 1, months: [11, 12],
    summary: 'Rezept lesen, abwiegen, ausstechen, verzieren und verschenken.',
    areas: ['math', 'creativity', 'language'],
    steps: {
      discover: ['Lieblingsplätzchen aussuchen'],
      plan: ['Zutaten prüfen und einkaufen', 'Überlegen, wem wir Plätzchen schenken'],
      make: ['Teig machen: abwiegen und abmessen', 'Ausstechen und backen', 'Verzieren'],
      document: ['Rezept und Fotos festhalten'],
      finish: ['Plätzchen verschenken'],
    },
    tasks: {
      toddler: ['Teig ausstechen', 'Streusel verteilen'],
      preschool: ['Plätzchen zählen und auf Teller verteilen', 'Formen sortieren: Stern, Herz, Mond'],
      reader: ['Zutatenliste lesen', 'Geschenkanhänger schreiben', 'Wörter lesen'],
      school: ['Mengen abwiegen und ablesen', 'Rezept für doppelte Menge ausrechnen'],
    },
    words: ['MEHL', 'EI', 'STERN', 'TEIG'],
    materials: ['Mehl', 'Butter', 'Zucker', 'Eier', 'Ausstechformen', 'Streusel'],
  },
  {
    id: 'poster', title: 'Forscherplakat', emoji: '🖼️', weeks: 2, months: [],
    summary: 'Ein Thema aussuchen, Bilder und Wörter sammeln und ein Plakat für die Familie gestalten.',
    areas: ['language', 'creativity', 'planning'],
    steps: {
      discover: ['Thema aussuchen, z. B. ein Tier, ein Land oder ein Fahrzeug', 'Bücher dazu ausleihen'],
      plan: ['Überlegen: Was soll aufs Plakat?', 'Bilder ausdrucken oder malen'],
      make: ['Plakat gestalten', 'Überschrift schreiben'],
      document: ['Foto vom fertigen Plakat'],
      finish: ['Plakat der Familie vorstellen'],
    },
    tasks: {
      toddler: ['Bilder aufkleben', 'Ein Bild zeigen und benennen'],
      preschool: ['Bilder malen und ordnen', 'Anfangslaute der Bilder hören'],
      reader: ['Einzelne Wörter aufs Plakat schreiben', 'Wörter lesen'],
      school: ['Ganze Sätze aufs Plakat schreiben', 'Aufschreiben, aus welchem Buch das Wissen stammt'],
    },
    words: ['TIER', 'LAND', 'AUTO', 'NAME'],
    materials: ['Plakatkarton', 'Kleber', 'Stifte', 'Bilder'],
    presentation: 'Plakat vorstellen',
  },
  {
    id: 'talk', title: 'Erstes Referat', emoji: '🎤', weeks: 3, months: [], minLevel: 'school',
    summary: 'Ein Thema recherchieren, Quellen vergleichen, ein Plakat gestalten und vor der Familie vortragen. Etwa ab sieben oder acht Jahren.',
    areas: ['language', 'planning'],
    steps: {
      discover: ['Thema aussuchen', 'In zwei Büchern oder Quellen nachlesen'],
      plan: ['Gliederung aufschreiben: Anfang, drei Punkte, Schluss', 'Stichwortkarten schreiben'],
      make: ['Plakat oder Bilder vorbereiten', 'Vortrag üben'],
      document: ['Quellen aufschreiben', 'Foto vom Vortrag'],
      finish: ['Vortrag vor der Familie, danach Fragen beantworten'],
    },
    tasks: {
      toddler: ['Zuhören und klatschen'],
      preschool: ['Eine Frage zum Vortrag stellen'],
      reader: ['Ein Bild fürs Plakat malen und beschriften'],
      school: ['Stichwortkarten schreiben', 'Zwei Quellen vergleichen', 'Kleines Quellenverzeichnis anlegen', 'Vortrag zweimal üben'],
    },
    materials: ['Karteikarten', 'Plakatkarton', 'Bücher aus der Bücherei'],
    presentation: 'Vortrag vor der Familie',
  },
  {
    id: 'bread', title: 'Vom Korn zum Brot', emoji: '🍞', weeks: 2, months: [],
    summary: 'Körner anschauen und mahlen, einen Teig kneten, Brot backen und gemeinsam essen.',
    areas: ['nature', 'math', 'planning'],
    steps: {
      discover: ['Körner, Mehl und Brot nebeneinanderlegen: Was gehört zusammen?', 'Im Bibliotheksthema „Woher kommt unser Essen?“ nachlesen', 'Fragen sammeln: Warum geht Teig auf?'],
      plan: ['Ein einfaches Brotrezept aussuchen', 'Zutaten auf die Einkaufsliste setzen', 'Backtag im Kalender eintragen'],
      make: ['Ein paar Körner im Mörser zu Mehl reiben', 'Zutaten abwiegen und Teig kneten', 'Teig gehen lassen und vorher und nachher vergleichen', 'Brot oder Brötchen backen'],
      document: ['Fotos vom Teig vor und nach dem Gehen', 'Rezept als Bilderrezept aufschreiben oder malen'],
      finish: ['Brotzeit mit selbstgebackenem Brot für die Familie'],
    },
    tasks: {
      toddler: ['Mehl mit den Händen fühlen', 'Teig kneten', 'Brötchen mit Körnern bestreuen'],
      preschool: ['Löffel und Tassen beim Abmessen zählen', 'Teig in gleich große Stücke teilen', 'Anfangslaute hören: B wie Brot'],
      reader: ['Das Rezept lesen und die Zutaten abhaken', 'Wörter lesen', 'Ein Schild für das Brot schreiben'],
      school: ['Mengen auf der Küchenwaage ablesen', 'Rezept für die doppelte Menge ausrechnen', 'Die Schritte vom Korn zum Brot in der richtigen Reihenfolge aufschreiben'],
    },
    words: ['BROT', 'MEHL', 'KORN', 'TEIG', 'OFEN'],
    materials: ['Mehl', 'Hefe', 'Salz', 'Wasser', 'Ein paar Getreidekörner', 'Mörser', 'Schüssel', 'Küchenwaage', 'Backblech'],
    presentation: 'Brotzeit für die Familie',
    note: 'Den Ofen bedienen nur Erwachsene. Auf Allergien und Unverträglichkeiten achten.',
  },
  {
    id: 'weather-station', title: 'Unsere Wetterstation', emoji: '🌦️', weeks: 3, months: [],
    summary: 'Regenmesser, Windsack und Thermometer aufstellen und drei Wochen lang jeden Tag das Wetter aufschreiben.',
    areas: ['nature', 'math', 'time'],
    steps: {
      discover: ['Aus dem Fenster schauen: Wie ist das Wetter heute?', 'Im Bibliotheksthema „Wetter“ nachlesen'],
      plan: ['Einen festen Platz im Garten oder auf dem Balkon aussuchen', 'Eine Wettertabelle mit Bildern für Sonne, Wolken, Regen, Schnee und Wind vorbereiten'],
      make: ['Regenmesser aus einer Flasche bauen', 'Windsack aus Krepppapier basteln', 'Thermometer aufhängen', 'Jeden Tag zur gleichen Zeit ablesen und eintragen'],
      document: ['Wettertabelle ausfüllen', 'Foto der Wetterstation'],
      finish: ['Auswerten: Wie viele Regentage, wie viele Sonnentage? Ein Balkendiagramm malen'],
    },
    tasks: {
      toddler: ['Wetterbild aufkleben', 'Zeigen: Regnet es oder scheint die Sonne?'],
      preschool: ['Regentage mit Strichen zählen', 'Den Windsack beobachten: schlapp oder flatternd?', 'Wetterbilder malen'],
      reader: ['Wörter lesen', 'Das Wetter jeden Tag mit einem Wort aufschreiben', 'Am Regenmesser den Strich ablesen'],
      school: ['Temperatur jeden Tag notieren', 'Wärmsten und kältesten Tag finden', 'Ein Balkendiagramm zu den Wettertagen zeichnen'],
    },
    words: ['SONNE', 'REGEN', 'WIND', 'NASS', 'KALT'],
    materials: ['Leere Plastikflasche', 'Lineal', 'Wasserfester Stift', 'Krepppapier', 'Klopapierrolle', 'Schnur', 'Thermometer', 'Papier für die Tabelle'],
    presentation: 'Wetterbericht für die Familie, wie im Fernsehen',
    note: 'Die Flasche schneidet ein Erwachsener auf, die Kante kann scharf sein.',
  },
  {
    id: 'bird-feeder', title: 'Futterplatz für Vögel', emoji: '🐦', weeks: 4, months: [11, 12, 1, 2],
    summary: 'Im Winter einen Futterplatz einrichten, Vögel beobachten, zählen und kennenlernen.',
    areas: ['nature', 'math', 'language'],
    steps: {
      discover: ['Welche Vögel kommen in unseren Garten?', 'Ein Vogelbuch aus der Bücherei holen'],
      plan: ['Einen Platz aussuchen, an dem Katzen nicht hinkommen und den man vom Fenster aus sieht', 'Futter auf die Einkaufsliste setzen'],
      make: ['Futterhaus oder Futtersäule aufhängen', 'Jeden Tag Futter nachfüllen und sauber halten', 'Eine Woche lang Vögel beobachten und Striche machen'],
      document: ['Fotos durchs Fenster', 'Vogelliste mit Strichen'],
      finish: ['Vogel des Winters wählen und ein Bild davon malen'],
    },
    tasks: {
      toddler: ['Futter einfüllen helfen', 'Vögel am Fenster zeigen', 'Groß oder klein?'],
      preschool: ['Vögel zählen', 'Vögel nach Farbe sortieren', 'Vogelstimmen nachmachen'],
      reader: ['Wörter lesen', 'Vogelnamen ins Beobachtungsheft schreiben', 'Striche für jeden Vogel machen'],
      school: ['Eine Strichliste führen und auswerten', 'Drei Vögel mit dem Vogelbuch bestimmen', 'Einen Steckbrief zum Lieblingsvogel schreiben'],
    },
    words: ['VOGEL', 'MEISE', 'NEST', 'KORN', 'AST'],
    materials: ['Futterhaus oder Futtersäule', 'Vogelfutter für Wildvögel', 'Fernglas (wenn vorhanden)', 'Heft und Stift', 'Vogelbuch'],
    presentation: 'Vogelausstellung mit Bildern und Strichliste',
    note: 'Futterstelle sauber halten und kein Brot oder gewürzte Essensreste füttern.',
  },
  {
    id: 'vegetable-bed', title: 'Unser Gemüsebeet', emoji: '🥕', weeks: 8, months: [3, 4, 5],
    summary: 'Ein Beet oder einen Balkonkasten anlegen, säen, gießen, beobachten und ernten.',
    areas: ['nature', 'time', 'math', 'planning'],
    steps: {
      discover: ['Samentüten anschauen: Was wollen wir essen?', 'Im Bibliotheksthema „Woher kommt unser Essen?“ nachlesen'],
      plan: ['Beet oder Kasten aussuchen', 'Einen Pflanzplan malen: Was kommt wohin?', 'Samen und Erde auf die Einkaufsliste setzen'],
      make: ['Erde lockern', 'Säen und beschriften', 'Gießplan aufstellen und jeden Tag schauen'],
      document: ['Jede Woche ein Foto vom Beet', 'Aufschreiben, wann die ersten Blätter kommen'],
      finish: ['Erntefest: das erste eigene Gemüse essen'],
    },
    tasks: {
      toddler: ['Erde schaufeln', 'Gießen', 'Zeigen, wo etwas wächst'],
      preschool: ['Samen zählen', 'Gießkannen zählen', 'Pflanzen malen'],
      reader: ['Wörter lesen', 'Schilder für die Reihen schreiben', 'Die Tage bis zu den ersten Blättchen zählen'],
      school: ['Wachstum mit dem Lineal messen und in eine Tabelle schreiben', 'Gießplan als Tabelle anlegen', 'Ernte wiegen'],
    },
    words: ['ERDE', 'SAMEN', 'BEET', 'SALAT', 'RADIESCHEN'],
    materials: ['Beet oder Balkonkasten', 'Blumenerde', 'Samen (Radieschen, Salat, Erbsen)', 'Kleine Schaufel', 'Gießkanne', 'Holzstäbchen für Schilder'],
    presentation: 'Erntefest mit dem ersten eigenen Gemüse',
  },
  {
    id: 'insect-hotel', title: 'Insektenhotel', emoji: '🐝', weeks: 2, months: [3, 4, 5, 9],
    summary: 'Ein kleines Insektenhotel bauen, aufhängen und beobachten, wer einzieht.',
    areas: ['nature', 'creativity', 'planning'],
    steps: {
      discover: ['Im Garten Insekten suchen: Wo wohnen sie?', 'Ein Buch über Wildbienen anschauen'],
      plan: ['Einen sonnigen, geschützten Platz aussuchen', 'Material sammeln: Dose oder Kasten, Bambus, Schilf, Zapfen'],
      make: ['Röhrchen auf die richtige Länge bringen (Erwachsene)', 'Füllung dicht in die Dose stecken', 'Hotel aufhängen'],
      document: ['Jede Woche nachschauen: Sind Röhrchen verschlossen?', 'Fotos machen, ohne zu stören'],
      finish: ['Den ersten Gast feiern und ein Bild malen'],
    },
    tasks: {
      toddler: ['Zapfen und Stöckchen sammeln', 'Füllung in die Dose stecken'],
      preschool: ['Röhrchen zählen', 'Nach Dicke sortieren', 'Insekten malen'],
      reader: ['Wörter lesen', 'Ein Schild „Hotel“ schreiben', 'Verschlossene Röhrchen zählen und aufschreiben'],
      school: ['Einen Beobachtungsbogen führen', 'Herausfinden, welche Insekten einziehen könnten', 'Einen kurzen Bericht schreiben'],
    },
    words: ['HOTEL', 'BIENE', 'ROHR', 'HOLZ'],
    materials: ['Konservendose ohne scharfe Kanten oder Holzkasten', 'Bambus- oder Schilfröhrchen', 'Zapfen', 'Schnur', 'Säge (nur Erwachsene)'],
    presentation: 'Hoteleröffnung im Garten',
    note: 'Sägen und Schneiden nur durch Erwachsene. Das Hotel nicht öffnen, wenn schon Gäste darin wohnen.',
  },
  {
    id: 'treasure-map', title: 'Schatzsuche mit Karte', emoji: '🗺️', weeks: 1, months: [],
    summary: 'Eine Karte von Garten oder Wohnung zeichnen, einen Schatz verstecken und mit Schritten und Richtungen finden.',
    areas: ['math', 'planning', 'language', 'creativity'],
    steps: {
      discover: ['Echte Karten anschauen: Was sieht man von oben?', 'Das eigene Zimmer von oben malen'],
      plan: ['Gebiet festlegen: Wohnung, Garten oder Spielplatz', 'Schatz aussuchen'],
      make: ['Eine Karte zeichnen mit Zeichen für Baum, Haus, Tor', 'Schatz verstecken und den Weg mit Schritten aufschreiben', 'Die anderen suchen lassen'],
      document: ['Karte aufheben', 'Foto vom gefundenen Schatz'],
      finish: ['Schatz teilen, dann tauschen: Jetzt versteckt jemand anderes'],
    },
    tasks: {
      toddler: ['Mit Mama oder Papa mitsuchen', 'Zeigen: Wo ist der Baum auf der Karte?'],
      preschool: ['Schritte zählen', 'Links und rechts üben', 'Zeichen auf die Karte malen'],
      reader: ['Wörter lesen', 'Hinweise lesen: 5 Schritte zum Baum', 'Ein X für den Schatz einzeichnen'],
      school: ['Eine Wegbeschreibung mit Schritten und Richtungen schreiben', 'Eine Legende für die Karte anlegen', 'Mit dem Kompass Norden finden'],
    },
    words: ['SCHATZ', 'KARTE', 'BAUM', 'TOR', 'LINKS'],
    materials: ['Papier', 'Stifte', 'Ein kleiner Schatz (Obst, Sticker, Stein)', 'Kompass (wenn vorhanden)'],
    presentation: 'Die Kinder verstecken einen Schatz für Mama und Papa',
  },
  {
    id: 'toy-shop', title: 'Kaufladen mit Preisen', emoji: '🛒', weeks: 1, months: [],
    summary: 'Einen Kaufladen einrichten, Preisschilder schreiben und mit Spielgeld oder echten Münzen einkaufen spielen.',
    areas: ['math', 'money', 'language'],
    steps: {
      discover: ['Beim echten Einkauf Preisschilder anschauen', 'Münzen und Scheine sortieren'],
      plan: ['Waren aussuchen: Vorrat, Spielsachen, Obst', 'Preise überlegen: nur ganze Euro oder auch Cent?'],
      make: ['Preisschilder schreiben', 'Laden aufbauen', 'Abwechselnd verkaufen und einkaufen'],
      document: ['Fotos vom Laden', 'Einkaufszettel aufheben'],
      finish: ['Ladenschluss: Kasse zählen'],
    },
    tasks: {
      toddler: ['Waren in den Korb legen', 'Münzen in die Kasse werfen'],
      preschool: ['Münzen bis 5 Euro zählen', 'Gleich viele Münzen wie auf dem Schild hinlegen', 'Waren sortieren'],
      reader: ['Wörter lesen', 'Preisschilder schreiben', 'Einen Einkaufszettel schreiben'],
      school: ['Zusammenrechnen, was der Einkauf kostet', 'Wechselgeld ausrechnen', 'Ein Sonderangebot erfinden'],
    },
    words: ['EURO', 'KASSE', 'MILCH', 'BROT', 'APFEL'],
    materials: ['Vorratsdosen und Spielsachen', 'Papier für Preisschilder', 'Spielgeld oder Münzen', 'Korb oder Tasche'],
    presentation: 'Großer Einkaufstag mit der ganzen Familie',
    note: 'Echte Münzen nur unter Aufsicht: Kleine Kinder können sie verschlucken.',
  },
  {
    id: 'volcano-lab', title: 'Vulkan-Labor', emoji: '🌋', weeks: 1, months: [],
    summary: 'Einen Vulkan aus Sand oder Pappmaschee bauen, ausbrechen lassen und beobachten, wie die „Lava“ fließt.',
    areas: ['nature', 'creativity', 'planning'],
    steps: {
      discover: ['Im Bibliotheksthema „Vulkane“ nachlesen', 'Vermuten: Wohin fließt die Lava?'],
      plan: ['Draußen oder auf einem großen Tablett arbeiten', 'Natron und Essig auf die Einkaufsliste setzen'],
      make: ['Einen Berg um eine kleine Flasche bauen', 'Natron und Spülmittel einfüllen', 'Roten Essig dazugießen und beobachten', 'Mehrmals mit anderen Mengen ausprobieren'],
      document: ['Video oder Fotos vom Ausbruch', 'Malen, wie die Lava geflossen ist'],
      finish: ['Vulkanshow für die Familie'],
    },
    tasks: {
      toddler: ['Sand zum Berg häufen', 'Zuschauen und „Wow“ rufen'],
      preschool: ['Löffel Natron zählen', 'Vergleichen: Mehr Natron, mehr Schaum?'],
      reader: ['Wörter lesen', 'Ein Schild für den Vulkan schreiben'],
      school: ['Mengen aufschreiben und vergleichen', 'Einen kurzen Versuchsbericht schreiben: Vermutung, Versuch, Ergebnis'],
    },
    words: ['LAVA', 'BERG', 'ROT', 'SAND'],
    materials: ['Kleine Flasche', 'Sand oder Pappmaschee', 'Natron', 'Essig', 'Spülmittel', 'Rote Lebensmittelfarbe', 'Tablett'],
    presentation: 'Vulkanshow',
    note: 'Essig brennt in den Augen: Abstand halten, ein Erwachsener gießt. Danach Hände waschen.',
  },
  {
    id: 'growth-chart', title: 'So groß bin ich', emoji: '📐', weeks: 1, months: [],
    summary: 'Eine Messlatte für alle bauen, Körpergrößen, Hände und Füße messen und vergleichen.',
    areas: ['math', 'nature', 'time'],
    steps: {
      discover: ['Im Bibliotheksthema „Mein Körper“ nachlesen', 'Vermuten: Wer hat die größten Füße?'],
      plan: ['Einen Platz an der Wand oder Tür für die Messlatte aussuchen'],
      make: ['Messlatte aus Papier oder Holz anbringen', 'Alle messen und mit Datum eintragen', 'Hände und Füße auf Papier umranden und vergleichen'],
      document: ['Foto der Messlatte', 'Umrisse aufheben'],
      finish: ['Jedes Jahr am Geburtstag wieder messen'],
    },
    tasks: {
      toddler: ['Gerade an die Wand stellen', 'Hand umranden lassen'],
      preschool: ['Größen vergleichen: größer, kleiner, gleich', 'Füße mit Bausteinen messen'],
      reader: ['Wörter lesen', 'Namen an die Messlatte schreiben'],
      school: ['In Zentimetern messen und aufschreiben', 'Ausrechnen, wie viel jemand seit dem letzten Mal gewachsen ist'],
    },
    words: ['HAND', 'FUSS', 'ARM', 'GROSS'],
    materials: ['Lange Papierbahn oder Holzleiste', 'Maßband', 'Stifte', 'Papier für Hand- und Fußumrisse'],
    presentation: 'Messlatte einweihen',
  },
  {
    id: 'letters', title: 'Post für Oma und Opa', emoji: '✉️', weeks: 1, months: [],
    summary: 'Briefe oder Postkarten gestalten, adressieren, frankieren und selbst in den Briefkasten werfen.',
    areas: ['language', 'creativity', 'planning'],
    steps: {
      discover: ['Briefe anschauen: Wo steht die Adresse, wo kommt die Briefmarke hin?'],
      plan: ['Aussuchen, wem wir schreiben', 'Adressen heraussuchen und Briefmarken besorgen'],
      make: ['Bild malen oder Foto aufkleben', 'Einen Satz schreiben oder diktieren', 'Umschlag beschriften und frankieren'],
      document: ['Foto vom Brief vor dem Einwerfen'],
      finish: ['Zum Briefkasten gehen und auf die Antwort warten'],
    },
    tasks: {
      toddler: ['Ein Bild malen', 'Den Brief einwerfen'],
      preschool: ['Den eigenen Namen schreiben oder nachspuren', 'Briefmarke aufkleben'],
      reader: ['Wörter lesen', 'Einen Satz selbst schreiben', 'Die Adresse abschreiben'],
      school: ['Einen kurzen Brief mit Anrede und Gruß schreiben', 'Die Adresse selbst schreiben'],
    },
    words: ['OMA', 'OPA', 'POST', 'BRIEF', 'LIEBE'],
    materials: ['Papier oder Postkarten', 'Umschläge', 'Briefmarken', 'Stifte'],
    presentation: 'Zusammen zum Briefkasten gehen',
  },
  {
    id: 'puppet-theater', title: 'Puppentheater', emoji: '🎭', weeks: 2, months: [],
    summary: 'Figuren basteln, eine kleine Geschichte ausdenken, proben und vorspielen.',
    areas: ['language', 'creativity', 'planning'],
    steps: {
      discover: ['Lieblingsgeschichten sammeln', 'Überlegen: Wer spielt mit, was passiert?'],
      plan: ['Figuren und Bühne planen', 'Einen Termin für die Vorstellung festlegen'],
      make: ['Figuren aus Socken, Papier oder Kochlöffeln basteln', 'Bühne aus einem Karton oder Tisch mit Tuch bauen', 'Geschichte proben'],
      document: ['Fotos von den Figuren', 'Eintrittskarten basteln'],
      finish: ['Vorstellung für Familie oder Großeltern'],
    },
    tasks: {
      toddler: ['Eine Figur bemalen', 'Beim Vorspielen mitklatschen'],
      preschool: ['Eine Figur sprechen lassen', 'Die Geschichte in drei Bildern erzählen'],
      reader: ['Wörter lesen', 'Eintrittskarten schreiben', 'Namen der Figuren schreiben'],
      school: ['Ein kurzes Drehbuch schreiben', 'Rollen verteilen und Proben planen'],
    },
    words: ['KASPER', 'BÜHNE', 'TOR', 'HALLO'],
    materials: ['Alte Socken', 'Kochlöffel', 'Papier und Kleber', 'Karton', 'Tuch'],
    presentation: 'Theatervorstellung',
  },
  {
    id: 'music', title: 'Instrumente aus Alltagsdingen', emoji: '🥁', weeks: 1, months: [],
    summary: 'Rasseln, Trommeln und Gitarren aus Dosen, Kartons und Gummis bauen und ein Familienkonzert geben.',
    areas: ['creativity', 'nature', 'math'],
    steps: {
      discover: ['Geräusche in der Küche suchen: Was klingt hoch, was tief?'],
      plan: ['Instrumente aussuchen und Material sammeln'],
      make: ['Rasseln mit Reis oder Linsen füllen', 'Trommel aus Dose oder Topf', 'Gummigitarre aus Schachtel und Gummis'],
      document: ['Tonaufnahme vom Konzert', 'Fotos der Instrumente'],
      finish: ['Familienkonzert'],
    },
    tasks: {
      toddler: ['Rassel schütteln', 'Laut und leise spielen'],
      preschool: ['Takt klatschen', 'Rasseln vergleichen: Reis oder Linsen?'],
      reader: ['Wörter lesen', 'Ein Programm für das Konzert schreiben'],
      school: ['Herausfinden: Dickes oder dünnes Gummi, welches klingt tiefer?', 'Einen Rhythmus aufschreiben'],
    },
    words: ['TROMMEL', 'LAUT', 'LEISE', 'TON'],
    materials: ['Leere Dosen und Schachteln', 'Reis oder Linsen', 'Gummibänder', 'Klebeband', 'Kochlöffel'],
    presentation: 'Familienkonzert',
    note: 'Rasseln gut verschließen: Reis und Linsen sind für Kleinkinder Kleinteile.',
  },
  {
    id: 'ice-lab', title: 'Eis-Labor im Winter', emoji: '🧊', weeks: 1, months: [12, 1, 2],
    summary: 'Wasser draußen gefrieren lassen, Eis-Laternen bauen und Schmelzen mit Salz und Wärme vergleichen.',
    areas: ['nature', 'time', 'creativity'],
    steps: {
      discover: ['Morgens draußen nachsehen: Ist die Pfütze gefroren?', 'Im Bibliotheksthema „Wetter“ nachlesen'],
      plan: ['Frostnächte im Wetterbericht suchen', 'Formen und Schüsseln bereitstellen'],
      make: ['Wasser mit Blättern und Beeren in Formen gießen und draußen gefrieren lassen', 'Eis-Laterne mit zwei Schüsseln bauen', 'Schmelzwettrennen: mit Salz, ohne Salz, im Warmen'],
      document: ['Fotos der Eisbilder', 'Zeiten beim Schmelzen aufschreiben'],
      finish: ['Eis-Laternen am Abend mit LED-Licht anzünden'],
    },
    tasks: {
      toddler: ['Blätter in die Form legen', 'Eis anfassen: kalt!'],
      preschool: ['Vermuten und vergleichen: Was schmilzt zuerst?', 'Eiswürfel zählen'],
      reader: ['Wörter lesen', 'Ergebnis aufschreiben: schnell oder langsam'],
      school: ['Schmelzzeiten mit der Uhr messen und vergleichen', 'Einen Versuchsbericht schreiben'],
    },
    words: ['EIS', 'KALT', 'SALZ', 'WASSER'],
    materials: ['Schüsseln und Formen', 'Wasser', 'Blätter und Beeren', 'Salz', 'LED-Teelicht'],
    presentation: 'Eis-Laternen-Abend',
    note: 'Nur LED-Teelichter verwenden. Salz nicht in die Augen bringen.',
  },
  {
    id: 'lighthouse', title: 'Leuchtturm mit Licht', emoji: '🗼', weeks: 1, months: [],
    summary: 'Einen Leuchtturm aus Pappe bauen und mit einem Lämpchen und einer Flachbatterie zum Leuchten bringen.',
    areas: ['nature', 'creativity', 'planning'],
    minLevel: 'preschool',
    steps: {
      discover: ['Im Bibliotheksthema „Strom und Licht“ nachlesen', 'Bilder von Leuchttürmen anschauen'],
      plan: ['Lämpchen mit Fassung, Kabel mit Krokodilklemmen und Flachbatterie besorgen'],
      make: ['Turm aus einer Küchenrolle oder Chipsdose bauen und rot-weiß bemalen', 'Stromkreis mit Lämpchen ausprobieren', 'Lämpchen oben einbauen und mit der Batterie verbinden'],
      document: ['Foto vom leuchtenden Turm im Dunkeln'],
      finish: ['Licht aus, Leuchtturm an: kleine Vorführung'],
    },
    tasks: {
      toddler: ['Turm bemalen', 'Licht an und aus beobachten'],
      preschool: ['Kabel mit Hilfe anklemmen', 'Ausprobieren: Wann leuchtet es, wann nicht?'],
      reader: ['Wörter lesen', 'Ein Schild für den Leuchtturm schreiben'],
      school: ['Den Stromkreis selbst aufbauen und aufmalen', 'Erklären, was ein Schalter macht'],
    },
    words: ['LICHT', 'TURM', 'LAMPE', 'MEER'],
    materials: ['Küchenrolle oder Chipsdose', 'Farbe', 'Lämpchen mit Fassung für 4,5 Volt', '2 Kabel mit Krokodilklemmen', 'Flachbatterie 4,5 Volt'],
    presentation: 'Leuchtturm-Vorführung im Dunkeln',
    note: 'Nur mit einer Flachbatterie 4,5 Volt arbeiten, niemals mit der Steckdose. Die Batteriestreifen nie direkt verbinden.',
  },
  {
    id: 'nature-table', title: 'Unser Jahreszeitentisch', emoji: '🍂', weeks: 4, months: [],
    summary: 'Einen Platz für Naturschätze der Jahreszeit einrichten und ihn jeden Monat neu gestalten.',
    areas: ['nature', 'time', 'language', 'creativity'],
    steps: {
      discover: ['Beim Spaziergang Schätze sammeln: Blätter, Zapfen, Steine, Blüten'],
      plan: ['Einen Platz aussuchen: Fensterbank, Brett oder Tablett'],
      make: ['Schätze sortieren und schön hinlegen', 'Kleine Schilder dazulegen', 'Jeden Monat austauschen'],
      document: ['Jeden Monat ein Foto vom Tisch'],
      finish: ['Nach einem Jahr alle Fotos nebeneinander anschauen: Wie hat sich die Natur verändert?'],
    },
    tasks: {
      toddler: ['Schätze sammeln', 'Auf den Tisch legen'],
      preschool: ['Nach Farbe oder Größe sortieren', 'Zählen, wie viele Zapfen es sind'],
      reader: ['Wörter lesen', 'Namensschilder schreiben'],
      school: ['Fundstücke mit einem Bestimmungsbuch benennen', 'Ein Jahreszeiten-Heft führen'],
    },
    words: ['LAUB', 'ZAPFEN', 'STEIN', 'MOOS', 'BLATT'],
    materials: ['Tablett oder Brett', 'Körbchen zum Sammeln', 'Kleine Kärtchen'],
    presentation: 'Jahresrückblick mit den Fotos',
  },
  {
    id: 'chestnuts', title: 'Kastanienwerkstatt', emoji: '🌰', weeks: 1, months: [9, 10, 11],
    summary: 'Kastanien sammeln und daraus Männchen, Tiere und Bilder machen.',
    areas: ['nature', 'creativity', 'math'],
    steps: {
      discover: ['Kastanien, Eicheln und Zapfen sammeln', 'Anschauen: Wie sieht die stachelige Hülle aus?'],
      plan: ['Überlegen, welche Figuren wir bauen: Männchen, Igel, Spinne, Schlange'],
      make: ['Löcher vorbohren (nur Erwachsene)', 'Figuren mit Zahnstochern zusammenstecken', 'Kastanien-Rollbild malen', 'Kastanien zählen und sortieren'],
      document: ['Foto von der Kastanienfamilie'],
      finish: ['Ausstellung auf dem Jahreszeitentisch'],
    },
    tasks: {
      toddler: ['Kastanien in einen Korb sammeln', 'Kastanien in Farbe in einem Karton hin und her rollen'],
      preschool: ['Ein Kastanientier zusammenstecken', 'Zehn Kastanien abzählen', 'Nach Größe sortieren: klein, mittel, groß'],
      reader: ['Eine Kastanienfamilie bauen und jedem einen Namen geben', 'Namensschilder schreiben', 'Wörter lesen'],
      school: ['Kastanien wiegen und vergleichen', 'Eine Bauanleitung für die Geschwister malen und schreiben'],
    },
    words: ['NUSS', 'IGEL', 'ZAPFEN', 'BAUM'],
    materials: ['Kastanien', 'Zahnstocher oder Streichhölzer ohne Kopf', 'Handbohrer oder Nagel (nur Erwachsene)', 'Wackelaugen und Kleber', 'Karton und Fingerfarbe'],
    alone: ['Sammeln und sortieren', 'Vorgebohrte Kastanien zusammenstecken', 'Rollbild im Karton'],
    together: ['Löcher bohren', 'Spaziergang zum Kastanienbaum'],
    note: 'Löcher bohren nur Erwachsene. Kastanien sind nicht zum Essen: Bei Talisa aufpassen, dass nichts in den Mund kommt, Zahnstocher nur für die Großen.',
  },
  {
    id: 'cookie-sale', title: 'Keksbasar', emoji: '🍪', weeks: 1, months: [], money: true, stand: true,
    summary: 'Kekse backen, einen Verkaufsstand aufbauen, Preise festlegen und am Ende die Kasse zählen.',
    areas: ['math', 'money', 'planning', 'language'],
    steps: {
      discover: ['Lieblingskekse aussuchen', 'Überlegen: Wer könnte unsere Kekse kaufen? Nachbarn, Familie, Kita-Fest?'],
      plan: ['Mit der Gemeinde oder dem Fest klären, was erlaubt ist', 'Zutaten aufschreiben und Kosten ausrechnen'],
      make: ['Teig machen, ausstechen, backen', 'Je 3 Kekse in ein Tütchen packen', 'Zutatenliste für das Schild schreiben'],
      document: ['Fotos vom Backen und vom Stand'],
      finish: ['Entscheiden, wofür das Geld ist (z. B. Reisekasse oder Spende)'],
    },
    tasks: {
      toddler: ['Teig ausstechen', 'Tütchen an die Kunden geben und Danke sagen'],
      preschool: ['Je 3 Kekse in jedes Tütchen zählen', 'Münzen passend zum Preisschild hinlegen', 'Tütchen zählen'],
      reader: ['Preisschilder schreiben', 'Das Verkaufsschild schreiben', 'Striche auf dem Kassenzettel machen', 'Wörter lesen'],
      school: ['Kosten pro Tütchen ausrechnen', 'Wechselgeld herausgeben', 'Einnahmen minus Kosten rechnen'],
    },
    words: ['KEKS', 'EURO', 'TEIG', 'DANKE'],
    materials: ['Mehl', 'Butter', 'Zucker', 'Eier', 'Ausstechformen', 'Kleine Tüten und Band'],
    alone: ['Kekse in Tütchen zählen', 'Schild und Preisschilder malen', 'Kasse basteln'],
    together: ['Backen am Ofen', 'Verkaufen am Stand', 'Kasse am Ende zählen'],
    note: FOOD_SALE_NOTE,
  },
  {
    id: 'salt-dough', title: 'Salzteig-Werkstatt', emoji: '🧂', weeks: 1, months: [],
    summary: 'Salzteig kneten, Anhänger und Handabdrücke formen, trocknen lassen und bemalen.',
    areas: ['creativity', 'math'],
    steps: {
      discover: ['Fühlen: Mehl, Salz, Wasser. Was passiert beim Mischen?'],
      plan: ['Überlegen, was entstehen soll: Handabdruck, Anhänger, Figuren'],
      make: ['Teig mischen: 2 Tassen Mehl, 1 Tasse Salz, knapp 1 Tasse Wasser', 'Formen, ausstechen, Loch für das Band', 'Im Ofen trocknen (Erwachsene)', 'Bemalen'],
      document: ['Foto von allen Werken'],
      finish: ['Verschenken, z. B. an Oma und Opa'],
    },
    tasks: {
      toddler: ['Kneten und plattdrücken', 'Handabdruck in den Teig drücken'],
      preschool: ['Tassen abzählen beim Mischen', 'Formen ausstechen', 'Kugeln rollen: groß und klein'],
      reader: ['Den eigenen Namen in den Teig ritzen', 'Geschenkanhänger schreiben', 'Wörter lesen'],
      school: ['Rezept für die doppelte Menge ausrechnen', 'Trocknungszeit messen und aufschreiben'],
    },
    words: ['SALZ', 'MEHL', 'HAND', 'HERZ'],
    materials: ['Mehl', 'Salz', 'Wasser', 'Ausstechformen', 'Strohhalm für Löcher', 'Wasserfarben', 'Band'],
    alone: ['Kneten, formen, ausstechen', 'Bemalen, wenn es trocken ist'],
    together: ['Teig abmessen', 'Ofen'],
    note: 'Salzteig ist nicht zum Essen. Bei Talisa dabeibleiben.',
  },
  {
    id: 'cress-heads', title: 'Kresse-Köpfe', emoji: '🌱', weeks: 1, months: [],
    summary: 'Gesichter auf Eierschalen oder Becher malen, Kresse säen und nach ein paar Tagen „Haare schneiden“.',
    areas: ['nature', 'time', 'creativity'],
    steps: {
      discover: ['Kressesamen anschauen: winzig!'],
      plan: ['Für jeden einen Becher oder eine Eierschale aussuchen'],
      make: ['Gesicht aufmalen', 'Watte rein, nass machen, Samen streuen', 'Jeden Tag gießen und schauen'],
      document: ['Jeden Tag ein Foto: Wie lang sind die Haare?'],
      finish: ['Haare schneiden und auf ein Butterbrot essen'],
    },
    tasks: {
      toddler: ['Samen streuen', 'Mit der Sprühflasche gießen'],
      preschool: ['Tage zählen, bis es grün wird', 'Ein Gesicht aufmalen'],
      reader: ['Ein Namensschild schreiben', 'Wachstum jeden Tag ankreuzen', 'Wörter lesen'],
      school: ['Höhe jeden Tag messen und in eine Tabelle schreiben', 'Ausprobieren: ein Becher im Dunkeln, einer am Fenster'],
    },
    words: ['KRESSE', 'HAARE', 'WASSER', 'SAMEN'],
    materials: ['Kressesamen', 'Eierschalen oder Joghurtbecher', 'Watte', 'Sprühflasche', 'Stifte'],
    alone: ['Jeden Tag gießen und nachschauen', 'Gesicht malen'],
    together: ['Säen', 'Haare schneiden mit der Schere'],
  },
  {
    id: 'cardboard-city', title: 'Kartonstadt', emoji: '📦', weeks: 2, months: [],
    summary: 'Aus großen und kleinen Kartons eine Burg, Höhle oder Garage bauen und bemalen.',
    areas: ['creativity', 'planning', 'math'],
    steps: {
      discover: ['Kartons sammeln: groß, klein, Röhren', 'Überlegen: Burg, Höhle, Garage oder ganze Stadt?'],
      plan: ['Einen Plan malen', 'Platz aussuchen, wo die Stadt stehen bleiben darf'],
      make: ['Fenster und Türen aufschneiden (Erwachsene)', 'Zusammenkleben', 'Bemalen und bekleben', 'Darin spielen'],
      document: ['Fotos von innen und außen'],
      finish: ['Führung durch die Kartonstadt für Oma, Opa oder Freunde'],
    },
    tasks: {
      toddler: ['Kartons stapeln', 'Mit dicken Stiften bemalen', 'Durch den Tunnel krabbeln'],
      preschool: ['Kartons nach Größe sortieren', 'Fenster zählen', 'Ein Schild für die Tür malen'],
      reader: ['Schilder schreiben: BURG, TOR, AUTO', 'Wörter lesen'],
      school: ['Einen Plan mit Maßen zeichnen', 'Eine Brücke bauen, die ein Kuscheltier trägt'],
    },
    words: ['BURG', 'TOR', 'TURM', 'AUTO'],
    materials: ['Große Kartons', 'Klopapierrollen', 'Klebeband', 'Cutter (nur Erwachsene)', 'Farben oder Stifte'],
    alone: ['Bemalen und bekleben', 'Darin spielen und umbauen'],
    together: ['Aufschneiden mit dem Cutter', 'Große Teile zusammenkleben'],
    presentation: 'Führung durch die Kartonstadt',
  },
  {
    id: 'bubbles', title: 'Seifenblasen-Labor', emoji: '🫧', weeks: 1, months: [4, 5, 6, 7, 8, 9],
    summary: 'Seifenblasenlauge selbst rühren, Pustestäbe biegen und ausprobieren, welche Blasen am größten werden.',
    areas: ['nature', 'math'],
    steps: {
      discover: ['Seifenblasen anschauen: Welche Farben siehst du?'],
      plan: ['Lauge rühren: Wasser, Spülmittel, etwas Zucker, über Nacht stehen lassen'],
      make: ['Pustestäbe aus Draht oder Strohhalmen biegen', 'Ausprobieren: rund, eckig, Herz', 'Riesenblasen mit zwei Stäben und Schnur'],
      document: ['Fotos und Videos von den größten Blasen'],
      finish: ['Seifenblasen-Fest im Garten'],
    },
    tasks: {
      toddler: ['Blasen fangen und platzen lassen', 'Pusten üben'],
      preschool: ['Blasen zählen, bevor sie platzen', 'Formen ausprobieren: Ist die Blase dann eckig?'],
      reader: ['Rezept lesen', 'Ein Schild „Labor“ schreiben', 'Wörter lesen'],
      school: ['Rezepte vergleichen und aufschreiben, welches am besten ist', 'Größe der Blasen schätzen'],
    },
    words: ['BLASE', 'WIND', 'SEIFE', 'RUND'],
    materials: ['Wasser', 'Spülmittel', 'Zucker oder Glycerin', 'Schüssel', 'Draht oder Strohhalme', 'Zwei Stöcke und Schnur'],
    alone: ['Pusten und Blasen fangen', 'Eigene Formen biegen (weicher Draht)'],
    together: ['Lauge rühren', 'Riesenblasen'],
    note: 'Lauge nicht trinken, nicht in die Augen. Für Talisa am besten eine auslaufsichere Seifenblasendose.',
  },
  {
    id: 'shadow-theater', title: 'Schattentheater', emoji: '🔦', weeks: 1, months: [10, 11, 12, 1, 2, 3],
    summary: 'Figuren aus Pappe ausschneiden, mit der Taschenlampe Schatten machen und eine kleine Geschichte spielen.',
    areas: ['creativity', 'language'],
    steps: {
      discover: ['Mit der Taschenlampe Schatten mit den Händen machen: Hase, Vogel, Hund'],
      plan: ['Eine kurze Geschichte ausdenken', 'Leintuch oder weiße Wand aussuchen'],
      make: ['Figuren aufmalen und ausschneiden', 'An Holzstäbchen kleben', 'Proben'],
      document: ['Video von der Vorstellung'],
      finish: ['Vorstellung für die Familie im dunklen Zimmer'],
    },
    tasks: {
      toddler: ['Die Taschenlampe halten', 'Hand-Schatten machen'],
      preschool: ['Eine Figur ausschneiden', 'Erzählen, was die Figur macht'],
      reader: ['Eintrittskarten schreiben', 'Wörter lesen'],
      school: ['Die Geschichte aufschreiben', 'Ausprobieren: Wann wird der Schatten groß, wann klein?'],
    },
    words: ['LICHT', 'HASE', 'NACHT', 'MOND'],
    materials: ['Taschenlampe', 'Pappe', 'Schere', 'Holzstäbchen', 'Leintuch'],
    alone: ['Hand-Schatten', 'Figuren malen', 'Mit den Figuren spielen'],
    together: ['Ausschneiden schwieriger Formen', 'Die Vorstellung'],
    presentation: 'Schattentheater-Vorstellung',
  },
  {
    id: 'gnome-house', title: 'Wichtelhaus im Wald', emoji: '🍄', weeks: 1, months: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    summary: 'Im Wald oder Garten aus Stöcken, Moos, Rinde und Steinen ein kleines Haus für Wichtel bauen.',
    areas: ['nature', 'creativity'],
    steps: {
      discover: ['Im Wald einen guten Platz suchen: an einer Baumwurzel'],
      plan: ['Überlegen: Was braucht ein Wichtel? Bett, Tür, Weg'],
      make: ['Material sammeln, nur was am Boden liegt', 'Haus bauen', 'Einen Weg aus Steinen legen'],
      document: ['Foto vom Wichtelhaus'],
      finish: ['Nach einer Woche nachschauen: Steht es noch?'],
    },
    tasks: {
      toddler: ['Moos und Steine sammeln', 'Einen Stein auf den Weg legen'],
      preschool: ['Stöcke nach Länge sortieren', 'Die Tür bauen'],
      reader: ['Ein Schild für den Wichtel schreiben', 'Wörter lesen'],
      school: ['Einen Lageplan malen, damit wir es wiederfinden'],
    },
    words: ['MOOS', 'HAUS', 'WALD', 'STEIN'],
    materials: ['Korb zum Sammeln', 'Gummistiefel'],
    alone: ['Sammeln und bauen', 'Eigene Ideen für das Haus'],
    together: ['Weg in den Wald', 'Nachschauen nach einer Woche'],
    note: 'Nur nehmen, was am Boden liegt. Keine Pilze anfassen oder essen.',
  },
  {
    id: 'stone-monsters', title: 'Steinmonster', emoji: '🪨', weeks: 1, months: [],
    summary: 'Glatte Steine sammeln, waschen und als Monster, Marienkäfer oder Gesichter bemalen.',
    areas: ['creativity', 'nature', 'math'],
    steps: {
      discover: ['Steine sammeln: glatt, rund, flach'],
      plan: ['Überlegen: Monster, Tiere oder ein Steine-Memory?'],
      make: ['Steine waschen und trocknen', 'Bemalen', 'Mit Klarlack schützen (Erwachsene)'],
      document: ['Foto von allen Steinmonstern'],
      finish: ['Eine Steinschlange im Garten oder ein Steine-Memory spielen'],
    },
    tasks: {
      toddler: ['Steine in den Eimer sammeln', 'Mit dem Pinsel Farbe auftupfen'],
      preschool: ['Steine nach Größe in eine Reihe legen', 'Punkte auf den Marienkäfer malen und zählen'],
      reader: ['Buchstaben auf Steine malen und Wörter legen', 'Wörter lesen'],
      school: ['Ein Steine-Memory mit Paaren malen', 'Steine wiegen und ordnen'],
    },
    words: ['STEIN', 'MONSTER', 'ROT', 'AUGE'],
    materials: ['Glatte Steine', 'Acrylfarben oder Steinmalstifte', 'Pinsel', 'Klarlack (nur Erwachsene)'],
    alone: ['Sammeln, waschen, bemalen', 'Steinschlange legen'],
    together: ['Lackieren'],
  },
  {
    id: 'marble-run', title: 'Kugelbahn an der Wand', emoji: '🎢', weeks: 1, months: [],
    summary: 'Klopapierrollen an die Wand oder Tür kleben und eine Bahn bauen, durch die eine Kugel rollt.',
    areas: ['math', 'planning', 'creativity'],
    steps: {
      discover: ['Ausprobieren: Wie schnell rollt eine Kugel bergab?'],
      plan: ['Rollen sammeln', 'Eine Wand oder Tür aussuchen, die Klebeband verträgt'],
      make: ['Rollen halbieren und an die Wand kleben', 'Testen und umbauen', 'Einen Becher als Ziel unten hinstellen'],
      document: ['Video von der längsten Fahrt'],
      finish: ['Wettrennen: Welche Kugel ist am schnellsten?'],
    },
    tasks: {
      toddler: ['Die Kugel oben reinwerfen', 'Rufen, wenn sie unten ankommt'],
      preschool: ['Rollen zählen', 'Ausprobieren: Wo fällt die Kugel raus? Rolle versetzen'],
      reader: ['START und ZIEL auf Schilder schreiben', 'Wörter lesen'],
      school: ['Zeit stoppen und vergleichen', 'Die Bahn so bauen, dass sie dreimal die Richtung wechselt'],
    },
    words: ['START', 'ZIEL', 'BALL', 'ROLLE'],
    materials: ['Klopapier- und Küchenrollen', 'Malerkrepp', 'Tischtennisbälle', 'Becher'],
    alone: ['Kugeln laufen lassen', 'Rollen umkleben und ausprobieren'],
    together: ['Rollen aufschneiden', 'Hoch oben an der Wand kleben'],
    note: 'Für Talisa keine Murmeln: Verschluckungsgefahr. Tischtennisbälle nehmen.',
  },
  {
    id: 'photo-safari', title: 'Fotosafari', emoji: '📸', weeks: 1, months: [],
    summary: 'Mit dem iPad oder einer Kinderkamera auf Suche gehen: fünf Dinge in einer Farbe, Formen oder Tiere.',
    areas: ['nature', 'language', 'math'],
    steps: {
      discover: ['Eine Aufgabe ziehen: Farbe, Form, Buchstabe oder Tier'],
      plan: ['Wohin geht die Safari? Garten, Spielplatz, Wald'],
      make: ['Fotos machen', 'Zu Hause die besten aussuchen'],
      document: ['Ein Fotobuch oder eine Collage machen'],
      finish: ['Die Fotos der Familie zeigen und erzählen'],
    },
    tasks: {
      toddler: ['Etwas Rotes zeigen, Mama macht das Foto', 'Auf den Auslöser drücken'],
      preschool: ['Fünf Dinge in einer Farbe finden', 'Runde und eckige Dinge fotografieren'],
      reader: ['Dinge mit dem Anfangsbuchstaben des eigenen Namens finden', 'Wörter lesen'],
      school: ['Zu jedem Foto einen Satz schreiben', 'Eine Fotosafari für die Geschwister ausdenken'],
    },
    words: ['ROT', 'BLAU', 'RUND', 'FOTO'],
    materials: ['iPad oder Kinderkamera', 'Liste mit Aufgaben'],
    alone: ['Fotos machen im Garten', 'Die besten Fotos aussuchen'],
    together: ['Safari auf dem Spielplatz oder im Wald', 'Fotobuch machen'],
  },
  {
    id: 'deposit-bottles', title: 'Pfandsammler', emoji: '♻️', weeks: 2, months: [], money: true,
    summary: 'Pfandflaschen sammeln, zählen, selbst in den Automaten stecken und den Bon in Geld für die Reisekasse tauschen.',
    areas: ['money', 'math', 'nature'],
    steps: {
      discover: ['Das Pfandzeichen auf Flaschen und Dosen suchen', 'Überlegen: Wofür sparen wir? Ein Bild vom Ziel aufhängen'],
      plan: ['Eine Sammelkiste aufstellen', 'Fragen, ob Oma, Opa oder Nachbarn ihre Flaschen spenden'],
      make: ['Flaschen sammeln und sortieren: Glas, Plastik, Dose', 'Zählen, wie viele es sind', 'Zum Automaten bringen und selbst einwerfen', 'Bon an der Kasse in Geld tauschen'],
      document: ['Den Betrag eintragen und das Sparziel ausmalen'],
      finish: ['Geld in die Reisekasse legen: Wie viel fehlt noch?'],
    },
    tasks: {
      toddler: ['Flaschen in die Kiste stellen', 'Eine Flasche in den Automaten schieben'],
      preschool: ['Flaschen zählen', 'Das Pfandzeichen finden', 'Nach Art sortieren'],
      reader: ['Den Betrag auf dem Bon lesen', 'Die Sammelkiste beschriften', 'Wörter lesen'],
      school: ['Ausrechnen: 25 ct pro Flasche, wie viel bekommen wir?', 'Ausrechnen, wie viele Flaschen bis zum Ziel fehlen'],
    },
    words: ['PFAND', 'EURO', 'DOSE', 'GLAS'],
    materials: ['Sammelkiste', 'Tasche oder Bollerwagen', 'Bild vom Sparziel'],
    alone: ['Flaschen sammeln, sortieren und zählen', 'Einwerfen am Automaten'],
    together: ['Fahrt zum Supermarkt', 'Bon an der Kasse einlösen'],
    note: 'Nur Flaschen von zu Hause oder von Bekannten, nicht aus Mülleimern. Glas tragen die Großen.',
  },
  {
    id: 'extra-jobs', title: 'Sonderjob-Woche', emoji: '🧽', weeks: 1, months: [], money: true,
    summary: 'Extra-Aufgaben, die über das normale Helfen hinausgehen, mit vorher vereinbartem Lohn. So lernen die Kinder: Arbeit bringt Geld.',
    areas: ['money', 'planning', 'math'],
    steps: {
      discover: ['Reden: Was ist normales Helfen (ohne Geld) und was ist ein Sonderjob?'],
      plan: ['Eine Jobtafel malen: Job, Bild, Lohn', 'Lohn vorher ausmachen, z. B. 50 ct oder 1 €', 'Sparziel aussuchen'],
      make: ['Jobs erledigen: Auto waschen, Laub rechen, Unkraut zupfen, Fahrräder putzen', 'Nach jedem Job: Lohn auszahlen und Strich auf der Tafel'],
      document: ['Verdientes Geld eintragen'],
      finish: ['Zählen und entscheiden: Ausgeben, Sparen oder in die Reisekasse?'],
    },
    tasks: {
      toddler: ['Mit dem Schwamm das Auto mitwaschen', 'Blätter in den Eimer sammeln'],
      preschool: ['Laub in den Sack füllen', 'Münzen vom Lohn zählen', 'Striche auf der Jobtafel zählen'],
      reader: ['Die Jobtafel beschriften', 'Wörter lesen'],
      school: ['Ausrechnen, wie viele Jobs bis zum Sparziel fehlen', 'Einen eigenen Job vorschlagen und einen Preis verhandeln'],
    },
    words: ['JOB', 'LOHN', 'AUTO', 'LAUB'],
    materials: ['Jobtafel (Pappe)', 'Eimer und Schwämme', 'Kinderrechen', 'Handschuhe'],
    alone: ['Kleine Jobs wie Fahrräder putzen', 'Striche auf der Jobtafel machen'],
    together: ['Auto waschen', 'Lohn auszahlen und zählen'],
    note: 'Normales Helfen im Haushalt bleibt ohne Geld. Bezahlt werden nur Extra-Jobs, die ihr vorher vereinbart. Kein Kind muss mitmachen.',
  },
  {
    id: 'seedling-sale', title: 'Pflanzenmarkt', emoji: '🪴', weeks: 6, months: [2, 3, 4, 5], money: true, stand: true,
    summary: 'Tomaten, Kräuter oder Sonnenblumen aus Samen ziehen, pflegen und als Pflänzchen verkaufen.',
    areas: ['nature', 'money', 'time', 'math'],
    steps: {
      discover: ['Samen anschauen: Welche sind groß, welche winzig?'],
      plan: ['Aussuchen, was wir ziehen', 'Kosten für Erde, Töpfe und Samen aufschreiben'],
      make: ['Säen und beschriften', 'Jeden Tag gießen', 'Umtopfen, wenn sie größer sind'],
      document: ['Jede Woche ein Foto: Wie groß sind sie?'],
      finish: ['Ein Pflänzchen für uns behalten und selbst ernten'],
    },
    tasks: {
      toddler: ['Erde in Töpfe füllen', 'Gießen mit der kleinen Kanne'],
      preschool: ['Samen in jedes Loch zählen', 'Töpfe zählen'],
      reader: ['Pflanzenschilder schreiben', 'Wörter lesen'],
      school: ['Wachstum messen und eintragen', 'Ausrechnen: Kosten pro Topf und Preis'],
    },
    words: ['SAMEN', 'TOPF', 'ERDE', 'TOMATE'],
    materials: ['Samen', 'Anzuchterde', 'Kleine Töpfe oder Eierkartons', 'Holzstäbchen für Schilder', 'Gießkanne'],
    alone: ['Gießen und beobachten', 'Schilder malen'],
    together: ['Säen und umtopfen', 'Verkaufen'],
    note: SALE_NOTE,
  },
  {
    id: 'craft-market', title: 'Bastelbasar', emoji: '🎨', weeks: 2, months: [], money: true, stand: true,
    summary: 'Selbstgebasteltes (Kastanienfiguren, Steinmonster, Salzteig-Anhänger, Karten) auf einem Basar oder vor dem Haus verkaufen.',
    areas: ['creativity', 'money', 'math', 'planning'],
    steps: {
      discover: ['Aussuchen, was wir gut basteln können und was anderen gefallen könnte'],
      plan: ['Einen Basar finden: Kita, Schule, Weihnachtsmarkt oder vor dem Haus', 'Material und Kosten aufschreiben'],
      make: ['Basteln: jedes Kind macht seine Lieblingssachen', 'Hübsch verpacken'],
      document: ['Fotos von allen Sachen und vom Stand'],
      finish: ['Entscheiden, wofür das Geld ist'],
    },
    tasks: {
      toddler: ['Steine bemalen oder Sticker kleben', 'Sachen auf den Tisch legen'],
      preschool: ['Sachen zählen und in Reihen legen', 'Münzen passend zum Preis hinlegen'],
      reader: ['Preisschilder schreiben', 'Wörter lesen'],
      school: ['Ausrechnen, was ein Stück kostet und was übrig bleibt', 'Wechselgeld herausgeben'],
    },
    words: ['BASAR', 'EURO', 'KARTE', 'STEIN'],
    materials: ['Bastelmaterial je nach Idee', 'Tütchen oder Kartons zum Verpacken'],
    alone: ['Basteln', 'Preisschilder malen'],
    together: ['Basar aussuchen und anmelden', 'Verkaufen'],
    note: SALE_NOTE,
  },
];

export const PROJECT_IDEA_BY_ID = new Map(PROJECT_IDEAS.map((p) => [p.id, p]));

/** Für eigene Projekte: leere Grundstruktur mit den fünf Schritten. */
export const OWN_PROJECT_STEPS: Record<ProjectPhase, string[]> = {
  discover: ['Fragen sammeln: Was wollen wir herausfinden?'],
  plan: ['Material und Termine planen'],
  make: [],
  document: ['Fotos machen und aufschreiben, was wir herausgefunden haben'],
  finish: ['Der Familie zeigen, was entstanden ist'],
};

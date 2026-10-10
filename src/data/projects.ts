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
  /** Ab welchem Niveau sinnvoll, z. B. Referat erst für Schulkinder. */
  minLevel?: ProjectLevel;
}

const SALE_NOTE = 'Verkauf nur gelegentlich, beaufsichtigt und auf eigenem Grundstück. Vorher bei der Gemeinde klären, was erlaubt ist; '
  + 'bei Lebensmitteln auch die Lebensmittelüberwachung fragen. Die Kinder verkaufen nie allein an Fremde.';

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
    id: 'farm-shop', title: 'Obsternte und Hoflädchen', emoji: '🧺', weeks: 3, months: [8, 9, 10], money: true,
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
    id: 'lemonade', title: 'Limonadenprojekt', emoji: '🍋', weeks: 1, months: [5, 6, 7, 8], money: true,
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
    id: 'flea-market', title: 'Flohmarkt', emoji: '🧸', weeks: 2, months: [3, 4, 5, 6, 7, 8, 9, 10], money: true,
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

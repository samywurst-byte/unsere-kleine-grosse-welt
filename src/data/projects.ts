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

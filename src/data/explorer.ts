/**
 * Begleitmaterial der Entdeckersonntage aus dem Familienhandbuch 2026–2033 (Stand August 2026):
 * Regeln, Wissenswelten, Entdeckerzentrale, Bücher, Ausstattung, Ausflugsorte und Mama-Spickzettel.
 */

export const EXPLORER_RULES = [
  'Kein Abfragen. Fragen dürfen entstehen, müssen aber nicht beantwortet werden.',
  'Pro Sonntag reichen drei Kernideen. Alles Weitere ist Bonus.',
  'Jedes Kind darf auf seinem Niveau mitmachen. Ein gemeinsames Erlebnis, drei unterschiedliche Lerntiefen.',
  'Immer ein echtes Objekt, Modell, Experiment oder Erlebnis einbauen.',
  'Geografie und Zeitlinie laufen als roter Faden bei fast jedem Thema mit.',
  'Das Entdeckerbuch dokumentiert, statt zu bewerten.',
];

export const EXPLORER_RHYTHM = [
  '1. oder 2. Sonntag: Zuhause-Erlebnis, meistens 60 bis 120 Minuten.',
  '3. oder 4. Sonntag: passender Ausflug, möglichst drinnen und wintertauglich.',
  'Zwischen den Sonntagen: kein Pflichtprogramm. Bücher und Material bleiben sichtbar erreichbar.',
  'Am Ende genau eine Erinnerungsfrage: „Was möchtest du dir von heute merken?“',
];

export const KNOWLEDGE_WORLDS = [
  { title: 'Erde & Geografie', emoji: '🌍', covers: 'Kontinente, Deutschland, Heimat, Wetter, Klima, Wasser, Geologie', goal: 'räumliche Orientierung und Zusammenhänge' },
  { title: 'Leben & Natur', emoji: '🌿', covers: 'Dinosaurier, Evolution, Tiere, Pflanzen, Ökosysteme', goal: 'Leben als vernetztes System verstehen' },
  { title: 'Weltall', emoji: '🪐', covers: 'Sonne, Mond, Planeten, Sterne, Raumfahrt', goal: 'unseren Platz im Universum einordnen' },
  { title: 'Forschen & Technik', emoji: '🔬', covers: 'Physik, Chemie, Energie, Maschinen, Computer', goal: 'Ursache und Wirkung untersuchen' },
  { title: 'Mensch', emoji: '🫀', covers: 'Körper, Sinne, Gehirn, Gesundheit, Gesellschaft', goal: 'den eigenen Körper und menschliches Zusammenleben verstehen' },
  { title: 'Geschichte & Heimat', emoji: '🏰', covers: 'Steinzeit, Römer, Mittelalter, Neuzeit, Demokratie', goal: 'Zeitvorstellung und historische Entwicklung' },
];

/** Die Entdeckerzentrale: ein ruhiges Regal, das über Jahre mitwächst. */
export const SHELF = [
  'Breite ideal 120 bis 160 cm, Höhe etwa 100 bis 140 cm, damit ein Teil selbst erreichbar bleibt.',
  'Oben: echter 30-cm-Globus, aktuelles Fundstück, kleine Entdeckerkiste des Monats.',
  'Fach 1: Welt & Geografie: Atlanten, Karten, Länderbücher.',
  'Fach 2: Natur & Tiere: Naturführer, Tierbücher, Becherlupe, Fundbox.',
  'Fach 3: Weltall & Urzeit: Weltraum, Dinos, Fossilien.',
  'Fach 4: Mensch & Körper: Anatomie, Sinne, Gesundheit.',
  'Fach 5: Geschichte & Heimat: Steinzeit bis Gegenwart.',
  'Fach 6: Technik & Forschen: Experimentebücher, Bau- und Forscherkiste.',
  'Unterste Ebene: drei beschriftete Boxen LABOR, BAUEN, FUNDSTÜCKE.',
];

export const GLOBE_TIP = 'Als Hauptglobus einen klassischen, deutsch beschrifteten Leuchtglobus mit etwa 30 cm Durchmesser, mit Ländergrenzen, Hauptstädten, Meeren und Landschaften. Ein tiptoi-Globus kann zusätzlich Spaß machen, ersetzt den echten Globus aber nicht.';

export const LASTING_PROJECTS = [
  { title: 'Weltkarte', text: 'Länder und Orte markieren, die in Büchern, Reisen oder Ausflügen vorkommen.' },
  { title: 'Deutschland- und BW-Karte', text: 'Heimat vom eigenen Ort aus aufbauen.' },
  { title: 'Zeitlinie', text: 'Erde → Urzeit → Steinzeit → Römer → Mittelalter → Neuzeit → heute.' },
  { title: 'Frageglas „Das weiß ich noch nicht“', text: 'Spontane Kinderfragen sammeln und gelegentlich gemeinsam erforschen.' },
];

/** Acht große Epochenkarten für die Zeitlinie an der Wand. Nicht maßstabsgerecht, wichtig ist die Reihenfolge. */
export const WALL_TIMELINE = [
  'Entstehung der Erde', 'erste Lebewesen', 'Dinosaurier', 'erste Menschen / Steinzeit', 'Römer', 'Mittelalter', 'Neuzeit / Industrialisierung', 'heute',
];

export interface ShelfBook { when: string; title: string; area: string; why: string }

export const BOOKS: ShelfBook[] = [
  { when: 'Jetzt', title: 'Mein erster Grundschul-Atlas (Melinda Ronto, arsEdition)', area: 'Geografie', why: 'bildhafter Einstieg, gut zum gemeinsamen Blättern' },
  { when: 'Jetzt', title: 'Diercke Grundschulatlas Baden-Württemberg, aktuelle Ausgabe', area: 'Geografie', why: 'echter Schulatlas, langfristig wertvoll (ISBN 9783141005660)' },
  { when: 'Jetzt', title: 'Mein erstes Grundschul-Lexikon Natur & Technik (arsEdition)', area: 'Grundwissen', why: 'breites Nachschlagewerk zu Erde, Wetter, Natur, Technik und Sinnen' },
  { when: 'Jetzt', title: 'Wieso? Weshalb? Warum? Unsere Erde (Ravensburger)', area: 'Erde', why: '4 bis 7 Jahre, Klappen und anschauliche Grundlagen' },
  { when: 'Jetzt', title: 'WAS IST WAS Junior Weltraum (Tessloff)', area: 'Weltall', why: 'guter Einstieg in Sterne, Planeten und Raumfahrt' },
  { when: 'Jetzt', title: 'Wieso? Weshalb? Warum? Sonne, Mond und Sterne (Ravensburger)', area: 'Weltall', why: 'für jüngere Kinder besonders zugänglich' },
  { when: 'Jetzt', title: 'WAS IST WAS Junior Dinosaurier und Tiere der Urzeit (Tessloff)', area: 'Urzeit', why: 'Basisbuch für die Dinojahre' },
  { when: 'Jetzt', title: 'Wieso? Weshalb? Warum? junior Dinosaurier (Ravensburger)', area: 'Urzeit', why: 'für das jüngste Kind, 2 bis 4 Jahre' },
  { when: 'Jetzt', title: 'Wieso? Weshalb? Warum? Wir entdecken unseren Körper (Ravensburger)', area: 'Mensch', why: 'Körperfunktionen kindgerecht' },
  { when: 'Jetzt', title: 'Wieso? Weshalb? Warum? Wir entdecken die Ritterburg (Ravensburger)', area: 'Geschichte', why: 'Burgleben statt reiner Ritterromantik' },
  { when: 'Jetzt', title: 'Wieso? Weshalb? Warum? Wir entdecken Insekten (Ravensburger)', area: 'Natur', why: 'passt zu Garten, Bestäubung und Ökosystemen' },
  { when: 'Jetzt', title: 'Ein guter Kinder-Naturführer für Deutschland', area: 'Natur', why: 'Bäume, Blüten, Vögel, Insekten und Spuren draußen wiederfinden' },
  { when: 'Jetzt', title: 'Ein großes Tierlexikon mit realistischen Fotos', area: 'Tiere', why: 'nur ein umfassendes Werk, nicht mehrere ähnliche' },
  { when: 'Jetzt', title: 'Ein Kinder-Experimentebuch mit Alltagsmaterialien', area: 'Forschen', why: 'Experimente ohne Spezialchemikalien bevorzugen' },
  { when: 'Jetzt', title: 'tiptoi Mein großer Weltatlas oder Weltatlas', area: 'Geografie', why: 'selbstständiges Hören und Entdecken' },
  { when: 'ab 6–7', title: 'WAS IST WAS Reihe: Erde, Vulkane, Wetter, Ozeane, Planeten', area: 'Vertiefung', why: 'nach Interesse einzeln ergänzen' },
  { when: 'ab 7–8', title: 'Kinder-Weltatlas mit physischen und politischen Karten', area: 'Geografie', why: 'Brücke zwischen Bilderatlas und Diercke' },
  { when: 'ab 7–8', title: 'Kinder-Anatomieatlas', area: 'Mensch', why: 'echtere anatomische Darstellungen' },
  { when: 'ab 7–8', title: 'Fossilien und Gesteine: Bestimmungsbuch für Kinder', area: 'Geologie', why: 'passt zur eigenen Fundsammlung' },
  { when: 'ab 8', title: 'Großes Wissensbuch, z. B. DK Wissen für Kinder', area: 'Allgemeinbildung', why: 'Bilder und kurze vertiefende Texte' },
  { when: 'ab 8', title: 'WAS IST WAS: Evolution, Genetik, Gehirn, Klima', area: 'Vertiefung', why: 'für die späteren Entdeckerjahre' },
  { when: 'ab 8', title: 'Geschichtsatlas für Kinder', area: 'Geschichte', why: 'Zeit und Ort gemeinsam sichtbar machen' },
  { when: 'ab 9', title: 'Atlas der Weltgeschichte für Kinder', area: 'Geschichte', why: 'größere historische Zusammenhänge' },
  { when: 'ab 9', title: 'Astronomie für Kinder und Jugendliche mit Sternkarten', area: 'Weltall', why: 'Teleskop und Sternbeobachtung vorbereiten' },
  { when: 'ab 9', title: 'Physik und Chemie für neugierige Kinder', area: 'Naturwissenschaft', why: 'Modelle, Experimente, Erklärungen' },
];

export const BOOK_TIP = 'Bücher nicht nach Alter wegpacken. Ein gutes Sachbuch darf sichtbar bleiben, auch wenn es fürs jüngste Kind noch zu schwer ist. Kinder greifen oft Monate später spontan danach.';

export const EQUIPMENT_NOW = [
  '2 Becherlupen und 1 normale Lupe', 'Kinderfernglas', 'einfacher Kompass', 'Taschenlampe und kleine Stirnlampe', 'Magnete verschiedener Formen',
  'Pipetten', 'kleine Messbecher', 'Trichter', 'Thermometer', 'Küchenwaage', 'Maßband und Lineal', 'Pinzetten', 'Spiegel', 'Luftballons', 'Schnur',
  'Holzstäbchen', 'Knete', 'Lebensmittelfarben', 'Natron und Zitronensäure oder Essig', 'Salz, Zucker, Öl', 'Filtertüten oder Kaffeefilter',
  'kleine transparente Dosen', 'weiße Schalen für Fundstücke', 'Schutzbrillen für Kinder bei spritzenden Experimenten',
];

export const EQUIPMENT_LATER = [
  { from: 6, text: 'einfacher Stromkreis-Baukasten mit Batteriefach, Kabeln, LEDs und Schalter (ab ca. 6–7)' },
  { from: 7, text: 'digitales Handmikroskop zum gemeinsamen Anschauen (ab ca. 7–8)' },
  { from: 8, text: 'solides optisches Schülermikroskop (ab ca. 8)' },
  { from: 8, text: 'Multimeter, nur mit Begleitung (ab ca. 8–9)' },
  { from: 9, text: 'Einsteiger-Teleskop oder gutes Fernglas für den Mond (ab ca. 9)' },
  { from: 9, text: 'einfache Robotik oder Programmierhardware, wenn Interesse da ist (ab ca. 9–10)' },
];

export const SAFETY_RULE = 'Bei Hitze, Strom, Glas, scharfen Werkzeugen oder Chemikalien übernimmt ein Erwachsener die gefährlichen Schritte. Meist reichen haushaltsübliche, ungiftige Stoffe und Niedervolt-Batterien.';

export interface ExplorerPlace { name: string; focus: string; effort: string; strengths: string; age: string }

/** Ausflugsbibliothek: bewährte Ankerorte. Wiederbesuche mit anderem Fokus sind Absicht. */
export const PLACES: ExplorerPlace[] = [
  { name: 'experimenta Heilbronn', focus: 'Science Center', effort: 'Tagesausflug, nah', strengths: 'rund 275 Mitmachstationen, Science Dome, Sternwarte, Wasserlandschaft', age: 'sehr gut ab 3, ältere Kinder finden weiterhin anspruchsvolle Ebenen' },
  { name: 'Museum am Löwentor, Stuttgart', focus: 'Urzeit, Naturkunde', effort: 'ca. 1,5 h', strengths: 'Erdgeschichte, Fossilien, Dinosaurier; sonntags Familienführungen ab 5', age: 'ideal für Urzeit und Erdgeschichte' },
  { name: 'Schloss Rosenstein, Stuttgart', focus: 'Natur, Lebensräume', effort: 'ca. 1,5 h', strengths: 'heutige Vielfalt des Lebens und Lebensräume', age: 'starker zweiter Naturkunde-Anker' },
  { name: 'RiesKraterMuseum Nördlingen', focus: 'Geologie, Weltall', effort: 'ca. 1,5–2 h', strengths: 'Meteoriten, Einschlagkrater, Mondgestein; das Ries als echte Landschaft', age: 'ab ca. 5 besonders stark' },
  { name: 'URMU Blaubeuren', focus: 'Steinzeit, Eiszeit', effort: 'ca. 2 h', strengths: 'UNESCO-Eiszeitkunst, Mitmachstationen, Familienangebote', age: 'sehr erinnerungsstark durch Originale' },
  { name: 'Urweltmuseum Hauff, Holzmaden', focus: 'Fossilien', effort: 'ca. 1,5–2 h', strengths: 'Jurafossilien und Urmeer', age: 'mit echtem Fossilienfokus' },
  { name: 'Senckenberg Naturmuseum Frankfurt', focus: 'Evolution, Naturkunde', effort: 'ca. 2 h', strengths: 'Dinosaurier, Fossilien, Artenvielfalt; Aha?! Science Lab', age: 'ab Grundschulalter zunehmend ergiebig' },
  { name: 'Technik Museum Speyer', focus: 'Raumfahrt, Technik', effort: 'ca. 2–2,5 h', strengths: 'Apollo and Beyond, BURAN, Mondstein', age: 'großes Weltraum-Highlight' },
  { name: 'Technik Museum Sinsheim', focus: 'Mobilität, Luftfahrt', effort: 'ca. 1–1,5 h', strengths: 'begehbare Flugzeuge, Concorde, Technik', age: 'Wow-Faktor, weniger vertiefend' },
  { name: 'TECHNOSEUM Mannheim', focus: 'Technik, Industrie', effort: 'ca. 1,5–2 h', strengths: '200 Jahre Technik- und Sozialgeschichte, Mitmachstationen', age: 'ab 5 bis 6 immer besser' },
  { name: 'KLIMA ARENA Sinsheim', focus: 'Klima, Energie', effort: 'ca. 1–1,5 h', strengths: 'interaktive Ausstellung, Gletscher-Kino, Familienangebote', age: 'für Jüngere spielerisch, später systemisch' },
  { name: 'Römermuseum Osterburken', focus: 'Römer, Heimat', effort: 'nah', strengths: 'Originalbefunde, römisches Bad, Limes, Archäologie', age: 'perfekter regionaler Römeranker' },
  { name: 'Residenzschloss und Deutschordensmuseum Bad Mergentheim', focus: 'Heimat, Mittelalter', effort: 'sehr nah', strengths: 'Schlossgeschichte, Deutscher Orden, familienfreundlich', age: 'kurze Anfahrt, man erkennt viel wieder' },
  { name: 'Museum Brot und Kunst, Ulm', focus: 'Ernährung, Kultur', effort: 'ca. 1,5–2 h', strengths: 'Getreide, Brot und Welternährung; Kinder-Medienguide', age: 'sehr passend für Lebensmittelketten' },
  { name: 'Germanisches Nationalmuseum Nürnberg', focus: 'Geschichte, Kultur', effort: 'ca. 1,5–2 h', strengths: 'sechs Kindertouren, Mittelalter und Kulturgeschichte', age: 'für spätere Grundschuljahre stark' },
  { name: 'DB Museum Nürnberg', focus: 'Mobilität', effort: 'ca. 1,5–2 h', strengths: 'KIBALA mit Miniaturbahn und Bahnberufen', age: 'hervorragend auch für jüngere Geschwister' },
  { name: 'Deutsches Museum Nürnberg', focus: 'Zukunft, Robotik', effort: 'ca. 1,5–2 h', strengths: 'Zukunftstechnologien, Robotik, Workshops', age: 'besonders ab 8 bis 10' },
  { name: 'Deutsches Museum München', focus: 'Naturwissenschaft, Raumfahrt', effort: 'großer Tages- oder Wochenendausflug', strengths: 'Astronomie, Raumfahrt, Naturwissenschaft; Kinderreich für 3 bis 8', age: 'späteres Highlight' },
];

/** Prüfroutine vor jedem Ausflug. */
export const TRIP_CHECKS = [
  'Ist das Haus sonntags geöffnet? Gibt es Umbauten oder geschlossene Bereiche?',
  'Programm prüfen: Familienführung, Workshop, Planetariumsshow, Sonderausstellung.',
  'Altersfreigaben kontrollieren, besonders bei Science-Dome- und Planetariumsfilmen.',
  'Tickets bei stark besuchten Häusern vorab buchen.',
  'Im Winter Parkweg und Außenanteil bedenken. Bei Freilichtmuseen einen Ersatztermin bereithalten.',
];

/** Mama-Spickzettel: erklären, ohne einen Vortrag zu halten. */
export const CHEATSHEET: { title: string; items: string[] }[] = [
  {
    title: 'So erklärst du, ohne einen Vortrag zu halten',
    items: [
      'Mit Beobachtung beginnen: „Was siehst du?“ statt sofort zu erklären.',
      'Danach Vermutung: „Was glaubst du, warum?“',
      'Dann höchstens zwei Sätze Erklärung.',
      'Wenn du es nicht weißt: „Gute Frage. Das weiß ich auch nicht sicher. Wir finden es heraus.“',
      'Bei falschen Kinderideen nicht sofort „Nein“ sagen. Erst fragen, was sie zu der Idee bringt, dann Modell oder Gegenbeispiel zeigen.',
      'Fachbegriffe dürfen vorkommen, wenn sie an ein Bild gekoppelt sind: Magma, Fossil, Kontinent, Limes, Gravitation.',
    ],
  },
  {
    title: 'Wenn ein Kind keine Lust hat',
    items: ['Es darf nur zuschauen oder eine Minirolle übernehmen: Materialchef, Fotograf, Countdown-Sprecher, Kartenfinder. Neugier bleibt freiwillig.'],
  },
  {
    title: 'Wenn ein Kind viel mehr wissen will',
    items: ['Nicht das ganze Familienprogramm hochziehen. Eine Zusatzfrage, ein anspruchsvolleres Buch oder später zehn Minuten Einzelzeit. So bleibt der gemeinsame Kern altersgemischt.'],
  },
];

/** Nicht „Was haben wir heute gelernt?“, sondern: */
export const MEMORY_QUESTIONS = [
  'Was war heute am verrücktesten?',
  'Welche Sache würdest du Oma erzählen?',
  'Was hast du heute gesehen, das du vorher nur aus einem Buch kanntest?',
  'Was möchtest du dir merken?',
  'Welche neue Frage hast du jetzt?',
];

/** Jahresabschluss am letzten März-Sonntag jedes Entdeckerjahres, etwa 15 Minuten. */
export const YEAR_END = [
  'Alle sechs Entdeckerbuch-Seiten nebeneinanderlegen.',
  'Jedes Kind wählt seinen Lieblingssonntag.',
  'Auf Weltkarte und Zeitlinie die neuen Marker anschauen.',
  'Ein Familienfoto „Entdeckerjahr geschafft“ machen.',
  'Keine Wissensabfrage. Der Rückblick selbst stärkt die Erinnerung.',
];

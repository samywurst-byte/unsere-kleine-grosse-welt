import type { ProjectLevel } from '../types';

/**
 * Entdeckerbibliothek. Jede Sachaussage hat eine Quelle (Index in `sources`); geprüft am 10.10.2026.
 * Keine erfundenen Fakten: Was die Quelle nicht sagt, steht hier nicht. Ids bleiben dauerhaft.
 * Forscheraufträge sind Tätigkeiten am Tisch, im Garten oder im Wald, keine Bildschirmzeit.
 */

export interface Source { title: string; publisher: string; url: string }

export interface Fact { text: string; source: number }

export interface QuizItem {
  question: string;
  options: string[];
  answer: number;
  /** Erklärung nach dem Antippen; stützt sich auf die Fakten oben. */
  explain: string;
}

export interface Mission {
  id: string;
  title: string;
  how: string;
  materials?: string[];
  /** Für wen besonders geeignet; fehlt = für alle. */
  levels?: ProjectLevel[];
  /** Sicherheitshinweis für Erwachsene. */
  safety?: string;
}

export interface DiscoverTopic {
  id: string;
  title: string;
  emoji: string;
  intro: string;
  facts: Fact[];
  quiz: QuizItem[];
  missions: Mission[];
  /** Wörter zum Lesen; Lesekinder sehen die, deren Buchstaben schon sitzen. */
  words: string[];
  trip?: string;
  /** Passende Idee in der Projektwerkstatt. */
  projectId?: string;
  timeline?: boolean;
  sources: Source[];
}

const klex = (title: string, path: string): Source => ({ title, publisher: 'Klexikon, das Kinderlexikon', url: `https://klexikon.zum.de/wiki/${path}` });
const wiki = (title: string, path: string): Source => ({ title, publisher: 'Wikipedia', url: `https://de.wikipedia.org/wiki/${path}` });

export const DISCOVER_TOPICS: DiscoverTopic[] = [
  {
    id: 'dinosaurs', title: 'Dinosaurier', emoji: '🦕', projectId: 'dinosaurs', timeline: true,
    intro: 'Vor sehr, sehr langer Zeit lebten Dinosaurier auf der Erde. Wir kennen sie, weil Forscher ihre versteinerten Spuren finden.',
    facts: [
      { text: 'Die meisten Dinosaurier starben vor etwa 66 Millionen Jahren aus.', source: 1 },
      { text: 'Es gab Fleischfresser und Pflanzenfresser. Am größten wurden die Pflanzenfresser, oft mit einem langen Hals.', source: 0 },
      { text: 'Einer der größten bekannten Dinosaurier ist der Patagotitan. Er war etwa 37 Meter lang.', source: 0 },
      { text: 'Dinosaurier legten Eier. Im Vergleich zu ihrem großen Körper waren die Eier sehr klein.', source: 0 },
      { text: 'Unsere Vögel stammen von Dinosauriern ab.', source: 1 },
      { text: 'Wir wissen von Dinosauriern durch Fossilien: versteinerte Knochen, Eier, Haut, Fußspuren und sogar versteinerten Kot.', source: 0 },
      { text: 'Warum sie ausstarben, weiß man nicht ganz sicher. Viele Forscher denken an einen großen Meteoriten.', source: 0 },
    ],
    quiz: [
      { question: 'Welche Dinosaurier wurden am größten?', options: ['Die Pflanzenfresser', 'Die Fleischfresser'], answer: 0, explain: 'Die riesigen Dinosaurier mit dem langen Hals fraßen Pflanzen.' },
      { question: 'Welche Tiere stammen von Dinosauriern ab?', options: ['Vögel', 'Katzen', 'Fische'], answer: 0, explain: 'Die Amsel im Garten ist eine ganz entfernte Verwandte der Dinosaurier.' },
      { question: 'Haben Menschen und Dinosaurier zusammen gelebt?', options: ['Ja', 'Nein'], answer: 1, explain: 'Die Dinosaurier waren schon Millionen Jahre ausgestorben, als es die ersten Menschen gab. Schau auf den Zeitstrahl!' },
    ],
    missions: [
      { id: 'length', title: 'Wie lang war der Patagotitan?', how: 'Draußen 37 große Erwachsenenschritte abgehen und den Anfang und das Ende mit Stöcken markieren. Dann legen sich alle hintereinander auf den Boden: Wie oft passen wir hinein?', materials: ['Zwei Stöcke oder Kreide'] },
      { id: 'fossils', title: 'Fossilien aus Salzteig', how: 'Salzteig kneten, Muscheln, Blätter oder Spielzeugdinos hineindrücken, trocknen lassen und anmalen.', materials: ['Mehl', 'Salz', 'Wasser', 'Muscheln oder Spielzeugtiere'] },
      { id: 'sort', title: 'Fleisch- oder Pflanzenfresser?', how: 'Spielzeugdinos oder Bilder in zwei Gruppen sortieren. Woran erkennt man es? Zähne anschauen!', levels: ['toddler', 'preschool'] },
      { id: 'poster', title: 'Mein Dino-Steckbrief', how: 'Einen Lieblingsdino aussuchen, malen und Name, Größe und Futter dazuschreiben oder diktieren.', levels: ['reader', 'school'] },
    ],
    words: ['DINO', 'EI', 'NEST', 'ZAHN', 'KNOCHEN', 'SAND'],
    trip: 'Naturkundemuseum mit Dinosauriern (Öffnungszeiten und Eintritt vorher selbst prüfen)',
    sources: [klex('Dinosaurier', 'Dinosaurier'), wiki('Dinosaurier', 'Dinosaurier')],
  },
  {
    id: 'earth-history', title: 'Erdgeschichte und Zeitstrahl', emoji: '🌋', timeline: true, projectId: 'timeline',
    intro: 'Die Erde ist unvorstellbar alt. Auf einem Zeitstrahl sehen wir, wann es Dinosaurier gab und wann Menschen dazukamen.',
    facts: [
      { text: 'Unser Sonnensystem mit der Erde ist ungefähr viereinhalb Milliarden Jahre alt.', source: 0 },
      { text: 'Die Zeit der Dinosaurier hat drei Abschnitte: Trias, Jura und Kreide.', source: 1 },
      { text: 'Die Trias begann vor etwa 252 Millionen Jahren, der Jura vor etwa 201 Millionen und die Kreide vor 145 Millionen Jahren.', source: 1 },
      { text: 'Die Kreidezeit endete vor 66 Millionen Jahren.', source: 1 },
      { text: 'Die ältesten bekannten Knochen von Menschen wie uns sind etwa 315.000 Jahre alt.', source: 2 },
      { text: 'Wäre die ganze Erdgeschichte ein einziger Tag, kämen Menschen wie wir erst wenige Sekunden vor Mitternacht dazu.', source: 1 },
    ],
    quiz: [
      { question: 'Was kam zuerst?', options: ['Die Dinosaurier', 'Die Menschen'], answer: 0, explain: 'Die Dinosaurier lebten viele Millionen Jahre vor den ersten Menschen.' },
      { question: 'Wie heißt der letzte Abschnitt der Dinosaurierzeit?', options: ['Kreide', 'Trias', 'Jura'], answer: 0, explain: 'Erst Trias, dann Jura, dann Kreide. Die Kreidezeit endete vor 66 Millionen Jahren.' },
    ],
    missions: [
      { id: 'paper-roll', title: 'Zeitstrahl aus einer Klopapierrolle', how: 'Eine Rolle durch den Flur abrollen. Am Ende ist heute. Gemeinsam markieren: Trias, Jura, Kreide und ganz am Ende ein winziger Strich für die Menschen.', materials: ['Klopapierrolle', 'Buntstifte', 'Klebeband'] },
      { id: 'day-clock', title: 'Die Erdgeschichte als ein Tag', how: 'Eine große Uhr malen. Wenn die ganze Erdgeschichte ein Tag wäre: Wo kämen wir Menschen hin? Ganz kurz vor 12 Uhr nachts!', levels: ['reader', 'school'] },
      { id: 'stones', title: 'Steine sammeln und sortieren', how: 'Beim Spaziergang Steine sammeln, zu Hause nach Farbe, Größe und Form sortieren und eine kleine Ausstellung machen.', levels: ['toddler', 'preschool'] },
    ],
    words: ['ALT', 'ZEIT', 'STEIN', 'ERDE', 'JAHR'],
    sources: [klex('Sonnensystem', 'Sonnensystem'), wiki('Geologische Zeitskala', 'Geologische_Zeitskala'), wiki('Homo sapiens', 'Homo_sapiens')],
  },
  {
    id: 'space', title: 'Weltraum', emoji: '🪐',
    intro: 'Die Erde ist ein Planet. Zusammen mit sieben anderen Planeten kreist sie um die Sonne.',
    facts: [
      { text: 'Die Sonne ist ein Stern.', source: 0 },
      { text: 'Das Licht der Sonne braucht etwa 8 Minuten, bis es bei uns auf der Erde ist.', source: 0 },
      { text: 'Die Sonne ist so groß, dass die Erde mehr als eine Million Mal hineinpassen würde.', source: 0 },
      { text: 'Es gibt acht Planeten. Von der Sonne aus: Merkur, Venus, Erde, Mars, Jupiter, Saturn, Uranus und Neptun.', source: 1 },
      { text: 'Jupiter ist der größte Planet, Merkur der kleinste.', source: 2 },
      { text: 'Der Mond leuchtet nicht selbst. Wir sehen ihn, weil die Sonne ihn anstrahlt.', source: 3 },
      { text: 'Im Jahr 1969 betrat Neil Armstrong als erster Mensch den Mond.', source: 3 },
    ],
    quiz: [
      { question: 'Welcher Planet ist der größte?', options: ['Jupiter', 'Erde', 'Mars'], answer: 0, explain: 'Jupiter ist der größte Planet unseres Sonnensystems.' },
      { question: 'Leuchtet der Mond selbst?', options: ['Ja', 'Nein'], answer: 1, explain: 'Die Sonne strahlt ihn an, deshalb sehen wir ihn.' },
      { question: 'Was ist die Sonne?', options: ['Ein Stern', 'Ein Planet'], answer: 0, explain: 'Die Sonne ist ein Stern, der Stern in der Mitte unseres Sonnensystems.' },
    ],
    missions: [
      { id: 'moon-diary', title: 'Mondtagebuch', how: 'Vier Wochen lang jeden klaren Abend den Mond anschauen und malen. Wird er dicker oder dünner?', materials: ['Heft', 'Stifte'], safety: 'Niemals direkt in die Sonne schauen, auch nicht mit Fernglas.' },
      { id: 'planets', title: 'Planeten aus Knete', how: 'Acht Planeten aus Knete formen, der Größe nach ordnen (Jupiter am größten, Merkur am kleinsten) und dann in der richtigen Reihenfolge um eine gelbe Sonne legen.', materials: ['Knete in vielen Farben'] },
      { id: 'stars', title: 'Sterne schauen', how: 'An einem klaren Abend warm anziehen, auf eine Decke legen und Sterne zählen. Wer findet den hellsten?', materials: ['Decke', 'Warme Jacken'] },
    ],
    words: ['MOND', 'STERN', 'SONNE', 'ERDE', 'MARS'],
    trip: 'Planetarium oder Sternwarte (Vorstellungen für Kinder vorher prüfen)',
    sources: [klex('Sonne', 'Sonne'), klex('Sonnensystem', 'Sonnensystem'), { title: 'Planets', publisher: 'NASA Science', url: 'https://science.nasa.gov/solar-system/planets/' }, klex('Mond', 'Mond')],
  },
  {
    id: 'animals', title: 'Tiere bei uns im Herbst und Winter', emoji: '🦔',
    intro: 'Wenn es kalt wird, hat jedes Tier seinen eigenen Trick: Manche schlafen, manche ruhen, manche fliegen weg.',
    facts: [
      { text: 'Igel suchen ihr Futter in der Dämmerung und nachts. Sie fressen vor allem Insekten, Käfer, Raupen und Regenwürmer.', source: 0 },
      { text: 'Igel halten Winterschlaf. Vorher müssen sie sich genug Fett anfressen.', source: 0 },
      { text: 'Eichhörnchen halten keinen Winterschlaf, sondern Winterruhe. Zwischendurch verlassen sie ihr Nest und suchen Futter.', source: 1 },
      { text: 'Das Nest der Eichhörnchen heißt Kobel.', source: 1 },
      { text: 'Eichhörnchen vergraben im Herbst Nüsse und Samen. Was sie nicht wiederfinden, keimt und wird zu neuen Pflanzen.', source: 1 },
      { text: 'Zugvögel wie Störche, Schwalben und Kraniche fliegen im Winter in den Süden, meist nach Afrika. Hier gäbe es im Winter zu wenig Futter.', source: 2 },
    ],
    quiz: [
      { question: 'Wer hält Winterschlaf?', options: ['Der Igel', 'Das Eichhörnchen'], answer: 0, explain: 'Der Igel schläft den Winter durch. Das Eichhörnchen hält nur Winterruhe.' },
      { question: 'Wie heißt das Nest vom Eichhörnchen?', options: ['Kobel', 'Höhle', 'Bau'], answer: 0, explain: 'Das Eichhörnchennest heißt Kobel.' },
      { question: 'Wohin fliegen die Störche im Winter?', options: ['Nach Süden, meist nach Afrika', 'Zum Nordpol'], answer: 0, explain: 'Im Süden finden sie im Winter genug Futter.' },
    ],
    missions: [
      { id: 'leaf-pile', title: 'Ein Laubhaufen für Igel', how: 'In einer ruhigen Gartenecke Laub und Zweige zu einem Haufen schichten und ihn den Winter über liegen lassen.', materials: ['Laub', 'Zweige', 'Rechen'] },
      { id: 'tracks', title: 'Spurensuche im Wald', how: 'Angeknabberte Zapfen und Nussschalen suchen. Wer war das wohl? Fotos machen und zu Hause vergleichen.', materials: ['Beutel', 'Handy oder Kamera'] },
      { id: 'bird-count', title: 'Vögel zählen', how: 'Eine Stunde lang am Fenster beobachten, welche Vögel kommen, und Striche machen.', levels: ['preschool', 'reader', 'school'], materials: ['Papier', 'Stift'] },
    ],
    words: ['IGEL', 'NEST', 'NUSS', 'LAUB', 'MAUS'],
    trip: 'Wald, Wildpark oder Vogelschutzgebiet',
    sources: [klex('Igel', 'Igel'), klex('Eichhörnchen', 'Eichh%C3%B6rnchen'), klex('Zugvogel', 'Zugvogel')],
  },
  {
    id: 'plants', title: 'Pflanzen und Bäume', emoji: '🌱', projectId: 'tree',
    intro: 'Pflanzen können etwas, das wir nicht können: Sie machen aus Sonnenlicht ihr eigenes Essen.',
    facts: [
      { text: 'Pflanzen brauchen Sonnenlicht, Wasser aus der Erde und Luft.', source: 0 },
      { text: 'Daraus machen sie Zucker für sich selbst und geben Sauerstoff ab, den wir atmen.', source: 0 },
      { text: 'Blätter sind grün, weil in ihnen ein grüner Farbstoff steckt. Er heißt Chlorophyll.', source: 0 },
      { text: 'Laubbäume verlieren im Herbst ihre Blätter. So verliert der Baum weniger Wasser.', source: 1 },
      { text: 'Laubbäume bei uns sind zum Beispiel Ahorn, Buche, Eiche, Kastanie und Linde.', source: 1 },
    ],
    quiz: [
      { question: 'Was brauchen Pflanzen zum Wachsen?', options: ['Licht und Wasser', 'Dunkelheit und Sand'], answer: 0, explain: 'Mit Licht, Wasser und Luft machen Pflanzen ihr eigenes Essen.' },
      { question: 'Warum sind Blätter grün?', options: ['Wegen eines grünen Farbstoffs', 'Weil sie angemalt sind'], answer: 0, explain: 'Der grüne Farbstoff heißt Chlorophyll.' },
    ],
    missions: [
      { id: 'cress', title: 'Kresse im Hellen und im Dunkeln', how: 'Zwei Schalen mit Kresse auf feuchter Watte. Eine steht am Fenster, eine im dunklen Schrank. Nach einer Woche vergleichen: Was ist anders?', materials: ['Kressesamen', 'Watte', 'Zwei Schalen'] },
      { id: 'leaves', title: 'Blätter sammeln und zuordnen', how: 'Blätter von verschiedenen Bäumen sammeln, pressen und mit einem Bestimmungsbuch herausfinden, zu welchem Baum sie gehören.', materials: ['Dicke Bücher zum Pressen', 'Bestimmungsbuch'] },
      { id: 'bark', title: 'Rinde abreiben', how: 'Papier an einen Baumstamm halten und mit Wachsmalern darüberreiben. Jeder Baum hat ein anderes Muster.', levels: ['toddler', 'preschool'], materials: ['Papier', 'Wachsmalstifte'] },
    ],
    words: ['BAUM', 'BLATT', 'SAMEN', 'ERDE', 'LAUB'],
    trip: 'Botanischer Garten oder Waldspaziergang',
    sources: [klex('Photosynthese', 'Photosynthese'), klex('Laubbaum', 'Laubbaum')],
  },
  {
    id: 'technology', title: 'Technik: Hebel und Magnete', emoji: '🧲',
    intro: 'Mit ein paar Tricks können wir mehr heben, als wir eigentlich schaffen. Und Magnete haben unsichtbare Kräfte.',
    facts: [
      { text: 'Ein Hebel ist eine feste Stange, die sich um einen Drehpunkt bewegt. Er verstärkt unsere Kraft.', source: 0 },
      { text: 'Hebel gibt es überall: Wippe, Schubkarre, Zange, Fahrradbremse und Wasserhahn.', source: 0 },
      { text: 'Wer weiter weg vom Drehpunkt drückt, kann schwerere Lasten bewegen.', source: 0 },
      { text: 'Ein Magnet zieht Dinge aus Eisen und einigen anderen Metallen an.', source: 1 },
      { text: 'Der Nordpol eines Magneten zieht den Südpol eines anderen an. Zwei Nordpole oder zwei Südpole stoßen sich ab.', source: 1 },
      { text: 'Die Erde hat ein Magnetfeld. Deshalb zeigt die Nadel eines Kompasses nach Norden.', source: 1 },
    ],
    quiz: [
      { question: 'Was zieht ein Magnet an?', options: ['Einen Nagel aus Eisen', 'Einen Holzlöffel', 'Ein Blatt Papier'], answer: 0, explain: 'Magnete ziehen Eisen an, Holz und Papier nicht.' },
      { question: 'Was ist ein Hebel?', options: ['Eine Wippe', 'Ein Kissen'], answer: 0, explain: 'Die Wippe dreht sich um einen Punkt in der Mitte, das ist ein Hebel.' },
    ],
    missions: [
      { id: 'magnet-hunt', title: 'Magnet-Detektive', how: 'Mit einem Magneten durch die Wohnung gehen: Was bleibt hängen, was nicht? Zwei Listen machen oder malen.', materials: ['Großer Magnet'], safety: 'Kleine Magnete gehören nicht in Kinderhände: Verschluckt sind sie gefährlich.' },
      { id: 'see-saw', title: 'Wippe auf dem Spielplatz', how: 'Papa sitzt nah an der Mitte, das Kind ganz außen. Wer kommt hoch? Dann tauschen und ausprobieren.' },
      { id: 'ruler', title: 'Lineal-Wippe', how: 'Ein Lineal auf einen Stift legen. Radiergummis auf beide Seiten legen und schieben, bis es im Gleichgewicht ist.', levels: ['reader', 'school'], materials: ['Lineal', 'Stift', 'Radiergummis'] },
    ],
    words: ['RAD', 'NAGEL', 'EISEN', 'ZANGE'],
    sources: [klex('Hebel', 'Hebel'), klex('Magnet', 'Magnet')],
  },
  {
    id: 'water', title: 'Experimente mit Wasser', emoji: '💧',
    intro: 'Wasser kann fließen, fest werden und als Dampf verschwinden. Damit kann man wunderbar forschen.',
    facts: [
      { text: 'Wasser gibt es in drei Formen: flüssig, als Eis und als Dampf.', source: 0 },
      { text: 'Unter 0 Grad Celsius gefriert Wasser zu Eis. Bei 100 Grad Celsius fängt es an zu kochen.', source: 0 },
      { text: 'Holz, Äpfel und viele andere Dinge gehen nicht unter, sie schwimmen.', source: 0 },
      { text: 'Auf der Erde ist mehr von Wasser bedeckt als von Land.', source: 0 },
    ],
    quiz: [
      { question: 'Was passiert mit Wasser unter 0 Grad?', options: ['Es wird zu Eis', 'Es kocht'], answer: 0, explain: 'Unter 0 Grad Celsius gefriert Wasser.' },
      { question: 'Schwimmt ein Apfel?', options: ['Ja', 'Nein'], answer: 0, explain: 'Äpfel gehen nicht unter. Probiert es aus!' },
    ],
    missions: [
      { id: 'float', title: 'Schwimmt oder sinkt?', how: 'Zehn Dinge sammeln. Erst vermuten, dann in eine Wanne legen. Eine Tabelle mit zwei Spalten machen: schwimmt, sinkt.', materials: ['Wanne mit Wasser', 'Korken, Löffel, Apfel, Stein, Holz, Knete'] },
      { id: 'ice', title: 'Eiswettrennen', how: 'Zwei Eiswürfel: einer in die Sonne, einer in den Schatten. Welcher schmilzt zuerst? Mit der Uhr messen.', materials: ['Eiswürfel', 'Zwei Teller', 'Uhr'] },
      { id: 'puddle', title: 'Wohin geht die Pfütze?', how: 'Den Rand einer Pfütze mit Kreide nachmalen und jede Stunde wieder schauen. Wo ist das Wasser hin?', materials: ['Kreide'] },
    ],
    words: ['EIS', 'WASSER', 'NASS', 'DAMPF'],
    sources: [klex('Wasser', 'Wasser')],
  },
  {
    id: 'egypt', title: 'Altes Ägypten', emoji: '🏺',
    intro: 'Vor Tausenden von Jahren lebten am Nil Menschen, die riesige Pyramiden bauten und mit Bildern schrieben.',
    facts: [
      { text: 'Ägypten liegt am Nil. Er ist der längste Fluss Afrikas.', source: 0 },
      { text: 'Bei Hochwasser brachte der Nil fruchtbaren Schlamm. Darauf bauten die Bauern ihr Essen an.', source: 0 },
      { text: 'Die Herrscher hießen Pharaonen. Ein Pharao war so etwas wie ein König.', source: 0 },
      { text: 'Der Pharao Cheops lebte vor etwa 4400 Jahren. Seine Pyramide gehört zu den Sieben Weltwundern.', source: 0 },
      { text: 'Die Schrift der alten Ägypter heißt Hieroglyphen. Lange Zeit konnte sie niemand mehr lesen.', source: 0 },
      { text: 'Im Jahr 1922 fand Howard Carter das Grab von Tutanchamun. Dessen Totenmaske ist über 3000 Jahre alt.', source: 0 },
    ],
    quiz: [
      { question: 'An welchem Fluss liegt Ägypten?', options: ['Am Nil', 'Am Rhein'], answer: 0, explain: 'Der Nil ist der längste Fluss Afrikas.' },
      { question: 'Wie hießen die Herrscher im alten Ägypten?', options: ['Pharaonen', 'Ritter'], answer: 0, explain: 'Ein Pharao war so etwas wie ein König. Ritter gab es viel später im Mittelalter.' },
    ],
    missions: [
      { id: 'pyramid', title: 'Pyramide bauen', how: 'Aus Bauklötzen oder Zuckerwürfeln eine Pyramide bauen. Wie viele Steine braucht man für jede Reihe?', materials: ['Bauklötze oder Zuckerwürfel'] },
      { id: 'nile', title: 'Ein Nil im Sandkasten', how: 'Einen Fluss in den Sand graben, Wasser hineingießen und schauen, wo der Sand nass und dunkel wird. Dort würden die Felder wachsen.', materials: ['Sandkasten', 'Gießkanne'] },
      { id: 'picture-writing', title: 'Bilderschrift erfinden', how: 'Für jedes Familienmitglied ein kleines Bild erfinden und damit eine Nachricht schreiben. Können die anderen sie lesen?', levels: ['preschool', 'reader', 'school'] },
    ],
    words: ['NIL', 'SAND', 'KAMEL', 'GRAB'],
    trip: 'Museum mit einer Ägypten-Sammlung (vorher prüfen, ob sie gerade gezeigt wird)',
    sources: [klex('Altes Ägypten', 'Altes_%C3%84gypten')],
  },
  {
    id: 'middle-ages', title: 'Mittelalter', emoji: '🏰',
    intro: 'Im Mittelalter gab es Burgen, Ritter, Bauern und die ersten gedruckten Bücher.',
    facts: [
      { text: 'Das Mittelalter dauerte ungefähr vom Jahr 500 bis zum Jahr 1500, also etwa 1000 Jahre.', source: 0 },
      { text: 'Ritter waren Kämpfer mit einem Pferd und besonderen Rechten. Es gab nur recht wenige von ihnen.', source: 0 },
      { text: 'Im frühen Mittelalter arbeiteten die meisten Menschen als Bauern, Knechte oder Mägde.', source: 0 },
      { text: 'Papier aus alten Stoffresten war billiger als Pergament aus Tierhaut.', source: 0 },
      { text: 'Johannes Gutenberg erfand den Buchdruck mit einzelnen Buchstaben. So konnte man Texte viel leichter verbreiten.', source: 0 },
      { text: 'Im frühen Mittelalter hatten Städte selten mehr als 10.000 Einwohner.', source: 0 },
    ],
    quiz: [
      { question: 'Wer hatte im Mittelalter ein Pferd und besondere Rechte?', options: ['Die Ritter', 'Die Mägde'], answer: 0, explain: 'Ritter waren Kämpfer mit Pferd. Es gab aber nur wenige.' },
      { question: 'Was hat Johannes Gutenberg erfunden?', options: ['Den Buchdruck', 'Das Fahrrad'], answer: 0, explain: 'Mit einzelnen Buchstaben konnte er Texte drucken.' },
    ],
    missions: [
      { id: 'castle', title: 'Eine Burg bauen', how: 'Aus Kartons und Klorollen eine Burg mit Türmen, Mauer und Tor bauen und bemalen.', materials: ['Kartons', 'Klorollen', 'Kleber', 'Farben'] },
      { id: 'print', title: 'Drucken wie Gutenberg', how: 'Mit Kartoffelstempeln drucken. Erwachsene schneiden einen Buchstaben spiegelverkehrt hinein: Warum muss er andersherum sein?', materials: ['Kartoffeln', 'Messer (nur Erwachsene)', 'Farbe', 'Papier'] },
      { id: 'coat', title: 'Unser Familienwappen', how: 'Ein Wappen für die Familie gestalten: Welche Tiere, Farben und Zeichen passen zu uns?', materials: ['Papier', 'Stifte'] },
    ],
    words: ['BURG', 'RITTER', 'TURM', 'PFERD'],
    trip: 'Eine Burg oder Burgruine in der Nähe besichtigen',
    sources: [klex('Mittelalter', 'Mittelalter')],
  },
];

export const DISCOVER_TOPIC_BY_ID = new Map(DISCOVER_TOPICS.map((t) => [t.id, t]));

/** Zeitstrahl in Millionen Jahren vor heute (Geologische Zeitskala, Wikipedia; Homo sapiens: 0,315 Mio. Jahre). */
export const TIMELINE = [
  { id: 'triassic', label: 'Trias', from: 252, to: 201 },
  { id: 'jurassic', label: 'Jura', from: 201, to: 145 },
  { id: 'cretaceous', label: 'Kreide', from: 145, to: 66 },
  { id: 'cenozoic', label: 'Erdneuzeit', from: 66, to: 0 },
];

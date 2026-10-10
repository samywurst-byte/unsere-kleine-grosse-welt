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
  {
    id: 'body', title: 'Mein Körper', emoji: '💪',
    intro: 'In dir klopft, zieht und atmet es den ganzen Tag, auch wenn du schläfst. Lass uns herausfinden, was dein Körper alles kann!',
    facts: [
      { text: 'Wir haben fünf Sinne. Mit der Nase riechen wir, mit der Zunge schmecken wir, mit den Ohren hören wir, mit den Augen sehen wir und mit der Haut fühlen wir.', source: 0 },
      { text: 'Dein Herz ist ungefähr so groß wie deine Faust. Es pumpt das Blut durch den ganzen Körper. So bekommt jeder Teil vom Körper Sauerstoff und Nahrung.', source: 1 },
      { text: 'Das Herz eines Erwachsenen schlägt etwa 70 Mal in einer Minute. Bei einem Baby schlägt es etwa doppelt so oft. Beim Toben und beim Sport schlägt das Herz schneller.', source: 1 },
      { text: 'Den Takt vom Herzen nennt man Puls. Man kann ihn am Handgelenk fühlen. Dort fühlt ihn auch die Ärztin oder der Arzt.', source: 1 },
      { text: 'Alle Knochen zusammen sind das Skelett. Es macht den Körper fest. Ein Baby hat etwas mehr als 300 Knochen, ein Erwachsener etwas über 200. Denn beim Wachsen wachsen manche Knochen zusammen.', source: 2 },
      { text: 'Wir haben über 600 Muskeln. Ein Muskel kann nur ziehen, nicht drücken. Darum arbeiten Muskeln zu zweit: Einer beugt den Arm, der andere streckt ihn wieder.', source: 3 },
      { text: 'Beim Atmen holt die Lunge Sauerstoff aus der Luft ins Blut. Die verbrauchte Luft atmen wir wieder aus.', source: 4 },
    ],
    quiz: [
      { question: 'Wie groß ist dein Herz ungefähr?', options: ['So groß wie deine Faust', 'So groß wie ein Fußball', 'So klein wie eine Erbse'], answer: 0, explain: 'Das Herz ist ungefähr so groß wie die eigene Faust.' },
      { question: 'Wer hat mehr Knochen?', options: ['Ein Erwachsener', 'Ein Baby'], answer: 1, explain: 'Ein Baby hat etwas mehr als 300 Knochen. Beim Wachsen wachsen manche zusammen, darum hat ein Erwachsener nur etwas über 200.' },
      { question: 'Womit fühlen wir, ob etwas weich oder rau ist?', options: ['Mit den Ohren', 'Mit der Haut', 'Mit der Nase'], answer: 1, explain: 'Die Haut ist das Organ für den Tastsinn. Mit ihr fühlen wir.' },
    ],
    missions: [
      { id: 'heartbeat-hop', title: 'Herzschlag-Detektive', how: 'Erst ruhig sitzen und die Hand flach auf die Brust legen oder den Puls am Handgelenk suchen. Dann eine Minute lang hüpfen wie ein Frosch. Jetzt noch einmal fühlen: Klopft das Herz schneller? Wer mag, legt das Ohr an die Brust von Mama oder Papa und lauscht.', materials: ['Etwas Platz zum Hüpfen'] },
      { id: 'body-outline', title: 'Mein Körper in groß', how: 'Das Kind legt sich auf ein großes Stück Packpapier, ein Erwachsener malt den Umriss nach. Zusammen Herz, Lunge und ein paar Knochen hineinmalen. Danach Augen, Ohren, Nase und Mund aufmalen und überlegen: Was macht jeder Sinn?', materials: ['Packpapier oder Tapetenrolle', 'Dicke Stifte'] },
      { id: 'feel-bag', title: 'Fühlsäckchen', how: 'In einen Stoffbeutel kommen ein paar Dinge aus Haus und Garten. Das Kind greift hinein, ohne zu gucken, und rät: Was ist das? Ist es weich, hart, rau oder glatt?', materials: ['Stoffbeutel oder Socke', 'Tannenzapfen, Löffel, Wollknäuel, Kastanie, Schwamm'], safety: 'Bei Kindern unter 3 Jahren nur große Dinge nehmen, die nicht in den Mund passen.' },
      { id: 'muscle-pull', title: 'Muskel-Fühler', how: 'Eine Hand auf den Oberarm legen und den anderen Arm langsam beugen und strecken. Oben wird der Muskel dick und hart, wenn der Arm sich beugt. Dann hinten am Arm fühlen, wenn er sich streckt. So merkt man, dass zwei Muskeln abwechselnd ziehen.', levels: ['preschool', 'reader', 'school'] },
    ],
    words: ['HERZ', 'NASE', 'OHR', 'ARM', 'HAUT', 'MUND'],
    trip: 'Viele Naturkunde- und Mitmachmuseen haben eine Ecke zum menschlichen Körper mit Skelett zum Anschauen. Öffnungszeiten vorher prüfen.',
    sources: [klex('Sinnesorgan', 'Sinnesorgan'), klex('Herz', 'Herz'), klex('Skelett', 'Skelett'), klex('Muskel', 'Muskel'), klex('Lunge', 'Lunge')],
  },
  {
    id: 'food', title: 'Woher kommt unser Essen?', emoji: '🥕',
    intro: 'Brot, Milch und Äpfel liegen im Laden. Aber wo kommen sie eigentlich her? Wir gehen auf Spurensuche bis aufs Feld und in den Stall.',
    facts: [
      { text: 'Auf einem Bauernhof gibt es oft Kühe, Schweine und Hühner. Die Bäuerin oder der Bauer bekommt von ihnen Milch, Fleisch und Eier.', source: 0 },
      { text: 'Weizen, Roggen, Hafer und Mais sind Getreide. Das sind Gräser mit langen Halmen. Die Körner sind ihre Samen.', source: 1 },
      { text: 'In einer Mühle werden die Körner gemahlen. Zwei Mahlsteine reiben sie zu feinem Mehl. Früher drehte der Wind oder das Wasser die Mühle.', source: 2 },
      { text: 'Für Brot macht man aus Mehl, Wasser und anderen Zutaten einen Teig. Hefe macht kleine Gasbläschen in den Teig, so wird das Brot locker. Dann kommt es in den heißen Ofen.', source: 3 },
      { text: 'Die meiste Milch, die wir trinken, kommt aus dem Euter einer Kuh. Heute melkt fast immer eine Maschine. Aus Milch macht man Butter, Sahne, Käse und Joghurt.', source: 4 },
      { text: 'Gemüse sind Teile von Pflanzen, die man essen kann. Beim Salat essen wir die Blätter, bei der Karotte die Wurzel und beim Brokkoli die Blüten.', source: 5 },
      { text: 'Äpfel werden je nach Sorte im Sommer oder im Herbst reif. Danach lagert man sie in kühlen Häusern. Darum gibt es fast das ganze Jahr Äpfel zu kaufen.', source: 6 },
    ],
    quiz: [
      { question: 'Was wird in der Mühle aus den Körnern?', options: ['Mehl', 'Milch', 'Apfelsaft'], answer: 0, explain: 'In der Mühle reiben zwei Mahlsteine die Körner zu feinem Mehl.' },
      { question: 'Welchen Teil der Karotte essen wir?', options: ['Die Blüte', 'Die Wurzel', 'Das Blatt'], answer: 1, explain: 'Die Karotte ist eine Wurzel. Beim Salat dagegen essen wir die Blätter.' },
      { question: 'Was macht das Brot schön locker?', options: ['Salz', 'Hefe'], answer: 1, explain: 'Die Hefe macht kleine Gasbläschen in den Teig. Dadurch wird das Brot locker.' },
    ],
    missions: [
      { id: 'bake-bread', title: 'Wir backen Brot', how: 'Mehl, Wasser, etwas Salz und Hefe zu einem Teig kneten. Zugedeckt gehen lassen und zwischendurch nachsehen: Wird der Teig größer? Kleine Brötchen formen und backen. Wer mag, mahlt vorher ein paar Körner im Mörser und sieht, wie Mehl entsteht.', materials: ['Mehl', 'Wasser', 'Hefe', 'Salz', 'Schüssel', 'Backblech', 'Mörser (wenn vorhanden)'], safety: 'Den Ofen bedient ein Erwachsener, Blech und Brot sind sehr heiß. Auf Allergien und Unverträglichkeiten (zum Beispiel Gluten) achten.' },
      { id: 'grow-cress', title: 'Kresse-Garten', how: 'Watte oder Küchenpapier in eine flache Schale legen und nass machen. Kressesamen darauf streuen und jeden Tag ein wenig gießen. Jeden Tag schauen oder ein Bild malen: Wann kommen die ersten Blättchen? Nach ein paar Tagen abschneiden und aufs Butterbrot legen.', materials: ['Kressesamen', 'Watte oder Küchenpapier', 'Flache Schale', 'Kinderschere'], safety: 'Beim Abschneiden hilft ein Erwachsener.' },
      { id: 'fridge-detectives', title: 'Kühlschrank-Detektive', how: 'Zusammen in den Kühlschrank und die Vorratskiste schauen. Bei jedem Ding überlegen: Kommt es vom Tier oder von der Pflanze? Von der Kuh, vom Huhn, vom Feld oder vom Baum? Zwei Haufen bilden oder ein Bild malen. Große Kinder lesen auf der Packung, woher es kommt.', materials: ['Lebensmittel aus Kühlschrank und Vorrat', 'Papier und Stifte'] },
      { id: 'veggie-parts', title: 'Wurzel, Blatt oder Blüte?', how: 'Ein paar Sorten Gemüse auf den Tisch legen, zum Beispiel Karotte, Salat und Brokkoli. Gemeinsam raten: Ist das eine Wurzel, ein Blatt oder eine Blüte? Danach ein Stück probieren.', materials: ['Karotte', 'Salat', 'Brokkoli oder Blumenkohl'], safety: 'Rohes Gemüse für Zweijährige in kleine, weiche Stücke schneiden: Harte Stücke wie rohe Karotte können zum Verschlucken führen. Schneiden macht ein Erwachsener.' },
    ],
    words: ['BROT', 'MEHL', 'MILCH', 'KUH', 'KORN', 'APFEL'],
    trip: 'Ein Bauernhof mit Hofladen, eine alte Wind- oder Wassermühle oder ein Feld zum Selberpflücken zeigt, wo das Essen herkommt. Öffnungszeiten vorher prüfen.',
    sources: [klex('Bauernhof', 'Bauernhof'), klex('Getreide', 'Getreide'), klex('Mühle', 'Mühle'), klex('Brot', 'Brot'), klex('Milch', 'Milch'), klex('Gemüse', 'Gemüse'), klex('Apfel', 'Apfel')],
  },
  {
    id: 'volcanoes', title: 'Vulkane und das Innere der Erde', emoji: '⛰️',
    intro: 'Unter unseren Füßen ist die Erde ganz anders, als wir denken. Tief unten ist es so heiß, dass Stein flüssig wird. Und manchmal kommt er aus einem Berg heraus!',
    facts: [
      { text: 'Die Erde hat Schichten wie ein Apfel. Außen ist die Erdkruste. Darauf leben wir. Sie ist so dünn wie die Schale eines Apfels im Vergleich zum ganzen Apfel.', source: 0 },
      { text: 'Unter der Kruste liegt der Erdmantel. Er ist sehr heiß. Dort gibt es Magma, das ist geschmolzenes, flüssiges Gestein.', source: 0 },
      { text: 'Ganz in der Mitte ist der Erdkern. Er ist extrem heiß und enthält viel Eisen.', source: 0 },
      { text: 'Ein Vulkan ist ein Berg, aus dem heißes, flüssiges Gestein kommen kann. Oben hat er meist ein großes Loch, den Krater, statt einer Spitze.', source: 1 },
      { text: 'Wenn das Magma aus dem Vulkan herauskommt, heißt es Lava. An der Luft kühlt die Lava ab und wird wieder fester Stein.', source: 1 },
      { text: 'Bei einem Ausbruch kommen manchmal Gesteinsbrocken, heiße Gase oder Wolken aus Asche heraus. Wenn viel Asche in der Luft ist, können Flugzeuge manchmal nicht fliegen.', source: 1 },
      { text: 'Auch in Deutschland gab es Vulkane, zum Beispiel in der Eifel. In alten Vulkankratern hat sich Regenwasser gesammelt. So sind runde Seen entstanden. Sie heißen Maare oder „Augen der Eifel“.', source: 2 },
    ],
    quiz: [
      { question: 'Wie heißt das flüssige Gestein, wenn es aus dem Vulkan herauskommt?', options: ['Lava', 'Sand', 'Schnee'], answer: 0, explain: 'Tief in der Erde heißt es Magma. Wenn es herauskommt, heißt es Lava.' },
      { question: 'Auf welcher Schicht der Erde leben wir?', options: ['Auf dem Erdkern', 'Auf der Erdkruste'], answer: 1, explain: 'Die Erdkruste ist die äußere Schicht. Der Kern ist ganz innen.' },
      { question: 'Was ist ein Maar in der Eifel?', options: ['Ein Berg aus Eis', 'Ein See in einem alten Vulkankrater', 'Ein großer Baum'], answer: 1, explain: 'In alten Vulkankratern hat sich Regenwasser gesammelt. So sind die Maare entstanden.' },
    ],
    missions: [
      { id: 'baking-soda-volcano', title: 'Küchen-Vulkan', how: 'Eine kleine Flasche auf ein Tablett stellen und Sand oder Erde als Berg darum häufen. Zwei Löffel Natron und einen Spritzer Spülmittel in die Flasche geben, mit roter Lebensmittelfarbe gefärbten Essig dazugießen. Es schäumt heraus wie Lava! Gemeinsam beobachten: Wohin fließt die „Lava“?', materials: ['Kleine Flasche', 'Tablett oder Backblech', 'Sand oder Erde', 'Natron', 'Essig', 'Spülmittel', 'Rote Lebensmittelfarbe'], safety: 'Ein Erwachsener gießt den Essig. Essig brennt in den Augen: Abstand halten, nicht mit dem Gesicht über die Flasche beugen und danach Hände waschen. Natron und Essig nicht trinken.' },
      { id: 'clay-earth-layers', title: 'Die Erde aus Knete', how: 'Eine kleine Kugel aus gelber oder roter Knete formen: Das ist der Kern. Eine dicke Schicht orange Knete darum legen: der Mantel. Zum Schluss eine dünne Schicht blaue und grüne Knete: die Kruste mit Meer und Land. Ein Erwachsener schneidet die Kugel durch. Jetzt sieht man die Schichten!', materials: ['Knete in verschiedenen Farben', 'Messer'], safety: 'Nur ein Erwachsener schneidet mit dem Messer. Knete nicht in den Mund nehmen.' },
      { id: 'rock-detectives', title: 'Stein-Detektive', how: 'Draußen verschiedene Steine sammeln. Mit einer Lupe anschauen: Sind sie glatt oder rau, schwer oder leicht, haben sie Löcher oder Streifen? Steine nach Farbe oder Form sortieren und den Lieblingsstein malen.', materials: ['Eierkarton zum Sammeln', 'Lupe', 'Papier und Stifte'], safety: 'Kleine Kinder können kleine Steine verschlucken: Für Zweijährige nur große Steine.' },
      { id: 'lava-cools', title: 'Lava wird fest', how: 'Ein Erwachsener schmilzt etwas Schokolade im Wasserbad. Die flüssige Schokolade auf einen kalten Teller laufen lassen und zuschauen: Sie fließt wie Lava und wird beim Abkühlen wieder fest. So wird auch Lava an der Luft wieder zu Stein.', materials: ['Schokolade', 'Topf und Schüssel für das Wasserbad', 'Kalter Teller'], safety: 'Heißes Wasser und Herd nur durch Erwachsene. Geschmolzene Schokolade erst anfassen, wenn sie abgekühlt ist. An Allergien denken.' },
    ],
    words: ['BERG', 'LAVA', 'STEIN', 'ASCHE', 'KERN', 'EIFEL'],
    trip: 'Ein Ausflug zu einem Steinbruch, einem Naturkundemuseum oder einem See in einem alten Vulkankrater. Öffnungszeiten vorher prüfen.',
    sources: [klex('Erde', 'Erde'), klex('Vulkan', 'Vulkan'), klex('Eifel', 'Eifel')],
  },
  {
    id: 'habitats', title: 'Lebensräume der Erde', emoji: '🌍',
    intro: 'Manche Tiere leben im eiskalten Norden, andere in der heißen Wüste oder tief im Meer. Wie schaffen sie das bloß?',
    facts: [
      { text: 'Fast drei Viertel der Erde sind mit Meer bedeckt. Im Meerwasser ist Salz. Dort leben zum Beispiel Fische, Seesterne und Korallen.', source: 0 },
      { text: 'In einer Wüste wachsen keine oder fast keine Pflanzen. Die meisten Wüsten sind heiß und trocken, mit Sand oder Steinen, weil es kaum regnet. Es gibt aber auch eiskalte Wüsten in der Arktis und der Antarktis.', source: 1 },
      { text: 'Im Höcker von einem Kamel ist kein Wasser, sondern Fett. Kamele können sehr viel Wasser auf einmal trinken und sparen ganz viel Wasser in ihrem Körper.', source: 2 },
      { text: 'Im Regenwald regnet es sehr viel. Der tropische Regenwald ist heiß und feucht. Dort lebt mehr als die Hälfte aller Tier- und Pflanzenarten der Erde.', source: 3 },
      { text: 'Der Eisbär lebt in der Arktis, ganz im kalten Norden. Sein dichtes Fell lässt kein Wasser durch. Eine sehr dicke Fettschicht hält ihn warm, sogar im eiskalten Wasser.', source: 4 },
      { text: 'Auch die Pfoten vom Eisbären haben Haare. So friert er beim Laufen auf dem Eis nicht.', source: 4 },
      { text: 'Bei uns gibt es Laubwald, Nadelwald und Mischwald. Die meisten Waldtiere sind eher klein. Manche wohnen auf Bäumen, andere im Gebüsch.', source: 5 },
    ],
    quiz: [
      { question: 'Was ist im Höcker von einem Kamel?', options: ['Wasser', 'Fett', 'Sand'], answer: 1, explain: 'Viele denken, es ist Wasser. Aber im Höcker ist Fett.' },
      { question: 'Was hält den Eisbären im eiskalten Wasser warm?', options: ['Eine dicke Fettschicht', 'Ein Schal'], answer: 0, explain: 'Der Eisbär hat eine sehr dicke Fettschicht und ein dichtes Fell.' },
      { question: 'Wo regnet es sehr viel?', options: ['In der Wüste', 'Im Regenwald'], answer: 1, explain: 'Im Regenwald regnet es sehr viel. In der Wüste regnet es kaum.' },
    ],
    missions: [
      { id: 'blubber-glove', title: 'Der Fett-Handschuh', how: 'Eine Schüssel mit Wasser und Eiswürfeln füllen. Einen Gefrierbeutel innen dick mit Pflanzenfett (Kokosfett oder Butterschmalz) bestreichen und einen zweiten Beutel hineinstecken: Das ist der Fett-Handschuh. Eine Hand in den Fett-Handschuh, die andere in einen leeren Beutel stecken und beide ins Eiswasser halten. Welche Hand friert zuerst? So hält die Fettschicht den Eisbären warm.', materials: ['Schüssel', 'Eiswürfel', 'Vier Gefrierbeutel', 'Pflanzenfett', 'Löffel'], safety: 'Die Hand nur kurz ins Eiswasser halten und sofort herausnehmen, wenn es wehtut. Ein Erwachsener hilft.' },
      { id: 'shoebox-habitat', title: 'Lebensraum im Schuhkarton', how: 'Einen Lebensraum aussuchen: Meer, Wüste, Regenwald, Eis oder Wald. Den Schuhkarton innen passend anmalen oder bekleben, zum Beispiel mit Sand, Watte als Schnee, Moos und Blättern. Tiere aus Knete oder Papier dazu basteln.', materials: ['Schuhkarton', 'Farben und Pinsel', 'Kleber', 'Watte, Sand, Blätter, Moos', 'Knete oder Papier'], safety: 'Kleinteile wie Sand und Knete nicht in den Mund nehmen. Kleine Kinder dabei begleiten.' },
      { id: 'sort-animals', title: 'Wer wohnt wo?', how: 'Vier große Blätter auslegen und Meer, Wüste, Eis und Wald darauf malen. Spieltiere oder gemalte Tierbilder dem richtigen Lebensraum zuordnen: Wo wohnen Eisbär, Kamel, Fisch, Seestern und Reh? Gemeinsam überlegen, warum.', materials: ['Große Papierbögen', 'Stifte', 'Spieltiere oder Tierbilder'], levels: ['toddler', 'preschool'] },
      { id: 'forest-walk', title: 'Wald-Bewohner suchen', how: 'Im Wald leise sein und genau schauen: Unter Steinen, an Baumrinde und im Laub wohnen viele kleine Tiere. Was entdeckt ihr? Nester oben in den Bäumen? Tiere nur anschauen und wieder an ihren Platz lassen.', materials: ['Lupe', 'Becherlupe', 'Notizblock und Stift'] },
    ],
    words: ['MEER', 'WALD', 'EIS', 'KAMEL', 'SAND', 'FISCH'],
    trip: 'Ein Besuch im Zoo oder Aquarium: Welche Tiere kommen aus dem Eis, der Wüste oder dem Meer? Öffnungszeiten vorher prüfen.',
    sources: [klex('Meer', 'Meer'), klex('Wüste', 'Wüste'), klex('Kamel', 'Kamel'), klex('Regenwald', 'Regenwald'), klex('Eisbär', 'Eisbär'), klex('Wald', 'Wald')],
  },
  {
    id: 'stone-age', title: 'Steinzeit und Eiszeit', emoji: '🦣',
    intro: 'Stell dir vor, es gibt keine Häuser, keine Läden und keine Heizung. Wie haben die Menschen damals gelebt, und wer war das zottelige Riesentier mit den langen Zähnen?',
    facts: [
      { text: 'Die Steinzeit begann vor etwa zweieinhalb Millionen Jahren in Afrika. Das wichtigste Werkzeug war der Faustkeil. Das ist ein Stein, der so zurechtgeschlagen wurde, dass er gut in der Hand liegt. Er war meist aus Feuerstein.', source: 0 },
      { text: 'Die Menschen waren Jäger und Sammler. Sie zogen umher, jagten Tiere und sammelten Beeren, Pilze, Früchte und Wurzeln.', source: 0 },
      { text: 'Zuerst fanden die Menschen Feuer in der Natur, zum Beispiel nach einem Blitz, und passten gut darauf auf. Später konnten sie selbst Feuer machen. Feuer gab Wärme und Licht, damit konnten sie kochen und wilde Tiere verscheuchen.', source: 0 },
      { text: 'Die Menschen malten Bilder an Höhlenwände, vor allem Tiere. Die Farben kamen aus der Natur: Rot aus eisenhaltiger Erde, Gelb aus einer bestimmten Tonerde. Die ältesten Höhlenbilder sind etwa 40.000 Jahre alt.', source: 3 },
      { text: 'In der Eiszeit war es auf der Erde viel kälter als heute. In der letzten kalten Zeit war ungefähr halb Deutschland von Eis bedeckt.', source: 1 },
      { text: 'Das Wollhaarmammut war ein Verwandter der Elefanten. Ein langes Fell und dicke Unterwolle schützten es vor der Kälte. Seine Stoßzähne waren aus Elfenbein. Die Menschen jagten Mammuts und nutzten Fleisch, Knochen und Fell.', source: 2 },
      { text: 'In Höhlen der Schwäbischen Alb hat man sehr alte kleine Figuren gefunden, etwa 40.000 Jahre alt. Viele sind aus Mammut-Elfenbein geschnitzt und zeigen Tiere wie Mammuts und Pferde. Dort fand man auch Flöten aus Knochen.', source: 4 },
    ],
    quiz: [
      { question: 'Woraus war der Faustkeil meistens?', options: ['Aus Feuerstein', 'Aus Plastik', 'Aus Holz'], answer: 0, explain: 'Der Faustkeil war ein Werkzeug aus Stein, meist aus Feuerstein.' },
      { question: 'Was haben die Steinzeitmenschen meistens an die Höhlenwände gemalt?', options: ['Autos', 'Tiere', 'Häuser'], answer: 1, explain: 'Auf den Höhlenbildern sind vor allem Tiere zu sehen.' },
      { question: 'Was hat das Mammut vor der Kälte geschützt?', options: ['Eine Jacke', 'Ein Feuer', 'Ein langes, dickes Fell'], answer: 2, explain: 'Langes Fell und dicke Unterwolle hielten das Mammut warm.' },
    ],
    missions: [
      { id: 'cave-painting', title: 'Höhlenmalerei wie in der Steinzeit', how: 'Im Garten etwas Erde, Lehm oder Sand sammeln und in Schälchen mit wenig Wasser zu Matschfarbe verrühren. Packpapier an die Wand oder unter den Tisch kleben (wie eine Höhlenwand) und mit Fingern, Stöckchen oder Moos Tiere malen. Auch Handabdrücke gehen gut.', materials: ['Packpapier', 'Erde, Lehm oder Sand', 'Wasser', 'Schälchen', 'Stöckchen oder Moos', 'Alte Kleidung'] },
      { id: 'tool-hunt', title: 'Werkzeug aus der Natur', how: 'Im Wald oder Garten Steine, Stöcke und Rinde suchen. Welcher Stein liegt gut in der Hand? Kann man mit einem Stein eine Nuss knacken oder mit einem Stock in der Erde graben? Die besten Fundstücke auf ein Tuch legen und vergleichen.', materials: ['Steine', 'Stöcke', 'Nüsse', 'Ein altes Tuch'], safety: 'Steine nur vorsichtig benutzen, nicht werfen und nicht gegeneinander schlagen: Splitter können scharf sein. Nüsse nicht an Kinder mit Nussallergie geben und kleinen Kindern keine ganzen Nüsse zum Essen geben (Verschluckungsgefahr).' },
      { id: 'ice-rescue', title: 'Rettet die Tiere aus dem Eis', how: 'Am Vortag kleine Spieltiere in einer Dose mit Wasser einfrieren. Dann den Eisblock in eine Schüssel legen und die Tiere mit lauwarmem Wasser, Löffeln und Salz befreien. Wie lange dauert es, bis das Eis schmilzt?', materials: ['Dose oder Becher', 'Kleine Spieltiere', 'Gefrierfach', 'Schüssel', 'Löffel', 'Salz', 'Lauwarmes Wasser'], safety: 'Kleine Spielfiguren sind für Zweijährige nur unter Aufsicht geeignet. Nur lauwarmes, nicht heißes Wasser verwenden. Salz nicht in die Augen reiben.' },
      { id: 'mammoth-fur', title: 'Warm wie ein Mammut', how: 'Zwei Eiswürfel auf Teller legen. Einen mit einem dicken Wollschal oder Fell-Rest zudecken, den anderen nicht. Nach einer halben Stunde nachschauen: Welcher ist mehr geschmolzen? Fell hält die Kälte draußen und die Wärme drinnen, beim Mammut genauso.', materials: ['Eiswürfel', 'Zwei Teller', 'Wollschal oder Stoffrest'], levels: ['preschool', 'reader', 'school'] },
    ],
    words: ['MAMMUT', 'EIS', 'FELL', 'FEUER', 'HÖHLE'],
    trip: 'Ein Museum für Ur- und Frühgeschichte oder ein Steinzeit-Freilichtmuseum besuchen: Dort kann man oft Werkzeuge und Figuren aus der Steinzeit sehen. Öffnungszeiten vorher prüfen.',
    sources: [
      klex('Steinzeit', 'Steinzeit'),
      klex('Eiszeit', 'Eiszeit'),
      klex('Mammut', 'Mammut'),
      klex('Höhlenmalerei', 'Höhlenmalerei'),
      wiki('Höhlen und Eiszeitkunst der Schwäbischen Alb', 'Höhlen_und_Eiszeitkunst_der_Schwäbischen_Alb'),
    ],
  },
  {
    id: 'romans', title: 'Die Römer', emoji: '🏛️',
    intro: 'Vor langer Zeit marschierten Soldaten mit Helm und Schild sogar durch den Süden von Deutschland. Wer waren diese Römer, und warum schrieben sie Zahlen mit Buchstaben?',
    facts: [
      { text: 'Rom war am Anfang eine kleine Stadt in Italien. Nach und nach eroberten die Römer ein riesiges Reich rund um das Mittelmeer.', source: 0 },
      { text: 'Die Römer bauten lange Straßen. Darauf konnten Händler ihre Waren bringen und Soldaten schnell weiterziehen. Einige Römerstraßen gibt es heute noch.', source: 0 },
      { text: 'Die Römer bauten besondere Brücken, die Aquädukte. Darüber floss Trinkwasser aus den Bergen in die Städte.', source: 0 },
      { text: 'Vor etwa 2000 Jahren bauten die Römer eine lange Grenze, den Limes. Ein Teil davon lief durch den Süden von Deutschland. Auf Wachtürmen standen Soldaten. Sie warnten sich gegenseitig mit Trompeten, Rauch oder Fackeln.', source: 1 },
      { text: 'Ein Legionär war ein römischer Soldat. Er hatte einen Helm, einen großen Schild aus Holz und ein kurzes Schwert. In einer Legion waren oft mehrere tausend Soldaten.', source: 4 },
      { text: 'Die Römer hatten große Badehäuser, die Thermen. Es gab einen kalten, einen lauwarmen und einen heißen Raum. Unter dem Boden strömte heiße Luft und machte ihn warm. In den Thermen traf man sich auch zum Plaudern.', source: 3 },
      { text: 'Die Römer schrieben Zahlen mit Zeichen: I ist 1, V ist 5 und X ist 10. Steht das I vor dem V, wird es abgezogen: IV ist 4. Eine Null gab es nicht.', source: 2 },
    ],
    quiz: [
      { question: 'Welche Zahl ist das römische V?', options: ['1', '5', '10'], answer: 1, explain: 'Bei den Römern war I die 1, V die 5 und X die 10.' },
      { question: 'Wie haben sich die Soldaten auf den Wachtürmen am Limes gewarnt?', options: ['Mit dem Telefon', 'Mit Trompeten, Rauch oder Fackeln', 'Mit Briefen per Post'], answer: 1, explain: 'Die Wachtürme gaben Alarm mit Trompeten, Rauch oder Fackeln weiter.' },
      { question: 'Wozu brauchten die Römer Aquädukte?', options: ['Um Trinkwasser in die Städte zu bringen', 'Um Pferde zu füttern', 'Um Schiffe zu bauen'], answer: 0, explain: 'Über die Aquädukte floss Trinkwasser aus den Bergen in die Städte.' },
    ],
    missions: [
      { id: 'roman-numerals', title: 'Zahlen wie die Römer', how: 'Mit Stöckchen, Strohhalmen oder Zahnstochern römische Zahlen legen: I für 1, II für 2, III für 3, V für 5, X für 10. Danach selbst schreiben und raten lassen. Wer mag, findet römische Zahlen auf einer alten Uhr oder an einem Haus.', materials: ['Stöckchen oder Strohhalme', 'Papier', 'Stifte'], levels: ['preschool', 'reader', 'school'] },
      { id: 'paper-mosaic', title: 'Mosaik aus Papierschnipseln', how: 'Buntes Papier oder alte Zeitschriften in kleine Stücke reißen oder schneiden. Auf ein Blatt ein einfaches Bild vorzeichnen (Fisch, Sonne, Blume) und die Schnipsel dicht an dicht aufkleben. So entsteht ein Bild aus vielen kleinen Teilen, ein Mosaik.', materials: ['Buntes Papier oder alte Zeitschriften', 'Klebestift', 'Ein Blatt Papier', 'Kinderschere'], safety: 'Scheren nur unter Aufsicht. Für Zweijährige lieber nur reißen statt schneiden.' },
      { id: 'clay-tablet', title: 'Schreibtafel aus Knete', how: 'Knete flach auf ein Brettchen drücken. Mit einem Zahnstocher oder dem Stielende eines Löffels Zeichen, römische Zahlen oder den eigenen Namen einritzen. Mit dem Finger glattstreichen und neu schreiben, wie auf einer Schreibtafel.', materials: ['Knete', 'Brettchen oder Deckel', 'Zahnstocher oder Löffelstiel'], safety: 'Zahnstocher sind spitz: nur unter Aufsicht und nicht für Zweijährige. Knete nicht in den Mund nehmen.' },
      { id: 'legion-march', title: 'Marsch der Legion', how: 'Aus einem Pappkarton einen großen Schild basteln und bemalen. Dann im Garten oder Wald im Gleichschritt marschieren und einen Wachturm aus Stühlen oder Ästen bauen. Wer oben Wache hält, gibt mit einer Trommel oder einem Tuch ein Zeichen weiter.', materials: ['Pappkarton', 'Farben', 'Klebeband', 'Topf als Trommel oder ein Tuch'] },
    ],
    words: ['ROM', 'HELM', 'SCHILD', 'TURM', 'BAD'],
    trip: 'Ein Römermuseum, ein nachgebauter Wachturm am Limes oder die Reste eines römischen Bades sind spannende Ausflugsziele. Öffnungszeiten vorher prüfen.',
    sources: [
      klex('Römisches Reich', 'Römisches_Reich'),
      klex('Limes', 'Limes'),
      wiki('Römische Zahlschrift', 'Römische_Zahlschrift'),
      wiki('Thermen', 'Thermen'),
      wiki('Römische Legion', 'Römische_Legion'),
    ],
  },
  {
    id: 'weather', title: 'Wetter', emoji: '🌦️',
    intro: 'Heute Sonne, morgen Regen, im Winter Schnee: Das Wetter ändert sich ständig. Wer steckt dahinter, und wie können wir es selbst beobachten?',
    facts: [
      { text: 'Die Sonne macht das Wetter. Ihre Wärme lässt Wasser aus dem Meer verdunsten. Dann ist das Wasser ein unsichtbarer Dampf. Der Dampf steigt nach oben und wird zu Wolken.', source: 0 },
      { text: 'Wolken bestehen aus winzigen Wassertröpfchen oder Eisstückchen. Werden die Tröpfchen größer, sind sie zu schwer für die Luft und fallen herunter. So entsteht Regen.', source: 1 },
      { text: 'Schnee ist gefrorenes Wasser. Jede Schneeflocke hat in der Mitte ein Sechseck und sechs Zacken. Trotzdem sieht keine Flocke genau aus wie eine andere.', source: 2 },
      { text: 'Wind ist Luft, die sich bewegt. Ein Windsack zeigt, woher der Wind kommt und wie stark er ist: Je waagrechter er hängt, desto stärker weht der Wind.', source: 3 },
      { text: 'Bei einem Gewitter sieht man zuerst den Blitz und hört danach den Donner. Denn Licht ist schneller als Schall. Am sichersten ist man bei Gewitter im Haus. Auch ein Auto schützt.', source: 4 },
      { text: 'Einen Regenbogen gibt es, wenn es regnet und gleichzeitig die Sonne scheint. Dann ist die Sonne hinter uns. Im weißen Sonnenlicht stecken viele Farben, und die Wassertropfen fächern sie auf.', source: 5 },
      { text: 'Mit einem Thermometer misst man, wie warm oder kalt es ist. In manchen Thermometern ist eine Flüssigkeit in einem Röhrchen: Wird es warm, steigt sie nach oben. Wird es kalt, sinkt sie.', source: 6 },
    ],
    quiz: [
      { question: 'Was bemerkt man bei einem Gewitter zuerst?', options: ['Den Blitz', 'Den Donner'], answer: 0, explain: 'Licht ist schneller als Schall. Darum sieht man erst den Blitz und hört danach den Donner.' },
      { question: 'Wo ist die Sonne, wenn du einen Regenbogen siehst?', options: ['Vor mir', 'Hinter mir'], answer: 1, explain: 'Wenn wir einen Regenbogen sehen, ist die Sonne hinter uns.' },
      { question: 'Wie viele Zacken hat eine Schneeflocke?', options: ['Vier', 'Sechs', 'Acht'], answer: 1, explain: 'Jede Schneeflocke hat sechs Zacken, aber keine sieht genau aus wie eine andere.' },
    ],
    missions: [
      { id: 'rain-gauge', title: 'Regenmesser bauen', how: 'Ein Erwachsener schneidet von einer Plastikflasche oben ein Stück ab. Das obere Stück umgedreht als Trichter hineinstecken. Mit Lineal und Stift Striche außen anmalen. Die Flasche draußen fest hinstellen, zum Beispiel zwischen Steine. Nach jedem Regen nachschauen: Bis zu welchem Strich ist das Wasser gestiegen? Danach ausleeren.', materials: ['Leere Plastikflasche', 'Schere', 'Lineal', 'Wasserfester Stift', 'Ein paar Steine'], safety: 'Das Schneiden der Flasche übernimmt ein Erwachsener. Die Schnittkante kann scharf sein.' },
      { id: 'weather-diary', title: 'Wettertagebuch für eine Woche', how: 'Jeden Tag zur gleichen Zeit aus dem Fenster oder nach draußen schauen. Ein Bild malen: Sonne, Wolken, Regen, Schnee oder Wind? Wer mag, liest am Thermometer ab und schreibt die Zahl dazu. Am Ende der Woche vergleichen: Welches Wetter gab es am meisten?', materials: ['Papier oder Heft', 'Buntstifte', 'Thermometer (wenn vorhanden)'] },
      { id: 'wind-sock', title: 'Windsack basteln', how: 'Eine leere Klopapierrolle bunt bemalen. Unten lange Streifen aus Krepppapier ankleben. Oben ein Stück Schnur befestigen und an einen Stock oder Ast binden. Draußen beobachten: Hängen die Streifen schlapp nach unten oder fliegen sie fast waagrecht? In welche Richtung zeigen sie?', materials: ['Klopapierrolle', 'Krepppapier', 'Kleber', 'Schnur', 'Stock'], levels: ['toddler', 'preschool', 'reader'] },
      { id: 'glass-rainbow', title: 'Regenbogen im Wasserglas', how: 'An einem sonnigen Tag ein Glas randvoll mit Wasser auf die Fensterbank in die Sonne stellen. Ein weißes Blatt Papier auf den Boden oder vor das Glas legen. Das Glas etwas verschieben, bis bunte Streifen auf dem Papier erscheinen. Welche Farben findest du?', materials: ['Glas mit Wasser', 'Weißes Papier', 'Sonnenschein'], safety: 'Glas kann zerbrechen. Kleine Kinder nur mit Hilfe eines Erwachsenen. Nie direkt in die Sonne schauen.' },
    ],
    words: ['SONNE', 'REGEN', 'WIND', 'WOLKE', 'SCHNEE', 'BLITZ'],
    trip: 'Eine Wetterstation oder ein Wetterlehrpfad in der Nähe suchen: Dort kann man Messgeräte für Regen, Wind und Wärme anschauen. Öffnungszeiten vorher prüfen.',
    sources: [
      klex('Wetter', 'Wetter'),
      klex('Regen', 'Regen'),
      klex('Schnee', 'Schnee'),
      klex('Wind', 'Wind'),
      klex('Gewitter', 'Gewitter'),
      klex('Regenbogen', 'Regenbogen'),
      klex('Thermometer', 'Thermometer'),
    ],
  },
  {
    id: 'electricity', title: 'Strom und Licht', emoji: '💡',
    intro: 'Ein Knopfdruck, und die Lampe leuchtet. Aber was fließt da eigentlich durch das Kabel, und warum muss man mit Strom so vorsichtig sein?',
    facts: [
      { text: 'Strom fließt, wenn sich winzige Teilchen, die Elektronen, alle in eine Richtung bewegen. Zum Beispiel in einem Kabel aus Kupfer.', source: 0 },
      { text: 'Strom fließt im Kreis: von der Batterie durch ein Kabel zur Lampe und durch ein zweites Kabel zurück zur Batterie. Das heißt Stromkreis. Ein Schalter unterbricht den Kreis, dann geht die Lampe aus.', source: 0 },
      { text: 'Eine Batterie hat zwei Pole, einen Pluspol und einen Minuspol. Verbindet man sie über eine Lampe, fließt Strom. Leere Batterien gehören nicht in den Hausmüll, sondern zu einer Sammelstelle.', source: 1 },
      { text: 'Metall und Wasser leiten Strom besonders gut weiter. Wenn man bestimmte Dinge aneinander reibt, laden sie sich elektrisch auf. Darum stehen einem Kind auf der Rutsche manchmal die Haare zu Berge.', source: 2 },
      { text: 'Strom aus der Steckdose ist so stark, dass Anfassen lebensgefährlich ist. Die Steckdose hat 230 Volt. Eine normale Batterie hat höchstens 9 Volt.', source: 2 },
      { text: 'Stoffe, die Strom nicht leiten, heißen Nichtleiter. Kunststoff und Glas sind Nichtleiter. Darum steckt ein Kabel in einer Hülle aus Kunststoff. Trockenes Holz leitet kaum, nasses Holz aber schon.', source: 3 },
      { text: 'In einer Glühbirne glüht ein dünner Faden und leuchtet. Nur ganz wenig Strom wird dabei zu Licht, der Rest wird zu Wärme. Darum wird sie heiß. Eine LED-Lampe macht viel mehr Licht aus dem Strom und braucht darum viel weniger Strom.', source: 4 },
    ],
    quiz: [
      { question: 'Was leitet Strom?', options: ['Ein Löffel aus Metall', 'Ein Glas'], answer: 0, explain: 'Metall leitet Strom gut. Glas ist ein Nichtleiter.' },
      { question: 'Welche Lampe braucht weniger Strom?', options: ['Die Glühbirne', 'Die LED-Lampe'], answer: 1, explain: 'Die Glühbirne macht aus dem Strom vor allem Wärme. Die LED-Lampe macht viel mehr Licht daraus und braucht weniger Strom.' },
      { question: 'Darf man in eine Steckdose fassen?', options: ['Ja, kurz', 'Nein, niemals'], answer: 1, explain: 'Strom aus der Steckdose ist so stark, dass Anfassen lebensgefährlich ist.' },
    ],
    missions: [
      { id: 'lamp-circuit', title: 'Ein Lämpchen zum Leuchten bringen', how: 'Das Lämpchen in die Fassung drehen. Ein Kabel vom einen Anschluss der Fassung zum einen Streifen der Flachbatterie führen, das zweite Kabel vom anderen Anschluss zum anderen Streifen. Leuchtet es? Dann ist der Stromkreis geschlossen. Ein Kabel lösen: Das Licht geht aus.', materials: ['Flachbatterie 4,5 Volt', 'Lämpchen mit Fassung (passend für 4,5 Volt)', '2 Kabel mit Krokodilklemmen'], levels: ['preschool', 'reader', 'school'], safety: 'Nur mit einer Flachbatterie 4,5 V arbeiten, niemals mit der Steckdose. Die beiden Batteriestreifen nie direkt mit Metall verbinden, sonst wird die Batterie heiß. Lämpchen sind Kleinteile: nicht für Kinder unter 3 Jahren ohne Aufsicht.' },
      { id: 'conductor-test', title: 'Leiter oder Nichtleiter?', how: 'Den Stromkreis mit Lämpchen bauen, aber an einer Stelle eine Lücke lassen: Zwei Kabelenden hängen frei. Nun verschiedene Dinge zwischen die beiden Enden halten: Löffel aus Metall, Holzlöffel, Alufolie, Plastikbecher, Radiergummi. Leuchtet das Lämpchen? Zwei Häufchen machen: leitet und leitet nicht.', materials: ['Flachbatterie 4,5 Volt', 'Lämpchen mit Fassung', '3 Kabel mit Krokodilklemmen', 'Metalllöffel', 'Holzlöffel', 'Alufolie', 'Plastikbecher'], levels: ['preschool', 'reader', 'school'], safety: 'Nur mit einer Flachbatterie 4,5 V arbeiten, niemals mit der Steckdose. Die Batteriestreifen nie direkt miteinander verbinden. Ein Erwachsener ist dabei.' },
      { id: 'balloon-static', title: 'Zauberballon', how: 'Einen aufgeblasenen Luftballon an den Haaren oder an einem Wollpullover reiben. Dann den Ballon langsam über den Kopf halten: Die Haare stehen hoch! Danach den geriebenen Ballon über kleine Papierschnipsel halten. Was passiert?', materials: ['Luftballon', 'Papierschnipsel', 'Wollpullover (wenn vorhanden)'], safety: 'Ein Erwachsener bläst den Ballon auf. Geplatzte Ballonstücke sofort wegräumen: Kleine Kinder können daran ersticken.' },
      { id: 'power-saver', title: 'Strom-Spar-Detektive', how: 'Gemeinsam durch die Wohnung gehen: Wo brennt Licht, obwohl niemand im Zimmer ist? Lampen gemeinsam mit dem Lichtschalter ausmachen. Welche Lampen sind LED-Lampen? Nur schauen, nichts aufschrauben.', materials: ['Offene Augen'], safety: 'Kinder fassen keine Steckdosen, Stecker oder Kabel an. Lampen nicht berühren, sie können heiß sein.' },
    ],
    words: ['STROM', 'LAMPE', 'KABEL', 'LICHT', 'BATTERIE'],
    trip: 'Ein Technikmuseum oder Science-Center mit Mitmach-Stationen zu Strom besuchen. Öffnungszeiten vorher prüfen.',
    sources: [
      klex('Stromkreis', 'Stromkreis'),
      klex('Batterie', 'Batterie'),
      klex('Elektrizität', 'Elektrizität'),
      wiki('Nichtleiter', 'Nichtleiter'),
      klex('Glühlampe', 'Glühlampe'),
    ],
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

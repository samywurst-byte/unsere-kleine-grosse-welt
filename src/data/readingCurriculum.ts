/**
 * Lehrplan Lesen (Version 1). Fester, geprüfter Inhalt im Code; der Lernstand jedes Kindes liegt in der Datenbank.
 * Die Stufen sind eine Lernarchitektur, keine normierten diagnostischen Entwicklungsstufen.
 * Ids sind dauerhaft: einmal vergeben, nie umbenennen, sonst passen gespeicherte Beobachtungen nicht mehr.
 */

export interface ReadingStage {
  id: number;
  title: string;
  description: string;
  /** In dieser Version mit Lernzielen hinterlegt. Spätere Stufen sind ehrlich als "folgt" markiert. */
  available: boolean;
}

export const READING_STAGES: ReadingStage[] = [
  { id: 1, title: 'Reimen und Silben', description: 'Reime hören, Silben klatschen.', available: true },
  { id: 2, title: 'Laute hören', description: 'Anfangslaute hören, Laute nachsprechen.', available: true },
  { id: 3, title: 'Buchstaben und Laute', description: 'Jeder Buchstabe groß und klein mit seinem Laut.', available: true },
  { id: 4, title: 'Laute verbinden', description: 'Zwei Laute zusammenziehen: M und A ergibt MA.', available: true },
  { id: 5, title: 'Silben lesen', description: 'Einfache offene Silben wie MA, MI, SO lesen.', available: true },
  { id: 6, title: 'Lautgetreue Wörter', description: 'Kurze Wörter aus bekannten Buchstaben lesen und lautierend schreiben.', available: true },
  { id: 7, title: 'Einfache Sätze', description: 'Kurze Sätze lesen, kleine Wörter auf einen Blick erkennen, einen Satz schreiben.', available: true },
  { id: 8, title: 'Leseflüssigkeit', description: 'Kurze Texte mit Silbenbögen mehrmals lesen, bis es flüssiger klingt.', available: true },
  { id: 9, title: 'Textverständnis', description: 'Einen kurzen Text lesen und Fragen dazu beantworten.', available: true },
  { id: 10, title: 'Längere Texte', description: 'Zunehmend komplexe Texte.', available: false },
];

export interface LetterInfo {
  /** Großschreibung, z. B. "M", "SCH", "Ä". */
  upper: string;
  lower: string;
  /** Beispielwort mit diesem Anlaut, kindgerecht. */
  word: string;
  emoji: string;
  /** Lautverbindung (SCH, EI ...) statt Einzelbuchstabe. */
  combo?: boolean;
}

/**
 * Reihenfolge so gewählt, dass früh sinnvolle Silben entstehen (M, A, I, O, L, S, E, N ...).
 * Sobald die Buchstabenfolge der Grundschule bekannt ist, wird diese Liste angepasst.
 */
export const LETTERS: LetterInfo[] = [
  { upper: 'M', lower: 'm', word: 'Maus', emoji: '🐭' },
  { upper: 'A', lower: 'a', word: 'Affe', emoji: '🐒' },
  { upper: 'I', lower: 'i', word: 'Igel', emoji: '🦔' },
  { upper: 'O', lower: 'o', word: 'Ofen', emoji: '🔥' },
  { upper: 'L', lower: 'l', word: 'Löwe', emoji: '🦁' },
  { upper: 'S', lower: 's', word: 'Sonne', emoji: '☀️' },
  { upper: 'E', lower: 'e', word: 'Esel', emoji: '🫏' },
  { upper: 'N', lower: 'n', word: 'Nase', emoji: '👃' },
  { upper: 'T', lower: 't', word: 'Tomate', emoji: '🍅' },
  { upper: 'R', lower: 'r', word: 'Rakete', emoji: '🚀' },
  { upper: 'U', lower: 'u', word: 'Uhu', emoji: '🦉' },
  { upper: 'D', lower: 'd', word: 'Dino', emoji: '🦕' },
  { upper: 'W', lower: 'w', word: 'Wal', emoji: '🐳' },
  { upper: 'F', lower: 'f', word: 'Fuchs', emoji: '🦊' },
  { upper: 'H', lower: 'h', word: 'Hase', emoji: '🐰' },
  { upper: 'K', lower: 'k', word: 'Katze', emoji: '🐱' },
  { upper: 'B', lower: 'b', word: 'Ball', emoji: '⚽' },
  { upper: 'G', lower: 'g', word: 'Gabel', emoji: '🍴' },
  { upper: 'P', lower: 'p', word: 'Pilz', emoji: '🍄' },
  { upper: 'Z', lower: 'z', word: 'Zebra', emoji: '🦓' },
  { upper: 'J', lower: 'j', word: 'Jacke', emoji: '🧥' },
  { upper: 'V', lower: 'v', word: 'Vogel', emoji: '🐦' },
  { upper: 'Ä', lower: 'ä', word: 'Äpfel', emoji: '🍎' },
  { upper: 'Ö', lower: 'ö', word: 'Öl', emoji: '🫒' },
  { upper: 'Ü', lower: 'ü', word: 'Überraschung', emoji: '🎁' },
  { upper: 'EI', lower: 'ei', word: 'Eis', emoji: '🍦', combo: true },
  { upper: 'AU', lower: 'au', word: 'Auto', emoji: '🚗', combo: true },
  { upper: 'SCH', lower: 'sch', word: 'Schaf', emoji: '🐑', combo: true },
  { upper: 'CH', lower: 'ch', word: 'Drache', emoji: '🐉', combo: true },
  { upper: 'EU', lower: 'eu', word: 'Eule', emoji: '🦉', combo: true },
  { upper: 'IE', lower: 'ie', word: 'Biene', emoji: '🐝', combo: true },
  { upper: 'ST', lower: 'st', word: 'Stern', emoji: '⭐', combo: true },
  { upper: 'SP', lower: 'sp', word: 'Spinne', emoji: '🕷️', combo: true },
  { upper: 'PF', lower: 'pf', word: 'Pferd', emoji: '🐴', combo: true },
  { upper: 'ß', lower: 'ß', word: 'Fuß', emoji: '🦶' },
  { upper: 'C', lower: 'c', word: 'Clown', emoji: '🤡' },
  { upper: 'Y', lower: 'y', word: 'Yak', emoji: '🐃' },
  { upper: 'X', lower: 'x', word: 'Xylofon', emoji: '🎶' },
  { upper: 'QU', lower: 'qu', word: 'Qualle', emoji: '🪼', combo: true },
];

export type GoalKind = 'skill' | 'letter';

export interface LearningGoal {
  /** Dauerhafte Id, z. B. "read.letter.M" */
  id: string;
  area: 'reading' | 'math';
  stage: number;
  kind: GoalKind;
  title: string;
  /** Was die Eltern beobachten: konkret und ohne Fachsprache. */
  observe: string;
  /** Aktivitäten für den gemeinsamen Lernblock (am Tablet höchstens wenige Minuten, Rest am Tisch). */
  activities: string[];
  /** Ids, die vorher mindestens "weitgehend sicher" sein sollten. */
  requires: string[];
  /** Nur bei Buchstaben. */
  letter?: LetterInfo;
  /** Freiwilliger Zusatz (großes Einmaleins). */
  optional?: boolean;
}

export const letterGoalId = (upper: string) => `read.letter.${upper}`;

const SKILLS: LearningGoal[] = [
  {
    id: 'read.rhyme', area: 'reading', stage: 1, kind: 'skill', title: 'Reime hören',
    observe: 'Erkennt, ob zwei Wörter sich reimen (Maus – Haus), findet manchmal selbst einen Reim.',
    activities: ['Reimpaare vorsprechen: reimt sich das?', 'Reimwort zu einem Bild finden', 'Ein kurzes Reimgedicht gemeinsam sprechen'],
    requires: [],
  },
  {
    id: 'read.syllables', area: 'reading', stage: 1, kind: 'skill', title: 'Silben klatschen',
    observe: 'Klatscht oder hüpft die Silben eines Wortes (Ba-na-ne) und zählt sie.',
    activities: ['Namen der Familie in Silben klatschen', 'Silben von Tieren hüpfen', 'Gegenstände nach Silbenzahl sortieren'],
    requires: [],
  },
  {
    id: 'read.onset', area: 'reading', stage: 2, kind: 'skill', title: 'Anfangslaute hören',
    observe: 'Hört, mit welchem Laut ein Wort beginnt (Maus beginnt mit „mmm“), auch bei neuen Wörtern.',
    activities: ['Ich sehe was, das beginnt mit „mmm“', 'Bilder nach Anfangslaut sortieren', 'Den eigenen Namen auf den ersten Laut abhören'],
    requires: [],
  },
  {
    id: 'read.blend', area: 'reading', stage: 4, kind: 'skill', title: 'Laute verbinden',
    observe: 'Zieht zwei gehörte Laute zusammen: „mmm – aaa“ wird „ma“. Zuerst nur hörend, ohne Schrift.',
    activities: ['Roboter-Sprache: Mama spricht in Lauten, das Kind sagt das Wort', 'Zwei Buchstabenkarten langsam zusammenschieben', 'Laute auf einer Rutsche zusammenrutschen lassen'],
    requires: ['read.onset', letterGoalId('M'), letterGoalId('A')],
  },
  {
    id: 'read.syllable-reading', area: 'reading', stage: 5, kind: 'skill', title: 'Einfache Silben lesen',
    observe: 'Liest offene Silben aus bekannten Buchstaben selbst (MA, MI, MO, LA, SO), nicht nur auswendig.',
    activities: ['Silbenkarten aus bekannten Buchstaben legen und lesen', 'Silbenteppich: auf die gelesene Silbe springen', 'Neue Silben aus bekannten Buchstaben bauen'],
    requires: ['read.blend', letterGoalId('I'), letterGoalId('O')],
  },
  {
    id: 'read.words', area: 'reading', stage: 6, kind: 'skill', title: 'Kurze Wörter lesen',
    observe: 'Liest kurze, lautgetreue Wörter aus bekannten Buchstaben selbst (Oma, Sofa, Nase), Silbe für Silbe, und weiß dann, was gemeint ist.',
    activities: ['Wortkarten lesen und das passende Bild suchen', 'Lesen und malen: ein Wort lesen, dann ein Bild dazu malen', 'Dinge in der Wohnung mit Wortkarten beschriften'],
    requires: ['read.syllable-reading'],
  },
  {
    id: 'read.write-copy', area: 'reading', stage: 6, kind: 'skill', title: 'Wörter abschreiben',
    observe: 'Schreibt ein kurzes Wort Buchstabe für Buchstabe richtig ab, in der Lineatur und ohne Buchstaben auszulassen.',
    activities: ['Einkaufszettel abschreiben', 'Namen der Familie abschreiben', 'Wortkarte anschauen, umdrehen, aus dem Kopf schreiben, vergleichen'],
    requires: ['read.blend'],
  },
  {
    id: 'read.write-sounds', area: 'reading', stage: 6, kind: 'skill', title: 'Schreiben, was man hört',
    observe: 'Spricht ein Wort langsam und schreibt für jeden gehörten Laut einen Buchstaben (Lautkästchen). Fehler wie „Fata“ statt „Vater“ sind in diesem Alter richtig und gewollt.',
    activities: ['Lautkästchen: für jeden Laut ein Kästchen, dann den Buchstaben hinein', 'Wörter mit Buchstabenkarten legen', 'Ein Wort in Zeitlupe sprechen und dabei die Laute an den Fingern zählen'],
    requires: ['read.onset', 'read.blend'],
  },
  {
    id: 'read.sight-words', area: 'reading', stage: 7, kind: 'skill', title: 'Kleine Wörter auf einen Blick',
    observe: 'Erkennt häufige kleine Wörter (und, ist, das, der, die, ein) sofort, ohne sie zu erlesen.',
    activities: ['Wörterjagd: in einem Bilderbuch alle „und“ suchen', 'Blitzlesen mit Wortkarten', 'Kleine-Wörter-Memory'],
    requires: ['read.words'],
  },
  {
    id: 'read.sentences', area: 'reading', stage: 7, kind: 'skill', title: 'Kurze Sätze lesen',
    observe: 'Liest einen kurzen Satz aus bekannten Wörtern und kann sagen, was darin steht, zum Beispiel ob „Ein Esel kann malen.“ stimmt.',
    activities: ['Stimmt das? Unsinnsätze lesen und lachen', 'Lesen und malen: einen Satz lesen und ein Bild dazu malen', 'Zettelpost: kurze Sätze an den Kühlschrank kleben'],
    requires: ['read.words'],
  },
  {
    id: 'read.write-sentence', area: 'reading', stage: 7, kind: 'skill', title: 'Einen Satz schreiben',
    observe: 'Schreibt einen kurzen eigenen Satz lautierend auf (Großschreibung am Anfang, Punkt am Ende) und liest ihn selbst wieder vor.',
    activities: ['Einen Satz zu einem selbst gemalten Bild schreiben', 'Postkarte an Oma oder Opa schreiben', 'Entdeckerbuch: den Satz des Tages selbst aufschreiben'],
    requires: ['read.write-sounds'],
  },
  {
    id: 'read.fluency', area: 'reading', stage: 8, kind: 'skill', title: 'Flüssiger lesen',
    observe: 'Liest einen kurzen bekannten Text mit Silbenbögen beim dritten Mal deutlich flüssiger als beim ersten Mal und macht an den Punkten eine kleine Pause.',
    activities: ['Denselben kurzen Text an drei Tagen vorlesen', 'Echo-Lesen: Mama liest einen Satz vor, das Kind liest ihn nach', 'Kuscheltieren vorlesen'],
    requires: ['read.sentences', 'read.sight-words'],
  },
  {
    id: 'read.comprehension', area: 'reading', stage: 9, kind: 'skill', title: 'Fragen zum Text beantworten',
    observe: 'Liest einen kurzen Text und beantwortet einfache Fragen dazu (Wer? Wo? Was passiert?), ohne alles noch einmal laut zu lesen.',
    activities: ['Lesen und ankreuzen: Fragen zum Text', 'Nach dem Lesen das Wichtigste in einem Satz erzählen', 'Zum Text ein Bild malen, das alle Einzelheiten zeigt'],
    requires: ['read.fluency'],
  },
];

const LETTER_GOALS: LearningGoal[] = LETTERS.map((l) => ({
  id: letterGoalId(l.upper),
  area: 'reading',
  stage: 3,
  kind: 'letter',
  title: `${l.upper} und ${l.lower}`,
  observe: `Erkennt ${l.upper} und ${l.lower} unter anderen Buchstaben und sagt dazu den Laut (nicht den Buchstabennamen).`,
  activities: [
    `Den Laut von ${l.upper} hören und nachsprechen (wie in ${l.word} ${l.emoji})`,
    `${l.upper} und ${l.lower} unter anderen Buchstaben finden`,
    `${l.upper} mit dem Finger nachfahren oder in Sand malen`,
    `Ein Wort finden, das mit ${l.upper} beginnt`,
  ],
  requires: [],
  letter: l,
}));

export const READING_GOALS: LearningGoal[] = [...SKILLS.filter((g) => g.stage < 3), ...LETTER_GOALS, ...SKILLS.filter((g) => g.stage > 3)];
export const GOALS_BY_ID = new Map(READING_GOALS.map((g) => [g.id, g]));
export const LETTER_ORDER = LETTER_GOALS.map((g) => g.id);

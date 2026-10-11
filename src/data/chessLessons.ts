import type { Board, ChessExercise, PieceCode } from '../services/chessAcademy';

/**
 * Schachakademie, Grundkurs Welt 1. Lektions-Ids sind dauerhaft (Fortschritt hängt daran).
 * Alles wird vorgelesen; Taro muss nicht lesen können. „Mama lernt mit“ erklärt die Regel in einer Minute.
 */

export interface ChessFigure { name: string; piece: PieceCode }

export interface ChessLesson {
  id: string;
  week: number;
  title: string;
  figure: ChessFigure;
  badge: { emoji: string; name: string };
  /** Gesprochene Einführung der Figur. */
  intro: string;
  /** Vorführung: Die Figur zeigt ihre Felder und läuft einen Weg ab. */
  demo?: { board: Board; stones?: string[]; square: string; path: string[]; say: string };
  /** Übungen; die letzte ist die Abschlussaufgabe. */
  exercises: ChessExercise[];
  /** Für Mama und Papa: die Regel in einer Minute. */
  mama: string[];
  /** Vorschlag für das echte Brett. */
  realBoard: string;
}

const THEO: ChessFigure = { name: 'Theo, der Turm', piece: 'wR' };
const LEO: ChessFigure = { name: 'Leo, der Läufer', piece: 'wB' };
const DANA: ChessFigure = { name: 'Dana, die Dame', piece: 'wQ' };
const PAUL: ChessFigure = { name: 'Paul, das Pferd', piece: 'wN' };

const ROOK_HINT = 'Der Turm läuft nur geradeaus: nach oben, nach unten, nach rechts oder nach links. Niemals schräg.';
const BISHOP_HINT = 'Der Läufer läuft nur schräg, wie ein X. Und er bleibt immer auf seiner Farbe.';
const QUEEN_HINT = 'Die Dame läuft geradeaus wie der Turm oder schräg wie der Läufer. Aber nicht um die Ecke.';
const KNIGHT_HINT = 'Das Pferd hüpft wie ein L: zwei Felder geradeaus und dann eins zur Seite.';
const STONE_HINT = 'Über Steine kann die Figur nicht drüber. Nur das Pferd kann springen.';

export const CHESS_LESSONS: ChessLesson[] = [
  {
    id: 'board', week: 1, title: 'Das Schachbrett entdecken', figure: THEO, badge: { emoji: '🗺️', name: 'Brett-Entdecker' },
    intro: 'Hallo! Ich bin Theo, der Turm. Willkommen in der Schachburg! Das ist unser Schachbrett. Es hat helle und dunkle Felder, immer abwechselnd. Und rechts unten ist immer ein helles Feld.',
    exercises: [
      { kind: 'tap', say: 'Tippe auf ein helles Feld.', hint: 'Hell sind die Felder mit der hellen Farbe. Probier ein anderes.', targets: 'light', all: false },
      { kind: 'tap', say: 'Und jetzt auf ein dunkles Feld.', hint: 'Dunkel sind die Felder mit der dunklen Farbe.', targets: 'dark', all: false },
      { kind: 'tap', say: 'Das Brett hat vier Ecken. Tippe auf alle vier Ecken.', hint: 'Die Ecken sind ganz außen, wo zwei Ränder zusammenkommen.', targets: ['a1', 'h1', 'a8', 'h8'], all: true },
      { kind: 'tap', say: 'Tippe auf das Feld rechts unten. Welche Farbe hat es?', hint: 'Rechts unten, in der Ecke bei deiner rechten Hand.', targets: ['h1'], noMirror: true },
      { kind: 'tap', say: 'So stehen alle Figuren am Anfang. Tippe auf den weißen König. Er hat ein Kreuz auf dem Kopf.', hint: 'Der König ist die größte Figur und hat ein Kreuz oben drauf.', start: true, targets: ['e1'] },
      { kind: 'tap', say: 'Wo wohne ich, Theo der Turm? Tippe auf beide weißen Türme in den Ecken.', hint: 'Die Türme stehen ganz außen in den Ecken, unten bei Weiß.', start: true, targets: ['a1', 'h1'], all: true },
    ],
    mama: [
      'Das Brett hat 64 Felder: 8 Reihen und 8 Spalten. Es liegt immer so, dass rechts unten ein helles Feld ist (Merksatz: „Hell rechts“).',
      'Die Spalten heißen a bis h, die Reihen 1 bis 8. Weiß beginnt unten und macht immer den ersten Zug.',
      'Grundstellung: Türme in die Ecken, daneben die Springer, dann die Läufer. Die weiße Dame steht auf dem hellen Feld d1 („Die Dame steht auf ihrer Farbe“), der König daneben auf e1. Davor eine Reihe Bauern.',
    ],
    realBoard: 'Legt das echte Brett so hin, dass rechts unten ein helles Feld ist. Taro darf die Türme in die vier Ecken stellen und jede Ecke antippen.',
  },
  {
    id: 'rook', week: 1, title: 'Der Turm und seine Schätze', figure: THEO, badge: { emoji: '🏰', name: 'Turm-Profi' },
    intro: 'Ich bin Theo, der Turm. Ich laufe geradeaus: nach oben, nach unten, nach rechts und nach links. So weit ich will. Aber niemals schräg!',
    demo: { board: { d4: 'wR' }, square: 'd4', path: ['d7', 'a7'], say: 'Schau mal: Auf alle grünen Punkte kann ich ziehen. Ich laufe nach oben, und dann zur Seite.' },
    exercises: [
      { kind: 'moves', say: 'Tippe auf fünf Felder, auf die Theo ziehen kann.', hint: ROOK_HINT, board: { a1: 'wR' }, square: 'a1', count: 5 },
      { kind: 'collect', say: 'Hilf Theo, die drei Sterne einzusammeln! Tippe erst auf den Turm und dann auf das Feld, wohin er soll.', hint: ROOK_HINT, board: { a1: 'wR' }, stars: ['a6', 'f6', 'f2'] },
      { kind: 'moves', say: 'Hier liegen Steine. Über Steine kann Theo nicht drüber. Tippe auf vier Felder, die er erreicht.', hint: STONE_HINT, board: { d4: 'wR' }, stones: ['d6', 'b4', 'f4'], square: 'd4', count: 4 },
      { kind: 'collect', say: 'Sammle alle Sterne ein. Pass auf die Steine auf!', hint: STONE_HINT, board: { a1: 'wR' }, stones: ['a4', 'd3'], stars: ['a3', 'c6', 'h6'] },
      { kind: 'collect', say: 'Abschlussaufgabe: Sammle die drei Sterne mit möglichst wenigen Zügen.', hint: ROOK_HINT, board: { h8: 'wR' }, stars: ['h2', 'b2', 'b7'] },
    ],
    mama: [
      'Der Turm zieht waagerecht oder senkrecht beliebig viele Felder, solange nichts im Weg steht. Über andere Figuren springen kann er nicht.',
      'Eine gegnerische Figur schlägt er, indem er auf ihr Feld zieht; sie wird dann vom Brett genommen. Eigene Figuren schlägt man nie.',
      'Später kommt noch die Rochade dazu, ein Sonderzug von König und Turm. Das braucht Taro jetzt noch nicht.',
    ],
    realBoard: 'Stellt einen weißen Turm auf a1 und legt drei Münzen auf a6, f6 und f2. Taro sammelt sie ein, ihr zählt gemeinsam die Züge.',
  },
  {
    id: 'bishop', week: 2, title: 'Der Läufer läuft schräg', figure: LEO, badge: { emoji: '↗️', name: 'Läufer-Profi' },
    intro: 'Hallo, ich bin Leo, der Läufer. Ich laufe immer schräg, so weit ich will. Darum bleibe ich immer auf meiner Farbe.',
    demo: { board: { c1: 'wB' }, square: 'c1', path: ['f4', 'd6'], say: 'Schau: Ich laufe schräg nach oben, und dann schräg zurück. Ich bleibe immer auf den dunklen Feldern.' },
    exercises: [
      { kind: 'moves', say: 'Tippe auf fünf Felder, auf die Leo ziehen kann.', hint: BISHOP_HINT, board: { d4: 'wB' }, square: 'd4', count: 5 },
      { kind: 'collect', say: 'Leo möchte die drei Sterne holen. Hilfst du ihm?', hint: BISHOP_HINT, board: { c1: 'wB' }, stars: ['e3', 'g5', 'd8'] },
      { kind: 'tap', say: 'Leo steht auf einem dunklen Feld. Tippe auf ein Feld, auf das er niemals kommen kann.', hint: 'Leo bleibt immer auf seiner Farbe. Such ein Feld mit der anderen Farbe.', board: { c1: 'wB' }, targets: 'light', noMirror: true },
      { kind: 'moves', say: 'Steine versperren den Weg. Tippe auf vier Felder, die Leo erreicht.', hint: STONE_HINT, board: { e4: 'wB' }, stones: ['c6', 'g2'], square: 'e4', count: 4 },
      { kind: 'collect', say: 'Abschlussaufgabe: Sammle alle Sterne ein.', hint: BISHOP_HINT, board: { f1: 'wB' }, stars: ['b5', 'e8', 'h5'] },
    ],
    mama: [
      'Der Läufer zieht schräg (diagonal) beliebig weit, aber nicht über andere Figuren.',
      'Jeder Spieler hat zwei Läufer: einen auf hellen und einen auf dunklen Feldern. Ein Läufer wechselt nie die Feldfarbe, deshalb kann er nur die Hälfte des Bretts erreichen.',
    ],
    realBoard: 'Stellt einen Läufer auf c1. Fragt Taro: „Auf welcher Farbe steht er? Kann er auf ein helles Feld?“ Dann Münzen auf e3, g5 und d8 einsammeln.',
  },
  {
    id: 'rook-bishop', week: 2, title: 'Turm gegen Läufer', figure: THEO, badge: { emoji: '⚔️', name: 'Turm und Läufer' },
    intro: 'Theo und Leo spielen zusammen. Theo läuft geradeaus, Leo läuft schräg. Wer von beiden holt den Stern? Tippe auf die richtige Figur.',
    exercises: [
      { kind: 'which', say: 'Wer holt den Stern mit einem Zug? Tippe auf die Figur.', hint: 'Schau genau: Liegt der Stern geradeaus oder schräg?', board: { a1: 'wR', c1: 'wB' }, stars: ['a5'] },
      { kind: 'which', say: 'Und hier? Wer kommt zum Stern?', hint: 'Der Stern liegt schräg. Wer läuft schräg?', board: { a1: 'wR', c1: 'wB' }, stars: ['f4'] },
      { kind: 'which', say: 'Wer holt diesen Stern?', hint: 'Der Stern liegt geradeaus von einer Figur.', board: { h8: 'wR', b2: 'wB' }, stars: ['h2'] },
      { kind: 'which', say: 'Noch einer: Wer kommt hin?', hint: 'Folge der schrägen Linie.', board: { d1: 'wR', f5: 'wB' }, stars: ['c8'] },
      { kind: 'collect', say: 'Abschlussaufgabe: Theo und Leo sammeln zusammen alle Sterne. Du darfst beide bewegen.', hint: 'Überlege: Welche Figur kommt zu welchem Stern?', board: { a1: 'wR', c1: 'wB' }, stars: ['a7', 'g5', 'd8'] },
    ],
    mama: [
      'Hier wird nur wiederholt und verglichen: Turm geradeaus, Läufer schräg.',
      'Die wichtigste Frage beim Schach lernen ist: „Wer kommt da hin?“ Lasst Taro mit dem Finger die Linie entlangfahren, bevor er tippt.',
    ],
    realBoard: 'Turm auf a1, Läufer auf c1. Legt eine Münze irgendwohin und fragt: „Wer holt sie mit einem Zug?“ Danach tauscht ihr: Taro legt die Münze, ihr antwortet.',
  },
  {
    id: 'queen', week: 3, title: 'Die mächtige Dame', figure: DANA, badge: { emoji: '👑', name: 'Damen-Profi' },
    intro: 'Ich bin Dana, die Dame. Ich bin die stärkste Figur! Ich kann geradeaus laufen wie der Turm und schräg wie der Läufer. So weit ich will.',
    demo: { board: { d1: 'wQ' }, square: 'd1', path: ['d5', 'h1'], say: 'Schau, wie viele Felder ich erreiche! Erst geradeaus nach oben, dann schräg nach unten.' },
    exercises: [
      { kind: 'moves', say: 'Tippe auf sechs Felder, auf die Dana ziehen kann.', hint: QUEEN_HINT, board: { d4: 'wQ' }, square: 'd4', count: 6 },
      { kind: 'which', say: 'Wer holt den Stern mit einem Zug, Dana oder Theo?', hint: 'Dana kann auch schräg laufen.', board: { d1: 'wQ', a8: 'wR' }, stars: ['h5'] },
      { kind: 'collect', say: 'Hilf Dana, die drei Sterne zu holen.', hint: QUEEN_HINT, board: { d1: 'wQ' }, stars: ['d6', 'a3', 'h3'] },
      { kind: 'moves', say: 'Steine versperren Dana den Weg. Tippe auf fünf Felder, die sie trotzdem erreicht.', hint: STONE_HINT, board: { e4: 'wQ' }, stones: ['e6', 'c4', 'g6', 'c2'], square: 'e4', count: 5 },
      { kind: 'collect', say: 'Abschlussaufgabe: Dana holt die Sterne aus drei Ecken.', hint: QUEEN_HINT, board: { a1: 'wQ' }, stars: ['h8', 'h1', 'a8'] },
    ],
    mama: [
      'Die Dame zieht wie Turm und Läufer zusammen: waagerecht, senkrecht und schräg, beliebig weit, aber nicht über andere Figuren und nicht „um die Ecke“.',
      'Sie ist die stärkste Figur (sie ist etwa so viel wert wie neun Bauern). Darum passt man gut auf sie auf.',
    ],
    realBoard: 'Dame auf d1, Münzen auf d6, a3 und h3. Taro darf zeigen, wie die Dame „wie ein Turm“ und „wie ein Läufer“ läuft.',
  },
  {
    id: 'queen-treasure', week: 3, title: 'Die Dame auf Schatzsuche', figure: DANA, badge: { emoji: '💎', name: 'Schatzjäger' },
    intro: 'Im Schloss sind Schätze versteckt, aber Steine versperren die Wege. Findest du mit mir einen kurzen Weg?',
    exercises: [
      { kind: 'collect', say: 'Hol den Schatz! Die Steine versperren den direkten Weg.', hint: STONE_HINT, board: { d1: 'wQ' }, stones: ['d3', 'c2', 'e2'], stars: ['d5'] },
      { kind: 'collect', say: 'Zwei Schätze liegen oben. Hol beide.', hint: QUEEN_HINT, board: { h1: 'wQ' }, stones: ['g2', 'h4'], stars: ['b7', 'e7'] },
      { kind: 'which', say: 'Wer holt den Stern mit einem Zug?', hint: 'Prüfe jede Figur: geradeaus, schräg?', board: { e1: 'wQ', a4: 'wR', f8: 'wB' }, stars: ['e6'] },
      { kind: 'collect', say: 'Drei Schätze! Schaffst du es mit wenigen Zügen?', hint: QUEEN_HINT, board: { a1: 'wQ' }, stones: ['b2'], stars: ['c3', 'f6', 'h6'] },
      { kind: 'collect', say: 'Abschlussaufgabe: Dana steht zwischen vier Steinen. Hol alle Schätze.', hint: STONE_HINT, board: { d4: 'wQ' }, stones: ['c3', 'e3', 'c5', 'e5'], stars: ['d8', 'a4', 'h4'] },
    ],
    mama: [
      'Hier übt Taro, Wege zu planen: Wenn der direkte Weg versperrt ist, braucht es einen Umweg.',
      'Fragt beim Spielen: „Was passiert, wenn du dort hinziehst? Und dann?“ Das ist der Anfang vom Vorausdenken.',
    ],
    realBoard: 'Baut mit Bauern als „Steinen“ ein kleines Hindernis um eine Dame und versteckt eine Münze dahinter.',
  },
  {
    id: 'knight', week: 4, title: 'Das Pferd kann hüpfen', figure: PAUL, badge: { emoji: '🐴', name: 'Pferde-Profi' },
    intro: 'Hallo, ich bin Paul, das Pferd. Schachspieler sagen Springer zu mir. Ich hüpfe: zwei Felder geradeaus und dann eins zur Seite. Das sieht aus wie ein L. Und ich kann über alles drüberspringen!',
    demo: { board: { b1: 'wN' }, square: 'b1', path: ['c3', 'e4'], say: 'Schau: Ich hüpfe zwei nach oben und eins zur Seite. Hopp! Und nochmal. Hopp!' },
    exercises: [
      { kind: 'moves', say: 'Tippe auf vier Felder, auf die Paul hüpfen kann.', hint: KNIGHT_HINT, board: { d4: 'wN' }, square: 'd4', count: 4 },
      { kind: 'moves', say: 'Paul ist von Steinen umzingelt. Kein Problem, er springt drüber! Tippe auf vier Felder, wo er landen kann.', hint: KNIGHT_HINT, board: { d4: 'wN' }, stones: ['c3', 'c4', 'c5', 'd3', 'd5', 'e3', 'e4', 'e5'], square: 'd4', count: 4 },
      { kind: 'collect', say: 'Paul hüpft zu den Sternen. Hilf ihm!', hint: KNIGHT_HINT, board: { b1: 'wN' }, stars: ['c3', 'e4', 'f6'] },
      { kind: 'which', say: 'Wer holt den Stern mit einem Zug, Paul oder Theo?', hint: 'Der Stern liegt nicht geradeaus. Wer hüpft?', board: { g1: 'wN', a1: 'wR' }, stars: ['f3'] },
      { kind: 'collect', say: 'Abschlussaufgabe: Hüpf zu allen drei Sternen.', hint: KNIGHT_HINT, board: { g1: 'wN' }, stars: ['f3', 'g5', 'e6'] },
    ],
    mama: [
      'Der Springer zieht in L-Form: zwei Felder geradeaus und eins zur Seite, oder eins geradeaus und zwei zur Seite.',
      'Er ist die einzige Figur, die über andere Figuren springen darf. Bei jedem Sprung wechselt er die Feldfarbe (von hell nach dunkel oder umgekehrt). Das ist ein guter Trick zum Nachprüfen.',
    ],
    realBoard: 'Stellt einen Springer in die Mitte und umringt ihn mit Bauern. Taro zeigt, wohin er hüpfen kann. Zählt laut mit: „eins, zwei, zur Seite“.',
  },
  {
    id: 'knight-maze', week: 4, title: 'Das Pferde-Labyrinth', figure: PAUL, badge: { emoji: '🌀', name: 'Labyrinth-Held' },
    intro: 'Willkommen im Labyrinth! Ich muss zur Fahne. Auf manchen Feldern liegen Steine, da kann ich nicht landen. Aber drüberspringen darf ich!',
    exercises: [
      { kind: 'collect', flag: true, say: 'Hüpf mit Paul zur Fahne.', hint: KNIGHT_HINT, board: { a1: 'wN' }, stones: ['b3'], stars: ['d4'] },
      { kind: 'collect', flag: true, say: 'Wieder zur Fahne! Wie viele Hüpfer brauchst du?', hint: KNIGHT_HINT, board: { b1: 'wN' }, stones: ['a3', 'd2'], stars: ['b5'] },
      { kind: 'collect', say: 'Sammle die Sterne im Labyrinth.', hint: KNIGHT_HINT, board: { e4: 'wN' }, stones: ['d6', 'f6'], stars: ['c5', 'g5'] },
      { kind: 'collect', flag: true, say: 'Die Fahne ist weit weg. Schaffst du es?', hint: 'Hüpf erst in die Mitte, von dort kommt man überall hin.', board: { a1: 'wN' }, stones: ['c2'], stars: ['e4'] },
      { kind: 'collect', say: 'Abschlussaufgabe: Hol alle Sterne rund um die Mitte.', hint: KNIGHT_HINT, board: { d4: 'wN' }, stones: ['c6', 'e2'], stars: ['b5', 'f5', 'd6'] },
    ],
    mama: [
      'Hier übt Taro Springerwege. Ein Tipp für Kinder: Vom Rand aus hat der Springer wenige Felder, aus der Mitte viele („Ein Springer am Rand bringt Kummer und Schand“).',
      'Wenn er nicht weiterweiß: Fragt nicht nach der Lösung, sondern: „Wo kann das Pferd überall hin? Und von dort?“',
    ],
    realBoard: 'Legt eine Fahne (z. B. einen Radiergummi) auf ein Feld und Bauern als Steine. Taro hüpft mit dem Springer hin, ihr zählt die Hüpfer.',
  },
];

export const CHESS_LESSON_BY_ID = new Map(CHESS_LESSONS.map((l) => [l.id, l]));

export const PRAISE = ['Super!', 'Toll gemacht!', 'Richtig!', 'Klasse!', 'Genau so!', 'Prima!', 'Stark!'];

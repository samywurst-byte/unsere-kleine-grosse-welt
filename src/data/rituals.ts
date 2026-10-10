/**
 * Ritualbibliothek: schöne Ideen zur Jahreszeit, kein Pflichtkalender. Ids bleiben dauerhaft.
 * `leadDays`: wie viele Tage vorher an die Vorbereitung erinnert wird.
 */
export interface RitualIdea {
  id: string;
  title: string;
  emoji: string;
  months: number[];
  materials: string[];
  leadDays: number;
  /** Kurzer Hinweis, z. B. was die Kinder dabei lernen. */
  hint?: string;
}

export const RITUALS: RitualIdea[] = [
  { id: 'lanterns', title: 'Laternen basteln', emoji: '🏮', months: [10, 11], materials: ['Transparentpapier', 'Kleister', 'Laternenstab', 'Pappe für den Rahmen'], leadDays: 7, hint: 'Rechtzeitig vor dem Martinsumzug.' },
  { id: 'chestnuts', title: 'Kastanienfiguren basteln', emoji: '🌰', months: [9, 10, 11], materials: ['Kastanien', 'Zahnstocher', 'Handbohrer (nur Erwachsene)'], leadDays: 0, hint: 'Zählen und Formen nebenbei.' },
  { id: 'leaves', title: 'Blätterbilder legen und pressen', emoji: '🍁', months: [9, 10, 11], materials: ['Schöne Blätter', 'Dicke Bücher', 'Papier und Kleber'], leadDays: 0 },
  { id: 'pumpkin', title: 'Kürbis schnitzen und Suppe kochen', emoji: '🎃', months: [10], materials: ['Kürbis', 'Löffel zum Aushöhlen', 'Teelicht'], leadDays: 3 },
  { id: 'birdfeed', title: 'Vogelfutter herstellen', emoji: '🐦', months: [11, 12, 1, 2], materials: ['Kokosfett', 'Körnermischung', 'Förmchen', 'Schnur'], leadDays: 3, hint: 'Danach gemeinsam beobachten, wer kommt.' },
  { id: 'advent-calendar', title: 'Adventskalender vorbereiten', emoji: '🎁', months: [11], materials: ['24 Säckchen', 'Kleine Überraschungen', 'Zahlen 1 bis 24'], leadDays: 10, hint: 'Die Kinder können die Zahlen schreiben oder kleben.' },
  { id: 'cookies', title: 'Weihnachtsplätzchen backen', emoji: '🍪', months: [11, 12], materials: ['Mehl', 'Butter', 'Zucker', 'Eier', 'Ausstechformen', 'Streusel'], leadDays: 3, hint: 'Euer Lieblingsrezept könnt ihr als Notiz speichern.' },
  { id: 'advent-wreath', title: 'Adventskranz binden', emoji: '🕯️', months: [11], materials: ['Tannenzweige', 'Kerzen', 'Draht', 'Zapfen'], leadDays: 5 },
  { id: 'snow', title: 'Schneemann bauen', emoji: '⛄', months: [12, 1, 2], materials: ['Möhre', 'Knöpfe oder Steine', 'Alter Schal'], leadDays: 0 },
  { id: 'carnival', title: 'Faschingskostüme basteln', emoji: '🎭', months: [1, 2], materials: ['Stoffreste', 'Pappe', 'Schminke'], leadDays: 7 },
  { id: 'seeds', title: 'Samen vorziehen', emoji: '🌱', months: [2, 3, 4], materials: ['Anzuchterde', 'Kleine Töpfe', 'Samen (Kresse, Tomaten, Sonnenblumen)'], leadDays: 3, hint: 'Jeden Tag schauen und messen.' },
  { id: 'easter-eggs', title: 'Ostereier färben', emoji: '🥚', months: [3, 4], materials: ['Eier', 'Eierfarben', 'Essig'], leadDays: 3 },
  { id: 'tree', title: 'Einen Baum pflanzen', emoji: '🌳', months: [3, 4, 10, 11], materials: ['Setzling', 'Spaten', 'Gießkanne'], leadDays: 7, hint: 'Jedes Jahr ein Foto am selben Baum.' },
  { id: 'kite', title: 'Drachen bauen und steigen lassen', emoji: '🪁', months: [9, 10], materials: ['Drachenpapier', 'Holzstäbe', 'Schnur'], leadDays: 5 },
  { id: 'strawberries', title: 'Erdbeeren pflücken', emoji: '🍓', months: [5, 6], materials: ['Körbchen', 'Sonnenhüte'], leadDays: 1 },
  { id: 'lemonade', title: 'Limonade herstellen', emoji: '🍋', months: [5, 6, 7, 8], materials: ['Zitronen', 'Minze', 'Honig', 'Wasser'], leadDays: 1, hint: 'Messen und abwiegen.' },
  { id: 'picnic', title: 'Großes Familienpicknick', emoji: '🧺', months: [5, 6, 7, 8, 9], materials: ['Decke', 'Brote', 'Obst', 'Spiel für draußen'], leadDays: 1 },
  { id: 'fruit', title: 'Obst ernten', emoji: '🍎', months: [8, 9, 10], materials: ['Körbe', 'Leiter (Erwachsene)'], leadDays: 0 },
  { id: 'stars', title: 'Sternschnuppen schauen', emoji: '🌠', months: [8, 12], materials: ['Decken', 'Warme Jacken', 'Kakao'], leadDays: 1, hint: 'Im August und Dezember gibt es besonders viele.' },
  { id: 'nightwalk', title: 'Nachtwanderung', emoji: '🔦', months: [], materials: ['Taschenlampen', 'Warme Jacken'], leadDays: 1 },
];
export const RITUAL_BY_ID = new Map(RITUALS.map((r) => [r.id, r]));

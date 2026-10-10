/** Ideen und Vorgaben für die Familienzeit. Ids bleiben dauerhaft, Texte dürfen sich ändern. */

export interface MamaActivity { id: string; label: string; emoji: string }

/** Was sich ein Kind für seine Zeit mit Mama aussuchen kann. */
export const MAMA_ACTIVITIES: MamaActivity[] = [
  { id: 'read', label: 'Vorlesen', emoji: '📖' },
  { id: 'cuddle', label: 'Kuscheln', emoji: '🤗' },
  { id: 'draw', label: 'Malen', emoji: '🖍️' },
  { id: 'build', label: 'Bauen', emoji: '🧱' },
  { id: 'play', label: 'Spielen', emoji: '🎲' },
  { id: 'puzzle', label: 'Puzzeln', emoji: '🧩' },
  { id: 'outside', label: 'Rausgehen', emoji: '🌳' },
  { id: 'cook', label: 'Backen oder Kochen', emoji: '🧁' },
  { id: 'music', label: 'Singen und Tanzen', emoji: '🎵' },
  { id: 'talk', label: 'Erzählen', emoji: '💬' },
];
export const MAMA_ACTIVITY_BY_ID = new Map(MAMA_ACTIVITIES.map((a) => [a.id, a]));

export interface AdventureIdea {
  id: string;
  title: string;
  emoji: string;
  /** Monate (1 bis 12), in denen die Idee vorgeschlagen wird. Leer = immer. */
  months: number[];
  packing: string[];
  prep?: string;
}

const AUTUMN_WINTER = [10, 11, 12, 1, 2, 3];

export const ADVENTURE_IDEAS: AdventureIdea[] = [
  { id: 'forest', title: 'Waldspaziergang', emoji: '🌲', months: [], packing: ['Gummistiefel', 'Matschhose', 'Trinkflasche', 'Becherlupe'] },
  { id: 'flashlight', title: 'Taschenlampenwanderung', emoji: '🔦', months: AUTUMN_WINTER, packing: ['Taschenlampen', 'Warme Jacken', 'Mütze'], prep: 'Batterien prüfen' },
  { id: 'lantern', title: 'Laternenrunde', emoji: '🏮', months: [10, 11], packing: ['Laternen', 'Ersatz-Lichtstab', 'Warme Jacken'] },
  { id: 'cocoa', title: 'Winterspaziergang mit heißem Kakao', emoji: '☕', months: [11, 12, 1, 2], packing: ['Mützen und Handschuhe', 'Thermoskanne'], prep: 'Kakao kochen' },
  { id: 'chestnuts', title: 'Kastanien und Blätter sammeln', emoji: '🌰', months: [9, 10, 11], packing: ['Stoffbeutel', 'Gummistiefel'] },
  { id: 'kite', title: 'Drachen steigen lassen', emoji: '🪁', months: [9, 10], packing: ['Drachen', 'Warme Jacken'] },
  { id: 'bike', title: 'Fahrradtour', emoji: '🚲', months: [4, 5, 6, 7, 8, 9], packing: ['Helme', 'Trinkflaschen', 'Snack', 'Flickzeug'] },
  { id: 'explorer', title: 'Kleine Entdeckerrunde', emoji: '🔎', months: [], packing: ['Becherlupe', 'Fernglas', 'Sammelbeutel'] },
  { id: 'playground', title: 'Neuer Spielplatz', emoji: '🛝', months: [], packing: ['Trinkflasche', 'Snack', 'Wechselkleidung'] },
  { id: 'picnic', title: 'Picknick', emoji: '🧺', months: [5, 6, 7, 8, 9], packing: ['Decke', 'Brote', 'Obst', 'Trinkflaschen'], prep: 'Picknick vorbereiten' },
  { id: 'puddles', title: 'Pfützen springen', emoji: '🌧️', months: AUTUMN_WINTER, packing: ['Gummistiefel', 'Matschhose', 'Handtuch fürs Auto'] },
  { id: 'snow', title: 'Schlitten fahren', emoji: '🛷', months: [12, 1, 2], packing: ['Schlitten', 'Schneehosen', 'Handschuhe', 'Thermoskanne'] },
  { id: 'birds', title: 'Vögel beobachten und füttern', emoji: '🐦', months: [11, 12, 1, 2], packing: ['Vogelfutter', 'Fernglas'] },
  { id: 'stars', title: 'Sternenhimmel anschauen', emoji: '✨', months: [], packing: ['Decke', 'Warme Jacken', 'Taschenlampe'] },
];
export const ADVENTURE_IDEA_BY_ID = new Map(ADVENTURE_IDEAS.map((a) => [a.id, a]));

/** Standard-Tagesordnung für den Familienrat (aus dem Konzept). */
export const DEFAULT_COUNCIL_AGENDA = [
  'Schönstes Erlebnis der Woche',
  'Termine der nächsten Woche',
  'Essensplan',
  'Einkaufsliste',
  'Familienprojekte',
  'Nächstes Wochenendabenteuer',
];

/**
 * Taavis Heldenwelt – Die Hüter des Wunderwaldes. Phase 1: Weltkarte, Momo und vier Pilotmissionen.
 * Es gibt kein Richtig oder Falsch beim Gestalten. Aufgaben in der echten Welt sind immer freiwillig und mit Mama oder Papa.
 */

export type HeroPlaceId = 'village' | 'rescue' | 'ninja' | 'cave' | 'stories';

export interface HeroPlace {
  id: HeroPlaceId;
  name: string;
  emoji: string;
  /** Wer dort wohnt. */
  friend: string;
  /** Lage auf der Weltkarte in Prozent. */
  x: number;
  y: number;
  /** Text, solange es dort noch keine Mission gibt. */
  soon?: string;
}

export const HERO_PLACES: HeroPlace[] = [
  { id: 'village', name: 'Heldendorf', emoji: '🏡', friend: 'Momo', x: 22, y: 70 },
  { id: 'rescue', name: 'Rettungsdorf', emoji: '🏝️', friend: 'Fino', x: 76, y: 70 },
  { id: 'ninja', name: 'Ninja-Wald', emoji: '🌲', friend: 'Balu', x: 48, y: 30 },
  { id: 'cave', name: 'Erfinderhöhle', emoji: '⛰️', friend: 'Kiko', x: 82, y: 24, soon: 'Kiko der Roboter baut gerade an seinen Erfindungen. Bald darfst du mitbauen!' },
  { id: 'stories', name: 'Geschichtenportal', emoji: '🌀', friend: 'Momo', x: 15, y: 25, soon: 'Hinter dem Portal warten bald Geschichten, die du selbst weitererzählst.' },
];

export const HERO_PLACE_BY_ID = new Map(HERO_PLACES.map((p) => [p.id, p]));

export const FRIENDS: Record<string, { emoji: string; text: string }> = {
  Momo: { emoji: '🐉', text: 'ein kleiner Drache' },
  Fino: { emoji: '🦊', text: 'ein Fuchs' },
  Kiko: { emoji: '🤖', text: 'ein Roboter' },
  Balu: { emoji: '🐻', text: 'ein Bär' },
};

// ------------------------------------------------------------ Heldenfigur

export const HERO_SYMBOLS = [
  { id: 'star', emoji: '⭐', name: 'Stern' },
  { id: 'flash', emoji: '⚡', name: 'Blitz' },
  { id: 'leaf', emoji: '🍃', name: 'Blatt' },
  { id: 'moon', emoji: '🌙', name: 'Mond' },
  { id: 'heart', emoji: '💛', name: 'Herz' },
  { id: 'drop', emoji: '💧', name: 'Tropfen' },
  { id: 'fire', emoji: '🔥', name: 'Feuer' },
  { id: 'paw', emoji: '🐾', name: 'Pfote' },
] as const;

export const HERO_COLORS = [
  { id: 'blue', hex: '#3b7dd8', name: 'Blau' },
  { id: 'green', hex: '#3fa34d', name: 'Grün' },
  { id: 'red', hex: '#d9483b', name: 'Rot' },
  { id: 'purple', hex: '#8a5cc7', name: 'Lila' },
  { id: 'orange', hex: '#ee8a2a', name: 'Orange' },
  { id: 'teal', hex: '#1f9c9c', name: 'Türkis' },
] as const;

export const HERO_CAPES = [
  { id: 'none', hex: '', name: 'Kein Umhang' },
  { id: 'gold', hex: '#f2c94c', name: 'Gold' },
  { id: 'red', hex: '#c0392b', name: 'Rot' },
  { id: 'night', hex: '#2c3e70', name: 'Nachtblau' },
  { id: 'green', hex: '#2e8b57', name: 'Waldgrün' },
] as const;

export const HERO_POWERS = [
  { id: 'rescue', emoji: '🐾', name: 'Tiere retten', place: 'rescue' as HeroPlaceId },
  { id: 'invent', emoji: '⚙️', name: 'Erfinden', place: 'cave' as HeroPlaceId },
  { id: 'ninja', emoji: '🥷', name: 'Geschickt sein', place: 'ninja' as HeroPlaceId },
  { id: 'comfort', emoji: '🤗', name: 'Trösten', place: 'village' as HeroPlaceId },
] as const;

export const HERO_GREETINGS = [
  { id: 'five', emoji: '🙌', name: 'Abklatschen' },
  { id: 'fist', emoji: '🤜', name: 'Faust an Faust' },
  { id: 'wave', emoji: '👋', name: 'Winken' },
  { id: 'wings', emoji: '🐉', name: 'Drachenflügel' },
  { id: 'own', emoji: '✨', name: 'Mein eigener Gruß' },
] as const;

export const symbolEmoji = (id: string | undefined) => HERO_SYMBOLS.find((s) => s.id === id)?.emoji ?? '⭐';

// ------------------------------------------------------------ Missionen

export type RealTask = {
  kind: 'real';
  say: string;
  /** Was ihr in der echten Welt macht. */
  task: string;
  /** Sicherheitshinweis für Erwachsene. */
  safety?: string;
};

export type HeroStep =
  | { kind: 'say'; say: string; scene: string }
  | { kind: 'paths' }
  | { kind: 'symbol'; say: string }
  | { kind: 'design' }
  | { kind: 'greeting'; say: string }
  | { kind: 'rescue' }
  | { kind: 'parcours' }
  | RealTask
  | { kind: 'reveal'; say: string };

export interface HeroMissionDef {
  id: string;
  number: number;
  place: HeroPlaceId;
  title: string;
  emoji: string;
  badge: { emoji: string; name: string };
  /** Kurz für Mama und Papa: worum es geht. Keine Bewertung. */
  parents: string;
  steps: HeroStep[];
}

export const HERO_MISSIONS: HeroMissionDef[] = [
  {
    id: 'welcome',
    number: 1,
    place: 'village',
    title: 'Willkommen im Wunderwald',
    emoji: '🌳',
    badge: { emoji: '🌳', name: 'Wunderwald-Freund' },
    parents: 'Momo stellt sich vor. Das Kind probiert drei Wege aus (Tier streicheln, Zahnrad drehen, über Steine hüpfen), wählt ein Heldensymbol und denkt sich mit euch einen geheimen Heldengruß aus.',
    steps: [
      { kind: 'say', scene: '🌳🐉🌳', say: 'Hallo! Ich bin Momo, ein kleiner Drache. Willkommen im Wunderwald! Hier wohnen viele Tiere, und manchmal brauchen sie Hilfe. Willst du mit mir ein Held werden?' },
      { kind: 'paths' },
      { kind: 'symbol', say: 'Jeder Held hat ein Zeichen. Welches gefällt dir am besten? Tippe es an.' },
      { kind: 'real', say: 'Jetzt eine geheime Heldenaufgabe: Denk dir mit Mama oder Papa einen geheimen Heldengruß aus. Vielleicht mit den Händen, mit den Füßen oder mit einem lustigen Wort.', task: 'Gemeinsam einen geheimen Heldengruß erfinden und dreimal ausprobieren.' },
      { kind: 'reveal', say: 'Schau mal, da ist dein Held! Er gehört jetzt zum Wunderwald. Gut, dass du da bist.' },
    ],
  },
  {
    id: 'my-hero',
    number: 2,
    place: 'village',
    title: 'Mein eigener Held',
    emoji: '🦸',
    badge: { emoji: '🦸', name: 'Held mit Gesicht' },
    parents: 'Das Kind gestaltet seine Heldenfigur (Farbe, Umhang, Maske, Zeichen, Heldenkraft) und wählt einen Heldengruß. Alles darf später wieder geändert werden.',
    steps: [
      { kind: 'say', scene: '🎨🐉🦸', say: 'Heute machen wir deinen Helden ganz fertig. Du entscheidest alles selbst. Es gibt kein Richtig und kein Falsch!' },
      { kind: 'design' },
      { kind: 'greeting', say: 'Wie grüßt dein Held seine Freunde? Tippe auf einen Gruß.' },
      { kind: 'real', say: 'Zeig Mama oder Papa deinen Helden und mach euren Heldengruß zusammen!', task: 'Den Helden auf dem iPad zeigen und den Heldengruß gemeinsam machen.' },
      { kind: 'reveal', say: 'Dein Held wohnt jetzt im Heldendorf. Er ist bereit für das erste Abenteuer!' },
    ],
  },
  {
    id: 'rescue-fino',
    number: 3,
    place: 'rescue',
    title: 'Rette Fino',
    emoji: '🦊',
    badge: { emoji: '🌉', name: 'Fino-Retter' },
    parents: 'Fino sitzt auf einer Insel fest. Das Kind wählt einen Weg: Brücke bauen, Floß bauen oder ein Tier um Hilfe bitten. Beim Brückenbau zeigt eine Animation, ob die Brücke hält, und das Kind darf umbauen. Danach baut ihr eine echte Brücke aus Bausteinen.',
    steps: [
      { kind: 'say', scene: '🌊🏝️🦊🌊', say: 'Oh nein! Das ist Fino, der Fuchs. Er sitzt auf der kleinen Insel fest und kommt nicht mehr zurück. Wie können wir ihm helfen?' },
      { kind: 'rescue' },
      { kind: 'real', say: 'Jetzt in echt: Baut eine Brücke aus Bausteinen, Büchern oder Kartons. Hält sie, wenn ein Kuscheltier darüber läuft?', task: 'Mit Bausteinen eine Brücke zwischen zwei Stapeln bauen und mit einem Kuscheltier testen. Umbauen ist erlaubt!' },
      { kind: 'reveal', say: 'Fino ist gerettet! Er sagt: Danke, kleiner Held! Du hast nicht aufgegeben.' },
    ],
  },
  {
    id: 'ninja-path',
    number: 4,
    place: 'ninja',
    title: 'Der Ninja-Pfad',
    emoji: '🥷',
    badge: { emoji: '🥷', name: 'Ninja-Pfadfinder' },
    parents: 'Das Kind baut für Balu einen Parcours aus Baumstamm, Tunnel und Trittsteinen in eigener Reihenfolge und darf sie ändern. Danach baut ihr den Parcours sicher am Boden nach.',
    steps: [
      { kind: 'say', scene: '🌲🐻🌲', say: 'Das ist Balu, der Bär. Er will ein Ninja werden! Baust du ihm einen Ninja-Pfad? Du bestimmst die Reihenfolge.' },
      { kind: 'parcours' },
      {
        kind: 'real',
        say: 'Jetzt bist du der Ninja! Baut zu Hause deinen Ninja-Pfad in deiner Reihenfolge nach.',
        task: 'Den Parcours in der Reihenfolge vom iPad nachbauen und durchlaufen. Das Kind darf die Reihenfolge ändern.',
        safety: 'Bitte nur am Boden und nur mit einem Erwachsenen daneben. Baumstamm = Klebeband oder Seil flach auf dem Boden, Tunnel = Decke über zwei Stühlen, Trittsteine = Kissen auf Teppich (nicht auf glattem Boden). Nichts zum Draufklettern, keine Höhen.',
      },
      { kind: 'reveal', say: 'Balu ist jetzt ein echter Ninja-Bär. Und du auch!' },
    ],
  },
];

export const HERO_MISSION_BY_ID = new Map(HERO_MISSIONS.map((m) => [m.id, m]));

// ------------------------------------------------------------ Mission 1: drei Wege

export const WELCOME_PATHS = [
  { id: 'pet', place: 'rescue' as HeroPlaceId, emoji: '🐰', title: 'Rettungsdorf', say: 'Das ist Hoppel. Er ist ein bisschen ängstlich. Streichle ihn ganz sanft mit dem Finger.' },
  { id: 'gear', place: 'cave' as HeroPlaceId, emoji: '⚙️', title: 'Erfinderhöhle', say: 'In der Erfinderhöhle klemmt ein Zahnrad. Dreh es mit dem Finger im Kreis, dann geht das Licht an.' },
  { id: 'stones', place: 'ninja' as HeroPlaceId, emoji: '🪨', title: 'Ninja-Wald', say: 'Hilf mir über den Bach! Tippe auf den nächsten Stein, dann hüpfe ich drauf.' },
] as const;

// ------------------------------------------------------------ Mission 3: Fino retten

export const RESCUE_WAYS = [
  { id: 'bridge', emoji: '🌉', name: 'Brücke bauen', say: 'Wir bauen eine Brücke! Zieh Bretter über das Wasser. Wo ein Brett aufhört, braucht es einen Pfeiler darunter.' },
  { id: 'boat', emoji: '🛶', name: 'Floß bauen', say: 'Wir bauen ein Floß! Zieh Sachen ins Wasser, die schwimmen. Drei Sachen brauchen wir.' },
  { id: 'animal', emoji: '🦢', name: 'Ein Tier fragen', say: 'Welches Tier kann Fino über das Wasser helfen? Tippe es an.' },
] as const;

/** Sachen für das Floß: schwimmt es oder nicht? */
export const RAFT_ITEMS = [
  { id: 'log', emoji: '🪵', name: 'Holz', floats: true },
  { id: 'stone', emoji: '🪨', name: 'Stein', floats: false },
  { id: 'duck', emoji: '🦆', name: 'Gummiente', floats: true },
  { id: 'key', emoji: '🔑', name: 'Schlüssel', floats: false },
  { id: 'leaf', emoji: '🍂', name: 'Großes Blatt', floats: true },
  { id: 'ball', emoji: '⚽', name: 'Ball', floats: true },
] as const;

export const RAFT_NEEDED = 3;

export const HELPER_ANIMALS = [
  { id: 'swan', emoji: '🦢', name: 'Schwan', helps: true, say: 'Der Schwan kann schwimmen! Fino klettert auf seinen Rücken.' },
  { id: 'beaver', emoji: '🦫', name: 'Biber', helps: true, say: 'Der Biber nagt einen Baum um. Der Baum fällt über das Wasser, und Fino läuft darüber.' },
  { id: 'squirrel', emoji: '🐿️', name: 'Eichhörnchen', helps: false, say: 'Das Eichhörnchen kann toll klettern, aber nicht schwimmen. Es feuert Fino an! Wer kann noch helfen?' },
  { id: 'snail', emoji: '🐌', name: 'Schnecke', helps: false, say: 'Die Schnecke will gern helfen, aber sie ist zu klein. Wer kann noch helfen?' },
] as const;

// ------------------------------------------------------------ Mission 4: Ninja-Pfad

export const OBSTACLES = [
  { id: 'log', emoji: '🪵', name: 'Baumstamm', say: 'Balu balanciert über den Baumstamm.' },
  { id: 'tunnel', emoji: '🕳️', name: 'Tunnel', say: 'Balu krabbelt durch den Tunnel.' },
  { id: 'stones', emoji: '🪨', name: 'Trittsteine', say: 'Balu hüpft von Stein zu Stein.' },
] as const;

export type ObstacleId = (typeof OBSTACLES)[number]['id'];

// ------------------------------------------------------------ Momo

export const MOMO_STUCK = 'Das war knifflig! Möchtest du einen Tipp, wollen wir es zusammen machen oder möchtest du erst mal etwas anderes ausprobieren?';
export const MOMO_PAUSE = 'Pause ist gut. Ich habe mir alles gemerkt. Wenn du wiederkommst, machen wir genau hier weiter.';
export const MOMO_TIRED = 'Puh, wir haben heute schon viel erlebt. Mein Drachenkopf braucht eine Pause. Morgen geht das Abenteuer weiter!';

export const MOMO_CHEERS = ['Super!', 'Toll gemacht!', 'Du bist ein echter Held!', 'Klasse!', 'Das hast du dir gut überlegt!'];

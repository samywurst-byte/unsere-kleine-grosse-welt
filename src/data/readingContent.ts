/**
 * Lesestoff für die Lesestufen 6 bis 9: Wörter, Sätze und kurze Texte.
 * Silben sind mit "-" getrennt (Sprechsilben), damit Blätter und Lesekiste Silbenbögen zeigen können.
 * Ob ein Kind etwas schon lesen kann, entscheidet canRead mit den Buchstaben, die weitgehend sicher sitzen.
 * Alle Namen sind ausgedacht.
 */

export interface ReadWord {
  /** Mit Silbentrennung, z. B. "Ra-ke-te". */
  w: string;
  /** Strichzeichnung aus illustrations.ts, wenn es eine gibt. */
  ill?: string;
}

const words = (list: string): ReadWord[] => list.split(/\s+/).filter(Boolean).map((entry) => {
  const [w, ill] = entry.split('|');
  return ill ? { w, ill } : { w };
});

/** Lautgetreue Wörter, grob in der Reihenfolge, in der die Buchstaben dazukommen. */
export const READ_WORDS: ReadWord[] = words(`
  Ma-ma O-ma La-ma Mi-la li-la Mo-na Le-o O-le Li-mo
  Na-se|nase E-sel|esel So-fa|sofa Sa-lat Sa-la-mi Me-lo-ne|melone Mond|mond Nest|nest In-sel|insel I-gel|igel
  O-fen|ofen En-te|ente Lö-we|loewe Ro-se Ra-sen Ra-ke-te To-ma-te Mo-tor Ro-bo-ter Nu-del Ta-fel Te-le-fon
  Ha-se Ho-se Do-se Ho-nig Hut|hut Haus|haus Baum|baum Blu-me|blume Herz|herz Fisch|fisch A-na-nas|ananas Ap-fel|apfel Maus|maus
  Ka-mel Ki-no Pa-ket Ba-na-ne Wal Ga-bel Fe-der Ku-gel Re-gen Se-gel Tor Rad Hund Wind Kind Mund
  Lu-pe Tu-be Pu-del Ka-ter Bus Ze-bra Zelt Kä-se Bär Müt-ze Eis Ei-mer Sei-fe Au-to Au-ge
  Schaf Schu-le Ku-chen Dra-che Eu-le Bie-ne Stern Spin-ne Spie-gel Pferd Kopf
  Pa-pa O-pa Ti-mo Ti-na Lot-ta Pi-lot Pal-me Tür Rü-be Mö-we Löf-fel
`).filter((w, i, all) => all.findIndex((x) => x.w === w.w) === i);

/** Häufige kleine Wörter, die Kinder bald auf einen Blick lesen (Signalwörter). */
export const SIGHT_WORDS = ['und', 'ist', 'das', 'der', 'die', 'ein', 'eine', 'im', 'am', 'in', 'mit', 'auf', 'er', 'sie', 'es', 'da', 'wo', 'hat', 'sind', 'nicht'];

/** Sätze zum Prüfen: Stimmt das? */
export interface CheckSentence { s: string; true: boolean }

const check = (s: string, t: boolean): CheckSentence => ({ s, true: t });

export const CHECK_SENTENCES: CheckSentence[] = [
  check('Ein Ha-se hat lan-ge Oh-ren.', true),
  check('Ein E-sel kann ma-len.', false),
  check('Ei-ne To-ma-te ist rot.', true),
  check('Ein Wal lebt im Meer.', true),
  check('Ein Lö-we ist li-la.', false),
  check('Ei-ne Ba-na-ne ist gelb.', true),
  check('Ein Fisch kann rei-ten.', false),
  check('Ein Au-to hat Rä-der.', true),
  check('Ein Hund kann bel-len.', true),
  check('Die Son-ne ist nass.', false),
  check('Ein Ball ist rund.', true),
  check('Ein Ka-mel hat Fe-dern.', false),
  check('Ein Vo-gel hat Fe-dern.', true),
  check('Eis ist warm.', false),
  check('Ei-ne En-te kann schwim-men.', true),
  check('Ein So-fa kann ren-nen.', false),
  check('Ein Ze-bra hat Strei-fen.', true),
  check('Ei-ne Nu-del ist ein Tier.', false),
  check('Ei-ne Maus ist grö-ßer als ein Haus.', false),
  check('Im Win-ter ist es kalt.', true),
  check('Ein I-gel hat Sta-cheln.', true),
  check('Ein Baum hat Blät-ter.', true),
  check('Ei-ne Ra-ke-te fliegt zum Mond.', true),
  check('Ein Pferd kann flie-gen.', false),
  check('Ei-ne Kuh gibt Milch.', true),
  check('Ein Tisch hat Bei-ne.', true),
  check('Ein Ap-fel kann sin-gen.', false),
  check('Ein Ro-bo-ter ist ein Tier.', false),
];

/** Sätze zum Lesen und Malen. */
export const DRAW_SENTENCES: string[] = [
  // Ganz frühe Sätze, nur aus M, A, I, O, L, S, E, N, T, R und U
  'Ma-ma malt.',
  'Le-o malt O-ma.',
  'O-le ist im Tor.',
  'Ti-mo isst Sa-lat.',
  'Mo-na isst Me-lo-ne.',
  'O-ma ist am See.',
  'Ti-na rennt.',
  'Le-o turnt.',
  'Mi-la malt ein La-ma.',
  'Le-o hat ei-nen Hut.',
  'O-ma und O-pa sit-zen auf dem So-fa.',
  'Die Ra-ke-te fliegt zum Mond.',
  'Der Ha-se sitzt im Gras.',
  'Ma-ma und O-le ba-cken ei-nen Ku-chen.',
  'Die En-te schwimmt im Teich.',
  'Der Hund holt den Ball.',
  'Auf dem Tisch liegt ei-ne Me-lo-ne.',
  'Das Au-to ist rot.',
  'Le-o malt ei-ne Son-ne.',
  'Am Him-mel ist ein Re-gen-bo-gen.',
  'Die Maus isst Kä-se.',
  'Im Nest sind vier Ei-er.',
  'Ein Fisch hat ei-nen Hut.',
  'Pa-pa liest ein Buch.',
  'Der Wal ist rie-sig.',
  'Ein Schaf steht auf dem Dach.',
];

export interface ReadQuestion {
  q: string;
  /** Die erste Antwort ist die richtige; auf dem Blatt wird gemischt. */
  options: [string, string];
}

export interface ReadText {
  id: string;
  title: string;
  /** 1 kurz und einfach, 2 mittel, 3 länger mit Nebensätzen. */
  level: 1 | 2 | 3;
  /** Text mit Silbentrennung. */
  text: string;
  questions: ReadQuestion[];
}

export const READ_TEXTS: ReadText[] = [
  {
    id: 'lama', title: 'Mila und das Lama', level: 1,
    text: 'Mi-la ist im Zoo. Da ist ein La-ma. Das La-ma ist weiß. Mi-la malt das La-ma. Das La-ma sieht das Bild an. Es nickt.',
    questions: [
      { q: 'Wo ist Mila?', options: ['im Zoo', 'im Kino'] },
      { q: 'Welche Farbe hat das Lama?', options: ['weiß', 'lila'] },
      { q: 'Was macht Mila?', options: ['Sie malt das Lama.', 'Sie füttert das Lama.'] },
    ],
  },
  {
    id: 'platsch', title: 'Platsch!', level: 1,
    text: 'Es reg-net. Le-o hat Stie-fel an. Er hüpft in ei-ne Pfüt-ze. Platsch! Die Ho-se ist nass. Le-o lacht.',
    questions: [
      { q: 'Wie ist das Wetter?', options: ['Es regnet.', 'Die Sonne scheint.'] },
      { q: 'Wo hüpft Leo hinein?', options: ['in eine Pfütze', 'in den Sand'] },
      { q: 'Was ist nass?', options: ['die Hose', 'die Mütze'] },
    ],
  },
  {
    id: 'bello', title: 'Bello', level: 1,
    text: 'Bel-lo ist ein klei-ner Hund. Er hat ein brau-nes Fell. Bel-lo mag Bäl-le. Le-o wirft den Ball weit weg. Bel-lo rennt los und holt ihn. Dann will er noch mal!',
    questions: [
      { q: 'Wie heißt der Hund?', options: ['Bello', 'Rex'] },
      { q: 'Was mag Bello?', options: ['Bälle', 'Katzen'] },
      { q: 'Wer wirft den Ball?', options: ['Leo', 'Mama'] },
    ],
  },
  {
    id: 'kuchen', title: 'Oma backt', level: 2,
    text: 'O-ma backt ei-nen Ku-chen. O-le hilft. Er holt Mehl, Ei-er und Milch. Dann kommt der Ku-chen in den O-fen. Bald riecht es le-cker. O-le darf das ers-te Stück es-sen.',
    questions: [
      { q: 'Was backt Oma?', options: ['einen Kuchen', 'ein Brot'] },
      { q: 'Wer hilft?', options: ['Ole', 'Opa'] },
      { q: 'Wohin kommt der Kuchen?', options: ['in den Ofen', 'in den Kühlschrank'] },
    ],
  },
  {
    id: 'laterne', title: 'Die Laterne', level: 2,
    text: 'Mi-a hat ei-ne La-ter-ne ge-bas-telt. Sie sieht aus wie ein Mond. Am A-bend ge-hen al-le Kin-der durch die Stra-ßen. Sie sin-gen Lie-der. Die La-ter-nen leuch-ten im Dun-keln. Da-nach gibt es war-men Tee.',
    questions: [
      { q: 'Was hat Mia gebastelt?', options: ['eine Laterne', 'einen Drachen'] },
      { q: 'Wie sieht die Laterne aus?', options: ['wie ein Mond', 'wie ein Fisch'] },
      { q: 'Was gibt es danach?', options: ['warmen Tee', 'ein Eis'] },
    ],
  },
  {
    id: 'bus', title: 'Mit dem Bus in die Stadt', level: 2,
    text: 'Mi-la und O-ma fah-ren mit dem Bus in die Stadt. Mi-la sitzt am Fens-ter. Sie sieht ei-nen Kran, ei-ne Kir-che und ei-nen Brun-nen. Am Markt stei-gen sie aus. Dort kau-fen sie Äp-fel.',
    questions: [
      { q: 'Womit fahren Mila und Oma?', options: ['mit dem Bus', 'mit dem Zug'] },
      { q: 'Wo sitzt Mila?', options: ['am Fenster', 'ganz hinten'] },
      { q: 'Was kaufen sie?', options: ['Äpfel', 'Brot'] },
    ],
  },
  {
    id: 'rakete', title: 'Die Rakete', level: 2,
    text: 'O-le baut ei-ne Ra-ke-te aus ei-nem Kar-ton. Sie ist rot und hat drei Fens-ter. O-le setzt sich hin-ein und zählt: zehn, neun, acht … null! Start! In sei-nem Kopf fliegt er bis zum Mond.',
    questions: [
      { q: 'Woraus baut Ole die Rakete?', options: ['aus einem Karton', 'aus Holz'] },
      { q: 'Wie viele Fenster hat sie?', options: ['drei', 'fünf'] },
      { q: 'Wohin fliegt Ole in seinem Kopf?', options: ['bis zum Mond', 'bis zum Meer'] },
    ],
  },
  {
    id: 'igel', title: 'Der Igel im Garten', level: 3,
    text: 'Am A-bend kommt ein I-gel in den Gar-ten. Er sucht Kä-fer und Wür-mer. Der I-gel hat vie-le Sta-cheln. Wenn er Angst hat, rollt er sich zu ei-ner Ku-gel. Im Win-ter schläft er un-ter ei-nem Hau-fen Laub.',
    questions: [
      { q: 'Wann kommt der Igel?', options: ['am Abend', 'am Mittag'] },
      { q: 'Was sucht er?', options: ['Käfer und Würmer', 'Nudeln und Käse'] },
      { q: 'Was macht er im Winter?', options: ['Er schläft.', 'Er fliegt in den Süden.'] },
    ],
  },
  {
    id: 'meer', title: 'Am Meer', level: 3,
    text: 'Die Fa-mi-lie ist am Meer. Die Kin-der bau-en ei-ne Burg aus Sand. Pa-pa sucht Mu-scheln. Plötz-lich kommt ei-ne gro-ße Wel-le. Die Burg ist weg! Al-le la-chen und bau-en ei-ne neu-e Burg.',
    questions: [
      { q: 'Wo ist die Familie?', options: ['am Meer', 'im Wald'] },
      { q: 'Was sucht Papa?', options: ['Muscheln', 'Steine'] },
      { q: 'Was passiert mit der Burg?', options: ['Eine Welle nimmt sie mit.', 'Ein Hund läuft darüber.'] },
    ],
  },
  {
    id: 'fuchs', title: 'Der Fuchs im Schnee', level: 3,
    text: 'Im Wald lebt ein Fuchs. Er hat ein ro-tes Fell und ei-nen bu-schi-gen Schwanz. Im Win-ter hört er ei-ne Maus un-ter dem Schnee. Mit ei-nem gro-ßen Sprung springt er hin-ein. Doch die Maus ist schnel-ler und flitzt in ihr Loch.',
    questions: [
      { q: 'Welche Farbe hat das Fell?', options: ['rot', 'grau'] },
      { q: 'Wo ist die Maus?', options: ['unter dem Schnee', 'auf einem Baum'] },
      { q: 'Wer ist schneller?', options: ['die Maus', 'der Fuchs'] },
    ],
  },
  {
    id: 'bohne', title: 'Die Bohne', level: 3,
    text: 'Le-na legt ei-ne Boh-ne auf feuch-te Wat-te. Je-den Tag schaut sie nach. Nach drei Ta-gen platzt die Boh-ne auf. Ei-ne klei-ne Wur-zel wächst nach un-ten. Dann wächst ein grü-ner Spross nach o-ben. Le-na misst ihn mit ei-nem Li-ne-al.',
    questions: [
      { q: 'Worauf legt Lena die Bohne?', options: ['auf feuchte Watte', 'auf einen Teller'] },
      { q: 'Was wächst nach unten?', options: ['eine Wurzel', 'ein Blatt'] },
      { q: 'Womit misst Lena?', options: ['mit einem Lineal', 'mit einer Waage'] },
    ],
  },
  {
    id: 'schneemann', title: 'Der Schneemann', level: 3,
    text: 'Ü-ber Nacht hat es ge-schneit. Ben und El-la rol-len drei Ku-geln. Die größ-te kommt nach un-ten. Für die Na-se ho-len sie ei-ne Ka-rot-te. Zwei Stei-ne wer-den die Au-gen. Am Nach-mit-tag scheint die Son-ne. Der Schnee-mann wird im-mer klei-ner.',
    questions: [
      { q: 'Wie viele Kugeln rollen die Kinder?', options: ['drei', 'zwei'] },
      { q: 'Was wird die Nase?', options: ['eine Karotte', 'ein Stein'] },
      { q: 'Warum wird der Schneemann kleiner?', options: ['Die Sonne scheint.', 'Es schneit wieder.'] },
    ],
  },
];

/** Bildwörter für Lautkästchen: ein Kästchen je Laut, nur Wörter, die man so schreibt, wie man sie hört. */
export const SOUND_BOX_WORDS = ['maus', 'mond', 'melone', 'igel', 'insel', 'ofen', 'loewe', 'sofa', 'esel', 'ente', 'nase', 'nest', 'baum', 'haus', 'fisch', 'herz', 'hut', 'blume', 'ananas', 'apfel'];

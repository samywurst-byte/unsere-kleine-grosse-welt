/**
 * Silbenmethode für den Lesepfad: Jeder Laut hat ein Lauttier, einen kurzen Lautspruch und eine Lautgebärde.
 * Gelesen wird von Anfang an in Silben (MA, ME, MO), geschrieben in Blau und Rot im Wechsel, mit Silbenbögen.
 * Tiere, Sprüche und Gebärden sind eigene Inhalte dieser App (angelehnt an die Idee, nicht an ein Lehrwerk).
 */

export interface SoundAnimal {
  /** Lauttier mit diesem Anlaut. */
  animal: string;
  /** Der Laut steckt mitten im Wort (Möwe, Drache), nicht am Anfang. */
  inside?: boolean;
  /** Strichzeichnung aus illustrations.ts, wenn es eine gibt. Sonst malt das Kind das Tier selbst. */
  illustration?: string;
  /** Wie der Laut klingt (Laut, nicht Buchstabenname). */
  sound: string;
  /** Kurzer Spruch zum Vorsprechen. */
  rhyme: string;
  /** Lautgebärde: eine Handbewegung, die beim Sprechen des Lauts gemacht wird. */
  sign: string;
}

export const SOUND_ANIMALS: Record<string, SoundAnimal> = {
  M: { animal: 'Maus', illustration: 'maus', sound: 'mmm, mit geschlossenen Lippen summen', rhyme: 'Die Maus mag Möhren: mmm, lecker!', sign: 'Mit der flachen Hand im Kreis über den Bauch reiben, wie wenn etwas lecker schmeckt.' },
  A: { animal: 'Affe', illustration: 'affe', sound: 'aaa, Mund weit auf wie beim Arzt', rhyme: 'Der Affe staunt: aaa, eine Banane!', sign: 'Beide Hände öffnen sich vom Mund weg weit nach außen, wie beim Staunen.' },
  E: { animal: 'Esel', illustration: 'esel', sound: 'eee, Mund breit wie beim Lächeln', rhyme: 'Der Esel ruft: eee, ich will Heu!', sign: 'Die Zeigefinger ziehen die Mundwinkel ein Stück zur Seite, wie ein breites Eselsgrinsen.' },
  O: { animal: 'Oktopus', sound: 'ooo, Lippen ganz rund', rhyme: 'Der Oktopus sagt: ooo, so viele Arme!', sign: 'Daumen und Zeigefinger beider Hände formen vor dem Mund einen runden Kreis.' },
  L: { animal: 'Löwe', illustration: 'loewe', sound: 'lll, die Zunge tippt oben hinter die Zähne', rhyme: 'Der Löwe leckt sein Eis: lll.', sign: 'Der Zeigefinger zeigt nach oben und wackelt, so wie die Zunge oben anstößt.' },
  I: { animal: 'Igel', illustration: 'igel', sound: 'iii, Mund schmal und breit', rhyme: 'Der Igel quiekt: iii, ein Käfer!', sign: 'Der Zeigefinger tippt auf die Nasenspitze und zeigt dann gerade nach oben, spitz wie ein Igelstachel.' },
  S: { animal: 'Seehund', sound: 'sss, summend wie eine Biene', rhyme: 'Der Seehund summt im See: sss.', sign: 'Die Hand gleitet in Wellen vor dem Körper nach vorn, wie ein schwimmender Seehund.' },
  N: { animal: 'Nashorn', sound: 'nnn, durch die Nase summen', rhyme: 'Das Nashorn brummt: nnn, so müde.', sign: 'Der Zeigefinger tippt seitlich an die Nase, dort summt der Laut.' },
  U: { animal: 'Uhu', sound: 'uuu, Lippen spitz nach vorn', rhyme: 'Der Uhu ruft nachts: uuu.', sign: 'Beide Hände formen große runde Uhu-Augen um die eigenen Augen.' },
  R: { animal: 'Robbe', sound: 'rrr, im Hals schnurren', rhyme: 'Die Robbe rollt sich: rrr.', sign: 'Die Hand liegt am Hals und spürt das Schnurren, die Finger zittern ein bisschen.' },
  T: { animal: 'Tiger', sound: 't, ganz kurz, ohne „e“ danach', rhyme: 'Der Tiger tappt: t, t, t.', sign: 'Der Zeigefinger tippt einmal kurz auf den Tisch.' },
  P: { animal: 'Pinguin', sound: 'p, kurz, die Lippen ploppen', rhyme: 'Der Pinguin plumpst ins Wasser: p!', sign: 'Die Hand vor den Mund halten und den kurzen Luftstoß spüren.' },
  D: { animal: 'Dino', sound: 'd, kurz und weich', rhyme: 'Der Dino donnert: d, d, d.', sign: 'Die Faust klopft einmal sanft auf den Tisch.' },
  W: { animal: 'Wal', sound: 'www, die Zähne berühren die Unterlippe, es summt', rhyme: 'Der Wal macht Wellen: www.', sign: 'Die Hand macht vor dem Körper eine große Welle.' },
  F: { animal: 'Fuchs', sound: 'fff, wie Luft aus einem Reifen', rhyme: 'Der Fuchs faucht leise: fff.', sign: 'Die Hand vor den Mund halten und die Luft spüren, die ausströmt.' },
  H: { animal: 'Hase', sound: 'hhh, wie warme Luft an kalte Hände', rhyme: 'Der Hase haucht in die Pfoten: hhh.', sign: 'Die Hände vor den Mund halten und sie warm anhauchen.' },
  K: { animal: 'Katze', sound: 'k, kurz hinten im Mund', rhyme: 'Die Katze kratzt: k, k.', sign: 'Die Finger krümmen sich kurz wie eine Katzenpfote.' },
  B: { animal: 'Bär', sound: 'b, kurz, die Lippen gehen auf', rhyme: 'Der Bär brummt und bläst die Backen auf: b!', sign: 'Die Backen kurz aufblasen und mit beiden Zeigefingern antippen.' },
  G: { animal: 'Gans', sound: 'g, kurz hinten im Hals', rhyme: 'Die Gans gurgelt: g, g.', sign: 'Die Hand an den Hals legen und den kurzen Laut spüren.' },
  Z: { animal: 'Zebra', sound: 'ts, wie ein kleiner Zischer', rhyme: 'Das Zebra zischt: ts, ts.', sign: 'Der Zeigefinger zeichnet einen schnellen Zickzack in die Luft.' },
  J: { animal: 'Jaguar', sound: 'j, wie am Anfang von „ja“', rhyme: 'Der Jaguar jubelt: ja!', sign: 'Beide Arme gehen jubelnd nach oben.' },
  V: { animal: 'Vogel', sound: 'fff, wie beim F', rhyme: 'Der Vogel fliegt fort: fff.', sign: 'Die Hände flattern wie Flügel.' },
  Ä: { animal: 'Äffchen', illustration: 'affe', sound: 'äää, wie in „Bär“', rhyme: 'Das Äffchen gähnt: äää.', sign: 'Wie beim A, nur mit kleinerem Mund: die Hände öffnen sich nur ein bisschen.' },
  Ö: { animal: 'Möwe', inside: true, sound: 'ööö, Lippen rund und spitz', rhyme: 'Die Möwe staunt: ööö, ein Fisch!', sign: 'Die Lippen spitzen und mit dem Zeigefinger auf den runden Mund zeigen.' },
  Ü: { animal: 'Küken', inside: true, sound: 'üüü, Lippen spitz wie beim Pfeifen', rhyme: 'Das Küken piepst: üüü.', sign: 'Die Lippen spitzen und die Hand wie einen kleinen Schnabel davor halten.' },
  EI: { animal: 'Eichhörnchen', sound: 'ei, wie in „Eis“', rhyme: 'Das Eichhörnchen findet ein Ei: ei!', sign: 'Beide Hände formen ein Ei.' },
  AU: { animal: 'Auerhahn', sound: 'au, wie wenn etwas wehtut', rhyme: 'Der Auerhahn stößt sich: au!', sign: 'Die Hand legt sich an die Wange, wie wenn etwas wehtut.' },
  SCH: { animal: 'Schaf', sound: 'schhh, wie „leise!“', rhyme: 'Das Schaf schläft: schhh.', sign: 'Der Zeigefinger liegt auf den Lippen.' },
  CH: { animal: 'Drache', inside: true, sound: 'ch, wie ein leises Fauchen', rhyme: 'Der Drache faucht: chchch.', sign: 'Die Hand öffnet sich vor dem Mund wie ein kleiner Feuerstoß.' },
  EU: { animal: 'Eule', sound: 'eu, wie in „Feuer“', rhyme: 'Die Eule heult: eu, eu.', sign: 'Die Arme bewegen sich langsam wie große Flügel.' },
  IE: { animal: 'Biene', inside: true, sound: 'iii, ganz lang', rhyme: 'Die Biene fliegt und fliegt: iiie.', sign: 'Der Zeigefinger fliegt in einer langen Linie durch die Luft.' },
  ST: { animal: 'Storch', sound: 'scht, am Wortanfang', rhyme: 'Der Storch stakst: scht, scht.', sign: 'Auf einem Bein stehen wie ein Storch.' },
  SP: { animal: 'Spinne', sound: 'schp, am Wortanfang', rhyme: 'Die Spinne spinnt: schp.', sign: 'Die Finger krabbeln wie eine Spinne über den Arm.' },
  PF: { animal: 'Pferd', sound: 'pf, wie ein Prusten', rhyme: 'Das Pferd prustet: pf!', sign: 'Mit den Lippen prusten und die Hand davor halten.' },
  QU: { animal: 'Qualle', sound: 'kw, wie in „quaken“', rhyme: 'Die Qualle quatscht: kw, kw.', sign: 'Die Hand öffnet und schließt sich wie eine schwimmende Qualle.' },
};

/** Fallback für Buchstaben ohne eigenes Lauttier (ß, C, X, Y): das Bildwort des Buchstabens. */
export function soundAnimal(upper: string, word: string): SoundAnimal {
  return SOUND_ANIMALS[upper] ?? { animal: word, sound: `den Laut wie in „${word}“`, rhyme: `${word}: hör genau hin!`, sign: 'Eine eigene Bewegung ausdenken und jedes Mal dazu machen.' };
}

/** Silbenmacher: ohne sie gibt es keine Silbe. Jede Silbe hat genau einen. */
export const SYLLABLE_VOWELS = ['A', 'E', 'I', 'O', 'U', 'Ä', 'Ö', 'Ü', 'EI', 'AU', 'EU', 'IE'];

/** Mitlaute, die eine offene Silbe anfangen können (ß, C, X und Y nicht). */
export const SYLLABLE_ONSETS = ['M', 'L', 'S', 'N', 'R', 'T', 'P', 'D', 'W', 'F', 'H', 'K', 'B', 'G', 'Z', 'J', 'V', 'SCH', 'CH', 'ST', 'SP', 'PF', 'QU'];

/**
 * Frühe Silbenwörter (mit "-" getrennt), die schon mit ganz wenigen Buchstaben gehen.
 * Zusammen mit dem Lesestoff aus readingContent.ts. Namen sind ausgedacht und häufig.
 */
export const EARLY_SYLLABLE_WORDS: string[] = [
  'Ma-ma', 'O-ma', 'Em-ma', 'Mi-a', 'Mo-ni', 'O-li', 'Lo-la', 'Li-li', 'Mai',
  'Mo-mo', 'Mu-se-um', 'Mu-sik', 'Na-me', 'Ni-na', 'An-na', 'Mi-ne', 'Ne-mo', 'Su-mo',
  'Pa-pa', 'O-pa', 'Pi-pi', 'Pu-pe', 'Ro-se', 'Ra-be', 'Tu-be', 'Ro-sa', 'Mo-tor',
];

/** Lieblingswörter für das „Wort der Woche“: zuerst die, die Kinder im Alltag wirklich brauchen. */
export const WEEK_WORD_PRIORITY: string[] = [
  'Ma-ma', 'Pa-pa', 'O-ma', 'O-pa', 'La-ma', 'Na-se', 'E-sel', 'So-fa', 'Li-mo', 'Mo-tor', 'Ro-se', 'Na-me', 'Ra-be', 'Sa-la-mi', 'To-ma-te', 'Ra-ke-te',
];

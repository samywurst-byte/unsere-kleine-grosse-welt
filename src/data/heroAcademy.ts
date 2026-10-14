import type { HeroMissionDef } from './heroWorld';

/**
 * Heldenakademie: Mutig sein. Gefühle verstehen. Gemeinsam stark werden.
 * Fünf Heldenfähigkeiten in acht Missionen (vier Wochen, zwei Missionen pro Woche).
 * Grundsätze: Wut ist erlaubt. Keine Minuspunkte, keine Strafen, kein Lob fürs Ruhigsein. Gelobt wird die Mühe.
 * Wehtun ist nie eine gute Idee. Dann erzählt Momo freundlich, was passiert, und das Kind probiert etwas anderes.
 * `{partner}` wird beim Spielen durch den Namen des Geschwisterkinds ersetzt, das im Alter am nächsten ist.
 */

export type AbilityId = 'feelings' | 'pause' | 'courage' | 'team' | 'ideas';

export interface Ability {
  id: AbilityId;
  name: string;
  emoji: string;
  /** Was das Kind spielerisch lernt (für die Eltern). */
  learns: string;
  /** So erklärt Momo es dem Kind. */
  kid: string;
}

export const ABILITIES: Ability[] = [
  { id: 'feelings', name: 'Gefühledetektiv', emoji: '🔍', learns: 'Wut, Enttäuschung und Freude erkennen', kid: 'Du erkennst, wie sich jemand fühlt.' },
  { id: 'pause', name: 'Pausenknopf', emoji: '🛑', learns: 'Vor dem Hauen oder Schreien eine andere Handlung finden', kid: 'Du drückst Pause, wenn die Wut ganz groß wird.' },
  { id: 'courage', name: 'Mutmacher', emoji: '💪', learns: 'Mit Fehlern und Misserfolgen umgehen', kid: 'Du probierst es nochmal, auch wenn etwas nicht klappt.' },
  { id: 'team', name: 'Teamheld', emoji: '🤝', learns: 'Mitmachen, abwechseln und Grenzen anderer akzeptieren', kid: 'Du hilfst, wechselst dich ab und hörst auf ein Stopp.' },
  { id: 'ideas', name: 'Ideenmeister', emoji: '💡', learns: 'Eigene Lösungen finden und selbstbewusst handeln', kid: 'Du hast eigene Ideen und traust dich, sie zu sagen.' },
];

export const ABILITY_BY_ID = new Map(ABILITIES.map((a) => [a.id, a]));

export type FeelingId = 'angry' | 'sad' | 'happy' | 'scared' | 'disappointed';

export const FEELINGS: { id: FeelingId; emoji: string; name: string }[] = [
  { id: 'angry', emoji: '😠', name: 'wütend' },
  { id: 'sad', emoji: '😢', name: 'traurig' },
  { id: 'disappointed', emoji: '😞', name: 'enttäuscht' },
  { id: 'scared', emoji: '😨', name: 'ängstlich' },
  { id: 'happy', emoji: '😄', name: 'fröhlich' },
];

export interface FeelingScene {
  /** Großes Bild aus Emojis. */
  scene: string;
  /** Was man sieht, wird vorgelesen. */
  say: string;
  /** Diese Gefühle passen. */
  feels: FeelingId[];
  /** Kleiner Hinweis, wenn ein anderes Gefühl getippt wurde. */
  hint: string;
  /** Momo erklärt, wenn es passt. */
  then: string;
}

export interface ChoiceOption {
  id: string;
  emoji: string;
  name: string;
  /** Was Momo dazu erzählt. */
  say: string;
  /** false = tut jemandem weh. Momo erzählt freundlich, was dann passiert, und das Kind sucht eine andere Idee. */
  ok?: boolean;
}

/** Mutmacher: was hilft, wenn etwas nicht klappt. Alles ist richtig. */
export const COURAGE_HELPERS: { id: string; emoji: string; name: string; say: string }[] = [
  { id: 'again', emoji: '🔁', name: 'Nochmal probieren', say: 'Noch nicht heißt nicht nie! Wir probieren es nochmal.' },
  { id: 'slow', emoji: '🐢', name: 'Langsamer machen', say: 'Langsam und genau, Schritt für Schritt. Gute Idee!' },
  { id: 'help', emoji: '🙋', name: 'Hilfe holen', say: 'Hilfe holen ist schlau. Fino zeigt uns, wo man gut hintreten kann.' },
  { id: 'breathe', emoji: '🌬️', name: 'Tief durchatmen', say: 'Erst dreimal tief atmen. Ein und aus. Jetzt bin ich bereit.' },
];

export const ACADEMY_WEEKS: { week: number; title: string; everyday: string[] }[] = [
  {
    week: 1, title: 'Gefühle entdecken',
    everyday: [
      'Beim Essen erzählt jeder ein Gefühl von heute. Mama und Papa auch.',
      'Gefühle beim Vorlesen benennen: „Wie fühlt sich der Bär wohl gerade?“',
      'Wenn etwas schiefgeht, laut sagen: „Noch nicht! Ich probiere es nochmal.“',
    ],
  },
  {
    week: 2, title: 'Gemeinsam sind wir stärker',
    everyday: [
      'Sanduhr oder Timer zum Abwechseln bereitlegen und selbst anbieten lassen.',
      'Eine kleine Aufgabe zu zweit mit einem Geschwisterkind: Tisch decken, Wäsche tragen. Beide Aufgaben sind wichtig.',
      'Ein „Stopp“ der anderen ernst nehmen und loben, wenn es klappt.',
    ],
  },
  {
    week: 3, title: 'Der starke Held',
    everyday: [
      'Stoppzeichen vereinbaren: Hand hoch und „Stopp“. Mama und Papa benutzen es auch.',
      'Eine Wut-Ecke mit Kissen und Papier zum Zerknüllen. Wut darf raus, nur nicht auf andere.',
      'Etwas Schweres zum Klettern oder Bauen suchen und jeden Versuch feiern, nicht nur das Ziel.',
    ],
  },
  {
    week: 4, title: 'Ich gehöre dazu',
    everyday: [
      'Bei einer Familiensache eine eigene Aufgabe aussuchen lassen.',
      'Kleine Entscheidungen abgeben: Welcher Weg? Welches Spiel? Welches Obst?',
      'Wenn er um Hilfe bittet, das ausdrücklich loben: „Gut, dass du gefragt hast.“',
    ],
  },
];

export const ACADEMY_PRINCIPLES = [
  'Wut ist erlaubt. Die Akademie zeigt, was man mit der Wut machen kann, sie soll sie nicht wegmachen.',
  'Keine Minuspunkte, keine Strafen und kein Lob fürs Ruhigsein. Gelobt wird Mühe, Mut und eine eigene Idee.',
  'Wild sein, klettern und rennen gehören dazu. Die Akademie will kein braveres Kind.',
  'Die Mama-Zeit gibt es jeden Tag, egal wie der Tag lief. Sie ist nie eine Belohnung.',
];

/** Kuscheltiere aus dem Wunderwald, die in der Akademie Hilfe brauchen. */
export const ACADEMY_MISSIONS: HeroMissionDef[] = [
  {
    id: 'academy-brummi',
    number: 5,
    week: 1,
    ability: 'feelings',
    place: 'academy',
    title: 'Brummi ist wütend',
    emoji: '🧸',
    badge: { emoji: '🔍', name: 'Gefühledetektiv' },
    parents: 'Kuschelbär Brummi darf nicht mitspielen und wird wütend. Das Kind erkennt Wut und die Traurigkeit darunter und sucht aus, was Brummi helfen könnte. Danach Gefühle-Gesichter raten.',
    steps: [
      { kind: 'say', scene: '🏰🐉', say: 'Willkommen in der Heldenakademie! Hier lernen Helden fünf Heldenfähigkeiten: Gefühle verstehen, Pause drücken, Mut machen, im Team helfen und eigene Ideen haben. Wild sein darfst du hier natürlich trotzdem!' },
      { kind: 'say', scene: '🧸⚽🐰🦊', say: 'Das ist Brummi, ein Kuschelbär. Die anderen Tiere spielen Ball, und Brummi darf nicht mitspielen. Brummi stampft mit dem Fuß und brummt ganz laut. Hilfst du mir, Brummi zu verstehen?' },
      {
        kind: 'feelings',
        scenes: [
          { scene: '🧸💢', say: 'Brummi stampft, sein Kopf ist ganz rot, und er ballt die Pfoten. Wie fühlt sich Brummi?', feels: ['angry'], hint: 'Schau mal: Er stampft und brummt ganz laut. Fühlt sich das heiß an wie ein Vulkan?', then: 'Genau, Brummi ist wütend. Wut fühlt sich heiß an, wie ein Vulkan im Bauch. Wut ist erlaubt!' },
          { scene: '🧸💧', say: 'Jetzt setzt sich Brummi in die Ecke und lässt den Kopf hängen. Eine Träne kullert. Wie fühlt er sich jetzt?', feels: ['sad', 'disappointed'], hint: 'Schau mal: Der Kopf hängt, und da ist eine Träne.', then: 'Ja! Unter der Wut war Traurigkeit versteckt. Brummi wollte so gern mitspielen.' },
        ],
      },
      {
        kind: 'choice', scene: '🧸💭', say: 'Was könnte Brummi jetzt helfen? Du darfst eine Idee aussuchen.',
        options: [
          { id: 'ask', emoji: '🙋', name: 'Fragen: Darf ich mitspielen?', say: 'Super Idee! Brummi fragt: Darf ich mitspielen? Und Hoppel sagt: Klar, du kannst ins Tor!' },
          { id: 'hug', emoji: '🤗', name: 'Brummi trösten', say: 'Du tröstest Brummi. Das tut gut. Jetzt traut er sich, die anderen zu fragen.' },
          { id: 'stomp', emoji: '🦶', name: 'Ganz fest stampfen', say: 'Stampfen ist eine gute Idee! So darf die Wut raus, und niemandem tut etwas weh.' },
          { id: 'kick', emoji: '💥', name: 'Den Ball wegschießen', ok: false, say: 'Hm. Dann ist der Ball weg, und die anderen sind traurig. Brummi ist trotzdem noch wütend. Was könnte noch helfen?' },
        ],
      },
      { kind: 'real', say: 'Jetzt in echt: Macht Gefühle-Gesichter! Einer zeigt ein Gefühl mit dem Gesicht, der andere rät.', task: 'Abwechselnd ein Gefühl mit Gesicht und Körper zeigen (wütend, traurig, fröhlich, ängstlich), der andere rät. Mama und Papa zeigen auch ihre Gefühle.' },
      { kind: 'reveal', say: 'Du bist ein echter Gefühledetektiv! Du hast ganz genau hingeschaut und Brummi verstanden.' },
    ],
  },
  {
    id: 'academy-parcours',
    number: 6,
    week: 1,
    ability: 'courage',
    place: 'academy',
    title: 'Der wackelige Parcours',
    emoji: '🪵',
    badge: { emoji: '💪', name: 'Mutmacher' },
    parents: 'Momo rutscht beim Parcours ab, ist enttäuscht und probiert aus, was hilft (nochmal, langsamer, Hilfe holen, atmen). Beim zweiten Versuch klappt es. Danach ein kleiner Parcours zu Hause mit dem Spruch „Noch nicht!“.',
    steps: [
      { kind: 'say', scene: '🐉🪵🕳️🪨', say: 'Momo will heute einen Hindernisparcours schaffen. Manchmal klappt etwas nicht beim ersten Mal. Das ist ganz normal. Hilfst du Momo? Tippe immer auf das nächste Hindernis.' },
      { kind: 'tryagain', variant: 'parcours' },
      {
        kind: 'real',
        say: 'Jetzt du! Baut zu Hause einen kleinen Parcours. Wenn etwas nicht klappt, sagt ihr den Mutmacher-Spruch: Noch nicht! Ich probiere es nochmal.',
        task: 'Kleinen Parcours aufbauen und durchlaufen. Wenn etwas nicht klappt: „Noch nicht!“ sagen und einen Mutmacher aussuchen (nochmal, langsamer, Hilfe holen, atmen). Gern macht ihr auch absichtlich Fehler vor.',
        safety: 'Nur am Boden und mit einem Erwachsenen daneben. Kissen nur auf Teppich, nichts zum Draufklettern.',
      },
      { kind: 'reveal', say: 'Du hast nicht aufgegeben! Momo sagt: Mit dir traue ich mich alles. Fehler machen heißt üben.' },
    ],
  },
  {
    id: 'academy-train',
    number: 7,
    week: 2,
    ability: 'team',
    place: 'academy',
    title: 'Zwei wollen dasselbe',
    emoji: '🚂',
    badge: { emoji: '⏳', name: 'Lösungsfinder' },
    parents: 'Hoppel und Fino wollen dieselbe Eisenbahn. Das Kind erkennt, dass beide wütend sind, und findet eine Lösung (abwechseln, zusammen spielen, etwas anderes, Erwachsene fragen). Wegnehmen erklärt Momo freundlich. Danach Abwechseln mit Sanduhr ausprobieren.',
    steps: [
      { kind: 'say', scene: '🐰🚂🦊', say: 'Hoppel und Fino wollen beide mit der roten Eisenbahn spielen. Hoppel zieht, Fino zieht. Gleich gibt es Streit!' },
      {
        kind: 'feelings',
        scenes: [
          { scene: '🐰💢🚂💢🦊', say: 'Beide ziehen an der Eisenbahn und rufen: Meins! Wie fühlen sich die beiden?', feels: ['angry'], hint: 'Hör mal, wie laut sie „Meins!“ rufen.', then: 'Genau, beide sind wütend. Und beide wollen dasselbe. Das ist schwer.' },
        ],
      },
      {
        kind: 'choice', scene: '🐰🚂🦊', say: 'Welche Idee könnte den beiden helfen?',
        options: [
          { id: 'turns', emoji: '⏳', name: 'Abwechseln mit Sanduhr', say: 'Klasse! Erst fährt Hoppel, bis die Sanduhr leer ist, dann ist Fino dran. Beide kommen dran.' },
          { id: 'together', emoji: '🛤️', name: 'Zusammen spielen', say: 'Super! Hoppel fährt die Eisenbahn, und Fino baut die Schienen. Zusammen wird die Strecke riesig.' },
          { id: 'other', emoji: '🧸', name: 'Erst etwas anderes', say: 'Gute Idee! Fino baut solange einen Bahnhof aus Bausteinen. Gleich ist er mit der Eisenbahn dran.' },
          { id: 'ask', emoji: '🙋', name: 'Einen Erwachsenen fragen', say: 'Auch gut! Wenn man allein nicht weiterkommt, darf man Hilfe holen.' },
          { id: 'grab', emoji: '✊', name: 'Einfach wegnehmen', ok: false, say: 'Hm. Dann weint Hoppel, und Fino hat auch keinen Spaß. Was könnte noch helfen?' },
        ],
      },
      { kind: 'real', say: 'Probiert es aus: Spielt mit {partner} abwechselnd mit einem Lieblingsspielzeug. Die Sanduhr sagt, wann ihr tauscht.', task: 'Abwechselnd mit einem Lieblingsspielzeug spielen. Eine Sanduhr oder ein Timer (2 bis 3 Minuten) zeigt den Wechsel. Das Kind darf die Sanduhr umdrehen.' },
      { kind: 'reveal', say: 'Du hast eine Lösung gefunden, mit der beide glücklich sind. Das kann ein Teamheld!' },
    ],
  },
  {
    id: 'academy-duck',
    number: 8,
    week: 2,
    ability: 'team',
    place: 'rescue',
    title: 'Rettung im Doppelpack',
    emoji: '🐥',
    badge: { emoji: '🛶', name: 'Team-Retter' },
    parents: 'Ein Entenküken steckt im Schilf. Zwei Helden mit zwei gleich wichtigen Aufgaben retten es. Das Kind wählt seine Aufgabe, die andere bekommt das Geschwisterkind. Danach die Rettung zu zweit in echt, dann tauschen.',
    steps: [
      { kind: 'say', scene: '🌊🌾🐥', say: 'Ein kleines Entenküken ist im Schilf stecken geblieben! Fino sagt: Allein schaffen wir das nicht. Wir brauchen zwei Helden mit zwei wichtigen Aufgaben. Du und {partner}!' },
      {
        kind: 'choice', scene: '🛶🪢🐥', say: 'Welche Aufgabe nimmst du? Die andere bekommt {partner}. Beide sind gleich wichtig.',
        options: [
          { id: 'boat', emoji: '🛶', name: 'Das Boot steuern', say: 'Du steuerst das Boot ganz nah ans Schilf. Und {partner} wirft das Seil. Ohne Boot kein Seil, ohne Seil kein Küken. Ihr braucht euch beide!' },
          { id: 'rope', emoji: '🪢', name: 'Das Seil werfen', say: 'Du wirfst das Seil, und {partner} steuert das Boot. Ohne Boot kein Seil, ohne Seil kein Küken. Ihr braucht euch beide!' },
          { id: 'swap', emoji: '🔄', name: 'Wir wechseln uns ab', say: 'Erst steuerst du, dann wirfst du. So probiert jeder beides aus. Echte Teamhelden!' },
        ],
      },
      {
        kind: 'choice', scene: '🐥🌾', say: 'Das Küken ist ganz ängstlich und piept: Stopp, nicht so schnell! Was macht ihr?',
        options: [
          { id: 'wait', emoji: '✋', name: 'Anhalten und warten', say: 'Ihr haltet an. Wenn jemand Stopp sagt, hören Helden zu. Das Küken beruhigt sich.' },
          { id: 'soft', emoji: '🗣️', name: 'Leise mit ihm reden', say: 'Ihr sprecht ganz leise: Keine Angst, wir helfen dir. Das Küken traut sich.' },
          { id: 'pull', emoji: '💨', name: 'Schnell rausziehen', ok: false, say: 'Hm. Das Küken hat Stopp gesagt und bekommt jetzt noch mehr Angst. Was könnt ihr stattdessen tun?' },
        ],
      },
      {
        kind: 'real',
        say: 'Jetzt in echt mit {partner}: Ein Kuscheltier sitzt auf dem Sofa-Felsen fest. Einer baut den Weg, der andere trägt es sicher zurück. Danach tauscht ihr!',
        task: 'Rettung zu zweit: Einer legt einen Weg aus Kissen, der andere trägt das Kuscheltier zurück. Dann Rollen tauschen. Wer „Stopp“ sagt, wird gehört.',
        safety: 'Kissen nur am Boden und auf Teppich. Nicht vom Sofa springen.',
      },
      { kind: 'reveal', say: 'Das Küken ist gerettet, weil ihr ein Team wart. Jede Aufgabe war wichtig!' },
    ],
  },
  {
    id: 'academy-stop',
    number: 9,
    week: 3,
    ability: 'pause',
    place: 'academy',
    title: 'Das Stoppzeichen',
    emoji: '🛑',
    badge: { emoji: '🛑', name: 'Pausenknopf' },
    parents: 'Momo wird so wütend, dass Feuer kommt. Er lernt den Pausenknopf: Hand hoch, „Stopp“, dreimal Drachenatem. Dann sucht das Kind aus, wie Wut ohne Hauen raus darf (stampfen, ins Kissen boxen, laut sagen, Papier knüllen).',
    steps: [
      { kind: 'say', scene: '🐉🔥🔥', say: 'Manchmal wird Momo so wütend, dass Feuer aus seiner Nase kommt! Früher hat er dann Sachen umgeworfen. Jetzt kennt Momo einen Heldentrick: den Pausenknopf. Hilfst du ihm?' },
      { kind: 'calm' },
      {
        kind: 'choice', scene: '🐉💢', say: 'Wut darf raus, nur ohne Hauen. Was kann Momo mit seiner Wut machen?',
        options: [
          { id: 'stomp', emoji: '🦶', name: 'Fest stampfen', say: 'Stampf, stampf, stampf! Die Wut geht in den Boden. Prima Idee!' },
          { id: 'pillow', emoji: '🛏️', name: 'In ein Kissen boxen', say: 'Bumm, bumm! Das Kissen hält das aus. So darf die Wut raus.' },
          { id: 'shout', emoji: '🗣️', name: 'Laut sagen: Ich bin wütend!', say: 'ICH BIN WÜTEND! Jetzt wissen alle Bescheid, und man kann dir helfen.' },
          { id: 'paper', emoji: '📄', name: 'Papier zerknüllen', say: 'Knister, knüll! Ein dicker Wutball. Den kannst du sogar in den Korb werfen.' },
          { id: 'hit', emoji: '👊', name: 'Hauen', ok: false, say: 'Hauen tut weh. Dann ist der andere traurig, und Momos Wut ist trotzdem noch da. Was kann Momo stattdessen tun?' },
        ],
      },
      {
        kind: 'real',
        say: 'Übt euer Stoppzeichen: Hand hoch, Stopp sagen, dreimal Drachenatem. Und probiert aus, was bei dir gegen Wut hilft.',
        task: 'Ein Stoppzeichen vereinbaren (Hand hoch und „Stopp“) und eine Wut-Ecke einrichten (Kissen, Papier zum Zerknüllen). Mama und Papa benutzen das Stoppzeichen auch. Es ist kein Verbot von Wut, sondern eine Pause.',
      },
      { kind: 'reveal', say: 'Du kennst jetzt den Pausenknopf. Deine Wut darf da sein, und du entscheidest, was du dann machst. Das ist stark!' },
    ],
  },
  {
    id: 'academy-climb',
    number: 10,
    week: 3,
    ability: 'courage',
    place: 'ninja',
    title: 'Die Kletterwand',
    emoji: '🧗',
    badge: { emoji: '🧗', name: 'Gipfelstürmer' },
    parents: 'Balu klettert auf einen Felsen und rutscht zweimal ab. Jedes Mal kommt er weiter, ein Fähnchen zeigt, wie hoch er schon war. Das Kind sucht einen Mutmacher aus. Danach etwas Schweres auf dem Spielplatz probieren.',
    steps: [
      { kind: 'say', scene: '🐻🧗⛰️', say: 'Balu will auf den Kletterfelsen. Der ist hoch! Beim ersten Mal klappt es bestimmt noch nicht ganz. Aber jeder Versuch bringt ihn ein Stück weiter. Tippe immer auf den nächsten Griff.' },
      { kind: 'tryagain', variant: 'climb' },
      {
        kind: 'real',
        say: 'Kletter-Mission in echt: Such dir auf dem Spielplatz etwas Schweres aus und probiere es. Jeder Versuch zählt!',
        task: 'Auf dem Spielplatz etwas Schweres probieren (Klettergerüst, Balancierbalken). Jeden Versuch feiern, nicht nur das Ziel: „Du bist schon weiter als vorhin!“',
        safety: 'Nur Spielplatzgeräte für sein Alter und mit einem Erwachsenen daneben.',
      },
      { kind: 'reveal', say: 'Du hast es immer wieder probiert! Balu sagt: Jeder Versuch hat uns höher gebracht.' },
    ],
  },
  {
    id: 'academy-picnic',
    number: 11,
    week: 4,
    ability: 'ideas',
    place: 'academy',
    title: 'Meine Aufgabe für die Familie',
    emoji: '🧺',
    badge: { emoji: '💡', name: 'Ideenmeister' },
    parents: 'Für ein Familien-Picknick denkt sich das Kind seine eigene Aufgabe aus oder wählt eine. Danach macht ihr das Picknick wirklich. Eigene Ideen könnt ihr unten unter „Mehr“ eintragen.',
    steps: [
      { kind: 'say', scene: '🏡🧺✨', say: 'Heute gibt es eine große Familienmission: ein Familien-Picknick im Wohnzimmer! Jeder hat eine Aufgabe. Und du darfst dir deine Aufgabe selbst aussuchen.' },
      {
        kind: 'choice', scene: '🧺', say: 'Welche Aufgabe übernimmst du?',
        options: [
          { id: 'blanket', emoji: '🟥', name: 'Die Decke ausbreiten', say: 'Du breitest die Decke aus. Ohne Decke kein Picknick!' },
          { id: 'food', emoji: '🍎', name: 'Das Essen tragen', say: 'Du trägst das Essen. Ganz vorsichtig, wie ein Kellner-Held!' },
          { id: 'music', emoji: '🎵', name: 'Musik aussuchen', say: 'Du suchst die Musik aus. Das wird ein lustiges Picknick!' },
          { id: 'invite', emoji: '💌', name: 'Alle einladen', say: 'Du lädst alle ein. Klopf, klopf: Kommt zum Picknick!' },
          { id: 'own', emoji: '✨', name: 'Meine eigene Idee', say: 'Eine eigene Idee! Erzähl sie Mama oder Papa. Ideenmeister denken sich selbst etwas aus.' },
        ],
      },
      { kind: 'real', say: 'Macht das Familien-Picknick! Du machst deine Aufgabe, und alle anderen ihre.', task: 'Familien-Picknick (z. B. am Wochenende). Das Kind übernimmt die Aufgabe, die es gewählt oder sich ausgedacht hat, und darf bestimmen, wie es sie macht.' },
      { kind: 'reveal', say: 'Ohne dich wäre das Picknick nur halb so schön. Du gehörst dazu, und deine Ideen sind wichtig!' },
    ],
  },
  {
    id: 'academy-treasure',
    number: 12,
    week: 4,
    ability: 'ideas',
    place: 'academy',
    title: 'Die Schatzsuche',
    emoji: '🗺️',
    badge: { emoji: '💎', name: 'Schatzfinder' },
    parents: 'Das Kind führt die Schatzsuche an: Es wählt den Weg, hilft Hoppel und bittet um Hilfe, als die Kiste klemmt. Um Hilfe bitten wird ausdrücklich gelobt. Danach eine Schatzsuche zu Hause.',
    steps: [
      { kind: 'say', scene: '🗺️🐉💎', say: 'Momo hat eine alte Schatzkarte gefunden! Heute bist du der Anführer. Du entscheidest.' },
      {
        kind: 'choice', scene: '🗺️', say: 'Welchen Weg nehmen wir?',
        options: [
          { id: 'forest', emoji: '🌲', name: 'Durch den Wald', say: 'Durch den Wald! Da riecht es nach Moos und Pilzen. Los geht’s!' },
          { id: 'river', emoji: '🌊', name: 'Am Fluss entlang', say: 'Am Fluss entlang! Wir hören das Wasser plätschern. Los geht’s!' },
          { id: 'hill', emoji: '⛰️', name: 'Über den Hügel', say: 'Über den Hügel! Von oben sehen wir weit. Los geht’s!' },
        ],
      },
      {
        kind: 'choice', scene: '🐰🩹', say: 'Oh! Hoppel ist umgeknickt und kann nicht mehr schnell laufen. Was machst du?',
        options: [
          { id: 'wait', emoji: '🐢', name: 'Langsamer gehen', say: 'Ihr geht langsamer, damit Hoppel mitkommt. So bleibt die ganze Gruppe zusammen.' },
          { id: 'carry', emoji: '🎒', name: 'Hoppel tragen', say: 'Du nimmst Hoppel in deinen Rucksack. Er freut sich riesig!' },
          { id: 'comfort', emoji: '🤗', name: 'Hoppel trösten', say: 'Du tröstest Hoppel. Danach geht es ihm schon besser.' },
          { id: 'run', emoji: '🏃', name: 'Allein weiterrennen', ok: false, say: 'Hm. Dann sitzt Hoppel ganz allein im Wald und hat Angst. Was könntest du stattdessen machen?' },
        ],
      },
      {
        kind: 'choice', scene: '🧰🔒', say: 'Da ist die Schatzkiste! Du ziehst und ziehst, aber sie klemmt. Was jetzt?',
        options: [
          { id: 'help', emoji: '🙋', name: 'Um Hilfe bitten', say: 'Du bittest um Hilfe. Das ist mutig! Mit Balus starken Tatzen geht die Kiste auf.' },
          { id: 'together', emoji: '🤝', name: 'Alle zusammen ziehen', say: 'Eins, zwei, drei, alle zusammen! Knarz, die Kiste geht auf.' },
          { id: 'tool', emoji: '🪵', name: 'Einen Stock zum Hebeln', say: 'Schlaue Idee! Mit einem Stock hebelt ihr den Deckel auf.' },
          { id: 'kick', emoji: '🦶', name: 'Gegen die Kiste treten', ok: false, say: 'Aua, der Fuß! Und die Kiste bleibt zu. Was könnte noch helfen?' },
        ],
      },
      { kind: 'real', say: 'Schatzsuche zu Hause! Mama oder Papa verstecken einen kleinen Schatz. Du entscheidest, wo ihr sucht, und darfst um Hilfe bitten.', task: 'Einen kleinen Schatz verstecken (z. B. Murmel, Sticker). Das Kind entscheidet, wo gesucht wird, und darf jederzeit nach „heiß oder kalt“ fragen. Das Fragen ausdrücklich loben.' },
      { kind: 'reveal', say: 'Der Schatz ist gefunden! Und weißt du was? Du hast entschieden, geholfen und um Hilfe gebeten. Das ist der größte Schatz.' },
    ],
  },
];

/** Name des Geschwisterkinds, das im Alter am nächsten ist (für Teamaufgaben). Ohne Geschwister: Mama oder Papa. */
export function partnerName(child: { id: string; birthDate?: string }, all: { id: string; name: string; birthDate?: string }[]): string {
  const time = (d?: string) => (d ? new Date(d).getTime() : NaN);
  const me = time(child.birthDate);
  const others = all.filter((c) => c.id !== child.id);
  if (!others.length) return 'Mama oder Papa';
  if (Number.isNaN(me)) return others[0].name;
  return [...others].sort((a, b) => Math.abs(time(a.birthDate) - me) - Math.abs(time(b.birthDate) - me))[0].name;
}

/** Text der Mission mit dem Namen des Partners. */
export function personalize(def: HeroMissionDef, partner: string): HeroMissionDef {
  return JSON.parse(JSON.stringify(def).replaceAll('{partner}', partner.replace(/["\\]/g, ''))) as HeroMissionDef;
}

/** Plan für den Mutmacher-Spielzug: an welchem Schritt rutscht die Figur bei welchem Versuch ab (null = schafft es). */
export function tryPlan(variant: 'parcours' | 'climb', easy: boolean): { length: number; slips: (number | null)[] } {
  if (variant === 'parcours') return { length: 6, slips: easy ? [3, null] : [2, null] };
  return { length: 9, slips: easy ? [5, null] : [3, 6, null] };
}

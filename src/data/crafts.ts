/**
 * Schnelle Bastelvorlage der Woche: ausmalen, ausschneiden, bekleben. Für alle Kinder dieselbe Vorlage.
 * Gestrichelt = Schnittlinie (die Großen schneiden selbst, bei Talisa schneidet ein Erwachsener vor).
 * Vier Ideen je Jahreszeit, jede Woche die nächste.
 */
import { circle, ellipse, eye, line, path, poly, rect, smile, star, type DrawShape, type Drawing } from './drawKit';

export type Season = 'autumn' | 'winter' | 'spring' | 'summer';

export interface Craft {
  id: string;
  title: string;
  intro: string;
  materials: string[];
  steps: string[];
  drawing: Drawing;
}

const cut = (sh: DrawShape): DrawShape => ({ ...sh, fill: 'white', dashed: true });
const pic = (shapes: DrawShape[]): Drawing => ({ width: 200, height: 220, shapes });

/** Punkte entlang einer Schnecke (für Schneckenhaus). */
function spiral(cx: number, cy: number, r: number, turns = 2.6): DrawShape {
  const pts: [number, number][] = [];
  const n = 120;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * turns * 2 * Math.PI;
    const rr = (r * i) / n;
    pts.push([cx + rr * Math.cos(t), cy + rr * Math.sin(t)]);
  }
  return poly(pts, false, 'none');
}

const BASIC = ['Schere', 'Klebestift', 'Buntstifte oder Wachsmaler'];

const AUTUMN: Craft[] = [
  {
    id: 'owl', title: 'Blätter-Eule',
    intro: 'Eine Eule mit Federn aus Herbstblättern.',
    materials: [...BASIC, 'kleine bunte Blätter (gepresst oder frisch)'],
    steps: ['Eule und Flügel ausmalen und ausschneiden.', 'Blätter als Federn auf den Bauch und die Flügel kleben.', 'Flügel an die Seiten kleben, fertig.'],
    drawing: pic([
      cut(poly([[56, 50], [62, 14], [86, 40]])), cut(poly([[144, 50], [138, 14], [114, 40]])),
      cut(ellipse(100, 110, 58, 76)),
      ellipse(100, 150, 34, 30, 'none', 0.8),
      circle(78, 84, 20), circle(122, 84, 20), ...eye(78, 86, 7), ...eye(122, 86, 7),
      poly([[93, 104], [107, 104], [100, 120]]),
      line(86, 186, 82, 196), line(94, 186, 94, 198), line(106, 186, 106, 198), line(114, 186, 118, 196),
      cut(ellipse(22, 120, 15, 36)), cut(ellipse(178, 120, 15, 36)),
    ]),
  },
  {
    id: 'toadstool', title: 'Fliegenpilz',
    intro: 'Ein roter Pilz mit weißen Tupfen aus Watte oder Papier.',
    materials: [...BASIC, 'Watte oder weißes Papier', 'roter Stift'],
    steps: ['Den Hut rot anmalen, den Stiel hell lassen.', 'Pilz ausschneiden.', 'Wattetupfen auf die Kreise kleben.'],
    drawing: pic([
      cut(path('M72 104 L66 196 Q100 208 134 196 L128 104 Z')),
      path('M70 140 Q100 152 130 140', 'none', 0.8),
      cut(path('M18 110 Q24 18 100 16 Q176 18 182 110 Q100 124 18 110 Z')),
      circle(60, 70, 12, 'none', 0.8), circle(100, 44, 14, 'none', 0.8), circle(140, 72, 12, 'none', 0.8),
      circle(96, 90, 9, 'none', 0.8), circle(38, 98, 7, 'none', 0.8), circle(164, 98, 7, 'none', 0.8),
      ...eye(88, 166, 3.5), ...eye(112, 166, 3.5), smile(100, 178, 14),
    ]),
  },
  {
    id: 'leaf-hedgehog', title: 'Blätter-Igel',
    intro: 'Der Igel bekommt Stacheln aus echten Herbstblättern.',
    materials: [...BASIC, 'Herbstblätter, am besten gepresst'],
    steps: ['Gesicht und Füße anmalen, Igel ausschneiden.', 'Blätter auf den Rücken kleben, unten anfangen, wie Dachziegel.', 'Zum Schluss Augen und Nase noch einmal schön schwarz malen.'],
    drawing: pic([
      cut(rect(56, 150, 18, 22, 6)), cut(rect(126, 150, 18, 22, 6)),
      cut(path('M14 156 Q8 62 104 56 Q156 54 172 108 L194 134 Q188 156 160 156 Z')),
      path('M146 62 Q126 106 150 156', 'none', 0.9),
      ...eye(166, 106, 4.5), circle(193, 134, 6, 'black'),
      smile(176, 140, 12, 4),
    ]),
  },
  {
    id: 'apple-tree', title: 'Apfelbaum',
    intro: 'Ein Baum mit Äpfeln zum Aufkleben. Die Krone kann man auch mit Blättern bekleben.',
    materials: [...BASIC, 'rotes und grünes Papier oder Blätter'],
    steps: ['Krone grün, Stamm braun und Äpfel rot anmalen.', 'Baum und Äpfel ausschneiden.', 'Äpfel in die Krone kleben, einer darf schon herunterfallen.'],
    drawing: pic([
      cut(path('M86 168 L90 110 L110 110 L114 168 Z')),
      cut(path('M30 106 Q8 70 40 52 Q42 16 84 20 Q104 2 130 18 Q170 14 168 52 Q196 70 172 106 Q150 128 100 118 Q50 128 30 106 Z')),
      path('M92 116 Q84 96 72 92', 'none', 0.8), path('M108 116 Q116 96 130 90', 'none', 0.8),
      ...[28, 64, 136, 172].flatMap((x) => [cut(circle(x, 200, 13)), line(x, 187, x + 3, 181, 0.8)]),
    ]),
  },
];

const WINTER: Craft[] = [
  {
    id: 'star', title: 'Glitzerstern',
    intro: 'Ein großer Stern fürs Fenster oder den Tannenbaum.',
    materials: [...BASIC, 'Wolle, Glitzer oder Alufolie', 'Faden zum Aufhängen'],
    steps: ['Stern ausmalen oder mit Alufolie bekleben.', 'Stern ausschneiden.', 'Ein Loch in eine Spitze stechen und einen Faden durchziehen.'],
    drawing: pic([cut(star(100, 112, 96, 42)), star(100, 112, 52, 23, 5, 'none'), circle(100, 112, 6, 'none', 0.8)]),
  },
  {
    id: 'fir-tree', title: 'Tannenbaum',
    intro: 'Ein Tannenbaum mit Kugeln zum Aufkleben.',
    materials: [...BASIC, 'Sticker, Knöpfe oder Papierschnipsel'],
    steps: ['Baum grün anmalen, Kugeln bunt.', 'Baum und Kugeln ausschneiden.', 'Kugeln auf die Zweige kleben, oben kommt der Stern.'],
    drawing: pic([
      cut(rect(88, 166, 24, 22)),
      cut(poly([[100, 16], [146, 66], [126, 66], [166, 116], [142, 116], [184, 168], [16, 168], [58, 116], [34, 116], [74, 66], [54, 66]])),
      star(100, 16, 13, 6),
      ...[24, 60, 140, 176].map((x) => cut(circle(x, 204, 11))),
    ]),
  },
  {
    id: 'snowman', title: 'Schneemann',
    intro: 'Ein Schneemann aus Wattebäuschen.',
    materials: [...BASIC, 'Watte oder Wattepads'],
    steps: ['Hut, Schal und Möhrennase anmalen.', 'Schneemann ausschneiden.', 'Watte auf den Bauch und den Kopf kleben.'],
    drawing: pic([
      line(66, 96, 26, 74, 1.2), line(134, 96, 174, 74, 1.2), line(34, 79, 28, 66, 1), line(166, 79, 172, 66, 1),
      cut(circle(100, 166, 48)), cut(circle(100, 102, 34)), cut(circle(100, 50, 28)),
      cut(rect(78, 4, 44, 22, 2)), cut(rect(66, 24, 68, 7, 2)),
      ...eye(90, 46, 3.5), ...eye(110, 46, 3.5), poly([[100, 54], [126, 60], [100, 62]]), smile(100, 66, 16, 5),
      path('M72 76 Q100 88 128 76 L128 86 Q100 98 72 86 Z'), rect(112, 84, 10, 22, 2),
      circle(100, 104, 4, 'black'), circle(100, 120, 4, 'black'),
    ]),
  },
  {
    id: 'reindeer', title: 'Rentier',
    intro: 'Ein Rentier. Das Geweih könnt ihr auch mit euren Händen machen: Hand umfahren und ausschneiden.',
    materials: [...BASIC, 'braunes Papier für Handabdrücke (wer mag)'],
    steps: ['Kopf braun, Nase rot anmalen.', 'Kopf und Geweih ausschneiden.', 'Geweih hinten an den Kopf kleben.'],
    drawing: pic([
      cut(path('M70 74 L52 40 L34 46 L48 34 L36 14 L56 30 L62 8 L66 32 L80 70 Z')),
      cut(path('M130 74 L148 40 L166 46 L152 34 L164 14 L144 30 L138 8 L134 32 L120 70 Z')),
      cut(ellipse(54, 92, 22, 10)), cut(ellipse(146, 92, 22, 10)),
      cut(path('M60 100 Q60 60 100 60 Q140 60 140 100 Q140 140 122 180 Q100 204 78 180 Q60 140 60 100 Z')),
      ...eye(84, 106, 5), ...eye(116, 106, 5),
      circle(100, 172, 15), smile(100, 190, 14, 5),
    ]),
  },
];

const SPRING: Craft[] = [
  {
    id: 'butterfly', title: 'Schmetterling',
    intro: 'Ein Klecksbild-Schmetterling: auf einer Seite malen, zusammenklappen, fertig.',
    materials: [...BASIC, 'Fingerfarbe oder Wasserfarbe'],
    steps: ['Schmetterling ausschneiden und in der Mitte falten.', 'Auf eine Seite dicke Farbkleckse setzen, zuklappen, fest drücken.', 'Aufklappen und trocknen lassen.'],
    drawing: pic([
      cut(ellipse(58, 76, 50, 44)), cut(ellipse(142, 76, 50, 44)), cut(ellipse(66, 152, 36, 38)), cut(ellipse(134, 152, 36, 38)),
      circle(52, 72, 14, 'none', 0.8), circle(148, 72, 14, 'none', 0.8), circle(64, 154, 10, 'none', 0.8), circle(136, 154, 10, 'none', 0.8),
      ellipse(100, 116, 10, 72),
      path('M96 48 Q86 24 72 18', 'none', 1), path('M104 48 Q114 24 128 18', 'none', 1), circle(72, 18, 4, 'black'), circle(128, 18, 4, 'black'),
      ...eye(96, 60, 2.2), ...eye(104, 60, 2.2),
    ]),
  },
  {
    id: 'ladybug', title: 'Marienkäfer',
    intro: 'Ein Glückskäfer. Zählt die Punkte!',
    materials: [...BASIC, 'roter und schwarzer Stift'],
    steps: ['Flügel rot, Kopf und Punkte schwarz anmalen.', 'Käfer ausschneiden.', 'Punkte zählen. Wer mag, malt noch mehr dazu.'],
    drawing: pic([
      line(84, 22, 72, 6, 1), line(116, 22, 128, 6, 1), circle(72, 6, 4, 'black'), circle(128, 6, 4, 'black'),
      ...[[34, 100, 16, 92], [30, 140, 12, 140], [34, 180, 16, 190], [166, 100, 184, 92], [170, 140, 188, 140], [166, 180, 184, 190]].map(([a, b, c, d]) => line(a, b, c, d, 1.2)),
      cut(circle(100, 48, 30)),
      cut(circle(100, 136, 76)),
      line(100, 62, 100, 212),
      ...eye(88, 40, 4), ...eye(112, 40, 4),
      circle(66, 112, 13), circle(134, 112, 13), circle(62, 160, 11), circle(138, 160, 11), circle(84, 190, 9), circle(116, 190, 9),
    ]),
  },
  {
    id: 'flower', title: 'Frühlingsblume',
    intro: 'Eine Blume mit Blütenblättern aus Papierschnipseln.',
    materials: [...BASIC, 'bunte Papierschnipsel oder Seidenpapier'],
    steps: ['Blume ausmalen.', 'Blume ausschneiden.', 'Kleine Papierkugeln in die Mitte und auf die Blätter kleben.'],
    drawing: pic([
      cut(path('M94 116 L94 212 L106 212 L106 116 Z')),
      cut(path('M100 186 Q60 150 36 176 Q66 198 100 192 Z')), cut(path('M100 166 Q140 130 166 152 Q136 178 100 172 Z')),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => cut(circle(100 + 40 * Math.cos((i * Math.PI) / 4), 78 + 40 * Math.sin((i * Math.PI) / 4), 24))),
      circle(100, 78, 26), ...eye(91, 72, 3.5), ...eye(109, 72, 3.5), smile(100, 86, 16, 6),
    ]),
  },
  {
    id: 'caterpillar', title: 'Raupe',
    intro: 'Eine Raupe aus bunten Kreisen. Jeder Kreis eine andere Farbe.',
    materials: [...BASIC],
    steps: ['Jeden Kreis in einer anderen Farbe ausmalen.', 'Raupe als Ganzes ausschneiden.', 'Füße dazumalen und zählen, wie viele Kreise die Raupe hat.'],
    drawing: pic([
      ...[30, 60, 90, 120, 150].map((x, i) => cut(circle(x, 140 + (i % 2 ? -14 : 8), 24))),
      ...[30, 60, 90, 120, 150].flatMap((x, i) => [line(x - 6, 162 + (i % 2 ? -14 : 8) + 4, x - 8, 178 + (i % 2 ? -14 : 8), 1), line(x + 6, 162 + (i % 2 ? -14 : 8) + 4, x + 8, 178 + (i % 2 ? -14 : 8), 1)]),
      line(170, 82, 160, 58, 1), line(188, 84, 194, 60, 1), circle(160, 58, 5, 'black'), circle(194, 60, 5, 'black'),
      cut(circle(176, 112, 26)),
      ...eye(168, 106, 4), ...eye(186, 106, 4), smile(177, 120, 16, 6),
    ]),
  },
];

const SUMMER: Craft[] = [
  {
    id: 'fish', title: 'Schuppenfisch',
    intro: 'Ein Fisch mit glänzenden Schuppen.',
    materials: [...BASIC, 'Alufolie, Seidenpapier oder bunte Schnipsel'],
    steps: ['Fisch bunt anmalen.', 'Fisch ausschneiden.', 'Schnipsel oder Alufolie als Schuppen aufkleben.'],
    drawing: pic([
      cut(poly([[150, 110], [196, 62], [196, 158]])),
      cut(poly([[80, 70], [100, 36], [124, 70]])), cut(poly([[90, 148], [110, 176], [122, 148]])),
      cut(ellipse(92, 110, 76, 50)),
      ...eye(48, 98, 7), smile(28, 122, 12, 4),
      path('M70 64 Q60 110 70 156', 'none', 0.8),
      ...[90, 112, 134].flatMap((x) => [80, 104, 128].map((y) => path(`M${x} ${y} Q${x + 10} ${y + 10} ${x} ${y + 20}`, 'none', 0.7))),
    ]),
  },
  {
    id: 'sun', title: 'Lachende Sonne',
    intro: 'Eine Sonne, die Strahlen bekommt: aus Papierstreifen oder gemalt.',
    materials: [...BASIC, 'gelbes und oranges Papier (wer mag)'],
    steps: ['Sonne gelb und orange anmalen.', 'Sonne mit allen Strahlen ausschneiden.', 'Gesicht malen, aufs Fenster oder an die Tür kleben.'],
    drawing: pic([
      cut(path(Array.from({ length: 24 }, (_, i) => {
        const a = (i * Math.PI) / 12;
        const r = i % 2 ? 62 : 96;
        return `${i ? 'L' : 'M'}${(100 + r * Math.cos(a)).toFixed(1)} ${(112 + r * Math.sin(a)).toFixed(1)}`;
      }).join(' ') + ' Z')),
      circle(100, 112, 52),
      ...eye(84, 100, 5), ...eye(116, 100, 5), smile(100, 124, 32, 12),
      circle(70, 120, 7, 'none', 0.7), circle(130, 120, 7, 'none', 0.7),
    ]),
  },
  {
    id: 'snail', title: 'Wollschnecke',
    intro: 'Das Schneckenhaus wird mit Wolle beklebt, immer rundherum.',
    materials: [...BASIC, 'Wollfaden oder Kordel', 'flüssiger Kleber'],
    steps: ['Schnecke ausmalen und ausschneiden.', 'Kleber auf die Schneckenlinie streichen.', 'Wolle von außen nach innen auflegen und andrücken.'],
    drawing: pic([
      line(166, 112, 158, 82, 1), line(180, 114, 188, 84, 1), circle(158, 82, 5, 'black'), circle(188, 84, 5, 'black'),
      cut(path('M10 184 Q10 168 36 168 L150 168 Q156 112 178 112 Q196 112 196 140 L192 176 Q190 186 170 186 L22 190 Q10 190 10 184 Z')),
      cut(circle(90, 112, 62)),
      spiral(90, 112, 58),
      ...eye(178, 130, 4), smile(182, 146, 10, 4),
    ]),
  },
  {
    id: 'ice-cream', title: 'Eistüte',
    intro: 'Ein Eis mit drei Kugeln. Welche Sorten nimmst du?',
    materials: [...BASIC, 'Papierschnipsel als Streusel (wer mag)'],
    steps: ['Jede Kugel in einer Lieblingsfarbe anmalen, die Waffel braun.', 'Eis ausschneiden.', 'Streusel aufkleben oder dazumalen.'],
    drawing: pic([
      cut(circle(68, 98, 36)), cut(circle(132, 98, 36)), cut(circle(100, 50, 36)),
      cut(poly([[52, 120], [148, 120], [100, 214]])),
      ...[140, 160, 180, 200].map((y) => {
        const half = (48 * (214 - y)) / 94;
        return line(100 - half, y, 100 + half, y, 0.8);
      }),
      line(76, 120, 100, 214, 0.8), line(100, 120, 100, 214, 0.8), line(124, 120, 100, 214, 0.8),
      path('M36 108 Q52 122 70 112 Q86 122 100 112 Q116 122 132 112 Q148 122 166 108', 'none', 0.8),
    ]),
  },
];

export const CRAFTS: Record<Season, Craft[]> = { autumn: AUTUMN, winter: WINTER, spring: SPRING, summer: SUMMER };

/** September bis November Herbst, Dezember bis Februar Winter, März bis Mai Frühling, Juni bis August Sommer. */
export function seasonOf(month: number): Season {
  if (month >= 8 && month <= 10) return 'autumn';
  if (month === 11 || month <= 1) return 'winter';
  if (month <= 4) return 'spring';
  return 'summer';
}

/** Bastelidee einer Woche (`month` wie bei Date.getMonth, 0 = Januar). Jede Woche die nächste aus der Jahreszeit. */
export function craftForWeek(isoWeek: number, month: number): Craft {
  const pool = CRAFTS[seasonOf(month)];
  return pool[isoWeek % pool.length];
}

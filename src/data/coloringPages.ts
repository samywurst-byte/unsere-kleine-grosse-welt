/**
 * Wöchentliche Ausmalbilder: eigene, einfache Zeichnungen (keine Figuren aus Filmen oder Serien, der Code ist öffentlich).
 * 10 Themen mit je 3 Bildern. Laternen um Sankt Martin, Weihnachtsmann vor Weihnachten, sonst wechseln die Themen alle 3 Wochen.
 * Zeichenfläche 200 × 260.
 */
import { circle, ellipse, eye, grass, line, path, place, poly, rect, smile, snowflake, star, type DrawShape, type Drawing } from './drawKit';

export interface ColoringTheme { id: string; name: string; pictures: { title: string; drawing: Drawing }[] }

const W = 200;
const H = 260;
const pic = (shapes: DrawShape[]): Drawing => ({ width: W, height: H, shapes });

// ------------------------------------------------------------ Bausteine

function sun(cx: number, cy: number, r: number): DrawShape[] {
  const rays: DrawShape[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5;
    rays.push(line(cx + (r + 4) * Math.cos(a), cy + (r + 4) * Math.sin(a), cx + (r + 12) * Math.cos(a), cy + (r + 12) * Math.sin(a), 0.9));
  }
  return [...rays, circle(cx, cy, r)];
}

function cloud(cx: number, cy: number, s = 1): DrawShape {
  const d = `M${cx - 26 * s} ${cy + 8 * s} Q${cx - 34 * s} ${cy - 6 * s} ${cx - 18 * s} ${cy - 8 * s} Q${cx - 14 * s} ${cy - 24 * s} ${cx + 2 * s} ${cy - 18 * s} `
    + `Q${cx + 14 * s} ${cy - 28 * s} ${cx + 22 * s} ${cy - 10 * s} Q${cx + 36 * s} ${cy - 8 * s} ${cx + 28 * s} ${cy + 8 * s} Z`;
  return path(d);
}

const moon = (cx: number, cy: number, r: number): DrawShape =>
  path(`M${cx} ${cy - r} Q${cx - r * 1.4} ${cy} ${cx} ${cy + r} Q${cx - r * 0.6} ${cy} ${cx} ${cy - r} Z`);

function tree(x: number, ground: number, h = 70): DrawShape[] {
  return [rect(x - 6, ground - h * 0.45, 12, h * 0.45), circle(x, ground - h * 0.62, h * 0.32), circle(x - h * 0.22, ground - h * 0.5, h * 0.2), circle(x + h * 0.22, ground - h * 0.5, h * 0.2)];
}

function flower(x: number, ground: number, h = 24): DrawShape[] {
  const cy = ground - h;
  return [line(x, ground, x, cy), ...[0, 1, 2, 3, 4].map((i) => circle(x + 6 * Math.cos((i * 2 * Math.PI) / 5), cy + 6 * Math.sin((i * 2 * Math.PI) / 5), 4.5)), circle(x, cy, 3.5)];
}

function princess(): DrawShape[] {
  return [
    path('M86 104 L40 230 Q100 248 160 230 L114 104 Z'),
    path('M76 60 Q66 100 72 132 L128 132 Q134 100 124 60 Z'),
    path('M80 110 L120 110 L150 225 Q100 240 50 225 Z'),
    path('M86 104 L70 148 L79 151 L93 112 Z'), path('M114 104 L130 148 L121 151 L107 112 Z'),
    circle(75, 151, 5), circle(125, 151, 5),
    rect(84, 100, 32, 30, 6), rect(95, 86, 10, 16),
    circle(100, 70, 22),
    path('M78 68 Q82 44 100 46 Q118 44 122 68 Q112 56 100 58 Q88 56 78 68 Z'),
    poly([[86, 50], [88, 34], [94, 44], [100, 30], [106, 44], [112, 34], [114, 50]]),
    ...eye(92, 72, 2.6), ...eye(108, 72, 2.6), smile(100, 80, 10),
    ...snowflake(100, 180, 8), ...snowflake(80, 207, 6), ...snowflake(120, 207, 6),
  ];
}

function snowman(x: number, ground: number): DrawShape[] {
  return [
    circle(x, ground - 32, 32), circle(x, ground - 86, 24), circle(x, ground - 125, 17),
    rect(x - 14, ground - 152, 28, 16, 2), rect(x - 20, ground - 140, 40, 5, 2),
    poly([[x, ground - 126], [x + 18, ground - 122], [x, ground - 120]]),
    ...eye(x - 6, ground - 130, 2.2), ...eye(x + 6, ground - 130, 2.2),
    circle(x, ground - 92, 2.5, 'black'), circle(x, ground - 80, 2.5, 'black'), circle(x, ground - 40, 2.5, 'black'),
    path(`M${x - 22} ${ground - 108} Q${x} ${ground - 100} ${x + 22} ${ground - 108} L${x + 22} ${ground - 101} Q${x} ${ground - 93} ${x - 22} ${ground - 101} Z`),
    rect(x + 8, ground - 104, 8, 22, 2),
    line(x - 22, ground - 88, x - 44, ground - 104, 1.2), line(x + 22, ground - 88, x + 44, ground - 104, 1.2),
  ];
}

function puppyBody(): DrawShape[] {
  return [
    path('M138 205 Q172 196 166 162 Q160 160 158 166 Q160 188 136 194 Z'),
    ellipse(100, 188, 45, 44),
    rect(78, 196, 16, 40, 8), rect(106, 196, 16, 40, 8),
    ellipse(86, 236, 12, 6), ellipse(114, 236, 12, 6),
    rect(76, 146, 48, 9, 4), circle(100, 162, 11),
    ellipse(100, 165, 4, 3.4, 'black'), circle(95, 158, 1.8, 'black'), circle(100, 156, 1.8, 'black'), circle(105, 158, 1.8, 'black'),
  ];
}

function puppyHead(): DrawShape[] {
  return [
    circle(100, 110, 40),
    path('M66 92 Q46 120 60 142 Q74 134 77 104 Z'), path('M134 92 Q154 120 140 142 Q126 134 123 104 Z'),
    ellipse(100, 128, 18, 13), ellipse(100, 121, 7, 5, 'black'),
    path('M100 126 Q100 134 92 136', 'none'), path('M100 126 Q100 134 108 136', 'none'),
    ...eye(86, 106, 4), ...eye(114, 106, 4),
    path('M60 98 Q60 52 100 52 Q140 52 140 98 Q100 86 60 98 Z'),
    path('M56 100 Q100 86 144 100 L146 92 Q100 78 54 92 Z'),
    star(100, 70, 10, 4.5),
  ];
}

function tower(x: number, ground: number, w: number, h: number, roof = true): DrawShape[] {
  const top = ground - h;
  return [
    rect(x, top, w, h),
    ...(roof ? [poly([[x - 5, top], [x + w / 2, top - w * 1.1], [x + w + 5, top]])] : [poly([[x, top], [x, top - 8], [x + w / 4, top - 8], [x + w / 4, top], [x + w * 0.375, top], [x + w * 0.375, top - 8], [x + w * 0.625, top - 8], [x + w * 0.625, top], [x + w * 0.75, top], [x + w * 0.75, top - 8], [x + w, top - 8], [x + w, top]], false)]),
    path(`M${x + w / 2 - 5} ${top + 30} L${x + w / 2 - 5} ${top + 20} Q${x + w / 2} ${top + 12} ${x + w / 2 + 5} ${top + 20} L${x + w / 2 + 5} ${top + 30} Z`),
  ];
}

function dragon(): DrawShape[] {
  return [
    path('M140 200 C175 205 190 180 180 160 C192 185 175 215 138 214 Z'),
    path('M70 150 C40 120 30 150 34 168 C44 158 56 160 70 170 Z'),
    path('M130 150 C160 120 170 150 166 168 C156 158 144 160 130 170 Z'),
    ellipse(100, 185, 42, 40),
    ellipse(100, 195, 25, 24),
    line(84, 186, 116, 186, 0.7), line(82, 198, 118, 198, 0.7), line(86, 210, 114, 210, 0.7),
    ellipse(80, 228, 14, 8), ellipse(120, 228, 14, 8),
    poly([[78, 82], [70, 52], [92, 76]]), poly([[122, 82], [130, 52], [108, 76]]),
    circle(100, 110, 40),
    poly([[94, 71], [100, 60], [106, 71]]),
    circle(86, 104, 10), circle(114, 104, 10), ...eye(88, 106, 5), ...eye(116, 106, 5),
    circle(72, 124, 6, 'none', 0.6), circle(128, 124, 6, 'none', 0.6),
    circle(94, 122, 1.8, 'black'), circle(106, 122, 1.8, 'black'),
    smile(100, 130, 22, 9),
  ];
}

function car(x: number, y: number, num: string): DrawShape[] {
  // Rennauto von der Seite, x/y = linke obere Ecke der Karosserie, Breite 150
  return [
    path(`M${x} ${y + 40} L${x + 10} ${y + 20} L${x + 50} ${y + 14} L${x + 70} ${y} L${x + 105} ${y} L${x + 120} ${y + 16} L${x + 150} ${y + 22} L${x + 152} ${y + 40} Z`),
    path(`M${x + 74} ${y + 4} L${x + 102} ${y + 4} L${x + 112} ${y + 16} L${x + 66} ${y + 16} Z`),
    poly([[x + 140, y + 22], [x + 140, y + 6], [x + 158, y + 4], [x + 156, y + 22]]),
    circle(x + 32, y + 42, 15), circle(x + 32, y + 42, 6), circle(x + 122, y + 42, 15), circle(x + 122, y + 42, 6),
    circle(x + 82, y + 30, 9), path(num === '1' ? `M${x + 80} ${y + 26} L${x + 83} ${y + 24} L${x + 83} ${y + 35}` : `M${x + 79} ${y + 26} Q${x + 83} ${y + 22} ${x + 85} ${y + 27} L${x + 79} ${y + 35} L${x + 86} ${y + 35}`, 'none'),
    line(x - 6, y + 26, x - 22, y + 26, 0.8), line(x - 4, y + 34, x - 26, y + 34, 0.8),
  ];
}

// ------------------------------------------------------------ Themen

const ICE: ColoringTheme = {
  id: 'ice', name: 'Eisprinzessin', pictures: [
    { title: 'Die Eisprinzessin', drawing: pic([
      ...snowflake(30, 40, 12), ...snowflake(172, 52, 10), ...snowflake(24, 160, 9), ...snowflake(178, 150, 12),
      path('M0 244 Q50 232 100 244 Q150 256 200 240', 'none'), ...princess()]) },
    { title: 'Das Eisschloss', drawing: pic([
      moon(170, 30, 14), ...snowflake(24, 30, 9), ...snowflake(120, 18, 7),
      ...tower(80, 150, 40, 90), ...tower(28, 236, 32, 140), ...tower(140, 236, 32, 140),
      rect(55, 140, 90, 96), poly([[55, 140], [55, 130], [70, 130], [70, 140], [85, 140], [85, 130], [100, 130], [100, 140], [115, 140], [115, 130], [130, 130], [130, 140], [145, 140], [145, 130]], false),
      path('M86 236 L86 200 Q100 182 114 200 L114 236 Z'), line(100, 191, 100, 236, 0.8),
      poly([[60, 140], [64, 152], [68, 140]]), poly([[132, 140], [136, 152], [140, 140]]),
      line(100, 16, 100, 4, 1), poly([[100, 4], [114, 8], [100, 12]]),
      path('M0 246 Q60 236 100 244 Q150 252 200 242', 'none')]) },
    { title: 'Prinzessin und Schneemann', drawing: pic([
      ...snowflake(30, 34, 10), ...snowflake(160, 30, 8), ...snowflake(100, 50, 6),
      path('M0 244 Q60 232 120 244 Q160 250 200 240', 'none'),
      ...snowman(52, 244), ...place(princess(), 70, 72, 0.72)]) },
  ],
};

const DOGS: ColoringTheme = {
  id: 'dogs', name: 'Rettungshunde', pictures: [
    { title: 'Der kleine Rettungshund', drawing: pic([
      ...sun(170, 30, 14), ...grass(242, 0, 200), ...puppyBody(), ...puppyHead(),
      path('M30 236 Q24 228 30 224 Q36 222 38 228 L56 228 Q58 222 64 224 Q70 228 64 236 Q70 244 64 248 Q58 250 56 244 L38 244 Q36 250 30 248 Q24 244 30 236 Z')]) },
    { title: 'Das Feuerwehrauto', drawing: pic([
      cloud(40, 40), cloud(150, 30, 0.8), ...grass(240, 0, 200),
      ...place(puppyHead(), 18, 30, 0.62),
      rect(14, 140, 120, 68, 8), path('M134 112 L176 112 Q186 112 186 122 L186 208 L134 208 Z'),
      rect(144, 120, 32, 26, 4), rect(152, 100, 16, 12, 3), line(140, 160, 140, 200, 0.8), rect(166, 170, 12, 5, 2),
      rect(24, 150, 50, 30, 4), circle(100, 172, 16), circle(100, 172, 6),
      line(22, 132, 122, 112, 1), line(26, 140, 126, 120, 1),
      ...[0, 1, 2, 3, 4, 5].map((i) => line(32 + i * 16, 130 - i * 3.2, 34 + i * 16, 138 - i * 3.2, 0.9)),
      circle(46, 210, 18), circle(46, 210, 7), circle(156, 210, 18), circle(156, 210, 7),
      path('M100 156 Q130 120 176 70', 'none'), path('M176 64 Q181 72 176 76 Q171 72 176 64 Z'), path('M186 84 Q191 92 186 96 Q181 92 186 84 Z')]) },
    { title: 'Die Hundehütte', drawing: pic([
      ...sun(30, 30, 12), cloud(150, 36), ...grass(240, 0, 200),
      poly([[10, 140], [65, 92], [120, 140]]), rect(20, 140, 90, 100),
      path('M42 240 L42 190 Q65 164 88 190 L88 240 Z'),
      ...place(puppyHead(), 32, 136, 0.33),
      rect(46, 112, 38, 14, 4),
      ...place([...puppyBody(), ...puppyHead()], 80, 70, 0.6),
      ...flower(20, 240), ...flower(186, 240, 18)]) },
  ],
};

const DINOS: ColoringTheme = {
  id: 'dinos', name: 'Dinos', pictures: [
    { title: 'Der Langhals', drawing: pic([
      ...sun(172, 30, 13), ...grass(240, 0, 200),
      path('M25 240 Q30 170 22 120 L32 120 Q40 170 38 240 Z'),
      path('M27 118 Q5 110 0 128 Q14 116 27 122 Z'), path('M27 118 Q50 104 60 120 Q44 112 27 122 Z'), path('M27 118 Q16 92 0 96 Q18 100 27 120 Z'), path('M27 118 Q40 90 58 92 Q42 100 28 120 Z'),
      rect(80, 190, 16, 50, 6), rect(150, 190, 16, 50, 6),
      path('M160 165 Q190 185 198 214 Q180 202 158 196 Z'),
      path('M86 168 Q66 100 74 52 L92 54 Q90 110 110 158 Z'),
      ellipse(122, 175, 52, 34), rect(100, 195, 16, 45, 6), rect(132, 195, 16, 45, 6),
      ellipse(84, 46, 21, 13), ...eye(90, 42, 2.6), smile(90, 52, 10, 3), circle(102, 42, 1.4, 'black'),
      circle(110, 165, 6, 'none'), circle(132, 158, 8, 'none'), circle(140, 182, 5, 'none'), circle(118, 186, 4, 'none')]) },
    { title: 'Der kleine T-Rex', drawing: pic([
      ...sun(30, 30, 11), cloud(80, 26, 0.8),
      ...grass(240, 0, 200),
      path('M70 172 Q30 196 12 236 Q46 212 80 198 Z'),
      rect(90, 192, 22, 46, 9), rect(124, 188, 22, 50, 9),
      path('M112 104 L152 104 L156 150 L104 152 Z'),
      ellipse(112, 166, 44, 40),
      path('M140 160 L158 168 L154 175 L138 170 Z'),
      rect(108, 66, 78, 50, 20), line(128, 102, 184, 102, 1),
      ...[0, 1, 2, 3, 4].map((i) => poly([[134 + i * 10, 102], [139 + i * 10, 109], [144 + i * 10, 102]])),
      ...eye(152, 82, 4), circle(178, 78, 1.8, 'black'),
      ellipse(102, 172, 18, 24, 'none', 0.6)]) },
    { title: 'Stegosaurus und das Ei', drawing: pic([
      cloud(40, 34), cloud(160, 44, 0.8), ...grass(240, 0, 200),
      ...[[60, 140], [82, 124], [106, 118], [130, 124], [150, 138]].map(([x, y]) => poly([[x - 12, y + 22], [x - 8, y - 6], [x, y - 16], [x + 8, y - 6], [x + 12, y + 22]])),
      path('M150 170 Q182 172 196 156 L198 166 Q186 186 150 190 Z'), poly([[186, 162], [192, 146], [194, 164]]), poly([[176, 170], [180, 154], [184, 170]]),
      rect(58, 180, 15, 40, 6), rect(126, 180, 15, 40, 6),
      ellipse(100, 168, 58, 30),
      rect(78, 182, 15, 38, 6), rect(106, 182, 15, 38, 6),
      path('M48 166 Q30 166 22 178 L30 186 Q40 180 52 180 Z'), ellipse(22, 182, 16, 11), ...eye(18, 178, 2.4), smile(16, 186, 8, 3),
      ellipse(160, 222, 20, 24), path('M140 220 L148 212 L154 222 L162 210 L168 222 L176 212 L180 220', 'none'),
      circle(160, 208, 9), ...eye(157, 206, 1.8), ...eye(164, 206, 1.8)]) },
  ],
};

const WILD: ColoringTheme = {
  id: 'wild', name: 'Wilde Tiere', pictures: [
    { title: 'Der Löwe', drawing: pic([
      ...grass(244, 0, 200),
      path('M138 220 Q176 214 172 180', 'none'), path('M172 180 Q164 166 176 160 Q188 168 180 182 Z'),
      ellipse(100, 202, 46, 40), ellipse(78, 238, 14, 7), ellipse(122, 238, 14, 7),
      ...Array.from({ length: 14 }, (_, i) => circle(100 + 56 * Math.cos((i * 2 * Math.PI) / 14), 108 + 56 * Math.sin((i * 2 * Math.PI) / 14), 18)),
      circle(66, 70, 12), circle(134, 70, 12),
      circle(100, 108, 48),
      ...eye(84, 98, 4), ...eye(116, 98, 4),
      ellipse(90, 128, 14, 11), ellipse(110, 128, 14, 11), poly([[92, 114], [108, 114], [100, 124]], true, 'black'),
      path('M94 140 Q100 146 106 140', 'none'),
      circle(86, 128, 1.2, 'black'), circle(90, 133, 1.2, 'black'), circle(114, 128, 1.2, 'black'), circle(110, 133, 1.2, 'black')]) },
    { title: 'Der Elefant', drawing: pic([
      ...sun(170, 30, 12), ...grass(240, 0, 200), ...tree(24, 240, 80),
      rect(84, 180, 20, 58, 8), rect(150, 180, 20, 58, 8),
      line(176, 150, 188, 176, 1),
      ellipse(128, 160, 56, 44),
      rect(100, 186, 20, 52, 8), rect(134, 186, 20, 52, 8),
      circle(80, 120, 36),
      path('M58 132 Q40 176 52 208 Q60 214 64 206 Q56 178 76 144 Z'),
      ellipse(104, 120, 26, 36),
      ...eye(72, 110, 3.4),
      path('M70 142 Q62 152 52 150', 'none'), path('M88 140 Q92 152 86 158 Q80 152 84 140 Z')]) },
    { title: 'Die Giraffe', drawing: pic([
      cloud(150, 30), ...grass(240, 0, 200),
      rect(150, 120, 12, 120), path('M120 120 Q118 90 156 94 Q196 90 194 120 Z'),
      rect(80, 160, 12, 78, 4), rect(130, 160, 12, 78, 4),
      path('M70 150 Q60 90 58 50 L76 48 Q82 100 100 140 Z'),
      rect(96, 166, 12, 72, 4), rect(118, 166, 12, 72, 4),
      ellipse(110, 155, 42, 26),
      line(56, 28, 54, 16), circle(54, 14, 3.5), line(68, 28, 70, 16), circle(70, 14, 3.5),
      ellipse(48, 32, 7, 4), ellipse(64, 38, 22, 14), ...eye(64, 34, 2.6), circle(48, 40, 1.4, 'black'), smile(56, 44, 8, 3),
      rect(92, 140, 14, 10, 4, 'none'), rect(116, 146, 16, 12, 4, 'none'), rect(132, 160, 12, 10, 4, 'none'), rect(98, 162, 14, 10, 4, 'none'),
      rect(64, 80, 10, 10, 3, 'none'), rect(70, 110, 12, 10, 3, 'none'), rect(62, 56, 8, 8, 3, 'none')]) },
  ],
};

const SANTA_HEAD = (): DrawShape[] => [
  path('M70 92 Q60 140 100 150 Q140 140 130 92 Z'),
  circle(100, 88, 26),
  path('M74 80 Q78 36 120 30 Q140 30 146 58 Q130 48 124 50 Q124 66 126 78 Z'),
  circle(148, 62, 8), rect(70, 72, 60, 12, 6),
  path('M100 100 Q88 94 78 104 Q90 108 100 104 Q110 108 122 104 Q112 94 100 100 Z'),
  circle(100, 96, 6), ...eye(90, 90, 2.6), ...eye(110, 90, 2.6),
];

const SANTA: ColoringTheme = {
  id: 'santa', name: 'Weihnachtsmann', pictures: [
    { title: 'Der Weihnachtsmann', drawing: pic([
      ...snowflake(24, 30, 8), ...snowflake(176, 24, 8), ...snowflake(20, 140, 7),
      path('M136 140 Q196 130 186 200 Q176 230 140 222 Z'), path('M150 140 Q160 128 172 134', 'none'),
      rect(74, 214, 20, 26, 4), rect(106, 214, 20, 26, 4), ellipse(80, 240, 16, 6), ellipse(120, 240, 16, 6),
      path('M72 128 L128 128 L140 220 L60 220 Z'),
      rect(60, 186, 80, 12), rect(92, 184, 16, 16, 2),
      line(100, 150, 100, 184, 0.8), path('M60 214 L140 214', 'none', 0.8),
      path('M72 134 L50 178 L60 182 L78 146 Z'), circle(54, 182, 7),
      ...SANTA_HEAD()]) },
    { title: 'Der Schlitten', drawing: pic([
      moon(170, 30, 14), star(30, 30, 7, 3), star(110, 20, 5, 2.4), star(70, 50, 6, 2.6),
      rect(70, 110, 30, 28, 2), line(85, 110, 85, 138, 0.8), path('M78 110 Q85 98 85 110 Q85 98 92 110', 'none'),
      rect(98, 100, 34, 38, 2), line(98, 118, 132, 118, 0.8), line(115, 100, 115, 138, 0.8),
      ...place(SANTA_HEAD(), 2, 40, 0.6),
      path('M30 136 L170 136 Q178 176 150 186 L50 186 Q30 176 30 136 Z'),
      star(100, 160, 10, 4.5),
      path('M20 206 L160 206 Q186 206 186 186', 'none'), line(56, 186, 56, 206), line(144, 186, 144, 206),
      path('M0 236 Q60 224 120 236 Q160 244 200 232', 'none')]) },
    { title: 'Der Weihnachtsbaum', drawing: pic([
      star(100, 24, 16, 7),
      poly([[100, 38], [60, 92], [140, 92]]), poly([[100, 70], [48, 140], [152, 140]]), poly([[100, 110], [36, 190], [164, 190]]),
      rect(90, 190, 20, 22),
      circle(88, 80, 6), circle(118, 120, 7), circle(72, 128, 6), circle(104, 160, 7), circle(60, 176, 6), circle(140, 174, 6),
      path('M70 100 Q100 112 130 100', 'none', 0.7), path('M58 150 Q100 166 142 150', 'none', 0.7),
      rect(24, 200, 50, 40, 2), line(49, 200, 49, 240, 0.8), path('M42 200 Q49 186 49 200 Q49 186 56 200', 'none'),
      rect(126, 206, 52, 34, 2), line(126, 222, 178, 222, 0.8), line(152, 206, 152, 240, 0.8),
      rect(84, 220, 30, 20, 2), line(99, 220, 99, 240, 0.8),
      line(0, 240, 200, 240)]) },
  ],
};

function lantern(cx: number, top: number): DrawShape[] {
  return [
    line(cx, top - 16, cx, top, 1), rect(cx - 26, top, 52, 64, 3), ellipse(cx, top, 26, 6), ellipse(cx, top + 64, 26, 6),
    moon(cx - 6, top + 32, 12), star(cx + 12, top + 22, 7, 3),
  ];
}

const LANTERN: ColoringTheme = {
  id: 'lantern', name: 'Laternen', pictures: [
    { title: 'Meine Laterne', drawing: pic([
      moon(36, 34, 16), star(160, 26, 8, 3.5), star(120, 50, 5, 2.4), star(180, 80, 6, 2.6),
      line(30, 250, 150, 56, 1.4), path('M150 56 Q164 50 158 70', 'none'),
      ...lantern(140, 96),
      path('M140 166 Q134 178 140 186 Q146 178 140 166 Z'),
      ...grass(250, 0, 200)]) },
    { title: 'Laternenumzug', drawing: pic([
      star(30, 24, 7, 3), star(90, 16, 5, 2.4), moon(170, 30, 13),
      poly([[20, 240], [20, 190], [40, 172], [60, 190], [60, 240]]), rect(32, 206, 14, 16),
      poly([[160, 240], [160, 186], [178, 168], [196, 186], [196, 240]]), rect(170, 200, 14, 16),
      rect(80, 196, 14, 40, 6), rect(104, 196, 14, 40, 6), ellipse(86, 238, 12, 6), ellipse(112, 238, 12, 6),
      path('M76 128 L122 128 L130 204 L68 204 Z'),
      path('M120 134 L148 104 L154 110 L126 142 Z'), circle(150, 106, 6),
      circle(99, 106, 22), ...eye(92, 106, 2.6), ...eye(106, 106, 2.6), smile(99, 114, 10),
      path('M76 102 Q78 76 99 76 Q120 76 122 102 Z'), circle(99, 70, 7),
      line(150, 104, 150, 74, 1), path('M150 74 L164 80', 'none'),
      circle(166, 108, 20), path('M146 108 L186 108', 'none', 0.7), path('M166 88 Q154 108 166 128', 'none', 0.7), path('M166 88 Q178 108 166 128', 'none', 0.7),
      line(166, 80, 166, 88, 1),
      line(0, 240, 200, 240)]) },
    { title: 'Drei Laternen', drawing: pic([
      moon(100, 214, 16), star(30, 210, 7, 3), star(170, 220, 6, 2.6),
      path('M0 20 Q100 70 200 20', 'none'),
      line(40, 32, 40, 60, 1), circle(40, 92, 30), path('M10 92 L70 92', 'none', 0.7), path('M40 62 Q22 92 40 122', 'none', 0.7), path('M40 62 Q58 92 40 122', 'none', 0.7),
      ...lantern(100, 60),
      line(160, 32, 160, 58, 1), star(160, 96, 38, 18), circle(160, 96, 8)]) },
  ],
};

const DRAGONS: ColoringTheme = {
  id: 'dragons', name: 'Drachen', pictures: [
    { title: 'Der kleine Drache', drawing: pic([
      ...sun(170, 30, 12), cloud(40, 36), ...grass(240, 0, 200), ...dragon(), ...flower(24, 240), ...flower(40, 240, 16), ...flower(178, 240)]) },
    { title: 'Drachen steigen lassen', drawing: pic([
      cloud(40, 34), cloud(160, 70, 0.8), ...grass(240, 0, 200),
      poly([[120, 20], [160, 60], [120, 120], [80, 60]]), line(120, 20, 120, 120, 0.7), line(80, 60, 160, 60, 0.7),
      ...eye(108, 50, 3), ...eye(132, 50, 3), smile(120, 70, 18, 7),
      path('M120 120 Q100 150 120 170 Q140 190 118 214', 'none', 0.8),
      ...[[110, 140], [126, 176], [122, 206]].map(([x, y]) => path(`M${x} ${y} L${x - 9} ${y - 6} L${x - 9} ${y + 6} Z M${x} ${y} L${x + 9} ${y - 6} L${x + 9} ${y + 6} Z`)),
      line(120, 120, 46, 190, 0.8),
      circle(40, 176, 13), ...eye(36, 174, 2), ...eye(45, 174, 2), smile(40, 181, 8, 3),
      path('M28 190 L52 190 L58 228 L22 228 Z'), line(52, 196, 46, 190, 1), rect(28, 228, 9, 12, 3), rect(43, 228, 9, 12, 3),
      path('M160 150 Q170 140 176 152 Q170 160 160 150 Z'), path('M178 190 Q188 180 194 192 Q188 200 178 190 Z')]) },
    { title: 'Der Drache und die Burg', drawing: pic([
      moon(170, 26, 12), star(130, 20, 5, 2.4), ...grass(240, 0, 200),
      ...tower(14, 240, 40, 150, false), ...tower(54, 240, 34, 110), rect(8, 196, 86, 44), path('M36 240 L36 214 Q51 200 66 214 L66 240 Z'),
      ...place(dragon(), 70, 46, 0.78)]) },
  ],
};

const FAIRY: ColoringTheme = {
  id: 'fairy', name: 'Märchen', pictures: [
    { title: 'Der Froschkönig', drawing: pic([
      ...sun(170, 30, 12),
      path('M0 200 Q100 186 200 200 L200 260 L0 260 Z', 'none'),
      path('M20 214 Q60 204 100 214', 'none', 0.7), path('M110 236 Q150 226 190 236', 'none', 0.7),
      path('M40 200 Q100 170 160 200 Q100 214 40 200 Z'),
      ellipse(100, 150, 46, 36),
      circle(78, 112, 14), circle(122, 112, 14), ...eye(78, 112, 6), ...eye(122, 112, 6),
      smile(100, 156, 44, 14),
      ellipse(70, 186, 16, 7), ellipse(130, 186, 16, 7),
      poly([[80, 98], [82, 76], [91, 88], [100, 72], [109, 88], [118, 76], [120, 98]]), circle(100, 72, 3),
      ...flower(170, 200, 30), ...flower(30, 198, 26)]) },
    { title: 'Rotkäppchen', drawing: pic([
      ...tree(30, 240, 110), ...tree(176, 240, 90), ...grass(240, 0, 200),
      rect(84, 196, 12, 40, 5), rect(104, 196, 12, 40, 5), ellipse(88, 238, 10, 5), ellipse(112, 238, 10, 5),
      path('M100 60 Q64 64 56 120 L64 200 L136 200 L144 120 Q136 64 100 60 Z'),
      path('M80 120 L120 120 L130 200 L70 200 Z'),
      circle(100, 96, 22), ...eye(92, 96, 2.6), ...eye(108, 96, 2.6), smile(100, 104, 10),
      path('M78 90 Q82 72 100 72 Q118 72 122 90 Q110 80 100 82 Q90 80 78 90 Z'),
      path('M124 160 Q160 160 160 170 L154 190 L130 190 L124 170 Z'), path('M128 162 Q142 136 156 162', 'none', 1.1),
      circle(136, 158, 5), circle(148, 156, 5),
      ...flower(66, 240, 18), ...flower(150, 240, 20)]) },
    { title: 'Das Hexenhaus', drawing: pic([
      moon(170, 28, 12), ...tree(22, 240, 90), ...grass(240, 0, 200),
      rect(140, 30, 14, 40), path('M150 26 Q156 16 150 8', 'none'),
      poly([[30, 120], [100, 50], [170, 120]]),
      ...[0, 1, 2, 3].map((i) => circle(66 + i * 22, 102, 6)),
      rect(44, 120, 112, 120),
      path('M86 240 L86 190 Q100 176 114 190 L114 240 Z'), circle(108, 214, 2.5, 'black'),
      rect(56, 140, 24, 24, 3), line(68, 140, 68, 164, 0.7), line(56, 152, 80, 152, 0.7),
      rect(120, 140, 24, 24, 3), line(132, 140, 132, 164, 0.7), line(120, 152, 144, 152, 0.7),
      ...[0, 1, 2, 3, 4].map((i) => rect(48 + i * 22, 124, 14, 8, 4, 'none')),
      circle(60, 196, 8), path('M52 196 L68 196', 'none', 0.6), circle(140, 196, 8), path('M140 188 L140 204', 'none', 0.6),
      ...[0, 1, 2, 3].map((i) => rect(52 + i * 28, 226, 10, 14, 5))]) },
  ],
};

const FARM: ColoringTheme = {
  id: 'farm', name: 'Bauernhof', pictures: [
    { title: 'Die Kuh', drawing: pic([
      ...sun(170, 30, 12), ...grass(240, 0, 200),
      line(10, 170, 10, 240), line(40, 170, 40, 240), line(4, 186, 46, 186), line(4, 210, 46, 210),
      rect(78, 168, 16, 70, 6), rect(150, 168, 16, 70, 6),
      path('M176 140 Q190 160 186 186', 'none'), path('M186 186 Q178 196 190 198 Q196 190 186 186 Z'),
      rect(70, 112, 110, 70, 26),
      rect(96, 172, 16, 66, 6), rect(132, 172, 16, 66, 6),
      path('M100 182 Q114 196 128 182', 'none'),
      path('M110 120 Q130 112 140 130 Q132 150 112 140 Z', 'none'), path('M150 150 Q168 146 166 164 Q150 170 148 158 Z', 'none'),
      path('M58 76 L52 60 L64 70 Z'), path('M98 76 L104 60 L92 70 Z'),
      ellipse(46, 92, 10, 6), ellipse(110, 92, 10, 6),
      circle(78, 104, 28), ellipse(78, 126, 22, 14), circle(70, 126, 2.4, 'black'), circle(86, 126, 2.4, 'black'),
      ...eye(68, 98, 3), ...eye(88, 98, 3)]) },
    { title: 'Der Traktor', drawing: pic([
      cloud(40, 34), ...sun(168, 32, 12), ...grass(240, 0, 200),
      rect(40, 120, 10, 30, 2), path('M40 120 Q46 104 52 112', 'none'),
      rect(30, 150, 100, 46, 6), rect(100, 80, 70, 116, 6), rect(112, 92, 46, 40, 4),
      line(30, 166, 100, 166, 0.7), ...[0, 1, 2].map((i) => line(40 + i * 18, 172, 40 + i * 18, 188, 0.8)),
      circle(146, 200, 38), circle(146, 200, 16), circle(146, 200, 5),
      circle(56, 214, 22), circle(56, 214, 8)]) },
    { title: 'Schwein und Huhn', drawing: pic([
      ...sun(30, 30, 12), cloud(150, 36), ...grass(240, 0, 200),
      rect(130, 90, 70, 150), poly([[124, 90], [165, 54], [206, 90]]), rect(146, 170, 40, 70), line(146, 170, 186, 240, 0.7), line(186, 170, 146, 240, 0.7),
      path('M36 186 Q24 180 28 172 Q34 176 36 182', 'none'),
      rect(48, 196, 12, 34, 4), rect(96, 196, 12, 34, 4),
      ellipse(76, 182, 44, 32),
      rect(60, 200, 12, 30, 4), rect(84, 200, 12, 30, 4),
      poly([[96, 150], [100, 134], [110, 150]]), poly([[118, 152], [128, 138], [130, 158]]),
      circle(112, 170, 22), ellipse(124, 176, 11, 9), circle(121, 176, 1.8, 'black'), circle(127, 176, 1.8, 'black'), ...eye(106, 164, 2.6), ...eye(120, 160, 2.4),
      path('M116 104 L124 120 L108 120 Z'), ellipse(120, 120, 18, 14), circle(108, 104, 10),
      path('M104 94 Q108 86 112 94 Q114 88 118 96', 'none'), poly([[98, 104], [92, 107], [98, 110]]), ...eye(106, 102, 1.8),
      line(116, 134, 114, 142), line(124, 134, 126, 142)]) },
  ],
};

const CARS: ColoringTheme = {
  id: 'cars', name: 'Rennautos', pictures: [
    { title: 'Das Rennauto', drawing: pic([
      ...sun(170, 30, 12), cloud(50, 40),
      rect(0, 196, 200, 40, 0, 'none'), ...[0, 1, 2, 3, 4].map((i) => rect(10 + i * 42, 214, 22, 4, 1)),
      ...car(28, 140, '1')]) },
    { title: 'Der Monstertruck', drawing: pic([
      cloud(40, 34), cloud(160, 30, 0.8), path('M0 240 Q50 210 100 236 Q150 220 200 240', 'none'),
      path('M30 140 L70 140 L84 104 L140 104 L150 140 L176 146 L176 176 L24 176 Z'),
      rect(92, 112, 22, 24, 3), rect(118, 112, 24, 24, 3),
      rect(56, 176, 14, 18, 2), rect(130, 176, 14, 18, 2),
      circle(56, 200, 36), circle(56, 200, 14), circle(146, 200, 36), circle(146, 200, 14),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => line(56 + 26 * Math.cos(i * Math.PI / 4), 200 + 26 * Math.sin(i * Math.PI / 4), 56 + 35 * Math.cos(i * Math.PI / 4), 200 + 35 * Math.sin(i * Math.PI / 4), 0.8)),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => line(146 + 26 * Math.cos(i * Math.PI / 4), 200 + 26 * Math.sin(i * Math.PI / 4), 146 + 35 * Math.cos(i * Math.PI / 4), 200 + 35 * Math.sin(i * Math.PI / 4), 0.8)),
      star(100, 158, 10, 4.5)]) },
    { title: 'Das Wettrennen', drawing: pic([
      ...sun(30, 28, 10), cloud(110, 40, 0.8),
      line(0, 120, 200, 120, 1.4), line(0, 240, 200, 240, 1.4),
      ...[0, 1, 2, 3, 4, 5].map((i) => line(4 + i * 30, 180, 20 + i * 30, 180, 1)),
      rect(166, 120, 16, 120, 0, 'none'),
      ...Array.from({ length: 24 }, (_, i) => i).filter((i) => (i + Math.floor(i / 2)) % 2 === 0).map((i) => rect(166 + (i % 2) * 8, 120 + Math.floor(i / 2) * 10, 8, 10, 0, 'black')),
      line(190, 60, 190, 120), poly([[190, 60], [170, 66], [190, 74]]),
      ...place(car(0, 0, '1'), 34, 128, 0.62),
      ...place(car(0, 0, '2'), 14, 190, 0.62)]) },
  ],
};

export const COLORING_THEMES: ColoringTheme[] = [ICE, DOGS, DINOS, WILD, DRAGONS, FAIRY, FARM, CARS, LANTERN, SANTA];

/** Feste Wochen: Laternen um Sankt Martin (KW 44 bis 46), Weihnachtsmann vor Weihnachten (KW 49 bis 51). */
const FIXED: { theme: string; from: number }[] = [{ theme: 'lantern', from: 44 }, { theme: 'santa', from: 49 }];
const ROTATING = COLORING_THEMES.filter((t) => !FIXED.some((x) => x.theme === t.id));

/** Ausmalbild einer Kalenderwoche: Thema wechselt alle 3 Wochen, innerhalb des Blocks Bild 1, 2, 3. */
export function coloringForWeek(isoWeek: number): { theme: ColoringTheme; index: number } {
  for (const f of FIXED) {
    if (isoWeek >= f.from && isoWeek < f.from + 3) return { theme: COLORING_THEMES.find((t) => t.id === f.theme)!, index: isoWeek - f.from };
  }
  const n = isoWeek - 1;
  return { theme: ROTATING[Math.floor(n / 3) % ROTATING.length], index: n % 3 };
}

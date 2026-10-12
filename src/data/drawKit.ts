/**
 * Kleiner Zeichenbaukasten für Ausmalbilder und Bastelvorlagen.
 * Koordinaten: x nach rechts, y nach unten. Spätere Formen werden über frühere gemalt (weiß gefüllt), so entsteht Verdeckung.
 */

export interface DrawShape {
  d: string;
  /** white = weiß gefüllt (verdeckt, was dahinter liegt), none = nur Linie, black = schwarz gefüllt (Augen). */
  fill?: 'white' | 'none' | 'black';
  /** Strichstärke relativ (1 = normal). */
  weight?: number;
  /** Gestrichelt, z. B. Schnittlinie. */
  dashed?: boolean;
}

export interface Drawing {
  width: number;
  height: number;
  shapes: DrawShape[];
}

const f = (n: number) => Number(n.toFixed(2));

export const circle = (cx: number, cy: number, r: number, fill: DrawShape['fill'] = 'white', weight?: number): DrawShape =>
  ellipse(cx, cy, r, r, fill, weight);

export function ellipse(cx: number, cy: number, rx: number, ry: number, fill: DrawShape['fill'] = 'white', weight?: number): DrawShape {
  const k = 0.5523;
  const d = `M${f(cx - rx)} ${f(cy)} C${f(cx - rx)} ${f(cy - ry * k)} ${f(cx - rx * k)} ${f(cy - ry)} ${f(cx)} ${f(cy - ry)} `
    + `C${f(cx + rx * k)} ${f(cy - ry)} ${f(cx + rx)} ${f(cy - ry * k)} ${f(cx + rx)} ${f(cy)} `
    + `C${f(cx + rx)} ${f(cy + ry * k)} ${f(cx + rx * k)} ${f(cy + ry)} ${f(cx)} ${f(cy + ry)} `
    + `C${f(cx - rx * k)} ${f(cy + ry)} ${f(cx - rx)} ${f(cy + ry * k)} ${f(cx - rx)} ${f(cy)} Z`;
  return { d, fill, weight };
}

export function rect(x: number, y: number, w: number, h: number, r = 0, fill: DrawShape['fill'] = 'white', weight?: number): DrawShape {
  if (!r) return { d: `M${f(x)} ${f(y)} L${f(x + w)} ${f(y)} L${f(x + w)} ${f(y + h)} L${f(x)} ${f(y + h)} Z`, fill, weight };
  const rr = Math.min(r, w / 2, h / 2);
  return {
    d: `M${f(x + rr)} ${f(y)} L${f(x + w - rr)} ${f(y)} Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + rr)} L${f(x + w)} ${f(y + h - rr)} Q${f(x + w)} ${f(y + h)} ${f(x + w - rr)} ${f(y + h)} `
      + `L${f(x + rr)} ${f(y + h)} Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - rr)} L${f(x)} ${f(y + rr)} Q${f(x)} ${f(y)} ${f(x + rr)} ${f(y)} Z`,
    fill, weight,
  };
}

export function poly(points: [number, number][], close = true, fill: DrawShape['fill'] = close ? 'white' : 'none', weight?: number): DrawShape {
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join(' ') + (close ? ' Z' : '');
  return { d, fill, weight };
}

export const line = (x1: number, y1: number, x2: number, y2: number, weight?: number): DrawShape => poly([[x1, y1], [x2, y2]], false, 'none', weight);

/** Freier Pfad (SVG-Syntax). */
export const path = (d: string, fill: DrawShape['fill'] = 'white', weight?: number): DrawShape => ({ d, fill, weight });

export function star(cx: number, cy: number, outer: number, inner: number, n = 5, fill: DrawShape['fill'] = 'white', rot = -90): DrawShape {
  const pts: [number, number][] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    const r = i % 2 ? inner : outer;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return poly(pts, true, fill);
}

/** Schneeflocke aus Strichen. */
export function snowflake(cx: number, cy: number, r: number): DrawShape[] {
  const out: DrawShape[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const ex = cx + r * Math.cos(a);
    const ey = cy + r * Math.sin(a);
    out.push(line(cx, cy, ex, ey, 0.8));
    const bx = cx + r * 0.6 * Math.cos(a);
    const by = cy + r * 0.6 * Math.sin(a);
    for (const s of [-1, 1]) out.push(line(bx, by, bx + r * 0.3 * Math.cos(a + s * 0.8), by + r * 0.3 * Math.sin(a + s * 0.8), 0.8));
  }
  return out;
}

/** Bogen-Lächeln. */
export const smile = (cx: number, cy: number, w: number, depth = w * 0.4): DrawShape =>
  path(`M${f(cx - w / 2)} ${f(cy)} Q${f(cx)} ${f(cy + depth)} ${f(cx + w / 2)} ${f(cy)}`, 'none');

/** Auge: schwarzer Punkt mit weißem Glanz. */
export const eye = (cx: number, cy: number, r = 3): DrawShape[] => [circle(cx, cy, r, 'black'), circle(cx + r * 0.35, cy - r * 0.35, r * 0.35, 'white', 0.2)];

/** Grashalme als Bodenlinie. */
export function grass(y: number, x1: number, x2: number, step = 14): DrawShape[] {
  const out: DrawShape[] = [line(x1, y, x2, y)];
  for (let x = x1 + 6; x < x2 - 4; x += step) out.push(poly([[x - 4, y], [x, y - 8], [x + 4, y]], false, 'none', 0.8));
  return out;
}

/** Verschiebt und skaliert eine Gruppe (für wiederverwendete Figuren). Pfade nur mit Punktpaaren (M, L, Q, C), kein H oder V. */
export function place(shapes: DrawShape[], dx: number, dy: number, s = 1): DrawShape[] {
  return shapes.map((sh) => ({
    ...sh,
    d: sh.d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x: string, y: string) => `${f(Number(x) * s + dx)} ${f(Number(y) * s + dy)}`),
    weight: sh.weight,
  }));
}

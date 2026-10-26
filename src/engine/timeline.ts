import { type Easing, linear } from "./easing.js";

/** Interpolation linéaire entre a et b. */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Anime une valeur de `from` vers `to` sur l'intervalle de temps [start, end]
 * (en secondes), avec l'easing donné. Avant `start` renvoie `from`, après
 * `end` renvoie `to`.
 */
export function animate(
  time: number,
  from: number,
  to: number,
  opts: { start: number; end: number; easing?: Easing } = { start: 0, end: 1 },
): number {
  const { start, end, easing = linear } = opts;
  if (end <= start) return time < end ? from : to;
  const raw = (time - start) / (end - start);
  const t = raw < 0 ? 0 : raw > 1 ? 1 : raw;
  return lerp(from, to, easing(t));
}

/**
 * Déclenche une animation « en avant seulement » à partir de `start`, d'une
 * durée `duration`. Pratique pour des apparitions (fade-in, montée, etc.).
 */
export function spawn(
  time: number,
  from: number,
  to: number,
  start: number,
  duration: number,
  easing?: Easing,
): number {
  return animate(time, from, to, { start, end: start + duration, easing });
}

/** Oscillation sinusoïdale continue (utile pour un flottement, un pouls…). */
export function oscillate(
  time: number,
  opts: { period: number; min?: number; max?: number; phase?: number } = { period: 1 },
): number {
  const { period, min = 0, max = 1, phase = 0 } = opts;
  const s = (Math.sin((time / period) * Math.PI * 2 + phase) + 1) / 2;
  return lerp(min, max, s);
}

/** Convertit un angle en degrés vers des radians. */
export const deg = (d: number): number => (d * Math.PI) / 180;

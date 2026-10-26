/**
 * Fonctions d'easing : prennent un t normalisé dans [0, 1] et renvoient une
 * valeur « eased » dans [0, 1]. Utilisées par la timeline (voir timeline.ts).
 */
export type Easing = (t: number) => number;

const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

export const linear: Easing = (t) => clamp01(t);

export const easeInQuad: Easing = (t) => {
  t = clamp01(t);
  return t * t;
};

export const easeOutQuad: Easing = (t) => {
  t = clamp01(t);
  return t * (2 - t);
};

export const easeInOutQuad: Easing = (t) => {
  t = clamp01(t);
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};

export const easeInOutCubic: Easing = (t) => {
  t = clamp01(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const easeOutCubic: Easing = (t) => {
  t = clamp01(t);
  return 1 - Math.pow(1 - t, 3);
};

export const easeOutBack: Easing = (t) => {
  t = clamp01(t);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export const easeOutElastic: Easing = (t) => {
  t = clamp01(t);
  const c4 = (2 * Math.PI) / 3;
  if (t === 0) return 0;
  if (t === 1) return 1;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

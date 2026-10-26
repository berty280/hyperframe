import type { SKRSContext2D } from "@napi-rs/canvas";

/** Contexte 2D du canvas (alias du type fourni par @napi-rs/canvas). */
export type Ctx = SKRSContext2D;

/** Informations fournies à la scène pour chaque frame rendue. */
export interface Frame {
  /** Index de la frame courante (0-based). */
  readonly index: number;
  /** Temps écoulé en secondes depuis le début (index / fps). */
  readonly time: number;
  /** Durée totale de la scène en secondes. */
  readonly duration: number;
  /** Avancement global normalisé dans [0, 1]. */
  readonly progress: number;
  readonly width: number;
  readonly height: number;
  readonly fps: number;
}

/**
 * Une scène décrit une animation : ses dimensions, sa durée, et comment
 * dessiner chaque frame. C'est le seul contrat qu'un auteur de motion
 * graphic doit implémenter.
 */
export interface Scene {
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  readonly durationInSeconds: number;
  /** Couleur de fond appliquée avant `draw` (optionnel). */
  readonly background?: string;
  /** Dessine la frame `frame` dans le contexte `ctx`. */
  draw(ctx: Ctx, frame: Frame): void;
}

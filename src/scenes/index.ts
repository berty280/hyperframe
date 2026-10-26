import type { Scene } from "../engine/types.js";
import { introScene } from "./intro.js";

/** Registre des scènes disponibles, indexées par nom. */
export const scenes: Record<string, Scene> = {
  [introScene.name]: introScene,
};

export function getScene(name: string): Scene | undefined {
  return scenes[name];
}

export function sceneNames(): string[] {
  return Object.keys(scenes);
}

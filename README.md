# hyperframe

Générateur de **motion graphics** : chaque image (frame) est dessinée par code sur
un canvas, puis les frames sont assemblées en **MP4** ou **GIF** via `ffmpeg`.
Pas de navigateur, pas de fichiers intermédiaires — les pixels sont envoyés en flux
brut à ffmpeg.

## Prérequis

- **Node ≥ 20**
- **ffmpeg** disponible dans le `PATH` (avec `libx264` pour le MP4)

## Installation

```bash
npm install
```

## Utilisation

```bash
# Rendu de la scène d'exemple en MP4 (out/intro.mp4)
npm run render

# Choisir la scène, le format et la sortie
npm run render -- --scene intro --format gif --out out/demo.gif

# Aide
npm run render -- --help
```

Options :

| Option            | Description                                            | Défaut              |
| ----------------- | ------------------------------------------------------ | ------------------- |
| `-s, --scene`     | Nom de la scène à rendre                               | `intro`             |
| `-o, --out`       | Fichier de sortie                                      | `out/<scène>.<ext>` |
| `-f, --format`    | `mp4` ou `gif`                                         | `mp4`               |
| `--crf`           | Qualité x264 (0–51, plus bas = meilleure qualité)      | `18`                |

Les fichiers rendus vont dans `out/` (ignoré par git).

## Ajouter du son

Fournis un fichier audio (`mp3`, `wav`, `aac`, `m4a`…) avec `--audio` : ffmpeg le
mux dans le MP4 (encodé en AAC).

```bash
npm run render -- --scene intro --audio musique.mp3 --out out/intro.mp4
```

- Par défaut, la sortie garde **la durée de la vidéo** : si l'audio est plus long,
  il est coupé ; s'il est plus court, le son se termine avant la fin.
- `--audio-fit shortest` cale plutôt la sortie sur **la plus courte** des deux pistes.
- Le **GIF** ne porte pas de son : `--audio` y est ignoré (avec un avertissement).

| Option            | Description                                                 | Défaut              |
| ----------------- | ----------------------------------------------------------- | ------------------- |
| `-a, --audio`     | Fichier audio à muxer dans le MP4                           | *(aucun)*           |
| `--audio-fit`     | `video` (garde la durée vidéo) ou `shortest`                | `video`             |

> Astuce : pour générer un son de test sans fichier, ffmpeg peut en synthétiser un —
> `ffmpeg -f lavfi -i "sine=frequency=330:duration=4" tone.mp3`.

## Créer une scène

Une scène implémente l'interface `Scene` (`src/engine/types.ts`) : dimensions,
durée, fps, et une fonction `draw(ctx, frame)` appelée pour chaque image.

```ts
import type { Scene } from "../engine/types.js";
import { animate } from "../engine/timeline.js";
import { easeOutCubic } from "../engine/easing.js";

export const maScene: Scene = {
  name: "ma-scene",
  width: 1280,
  height: 720,
  fps: 30,
  durationInSeconds: 3,
  background: "#000",
  draw(ctx, f) {
    // f.time (secondes), f.progress (0→1), f.index, f.width, f.height…
    const x = animate(f.time, 100, 1180, { start: 0, end: 2, easing: easeOutCubic });
    ctx.fillStyle = "#4ea8ff";
    ctx.beginPath();
    ctx.arc(x, f.height / 2, 40, 0, Math.PI * 2);
    ctx.fill();
  },
};
```

Puis enregistre-la dans `src/scenes/index.ts` :

```ts
import { maScene } from "./ma-scene.js";
export const scenes = { [introScene.name]: introScene, [maScene.name]: maScene };
```

## Boîte à outils d'animation

- `animate(time, from, to, { start, end, easing })` — interpole une valeur sur un
  intervalle de temps donné.
- `spawn(time, from, to, start, duration, easing)` — animation « en avant » (apparitions).
- `oscillate(time, { period, min, max, phase })` — oscillation continue (flottement, pouls).
- `lerp(a, b, t)`, `deg(degrés)` — utilitaires.
- Easings : `linear`, `easeInQuad`, `easeOutQuad`, `easeInOutQuad`,
  `easeOutCubic`, `easeInOutCubic`, `easeOutBack`, `easeOutElastic`.

## Structure

```
src/
  engine/
    types.ts      # interfaces Scene / Frame
    easing.ts     # fonctions d'easing
    timeline.ts   # animate / spawn / oscillate / lerp
    render.ts     # rendu frame-by-frame + pipe ffmpeg (MP4 / GIF)
  scenes/
    intro.ts      # scène d'exemple
    index.ts      # registre des scènes
  index.ts        # CLI
```

## Scripts

```bash
npm run render      # rend une scène (tsx, sans build)
npm run typecheck   # vérification TypeScript
npm run build       # compile vers dist/
npm start           # exécute la version compilée
```

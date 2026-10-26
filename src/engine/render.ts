import { spawn as spawnProcess } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { once } from "node:events";
import { createCanvas } from "@napi-rs/canvas";
import type { Frame, Scene } from "./types.js";

export type OutputFormat = "mp4" | "gif";

export interface RenderOptions {
  /** Chemin du fichier de sortie. */
  out: string;
  format: OutputFormat;
  /** Qualité x264 (CRF) pour le MP4 ; plus bas = meilleure qualité. */
  crf?: number;
  /** Chemin du binaire ffmpeg (défaut : "ffmpeg" dans le PATH). */
  ffmpegPath?: string;
  /** Callback de progression appelé après chaque frame. */
  onProgress?: (frame: number, total: number) => void;
}

/** Construit les arguments ffmpeg selon le format demandé. */
function ffmpegArgs(scene: Scene, opts: RenderOptions): string[] {
  const common = [
    "-y",
    "-f", "rawvideo",
    "-pixel_format", "rgba",
    "-video_size", `${scene.width}x${scene.height}`,
    "-framerate", String(scene.fps),
    "-i", "pipe:0",
  ];

  if (opts.format === "gif") {
    return [
      ...common,
      "-vf",
      `fps=${scene.fps},split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer`,
      opts.out,
    ];
  }

  return [
    ...common,
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", String(opts.crf ?? 18),
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    opts.out,
  ];
}

/**
 * Rend une scène frame par frame et assemble le résultat en MP4 ou GIF via
 * ffmpeg. Les pixels sont transmis en flux brut (rawvideo rgba) sur stdin,
 * sans fichier intermédiaire.
 */
export async function render(scene: Scene, opts: RenderOptions): Promise<void> {
  if (scene.width % 2 !== 0 || scene.height % 2 !== 0) {
    throw new Error(
      `Les dimensions doivent être paires pour l'encodage vidéo (reçu ${scene.width}x${scene.height}).`,
    );
  }

  await mkdir(dirname(opts.out), { recursive: true });

  const totalFrames = Math.max(1, Math.round(scene.durationInSeconds * scene.fps));
  const canvas = createCanvas(scene.width, scene.height);
  const ctx = canvas.getContext("2d");

  const ffmpeg = spawnProcess(opts.ffmpegPath ?? "ffmpeg", ffmpegArgs(scene, opts), {
    stdio: ["pipe", "ignore", "pipe"],
  });

  let stderr = "";
  ffmpeg.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });

  const done = new Promise<void>((resolve, reject) => {
    ffmpeg.on("error", reject);
    ffmpeg.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg a quitté avec le code ${code}\n${stderr.slice(-2000)}`));
    });
  });

  // Si ffmpeg ferme stdin prématurément (erreur), on évite un EPIPE fatal.
  ffmpeg.stdin.on("error", () => {});

  try {
    for (let index = 0; index < totalFrames; index++) {
      const time = index / scene.fps;
      const frame: Frame = {
        index,
        time,
        duration: scene.durationInSeconds,
        progress: totalFrames > 1 ? index / (totalFrames - 1) : 0,
        width: scene.width,
        height: scene.height,
        fps: scene.fps,
      };

      // Fond
      if (scene.background) {
        ctx.fillStyle = scene.background;
        ctx.fillRect(0, 0, scene.width, scene.height);
      } else {
        ctx.clearRect(0, 0, scene.width, scene.height);
      }

      ctx.save();
      scene.draw(ctx, frame);
      ctx.restore();

      const { data } = ctx.getImageData(0, 0, scene.width, scene.height);
      const buf = Buffer.from(data.buffer, data.byteOffset, data.byteLength);

      if (!ffmpeg.stdin.write(buf)) {
        await once(ffmpeg.stdin, "drain");
      }
      opts.onProgress?.(index + 1, totalFrames);
    }
  } finally {
    ffmpeg.stdin.end();
  }

  await done;
}

#!/usr/bin/env node
import { render, type OutputFormat } from "./engine/render.js";
import { getScene, sceneNames } from "./scenes/index.js";

interface Args {
  scene: string;
  out?: string;
  format: OutputFormat;
  crf?: number;
  audio?: string;
  audioFit?: "video" | "shortest";
  help: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { scene: "intro", format: "mp4", help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case "-s":
      case "--scene":
        args.scene = next();
        break;
      case "-o":
      case "--out":
        args.out = next();
        break;
      case "-f":
      case "--format":
        args.format = next() as OutputFormat;
        break;
      case "--crf":
        args.crf = Number(next());
        break;
      case "-a":
      case "--audio":
        args.audio = next();
        break;
      case "--audio-fit":
        args.audioFit = next() as "video" | "shortest";
        break;
      case "-h":
      case "--help":
        args.help = true;
        break;
      default:
        if (a.startsWith("-")) {
          throw new Error(`Option inconnue : ${a}`);
        }
    }
  }
  return args;
}

function usage(): string {
  return [
    "hyperframe — génère des motion graphics (MP4 / GIF).",
    "",
    "Usage :",
    "  npm run render -- [options]",
    "",
    "Options :",
    "  -s, --scene <nom>      Scène à rendre (défaut : intro)",
    "  -o, --out <chemin>     Fichier de sortie (défaut : out/<scène>.<ext>)",
    "  -f, --format <fmt>     mp4 | gif (défaut : mp4)",
    "      --crf <n>          Qualité x264 pour le MP4, 0-51, plus bas = mieux (défaut : 18)",
    "  -a, --audio <chemin>   Fichier audio à muxer dans le MP4 (mp3/wav/aac/m4a…)",
    "      --audio-fit <mode> video | shortest — durée quand il y a de l'audio (défaut : video)",
    "  -h, --help             Affiche cette aide",
    "",
    `Scènes disponibles : ${sceneNames().join(", ")}`,
  ].join("\n");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(usage());
    return;
  }

  if (args.format !== "mp4" && args.format !== "gif") {
    throw new Error(`Format invalide : ${args.format} (attendu : mp4 ou gif)`);
  }

  const scene = getScene(args.scene);
  if (!scene) {
    throw new Error(
      `Scène inconnue : "${args.scene}". Scènes disponibles : ${sceneNames().join(", ")}`,
    );
  }

  const out = args.out ?? `out/${scene.name}.${args.format}`;
  const totalFrames = Math.round(scene.durationInSeconds * scene.fps);

  console.log(
    `Rendu « ${scene.name} » → ${out}  (${scene.width}x${scene.height}, ${scene.fps} fps, ${totalFrames} frames)`,
  );

  const start = Date.now();
  await render(scene, {
    out,
    format: args.format,
    crf: args.crf,
    audio: args.audio,
    audioFit: args.audioFit,
    onProgress: (frame, total) => {
      if (frame === total || frame % scene.fps === 0) {
        const pct = Math.round((frame / total) * 100);
        process.stdout.write(`\r  ${frame}/${total} frames (${pct}%)   `);
      }
    },
  });

  const secs = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n✓ Terminé en ${secs}s → ${out}`);
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});

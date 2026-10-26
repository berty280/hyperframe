import type { Ctx, Frame, Scene } from "../engine/types.js";
import { animate, oscillate, deg, lerp } from "../engine/timeline.js";
import { easeOutBack, easeOutCubic, easeInOutCubic, easeOutQuad } from "../engine/easing.js";

const WIDTH = 1280;
const HEIGHT = 720;

/** Dessine un dégradé de fond dont les teintes glissent avec le temps. */
function drawBackground(ctx: Ctx, f: Frame): void {
  const shift = oscillate(f.time, { period: 8, min: 0, max: 40 });
  const g = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  g.addColorStop(0, `hsl(${235 + shift}, 55%, 12%)`);
  g.addColorStop(1, `hsl(${280 + shift}, 60%, 18%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

/** Points orbitant autour du centre, apparaissant en cascade. */
function drawOrbit(ctx: Ctx, f: Frame): void {
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;
  const count = 12;
  const baseRadius = 230;

  for (let i = 0; i < count; i++) {
    const appear = animate(f.time, 0, 1, {
      start: 0.2 + i * 0.05,
      end: 0.9 + i * 0.05,
      easing: easeOutCubic,
    });
    if (appear <= 0) continue;

    const angle = deg((360 / count) * i) + f.time * 0.6;
    const radius = baseRadius * appear + oscillate(f.time, { period: 3, min: -12, max: 12, phase: i });
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    const size = lerp(3, 9, appear) * (0.7 + 0.3 * Math.sin(f.time * 2 + i));

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${190 + i * 12}, 90%, 65%, ${appear})`;
    ctx.fill();
  }
}

/** Titre qui monte et se révèle, avec un sous-titre et une barre de progression. */
function drawTitle(ctx: Ctx, f: Frame): void {
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;

  // Titre
  const titleY = animate(f.time, cy + 60, cy - 10, {
    start: 0.3,
    end: 1.3,
    easing: easeOutBack,
  });
  const titleAlpha = animate(f.time, 0, 1, { start: 0.3, end: 1.0, easing: easeOutQuad });

  ctx.save();
  ctx.globalAlpha = titleAlpha;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f5f7ff";
  ctx.font = "700 110px sans-serif";
  ctx.shadowColor = "rgba(120, 160, 255, 0.5)";
  ctx.shadowBlur = 30;
  ctx.fillText("hyperframe", cx, titleY);
  ctx.restore();

  // Sous-titre
  const subAlpha = animate(f.time, 0, 1, { start: 1.1, end: 1.8, easing: easeOutQuad });
  ctx.save();
  ctx.globalAlpha = subAlpha;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "hsla(210, 60%, 85%, 1)";
  ctx.font = "400 30px sans-serif";
  ctx.fillText("motion graphics · frame by frame", cx, cy + 70);
  ctx.restore();

  // Barre de progression du rendu
  const barW = 420;
  const barX = cx - barW / 2;
  const barY = cy + 130;
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  roundRect(ctx, barX, barY, barW, 6, 3);
  ctx.fill();
  ctx.fillStyle = "hsl(200, 90%, 65%)";
  roundRect(ctx, barX, barY, barW * f.progress, 6, 3);
  ctx.fill();
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export const introScene: Scene = {
  name: "intro",
  width: WIDTH,
  height: HEIGHT,
  fps: 30,
  durationInSeconds: 4,
  background: "#0b0e1a",
  draw(ctx: Ctx, f: Frame): void {
    drawBackground(ctx, f);
    drawOrbit(ctx, f);
    drawTitle(ctx, f);

    // Léger fondu d'ouverture et de fermeture
    const fade = Math.min(
      animate(f.time, 0, 1, { start: 0, end: 0.4, easing: easeInOutCubic }),
      animate(f.time, 1, 0, { start: f.duration - 0.4, end: f.duration, easing: easeInOutCubic }),
    );
    if (fade < 1) {
      ctx.fillStyle = `rgba(11, 14, 26, ${1 - fade})`;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
  },
};

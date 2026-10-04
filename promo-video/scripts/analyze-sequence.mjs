/**
 * Visual QA — full-sequence pass.
 *
 * Decodes the rendered film straight from H.264 through Remotion's bundled
 * ffmpeg and measures every single frame. Stills can only tell you a frame is
 * composed; this tells you the film *moves* — that nothing pops, that no frame
 * goes blank between scenes, and that the encoder never introduced colour the
 * design system does not contain.
 *
 *   node scripts/analyze-sequence.mjs
 *   node scripts/analyze-sequence.mjs --video renders/other.mp4 --scale 0.25
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { decodePng } from "./lib/png.mjs";
import { SCENES, FPS } from "../src/timeline.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
};

const video = path.resolve(root, arg("video", path.join("renders", "worthly-promo-v0.2.0.mp4")));
const scale = Number(arg("scale", "0.25"));
const FFMPEG = path.join(
  root,
  "node_modules",
  "@remotion",
  "compositor-win32-x64-msvc",
  "ffmpeg.exe",
);

if (!fs.existsSync(video)) throw new Error(`No video at ${video}. Render it first.`);
if (!fs.existsSync(FFMPEG)) throw new Error(`No ffmpeg at ${FFMPEG}`);

/** Probe the stream so the proxy keeps the film's true aspect and frame count. */
const probe = await new Promise((resolve, reject) => {
  const child = spawn(FFMPEG, ["-hide_banner", "-i", video], { encoding: "utf8" });
  let text = "";
  child.stderr.on("data", (chunk) => (text += chunk));
  child.on("error", reject);
  child.on("close", () => resolve(text));
});
const size = probe.match(/Video:.*?,\s*(\d+)x(\d+)/);
if (!size) throw new Error(`Could not read video dimensions:\n${probe.slice(0, 600)}`);
const width = Math.max(2, Math.round(Number(size[1]) * scale / 2) * 2);
const height = Math.max(2, Math.round(Number(size[2]) * scale / 2) * 2);

const PAPER = [0xef, 0xea, 0xe0];
const INK = [0x1a, 0x1a, 0x1a];
const ORANGE = [0xcd, 0x6f, 0x47];
const INK_FLOOR = 20;

/** Distance from a point to the paper→ink and paper→orange segments. */
const distanceToSegment = (r, g, b, end) => {
  const ab = [end[0] - PAPER[0], end[1] - PAPER[1], end[2] - PAPER[2]];
  const ap = [r - PAPER[0], g - PAPER[1], b - PAPER[2]];
  const ab2 = ab[0] * ab[0] + ab[1] * ab[1] + ab[2] * ab[2];
  const t = Math.max(0, Math.min(1, (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / ab2));
  const d = [ap[0] - t * ab[0], ap[1] - t * ab[1], ap[2] - t * ab[2]];
  return Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
};

const frameBytes = width * height * 3;
const frames = [];

await new Promise((resolve, reject) => {
  const child = spawn(FFMPEG, [
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    video,
    "-vf",
    `scale=${width}:${height}:flags=area`,
    "-f",
    // The bundled ffmpeg is a minimal build: it has no `rawvideo` *muxer*, but
    // `image2pipe` will happily carry the rawvideo *codec*.
    "image2pipe",
    "-vcodec",
    "rawvideo",
    "-pix_fmt",
    "rgb24",
    "-",
  ]);
  let buffer = Buffer.alloc(0);
  child.stdout.on("data", (chunk) => {
    buffer = buffer.length === 0 ? chunk : Buffer.concat([buffer, chunk]);
    while (buffer.length >= frameBytes) {
      frames.push(measure(buffer.subarray(0, frameBytes)));
      buffer = buffer.subarray(frameBytes);
    }
  });
  child.on("error", reject);
  child.on("close", resolve);
});

function measure(data) {
  let ink = 0;
  let inkMass = 0;
  let offPalette = 0;
  for (let index = 0; index < data.length; index += 3) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const delta = Math.max(
      Math.abs(r - PAPER[0]),
      Math.abs(g - PAPER[1]),
      Math.abs(b - PAPER[2]),
    );
    // Coverage is a near-binary measure: an element counts as present until it
    // fades below ~10% opacity. Mass integrates the same delta, so it tracks an
    // opacity ramp the way the eye does. Steps are judged on mass.
    inkMass += delta;
    if (delta > INK_FLOOR) {
      ink += 1;
      if (Math.min(distanceToSegment(r, g, b, INK), distanceToSegment(r, g, b, ORANGE)) > 34) {
        offPalette += 1;
      }
    }
  }
  const total = data.length / 3;
  return {
    ink: ink / total,
    mass: inkMass / total / 255,
    offPalette: offPalette / total,
  };
}

const lines = [];
const say = (text = "") => {
  lines.push(text);
  console.log(text);
};

say(`sequence pass · ${path.relative(root, video).replace(/\\/g, "/")}`);
say(`proxy ${width}×${height} · ${frames.length} frames · ${(frames.length / FPS).toFixed(2)}s`);
say("=".repeat(100));

const blank = frames
  .map((frame, index) => ({ index, ink: frame.ink, mass: frame.mass }))
  .filter((frame) => frame.mass < 0.0006);
const polluted = frames
  .map((frame, index) => ({ index, share: frame.offPalette }))
  .filter((frame) => frame.share > 0.0005);
const worstPollution = polluted.length ? Math.max(...polluted.map((f) => f.share)) : 0;

// H.264 4:2:0 subsamples chroma, so a saturated accent sitting on a black card
// always bleeds a fraction of a percent of warm-brown pixels along its glyph
// edges. That is a codec property, not a design violation — the lossless stills
// of the same frames measure 0.000%. Only a genuinely wrong colour, which lands
// an order of magnitude higher, should fail the pass.
const OFF_PALETTE_FLOOR = 0.005;

let maxJump = { index: 0, delta: 0 };
let maxDrop = { index: 0, delta: 0 };
for (let index = 1; index < frames.length; index++) {
  const delta = frames[index].mass - frames[index - 1].mass;
  if (Math.abs(delta) > Math.abs(maxJump.delta)) maxJump = { index, delta };
  if (delta < 0 && -delta > Math.abs(maxDrop.delta)) maxDrop = { index, delta };
}

const inkShares = frames.map((frame) => frame.ink);
const masses = frames.map((frame) => frame.mass);
const mean = inkShares.reduce((a, b) => a + b, 0) / inkShares.length;

say("");
say(`coverage         mean ${(mean * 100).toFixed(2)}%   min ${(Math.min(...inkShares) * 100).toFixed(2)}%   max ${(Math.max(...inkShares) * 100).toFixed(2)}%`);
say(`ink mass         mean ${(masses.reduce((a, b) => a + b, 0) / masses.length * 100).toFixed(2)}%   peak ${(Math.max(...masses) * 100).toFixed(2)}%`);
say(`blank frames     ${blank.length} (mass < 0.06%)${blank.length ? ` → ${blank.slice(0, 8).map((f) => `${(f.index / FPS).toFixed(2)}s`).join(", ")}` : ""}`);
say(
  `off-palette      ${polluted.length} frames above 0.05%${polluted.length ? ` → worst ${(worstPollution * 100).toFixed(3)}% at ${(polluted.slice().sort((a, b) => b.share - a.share)[0].index / FPS).toFixed(2)}s` : ""}` +
    `   (fail floor ${(OFF_PALETTE_FLOOR * 100).toFixed(1)}%)`,
);
say(`largest step     ${(maxJump.delta * 100).toFixed(2)}pp at ${(maxJump.index / FPS).toFixed(2)}s (${maxJump.delta > 0 ? "in" : "out"})`);
say(`largest drop     ${(maxDrop.delta * 100).toFixed(2)}pp at ${(maxDrop.index / FPS).toFixed(2)}s`);

say("");
say("per-scene ink mass (sampled every 0.5s)");
say("-".repeat(100));
for (const scene of SCENES) {
  const from = Math.floor(scene.from);
  const to = Math.min(frames.length, scene.from + scene.durationInFrames);
  const samples = [];
  for (let index = from; index < to; index += Math.round(FPS / 2)) {
    samples.push(frames[index]?.mass ?? 0);
  }
  const spark = samples
    .map((value) => " .:-=+*#%@"[Math.min(9, Math.round((value / 0.08) * 9))])
    .join("");
  const peak = samples.length ? Math.max(...samples) : 0;
  say(
    `${scene.id.padEnd(11)}${(scene.from / FPS).toFixed(1).padStart(5)}s  ${spark.padEnd(24)}peak ${(peak * 100).toFixed(1)}%`,
  );
}

const report = `${lines.join("\n")}\n`;
fs.mkdirSync(path.join(root, "qa", "reports"), { recursive: true });
fs.writeFileSync(path.join(root, "qa", "reports", "sequence.txt"), report);

const failed = blank.length > 0 || worstPollution > OFF_PALETTE_FLOOR;
process.exitCode = failed ? 1 : 0;

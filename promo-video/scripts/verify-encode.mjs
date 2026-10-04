/**
 * Visual QA — encode fidelity.
 *
 * Renders the film's canonical checkpoints twice: once as lossless PNG stills
 * straight out of the Remotion renderer, and once by decoding the finished
 * MP4. If the two agree, the H.264 encode is faithful to the design — no
 * clipped blacks, no crushed paper, no chroma damage, no dropped or duplicated
 * frames at the checkpoints.
 *
 * The bundled ffmpeg has no `rawvideo` muxer, so frames come out of
 * `image2pipe` carrying the rawvideo codec and are decoded here in Node.
 *
 *   node scripts/verify-encode.mjs [--video renders/worthly-promo-v0.2.0.mp4]
 *                                  [--stills qa/frames]
 *                                  [--tolerance 16]
 *
 * The verdict is shaped for what an H.264 round trip actually does. Three
 * independent signals are checked:
 *
 *   signed Δ  — a near-zero per-channel mean means no level or range shift.
 *               A colour-matrix or range mistake shows up here immediately.
 *   mean Δ    — edge softening across the whole frame.
 *   >60 share — the fraction of pixels that differ structurally. Antialiased
 *               glyph edges inside the phone mock dominate this; a genuinely
 *               wrong frame pushes it up by an order of magnitude.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { decodePng } from "./lib/png.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
};

const video = path.resolve(root, arg("video", path.join("renders", "worthly-promo-v0.2.0.mp4")));
const stillsDir = path.resolve(root, arg("stills", path.join("qa", "frames")));
const tolerance = Number(arg("tolerance", "16"));
const reportDir = path.resolve(root, arg("report-dir", path.join("qa", "reports")));

const FFMPEG = path.join(
  root,
  "node_modules",
  "@remotion",
  "compositor-win32-x64-msvc",
  "ffmpeg.exe",
);

const lines = [];
const say = (line = "") => {
  lines.push(line);
  process.stdout.write(`${line}\n`);
};

// ---------------------------------------------------------------------------
// Probe the video
// ---------------------------------------------------------------------------

// The frame rate comes from the file rather than from a constant: a still named
// `frame-0008.png` means 8.0 seconds, and turning seconds into a frame index
// with a stale FPS silently compares the wrong frame — which is exactly how this
// check first went wrong when the film moved from 60 to 30 fps.
const probe = spawnSync(
  path.join(root, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffprobe.exe"),
  [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height,nb_frames,r_frame_rate,color_space,color_primaries,color_transfer,color_range",
    "-of",
    "json",
    video,
  ],
  { encoding: "utf8" },
);

if (probe.status !== 0) throw new Error(`Could not probe ${video}: ${probe.stderr}`);
const stream = JSON.parse(probe.stdout).streams?.[0];
if (stream.color_space !== "bt709" || stream.color_primaries !== "bt709"
    || stream.color_transfer !== "bt709" || stream.color_range !== "tv") {
  throw new Error("Expected explicitly converted/tagged BT.709 video with limited range");
}
say("Video color metadata: BT.709 matrix / primaries / transfer, limited range · PASS");
const nbFrames = stream?.nb_frames ?? "unavailable";
const rate = stream?.r_frame_rate;
const W = Number(stream?.width);
const H = Number(stream?.height);
const FRAME_BYTES = W * H * 3;
const [rateNum, rateDen] = String(rate).split("/").map(Number);
const FPS = rateDen ? rateNum / rateDen : NaN;

if (!W || !H) throw new Error(`Could not probe ${video}: ${probe.stderr}`);
if (!Number.isFinite(FPS) || FPS <= 0) throw new Error(`Could not read the frame rate: ${rate}`);

// ---------------------------------------------------------------------------
// Which frames to compare
// ---------------------------------------------------------------------------

const stills = fs
  .readdirSync(stillsDir)
  .filter((file) => file.endsWith(".png"))
  .map((file) => ({
    file,
    frame: Math.round(Number.parseFloat(file.match(/^frame-(\d+(?:\.\d+)?)\.png$/)?.[1] ?? "0") * FPS),
  }))
  .filter((entry) => Number.isFinite(entry.frame))
  .sort((a, b) => a.frame - b.frame);

if (stills.length === 0) {
  throw new Error(`No stills in ${path.relative(root, stillsDir)}. Run \`npm run frames\` first.`);
}

const wanted = [...new Set(stills.map((entry) => entry.frame))];
const decoded = new Map();

// Decode incrementally using one reusable frame buffer; retain only the
// checkpoints and avoid repeatedly copying a growing partial frame.
await new Promise((resolve, reject) => {
  const child = spawn(FFMPEG, [
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    video,
    "-f",
    "image2pipe",
    "-vcodec",
    "rawvideo",
    "-pix_fmt",
    "rgb24",
    "-",
  ]);

  const buffer = Buffer.allocUnsafe(FRAME_BYTES);
  let filled = 0;
  const wantedSet = new Set(wanted);
  let frame = 0;
  let stderr = "";

  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  child.stdout.on("data", (chunk) => {
    let offset = 0;
    while (offset < chunk.length) {
      const length = Math.min(FRAME_BYTES - filled, chunk.length - offset);
      chunk.copy(buffer, filled, offset, offset + length);
      filled += length;
      offset += length;
      if (filled === FRAME_BYTES) {
        if (wantedSet.has(frame)) decoded.set(frame, Buffer.from(buffer));
        filled = 0;
        frame += 1;
      }
    }
  });

  child.on("error", reject);
  child.on("close", (code) => {
    if (code !== 0) reject(new Error(`ffmpeg exited ${code}: ${stderr}`));
    else resolve();
  });
});

// ---------------------------------------------------------------------------
// Compare
// ---------------------------------------------------------------------------

say(`encode fidelity · ${path.relative(root, video).replace(/\\/g, "/")}`);
say(`decoded ${W}×${H} · ${FPS} fps · ${decoded.size}/${stills.length} checkpoints · ${nbFrames} frames declared`);
say("=".repeat(100));
say("");
say("frame  time   signed Δ        mean Δ   p99 Δ   >16%   >60%   verdict");
say("-".repeat(100));

let failures = 0;
const results = [];

for (const { file, frame } of stills) {
  const encoded = decoded.get(frame);
  const still = decodePng(fs.readFileSync(path.join(stillsDir, file)));

  if (!encoded) {
    say(`${file.padEnd(18)} ${(frame / FPS).toFixed(2)}s  — not decoded`);
    failures += 1;
    continue;
  }

  if (still.width !== W || still.height !== H) {
    throw new Error(`${file} is ${still.width}×${still.height}, video is ${W}×${H}`);
  }

  const channels = still.channels;
  const diffs = new Float64Array(still.width * still.height);
  let sum = 0;
  let max = 0;
  let over = 0;
  let structural = 0;
  let signedR = 0;
  let signedG = 0;
  let signedB = 0;

  for (let pixel = 0; pixel < diffs.length; pixel++) {
    const source = pixel * channels;
    const target = pixel * 3;
    const dr = encoded[target] - still.data[source];
    const dg = encoded[target + 1] - still.data[source + 1];
    const db = encoded[target + 2] - still.data[source + 2];
    signedR += dr;
    signedG += dg;
    signedB += db;
    const delta = Math.max(Math.abs(dr), Math.abs(dg), Math.abs(db));
    diffs[pixel] = delta;
    sum += delta;
    if (delta > max) max = delta;
    if (delta > tolerance) over += 1;
    if (delta > 60) structural += 1;
  }

  const mean = sum / diffs.length;
  const sorted = Float64Array.from(diffs).sort();
  const p99 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.99))];
  const overShare = (over / diffs.length) * 100;
  const structuralShare = (structural / diffs.length) * 100;
  const signed = [signedR / diffs.length, signedG / diffs.length, signedB / diffs.length];
  const signedMean = signed.reduce((a, b) => a + Math.abs(b), 0) / 3;

  const ok = signedMean < 3 && mean < 2.5 && structuralShare < 0.5;
  if (!ok) failures += 1;

  results.push({ file, frame, signed, mean, p99, max, overShare, structuralShare, ok });

  say(
    `${file.padEnd(18)} ${(frame / FPS).toFixed(2).padStart(5)}s  ${signed
      .map((value) => value.toFixed(2).padStart(6))
      .join(" ")}  ${mean.toFixed(3).padStart(6)}   ${String(p99).padStart(5)}   ${overShare.toFixed(3).padStart(6)}   ${structuralShare.toFixed(3).padStart(6)}   ${ok ? "ok" : "FAIL"}`,
  );
}

say("-".repeat(100));
say(`${results.length} checkpoints · ${failures} failed · mean < 2.5 · >60 share < 0.5%`);

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, "encode-fidelity.txt"), `${lines.join("\n")}\n`);
fs.writeFileSync(
  path.join(reportDir, "encode-fidelity.json"),
  `${JSON.stringify({ video: path.relative(root, video), width: W, height: H,
    colorMetadata: { matrix: stream.color_space, primaries: stream.color_primaries,
      transfer: stream.color_transfer, range: stream.color_range }, tolerance, results }, null, 2)}\n`,
);

process.exit(failures === 0 ? 0 : 1);

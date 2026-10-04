/**
 * Visual QA — frame extraction.
 *
 * Renders the film's key storyboard moments as PNG stills into `qa/frames/`,
 * reusing a single headless browser so the whole sweep takes one bundle instead
 * of eleven.
 *
 *   node scripts/extract-qa-frames.mjs [--times 2,5,8,...] [--out qa/frames]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { getCompositions, openBrowser, renderStill } from "@remotion/renderer";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entryPoint = path.join(root, "src", "index.ts");
const publicDir = path.join(root, "public");

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
};

/**
 * Collects every value after `--name` up to the next flag.
 *
 * Reading only `argv[index + 1]` silently accepted `--times 3 6 9` as just
 * `[3]`, which produced a one-frame contact sheet that looked fine. Space and
 * comma separators are both accepted now.
 */
const argList = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const values = [];
  for (let i = index + 1; i < process.argv.length && !process.argv[i].startsWith("--"); i++) {
    values.push(process.argv[i]);
  }
  return values.length ? values : fallback;
};

const COMPOSITION_ID = "WorthlyPromo16x9";


const times = argList("times", ["2,5,9,14.5,17.5,21,25,29,33.5,38,42,46,50,52,56,62,66,72,76.5,80"])
  .join(",")
  .split(",")
  .map((value) => Number.parseFloat(value.trim()))
  .filter((value) => Number.isFinite(value));

const outDir = path.resolve(root, arg("out", path.join("qa", "frames")));
fs.mkdirSync(outDir, { recursive: true });

console.log(`Bundling ${path.relative(root, entryPoint)} …`);
const serveUrl = await bundle({
  entryPoint,
  publicDir,
  onProgress: (progress) => {
    if (progress === 100) console.log("Bundle ready.");
  },
});

const browser = await openBrowser("chrome", {
  chromiumOptions: { gl: "angle" },
  logLevel: "error",
});

try {
  const compositions = await getCompositions(serveUrl, {
    puppeteerInstance: browser,
    logLevel: "error",
  });
  const composition = compositions.find((entry) => entry.id === COMPOSITION_ID);
  if (!composition) {
    throw new Error(`Composition ${COMPOSITION_ID} not found`);
  }

  console.log(
    `${COMPOSITION_ID}: ${composition.width}×${composition.height} @ ${composition.fps}fps, ` +
      `${composition.durationInFrames} frames (${(
        composition.durationInFrames / composition.fps
      ).toFixed(1)}s)`,
  );

  const manifest = [];

  for (const time of times) {
    const frame = Math.min(
      composition.durationInFrames - 1,
      Math.round(time * composition.fps),
    );
    const output = path.join(outDir, `frame-${String(time).padStart(4, "0")}.png`);
    await renderStill({
      composition,
      serveUrl,
      output,
      frame,
      imageFormat: "png",
      puppeteerInstance: browser,
      overwrite: true,
      logLevel: "error",
    });
    manifest.push({ time, frame, file: path.relative(root, output).replace(/\\/g, "/") });
    console.log(`  ${time.toFixed(0).padStart(2, "0")}s  → frame ${String(frame).padStart(4, "0")}  ${path.basename(output)}`);
  }

  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    `${JSON.stringify({ composition: COMPOSITION_ID, fps: composition.fps, frames: manifest }, null, 2)}\n`,
  );
  console.log(`\n${manifest.length} frames written to ${path.relative(root, outDir)}/`);
} finally {
  await browser.close({ silent: true });
}

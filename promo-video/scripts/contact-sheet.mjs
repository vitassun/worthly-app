/**
 * Visual QA — contact sheet.
 *
 * Composes every still in `qa/frames/` into one reviewable sheet, so the film
 * can be judged as a sequence rather than as isolated frames.
 *
 *   node scripts/contact-sheet.mjs [--frames qa/frames] [--out qa/contact-sheets] [--round 2]
 *
 * The sheet is named after the frame directory it was built from, so the
 * canonical checkpoint sweep and the extra continuity sweep never overwrite
 * each other.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { findChrome } from "./lib/chrome.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
};

const framesDir = path.resolve(root, arg("frames", path.join("qa", "frames")));
const outDir = path.resolve(root, arg("out", path.join("qa", "contact-sheets")));
const round = arg("round", "");

const manifestPath = path.join(framesDir, "manifest.json");
const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  : null;

const entries = fs
  .readdirSync(framesDir)
  .filter((file) => file.endsWith(".png"))
  .map((file) => ({
    file,
    seconds: Number.parseFloat(file.match(/^frame-(\d+(?:\.\d+)?)\.png$/)?.[1] ?? "0"),
  }))
  // Chronological, not lexicographic: `frame-04.8` comes before `frame-0006`.
  .sort((a, b) => a.seconds - b.seconds || a.file.localeCompare(b.file));

if (entries.length === 0) throw new Error("No frames in qa/frames. Run `npm run frames` first.");

const COLUMNS = 3;
const CELL = 600;
const GAP = 24;
const PAD = 48;
const CAPTION = 36;
const HEADER = 118;
const CELL_HEIGHT = Math.round((CELL * 1080) / 1920);

const rows = Math.ceil(entries.length / COLUMNS);
const gridWidth = COLUMNS * CELL + (COLUMNS - 1) * GAP;
const width = gridWidth + PAD * 2;
const height = PAD + HEADER + rows * (CELL_HEIGHT + CAPTION) + (rows - 1) * GAP + PAD;

const cards = entries
  .map(({ file, seconds }) => {
    const data = fs.readFileSync(path.join(framesDir, file)).toString("base64");
    return `<figure class="card">
      <img src="data:image/png;base64,${data}" width="${CELL}" height="${CELL_HEIGHT}" alt="" />
      <figcaption><span class="t">${String(seconds).padStart(2, "0")}s</span><span class="f">${file}</span></figcaption>
    </figure>`;
  })
  .join("\n");

const spec = [
  manifest ? `${manifest.composition} · ${manifest.fps}fps` : null,
  `${entries.length} stills`,
  `source ${path.relative(root, framesDir).replace(/\\/g, "/")}`,
]
  .filter(Boolean)
  .join(" · ");

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #EFEAE0; }
  body {
    width: ${width}px;
    font-family: "Segoe UI", system-ui, sans-serif;
    color: #1A1A1A;
    padding: ${PAD}px;
  }
  header { height: ${HEADER}px; }
  h1 { margin: 0; font-size: 34px; font-weight: 700; letter-spacing: -0.01em; }
  h1 span { color: #CD6F47; }
  .meta { margin-top: 10px; font-family: Consolas, ui-monospace, monospace; font-size: 15px; color: #5C5852; letter-spacing: 0.06em; }
  .grid { display: grid; grid-template-columns: repeat(${COLUMNS}, ${CELL}px); gap: ${GAP}px; }
  .card { margin: 0; }
  img { display: block; border-radius: 8px; background: #E5DFD2; }
  figcaption { display: flex; align-items: baseline; gap: 12px; padding-top: 8px; height: ${CAPTION}px; }
  .t { font-family: Consolas, ui-monospace, monospace; font-size: 15px; font-weight: 700; color: #CD6F47; }
  .f { font-family: Consolas, ui-monospace, monospace; font-size: 12px; color: #5C5852; }
</style></head>
<body>
  <header>
    <h1>Worthly / <span>值不值</span> — promo film QA${round ? ` · round ${round}` : ""}</h1>
    <div class="meta">${spec}</div>
  </header>
  <div class="grid">
${cards}
  </div>
</body></html>`;

fs.mkdirSync(outDir, { recursive: true });
const scratch = path.join(root, "qa", "_sheet.html");
fs.writeFileSync(scratch, html);

const label = path.basename(framesDir).replace(/[^a-z0-9-]+/gi, "-");
const output = path.join(
  outDir,
  label === "frames"
    ? "worthly-promo-contact-sheet.png"
    : `worthly-promo-contact-sheet-${label}.png`,
);
const result = spawnSync(
  findChrome(root),
  [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=${width},${height}`,
    "--virtual-time-budget=30000",
    `--screenshot=${output}`,
    pathToFileURL(scratch).href,
  ],
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 300_000 },
);

if (result.error) throw result.error;
if (!fs.existsSync(output)) {
  console.error(result.stderr.slice(0, 1200));
  throw new Error("contact sheet was not written");
}

fs.rmSync(scratch, { force: true });
console.log(`Contact sheet → ${path.relative(root, output).replace(/\\/g, "/")} (${width}×${height})`);

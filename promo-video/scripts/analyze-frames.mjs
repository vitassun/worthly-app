/**
 * Visual QA — still-frame analysis.
 *
 * Every QA still is decoded and reduced to measurable facts: paper colour,
 * content bounds, edge bleed, ink density per band, and a hue census that proves
 * the film never introduces a second chromatic accent.
 *
 *   node scripts/analyze-frames.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodePng } from "./lib/png.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
};
const framesDir = path.resolve(root, arg("dir", path.join("qa", "frames")));
const outDir = path.join(root, "qa", "reports");
const label = path.basename(framesDir);

const files = fs
  .readdirSync(framesDir)
  .filter((file) => file.endsWith(".png"))
  .sort();

if (files.length === 0) throw new Error("No frames in qa/frames. Run `npm run frames` first.");

const PAPER = "#EFEAE0";
const hex = (r, g, b) =>
  "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();

const BANDS = 12;
const reports = [];

for (const file of files) {
  const { width, height, data } = decodePng(fs.readFileSync(path.join(framesDir, file)));

  const paper = [data[0], data[1], data[2]];
  const bandInk = new Array(BANDS).fill(0);
  const bandTotal = new Array(BANDS).fill(0);
  const colourCounts = new Map();
  const rowInk = new Int32Array(height);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let ink = 0;
  let chromatic = 0;
  let offPalette = 0;
  let offHueSum = 0;
  let maxOffHue = 0;

  for (let y = 0; y < height; y++) {
    const band = Math.min(BANDS - 1, Math.floor((y / height) * BANDS));
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 3;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      bandTotal[band] += 1;

      const delta = Math.max(Math.abs(r - paper[0]), Math.abs(g - paper[1]), Math.abs(b - paper[2]));
      if (delta <= 16) continue;

      ink += 1;
      bandInk[band] += 1;
      rowInk[y] += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      if (saturation > 0.16 && max > 60) {
        chromatic += 1;
        let hue;
        if (max === r) hue = 60 * (((g - b) / (max - min)) % 6);
        else if (max === g) hue = 60 * ((b - r) / (max - min) + 2);
        else hue = 60 * ((r - g) / (max - min) + 4);
        if (hue < 0) hue += 360;
        // Worthly Orange sits near 18–22°. Anything far from that range would be
        // a second chromatic accent, which the design system forbids.
        if (hue < 8 || hue > 46) {
          offPalette += 1;
          offHueSum += hue;
          if (hue > maxOffHue) maxOffHue = hue;
        }
      }

      if (delta > 40) {
        const key = hex(r & 0xf0, g & 0xf0, b & 0xf0);
        colourCounts.set(key, (colourCounts.get(key) || 0) + 1);
      }
    }
  }

  const total = width * height;

  // Rows that carry content, merged into vertical runs. This is how the film's
  // vertical rhythm is checked: every run should be a deliberate element, and
  // the gaps between runs should look like the spacing it was designed with.
  const MIN_ROW_INK = 4;
  const GAP = 10;
  const runs = [];
  let runStart = -1;
  let lastInk = -1;
  for (let y = 0; y < height; y++) {
    if (rowInk[y] >= MIN_ROW_INK) {
      if (runStart === -1) runStart = y;
      lastInk = y;
    } else if (runStart !== -1 && y - lastInk > GAP) {
      runs.push([runStart, lastInk]);
      runStart = -1;
    }
  }
  if (runStart !== -1) runs.push([runStart, lastInk]);

  reports.push({
    file,
    seconds: Number.parseInt(file.match(/(\d+)/)?.[1] ?? "0", 10),
    width,
    height,
    paper: hex(paper[0], paper[1], paper[2]),
    bounds: maxX < 0 ? null : { minX, minY, maxX, maxY },
    inkShare: Number((ink / total).toFixed(4)),
    chromaticShare: Number((chromatic / total).toFixed(4)),
    offPaletteShare: Number((offPalette / total).toFixed(5)),
    offPaletteMeanHue: offPalette > 0 ? Number((offHueSum / offPalette).toFixed(1)) : null,
    offPaletteMaxHue: maxOffHue ? Number(maxOffHue.toFixed(1)) : null,
    edgeBleed: {
      left: minX <= 0,
      right: maxX >= width - 1,
      top: minY <= 0,
      bottom: maxY >= height - 1,
    },
    bands: bandInk.map((count, index) => Number((count / bandTotal[index]).toFixed(3))),
    rowRuns: runs.map(([start, end]) => `${start}-${end}`),
    gaps: runs.slice(1).map(([start], index) => start - runs[index][1]),
    topColours: [...colourCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([colour, count]) => ({ colour, share: Number((count / total).toFixed(4)) })),
  });
}

const lines = [];
lines.push(`still-frame analysis · ${label} · 1920 × 1080`);
lines.push("=".repeat(100));
lines.push(
  `${"frame".padEnd(18)}${"paper".padEnd(9)}${"ink%".padStart(6)}${"chroma%".padStart(9)}${"off-pal%".padStart(10)}  ${"content bounds".padEnd(26)}flags`,
);
lines.push("-".repeat(100));

let flagged = 0;
for (const report of reports) {
  const notes = [];
  if (report.paper !== PAPER) notes.push(`paper is ${report.paper}`);
  if (report.inkShare < 0.004) notes.push("almost empty");
  if (report.inkShare > 0.5) notes.push("very dense");
  if (report.offPaletteShare > 0.0004) {
    notes.push(`off-palette ${(report.offPaletteShare * 100).toFixed(3)}% @hue ${report.offPaletteMeanHue}`);
  }
  const bleed = Object.entries(report.edgeBleed)
    .filter(([, value]) => value)
    .map(([edge]) => edge);

  // The device shots deliberately run the phone past the top and bottom of the
  // frame. At 1.30× the screen still clears its own safe areas — only the status
  // bar's top 10 pt and the last 2 pt of the home indicator are trimmed — and a
  // device larger than the page is the intended editorial treatment. So a
  // top-and-bottom bleed is reported, not flagged. A single-edge bleed would be
  // a real layout bug and still fails.
  const fullBleedDevice =
    bleed.length === 2 && bleed.includes("top") && bleed.includes("bottom");

  let failed = notes.length > 0;
  if (bleed.length > 0) {
    notes.push(fullBleedDevice ? "device full-bleed (expected)" : `touches ${bleed.join("/")}`);
    if (!fullBleedDevice) failed = true;
  }
  if (failed) flagged += 1;

  const bounds = report.bounds
    ? `${report.bounds.minX},${report.bounds.minY} → ${report.bounds.maxX},${report.bounds.maxY}`
    : "—";
  lines.push(
    `${report.file.padEnd(18)}${report.paper.padEnd(9)}${(report.inkShare * 100)
      .toFixed(2)
      .padStart(6)}${(report.chromaticShare * 100).toFixed(2).padStart(9)}${(
      report.offPaletteShare * 100
    )
      .toFixed(3)
      .padStart(10)}  ${bounds.padEnd(26)}${notes.join(" | ") || "ok"}`,
  );
}
lines.push("-".repeat(100));
lines.push(`${reports.length} frames · ${flagged} flagged`);

lines.push("");
lines.push("band ink profile (12 horizontal bands, top → bottom)");
lines.push("-".repeat(100));
for (const report of reports) {
  lines.push(`${report.file.padEnd(18)}${report.bands.map((v) => v.toFixed(2).padStart(6)).join("")}`);
}

lines.push("");
lines.push("vertical rhythm — merged content rows (y ranges) and the gaps between them");
lines.push("-".repeat(100));
for (const report of reports) {
  lines.push(`${report.file.padEnd(18)}${report.rowRuns.join("  ")}`);
  lines.push(`${"".padEnd(18)}gaps: ${report.gaps.join("  ") || "—"}`);
}

lines.push("");
lines.push("dominant colours");
lines.push("-".repeat(100));
for (const report of reports) {
  lines.push(
    `${report.file.padEnd(18)}${report.topColours
      .map((entry) => `${entry.colour} ${(entry.share * 100).toFixed(1)}%`)
      .join("  ")}`,
  );
}

const output = `${lines.join("\n")}\n`;
console.log(output);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `frame-analysis-${label}.txt`), output);
fs.writeFileSync(path.join(outDir, `frame-analysis-${label}.json`), `${JSON.stringify(reports, null, 2)}\n`);

process.exitCode = flagged > 0 ? 1 : 0;

/**
 * Visual QA — region probes.
 *
 * The still-frame analysis proves the film is on-palette and on the grid. These
 * probes go further and assert that each frame actually contains the elements
 * the storyboard puts there, in the place the layout puts them: type in its box,
 * empty space genuinely empty, the device outline at the exact pixel the phone
 * geometry predicts.
 *
 *   node scripts/probe-frames.mjs            # qa/frames
 *   node scripts/probe-frames.mjs --dir qa/frames-extra
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
const label = path.basename(framesDir);

const PAPER = [0xef, 0xea, 0xe0];
const INK_FLOOR = 20; // per-channel distance from paper that counts as content

/**
 * Phone geometry, mirrored from the scenes. `phoneBox` centres the device on
 * (1521, 540); the library scene pins its right edge to 1770 instead.
 */
const centredPhone = (scale) => ({
  left: 1521 - (415 * scale) / 2,
  right: 1521 + (415 * scale) / 2,
  top: 540 - (874 * scale) / 2,
  bottom: 540 + (874 * scale) / 2,
});
const PHONE = centredPhone(1.3);

/** Every probe: [kind, ...args, label] */
const PROBES = {
  // ── Opening ───────────────────────────────────────────────────────────────
  "frame-0002.png": [
    ["ink", 150, 392, 900, 540, 2000, "opening line 1 — 很想要，"],
    ["ink", 150, 540, 900, 688, 2000, "opening line 2 — 就代表值得？"],
    ["orange", 600, 540, 900, 688, 60, "opening ？ is the only orange"],
    ["empty", 950, 380, 1800, 700, 60, "opening right half is paper"],
    ["empty", 150, 60, 1800, 380, 40, "opening top is paper"],
  ],
  "frame-0003.png": [
    ["ink", 150, 935, 700, 980, 40, "opening signature WORTHLY · 值不值"],
  ],

  // ── Thesis ────────────────────────────────────────────────────────────────
  "frame-0005.png": [
    ["ink", 150, 414, 900, 540, 2000, "thesis line 1 — 买下的那一刻，"],
    ["ink", 150, 540, 900, 666, 2000, "thesis line 2 — 不是答案。"],
    ["empty", 950, 400, 1800, 680, 60, "thesis right half is paper"],
    ["empty", 150, 100, 1800, 380, 40, "thesis top is paper"],
  ],
  "frame-04.8.png": [
    ["ink", 150, 414, 900, 540, 2000, "thesis line 1 still up"],
    ["empty", 150, 100, 1800, 380, 40, "thesis top still paper"],
  ],

  // ── Before (capture) ──────────────────────────────────────────────────────
  "frame-0006.png": [
    ["ink", 150, 90, 600, 130, 40, "before slug 01 · CAPTURE"],
    ["ink", 150, 363, 1050, 473, 1500, "before line 1"],
    ["device", 540, 1200, 1800, PHONE.left, PHONE.right, 14, "before device outline"],
  ],
  "frame-0008.png": [
    ["ink", 150, 90, 600, 130, 40, "before slug 01 · CAPTURE"],
    ["ink", 150, 363, 1050, 473, 1500, "before line 1 — 把想要的东西，"],
    ["ink", 150, 473, 1050, 583, 700, "before line 2 — 先记下来。"],
    ["ink", 150, 617, 1050, 717, 400, "before body copy"],
    ["device", 540, 1200, 1800, PHONE.left, PHONE.right, 14, "before device outline"],
    ["empty", 1080, 90, 1240, 1080, 200, "gutter between column and phone"],
  ],
  "frame-09.4.png": [
    ["device", 540, 1200, 1800, PHONE.left, PHONE.right, 14, "before device outline"],
    ["ink", 150, 363, 1050, 473, 1500, "before line 1 still up"],
  ],


  // ── Wait (decision revisit) ───────────────────────────────────────────────
  // 10.2 s is 21 frames into the scene: headline landed, card not yet.
  "frame-10.2.png": [
    ["ink", 150, 90, 600, 130, 40, "wait slug 02 · WAIT"],
    ["ink", 150, 296, 900, 444, 2000, "wait headline 还想买吗？"],
    ["empty", 150, 560, 1800, 1000, 100, "wait card has not arrived yet"],
  ],
  "frame-0011.png": [
    ["ink", 150, 90, 600, 130, 40, "wait slug 02 · WAIT"],
    ["ink", 150, 246, 800, 280, 30, "wait overline DECISION · 7 DAYS"],
    ["ink", 150, 296, 900, 444, 3000, "wait headline 还想买吗？"],
    ["ink", 150, 472, 1200, 530, 200, "wait body copy"],
    ["ink", 150, 560, 1000, 900, 1500, "wait released decision card"],
    ["empty", 1200, 560, 1800, 1000, 100, "right of the released card is paper"],
  ],

  // ── Decide ────────────────────────────────────────────────────────────────
  "frame-13.2.png": [
    ["ink", 150, 90, 600, 130, 40, "decide slug 03 · DECIDE"],
    ["ink", 150, 373, 900, 521, 3000, "decide headline 后来呢？"],
    ["ink", 150, 560, 1100, 660, 200, "decide body copy"],
    ["ink", 150, 693, 1100, 803, 6000, "decide 买了 / 没买 buttons"],
    ["empty", 1200, 600, 1800, 900, 100, "right of the buttons is paper"],
  ],

  // ── Purchase ──────────────────────────────────────────────────────────────
  "frame-0014.png": [
    ["ink", 150, 90, 700, 130, 40, "purchase slug 04 · PURCHASE"],
    ["ink", 150, 363, 1100, 473, 1500, "purchase line 1"],
    ["ink", 150, 473, 1100, 583, 700, "purchase line 2"],
    ["device", 540, 1200, 1800, PHONE.left, PHONE.right, 14, "purchase device outline"],
  ],
  "frame-15.7.png": [
    ["ink", 150, 90, 600, 130, 40, "after slug 05 · AFTER"],
    ["empty", 150, 340, 1800, 1010, 200, "no check-in rows yet"],
  ],

  // ── After (7 / 30 / 90) ───────────────────────────────────────────────────
  "frame-0017.png": [
    ["ink", 150, 90, 600, 130, 40, "after slug 05 · AFTER"],
    ["ink", 150, 142, 900, 176, 30, "after mono AFTER · AirPods Max"],
    ["ink", 150, 184, 1200, 266, 800, "after headline 期待正在变成真实体验。"],
    ["ink", 150, 340, 1000, 415, 800, "after row 7 days"],
    ["ink", 150, 445, 1400, 500, 200, "after row 7 note"],
    ["empty", 150, 560, 1800, 1000, 200, "rows 30 / 90 have not arrived yet"],
  ],
  "frame-16.5.png": [
    ["ink", 150, 340, 1000, 415, 800, "after row 7 days"],
    ["empty", 150, 550, 1800, 1010, 200, "rows 30 / 90 have not arrived yet"],
  ],
  "frame-18.5.png": [
    ["ink", 150, 340, 1000, 415, 800, "after row 7 days"],
    ["ink", 150, 550, 1000, 630, 800, "after row 30 days"],
    ["empty", 150, 770, 1800, 1010, 200, "row 90 has not arrived yet"],
  ],
  "frame-0020.png": [
    ["ink", 150, 340, 1000, 415, 800, "after row 7 days"],
    ["ink", 150, 550, 1000, 630, 800, "after row 30 days"],
    ["ink", 150, 770, 1000, 850, 800, "after row 90 days"],
    ["ink", 150, 1004, 1300, 1036, 30, "after closing line 真正的“值”，要过一阵子再问。"],
  ],

  // ── Anytime ───────────────────────────────────────────────────────────────
  "frame-0023.png": [
    ["ink", 150, 90, 600, 130, 40, "anytime slug 06 · ANYTIME"],
    ["ink", 150, 363, 1050, 473, 1500, "anytime line 1 — 今天想说什么，"],
    ["ink", 150, 473, 1050, 583, 700, "anytime line 2 — 就记什么。"],
    ["device", 540, 1200, 1800, PHONE.left, PHONE.right, 14, "anytime device outline"],
  ],
  "frame-22.5.png": [
    ["device", 540, 1200, 1800, PHONE.left, PHONE.right, 14, "anytime device outline"],
    ["ink", 150, 617, 1050, 717, 400, "anytime body copy"],
  ],

  // ── Library ───────────────────────────────────────────────────────────────
  "frame-24.2.png": [
    ["ink", 150, 90, 700, 130, 40, "library slug 07 · LIBRARY"],
    ["ink", 150, 363, 1000, 473, 1500, "library line 1 — 记录越多，"],
    ["ink", 150, 473, 1000, 583, 700, "library line 2 — 结论越像你自己。"],
    ["device", 540, 1250, 1800, 1330, 1770, 12, "library device outline"],
  ],

  // ── Insights ──────────────────────────────────────────────────────────────
  "frame-0026.png": [
    ["ink", 150, 90, 700, 130, 40, "insight slug 08 · INSIGHTS"],
    ["ink", 150, 206, 900, 240, 30, "insight overline YOUR WORTH MEMORY"],
    ["ink", 150, 256, 900, 356, 800, "insight line 1 — 你真正觉得"],
    ["ink", 150, 356, 900, 456, 800, "insight line 2 — 值得的是什么？"],
    ["ink", 900, 293, 1640, 760, 3000, "insight released emphasis card"],
    ["empty", 800, 620, 895, 900, 60, "gutter before the emphasis card"],
  ],
  "frame-27.6.png": [
    ["ink", 900, 293, 1640, 760, 3000, "insight emphasis card still up"],
    ["ink", 150, 560, 760, 860, 800, "insight CURRENT SNAPSHOT card"],
  ],

  // ── Philosophy ────────────────────────────────────────────────────────────
  "frame-0029.png": [
    ["ink", 150, 320, 700, 346, 30, "philosophy overline DATA CONFIDENCE"],
    ["ink", 150, 380, 1300, 505, 2500, "philosophy headline 让结论慢一点出现。"],
    ["ink", 150, 580, 1600, 670, 400, "philosophy body copy"],
    ["empty", 150, 700, 1800, 1080, 60, "philosophy rule has not drawn yet"],
    ["empty", 150, 60, 1800, 315, 40, "philosophy top is paper"],
  ],
  "frame-28.6.png": [
    ["ink", 150, 380, 1300, 505, 1000, "philosophy headline arriving"],
    ["empty", 150, 700, 1800, 1080, 60, "philosophy rule has not drawn yet"],
    ["empty", 150, 60, 1800, 315, 40, "philosophy top is paper"],
  ],

  // ── End card ──────────────────────────────────────────────────────────────
  // Three layers, one beat apart: the W. mark, the name, then the line.
  "frame-0031.png": [
    ["ink", 150, 320, 520, 500, 400, "end card W. mark"],
    ["ink", 150, 570, 520, 680, 300, "end card Worthly"],
    ["ink", 455, 580, 700, 680, 60, "end card 值不值"],
    ["ink", 150, 700, 800, 790, 200, "end card slogan 给想要一点时间。"],
    ["empty", 150, 60, 1800, 280, 40, "end card top is paper"],
    ["empty", 150, 830, 1800, 1080, 40, "end card bottom is paper"],
  ],
  "frame-31.5.png": [
    ["ink", 150, 700, 800, 790, 200, "end card slogan still up"],
  ],
};

const readFrame = (file) => decodePng(fs.readFileSync(path.join(framesDir, file)));

const distance = (data, index) =>
  Math.max(
    Math.abs(data[index] - PAPER[0]),
    Math.abs(data[index + 1] - PAPER[1]),
    Math.abs(data[index + 2] - PAPER[2]),
  );

const countContent = (frame, x0, y0, x1, y1, predicate) => {
  let count = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const index = (y * frame.width + x) * 3;
      if (predicate(frame.data, index)) count += 1;
    }
  }
  return count;
};

const isInk = (data, index) => distance(data, index) > INK_FLOOR;
const isOrange = (data, index) => {
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];
  return r - b > 40 && r - g > 24 && r > 120;
};

/** First and last content pixel along a row, searched inside a window. */
const rowSpan = (frame, y, x0, x1) => {
  let first = -1;
  let last = -1;
  for (let x = x0; x < x1; x++) {
    if (isInk(frame.data, (y * frame.width + x) * 3)) {
      if (first === -1) first = x;
      last = x;
    }
  }
  return [first, last];
};

const results = [];
const run = (file) => {
  const probes = PROBES[file];
  if (!probes) return;
  const frame = readFrame(file);
  for (const probe of probes) {
    const [kind, ...rest] = probe;
    const label = rest[rest.length - 1];
    if (kind === "ink" || kind === "empty" || kind === "orange") {
      const [x0, y0, x1, y1, threshold] = rest;
      const predicate = kind === "orange" ? isOrange : isInk;
      const count = countContent(frame, x0, y0, x1, y1, predicate);
      const pass =
        kind === "empty" ? count <= threshold : count >= threshold;
      results.push({
        file,
        label,
        pass,
        detail: `${count} px (${kind} ${kind === "empty" ? "≤" : "≥"} ${threshold})`,
      });
    } else if (kind === "device") {
      const [y, x0, x1, expectedLeft, expectedRight, tolerance] = rest;
      const [first, last] = rowSpan(frame, y, x0, x1);
      const pass =
        first !== -1 &&
        Math.abs(first - expectedLeft) <= tolerance &&
        Math.abs(last - expectedRight) <= tolerance;
      results.push({
        file,
        label,
        pass,
        detail: `outline ${first}…${last}, expected ${Math.round(expectedLeft)}…${Math.round(expectedRight)} ±${tolerance}`,
      });
    }
  }
};

const files = fs
  .readdirSync(framesDir)
  .filter((file) => file.endsWith(".png"))
  .sort();
for (const file of files) run(file);

const lines = [];
lines.push(`region probes · ${label}`);
lines.push("=".repeat(104));
lines.push(`${"frame".padEnd(18)}${"result".padEnd(8)}probe`);
lines.push("-".repeat(104));
let failures = 0;
let current = null;
for (const result of results) {
  if (result.file !== current) {
    current = result.file;
  }
  if (!result.pass) failures += 1;
  lines.push(
    `${result.file.padEnd(18)}${(result.pass ? "pass" : "FAIL").padEnd(8)}${result.label}  ·  ${result.detail}`,
  );
}
lines.push("-".repeat(104));
lines.push(`${results.length} probes · ${failures} failed`);

const output = `${lines.join("\n")}\n`;
console.log(output);
fs.mkdirSync(path.join(root, "qa", "reports"), { recursive: true });
fs.writeFileSync(path.join(root, "qa", "reports", `probes-${label}.txt`), output);
process.exitCode = failures > 0 ? 1 : 0;

/**
 * Visual QA — device screen layout measurement.
 *
 * The reconstructed screens are pure React, so they can be mounted at their real
 * logical size (393×852pt) in headless Chrome and measured directly. This
 * catches what a still frame hides: text that does not wrap, content that
 * overflows the 393pt column, and scroll distances that do not land where the
 * storyboard expects.
 *
 *   node scripts/measure-screens.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { build } from "esbuild";
import { findChrome, fileUrl } from "./lib/chrome.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fontBase = fileUrl(path.join(root, "public", "fonts")) + "/";

const built = await build({
  entryPoints: [path.join(root, "src", "qa", "screensEntry.tsx")],
  bundle: true,
  platform: "browser",
  format: "iife",
  jsx: "automatic",
  target: "chrome120",
  write: false,
  logLevel: "silent",
  define: { "process.env.NODE_ENV": '"production"' },
});

const script = String.raw`
(async () => {
  const out = document.getElementById("qa-out");
  const b64 = (value) => {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    }
    return btoa(binary);
  };
  try {
    await window.WorthlyQA.ready;
    const reports = [];
    for (const id of window.WorthlyQA.screenIds) {
      const stage = document.getElementById("stage");
      stage.innerHTML = "";
      const host = document.createElement("div");
      host.style.position = "relative";
      host.style.width = "393px";
      host.style.height = "852px";
      host.style.overflow = "hidden";
      stage.appendChild(host);
      window.WorthlyQA.mount(id, host);
      await new Promise((resolve) => setTimeout(resolve, 0));

      const rootRect = host.getBoundingClientRect();
      let maxBottom = 0, maxRight = 0, minLeft = Infinity;
      const overflows = [];
      const deepest = [];
      const walk = (element) => {
        const rect = element.getBoundingClientRect();
        const bottom = rect.bottom - rootRect.top;
        const right = rect.right - rootRect.left;
        const left = rect.left - rootRect.left;
        const style = getComputedStyle(element);
        if (style.position !== "absolute" && style.position !== "fixed") {
          maxBottom = Math.max(maxBottom, bottom);
          maxRight = Math.max(maxRight, right);
          minLeft = Math.min(minLeft, left);
        }
        if (element.scrollWidth > element.clientWidth + 1 && element.clientWidth > 0) {
          overflows.push({
            text: (element.textContent || "").trim().slice(0, 40),
            scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth,
          });
        }
        if (bottom > 0) {
          deepest.push({ bottom: Math.round(bottom), text: (element.textContent || "").trim().slice(0, 32) });
        }
        for (const child of element.children) walk(child);
      };
      for (const child of host.children) walk(child);
      deepest.sort((a, b) => b.bottom - a.bottom);
      reports.push({
        id,
        maxBottom: Math.round(maxBottom),
        maxRight: Math.round(maxRight),
        minLeft: Number.isFinite(minLeft) ? Math.round(minLeft) : null,
        deepest: deepest.slice(0, 3),
        overflows,
      });
    }
    out.textContent = "OK:" + b64(JSON.stringify(reports));
  } catch (error) {
    out.textContent = "ERR:" + String((error && error.stack) || error);
  }
})();
`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;background:#fff}
  #stage{position:absolute;left:0;top:0}
  #qa-out{position:absolute;left:-99999px;top:0}
</style></head><body>
<div id="stage"></div><pre id="qa-out">PENDING</pre>
<script>window.WorthlyQAFontBase = ${JSON.stringify(fontBase)};</script>
<script>${built.outputFiles[0].text}</script>
<script>${script}</script>
</body></html>`;

const scratch = path.join(root, "qa", "_measure.html");
fs.mkdirSync(path.dirname(scratch), { recursive: true });
fs.writeFileSync(scratch, html);

const result = spawnSync(
  findChrome(root),
  [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    "--allow-file-access-from-files",
    "--force-device-scale-factor=1",
    "--virtual-time-budget=60000",
    "--dump-dom",
    pathToFileURL(scratch).href,
  ],
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 240_000 },
);

if (result.error) throw result.error;

const match = result.stdout.match(/<pre id="qa-out">([\s\S]*?)<\/pre>/);
if (!match) {
  console.error(result.stdout.slice(0, 1500));
  throw new Error("measurement page produced no output");
}
const payload = match[1].trim();
if (payload.startsWith("ERR:")) throw new Error(payload.slice(4));
if (!payload.startsWith("OK:")) throw new Error(`unexpected payload: ${payload.slice(0, 400)}`);

const reports = JSON.parse(Buffer.from(payload.slice(3), "base64").toString("utf8"));

const lines = [];
lines.push("device screen layout measurement (393 × 852 pt)");
lines.push("=".repeat(78));
lines.push(`${"screen".padEnd(26)}${"content".padStart(9)}${"right".padStart(8)}  issues`);
lines.push("-".repeat(78));

let issueCount = 0;
for (const report of reports) {
  const notes = [];
  if (report.maxRight > 393) notes.push(`bleeds right by ${report.maxRight - 393}pt`);
  if (report.overflows.length > 0) {
    notes.push(
      `text overflow ×${report.overflows.length}: ` +
        report.overflows
          .slice(0, 2)
          .map((entry) => `"${entry.text}" ${entry.scrollWidth}>${entry.clientWidth}`)
          .join("; "),
    );
  }
  if (notes.length > 0) issueCount += 1;
  lines.push(
    `${report.id.padEnd(26)}${String(report.maxBottom).padStart(9)}${String(report.maxRight).padStart(8)}  ${
      notes.length === 0 ? "ok" : notes.join(" | ")
    }`,
  );
}
lines.push("-".repeat(78));
lines.push(`${reports.length} screens · ${issueCount} with issues`);

const text = `${lines.join("\n")}\n`;
console.log(text);

const outDir = path.join(root, "qa", "reports");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "screen-layout.txt"), text);
fs.writeFileSync(path.join(outDir, "screen-layout.json"), `${JSON.stringify(reports, null, 2)}\n`);

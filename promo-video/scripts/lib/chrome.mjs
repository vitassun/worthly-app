/**
 * Locates the Chrome Headless Shell that Remotion downloaded for this platform.
 * Remotion's own renderer keeps its browser API private, so the QA scripts drive
 * the same binary directly.
 */
import fs from "node:fs";
import path from "node:path";

const CANDIDATE_DIRS = ["chrome-headless-shell", "chrome-for-testing"];

export const findChrome = (root) => {
  const base = path.join(root, "node_modules", ".remotion");
  for (const dir of CANDIDATE_DIRS) {
    const platformDir = path.join(base, dir);
    if (!fs.existsSync(platformDir)) continue;
    for (const arch of fs.readdirSync(platformDir)) {
      const buildDir = path.join(platformDir, arch);
      if (!fs.statSync(buildDir).isDirectory()) continue;
      for (const variant of fs.readdirSync(buildDir)) {
        const candidateDir = path.join(buildDir, variant);
        if (!fs.statSync(candidateDir).isDirectory()) continue;
        for (const file of fs.readdirSync(candidateDir)) {
          if (/^chrome-headless-shell(\.exe)?$/.test(file)) {
            return path.join(candidateDir, file);
          }
        }
      }
    }
  }
  throw new Error(
    "Chrome Headless Shell not found. Run `npx remotion render` once so Remotion downloads it.",
  );
};

/** `file:///I:/path` — the form Chrome needs on Windows, with forward slashes. */
export const fileUrl = (absolutePath) =>
  `file:///${absolutePath.replace(/\\/g, "/").replace(/^\/+/, "")}`;

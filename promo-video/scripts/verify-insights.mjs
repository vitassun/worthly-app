// Bundles the TypeScript insight-engine port with esbuild and runs it, so the
// demo data can be checked against the real Worthly rules without a build step.
import { build } from "esbuild";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const out = mkdtempSync(join(tmpdir(), "worthly-verify-"));

try {
  const result = await build({
    entryPoints: ["src/data/verifyEntry.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    write: false,
    logLevel: "silent",
  });

  const file = join(out, "verifyEntry.mjs");
  const { writeFileSync } = await import("node:fs");
  writeFileSync(file, result.outputFiles[0].text);
  await import(pathToFileURL(file).href);
} finally {
  rmSync(out, { recursive: true, force: true });
}

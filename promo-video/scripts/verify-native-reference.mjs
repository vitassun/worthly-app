/** Verify downloaded native render provenance and the six actual theme roles. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { decodePng } from "./lib/png.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const directory = path.join(root, "public/native-reference");
const metadata = JSON.parse(fs.readFileSync(path.join(directory, "metadata.json"), "utf8"));
if (metadata.bundleIdentifier !== "com.vitassun.worthly" || metadata.version !== "0.2.0"
    || metadata.build !== "2" || !/^[0-9a-f]{40}$/.test(metadata.sourceSHA)) {
  throw new Error("Unexpected native reference provenance");
}
const theme = fs.readFileSync(path.join(root, "../Worthly/Core/DesignSystem/WorthlyTheme.swift"), "utf8");
const roles = [...theme.matchAll(/static let (\w+) = adaptive\(light: 0x([A-F0-9]{6}), dark: 0x([A-F0-9]{6})\)/g)];
if (roles.length !== 6) throw new Error("Expected six adaptive App theme roles");
const counts = { light: {}, dark: {} };
const images = [];
for (const entry of metadata.images) {
  const buffer = fs.readFileSync(path.join(directory, entry.file));
  const png = decodePng(buffer);
  if (!entry.hierarchyDrawn || png.width !== entry.pixelWidth || png.height !== entry.pixelHeight) {
    throw new Error(`Invalid native reference dimensions: ${entry.file}`);
  }
  const histogram = new Map();
  for (let i = 0; i < png.data.length; i += 3) {
    const key = (png.data[i] << 16) | (png.data[i + 1] << 8) | png.data[i + 2];
    histogram.set(key, (histogram.get(key) ?? 0) + 1);
  }
  for (const [, role, light, dark] of roles) {
    const hex = entry.appearance === "light" ? light : dark;
    counts[entry.appearance][role] = (counts[entry.appearance][role] ?? 0) + (histogram.get(parseInt(hex, 16)) ?? 0);
  }
  images.push({ file: entry.file, width: png.width, height: png.height,
    sha256: crypto.createHash("sha256").update(buffer).digest("hex") });
}
const checks = Object.entries(counts).flatMap(([appearance, values]) =>
  roles.map(([, role]) => ({ appearance, role, pixels: values[role] ?? 0, pass: (values[role] ?? 0) >= 100 })));
const report = { sourceSHA: metadata.sourceSHA, simulator: `${metadata.simulatorName} / iOS ${metadata.simulatorOS}`,
  referenceKind: metadata.referenceKind, images, checks };
fs.writeFileSync(path.join(root, "qa/reports/native-reference.json"), JSON.stringify(report, null, 2) + "\n");
for (const check of checks) console.log(`${check.pass ? "PASS" : "FAIL"} ${check.appearance} ${check.role}: ${check.pixels} native pixels`);
if (checks.some(check => !check.pass)) process.exitCode = 1;

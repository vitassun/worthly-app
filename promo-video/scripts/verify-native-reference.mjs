/** Verify downloaded native render provenance and the six actual theme roles. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { decodePng } from "./lib/png.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const directory = path.join(root, "public/native-reference");
const metadata = JSON.parse(fs.readFileSync(path.join(directory, "metadata.json"), "utf8"));
const home = JSON.parse(fs.readFileSync(path.join(directory, "home-metadata.json"), "utf8"));
if (metadata.bundleIdentifier !== "com.vitassun.worthly" || metadata.version !== "0.2.0"
    || metadata.build !== "2" || !/^[0-9a-f]{40}$/.test(metadata.sourceSHA)) {
  throw new Error("Unexpected native reference provenance");
}
const theme = fs.readFileSync(path.join(root, "../Worthly/Core/DesignSystem/WorthlyTheme.swift"), "utf8");
const roles = [...theme.matchAll(/static let (\w+) = adaptive\(light: 0x([A-F0-9]{6}), dark: 0x([A-F0-9]{6})\)/g)];
if (roles.length !== 6) throw new Error("Expected six adaptive App theme roles");
const counts = { light: {}, dark: {} };
const homeCounts = { light: {}, dark: {} };
const images = [];
if (home.bundleIdentifier !== metadata.bundleIdentifier || home.version !== metadata.version
    || home.build !== metadata.build || !/^[0-9a-f]{40}$/.test(home.sourceSHA)
    || home.bounds.width !== 402 || home.bounds.height !== 874 || home.images.length !== 2) {
  throw new Error("Invalid generated native home provenance or geometry");
}
for (const entry of [...metadata.images, ...home.images]) {
  const buffer = fs.readFileSync(path.join(directory, entry.file));
  const png = decodePng(buffer);
  const isHome = entry.section === "home";
  if ((!isHome && !entry.hierarchyDrawn) || png.width !== entry.pixelWidth || png.height !== entry.pixelHeight) {
    throw new Error(`Invalid native reference dimensions: ${entry.file}`);
  }
  const digest = crypto.createHash("sha256").update(buffer).digest("hex");
  if (isHome && (entry.captureMethod !== "simctl-io-full-screen" || entry.bitsPerComponent !== 8
      || !entry.window?.usesOriginalAppWindow || entry.window.level !== 0 || !entry.window.isKeyWindow
      || entry.tabBar.items.join("/") !== "首页/记录/洞察/我的" || entry.sha256 !== digest)) {
    throw new Error("Expected unmodified compositor home with verified hash and four-tab bar");
  }
  const histogram = new Map();
  for (let i = 0; i < png.data.length; i += png.channels) {
    const key = (png.data[i] << 16) | (png.data[i + 1] << 8) | png.data[i + 2];
    histogram.set(key, (histogram.get(key) ?? 0) + 1);
  }
  let colorEvaluation;
  if (isHome) {
    const targets = Object.fromEntries(roles.map(([, role, light, dark]) =>
      [role, entry.appearance === "light" ? light : dark]));
    const comparison = spawnSync("python", [path.join(root, "scripts/native-color-counts.py"),
      path.join(directory, entry.file), JSON.stringify(targets)], { encoding: "utf8" });
    if (comparison.status !== 0) throw new Error(`Native ICC color comparison failed: ${comparison.stderr}`);
    colorEvaluation = JSON.parse(comparison.stdout);
    homeCounts[entry.appearance] = { ...colorEvaluation.counts, systemTabTint: colorEvaluation.systemTabTint };
  }
  for (const [, role, light, dark] of isHome ? [] : roles) {
    const hex = entry.appearance === "light" ? light : dark;
    counts[entry.appearance][role] = (counts[entry.appearance][role] ?? 0) + (histogram.get(parseInt(hex, 16)) ?? 0);
  }
  images.push({ file: entry.file, width: png.width, height: png.height,
    sha256: digest, ...(colorEvaluation ? { colorEvaluation } : {}) });
}
const checks = Object.entries(counts).flatMap(([appearance, values]) =>
  roles.map(([, role]) => ({ view: "detail", appearance, role, pixels: values[role] ?? 0, pass: (values[role] ?? 0) >= 100 })));
checks.push(...Object.entries(homeCounts).flatMap(([appearance, values]) =>
  roles.filter(([, role]) => role !== "emphasis" && role !== "accent").map(([, role]) =>
    ({ view: "home", appearance, role, pixels: values[role] ?? 0, pass: (values[role] ?? 0) >= 100 }))));
// UIKit adjusts selected-tab tint to its material; it is not the raw theme RGB.
checks.push(...Object.entries(homeCounts).map(([appearance, values]) =>
  ({ view: "home", appearance, role: "systemTabTint", pixels: values.systemTabTint,
    pass: values.systemTabTint >= 100 })));
const report = { sourceSHA: metadata.sourceSHA, simulator: `${metadata.simulatorName} / iOS ${metadata.simulatorOS}`,
  referenceKind: metadata.referenceKind, homeSourceSHA: home.sourceSHA, homeReferenceKind: home.referenceKind,
  homeBounds: home.bounds, images, checks };
fs.writeFileSync(path.join(root, "qa/reports/native-reference.json"), JSON.stringify(report, null, 2) + "\n");
for (const check of checks) console.log(`${check.pass ? "PASS" : "FAIL"} ${check.view} ${check.appearance} ${check.role}: ${check.pixels} native pixels`);
if (checks.some(check => !check.pass)) process.exitCode = 1;

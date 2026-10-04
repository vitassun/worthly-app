/**
 * Dev aid: prints the insight cards the real engine would produce for the demo
 * data. Run with `npm run verify:data`. This is how the numbers shown in the
 * film were confirmed against the ported Swift rules.
 */
import { DEMO_ITEMS } from "./demo";
import { insightSnapshot, remainingUntilFirstInsight } from "./insightEngine";

const snapshot = insightSnapshot(DEMO_ITEMS);

const lines: string[] = [];
lines.push("=== Worthly demo data · InsightEngine port ===");
lines.push(`evaluatedCount : ${snapshot.evaluatedCount}`);
lines.push(`matureCount    : ${snapshot.matureCount}`);
lines.push(`average        : ${snapshot.averageSatisfaction?.toFixed(1) ?? "—"}`);
lines.push(`remaining      : ${remainingUntilFirstInsight(DEMO_ITEMS)}`);
lines.push("");
for (const card of snapshot.cards) {
  lines.push(`[${card.overline}]${card.isEmphasis ? " (emphasis)" : ""}`);
  lines.push(`  headline : ${card.headline}`);
  if (card.leftLabel) lines.push(`  left     : ${card.leftLabel} = ${card.leftValue}`);
  if (card.rightLabel) lines.push(`  right    : ${card.rightLabel} = ${card.rightValue}`);
  lines.push(`  detail   : ${card.detail}`);
  lines.push("");
}

console.log(lines.join("\n"));

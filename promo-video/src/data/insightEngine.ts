/**
 * A line-for-line port of `Worthly/Core/Insights/InsightEngine.swift`.
 *
 * The film must never show an insight the real engine would not produce, so the
 * promo computes its insight cards with the same rules, the same thresholds and
 * the same wording as the app. If the Swift engine changes, this file has to
 * change with it.
 *
 * `scripts/verify-insights.mjs` runs this port over the demo data and prints the
 * cards, which is how the values baked into the storyboard were confirmed.
 */
import type { DemoCheckIn, DemoItem } from "./demo";

export interface InsightCardModel {
  id: string;
  overline: string;
  headline: string;
  detail: string;
  leftLabel?: string;
  leftValue?: string;
  rightLabel?: string;
  rightValue?: string;
  isEmphasis: boolean;
}

export interface InsightSnapshot {
  evaluatedCount: number;
  matureCount: number;
  averageSatisfaction?: number;
  cards: InsightCardModel[];
}

const MINIMUM_EARLY_SAMPLE = 3;
const MINIMUM_MATURE_SAMPLE = 3;
const MINIMUM_CATEGORY_SAMPLE = 3;
const MINIMUM_DISCOUNT_GROUP_SAMPLE = 2;
const MEANINGFUL_DISCOUNT_THRESHOLD = 0.2;
const MEANINGFUL_SCORE_GAP = 0.5;

interface Evaluation {
  item: DemoItem;
  checkIn: DemoCheckIn;
  satisfaction: number;
  desire: number;
  stageDays: number;
}

const format = (value: number): string => value.toFixed(1);

const average = (values: number[]): number | undefined => {
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const normalizedCategory = (category: string): string => {
  const trimmed = category.trim();
  return trimmed.length === 0 ? "其他" : trimmed;
};

/** Mirrors `InsightEngine.truncatedMetricLabel`. */
const truncatedMetricLabel = (value: string): string => {
  const trimmed = value.trim();
  const normalized = trimmed.length === 0 ? "未命名商品" : trimmed;
  const limit = 10;
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit - 1)}…`;
};

/** Mirrors `InsightEngine.latestCheckIn` — 90d > 30d > 7d, ad-hoc excluded. */
const latestCheckIn = (item: DemoItem): DemoCheckIn | undefined => {
  const staged = item.checkIns.filter(
    (checkIn) =>
      (checkIn.stageDays === 7 || checkIn.stageDays === 30 || checkIn.stageDays === 90) &&
      checkIn.satisfactionScore >= 1 &&
      checkIn.satisfactionScore <= 10,
  );

  let best: DemoCheckIn | undefined;
  for (const checkIn of staged) {
    if (!best) {
      best = checkIn;
      continue;
    }
    if (best.stageDays === checkIn.stageDays) {
      const bestTime = Date.parse(best.createdAt);
      const time = Date.parse(checkIn.createdAt);
      if (bestTime === time) {
        if (best.id < checkIn.id) best = checkIn;
      } else if (bestTime < time) {
        best = checkIn;
      }
    } else if (best.stageDays < checkIn.stageDays) {
      best = checkIn;
    }
  }
  return best;
};

const evaluationFor = (item: DemoItem): Evaluation | undefined => {
  if (item.state !== "bought") return undefined;
  if (item.desireScore < 1 || item.desireScore > 10) return undefined;
  const checkIn = latestCheckIn(item);
  if (!checkIn) return undefined;
  return {
    item,
    checkIn,
    satisfaction: checkIn.satisfactionScore,
    desire: item.desireScore,
    stageDays: checkIn.stageDays,
  };
};

const expectationRealityCard = (evaluations: Evaluation[]): InsightCardModel => {
  const averageDesire = average(evaluations.map((e) => e.desire)) ?? 0;
  const averageSatisfaction = average(evaluations.map((e) => e.satisfaction)) ?? 0;
  const gap = averageSatisfaction - averageDesire;

  let headline: string;
  let detail: string;

  if (Math.abs(gap) < MEANINGFUL_SCORE_GAP) {
    headline = "你买前的想要程度，和后来满意度很接近。";
    detail = `基于 ${evaluations.length} 件已经回访的购买。两者平均只差 ${format(Math.abs(gap))} 分，Worthly 暂时不会把它解读成明显偏差。`;
  } else if (gap < 0) {
    headline = "你买前通常比后来更兴奋。";
    detail = `基于 ${evaluations.length} 件已经回访的购买。购买前想要度平均比最新满意度高 ${format(Math.abs(gap))} 分。`;
  } else {
    headline = "有些东西，买了以后反而比预期更值。";
    detail = `基于 ${evaluations.length} 件已经回访的购买。最新满意度平均比购买前想要度高 ${format(gap)} 分。`;
  }

  return {
    id: "expectation-reality",
    overline: "EXPECTATION / REALITY",
    headline,
    detail,
    leftLabel: "买前想要",
    leftValue: format(averageDesire),
    rightLabel: "后来满意",
    rightValue: format(averageSatisfaction),
    isEmphasis: true,
  };
};

const discountCard = (evaluations: Evaluation[]): InsightCardModel | undefined => {
  const priced: Array<{ evaluation: Evaluation; discount: number }> = [];

  for (const evaluation of evaluations) {
    const original = evaluation.item.originalPrice;
    const paid = evaluation.item.paidPrice;
    if (
      original === undefined ||
      paid === undefined ||
      !Number.isFinite(original) ||
      !Number.isFinite(paid) ||
      original <= 0 ||
      paid <= 0 ||
      paid > original
    ) {
      continue;
    }
    priced.push({ evaluation, discount: (original - paid) / original });
  }

  const stronger = priced.filter((entry) => entry.discount >= MEANINGFUL_DISCOUNT_THRESHOLD);
  const lighter = priced.filter((entry) => entry.discount < MEANINGFUL_DISCOUNT_THRESHOLD);

  if (
    stronger.length < MINIMUM_DISCOUNT_GROUP_SAMPLE ||
    lighter.length < MINIMUM_DISCOUNT_GROUP_SAMPLE
  ) {
    return undefined;
  }

  const strongerAverage = average(stronger.map((entry) => entry.evaluation.satisfaction)) ?? 0;
  const lighterAverage = average(lighter.map((entry) => entry.evaluation.satisfaction)) ?? 0;
  const gap = strongerAverage - lighterAverage;

  let headline: string;
  if (Math.abs(gap) < MEANINGFUL_SCORE_GAP) {
    headline = "目前看，折扣大小和你的长期满意度差得不多。";
  } else if (gap < 0) {
    headline = "你记录的大折扣购买，后来满意度反而更低。";
  } else {
    headline = "你记录的大折扣购买，后来满意度更高。";
  }

  return {
    id: "discount-pattern",
    overline: "DISCOUNT PATTERN · 30+ DAYS",
    headline,
    detail:
      "只比较已到 30 / 90 天、且同时记录原价和到手价的项目。这里描述的是你的样本关联，不代表折扣本身造成了结果。",
    leftLabel: `≥20% OFF · ${stronger.length}件`,
    leftValue: format(strongerAverage),
    rightLabel: `<20% OFF · ${lighter.length}件`,
    rightValue: format(lighterAverage),
    isEmphasis: false,
  };
};

const categoryCard = (evaluations: Evaluation[]): InsightCardModel | undefined => {
  const grouped = new Map<string, Evaluation[]>();
  for (const evaluation of evaluations) {
    const key = normalizedCategory(evaluation.item.category);
    const bucket = grouped.get(key);
    if (bucket) bucket.push(evaluation);
    else grouped.set(key, [evaluation]);
  }

  const qualified: Array<{ category: string; values: Evaluation[]; score: number }> = [];
  for (const [category, values] of grouped) {
    if (values.length < MINIMUM_CATEGORY_SAMPLE) continue;
    const score = average(values.map((e) => e.satisfaction));
    if (score === undefined) continue;
    qualified.push({ category, values, score });
  }

  if (qualified.length === 0) return undefined;

  // `max(by:)` with the same tie-breaking order as the Swift implementation.
  let strongest = qualified[0];
  for (const candidate of qualified.slice(1)) {
    if (candidate.score !== strongest.score) {
      if (candidate.score > strongest.score) strongest = candidate;
      continue;
    }
    if (candidate.values.length !== strongest.values.length) {
      if (candidate.values.length > strongest.values.length) strongest = candidate;
      continue;
    }
    if (candidate.category < strongest.category) strongest = candidate;
  }

  return {
    id: "category-pattern",
    overline: "CATEGORY PATTERN · 30+ DAYS",
    headline: `目前长期平均满意度最高的类别是「${strongest.category}」。`,
    detail: `这个结论只在同一类别至少积累 ${MINIMUM_CATEGORY_SAMPLE} 件 30 / 90 天回访后出现。目前基于 ${strongest.values.length} 件记录。`,
    leftLabel: "长期满意",
    leftValue: format(strongest.score),
    rightLabel: "样本",
    rightValue: `${strongest.values.length}`,
    isEmphasis: false,
  };
};

const longTermPurchaseCard = (evaluations: Evaluation[]): InsightCardModel | undefined => {
  if (evaluations.length < MINIMUM_MATURE_SAMPLE) return undefined;

  let highest = evaluations[0];
  let lowest = evaluations[0];

  for (const candidate of evaluations) {
    if (candidate.satisfaction !== highest.satisfaction) {
      if (candidate.satisfaction > highest.satisfaction) highest = candidate;
    } else if (candidate.item.id > highest.item.id) {
      highest = candidate;
    }

    if (candidate.satisfaction !== lowest.satisfaction) {
      if (candidate.satisfaction < lowest.satisfaction) lowest = candidate;
    } else if (candidate.item.id < lowest.item.id) {
      lowest = candidate;
    }
  }

  const headline =
    highest.item.id === lowest.item.id || highest.satisfaction === lowest.satisfaction
      ? "你的长期购买满意度目前很接近。"
      : "回看 30 天以后，最值和最不值已经开始分开了。";

  return {
    id: "long-term-extremes",
    overline: "LONG-TERM MEMORY",
    headline,
    detail: "只使用已经进入 30 / 90 天阶段的最新回访。它会随着后续回访继续变化。",
    leftLabel: truncatedMetricLabel(highest.item.name),
    leftValue: format(highest.satisfaction),
    rightLabel: truncatedMetricLabel(lowest.item.name),
    rightValue: format(lowest.satisfaction),
    isEmphasis: false,
  };
};

export const insightSnapshot = (items: DemoItem[]): InsightSnapshot => {
  const evaluations = items
    .map(evaluationFor)
    .filter((value): value is Evaluation => value !== undefined);
  const mature = evaluations.filter((e) => e.stageDays >= 30);

  const cards: InsightCardModel[] = [];

  if (evaluations.length >= MINIMUM_EARLY_SAMPLE) {
    cards.push(expectationRealityCard(evaluations));
  }

  const discount = discountCard(mature);
  if (discount) cards.push(discount);

  const category = categoryCard(mature);
  if (category) cards.push(category);

  const longTerm = longTermPurchaseCard(mature);
  if (longTerm) cards.push(longTerm);

  return {
    evaluatedCount: evaluations.length,
    matureCount: mature.length,
    averageSatisfaction:
      evaluations.length >= MINIMUM_EARLY_SAMPLE
        ? average(evaluations.map((e) => e.satisfaction))
        : undefined,
    cards,
  };
};

export const remainingUntilFirstInsight = (items: DemoItem[]): number =>
  Math.max(
    0,
    MINIMUM_EARLY_SAMPLE -
      items.map(evaluationFor).filter((value) => value !== undefined).length,
  );

export const cardById = (snapshot: InsightSnapshot, id: string): InsightCardModel | undefined =>
  snapshot.cards.find((card) => card.id === id);

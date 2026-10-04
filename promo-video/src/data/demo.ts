/**
 * Demo data for the film.
 *
 * The film follows one purchase — AirPods Max — from "considering" through
 * 7 / 30 / 90 day check-ins. A handful of further records exist so the real
 * `InsightEngine` rules produce real insights; none of them are invented
 * features or invented numbers. Every figure on screen is computed from this
 * data by `src/data/insightEngine.ts`, which is a line-for-line port of
 * `Worthly/Core/Insights/InsightEngine.swift`.
 *
 * Item ids are fixed so ordering ties resolve deterministically on every render.
 */

export type ItemState = "considering" | "bought" | "passed" | "archived";

export type PurchaseReason =
  | "need"
  | "experience"
  | "reward"
  | "trend"
  | "mood"
  | "discount"
  | "appearance"
  | "other";

export type ExpectedUsage = "daily" | "weekly" | "occasionally" | "unsure";

export type UsageFrequency =
  | "daily"
  | "severalTimesWeek"
  | "weekly"
  | "rarely"
  | "notUsedYet";

export type CheckInStage = 7 | 30 | 90;

export interface DemoCheckIn {
  id: string;
  /** 7 / 30 / 90, or 0 for a 随时回访 free-form reflection. */
  stageDays: number;
  satisfactionScore: number;
  usageFrequency: UsageFrequency;
  note?: string;
  createdAt: string;
}

export interface DemoItem {
  id: string;
  name: string;
  category: string;
  sourceNote?: string;
  createdAt: string;
  state: ItemState;
  reason: PurchaseReason;
  expectedUsage: ExpectedUsage;
  desireScore: number;
  originalPrice?: number;
  paidPrice?: number;
  purchaseDate?: string;
  decisionDate?: string;
  checkIns: DemoCheckIn[];
}

export const REASON_LABELS: Record<PurchaseReason, string> = {
  need: "需要",
  experience: "提升体验",
  reward: "奖励自己",
  trend: "被种草",
  mood: "情绪",
  discount: "折扣",
  appearance: "好看",
  other: "其他",
};

export const STATE_LABELS: Record<ItemState, string> = {
  considering: "考虑中",
  bought: "已购买",
  passed: "没买",
  archived: "已归档",
};

export const EXPECTED_USAGE_LABELS: Record<ExpectedUsage, string> = {
  daily: "每天",
  weekly: "每周",
  occasionally: "偶尔",
  unsure: "不知道",
};

export const USAGE_LABELS: Record<UsageFrequency, string> = {
  daily: "几乎每天",
  severalTimesWeek: "每周几次",
  weekly: "大约每周",
  rarely: "很少",
  notUsedYet: "几乎没用",
};

export const CATEGORIES = [
  "服饰",
  "数码",
  "美妆",
  "娱乐",
  "旅行",
  "家居",
  "学习",
  "其他",
] as const;

/** The one purchase the film follows. */
export const HERO_ITEM_ID = "00000000-0000-4000-8000-000000000001";

export const DEMO_ITEMS: DemoItem[] = [
  {
    id: HERO_ITEM_ID,
    name: "AirPods Max",
    category: "数码",
    sourceNote: "店里试戴过一次，降噪很安静。",
    createdAt: "2026-03-01T20:10:00",
    state: "bought",
    reason: "experience",
    expectedUsage: "daily",
    desireScore: 9,
    originalPrice: 3999,
    paidPrice: 3299,
    purchaseDate: "2026-03-08T11:20:00",
    decisionDate: "2026-03-08T11:20:00",
    checkIns: [
      {
        id: "10000000-0000-4000-8000-000000000101",
        stageDays: 7,
        satisfactionScore: 8,
        usageFrequency: "daily",
        note: "降噪比想象中更有用。",
        createdAt: "2026-03-15T21:05:00",
      },
      {
        id: "10000000-0000-4000-8000-000000000102",
        stageDays: 30,
        satisfactionScore: 7,
        usageFrequency: "severalTimesWeek",
        note: "音质很好，但出门带得比想象中少。",
        createdAt: "2026-04-07T22:40:00",
      },
      {
        id: "10000000-0000-4000-8000-000000000103",
        stageDays: 90,
        satisfactionScore: 7,
        usageFrequency: "severalTimesWeek",
        note: "喜欢它，但没有买前想象得那么离不开。",
        createdAt: "2026-06-06T20:15:00",
      },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "跑鞋",
    category: "服饰",
    createdAt: "2026-01-12T09:30:00",
    state: "bought",
    reason: "need",
    expectedUsage: "weekly",
    desireScore: 9,
    originalPrice: 899,
    paidPrice: 899,
    purchaseDate: "2026-01-19T18:00:00",
    decisionDate: "2026-01-19T18:00:00",
    checkIns: [
      {
        id: "10000000-0000-4000-8000-000000000201",
        stageDays: 7,
        satisfactionScore: 9,
        usageFrequency: "severalTimesWeek",
        createdAt: "2026-01-26T08:10:00",
      },
      {
        id: "10000000-0000-4000-8000-000000000202",
        stageDays: 30,
        satisfactionScore: 9,
        usageFrequency: "severalTimesWeek",
        createdAt: "2026-02-18T08:20:00",
      },
      {
        id: "10000000-0000-4000-8000-000000000203",
        stageDays: 90,
        satisfactionScore: 9,
        usageFrequency: "severalTimesWeek",
        note: "每周都跑，鞋底磨得很快。",
        createdAt: "2026-04-19T08:05:00",
      },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "咖啡机",
    category: "家居",
    createdAt: "2026-02-02T19:45:00",
    state: "bought",
    reason: "experience",
    expectedUsage: "daily",
    desireScore: 9,
    originalPrice: 1299,
    paidPrice: 999,
    purchaseDate: "2026-02-09T15:30:00",
    decisionDate: "2026-02-09T15:30:00",
    checkIns: [
      {
        id: "10000000-0000-4000-8000-000000000301",
        stageDays: 7,
        satisfactionScore: 7,
        usageFrequency: "daily",
        createdAt: "2026-02-16T07:40:00",
      },
      {
        id: "10000000-0000-4000-8000-000000000302",
        stageDays: 30,
        satisfactionScore: 7,
        usageFrequency: "daily",
        createdAt: "2026-03-11T07:50:00",
      },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "旅行箱",
    category: "旅行",
    createdAt: "2025-11-08T14:00:00",
    state: "bought",
    reason: "need",
    expectedUsage: "occasionally",
    desireScore: 9,
    originalPrice: 1599,
    paidPrice: 1599,
    purchaseDate: "2025-11-15T13:10:00",
    decisionDate: "2025-11-15T13:10:00",
    checkIns: [
      {
        id: "10000000-0000-4000-8000-000000000401",
        stageDays: 7,
        satisfactionScore: 6,
        usageFrequency: "rarely",
        createdAt: "2025-11-22T20:00:00",
      },
      {
        id: "10000000-0000-4000-8000-000000000402",
        stageDays: 30,
        satisfactionScore: 6,
        usageFrequency: "rarely",
        note: "一年大概只用得上两次。",
        createdAt: "2025-12-15T20:30:00",
      },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    name: "台灯",
    category: "家居",
    createdAt: "2026-01-30T21:15:00",
    state: "bought",
    reason: "appearance",
    expectedUsage: "daily",
    desireScore: 9,
    originalPrice: 399,
    paidPrice: 399,
    purchaseDate: "2026-02-06T16:45:00",
    decisionDate: "2026-02-06T16:45:00",
    checkIns: [
      {
        id: "10000000-0000-4000-8000-000000000501",
        stageDays: 7,
        satisfactionScore: 8,
        usageFrequency: "daily",
        createdAt: "2026-02-13T22:10:00",
      },
      {
        id: "10000000-0000-4000-8000-000000000502",
        stageDays: 30,
        satisfactionScore: 7,
        usageFrequency: "daily",
        createdAt: "2026-03-08T22:20:00",
      },
      {
        id: "10000000-0000-4000-8000-000000000503",
        stageDays: 90,
        satisfactionScore: 7,
        usageFrequency: "daily",
        createdAt: "2026-05-07T22:30:00",
      },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000006",
    name: "线上课程",
    category: "学习",
    createdAt: "2025-12-20T10:00:00",
    state: "bought",
    reason: "reward",
    expectedUsage: "weekly",
    desireScore: 9,
    originalPrice: 699,
    paidPrice: 699,
    purchaseDate: "2025-12-27T10:20:00",
    decisionDate: "2025-12-27T10:20:00",
    checkIns: [
      {
        id: "10000000-0000-4000-8000-000000000601",
        stageDays: 7,
        satisfactionScore: 6,
        usageFrequency: "rarely",
        createdAt: "2026-01-03T21:00:00",
      },
      {
        id: "10000000-0000-4000-8000-000000000602",
        stageDays: 30,
        satisfactionScore: 5,
        usageFrequency: "notUsedYet",
        note: "买的时候很激动，只看了三节。",
        createdAt: "2026-01-26T21:30:00",
      },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000007",
    name: "香水",
    category: "美妆",
    createdAt: "2026-02-14T17:30:00",
    state: "bought",
    reason: "trend",
    expectedUsage: "weekly",
    desireScore: 9,
    originalPrice: 880,
    paidPrice: 616,
    purchaseDate: "2026-02-21T14:00:00",
    decisionDate: "2026-02-21T14:00:00",
    checkIns: [
      {
        id: "10000000-0000-4000-8000-000000000701",
        stageDays: 7,
        satisfactionScore: 8,
        usageFrequency: "weekly",
        createdAt: "2026-02-28T19:20:00",
      },
      {
        id: "10000000-0000-4000-8000-000000000702",
        stageDays: 30,
        satisfactionScore: 7,
        usageFrequency: "weekly",
        createdAt: "2026-03-23T19:40:00",
      },
      {
        id: "10000000-0000-4000-8000-000000000703",
        stageDays: 90,
        satisfactionScore: 7,
        usageFrequency: "weekly",
        createdAt: "2026-05-22T19:50:00",
      },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000008",
    name: "游戏机",
    category: "娱乐",
    createdAt: "2025-10-25T20:00:00",
    state: "bought",
    reason: "mood",
    expectedUsage: "weekly",
    desireScore: 9,
    originalPrice: 2599,
    paidPrice: 2599,
    purchaseDate: "2025-11-01T12:00:00",
    decisionDate: "2025-11-01T12:00:00",
    checkIns: [
      {
        id: "10000000-0000-4000-8000-000000000801",
        stageDays: 7,
        satisfactionScore: 8,
        usageFrequency: "daily",
        createdAt: "2025-11-08T23:10:00",
      },
      {
        id: "10000000-0000-4000-8000-000000000802",
        stageDays: 30,
        satisfactionScore: 7,
        usageFrequency: "severalTimesWeek",
        createdAt: "2025-12-01T23:20:00",
      },
      {
        id: "10000000-0000-4000-8000-000000000803",
        stageDays: 90,
        satisfactionScore: 7,
        usageFrequency: "weekly",
        createdAt: "2026-01-30T23:30:00",
      },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000009",
    name: "咖啡豆订阅",
    category: "家居",
    createdAt: "2026-02-25T08:00:00",
    state: "bought",
    reason: "need",
    expectedUsage: "daily",
    desireScore: 8,
    originalPrice: 300,
    paidPrice: 300,
    purchaseDate: "2026-03-04T08:10:00",
    decisionDate: "2026-03-04T08:10:00",
    checkIns: [
      {
        id: "10000000-0000-4000-8000-000000000901",
        stageDays: 7,
        satisfactionScore: 7,
        usageFrequency: "daily",
        createdAt: "2026-03-11T08:20:00",
      },
      {
        id: "10000000-0000-4000-8000-000000000902",
        stageDays: 30,
        satisfactionScore: 7,
        usageFrequency: "daily",
        createdAt: "2026-04-03T08:30:00",
      },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000010",
    name: "双肩包",
    category: "服饰",
    createdAt: "2026-01-05T12:00:00",
    state: "bought",
    reason: "need",
    expectedUsage: "daily",
    desireScore: 8,
    originalPrice: 599,
    paidPrice: 449,
    purchaseDate: "2026-01-12T12:30:00",
    decisionDate: "2026-01-12T12:30:00",
    checkIns: [
      {
        id: "10000000-0000-4000-8000-000000000a01",
        stageDays: 7,
        satisfactionScore: 8,
        usageFrequency: "daily",
        createdAt: "2026-01-19T19:00:00",
      },
      {
        id: "10000000-0000-4000-8000-000000000a02",
        stageDays: 30,
        satisfactionScore: 7,
        usageFrequency: "daily",
        createdAt: "2026-02-11T19:10:00",
      },
      {
        id: "10000000-0000-4000-8000-000000000a03",
        stageDays: 90,
        satisfactionScore: 7,
        usageFrequency: "daily",
        createdAt: "2026-04-12T19:20:00",
      },
    ],
  },
];

export const HERO_ITEM = DEMO_ITEMS.find((item) => item.id === HERO_ITEM_ID)!;

/** Four bought records awaiting their first review; no satisfaction sample yet. */
export const PENDING_DEMO_ITEMS: DemoItem[] = [
  ["帆布包", "服饰", 149], ["保温杯", "家居", 129],
  ["健身课程", "学习", 399], ["床头灯", "家居", 299],
].map(([name, category, price], index) => ({
  id: `pending-demo-${index}`, name: String(name), category: String(category),
  state: "bought", createdAt: `2026-06-01T10:0${index}:00`, reason: "need",
  expectedUsage: "daily", desireScore: 7, originalPrice: Number(price), paidPrice: Number(price),
  purchaseDate: "2026-06-01T12:00:00", decisionDate: "2026-06-01T12:00:00", checkIns: [],
}));

/** The item names that surface in the "zoom out" scene, newest first. */
export const LIBRARY_ORDER: string[] = [
  "AirPods Max",
  "跑鞋",
  "咖啡机",
  "香水",
  "双肩包",
  "台灯",
  "游戏机",
  "旅行箱",
  "咖啡豆订阅",
  "线上课程",
];

export const itemByName = (name: string): DemoItem => {
  const found = DEMO_ITEMS.find((item) => item.name === name);
  if (!found) throw new Error(`Unknown demo item: ${name}`);
  return found;
};

// ---------------------------------------------------------------------------
// Formatting helpers, mirroring PriceFormatter.swift
// ---------------------------------------------------------------------------

export const formatCurrency = (value: number): string => {
  const rounded = Math.round(value * 100) / 100;
  const hasFraction = Math.abs(rounded - Math.round(rounded)) > 0.0001;
  const formatted = hasFraction
    ? rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(rounded).toLocaleString("en-US");
  return `¥${formatted}`;
};

export const formatPercent = (value: number): string =>
  `${Math.round(value * 100)}%`;

/** `Date.formatted(date: .abbreviated, time: .omitted)` under zh_CN. */
export const formatDate = (iso: string): string => {
  const date = new Date(iso);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

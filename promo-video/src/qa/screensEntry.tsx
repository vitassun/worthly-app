/**
 * QA harness entry.
 *
 * Mounts every reconstructed device screen at its true logical size (393×852pt)
 * in a plain page so the layout can be measured outside Remotion — the device
 * screens are pure React and have no Remotion dependency, so this is the same
 * tree the film renders.
 *
 * Bundled and driven by `scripts/measure-screens.mjs`.
 */
import React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import {
  ADD_FORM_MAX_SCROLL,
  ADD_FORM_MAX_SCROLL_BOUGHT,
  AddItemUI,
  type AddFormState,
} from "../ui/AddItemUI";
import { ItemDetailUI } from "../ui/ItemDetailUI";
import { CheckInUI } from "../ui/CheckInUI";
import { HomeUI } from "../ui/HomeUI";
import { InsightsUI } from "../ui/InsightsUI";
import { ThingsUI } from "../ui/ThingsUI";
import { PurchaseDecisionUI } from "../ui/PurchaseDecisionUI";
import { SettingsUI } from "../ui/SettingsUI";
import { ReviewQueueUI } from "../ui/ReviewQueueUI";
import { DEMO_ITEMS, HERO_ITEM, LIBRARY_ORDER, itemByName, type DemoItem } from "../data/demo";
import { insightSnapshot } from "../data/insightEngine";

const baseForm: AddFormState = {
  name: "",
  caret: false,
  category: "其他",
  categoryPulse: 0,
  reason: "trend",
  reasonPulse: {},
  desire: 7,
  usageIndex: 0,
  sourceNote: "",
  originalPrice: "",
  alreadyBought: false,
  paidPrice: "",
  purchaseDate: "2026年3月8日",
  savePressed: 0,
};

const filledForm: AddFormState = {
  ...baseForm,
  name: "AirPods Max",
  category: "数码",
  reason: "experience",
  desire: 9,
  originalPrice: "3999",
};

const boughtForm: AddFormState = {
  ...filledForm,
  alreadyBought: true,
  paidPrice: "3299",
};

const consideringHero: DemoItem = { ...HERO_ITEM, state: "considering", checkIns: [] };
const library = LIBRARY_ORDER.map(itemByName);
const boughtItems = DEMO_ITEMS.filter((item) => item.state === "bought");
const snapshot = insightSnapshot(DEMO_ITEMS);
const primaryHeadline = snapshot.cards[0]?.headline ?? "";

export const SCREENS: Record<string, () => React.ReactElement> = {
  settings: () => <SettingsUI />,
  "review-queue": () => <ReviewQueueUI />,
  "edit-review": () => <CheckInUI item={HERO_ITEM} stage={30} editing score={7} usageIndex={1} note="音质很好，但出门带得比想象中少。" scrollY={130} />,
  "add-empty": () => (
    <AddItemUI state={baseForm} scrollY={0} navHairline={false} canSave={false} />
  ),
  "add-filled-top": () => (
    <AddItemUI state={filledForm} scrollY={0} navHairline={false} canSave />
  ),
  "add-filled-bottom": () => (
    <AddItemUI
      state={filledForm}
      scrollY={ADD_FORM_MAX_SCROLL}
      navHairline
      canSave
    />
  ),
  "add-bought-bottom": () => (
    <AddItemUI
      state={boughtForm}
      scrollY={ADD_FORM_MAX_SCROLL_BOUGHT}
      navHairline
      canSave
    />
  ),
  "detail-considering": () => (
    <ItemDetailUI item={consideringHero} checkIns={[]} scrollY={0} />
  ),
  "detail-bought-top": () => (
    <ItemDetailUI
      item={HERO_ITEM}
      checkIns={HERO_ITEM.checkIns}
      allStagesComplete
      scrollY={0}
      tabBar="things"
    />
  ),
  "detail-bought-bottom": () => (
    <ItemDetailUI
      item={HERO_ITEM}
      checkIns={HERO_ITEM.checkIns}
      allStagesComplete
      scrollY={480}
      tabBar="things"
    />
  ),
  "detail-considering-decide": () => (
    <ItemDetailUI item={consideringHero} checkIns={[]} scrollY={600} />
  ),
  "checkin-7": () => (
    <CheckInUI
      item={HERO_ITEM}
      stage={7}
      score={8}
      usageIndex={0}
      note="降噪比想象中更有用。"
    />
  ),
  "checkin-anytime": () => (
    <CheckInUI
      item={HERO_ITEM}
      stage={null}
      score={8}
      usageIndex={0}
      note="今天戴着它通勤，还是很安静。"
    />
  ),
  home: () => (
    <HomeUI
      dateLabel="3月1日星期日"
      considering={[]}
      bought={boughtItems.slice(0, 3)}
      decisionRevisits={[consideringHero]}
      dueReviews={[]}
      primaryInsightHeadline={primaryHeadline}
      scrollY={0}
    />
  ),
  "home-scrolled": () => (
    <HomeUI
      dateLabel="3月1日星期日"
      considering={[]}
      bought={boughtItems.slice(0, 3)}
      decisionRevisits={[consideringHero]}
      dueReviews={[]}
      primaryInsightHeadline={primaryHeadline}
      scrollY={30}
    />
  ),
  insights: () => <InsightsUI snapshot={snapshot} scrollY={0} />,
  "insights-bottom": () => <InsightsUI snapshot={snapshot} scrollY={2000} />,
  things: () => (
    <ThingsUI items={library} scrollY={0} resultCount={DEMO_ITEMS.length} />
  ),
  purchase: () => (
    <PurchaseDecisionUI item={HERO_ITEM} paidPrice="3299" purchaseDate="2026年3月8日" />
  ),
};

export const screenIds = Object.keys(SCREENS);

const FONT_FILES: Array<{ family: string; weight: string; file: string }> = [
  { family: "Noto Serif SC", weight: "400", file: "NotoSerifSC-Regular.ttf" },
  { family: "Noto Serif SC", weight: "700", file: "NotoSerifSC-Bold.ttf" },
  { family: "Noto Sans SC", weight: "400", file: "NotoSansSC-Regular.ttf" },
  { family: "Noto Sans SC", weight: "500", file: "NotoSansSC-Medium.ttf" },
  { family: "Noto Sans SC", weight: "700", file: "NotoSansSC-Bold.ttf" },
  { family: "JetBrains Mono", weight: "400", file: "JetBrainsMono-Regular.ttf" },
  { family: "JetBrains Mono", weight: "500", file: "JetBrainsMono-Medium.ttf" },
  { family: "JetBrains Mono", weight: "700", file: "JetBrainsMono-Bold.ttf" },
];

export const ready = (async () => {
  const base = (window as unknown as { WorthlyQAFontBase?: string }).WorthlyQAFontBase ?? "/fonts/";
  await Promise.all(
    FONT_FILES.map(async ({ family, weight, file }) => {
      const face = new FontFace(family, `url("${base}${file}")`, { weight, style: "normal" });
      document.fonts.add(await face.load());
    }),
  );
  return true;
})();

export const mount = (id: string, element: HTMLElement): void => {
  const factory = SCREENS[id];
  if (!factory) throw new Error(`Unknown screen: ${id}`);
  const root = createRoot(element);
  // Synchronous so the layout can be measured on the very next statement.
  flushSync(() => root.render(<>{factory()}</>));
};

declare global {
  interface Window {
    WorthlyQA: { mount: typeof mount; ready: typeof ready; screenIds: string[] };
  }
}

window.WorthlyQA = { mount, ready, screenIds };

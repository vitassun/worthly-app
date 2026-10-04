import React from "react";
import { useCurrentFrame } from "remotion";
import { frame as frameLayout } from "../design/tokens";
import { easeInOut, progress, stagger } from "../design/motion";
import { BodyCopy, MaskLine, SceneFade, SerifDisplay, Slug } from "../components/Stage";
import { PhoneFrame } from "../components/WorthlyCard";
import { ThingsUI } from "../ui/ThingsUI";
import { DEMO_ITEMS, HERO_ITEM, PENDING_DEMO_ITEMS, type DemoItem } from "../data/demo";
import { sceneById } from "../timeline";

export const ZOOMOUT_DURATION = sceneById("zoomout").durationInFrames;

/**
 * The camera pulls back from one remembered purchase to the whole library. The
 * phone's right edge and vertical centre stay fixed, so the move reads as the
 * film stepping back rather than the device flying around.
 */
const phoneBox = (scale: number) => ({
  left: 1770 - 415 * scale,
  top: 540 - (874 * scale) / 2,
});

const library: DemoItem[] = [
  { ...HERO_ITEM, id: "library-considering", name: "电子阅读器", state: "considering", createdAt: "2026-06-10T12:00:00", originalPrice: 1299, paidPrice: undefined, purchaseDate: undefined, decisionDate: undefined, checkIns: [] },
  { ...HERO_ITEM, id: "library-passed", name: "投影仪", state: "passed", createdAt: "2026-06-09T12:00:00", originalPrice: 2499, paidPrice: undefined, purchaseDate: undefined, decisionDate: "2026-06-10T12:00:00", checkIns: [] },
  ...PENDING_DEMO_ITEMS,
  ...DEMO_ITEMS.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
];

export const ZoomOutScene: React.FC = () => {
  const frame = useCurrentFrame();

  const phoneIn = progress(frame, 0, 10);
  const pull = progress(frame, 3, 40, easeInOut);
  const filtered = frame >= 83;
  const visible = filtered ? library.filter(item => item.state === "passed") : library;
  const line1 = progress(frame, 15, 16);
  const line2 = progress(frame, 21, 16);
  const body = progress(frame, 28, 15);

  // The library arrives row by row, two frames apart — close enough that it
  // reads as one movement rather than as a list animating in.
  const rows = library.map((_, index) => progress(frame, 9 + stagger(index, 2), 13));

  // Starts at the same over-scale the other device shots use, then pulls back to
  // a size where the whole phone fits: the film steps back to see the library.
  const scale = 1.16 - 0.04 * pull;
  const box = phoneBox(scale);

  return (
    <SceneFade frame={frame} duration={ZOOMOUT_DURATION}>
      <Slug label="07 · LIBRARY" opacity={phoneIn} />

      <div
        style={{
          position: "absolute",
          left: frameLayout.margin,
          top: 0,
          height: 1080,
          width: 940,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <MaskLine p={line1} style={{ height: 110 }}>
          <SerifDisplay size={84} lineHeight={1.26}>
            想过的，买过的，
          </SerifDisplay>
        </MaskLine>
        <MaskLine p={line2} style={{ height: 110 }}>
          <SerifDisplay size={84} lineHeight={1.26}>
            没买的，都记得。
          </SerifDisplay>
        </MaskLine>
        <div style={{ height: 34 }} />
        <MaskLine p={body} style={{ height: 100 }}>
          <BodyCopy size={30} lineHeight={1.55}>
            {"按名称搜索，按状态和类别筛选。\n一段消费记忆，随时找回来。"}
          </BodyCopy>
        </MaskLine>
      </div>

      <PhoneFrame scale={scale} style={{ ...box, opacity: phoneIn }}>
        <ThingsUI
          items={visible}
          scrollY={0}
          resultCount={visible.length}
          selectedState={filtered ? "没买" : "全部"}
          focusIndex={0}
          focusAmount={1 - pull}
          rowProgress={filtered ? undefined : rows}
        />
      </PhoneFrame>
    </SceneFade>
  );
};

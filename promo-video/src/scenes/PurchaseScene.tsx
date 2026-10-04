import React from "react";
import { useCurrentFrame } from "remotion";
import { frame as frameLayout } from "../design/tokens";
import { progress } from "../design/motion";
import { BodyCopy, MaskLine, SceneFade, SerifDisplay, Slug } from "../components/Stage";
import { PhoneFrame } from "../components/WorthlyCard";
import { PurchaseDecisionUI } from "../ui/PurchaseDecisionUI";
import { HERO_ITEM } from "../data/demo";
import { sceneById } from "../timeline";

export const PURCHASE_DURATION = sceneById("purchase").durationInFrames;

const phoneBox = (scale: number) => ({
  left: 1521 - ((415 * scale) / 2),
  top: 540 - ((874 * scale) / 2),
});

/** The remembered price is replaced by the real one — and only then does a discount exist. */
export const PurchaseScene: React.FC = () => {
  const frame = useCurrentFrame();

  const slug = progress(frame, 2, 12);
  const line1 = progress(frame, 5, 15);
  const line2 = progress(frame, 11, 15);
  const body = progress(frame, 19, 16);

  const phoneIn = progress(frame, 1, 10);
  const priceP = progress(frame, 10, 16);
  const confirmPress = Math.min(progress(frame, 38, 3), 1 - progress(frame, 42, 7));

  const scale = 1.145 + 0.015 * phoneIn;
  const box = phoneBox(scale);

  return (
    <SceneFade frame={frame} duration={PURCHASE_DURATION}>
      <Slug label="04 · PURCHASE" opacity={slug} />

      <div
        style={{
          position: "absolute",
          left: frameLayout.margin,
          top: 0,
          height: 1080,
          width: 1000,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <MaskLine p={line1} style={{ height: 110 }}>
          <SerifDisplay size={84} lineHeight={1.26}>
            原价与到手价，
          </SerifDisplay>
        </MaskLine>
        <MaskLine p={line2} style={{ height: 110 }}>
          <SerifDisplay size={84} lineHeight={1.26}>
            都留在时间线里。
          </SerifDisplay>
        </MaskLine>
        <div style={{ height: 34 }} />
        <MaskLine p={body} style={{ height: 100 }}>
          <BodyCopy size={30} lineHeight={1.55}>
            {"记录实际购买日期与成交价。\n差价和折扣，由你的记录计算。"}
          </BodyCopy>
        </MaskLine>
      </div>

      <PhoneFrame scale={scale} style={{ ...box, opacity: phoneIn }}>
        <PurchaseDecisionUI
          item={HERO_ITEM}
          paidPrice={"3299".slice(0, Math.round(priceP * 4))}
          purchaseDate="2026年3月8日"
          caret={frame >= 9 && frame < 29}
          confirmPressed={confirmPress}
        />
      </PhoneFrame>
    </SceneFade>
  );
};

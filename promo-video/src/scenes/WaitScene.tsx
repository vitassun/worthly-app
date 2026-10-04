import React from "react";
import { useCurrentFrame } from "remotion";
import { frame as frameLayout, palette } from "../design/tokens";
import { progress, settleNumber } from "../design/motion";
import { BodyCopy, MaskLine, Mono, SceneFade, SerifDisplay, Slug } from "../components/Stage";
import { ScaledUI } from "../components/WorthlyCard";
import { DecisionReviewCard } from "../ui/HomeUI";
import { HERO_ITEM, type DemoItem } from "../data/demo";
import { sceneById } from "../timeline";

export const WAIT_DURATION = sceneById("wait").durationInFrames;

const considering: DemoItem = { ...HERO_ITEM, state: "considering", paidPrice: undefined, purchaseDate: undefined, decisionDate: undefined, checkIns: [] };

/**
 * Worthly does not nag. It simply puts the want back in front of you a week
 * later and asks the same question again.
 */
export const WaitScene: React.FC = () => {
  const frame = useCurrentFrame();

  const slug = progress(frame, 2, 12);
  const overline = progress(frame, 5, 14);
  const headline = progress(frame, 8, 19);
  const body = progress(frame, 20, 15);
  const card = progress(frame, 30, 17);

  // The wait itself, counted out. It settles on seven and stops — the point is
  // that the number is a duration, not a score.
  const dayP = progress(frame, 36, 18);
  const dayCount = settleNumber(dayP, 7, 0.6);

  return (
    <SceneFade frame={frame} duration={WAIT_DURATION}>
      <Slug label="02 · WAIT" opacity={slug} />

      <div style={{ position: "absolute", left: frameLayout.margin, top: 250, width: 1100 }}>
        <div style={{ opacity: overline }}>
          <Mono size={20} color={palette.orange} tracking="0.22em">
            DECISION · 7 DAYS
          </Mono>
        </div>
        <div style={{ height: 22 }} />
        <MaskLine p={headline} style={{ height: 148 }}>
          <SerifDisplay size={116} lineHeight={1.22}>
            还想买吗？
          </SerifDisplay>
        </MaskLine>
        <div style={{ height: 28 }} />
        <MaskLine p={body} style={{ height: 52 }}>
          <BodyCopy size={30} lineHeight={1.55}>
            记下 7 天后，首页会邀请你再看看。
          </BodyCopy>
        </MaskLine>
      </div>

      <div
        style={{
          position: "absolute",
          left: frameLayout.margin,
          top: 560 + (1 - card) * 26,
          opacity: card,
        }}
      >
        <ScaledUI scale={2.2}>
          <DecisionReviewCard item={considering} dayCount={dayCount} />
        </ScaledUI>
      </div>
    </SceneFade>
  );
};

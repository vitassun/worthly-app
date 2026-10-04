import React from "react";
import { useCurrentFrame } from "remotion";
import { frame as frameLayout, palette } from "../design/tokens";
import { fontFamily } from "../design/typography";
import { heroArrival, progress } from "../design/motion";
import { BodyCopy, MaskLine, Mono, SceneFade, SerifDisplay, Slug } from "../components/Stage";
import { ScaledUI } from "../components/WorthlyCard";
import { InsightCardBlock } from "../ui/InsightsUI";
import { DEMO_ITEMS } from "../data/demo";
import { cardById, insightSnapshot } from "../data/insightEngine";
import { sceneById } from "../timeline";

export const INSIGHT_DURATION = sceneById("insight").durationInFrames;

/**
 * The numbers on this card are not written for the film — they are computed at
 * render time by the TypeScript port of the app's own `InsightEngine`, from the
 * same demo library the rest of the film uses.
 */
const snapshot = insightSnapshot(DEMO_ITEMS);
const primary = cardById(snapshot, "expectation-reality");

/**
 * The animation highlight of the film.
 *
 * The emphasis card is the only element in the whole cut that arrives with real
 * weight: it rises 11 px out of a 0.8 % oversize on an ease that is already
 * almost flat by the time it lands. Nothing bounces. Its numbers follow a beat
 * later, and the supporting card later still — so the section reads as one
 * statement with evidence underneath rather than as two cards appearing.
 *
 * The card sizes carry the same hierarchy: the emphasis card is the only dark
 * surface in the film and sits at 2×, the snapshot is a quiet 1.6×.
 */
export const InsightScene: React.FC = () => {
  const frame = useCurrentFrame();

  const slug = progress(frame, 2, 13);
  const overline = progress(frame, 3, 11);
  const line1 = progress(frame, 5, 17);
  const line2 = progress(frame, 12, 17);

  const card = heroArrival(frame, 11, 20);
  const metrics = progress(frame, 33, 15);
  const supporting = progress(frame, 44, 17);

  return (
    <SceneFade frame={frame} duration={INSIGHT_DURATION}>
      <Slug label="08 · INSIGHTS" opacity={slug} />

      <div style={{ position: "absolute", left: frameLayout.margin, top: 200, width: 700 }}>
        <div style={{ opacity: overline }}>
          <Mono size={20} color={palette.orange} tracking="0.22em">
            YOUR WORTH MEMORY
          </Mono>
        </div>
        <div style={{ height: 22 }} />
        <MaskLine p={line1} style={{ height: 100 }}>
          <SerifDisplay size={72} lineHeight={1.32}>
            你真正觉得
          </SerifDisplay>
        </MaskLine>
        <MaskLine p={line2} style={{ height: 100 }}>
          <SerifDisplay size={72} lineHeight={1.32}>
            值得的是什么？
          </SerifDisplay>
        </MaskLine>
      </div>

      {primary ? (
        <div style={{ position: "absolute", left: 900, top: 293, ...card }}>
          <ScaledUI scale={2}>
            <InsightCardBlock card={primary} metricsOpacity={metrics} />
          </ScaledUI>
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          left: frameLayout.margin,
          top: 520 + (1 - supporting) * 12,
          opacity: supporting,
        }}
      >
        <ScaledUI scale={1.6}>
          <div
            style={{
              width: 393,
              padding: 20,
              background: palette.surface,
              borderRadius: 18,
            }}
          >
            <Mono size={11} color={palette.muted} tracking="0.02em">
              CURRENT SNAPSHOT
            </Mono>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 14 }}>
              <span
                style={{
                  fontFamily: fontFamily.serif,
                  fontSize: 34,
                  fontWeight: 700,
                  color: palette.ink,
                  lineHeight: 1.2,
                }}
              >
                {snapshot.averageSatisfaction?.toFixed(1)}
              </span>
              <span
                style={{
                  fontFamily: fontFamily.mono,
                  fontSize: 20,
                  fontWeight: 600,
                  color: palette.muted,
                }}
              >
                / 10
              </span>
            </div>
            <BodyCopy size={15} color={palette.muted} lineHeight={1.42} style={{ marginTop: 14 }}>
              {`来自 ${snapshot.evaluatedCount} 件已经完成至少一次回访的购买。它不是消费成绩，只是你目前留下来的真实满意度快照。`}
            </BodyCopy>
          </div>
        </ScaledUI>
      </div>
    </SceneFade>
  );
};

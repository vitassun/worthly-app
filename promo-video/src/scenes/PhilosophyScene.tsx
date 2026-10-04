import React from "react";
import { useCurrentFrame } from "remotion";
import { frame as frameLayout, palette, veil } from "../design/tokens";
import { progress } from "../design/motion";
import { BodyCopy, MaskLine, Mono, SceneFade, SerifDisplay } from "../components/Stage";
import { sceneById } from "../timeline";

export const PHILOSOPHY_DURATION = sceneById("philosophy").durationInFrames;

/**
 * The restraint beat. Worthly's honesty is the feature: the thresholds are real,
 * and the copy here is the app's own DATA CONFIDENCE wording.
 */
export const PhilosophyScene: React.FC = () => {
  const frame = useCurrentFrame();

  const overline = progress(frame, 3, 15);
  const headline = progress(frame, 7, 27);
  const body = progress(frame, 22, 17);
  const rule = progress(frame, 40, 12);

  return (
    <SceneFade frame={frame} duration={PHILOSOPHY_DURATION}>
      <div style={{ position: "absolute", left: frameLayout.margin, top: 320, width: 1620 }}>
        <div style={{ opacity: overline }}>
          <Mono size={20} color={palette.orange} tracking="0.22em">
            DATA CONFIDENCE
          </Mono>
        </div>
        <div style={{ height: 22 }} />
        <MaskLine p={headline} style={{ height: 148 }}>
          <SerifDisplay size={116} lineHeight={1.22}>
            让结论慢一点出现。
          </SerifDisplay>
        </MaskLine>
        <div style={{ height: 34 }} />
        <MaskLine p={body} style={{ height: 110 }}>
          <BodyCopy size={32} lineHeight={1.62}>
            {"完成 3 件购买的阶段回访后，才出现第一份满意度洞察。\n长期规律使用 30 / 90 天样本，并设置各自的样本门槛。"}
          </BodyCopy>
        </MaskLine>
        <div
          style={{
            marginTop: 48,
            height: 1,
            background: veil.hairline,
            width: 1620 * rule,
          }}
        />
      </div>
    </SceneFade>
  );
};

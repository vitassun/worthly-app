import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { frame as frameLayout, palette } from "../design/tokens";
import { progress } from "../design/motion";
import { MaskLine, SceneFade, SerifDisplay } from "../components/Stage";
import { sceneById } from "../timeline";

export const THESIS_DURATION = sceneById("thesis").durationInFrames;

/**
 * The turn. The purchase is not the answer — what comes after it is.
 */
export const ThesisScene: React.FC = () => {
  const frame = useCurrentFrame();
  const line1 = progress(frame, 4, 16);
  const line2 = progress(frame, 13, 18);

  return (
    <SceneFade frame={frame} duration={THESIS_DURATION}>
      <AbsoluteFill style={{ padding: `0 ${frameLayout.margin}px`, justifyContent: "center" }}>
        <MaskLine p={line1} style={{ height: 126 }}>
          <SerifDisplay size={96} color={palette.muted} lineHeight={1.24}>
            买前为什么想要，
          </SerifDisplay>
        </MaskLine>
        <MaskLine p={line2} style={{ height: 126 }}>
          <SerifDisplay size={96} lineHeight={1.24}>
            买后真的喜欢吗？
          </SerifDisplay>
        </MaskLine>
      </AbsoluteFill>
    </SceneFade>
  );
};

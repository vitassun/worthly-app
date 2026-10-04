import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { frame as frameLayout, palette } from "../design/tokens";
import { progress } from "../design/motion";
import { MaskLine, Mono, SceneFade, SerifDisplay } from "../components/Stage";
import { sceneById } from "../timeline";

export const OPENING_DURATION = sceneById("opening").durationInFrames;

/**
 * The hook. One question, asked plainly, on the same paper the whole film uses.
 * The "？" is the only orange in the frame.
 */
export const OpeningScene: React.FC = () => {
  const frame = useCurrentFrame();
  const line1 = progress(frame, 6, 17);
  const line2 = progress(frame, 14, 17);
  const signature = progress(frame, 58, 20);

  return (
    <SceneFade frame={frame} duration={OPENING_DURATION}>
      <AbsoluteFill style={{ padding: `0 ${frameLayout.margin}px`, justifyContent: "center" }}>
        <MaskLine p={line1} style={{ height: 148 }}>
          <SerifDisplay size={116} lineHeight={1.22}>
            很想要，
          </SerifDisplay>
        </MaskLine>
        <MaskLine p={line2} style={{ height: 148 }}>
          <SerifDisplay size={116} lineHeight={1.22}>
            就代表值得<span style={{ color: palette.orange }}>？</span>
          </SerifDisplay>
        </MaskLine>
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          left: frameLayout.margin,
          bottom: 112,
          opacity: signature,
        }}
      >
        <Mono size={20} color={palette.orange} tracking="0.3em">
          WORTHLY · 值不值
        </Mono>
      </div>
    </SceneFade>
  );
};

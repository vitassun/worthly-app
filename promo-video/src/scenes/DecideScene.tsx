import React from "react";
import { useCurrentFrame } from "remotion";
import { frame as frameLayout, palette, veil } from "../design/tokens";
import { fontFamily } from "../design/typography";
import { progress } from "../design/motion";
import { BodyCopy, MaskLine, Mono, SceneFade, SerifDisplay, Slug } from "../components/Stage";
import { sceneById } from "../timeline";

export const DECIDE_DURATION = sceneById("decide").durationInFrames;

const ReleasedButton: React.FC<{
  label: string;
  primary?: boolean;
  pressed?: number;
  style?: React.CSSProperties;
}> = ({ label, primary, pressed = 0, style }) => (
  <div
    style={{
      width: 420,
      height: 110,
      borderRadius: 36,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: primary ? palette.ink : palette.surface,
      color: primary ? palette.cream : palette.ink,
      border: primary ? "none" : `1px solid ${veil.cardBorder}`,
      fontFamily: fontFamily.sans,
      fontSize: 38,
      fontWeight: 600,
      opacity: 1 - pressed * 0.24,
      transform: `scale(${1 - pressed * 0.02})`,
      ...style,
    }}
  >
    {label}
  </div>
);

/** The one decision the whole product is built around: 买了，还是没买？ */
export const DecideScene: React.FC = () => {
  const frame = useCurrentFrame();

  const slug = progress(frame, 2, 12);
  const overline = progress(frame, 5, 14);
  const headline = progress(frame, 8, 19);
  const body = progress(frame, 19, 14);
  const buttons = progress(frame, 23, 16);
  // Two frames apart, so the pair arrives as one gesture rather than as a list.
  const secondButton = progress(frame, 25, 16);
  const buyPress = Math.min(progress(frame, 36, 3), 1 - progress(frame, 40, 7));

  return (
    <SceneFade frame={frame} duration={DECIDE_DURATION}>
      <Slug label="03 · DECIDE" opacity={slug} />

      <div style={{ position: "absolute", left: frameLayout.margin, top: 373, width: 1200 }}>
        <div style={{ opacity: overline }}>
          <Mono size={20} color={palette.orange} tracking="0.22em">
            DECIDE
          </Mono>
        </div>
        <div style={{ height: 22 }} />
        <MaskLine p={headline} style={{ height: 148 }}>
          <SerifDisplay size={116} lineHeight={1.22}>
            后来呢？
          </SerifDisplay>
        </MaskLine>
        <div style={{ height: 28 }} />
        <MaskLine p={body} style={{ height: 52 }}>
          <BodyCopy size={30} lineHeight={1.55}>
            买了，还是没买，都值得记住。
          </BodyCopy>
        </MaskLine>
      </div>

      <div
        style={{
          position: "absolute",
          left: frameLayout.margin,
          top: 693 + (1 - buttons) * 30,
          display: "flex",
          gap: 24,
          opacity: buttons,
        }}
      >
        <ReleasedButton label="买了" primary pressed={buyPress} />
        <ReleasedButton
          label="没买"
          style={{ opacity: secondButton, transform: `translateY(${(1 - secondButton) * 8}px)` }}
        />
      </div>
    </SceneFade>
  );
};

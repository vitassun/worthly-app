import React from "react";
import { useCurrentFrame } from "remotion";
import { frame as frameLayout } from "../design/tokens";
import { progress } from "../design/motion";
import { BodyCopy, MaskLine, SceneFade, SerifDisplay, Slug } from "../components/Stage";
import { PhoneFrame } from "../components/WorthlyCard";
import { CheckInUI } from "../ui/CheckInUI";
import { HERO_ITEM } from "../data/demo";
import { sceneById } from "../timeline";

export const ANYTIME_DURATION = sceneById("anytime").durationInFrames;

const NOTE = "今天戴着它通勤，还是很安静。";

const phoneBox = (scale: number) => ({
  left: 1521 - ((415 * scale) / 2),
  top: 540 - ((874 * scale) / 2),
});

/** The staged reviews are not the only door — any day is a good day to look back. */
export const AnytimeScene: React.FC = () => {
  const frame = useCurrentFrame();

  const slug = progress(frame, 2, 12);
  const line1 = progress(frame, 5, 17);
  const line2 = progress(frame, 11, 17);
  const body = progress(frame, 19, 17);

  const phoneIn = progress(frame, 1, 12);
  const noteP = progress(frame, 15, 18);
  const scrollY = 48 * progress(frame, 27, 11);
  const savePress = Math.min(progress(frame, 42, 3), 1 - progress(frame, 46, 7));

  const scale = 1.145 + 0.015 * phoneIn;
  const box = phoneBox(scale);

  return (
    <SceneFade frame={frame} duration={ANYTIME_DURATION}>
      <Slug label="06 · ANYTIME" opacity={slug} />

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
            今天想说什么，
          </SerifDisplay>
        </MaskLine>
        <MaskLine p={line2} style={{ height: 110 }}>
          <SerifDisplay size={84} lineHeight={1.26}>
            就记什么。
          </SerifDisplay>
        </MaskLine>
        <div style={{ height: 34 }} />
        <MaskLine p={body} style={{ height: 100 }}>
          <BodyCopy size={30} lineHeight={1.55}>
            {"回访不只在第 7、30、90 天。\n想起来的那天，就是最好的一天。"}
          </BodyCopy>
        </MaskLine>
      </div>

      <PhoneFrame scale={scale} style={{ ...box, opacity: phoneIn }}>
        <CheckInUI
          item={HERO_ITEM}
          stage={null}
          score={8}
          usageIndex={0}
          note={NOTE.slice(0, Math.round(noteP * NOTE.length))}
          noteCaret={frame >= 14 && frame < 35}
          savePressed={savePress}
          scrollY={scrollY}
        />
      </PhoneFrame>
    </SceneFade>
  );
};

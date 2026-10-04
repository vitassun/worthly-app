import React from "react";
import { useCurrentFrame } from "remotion";
import { frame as frameLayout } from "../design/tokens";
import { progress } from "../design/motion";
import { BodyCopy, MaskLine, SceneFade, SerifDisplay, Slug } from "../components/Stage";
import { PhoneFrame } from "../components/WorthlyCard";
import { ADD_FORM_MAX_SCROLL, AddItemUI, type AddFormState } from "../ui/AddItemUI";
import { sceneById } from "../timeline";

export const BEFORE_DURATION = sceneById("before").durationInFrames;

/** Phone placement: the device is centred on (1521, 540) in the 1920×1080 frame. */
const phoneBox = (scale: number) => ({
  left: 1521 - ((415 * scale) / 2),
  top: 540 - ((874 * scale) / 2),
});

/** A 0→1 press pulse: rise, hold, release. */
const press = (frame: number, start: number, up = 3, hold = 3, down = 6) =>
  Math.min(progress(frame, start, up), 1 - progress(frame, start + up + hold, down));

/** A one-shot flash used for chip / row selection feedback. */
const flash = (frame: number, start: number) =>
  progress(frame, start, 4) * (1 - progress(frame, start + 5, 8));

export const BeforeScene: React.FC = () => {
  const frame = useCurrentFrame();

  const slug = progress(frame, 3, 13);
  const line1 = progress(frame, 6, 17);
  const line2 = progress(frame, 14, 17);
  const body = progress(frame, 23, 17);

  const phoneIn = progress(frame, 1, 14);

  const nameP = progress(frame, 11, 20);
  const desireP = progress(frame, 59, 17);
  const scrollP = progress(frame, 76, 23);
  const priceP = progress(frame, 100, 11);

  const scale = 1.145 + 0.015 * phoneIn;
  const box = phoneBox(scale);

  const form: AddFormState = {
    name: "AirPods Max".slice(0, Math.round(nameP * 11)),
    caret: frame >= 10 && frame < 37,
    category: frame >= 34 ? "数码" : "其他",
    categoryPulse: flash(frame, 34),
    reason: frame >= 48 ? "experience" : "trend",
    reasonPulse: { experience: flash(frame, 48) },
    desire: Math.round(7 + 2 * desireP),
    usageIndex: 0,
    sourceNote: "",
    originalPrice: "3999".slice(0, Math.round(priceP * 4)),
    alreadyBought: false,
    paidPrice: "",
    purchaseDate: "2026年3月8日",
    savePressed: press(frame, 108),
  };

  return (
    <SceneFade frame={frame} duration={BEFORE_DURATION}>
      <Slug label="01 · CAPTURE" opacity={slug} />

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
            把想要的东西，
          </SerifDisplay>
        </MaskLine>
        <MaskLine p={line2} style={{ height: 110 }}>
          <SerifDisplay size={84} lineHeight={1.26}>
            先记下来。
          </SerifDisplay>
        </MaskLine>
        <div style={{ height: 34 }} />
        <MaskLine p={body} style={{ height: 100 }}>
          <BodyCopy size={30} lineHeight={1.55}>
            {"想买的理由、想要程度、预计使用频率。\n也可以留下来源与备注。"}
          </BodyCopy>
        </MaskLine>
      </div>

      <PhoneFrame scale={scale} style={{ ...box, opacity: phoneIn }}>
        <AddItemUI
          state={form}
          scrollY={scrollP * ADD_FORM_MAX_SCROLL}
          navHairline={false}
          canSave={form.name.length > 0}
        />
      </PhoneFrame>
    </SceneFade>
  );
};

import React from "react";
import { useCurrentFrame } from "remotion";
import { frame as frameLayout, palette } from "../design/tokens";
import { fontFamily } from "../design/typography";
import { progress } from "../design/motion";
import { MaskLine, SceneFade } from "../components/Stage";
import { sceneById } from "../timeline";

export const END_DURATION = sceneById("end").durationInFrames;

/**
 * The end card: a three-layer lockup, one beat apart.
 *
 *   1. `W.`      the mark — the only orange in the frame is its period
 *   2. `Worthly 值不值`   the name
 *   3. `给想要一点时间，给体验一份记忆。`  the line the whole film has been arguing for
 *
 * There is no download badge, no store call to action and no star rating. The
 * film ends on the product's own thesis rather than on a prompt.
 *
 * The app icon is deliberately absent. It is a placeholder geometric mark — the
 * project's own TestFlight checklist still lists it as "replace or approve as
 * final brand artwork" — and a lockup that leads with type is both stronger and
 * more honest than one that leads with artwork nobody has signed off.
 */
export const EndScene: React.FC = () => {
  const frame = useCurrentFrame();

  const mark = progress(frame, 4, 14);
  const name = progress(frame, 12, 16);
  const cjk = progress(frame, 15, 16);
  const slogan = progress(frame, 22, 18);

  return (
    <SceneFade frame={frame} duration={END_DURATION} outFrames={0}>
      <div style={{ position: "absolute", left: frameLayout.margin, top: 300, width: 1500 }}>
        <MaskLine p={mark} distance={34} style={{ height: 214 }}>
          <div
            style={{
              fontFamily: fontFamily.serif,
              fontSize: 196,
              fontWeight: 700,
              lineHeight: 1.06,
              color: palette.ink,
            }}
          >
            W<span style={{ color: palette.orange }}>.</span>
          </div>
        </MaskLine>

        <div style={{ height: 62 }} />

        <div style={{ display: "flex", alignItems: "baseline", gap: 26 }}>
          <MaskLine p={name} distance={30} style={{ height: 92 }}>
            <div
              style={{
                fontFamily: fontFamily.serif,
                fontSize: 76,
                fontWeight: 700,
                lineHeight: 1.16,
                color: palette.ink,
              }}
            >
              Worthly
            </div>
          </MaskLine>
          <MaskLine p={cjk} distance={30} style={{ height: 92 }}>
            <div
              style={{
                fontFamily: fontFamily.serif,
                fontSize: 42,
                fontWeight: 700,
                lineHeight: 1.16,
                color: palette.muted,
              }}
            >
              值不值
            </div>
          </MaskLine>
        </div>

        <div style={{ height: 46 }} />
        <div style={{ fontFamily: fontFamily.mono, fontSize: 24, color: palette.orange, marginBottom: 20 }}>v0.2.0 · iOS</div>

        <MaskLine p={slogan} distance={26} style={{ height: 68 }}>
          <div
            style={{
              fontFamily: fontFamily.serif,
              fontSize: 44,
              fontWeight: 400,
              lineHeight: 1.3,
              color: palette.muted,
            }}
          >
            给想要一点时间，给体验一份记忆。
          </div>
        </MaskLine>
      </div>
      <div style={{ position: "absolute", left: 1060, top: 930, width: 710,
        fontFamily: fontFamily.sans, fontSize: 18, lineHeight: 1.5,
        color: palette.muted, opacity: progress(frame, 10, 12) }}>
        <div>Piano samples: Salamander Grand Piano v3 · Alexander Holm</div>
        <div>CC BY 3.0 · creativecommons.org/licenses/by/3.0</div>
        <div>github.com/sfzinstruments/SalamanderGrandPiano · adapted</div>
      </div>
    </SceneFade>
  );
};

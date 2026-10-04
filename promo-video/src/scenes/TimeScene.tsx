import React from "react";
import { useCurrentFrame } from "remotion";
import { frame as frameLayout, palette, veil } from "../design/tokens";
import { fontFamily } from "../design/typography";
import { progress, settleIn, settleNumber } from "../design/motion";
import { Mono, SceneFade, Slug } from "../components/Stage";
import { HERO_ITEM } from "../data/demo";
import { sceneById, REVIEW_ROW_FRAMES } from "../timeline";

export const TIME_DURATION = sceneById("time").durationInFrames;

interface StageRow {
  days: number;
  usage: string;
  score: string;
  note: string;
  at: number;
}

/** The three real check-ins stored on the hero item, in order. */
const ROWS: StageRow[] = [
  { days: 7, usage: "几乎每天", score: "8/10", note: "降噪比想象中更有用。", at: REVIEW_ROW_FRAMES[0] },
  { days: 30, usage: "每周几次", score: "7/10", note: "音质很好，但出门带得比想象中少。", at: REVIEW_ROW_FRAMES[1] },
  { days: 90, usage: "每周几次", score: "7/10", note: "喜欢它，但没有买前想象得那么离不开。", at: REVIEW_ROW_FRAMES[2] },
];

/**
 * One check-in.
 *
 * The elapsed days settle rather than appear: the counter starts below its final
 * value and closes the gap, so the number reads as a duration that has actually
 * passed. The score follows a few frames later, on its own settle. Both are the
 * film's signature gesture — a value coming to rest.
 */
const Row: React.FC<{
  row: StageRow;
  frame: number;
  dim: number;
  top: number;
}> = ({ row, frame, dim, top }) => {
  const p = progress(frame, row.at, 23);
  const dayP = progress(frame, row.at + 2, 16);
  const scoreP = progress(frame, row.at + 9, 15);

  const days = settleNumber(dayP, row.days, row.days >= 30 ? 0.22 : 0.6);
  const [scoreHead, scoreTail] = row.score.split("/");
  const score = settleNumber(scoreP, Number(scoreHead), 0.5);
  const scoreSettle = settleIn(scoreP, 6, 0.985);

  return (
    <div
      style={{
        position: "absolute",
        left: frameLayout.margin,
        top,
        width: frameLayout.width - frameLayout.margin * 2,
        opacity: p * dim,
        transform: `translateY(${(1 - p) * 26}px)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 40 }}>
        <div style={{ width: 210, display: "flex", alignItems: "baseline", gap: 14 }}>
          <span
            style={{
              fontFamily: fontFamily.serif,
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1,
              color: palette.orange,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {days}
          </span>
          <span
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: palette.muted,
            }}
          >
            DAYS
          </span>
        </div>
        <div
          style={{
            flex: 1,
            fontFamily: fontFamily.sans,
            fontSize: 30,
            color: palette.muted,
          }}
        >
          {row.usage}
        </div>
        <div
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 54,
            fontWeight: 700,
            lineHeight: 1,
            color: palette.ink,
            fontVariantNumeric: "tabular-nums",
            ...scoreSettle,
          }}
        >
          {`${score}/${scoreTail}`}
        </div>
      </div>

      <div
        style={{
          marginTop: 26,
          fontFamily: fontFamily.serif,
          fontSize: 46,
          lineHeight: 1.4,
          color: palette.ink,
        }}
      >
        {row.note}
      </div>

      <div style={{ marginTop: 34, height: 1, background: veil.hairline }} />
    </div>
  );
};

/**
 * The AFTER chapter. Three check-ins, a week / a month / a season apart, read as
 * one editorial timeline — the point being that the answer changes.
 */
export const TimeScene: React.FC = () => {
  const frame = useCurrentFrame();

  const slug = progress(frame, 2, 13);
  const header = progress(frame, 6, 20);
  const closing = progress(frame, 172, 20);

  const p = ROWS.map((row) => progress(frame, row.at, 23));
  const dim = [1 - 0.4 * p[1], 1 - 0.4 * p[2], 1];

  return (
    <SceneFade frame={frame} duration={TIME_DURATION}>
      <Slug label="05 · AFTER" opacity={slug} />

      <div style={{ position: "absolute", left: frameLayout.margin, top: 146 }}>
        <Mono size={20} color={palette.muted} tracking="0.2em">
          {`AFTER · ${HERO_ITEM.name}`}
        </Mono>
        <div
          style={{
            marginTop: 14,
            fontFamily: fontFamily.serif,
            fontSize: 58,
            fontWeight: 700,
            lineHeight: 1.25,
            color: palette.ink,
            opacity: header,
            transform: `translateY(${(1 - header) * 20}px)`,
          }}
        >
          期待正在变成真实体验。
        </div>
      </div>

      {ROWS.map((row, index) => (
        <Row key={row.days} row={row} frame={frame} dim={dim[index]} top={326 + index * 218} />
      ))}

      <div
        style={{
          position: "absolute",
          left: frameLayout.margin,
          top: 974,
          opacity: closing,
        }}
      >
        <Mono size={20} color={palette.muted} tracking="0.14em">
          7 / 30 / 90 天依次回访 · 提醒可自行开启
        </Mono>
      </div>
    </SceneFade>
  );
};

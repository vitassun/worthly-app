import React, { type CSSProperties, type ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { frame as frameLayout, palette, veil } from "../design/tokens";
import { fontFamily } from "../design/typography";
import { envelope } from "../design/motion";

/**
 * The editorial layer.
 *
 * The whole film sits on one continuous sheet of Worthly paper, so scenes do not
 * cross-fade into each other — they fade their own content up from, and back
 * down to, that same surface. `Slug` gives the film a quiet running head, and
 * `MaskLine` is the only type reveal used anywhere.
 */

export const Paper: React.FC<{ children?: ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: palette.cream }}>{children}</AbsoluteFill>
);

export const SceneFade: React.FC<{
  frame: number;
  duration: number;
  inFrames?: number;
  outFrames?: number;
  children: ReactNode;
  style?: CSSProperties;
}> = ({ frame, duration, inFrames = 4, outFrames = 4, children, style }) => (
  <AbsoluteFill style={{ opacity: envelope(frame, duration, inFrames, outFrames), ...style }}>
    {children}
  </AbsoluteFill>
);

/** The running head: an orange monospaced act label with a hairline tail. */
export const Slug: React.FC<{
  label: string;
  opacity?: number;
  top?: number;
  left?: number;
}> = ({ label, opacity = 1, top = 96, left = frameLayout.margin }) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      display: "flex",
      alignItems: "center",
      gap: 20,
      opacity,
    }}
  >
    <span
      style={{
        fontFamily: fontFamily.mono,
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: "0.22em",
        color: palette.orange,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
    <span style={{ width: 72, height: 1, background: veil.hairline, display: "block" }} />
  </div>
);

/** A single line of type sliding up out of its own bounding box. */
export const MaskLine: React.FC<{
  p: number;
  distance?: number;
  style?: CSSProperties;
  children: ReactNode;
}> = ({ p, distance = 46, style, children }) => (
  <div style={{ overflow: "hidden", ...style }}>
    <div
      style={{
        transform: `translateY(${(1 - p) * distance}px)`,
        opacity: p,
      }}
    >
      {children}
    </div>
  </div>
);

/** Serif display type at film scale. */
export const SerifDisplay: React.FC<{
  size: number;
  color?: string;
  weight?: number;
  lineHeight?: number;
  align?: CSSProperties["textAlign"];
  style?: CSSProperties;
  children: ReactNode;
}> = ({ size, color = palette.ink, weight = 700, lineHeight = 1.22, align, style, children }) => (
  <div
    style={{
      fontFamily: fontFamily.serif,
      fontSize: size,
      fontWeight: weight,
      color,
      lineHeight,
      textAlign: align,
      whiteSpace: "pre-wrap",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Sans body type at film scale. */
export const BodyCopy: React.FC<{
  size: number;
  color?: string;
  weight?: number;
  lineHeight?: number;
  style?: CSSProperties;
  children: ReactNode;
}> = ({ size, color = palette.muted, weight = 400, lineHeight = 1.55, style, children }) => (
  <div
    style={{
      fontFamily: fontFamily.sans,
      fontSize: size,
      fontWeight: weight,
      color,
      lineHeight,
      whiteSpace: "pre-wrap",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Monospaced metadata at film scale. */
export const Mono: React.FC<{
  size: number;
  color?: string;
  weight?: number;
  tracking?: string;
  style?: CSSProperties;
  children: ReactNode;
}> = ({ size, color = palette.muted, weight = 700, tracking = "0.16em", style, children }) => (
  <div
    style={{
      fontFamily: fontFamily.mono,
      fontSize: size,
      fontWeight: weight,
      color,
      letterSpacing: tracking,
      lineHeight: 1.3,
      whiteSpace: "pre-wrap",
      ...style,
    }}
  >
    {children}
  </div>
);

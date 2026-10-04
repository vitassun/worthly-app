import React, { type CSSProperties, type ReactNode } from "react";
import { device, layout, palette, veil } from "../design/tokens";
import { fontFamily, type } from "../design/typography";

/**
 * The reconstructed device screens are all authored at iPhone logical width
 * (393pt) and then scaled into the 1920×1080 frame. That keeps a single source
 * of truth for every type size, radius and padding: what you read here is the
 * value the SwiftUI view uses.
 */
export const ScaledUI: React.FC<{
  scale: number;
  width?: number;
  style?: CSSProperties;
  children: ReactNode;
}> = ({ scale, width = device.width, style, children }) => (
  <div
    style={{
      width,
      transform: `scale(${scale})`,
      transformOrigin: "top left",
      ...style,
    }}
  >
    {children}
  </div>
);

/**
 * A thin, quiet iPhone shell. The device is a container for the product, never
 * the subject, so there is no gradient, no highlight and no drop shadow.
 */
export const PhoneFrame: React.FC<{
  scale: number;
  appearance?: "light" | "dark";
  style?: CSSProperties;
  children: ReactNode;
}> = ({ scale, appearance = "light", style, children }) => {
  const outerWidth = device.width + device.bezel * 2;
  const outerHeight = device.height + device.bezel * 2;

  return (
    <div
      style={{
        position: "absolute",
        width: outerWidth,
        height: outerHeight,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        ...(appearance === "dark" ? {
          "--worthly-background": palette.darkBackground,
          "--worthly-surface": palette.darkSurface,
          "--worthly-text": palette.darkInk,
          "--worthly-muted": palette.darkMuted,
          "--worthly-accent": palette.darkOrange,
          "--worthly-emphasis": palette.darkEmphasis,
          "--worthly-on-emphasis-soft": veil.darkOnEmphasisSoft,
          "--worthly-on-emphasis-overline": veil.darkOnEmphasisOverline,
        } as CSSProperties : {}),
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: device.bezelColour,
          borderRadius: device.bezelRadius,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: device.bezel,
          top: device.bezel,
          width: device.width,
          height: device.height,
          borderRadius: device.screenRadius,
          overflow: "hidden",
          background: palette.cream,
        }}
      >
        {children}
      </div>

      {/* Dynamic Island */}
      <div
        style={{
          position: "absolute",
          left: device.bezel + (device.width - device.island.width) / 2,
          top: device.bezel + device.island.top,
          width: device.island.width,
          height: device.island.height,
          borderRadius: device.island.height / 2,
          background: device.bezelColour,
        }}
      />

      {/* Home indicator */}
      <div
        style={{
          position: "absolute",
          left: device.bezel + (device.width - device.homeIndicator.width) / 2,
          top: device.bezel + device.height - device.homeIndicator.bottom - device.homeIndicator.height,
          width: device.homeIndicator.width,
          height: device.homeIndicator.height,
          borderRadius: device.homeIndicator.height / 2,
          background: palette.muted,
        }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Type                                                                */
/* ------------------------------------------------------------------ */

export const Text: React.FC<{
  children?: ReactNode;
  serif?: boolean;
  mono?: boolean;
  size?: number;
  weight?: number;
  color?: string;
  lineHeight?: number;
  tracking?: string;
  align?: CSSProperties["textAlign"];
  style?: CSSProperties;
}> = ({
  children,
  serif,
  mono,
  size = type.body,
  weight = 400,
  color = palette.ink,
  lineHeight = 1.42,
  tracking,
  align,
  style,
}) => (
  <div
    style={{
      fontFamily: mono ? fontFamily.mono : serif ? fontFamily.serif : fontFamily.sans,
      fontSize: size,
      fontWeight: weight,
      color,
      lineHeight,
      letterSpacing: tracking,
      textAlign: align,
      whiteSpace: "pre-wrap",
      ...style,
    }}
  >
    {children}
  </div>
);

/** WorthlyTheme.overline — monospaced caption, semibold. */
export const Overline: React.FC<{
  children: ReactNode;
  color?: string;
  size?: number;
  style?: CSSProperties;
}> = ({ children, color = palette.orange, size = type.caption, style }) => (
  <div
    style={{
      fontFamily: fontFamily.mono,
      fontSize: size,
      fontWeight: 700,
      letterSpacing: "0.02em",
      color,
      lineHeight: 1.2,
      whiteSpace: "pre-wrap",
      ...style,
    }}
  >
    {children}
  </div>
);

/** WorthlyTheme.displayTitle — serif bold largeTitle. */
export const DisplayTitle: React.FC<{
  children: ReactNode;
  size?: number;
  color?: string;
  lineHeight?: number;
  style?: CSSProperties;
}> = ({ children, size = type.largeTitle, color = palette.ink, lineHeight = 1.32, style }) => (
  <div
    style={{
      fontFamily: fontFamily.serif,
      fontSize: size,
      fontWeight: 700,
      color,
      lineHeight,
      whiteSpace: "pre-wrap",
      ...style,
    }}
  >
    {children}
  </div>
);

/** WorthlyTheme.sectionTitle — serif bold title2. */
export const SectionTitle: React.FC<{
  children: ReactNode;
  size?: number;
  color?: string;
  lineHeight?: number;
  style?: CSSProperties;
}> = ({ children, size = type.title2, color = palette.ink, lineHeight = 1.34, style }) => (
  <div
    style={{
      fontFamily: fontFamily.serif,
      fontSize: size,
      fontWeight: 700,
      color,
      lineHeight,
      whiteSpace: "pre-wrap",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Monospaced numeric readout, e.g. 9/10 or ¥3,299. */
export const Metric: React.FC<{
  children: ReactNode;
  size?: number;
  weight?: number;
  color?: string;
  serif?: boolean;
  style?: CSSProperties;
}> = ({ children, size = type.subheadline, weight = 700, color = palette.ink, serif, style }) => (
  <div
    style={{
      fontFamily: serif ? fontFamily.serif : fontFamily.mono,
      fontSize: size,
      fontWeight: weight,
      color,
      lineHeight: 1.15,
      fontVariantNumeric: "tabular-nums",
      ...style,
    }}
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

export const Card: React.FC<{
  children: ReactNode;
  style?: CSSProperties;
  padding?: number;
  radius?: number;
  background?: string;
}> = ({ children, style, padding = 20, radius = layout.cardRadius, background = palette.surface }) => (
  <div
    style={{
      padding,
      background,
      borderRadius: radius,
      ...style,
    }}
  >
    {children}
  </div>
);

export const EmphasisCard: React.FC<{
  children: ReactNode;
  style?: CSSProperties;
  padding?: number;
  radius?: number;
}> = ({ children, style, padding = 22, radius = layout.emphasisRadius }) => (
  <div
    style={{
      padding,
      background: palette.emphasis,
      borderRadius: radius,
      color: palette.cream,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Divider: React.FC<{ color?: string; style?: CSSProperties }> = ({
  color = veil.hairline,
  style,
}) => <div style={{ height: 1, background: color, ...style }} />;

/* ------------------------------------------------------------------ */
/* Controls                                                            */
/* ------------------------------------------------------------------ */

/** WorthlyPrimaryButtonStyle. */
export const PrimaryButton: React.FC<{
  label: string;
  icon?: ReactNode;
  style?: CSSProperties;
  pressed?: number;
}> = ({ label, icon, style, pressed = 0 }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      minHeight: 50,
      padding: "0 18px",
      background: palette.ink,
      color: palette.cream,
      borderRadius: layout.cardRadius,
      fontFamily: fontFamily.sans,
      fontSize: type.headline,
      fontWeight: 600,
      opacity: 1 - pressed * 0.22,
      transform: `scale(${1 - pressed * 0.012})`,
      ...style,
    }}
  >
    {icon}
    <span>{label}</span>
  </div>
);

/** WorthlySecondaryButtonStyle. */
export const SecondaryButton: React.FC<{
  label: string;
  style?: CSSProperties;
}> = ({ label, style }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 50,
      padding: "0 18px",
      background: palette.surface,
      color: palette.ink,
      borderRadius: layout.cardRadius,
      border: `1px solid ${veil.cardBorder}`,
      fontFamily: fontFamily.sans,
      fontSize: type.headline,
      fontWeight: 600,
      ...style,
    }}
  >
    {label}
  </div>
);

/** The selectable chip used for purchase reasons and usage frequency. */
export const Chip: React.FC<{
  label: string;
  selected?: boolean;
  variant?: "check" | "circle";
  minHeight?: number;
  fontSize?: number;
  style?: CSSProperties;
}> = ({ label, selected, variant = "check", minHeight = 44, fontSize = type.subheadline, style }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: variant === "check" ? 5 : 7,
      minHeight,
      padding: "7px 10px",
      boxSizing: "border-box",
      background: selected ? palette.ink : palette.surface,
      color: selected ? palette.cream : palette.ink,
      border: `${selected ? 2 : 1}px solid ${selected ? palette.orange : veil.cardBorder}`,
      borderRadius: layout.chipRadius,
      fontFamily: fontFamily.sans,
      fontSize,
      fontWeight: 500,
      ...style,
    }}
  >
    {variant === "check" ? (
      <span
        style={{
          display: "flex",
          width: 12,
          opacity: selected ? 1 : 0,
        }}
      >
        <CheckGlyph color={palette.cream} />
      </span>
    ) : selected ? (
      <CheckCircleGlyph color={palette.cream} />
    ) : (
      <CircleGlyph color={palette.ink} />
    )}
    <span style={{ whiteSpace: "pre-wrap", textAlign: "left" }}>{label}</span>
  </div>
);

const CheckGlyph: React.FC<{ color: string }> = ({ color }) => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <path
      d="M5 12.5 10 17.5 19 7"
      stroke={color}
      strokeWidth={3.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CircleGlyph: React.FC<{ color: string }> = ({ color }) => (
  <svg width={17} height={17} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="8.4" stroke={color} strokeWidth={1.9} />
  </svg>
);

const CheckCircleGlyph: React.FC<{ color: string }> = ({ color }) => (
  <svg width={17} height={17} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" fill={color} />
    <path
      d="M7.9 12.4 10.7 15.2 16.2 9.4"
      stroke={palette.ink}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * SwiftUI Slider. The knob is drawn in the page colour with a hairline ring so
 * it reads without introducing a white that the palette does not contain.
 */
export const Slider: React.FC<{
  value: number;
  min?: number;
  max?: number;
  style?: CSSProperties;
}> = ({ value, min = 1, max = 10, style }) => {
  const ratio = (value - min) / (max - min);
  const knob = 28;

  return (
    <div style={{ position: "relative", height: knob, width: "100%", ...style }}>
      <div
        style={{
          position: "absolute",
          top: (knob - 4) / 2,
          left: 0,
          right: 0,
          height: 4,
          borderRadius: 2,
          background: "rgba(26, 26, 26, 0.12)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: (knob - 4) / 2,
          left: 0,
          width: `${ratio * 100}%`,
          height: 4,
          borderRadius: 2,
          background: palette.orange,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: `calc(${ratio * 100}% - ${knob / 2}px)`,
          width: knob,
          height: knob,
          borderRadius: knob / 2,
          background: palette.cream,
          border: `1px solid ${veil.hairline}`,
        }}
      />
    </div>
  );
};

/** SwiftUI segmented picker, rendered with palette surfaces only. */
export const Segmented: React.FC<{
  options: string[];
  selectedIndex: number;
  style?: CSSProperties;
}> = ({ options, selectedIndex, style }) => (
  <div
    style={{
      display: "flex",
      padding: 3,
      background: palette.surface,
      borderRadius: 10,
      ...style,
    }}
  >
    {options.map((option, index) => (
      <div
        key={option}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 28,
          borderRadius: 7,
          background: index === selectedIndex ? palette.cream : "transparent",
          color: index === selectedIndex ? palette.ink : palette.muted,
          fontFamily: fontFamily.sans,
          fontSize: type.footnote,
          fontWeight: index === selectedIndex ? 600 : 400,
        }}
      >
        {option}
      </div>
    ))}
  </div>
);

/** A rounded input field, used for text entry in the Add flow. */
export const Field: React.FC<{
  text: string;
  placeholder?: string;
  caret?: boolean;
  style?: CSSProperties;
  fontSize?: number;
  fontWeight?: number;
  padding?: string;
  radius?: number;
  background?: string;
  bordered?: boolean;
}> = ({
  text,
  placeholder,
  caret,
  style,
  fontSize = type.body,
  fontWeight = 600,
  padding = "12px 18px",
  radius = layout.cardRadius,
  background = palette.surface,
  bordered = false,
}) => {
  const showPlaceholder = text.length === 0 && placeholder;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding,
        background: bordered ? "transparent" : background,
        borderRadius: radius,
        border: bordered ? `1px solid ${veil.fieldBorder}` : undefined,
        boxSizing: "border-box",
        fontFamily: fontFamily.sans,
        fontSize,
        fontWeight,
        lineHeight: 1.25,
        color: showPlaceholder ? palette.muted : palette.ink,
        ...style,
      }}
    >
      <span style={{ whiteSpace: "pre" }}>{showPlaceholder ? placeholder : text}</span>
      {caret ? <Caret /> : null}
    </div>
  );
};

export const Caret: React.FC<{ color?: string }> = ({ color = palette.ink }) => (
  <span
    style={{
      display: "inline-block",
      width: 2,
      height: "1.05em",
      marginLeft: 1,
      background: color,
      transform: "translateY(0.12em)",
    }}
  />
);

/** A right-pointing chevron for menu-style pickers. */
export const Chevron: React.FC<{ color?: string; size?: number }> = ({
  color = palette.muted,
  size = 13,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="m8 5 7 7-7 7"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Worthly design tokens.
 *
 * These are a direct transcription of `Worthly/Core/DesignSystem/WorthlyTheme.swift`.
 * The light values are the locked palette and must not drift. The dark values are
 * carried here for completeness; the film stays on the warm cream paper identity.
 *
 * Nothing in the film may introduce a colour literal outside this file.
 */

export const palette = {
  /** WorthlyTheme.background (light) — the warm paper the whole film lives on. */
  cream: "var(--worthly-background, #EFEAE0)",
  /** WorthlyTheme.surface (light) — cards resting on the paper. */
  surface: "var(--worthly-surface, #E5DFD2)",
  /** WorthlyTheme.text (light). */
  ink: "var(--worthly-text, #1A1A1A)",
  /** WorthlyTheme.muted (light). */
  muted: "var(--worthly-muted, #5C5852)",
  /** WorthlyTheme.accent (light) — the single chromatic accent. */
  orange: "var(--worthly-accent, #CD6F47)",
  /** WorthlyTheme.emphasis (light) — the rare high-contrast card. */
  emphasis: "var(--worthly-emphasis, #0A0A0A)",

  // WorthlyTheme dark counterparts. Not used by the film, kept so the token
  // layer mirrors the app exactly and a future dark beat has a truthful source.
  darkBackground: "#17140F",
  darkSurface: "#221E17",
  darkInk: "#EFEAE0",
  darkMuted: "#A69D8F",
  darkOrange: "#E0895E",
  darkEmphasis: "#F5F0E5",
} as const;

/**
 * Translucent variants. Worthly expresses depth with opacity on its own ink,
 * never with shadows or gradients, so every softened edge below is derived from
 * the palette above.
 */
export const veil = {
  /** Dividers / hairlines inside cards. */
  hairline: "rgba(26, 26, 26, 0.14)",
  /** Card border used by the secondary button style. */
  cardBorder: "rgba(26, 26, 26, 0.14)",
  /** Body copy on top of the emphasis (near-black) card. */
  onEmphasisSoft: "var(--worthly-on-emphasis-soft, rgba(239, 234, 224, 0.72))",
  /** Overline copy on top of the emphasis card. */
  onEmphasisOverline: "var(--worthly-on-emphasis-overline, rgba(239, 234, 224, 0.64))",
  darkOnEmphasisSoft: "rgba(23, 20, 15, 0.72)",
  darkOnEmphasisOverline: "rgba(23, 20, 15, 0.64)",
  /** Divider inside the emphasis card. */
  onEmphasisHairline: "rgba(239, 234, 224, 0.18)",
  /** Off-state fill for a switch or slider track. */
  controlTrack: "rgba(26, 26, 26, 0.16)",
  /** Fill of a system segmented control / compact date chip. */
  controlFill: "rgba(26, 26, 26, 0.07)",
  /** Border of a bordered text field. */
  fieldBorder: "rgba(26, 26, 26, 0.22)",
} as const;

/** iPhone logical geometry. Every UI component below is authored in these units. */
export const device = {
  width: 393,
  height: 852,
  screenRadius: 50,
  bezel: 11,
  bezelRadius: 61,
  bezelColour: "#171512",
  island: { width: 108, height: 31, top: 11 },
  homeIndicator: { width: 140, height: 5, bottom: 9 },
  /** iOS safe-area insets used by the reconstructed screens. */
  safeTop: 59,
  safeBottom: 34,
} as const;

/** Layout rhythm, mirroring WorthlyTheme's pagePadding / cardRadius. */
export const layout = {
  pagePadding: 20,
  cardRadius: 18,
  emphasisRadius: 24,
  chipRadius: 14,
} as const;

/** Editorial layout rhythm for the 1920×1080 frame (film units, not device units). */
export const frame = {
  width: 1920,
  height: 1080,
  /** Page horizontal padding for full-frame editorial compositions. */
  margin: 150,
  /** Major section gap. */
  sectionGap: 32,
} as const;

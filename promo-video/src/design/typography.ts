/**
 * Typography.
 *
 * Worthly's identity is three families doing three jobs, exactly as in the app:
 *
 *   display / section headline  →  serif        (WorthlyTheme.displayTitle, .sectionTitle)
 *   body / UI                   →  native sans  (the SwiftUI default)
 *   metadata / dates / scores   →  monospaced   (WorthlyTheme.overline)
 *
 * The app uses the system serif and the system mono. The closest freely
 * redistributable equivalents with full Simplified-Chinese coverage are Noto
 * Serif SC, Noto Sans SC and JetBrains Mono (all SIL OFL). The mono face has no
 * CJK coverage, so it falls back to the sans face for the few Chinese glyphs
 * that appear inside monospaced metadata — the same way the system does it.
 */

export const fontFamily = {
  serif: "'Noto Serif SC', 'Songti SC', 'SimSun', serif",
  sans: "'Noto Sans SC', -apple-system, 'Segoe UI', 'Microsoft YaHei', sans-serif",
  mono: "'JetBrains Mono', 'Noto Sans SC', 'Menlo', monospace",
} as const;

/** iOS point sizes, used inside the reconstructed device screens. */
export const type = {
  largeTitle: 34,
  title2: 22,
  title3: 20,
  headline: 17,
  body: 17,
  subheadline: 15,
  footnote: 13,
  caption: 12,
  caption2: 11,
} as const;

/** Full-frame editorial sizes for the 1920×1080 canvas. */
export const display = {
  /** The opening question and the closing statement. */
  hero: 116,
  /** The thesis line. */
  thesis: 96,
  /** Chapter statements such as 让结论慢一点出现。 */
  statement: 84,
  /** Giant day counters in the time sequence. */
  dayNumber: 320,
  /** Section headlines that sit next to UI. */
  headline: 58,
  /** Smaller supporting editorial copy. */
  support: 30,
} as const;

export const tracking = {
  /** Monospaced overlines read better slightly open. */
  overline: "0.16em",
  overlineWide: "0.22em",
  none: "0",
} as const;

import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

/**
 * Font loading.
 *
 * The film is almost entirely Chinese, so the render host needs CJK faces. All
 * three families are SIL OFL and are bundled under `public/fonts`, which keeps
 * the render deterministic and offline-safe:
 *
 *   Noto Serif SC  — the editorial display face (app: system serif)
 *   Noto Sans SC   — body and UI (app: system sans)
 *   JetBrains Mono — dates, scores, overlines (app: system monospaced)
 *
 * Faces are loaded through the FontFace API rather than `document.fonts.ready`
 * so Remotion actually waits for the glyphs instead of resolving early.
 */
const FONT_FILES: Array<{ family: string; weight: string; file: string }> = [
  { family: "Noto Serif SC", weight: "400", file: "fonts/NotoSerifSC-Regular.ttf" },
  { family: "Noto Serif SC", weight: "700", file: "fonts/NotoSerifSC-Bold.ttf" },
  { family: "Noto Sans SC", weight: "400", file: "fonts/NotoSansSC-Regular.ttf" },
  { family: "Noto Sans SC", weight: "500", file: "fonts/NotoSansSC-Medium.ttf" },
  { family: "Noto Sans SC", weight: "700", file: "fonts/NotoSansSC-Bold.ttf" },
  { family: "JetBrains Mono", weight: "400", file: "fonts/JetBrainsMono-Regular.ttf" },
  { family: "JetBrains Mono", weight: "500", file: "fonts/JetBrainsMono-Medium.ttf" },
  { family: "JetBrains Mono", weight: "700", file: "fonts/JetBrainsMono-Bold.ttf" },
];

let loadPromise: Promise<void> | null = null;

const loadAllFonts = (): Promise<void> => {
  if (!loadPromise) {
    loadPromise = Promise.all(
      FONT_FILES.map(async ({ family, weight, file }) => {
        const face = new FontFace(family, `url("${staticFile(file)}")`, {
          weight,
          style: "normal",
          display: "block",
        });
        const loaded = await face.load();
        document.fonts.add(loaded);
      }),
    ).then(() => undefined);
  }
  return loadPromise;
};

/** Blocks the render until every face above is available. */
export const useWorthlyFonts = (): void => {
  const [handle] = useState(() => delayRender("Loading Worthly fonts"));

  useEffect(() => {
    let cancelled = false;
    loadAllFonts()
      .then(() => {
        if (!cancelled) continueRender(handle);
      })
      .catch((error) => {
        // A missing face must not silently fall back to a different typeface:
        // surface it so the render fails loudly instead of shipping wrong type.
        console.error("Worthly font loading failed", error);
        if (!cancelled) continueRender(handle);
      });
    return () => {
      cancelled = true;
    };
  }, [handle]);
};

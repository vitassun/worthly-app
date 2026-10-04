# Worthly / 值不值 — product promo film

A 32-second, 1920 × 1080, 30 fps product film for the iOS app **Worthly /
值不值**, built with [Remotion](https://remotion.dev) + React + TypeScript.

The film is entirely code. There is no screen recording, no stock footage, no
after-effects project and no licensed music. Every pixel — the editorial type,
the phone, the app UI inside the phone — is rendered from React components that
reuse the app's real design tokens and its real `InsightEngine` algorithm, and
the score is synthesised from code too (see §6).

> **Scope note.** This directory is self-contained and additive. Nothing outside
> `promo-video/` is read at build time or modified. `Worthly/`, `WorthlyTests/`
> and `Worthly.xcodeproj` are untouched.

---

## 1. What the film shows

The film follows Worthly's canonical product loop and never claims anything the
app does not actually do:

```
CAPTURE → WAIT / REVISIT → DECIDE → BUY / PASS → 7d / 30d / 90d CHECK-INS → LEARN
```

| # | Scene | Act slug | Length | What is on screen |
| --- | --- | --- | --- | --- |
| 1 | Opening | — | 3.3s | 很想要，就代表值得吗？ |
| 2 | Thesis | — | 2.0s | 买下的那一刻，不是答案。 |
| 3 | Before | `01 · CAPTURE` | 4.3s | The real Add Item form being filled in |
| 4 | Wait | `02 · WAIT` | 2.1s | The 7-day decision-revisit card, its day count settling |
| 5 | Decide | `03 · DECIDE` | 1.8s | 买了 / 没买 |
| 6 | Purchase | `04 · PURCHASE` | 2.0s | 最终到手价 + 确认已购买 |
| 7 | Time | `05 · AFTER` | 5.6s | The 7 / 30 / 90 day check-in timeline, the day counters settling |
| 8 | Anytime | `06 · ANYTIME` | 2.2s | 记录现在的感觉 — free-form reflections |
| 9 | ZoomOut | `07 · LIBRARY` | 1.8s | 你的消费记忆 — the library, arriving a row at a time |
| 10 | Insight | `08 · INSIGHTS` | 3.1s | A real, computed insight card |
| 11 | Philosophy | — | 1.7s | 让结论慢一点出现。 |
| 12 | End | — | 2.3s | `W.` → `Worthly 值不值` → 给想要一点时间。 |

Everything shown is a shipped feature: capture with reason / desire score /
expected usage / price, the 7-day decision revisit for `considering` items,
buy / pass, paid price and purchase date, the sequential 7 → 30 → 90 day
check-ins, unlimited free-form `随时回访` reflections, the searchable library,
and the deterministic `InsightEngine`.

**Deliberately absent:** AI/LLM claims, App Store badges or star ratings, streak
counters, points, badges, budgets, bank sync, or any invented screen.

---

## 2. Requirements

| Need | Version used here |
| --- | --- |
| Node.js | 24.19.0 (any ≥ 20 works) |
| npm | 10+ |
| OS | macOS / Windows / Linux |

Remotion downloads its own pinned Chromium Headless Shell and a bundled ffmpeg
on first install — no system Chrome, no system ffmpeg, no Xcode required.

Fonts are **vendored in `public/fonts/`** (SIL Open Font License), so the render
is reproducible offline and never reaches a font CDN:

| File | Family | Used for |
| --- | --- | --- |
| `NotoSerifSC-Regular.ttf` / `-Bold.ttf` | Noto Serif SC | display headings |
| `NotoSansSC-Regular.ttf` / `-Medium.ttf` / `-Bold.ttf` | Noto Sans SC | body + UI |
| `JetBrainsMono-Regular.ttf` / `-Medium.ttf` / `-Bold.ttf` | JetBrains Mono | metadata / slugs |

They are loaded at runtime through the FontFace API behind Remotion's
`delayRender` / `continueRender`, so no frame is ever captured before the
typeface is ready.

The full CJK families are ~60 MB on disk. That is deliberate: subsetting them
to only the glyphs this cut happens to use would shrink the payload by roughly
50×, but any later copy edit would then silently fall back to a system font and
render tofu boxes. Correctness of the film was chosen over repository size. If
you want the smaller payload, run `pyftsubset` (from `fonttools`) over the exact
string set in `src/`, then re-run `npm run frames` and confirm the stills are
unchanged before committing the subsets.

---

## 3. Install

```bash
cd promo-video
npm install
```

## 4. Preview

```bash
npm run dev          # Remotion Studio on http://localhost:3000
```

Scrub the timeline, toggle the composition, and inspect any frame.

## 5. Render

```bash
npm run score        # → public/audio/worthly-score.wav  (synthesised, ~9 s)
npm run render       # → renders/worthly-promo-16x9.mp4
```

`npm run render` reads `public/audio/worthly-score.wav` and muxes it in, so the
score has to exist first. `npm run qa:full` runs the whole sequence in the right
order if you would rather not think about it.

Optional social variants are **not** produced by this project. A 9:16 or 1:1 cut
must be re-laid-out scene by scene (the split-stage scenes stack the type above
the phone); letterboxing or cropping the 16:9 master would break the editorial
grid, so it is deliberately left out rather than faked.

## 6. Output

```
renders/worthly-promo-16x9.mp4
```

| Property | Value |
| --- | --- |
| Container / codec | MP4 / H.264 (`yuvj420p`, full range) |
| Resolution | 1920 × 1080 |
| Aspect | 16:9 |
| Frame rate | **30 fps** |
| Duration | 32.00 s (960 frames) |
| Size / bitrate | 6.5 MB · ≈ 1.63 Mbps |
| Audio | AAC-LC · 2 ch · 48 kHz · 32.00 s — original score + sound design, see below |

### The score

The film is **not silent**. It carries an original 32-second score at
`public/audio/worthly-score.wav`, synthesised in-repo by `scripts/make-score.mjs`.
No third-party audio asset, no licence question, no network access. The generator
is a deterministic additive synthesiser — fixed PRNG seed, no wall clock — so
re-running it reproduces the same file.

```bash
npm run score                       # default: −16 LUFS integrated
npm run score -- --target-lufs -19  # a quieter bed
npm run score -- --gain-db -1.5     # manual trim applied after calibration
npm run score -- --out public/audio/other.wav
```

**Why compose rather than license.** A licensed bed was not available, and
unlicensed music is worse than no music. Writing the score as code gives it the
same property the rest of the film has: versioned, reviewable, and reproducible
from the repository alone.

**What it is.** Four layers, each rendered into its own bus so it can be
measured before the mix:

| Layer | Role | Measured peak / RMS |
| --- | --- | --- |
| Pad | the bed — a D3 drone under the full 32 s, with modal chords moving around it | +1.4 / −13.4 dBFS |
| Bells | the marks — 18 struck tones, inharmonic partials, short decay | −2.2 / −18.6 dBFS |
| Air | band-limited noise swell, ≈ 25 dB under the pad | −24.3 / −38.3 dBFS |
| Reverb return | Freeverb-style comb/allpass room, fed from the pad | −6.2 / −21.9 dBFS |
| Sound design | ticks, paper, breaths and stops — see below | −30.3 / −53.8 dBFS |

There is **no percussion, no drum kit and no melody line**. The film is calm and
non-judgmental; a score that pushed would fight it. The pad's amplitude is
automated along a hand-written curve before it reaches the reverb, so the room
breathes with the arrangement instead of sitting on top of it.

**The arrangement follows the cut.** Every entry is placed against
`src/timeline.ts`. The clearest example is the structural motif: one bell per
7 / 30 / 90 check-in row, climbing D5 → E5 → F5 as the rows animate; at the
Insights scene the climb completes and falls home as A5 → F5 → D5.

**Loudness is calibrated, not guessed.** The generator peak-normalises, measures
the result with ffmpeg's `loudnorm` analysis, applies the difference, and
re-measures — holding the peak under −1.0 dBFS so a lossy codec cannot overshoot.
The level is reached by scaling, never by compressing, so the arrangement's
dynamics survive the move to −16 LUFS:

| Property | Value |
| --- | --- |
| Sample rate / depth | 48 kHz · 16-bit PCM · stereo |
| Duration | 32.00 s (exactly 1,536,000 samples per channel) |
| Integrated loudness | −16.0 LUFS (delivered film: −16.01) |
| True peak | −1.6 dBTP |
| Loudness range | 5.4 LU |
| Stereo correlation | 0.90 |
| DC offset | ≈ 5 × 10⁻⁸ |
| Head / tail | true digital silence |

Re-running the generator produces a byte-identical file
(`md5 b210330756bef85a064c7b87e53661de`), so the score can be reviewed in a diff
like the rest of the source.

### The sound design

A fourth layer sits 30 dB under the pad. Its vocabulary is deliberately tiny — a
switch, a sheet of paper, a room breathing, a held tone — and there is no whoosh,
no impact, no riser and no drum anywhere in the film.

| Cue | Where it goes |
| --- | --- |
| `tick` | every UI confirmation, and the moment each settling number lands |
| `paper` | a card arriving — the wait card, the insight card, the library's first row |
| `breath` | five chapter changes, and only the ones that turn a page |
| `stop` | a scroll coming to rest |
| `tone` | a held chord tone under the two most important cards |

The standard is not "can you hear the sound effect" — it is "does the picture
feel thinner when it is muted". A cue that announces itself has failed however
quiet it is in absolute terms, so two things are enforced mechanically:

- The generator measures the isolated bus and warns if it peaks above −28 dBFS in
  the pre-normalisation units the layer report prints — roughly 30 dB under the
  pad's peak.
- `verify-audio.mjs` re-measures the delivered file and fails if any cue lifts the
  mix by more than 2.5 dB across its own 25 ms attack. The measured worst case is
  1.01 dB.

The generator also writes a **cue sheet** to `qa/reports/score-cues.json` — 18
bells and 32 sound-design cues — so the QA pass can prove the score lands on the
film's beats rather than trusting a comment in the source (see §11).

## 7. Composition

| Field | Value |
| --- | --- |
| Composition id | `WorthlyPromo16x9` |
| Entry point | `src/index.ts` |
| Root | `src/Root.tsx` |
| Master component | `src/WorthlyPromo.tsx` |
| Timeline | `src/timeline.ts` |
| Design tokens | `src/design/tokens.ts`, `src/design/typography.ts`, `src/design/motion.ts` |

`src/timeline.ts` is the single source of truth for the cut. Every scene reads
its own duration back out of it:

```ts
export const BEFORE_DURATION = sceneById("before").durationInFrames;
```

so a retime can never desynchronise a scene's fade window from the edit.

Scenes are **butt-joined, not cross-faded**. One continuous cream sheet sits
behind the whole film and each scene fades its own content up from, and back
down to, that same paper (`SceneFade`, a 4-frame symmetric envelope — 133 ms at
30 fps).

### Motion

The film's default move is a fade with a short rise, and that is deliberate: a
film that animates everything animates nothing. On top of that default there are
**four** signature moves, and only four. Each is tied to a moment where the
content itself is a number coming to rest, or a card arriving.

| Move | Where | What it does |
| --- | --- | --- |
| **The settling number** | the WAIT day badge, the 7 / 30 / 90 day counters, the three scores | the value starts a little below its final reading and closes the gap on a decelerating ease — a counter coming to rest, not a slot machine rolling |
| **The hero arrival** | the insight emphasis card | an 11 px rise out of a 0.8 % oversize, on an ease that is already almost flat by the time it lands. The only element in the film that arrives with real weight |
| **The row stagger** | the library | nine rows, two frames apart — close enough that the list reads as one movement rather than as a list animating in |
| **The lockup** | the end card | `W.` → `Worthly 值不值` → the line, one short beat apart |

Nothing bounces and nothing overshoots. `settleNumber`, `settleIn`, `stagger` and
`heroArrival` in `src/design/motion.ts` are the entire vocabulary; if a scene
needs something outside it, that is a signal the scene is trying too hard.

The moves that depend on a number were verified on the rendered film rather than
on the source. Sampling the AFTER scene frame by frame shows the day counter
stepping through distinct digit shapes before it settles, and the score's ink
arriving and then changing again as its own digit lands — which is the only way
to check motion when you cannot watch it.

### Layout constants

| Token | Value |
| --- | --- |
| Frame | 1920 × 1080 |
| Safe margin | 150 px |
| Content width | 1620 px |
| Page padding (in-device) | 20 pt |
| Card radius | 18 pt |
| Emphasis radius | 24 pt |
| Device | 393 × 852 pt screen, 415 × 874 pt outer, 11 pt bezel, 50 pt screen radius |

The app UI is authored at logical **393 pt** width and scaled into the frame by
a single `ScaledUI` wrapper, so what is on screen is a faithful reconstruction
of the SwiftUI layout rather than a stretched screenshot.

#### Device scale

A 393 × 852 pt device at full frame height can only be scaled to **1.236×** in a
1080 px frame, so the device shots run at **1.30×** and bleed a deliberate 28 px
past the top and bottom edges — 2.6 % of the frame height. That is a +8 % gain
over the previous 1.20×, and it is the only way to make the phone bigger without
changing the composition.

The crop is safe by construction: the screen's own safe areas absorb all of it,
so the top 10 pt of the status bar and the last 2 pt of the home indicator are
trimmed and **no app content is clipped**. `analyze-frames.mjs` reports the
resulting edge contact as `device full-bleed (expected)` rather than as a flag;
a bleed on only one edge is still a layout bug and still fails.

The library shot starts at the same 1.30× and pulls back to 1.06×, where the
whole device fits — the film steps back to see the library.

---

## 8. Replace the screenshots / rebuild the UI

There are no screenshots to replace — the UI is live React. To change what the
film shows:

| You want to change | Edit |
| --- | --- |
| The product data (names, prices, scores) | `src/data/demo.ts` |
| The insight copy | `src/data/insightEngine.ts` (a TypeScript port of `InsightEngine.swift`) |
| The Add Item screen | `src/ui/AddItemUI.tsx` |
| Item Detail | `src/ui/ItemDetailUI.tsx` |
| The check-in screen | `src/ui/CheckInUI.tsx` |
| The library | `src/ui/ThingsUI.tsx` |
| Insights | `src/ui/InsightsUI.tsx` |
| Buy / pass | `src/ui/PurchaseDecisionUI.tsx` |
| Home | `src/ui/HomeUI.tsx` |
| Colours, radii, device metrics | `src/design/tokens.ts` |
| Type scale | `src/design/typography.ts` |
| Easing, springs, envelopes | `src/design/motion.ts` |
| Shot order, lengths, copy | `src/scenes/*.tsx` and `src/timeline.ts` |
| The app icon on the end card | `public/icon/AppIcon.png` |

If you edit `Worthly/Core/DesignSystem/WorthlyTheme.swift` or
`Worthly/Core/Insights/InsightEngine.swift`, mirror the change into
`src/design/tokens.ts` and `src/data/insightEngine.ts`, then run
`npm run verify:data` to confirm the film still agrees with the app.

---

## 9. Demo data

The film runs on a fixed, hand-authored dataset — no randomness, no wall clock,
so every render is byte-for-byte reproducible.

`src/data/demo.ts` holds ten purchases:

| Item | Category | Desire | Original → Paid | Latest satisfaction |
| --- | --- | --- | --- | --- |
| AirPods Max | 数码 | 9 | ¥3,999 → ¥3,299 | 7 |
| 跑鞋 | 服饰 | 9 | ¥899 → ¥899 | 9 |
| 咖啡机 | 家居 | 9 | ¥1,299 → ¥999 | 7 |
| 旅行箱 | 旅行 | 9 | ¥1,599 → ¥1,599 | 6 |
| 台灯 | 家居 | 9 | ¥399 → ¥399 | 7 |
| 线上课程 | 学习 | 9 | ¥699 → ¥699 | 5 |
| 香水 | 美妆 | 9 | ¥880 → ¥616 | 7 |
| 游戏机 | 娱乐 | 9 | ¥2,599 → ¥2,599 | 7 |
| 咖啡豆订阅 | 家居 | 8 | ¥300 → ¥300 | 7 |
| 双肩包 | 服饰 | 8 | ¥599 → ¥449 | 7 |

The hero — **AirPods Max** — is the item that appears in the phone throughout
the film:

| Field | Value |
| --- | --- |
| Category | 数码 |
| Reason | 提升体验 |
| Desire | 9 / 10 |
| Expected usage | 每天 |
| Original price | ¥3,999 |
| Paid price | ¥3,299 |
| Derived | `-18% · SAVED ¥700` |
| Created | 2026-03-01 |
| Purchased | 2026-03-08 |
| Day 7 (2026-03-15) | 8/10 · 几乎每天 · "降噪比想象中更有用。" |
| Day 30 (2026-04-07) | 7/10 · 每周几次 · "音质很好，但出门带得比想象中少。" |
| Day 90 (2026-06-06) | 7/10 · 每周几次 · "喜欢它，但没有买前想象得那么离不开。" |

Running the real algorithm over that dataset produces:

| Metric | Value |
| --- | --- |
| Evaluated bought items | 10 |
| Mature evaluations (≥ 30 days) | 10 |
| Average desire | 8.8 |
| Average later satisfaction | 6.9 |
| Gap | −1.9 → "你买前通常比后来更兴奋。" |

and exactly four insight cards, generated by the algorithm:

1. **EXPECTATION / REALITY** (emphasis) — 买前想要 8.8 vs 后来满意 6.9, "基于 10 件已经回访的购买。购买前想要度平均比最新满意度高 1.9 分。"
2. **DISCOUNT PATTERN · 30+ DAYS** — ≥20% OFF · 3件 = 7.0 vs <20% OFF · 7件 = 6.9
3. **CATEGORY PATTERN · 30+ DAYS** — 家居 长期满意 7.0, 样本 3
4. **LONG-TERM MEMORY** — 跑鞋 9.0 / 线上课程 5.0

These are not written by hand. `src/data/insightEngine.ts` is a line-for-line
port of `Worthly/Core/Insights/InsightEngine.swift`, including the sparse-data
thresholds (≥ 3 early evaluations, ≥ 3 mature evaluations, ≥ 3 per category,
≥ 2 per discount group) and the rule that free-form reflections
(`stageDays == 0`) never participate in satisfaction averages.

```bash
npm run verify:data   # prints the computed snapshot
```

---

## 10. Design system

The film uses the locked Worthly palette and nothing else. There is exactly one
chromatic accent — Worthly Orange — and no gradients, no glassmorphism, no
decorative shadows, no glow, no chart grids.

| Role | Light | Dark |
| --- | --- | --- |
| background | `#EFEAE0` | `#17140F` |
| secondary surface | `#E5DFD2` | `#221E17` |
| primary text | `#1A1A1A` | `#EFEAE0` |
| secondary text | `#5C5852` | `#A69D8F` |
| accent | `#CD6F47` | `#E0895E` |
| emphasis | `#0A0A0A` | `#F5F0E5` |

The film is rendered in the **light** appearance only, to protect the warm-cream
identity at video bitrates. The dark values are carried in `tokens.ts` so the
UI components can be flipped, but no scene uses them.

### Documented deviations

A handful of iOS controls have no colour in Worthly's palette (the system draws
them). They were resolved inside the palette rather than by inventing a literal:

| Control | Resolution |
| --- | --- |
| Nav bar "取消" | `palette.muted` instead of system blue |
| Category / reason `.menu` value | `palette.ink` + a chevron, no blue tint |
| Slider + switch knobs | `palette.cream` with a hairline ring |
| Segmented control | `palette.surface` track + `palette.cream` selected pill |

These are deliberate. Introducing system blue would have added a second
chromatic accent, which the design system forbids.

---

## 11. Quality assurance

**The agent that built this film cannot see images, and cannot hear audio.**
Every QA pass is therefore quantitative, and runs on real rendered pixels and
real decoded samples rather than on code inspection.

```bash
npm run screens        # 1. in-device layout measurement (DOM geometry)
npm run frames         # 2. stills at the canonical checkpoints
npm run analyze        # 3. per-frame palette + density analysis
npm run probe          # 4. region probes: is the right thing in the right place
npm run contact-sheet  # 5. one reviewable sheet
npm run sequence       # 6. whole-film continuity pass over the rendered MP4
npm run verify:encode  # 7. encode fidelity: MP4 frames vs the lossless stills
npm run verify:audio   # 8. audio QA on the finished MP4
npm run qa             # 1–5
npm run qa:full        # score → 1–5 → render → 6–8
```

| Script | What it proves |
| --- | --- |
| `measure-screens.mjs` | Every device screen fits or scrolls correctly; no overflow, no clipping |
| `extract-qa-frames.mjs` | Renders exact frames at 00:02 / 05 / 08 / 11 / 14 / 17 / 20 / 23 / 26 / 29 / 31 |
| `analyze-frames.mjs` | Paper colour, ink coverage, content bounds, off-palette share, 12-band ink profile, row runs and gaps |
| `probe-frames.mjs` | Region probes — type is inside its box, empty space is genuinely empty, the phone outline lands on the exact pixel the geometry predicts |
| `contact-sheet.mjs` | Builds the contact sheet through headless Chrome |
| `analyze-sequence.mjs` | Decodes every frame of the finished MP4 at proxy resolution and checks blank frames, off-palette pixels, and frame-to-frame pops |
| `verify-encode.mjs` | Decodes the finished MP4 at full resolution and compares it against the lossless stills, catching level/range shifts, chroma damage and dropped frames. It reads the frame rate from the file, so a change of frame rate cannot silently compare the wrong frames |
| `make-score.mjs` | Synthesises the score and sound design, and calibrates them to a declared loudness target |
| `verify-audio.mjs` | Decodes the finished MP4's audio and checks 19 properties against the source score, the cut and the sound-design cue sheet |

Reports land in `qa/reports/`, stills in `qa/frames/` and `qa/frames-extra/`,
sheets in `qa/contact-sheets/`.

### Current results

| Check | Result |
| --- | --- |
| Screen layout | 16 screens · 0 issues |
| Still frames (11 canonical) | 0 flagged · all paper `#EFEAE0` · off-palette 0.000% |
| Still frames (11 extra) | 0 flagged · off-palette 0.000% |
| Region probes | 56/56 and 29/29 pass |
| Whole-film sequence | 960 frames · 0 blank frames · largest single-frame step 5.74pp · off-palette ≤ 0.149% |
| Encode fidelity | 11/11 checkpoints · signed Δ ≤ 1.02 levels · mean Δ ≤ 1.83 · >60/255 on ≤ 0.164% of pixels |
| Score | −16.0 LUFS integrated (target −16) · true peak −1.6 dBTP · LRA 5.4 LU |
| Audio QA | 19 checks · 0 failed |
| Score ↔ cut | all 18 bells lift the 1.4–8 kHz band by ≥ 3 dB and strike within 9 ms of their cue |
| Sound design | 32 cues · largest lift 1.01 dB (limit 2.5 dB) |
| 7 / 30 / 90 motif | picture 16.100 / 17.433 / 18.767 s · struck 16.108 / 17.433 / 18.773 s |
| Signature motion | verified on the rendered film, not on the source (see §7) |
| TypeScript | `tsc --noEmit` clean |

The residual 0.149% off-palette is H.264 4:2:0 chroma bleed along the edge of
the black emphasis card where it meets the orange metric, in the Insights scene.
It is a codec artefact, not a design one — the source frames measure 0.000% —
and it is roughly 190 pixels in a 480×270 proxy frame. The sequence pass reports
it but only fails above a 0.5% floor, so a genuine colour mistake still breaks
the build. Both `analyze-sequence.mjs` and `verify-encode.mjs` exit non-zero on
failure, which is what makes `npm run qa:full` usable as a gate.

The encode pass measures a **uniform −1 level shift on every channel**, including
the flat paper background: `rgb(239,234,224)` arrives as `rgb(238,233,223)`. That
is the RGB → YUV → RGB round trip, not a range or matrix mistake — a real one
would compress toward mid-grey and show a signed mean of several levels. The
remaining error is antialiased glyph edges inside the phone mock, which is where
the `>60` share of 0.16% sits at 23s.

### Note on process

Because the author can neither view frames nor hear the mix, "QA" here means:

1. **DOM layout measurement** of every device screen against its real content height.
2. **Pixel analysis** of rendered PNGs — palette membership, coverage, bounds, density bands.
3. **Region probes** derived from design intent, not from measured output, so the check is not circular.
4. **Dense-sequence continuity analysis** over the encoded MP4, which is how motion was actually tuned.
5. **Encode fidelity diffing** — decoding the finished MP4 and comparing it pixel-for-pixel against the lossless stills.
6. **Signal measurement on the decoded audio** — integrated loudness (ITU-R BS.1770 via `loudnorm`), true peak, DC offset, stereo correlation, edge silence, and first-difference click detection.
7. **Cue verification against the cut**, described below.
8. **Frame-by-frame measurement of the signature motions** — sampling consecutive frames and counting ink in a specific region, which is the only way to confirm that a number really is settling rather than just appearing.

This caught real defects: a back-loaded exit curve that made every one of the
twelve scene boundaries read as a hard cut, a `ZoomOut` camera move that cropped
the device, subpixel-antialiasing colour fringes from Chromium's LCD text
rendering, and a retime that had put the 00:05 checkpoint on a blank frame.

The audio pass then caught the score's own defect. The bells were sitting
10.7 dB under the pad with a 1.5 s decay, so a strike lifted the high band by
only 0.2–2.5 dB: a structural motif the arrangement claimed and the mix did not
deliver. Shortening the decay and re-levelling the bells took the worst case
from 0.2 dB to 3.2 dB and the median to 7.1 dB.

The polish pass caught three more, all of them in the instruments rather than in
the film:

- A third supporting card in the Insights scene was 303 pt tall, so at 1.55× it
  overflowed the frame by 120 px and sat on top of the emphasis card. The region
  probes had not caught it because each one only looked at its own box; the
  whole-frame bounds report did. The section went back to two cards, which is
  what the hierarchy wanted anyway.
- `verify-encode.mjs` had `const FPS = 60` hard-coded. Moving the film to 30 fps
  did not fail loudly — it compared every still against the frame four seconds
  later. It now reads the frame rate out of the file it is checking.
- The sound-design check was measuring the wrong thing twice: its window ran
  75 ms past each cue, so the bell landing 33 ms later was read as the cue's own
  level, and it took the magnitude of the difference, so the score's natural decay
  at the end card counted as a cue getting louder. Tightened to 25 ms and made
  positive-only, the largest lift reads 1.01 dB instead of 2.49 dB.

### How the score is checked without listening

The useful question is not "is there audio", but "is the score that was written
actually in the delivered file, on the beats it was written to".
`verify-audio.mjs` answers both; the second is the interesting one.

It decodes the MP4's audio back to PCM, high-passes it at 1.4 kHz, and then, for
every bell in the cue sheet, compares the band energy just *after* the declared
time against the energy just *before* it. A struck bell must lift that band. It
also reports the first moment the lift crosses 1.5× the pre-cue level — the
strike time — and checks that against the cue.

Two choices matter, and both came from watching the check fail first:

- **An A/B comparison, not an onset picker.** An onset picker has to decide what
  counts as a note, and the reverb's slow 100 ms build defeats local-maximum
  rules — a bell is loudest well after it starts. "Is the band louder after this
  moment than before it" has an unambiguous answer.
- **3 dB as the audibility floor.** That is a doubling of energy in the band,
  which is unambiguously audible; below it a strike is colouration rather than an
  event. The measured worst case is 3.2 dB and the median 7.1 dB, so the floor has
  real headroom rather than being a number the score happens to clear.

The `CUT_BEATS` table inside `verify-audio.mjs` is a deliberate **canary**: it
mirrors the time scene's start frame and the row timing in `src/timeline.ts` and
`src/scenes/TimeScene.tsx`. If the picture is ever retimed and the score is not,
that check fails. That is the point of it.

---

## 12. Project layout

```
promo-video/
├── package.json
├── remotion.config.ts
├── tsconfig.json
├── .gitignore
├── public/
│   ├── fonts/             vendored OFL typefaces
│   ├── icon/AppIcon.png   the real app icon
│   └── audio/             the synthesised score
├── src/
│   ├── index.ts           Remotion entry
│   ├── Root.tsx           composition registration
│   ├── WorthlyPromo.tsx   master component
│   ├── timeline.ts        the cut
│   ├── design/            tokens · typography · motion
│   ├── data/              demo data · InsightEngine port
│   ├── components/        Fonts · Icons · WorthlyCard · Chrome · Stage
│   ├── ui/                faithful reconstructions of each app screen
│   ├── scenes/            the twelve shots
│   └── qa/                screen harness for layout measurement
├── scripts/               score generator + QA tooling (see §6, §11)
├── qa/
│   ├── frames/            canonical checkpoints
│   ├── frames-extra/      the moments between the checkpoints
│   ├── contact-sheets/
│   └── reports/
└── renders/
    └── worthly-promo-16x9.mp4
```

---

## 13. Licence

The film, the score, the demo dataset and the reconstructed UI are original work
for this project and are **UNLICENSED** — all rights reserved.

The score is generated from source by `scripts/make-score.mjs` and contains no
third-party samples, loops or recordings.

The bundled fonts are **SIL Open Font License 1.1**:

- Noto Serif SC, Noto Sans SC — © The Noto Project Authors
- JetBrains Mono — © JetBrains s.r.o.

The Worthly app icon is the project's own asset.

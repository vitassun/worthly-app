# Iteration 03 — First useful insights

## Goal

Turn accumulated check-ins into useful personal consumption feedback without pretending sparse data is certainty.

This iteration completes the MVP loop:

**want → decide → buy → revisit → learn**

No AI chat and no remote inference. Every insight is deterministic and derived only from the user's own recorded Worthly data.

## Deliverables

### 1. Insight engine

Add a local `InsightEngine` that uses the latest completed check-in per bought item.

Rules:
- only `bought` items can contribute satisfaction data
- latest valid stage wins per item: 90d > 30d > 7d
- passed / considering / archived-only records do not contribute satisfaction statistics
- never divide by zero or emit NaN / Infinity

### 2. Sparse-data protection

Do not produce a personalized conclusion from one or two purchases.

Thresholds:
- first snapshot + expectation/reality: at least **3** bought items with a completed check-in
- “mature” sample: latest check-in is **30 or 90 days**
- discount pattern: at least **2 mature items in each comparison group**
- category pattern: at least **3 mature items in the same category**
- long-term best / lowest: at least **3 mature items total**

The UI must clearly communicate when data is still too sparse.

### 3. Expectation / reality

Compare:
- purchase-time `desireScore`
- latest available satisfaction score

This is explicitly a comparison of **买前想要程度** vs **后来满意度**.

Do not claim desire score is a scientific predicted satisfaction score.

If the average gap is under 0.5 points, say the two are currently close rather than inventing a strong pattern.

### 4. Discount pattern

Use only mature evaluations that have both:
- valid `originalPrice`
- valid `paidPrice`

Compare:
- meaningful discount: `>= 20%`
- lighter / no meaningful discount: `< 20%`

Both groups need at least 2 mature items.

Important wording rule:
- describe an association in the user's recorded sample
- do **not** say the discount caused satisfaction or regret

### 5. Category pattern

A category only qualifies after at least 3 mature evaluations.

Show the qualified category with the highest current average satisfaction.

Do not render a category conclusion from 1–2 purchases.

### 6. Long-term memory

After 3 mature items exist, show the highest and lowest latest mature satisfaction scores.

This card must say that it uses 30 / 90-day data and can change with future reviews.

### 7. Insights UI

Replace the Iteration 02 placeholder with:
- editorial header
- current satisfaction snapshot when eligible
- expectation/reality card
- discount card when eligible
- category card when eligible
- long-term memory card when eligible
- data-confidence / progress card

Design constraints remain locked:
- warm cream
- one orange accent
- one black emphasis card maximum in the Insights feed
- no chart grid
- no gradients
- no decorative shadow

### 8. Home insight teaser

When a first real insight exists:
- show one black editorial teaser card on Home
- tapping it switches to the Insights tab
- do not push a duplicate Insights screen inside the Home navigation stack

This requires `TabView(selection:)` with an explicit root-tab selection.

## Verification scenarios

Codex must explicitly inspect / test these cases:

1. 0 evaluated purchases → no personalized conclusion.
2. 2 evaluated purchases → still no personalized conclusion.
3. 3 evaluated purchases → snapshot + expectation/reality appear.
4. An item with 7d + 30d check-ins uses 30d, not both.
5. An item with 7d + 30d + 90d uses 90d.
6. A passed item never affects satisfaction averages.
7. A considering item never affects satisfaction averages.
8. Discount card remains hidden with 1 vs 3 group sizes.
9. Discount card appears with at least 2 vs 2 mature samples.
10. Invalid price pairs (paid > original, zero / missing values) are excluded from discount analysis.
11. Category card remains hidden at 2 mature items in one category.
12. Category card appears at 3 mature items in one category.
13. Best / lowest long-term card remains hidden before 3 mature items.
14. Home insight teaser switches the selected root tab to Insights.
15. UI shows no NaN / Infinity / blank metric values.

## Explicitly out of scope

Do not add:
- AI-generated copy
- LLM calls
- backend
- CloudKit
- social comparison
- budget scoring
- financial advice
- a universal “good/bad spender” score
- subscription / paywall changes
- analytics SDK

## Commit

Preferred commit message:

`feat: add first personal consumption insights`

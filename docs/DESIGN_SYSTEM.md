# Worthly — Editorial iOS Design System v0.1

This document translates the provided **editorial-style-design** skill into a usable iOS product system.

The app should feel like:

> **editorial magazine × native iOS interaction × personal consumption memory**

It must not feel like a budgeting dashboard or a marketing landing page.

---

## 1. Palette

### Warm editorial track (default)

- Background: `#EFEAE0`
- Secondary surface: `#E5DFD2`
- Primary text: `#1A1A1A`
- Secondary text: `#5C5852`
- Accent: `#CD6F47`

### Dark editorial track (rare emphasis)

- Near black: `#0A0A0A`
- White: `#FFFFFF`
- Secondary light text: `#A0A0A0`

Hard rule:
**There is only one chromatic accent: orange.**

---

## 2. Typography

### Display / editorial headings

Use iOS serif design:
- large title: serif / bold
- section statement: serif / semibold or bold

Chinese headings must receive generous line spacing.

### UI / body

Use native system sans serif for:
- body copy
- buttons
- labels
- forms
- navigation

### Data / overline

Use monospaced design for:
- dates
- percentages
- compact price metadata
- small analytic labels

---

## 3. Layout principles

- generous whitespace
- one visual idea per section
- avoid card-everything design
- cards are for grouping, not decoration
- no gradients
- no glassmorphism
- no decorative shadows
- no rainbow category palette
- no marketing emoji
- use black feature cards sparingly (max one dominant black block on a normal screen)

Spacing baseline:
- page horizontal: 20pt
- major section gap: 28–36pt
- card internal padding: 18–22pt
- control touch target: ≥44pt

Corner radii:
- small: 14pt
- regular: 18pt
- large: 24pt

---

## 4. Color usage

Orange is reserved for:
- selected state
- primary action
- one keyword in an editorial heading
- one decisive number / percentage
- focus and interactive emphasis

Do not color every price and icon orange.

---

## 5. Symbols

Prefer native SF Symbols for functional controls.

For decorative/editorial marks, favor quiet geometry:
- `◎`
- `◈`
- `◐`
- `⇄`
- `§`
- `⊞`

Avoid marketing emoji such as rockets, fire, sparkle, heart-eyes, targets, etc.

---

## 6. Home screen tone

Home should open like an editorial page, not analytics software.

Example composition:

```text
THURSDAY · SEP 25

最近有什么
让你觉得「值得」？

2 件该回来看看了

[ due review card ]

还在考虑
[ item ]
[ item ]
```

---

## 7. Price presentation

When original price exists:

```text
ORIGINAL
¥1,099

¥639
到手价

-42% · SAVED ¥460
```

Use strikethrough only where it remains readable and does not feel like e-commerce promotion.

Worthly is documenting the user's decision, not trying to sell the product.

---

## 8. Insight writing style

Good:
> 你买衣服时期待很高，30 天后的满意度通常更低。

Good:
> 折扣让你更容易下单，但不一定让你更满意。

Bad:
> 你总是在乱花钱。

Bad:
> AI 发现你有严重冲动消费问题。

Insights should be:
- specific
- grounded
- calm
- non-diagnostic
- non-judgmental

---

## 9. Native iOS behavior wins over visual styling

Even with editorial visuals:
- preserve standard back gestures
- use predictable sheets
- support Dynamic Type
- support VoiceOver labels
- support Reduce Motion
- use ≥44pt touch targets
- keep forms legible
- do not hide essential actions behind hover-like effects

---

## 10. Component primitives

Initial primitives:
- `WorthlyBackground`
- `WorthlySurface`
- `WorthlyAccent`
- editorial overline
- editorial display title
- status chip
- price stack
- item row
- insight statement card
- primary button

Do not build a giant component library before the flows stabilize.

# Worthly — Product & Information Architecture v0.1

## 1. Product definition

**Worthly（值不值）** is a personal consumption-memory app.

It answers a different question from a budgeting app:

> **“What kinds of purchases are actually worth it for me?”**

The product records the gap between **expected value before purchase** and **experienced value after purchase**.

### Target user

- individual consumers
- young users / young adults
- not designed specifically for AI or internet-industry workers
- wants to spend more intentionally without strict budgeting
- cares about emotional value as well as rational value

### Product personality

Calm, reflective, concise, non-judgmental.

Worthly should not shame users for spending. It should help them recognize their own patterns.

---

## 2. Core loop

```text
CAPTURE
  ↓
DECIDE
  ↓
BUY / PASS
  ↓
REVISIT
  ↓
LEARN
  ↺
```

1. **Capture** — save something the user wants.
2. **Decide** — record why they want it and how much they expect to value it.
3. **Buy / Pass** — record the actual decision and paid price.
4. **Revisit** — 7 / 30 / 90-day satisfaction check-ins.
5. **Learn** — transform repeated decisions into personal consumption insights.

The retention mechanism is accumulated personal history, not streaks.

---

## 3. Primary data objects

### WorthlyItem

A product or experience the user considered purchasing.

MVP fields:
- `id`
- `name`
- `category`
- `sourceNote` (optional)
- `createdAt`
- `state`: considering / bought / passed / archived
- `reason`: need / experience / reward / trend / mood / discount / appearance / other
- `desireScore`: 1–10
- `expectedUsage`: daily / weekly / occasionally / unsure
- `originalPrice` (optional)
- `paidPrice` (optional)
- `purchaseDate` (optional)

### CheckIn

A later evaluation linked to a bought item.

MVP fields:
- `item`
- `stage`: 7d / 30d / 90d
- `satisfactionScore`: 1–10
- `usageFrequency`
- `note` (optional)
- `createdAt`

### Insight

Initially computed at runtime; do not persist until necessary.

Examples:
- discounted purchases vs long-term satisfaction
- expectation vs actual satisfaction by category
- best long-term purchase categories
- high-desire / low-satisfaction patterns

---

## 4. Information architecture

Use **4 primary tabs + 1 global Add action**.

### 01 — 首页 / Home

Question answered:
> **“What needs my attention today?”**

Sections:
- editorial date overline
- one large personalized prompt
- due-for-review items
- still-considering items
- recently bought items
- one small insight teaser when enough data exists

Primary CTA:
- `＋ 记下一件`

Home is not a dashboard. Avoid dense grids and financial widgets.

### 02 — 记录 / Things

The complete consumption memory.

Primary filters:
- Considering
- Bought
- Passed
- Archived

Optional secondary filter:
- Category

Each item row prioritizes:
- name
- state
- one key price
- one meaningful signal (e.g. `30d 8/10`)

### 03 — 洞察 / Insights

Question answered:
> **“What has Worthly learned about me?”**

MVP insight blocks:
- expectation vs reality
- discount effect
- category patterns
- most worthwhile purchases
- least worthwhile purchases

Design rule:
**one strong insight per section**, not a dashboard full of charts.

### 04 — 我的 / Me

Contains:
- subscription
- notification preferences
- currency
- language
- data export / delete
- privacy
- appearance
- about

---

## 5. Global Add flow

The first capture must feel lightweight.

### Step 1 — Item

Required:
- name

Optional:
- category
- original price
- expected / already-paid price
- source note

### Step 2 — Motivation

One-tap reasons:
- 需要 / Need
- 提升体验 / Better experience
- 奖励自己 / Reward myself
- 被种草 / Influenced
- 情绪 / Mood
- 折扣 / Discount
- 好看 / Appearance
- 其他 / Other

Then:
- desire score: 1–10
- expected usage

### Step 3 — Save

Default state:
- Considering

Allow:
- “已经买了” → record paid price + purchase date immediately

Target normal completion time:
**under 20 seconds.**

---

## 6. Item detail = a timeline

Do not render the item detail as a database form.

### BEFORE
- item name
- category
- why I wanted it
- desire score
- original price (optional)

### PURCHASE
- bought / passed status
- paid price
- purchase date
- discount amount / percent when valid

### AFTER
- 7-day review
- 30-day review
- 90-day review

### RESULT
- current satisfaction
- compact Worthly interpretation grounded only in recorded data

Example:
> “折扣带来的兴奋，比商品本身持续得更久吗？”

Avoid pretending certainty from sparse data.

---

## 7. Price model

### MVP fields

- **Original price / 原价** — optional
- **Paid price / 到手价** — optional until bought

### Derived values

Only when both values are present and valid:
- `savedAmount = max(originalPrice - paidPrice, 0)`
- `discountPercent = savedAmount / originalPrice`

Do not label a higher paid price as “negative savings”. Just omit the discount result.

### Future fields

Not MVP:
- coupon
- points
- cashback
- resale price
- ownership cost
- cost per day / use

---

## 8. Lifecycle

```text
Considering
   ├──→ Bought
   ├──→ Passed
   └──→ Archived

Bought
   ├──→ 7d Check-in
   ├──→ 30d Check-in
   ├──→ 90d Check-in
   └──→ Archived / Sold (future)
```

Important product rule:
**Passed is valuable data.**
A decision not to buy remains part of the user's consumption memory.

---

## 9. MVP screen families

Keep v1 within these ten families:

1. Launch / onboarding
2. Home
3. Add item
4. Things list
5. Item detail
6. Mark as bought
7. Check-in
8. Insights
9. Paywall
10. Me / Settings

---

## 10. Explicitly not in MVP

Do not add yet:
- social feed
- following / friends
- AI chat
- bank sync
- complex budgeting
- receipt accounting
- resale marketplace
- detailed coupon accounting
- web app
- dozens of charts
- gamified streak pressure

---

## 11. Product gate

Every feature must pass:

> **Does this help the user remember, revisit, or learn from a consumption decision?**

If not, it probably does not belong in Worthly.

# Worthly — AGENTS.md

This file is the operating contract for every agent, reviewer, and implementor working on **Worthly / 值不值**.

It defines the product, architecture, invariants, implementation rules, current baseline, and roadmap.
Do not treat it as a loose suggestion.

Instruction precedence:

1. explicit user instruction for the current task
2. current iteration/task specification
3. this `AGENTS.md`
4. `docs/PROJECT_FOUNDATION.md`
5. `docs/DESIGN_SYSTEM.md`
6. `docs/MVP_ROADMAP.md`
7. older handoff notes

If a task requires changing a locked product or architecture rule, call that out explicitly instead of silently rewriting the system.

---

# 1. Product definition

**Worthly（值不值）** is a local-first personal consumption-memory app.

It is **not** a budgeting app.

Its core question is:

> What kinds of purchases are actually worth it for me?

Worthly records the gap between:

- what the user wanted before buying
- what the user actually experienced after buying

The app should help users:

- remember consumption decisions
- revisit them later
- decide more intentionally
- compare expectation with reality
- learn personal patterns over time

Product tone:

- calm
- reflective
- concise
- non-judgmental
- non-diagnostic

Never shame the user for spending.

Every feature must pass this product gate:

> Does this help the user remember, revisit, decide, or learn from a consumption decision?

---

# 2. Core product loop

Canonical loop:

```text
CAPTURE
  ↓
WAIT / REVISIT
  ↓
DECIDE
  ↓
BUY / PASS
  ↓
7d / 30d / 90d CHECK-INS
  ↓
LEARN
  ↺
```

In product language:

```text
want
→ remember it
→ come back later
→ buy or pass
→ revisit after use
→ learn what is actually worth buying
```

Retention comes from accumulated personal history, not streak pressure or gamification.

---

# 3. Current technical stack

Locked unless explicitly changed later:

- Native iOS
- Swift
- SwiftUI
- SwiftData
- iOS 17+
- Xcode project: `Worthly.xcodeproj`
- shared scheme: `Worthly`
- XCTest
- GitHub Actions CI

There is currently no:

- backend
- CloudKit
- auth/account system
- remote database
- analytics SDK
- ad SDK
- AI/LLM inference
- third-party UI framework
- bank connection
- web app

The app remains local-first.

---

# 4. Repository architecture

Canonical structure:

```text
Worthly/
├── App/
│   ├── WorthlyApp.swift
│   └── RootTabView.swift
│
├── Core/
│   ├── DesignSystem/
│   │   └── WorthlyTheme.swift
│   ├── Models/
│   │   ├── WorthlyItem.swift
│   │   └── CheckIn.swift
│   ├── Insights/
│   │   └── InsightEngine.swift
│   ├── Services/
│   │   ├── CheckInReminderService.swift
│   │   ├── CheckInRecordService.swift
│   │   └── WorthlyDataDeletion.swift
│   └── Utilities/
│       ├── CheckInSchedule.swift
│       ├── CheckInNotificationRoute.swift
│       ├── DecisionReviewSchedule.swift
│       ├── ItemLibraryQuery.swift
│       ├── PriceFormatter.swift
│       ├── PriceInputParser.swift
│       ├── WorthlyDataExporter.swift
│       └── WorthlyReminderIdentifiers.swift
│
├── Features/
│   ├── AddItem/
│   ├── CheckIn/
│   ├── Home/
│   ├── Insights/
│   ├── ItemDetail/
│   ├── Settings/
│   └── Things/
│
├── Assets.xcassets/
└── PrivacyInfo.xcprivacy

WorthlyTests/
├── CheckInScheduleTests.swift
├── DecisionReviewScheduleTests.swift
├── InsightEngineTests.swift
├── ItemLibraryQueryTests.swift
├── NotificationAndDeletionTests.swift
└── PriceInputParserAndExportTests.swift

docs/
├── PROJECT_FOUNDATION.md
├── DESIGN_SYSTEM.md
├── MVP_ROADMAP.md
└── TESTFLIGHT_CHECKLIST.md

handoff/
├── LAST_CODEX_REPORT.md
├── CODEX_PROMPT.md
└── FEEDBACK_TEMPLATE.md

.github/
└── workflows/
    └── ios-build.yml
```

New files should respect these responsibilities.

---

# 5. Architectural responsibilities

## 5.1 App layer

`Worthly/App/`

Owns:

- app entry
- root tab composition
- global sheets
- global navigation routing
- notification route consumption

Important invariant:

`RootTabView` owns the global Add Item sheet.

Feature views should request Add through callbacks rather than creating duplicate global Add flows.

---

## 5.2 Core / Models

`Worthly/Core/Models/`

Contains persisted SwiftData entities only.

Current persistent models:

- `WorthlyItem`
- `CheckIn`

Do not add persisted fields casually.

Any schema change requires:

1. explicit product reason
2. migration consideration
3. compatibility review
4. tests
5. documentation update

Prefer computed behavior over schema expansion where possible.

---

## 5.3 Core / Utilities

`Worthly/Core/Utilities/`

Use for deterministic pure logic such as:

- scheduling
- filtering/sorting
- parsing
- formatting
- route interpretation
- identifiers

Examples:

- `CheckInSchedule`
- `ItemLibraryQuery`
- `PriceInputParser`

Rules:

- no SwiftUI state
- no hidden side effects
- deterministic behavior where possible
- directly unit-testable

---

## 5.4 Core / Services

`Worthly/Core/Services/`

Use for system side effects such as:

- local notifications
- destructive data operations
- persistence-related actions

Keep services narrow.

Do not bury pure business rules inside service code if they can live in Utilities.

---

## 5.5 Core / Insights

`Worthly/Core/Insights/`

`InsightEngine` is deterministic local analytics.

It is not AI.

It must derive conclusions only from the user's stored Worthly data.

Do not add remote inference, LLM-generated conclusions, or diagnostic language without a new explicit product decision.

---

## 5.6 Feature layer

`Worthly/Features/`

Feature folders own screen-specific SwiftUI.

Feature views may coordinate:

- local screen state
- feature navigation
- model edits
- calls to Core utilities/services

Do not duplicate business logic already implemented in Core.

---

# 6. Data model

## 6.1 WorthlyItem

Represents a product or experience the user considered purchasing.

Important fields:

- `id`
- `name`
- `category`
- `sourceNote`
- `createdAt`
- `stateRawValue`
- `reasonRawValue`
- `expectedUsageRawValue`
- `desireScore`
- `originalPrice`
- `paidPrice`
- `purchaseDate`
- `decisionDate`
- `checkIns`

Logical states:

```text
considering
bought
passed
archived
```

Purchase reasons:

```text
need
experience
reward
trend
mood
discount
appearance
other
```

Expected usage:

```text
daily
weekly
occasionally
unsure
```

---

## 6.2 CheckIn

A later evaluation linked to a bought item.

Important fields:

- linked item
- stage: 7 / 30 / 90 days
- satisfaction score: 1–10
- usage frequency
- optional note
- createdAt

`WorthlyItem -> CheckIn` uses cascade delete.

Do not manually duplicate relationship cleanup unless required.

---

## 6.3 Insight

Insights are computed at runtime.

They are not persisted.

Do not introduce a persistent `Insight` model unless there is a real product need.

---

# 7. Lifecycle semantics

Current lifecycle:

```text
Considering
   ├──→ Bought
   └──→ Passed

Bought
   ├──→ 7d Check-in
   ├──→ 30d Check-in
   └──→ 90d Check-in
```

`Passed` remains valuable history.

## Archive warning

`ItemState.archived` exists in the model, but archive/unarchive product behavior is intentionally not active.

Do not casually change bought/passed items into `.archived`.

Reason:

- current `state` carries lifecycle meaning
- replacing `.bought` / `.passed` destroys that meaning
- Insights/history depend on the original lifecycle state

Archive requires a separate product/data-model decision.

---

# 8. Price architecture

Persisted MVP fields:

- original price: optional
- paid price: optional until bought

Derived values:

- saved amount
- discount percent

Only show discount output when values are valid.

If:

```text
paidPrice > originalPrice
```

do not display “negative savings”.

Do not add coupon/cashback/points/resale accounting without a new iteration.

---

# 9. Check-in scheduling invariants

Only `.bought` items may have pending post-purchase check-ins.

Stages are sequential:

```text
7d → 30d → 90d
```

Rules:

- 100 days old with no check-ins still starts at 7d
- once 7d is complete and 30d is overdue, 30d becomes immediately due
- once 30d is complete and 90d is overdue, 90d becomes due
- completed stages never repeat while their saved review exists; confirming deletion of that review makes the stage pending again
- considering / passed / archived items are excluded
- `purchaseDate` is the primary anchor
- existing `decisionDate` fallback must remain unless explicitly changed

A staged review is eligible on its due calendar day, including the morning reminder. Its stored purchase anchor and computed `dueDate` retain their original time.

Never skip stages simply because an item is old.

## Free-form reflections (随时回访)

In addition to the staged reviews, a `.bought` item may hold any number of
free-form reflections recorded on any day.

- stored as `stageDays == 0`; `CheckIn.isAdHoc` is the canonical test
- `CheckInSchedule.adHocStageDays` is the only place that literal lives
- a free-form reflection never completes or replaces a 7 / 30 / 90 stage
- it never changes `nextPendingStage` and never schedules or cancels a reminder
- it is excluded from `InsightEngine` satisfaction data
- `CheckInSchedule.timeline(for:)` is the canonical chronological display order
- several reflections per day are allowed and are never deduplicated

---

# 10. InsightEngine invariants

## Eligibility

Only `.bought` items contribute satisfaction data.

Exclude:

- considering
- passed
- archived-only records

from satisfaction averages.

## Latest stage wins

Each purchase contributes at most one current evaluation:

```text
90d > 30d > 7d
```

Never count multiple stages from one purchase as separate purchases.

Free-form reflections (`CheckIn.isAdHoc`) are never an evaluation.

## Sparse-data protection

Current thresholds:

- first satisfaction snapshot / expectation-reality:
  at least 3 evaluated bought items

- mature evaluation:
  latest stage is 30d or 90d

- discount comparison:
  at least 2 mature items in each comparison group

- category insight:
  at least 3 mature items in a category

- long-term highest/lowest:
  at least 3 mature items total

Do not reduce thresholds simply to show more insight cards.

## Wording

Describe association, not causality.

Never emit:

- NaN
- Infinity
- blank metrics
- unsupported certainty

---

# 11. Notification architecture

Worthly currently uses local notifications only.

No remote push backend exists.

Current reminders are for bought-item 7 / 30 / 90 day reviews.

Rules:

- reminders are opt-in
- permission denial does not break the in-app queue
- notification payload contains item ID + stage
- stale/completed routes must not create duplicate check-ins
- deleted items fall back safely
- pending routes may wait for SwiftData readiness
- foreground notifications use system banner/sound

Queued notification additions are serialized and invalidated per item or globally after cancellation. Routes wait while onboarding or an existing root sheet is active. Old delivered routes for a future or non-current stage open detail instead of a check-in form.

Single-item deletion order:

1. delete from model context
2. save
3. only after save succeeds, cancel that item's 7/30/90 pending + delivered reminders
4. dismiss
5. on failure, rollback and stay on screen

Never cancel unrelated Worthly reminders.

---

# 12. Data ownership and privacy

Current product is local-first.

Principles:

- user records stay on-device
- JSON export is user initiated
- export uses the system share sheet
- no Worthly server receives consumption data
- no analytics/tracking SDK
- no ads

`PrivacyInfo.xcprivacy` must remain truthful and minimal.

Never commit:

- Apple signing credentials
- provisioning profiles
- `.p8`
- `.p12`
- certificates
- API keys
- secrets

---

# 13. Information architecture

Worthly uses four primary tabs plus one global Add flow.

## Home / 首页

Question:

> What needs my attention today?

Current responsibilities:

- editorial header/date
- Add Item CTA
- bought-item due reviews
- considering items due for a decision revisit
- insight teaser
- still-considering items
- recently bought items

Due review and decision sections preview at most three cards. When more are waiting, their `查看全部` entries open complete live queues. Due states refresh on foreground return and while visible.

Home must not become a dense dashboard.

## Things / 记录

The full consumption-memory library.

Current behavior:

- defaults to all records
- local search
- state filter
- category filter
- deterministic sorting
- result count
- empty-library state
- no-results state
- clear filters
- Add Item from toolbar
- item detail navigation

Search currently matches:

- name
- category
- source note
- reason display name
- state display name

Filters combine rather than replace each other.

## Insights / 洞察

Question:

> What has Worthly learned about me?

Current blocks:

- satisfaction snapshot
- expectation vs later satisfaction
- discount pattern
- category pattern
- long-term highest/lowest purchase memory
- data-confidence/progress state

One strong insight per section; do not build a chart-heavy dashboard.

## Me / 我的

Current responsibilities:

- JSON export
- delete all
- local reminder toggle
- currency display
- language display
- privacy note
- app version/build

Do not add settings that are not backed by real behavior.

---

# 14. Global Add flow

The Add flow must remain lightweight.

Target:

**normal completion under ~20 seconds**

Capture includes:

- name
- category
- source note
- reason
- desire score
- expected usage
- original price
- already-bought option
- paid price when relevant
- purchase date when already bought (any past day, never the future)

Default state:

```text
considering
```

If already bought, record purchase details and enter the bought lifecycle.

---

# 15. Item Detail architecture

Item Detail should read as a timeline, not a database form.

Canonical layout:

```text
BEFORE
PURCHASE
AFTER
```

## BEFORE

- item name
- category
- reason
- desire score
- expected usage
- original price
- source note

## PURCHASE

- lifecycle state
- paid price
- purchase date
- valid discount display

## AFTER

For bought:

- 7d
- 30d
- 90d reviews
- any number of free-form `随时回访` reflections, listed chronologically
- an always-available `记录现在的感觉` entry point

For passed:

- keep the decision as memory
- do not pretend passed records contribute satisfaction analytics

Single-item destructive delete belongs here and requires confirmation.

Saved staged reviews and any-day reflections can be edited or confirm-deleted from AFTER. Edits change satisfaction, usage and note only, preserving identity, original date and stage. A new feeling uses a new reflection. Staged deletion recomputes pending stages and insights, and refreshes only that item's reminders after a successful save; any-day edits/deletion have no reminder side effects. Failed writes roll back and stay on screen.

---

# 16. Design system — non-negotiable

Worthly should feel like:

> editorial magazine × native iOS interaction × personal consumption memory

Palette — every colour resolves per appearance in `WorthlyTheme.swift`:

| role | light | dark |
| --- | --- | --- |
| background | `#EFEAE0` | `#17140F` |
| secondary surface | `#E5DFD2` | `#221E17` |
| primary text | `#1A1A1A` | `#EFEAE0` |
| secondary text | `#5C5852` | `#A69D8F` |
| accent | `#CD6F47` | `#E0895E` |
| emphasis | `#0A0A0A` | `#F5F0E5` |

Only one chromatic accent: orange.

The light values are the original locked palette and must not drift. The dark values invert the same relationships rather than introducing a new look: `background` and `text` deliberately swap roles, which is what makes primary buttons, selected chips and emphasis cards invert correctly without any per-view work. The dark accent is lifted because the light orange does not carry enough contrast on a dark ground. `emphasis` is the rare high-contrast card; it flips to a light surface in dark mode, because a near-black card on a dark page is invisible.

Do not add a third appearance, a second accent colour, or any colour literal outside `WorthlyTheme`. Do not reintroduce a light-only declaration: the app follows the system appearance, and every surface must stay readable in both.

Typography:

- serif display headings
- native system sans body/control text
- monospaced small metadata where appropriate

Layout:

- generous whitespace
- one visual idea per section
- page horizontal padding around 20pt
- major section gap around 28–36pt
- card padding around 18–22pt
- touch target >= 44pt
- corner radii around 14 / 18 / 24pt

Forbidden:

- gradients
- glassmorphism
- decorative shadows
- rainbow category colors
- marketing emoji
- chart-grid dashboards
- excessive card nesting

Black emphasis cards should be rare.

Native iOS behavior wins over decorative styling.

---

# 17. Accessibility

Preserve:

- Dynamic Type

- VoiceOver labels

- text/icon selected states, not color alone

- >= 44pt controls

- readable wrapping

- Reduce Motion where custom motion exists

- native back behavior

- predictable sheets

- correct destructive semantics

Do not sacrifice accessibility for visual polish.

---

# 18. Testing architecture

Native test target:

```text
WorthlyTests
```

Current test families:

- `CheckInScheduleTests`
- `DecisionReviewScheduleTests`
- `InsightEngineTests`
- `ItemLibraryQueryTests`
- `NotificationAndDeletionTests`
- `PriceInputParserAndExportTests`

New deterministic Core behavior should normally have focused unit tests.

Never place test sources in the app target.

Never leave new app source files out of the app target.

Always verify target membership after adding files.

---

# 19. CI contract

Do not weaken the GitHub Actions workflow.

Required stages:

1. Debug simulator build
2. XCTest
3. Release simulator build

These three stages are required and must run on every push to `main` and every pull request.

After them the workflow also builds the app for the `iphoneos` SDK with signing disabled and uploads an unsigned IPA as the `Worthly-unsigned-ipa` artifact. This stage is additive: it exists so a build can be sideloaded onto a physical device without an Apple Developer account. It never replaces or shortens the three gates above. Do not remove it, and do not move it ahead of them.

Static inspection alone is not enough.

If local Xcode is unavailable:

- perform static checks
- commit
- use GitHub Actions as runtime verification
- do not claim local simulator/device verification

Always run:

```bash
git diff --check
```

before handoff.

---

# 20. Current authoritative state

GitHub `main` is the single source of truth.

Current verified App baseline (v0.2.0 / build 2):

```text
f4932fa2ba7b570e3a21a548408e846598d204f6
```

Commit:

```text
fix: restore review values when saving corrections fails
```

Latest verified GitHub Actions gate:

```text
iOS Build and Tests #24 — run 37217081979
```

Status:

- Debug Build: PASS
- XCTest: PASS (63 tests, 0 failures)
- Release Build: PASS
- Unsigned device app + IPA packaging: PASS (artifact `Worthly-unsigned-ipa`, verified arm64 / `iPhoneOS`, no `UIUserInterfaceStyle` override so the app follows the system appearance)

Do not rely on an old Work/agent filesystem as project storage.

When the baseline changes, update this section or the handoff file.

---

# 21. Delivered roadmap

## Iteration 00 — Foundation

Delivered:

- SwiftUI / SwiftData foundation
- 4-tab shell
- Add Item
- Things baseline
- Item Detail baseline
- docs
- CI baseline

Key commit:

```text
1428e41c74dfae3221947cd4b0916db2ece700be
```

## Iteration 01 — Decide & Edit

Delivered:

- edit records
- considering → bought / passed
- paid price
- purchase date
- decision date
- price validation

Key commit:

```text
fa911b7e9dbd4419485d514ba1dada7e3710a076
```

## Iteration 02 — Check-ins

Delivered:

- 7 / 30 / 90 schedule
- sequential overdue handling
- Home due queue
- check-in flow
- satisfaction / usage / note
- Item Detail history
- local reminders

Key commit:

```text
e7c1bbd58b52c673864cb01082d04a90c791d489
```

## Iteration 03 — First useful insights

Delivered:

- deterministic `InsightEngine`
- latest-stage-per-purchase logic
- sparse-data protection
- expectation vs reality
- discount comparison
- category pattern
- long-term high/low memory
- Home teaser → Insights

Key commit:

```text
677254fee00761c79f8b3db560ca4d8659fad150
```

## Iteration 04 — Retention / polish foundation

Delivered:

- onboarding
- export
- delete all
- reminder settings
- notification deep-link polish
- empty-state polish
- accessibility improvements
- version display
- privacy copy

Key commit:

```text
7cfc41eec8d16739bb6aebcd447ca105ac89e371
```

## Iteration 05 — TestFlight hardening

Delivered:

- native XCTest target
- Debug/XCTest/Release CI gate
- privacy manifest
- version/build settings
- AppIcon structure
- notification/export/deletion tests
- proven Release simulator build

Key implementation lineage:

```text
f1f8b508d41e1562ab10ddf400ce0caf9d390ac4
f47d4d71124f1472a29d43825f00bbcd28af55ed
```

## Iteration 06 — Memory Library

Delivered:

- all-record library
- local search
- state/category filters
- deterministic sorting
- result count / clear filters
- Add from Things
- single-item delete
- item-specific reminder cleanup
- `ItemLibraryQuery`
- query tests

Feature commit:

```text
7cd8cdd18de0cd1332c702d84b2809f865107a6c
```

Final verified baseline:

```text
4a172e62da8f6584799803d734b28688530aa52e
```

## Iteration 07 — Decision Revisit

Delivered:

- pure `DecisionReviewSchedule` (7-day in-app revisit for `considering` items)
- `DecisionReviewEntry` with deterministic due-date / creation-date / identifier ordering
- Home `还想买吗？` section
- due revisits removed from the ordinary `还在考虑` list
- tap-through to the existing Item Detail decision flow
- focused schedule tests
- no schema, notification, or `InsightEngine` change

Feature commit:

```text
3ee13af95647f79ac644541d5133e4fea9696b28
```

Final verified baseline:

```text
f1c63f20778299cb475c5ae625e326a900eb3c23
```

## Feature batch — Any-day reflections & Add flow polish

Delivered:

- free-form `随时回访` reflections: `CheckIn(stage: nil)` is stored as `stageDays == 0`
- `CheckIn.isAdHoc`, `CheckInSchedule.adHocStageDays`, `CheckInSchedule.timeline(for:)`
- Item Detail AFTER card: chronological reflection list plus an always-available `记录现在的感觉` entry
- Add flow: purchase date selectable when `已经买了`, never in the future
- Add / Edit: visible `它属于哪一类？` question above the category selector
- staged 7 / 30 / 90 sequencing, reminders, notification routing and `InsightEngine` semantics unchanged
- free-form reflections are excluded from satisfaction insights (see §9 / §10)
- focused tests for ad-hoc stage isolation, timeline ordering and insight exclusion
- no schema change, no migration, no new files

Feature commit:

```text
333c812c32f9dee45bdb07565b93d33ed49a909b
```

Final verified baseline:

```text
333c812c32f9dee45bdb07565b93d33ed49a909b
```

---

## Release batch — v0.2.0 experience polish

Delivered under the user's explicit App-and-promo task:

- edit and confirm-delete saved staged and any-day reflections, preserving stage/date/identity on edit
- complete live Home review and decision queues beyond the three-card preview
- calendar-day review availability, safe delayed/stale notification routing, serialized reminder invalidation
- no reminder side effects for any-day reflections
- keyboard dismissal/completion, native usage menu, wrapping notes, scalable choices and readable metadata
- scrolling export sheet, notification authorization progress and settings entry
- price edit precision and failed-review-save restoration
- 13 new regression cases, 63 total; no persistent-model or export-version change
- 82-second promo with current functional demonstrations and a real sampled piano arrangement

Implementation: `2edb6333b1609064924aebfba73a0daa3a3cd493`; verified corrective App baseline: `f4932fa2ba7b570e3a21a548408e846598d204f6`.
Later promo/handoff-only commits do not change this App source. See `docs/V0_2_0_RELEASE_NOTES.md`, `docs/V0_2_0_AUDIT_GUIDE.md` and the handoff report. Physical-device QA remains outstanding.

---

# 22. Concrete next roadmap

Do not implement future iterations automatically.
Each one still requires an explicit task.

## Iteration 08 — TestFlight runtime QA / release polish

Status:

**planned after Iteration 07**

Goal:

turn the CI-green build into a deliberately tested TestFlight candidate.

Focus:

- onboarding runtime pass
- Add / Edit / Buy / Pass pass
- 7 / 30 / 90 check-in pass
- foreground/background/terminated notification tap verification
- export verification
- single delete + delete-all verification
- largest Dynamic Type pass
- VoiceOver quick pass
- Reduce Motion pass
- final AppIcon decision
- signed archive handoff checklist
- App Store Connect metadata placeholders

This iteration should prioritize verification/fixes over new features.

## Iteration 09 — Lifecycle / archive semantics

Status:

**requires explicit product/data-model approval**

Goal:

resolve `archived` safely.

Before coding, decide whether archive becomes:

- separate metadata/flag
- a lifecycle layer
- a redesign of state representation

Potential requirements:

- migration plan
- schema versioning
- backward compatibility tests
- InsightEngine review
- export compatibility review

Do not implement quick `state = archived` behavior that destroys bought/passed meaning.

## Iteration 10 — Monetization foundation

Status:

**deferred until product validation**

Do not implement unless explicitly approved.

Possible later direction:

- 21–30 day trial
- monthly subscription
- annual subscription
- StoreKit 2
- native paywall
- restore purchases
- entitlement state

Monetization must not hold the user's own existing data hostage.

## Later directions

Only after the core loop is validated:

- iCloud sync
- share extension
- annual consumption report
- effective ownership cost
- resale / sold state
- richer ingestion
- screenshot-assisted capture
- expanded pattern analysis

These are not current MVP requirements.

---

# 23. Explicitly out of scope

Unless the active iteration requests them, do not add:

- social feed
- friends/following
- AI chat
- LLM analysis
- backend
- auth
- CloudKit
- bank sync
- complex budgeting
- receipt accounting
- resale marketplace
- coupon engine
- cashback accounting
- ads
- analytics SDK
- huge chart dashboards
- gamified streak pressure
- web app
- third-party UI libraries
- StoreKit/paywall

---

# 24. Implementation behavior

Before changing product behavior or UI, read:

- `docs/PROJECT_FOUNDATION.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/MVP_ROADMAP.md`
- `ITERATION.md`
- `handoff/LAST_CODEX_REPORT.md`

Then inspect the actual implementation.

Never implement from documentation alone if code has moved ahead.

Rules:

- make the smallest change that satisfies the task
- avoid unrelated refactors
- preserve behavior unless explicitly changed
- do not rebuild the Xcode project
- do not silently rewrite architecture
- do not lower test thresholds just to make CI green
- fix business logic when business logic is wrong
- fix test expectations when the test is wrong
- document deviations
- keep production behavior and test intent aligned

---

# 25. Git and source-of-truth workflow

GitHub `main` is authoritative.

Agent workspaces are temporary.

Before implementation:

1. fetch origin
2. confirm expected baseline SHA
3. stop on baseline mismatch
4. inspect working tree
5. require a clean tree unless the task explicitly includes existing changes

After implementation:

1. run static checks
2. run Xcode tests if available
3. update docs/handoff when needed
4. commit
5. push once if credentials exist
6. verify GitHub Actions

If push credentials are unavailable, export both:

```text
worthly-iteration-XX.bundle
worthly-iteration-XX-full-source.zip
```

The bundle carries Git history.

The ZIP is a complete source fallback.

Do not treat an agent-local workspace as durable storage.

---

# 26. Handoff report contract

Update:

```text
handoff/LAST_CODEX_REPORT.md
```

at the end of implementation runs.

Recommended structure:

```text
# LAST CODEX REPORT

## RESULT
PASS / PARTIAL / BLOCKED

## BASELINE
- expected SHA:
- actual SHA:

## BUILD
- Debug:
- XCTest:
- Release:

## CHANGES
- ...

## TARGET MEMBERSHIP
- app sources:
- test sources:

## SCHEMA
- changed / unchanged

## DEVIATIONS
- None / ...

## BLOCKERS
- None / ...

## COMMIT
- SHA:
- message:

## PUSH
- success / failed once / not attempted

## ARTIFACTS
- bundle:
- full-source ZIP:

## NEXT
- ...
```

Never claim verification that did not actually run.

---

# 27. Definition of done

A normal iteration is done only when:

- requested behavior exists
- architecture rules are preserved
- target membership is correct
- deterministic logic has meaningful tests
- `git diff --check` passes
- accidental schema changes are absent
- docs/handoff are updated where needed
- changes are committed
- Debug CI passes
- XCTest passes
- Release CI passes

If not, report `PARTIAL` or `BLOCKED`.

---

# 28. Final product rule

Worthly is about **memory and reflection**, not financial discipline.

Protect:

- lightweight capture
- calm revisiting
- meaningful history
- conservative insight
- user ownership of data
- native iOS interaction
- editorial restraint

Do not add complexity faster than the product earns it.

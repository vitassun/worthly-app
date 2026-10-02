# LAST CODEX REPORT

## RESULT

PASS — CI run #21 green on `333c812`. Debug build, XCTest (50 tests, 0 failures), Release build and
the unsigned IPA all passed on GitHub Actions. No local Xcode was available (Windows host).

## BASELINE

- expected SHA: `a022489b9797e37867473c7ab0611fa83dbfa9df`
- actual SHA: `a022489b9797e37867473c7ab0611fa83dbfa9df` (matched before editing; tree clean)

## BUILD

All results from GitHub Actions "iOS Build and Tests" #21, not from a local build:

- Debug: PASS (iOS Simulator)
- XCTest: PASS — 50 tests, 0 failures (44 existing + 6 new)
- Release: PASS (iOS Simulator)
- Unsigned device app + IPA packaging: PASS (artifact `Worthly-unsigned-ipa`)

## CHANGES

Three requested product changes. No new files; `Worthly.xcodeproj` untouched.

### 1. Add flow can record a real purchase date

`Worthly/Features/AddItem/AddItemView.swift`

- The Add flow hardcoded `purchaseDate: .now` and had no date picker at all, so an item
  marked `已经买了` could only ever be dated today.
- Added `@State private var purchaseDate: Date = .now`, a
  `DatePicker("购买日期", selection: $purchaseDate, in: ...Date.now, displayedComponents: .date)`
  inside the existing `if alreadyBought` block, and `purchaseDate: alreadyBought ? purchaseDate : nil`
  in `save()`. `decisionDate` is still `.now` (it records when the decision was entered, matching
  `PurchaseDecisionView`).

### 2. Any-day reflections (随时回访)

A bought item can now take a reflection on any day, in addition to the staged 7 / 30 / 90 reviews.
Stored as `stageDays == 0` so there is **no schema change and no migration**.

- `Worthly/Core/Utilities/CheckInSchedule.swift`
  - new documented constant `adHocStageDays = 0`
  - `completedStages(for:)` now subtracts it, so a free-form reflection can never satisfy a stage
  - new pure, testable `timeline(for:)` (createdAt → stageDays → id, deterministic)
- `Worthly/Core/Models/CheckIn.swift`
  - initializer takes `stage: CheckInStage?`; `stageDays = stage?.rawValue ?? CheckInSchedule.adHocStageDays`
  - new `isAdHoc`
- `Worthly/Features/CheckIn/CheckInView.swift`
  - `stage` is now `CheckInStage?`; for `nil` the form is submittable any day, any number of times,
    with no due-date gate and no duplicate guard; staged behaviour is unchanged
  - header / navigation title fall back to `ANYTIME · 随时回访`
- `Worthly/Features/ItemDetail/ItemDetailView.swift`
  - reflection list now uses `CheckInSchedule.timeline(for:)`; added `hasStagedCheckIns`
  - the AFTER card for bought items gained an always-available `ANYTIME · 记录现在的感觉` entry point
  - `checkInRow` labels a free-form reflection by date (`随时回访 · <date>`)

Unchanged on purpose: staged sequencing, `nextPendingStage`, the reminder service, notification
routing, and `InsightEngine` logic. `InsightEngine.latestCheckIn` already filters on
`CheckInStage(rawValue:) != nil`, so free-form reflections are ignored without an engine change.

### 3. The category selector now has a visible question

`Worthly/Features/AddItem/AddItemView.swift`, `Worthly/Features/ItemDetail/EditItemView.swift`

The category `Picker` sat bare in a `VStack` with only its own `分类` label. Both are now wrapped in
a labelled `VStack` with the visible heading `它属于哪一类？`, matching the existing
`为什么想买？` / `预计多久用一次？` sections. The Picker keeps its `分类` label for VoiceOver.

### Tests

New methods in existing test files only:

- `WorthlyTests/CheckInScheduleTests.swift`: `testAdHocCheckInDoesNotCompleteOrAdvanceAnyStage`,
  `testAdHocCheckInDoesNotBlockSequentialStages`, `testAdHocCheckInIsStoredAsZeroAndMarked`,
  `testTimelineOrdersChronologicallyThenByStage`
- `WorthlyTests/InsightEngineTests.swift`: `testAdHocReflectionsDoNotCreateEvaluations`,
  `testAdHocReflectionDoesNotOverrideLatestStage`; private `makeItem` helper gained a defaulted
  `adHocScores: [Int] = []` parameter

### Docs

`AGENTS.md` §9 (new "Free-form reflections" subsection), §10 (free-form reflections are never an
evaluation), §14 (purchase date selectable when already bought), §15 (AFTER section).

## TARGET MEMBERSHIP

- app sources: every edited file is an existing member of the `Worthly` target; no files added
- test sources: methods added to existing `WorthlyTests` files; no files added
- `Worthly.xcodeproj/project.pbxproj` not modified

## SCHEMA

- unchanged. No new stored properties. `CheckIn.stageDays` is already `Int`; free-form reflections
  use `0`, which the stage enum cannot represent.

## DEVIATIONS

- Free-form reflections are intentionally **excluded from `InsightEngine`**, so daily reflections
  appear in an item's timeline but do not move the insight cards yet. This preserves the §10
  "latest stage wins / one evaluation per purchase" invariant. Letting them feed insights needs a
  separate product decision (ordering + thresholds + tests).
- JSON export format is unchanged (`exportVersion = 1`); a free-form reflection is exported with
  `"stage": 0`. Making it explicit would be an export-format change.
- `HomeView` gained no new entry point; reflections are reached through Item Detail.

## BLOCKERS

- None. Local build/test verification is impossible on this host.

## VERIFICATION

- `git diff --check`: passes
- brace/paren balance spot-checked on every edited file
- CI #21: Debug PASS, XCTest PASS (50 tests, 0 failures), Release PASS, unsigned IPA PASS
- the 6 new tests all executed on CI, so the ad-hoc stage-isolation and insight-exclusion
  behaviour is runtime-verified; the UI changes themselves are not covered by tests

## COMMIT

- SHA: `333c812c32f9dee45bdb07565b93d33ed49a909b`
- message: `feat: allow any-day reflections and past purchase dates`

## PUSH

- success (single push, no force)

## ARTIFACTS

- bundle: not produced (push available)
- full-source ZIP: not produced (push available)

## NEXT

- Runtime QA (Iteration 08): date picker in the Add flow, repeated same-day reflections, the
  Item Detail timeline with mixed staged and free-form entries, and the category question layout.
- Product decision still open: whether free-form reflections should feed `InsightEngine`
  (would need an ordering rule, thresholds and tests).

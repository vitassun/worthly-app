# LAST CODEX REPORT

## RESULT

PASS — CI run #19 green on a022489

## BASELINE

- expected SHA: `7869d0b` (working tree started clean on `main`)
- actual SHA: `7869d0b` (matched before editing; uncommitted work only)

## BUILD

- Debug: PASS — GitHub Actions "iOS Build and Tests" #19 (not local)
- XCTest: PASS (44 tests, 0 failures) — GitHub Actions "iOS Build and Tests" #19 (not local)
- Release: PASS — GitHub Actions "iOS Build and Tests" #19 (not local)
- Unsigned IPA: PASS — GitHub Actions "iOS Build and Tests" #19 (not local)

## CHANGES

- `Worthly/Features/AddItem/AddItemView.swift`
  - `save()` no longer uses `try? modelContext.save()`. Wrapped in `do/catch`; on success it reschedules reminders (only when `alreadyBought`) and dismisses, on failure it calls `modelContext.rollback()` (removing the inserted item), does not reschedule, does not dismiss, and surfaces the error.
  - Added `@State private var operationError: String?` and the standard `.alert("保存失败", …)` block copied from `ItemDetailView`.
  - `sourceNote` is now stored trimmed (`trimmedSourceNote`, nil when empty) instead of the raw string.
- `Worthly/Features/ItemDetail/EditItemView.swift`
  - `save()` wrapped in `do/catch` with the same success/failure contract (rollback reverts the in-place mutations on `item`). Added the `operationError` state and alert.
  - `sourceNote` now stored trimmed (nil when empty).
  - Added computed `categoryOptions` that appends `item.category` (trimmed, non-empty) when it is not already in the fixed `categories` list; the category `Picker` now uses `categoryOptions`, so a record with a legacy/unknown category keeps a matching tag.
  - `DatePicker("购买日期", …)` is now bounded by `in: ...Date.now`; init clamps with `min(item.purchaseDate ?? .now, .now)`.
  - `category` state is initialised from the trimmed `item.category` (fallback 其他) so the Picker selection always matches a tag in `categoryOptions`.
- `Worthly/Features/ItemDetail/PurchaseDecisionView.swift`
  - `confirm()` wrapped in `do/catch` with the same contract. Added the `operationError` state and alert.
  - `DatePicker("购买日期", …)` bounded by `in: ...Date.now`; init clamps with `min(item.purchaseDate ?? .now, .now)`.
- `Worthly/Features/CheckIn/CheckInView.swift`
  - `save()` wrapped in `do/catch` with the same contract (rollback removes the inserted `CheckIn`). Added the `operationError` state and a second alert alongside the existing duplicate-detected alert.
- `Worthly/Core/Services/CheckInReminderService.swift`
  - `reschedule(for:)` now also removes *delivered* notifications for stages where `CheckInSchedule.isCompleted(stage, for: item)` is true, so a finished check-in's delivered banner does not linger. Only the given item's identifiers are touched; no other Worthly reminders are affected.

## TARGET MEMBERSHIP

- app sources: unchanged — no file added or removed; only existing app-target sources edited
- test sources: unchanged — no test file added or edited

## SCHEMA

- unchanged — no `WorthlyItem` / `CheckIn` field added or removed, no migration, no `InsightEngine` change

## DEVIATIONS

- None.

## BLOCKERS

- No macOS/Xcode host: Debug, XCTest, and Release could not be run locally. GitHub Actions must confirm the three gates.

## COMMIT

- SHA: `a022489b9797e37867473c7ab0611fa83dbfa9df`
- message: `fix: surface save failures and guard purchase dates`

## PUSH

- success

## ARTIFACTS

- bundle: not produced
- full-source ZIP: not produced

## NEXT

- Run the required GitHub Actions gates (Debug simulator build, XCTest, Release simulator build) to verify these fixes.
- The delivered change is bug-fix only: no new files, no schema change, no architecture change.
- No new tests cover these view-layer fixes; verify save-failure alert and purchase-date limit manually during Iteration 08 runtime QA.

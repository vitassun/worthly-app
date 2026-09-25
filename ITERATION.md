# Worthly Iteration 01 — Decide & Edit

This package is a **delta on top of Iteration 00**.

## Goal

Turn a saved “considering” record into a usable decision object.

### Included

- edit an existing record
- mark a considering item as **Bought**
- mark a considering item as **Passed / 没买**
- record purchase date
- validate optional price input instead of silently treating invalid text as empty
- preserve the existing editorial visual system
- store a decision timestamp

### Explicitly not included yet

- 7 / 30 / 90 day check-in workflow
- notifications
- delete/archive UI
- insights calculations
- image import
- share extension

## Acceptance criteria

1. Existing Iteration 00 project still opens with scheme `Worthly`.
2. All new Swift files are added to the Worthly app target.
3. A user can create a considering item and then mark it bought or passed from detail.
4. Bought flow supports optional final paid price and purchase date.
5. Invalid non-empty price text blocks save and shows a concise inline message.
6. Edit allows changes to name/category/reason/desire/usage/note/original price, plus paid price/date for bought items.
7. No new external dependency.
8. iOS 17+ / SwiftUI / SwiftData remains unchanged.

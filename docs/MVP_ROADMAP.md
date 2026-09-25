# Worthly — MVP Roadmap

## Iteration 00 — Foundation

Goal:
Lock product architecture and create a SwiftUI shell.

Delivered:
- docs + design system
- SwiftData models
- 4-tab shell
- add-item flow
- Things list
- item detail baseline
- CI workflow baseline

Implementation status:
- commit exists in Codex workspace
- actual Simulator build still unverified because available Codex environment lacked Xcode

## Iteration 01 — Decide & Edit

Goal:
Make `consider → buy/pass` usable.

Delivered:
- edit item
- mark bought
- mark passed
- optional paid price + purchase date
- inline price validation
- decision timestamp

Implementation status:
- commit `fa911b7e9dbd4419485d514ba1dada7e3710a076`
- static verification passed
- Simulator build still unverified

## Iteration 02 — Revisit / Check-ins (current)

Goal:
Complete `buy → revisit` and create the first real retention loop.

Deliverables:
- 7 / 30 / 90-day due calculation
- sequential overdue handling
- due-review Home section
- check-in form
- satisfaction + usage history
- item-detail review timeline
- opt-in local notifications
- reminder rescheduling after purchase-date edits

Exit criteria:
- check-in code is in target membership
- one stage cannot be duplicated
- overdue stages are sequential
- in-app due queue works without notification permission
- notification denial is non-blocking
- build passes on a real macOS/Xcode runner before the app is treated as TestFlight-ready

## Iteration 03 — First useful insights

Goal:
Turn check-in history into clear personal value.

Planned:
- expectation vs reality
- discount effect
- category patterns
- best / worst long-term purchases
- sparse-data states
- no AI chat; insights must come from recorded data

## Iteration 04 — Retention & polish

Goal:
Prepare for TestFlight.

Planned:
- first-run onboarding
- data export / delete
- accessibility pass
- localization structure
- notification deep-link polish
- crash / empty-state polish
- StoreKit subscription scaffold

## Later, only after validation

- share extension
- iCloud sync
- resale / effective ownership cost
- annual report
- richer ingestion / screenshot extraction

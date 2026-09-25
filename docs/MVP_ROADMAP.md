# Worthly — MVP Roadmap

## Iteration 00 — Foundation (this package)

Goal:
Lock product architecture and create a buildable SwiftUI shell.

Deliverables:
- docs
- models
- 4-tab shell
- add-item flow
- basic Things list
- basic item detail
- placeholder Insights / Settings
- CI build workflow

Exit criteria:
- Xcode project builds for iOS Simulator
- app launches to Home
- user can add an item locally
- item appears in Things
- no external service required

## Iteration 01 — Core decision loop

Goal:
Make “consider → buy/pass” usable.

Deliverables:
- edit item
- mark bought
- mark passed
- proper price display
- basic item timeline
- input validation
- first-run onboarding

## Iteration 02 — Check-ins

Goal:
Complete “buy → revisit”.

Deliverables:
- 7 / 30 / 90-day due calculation
- local notifications
- check-in screen
- satisfaction history
- due-review Home section

## Iteration 03 — First real insights

Goal:
Make accumulated data feel valuable.

Deliverables:
- expectation vs reality
- discount effect
- category comparison
- best / worst purchase summaries
- sparse-data states

## Iteration 04 — Retention & polish

Goal:
Prepare for TestFlight.

Deliverables:
- data export / delete
- accessibility pass
- localization structure
- onboarding refinement
- crash / empty-state polish
- StoreKit subscription scaffold (not necessarily enabled)

## Later, only after validation

- share extension
- iCloud sync
- resale / effective ownership cost
- annual report
- richer ingestion / screenshot extraction

---

## Iteration 01 — Decide & Edit

Status: package prepared

Scope:
- edit existing record
- considering → bought
- considering → passed
- optional paid price + purchase date
- inline price validation
- decision timestamp

Next planned iteration after this passes:
- real 7-day check-in flow
- due-review calculation on Home
- first useful post-purchase satisfaction record

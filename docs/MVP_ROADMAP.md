# Worthly — MVP Roadmap

## Current release candidate — v0.2.0

The user authorized a bounded experience/bug-fix release after the delivered any-day reflections
batch, alongside a promo video based on the updated implementation. Version is `0.2.0` (build `2`).

Delivered changes: correct/delete existing reflections, complete Home review/decision queues,
calendar-day staged eligibility, safe queued reminder invalidation, stale-notification routing,
keyboard/form accessibility improvements, and accurate sparse-data/passed-decision copy.
Schema, local-first storage, staged insight thresholds and the global Add ownership are unchanged.

See [v0.2.0 release notes](V0_2_0_RELEASE_NOTES.md) for exact behavior and verification limits.
The historical iteration entries below remain as implementation history; they do not authorize
monetization, archive semantics or other deferred features.

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

## Iteration 02 — Revisit / Check-ins

Goal:
Complete `buy → revisit` and create the first real retention loop.

Delivered:
- 7 / 30 / 90-day due calculation
- sequential overdue handling
- due-review Home section
- check-in form
- satisfaction + usage history
- item-detail review timeline
- opt-in local notifications
- reminder rescheduling after purchase-date edits

Implementation status:
- commit `e7c1bbd58b52c673864cb01082d04a90c791d489`
- static verification passed
- Simulator build still unverified

## Iteration 03 — First useful insights (current)

Goal:
Turn check-in history into clear personal value without over-reading sparse data.

Deliverables:
- local deterministic insight engine
- latest-check-in-per-item analytics
- first satisfaction snapshot after 3 evaluated purchases
- desire vs later satisfaction
- 30+ day discount pattern with minimum group sizes
- 30+ day category pattern with minimum category size
- long-term highest / lowest purchase memory
- sparse-data states and confidence copy
- Home insight teaser that switches to the Insights tab

Exit criteria:
- sample thresholds match `ITERATION.md`
- one item contributes at most one current analytic sample
- no AI / network inference is used
- no NaN / Infinity / empty metrics appear
- Home insight teaser changes selected root tab rather than pushing a duplicate screen
- build passes on a real macOS/Xcode runner before TestFlight readiness

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

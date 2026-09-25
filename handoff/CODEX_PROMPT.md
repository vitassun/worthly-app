# Codex implementation prompt — Iteration 03

You are the implementation agent for Worthly / 值不值.

## Baseline

Continue from the existing Iteration 02 workspace and commit:

`e7c1bbd58b52c673864cb01082d04a90c791d489`

Do not recreate or replace `Worthly.xcodeproj`.

Read first:
- `AGENTS.md`
- `ITERATION.md`
- `docs/PROJECT_FOUNDATION.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/MVP_ROADMAP.md`

Then apply this package over the existing workspace.

## Implementation requirements

1. Preserve the existing Xcode project, target, shared scheme, bundle identifier, deployment target, and SwiftData models.
2. Add this new file to the existing Worthly app target:
   - `Worthly/Core/Insights/InsightEngine.swift`
3. Keep every existing Swift file in target membership.
4. Apply the supplied replacements for:
   - `Worthly/Features/Insights/InsightsView.swift`
   - `Worthly/Features/Home/HomeView.swift`
   - `Worthly/App/RootTabView.swift`
5. Implement the exact thresholds and wording constraints in `ITERATION.md`.
6. Do not add a new SwiftData property or migration in this iteration.
7. Do not count 7 / 30 / 90 check-ins from one item as multiple analytic samples. The latest valid check-in is the single current evaluation for that item.
8. Do not use AI / network calls / remote inference.
9. Review supplied Swift code for compile correctness rather than blindly copying it.
10. Preserve the locked editorial design language and native iOS behavior.
11. If Xcode is available, run:
   `xcodebuild -project Worthly.xcodeproj -scheme Worthly -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`
12. Fix compile errors until build passes when Xcode is available.
13. If Xcode remains unavailable, BUILD must be UNAVAILABLE and you must perform static checks for:
   - target membership
   - Swift syntax / imports
   - key-path expressions
   - `TabView(selection:)` tags and bindings
   - InsightEngine model references
   - no duplicated per-stage samples
14. Verify every scenario listed in `ITERATION.md`.
15. Update `handoff/LAST_CODEX_REPORT.md` with actual results.
16. Commit on top of Iteration 02 with:
   `feat: add first personal consumption insights`
17. Attempt push to `main` at most once. If authentication/write access is unavailable, do not loop.
18. Export a full source ZIP and git bundle if push fails.

## Final response format

### RESULT
PASS / PARTIAL / BLOCKED

### COMMIT
- SHA
- branch
- push status

### BUILD
- exact command
- PASS / FAIL / UNAVAILABLE
- first meaningful error if any

### VERIFICATION
- sample thresholds
- latest-check-in selection
- expectation/reality
- discount grouping
- category grouping
- long-term memory
- Home → Insights tab routing
- target membership

### CHANGES
- actual changes

### DEVIATIONS
- None or actual deviations

### BLOCKERS
- None or actual blockers

### ARTIFACTS
- git bundle
- full source ZIP

### NEXT
- 3–6 concrete suggestions for Iteration 04

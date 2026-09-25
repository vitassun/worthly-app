# Codex implementation prompt — Iteration 02

You are the implementation agent for Worthly / 值不值.

## Baseline

Continue from the existing Iteration 01 workspace and commit:

`fa911b7e9dbd4419485d514ba1dada7e3710a076`

Do not recreate or replace `Worthly.xcodeproj`.

Read first:
- `AGENTS.md`
- `ITERATION.md`
- `docs/PROJECT_FOUNDATION.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/MVP_ROADMAP.md`

Then apply this package over the existing workspace.

## Implementation requirements

1. Preserve the existing Xcode project, target, scheme, bundle identifier, and deployment target.
2. Add these new files to the existing Worthly app target:
   - `Worthly/Core/Utilities/CheckInSchedule.swift`
   - `Worthly/Core/Services/CheckInReminderService.swift`
3. Keep every existing Swift file in target membership.
4. Implement the exact Iteration 02 behavior in `ITERATION.md`.
5. Review the supplied Swift changes rather than blindly copying if a compile issue is evident.
6. Do not change the locked information architecture or editorial design language.
7. Do not add third-party dependencies.
8. Local notifications must use `UserNotifications` only and remain opt-in.
9. If the environment has Xcode, run:
   `xcodebuild -project Worthly.xcodeproj -scheme Worthly -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`
10. Fix compile errors until build passes when Xcode is available.
11. If Xcode is unavailable, report BUILD as UNAVAILABLE and perform static checks for:
   - project.pbxproj membership
   - imports
   - SwiftData model references
   - navigation destinations
   - UserNotifications references
12. Update `handoff/LAST_CODEX_REPORT.md` with actual results.
13. Commit on top of Iteration 01 with:
   `feat: add post-purchase check-ins and reminders`
14. Attempt push to `main` at most once. If authentication/write access is unavailable, do not loop.
15. Export a full source ZIP and git bundle if push fails.

## Required verification

Report explicit checks for:
- 7 / 30 / 90 due-date logic
- sequential overdue behavior
- duplicate prevention
- Home due-review routing
- check-in persistence relationship
- item-detail history
- reminder permission denial path
- reminder rescheduling after purchase-date edit

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
- due schedule
- persistence
- navigation
- duplicate protection
- notifications
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
- 3–6 concrete suggestions for Iteration 03

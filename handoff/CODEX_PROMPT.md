# Codex handoff — Iteration 00

Paste the following prompt into Codex with repository **vitassun/worthly-app** selected.

---

You are the implementation agent for the iOS app **Worthly / 值不值** in repository `vitassun/worthly-app`.

I will provide/upload a package named `worthly-iteration-00-foundation.zip`. Treat the package contents as the authoritative product/design baseline for this iteration.

## Goal

Import the package into the repository, create a valid native iOS Xcode project around the supplied Swift source, build it, fix implementation-level compile issues, then commit and push to `main`.

## Rules

1. Preserve the product architecture and design decisions in:
   - `docs/PROJECT_FOUNDATION.md`
   - `docs/DESIGN_SYSTEM.md`
   - `docs/MVP_ROADMAP.md`
2. Native iOS only: **SwiftUI + SwiftData**, iOS 17+.
3. Do not add React Native, Flutter, backend services, AI chat, analytics SDKs, auth, or third-party UI libraries.
4. Do not redesign the app or expand scope beyond Iteration 00.
5. Never commit secrets, signing certificates, provisioning profiles, `.p8`, `.p12`, or API keys.
6. Keep GitHub Actions using a standard macOS runner.
7. Do not require paid Apple signing for CI; simulator build must use `CODE_SIGNING_ALLOWED=NO`.
8. If an included Swift source has a compile error, make the smallest reasonable fix while preserving intent.
9. Prefer a clean Xcode project with scheme name `Worthly` and bundle identifier `com.vitassun.worthly` (change only if repository constraints require it).
10. Do not wait for approval between normal implementation steps. Stop only for a hard blocker that cannot be resolved without changing product scope or exposing secrets.

## Required work

- Copy package files into repo root, preserving paths.
- Create `Worthly.xcodeproj` and a shared scheme `Worthly`.
- Add all Swift sources under `Worthly/` to the app target.
- Set deployment target iOS 17.0 or later.
- Ensure generated Info.plist settings are sufficient for the current shell.
- Run an iOS Simulator build with `xcodebuild`.
- Fix compile failures until the simulator build passes, if possible.
- Review `.github/workflows/ios-build.yml` and adjust only if needed for the generated project.
- Before committing, create/update `handoff/LAST_CODEX_REPORT.md` using the report format in `AGENTS.md`. The report must reflect the actual build result and deviations.
- Commit all changes with a concise commit message.
- Push to `main`.

## Acceptance criteria

- repository contains the docs and source structure from the package
- `Worthly.xcodeproj` exists
- scheme `Worthly` exists and is shared
- project builds for generic iOS Simulator without signing
- app root uses 4 tabs: 首页 / 记录 / 洞察 / 我的
- Add Item flow persists an item through SwiftData
- original price is optional
- paid price is optional and shown for bought items
- editorial palette remains:
  - `#EFEAE0`
  - `#E5DFD2`
  - `#1A1A1A`
  - `#5C5852`
  - `#CD6F47`
- no gradients / glassmorphism / decorative shadows / multi-color category system

## Final response format — IMPORTANT

Return a compact handoff for the planning/review agent in exactly these sections:

### RESULT
`PASS` / `PARTIAL` / `BLOCKED`

### COMMIT
- commit SHA
- branch
- push status

### BUILD
- exact build command
- PASS/FAIL
- if failed: first meaningful error and what remains

### CHANGES
- files/directories added
- notable fixes made to supplied code

### DEVIATIONS
- anything changed from the supplied architecture/design, with reason
- write `None` if none

### BLOCKERS
- unresolved blockers
- write `None` if none

### NEXT
- 3–6 concrete recommendations for Iteration 01

Also ensure the same substantive handoff is persisted in `handoff/LAST_CODEX_REPORT.md` inside the repository (commit SHA itself may be omitted from that file).

Do not give a long narrative. The next agent will verify the repository directly.

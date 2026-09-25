# Worthly implementation rules

This repository uses a planner/reviewer → Codex implementor loop.

Before changing product behavior or UI, read:
- `docs/PROJECT_FOUNDATION.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/MVP_ROADMAP.md`

## Non-negotiable baseline

- Native iOS: SwiftUI + SwiftData.
- iOS 17+ unless a later project decision explicitly changes it.
- Preserve the editorial visual language: warm cream, serif-led display type, one orange accent, large whitespace.
- No gradients, glassmorphism, decorative shadows, rainbow category colors, or marketing emoji.
- Keep interactions native and accessible.
- Do not add backend services, AI chat, auth, analytics SDKs, or third-party UI libraries unless the current iteration explicitly asks for them.
- Never commit secrets, Apple signing credentials, provisioning profiles, `.p8`, `.p12`, or API keys.

## Implementation behavior

- Make the smallest change that satisfies the current iteration.
- Build/test before push when the environment permits it.
- Do not silently rewrite product architecture.
- If a deviation is unavoidable, document it in `handoff/LAST_CODEX_REPORT.md`.
- Update `handoff/LAST_CODEX_REPORT.md` at the end of every implementation run.

## Handoff report

Use:

```text
# LAST CODEX REPORT

## RESULT
PASS / PARTIAL / BLOCKED

## BUILD
- command:
- result:
- first meaningful failure, if any:

## CHANGES
- ...

## DEVIATIONS
- None / ...

## BLOCKERS
- None / ...

## NEXT
- ...
```

The planning/review agent will verify repository state directly and prepare the next iteration.

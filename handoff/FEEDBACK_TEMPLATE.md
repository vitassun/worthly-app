# Worthly handoff protocol

The project uses a repeatable loop:

```text
ChatGPT planner/reviewer
        ↓ package + implementation prompt
Codex implementor
        ↓ commit + push + LAST_CODEX_REPORT.md
GitHub repository
        ↓ planner reads/verifies directly
ChatGPT planner/reviewer
        ↓ next iteration
...
```

## What the user needs to do

After Codex pushes, simply return to the planning conversation and say:

> `Codex 推完了，继续。`

The planning agent can read the repository and `handoff/LAST_CODEX_REPORT.md` through the GitHub connection. Pasting the Codex response is optional, though useful if Codex reports a UI-only warning not persisted to the repo.

## Codex report format

Codex must update `handoff/LAST_CODEX_REPORT.md` at the end of each implementation pass:

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

## Planner verification

On every return, the planning agent should:
1. read the latest report
2. inspect the actual latest repository state / commit
3. verify changed files instead of trusting the report alone
4. review product and design consistency
5. prepare the next bounded iteration package + Codex prompt

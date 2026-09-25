# Worthly / 值不值

**Worthly（值不值）** is an iOS-first personal consumption-memory app.

It helps users learn what is actually worth buying **for them** by closing the loop between desire, purchase, use, and later satisfaction.

> 想买 → 决定 → 买 / 不买 → 7 / 30 / 90 天回看 → 形成自己的消费判断

## MVP product promise

**Know what is actually worth buying for you.**

Worthly is not a budgeting ledger and not an AI chat app. It is a calm personal record of consumption decisions and their real outcomes.

## Current iteration

**Iteration 00 — Foundation**

This package locks:
- product definition
- information architecture
- MVP scope
- data model
- editorial iOS design system
- SwiftUI source skeleton
- GitHub Actions build workflow draft
- Codex handoff + feedback protocol

## Recommended stack

- SwiftUI
- SwiftData
- iOS 17+
- local-first MVP
- UserNotifications for 7 / 30 / 90-day check-ins
- StoreKit 2 later for subscription

## Main navigation

1. **首页 / Home** — what needs attention today
2. **记录 / Things** — all considering / bought / passed items
3. **洞察 / Insights** — what Worthly has learned
4. **我的 / Me** — settings, subscription, privacy
5. **Global Add** — fast capture flow

## Source tree

```text
Worthly/
├── App/
├── Core/
│   ├── DesignSystem/
│   ├── Models/
│   └── Utilities/
└── Features/
    ├── Home/
    ├── AddItem/
    ├── Things/
    ├── ItemDetail/
    ├── CheckIn/
    ├── Insights/
    └── Settings/
```

## Important

The Swift files in this package are the **first app skeleton**. The repository still needs an Xcode project file (`Worthly.xcodeproj`) created around them. The included Codex prompt instructs Codex to do that, build it on a macOS runner, fix compile issues, and push the result.

Read first:
- [`docs/PROJECT_FOUNDATION.md`](docs/PROJECT_FOUNDATION.md)
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)
- [`docs/MVP_ROADMAP.md`](docs/MVP_ROADMAP.md)
- [`handoff/CODEX_PROMPT.md`](handoff/CODEX_PROMPT.md)

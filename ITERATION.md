# Iteration 02 — Revisit / Check-ins

## Goal

Complete Worthly's first real product loop:

**want → buy → wait → revisit → record reality**

This iteration makes 7 / 30 / 90-day follow-up records real and visible.

## Scope

### Required
- due-date calculation from purchase date
- sequential 7 / 30 / 90-day stages
- one pending due review per purchased item at a time
- real check-in form
- satisfaction score 1–10
- usage-frequency answer
- optional short note
- duplicate-stage protection
- due-review section on Home
- completed check-in history on item detail
- local notification reminders, opt-in only
- reschedule reminders when purchase date changes

### Explicit behavior

- Only `bought` items can produce check-ins.
- Anchor date = `purchaseDate`, falling back to `decisionDate` only if needed.
- If a user misses a stage, Worthly asks for the oldest uncompleted stage first.
- A stage can be stored only once per item.
- Overdue reviews must remain visible in Home even when notifications are disabled/denied.
- Notification reminders are not marketing notifications.

## New source files

- `Worthly/Core/Utilities/CheckInSchedule.swift`
- `Worthly/Core/Services/CheckInReminderService.swift`

Both must be added to the existing Worthly app target.

## Modified source files

- `Worthly/Core/Models/CheckIn.swift`
- `Worthly/Features/CheckIn/CheckInView.swift`
- `Worthly/Features/Home/HomeView.swift`
- `Worthly/Features/ItemDetail/ItemDetailView.swift`
- `Worthly/Features/Settings/SettingsView.swift`
- `Worthly/Features/AddItem/AddItemView.swift`
- `Worthly/Features/ItemDetail/PurchaseDecisionView.swift`
- `Worthly/Features/ItemDetail/EditItemView.swift`

## Non-goals

Do not add in this iteration:
- AI-generated insights
- aggregate charts
- subscription/paywall
- CloudKit
- backend push notifications
- screenshot OCR
- account/auth

## Acceptance checks

At minimum verify statically; verify in Simulator when available:

1. A bought item purchased 8 days ago has a 7-day review due.
2. A bought item purchased 31 days ago with completed 7-day review has a 30-day review due.
3. A bought item purchased 100 days ago with no reviews shows only the 7-day review first.
4. Saving 7-day check-in removes that stage and reveals 30-day if already due.
5. A duplicate 7-day check-in cannot be created from the UI.
6. `passed` and `considering` items never enter the due-review queue.
7. Home due-review card navigates to the correct item + stage.
8. Item detail displays completed satisfaction records in stage order.
9. Reminders are opt-in and denial does not break the in-app due queue.
10. Editing purchase date reschedules pending local reminders when reminders are enabled.

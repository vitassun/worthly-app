# Worthly v0.2.0 — release candidate

Version: `0.2.0` · build: `2`.

This release improves the existing local consumption-memory loop. It adds no schema fields,
network service, account, archive action, subscription, or analytics SDK.

## Changes

- Saved 7 / 30 / 90-day check-ins and any-day reflections can be corrected or deleted from
  Item Detail → AFTER → `编辑回访`. Editing changes satisfaction, actual usage and optional note;
  identity, original creation date and stage remain unchanged. New feelings belong in a new
  `记录现在的感觉` reflection.
- Deleting a check-in requires confirmation. Other reviews remain. A deleted staged review
  becomes pending again, and insights recompute from the remaining staged history. Reminder
  cleanup and rescheduling affect only that item and only after the deletion saves successfully.
- Home still previews at most three cards per review section. When more are waiting,
  `查看全部 N 件待回访` and `查看全部 N 件待决定` open the complete queues. Both queues refresh
  on return to the foreground and at least once per minute while visible, as do Item Detail and
  the check-in form's due-state controls.
- Add, Edit, Buy and Check-in forms provide a keyboard `完成` button and interactive dismissal
  on scroll. Source notes can wrap. Expected usage uses a native menu, and the reason/actual-usage
  choices grow with Dynamic Type. Score values keep their full width.
- The JSON export sheet scrolls and supports both medium and large sizes. Notification
  authorization has visible progress and cannot be requested repeatedly while in flight;
  permission denial offers `打开系统设置`.
- Small labels and validation messages use readable theme foreground colors. Emphasis-card
  metadata no longer uses low-contrast orange on its light surface in dark mode. The locked
  light/dark palette and orange interaction accent remain unchanged.

## Bug fixes and semantics

- A 7 / 30 / 90-day review becomes available on its due **calendar day**, including the morning
  reminder, even when the recorded purchase anchor has an afternoon clock time. The stored
  anchor and `dueDate` value are unchanged. Stages remain sequential and `decisionDate` remains
  the fallback when `purchaseDate` is absent. Decision revisits retain their existing 7-day rule.
- Any-day reflections have no reminder side effects on creation, correction or deletion.
  They remain excluded from satisfaction insights and never complete a staged review.
- Queued notification additions use per-item/global invalidation tokens and are serialized.
  A stale addition is discarded or removed after opt-out, deletion or a replacement schedule.
- A delivered notification for a stage moved into the future opens Item Detail. Completed or
  non-current stages also open detail; they never open a disabled or duplicate check-in form.
- Notification routes wait while the global Add sheet, another notification sheet or onboarding
  is active, and retry after dismissal/completion. A model fetch retry rechecks those conditions.
- Passed-decision copy describes preserved memory without promising unimplemented profiling.
  Early-insight copy explains the actual requirement: staged reviews for three distinct purchases.
- Buy/Pass confirmation requires the item still to be considering, protecting an already changed
  lifecycle from a stale decision form.
- Editing an item's name or other details no longer silently rounds its stored price to two
  decimals. Currency display still formats normally; editing strings retain the original amount.

## Verification and limits

- Added 13 focused XCTest cases to the existing schedule, notification/deletion and price/export test files:
  morning due-day eligibility, the complete deterministic queue, future notification routes,
  reminder-generation invalidation, persisted staged/ad-hoc corrections, selective deletion,
  save-failure rollback, rejected invalid or unrelated edits, and price-edit precision round-trips.
- `CheckInRecordService.swift` is the only new app source and belongs to the Worthly app target.
  Existing test files remain solely in WorthlyTests. Persistent models and export version are unchanged.
- Local Xcode is unavailable on this Windows host. Static checks do not establish simulator
  or device behavior; the final handoff records the actual GitHub Actions build and test results.
- Physical-device notification, Dynamic Type, VoiceOver, and export-sheet checks remain on the
  candidate checklist. This release is available for audit without waiting for those checks.
